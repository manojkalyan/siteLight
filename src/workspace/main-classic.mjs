import {assessMonthly,monthlyKey,monthlyReport,monthlyMarkup,monthlyDateBlock} from './monthly.mjs';
import {routeDirections} from './routes.mjs';
import {rescueReportMarkup} from './rescue-view.mjs';
import {dustReportMarkup} from './dust-view.mjs';
import {plumeReportMarkup} from './plume-view.mjs';
import {radiationReportMarkup} from './radiation-view.mjs';
import {logisticsMarkup,logisticsReportMarkup} from './logistics-view.mjs';
import ephemeris from '../../data/horizons/workspace-ephemeris.json' with {type:'json'};
import science from '../../data/science/real-workspace.json' with {type:'json'};
import terrainEvidence from '../../data/science/terrain-acceptance-evidence.json' with {type:'json'};
import {catalog,extensions} from './catalog.mjs';
import {HOUR,DAY,clamp,startTime,evaluate,explain,nextSet,findAlternative,terrainScreen} from './engine.mjs';
import {createWorkspace} from './store.mjs';
import {horizonChart,skyplot,timelineSvg,terrainMap,escapeHtml as esc} from './charts.mjs';
import {coverage,challengeUrl} from './coverage.mjs';
import {mountViewport} from './viewport.mjs';
import {screeningContent} from './screening-view.mjs';
import {evidenceContent} from './evidence-view.mjs';
import {createCoverageClient} from './coverage-client.mjs';
import {calendarContent} from './calendar-view.mjs';
import {nasaReferenceMarkup} from './nasa-reference.mjs';
import {scanStartWindows,startStudyKey,loadedWindows,startWindowMarkup,verifyStartSelection,startWindowReportMarkup} from './start-windows.mjs';

const workspace=createWorkspace(ephemeris,{science,terrainEvidence}),{state}=workspace,$=id=>document.getElementById(id);
const monthlyStudies=new Map();let monthlyLoader=null;const currentMonthly=()=>monthlyStudies.get(monthlyKey(state));
const startStudies=new Map(),currentStartStudy=()=>startStudies.get(startStudyKey(state,p()));
const root=$('root');
root.innerHTML=`
 <header class="topbar"><div class="brand"><span class="brand-mark" aria-hidden="true"></span>SiteLight <span>Lunar workspace</span></div><button class="mobile-only" data-action="sites" aria-label="Toggle site catalog">Sites</button>
 <nav class="ws-tabs" role="tablist" aria-label="Workspace"><button id="tab-layout" role="tab" data-view="layout" aria-controls="view-layout">Layout</button><button id="tab-compare" role="tab" data-view="compare" aria-controls="view-compare">Compare</button><button id="tab-screening" role="tab" data-view="screening" aria-controls="view-screening">Screening</button><button id="tab-calendar" role="tab" data-view="calendar" aria-controls="view-calendar">Calendar</button><button id="tab-report" role="tab" data-view="report" aria-controls="view-report">Report</button><button id="tab-data" role="tab" data-view="data" aria-controls="view-data">Evidence</button></nav>
 <div class="seg" role="group" aria-label="Explanation detail"><button data-detail="plain">Plain</button><button data-detail="technical">Technical</button></div><button data-action="guide" class="primary">Guide</button></header>
 <div id="coverage-progress" class="coverage-progress" role="status" hidden></div><main class="workspace" id="workspace"><aside class="outliner" aria-label="Site and scenario catalog"><div class="area-head">◫ &nbsp; Mission collection</div><div class="outliner-scroll" id="outliner"></div><div class="side-note"><label for="data-mode">Assessment data</label><select class="data-mode" id="data-mode"><option value="real">Real DEM + DE421 · local model</option><option value="horizons">JPL · reference horizon</option><option value="sample">Sample · terrain demo</option></select><div class="field-note" id="mode-note"></div></div></aside>
 <div class="center"><section class="work-view layout-view" id="view-layout" role="tabpanel" aria-labelledby="tab-layout"><section class="viewport-section"><div class="area-head"><span>◈ &nbsp; Lunar scene</span><div class="seg" aria-label="Scene scale" role="group"><button data-scene="moon">Moon</button><button data-scene="terrain">Terrain</button></div><span class="spacer"></span><span class="data-banner" id="scene-data-label">Visualization only</span><div class="seg" role="group" aria-label="Active scenario"><button data-select="A">A</button><button data-select="B">B</button></div></div>
 <div class="viewport" id="viewport"><div class="vp-overlay"><b id="viewport-name"></b><br><span class="muted" id="viewport-coordinate"></span></div><div class="vp-bottom" id="viewport-note"></div><div class="vp-camera"><button data-action="zoom-in" aria-label="Zoom in">+</button><button data-action="zoom-out" aria-label="Zoom out">−</button><button data-action="reset-camera" aria-label="Reset camera">↺</button></div></div></section>
 <div class="mini-chart-head"><b>Local horizon</b><span class="legend-sun">● Sun</span><span class="legend-earth">● Earth</span><small id="horizon-label"></small></div><div class="horizon-wrap" id="horizon-chart"></div><div class="compare-strip" id="compare-strip"></div></section>
 ${['compare','screening','calendar','report','data'].map(v=>`<section class="work-view" id="view-${v}" role="tabpanel" aria-labelledby="tab-${v}" hidden><div class="page-content" id="content-${v}"></div></section>`).join('')}</div>
 <aside class="properties" aria-label="Mission properties"><nav class="prop-tabs" role="tablist" aria-label="Inspector sections">${[['scenario','◫','Scenario setup'],['constraints','⛓','Mission requirements'],['conditions','☼','Conditions and explanation'],['terrain','▧','Terrain screening'],['resources','◉','Logistics and extensions'],['evidence','≡','Data and method']].map(([id,icon,label])=>`<button id="prop-tab-${id}" role="tab" data-property="${id}" aria-label="${label}" aria-controls="prop-body" title="${label}">${icon}</button>`).join('')}</nav><div class="prop-body" id="prop-body" role="tabpanel"></div></aside></main>
 <section class="timeline" aria-label="Mission timeline"><div class="tl-head"><button id="play" data-action="play" aria-label="Play timeline">▶</button><button data-action="start" aria-label="Go to mission start">|◀</button><button data-action="step-back" aria-label="Step back one hour">−1h</button><button data-action="step-forward" aria-label="Step forward one hour">+1h</button><button data-action="end" aria-label="Go to mission end">▶|</button><strong id="clock"></strong><span class="right" id="elapsed"></span></div><div class="tl-content"><div class="lane-labels"><span>Sunlight</span><span>Earth</span><span>Overlap</span></div><div class="timeline-bars"><div id="timeline-bars"></div><div class="tl-cursor" id="tl-cursor"></div></div></div><input class="tl-slider" id="time" type="range" min="0" max="168" step="0.1666666667" value="0" aria-label="Elapsed mission hours"></section>
 <footer class="statusbar"><span id="status-mode"></span><span id="status-result"></span><span class="right">Drag: orbit · Wheel: zoom · Space: play · Not flight software</span></footer><div class="toast" id="toast" role="status" hidden></div>
 <dialog id="guide" class="help-dialog"><header><h2>One decision, clearly explained.</h2><button data-action="close-guide" aria-label="Close guide">×</button></header><div class="help-steps"><p><b>1. Choose two reference points.</b> Select A or B, then a catalog point. Compare uses the same mission requirements for both.</p><p><b>2. Inspect conditions.</b> The horizon chart and skyplot show the same Sun/Earth records used by the evaluator. Scrub the timeline to inspect positions and time-to-set.</p><p><b>3. Find the limiting requirement.</b> Open the chain icon or Compare. Adjust a threshold or preview a tested alternative date. A proposed change is re-evaluated.</p><p><b>4. Inspect the additional layers.</b> Screening separates terrain and continuous gaps. Resources records the thermal, logistics, and research gates.</p><p><b>5. Check the evidence.</b> Real mode uses NASA PGDA terrain and matched DE421 geometric positions at six study points. The six catalog horizons combine 5 m local, 80 m polar and 240 m outer terrain to 500 km. Screening shows 100 published local terrain realizations per point and available stereo comparisons. Full physical accuracy and global/orientation covariance remain pending. Custom points retain their own declared extent. Reference and sample modes remain separate. None is a landing-safety assessment.</p></div><p class="external-note">NASA SVS visual maps are optimized for rendering. Real mode uses the local DEM patch; the sample close-up remains procedural. This is an independent project, not a NASA-endorsed product.</p></dialog>`;

