import {productVersion} from './product-version.mjs';
import {demoMarkup,bindDemoPlayer} from './demo-video.mjs';
import {scheduleMarkup} from './schedule-ui.mjs';
import {terrainScreeningMarkup} from './terrain-ui.mjs';
import {logisticsScreeningMarkup} from './logistics-ui.mjs';
import {thermalScreeningMarkup} from './thermal-ui.mjs';
import {compareMarkup,compareInputKey} from './compare-ui.mjs';
import {displaySiteName,terrainPreview,compactExplanation,calendarIcon,clockIcon} from './scene-presentation.mjs';
import {workspaceShell,screeningSections} from './ui-shell.mjs';
import {missionDraft,missionSettingsMarkup,readMissionDraft} from './mission-settings.mjs';
import {assessedTerrain} from './screening-view.mjs';
import {terrainRoute} from './routes.mjs';
import {createEnsembleClient,ensembleRequestKey} from './ensemble-client.mjs';
import {evidenceUiContent} from './evidence-ui.mjs';
import {evidenceReferenceContent,evidenceRegistry} from './evidence-reference.mjs';
import {seismicAssessment,seismicCatalog,loadSeismicWaveform,seismicWaveformWindow,seismicWaveformCsv} from './seismic.mjs';
import {seismicScreeningMarkup,seismicFeature,updateSeismicCursor} from './seismic-ui.mjs';
import {reportMarkup} from './report-ui.mjs';
import {defaultReportOptions,selectedReport,canonicalReportInput,reportHash,timeSeriesCsv} from './report-payload.mjs';
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
import {HOUR,DAY,clamp,startTime,evaluate,explain,nextSet,findAlternative,terrainScreen,visibilityRecord} from './engine.mjs';
import {createWorkspace} from './store.mjs';
import {horizonChart,skyplot,updateHorizonMarkers,timelineSvg,terrainMap,escapeHtml as esc} from './charts.mjs';
import {coverage,challengeUrl} from './coverage.mjs';
import {mountViewport} from './viewport.mjs';
import {screeningContent} from './screening-view.mjs';
import {evidenceContent} from './evidence-view.mjs';
import {createCoverageClient} from './coverage-client.mjs';
import {calendarContent} from './calendar-view.mjs';
import {nasaReferenceMarkup} from './nasa-reference.mjs';
import {scanStartWindows,startStudyKey,loadedWindows,startWindowMarkup,verifyStartSelection,startWindowReportMarkup} from './start-windows.mjs';

const workspace=createWorkspace(ephemeris,{science,terrainEvidence}),{state}=workspace,$=id=>document.getElementById(id);
// Start with Nobile selected, preserving both independent scientific scenarios.
const timelineMotion=matchMedia('(prefers-reduced-motion: reduce)');
workspace.select(new URLSearchParams(globalThis.location?.search||'').get('scenario')==='A'?'A':'B');
state.scene='terrain';state.speed=4;
if(globalThis.location?.search&&new URLSearchParams(globalThis.location.search).get('view')==='demo')state.view='demo';
const monthlyStudies=new Map();let monthlyLoader=null;const currentMonthly=()=>monthlyStudies.get(monthlyKey(state));
const startStudies=new Map(),currentStartStudy=()=>startStudies.get(startStudyKey(state,p()));
const ensembleStudies=new Map();let ensembleClient=null;
const ensembleRequest=()=>({siteId:active().site.id,radius:state.terrain.radius,baseline:state.terrain.baseline,limit:state.terrain.limit});
const currentEnsemble=()=>state.mode==='real'?ensembleStudies.get(ensembleRequestKey(ensembleRequest()))||null:null;
const root=$('root');
const loadingControls=new Map();
document.body.classList.add('ui1');
root.innerHTML=workspaceShell();
const viewportSection=$('viewport').closest('.viewport-section');
const ui={timelineAutoplay:true,celestial:true,screening:'terrain',terrainPresentation:'cinematic',screeningPresentation:'cinematic',overlays:{footprint:true,slope:true,route:false},terrainOverlays:{footprint:true,slope:true,route:true},settingsDraft:null,settingsDrafts:new Map(),comparePreview:null,comparePreviewDate:'',comparePreviewError:'',schedulePreview:null,evidence:'sources',evidenceQuery:'',evidenceSource:null};
ui.seismic={scope:'south',layers:{scarp:true,quake:true,impact:true,station:true},selected:null,catalog:'scarp',query:'',waveformId:'12-lm',window:'impact',cursor:0,playing:false};
const seismicWaves=new Map(),seismicPending=new Map(),seismicErrors=new Map();
function currentSeismicWaveform(){return seismicWaves.get(ui.seismic.waveformId)||null;}
function ensureSeismicWaveform(){
 const id=ui.seismic.waveformId;if(seismicWaves.has(id)||seismicPending.has(id)||seismicErrors.has(id))return;
 const promise=loadSeismicWaveform(id).then(record=>{seismicWaves.set(id,record);seismicErrors.delete(id);}).catch(error=>{seismicErrors.set(id,error.message);}).finally(()=>{seismicPending.delete(id);if(state.view==='screening'&&ui.screening==='seismic')renderScreening();});seismicPending.set(id,promise);
}
function selectSeismicWaveform(id){if(!seismicCatalog.waveforms.some(w=>w.id===id))return;ui.seismic.waveformId=id;ui.seismic.cursor=0;ui.seismic.playing=false;ui.seismic.selected='impact:'+id;renderScreening();$('content-screening').querySelector('.seismic-wave-panel')?.scrollIntoView?.({block:'nearest'});}
function setSeismicPlaying(value){ui.seismic.playing=!!value;const button=$('content-screening').querySelector('[data-action=seismic-play]');if(button){button.textContent=value?'\u2161':'\u25b6';button.setAttribute('aria-pressed',String(!!value));button.setAttribute('aria-label',(value?'Pause':'Play')+' archive waveform');}}
function fitSettingsSheet(){
 const d=$('mission-settings'),top=Math.max(54,innerHeight*86/992),timeline=document.querySelector('.timeline'),dock=['compare','calendar'].includes(state.view)||state.view==='screening'&&['terrain','logistics','thermal','seismic'].includes(ui.screening)?{top:innerHeight-24}:timeline.getBoundingClientRect();
 const scale=Math.min(1,Math.max(.4,(dock.top-top-18)/720));
 d.style.setProperty('--settings-scale',scale);d.style.setProperty('--settings-top',top+'px');
}
function openDialog(id){const d=$(id);if(!d.open){if(id==='mission-settings'){fitSettingsSheet();if(state.view==='layout')viewer?.setMode('terrain');if(d.show)d.show();else d.setAttribute('open','');d.querySelector('[data-settings-scenario]')?.focus({preventScroll:true});return;}if(d.showModal)d.showModal();else d.setAttribute('open','');}}
function closeDialog(id){const d=$(id);if(d.close)d.close();else d.removeAttribute('open');}
function fitExploreControls(){
 const controls=document.querySelector('.scene-controls'),horizon=$('horizon-drawer');
 if(state.view!=='layout'||innerWidth<721||document.body.dataset.renderedScene!=='terrain'){delete document.body.dataset.compactSceneControls;horizon.style.removeProperty('left');return;}
 delete document.body.dataset.compactSceneControls;
 const mission=$('mission-panel').getBoundingClientRect(),area=$('view-layout').getBoundingClientRect(),preview=controls.querySelector('.scene-thumbnail');
 const remaining=area.bottom-mission.bottom-28,other=controls.getBoundingClientRect().height-preview.getBoundingClientRect().height;
 const size=Math.min(146,Math.max(48,remaining-other));
 document.body.style.setProperty('--scene-preview-size',size+'px');
 if(remaining-other<72)document.body.dataset.compactSceneControls='true';
 const bounds=controls.getBoundingClientRect(),box=horizon.getBoundingClientRect();let left=Math.max(212,innerWidth*.142,bounds.right+18);
 if(mission.bottom+16>box.top)left=Math.max(left,mission.right+18);
 horizon.style.left=left+'px';
}
function switchSettingsScenario(id){
 if(loading||id===ui.settingsDraft?.scenarioId)return;
 try{const draft=readMissionDraft($('mission-form'),ui.settingsDraft.scenarioId);ui.settingsDrafts.set(draft.scenarioId,draft);workspace.select(id);ui.settingsDraft=ui.settingsDrafts.get(id)||missionDraft(state);$('mission-form').innerHTML=missionSettingsMarkup(ui.settingsDraft,workspace.availableSites(ui.settingsDraft.mode));syncSettingsLimits();invalidate();refresh();viewer?.update();}catch(error){$('settings-error').textContent=error.message;}
}
function syncSettingsLimits(){for(const [toggle,field] of [['enableDark','maxDark'],['enableEarth','maxEarth']]){const input=$('settings-'+field),enabled=$('settings-'+toggle);if(input&&enabled)input.disabled=loading||!enabled.checked;}}

