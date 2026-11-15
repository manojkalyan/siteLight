import {startTime} from './engine.mjs';

export const rescueVersion='conditional-rescue-time-1';
export const rescueFields={
 outboundMps:['Outbound speed','m/s',.01,10,.01],
 returnMps:['Loaded return speed','m/s',.01,10,.01],
 mobilizationMin:['Mobilization time','min',0,1440,1],
 handlingMin:['Casualty handling time','min',0,1440,1],
 enduranceMin:['Assumed total response endurance','min',1,10080,1],
 deadlineMin:['Completion time limit from incident','min',1,10080,1],
};
export const defaultRescue={assetDeclared:false,available:false,returnRequired:true,outboundMps:.5,returnMps:.25,mobilizationMin:10,handlingMin:15,enduranceMin:120,deadlineMin:60,assetScope:null};
export function rescueContext(state,id=state.active){
 const s=state.scenarios[id];return {mode:state.mode,siteId:s.site.id,lat:s.site.lat,lon:s.site.lon,altKm:s.site.altKm,incidentUtc:new Date(startTime(s)).toISOString()};
}
const scopeKey=s=>s?JSON.stringify([s.mode,s.siteId,s.lat,s.lon,s.altKm,s.incidentUtc]):null;
export const rescueAssetMatches=(inputs,context)=>inputs.assetDeclared&&!!inputs.assetScope&&scopeKey(inputs.assetScope)===scopeKey(context);
export function validateRescue(inputs){
 for(const key of ['assetDeclared','available','returnRequired'])if(typeof inputs[key]!=='boolean')throw Error('Rescue '+key+' must be true or false.');
 for(const [key,[label,,min,max]] of Object.entries(rescueFields))if(!Number.isFinite(inputs[key])||inputs[key]<min||inputs[key]>max)throw Error(`${label}: use ${min}-${max}.`);
}
export function assessRescue(route,inputs,context){
 validateRescue(inputs);
 const base={model:rescueVersion,acceptedForVerdict:false,classification:'HYPOTHETICAL RESPONSE ASSUMPTIONS',context:structuredClone(context),assumptions:structuredClone(inputs),
  asset:{type:'User-declared hypothetical rescue vehicle',origin:'Selected footprint center',casualty:'Terrain-route destination',declaredForCurrentScenario:rescueAssetMatches(inputs,context)},
  route:route?{model:route.model,status:route.status,direction:route.direction,lengthM:route.lengthM??null,spacingM:route.spacingM,slopeLimitDeg:route.slopeLimitDeg,classification:route.classification,qualification:route.qualification,path:route.status==='found'?structuredClone(route.path):[]}:null,
  timing:null,checks:[],
  meaning:'Conditional time/endurance comparison on a bounded sampled route. This is not an operational rescue or safe-return verdict.',
  exclusions:['Asset existence, transport capacity, deployment and availability are hypothetical declarations, not observations.',
   'Energy/battery use, traction, boulders, vehicle clearance, medical care, communications and environmental conditions along the route are not evaluated.',
   'Constant declared speeds and the same reversed path are assumed for return; no unassessed destination or external route is connected.',
   'The incident is assumed at the selected scenario start. Endurance and completion limits are user assumptions, independent of the visibility assessment.']};
 const stop=(status,reason)=>({...base,status,reason});
 if(!inputs.assetDeclared)return stop('not_evaluated','Declare a hypothetical rescue asset before evaluating response time.');
 if(!rescueAssetMatches(inputs,context))return stop('not_evaluated','The asset declaration belongs to another point, data mode or incident start. Declare it again for this scenario.');
 if(!inputs.available)return stop('asset_unavailable','The declared asset is assumed unavailable; no response time is credited.');
 if(!route||route.status==='not_evaluated')return stop('not_evaluated','An assessed terrain route is required.');
 if(route.status==='no_route')return stop('no_sampled_route','No route meets the selected sampled slope/coverage limits. This does not establish that every possible rescue route is impossible.');
 if(route.status!=='found'||!Number.isFinite(route.lengthM)||route.lengthM<0||!Array.isArray(route.path)||route.path.length<2||route.path.some(p=>!['x','z','h'].every(k=>Number.isFinite(p[k]))))return stop('not_evaluated','The route is incomplete or invalid.');
 const pathLength=route.path.slice(1).reduce((sum,p,i)=>{const q=route.path[i];return sum+Math.hypot(p.x-q.x,p.z-q.z,p.h-q.h);},0);
 if(Math.abs(pathLength-route.lengthM)>1e-6*Math.max(1,pathLength))return stop('not_evaluated','The route length does not match its sampled path.');
 const incident=Date.parse(context?.incidentUtc);if(!Number.isFinite(incident))return stop('not_evaluated','A valid incident UTC start is required.');
 const outboundMin=route.lengthM/inputs.outboundMps/60,returnMin=inputs.returnRequired?route.lengthM/inputs.returnMps/60:0;
 const arrivalMin=inputs.mobilizationMin+outboundMin,completionMin=arrivalMin+inputs.handlingMin+returnMin;
 const checks=[{id:'endurance',limitMin:inputs.enduranceMin,actualMin:completionMin,marginMin:inputs.enduranceMin-completionMin},{id:'completion',limitMin:inputs.deadlineMin,actualMin:completionMin,marginMin:inputs.deadlineMin-completionMin}].map(c=>({...c,fits:c.marginMin>=-1e-9}));
 const fits=checks.every(c=>c.fits);
 return {...base,status:fits?'conditional_fit':'conditional_shortfall',reason:fits?'The assumed response fits both declared time limits.':'The assumed response exceeds '+checks.filter(c=>!c.fits).map(c=>c.id).join(' and ')+' limits.',checks,
  timing:{mobilizationMin:inputs.mobilizationMin,outboundMin,arrivalMin,handlingMin:inputs.handlingMin,returnMin,completionMin,totalDistanceM:route.lengthM*(inputs.returnRequired?2:1),
   arrivalUtc:new Date(incident+arrivalMin*60000).toISOString(),completionUtc:new Date(incident+completionMin*60000).toISOString(),completionMeaning:inputs.returnRequired?'Casualty returned to footprint-center asset origin':'Handling completed at casualty; evacuation not evaluated'}};
}
