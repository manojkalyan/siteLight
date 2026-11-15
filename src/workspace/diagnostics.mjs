// Diagnostic scores are prioritization weights, not physical loss or probability.
export const diagnosticWeights=Object.freeze({solar:1,earth:.6});
const HOUR=3600000;
const labels={terrain:'Sun center at/below the modeled terrain horizon',elevation:'Sun clears terrain but misses the selected elevation criterion',earth:'Earth center at/below the modeled terrain horizon'};
export function rankDiagnostics(result){
 if(result.status==='insufficient_data'||!result.records?.length)return [];
 const failed=new Map(result.rules.filter(r=>!r.pass).map(r=>[r.id,r]));
 if(!failed.size)return [];
 const inFailedGap=(key,row,id)=>failed.has(id)&&result.gaps[key].some(g=>g.hours>failed.get(id).required+1e-8&&row.time>=g.start&&row.time<g.end);
 const segments=[];let active=null;
 for(const row of result.records){
  const solarRule=row.eligible===false&&['sun','overlap'].filter(id=>failed.has(id));
  const darkGap=row.lit===false&&inFailedGap('dark',row,'gap-dark');
  const earthRule=row.earth===false&&['earth','overlap'].filter(id=>failed.has(id));
  const earthGap=row.earth===false&&inFailedGap('earth',row,'gap-earth');
  const solar=!!(solarRule?.length||darkGap),earth=!!(earthRule?.length||earthGap);
  const causes=[...(solar?[row.lit===false?'terrain':'elevation']:[]),...(earth?['earth']:[])];
  const ruleIds=[...new Set([...(solarRule||[]),...(darkGap?['gap-dark']:[]),...(earthRule||[]),...(earthGap?['gap-earth']:[])])].sort();
  const key=JSON.stringify([causes,ruleIds]),end=Math.min(result.end,row.time+row.weight*HOUR);
  if(!causes.length||row.eligible===null||row.earth===null){active=null;continue;}
  if(!active||active.key!==key||active.end!==row.time){active={key,start:row.time,end:row.time,hours:0,weight:(solar?diagnosticWeights.solar:0)+(earth?diagnosticWeights.earth:0),causes,ruleIds,sunAzimuth:[],earthAzimuth:[]};segments.push(active);}
  active.end=end;active.hours=(end-active.start)/HOUR;
  if(solar)active.sunAzimuth.push(row.sunAzimuth);
  if(earth)active.earthAzimuth.push(row.earthAzimuth);
 }
 const azimuthSpan=values=>{
  if(!values.length||values.some(v=>!Number.isFinite(v)))return null;
  let previous=values[0],unwrapped=previous,min=previous,max=previous;
  for(const value of values.slice(1)){unwrapped+=((value-previous+540)%360)-180;min=Math.min(min,unwrapped);max=Math.max(max,unwrapped);previous=value;}
  return {startDeg:values[0],lastSampleDeg:values.at(-1),spanDeg:max-min,wrapsNorth:Math.floor(min/360)!==Math.floor(max/360),meaning:'Unwrapped span of sampled azimuths; excludes the unsampled interval endpoint'};
 };
 return segments.map(({key,sunAzimuth,earthAzimuth,...s})=>({...s,score:s.hours*s.weight,scoreUnit:'weighted hours',startUtc:new Date(s.start).toISOString(),endUtc:new Date(s.end).toISOString(),
  relevantRules:s.ruleIds.map(id=>{const r=failed.get(id);return {id,label:r.label,shortfallHours:Math.abs(r.margin),valueHours:r.value,requiredHours:r.required};}),
  sunAzimuth:azimuthSpan(sunAzimuth),earthAzimuth:azimuthSpan(earthAzimuth),
  leftBoundary:s.start===result.start,rightBoundary:s.end===result.end,
  plain: s.causes.map(c=>labels[c]).join('; ')+`. This sampled interval contributes to ${s.ruleIds.map(id=>failed.get(id).label.toLowerCase()).join(', ')}.`,
  consequence:'Geometric availability only; electrical power and RF link performance are not evaluated',
  precisionMinutes:result.precisionMinutes||10,
 })).sort((a,b)=>b.score-a.score||a.start-b.start).map((s,i)=>({...s,rank:i+1}));
}