let results={},providers={},proposal=null,searching=false,loading=false,serviceAvailable=false,customPointLoader=null,compareCoverageLoader=null,toastTimer,viewer,ready=Promise.resolve(false),pendingChange=Promise.resolve();
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
  const first=study.nominalFitWindows[0]?.firstStartUtc;ui.schedulePreview=first?{key,utc:first,...verifyStartSelection(study,first,scenario,requirements,provider)}:null;
  notify(study.tested+' supported starts checked; '+study.nominalFits+' nominal fits. Review uncertainty before applying.');
 }catch(error){notify(error.message);}finally{loading=false;$('coverage-progress').hidden=true;refresh();}
}
function renderEnsembleStudy(){const el=$('ensemble-study');if(!el)return;const study=currentEnsemble(),supported=!!terrainEvidence.sites[active().site.id]&&state.mode==='real';el.innerHTML=`<h3>Current-footprint correlated terrain study</h3><button class="primary" data-action="ensemble-study" ${!supported||!ensembleClient||loading?'disabled':''}>${loading?'Preparing terrain study…':'Evaluate 100 published realizations'}</button>${!supported?'<p class="field-note">No matching published clone set is prepared for this coordinate.</p>':!ensembleClient?'<p class="field-note">Run the local app to compute changed footprint settings. The prepared reference evidence remains below.</p>':''}${study?`<p>${study.members} source realizations · ${study.settings.radiusM} m radius / ${study.settings.baselineM} m baseline / ${study.settings.slopeLimitDeg}° limit.</p>${Object.entries(study.metrics).map(([key,q])=>`<div class="readout"><span>${esc({meanSlopeDeg:'Mean slope · degrees',maxSlopeDeg:'Maximum slope · degrees',p95SlopeDeg:'95th percentile slope · degrees',roughnessM:'Detrended roughness · m',usableAreaM2:'Area within slope limit · m²'}[key])}</span><strong>${fixed(q.p2_5,2)} – ${fixed(q.p97_5,2)}</strong></div>`).join('')}<p class="field-note">${esc(study.interpretation)}</p>`:'<p class="field-note">This study has not been evaluated for the current settings. Reference-footprint percentiles below retain their original settings.</p>'}`;}
async function runEnsembleStudy(){if(loading||!ensembleClient||state.mode!=='real')return;const request=ensembleRequest(),key=ensembleRequestKey(request);loading=true;state.playing=false;try{$('coverage-progress').textContent='Evaluating the 100 real terrain realizations for this footprint…';$('coverage-progress').hidden=false;refresh();const result=await ensembleClient.load(request);if(state.mode!=='real'||ensembleRequestKey(ensembleRequest())!==key)throw Error('Footprint changed during evaluation. Run the selected footprint again.');ensembleStudies.set(key,result);if(ensembleStudies.size>16)ensembleStudies.delete(ensembleStudies.keys().next().value);notify('Current-footprint ensemble evaluated. Empirical percentiles are not guaranteed confidence bounds.');}catch(error){notify(error.message);}finally{loading=false;$('coverage-progress').hidden=true;refresh();}}

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
function renderFloatingPanels(){
 const s=active(),res=r(),name=displaySiteName(s.site),date=new Date(startTime(s)),dateLabel=date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
 $('mission-panel').innerHTML=`<h2>Mission</h2><div class="mission-scenarios">${['A','B'].map(id=>`<button data-select="${id}" aria-pressed="${state.active===id}"><span class="scenario-tag">${id}</span><span>${esc(displaySiteName(state.scenarios[id].site))}</span><span class="selected-tick" aria-hidden="true">${state.active===id?'\u2713':''}</span></button>`).join('')}</div><div class="mission-date" title="${short(startTime(s))}">${calendarIcon}<span>${dateLabel}</span></div><div class="mission-duration">${clockIcon}<span>${fixed(state.requirements.duration/24,1).replace(/\.0$/,'')} days</span></div><button class="primary" data-view="compare">Compare dates</button><div class="mission-links"><button class="mission-settings-link" data-action="mission-settings" aria-label="Open mission settings">Mission settings <span aria-hidden="true">›</span></button><button class="mission-sites-link" data-action="sites" aria-label="Toggle site catalog">Sites</button></div>`;
 $('result-panel').innerHTML=`<div class="result-heading"><h2>${esc(name)}</h2><span class="status ${res.status}">${statusText(res)}</span></div><div class="summary-metrics">${[['sun','Sunlight'],['earth','Earth'],['overlap','Overlap']].map(([k,l])=>`<div><span>${l}</span><strong>${res.status==='insufficient_data'?'\u2014':pct(res.fractions[k])}</strong></div>`).join('')}</div><p class="result-explanation">${esc(compactExplanation(res))}</p><div class="mission-links"><button data-property="conditions" class="inspect-conditions-link" aria-label="Inspect full conditions and explanation">Conditions</button><button data-view="data">Review evidence <span aria-hidden="true">›</span></button></div>`;
 $('terrain-preview').innerHTML=terrainPreview(state.mode==='real'?p().entry:null);
 $('horizon-title').textContent='Local horizon \u2014 '+name;
 $('timeline-days').innerHTML=Array.from({length:7},(_,i)=>{const t=startTime(s)+i*state.requirements.duration*HOUR/7;return `<span>${new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}</span>`;}).join('');
}

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
 const current=ui.comparePreview?.key===compareInputKey(state)?ui.comparePreview:null;
 const previewDate=ui.comparePreviewDate||new Date(startTime(active())+9*DAY).toISOString().slice(0,16);
 const bounds=workspace.inputBounds();
 $('content-compare').innerHTML=compareMarkup({state,results,providers,preview:current,previewDate,busy:loading||searching,error:ui.comparePreviewError,statusText,explain,diagnosticsMarkup,proposalMarkup,modeNotice,bounds:{min:new Date(bounds.min).toISOString().slice(0,16),max:new Date(bounds.max).toISOString().slice(0,16)}});
 if(viewer?.comparisonPreview){const url=viewer.comparisonPreview();if(url)$('root').style.setProperty('--compare-terrain-image',`url("${url}")`);}
}
async function previewCompareStart(){
 if(loading)return;
 const input=$('compare-preview-date');ui.comparePreview=null;ui.comparePreviewError='';
 if(!input.value||!input.checkValidity()){ui.comparePreviewError='Choose a UTC date inside the supported complete interval.';renderCompare();return;}
 ui.comparePreviewDate=input.value;const date=input.value+(input.value.length===16?':00Z':'Z'),key=compareInputKey(state),scenario={...structuredClone(active()),date,offset:0},requirements={...state.requirements};
 loading=true;state.playing=false;refresh();
 try{
  const start=startTime(scenario),end=start+requirements.duration*HOUR;
  if(!p().covers(start,end)){
   if(state.mode!=='real'||!compareCoverageLoader)throw Error('This start is outside loaded coverage. Run the local scientific service to evaluate it.');
   const a=Math.max(Date.UTC(2027,0,1),Math.floor(start/DAY)*DAY-60*DAY),b=Math.min(Date.UTC(2034,0,1),Math.ceil(end/DAY)*DAY+60*DAY);
   const block=await compareCoverageLoader({siteId:scenario.site.id,start:new Date(a).toISOString(),end:new Date(b).toISOString()});
   if(compareInputKey(state)!==key)throw Error('Scenario or requirements changed. Preview this start again.');workspace.registerCoverage(block);
  }
  if(compareInputKey(state)!==key)throw Error('Scenario or requirements changed. Preview this start again.');
  const provider=workspace.provider(),result=evaluate(scenario,requirements,provider);
  if(result.status==='insufficient_data')throw Error('The complete mission interval is not covered. Previous scenarios are preserved.');
  ui.comparePreview={key,date,result};
 }catch(error){ui.comparePreviewError=error.message;}
 finally{loading=false;refresh();}
}

