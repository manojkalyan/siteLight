import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWorkspace} from '../src/workspace/store.mjs';
import {defaultLogistics,evaluateLogistics,findLogisticsFlip,logisticsExplanation} from '../src/workspace/logistics.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('import-only water balance has an independently calculated mass without ISRU hardware or spares on water',()=>{
 const r=evaluateLogistics(defaultLogistics,0);close(r.water.grossKg,11680);close(r.water.makeupKg,2920);close(r.water.reserveKg,120);close(r.contributors.earthWater,3140);close(r.totalKg,11940);
 assert.equal(r.plant.units,0);assert.equal(r.contributors.extractionEquipment,0);assert.equal(r.contributors.energyStorage,0);close(r.water.producedKg+r.water.importedMakeupKg,r.water.makeupKg);
});
const fixture={...defaultLogistics,demandKgPerCrewDay:1,recovery:0,reserveDays:0,initialWaterKg:0,extractable:1,extractionRecovery:1,throughputKgHour:1,reactorPowerKw:1,regolithEnergyKwhKg:.001,waterEnergyKwhKg:0,duty:1,unitMassKg:100,balanceMassKg:0,powerMassKgKw:10,storageHours:0,hardwareKg:1000,spares:0};
test('known yield fixture exercises unit conversion, installed-unit discontinuities and exact budget boundaries',()=>{
 const r=evaluateLogistics(fixture,6,1330);assert.equal(r.plant.units,3);close(r.plant.unitWaterCapacityKg,1051.2);close(r.plant.regolithProcessedKg,48666.66666666667);close(r.totalKg,1330);assert.equal(r.budgetStatus,'fits');assert.equal(evaluateLogistics(fixture,6,1329).budgetStatus,'exceeds');
 assert.equal(evaluateLogistics(fixture,3).plant.units,6);close(evaluateLogistics(fixture,3).totalKg,1660);
});
test('power-limited throughput and storage use declared energy and efficiency; no-extraction has no ISRU',()=>{
 const a={...fixture,reactorPowerKw:1,regolithEnergyKwhKg:2,storageHours:10,storageEfficiency:.5,storageMassKgKwh:2};const r=evaluateLogistics(a,6);close(r.plant.effectiveRegolithRateKgHour,.5);close(r.plant.installedPowerKw,6);close(r.contributors.energyStorage,240);
 assert.equal(evaluateLogistics({...a,extractionShare:0},6).plant.units,0);
 for(const ice of [0,.1,1,3,6]){const x=evaluateLogistics(a,ice);close(Object.values(x.contributors).reduce((s,v)=>s+v,0),x.totalKg);close(x.water.makeupKg,x.water.importedMakeupKg+x.water.producedKg);assert.ok(x.plant.unusedCapacityKg>=-1e-7);}
});
test('grid search re-evaluates the exact proposal and handles nonmonotonic zero-ice and no-fit cases',()=>{
 const before=JSON.stringify(fixture),found=findLogisticsFlip(fixture,1500,3);assert.equal(found.grid.samples,61);assert.ok(found.match);assert.deepEqual(found.match.result,evaluateLogistics(fixture,found.match.iceWtPercent,1500));assert.equal(found.match.result.budgetStatus,'fits');assert.equal(findLogisticsFlip(fixture,1,3).match,null);assert.equal(JSON.stringify(fixture),before);
});
test('invalid assumptions never produce NaN mass or silently coerce input types',()=>{
 for(const patch of [{recovery:1},{duty:0},{demandKgPerCrewDay:NaN},{unitMassKg:-1},{reactorPowerKw:Infinity}])assert.throws(()=>evaluateLogistics({...fixture,...patch},1));for(const ice of [-1,7,NaN,null])assert.throws(()=>evaluateLogistics(fixture,ice));
});
test('opt-in exploration preserves environmental results and independently edits A/B hypothetical ice',()=>{
 const reference=JSON.parse(readFileSync(new URL('../data/horizons/workspace-ephemeris.json',import.meta.url))),w=createWorkspace(reference),before=w.result('A');
 assert.equal(w.serialize().logisticsExploration,null);w.setLogistics({enabled:true,ice:{A:1,B:6}});assert.strictEqual(w.result('A'),before);const report=w.serialize();assert.equal(report.logistics,'not_evaluated');assert.equal(report.logisticsExploration.acceptedForVerdict,false);assert.notEqual(w.logisticsResult('A').totalKg,w.logisticsResult('B').totalKg);assert.match(logisticsExplanation(w.logisticsResult()),/hypothetical/);
 const original=JSON.stringify(w.state.logistics);assert.throws(()=>w.setLogistics({inputs:{duty:0}}));assert.equal(JSON.stringify(w.state.logistics),original);
});
