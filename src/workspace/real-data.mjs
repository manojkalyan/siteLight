import {interpolateRows,terrainScreen} from './engine.mjs';

export function interpolateHorizon(values,azimuth){
 if(!Number.isFinite(azimuth)||![360,720,1440].includes(values?.length))return NaN;
 const az=(azimuth%360+360)%360*values.length/360,i=Math.floor(az),f=az-i,a=values[i],b=values[(i+1)%values.length];
 if(a===null||b===null||!Number.isFinite(a)||!Number.isFinite(b))return NaN;
 return a+(b-a)*f;
}
export function sampleGrid(grid,key,x,z){
 const col=(x*grid.projectionScale-grid.originX)/grid.spacingM,row=(grid.originY-z*grid.projectionScale)/grid.spacingM;
 const c=Math.floor(col),r=Math.floor(row),n=grid.size,values=grid[key];
 if(!values||c<0||r<0||c+1>=n||r+1>=n)return NaN;
 const a=values[r*n+c],b=values[r*n+c+1],d=values[(r+1)*n+c],e=values[(r+1)*n+c+1];
 if([a,b,d,e].some(v=>v===null||!Number.isFinite(v)))return NaN;
 const fx=col-c,fy=row-r;return (a*(1-fx)+b*fx)*(1-fy)+(d*(1-fx)+e*fx)*fy;
}
export function realTerrainScreen(entry,config){
 if(!entry)return null;
 const grid=entry.terrain.grid,result=terrainScreen(entry.site,{...config,missing:false},(x,z)=>sampleGrid(grid,'elevationM',x,z));
 const distribution=key=>{const a=result.cells.filter(c=>c.slope!==null).map(c=>sampleGrid(grid,key,c.x,c.z)).filter(Number.isFinite).sort((a,b)=>a-b);return a.length?{min:a[0],median:a[Math.floor(a.length/2)],max:a.at(-1),covered:a.length/result.cells.length}:null;};
 return {...result,nominalStatus:result.status,status:result.status==='pass'?'uncertain':result.status,classification:'REAL NASA PGDA DEM · BOUNDED FOOTPRINT',source:entry.site.tile,gridSpacingM:5,
  heightRmsM:distribution('heightRmsM'),publishedSlopeRmsDeg:distribution('publishedSlopeRmsDeg'),
  uncertainty:'Published RMS product values; not a propagated uncertainty for this user-selected slope baseline or detrended roughness',
  frame:entry.site.frame};
}
export function createRealProvider(site,science,{blocks=[]}={}){
 const entry=science?.sites?.[site.id],compatible=entry&&['lat','lon','altKm'].every(k=>Math.abs(entry.coordinates[k]-site[k])<1e-10);
 const rows=compatible?entry.records:[],terrain=compatible?entry.terrain:null;
 const series=compatible?[...blocks.map(b=>b.records),rows].filter(r=>r.length>1):[];
 const timeCoverage=series.map(r=>[r[0][0],r.at(-1)[0]]);
 return {mode:'real',label:'PGDA terrain + DE421 geometric positions',scientific:true,acceptance:'bounded_multiscale_model; global horizon / correlated uncertainty review pending',
  geometry:t=>{const r=series.find(r=>t>=r[0][0]&&t<=r.at(-1)[0]);return r?interpolateRows(r,t):null;},horizon:az=>terrain?interpolateHorizon(terrain.horizon.elevationDeg,az):NaN,
  horizonSensitivity:terrain?.horizon.sensitivity?az=>({lower:interpolateHorizon(terrain.horizon.sensitivity.lowerDeg,az),upper:interpolateHorizon(terrain.horizon.sensitivity.upperDeg,az)}):null,
  covers:(a,b)=>timeCoverage.some(([start,end])=>a>=start&&b<=end),coverage:timeCoverage.length?[Math.min(...timeCoverage.map(r=>r[0])),Math.max(...timeCoverage.map(r=>r[1]))]:null,timeCoverage,
  metadata:compatible?[...entry.sources,...blocks.map(b=>({kind:'locally generated real geometric date block',start:b.start,end:b.end,cacheKey:b.cacheKey,sourceAlgorithm:b.sourceAlgorithm,requestAlgorithmSha256:b.requestAlgorithmSha256,sources:b.sources}))]:[],convention:science?.convention,terrain,entry:compatible?entry:null,
  horizonDescription:terrain?`NASA ${site.tile} 5 m DEM + PGDA polar 80 m far field; ${terrain.horizon.extentM/1000} km rays; ${site.observerHeightM} m observer; terrain beyond extent unassessed`:'No real terrain at this coordinate',
  qualificationReason:terrain?`Far-field terrain is sampled to ${terrain.horizon.extentM/1000} km. Terrain beyond that extent, unresolved peaks and correlated uncertainty remain unassessed; one-source-RMS perturbations are sensitivity scenarios only.`:'No terrain coverage.',
  classification:'REAL DEM + GEOMETRIC EPHEMERIS · BOUNDED MULTISCALE MODEL; GLOBAL / CORRELATED UNCERTAINTY PENDING',
  // A nominal local-model pass is not upgraded to an unqualified site verdict.
  qualifyPassAsUncertain:true,
 };
}