function gapsMarkup(res){
 if(!res.gaps)return '<p>No complete interval data. Gap duration is unknown.</p>';
 return ['dark','solar','earth'].map((key,i)=>`<section class="card"><h3>${['Continuous darkness','Below solar criterion','Earth invisibility'][i]}</h3><div class="large-number">${fixed(res.longest[key])} h</div><p>Longest within this assessment window.</p>${res.gaps[key].length?res.gaps[key].slice().sort((a,b)=>b.hours-a.hours).slice(0,5).map(g=>`<div class="gap-row"><span>${short(g.start)}<br>${short(g.end)}<br><small>${g.leftBoundary?'Starts at window boundary. ':''}${g.rightBoundary?'Ends at window boundary; full event may be longer.':''}${g.unknownBoundary?'Adjacent to missing data.':''}</small></span><b>${fixed(g.hours)} h</b></div>`).join(''):'<div class="gap-row">No sampled interruption within this window.</div>'}</section>`).join('');
}
function renderScreening(){
 if(!viewportSection.closest('#view-layout'))$('view-layout').prepend(viewportSection);
 if(ui.screening==='terrain'){
  const openPanels=[...$('content-screening').querySelectorAll('.terrain-live-study,.terrain-evidence-rows>details')].map(d=>d.open),terrain=assessedTerrain(state,active().site,p());
  $('content-screening').innerHTML=terrainScreeningMarkup({state,site:active().site,provider:p(),terrain,route:terrainRoute(terrain,state.routeDirection),ensemble:currentEnsemble(),overlays:ui.terrainOverlays,presentation:ui.screeningPresentation,busy:loading,scenarioButtons,gapsMarkup,res:r()});
  $('screening-scene-slot').append(viewportSection);renderEnsembleStudy();$('content-screening').querySelectorAll('.terrain-live-study,.terrain-evidence-rows>details').forEach((d,i)=>d.open=!!openPanels[i]);
  if(viewer){state.scene='terrain';viewer.setMode('terrain');viewer.setActive?.(true);}return;
 }
 if(ui.screening==='seismic'){
  ensureSeismicWaveform();const waveform=currentSeismicWaveform();if(waveform){const range=seismicWaveformWindow(waveform,ui.seismic.window);ui.seismic.cursor=clamp(ui.seismic.cursor,range.fromMinute,range.toMinute);}
  $('content-screening').innerHTML=seismicScreeningMarkup({assessment:seismicAssessment(workspace),state,view:ui.seismic,waveform,error:seismicErrors.get(ui.seismic.waveformId),scenarioButtons});updateSeismicCursor($('content-screening'),waveform,ui.seismic.cursor,ui.seismic.window);
  if(viewer?.comparisonPreview){const url=viewer.comparisonPreview('logistics');if(url)$('root').style.setProperty('--seismic-terrain-image','url("'+url+'")');}return;
 }
 if(ui.screening==='logistics'){
  const open=[...$('content-screening').querySelectorAll('[data-logistics-disclosure][open]')].map(el=>el.dataset.logisticsDisclosure),engineeringOpen=!!$('content-screening').querySelector('.engineering-evidence[open]');
  $('content-screening').innerHTML=logisticsScreeningMarkup(workspace);$('content-screening').querySelectorAll('[data-logistics-disclosure]').forEach(el=>el.open=open.includes(el.dataset.logisticsDisclosure));const evidence=$('content-screening').querySelector('.engineering-evidence');if(evidence)evidence.open=engineeringOpen;
  if(viewer?.comparisonPreview){const url=viewer.comparisonPreview('logistics');if(url)$('root').style.setProperty('--logistics-terrain-image',`url("${url}")`);}return;
 }
 if(ui.screening==='thermal'){
  const open=[...$('content-screening').querySelectorAll('[data-thermal-disclosure][open]')].map(el=>el.dataset.thermalDisclosure);
  $('content-screening').innerHTML=thermalScreeningMarkup({workspace,provider:p(),busy:loading});$('content-screening').querySelectorAll('[data-thermal-disclosure]').forEach(el=>el.open=open.includes(el.dataset.thermalDisclosure));
  if(viewer?.comparisonPreview){const url=viewer.comparisonPreview('logistics');if(url)$('root').style.setProperty('--thermal-terrain-image',`url("${url}")`);}return;
 }
 $('content-screening').innerHTML=screeningContent({state,site:active().site,res:r(),provider:p(),gapsMarkup,scenarioButtons,section:ui.screening});
 if(['terrain','rescue'].includes(ui.screening)){
  const slot=document.createElement('section');slot.id='screening-scene-slot';slot.className='screening-scene';slot.setAttribute('aria-label','Source terrain visualization');$('content-screening').querySelector('.screen-select')?.after(slot);slot.append(viewportSection);
  if(viewer){state.scene='terrain';viewer.setMode('terrain');viewer.setActive?.(true);}
 }
}

function currentSchedulePreview(){return ui.schedulePreview?.key===startStudyKey(state,p())&&currentStartStudy()?ui.schedulePreview:null;}
function previewScheduleStart(utc){
 if(loading)return;const study=currentStartStudy(),verified=verifyStartSelection(study,utc,active(),state.requirements,p());ui.schedulePreview={key:startStudyKey(state,p()),utc,...verified};refresh();
}
function renderCalendar(){
 $('content-calendar').innerHTML=scheduleMarkup({state,provider:p(),result:r(),study:currentStartStudy(),monthly:currentMonthly(),preview:currentSchedulePreview(),busy:loading,canScan:loadedWindows(p()).length>0,canMonthly:state.mode==='real'&&serviceAvailable,statusText,scenarioButtons,dailyMarkup:calendarContent({workspace,provider:p(),scenarioButtons,modeNotice,statusText,serviceAvailable,compact:true})});
 if(viewer?.comparisonPreview){const url=viewer.comparisonPreview();if(url)$('root').style.setProperty('--compare-terrain-image',`url("${url}")`);}
}

