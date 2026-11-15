import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assessPlume,defaultPlume,moonBallisticConstants} from '../src/workspace/plume.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const close=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const {radiusM:R,gmM3S2:mu}=moonBallisticConstants,base={...structuredClone(defaultPlume),enabled:true};

test('pinned Moon constants retain the exact JPL source/spec identity and correct SI conversions',()=>{
 const spec=JSON.parse(read('data/plume/constants.json')),report=JSON.parse(read('data/plume/reference-validation.json')),sources=JSON.parse(read('data/plume-inputs.json'));
 assert.equal(report.constantsSpecSha256,createHash('sha256').update(read('data/plume/constants.json')).digest('hex'));assert.equal(report.status,'verified_transcription');assert.equal(sources.records.length,3);
 assert.equal(report.sourceSha256,sources.records.find(r=>r.name===spec.sourceFile).sha256);assert.equal(report.gmKm3S2,spec.gmKm3S2);assert.equal(report.meanRadiusKm,spec.meanRadiusKm);assert.equal(R,1737400);assert.equal(mu,4902800000000);
});
test('surface-release conic matches independent closed-form range, symmetric landing speed and zero surface endpoints',()=>{
 const speed=300,theta=30*Math.PI/180,r=assessPlume({...base,speedMps:speed,elevationDeg:30,launchHeightM:0,assets:[]});
 const expected=2*R*Math.atan(speed**2*Math.sin(theta)*Math.cos(theta)/(mu/R-speed**2*Math.cos(theta)**2));close(r.trajectory.rangeM,expected,1e-6);close(r.trajectory.landingSpeedMps,speed,1e-7);close(r.trajectory.samples[0].heightM,0);close(r.trajectory.samples.at(-1).heightM,0);
 assert.equal(r.trajectory.samples.length,101);assert.equal(r.acceptedForVerdict,false);assert.equal(r.engineErosion,'not_evaluated');assert.equal(r.terrainApplied,false);
});