let results={},providers={},proposal=null,searching=false,loading=false,serviceAvailable=false,customPointLoader=null,toastTimer,viewer,ready=Promise.resolve(false),pendingChange=Promise.resolve();
const utc=t=>new Date(t).toISOString().replace('.000Z','Z'),short=t=>new Date(t).toISOString().slice(0,16).replace('T',' ')+' UTC';
const fixed=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'—';
const pct=v=>Number.isFinite(v)?(v*100).toFixed(1)+'%':'—';
const active=()=>state.scenarios[state.active],r=()=>results[state.active],p=()=>providers[state.active];
const statusText=result=>result.status==='insufficient_data'?'Insufficient data':result.status==='uncertain'?'Nominal fit · uncertain':state.mode==='real'?'Local criteria unmet':state.mode==='sample'?(result.status==='pass'?'Sample criteria met':'Sample criteria unmet'):(result.status==='pass'?'Reference criteria met':'Reference criteria unmet');
const siteOptions=()=>workspace.availableSites().map(s=>`<option value="${s.id}" ${s.id===active().site.id?'selected':''}>${esc(s.name)}</option>`).join('')+(state.mode==='sample'?'<option value="custom" '+(active().site.id==='custom'?'selected':'')+'>Custom coordinates…</option>':'');
function notify(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
async function changeScenario(operation){
 if(loading)return;loading=true;state.playing=false;
 try{
  const update=workspace.updateAsync(operation);
  $('coverage-progress').textContent='Loading and checking real records for the requested scenario… Previous results remain displayed until it is ready.';
  $('coverage-progress').hidden=false;refresh();
  await update;invalidate();
 }catch(error){notify(error.message);}finally{loading=false;$('coverage-progress').hidden=true;refresh();}
}
function requestScenarioChange(operation){pendingChange=changeScenario(operation);return pendingChange;}
async function runMonthlyStudy(){
 if(loading||state.mode!=='real')return;loading=true;state.playing=false;
 const key=monthlyKey(state),scenario=structuredClone(active()),requirements={...state.requirements},provider=p();
 try{
  if(!monthlyLoader)throw Error('Run the local app for real monthly records.');
  $('coverage-progress').textContent='Preparing 84 real monthly mission windows. Your current scenario remains displayed.';$('coverage-progress').hidden=false;refresh();
  const data=await monthlyLoader({siteId:scenario.site.id,durationHours:requirements.duration});
  if(key!==monthlyKey(state))throw Error('Scenario or requirements changed during the monthly study. Run it again.');
  const study=assessMonthly(data,scenario,requirements,provider,science);monthlyStudies.set(key,study);if(monthlyStudies.size>2)monthlyStudies.delete(monthlyStudies.keys().next().value);notify('84 sampled starts evaluated. Nominal fits retain scientific uncertainty.');
 }catch(error){notify(error.message);}finally{loading=false;$('coverage-progress').hidden=true;refresh();}
}

async function runStartScan(){
 if(loading)return;loading=true;state.playing=false;
 const provider=p(),key=startStudyKey(state,provider),scenario=structuredClone(active()),requirements={...state.requirements};
 try{
  $('coverage-progress').textContent='Checking every supported ten-minute start in loaded records.';$('coverage-progress').hidden=false;refresh();
  await new Promise(resolve=>setTimeout(resolve,30));
  if(key!==startStudyKey(state,p()))throw Error('Point, requirements or loaded records changed. Run the scan again.');
  const study=scanStartWindows(scenario,requirements,provider);startStudies.set(key,study);if(startStudies.size>2)startStudies.delete(startStudies.keys().next().value);
  notify(study.tested+' supported starts checked; '+study.nominalFits+' nominal fits. Review uncertainty before applying.');
 }catch(error){notify(error.message);}finally{loading=false;$('coverage-progress').hidden=true;refresh();}
}

async function prepareCustomCoordinates(lat,lon,observerHeightM){
 if(loading)return;loading=true;state.playing=false;
 const token=JSON.stringify([state.mode,state.active,state.scenarios,state.requirements]);
 try{
  if(!customPointLoader)throw Error('Run the local app to prepare a custom point from its real DEM and SPICE data.');
  const scenario=active(),start=startTime(scenario),end=start+state.requirements.duration*HOUR,pad=60*DAY;
  const first=Math.max(Date.UTC(2027,0,1),Math.floor(start/DAY)*DAY-pad),last=Math.min(Date.UTC(2034,0,1),Math.ceil(end/DAY)*DAY+pad);
  $('coverage-progress').textContent='Preparing this coordinate from its NASA terrain tile and real geometry. The current assessment remains visible until coverage is ready.';$('coverage-progress').hidden=false;refresh();
  const point=await customPointLoader({lat,lon,observerHeightM,start:new Date(first).toISOString(),end:new Date(last).toISOString()});
  if(JSON.stringify([state.mode,state.active,state.scenarios,state.requirements])!==token)throw Error('Scenario changed while terrain was loading. Prepare the selected point again.');
  workspace.registerCustomPoint(point);invalidate();notify('Real terrain and geometric records are prepared for this coordinate. Review its coverage and uncertainty.');
 }catch(error){notify(error.message);}finally{loading=false;$('coverage-progress').hidden=true;refresh();}
}
function field(id,label,value,{type='number',min,max,step=1,note=''}={}){return `<label class="field" for="${id}"><span>${label}</span><input id="${id}" type="${type}" value="${esc(value)}" ${min!==undefined?`min="${min}"`:''} ${max!==undefined?`max="${max}"`:''} step="${step}"/>${note?`<div class="field-note">${note}</div>`:''}</label>`;}
function section(title,body){return `<section class="prop-section"><h3>${title}</h3>${body}</section>`;}
function scenarioButtons(){return `<div class="seg screen-select" role="group" aria-label="Scenario to inspect"><button data-select="A" aria-pressed="${state.active==='A'}">Scenario A</button><button data-select="B" aria-pressed="${state.active==='B'}">Scenario B</button></div>`;}
function modeNotice(){return state.mode==='real'?`Real NASA PGDA terrain, DE421 geometric positions, ${p().terrain?.horizon.extentM/1000} km nominal rays and a ${active().site.observerHeightM} m observer. ${p().terrainReview?'Published local ensemble and partial stereo checks appear in Screening. Outer-domain/global uncertainty remains open.':'Additional reference evidence is not prepared for this coordinate.'}`:state.mode==='sample'?'Synthetic geometry and terrain demonstration. No measured site conditions.':'Actual JPL position records; zero-degree reference tangent horizon. Real terrain is not assessed.';}
function renderOutliner(){
 $('outliner').innerHTML=`<div class="collection">Scenes</div>${['A','B'].map(id=>`<button class="object-row" data-select="${id}" aria-pressed="${state.active===id}"><span class="object-dot"></span><span>Scenario ${id}<small>${esc(state.scenarios[id].site.name)}</small></span><span class="tag">${results[id].status==='pass'?'MET':results[id].status==='fail'?'UNMET':results[id].status==='uncertain'?'UNC':'N/A'}</span></button>`).join('')}<div class="collection">${state.mode==='real'?'Real DEM study points':'Reference points'}</div>${workspace.availableSites().map(s=>`<button class="object-row" data-site="${s.id}" aria-pressed="${active().site.id===s.id}"><span class="object-dot"></span><span>${esc(s.name)}<small>${fixed(s.lat,2)}°, ${fixed(s.lon,2)}°</small></span></button>`).join('')}<div class="collection">Assessment layers</div>${[['conditions','Sun + Earth'],['terrain','Slope + coverage'],['resources','Logistics + research'],['evidence','Provenance']].map(([id,name])=>`<button class="object-row" data-property="${id}"><span class="object-dot"></span>${name}</button>`).join('')}`;
 $('data-mode').value=state.mode;$('mode-note').textContent=modeNotice();
}
function card(id){const s=state.scenarios[id],res=results[id];return `<article class="cmp-card ${state.active===id?'selected':''}"><div class="cmp-head"><button class="scenario-tag" data-select="${id}" aria-label="Select scenario ${id}">${id}</button><span class="cmp-name">${esc(s.site.name)}</span><span class="status ${res.status}">${statusText(res)}</span></div><div class="cmp-metrics">${[['sun','Sunlight'],['earth','Earth'],['overlap','Overlap']].map(([key,label])=>`<div class="cmp-metric"><span>${label}</span><strong>${res.status==='insufficient_data'?'—':pct(res.fractions[key])}</strong><div class="track"><i style="width:${res.status==='insufficient_data'?0:res.fractions[key]*100}%"></i></div></div>`).join('')}</div><div class="cmp-foot">${short(startTime(s))} · ${state.requirements.duration} h${s.offset?' · preview '+(s.offset>0?'+':'')+s.offset+' d':''}</div></article>`;}
function renderProperties(){
 const s=active(),res=r(),req=state.requirements;
 let content='';
 if(state.property==='scenario'){
  const bounds=workspace.inputBounds(),min=utc(bounds.min).slice(0,16),max=utc(bounds.max).slice(0,16);
  content=section('Scenario '+state.active,`<label class="field" for="site"><span>Reference point</span><select id="site">${siteOptions()}</select></label>${field('landing','Landing date and time · UTC',s.date.slice(0,16),{type:'datetime-local',min,max,step:60,note:'UTC, independent of your computer’s time zone.'})}${field('duration','Surface interval · hours',req.duration,{min:48,max:336,step:.5})}<p class="field-note">${esc(s.site.coordinateStatus)}. Altitude is above the reference sphere, not a measured local surface.</p>`)
   +section('Schedule preview',`<label class="field" for="offset"><span>Landing-time offset <output id="offset-value">${s.offset>0?'+':''}${s.offset} days</output></span><input id="offset" type="range" min="${bounds.minOffset}" max="${bounds.maxOffset}" step="1" value="${s.offset}"/></label><p>Evaluated: ${short(startTime(s))}</p><div class="inline-actions"><button data-action="apply-preview">Apply preview</button><button data-action="reset-preview">Reset</button></div><div class="field-note">Original UTC stays unchanged until applied. ${serviceAvailable&&state.mode==='real'?'New dates load real geometric records before changing the scenario.':'Controls stay within loaded data coverage.'}</div>`)
   +section('Custom coordinates',`<fieldset ${state.mode==='sample'||state.mode==='real'&&serviceAvailable?'':'disabled'}><div class="two-col">${field('custom-lat','Latitude · ° north',s.site.lat,{min:-90,max:90,step:.001})}${field('custom-lon','Longitude · ° east',s.site.lon,{min:-180,max:180,step:.001})}</div>${state.mode==='real'?field('custom-alt','Observer height above terrain · m',s.site.observerHeightM??2,{min:.1,max:100,step:.1}):field('custom-alt','Altitude above reference · km',s.site.altKm,{min:-10,max:20,step:.001})}<button data-action="custom" class="primary">${state.mode==='real'?'Prepare real terrain and use point':'Use coordinates'}</button></fieldset><div class="field-note">${state.mode==='real'?'Real custom points require complete source terrain and geometric coverage inside the prepared NASA high resolution tiles. Unsupported coordinates leave this scenario unchanged.':'Sample mode allows illustrative custom coordinates with synthetic terrain and geometry.'}</div>`);
 }else if(state.property==='constraints'){
  content=section('Shared requirements',`${field('minSun','Minimum solar-eligible time · %',req.minSun*100,{min:0,max:100})}${field('minEarth','Minimum Earth visibility · %',req.minEarth*100,{min:0,max:100})}${field('minOverlap','Minimum simultaneous time · %',req.minOverlap*100,{min:0,max:100})}${field('minElevation','Minimum solar elevation · °',req.minElevation,{min:0,max:8,step:.1})}<p class="field-note">Fractions are over the full surface interval. Solar eligibility is a geometric proxy, not generated electrical power.</p>`)
   +section('Continuous-gap requirements',`<label class="inline-check"><input id="enable-dark" type="checkbox" ${req.maxDark!==null?'checked':''}/>Enable maximum continuous darkness</label>${field('maxDark','Maximum darkness · hours',req.maxDark??24,{min:0,max:336,step:.5})}<label class="inline-check"><input id="enable-earth" type="checkbox" ${req.maxEarth!==null?'checked':''}/>Enable maximum Earth outage</label>${field('maxEarth','Maximum Earth outage · hours',req.maxEarth??24,{min:0,max:336,step:.5})}<p class="field-note">Disabled limits are informational. A gap does not create a failure unless its requirement is enabled.</p>`)
   +section('What limits this plan?',`<div class="explanation">${esc(explain(res,state.detail==='technical'))}</div>${rulesMarkup(res)}<button class="primary" data-action="search" ${searching?'disabled':''}>${searching?'Testing dates…':'Find a tested alternative'}</button><div id="proposal">${proposalMarkup()}</div>`);
 }else if(state.property==='conditions'){
  content=section('At the selected time',`<div id="live-conditions"></div><div class="field-note">Sun and Earth are tested independently against their own azimuth’s horizon. Values are body-center directions.</div>`)
   +section('Binding requirements',`<div class="explanation">${esc(explain(res,state.detail==='technical'))}</div>${rulesMarkup(res)}<button class="primary" data-action="search" ${searching?'disabled':''}>Find a tested alternative</button><div id="proposal">${proposalMarkup()}</div>`)
   +section('Skyplot',skyplot(res,p(),startTime(s)+state.hour*HOUR));
 }else if(state.property==='terrain'){
  content=section('Terrain assessment',`<p>${state.mode==='real'?(p().entry?'Real NASA PGDA DEM footprint. Source height/slope RMS products are shown separately.':'No real DEM covers this selected coordinate.'):state.mode==='sample'?'Synthetic footprint demonstration. Statistics are computed from a procedural height field.':'Reference-only mode; terrain is not evaluated.'}</p>${field('terrain-radius','Footprint radius · m',state.terrain.radius,{min:20,max:300,step:10})}${field('terrain-baseline','Slope measurement baseline · m',state.terrain.baseline,{min:5,max:100,step:5})}${field('terrain-limit','Maximum slope requirement · °',state.terrain.limit,{min:0,max:45,step:.5})}<label class="inline-check"><input id="terrain-missing" type="checkbox" ${state.mode!=='sample'?'disabled':''} ${state.terrain.missing?'checked':''}/>Show missing-coverage sample</label><div class="field-note">A chosen screening limit is not a universal safe landing angle. Unresolved rocks are not assessed.</div><div class="inline-actions"><button data-view="screening">Open screening</button></div>`);
 }else if(state.property==='resources'){
  content=nasaReferenceMarkup()+logisticsMarkup(workspace);
 }else{
  content=section('Data and method',`<span class="extension-status">${state.mode==='real'?'Real terrain + geometric ephemeris':state.mode==='sample'?'Synthetic demonstration':'Source-backed reference'}</span><p>${esc(modeNotice())}</p><div class="readout"><span>Integration</span><strong>10 min; partial weights</strong></div><div class="readout"><span>Horizon</span><strong>${state.mode==='real'?`0.5° / ${p().terrain?.horizon.extentM/1000} km nominal rays`:state.mode==='sample'?'Synthetic azimuth profile':'0° reference tangent'}</strong></div><div class="readout"><span>Real DEM</span><strong>${state.mode==='real'&&p().entry?active().site.tile+' / 5 m':'Not assessed in this mode'}</strong></div><div class="readout"><span>Validation</span><strong>Independent checks pending</strong></div><a class="source-link" href="${challengeUrl}" target="_blank" rel="noreferrer">Official NASA challenge ↗</a><button data-view="data" class="section-gap">Review coverage and sources</button>`);
 }
 $('prop-body').innerHTML=content;if(loading)$('prop-body').querySelectorAll('input,select,button').forEach(el=>el.disabled=true);$('prop-body').setAttribute('aria-labelledby','prop-tab-'+state.property);
 document.querySelectorAll('[data-property]').forEach(b=>{if(b.getAttribute('role')==='tab'){b.setAttribute('aria-selected',String(b.dataset.property===state.property));b.tabIndex=b.dataset.property===state.property?0:-1;}});
 if(state.property==='conditions')renderLiveConditions();
}
function rulesMarkup(result){return result.rules.map(rule=>`<div class="rule"><b>${rule.label}</b><br><span class="${rule.pass?'good':'bad'}">${fixed(rule.value)} h ${rule.operator} ${fixed(rule.required)} h · ${rule.pass?'met':'unmet'}</span><span class="technical-detail"><br>Margin: ${fixed(rule.margin,2)} h</span></div>`).join('')+diagnosticsMarkup(result);}
function diagnosticsMarkup(result){
 const rows=result.diagnostics||[];if(!rows.length)return '';
 return `<details class="diagnostic-list" open><summary>Ranked interruptions · ${rows.length}</summary><p class="field-note">Solar weight 1.0; Earth weight 0.6. Score = duration × active weights. Only unmet enabled rules contribute. Scores prioritize investigation; they are not physical losses.</p>${rows.map(d=>`<article class="rule"><b>#${d.rank} · ${fixed(d.hours)} h · ${fixed(d.score)} weighted h</b><p>${esc(d.plain)}</p><p class="field-note">${esc(d.startUtc)} → ${esc(d.endUtc)}${d.leftBoundary||d.rightBoundary?' · clipped by mission boundary':''}</p>${state.detail==='technical'?`<p class="field-note">${d.relevantRules.map(r=>`${esc(r.label)} shortfall: ${fixed(r.shortfallHours)} h`).join('; ')}. ${d.sunAzimuth?'Sampled Sun azimuth span '+fixed(d.sunAzimuth.spanDeg)+'°; ':''}${d.earthAzimuth?'sampled Earth azimuth span '+fixed(d.earthAzimuth.spanDeg)+'°; ':''}10-minute sampling.</p>`:''}<p class="field-note">${esc(d.consequence)}</p></article>`).join('')}</details>`;
}
function proposalMarkup(){if(!proposal)return '';if(!proposal.scenario)return `<p class="field-note">No passing daily sample found. Tested ${proposal.tested}; ${proposal.unavailable} outside available coverage. Requirements were preserved.</p>`;return `<div class="notice section-gap">Tested alternative: ${short(startTime(proposal.scenario))}<br>${proposal.delta>0?'+':''}${proposal.delta} days from current preview. Nominal enabled requirements met under this model. ${proposal.qualification?esc(proposal.qualification):''}<div class="inline-actions"><button data-action="preview-found">Preview tested date</button></div></div>`;}
function eventLabel(event){return event.status==='below'?'Already below horizon':event.status==='crossing'?'~'+fixed(event.hours)+' h · 10-min bracket':event.status==='beyond_window'?'No set within remaining window':'Not evaluated';}
function renderLiveConditions(){
 if(!$('live-conditions'))return;const t=startTime(active())+state.hour*HOUR,g=p().geometry(t),res=r();
 $('live-conditions').innerHTML=g?`<div class="readout"><span>Solar elevation / azimuth</span><strong>${fixed(g.sunElevation,2)}° / ${fixed(g.sunAzimuth,1)}°</strong></div><div class="readout"><span>Earth elevation / azimuth</span><strong>${fixed(g.earthElevation,2)}° / ${fixed(g.earthAzimuth,1)}°</strong></div><div class="readout"><span>Sun horizon / Earth horizon</span><strong>${fixed(p().horizon(g.sunAzimuth))}° / ${fixed(p().horizon(g.earthAzimuth))}°</strong></div><div class="readout"><span>Until sunset</span><strong>${eventLabel(nextSet(res,t,'lit'))}</strong></div><div class="readout"><span>Until Earthset</span><strong>${eventLabel(nextSet(res,t,'earth'))}</strong></div>`:'<p>No source record at this point and time.</p>';
}
function renderCompare(){
 $('content-compare').innerHTML=`<p class="eyebrow">Same requirements. Clear trade-offs.</p><h1>Compare your options.</h1><p class="page-intro">${esc(modeNotice())} Each result covers ${state.requirements.duration} hours from its evaluated UTC start.</p><div class="cards">${['A','B'].map(id=>`<section class="card"><div class="cmp-head"><button data-select="${id}" class="scenario-tag">${id}</button><h2>${esc(state.scenarios[id].site.name)}</h2></div><span class="status ${results[id].status}">${statusText(results[id])}</span><div class="explanation">${esc(explain(results[id],state.detail==='technical'))}</div>${skyplot(results[id],providers[id],startTime(state.scenarios[id])+state.hour*HOUR)}<p>Baseline ${short(Date.parse(state.scenarios[id].date))}<br>Evaluated ${short(startTime(state.scenarios[id]))}</p></section>`).join('')}</div><section class="card section-gap"><h2>Difference at a glance</h2><div class="scroll-table"><table class="comparison-table"><thead><tr><th>Metric</th><th>Scenario A</th><th>Scenario B</th><th>B − A</th></tr></thead><tbody>${[['sun','Solar-eligible time'],['earth','Earth visibility'],['overlap','Simultaneous availability']].map(([key,label])=>`<tr><td>${label}</td><td>${pct(results.A.fractions?.[key])}</td><td>${pct(results.B.fractions?.[key])}</td><td>${results.A.status==='insufficient_data'||results.B.status==='insufficient_data'?'—':fixed((results.B.fractions[key]-results.A.fractions[key])*100)+' pp'}</td></tr>`).join('')}<tr><td>Terrain / thermal / logistics</td><td colspan="3">Separate assessments; no assumed pass</td></tr></tbody></table></div><div class="inline-actions"><button data-property="constraints">Adjust requirements</button><button class="primary" data-action="search" ${searching?'disabled':''}>Find alternative for ${state.active}</button></div><div>${proposalMarkup()}</div></section>`;
}
function gapsMarkup(res){
 if(!res.gaps)return '<p>No complete interval data. Gap duration is unknown.</p>';
 return ['dark','solar','earth'].map((key,i)=>`<section class="card"><h3>${['Continuous darkness','Below solar criterion','Earth invisibility'][i]}</h3><div class="large-number">${fixed(res.longest[key])} h</div><p>Longest within this assessment window.</p>${res.gaps[key].length?res.gaps[key].slice().sort((a,b)=>b.hours-a.hours).slice(0,5).map(g=>`<div class="gap-row"><span>${short(g.start)}<br>${short(g.end)}<br><small>${g.leftBoundary?'Starts at window boundary. ':''}${g.rightBoundary?'Ends at window boundary; full event may be longer.':''}${g.unknownBoundary?'Adjacent to missing data.':''}</small></span><b>${fixed(g.hours)} h</b></div>`).join(''):'<div class="gap-row">No sampled interruption within this window.</div>'}</section>`).join('');
}
function renderScreening(){
 $('content-screening').innerHTML=screeningContent({state,site:active().site,res:r(),provider:p(),gapsMarkup,scenarioButtons});
}

function renderCalendar(){
 $('content-calendar').innerHTML=calendarContent({workspace,provider:p(),scenarioButtons,modeNotice,statusText,serviceAvailable,monthlySection:monthlyMarkup(currentMonthly(),{available:state.mode==='real'&&serviceAvailable,busy:loading}),startSection:startWindowMarkup(currentStartStudy(),!loading&&loadedWindows(p()).length>0)});
}

function reportData(){return {...workspace.serialize(),monthlyRobustness:monthlyReport(currentMonthly()),landingStartWindows:currentStartStudy()||null,challenge:{url:challengeUrl,assessment:'Coverage review, not NASA certification',requirements:coverage},visualization:{globe:'NASA SVS CGI Moon Kit rendering maps',terrain:state.mode==='real'?'Selected NASA PGDA 5 m DEM patch; scientific horizon includes 80 m far field':'Procedural demonstration'}};}
function renderReport(){
 const report=reportData();
 $('content-report').innerHTML=`<p class="eyebrow">A result you can inspect</p><h1>Keep the evidence with the decision.</h1><p class="page-intro">${report.classification}. Export includes UTC inputs, requirements, intervals, source checksums, conventions, data gaps, and unassessed features.</p><div class="inline-actions"><button class="primary" data-action="export-json">Export JSON</button><button data-action="export-csv">Export intervals CSV</button><button data-action="print">Print / PDF</button></div><div class="cards section-gap">${['A','B'].map(id=>`<section class="card"><h2>Scenario ${id} · ${esc(state.scenarios[id].site.name)}</h2><span class="status ${results[id].status}">${statusText(results[id])}</span><div class="explanation">${esc(explain(results[id],state.detail==='technical'))}</div>${rulesMarkup(results[id])}</section>`).join('')}<section class="card wide"><h2>Method and limits</h2><p>${esc(report.convention)}</p><ul class="subtle-list">${report.limitations.map(l=>`<li>${l}</li>`).join('')}</ul><p>Historical Diviner context is available in real mode. Operational thermal survival, accepted LCSS engineering, surface/human radiation dose, engine/soil plume hazard and operational rescue feasibility remain unassessed. Exploratory models below retain separate assumptions.</p></section></div>${startWindowReportMarkup(report.landingStartWindows)}${nasaReferenceMarkup('nasa-reference-report')}${logisticsReportMarkup(workspace)}${rescueReportMarkup(report.rescueExploration)}${dustReportMarkup(report.dustExploration)}${plumeReportMarkup(report.plumeExploration)}${radiationReportMarkup(report.radiationExploration)}<details class="section-gap"><summary>Inspect structured report</summary><pre class="report-pre">${esc(JSON.stringify(report,null,2))}</pre></details>`;
}
function renderData(){
 $('content-data').innerHTML=evidenceContent({science,coverage,challengeUrl,extensions});
}

function refresh(skipProperties=false){
 for(const id of ['A','B']){providers[id]=workspace.provider(id);results[id]=workspace.result(id);}
 document.body.dataset.detail=state.detail;
 document.querySelectorAll('[data-view]').forEach(b=>{if(b.getAttribute('role')==='tab'){const yes=b.dataset.view===state.view;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;}});
 document.querySelectorAll('[data-detail]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.detail===state.detail)));
 document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===state.scene)));
 for(const view of ['layout','compare','screening','calendar','report','data'])$('view-'+view).hidden=view!==state.view;
 renderOutliner();$('compare-strip').innerHTML=card('A')+card('B');
 if(!skipProperties)renderProperties();
 if(state.view==='compare')renderCompare();else if(state.view==='screening')renderScreening();else if(state.view==='calendar')renderCalendar();else if(state.view==='report')renderReport();else if(state.view==='data')renderData();
 $('timeline-bars').innerHTML=timelineSvg(r());$('time').max=state.requirements.duration;
 $('viewport-name').textContent='Scenario '+state.active+' · '+active().site.name;
 $('viewport-coordinate').textContent=fixed(active().site.lat,3)+'° N, '+fixed(active().site.lon,3)+'° E · reference coordinate';
 $('viewport-note').textContent=state.scene==='moon'?'Moon maps: NASA’s Scientific Visualization Studio · artistic studio lighting':state.mode==='real'&&p().entry?'NASA PGDA elevation grid · exaggerated Sun/Earth markers · local patch':'Procedural terrain and exaggerated Sun/Earth markers · not a measured site';
 $('scene-data-label').textContent=state.scene==='moon'?'Rendering maps · reference pin':state.mode==='real'&&p().entry?'Real NASA DEM · local patch':'Procedural surface · visual only';
 $('horizon-label').textContent=state.mode==='real'?`Real DEM · ${p().terrain?.horizon.extentM/1000} km nominal extent`:state.mode==='sample'?'Synthetic profile':'Reference tangent · no DEM';
 $('status-mode').textContent=state.mode==='real'?'REAL NASA DEM + DE421 · BOUNDED MODEL':state.mode==='sample'?'SYNTHETIC DEMO':'JPL REFERENCE · TERRAIN UNASSESSED';$('status-result').textContent='Scenario '+state.active+': '+statusText(r());
 document.querySelectorAll('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.select===state.active)));
 clock();viewer?.update();root.setAttribute('aria-busy',String(loading));if(loading)root.querySelectorAll('input,select,[data-site],[data-select],[data-calendar],[data-start-window],[data-action=start-window-scan],[data-action=custom],[data-action=apply-preview],[data-action=reset-preview],[data-action=search],[data-action=preview-found],[data-action=plume-add],[data-action=plume-remove]').forEach(el=>el.disabled=true);
}
function clock(){
 const t=startTime(active())+state.hour*HOUR;$('clock').textContent=short(t);$('elapsed').textContent='T+ '+fixed(state.hour)+' / '+state.requirements.duration+' h';
 $('time').value=state.hour;$('tl-cursor').style.left=(state.hour/state.requirements.duration*100)+'%';
 if(state.view==='layout')$('horizon-chart').innerHTML=horizonChart(r(),p(),t);
 if(state.view==='compare'){
  const plots=[...$('content-compare').querySelectorAll('.skyplot')];
  ['A','B'].forEach((id,i)=>{if(plots[i])plots[i].outerHTML=skyplot(results[id],providers[id],startTime(state.scenarios[id])+state.hour*HOUR);});
 }
 if(state.property==='conditions'){const plot=$('prop-body').querySelector('.skyplot');if(plot)plot.outerHTML=skyplot(r(),p(),t);}
 renderLiveConditions();
 $('play').textContent=state.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',state.playing?'Pause timeline':'Play timeline');$('play').setAttribute('aria-pressed',String(state.playing));
}
function invalidate(){proposal=null;state.playing=false;}
function setView(view){state.view=view;refresh();}
function setProperty(property){state.property=property;renderProperties();}
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function exportJson(){
 const report=reportData(),canonical=JSON.stringify({model:report.model,mode:report.mode,requirements:report.requirements,convention:report.convention,preprocessing:report.preprocessing,stepMinutes:report.stepMinutes,scenarios:report.scenarios,terrain:report.terrain,logisticsExploration:report.logisticsExploration,nasaReferenceStudy:report.nasaReferenceStudy,terrainReferenceEvidence:report.terrainReferenceEvidence,monthlyRobustness:report.monthlyRobustness,landingStartWindows:report.landingStartWindows,rescueExploration:report.rescueExploration,dustExploration:report.dustExploration,plumeExploration:report.plumeExploration,radiationExploration:report.radiationExploration});
 report.canonicalInputsSha256=globalThis.crypto?.subtle?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical))),b=>b.toString(16).padStart(2,'0')).join(''):null;
 report.hashStatus=report.canonicalInputsSha256?'SHA-256 generated locally':'Web Crypto unavailable; no digest claimed';download(JSON.stringify(report,null,2),'sitelight-evidence-report.json','application/json');
}
function exportCsv(){
 const rows=[['scenario','classification','kind','start_utc','end_utc','duration_h','left_boundary','right_boundary','unknown_boundary']];
 for(const id of ['A','B'])for(const [kind,gaps] of Object.entries(results[id].gaps||{}))for(const g of gaps)rows.push([id,results[id].classification,kind,utc(g.start),utc(g.end),g.hours,g.leftBoundary,g.rightBoundary,g.unknownBoundary]);
 download(rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n'),'sitelight-interruption-intervals.csv','text/csv');
}
function search(){
 if(searching||loading)return;searching=true;proposal=null;const activeId=state.active,inputs=JSON.stringify(workspace.serialize()),scn=structuredClone(active()),req={...state.requirements},provider=p();refresh();
 setTimeout(()=>{try{if(state.active!==activeId||JSON.stringify(workspace.serialize())!==inputs){notify('Inputs changed. Run the search again.');return;}proposal=findAlternative(scn,req,provider);state.property='constraints';notify(proposal.scenario?'A nominally suitable daily sample was tested. Review its model scope and uncertainty.':'No passing sample found in the tested available coverage.');}catch(e){notify(e.message);}finally{searching=false;refresh();}},30);
}
root.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 try{
  if(b.dataset.view){setView(b.dataset.view);return;}
  if(b.dataset.select){workspace.select(b.dataset.select);invalidate();refresh();return;}
  if(b.dataset.site){void requestScenarioChange(()=>workspace.setSite(b.dataset.site));return;}
  if(b.dataset.property){setProperty(b.dataset.property);return;}
  if(b.dataset.detail){state.detail=b.dataset.detail;refresh();return;}
  if(b.dataset.scene){state.scene=b.dataset.scene;viewer.setMode(state.scene);refresh();return;}
  if(b.dataset.calendar){void requestScenarioChange(()=>workspace.setOffset(Number(b.dataset.calendar)));return;}
  if(b.dataset.monthlyDate){if(loading)return;const block=monthlyDateBlock(currentMonthly(),b.dataset.monthlyDate);workspace.registerCoverage(block);void requestScenarioChange(()=>workspace.setDate(block.start));return;}
  if(b.dataset.startWindow){if(loading)return;const {candidate}=verifyStartSelection(currentStartStudy(),b.dataset.startWindow,active(),state.requirements,p());void requestScenarioChange(()=>workspace.setDate(candidate.date));return;}
  const action=b.dataset.action;
  if(action==='plume-add'||action==='plume-remove'){if(loading)return;if(action==='plume-add')workspace.addPlumeAsset();else workspace.removePlumeAsset(b.dataset.assetId);refresh();return;}
  if(action==='monthly-study'){pendingChange=runMonthlyStudy();return;}
  if(action==='start-window-scan'){pendingChange=runStartScan();return;}
  if(action==='sites'){$('workspace').classList.toggle('show-sites');return;}
  if(action==='guide'){$('guide').showModal();return;}if(action==='close-guide'){$('guide').close();return;}
  if(action==='zoom-in'){viewer.zoom(-3);return;}if(action==='zoom-out'){viewer.zoom(3);return;}if(action==='reset-camera'){viewer.reset();return;}
  if(action==='play'){if(matchMedia('(prefers-reduced-motion: reduce)').matches){notify('Reduced motion is enabled. Use the timeline slider or step buttons.');return;}state.playing=!state.playing;if(state.hour>=state.requirements.duration)state.hour=0;clock();return;}
  if(['start','end','step-back','step-forward'].includes(action)){state.playing=false;state.hour=action==='start'?0:action==='end'?state.requirements.duration:clamp(state.hour+(action==='step-back'?-1:1),0,state.requirements.duration);clock();return;}
  if(action==='apply-preview'){void requestScenarioChange(()=>workspace.applyPreview());return;}if(action==='reset-preview'){void requestScenarioChange(()=>workspace.resetPreview());return;}
  if(action==='custom'){const fields=['custom-lat','custom-lon','custom-alt'].map(id=>$(id));if(fields.some(f=>!f.value||!f.checkValidity()))throw Error('Enter valid latitude, longitude, and height values.');const values=fields.map(f=>Number(f.value));if(state.mode==='real'){pendingChange=prepareCustomCoordinates(...values);return;}void requestScenarioChange(()=>workspace.setCustom(...values));return;}
  if(action==='logistics-flip'){const found=workspace.logisticsFlip();const box=$('logistics-proposal');box.textContent=found.match?'Tested hypothetical concentration: '+found.match.iceWtPercent+' wt%; subtotal '+found.match.result.totalKg.toFixed(0)+' kg. '+found.meaning:'No budget fit among '+found.evaluated+' supported samples; '+found.unavailable+' unsupported samples on the 0-6 wt% grid at 0.1 wt% steps.';if(found.match){const button=document.createElement('button');button.textContent='Apply tested assumption';button.onclick=()=>{workspace.setLogistics({ice:{[state.active]:found.match.iceWtPercent}});refresh();};box.appendChild(button);}return;}
  if(action==='search'){search();return;}
  if(action==='preview-found'&&proposal?.scenario){const offset=proposal.scenario.offset;void requestScenarioChange(()=>workspace.setOffset(offset));return;}
  if(action==='export-json'){void exportJson().catch(e=>notify(e.message));return;}if(action==='export-csv'){exportCsv();return;}
  if(action==='print'){setView('report');window.print();return;}
 }catch(e){notify(e.message);refresh();}
});
root.addEventListener('input',event=>{
 if(loading)return;
 const input=event.target;if(input.id==='time'){state.playing=false;state.hour=Number(input.value);clock();}
 if(input.id==='offset'){
  const value=Number(input.value),s={...active(),offset:value},a=startTime(s),b=a+state.requirements.duration*HOUR;
  if(workspace.canPreview(value)&&p().covers(a,b)){workspace.setOffset(value);invalidate();$('offset-value').textContent=(value>0?'+':'')+value+' days';refresh(true);}
  else if($('offset-value'))$('offset-value').textContent=(value>0?'+':'')+value+' days · release to load';
 }
});
root.addEventListener('change',event=>{
 if(loading)return;
 const radiationKey=event.target.dataset?.radiation;
 if(radiationKey){try{const input=event.target,isBoolean=['enabled','corrected'].includes(radiationKey),isText=['material','archiveMonth','detector'].includes(radiationKey);if(!isBoolean&&!isText&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid proton or archive assumption.');workspace.setRadiation({[radiationKey]:isBoolean?input.checked:isText?input.value:Number(input.value)});refresh();}catch(error){notify(error.message);refresh();}return;}
 const plumeAsset=event.target.dataset?.plumeAsset,plumeKey=event.target.dataset?.plume;
 if(plumeAsset||plumeKey){try{const input=event.target,key=plumeAsset?input.dataset.plumeField:plumeKey,isBoolean=key==='enabled',isText=key==='name';if(!isBoolean&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid ejecta or asset assumption.');const value=isBoolean?input.checked:isText?input.value:Number(input.value);if(plumeAsset)workspace.setPlumeAsset(plumeAsset,{[key]:value});else workspace.setPlume({[key]:value});refresh();}catch(error){notify(error.message);refresh();}return;}
 const dustKey=event.target.dataset?.dust;
 if(dustKey){try{const input=event.target;if(!['enabled','material'].includes(dustKey)&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid dust or radiator assumption.');workspace.setDust({[dustKey]:dustKey==='enabled'?input.checked:dustKey==='material'?input.value:Number(input.value)});refresh();}catch(error){notify(error.message);refresh();}return;}
 const rescueKey=event.target.dataset?.rescue;
 if(rescueKey){try{const input=event.target,isBoolean=['assetDeclared','available','returnRequired'].includes(rescueKey);if(!isBoolean&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid rescue assumption.');workspace.setRescue({[rescueKey]:isBoolean?input.checked:Number(input.value)});refresh();}catch(error){notify(error.message);refresh();}return;}
 if(event.target.id==='route-direction'){if(!routeDirections[event.target.value]){notify('Unknown route direction.');return;}state.routeDirection=event.target.value;refresh();return;}
 const logisticsKey=event.target.dataset?.logistics;if(logisticsKey){try{const input=event.target;if(logisticsKey!=='enabled'&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid logistics assumption.');const value=Number(input.value);workspace.setLogistics(logisticsKey==='enabled'?{enabled:input.checked}:logisticsKey==='ice'?{ice:{[state.active]:value}}:logisticsKey==='budgetKg'?{budgetKg:value}:{inputs:{[logisticsKey]:value}});refresh();}catch(error){notify(error.message);refresh();}return;}
 const input=event.target,id=input.id;if(loading)return;
 if(id==='time'||id.startsWith('custom-'))return;
 if(id==='offset'){const value=Number(input.value);void requestScenarioChange(()=>workspace.setOffset(value));return;}
 if(id.startsWith('terrain-')){
  try{const key={'terrain-radius':'radius','terrain-baseline':'baseline','terrain-limit':'limit','terrain-missing':'missing'}[id];if(!key)return;const patch={...state.terrain,[key]:key==='missing'?input.checked:Number(input.value)};if(key!=='missing'&&(!input.value||!input.checkValidity()))throw Error('Enter a valid terrain setting.');terrainScreen(active().site,patch);state.terrain=patch;invalidate();refresh();}catch(error){notify(error.message);refresh();}return;
 }
 const value=input.value,checked=input.checked,dark=Number($('maxDark')?.value??24),earth=Number($('maxEarth')?.value??24);
 if(['landing','duration','minSun','minEarth','minOverlap','minElevation','maxDark','maxEarth'].includes(id)&&(!value||!input.checkValidity())){notify('Choose a value within the supported range.');refresh();return;}
 void requestScenarioChange(()=>{
  if(id==='data-mode')workspace.setMode(value);
  else if(id==='site'){if(value==='custom'){notify('Enter the custom coordinates below.');return;}workspace.setSite(value);}
  else if(id==='landing')workspace.setDate(value.length===16?value+':00Z':value+'Z');
  else if(['duration','minSun','minEarth','minOverlap','minElevation','maxDark','maxEarth'].includes(id)){
   if(id==='maxDark'&&state.requirements.maxDark===null||id==='maxEarth'&&state.requirements.maxEarth===null)return;
   workspace.setRequirements({[id]:['minSun','minEarth','minOverlap'].includes(id)?Number(value)/100:Number(value)});
  }else if(id==='enable-dark')workspace.setRequirements({maxDark:checked?dark:null});
  else if(id==='enable-earth')workspace.setRequirements({maxEarth:checked?earth:null});
 });
});

root.addEventListener('keydown',event=>{
 const tab=event.target.closest('[role=tab]');if(!tab||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
 const siblings=[...tab.parentElement.querySelectorAll('[role=tab]')],index=siblings.indexOf(tab);let next=event.key==='Home'?0:event.key==='End'?siblings.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+siblings.length)%siblings.length;
 event.preventDefault();siblings[next].click();siblings[next].focus();
});
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!event.repeat&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName||'')&&!$('guide').open){event.preventDefault();$('play').click();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){state.playing=false;clock();}});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches){state.playing=false;clock();}});
refresh();
viewer=mountViewport($('viewport'),()=>({site:active().site,hour:state.hour,geometry:p().geometry(startTime(active())+state.hour*HOUR),terrainGrid:state.mode==='real'?p().terrain?.grid:null}),notify);
let last=performance.now(),lastClock=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(state.playing&&!document.hidden){state.hour=Math.min(state.requirements.duration,state.hour+dt*state.speed);if(state.hour>=state.requirements.duration)state.playing=false;if(now-lastClock>100||!state.playing){clock();lastClock=now;}}requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.SiteLightWorkspace={state,snapshot:reportData,refresh,setView,setProperty,select:workspace.select,cacheStats:workspace.cacheStats,whenIdle:()=>pendingChange,whenReady:()=>ready,serviceAvailable:()=>serviceAvailable};

if(typeof globalThis.fetch==='function'&&/^https?:$/.test(globalThis.location?.protocol||'')){
 const client=createCoverageClient(globalThis.fetch.bind(globalThis));
 ready=client.probe().then(available=>{serviceAvailable=available;if(available){workspace.setCoverageLoader(request=>client.load(request));customPointLoader=request=>client.preparePoint(request);monthlyLoader=request=>client.monthly(request);}refresh();return available;});
}