function reportData(){const serialized=workspace.serialize();return {...serialized,seismicContext:seismicAssessment(workspace,serialized),interfaceVersion:productVersion.interface,prdVersion:productVersion.prd,terrainEnsembleStudy:currentEnsemble(),monthlyRobustness:monthlyReport(currentMonthly()),landingStartWindows:currentStartStudy()||null,challenge:{url:challengeUrl,assessment:'Coverage review, not NASA certification',requirements:coverage},visualization:{screeningTerrain:ui.screeningPresentation==='cinematic'?'Illustrative crater landscape; real slope cells and sampled routes projected schematically, not registered to measured landforms':'Selected source DEM and registered analysis overlays',exploreTerrain:ui.terrainPresentation==='cinematic'?'Illustrative crater landscape with schematic site marker; not measured geometry':'Source DEM terrain',globe:'NASA SVS CGI Moon Kit rendering maps; studio lighting and texture registration are illustrative',terrain:state.mode==='real'?'Selected NASA PGDA 5 m DEM patch; scientific horizon uses the per-scenario declared extent and source bands':'Procedural demonstration'}};}
ui.reportOptions={...defaultReportOptions};ui.reportSection='summary';ui.reportFormat='json';ui.reportReturnView='data';
let reportDigestKey=null,reportDigestPromise=null,reportDigestValue=null;
function currentExportReport(){return selectedReport(reportData(),ui.reportOptions,state.active);}
function renderReport(){
 const report=currentExportReport();
 $('content-report').innerHTML=reportMarkup({report,workspace,results,providers,section:ui.reportSection,format:ui.reportFormat,options:ui.reportOptions,active:state.active});
 if(viewer?.comparisonPreview){const url=viewer.comparisonPreview('logistics');if(url)$('root').style.setProperty('--evidence-terrain-image','url("'+url+'")');}
 const key=canonicalReportInput(report);
 if(key!==reportDigestKey){reportDigestKey=key;reportDigestValue=null;reportDigestPromise=reportHash(report);}
 const show=hash=>{if(state.view!=='report'||reportDigestKey!==key)return;reportDigestValue=hash;const output=$('content-report').querySelector('[data-report-hash]'),button=$('content-report').querySelector('[data-action=copy-report-hash]');if(output){output.textContent=hash?hash.slice(0,9)+'\u2026'+hash.slice(-5):'Unavailable';output.title=hash||'Web Crypto unavailable; no digest claimed';output.dataset.sha256=hash||'';}if(button)button.disabled=!hash;};
 if(reportDigestValue)show(reportDigestValue);else reportDigestPromise.then(show).catch(()=>show(null));
}
function renderData(){
 $('content-data').innerHTML=evidenceReferenceContent({science,workspace,provider:p(),section:ui.evidence,query:ui.evidenceQuery,selected:ui.evidenceSource,group:ui.evidenceGroup||'terrain'});
 if(viewer?.comparisonPreview){const url=viewer.comparisonPreview('logistics');if(url)$('root').style.setProperty('--evidence-terrain-image',`url("${url}")`);}
}

