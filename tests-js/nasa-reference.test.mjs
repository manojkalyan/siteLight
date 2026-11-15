import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nasaReferenceAssessment,nasaReferenceMarkup} from '../src/workspace/nasa-reference.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url));
test('NASA reference study retains the pinned PDF/spec and all 23 verified published values',()=>{
 const spec=JSON.parse(read('data/engineering/nasa-reference-case.json')),v=JSON.parse(read('data/engineering/nasa-reference-validation.json')),r=nasaReferenceAssessment();
 assert.equal(v.specSha256,createHash('sha256').update(read('data/engineering/nasa-reference-case.json')).digest('hex'));assert.equal(v.sourceSha256,spec.source.sha256);assert.equal(r.publishedValues.length,23);assert.equal(r.published.hardwareMassKg,4900);assert.equal(r.published.powerDemandKw,68);assert.equal(r.published.waterKg,15000);assert.equal(r.published.productionDays,225);
});
test('reference ledgers preserve source rounding residuals and independent ideal mass/volume identities',()=>{
 const r=nasaReferenceAssessment();assert.equal(r.status,'published_rounding_checks_pass');assert.equal(r.checks.length,7);assert.ok(r.checks.every(c=>c.passed));
 assert.equal(r.derived.componentHardwareMassKg,4890);assert.ok(Math.abs(r.derived.printedMassResidualKg-10)<1e-9);assert.equal(r.derived.effectiveWaterYieldFraction,.0375);assert.equal(r.derived.idealWaterT,15);assert.equal(r.derived.regolithFromRoundedWaterT,400);assert.equal(r.derived.reportedRegolithT,398);assert.equal(r.derived.regolithRoundingDifferenceT,2);assert.ok(Math.abs(r.derived.mineWidthM-31.945466353033893)<1e-9);
 assert.ok(Math.abs(r.checks.find(c=>c.id==='regolith-water').actual-14.925)<1e-12);assert.ok(Math.abs(r.derived.batteryKgPerNameplateKwh-50/7)<1e-12);
});
test('reference study never calibrates legacy LCSS, establishes local ice or removes published exclusions',()=>{
 const r=nasaReferenceAssessment();assert.equal(r.calibratedLegacyParameters,0);assert.equal(r.acceptedForVerdict,false);assert.equal(r.terrainApplied,false);assert.match(r.siteResourceStatus,/assumed/);assert.ok(r.exclusions.some(e=>/power generation/.test(e)));assert.ok(r.exclusions.some(e=>/cleanup/.test(e)));
 r.published.hardwareMassKg=1;assert.equal(nasaReferenceAssessment().published.hardwareMassKg,4900);assert.match(nasaReferenceMarkup(),/NASA water-ISRU reference study/);
});
test('structured reports carry the reference study without changing the scenario or hypothetical architecture',()=>{
 const w=createWorkspace(JSON.parse(read('data/horizons/workspace-ephemeris.json'))),before=w.result('A');const assumptions=structuredClone(w.state.logistics);const report=w.serialize();assert.equal(report.model,'workspace-evaluator-11');assert.equal(report.nasaReferenceStudy.status,'published_rounding_checks_pass');assert.deepEqual(w.state.logistics,assumptions);assert.strictEqual(w.result('A'),before);assert.equal(report.nasaReferenceStudy.acceptedForVerdict,false);
});
