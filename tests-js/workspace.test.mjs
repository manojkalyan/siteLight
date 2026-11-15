import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {scienceApi} from '../scripts/science-api.mjs';
import {parseHTML} from 'linkedom';
import {catalog,defaultRequirements} from '../src/workspace/catalog.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
import {createProvider,evaluate,makeScenario,parseUtc,interpolateRows,intervals,nextSet,findAlternative,terrainScreen,explain,HOUR,DAY,STEP} from '../src/workspace/engine.mjs';
import {skyplot,horizonChart,escapeHtml} from '../src/workspace/charts.mjs';
import {coverage} from '../src/workspace/coverage.mjs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const bundle=JSON.parse(read('data/horizons/workspace-ephemeris.json'));
const html=read('lunar-workspace.html'),code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start=Date.UTC(2027,0,13),scn=makeScenario(catalog[0]);
const provider=fn=>({mode:'sample',covers:()=>true,horizon:()=>0,geometry:fn});
const good=()=>({sunAzimuth:20,sunElevation:5,earthAzimuth:110,earthElevation:6});

test('UTC validation rejects timezone ambiguity, calendar rollovers, and unsupported years',()=>{
 for(const date of ['2027-02-30T00:00:00Z','2027-01-01','2027-01-01T00:00:00+05:30','2026-12-31T00:00:00Z'])assert.throws(()=>parseUtc(date));
 assert.equal(parseUtc('2028-02-29T12:30:00Z'),Date.UTC(2028,1,29,12,30));
});
test('disjoint availability does not imply overlap; partial intervals have correct weights',()=>{
 const r=evaluate(scn,{...defaultRequirements,duration:48.25,minSun:.4,minEarth:.4,minOverlap:.1},provider(t=>({...good(),sunElevation:t<start+24*HOUR?5:-5,earthElevation:t<start+24*HOUR?-5:5})));
 assert.ok(Math.abs(r.sun-24)<1e-7);assert.ok(Math.abs(r.earth-24.25)<1e-7);assert.equal(r.overlap,0);assert.equal(r.status,'fail');
 assert.deepEqual(r.rules.filter(r=>!r.pass).map(r=>r.id),['overlap']);
});
test('darkness is distinct from falling below a chosen solar criterion',()=>{
 const r=evaluate(scn,defaultRequirements,provider(()=>({...good(),sunElevation:1})));
 assert.equal(r.longest.dark,0);assert.equal(r.longest.solar,168);assert.equal(r.sun,0);
});
test('Sun and Earth are checked at their own azimuth; equality with horizon remains blocked',()=>{
 const p={...provider(good),horizon:a=>a===20?5:0};const r=evaluate(scn,defaultRequirements,p);
 assert.equal(r.sun,0);assert.ok(Math.abs(r.earth-168)<1e-7);assert.equal(r.overlap,0);
});
test('gap requirements are opt-in and exact enabled boundaries pass',()=>{
 const p=provider(t=>({...good(),sunElevation:t<start+12*HOUR?-1:5}));
 const r=evaluate(scn,defaultRequirements,p);assert.equal(r.status,'pass');assert.doesNotMatch(explain(r),/falls short/);
 assert.equal(evaluate(scn,{...defaultRequirements,maxDark:12},p).status,'pass');
 assert.equal(evaluate(scn,{...defaultRequirements,maxDark:11.5},p).status,'fail');
});
test('unknown spans break intervals, prevent complete verdicts, and do not produce availability percentages',()=>{
 const records=[{time:start,lit:false},{time:start+HOUR,lit:null},{time:start+2*HOUR,lit:false}];
 const gaps=intervals(records,'lit',start,start+3*HOUR);assert.equal(gaps.length,2);assert.equal(gaps[0].unknownBoundary,true);assert.equal(gaps[1].rightBoundary,true);
 const r=evaluate(scn,defaultRequirements,provider(t=>t===start+HOUR?null:good()));assert.equal(r.status,'insufficient_data');assert.equal(r.fractions.sun,null);
});
test('sunset countdown preserves already-below, crossing brackets, and beyond-window states',()=>{
 const r=evaluate(scn,defaultRequirements,provider(t=>({...good(),sunElevation:t<start+6*HOUR?5:-1})));
 const e=nextSet(r,start+HOUR,'lit');assert.equal(e.status,'crossing');assert.equal(e.hours,5);assert.equal(Date.parse(e.bracketUtc[1])-Date.parse(e.bracketUtc[0]),STEP);
 assert.equal(nextSet(r,start+7*HOUR,'lit').status,'below');assert.equal(nextSet(r,start,'earth').status,'beyond_window');
});
test('azimuth interpolation handles north crossing and rejects temporal gaps',()=>{
 const rows=[[start,359,1,1,2],[start+STEP,1,3,359,4]];
 const g=interpolateRows(rows,start+STEP/2);assert.equal(g.sunAzimuth,0);assert.equal(g.earthAzimuth,0);assert.equal(g.sunElevation,2);
 assert.equal(interpolateRows([[...rows[0]],[start+2*STEP,1,3,359,4]],start+STEP),null);
});
test('real-data mode enforces exact point and complete time coverage',()=>{
 const p=createProvider('horizons',catalog[0],bundle);assert.ok(p.covers(start,start+168*HOUR));
 assert.equal(evaluate({...scn,date:'2027-01-31T00:00:00Z'},defaultRequirements,p).status,'insufficient_data');
 const custom=createProvider('horizons',{...catalog[0],lat:-80},bundle);assert.equal(evaluate(scn,defaultRequirements,custom).status,'insufficient_data');
 const r=evaluate(scn,defaultRequirements,p);assert.notEqual(r.status,'insufficient_data');assert.match(r.horizon,/real terrain not assessed/);
});
test('all pinned source records and SHA checksums reproduce the acquired Horizons responses',()=>{
 for(const site of catalog){
  const entry=bundle.sites[site.id];assert.equal(entry.records.length,4465);
  for(const source of entry.sources){
   const raw=read('data/horizons/'+source.filename);assert.equal(createHash('sha256').update(raw).digest('hex'),source.sha256);
   const text=JSON.parse(raw).result;assert.match(text,/DE441/);assert.match(text,/MEAN_ME \(high precision\)/);assert.match(text,/NO \(AIRLESS\)/);
   const lines=text.split('$$SOE')[1].split('$$EOE')[0].trim().split(/\r?\n/);
   for(const index of [0,143,2211,4464]){const row=lines[index].split(',').map(s=>s.trim());const stored=entry.records[index],k=source.target==='sun'?1:3;assert.equal(stored[k],Number(row[3]));assert.equal(stored[k+1],Number(row[4]));}
  }
  for(let i=1;i<entry.records.length;i++)assert.equal(entry.records[i][0]-entry.records[i-1][0],STEP);
 }
});
test('scenario changes preserve the other scenario and preview stays separate from its baseline',()=>{
 const w=createWorkspace(bundle),original=JSON.stringify(w.state.scenarios.B);w.setOffset(3);const baseline=w.state.scenarios.A.date;
 assert.equal(JSON.stringify(w.state.scenarios.B),original);assert.equal(w.state.scenarios.A.date,baseline);w.applyPreview();assert.equal(w.state.scenarios.A.offset,0);assert.equal(Date.parse(w.state.scenarios.A.date),Date.parse(baseline)+3*DAY);
 const before=JSON.stringify(w.state);assert.throws(()=>w.setCustom(100,0,0));assert.equal(JSON.stringify(w.state),before);
 assert.throws(()=>w.setCustom(-88,20,0),/Custom points/);w.setMode('sample');w.setCustom(-88,20,0);assert.notEqual(w.result().status,'insufficient_data');
});
test('alternative-date search re-evaluates every enabled requirement without mutating the scenario',()=>{
 const original=JSON.stringify(scn),settings={...defaultRequirements,minSun:1,minEarth:1,minOverlap:1};
 const found=findAlternative(scn,settings,provider(t=>({...good(),sunElevation:t<start+2*DAY?-1:5})));
 assert.equal(found.delta,2);assert.equal(found.result.status,'pass');assert.equal(JSON.stringify(scn),original);
 const missing={...provider(good),covers:()=>false};const no=findAlternative(scn,settings,missing);assert.equal(no.scenario,null);assert.equal(no.tested,0);assert.equal(no.unavailable,120);
});
test('terrain statistics reproduce a known plane and missing coverage cannot pass',()=>{
 const angle=10*Math.PI/180,h=(x,z)=>Math.tan(angle)*x;
 const t=terrainScreen(catalog[0],{limit:12},h);assert.ok(Math.abs(t.mean-10)<1e-8);assert.ok(t.roughness<1e-8);assert.equal(t.status,'pass');
 assert.equal(terrainScreen(catalog[0],{limit:9},h).status,'fail');assert.equal(terrainScreen(catalog[0],{limit:12,missing:true},h).status,'insufficient_data');
});
test('report keeps unassessed models, source conventions, original inputs, and NASA limits explicit',()=>{
 const w=createWorkspace(bundle),report=w.serialize();assert.equal(report.logistics,'not_evaluated');assert.equal(report.thermal,'not_evaluated');assert.match(report.convention,/apparent/);assert.equal(report.scenarios.A.sourceRecords.length,2);
 assert.ok(coverage.some(c=>c.id==='C10'&&c.status.includes('Partially')));assert.ok(coverage.some(c=>c.id==='C12'&&c.status.includes('Outside')));
});
test('standalone artifact preserves prior prototypes and contains no runtime module or CDN dependencies',()=>{
 assert.doesNotThrow(()=>new vm.Script(code));assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=|type="importmap"/);
 assert.match(html,/data:image\/jpeg;base64,/);assert.match(html,/Three.js MIT license/);
 const lineage=JSON.parse(read('docs/reference/workspace-lineage.json'));for(const [name,hash] of Object.entries(lineage.preserved))assert.equal(createHash('sha256').update(read(name)).digest('hex'),hash);
});

