import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assessDust,defaultDust,STEFAN_BOLTZMANN as sigma} from '../src/workspace/dust.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const fixture={...defaultDust,enabled:true,material:'custom',coveragePercent:0,areaM2:2,internalHeatW:2*sigma*300**4,incidentSolarWm2:0,cleanAlpha:0,cleanEpsilon:1,dustAlpha:0,dustEpsilon:1,skyViewFactor:1,skyTemperatureK:0,groundTemperatureK:0,limitK:300};

test('pinned dust table transcriptions select fine-particle alpha and 300 K epsilon, with exact source/specification identity',()=>{
 const spec=JSON.parse(read('data/dust/materials.json')),validation=JSON.parse(read('data/dust/reference-validation.json')),manifest=JSON.parse(read('data/dust-inputs.json'));
 assert.equal(validation.materialSpecSha256,createHash('sha256').update(read('data/dust/materials.json')).digest('hex'));assert.equal(validation.checks.length,3);
 assert.equal(spec.emittanceReferenceK,300);assert.equal(spec.pdfPage,10);
 for(const material of spec.materials){const check=validation.checks.find(c=>c.material===material.id);assert.equal(check.status,'verified_transcription');assert.equal(check.alpha,material.alpha);assert.equal(check.epsilon,material.epsilon);assert.equal(check.sourceSha256,manifest.records.find(r=>r.name===spec.sourceFile).sha256);}
});
test('blackbody reference balances at exactly 300 K, preserves zero coverage equality and area scaling',()=>{
 const r=assessDust(fixture);close(r.clean.temperatureK,300);close(r.dusty.temperatureK,300);close(r.deltaTemperatureK,0);close(r.clean.heatMarginW,0);assert.equal(r.clean.limitStatus,'within_assumed_limit');close(r.clean.balance.residualW,0);assert.equal(r.curve.length,21);
 close(assessDust({...fixture,areaM2:4}).clean.temperatureK,300/2**.25);assert.equal(assessDust({...fixture,limitK:299}).clean.limitStatus,'exceeds_assumed_limit');
 assert.deepEqual(r.curve.map(c=>c.coveragePercent),Array.from({length:21},(_,i)=>i*5));
});
test('optical endpoints, absorbed shortwave energy and residuals use declared area and preserve material provenance',()=>{
 const r=assessDust({...defaultDust,enabled:true,coveragePercent:100});close(r.dusty.alpha,.75);close(r.dusty.epsilon,.83);assert.equal(r.dustEndmember.transcription,'verified_transcription');assert.equal(r.propertyEvidence.siteMeasurementApplied,false);assert.equal(r.acceptedForVerdict,false);
 const half=assessDust({...defaultDust,enabled:true,coveragePercent:50});close(half.dusty.alpha,.475);close(half.dusty.epsilon,.865);close(half.dusty.balance.absorbedShortwaveW,237.5);close(half.dusty.balance.residualW,0,1e-7);
 for(const material of ['jsc1a','nulht2m','ob1','custom']){const x=assessDust({...defaultDust,enabled:true,material});close(x.clean.balance.residualW,0,1e-7);close(x.dusty.balance.residualW,0,1e-7);}
});
test('black sky/ground view factors obey fourth-power weighting and hot surroundings can make capacity negative',()=>{
 const a={...fixture,internalHeatW:0,skyViewFactor:.25,skyTemperatureK:100,groundTemperatureK:300,limitK:200},r=assessDust(a);
 close(r.clean.temperatureK,(.25*100**4+.75*300**4)**.25);assert.ok(r.clean.capacityAtLimitW<0);assert.equal(r.clean.limitStatus,'exceeds_assumed_limit');
 close(assessDust({...a,cleanEpsilon:.2}).clean.temperatureK,r.clean.temperatureK);close(assessDust({...a,skyViewFactor:0}).clean.temperatureK,300);close(assessDust({...a,skyViewFactor:1}).clean.temperatureK,100);
});
test('dust can warm or cool under explicit optics; disabled models provide no temperature estimates',()=>{
 assert.equal(assessDust(defaultDust).clean,null);assert.deepEqual(assessDust(defaultDust).curve,[]);
 const warmer=assessDust({...defaultDust,enabled:true});assert.ok(warmer.deltaTemperatureK>0);
 const cooler=assessDust({...fixture,coveragePercent:100,cleanEpsilon:.5,dustEpsilon:1});assert.ok(cooler.deltaTemperatureK<0);assert.ok(cooler.deltaCapacityAtLimitW>0);
 const identity=assessDust({...defaultDust,enabled:true,material:'custom',dustAlpha:defaultDust.cleanAlpha,dustEpsilon:defaultDust.cleanEpsilon});close(identity.deltaTemperatureK,0);close(identity.deltaCapacityAtLimitW,0);
});
test('invalid radiator values, material names and coerced types reject; input and source evidence remain immutable',()=>{
 for(const patch of [{areaM2:0},{cleanEpsilon:0},{dustEpsilon:0},{skyViewFactor:1.01},{coveragePercent:101},{incidentSolarWm2:-1},{skyTemperatureK:-1},{internalHeatW:NaN},{cleanAlpha:'0.2'},{enabled:1},{material:'__proto__'}])assert.throws(()=>assessDust({...fixture,...patch}));
 const before=JSON.stringify(fixture),r=assessDust(fixture);r.assumptions.areaM2=999;r.sources[0].sha256='changed';assert.equal(JSON.stringify(fixture),before);assert.notEqual(assessDust(fixture).sources[0].sha256,'changed');
});
test('A/B dust inputs and reports are independent, transactional and isolated from real environmental and historical data',()=>{
 const w=createWorkspace(JSON.parse(read('data/horizons/workspace-ephemeris.json')),{science:JSON.parse(read('data/science/real-workspace.json'))}),before=w.result('A'),thermal=JSON.stringify(w.serialize().scenarios.A.thermalContext);
 w.setDust({enabled:true,coveragePercent:50});assert.strictEqual(w.result('A'),before);assert.equal(w.state.dust.B.enabled,false);assert.equal(w.serialize().dustExploration.acceptedForVerdict,false);assert.equal(JSON.stringify(w.serialize().scenarios.A.thermalContext),thermal);
 const settings=JSON.stringify(w.state.dust);for(const patch of [{areaM2:0},{material:'unknown'},{siteMeasurementApplied:true}])assert.throws(()=>w.setDust(patch));assert.equal(JSON.stringify(w.state.dust),settings);
 const old=w.dustResult();w.setDate('2027-01-14T00:00:00Z');assert.deepEqual(w.dustResult(),old);w.select('B');assert.equal(w.dustResult().status,'not_evaluated');
});
