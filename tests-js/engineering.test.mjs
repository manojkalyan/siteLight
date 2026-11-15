import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {engineeringEvidence} from '../src/workspace/engineering.mjs';
import {defaultLogistics,logisticsFields,evaluateLogistics} from '../src/workspace/logistics.mjs';
import {engineeringMarkup} from '../src/workspace/logistics-view.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url));

test('reference transcription evidence matches the exact source specification and pinned PDF identities',()=>{
 const spec=JSON.parse(read('data/engineering/references.json')),report=JSON.parse(read('data/engineering/reference-validation.json')),manifest=JSON.parse(read('data/engineering-inputs.json'));
 assert.equal(report.referenceSpecSha256,createHash('sha256').update(read('data/engineering/references.json')).digest('hex'));
 assert.equal(report.checks.length,7);
 for(const reference of spec.references)for(const observation of reference.observations){
  const check=report.checks.find(c=>c.reference===reference.id&&c.observation===observation.id),source=manifest.records.find(r=>r.name===reference.file);
  assert.equal(check.status,'verified_transcription');assert.equal(check.value,observation.value);assert.equal(check.pdfPage,observation.pdfPage);assert.equal(check.sourceSha256,source.sha256);
 }
});
test('published numbers with different accounting boundaries never accept or replace an architecture parameter',()=>{
 const inputs={...defaultLogistics,demandKgPerCrewDay:3.217,extractionRecovery:.75,storageEfficiency:.8,storageMassKgKwh:1000/140},before=JSON.stringify(inputs),e=engineeringEvidence(inputs,logisticsFields);
 assert.equal(e.coverage.acceptedParameters,0);assert.equal(e.coverage.totalParameters,Object.keys(logisticsFields).length);assert.equal(e.coverage.contextLinkedParameters,7);assert.equal(e.acceptedForVerdict,false);
 assert.ok(e.parameters.every(p=>p.status==='planning_assumption'&&!p.accepted&&p.requiredEvidence));
 assert.ok(Math.abs(e.referenceConversions.batteryKgPerNameplateKwh-7.142857142857143)<1e-12);
 assert.equal(e.gates.find(g=>g.id==='sources').status,'transcription_verified');assert.ok(e.gates.filter(g=>g.id!=='sources').every(g=>g.status==='open'));
 assert.equal(JSON.stringify(inputs),before);assert.throws(()=>engineeringEvidence(inputs,{unknown:['Unknown','kg']}),/Missing engineering evidence/);
 e.references[0].observations[0].value=999;assert.equal(engineeringEvidence(inputs,logisticsFields).references[0].observations[0].value,3.217);
});
test('engineering evidence travels with numerical results without changing the checked mass model',()=>{
 const result=evaluateLogistics(defaultLogistics,1);assert.equal(result.totalKg,21670);assert.equal(result.engineering.acceptedForVerdict,false);assert.equal(result.model,'water-logistics-screen-2');
 const html=engineeringMarkup(result.engineering);assert.match(html,/0 of 20 architecture parameters accepted/);assert.match(html,/#page=72/);assert.match(html,/Planning assumption/);assert.match(html,/not automatically applied/);
});
