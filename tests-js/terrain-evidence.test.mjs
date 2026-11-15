import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createWorkspace} from '../src/workspace/store.mjs';
import {createRealProvider} from '../src/workspace/real-data.mjs';
import {augmentRealProvider,reviewedSite,terrainEvidenceSummary,terrainEvidenceMarkup} from '../src/workspace/terrain-evidence.mjs';
import {evaluate,makeScenario,defaultRequirements} from '../src/workspace/engine.mjs';
const bytes=name=>readFileSync(new URL('../'+name,import.meta.url)),read=name=>JSON.parse(bytes(name));
const science=read('data/science/real-workspace.json'),evidence=read('data/science/terrain-acceptance-evidence.json'),reference=read('data/horizons/workspace-ephemeris.json');
const workspace=()=>createWorkspace(reference,{science,terrainEvidence:evidence});
test('six actual published ensembles retain 100 distinct realizations and declared empirical quantiles',()=>{
 const build=read('data/science/terrain-evidence-build.json');assert.equal(build.bundleSha256,createHash('sha256').update(bytes('data/science/terrain-acceptance-evidence.json')).digest('hex'));
 assert.equal(Object.keys(evidence.sites).length,6);
 for(const r of Object.values(evidence.sites)){
  const e=r.localCorrelatedTerrain;assert.equal(e.members,100);assert.equal(new Set(e.sourceCloneNumbers).size,100);assert.equal(e.memberStatistics.length,100);assert.equal(e.retainedWindowHashes.length,100);
  for(const q of Object.values(e.metrics))assert.ok(Number.isFinite(q.p2_5)&&q.p2_5<=q.median&&q.median<=q.p97_5);
  for(const value of Object.values(e.errorCorrelationAcrossMembers))assert.ok(Number.isFinite(value)&&Math.abs(value)<=1+1e-12);
  assert.match(e.interpretation,/Not guaranteed confidence bounds/);
 }
});
test('real evaluator applies the sourced annulus at all six points and preserves every nearer obstruction',()=>{
 let raised=0;
 for(const entry of Object.values(science.sites)){
  const base=createRealProvider(entry.site,science),p=augmentRealProvider(base,entry.site,science,evidence),h=p.terrain.horizon,r=evidence.sites[entry.site.id].farfieldExtension;
  assert.equal(base.terrain.horizon.extentM,125000);assert.equal(h.extentM,500000);assert.equal(h.samplingBands.at(-1).pixelSpacingM,240);
  assert.deepEqual(h.elevationDeg,r.combinedHorizonDeg);assert.equal(h.globalConditionalExclusion.ceilingIsCertifiedPhysicalMaximum,false);assert.equal(h.farFieldComplete,false);
  assert.ok(r.samplingComparison.maxDifferenceDeg<=.1);assert.equal(r.samplingComparison.withinDiagnosticThreshold,true);
  for(let i=0;i<720;i++){assert.ok(h.elevationDeg[i]>=base.terrain.horizon.elevationDeg[i]);assert.equal(p.horizon(i/2),h.elevationDeg[i]);assert.ok(h.sensitivity.lowerDeg[i]<=h.elevationDeg[i]);assert.ok(h.sensitivity.upperDeg[i]>=h.elevationDeg[i]);}
  raised+=r.raisedSectors;
 }
 assert.equal(raised,386);
});
test('corrected horizons cannot increase geometric availability and sensitivity remains explicitly partial',()=>{
 for(const entry of Object.values(science.sites)){
  const base=createRealProvider(entry.site,science),p=augmentRealProvider(base,entry.site,science,evidence),s=makeScenario(entry.site),before=evaluate(s,defaultRequirements,base),after=evaluate(s,defaultRequirements,p);
  for(const key of ['sun','earth','overlap']){assert.ok(after.fractions[key]<=before.fractions[key]+1e-10);assert.ok(after.sensitivity.fractions[key].lower<=after.fractions[key]+1e-10);assert.ok(after.sensitivity.fractions[key].upper>=after.fractions[key]-1e-10);}
  assert.match(after.sensitivity.method,/outer|annulus/);assert.match(after.sensitivity.interpretation,/partial-domain/);assert.equal(p.qualifyPassAsUncertain,true);assert.notEqual(after.status,'pass');
 }
});
test('custom coordinates, stale science and a different data mode never inherit catalog evidence',()=>{
 const entry=Object.values(science.sites)[0],base=createRealProvider(entry.site,science);
 for(const [site,sci] of [[{...entry.site,lat:entry.site.lat+.0001},science],[{...entry.site,id:'custom' },science],[entry.site,{...science,version:'stale'}],[entry.site,{...science,algorithm:{sha256:'different'}}],[entry.site,{...science,inputs:science.inputs.map((s,i)=>i? s:{...s,sha256:'changed-source'})}]]){
  assert.equal(reviewedSite(site,sci,evidence),null);assert.strictEqual(augmentRealProvider(base,site,sci,evidence),base);
 }
 const w=workspace();w.setMode('sample');assert.equal(w.serialize().terrainReferenceEvidence.A,null);assert.equal(terrainEvidenceMarkup(w.state,w.provider()),'');
});
test('unreviewed or invalid outer terrain cannot silently replace a working nominal horizon',()=>{
 const entry=Object.values(science.sites)[0],base=createRealProvider(entry.site,science);
 for(const modify of [r=>r.farfieldExtension.annulusHorizonDeg[0]=null,r=>r.farfieldExtension.annulusHorizonDeg.pop(),r=>r.farfieldExtension.samplingComparison.withinDiagnosticThreshold=false]){
  const e=structuredClone(evidence);modify(e.sites[entry.site.id]);assert.throws(()=>augmentRealProvider(base,entry.site,science,e),/has not passed/);
 }
 assert.equal(base.terrain.horizon.extentM,125000);
});
test('report evidence states the actual footprint applicability and cannot mutate cached provider evidence',()=>{
 const w=workspace(),before=w.result('A'),report=w.serialize();assert.equal(report.terrainReferenceEvidence.A.ensembleMatchesCurrentFootprint,true);assert.equal(report.terrainReferenceEvidence.A.acceptedForVerdict,false);assert.equal(report.scenarios.A.horizonModel.extentM,500000);
 report.terrainReferenceEvidence.A.localCorrelatedTerrain.members=1;assert.equal(w.serialize().terrainReferenceEvidence.A.localCorrelatedTerrain.members,100);
 w.state.terrain.radius=150;assert.equal(terrainEvidenceSummary(w.provider(),w.state.terrain).ensembleMatchesCurrentFootprint,false);assert.match(terrainEvidenceMarkup(w.state,w.provider()),/Reference footprint only/);assert.strictEqual(w.result('A'),before);
});
test('stereo statistics preserve qualified coverage, raw counts and absent independent absolute acceptance',()=>{
 const rows=Object.values(evidence.sites).flatMap(s=>s.stereoComparisons);assert.equal(rows.length,3);
 for(const row of rows){assert.equal(row.qualityMaskApplied,true);assert.equal(row.acceptedAbsoluteAccuracy,false);assert.ok(row.coveredSamples<=row.rawFiniteHeightSamples&&row.rawFiniteHeightSamples<=317);assert.equal(row.coveredSamples+row.confidenceRejectedHeightSamples,row.rawFiniteHeightSamples);assert.match(row.confidencePolicy,/10-14/);}
 assert.equal(evidence.sites['real-nobile'].stereoComparisons.length,0);
 const w=workspace();w.setSite('real-connector');assert.match(terrainEvidenceMarkup(w.state,w.provider()),/57\/317/);
});
