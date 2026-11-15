import {catalog,defaultRequirements} from './catalog.mjs';
import {createProvider,evaluate,makeScenario,startTime,parseUtc,validateCoordinates,validateRequirements,terrainScreen,DAY,HOUR} from './engine.mjs';
import {defaultRescue,rescueFields,rescueContext,rescueAssetMatches,validateRescue,assessRescue} from './rescue.mjs';
import {defaultDust,dustFields,validateDust,assessDust} from './dust.mjs';
import {defaultPlume,plumeFields,plumeAssetFields,validatePlume,assessPlume,plumeContext} from './plume.mjs';
import {defaultRadiation,radiationFields,validateRadiation,assessRadiation} from './radiation.mjs';
import {createRealProvider,realTerrainScreen} from './real-data.mjs';
import {defaultLogistics,evaluateLogistics,validateLogistics,findLogisticsFlip} from './logistics.mjs';
import {terrainRoute,skyContext} from './routes.mjs';
import {nasaReferenceAssessment} from './nasa-reference.mjs';
import {augmentRealProvider,terrainEvidenceSummary} from './terrain-evidence.mjs';
export function createWorkspace(bundle,{science=null,coverageLoader=null,terrainEvidence=null}={}){
 const realCatalog=science?Object.values(science.sites).map(e=>e.site):[],sites=[...realCatalog,...catalog];
 const state={mode:science?'real':'horizons',active:'A',view:'layout',property:'scenario',detail:'plain',scene:'moon',hour:0,playing:false,speed:12,
  scenarios:{A:makeScenario(sites[0]),B:makeScenario(realCatalog.find(s=>s.id==='real-nobile')||sites[1])},requirements:{...defaultRequirements},terrain:{radius:100,baseline:20,limit:12,missing:false},logistics:{enabled:false,budgetKg:18000,inputs:{...defaultLogistics},ice:{A:1,B:1}}};
 const providers=new Map(),results=new Map(),terrainResults=new Map(),extraBlocks=new Map(),statistics={providerHits:0,resultHits:0,resultMisses:0};
 let modeMemory=new Map();
 const availableSites=(mode=state.mode)=>mode==='real'?realCatalog:mode==='horizons'?catalog:sites;
 const buildProvider=(site,mode)=>mode==='real'?augmentRealProvider(createRealProvider(site,science,{blocks:extraBlocks.get(site.id)||[]}),site,science,terrainEvidence):createProvider(mode,site,bundle);
 const provider=(id=state.active)=>{const s=state.scenarios[id].site,key=JSON.stringify([state.mode,s.id,s.lat,s.lon,s.altKm]);if(providers.has(key)){statistics.providerHits++;return providers.get(key);}const p=buildProvider(s,state.mode);providers.set(key,p);if(providers.size>64)providers.delete(providers.keys().next().value);return p;};
 const result=(id=state.active)=>{const s=state.scenarios[id],key=JSON.stringify([state.mode,s.site.id,s.site.lat,s.site.lon,s.site.altKm,startTime(s),state.requirements]);if(results.has(key)){statistics.resultHits++;return results.get(key);}statistics.resultMisses++;const r=evaluate(s,state.requirements,provider(id));results.set(key,r);if(results.size>64)results.delete(results.keys().next().value);return r;};
 const terrainResult=(id=state.active)=>{const p=provider(id);if(state.mode!=='real'||!p.entry)return null;const key=JSON.stringify([p.entry.site.id,state.terrain]);if(terrainResults.has(key))return terrainResults.get(key);const r=realTerrainScreen(p.entry,state.terrain);terrainResults.set(key,r);if(terrainResults.size>64)terrainResults.delete(terrainResults.keys().next().value);return r;};
 function select(id){if(!['A','B'].includes(id))throw Error('Unknown scenario');state.active=id;state.hour=Math.min(state.hour,state.requirements.duration);}
 state.routeDirection='+X';
 state.radiation={A:{...defaultRadiation},B:{...defaultRadiation}};
 const radiationResult=(id=state.active)=>assessRadiation(state.radiation[id]);
 function setRadiation(patch,id=state.active){
  if(!['A','B'].includes(id)||!patch||typeof patch!=='object'||Object.keys(patch).some(k=>!Object.hasOwn(radiationFields,k)&&!['enabled','corrected','material','energyMeV','archiveMonth','detector'].includes(k)))throw Error('Unknown radiation setting.');
  const next={...state.radiation[id],...patch};validateRadiation(next);state.radiation[id]=next;
 }
 state.plume={A:structuredClone(defaultPlume),B:structuredClone(defaultPlume)};
 const plumeResult=(id=state.active)=>assessPlume(state.plume[id],plumeContext(state,id));
 function commitPlume(next,id){validatePlume(next);state.plume[id]=next;}
 function setPlume(patch,id=state.active){
  if(!['A','B'].includes(id)||!patch||typeof patch!=='object'||Object.keys(patch).some(k=>!Object.hasOwn(plumeFields,k)&&k!=='enabled'))throw Error('Unknown ejecta setting.');
  commitPlume({...state.plume[id],...patch},id);
 }
 function setPlumeAsset(assetId,patch,id=state.active){
  if(!['A','B'].includes(id)||!state.plume[id].assets.some(a=>a.id===assetId)||!patch||typeof patch!=='object'||Object.keys(patch).some(k=>!Object.hasOwn(plumeAssetFields,k)&&!['name','enabled'].includes(k)))throw Error('Unknown hypothetical asset setting.');
  commitPlume({...state.plume[id],assets:state.plume[id].assets.map(a=>a.id===assetId?{...a,...patch}:a)},id);
 }
 function addPlumeAsset(id=state.active){
  if(!['A','B'].includes(id))throw Error('Unknown scenario.');const old=state.plume[id],assetId=Array.from({length:5},(_,i)=>'asset-'+(i+1)).find(key=>!old.assets.some(a=>a.id===key));if(old.assets.length>=5||!assetId)throw Error('At most five hypothetical assets are supported.');
  commitPlume({...old,assets:[...old.assets,{id:assetId,name:'Hypothetical asset '+assetId.slice(6),enabled:true,distanceM:1000,bearingDeg:0,widthM:10,heightM:5}]},id);
 }
 function removePlumeAsset(assetId,id=state.active){if(!['A','B'].includes(id)||!state.plume[id].assets.some(a=>a.id===assetId))throw Error('Unknown hypothetical asset.');commitPlume({...state.plume[id],assets:state.plume[id].assets.filter(a=>a.id!==assetId)},id);}
 state.dust={A:{...defaultDust},B:{...defaultDust}};
 const dustResult=(id=state.active)=>assessDust(state.dust[id]);
 function setDust(patch,id=state.active){
  if(!['A','B'].includes(id)||!patch||typeof patch!=='object'||Object.keys(patch).some(k=>!Object.hasOwn(dustFields,k)&&!['enabled','material'].includes(k)))throw Error('Unknown dust setting.');
  const next={...state.dust[id],...patch};validateDust(next);state.dust[id]=next;
 }
 state.rescue={A:structuredClone(defaultRescue),B:structuredClone(defaultRescue)};
 const rescueTerrain=(id=state.active)=>state.mode==='sample'?terrainScreen(state.scenarios[id].site,state.terrain):terrainResult(id);
 const rescueResult=(id=state.active)=>{const settings=state.rescue[id],context=rescueContext(state,id),route=rescueAssetMatches(settings,context)&&settings.available?terrainRoute(rescueTerrain(id),state.routeDirection):null;return assessRescue(route,settings,context);};
 function setRescue(patch,id=state.active){
  if(!['A','B'].includes(id)||!patch||typeof patch!=='object'||Object.keys(patch).some(k=>!Object.hasOwn(rescueFields,k)&&!['assetDeclared','available','returnRequired'].includes(k)))throw Error('Unknown rescue setting.');
  const next={...state.rescue[id],...patch};
  if(Object.hasOwn(patch,'assetDeclared'))next.assetScope=patch.assetDeclared?rescueContext(state,id):null;
  validateRescue(next);state.rescue[id]=next;
 }
 const logisticsResult=(id=state.active)=>state.logistics.enabled?evaluateLogistics(state.logistics.inputs,state.logistics.ice[id],state.logistics.budgetKg):null;
 function setLogistics(patch){const next={...state.logistics,...patch,inputs:{...state.logistics.inputs,...patch.inputs},ice:{...state.logistics.ice,...patch.ice}};if(typeof next.enabled!=='boolean')throw Error('Logistics exploration must be enabled or disabled.');for(const id of ['A','B'])validateLogistics(next.inputs,next.ice[id],next.budgetKg);for(const id of ['A','B'])evaluateLogistics(next.inputs,next.ice[id],next.budgetKg);state.logistics=next;}
 const logisticsFlip=()=>findLogisticsFlip(state.logistics.inputs,state.logistics.budgetKg,state.logistics.ice[state.active]);
 function setSite(id){const site=availableSites().find(s=>s.id===id);if(!site)throw Error('This point belongs to another data mode. Choose a site with real coverage in the current list.');state.scenarios[state.active].site={...site};state.hour=0;}
 function setCustom(lat,lon,altKm){
  if(!validateCoordinates(lat,lon,altKm))throw Error('Latitude −90…90°, longitude −180…180°, altitude −10…20 km required.');
  if(state.mode!=='sample')throw Error('Custom points need their own terrain preparation. Choose a sourced study point; your current real scenario is preserved.');
  state.scenarios[state.active].site={id:'custom',name:'Custom reference point',lat,lon,altKm,polar:lat< -80,source:'User input',coordinateStatus:'User-provided coordinates',frame:'Horizons lunar mean-Earth reference sphere'};state.hour=0;
 }
 function registerCustomPoint(point){
  const entry=point?.entry,site=entry?.site;
  if(!point?.request||!entry?.coordinates||!validateCoordinates(site?.lat,site?.lon,site?.altKm))throw Error('Invalid prepared coordinate response.');
  if(state.mode!=='real'||point.schema!=='sitelight-custom-point-1'||point.frame!=='MOON_ME'||point.ephemeris!=='DE421'||point.correction!=='NONE'||point.preprocessingVersion!==science.version||point.sourceAlgorithm?.sha256!==science.algorithm.sha256||!site?.custom||site.id!==point.request.siteId||!Array.isArray(entry.records)||entry.records.length<2||![360,720,1440].includes(entry.terrain?.horizon?.elevationDeg?.length)||entry.terrain.horizon.elevationDeg.some(v=>!Number.isFinite(v)))throw Error('Custom terrain preparation did not meet the real-data coverage contract.');
  if(!['lat','lon','altKm'].every(k=>Number.isFinite(entry.coordinates[k]))||Math.abs(site.altKm*1000-site.surfaceElevationM-site.observerHeightM)>1e-6)throw Error('Prepared custom observer or terrain elevation is inconsistent.');
  if(!['lat','lon','altKm'].every(k=>site[k]===entry.coordinates[k])||![site.surfaceElevationM,site.observerHeightM].every(Number.isFinite)||site.observerHeightM<.1||site.observerHeightM>100||Math.abs(site.lat-point.request.lat)>1e-8||Math.abs(site.lon-point.request.lon)>1e-8||site.observerHeightM!==point.request.observerHeightM)throw Error('Prepared coordinate does not match the requested observer.');
  const horizon=entry.terrain.horizon,count=horizon.elevationDeg.length,grid=entry.terrain.grid;
  if(!Number.isFinite(horizon.azimuthStepDeg)||horizon.azimuthStepDeg<=0||Math.abs(horizon.azimuthStepDeg*count-360)>1e-8)throw Error('Inconsistent horizon angular sampling.');
  if(!Array.isArray(horizon.rayCoverage)||horizon.rayCoverage.length!==count||horizon.rayCoverage.some(v=>v!==1))throw Error('Prepared horizon rays do not have complete coverage.');
  if(!grid||!Number.isInteger(grid.size)||grid.size<3||grid.size>1025||grid.spacingM!==5||![grid.originX,grid.originY,grid.projectionScale].every(Number.isFinite)||grid.projectionScale<=0||!['elevationM','heightRmsM','publishedSlopeRmsDeg'].every(key=>Array.isArray(grid[key])&&grid[key].length===grid.size**2&&grid[key].every(v=>v===null||Number.isFinite(v))))throw Error('Prepared terrain grid is incomplete or malformed.');
  const rows=entry.records,first=Date.parse(point.start),last=Date.parse(point.end);
  if(!Number.isFinite(first)||!Number.isFinite(last)||first<Date.UTC(2027,0,1)||last>Date.UTC(2034,0,1)||rows.length>25921||rows[0]?.[0]!==first||rows.at(-1)?.[0]!==last)throw Error('Invalid custom date coverage.');
  for(let i=0;i<rows.length;i++){const row=rows[i];if(!Array.isArray(row)||row.length!==5||row.some(v=>!Number.isFinite(v))||i&&row[0]-rows[i-1][0]!==600000||row[1]<0||row[1]>=360||row[3]<0||row[3]>=360||Math.abs(row[2])>90||Math.abs(row[4])>90)throw Error('Invalid custom geometric records.');}
  const required=science.inputs.filter(s=>s.name.startsWith('kernels/')||s.name.startsWith('terrain/'+site.tile+'_')||s.name.startsWith('terrain/LDEM_80S'));
  if(!Array.isArray(entry.sources)||!required.every(s=>entry.sources.some(p=>p.name===s.name&&p.sha256===s.sha256)))throw Error('Custom terrain sources differ from pinned inputs.');
  const candidate={...state.scenarios[state.active],site},provider=createRealProvider(site,{...science,sites:{[site.id]:entry}});
  if(evaluate(candidate,state.requirements,provider).status==='insufficient_data')throw Error('Prepared custom point does not cover the current mission interval.');
  if(!realCatalog.some(s=>s.id===site.id))realCatalog.push(site);
  science.sites[site.id]=entry;extraBlocks.set(site.id,[{start:point.start,end:point.end,records:entry.records}]);providers.clear();results.clear();terrainResults.clear();
  state.scenarios[state.active].site={...site};state.hour=0;
 }
 function setDate(value){parseUtc(value);state.scenarios[state.active].date=value;state.scenarios[state.active].offset=0;state.hour=0;}
 function setOffset(days){if(!Number.isFinite(days)||days< -60||days>60)throw Error('Date preview must be within ±60 days.');const candidate={...state.scenarios[state.active],offset:days};const t=startTime(candidate);if(t<Date.UTC(2027,0,1)||t+state.requirements.duration*HOUR>Date.UTC(2034,0,1))throw Error('Preview is outside the supported target years.');state.scenarios[state.active].offset=days;state.hour=0;}
 function applyPreview(){const s=state.scenarios[state.active];s.date=new Date(startTime(s)).toISOString();s.offset=0;}
 function resetPreview(){state.scenarios[state.active].offset=0;state.hour=0;}
 function setRequirements(patch){const r={...state.requirements,...patch};validateRequirements(r);state.requirements=r;state.hour=Math.min(state.hour,r.duration);}
 function setMode(value){
  if(!['sample','horizons','real'].includes(value)||value==='real'&&!science)throw Error('Unknown data mode');if(value===state.mode)return;
  modeMemory.set(state.mode,structuredClone(state.scenarios));const previous=state.scenarios;state.mode=value;
  const remembered=modeMemory.get(value);
  state.scenarios=remembered?structuredClone(remembered):Object.fromEntries(['A','B'].map((id,i)=>{const list=availableSites(value),old=previous[id].site.id.replace(/^real-/,''),site=list.find(s=>s.id.replace(/^real-/,'')===old)||list[i%list.length];return [id,makeScenario(site)];}));state.hour=0;state.playing=false;
 }
 function registerCoverage(block){
  const e=science?.sites?.[block?.siteId];
  if(!e||block.schema!=='sitelight-date-block-1'||block.frame!=='MOON_ME'||block.ephemeris!=='DE421'||block.correction!=='NONE'||block.stepMinutes!==10||block.preprocessingVersion!==science.version||block.sourceAlgorithm?.sha256!==science.algorithm.sha256)throw Error('Unexpected scientific data response.');
  if(!['lat','lon','altKm'].every(k=>block.coordinates[k]===e.coordinates[k]))throw Error('Generated data do not match the selected coordinate.');
  const rows=block.records;if(!Array.isArray(rows)||rows.length<2||rows.length>25921||rows[0]?.[0]!==Date.parse(block.start)||rows.at(-1)?.[0]!==Date.parse(block.end))throw Error('Invalid generated time coverage.');
  for(let i=0;i<rows.length;i++){const r=rows[i];if(!Array.isArray(r)||r.length!==5||r.some(v=>!Number.isFinite(v))||i&&r[0]-rows[i-1][0]!==600000||r[1]<0||r[1]>=360||r[3]<0||r[3]>=360||Math.abs(r[2])>90||Math.abs(r[4])>90)throw Error('Invalid generated position records.');}
  const kernels=science.inputs.filter(r=>r.name.startsWith('kernels/'));if(!Array.isArray(block.sources)||!kernels.every(k=>block.sources.some(s=>s.name===k.name&&s.sha256===k.sha256)))throw Error('Generated source kernels do not match the pinned inputs.');
  const list=[block,...(extraBlocks.get(block.siteId)||[]).filter(b=>b.start!==block.start||b.end!==block.end)].slice(0,8);extraBlocks.set(block.siteId,list);providers.clear();results.clear();
 }
 const fingerprint=()=>JSON.stringify([state.mode,state.active,state.scenarios,state.requirements]);
 async function updateAsync(operation){
  const before=structuredClone(state),beforeMemory=new Map(modeMemory),token=fingerprint();let proposed,proposedMemory;
  try{operation();proposed=structuredClone(state);proposedMemory=new Map(modeMemory);}finally{Object.assign(state,before);modeMemory=beforeMemory;}
  for(const id of ['A','B']){
   const s=proposed.scenarios[id],a=startTime(s),b=a+proposed.requirements.duration*HOUR;
   if(a<Date.UTC(2027,0,1)||b>Date.UTC(2034,0,1))throw Error('The entire mission interval must stay within 2027–2033.');
   if(buildProvider(s.site,proposed.mode).covers(a,b))continue;
   if(proposed.mode!=='real'||!coverageLoader)throw Error('This date is outside the loaded records. Keep a covered date or run the local app to generate real records.');
   const start=Math.max(Date.UTC(2027,0,1),Math.floor(a/DAY)*DAY-60*DAY),end=Math.min(Date.UTC(2034,0,1),Math.ceil(b/DAY)*DAY+60*DAY);
   registerCoverage(await coverageLoader({siteId:s.site.id,start:new Date(start).toISOString(),end:new Date(end).toISOString()}));
   if(!buildProvider(s.site,proposed.mode).covers(a,b))throw Error('Generated records did not cover the complete mission interval.');
  }
  if(fingerprint()!==token)throw Error('Scenario changed while real records were loading. Try the selected change again.');
  for(const key of ['mode','active','scenarios','requirements','hour'])state[key]=proposed[key];state.playing=false;modeMemory=proposedMemory;
 }
 function setCoverageLoader(loader){coverageLoader=loader;}
 function inputBounds(id=state.active){
  const p=provider(id),bounds=state.mode==='sample'||state.mode==='real'&&coverageLoader?[Date.UTC(2027,0,1),Date.UTC(2034,0,1)]:p.coverage;
  const min=bounds?.[0]??Date.UTC(2027,0,1),max=(bounds?.[1]??Date.UTC(2034,0,1))-state.requirements.duration*HOUR,base=parseUtc(state.scenarios[id].date);
  return {min,max,minOffset:Math.max(-60,Math.ceil((min-base)/DAY)),maxOffset:Math.min(60,Math.floor((max-base)/DAY))};
 }
 function canPreview(offset,id=state.active){const s={...state.scenarios[id],offset},a=startTime(s),b=a+state.requirements.duration*HOUR;return Math.abs(offset)<=60&&a>=Date.UTC(2027,0,1)&&b<=Date.UTC(2034,0,1)&&(state.mode==='real'&&!!coverageLoader||provider(id).covers(a,b));}
 function serialize(){
  return {schema:'sitelight-workspace-2',classification:state.mode==='real'?'REAL DEM + GEOMETRIC EPHEMERIS; BOUNDED MULTISCALE MODEL':state.mode==='sample'?'SYNTHETIC DEMONSTRATION':'JPL REFERENCE GEOMETRY; REAL TERRAIN NOT ASSESSED',
   model:'workspace-evaluator-11',requirements:{...state.requirements},mode:state.mode,stepMinutes:10,nasaReferenceStudy:nasaReferenceAssessment(),terrainReferenceEvidence:{A:terrainEvidenceSummary(provider('A'),state.terrain),B:terrainEvidenceSummary(provider('B'),state.terrain)},
   radiationExploration:{settings:structuredClone(state.radiation),results:{A:radiationResult('A'),B:radiationResult('B')},acceptedForVerdict:false},
   plumeExploration:{settings:structuredClone(state.plume),results:{A:plumeResult('A'),B:plumeResult('B')},acceptedForVerdict:false},
   dustExploration:{settings:structuredClone(state.dust),results:{A:dustResult('A'),B:dustResult('B')},acceptedForVerdict:false},
   rescueExploration:{settings:structuredClone(state.rescue),results:{A:rescueResult('A'),B:rescueResult('B')},acceptedForVerdict:false},
   logisticsExploration:state.logistics.enabled?{settings:state.logistics,results:{A:logisticsResult('A'),B:logisticsResult('B')},acceptedForVerdict:false}:null,
   convention:state.mode==='real'?science?.convention:state.mode==='sample'?'Synthetic analytic geometry and horizon':bundle.convention,
   preprocessing:state.mode==='real'?{version:science?.version,algorithm:science?.algorithm,timeChain:science?.timeChain,externalReferences:science?.externalReferences,orientationValidation:science?.orientationValidation,thermalPreprocessing:science?.thermalPreprocessing}:null,
   scenarios:Object.fromEntries(['A','B'].map(id=>{const s=state.scenarios[id],p=provider(id),r=result(id),terrain=terrainResult(id);return [id,{site:{...s.site},baselineUtc:s.date,previewOffsetDays:s.offset,evaluatedUtc:new Date(startTime(s)).toISOString(),result:{...r,records:undefined},sourceRecords:p.metadata||[],coverage:p.coverage,terrainSummary:terrain?{...terrain,cells:undefined,route:terrainRoute(terrain,state.routeDirection)}:null,skyGeometry:skyContext(p.terrain?.horizon),horizonModel:p.terrain?.horizon?{...p.terrain.horizon,elevationDeg:undefined,rayCoverage:undefined,distanceAtMaxM:undefined}:null,externalGeometryCheck:p.entry?.externalGeometryCheck,externalOrientationCheck:p.entry?.externalOrientationCheck,thermalContext:p.entry?.thermalContext||null}];})),
   terrain:{status:state.mode==='real'?'Real PGDA footprint; per-scenario horizon extent and available reference evidence below; full global/orientation covariance pending':state.mode==='sample'?'Separate synthetic demonstration':'not_evaluated',settings:{...state.terrain},routeDirection:state.routeDirection},thermal:state.mode==='real'&&science?.thermalPreprocessing?'historical_context':'not_evaluated',logistics:'not_evaluated',advancedModels:'research_only',
   limitations:[state.mode==='real'?'Each scenario declares its horizon extent. For reviewed catalog points, 500 km nominal rays and a conditional beyond-extent exclusion are included; source-RMS sensitivity holds the outer annulus fixed. Local clone percentiles do not establish global/orientation confidence bounds.':'No accepted real terrain horizon in this selected mode',state.mode==='real'?'DE421/MOON_ME geometric production recipe; separate apparent-angle validation covers six points and 31 epochs across 2027-2033, not every instant or physical terrain truth':'Horizons reference angles are apparent; sample angles are synthetic','Diviner observations are cumulative historical season/local-time bins; not future UTC forecasts or subpixel temperature estimates','Study/reference coordinates are not certified mission landing coordinates','No electrical power, RF link, vehicle safety, thermal survival, logistics, dose, or rescue verdict','Full physical scientific/engineering acceptance and broader browser/accessibility review remain pending']};
 }
 return {state,sites,realCatalog,availableSites,provider,result,select,setSite,setCustom,registerCustomPoint,setDate,setOffset,applyPreview,resetPreview,setRequirements,setMode,serialize,registerCoverage,updateAsync,setCoverageLoader,inputBounds,canPreview,logisticsResult,setLogistics,logisticsFlip,rescueResult,setRescue,dustResult,setDust,plumeResult,setPlume,setPlumeAsset,addPlumeAsset,removePlumeAsset,radiationResult,setRadiation,cacheStats:()=>({...statistics,providers:providers.size,results:results.size})};
}
