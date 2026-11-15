import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import ep from '../data/horizons/workspace-ephemeris.json' with {type:'json'};
import science from '../data/science/real-workspace.json' with {type:'json'};
import terrainEvidence from '../data/science/terrain-acceptance-evidence.json' with {type:'json'};
import {createWorkspace} from '../src/workspace/store.mjs';
import {selectedReport,canonicalReportInput,reportHash,timeSeriesCsv} from '../src/workspace/report-payload.mjs';
import {evidenceRegistry,evidenceReferenceContent} from '../src/workspace/evidence-reference.mjs';
import {reportMarkup} from '../src/workspace/report-ui.mjs';
const w=createWorkspace(ep,{science,terrainEvidence});
test('report selection isolates B without altering assessment or discarding mandatory scientific limits',()=>{
 const full=w.serialize(),original=JSON.stringify(full),report=selectedReport(full,{comparison:false,sources:false,research:false},'B');
 assert.deepEqual(Object.keys(report.scenarios),['B']);assert.deepEqual(Object.keys(report.terrainReferenceEvidence),['B']);assert.equal(report.dustExploration,undefined);assert.equal(report.plumeExploration,undefined);assert.equal(report.radiationExploration,undefined);assert.deepEqual(report.limitations,full.limitations);assert.equal(report.classification,full.classification);assert.deepEqual(report.nasaReferenceStudy.published,full.nasaReferenceStudy.published);assert.deepEqual(report.nasaReferenceStudy.exclusions,full.nasaReferenceStudy.exclusions);assert.equal(report.nasaReferenceStudy.source.sha256,full.nasaReferenceStudy.source.sha256);assert.equal(report.nasaReferenceStudy.source.bytes,undefined);assert.ok(report.scenarios.B.sourceRecords[0].sha256);assert.equal(report.scenarios.B.sourceRecords[0].bytes,undefined);assert.equal(JSON.stringify(full),original);
});
test('locally generated canonical digest is reproducible and changes with report inputs or selection',async()=>{
 const full=selectedReport(w.serialize()),hash=await reportHash(full);assert.equal(hash,createHash('sha256').update(canonicalReportInput(full)).digest('hex'));assert.notEqual(hash,await reportHash(selectedReport(full,{comparison:false},'B')));assert.notEqual(hash,await reportHash(selectedReport(full,{research:false})));full.requirements.minSun=.81;assert.notEqual(hash,await reportHash(full));
});
test('time-series CSV preserves unknown versus false, UTC and partial sample weights',()=>{
 const result={classification:'real,"bounded"',records:[{time:Date.UTC(2027,0,13),weight:.05,lit:false,eligible:null,earth:true,overlap:null,sunElevation:-2}]},csv=timeSeriesCsv({B:result},['B']),lines=csv.split('\r\n');assert.equal(lines.length,2);assert.ok(lines[1].includes('"real,""bounded"""'));assert.ok(lines[1].includes('"2027-01-13T00:00:00.000Z","0.05"'));assert.ok(lines[1].endsWith('"false","","true",""'));assert.ok(!csv.includes('undefined'));
});
test('report preview uses the selected real scenario, including research views, without borrowing A',()=>{
 const report=selectedReport(w.serialize(),{comparison:false},'B'),markup=reportMarkup({report,workspace:w,results:{B:w.result('B')},providers:{B:w.provider('B')},active:'B',options:{comparison:false,sources:true,research:true}});assert.match(markup,/73\.1%/);assert.doesNotMatch(markup,/Scenario A|Shackleton rim/);assert.match(markup,/Conditional rescue assumptions/);assert.match(markup,/Source DEM preview|source DEM preview/);assert.doesNotMatch(markup,/undefined/);
});
test('evidence registry retains independent stereo subset hashes and real thermal source identities',()=>{
 const registry=evidenceRegistry({science,provider:w.provider('B')}),stereo=registry.find(r=>r.category==='Stereo'),thermal=registry.find(r=>r.category==='Historical thermal');assert.ok(stereo);assert.equal(stereo.sha256,stereo.metadata.subsetSha256);assert.equal(stereo.metadata.wholeRemoteSha256,null);assert.ok(thermal.url.startsWith('https:'));assert.ok(registry.some(r=>r.url.includes('de421.bsp')));
});
test('evidence inspector does not borrow stereo or ensemble coverage for unsupported points and escapes search text',()=>{
 const markup=evidenceReferenceContent({science,workspace:w,provider:w.provider('B'),group:'stereo'});assert.match(markup,/No matching stereo coverage at this point/);const search=evidenceReferenceContent({science,workspace:w,provider:w.provider('B'),query:'<script>alert(1)</script>'});assert.doesNotMatch(search,/<script>/);assert.match(search,/No matching source records/);const sample=evidenceReferenceContent({science,workspace:w,provider:{metadata:[]}});assert.match(sample,/No measured footprint in this mode/);assert.match(sample,/No matching local ensemble/);
});
test('report source footer distinguishes sample and reference modes from measured terrain',()=>{
 for(const [mode,label] of [['sample','Synthetic demonstration'],['horizons','JPL Horizons reference']]){
  const workspace=createWorkspace(ep,{science,terrainEvidence});workspace.setMode(mode);const markup=reportMarkup({report:selectedReport(workspace.serialize()),workspace,results:{A:workspace.result('A'),B:workspace.result('B')},providers:{A:workspace.provider('A'),B:workspace.provider('B')},options:{comparison:true,sources:true,research:true}});
  assert.ok(markup.includes('<b>Source</b><p>'+label+'<br>'));assert.doesNotMatch(markup,/undefined/);
 }
});