function refresh(skipProperties=false){
 for(const id of ['A','B']){providers[id]=workspace.provider(id);results[id]=workspace.result(id);}
 document.body.dataset.detail=state.detail;document.body.dataset.view=state.view;document.body.dataset.screening=ui.screening;
 $('compare-navigation').hidden=!['compare','calendar'].includes(state.view);$('screening-navigation').hidden=state.view!=='screening';
 document.querySelectorAll('[data-screening]').forEach(b=>{const yes=b.dataset.screening===ui.screening;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});
 document.querySelectorAll('[data-view]').forEach(b=>{if(b.getAttribute('role')==='tab'){const yes=b.closest('.ws-tabs')?b.dataset.view===(state.view==='calendar'?'compare':state.view==='report'?'data':state.view):b.dataset.view===state.view;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;}});
 document.querySelectorAll('[data-detail]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.detail===state.detail)));
 document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===state.scene)));
 for(const view of ['layout','compare','screening','calendar','report','data','demo'])$('view-'+view).hidden=view!==state.view;
 renderOutliner();$('compare-strip').innerHTML=card('A')+card('B');renderFloatingPanels();
 if(!skipProperties)renderProperties();
 if(state.view==='compare')renderCompare();else if(state.view==='screening')renderScreening();else if(state.view==='calendar')renderCalendar();else if(state.view==='report')renderReport();else if(state.view==='data')renderData();else if(state.view==='demo'&&!$('content-demo').firstElementChild){$('content-demo').innerHTML=demoMarkup();bindDemoPlayer($('content-demo'),notify);}
 $('timeline-bars').innerHTML=timelineSvg(r());$('time').max=state.requirements.duration;
 $('viewport-name').textContent='Scenario '+state.active+' · '+active().site.name;
 $('viewport-coordinate').textContent=fixed(active().site.lat,3)+'° N, '+fixed(active().site.lon,3)+'° E · reference coordinate';
 $('viewport-note').textContent=state.scene==='moon'?'Moon maps: NASA’s Scientific Visualization Studio · artistic studio lighting':state.mode==='real'&&p().entry?'NASA PGDA elevation grid · exaggerated Sun/Earth markers · local patch':'Procedural terrain and exaggerated Sun/Earth markers · not a measured site';
 $('scene-data-label').textContent=state.scene==='moon'?'Rendering maps · reference pin':state.mode==='real'&&p().entry?'Real NASA DEM · local patch':'Procedural surface · visual only';
 $('horizon-label').textContent=state.mode==='real'?`Real DEM · ${p().terrain?.horizon.extentM/1000} km nominal extent`:state.mode==='sample'?'Synthetic profile':'Reference tangent · no DEM';
 $('status-mode').textContent=state.mode==='real'?'REAL NASA DEM + DE421 · BOUNDED MODEL':state.mode==='sample'?'SYNTHETIC DEMO':'JPL REFERENCE · TERRAIN UNASSESSED';$('status-result').textContent='Scenario '+state.active+': '+statusText(r());
 document.querySelectorAll('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.select===state.active)));
 clock();viewer?.update();requestAnimationFrame(fitExploreControls);root.setAttribute('aria-busy',String(loading));if(loading)root.querySelectorAll('input,select,[data-site],[data-select],[data-calendar],[data-start-window],[data-action=start-window-scan],[data-action=custom],[data-action=apply-preview],[data-action=reset-preview],[data-action=search],[data-action=preview-found],[data-action=plume-add],[data-action=plume-remove]').forEach(el=>{if(!loadingControls.has(el))loadingControls.set(el,el.disabled);el.disabled=true;});else{for(const [el,disabled] of loadingControls)if(el.isConnected)el.disabled=disabled;loadingControls.clear();}
}
let horizonRenderCache=null;
function syncTimelinePlayback(){const next=ui.timelineAutoplay&&state.view==='layout'&&!loading&&!document.hidden&&!timelineMotion.matches&&!document.querySelector('dialog[open]');const changed=state.playing!==next;state.playing=next;return changed;}
function clock(){
 syncTimelinePlayback();
 const t=startTime(active())+state.hour*HOUR;$('clock').textContent=new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});$('clock').title=short(t);$('time').setAttribute('aria-valuetext',short(t));$('elapsed').textContent='T+ '+fixed(state.hour)+' / '+state.requirements.duration+' h';
 $('time').value=state.hour;$('tl-cursor').style.left=(state.hour/state.requirements.duration*100)+'%';
 if(state.view==='layout'&&$('horizon-drawer').open){
  const host=$('horizon-chart'),polar=$('horizon-skyplot'),width=host.clientWidth,height=host.clientHeight,res=r(),provider=p();
  if(!horizonRenderCache||horizonRenderCache.result!==res||horizonRenderCache.provider!==provider||horizonRenderCache.width!==width||horizonRenderCache.height!==height||!host.firstElementChild||!polar.firstElementChild){
   host.innerHTML=horizonChart(res,provider,t,{width,height});polar.innerHTML=skyplot(res,provider,t);horizonRenderCache={result:res,provider,width,height};
  }else updateHorizonMarkers(host.firstElementChild,polar.firstElementChild,provider.geometry(t));
  const readouts=`<div class="readout"><span>Sunset</span><strong>${eventLabel(nextSet(res,t,'lit'))}</strong></div><div class="readout"><span>Earthset</span><strong>${eventLabel(nextSet(res,t,'earth'))}</strong></div>`;
  if($('horizon-readouts').innerHTML!==readouts)$('horizon-readouts').innerHTML=readouts;
 }


 if(state.view==='compare'){
  const plots=[...$('content-compare').querySelectorAll('.skyplot')];
  ['A','B'].forEach((id,i)=>{if(plots[i])plots[i].outerHTML=skyplot(results[id],providers[id],startTime(state.scenarios[id])+state.hour*HOUR);});
 }
 if(state.property==='conditions'){const plot=$('prop-body').querySelector('.skyplot');if(plot)plot.outerHTML=skyplot(r(),p(),t);}
 renderLiveConditions();
 $('play').textContent=state.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',state.playing?'Pause timeline':'Play timeline');$('play').setAttribute('aria-pressed',String(state.playing));
 $('play-hint').textContent=timelineMotion.matches?'Motion reduced':loading?'Preparing data':document.querySelector('dialog[open]')?'Paused for editing':state.playing?'Click to pause':'Click to play';$('play').title=state.playing?'Click to pause animation · Space':timelineMotion.matches?'Reduced motion is enabled':'Click to play animation · Space';
}
function invalidate(){proposal=null;ui.comparePreview=null;ui.comparePreviewError='';state.playing=false;}
function setView(view){ui.seismic.playing=false;if(view==='report'&&state.view!=='report')ui.reportReturnView=state.view;if(!['layout','compare','screening','calendar','report','data','demo'].includes(view))return;if(state.view==='demo'&&view!=='demo')$('demo-video')?.pause();if(view==='demo')state.playing=false;if(view!==state.view&&$('mission-settings').open)closeDialog('mission-settings');if(view!=='screening'&&!viewportSection.closest('#view-layout'))$('view-layout').prepend(viewportSection);state.view=view;closeDialog('inspector');state.property='scenario';viewer?.setActive?.(view==='layout'||view==='screening'&&['terrain','rescue'].includes(ui.screening));refresh();}
function setProperty(property){state.property=property;if(property==='resources'){ui.screening='logistics';setView('screening');return;}renderProperties();openDialog('inspector');}
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function exportJson(){
 const report=currentExportReport();report.canonicalHashProtocol=productVersion.canonicalHashProtocol;report.canonicalInputsSha256=await reportHash(report);
 report.hashStatus=report.canonicalInputsSha256?'SHA-256 generated locally':'Web Crypto unavailable; no digest claimed';download(JSON.stringify(report,null,2),'sitelight-evidence-report.json','application/json');
}
function exportCsv(){
 const rows=[['scenario','classification','kind','start_utc','end_utc','duration_h','left_boundary','right_boundary','unknown_boundary']];
 for(const id of ui.reportOptions.comparison?['A','B']:[state.active])for(const [kind,gaps] of Object.entries(results[id].gaps||{}))for(const g of gaps)rows.push([id,results[id].classification,kind,utc(g.start),utc(g.end),g.hours,g.leftBoundary,g.rightBoundary,g.unknownBoundary]);
 download(rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n'),'sitelight-interruption-intervals.csv','text/csv');
}
function search(){
 if(searching||loading)return;searching=true;proposal=null;const activeId=state.active,inputs=JSON.stringify(workspace.serialize()),scn=structuredClone(active()),req={...state.requirements},provider=p();refresh();
 setTimeout(()=>{try{if(state.active!==activeId||JSON.stringify(workspace.serialize())!==inputs){notify('Inputs changed. Run the search again.');return;}proposal=findAlternative(scn,req,provider);state.property='constraints';notify(proposal.scenario?'A nominally suitable daily sample was tested. Review its model scope and uncertainty.':'No passing sample found in the tested available coverage.');}catch(e){notify(e.message);}finally{searching=false;refresh();}},30);
}
root.addEventListener('click',event=>{
 const feature=event.target.closest('[data-seismic-feature]');if(feature){event.preventDefault();if(seismicFeature(feature.dataset.seismicFeature)){ui.seismic.selected=feature.dataset.seismicFeature;renderScreening();$('content-screening').querySelector('.seismic-inspector')?.scrollIntoView?.({block:'nearest'});}return;}
 const b=event.target.closest('button');if(!b||b.disabled)return;
 try{
  if(b.dataset.view){setView(b.dataset.view);return;}
  if(b.dataset.screening){ui.screening=b.dataset.screening;setView('screening');return;}
  if(b.dataset.seismicCatalog){if(['scarp','quake','impact','station'].includes(b.dataset.seismicCatalog)){ui.seismic.catalog=b.dataset.seismicCatalog;ui.seismic.query='';renderScreening();}return;}
  if(b.dataset.seismicScope){if(['south','north','global'].includes(b.dataset.seismicScope)){ui.seismic.scope=b.dataset.seismicScope;renderScreening();}return;}
  if(b.dataset.seismicWaveform){selectSeismicWaveform(b.dataset.seismicWaveform);return;}
  if(b.dataset.reportSection){ui.reportSection=b.dataset.reportSection;renderReport();return;}
  if(b.dataset.evidenceSection){ui.evidence=b.dataset.evidenceSection;renderData();return;}
  if(b.dataset.evidenceLayer||b.dataset.evidenceGroup){ui.evidenceGroup=b.dataset.evidenceGroup||b.dataset.evidenceLayer;ui.evidenceSource=null;ui.evidenceQuery='';renderData();return;}
  if(b.dataset.evidenceSource){ui.evidenceSource=b.dataset.evidenceSource;const record=evidenceRegistry({science,provider:p()}).find(r=>String(r.index)===b.dataset.evidenceSource);ui.evidenceGroup=({'Terrain':'terrain','Geometry':'geometry','Stereo':'stereo','Historical thermal':'thermal','NASA reference':'nasa','Research models':'research','Other provenance':'other','Seismic history':'seismic'})[record?.category]||'terrain';renderData();const metadata=$('content-data').querySelector('.evidence-metadata');if(metadata)metadata.open=true;return;}
  if(b.dataset.action==='edit-compare-scenario'){workspace.select(b.dataset.select);invalidate();refresh();ui.settingsDraft=missionDraft(state);ui.settingsDrafts.clear();$('mission-form').innerHTML=missionSettingsMarkup(ui.settingsDraft,workspace.availableSites(ui.settingsDraft.mode));syncSettingsLimits();openDialog('mission-settings');return;}
  if(b.dataset.settingsScenario){switchSettingsScenario(b.dataset.settingsScenario);return;}
  if(b.dataset.select){if($('mission-settings').open){switchSettingsScenario(b.dataset.select);return;}workspace.select(b.dataset.select);invalidate();refresh();return;}
  if(b.dataset.site){void requestScenarioChange(()=>workspace.setSite(b.dataset.site));return;}
  if(b.dataset.property){setProperty(b.dataset.property);return;}
  if(b.dataset.detail){state.detail=b.dataset.detail;refresh();return;}
  if(b.dataset.scene){state.scene=b.dataset.scene;viewer.setMode(state.scene);refresh();return;}
  if(b.dataset.terrainPresentation){ui.terrainPresentation=b.dataset.terrainPresentation;viewer?.reset();viewer?.update();refresh();return;}
  if(b.dataset.screeningPresentation){ui.screeningPresentation=b.dataset.screeningPresentation;viewer?.reset();viewer?.update();refresh();return;}
  if(b.dataset.calendar){void requestScenarioChange(()=>workspace.setOffset(Number(b.dataset.calendar)));return;}
  if(b.dataset.monthlyDate){if(loading)return;const block=monthlyDateBlock(currentMonthly(),b.dataset.monthlyDate);workspace.registerCoverage(block);void requestScenarioChange(()=>workspace.setDate(block.start));return;}
  if(b.dataset.schedulePreview){previewScheduleStart(b.dataset.schedulePreview);return;}
  if(b.dataset.startWindow){if(loading)return;const {candidate}=verifyStartSelection(currentStartStudy(),b.dataset.startWindow,active(),state.requirements,p());void requestScenarioChange(()=>workspace.setDate(candidate.date));return;}
  const action=b.dataset.action;
  if(action==='seismic-sources'){ui.evidence='sources';ui.evidenceGroup='seismic';ui.evidenceQuery='';ui.evidenceSource=null;setView('data');return;}
  if(action==='seismic-terrain'){ui.screening='terrain';setView('screening');return;}
  if(action==='seismic-wave-retry'){seismicErrors.delete(ui.seismic.waveformId);renderScreening();return;}
  if(action==='seismic-play'){const wave=currentSeismicWaveform();if(!wave)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){notify('Reduced motion is enabled. Use the archive cursor slider.');return;}const range=seismicWaveformWindow(wave,ui.seismic.window);if(ui.seismic.cursor>=range.toMinute)ui.seismic.cursor=range.fromMinute;setSeismicPlaying(!ui.seismic.playing);return;}
  if(action==='seismic-wave-csv'){const wave=currentSeismicWaveform();if(wave)download(seismicWaveformCsv(wave),'sitelight-apollo-'+wave.metadata.id+'-lpz.csv','text/csv');return;}
  if(action==='report-close'){setView(ui.reportReturnView||'data');return;}
  if(action==='copy-report-hash'){if(reportDigestValue){const hash=reportDigestValue;void navigator.clipboard.writeText(hash).then(()=>notify('Full canonical SHA-256 copied.')).catch(()=>notify('Clipboard unavailable. The full SHA-256 is available in the hash tooltip and JSON report.'));}return;}
  if(action==='export-series'){download(timeSeriesCsv(results,ui.reportOptions.comparison?['A','B']:[state.active]),'sitelight-time-series.csv','text/csv');return;}
  if(action==='dust-update'){if(loading)return;workspace.setDust({enabled:true});refresh();return;}
  if(b.dataset.logisticsStep){const key=b.dataset.logisticsStep,step=key==='ice'?.1:100,value=key==='ice'?state.logistics.ice[state.active]:state.logistics.budgetKg,next=Number(Math.min(key==='ice'?6:10000000,Math.max(0,value+Number(b.dataset.direction)*step)).toFixed(3));workspace.setLogistics(key==='ice'?{ice:{[state.active]:next}}:{budgetKg:next});refresh();return;}
  if(action==='terrain-evidence'){ui.evidence='sources';ui.evidenceQuery=active().site.tile||'PGDA';ui.evidenceSource=null;setView('data');return;}
  if(action==='compare-preview'){pendingChange=previewCompareStart();return;}
  if(action==='compare-apply'){const preview=ui.comparePreview;if(!preview||preview.key!==compareInputKey(state)||preview.result.status==='insufficient_data'){notify('Preview the current start again before applying.');return;}const result=evaluate({...active(),date:preview.date,offset:0},state.requirements,p());if(result.status==='insufficient_data'){ui.comparePreview=null;renderCompare();return;}void requestScenarioChange(()=>workspace.setDate(preview.date));return;}
  if(action==='ensemble-study'){pendingChange=runEnsembleStudy();return;}
  if(action==='mission-settings'){if(loading)return;ui.settingsDrafts.clear();ui.settingsDraft=missionDraft(state);$('mission-form').innerHTML=missionSettingsMarkup(ui.settingsDraft,workspace.availableSites(ui.settingsDraft.mode));syncSettingsLimits();openDialog('mission-settings');return;}
  if(action==='cancel-settings'){if(loading){notify('Settings are being checked. Wait for the current request to finish.');return;}ui.settingsDraft=null;closeDialog('mission-settings');return;}
  if(action==='advanced-coordinates'){ui.settingsDraft=null;closeDialog('mission-settings');setProperty('scenario');return;}
  if(action==='close-inspector'){closeDialog('inspector');return;}
  if(action==='toggle-horizon'){setView('layout');$('horizon-drawer').open=!$('horizon-drawer').open;clock();return;}
  if(action==='plume-add'||action==='plume-remove'){if(loading)return;if(action==='plume-add')workspace.addPlumeAsset();else workspace.removePlumeAsset(b.dataset.assetId);refresh();return;}
  if(action==='schedule-apply'){const preview=currentSchedulePreview();if(!preview||loading){notify('Preview a current tested start before applying.');return;}const {candidate}=verifyStartSelection(currentStartStudy(),preview.utc,active(),state.requirements,p());void requestScenarioChange(()=>workspace.setDate(candidate.date));return;}
  if(action==='monthly-study'){pendingChange=runMonthlyStudy();return;}
  if(action==='start-window-scan'){pendingChange=runStartScan();return;}
  if(action==='sites'){$('workspace').classList.toggle('show-sites');return;}
  if(action==='guide'||action==='evidence-guide'){openDialog('guide');return;}if(action==='close-guide'){closeDialog('guide');return;}
  if(action==='zoom-in'){viewer.zoom(-3);return;}if(action==='zoom-out'){viewer.zoom(3);return;}if(action==='reset-camera'){viewer.reset();return;}
  if(action==='play'){if(timelineMotion.matches){notify('Reduced motion is enabled. Use the timeline slider or step buttons.');return;}ui.timelineAutoplay=!ui.timelineAutoplay;if(ui.timelineAutoplay&&state.hour>=state.requirements.duration)state.hour=0;clock();return;}
  if(['start','end','step-back','step-forward'].includes(action)){ui.timelineAutoplay=false;state.playing=false;state.hour=action==='start'?0:action==='end'?state.requirements.duration:clamp(state.hour+(action==='step-back'?-1:1),0,state.requirements.duration);clock();return;}
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
 if(event.target.hasAttribute('data-seismic-query')){const input=event.target,position=input.selectionStart;ui.seismic.query=input.value;renderScreening();const replacement=$('content-screening').querySelector('[data-seismic-query]');replacement.focus({preventScroll:true});replacement.setSelectionRange(position,position);return;}
 if(event.target.hasAttribute('data-seismic-cursor')){setSeismicPlaying(false);const value=Number(event.target.value);if(Number.isFinite(value)){ui.seismic.cursor=value;updateSeismicCursor($('content-screening'),currentSeismicWaveform(),value,ui.seismic.window);}return;}
 if(event.target.dataset.dustRange){const target=$('thermal-dust-coverage');if(target)target.value=event.target.value;event.target.style.setProperty('--dust-progress',event.target.value+'%');return;}
 if(event.target.dataset.logisticsRange){const target=$('logistics-'+event.target.dataset.logisticsRange);if(target)target.value=event.target.value;event.target.style.setProperty('--ice-progress',Number(event.target.value)/6*100+'%');return;}
 if(event.target.dataset.terrainRange){const key=event.target.dataset.terrainRange,target=$('terrain-screen-'+key);if(target)target.value=event.target.value;return;}
 if(loading)return;
 if(event.target.hasAttribute('data-evidence-query')){const input=event.target,position=input.selectionStart;ui.evidenceQuery=input.value;renderData();const next=$('evidence-source-query');next?.focus();next?.setSelectionRange?.(position,position);return;}
 const input=event.target;if(input.id==='compare-preview-date'){ui.comparePreviewDate=input.value;ui.comparePreview=null;ui.comparePreviewError='';const apply=$('content-compare').querySelector('[data-action=compare-apply]');if(apply)apply.disabled=true;return;}if(input.id==='time'){ui.timelineAutoplay=false;state.playing=false;state.hour=Number(input.value);clock();}
 if(input.id==='offset'){
  const value=Number(input.value),s={...active(),offset:value},a=startTime(s),b=a+state.requirements.duration*HOUR;
  if(workspace.canPreview(value)&&p().covers(a,b)){workspace.setOffset(value);invalidate();$('offset-value').textContent=(value>0?'+':'')+value+' days';refresh(true);}
  else if($('offset-value'))$('offset-value').textContent=(value>0?'+':'')+value+' days · release to load';
 }
});
$('mission-form').addEventListener('change',event=>{
 syncSettingsLimits();
 if(event.target.id!=='settings-mode'||loading)return;const mode=event.target.value,select=$('settings-site'),old=select.value,list=workspace.availableSites(mode);select.innerHTML=list.map(s=>`<option value="${s.id}" ${s.id.replace(/^real-/,'')===old.replace(/^real-/,'')?'selected':''}>${esc(s.name)}</option>`).join('');
});
$('mission-form').addEventListener('input',event=>{
 const input=event.target,key=input.dataset.settingsRange;
 if(key){$('settings-'+key).value=input.value;input.style.setProperty('--fill',Number(input.value)/Number(input.max)*100+'%');}
 else if(input.id?.startsWith('settings-')){const range=$('mission-form').querySelector(`[data-settings-range="${input.id.slice(9)}"]`);if(range){range.value=input.value;range.style.setProperty('--fill',Number(range.value)/Number(range.max)*100+'%');}}
});
$('mission-form').addEventListener('click',event=>{
 const button=event.target.closest('[data-settings-mode]');if(!button||loading)return;
 $('settings-mode').value=button.dataset.settingsMode;$('settings-mode').dispatchEvent(new Event('change',{bubbles:true}));
});
$('mission-form').addEventListener('change',event=>{
 if(!['settings-mode','settings-site'].includes(event.target.id))return;
 const mode=$('settings-mode').value,site=workspace.availableSites(mode).find(s=>s.id===$('settings-site').value);
 $('mission-form').querySelectorAll('[data-settings-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.settingsMode===mode)));
 for(const [id,key] of [['lat','lat'],['lon','lon']])$('settings-'+id).textContent=Number.isFinite(site?.[key])?site[key].toFixed(4)+'°':'—';
 const observer=$('mission-form').querySelector('.settings-observer button');observer.textContent=Number.isFinite(site?.observerHeightM)?site.observerHeightM+' m':'Source inspector';
});
$('mission-form').addEventListener('submit',event=>{
 event.preventDefault();if(loading||!ui.settingsDraft)return;
 let draft;try{draft=readMissionDraft($('mission-form'),ui.settingsDraft.scenarioId);}catch(error){$('settings-error').textContent=error.message;return;}
 pendingChange=(async()=>{loading=true;state.playing=false;$('coverage-progress').textContent='Preparing the draft settings. Previous results remain until coverage is ready.';$('coverage-progress').hidden=false;refresh();$('mission-form').querySelectorAll('input,select,button').forEach(e=>e.disabled=true);
  try{if(draft.scenarioId!==state.active)throw Error('Active scenario changed; reopen mission settings.');await workspace.updateAsync(()=>{workspace.setMode(draft.mode);workspace.setSite(draft.siteId);workspace.setRequirements(draft.requirements);workspace.setDate(draft.date);});invalidate();ui.settingsDraft=null;closeDialog('mission-settings');}
  catch(error){$('settings-error').textContent=error.message;notify(error.message);}
  finally{loading=false;$('coverage-progress').hidden=true;$('mission-form').querySelectorAll('input,select,button').forEach(e=>e.disabled=false);syncSettingsLimits();refresh();}
 })();
});
$('mission-settings').addEventListener('cancel',event=>{if(loading)event.preventDefault();else ui.settingsDraft=null;});
$('mission-settings').addEventListener('close',()=>{if(state.view==='layout')viewer?.setMode(state.scene);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('mission-settings').open&&!loading){ui.settingsDraft=null;closeDialog('mission-settings');}});
window.addEventListener('resize',()=>{if($('mission-settings').open)fitSettingsSheet();});
root.addEventListener('sitelight-scenechange',()=>requestAnimationFrame(fitExploreControls));
const exploreLayoutObserver=new ResizeObserver(()=>requestAnimationFrame(fitExploreControls));exploreLayoutObserver.observe($('mission-panel'));exploreLayoutObserver.observe($('view-layout'));
$('horizon-drawer').addEventListener('toggle',()=>{if(state.view==='layout')clock();});
new ResizeObserver(()=>{if(state.view==='layout')requestAnimationFrame(()=>clock());}).observe($('horizon-chart'));
root.addEventListener('change',event=>{
 if(event.target.hasAttribute('data-celestial-toggle')){ui.celestial=event.target.checked;viewer?.update();return;}
 if(event.target.dataset.seismicLayer){const key=event.target.dataset.seismicLayer;if(Object.hasOwn(ui.seismic.layers,key)){ui.seismic.layers[key]=event.target.checked;renderScreening();$('content-screening').querySelector('[data-seismic-layer="'+key+'"]').focus({preventScroll:true});}return;}
 if(event.target.hasAttribute('data-seismic-projection')){if(['south','north','global'].includes(event.target.value)){ui.seismic.scope=event.target.value;renderScreening();$('content-screening').querySelector('[data-seismic-projection]').focus({preventScroll:true});}return;}
 if(event.target.hasAttribute('data-seismic-event')){selectSeismicWaveform(event.target.value);return;}
 if(event.target.hasAttribute('data-seismic-window')){if(['impact','full','late'].includes(event.target.value)){ui.seismic.window=event.target.value;ui.seismic.playing=false;renderScreening();$('content-screening').querySelector('[data-seismic-window]').focus({preventScroll:true});}return;}
 if(event.target.hasAttribute('data-seismic-cursor')||event.target.hasAttribute('data-seismic-query'))return;
 if(event.target.dataset.reportOption){const key=event.target.dataset.reportOption;if(Object.hasOwn(defaultReportOptions,key)){ui.reportOptions[key]=event.target.checked;renderReport();$('content-report').querySelector('[data-report-option="'+key+'"]').focus({preventScroll:true});}return;}
 if(event.target.hasAttribute('data-report-format')){if(['json','csv','print'].includes(event.target.value)){ui.reportFormat=event.target.value;renderReport();$('content-report').querySelector('[data-report-format][value="'+ui.reportFormat+'"]').focus({preventScroll:true});}return;}
 if(loading)return;
 if(event.target.closest('#mission-form'))return;
 if(event.target.dataset.overlay){const layers=state.view==='screening'&&ui.screening==='terrain'?ui.terrainOverlays:ui.overlays;layers[event.target.dataset.overlay]=event.target.checked;viewer?.update();return;}
 if(event.target.dataset.terrainSetting||event.target.dataset.terrainRange){const input=event.target,key=input.dataset.terrainSetting||input.dataset.terrainRange,restoreRangeFocus=!!input.dataset.terrainRange&&document.activeElement===input;try{if(input.value===''||!input.checkValidity())throw Error('Enter a valid footprint setting.');const patch={...state.terrain,[key]:Number(input.value)};terrainScreen(active().site,patch);state.terrain=patch;invalidate();refresh();if(restoreRangeFocus)$('content-screening').querySelector('[data-terrain-range="'+key+'"]').focus({preventScroll:true});}catch(error){notify(error.message);refresh();}return;}
 const radiationKey=event.target.dataset?.radiation;
 if(radiationKey){try{const input=event.target,isBoolean=['enabled','corrected'].includes(radiationKey),isText=['material','archiveMonth','detector'].includes(radiationKey);if(!isBoolean&&!isText&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid proton or archive assumption.');workspace.setRadiation({[radiationKey]:isBoolean?input.checked:isText?input.value:Number(input.value)});refresh();}catch(error){notify(error.message);refresh();}return;}
 const plumeAsset=event.target.dataset?.plumeAsset,plumeKey=event.target.dataset?.plume;
 if(plumeAsset||plumeKey){try{const input=event.target,key=plumeAsset?input.dataset.plumeField:plumeKey,isBoolean=key==='enabled',isText=key==='name';if(!isBoolean&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid ejecta or asset assumption.');const value=isBoolean?input.checked:isText?input.value:Number(input.value);if(plumeAsset)workspace.setPlumeAsset(plumeAsset,{[key]:value});else workspace.setPlume({[key]:value});refresh();}catch(error){notify(error.message);refresh();}return;}
 if(event.target.hasAttribute('data-thermal-site')){const siteId=event.target.value;void requestScenarioChange(()=>workspace.setSite(siteId));return;}
 const dustKey=event.target.dataset?.dust||event.target.dataset?.dustRange;
 if(dustKey){const input=event.target,isRange=!!input.dataset.dustRange,restoreFocus=document.activeElement===input;try{if(!['enabled','material'].includes(dustKey)&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid dust or radiator assumption.');workspace.setDust({[dustKey]:dustKey==='enabled'?input.checked:dustKey==='material'?input.value:Number(input.value)});refresh();if(restoreFocus)$('content-screening').querySelector('[data-dust'+(isRange?'-range':'')+'="'+dustKey+'"]')?.focus({preventScroll:true});}catch(error){notify(error.message);refresh();}return;}
 const rescueKey=event.target.dataset?.rescue;
 if(rescueKey){try{const input=event.target,isBoolean=['assetDeclared','available','returnRequired'].includes(rescueKey);if(!isBoolean&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid rescue assumption.');workspace.setRescue({[rescueKey]:isBoolean?input.checked:Number(input.value)});refresh();}catch(error){notify(error.message);refresh();}return;}
 if(event.target.id==='route-direction'){if(!routeDirections[event.target.value]){notify('Unknown route direction.');return;}state.routeDirection=event.target.value;refresh();return;}
 const logisticsKey=event.target.dataset?.logistics||event.target.dataset?.logisticsRange;if(logisticsKey){const input=event.target,isRange=!!input.dataset.logisticsRange,restoreFocus=document.activeElement===input,scope=input.closest('#content-screening')?'content-screening':'prop-body';try{if(logisticsKey!=='enabled'&&(input.value===''||!input.checkValidity()))throw Error('Enter a valid logistics assumption.');const value=Number(input.value);workspace.setLogistics(logisticsKey==='enabled'?{enabled:input.checked}:logisticsKey==='ice'?{ice:{[state.active]:value}}:logisticsKey==='budgetKg'?{budgetKg:value}:{inputs:{[logisticsKey]:value}});refresh();if(restoreFocus)$(scope)?.querySelector('[data-logistics'+(isRange?'-range':'')+'="'+logisticsKey+'"]')?.focus({preventScroll:true});}catch(error){notify(error.message);refresh();}return;}
 const input=event.target,id=input.id;if(loading)return;
 if(id==='compare-preview-date'){renderCompare();return;}if(id==='time'||id.startsWith('custom-'))return;
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
 const siblings=[...tab.parentElement.querySelectorAll('[role=tab]')].filter(button=>!button.hidden),index=siblings.indexOf(tab);let next=event.key==='Home'?0:event.key==='End'?siblings.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+siblings.length)%siblings.length;
 event.preventDefault();siblings[next].click();siblings[next].focus();
});
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!event.repeat&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName||'')&&!document.querySelector('dialog[open]')){event.preventDefault();if(state.view==='demo'){const video=$('demo-video');if(video?.paused)void video.play().catch(()=>notify('Press Play in the video controls.'));else video?.pause();}else if(state.view==='screening'&&ui.screening==='seismic')$('content-screening').querySelector('[data-action=seismic-play]')?.click();else $('play').click();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setSeismicPlaying(false);clock();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches){state.playing=false;setSeismicPlaying(false);clock();}});
refresh();
let lastViewportTerrain=null,lastRouteDirection=null,cachedViewportRoute=null;
function readViewport(){const terrain=assessedTerrain(state,active().site,p()),screeningTerrain=state.view==='screening'&&ui.screening==='terrain';if(terrain!==lastViewportTerrain||state.routeDirection!==lastRouteDirection){lastViewportTerrain=terrain;lastRouteDirection=state.routeDirection;cachedViewportRoute=terrainRoute(terrain,state.routeDirection);}return {presentation:state.view==='layout'?ui.terrainPresentation:screeningTerrain?ui.screeningPresentation:'measured',screeningTerrain,site:active().site,hour:state.hour,geometry:p().geometry(startTime(active())+state.hour*HOUR),celestial:visibilityRecord(startTime(active())+state.hour*HOUR,state.requirements,p()),showCelestial:ui.celestial,assessmentMode:state.mode,exploring:state.view==='layout',terrainGrid:state.mode==='real'?p().terrain?.grid:null,terrainConfig:state.terrain,terrainResult:terrain,route:cachedViewportRoute,overlays:screeningTerrain?ui.terrainOverlays:ui.overlays};}
viewer=mountViewport($('viewport'),readViewport,notify);
viewer?.setMode(state.scene);
if(state.view==='demo')viewer?.setActive?.(false);
let last=performance.now(),lastClock=0,playbackAccumulator=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;const playbackChanged=syncTimelinePlayback();if(ui.seismic.playing&&state.view==='screening'&&ui.screening==='seismic'&&!document.hidden){const wave=currentSeismicWaveform();if(wave){const range=seismicWaveformWindow(wave,ui.seismic.window);ui.seismic.cursor=Math.min(range.toMinute,ui.seismic.cursor+dt);updateSeismicCursor($('content-screening'),wave,ui.seismic.cursor,ui.seismic.window);if(ui.seismic.cursor>=range.toMinute)setSeismicPlaying(false);}}if(state.playing){playbackAccumulator+=dt;if(playbackAccumulator>=.05){state.hour=(state.hour+playbackAccumulator*state.speed)%state.requirements.duration;playbackAccumulator=0;}if(now-lastClock>100){clock();lastClock=now;}}else{playbackAccumulator=0;if(playbackChanged)clock();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.SiteLightWorkspace={state,snapshot:reportData,refresh,setView,setProperty,setScreening:section=>{if(!screeningSections.some(([id])=>id===section))throw Error('Unknown screening section');ui.screening=section;setView('screening');},select:workspace.select,cacheStats:workspace.cacheStats,whenIdle:()=>pendingChange,whenSeismicReady:()=>seismicPending.get(ui.seismic.waveformId)||Promise.resolve(),whenReady:()=>ready,serviceAvailable:()=>serviceAvailable};

if(typeof globalThis.fetch==='function'&&/^https?:$/.test(globalThis.location?.protocol||'')){
 const client=createCoverageClient(globalThis.fetch.bind(globalThis));
 ready=client.probe().then(available=>{serviceAvailable=available;if(available){workspace.setCoverageLoader(request=>client.load(request));compareCoverageLoader=request=>client.load(request);customPointLoader=request=>client.preparePoint(request);monthlyLoader=request=>client.monthly(request);ensembleClient=createEnsembleClient(globalThis.fetch.bind(globalThis),{science,terrainEvidence});}refresh();return available;});
}
