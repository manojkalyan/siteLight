import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assessRadiation,defaultRadiation,primaryProtonResult,craterMonth} from '../src/workspace/radiation.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

test('radiation bundle retains pinned source/preparer identity, all observation days and correct NIST columns/units',()=>{
 const raw=read('data/radiation/radiation-evidence.json'),data=JSON.parse(raw),report=JSON.parse(read('data/radiation/build-report.json')),manifest=JSON.parse(read('data/radiation-inputs.json'));
 assert.equal(createHash('sha256').update(raw).digest('hex'),report.bundleSha256);assert.equal(createHash('sha256').update(read('scripts/prepare-radiation.py')).digest('hex'),report.preparerSha256);assert.deepEqual(report.sources,manifest.records);assert.deepEqual(data.sources,manifest.records);assert.equal(data.sources.length,9);
 assert.equal(data.crater.records.length,1285);assert.equal(data.crater.unit,'mGy_Si/day');assert.equal(data.crater.start,'2009-06-26');assert.equal(data.crater.end,'2012-12-31');
 for(const m of Object.values(data.pstar.materials)){assert.equal(m.rows.length,132);assert.ok(m.rows.every((r,i)=>!i||r.energyMeV>m.rows[i-1].energyMeV&&r.csdaRangeGcm2>m.rows[i-1].csdaRangeGcm2));}
 const row=data.pstar.materials.aluminum.rows.find(r=>r.energyMeV===100);assert.equal(row.csdaRangeGcm2,10.01);assert.equal(row.projectedRangeGcm2,9.976);assert.notEqual(row.csdaRangeGcm2,row.projectedRangeGcm2);
});
test('known proton endpoints and exact range exhaustion preserve energy and never infer a total dose',()=>{
 const empty=primaryProtonResult('aluminum',100,0,10);assert.equal(empty.residualEnergyMeV,100);assert.equal(empty.panelMassKg,0);assert.equal(empty.thicknessCm,0);
 const endpoint=primaryProtonResult('aluminum',100,10.01-5.325,10);assert.equal(endpoint.residualEnergyMeV,70);assert.deepEqual(endpoint.residualEnergyBracketMeV,[70,70]);
 const stopped=primaryProtonResult('aluminum',100,10.01,10);assert.equal(stopped.status,'csda_range_exhausted');assert.equal(stopped.residualEnergyMeV,0);assert.equal(stopped.humanDose,'not_evaluated');assert.equal(stopped.secondaryDose,'not_evaluated');
 const below=primaryProtonResult('aluminum',100,10.01-1.471e-5/2,10);assert.equal(below.status,'below_table_range');assert.equal(below.residualEnergyMeV,null);assert.deepEqual(below.residualEnergyBracketMeV,[0,.001]);
});
test('log-log inverse respects brackets and geometric midpoint; mass/thickness use independent unit conversions',()=>{
 const midpointRange=Math.sqrt(4.669*5.325),r=primaryProtonResult('aluminum',100,10.01-midpointRange,10);close(r.residualEnergyMeV,Math.sqrt(65*70));assert.deepEqual(r.residualEnergyBracketMeV,[65,70]);
 const a=primaryProtonResult('aluminum',100,5,10),water=primaryProtonResult('water',100,5,10),pe=primaryProtonResult('polyethylene',100,5,10);
 assert.equal(a.panelMassKg,500);close(a.thicknessCm,5/2.6989);close(water.thicknessCm,5);close(pe.thicknessCm,5/.94);assert.equal(water.panelMassKg,a.panelMassKg);
 assert.ok(primaryProtonResult('aluminum',100,6,10).residualEnergyMeV<a.residualEnergyMeV);
});
test('historical orbital rates, correction and quality filtering retain source numbers without mission-time conversion',()=>{
 const o=craterMonth(defaultRadiation),last=o.records.at(-1);assert.equal(o.qualifyingDays,31);assert.equal(last.date,'2012-12-31');assert.equal(last.sourceValueMgySiDay,.10356);assert.equal(last.coveragePercent,100);assert.equal(o.unit,'mGy_Si/day');assert.equal(o.uncertainty,null);
 const corrected=craterMonth({...defaultRadiation,corrected:true});assert.equal(corrected.records.at(-1).sourceValueMgySiDay,.15486);assert.notEqual(corrected.arithmeticMeanMgySiDay,o.arithmeticMeanMgySiDay);
 const partial=craterMonth({...defaultRadiation,archiveMonth:'2009-06'});assert.equal(partial.records.find(r=>r.date==='2009-06-26').sourceValueMgySiDay,.19014);assert.equal(partial.records.find(r=>r.date==='2009-06-26').usedValueMgySiDay,null);assert.equal(partial.records[0].reason,'outside_loaded_archive');
 const permissive=craterMonth({...defaultRadiation,archiveMonth:'2009-06',minCoveragePercent:0});assert.equal(permissive.records.find(r=>r.date==='2009-06-26').usedValueMgySiDay,.19014);
 const flagged=craterMonth({...defaultRadiation,archiveMonth:'2012-03'}).records.find(r=>r.date==='2012-03-15');assert.equal(flagged.sourceRateFlag,'AB');assert.equal(flagged.usedValueMgySiDay,null);assert.equal(flagged.sourceCoverageFlag,'AB');
});
test('model settings never couple archived silicon dose, primary energy, terrain or human exposure',()=>{
 assert.equal(assessRadiation(defaultRadiation).orbitalObservations,null);const r=assessRadiation({...defaultRadiation,enabled:true});assert.equal(r.acceptedForVerdict,false);assert.equal(r.surfaceDose,'not_evaluated');assert.equal(r.effectiveDose,'not_evaluated');assert.equal(r.terrainApplied,false);assert.equal(r.curve.length,31);
 const changed=assessRadiation({...defaultRadiation,enabled:true,archiveMonth:'2012-03',detector:'D3',corrected:true});assert.deepEqual(changed.protonComparison,r.protonComparison);
 const moreShield=assessRadiation({...defaultRadiation,enabled:true,arealDensityGcm2:100});assert.deepEqual(moreShield.orbitalObservations,r.orbitalObservations);assert.equal(moreShield.protonComparison.secondaryDose,'not_evaluated');
});
test('invalid/ambiguous settings reject and exported source objects cannot mutate evidence',()=>{
 for(const patch of [{material:'__proto__'},{energyMeV:101},{energyMeV:'100'},{areaM2:0},{arealDensityGcm2:-1},{archiveMonth:'2027-01'},{detector:'D7'},{minCoveragePercent:NaN},{enabled:1},{corrected:1}])assert.throws(()=>assessRadiation({...defaultRadiation,...patch}));
 const r=assessRadiation({...defaultRadiation,enabled:true});r.sources[0].sha256='changed';r.protonComparison.source.sha256='changed';r.orbitalObservations.source.sha256='changed';assert.notEqual(assessRadiation({...defaultRadiation,enabled:true}).protonComparison.source.sha256,'changed');assert.notEqual(craterMonth(defaultRadiation).source.sha256,'changed');
});
test('A/B radiation settings edit transactionally without changing environmental or Diviner data',()=>{
 const w=createWorkspace(JSON.parse(read('data/horizons/workspace-ephemeris.json')),{science:JSON.parse(read('data/science/real-workspace.json'))}),environment=w.result('A'),thermal=JSON.stringify(w.serialize().scenarios.A.thermalContext);
 w.setRadiation({enabled:true,material:'water'});assert.strictEqual(w.result('A'),environment);assert.equal(JSON.stringify(w.serialize().scenarios.A.thermalContext),thermal);assert.equal(w.state.radiation.B.enabled,false);
 const prior=JSON.stringify(w.state.radiation);for(const patch of [{energyMeV:101},{surfaceDose:0},{minCoveragePercent:-1}])assert.throws(()=>w.setRadiation(patch));assert.equal(JSON.stringify(w.state.radiation),prior);
 const before=w.radiationResult();w.setDate('2027-01-14T00:00:00Z');assert.deepEqual(w.radiationResult(),before);const report=w.serialize();assert.equal(report.radiationExploration.acceptedForVerdict,false);assert.equal(report.model,'workspace-evaluator-11');
});
