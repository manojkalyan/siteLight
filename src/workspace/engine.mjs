import {defaultRequirements} from './catalog.mjs';
import {rankDiagnostics} from './diagnostics.mjs';
export const HOUR=3600000,DAY=24*HOUR,STEP=HOUR/6;
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const rad=Math.PI/180,wrap=v=>(v%360+360)%360;
export function validateCoordinates(lat,lon,altKm=0){return Number.isFinite(lat)&&lat>=-90&&lat<=90&&Number.isFinite(lon)&&lon>=-180&&lon<=180&&Number.isFinite(altKm)&&altKm>=-10&&altKm<=20;}
export function parseUtc(value){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?Z$/.test(value))throw Error('Use an explicit UTC date and time.');
 const t=Date.parse(value);if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,16)!==value.slice(0,16))throw Error('Invalid calendar date.');
 if(t<Date.UTC(2027,0,1)||t>=Date.UTC(2034,0,1))throw Error('Supported target years are 2027–2033.');return t;
}
export function validateRequirements(r){
 if(!Number.isFinite(r.duration)||r.duration<48||r.duration>336)throw Error('Duration must be 48–336 hours.');
 for(const k of ['minSun','minEarth','minOverlap'])if(!Number.isFinite(r[k])||r[k]<0||r[k]>1)throw Error('Fractions must be between 0 and 1.');
 if(!Number.isFinite(r.minElevation)||r.minElevation<0||r.minElevation>8)throw Error('Solar elevation limit must be 0–8 degrees.');
 for(const k of ['maxDark','maxEarth'])if(r[k]!==null&&(!Number.isFinite(r[k])||r[k]<0||r[k]>336))throw Error('Gap limits must be 0–336 hours, or disabled.');
}
export const makeScenario=site=>({site:{...site},date:'2027-01-13T00:00:00Z',offset:0});
export function startTime(s){return parseUtc(s.date)+s.offset*DAY;}
export function syntheticHorizon(site,az){return Math.max(.15,1.6+.85*Math.sin((az*3+site.lon)*rad)+.38*Math.sin((az*7-site.lat)*rad));}
export function syntheticGeometry(time,site){
 const phase=(time-Date.UTC(2027,0,1))/HOUR/708.734*2*Math.PI;
 return {sunAzimuth:wrap(phase/rad+site.lon),sunElevation:1.9+5*Math.sin(phase+site.lon*rad)+60*Math.cos(site.lat*rad)*Math.sin(phase-.7),
 earthAzimuth:wrap(-site.lon+5*Math.sin(phase*.93)),earthElevation:Math.asin(Math.cos(site.lat*rad)*Math.cos(site.lon*rad))/rad+5.3*Math.sin(phase*.94+1)};
}
export function interpolateRows(rows,time){
 if(!rows?.length||time<rows[0][0]||time>rows.at(-1)[0])return null;
 let lo=0,hi=rows.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(rows[m][0]<=time)lo=m;else hi=m;}
 const a=rows[lo],b=rows[hi];if(b[0]-a[0]>STEP+1)return null;
 const f=(time-a[0])/(b[0]-a[0]||1),angle=(x,y)=>wrap(x+(((y-x+540)%360)-180)*f),lerp=(x,y)=>x+(y-x)*f;
 return {sunAzimuth:angle(a[1],b[1]),sunElevation:lerp(a[2],b[2]),earthAzimuth:angle(a[3],b[3]),earthElevation:lerp(a[4],b[4])};
}
export function createProvider(mode,site,bundle){
 if(mode==='sample')return {mode,label:'Synthetic terrain + geometry',scientific:false,horizon:az=>syntheticHorizon(site,az),geometry:t=>syntheticGeometry(t,site),covers:(a,b)=>a>=Date.UTC(2027,0,1)&&b<=Date.UTC(2034,0,1),coverage:null};
 const entry=bundle.sites[site.id];
 const compatible=entry&&['lat','lon','altKm'].every(k=>Math.abs(entry.coordinates[k]-site[k])<1e-8);
 const rows=compatible?entry.records:[];
 return {mode,label:'JPL reference tangent horizon',scientific:false,horizon:()=>0,geometry:t=>interpolateRows(rows,t),
 covers:(a,b)=>rows.length>1&&a>=rows[0][0]&&b<=rows.at(-1)[0],coverage:rows.length?[rows[0][0],rows.at(-1)[0]]:null,
 metadata:compatible?entry.sources:[],convention:bundle.convention};
}
export function intervals(records,key,start,end){
 const result=[];let active=null;
 for(let i=0;i<records.length;i++){
  const row=records[i],next=records[i+1]?.time??end;
  const bad=row[key]===false;
  if(bad&&active===null)active=row.time;
  if(!bad&&active!==null){result.push({start:active,end:row.time,hours:(row.time-active)/HOUR,leftBoundary:active===start,rightBoundary:false,unknownBoundary:row[key]===null});active=null;}
  if(bad&&next>=end&&active!==null){result.push({start:active,end,hours:(end-active)/HOUR,leftBoundary:active===start,rightBoundary:true,unknownBoundary:false});active=null;}
 }
 return result.filter(r=>r.hours>0);
}
export function visibilityRecord(time,requirements,provider,weight=STEP/HOUR){
 const unknown={time,weight,eligible:null,lit:null,earth:null,overlap:null},g=provider.geometry(time);
 if(!g||!['sunAzimuth','sunElevation','earthAzimuth','earthElevation'].every(k=>Number.isFinite(g[k])))return unknown;
 const sunH=provider.horizon(g.sunAzimuth),earthH=provider.horizon(g.earthAzimuth);
 if(!Number.isFinite(sunH)||!Number.isFinite(earthH))return unknown;
 const lit=g.sunElevation>sunH,eligible=lit&&g.sunElevation>=requirements.minElevation,e=g.earthElevation>earthH;
 return {...g,time,weight,sunHorizon:sunH,earthHorizon:earthH,lit,eligible,earth:e,overlap:eligible&&e};
}
export function evaluate(scenario,requirements,provider){
 validateRequirements(requirements);const start=startTime(scenario),end=start+requirements.duration*HOUR;
 if(start<Date.UTC(2027,0,1)||end>Date.UTC(2034,0,1))return {status:'insufficient_data',reason:'Requested interval is outside target-year coverage.',records:[],rules:[],start,end};
 if(!provider.covers(start,end))return {status:'insufficient_data',reason:'This site or full time interval has no loaded ephemeris coverage. No extrapolated result is shown.',records:[],rules:[],start,end};
 const records=[];let sun=0,earth=0,overlap=0,known=0;
 const sensitivityHours={sun:{lower:0,upper:0},earth:{lower:0,upper:0},overlap:{lower:0,upper:0}};let sensitivityKnown=0;
 for(let t=start;t<end;t+=STEP){
  const weight=Math.min(STEP,end-t)/HOUR,row=visibilityRecord(t,requirements,provider,weight);records.push(row);
  if(row.eligible===null)continue;
  const g=row,eligible=row.eligible,e=row.earth;
  known+=weight;if(eligible)sun+=weight;if(e)earth+=weight;if(eligible&&e)overlap+=weight;
  if(provider.horizonSensitivity){
   const s=provider.horizonSensitivity(g.sunAzimuth),e=provider.horizonSensitivity(g.earthAzimuth);
   if([s?.lower,s?.upper,e?.lower,e?.upper].every(Number.isFinite)){
    sensitivityKnown+=weight;
    for(const bound of ['lower','upper']){const h=bound==='lower'?'upper':'lower',solar=g.sunElevation>s[h]&&g.sunElevation>=requirements.minElevation,earthVisible=g.earthElevation>e[h];
     if(solar)sensitivityHours.sun[bound]+=weight;if(earthVisible)sensitivityHours.earth[bound]+=weight;if(solar&&earthVisible)sensitivityHours.overlap[bound]+=weight;
    }
   }
  }
 }
 const gaps={dark:intervals(records,'lit',start,end),solar:intervals(records,'eligible',start,end),earth:intervals(records,'earth',start,end)};
 const longest=Object.fromEntries(Object.entries(gaps).map(([k,v])=>[k,Math.max(0,...v.map(g=>g.hours))]));
 const rules=[['sun','Solar eligibility',sun,requirements.minSun*requirements.duration,'≥'],['earth','Earth visibility',earth,requirements.minEarth*requirements.duration,'≥'],['overlap','Simultaneous availability',overlap,requirements.minOverlap*requirements.duration,'≥']].map(([id,label,value,required,operator])=>({id,label,value,required,operator,unit:'h',margin:value-required,pass:value+1e-8>=required}));
 for(const [key,limit,label] of [['dark',requirements.maxDark,'Longest darkness'],['earth',requirements.maxEarth,'Longest Earth outage']])if(limit!==null)rules.push({id:'gap-'+key,label,value:longest[key],required:limit,operator:'≤',unit:'h',margin:limit-longest[key],pass:longest[key]<=limit+1e-8});
 const complete=Math.abs(known-requirements.duration)<1e-7;
 const nominalStatus=rules.every(r=>r.pass)?'pass':'fail';
 const result={status:!complete?'insufficient_data':nominalStatus==='pass'&&provider.qualifyPassAsUncertain?'uncertain':nominalStatus,nominalStatus,
  reason:!complete?'Missing geometry or horizon samples prevent a complete assessment.':provider.qualifyPassAsUncertain?(provider.qualificationReason||'Nominal results apply to the declared local terrain extent. Far-field terrain and propagated uncertainty remain unassessed.'):'',
  start,end,sun,earth,overlap,known,fractions:complete?{sun:sun/requirements.duration,earth:earth/requirements.duration,overlap:overlap/requirements.duration}:{sun:null,earth:null,overlap:null},records,rules,gaps,longest,
  horizon:provider.horizonDescription||(provider.mode==='sample'?'Synthetic horizon':'Zero-degree reference tangent; real terrain not assessed'),precisionMinutes:10,
  classification:provider.classification||(provider.mode==='sample'?'SYNTHETIC DEMONSTRATION':'SOURCE-BACKED REFERENCE MODEL; TERRAIN NOT ASSESSED'),
  assurance:provider.acceptance||null};
 result.diagnostics=rankDiagnostics(result);
 if(provider.horizonSensitivity){const complete=Math.abs(sensitivityKnown-requirements.duration)<1e-7;result.sensitivity={status:complete?'available':'incomplete',knownHours:sensitivityKnown,
  fractions:complete?Object.fromEntries(Object.entries(sensitivityHours).map(([key,b])=>[key,{lower:b.lower/requirements.duration,upper:b.upper/requirements.duration}])):null,
  method:provider.horizonSensitivityMethod||'Componentwise one-source-RMS terrain/observer height perturbations; geometric and minimum-elevation rules unchanged',interpretation:provider.horizonSensitivityInterpretation||'Sensitivity scenarios, not confidence bounds or guaranteed availability; spatial covariance, unresolved terrain and orientation errors remain outside this calculation',changesVerdict:false};}
 return result;
}
export function explain(result,technical=false){
 if(result.status==='insufficient_data')return result.reason;
 if(result.status==='uncertain')return 'The nominal model meets the enabled requirements. '+result.reason+' This is not an unqualified pass.';
 const failed=result.rules.filter(r=>!r.pass);
 if(!failed.length)return 'All enabled environmental requirements are met under the selected model. Terrain, hardware, and logistics assessments remain separate.';
 return failed.map(r=>technical?`${r.label}: ${r.value.toFixed(2)} h ${r.operator} ${r.required.toFixed(2)} h required; margin ${r.margin.toFixed(2)} h.`:
  `${r.label} ${r.operator==='≥'?'falls short by':'exceeds your limit by'} ${Math.abs(r.margin).toFixed(1)} hours.`).join(' ');
}
export function nextSet(result,time,key){
 if(!result.records.length)return {status:'unknown'};
 const i=clamp(Math.floor((time-result.start)/STEP),0,result.records.length-1),row=result.records[i];
 if(row[key]===null)return {status:'unknown'};
 if(row[key]===false)return {status:'below'};
 for(let j=i+1;j<result.records.length;j++){
  const r=result.records[j];if(r[key]===null)return {status:'unknown'};
  if(r[key]===false)return {status:'crossing',hours:Math.max(0,(r.time-time)/HOUR),utc:new Date(r.time).toISOString(),bracketUtc:[new Date(result.records[j-1].time).toISOString(),new Date(r.time).toISOString()]};
 }
 return {status:'beyond_window',remainingHours:Math.max(0,(result.end-time)/HOUR)};
}
export function findAlternative(scenario,requirements,provider){
 const offsets=Array.from({length:120},(_,i)=>i<60?i-60:i-59).sort((a,b)=>Math.abs(a)-Math.abs(b)||b-a);
 let tested=0,unavailable=0;
 for(const delta of offsets){const s={...scenario,offset:scenario.offset+delta};if(Math.abs(s.offset)>60){unavailable++;continue;}const r=evaluate(s,requirements,provider);if(r.status==='insufficient_data'){unavailable++;continue;}tested++;if(r.status==='pass'||r.status==='uncertain'&&r.nominalStatus==='pass')return {scenario:s,result:r,delta,tested,unavailable,qualification:r.status==='uncertain'?'Nominal bounded-model fit; global far-field completeness and correlated uncertainty review pending':null};}
 return {scenario:null,tested,unavailable};
}
export function terrainHeight(x,z,site){
 const phase=site.lon*rad;return x*.06+z*.03+1.2*Math.sin(x/29+phase)*Math.cos(z/35)+.22*Math.sin(x/7)*Math.cos(z/9);
}
export function terrainScreen(site,{radius=100,baseline=20,limit=12,missing=false}={},height=(x,z)=>terrainHeight(x,z,site)){
 if(!(radius>=20&&radius<=300&&baseline>=5&&baseline<=100&&limit>=0&&limit<=45))throw Error('Invalid terrain settings.');
 const cells=[],step=radius/10;let expected=0,sumX=0,sumZ=0,sumH=0;
 for(let z=-10;z<=10;z++)for(let x=-10;x<=10;x++){
  if(x*x+z*z>100)continue;expected++;
  const px=x*step,pz=z*step,h=missing&&(x+2*z+60)%7===0?null:height(px,pz);
  const finite=Number.isFinite(h);
  const dx=(height(px+baseline/2,pz)-height(px-baseline/2,pz))/baseline,dz=(height(px,pz+baseline/2)-height(px,pz-baseline/2))/baseline;
  const slope=finite&&Number.isFinite(dx)&&Number.isFinite(dz)?Math.atan(Math.hypot(dx,dz))/rad:null;
  cells.push({x:px,z:pz,h:finite?h:null,slope});if(slope!==null){sumX+=px;sumZ+=pz;sumH+=h;}
 }
 const valid=cells.filter(c=>c.slope!==null),n=valid.length;
 if(!n)return {status:'insufficient_data',coverage:0,cells,mean:null,max:null,roughness:null,usableArea:null};
 const mx=sumX/n,mz=sumZ/n,mh=sumH/n;let xx=0,zz=0,xz=0,xh=0,zh=0;
 for(const c of valid){xx+=(c.x-mx)**2;zz+=(c.z-mz)**2;xz+=(c.x-mx)*(c.z-mz);xh+=(c.x-mx)*(c.h-mh);zh+=(c.z-mz)*(c.h-mh);}
 const det=xx*zz-xz*xz,a=(xh*zz-zh*xz)/det,b=(zh*xx-xh*xz)/det;
 const roughness=Math.sqrt(valid.reduce((s,c)=>s+(c.h-mh-a*(c.x-mx)-b*(c.z-mz))**2,0)/n);
 const slopes=valid.map(c=>c.slope).sort((a,b)=>a-b),coverage=n/expected;
 return {status:coverage<1?'insufficient_data':slopes.at(-1)>limit?'fail':'pass',coverage,cells,mean:slopes.reduce((a,b)=>a+b,0)/n,max:slopes.at(-1),p95:slopes[Math.floor((n-1)*.95)],roughness,usableArea:Math.PI*radius*radius*valid.filter(c=>c.slope<=limit).length/expected,radius,baseline,limit};
}
export {defaultRequirements};
