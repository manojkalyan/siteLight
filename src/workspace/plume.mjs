import constants from '../../data/plume/constants.json' with {type:'json'};
import manifest from '../../data/plume-inputs.json' with {type:'json'};
import validation from '../../data/plume/reference-validation.json' with {type:'json'};
import {startTime} from './engine.mjs';

export const plumeVersion='conditional-spherical-ejecta-1';
export const moonBallisticConstants={radiusM:constants.meanRadiusKm*1000,gmM3S2:constants.gmKm3S2*1e9};
export const plumeFields={speedMps:['Speed after plume acceleration','m/s',1,500,1],elevationDeg:['Launch angle above local horizontal','°',.1,80,.1],headingDeg:['Launch bearing clockwise from north','°',0,359.99,.1],launchHeightM:['Release height above ideal sphere','m',0,100,.01],diameterUm:['Assumed spherical grain diameter','µm',1,10000,1],densityKgM3:['Assumed grain density','kg/m³',100,10000,10]};
export const plumeAssetFields={distanceM:['Surface distance from release origin','m',1,100000,1],bearingDeg:['Bearing clockwise from north','°',0,359.99,.1],widthM:['Footprint diameter','m',.1,1000,.1],heightM:['Height above ideal sphere','m',.1,100,.1]};
export const defaultPlume={enabled:false,speedMps:100,elevationDeg:5,headingDeg:0,launchHeightM:.1,diameterUm:100,densityKgM3:3000,
 assets:[{id:'asset-1',name:'Hypothetical habitat',enabled:true,distanceM:1000,bearingDeg:0,widthM:10,heightM:5},{id:'asset-2',name:'Hypothetical solar array',enabled:true,distanceM:500,bearingDeg:90,widthM:20,heightM:3}]};