// Independent time-domain Cartesian RK4, separate from the angle-domain conic/quadrature.
function cartesianReference(a){
 const theta=a.elevationDeg*Math.PI/180,derivative=s=>{const factor=-mu/Math.hypot(s[0],s[1])**3;return [s[2],s[3],s[0]*factor,s[1]*factor];};
 const step=(s,dt)=>{const k1=derivative(s),k2=derivative(s.map((v,i)=>v+k1[i]*dt/2)),k3=derivative(s.map((v,i)=>v+k2[i]*dt/2)),k4=derivative(s.map((v,i)=>v+k3[i]*dt));return s.map((v,i)=>v+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);};
 let state=[R+a.launchHeightM,0,a.speedMps*Math.sin(theta),a.speedMps*Math.cos(theta)],time=0;
 for(let i=0;i<100000;i++){
  const next=step(state,.05);if(Math.hypot(next[0],next[1])<=R){let lo=0,hi=.05;for(let j=0;j<45;j++){const mid=(lo+hi)/2,s=step(state,mid);if(Math.hypot(s[0],s[1])>R)lo=mid;else hi=mid;}const dt=(lo+hi)/2,s=step(state,dt);return {rangeM:R*Math.atan2(s[1],s[0]),flightSeconds:time+dt,landingSpeedMps:Math.hypot(s[2],s[3])};}
  state=next;time+=.05;
 }
 throw Error('Reference integration did not hit the sphere.');
}
test('angle-domain conic and flight quadrature agree with independent Cartesian integration across the supported domain',()=>{
 for(const [speedMps,elevationDeg,launchHeightM] of [[1,.1,0],[1,80,100],[20,20,.1],[300,45,20],[500,80,100],[500,.1,0]]){const a={...base,speedMps,elevationDeg,launchHeightM,assets:[]},r=assessPlume(a).trajectory,expected=cartesianReference(a);close(r.rangeM,expected.rangeM,.001);close(r.flightSeconds,expected.flightSeconds,.0001);close(r.landingSpeedMps,expected.landingSpeedMps,.00001);}
});
test('asset footprints and heights distinguish one-trajectory intersections, off-bearing, above, beyond-range and excluded cases',()=>{
 const range=assessPlume({...base,assets:[]}).trajectory.rangeM;
 const asset=(id,patch)=>({id:'asset-'+id,name:'Fixture '+id,enabled:true,distanceM:range*.9,bearingDeg:0,widthM:10,heightM:100,...patch});
 const assets=[asset(1,{}),asset(2,{bearingDeg:90}),asset(3,{distanceM:range*.5,heightM:.1}),asset(4,{distanceM:range*2}),asset(5,{enabled:false})],r=assessPlume({...base,assets});
 assert.deepEqual(r.assets.map(a=>a.status),['intersects_assumed_envelope','misses_footprint','passes_above','outside_flown_segment','not_included']);
 const encounter=r.assets[0].encounter;assert.ok(encounter.secondsAfterRelease>0&&encounter.secondsAfterRelease<r.trajectory.flightSeconds);assert.ok(encounter.heightM<=100);close(encounter.singleGrainEnergyJ,.5*r.grainMassKg*encounter.speedMps**2,1e-15);
 for(const row of r.assets.slice(1))assert.equal(row.encounter,null);
 const top=assessPlume({...base,assets:[asset(1,{distanceM:range*.95,widthM:200,heightM:2})]}).assets[0];assert.equal(top.status,'intersects_assumed_envelope');close(top.encounter.heightM,2,1e-6);
 const rotated=assessPlume({...base,headingDeg:355,assets:[asset(1,{bearingDeg:355})]});assert.equal(rotated.assets[0].status,r.assets[0].status);close(rotated.assets[0].encounter.secondsAfterRelease,encounter.secondsAfterRelease);
});
test('particle mass and conditional energy use diameter cubed while vacuum geometry remains unchanged',()=>{
 const a={...base,assets:[{id:'asset-1',name:'Envelope',enabled:true,distanceM:1000,bearingDeg:0,widthM:100,heightM:100}]},r=assessPlume(a),larger=assessPlume({...a,diameterUm:a.diameterUm*2});
 close(r.grainMassKg,Math.PI/6*3000*(100e-6)**3,1e-20);close(larger.grainMassKg/r.grainMassKg,8);assert.deepEqual(larger.trajectory,r.trajectory);close(larger.assets[0].encounter.singleGrainEnergyJ/r.assets[0].encounter.singleGrainEnergyJ,8);
 assert.equal(assessPlume(defaultPlume).trajectory,null);assert.deepEqual(assessPlume(defaultPlume).assets,[]);
});
test('invalid release/asset inputs reject and result mutations cannot modify settings or pinned sources',()=>{
 for(const patch of [{speedMps:0},{speedMps:501},{elevationDeg:90},{launchHeightM:-1},{diameterUm:0},{densityKgM3:NaN},{headingDeg:'1'},{enabled:1},{assets:Array(6).fill(base.assets[0])},{assets:[{...base.assets[0],widthM:0}]},{assets:[{...base.assets[0],name:''}]}])assert.throws(()=>assessPlume({...base,...patch}));
 const before=JSON.stringify(base),r=assessPlume(base);r.assumptions.assets[0].name='Changed';r.sources[0].sha256='changed';assert.equal(JSON.stringify(base),before);assert.notEqual(assessPlume(base).sources[0].sha256,'changed');
});
test('A/B assets edit transactionally and export conditional evidence without altering environmental/thermal results',()=>{
 const w=createWorkspace(JSON.parse(read('data/horizons/workspace-ephemeris.json')),{science:JSON.parse(read('data/science/real-workspace.json'))}),environment=w.result('A'),thermal=JSON.stringify(w.serialize().scenarios.A.thermalContext);
 w.setPlume({enabled:true});w.setPlumeAsset('asset-1',{name:'User asset',heightM:20});assert.equal(w.state.plume.B.enabled,false);assert.notEqual(w.state.plume.B.assets[0].name,'User asset');assert.strictEqual(w.result('A'),environment);assert.equal(JSON.stringify(w.serialize().scenarios.A.thermalContext),thermal);
 for(let i=0;i<3;i++)w.addPlumeAsset();assert.equal(w.state.plume.A.assets.length,5);assert.throws(()=>w.addPlumeAsset());w.removePlumeAsset('asset-3');w.addPlumeAsset();assert.equal(new Set(w.state.plume.A.assets.map(a=>a.id)).size,5);
 const saved=JSON.stringify(w.state.plume);for(const action of [()=>w.setPlume({assets:[]}),()=>w.setPlume({speedMps:0}),()=>w.setPlumeAsset('asset-1',{widthM:0}),()=>w.setPlumeAsset('missing',{name:'x'}),()=>w.removePlumeAsset('missing')])assert.throws(action);assert.equal(JSON.stringify(w.state.plume),saved);
 const report=w.serialize();assert.equal(report.plumeExploration.acceptedForVerdict,false);assert.equal(report.plumeExploration.results.A.damage,'not_evaluated');assert.equal(report.plumeExploration.results.A.terrainApplied,false);
});