function boot({fetcher,protocol}={}){
 const {window,document}=parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
 Object.defineProperty(window.HTMLCanvasElement.prototype,'getContext',{value:()=>null,configurable:true});
 Object.defineProperty(window.HTMLInputElement.prototype,'checkValidity',{value(){if(this.getAttribute('type')==='text')return (!this.hasAttribute('required')||this.value!=='')&&(!this.hasAttribute('maxlength')||this.value.length<=Number(this.getAttribute('maxlength')));const date=this.getAttribute('type')==='datetime-local',parse=v=>date?Date.parse(v+'Z'):Number(v),min=this.getAttribute('min'),max=this.getAttribute('max'),v=parse(this.value);return this.value!==''&&Number.isFinite(v)&&(!min||v>=parse(min))&&(!max||v<=parse(max));},configurable:true});
 // LinkeDOM does not implement the writable select.value browser property.
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this.querySelector('option[selected]')?.getAttribute('value')||this.firstElementChild?.getAttribute('value')||'';},set(value){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.getAttribute('value')===value);},configurable:true});
 const context=vm.createContext({window,document,console:{warn(){},error(){}},matchMedia:()=>({matches:false,addEventListener(){}}),devicePixelRatio:1,performance:{now:()=>100},requestAnimationFrame(){},ResizeObserver:class{observe(){}},setTimeout(fn,ms){const timer=setTimeout(fn,ms);timer.unref();return timer;},clearTimeout,structuredClone,TextEncoder,Uint8Array,URL,Blob,crypto:globalThis.crypto});
 if(fetcher)context.fetch=fetcher;if(protocol)context.location={protocol};
 vm.runInContext(code,context,{timeout:20000});
 const api=window.SiteLightWorkspace;
 const locate=selector=>{let e=document.querySelector(selector);if(e)return e;
  const section=selector.includes('data-logistics')?'logistics':selector.includes('data-rescue')?'rescue':selector.includes('data-dust')?'thermal':selector.includes('data-plume')?'plume':selector.includes('data-radiation')?'radiation':null;
  if(section)api.setScreening(section);else if(['#landing','#duration','#offset','#custom-lat','#custom-lon','#custom-alt'].includes(selector))api.setProperty('scenario');else if(['#minSun','#minEarth','#minOverlap','#minElevation','#maxDark','#maxEarth'].includes(selector))api.setProperty('constraints');
  return document.querySelector(selector);
 };
 return {window,document,api,click(selector){let e=locate(selector);if(!e){const match=selector.match(/^\[data-view="([^"]+)"\]$/);if(match){api.setView(match[1]);return;}}assert.ok(e,selector);e.click();},change(selector,value){const e=locate(selector);assert.ok(e,selector);e.value=String(value);e.dispatchEvent(new window.Event('change',{bubbles:true}));}};
}
test('complete bundled application starts with reference design layout and accessible no-GPU fallback',()=>{
 const b=boot();assert.equal(b.api.state.mode,'real');assert.equal(b.api.state.view,'layout');assert.ok(b.document.querySelector('#viewport').classList.contains('graphics-unavailable'));
 assert.match(b.document.querySelector('#status-mode').textContent,/REAL NASA DEM/);assert.equal(b.document.querySelectorAll('.cmp-card').length,2);
});
test('loaded-start UI scans actual records, applies a rechecked boundary and hides stale requirement results',async()=>{
 const b=boot();b.click('[data-select="B"]');b.click('[data-site="real-nobile"]');await b.api.whenIdle();b.click('[data-view="calendar"]');
 const originalA=JSON.stringify(b.api.snapshot().scenarios.A),originalRequirements=JSON.stringify(b.api.state.requirements);
 b.click('[data-action="start-window-scan"]');assert.equal(b.document.querySelector('[data-action="start-window-scan"]').disabled,true);assert.equal(b.document.querySelector('#root').getAttribute('aria-busy'),'true');await b.api.whenIdle();
 const study=b.api.snapshot().landingStartWindows;assert.equal(study.tested,11953);assert.ok(study.nominalFits>0);const utc=study.nominalFitWindows[0].lastStartUtc;
 b.click('[data-start-window="'+utc+'"]');await b.api.whenIdle();assert.equal(b.api.state.scenarios.B.date,utc);assert.equal(b.api.state.scenarios.B.offset,0);assert.equal(b.api.snapshot().scenarios.B.result.status,'uncertain');
 assert.equal(JSON.stringify(b.api.snapshot().scenarios.A),originalA);assert.equal(JSON.stringify(b.api.state.requirements),originalRequirements);assert.equal(b.api.snapshot().landingStartWindows.tested,11953);
 b.click('[data-view="report"]');assert.match(b.document.querySelector('#start-window-report').textContent,/11953 tested/);
 b.api.state.requirements.minSun=.95;b.api.refresh();assert.equal(b.api.snapshot().landingStartWindows,null);assert.equal(b.document.querySelector('#start-window-report'),null);
 b.change('#data-mode','sample');await b.api.whenIdle();b.click('[data-view="calendar"]');assert.equal(b.document.querySelector('[data-action="start-window-scan"]').disabled,true);
});
test('real monthly calendar evaluates 84 starts and selecting a cell reproduces its exact scenario',async()=>{
 const server=await createServer({configFile:false,plugins:[scienceApi()],server:{host:'127.0.0.1',port:0}});await server.listen();
 try{const base='http://127.0.0.1:'+server.httpServer.address().port,b=boot({protocol:'http:',fetcher:(path,options)=>fetch(base+path,options)});await b.api.whenReady();b.click('[data-select="B"]');b.click('[data-view="calendar"]');b.click('[data-action="monthly-study"]');await b.api.whenIdle();
  assert.equal(b.document.querySelectorAll('[data-monthly-date]').length,84);const study=b.api.snapshot().monthlyRobustness;assert.equal(study.requested,84);assert.equal(study.data,undefined);
  b.click('[data-monthly-date="2033-12-01T00:00:00Z"]');await b.api.whenIdle();assert.equal(b.api.state.scenarios.B.date,'2033-12-01T00:00:00Z');assert.equal(JSON.stringify(b.api.snapshot().scenarios.B.result.fractions),JSON.stringify(study.cells.at(-1).result.fractions));
  b.api.setScreening('terrain');assert.equal(b.document.querySelector('.terrain-route-status').dataset.routeStatus,b.api.snapshot().scenarios.B.terrainSummary.route.status);b.api.setScreening('radiation');assert.match(b.document.querySelector('#content-screening').textContent,/sky geometry/);
 }finally{await server.close();}
});
test('custom preparation completion waits for the response and stale scenario selections cannot commit it',async()=>{
 const science=JSON.parse(read('data/science/real-workspace.json')),original=science.sites['real-shackleton'],site={...original.site,id:'custom-real-000000000000000000000001',custom:true};
 const point={schema:'sitelight-custom-point-1',frame:'MOON_ME',ephemeris:'DE421',correction:'NONE',preprocessingVersion:science.version,sourceAlgorithm:science.algorithm,start:science.interval.start,end:science.interval.end,request:{siteId:site.id,lat:site.lat,lon:site.lon,observerHeightM:site.observerHeightM},entry:{...original,site}};
 let release;const pending=new Promise(resolve=>{release=resolve;});
 const b=boot({protocol:'http:',fetcher:async path=>path.endsWith('/capabilities')?{ok:true,json:async()=>({schema:'sitelight-science-service-1',available:true})}:pending});await b.api.whenReady();
 b.api.setScreening('plume');const initialPlume=b.document.querySelector('[data-plume="enabled"]');initialPlume.checked=true;initialPlume.dispatchEvent(new b.window.Event('change',{bubbles:true}));assert.equal(b.api.state.plume.A.enabled,true);
 b.click('[data-action="custom"]');let finished=false;const idle=b.api.whenIdle().then(()=>{finished=true;});await Promise.resolve();assert.equal(finished,false);assert.equal(b.api.state.scenarios.A.site.custom,undefined);
 b.click('[data-property="resources"]');const toggle=b.document.querySelector('[data-logistics="enabled"]');assert.equal(toggle.disabled,true);toggle.checked=true;toggle.dispatchEvent(new b.window.Event('change',{bubbles:true}));assert.equal(b.api.state.logistics.enabled,false);
 b.api.setScreening('rescue');const rescueToggle=b.document.querySelector('[data-rescue="assetDeclared"]');assert.equal(rescueToggle.disabled,true);rescueToggle.checked=true;rescueToggle.dispatchEvent(new b.window.Event('change',{bubbles:true}));assert.equal(b.api.state.rescue.A.assetDeclared,false);
 b.api.setScreening('thermal');const dustToggle=b.document.querySelector('[data-dust="enabled"]');assert.equal(dustToggle.disabled,true);dustToggle.checked=true;dustToggle.dispatchEvent(new b.window.Event('change',{bubbles:true}));assert.equal(b.api.state.dust.A.enabled,false);
 b.api.setScreening('plume');const plumeToggle=b.document.querySelector('[data-plume="enabled"]');assert.equal(plumeToggle.disabled,true);plumeToggle.checked=false;plumeToggle.dispatchEvent(new b.window.Event('change',{bubbles:true}));assert.equal(b.api.state.plume.A.enabled,true);assert.equal(b.document.querySelector('[data-action="plume-add"]').disabled,true);b.click('[data-action="plume-add"]');assert.equal(b.api.state.plume.A.assets.length,2);
 b.api.setScreening('radiation');const radiationToggle=b.document.querySelector('[data-radiation="enabled"]');assert.equal(radiationToggle.disabled,true);radiationToggle.checked=true;radiationToggle.dispatchEvent(new b.window.Event('change',{bubbles:true}));assert.equal(b.api.state.radiation.A.enabled,false);
 b.api.select('B');release({ok:true,json:async()=>point});await idle;assert.equal(b.api.state.scenarios.B.site.id,'real-nobile');assert.match(b.document.querySelector('#toast').textContent,/Scenario changed/);
});
test('LCSS controls compute an exploratory budget, preserve environmental verdicts and export assumptions',()=>{
 const b=boot(),environment=JSON.stringify(b.api.snapshot().scenarios.A.result);b.click('[data-property="resources"]');
 const toggle=b.document.querySelector('[data-logistics="enabled"]');toggle.checked=true;toggle.dispatchEvent(new b.window.Event('change',{bubbles:true}));
 assert.match(b.document.querySelector('#content-screening').textContent,/21,670/);assert.equal(b.api.snapshot().logisticsExploration.acceptedForVerdict,false);
 assert.match(b.document.querySelector('.engineering-evidence').textContent,/0 of 20/);assert.ok(b.document.querySelector('a[href$="#page=72"]'));assert.equal(b.api.snapshot().logisticsExploration.results.A.engineering.references.length,2);
 b.click('[data-action="logistics-flip"]');assert.match(b.document.querySelector('#logistics-proposal').textContent,/1.5 wt%/);
 b.change('[data-logistics="ice"]',6);assert.match(b.document.querySelector('#content-screening').textContent,/11,990/);assert.equal(b.api.snapshot().logisticsExploration.results.A.iceWtPercent,6);assert.equal(b.api.snapshot().logisticsExploration.results.B.iceWtPercent,1);
 assert.equal(JSON.stringify(b.api.snapshot().scenarios.A.result),environment);
 b.change('[data-logistics="budgetKg"]',1);b.click('[data-action="logistics-flip"]');assert.match(b.document.querySelector('#logistics-proposal').textContent,/No budget fit/);
});

test('conditional rescue UI uses real routes, preserves A/B and environment, rejects bad input and re-declares changed incident scope',async()=>{
 const b=boot();b.click('[data-site="real-connector"]');await b.api.whenIdle();b.api.setScreening('rescue');const environment=JSON.stringify(b.api.snapshot().scenarios.A.result);
 const toggle=(key,checked)=>{const el=b.document.querySelector(`[data-rescue="${key}"]`);assert.ok(el);el.checked=checked;el.dispatchEvent(new b.window.Event('change',{bubbles:true}));};
 assert.match(b.document.querySelector('#rescue-planning .rescue-result').textContent,/Not evaluated/);
 toggle('assetDeclared',true);assert.match(b.document.querySelector('#rescue-planning .rescue-result').textContent,/Asset assumed unavailable/);toggle('available',true);
 const r=b.api.snapshot().rescueExploration.results.A;assert.equal(r.status,'conditional_fit');assert.match(r.route.classification,/REAL/);assert.ok(r.route.path.length>1);assert.equal(r.asset.declaredForCurrentScenario,true);assert.equal(r.acceptedForVerdict,false);
 b.change('[data-rescue="deadlineMin"]',1);assert.match(b.document.querySelector('#rescue-planning .rescue-result').textContent,/limit exceeded/);assert.equal(b.api.snapshot().rescueExploration.results.A.status,'conditional_shortfall');
 b.change('[data-rescue="outboundMps"]',0);assert.equal(b.api.state.rescue.A.outboundMps,.5);assert.match(b.document.querySelector('#toast').textContent,/valid rescue/);
 assert.equal(JSON.stringify(b.api.snapshot().scenarios.A.result),environment);assert.equal(b.api.state.rescue.B.assetDeclared,false);
 b.click('[data-select="B"]');assert.match(b.document.querySelector('#rescue-planning .rescue-result').textContent,/Not evaluated/);b.click('[data-select="A"]');
 b.click('[data-view="report"]');assert.match(b.document.querySelector('#content-report').textContent,/Conditional rescue assumptions/);
 b.click('[data-view="screening"]');b.change('#route-direction','-X');assert.equal(b.api.snapshot().rescueExploration.results.A.route.direction,'-X');
 b.click('[data-view="calendar"]');b.click('[data-calendar="1"]');await b.api.whenIdle();b.click('[data-view="screening"]');assert.equal(b.api.snapshot().rescueExploration.results.A.status,'not_evaluated');assert.equal(b.document.querySelector('[data-rescue="assetDeclared"]').hasAttribute('checked'),false);
 toggle('assetDeclared',true);assert.equal(b.api.snapshot().rescueExploration.results.A.asset.declaredForCurrentScenario,true);
});

test('dust UI compares lab presets and custom optics, preserves A/B and source observations, and reports model limits',()=>{
 const b=boot(),before=b.api.snapshot(),environment=JSON.stringify(before.scenarios.A.result),thermal=JSON.stringify(before.scenarios.A.thermalContext);b.api.setScreening('thermal');
 assert.equal(b.document.querySelector('[data-thermal-readout="clean"]').textContent,'—');
 const toggle=b.document.querySelector('[data-dust="enabled"]');toggle.checked=true;toggle.dispatchEvent(new b.window.Event('change',{bubbles:true}));
 assert.match(b.document.querySelector('#dust-planning').textContent,/not conservative/);assert.ok(b.document.querySelector('#dust-planning svg[role="img"]'));
 let r=b.api.snapshot().dustExploration.results.A;assert.equal(r.status,'exploratory');assert.equal(r.dustEndmember.alpha,.75);assert.ok(r.deltaTemperatureK>0);assert.equal(r.acceptedForVerdict,false);assert.equal(r.propertyEvidence.siteMeasurementApplied,false);
 b.change('[data-dust="coveragePercent"]',0);assert.equal(b.api.snapshot().dustExploration.results.A.deltaTemperatureK,0);
 b.change('[data-dust="material"]','nulht2m');assert.equal(b.api.snapshot().dustExploration.results.A.dustEndmember.epsilon,.78);
 b.change('[data-dust="material"]','custom');assert.ok(b.document.querySelector('[data-dust="dustEpsilon"]'));b.change('[data-dust="incidentSolarWm2"]',0);b.change('[data-dust="cleanEpsilon"]',.5);b.change('[data-dust="dustEpsilon"]',1);b.change('[data-dust="coveragePercent"]',100);
 r=b.api.snapshot().dustExploration.results.A;assert.ok(r.deltaTemperatureK<0);b.change('[data-dust="areaM2"]',0);assert.equal(b.api.state.dust.A.areaM2,1);assert.match(b.document.querySelector('#toast').textContent,/valid dust/);
 assert.equal(JSON.stringify(b.api.snapshot().scenarios.A.result),environment);assert.equal(JSON.stringify(b.api.snapshot().scenarios.A.thermalContext),thermal);
 b.click('[data-select="B"]');assert.equal(b.api.snapshot().dustExploration.results.B.status,'not_evaluated');assert.equal(b.document.querySelector('[data-thermal-readout="clean"]').textContent,'—');b.click('[data-select="A"]');assert.equal(b.api.state.dust.A.material,'custom');
 b.click('[data-view="report"]');assert.match(b.document.querySelector('#content-report').textContent,/Dust & radiator assumption comparison/);assert.match(b.document.querySelector('#content-report').textContent,/Layer|conduction/);
});

test('ejecta UI edits hypothetical release/assets, rejects invalid values, isolates A/B and includes source-qualified reports',()=>{
 const b=boot(),environment=JSON.stringify(b.api.snapshot().scenarios.A.result);b.api.setScreening('plume');assert.match(b.document.querySelector('#plume-planning .plume-result').textContent,/Not evaluated/);
 const checkbox=b.document.querySelector('[data-plume="enabled"]');checkbox.checked=true;checkbox.dispatchEvent(new b.window.Event('change',{bubbles:true}));
 assert.ok(b.document.querySelector('#plume-planning svg[role="img"]'));b.change('[data-plume-asset="asset-1"][data-plume-field="heightM"]',100);
 const report=b.api.snapshot().plumeExploration;assert.equal(report.results.A.status,'exploratory');assert.equal(report.results.A.assets[0].status,'intersects_assumed_envelope');assert.equal(report.acceptedForVerdict,false);assert.equal(report.results.A.engineErosion,'not_evaluated');assert.equal(report.results.A.terrainApplied,false);
 b.change('[data-plume-asset="asset-1"][data-plume-field="name"]','<script>asset</script>');assert.equal(b.document.querySelectorAll('#plume-planning script').length,0);assert.match(b.document.querySelector('#plume-planning').textContent,/<script>asset/);
 b.change('[data-plume="speedMps"]',0);assert.equal(b.api.state.plume.A.speedMps,100);assert.match(b.document.querySelector('#toast').textContent,/valid ejecta/);
 b.click('[data-action="plume-add"]');assert.equal(b.api.state.plume.A.assets.length,3);b.click('[data-action="plume-remove"][data-asset-id="asset-3"]');assert.equal(b.api.state.plume.A.assets.length,2);
 b.click('[data-select="B"]');assert.equal(b.api.snapshot().plumeExploration.results.B.status,'not_evaluated');assert.notEqual(b.api.state.plume.B.assets[0].name,'<script>asset</script>');b.click('[data-select="A"]');
 assert.equal(JSON.stringify(b.api.snapshot().scenarios.A.result),environment);b.click('[data-view="report"]');assert.match(b.document.querySelector('#content-report').textContent,/Conditional plume\/ejecta assumptions/);assert.match(b.document.querySelector('#content-report').textContent,/single-grain kinetic energy|single-grain/);
});

test('radiation UI keeps archived silicon observations and NIST proton calculations independent with A/B reports',()=>{
 const b=boot(),before=b.api.snapshot(),environment=JSON.stringify(before.scenarios.A.result),thermal=JSON.stringify(before.scenarios.A.thermalContext);b.api.setScreening('radiation');assert.match(b.document.querySelector('#radiation-planning .radiation-result').textContent,/Not evaluated/);
 const enable=b.document.querySelector('[data-radiation="enabled"]');enable.checked=true;enable.dispatchEvent(new b.window.Event('change',{bubbles:true}));
 let r=b.api.snapshot().radiationExploration.results.A;assert.equal(r.orbitalObservations.qualifyingDays,31);assert.equal(r.protonComparison.incidentCsdaRangeGcm2,10.01);assert.ok(b.document.querySelectorAll('#radiation-planning svg[role="img"]').length===2);
 const proton=JSON.stringify(r.protonComparison);const correction=b.document.querySelector('[data-radiation="corrected"]');correction.checked=true;correction.dispatchEvent(new b.window.Event('change',{bubbles:true}));r=b.api.snapshot().radiationExploration.results.A;assert.equal(r.orbitalObservations.records.at(-1).sourceValueMgySiDay,.15486);assert.equal(JSON.stringify(r.protonComparison),proton);
 b.change('[data-radiation="archiveMonth"]','2012-03');assert.match(b.document.querySelector('#radiation-planning').textContent,/AB/);b.change('[data-radiation="arealDensityGcm2"]',10.01);r=b.api.snapshot().radiationExploration.results.A;assert.equal(r.protonComparison.status,'csda_range_exhausted');assert.equal(r.effectiveDose,'not_evaluated');assert.match(b.document.querySelector('#radiation-planning').textContent,/does not imply zero radiation dose/);
 b.change('[data-radiation="areaM2"]',0);assert.equal(b.api.state.radiation.A.areaM2,10);assert.match(b.document.querySelector('#toast').textContent,/valid proton/);b.change('[data-radiation="material"]','water');assert.equal(b.api.snapshot().radiationExploration.results.A.protonComparison.name,'Water, liquid');
 assert.equal(JSON.stringify(b.api.snapshot().scenarios.A.result),environment);assert.equal(JSON.stringify(b.api.snapshot().scenarios.A.thermalContext),thermal);assert.equal(b.api.snapshot().radiationExploration.acceptedForVerdict,false);
 b.click('[data-select="B"]');assert.equal(b.api.snapshot().radiationExploration.results.B.status,'not_evaluated');b.click('[data-select="A"]');b.click('[data-view="report"]');assert.match(b.document.querySelector('#content-report').textContent,/Radiation evidence and proton assumptions/);
});
test('logistics no-fit UI distinguishes supported and unsupported architecture samples',()=>{
 const b=boot();b.click('[data-property="resources"]');const toggle=b.document.querySelector('[data-logistics="enabled"]');toggle.checked=true;toggle.dispatchEvent(new b.window.Event('change',{bubbles:true}));
 b.change('[data-logistics="ice"]',0);b.click('[data-select="B"]');b.change('[data-logistics="ice"]',0);
 for(const [key,value] of Object.entries({demandKgPerCrewDay:50,recovery:0,duty:.01,throughputKgHour:.1,extractable:1,extractionRecovery:1}))b.change(`[data-logistics="${key}"]`,value);
 b.click('[data-action="logistics-flip"]');assert.match(b.document.querySelector('#logistics-proposal').textContent,/1 supported samples; 60 unsupported/);
});
test('bundled real UI keeps ranked causes, sensitivity and historical temperatures scoped to the active scenario',async()=>{
 const b=boot();b.click('[data-property="constraints"]');
 assert.match(b.document.querySelector('#prop-body').textContent,/Ranked interruptions/);
 assert.match(b.document.querySelector('#prop-body').textContent,/weighted h/);
 b.click('[data-detail="technical"]');assert.match(b.document.querySelector('#prop-body').textContent,/shortfall:/);
 b.click('[data-select="B"]');assert.equal(b.document.querySelector('#prop-body .diagnostic-list'),null,'A passing nominal result does not retain A’s failure attribution');
 b.click('[data-view="screening"]');const screening=()=>b.document.querySelector('#content-screening').textContent;
 assert.match(screening(),/Height-error sensitivity/);assert.match(screening(),/not confidence bounds/);b.api.setScreening('thermal');assert.equal(JSON.stringify([...b.document.querySelectorAll('[data-temperature-k]')].map(el=>Number(el.dataset.temperatureK))),JSON.stringify(b.api.snapshot().scenarios.B.thermalContext.filter(bin=>bin.match).map(bin=>bin.match.kelvin)));
 const before=b.api.snapshot().scenarios.B.thermalContext;b.click('[data-property="scenario"]');b.change('#landing','2027-01-14T00:00');await b.api.whenIdle();
 assert.equal(JSON.stringify(b.api.snapshot().scenarios.B.thermalContext),JSON.stringify(before));
 b.change('#data-mode','sample');await b.api.whenIdle();assert.equal(b.document.querySelector('[data-thermal-bin-count]').textContent,'0 / 0 loaded products');assert.equal(b.document.querySelectorAll('[data-temperature-k]').length,0);
});
test('actual UI navigation, scenario selection, mode switching, and UTC preview remain connected',async()=>{
 const b=boot();b.click('[data-select="B"]');b.click('[data-site="real-nobile"]');await Promise.resolve();await Promise.resolve();
 assert.equal(b.api.state.scenarios.B.site.id,'real-nobile');assert.equal(b.api.state.scenarios.A.site.id,'real-shackleton');
 b.click('[data-view="compare"]');assert.equal(b.document.querySelector('#view-compare').hidden,false);
 b.change('#data-mode','sample');await Promise.resolve();await Promise.resolve();assert.equal(b.api.state.mode,'sample');b.click('[data-view="screening"]');assert.match(b.document.querySelector('.terrain-map-caption').textContent,/Synthetic terrain demonstration/);assert.equal(b.document.querySelector('.terrain-map-card').dataset.sourceDem,'false');
 b.click('[data-view="calendar"]');assert.equal(b.document.querySelectorAll('[data-calendar]').length,29);b.click('[data-calendar="3"]');await Promise.resolve();await Promise.resolve();assert.equal(b.api.state.scenarios.B.offset,3);assert.equal(b.api.state.scenarios.B.date,'2027-01-13T00:00:00Z');
 b.click('[data-view="data"]');assert.match(b.document.querySelector('#content-data').textContent,/NASA|Source library/);b.click('[data-evidence-section="limits"]');assert.match(b.document.querySelector('#content-data').textContent,/far-field|Far-field|global/);
});
test('HTML escaping protects report text and charts use evaluated records with a shared horizon',()=>{
 assert.equal(escapeHtml('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
 const p=provider(good),r=evaluate(scn,defaultRequirements,p);assert.match(horizonChart(r,p,start),/Sun and Earth altitude/);assert.match(skyplot(r,p,start),/Polar skyplot/);
});

test('the half-open target-year boundary permits an interval ending exactly at 2034 and charts scale above polar elevations',()=>{
 const scenario={...scn,date:'2033-12-25T00:00:00Z'},p=createProvider('sample',catalog[0],bundle);
 assert.notEqual(evaluate(scenario,defaultRequirements,p).status,'insufficient_data');
 const high=provider(()=>({...good(),sunElevation:70,earthElevation:50})),res=evaluate(scn,defaultRequirements,high);
 assert.match(horizonChart(res,high,start),/Display range -15 to 70 degrees/);
});

test('switching active scenario while a date search is queued discards the stale proposal',async()=>{
 const b=boot();b.click('[data-property="constraints"]');b.click('[data-action="search"]');b.click('[data-select="B"]');
 await new Promise(resolve=>setTimeout(resolve,80));
 assert.match(b.document.querySelector('#toast').textContent,/Inputs changed/);
 assert.equal(b.document.querySelector('[data-action="preview-found"]'),null);
 assert.equal(b.api.state.scenarios.B.offset,0);
});

test('real screening and clock scrubbing keep visible comparison and inspector markers synchronized',()=>{
 const b=boot();b.click('[data-view="screening"]');assert.equal(b.document.querySelector('.terrain-map-card').dataset.sourceDem,'true');assert.match(b.document.querySelector('.terrain-map-caption').textContent,/Illustrative crater landscape/);b.click('[data-screening-presentation="measured"]');assert.match(b.document.querySelector('.terrain-map-caption').textContent,/5 m DEM/);assert.match(b.document.querySelector('#content-screening').textContent,/Height RMS/);
 b.click('[data-view="compare"]');b.api.setProperty('conditions');
 const before=[...b.document.querySelectorAll('#content-compare .skyplot')].map(s=>s.outerHTML),inspector=b.document.querySelector('#prop-body .skyplot').outerHTML;
 const time=b.document.querySelector('#time');time.value='24';time.dispatchEvent(new b.window.Event('input',{bubbles:true}));
 const after=[...b.document.querySelectorAll('#content-compare .skyplot')].map(s=>s.outerHTML);assert.notEqual(after[0],before[0]);assert.notEqual(after[1],before[1]);assert.notEqual(b.document.querySelector('#prop-body .skyplot').outerHTML,inspector);
 assert.equal(b.api.state.scenarios.A.date,'2027-01-13T00:00:00Z');assert.equal(b.api.state.hour,24);
});

test('visible real-site controls and calendar never allow an unsupported offline selection',async()=>{
 const b=boot(),points=[...b.document.querySelectorAll('[data-site]')];assert.equal(points.length,6);assert.ok(points.every(p=>p.dataset.site.startsWith('real-')));
 for(const p of points){b.click('[data-site="'+p.dataset.site+'"]');await b.api.whenIdle();assert.notEqual(b.api.snapshot().scenarios.A.result.status,'insufficient_data');}
 b.click('[data-view="calendar"]');const before=b.api.state.scenarios.A.offset,blocked=b.document.querySelector('[data-calendar="-14"]');assert.ok(blocked.disabled);blocked.click();await b.api.whenIdle();assert.equal(b.api.state.scenarios.A.offset,before);
 assert.equal(b.document.querySelector('#content-calendar').textContent.includes('Insufficient data'),false);
});

test('the actual UI loads a real 2030 date before replacing its comparison metrics',async()=>{
 const server=await createServer({configFile:false,root:fileURLToPath(new URL('../',import.meta.url)),plugins:[scienceApi()],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 try{
  await server.listen();const base='http://127.0.0.1:'+server.httpServer.address().port;
  const b=boot({fetcher:(path,options)=>fetch(base+path,options),protocol:'http:'});assert.equal(await b.api.whenReady(),true);
  const before=b.api.state.scenarios.A.date;b.change('#landing','2030-08-13T05:20');assert.equal(b.api.state.scenarios.A.date,before);assert.equal(b.document.querySelector('#coverage-progress').hidden,false);
  await b.api.whenIdle();assert.equal(b.api.state.scenarios.A.date,'2030-08-13T05:20:00Z');assert.equal(b.document.querySelector('#coverage-progress').hidden,true);assert.ok(!b.document.querySelector('#compare-strip').textContent.includes('Insufficient data'));
  assert.notEqual(b.api.snapshot().scenarios.A.result.status,'insufficient_data');
 }finally{await server.close();}
});