const rad=Math.PI/180,{radiusM:R,gmM3S2:mu}=moonBallisticConstants;
const checked=validation.status==='verified_transcription'&&validation.gmKm3S2===constants.gmKm3S2&&validation.meanRadiusKm===constants.meanRadiusKm&&manifest.records.some(r=>r.name===constants.sourceFile&&r.sha256===validation.sourceSha256);
export function plumeContext(state,id=state.active){const s=state.scenarios[id];return {mode:state.mode,illustrativeSite:{id:s.site.id,name:s.site.name,lat:s.site.lat,lon:s.site.lon},scenarioStartUtc:new Date(startTime(s)).toISOString(),terrainApplied:false};}
export function validatePlume(a){
 if(!checked)throw Error('Ballistic constant reference evidence does not match the pinned values.');
 if(typeof a.enabled!=='boolean')throw Error('Ejecta exploration must be enabled or disabled.');
 for(const [key,[label,,min,max]] of Object.entries(plumeFields))if(!Number.isFinite(a[key])||a[key]<min||a[key]>max)throw Error(`${label}: use ${min}-${max}.`);
 if(!Array.isArray(a.assets)||a.assets.length>5)throw Error('Use at most five hypothetical assets.');
 const ids=new Set();for(const asset of a.assets){
  if(!asset||typeof asset.id!=='string'||!/^asset-[1-9][0-9]*$/.test(asset.id)||ids.has(asset.id))throw Error('Asset IDs must be unique.');ids.add(asset.id);
  if(typeof asset.name!=='string'||!asset.name.trim()||asset.name.length>60||typeof asset.enabled!=='boolean')throw Error('Use an asset name of 1-60 characters and an explicit include state.');
  for(const [key,[label,,min,max]] of Object.entries(plumeAssetFields))if(!Number.isFinite(asset[key])||asset[key]<min||asset[key]>max)throw Error(`${label}: use ${min}-${max}.`);
 }
}
function bisect(fn,lo,hi){for(let i=0;i<75;i++){const mid=(lo+hi)/2;if(fn(mid)>0)lo=mid;else hi=mid;}return (lo+hi)/2;}
export function sphericalTrajectory(a){
 validatePlume(a);
 const r0=R+a.launchHeightM,vt=a.speedMps*Math.cos(a.elevationDeg*rad),vr=a.speedMps*Math.sin(a.elevationDeg*rad),H=r0*vt,p=H*H/mu,k=p/r0,ey=-vr*H/mu;
 const height=phi=>{const c=Math.cos(phi),s=Math.sin(phi),oneMinusC=2*Math.sin(phi/2)**2,denom=k*c+oneMinusC+ey*s;return ((p-R)*oneMinusC+k*a.launchHeightM*c-R*ey*s)/denom;};
 const end=bisect(height,0,Math.PI),apexAngle=Math.atan2(-ey,1-k);
 const time=phi=>{const n=128,d=phi/n;let sum=0;for(let i=0;i<=n;i++){const r=R+height(i*d);sum+=(i===0||i===n?1:i%2?4:2)*r*r/H;}return sum*d/3;};
 const speed=phi=>{const r=R+height(phi),radial=mu/H*((k-1)*Math.sin(phi)-ey*Math.cos(phi));return Math.hypot(radial,H/r);};
 const trajectory={model:'central-gravity-vacuum-conic',rangeM:end*R,flightSeconds:time(end),maxHeightM:height(apexAngle),landingSpeedMps:speed(end),
  samples:Array.from({length:101},(_,i)=>{const phi=end*i/100;return {distanceM:R*phi,heightM:Math.max(0,height(phi))};})};
 return {trajectory,height,time,speed,end};
}
function assetEncounter(asset,a,orbit,mass){
 const base={...asset,status:'not_included',encounter:null};if(!asset.enabled)return base;
 const delta=asset.distanceM/R,direction=(asset.bearingDeg-a.headingDeg)*rad,A=Math.cos(delta),B=Math.sin(delta)*Math.cos(direction);
 const cross=Math.asin(Math.sin(delta)*Math.sin(direction)),closest=Math.atan2(B,A),radius=asset.widthM/(2*R);
 if(Math.abs(cross)>radius+1e-15)return {...base,status:'misses_footprint',crossTrackM:Math.abs(cross)*R};
 const offset=2*Math.asin(Math.sqrt(Math.max(0,Math.sin((radius+Math.abs(cross))/2)*Math.sin((radius-Math.abs(cross))/2)/Math.cos(cross))));
 const lo=Math.max(0,closest-offset),hi=Math.min(orbit.end,closest+offset);
 if(lo>hi)return {...base,status:'outside_flown_segment',crossTrackM:Math.abs(cross)*R};
 const lowHeight=orbit.height(lo),highHeight=orbit.height(hi);
 if(Math.min(lowHeight,highHeight)>asset.heightM+1e-7)return {...base,status:'passes_above',minimumHeightOverFootprintM:Math.min(lowHeight,highHeight)};
 const contact=lowHeight<=asset.heightM?lo:bisect(phi=>orbit.height(phi)-asset.heightM,lo,hi),speedMps=orbit.speed(contact);
 return {...base,status:'intersects_assumed_envelope',encounter:{surfaceDistanceM:contact*R,heightM:Math.max(0,orbit.height(contact)),secondsAfterRelease:orbit.time(contact),speedMps,singleGrainEnergyJ:.5*mass*speedMps**2},meaning:'One assumed particle centerline crosses this hypothetical radial asset column. Not damage, impact count, deposition or encounter probability.'};
}
export function assessPlume(a,context=null){
 validatePlume(a);
 const base={model:plumeVersion,status:'not_evaluated',acceptedForVerdict:false,classification:'HYPOTHETICAL POST-ACCELERATION EJECTA',context:structuredClone(context),assumptions:structuredClone(a),
  constants:{...moonBallisticConstants,source:constants.sourceUrl,sourceValidation:structuredClone(validation)},sources:structuredClone(manifest.records),
  engineErosion:'not_evaluated',terrainApplied:false,particleDistribution:'not_evaluated',damage:'not_evaluated',trajectory:null,assets:[],grainMassKg:null,
  meaning:'Conditional single-grain trajectory on an ideal nonrotating Moon. Release state and assets are assumptions; no safe radius or plume hazard verdict.',
  exclusions:['Thrust, nozzle, descent history, regolith cohesion and erosion do not determine launch speed or mass in this model; engine/soil/CFD coupling is unassessed.',
   'No gas drag/lift after release, particle collisions, electrostatics, nonspherical gravity, lunar rotation, terrain interception, berms, rebounds or shielding.',
   'Assets are user-placed circular footprints with radial height on a mean-radius sphere; selected-site DEM elevations and real asset coordinates are not applied.',
   'No particle-count/size/speed distribution, flux, deposition, damage probability, material damage threshold, EVA wait time or operational exclusion distance.']};
 if(!a.enabled)return base;
 const orbit=sphericalTrajectory(a),mass=a.densityKgM3*Math.PI/6*(a.diameterUm*1e-6)**3;
 return {...base,status:'exploratory',grainMassKg:mass,trajectory:orbit.trajectory,assets:a.assets.map(asset=>assetEncounter(asset,a,orbit,mass))};
}
