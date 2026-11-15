import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createWorkspace} from '../src/workspace/store.mjs';
import {createRealProvider,interpolateHorizon,sampleGrid,realTerrainScreen} from '../src/workspace/real-data.mjs';
import {evaluate,makeScenario,defaultRequirements,findAlternative,HOUR} from '../src/workspace/engine.mjs';
import {horizonChart,skyplot} from '../src/workspace/charts.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const science=JSON.parse(read('data/science/real-workspace.json')),reference=JSON.parse(read('data/horizons/workspace-ephemeris.json'));
const entries=Object.values(science.sites),entry=entries[0],scenario=makeScenario(entry.site);
const sha=s=>createHash('sha256').update(s).digest('hex');

test('real dataset pins a matching frame, geometric correction, source products, and reproducible algorithm',()=>{
 assert.equal(science.ephemeris,'DE421');assert.equal(science.frame,'MOON_ME');assert.match(science.convention,/aberration NONE/);
 assert.equal(science.algorithm.sha256,sha(read('scripts/science_pipeline.py')));
 const manifest=JSON.parse(read('data/science-inputs.json'));assert.equal(science.inputs.length,manifest.records.length);
 for(const input of science.inputs)assert.equal(input.sha256,manifest.records.find(r=>r.name===input.name).sha256);
 for(const e of entries){assert.equal(e.terrain.metadata.pixelSpacingM[0],5);assert.equal(e.site.observerHeightM,2);assert.ok(Math.abs(e.site.altKm*1000-e.site.surfaceElevationM-2)<1e-8);assert.ok(e.terrain.metadata.projectionRoundtripErrorM<1e-4);}
});
test('six distinct source-derived study points have full three-month time coverage and independent datasets',()=>{
 assert.equal(entries.length,6);assert.equal(new Set(entries.map(e=>e.site.tile)).size,6);
 for(const e of entries){assert.equal(e.records.length,12961);assert.equal(e.records[0][0],Date.UTC(2027,0,1));assert.equal(e.records.at(-1)[0],Date.UTC(2027,3,1));assert.equal(e.terrain.horizon.elevationDeg.length,720);assert.ok(e.terrain.horizon.rayCoverage.every(v=>v===1));assert.match(e.site.coordinateStatus,/center|pixel/);}
});
test('external geometric reference checks pass their predeclared tolerances and retain raw-source identity',()=>{
 for(const e of entries){for(const check of Object.values(e.externalGeometryCheck)){assert.equal(check.passed,true);assert.ok(check.maxAngularErrorDeg<check.toleranceDeg);assert.equal(check.epochs,3);}assert.ok(e.transformPathMaxErrorDeg<1e-8);}
 for(const s of science.externalReferences)assert.equal(sha(read('data/validation/'+s.name)),s.sha256);
});
test('horizon interpolation wraps at north, permits real negative elevations, and preserves missing azimuths',()=>{
 const fine=Array(720).fill(0);fine[0]=4;fine[719]=2;assert.equal(interpolateHorizon(fine,359.75),3);assert.equal(interpolateHorizon(fine,.25),2);fine[1]=null;assert.ok(Number.isNaN(interpolateHorizon(fine,.25)));
 const a=Array(360).fill(-2);a[359]=-4;a[0]=-2;assert.equal(interpolateHorizon(a,359.5),-3);assert.equal(interpolateHorizon(a,-.5),-3);
 a[0]=null;assert.ok(Number.isNaN(interpolateHorizon(a,359.5)));assert.ok(Number.isNaN(interpolateHorizon(a,0)));
});
test('both scientific charts retain half-degree horizon peaks and use their full elevation range',()=>{
 const values=Array(720).fill(0);values[1]=80;const p={terrain:{horizon:{elevationDeg:values}},geometry:()=>null,horizon:az=>interpolateHorizon(values,az)},r={records:[]};
 const chart=horizonChart(r,p,0),sky=skyplot(r,p,0);assert.match(chart,/to 80 degrees/);
 for(const svg of [chart,sky])assert.equal(svg.match(/<polyline points="([^"]+)"/)[1].split(' ').length,721);
});
test('real footprint sampler uses source pixel centers without axis transposition and reports source RMS context',()=>{
 for(const e of entries){assert.ok(Math.abs(sampleGrid(e.terrain.grid,'elevationM',0,0)-e.site.surfaceElevationM)<.000051);const r=realTerrainScreen(e,{radius:100,baseline:20,limit:45});assert.equal(r.coverage,1);assert.ok(Number.isFinite(r.roughness));assert.ok(r.heightRmsM.median>=0);assert.ok(r.publishedSlopeRmsDeg.median>=0);assert.equal(r.status,'uncertain');assert.equal(r.nominalStatus,'pass');assert.match(r.uncertainty,/not a propagated/);}
});
test('missing grid values and unsupported real locations never become a borrowed terrain result',()=>{
 const grid={size:3,spacingM:5,originX:-5,originY:5,projectionScale:1,elevationM:Array(9).fill(2)};
 grid.elevationM[4]=null;assert.ok(Number.isNaN(sampleGrid(grid,'elevationM',0,0)));assert.ok(Number.isNaN(sampleGrid(grid,'elevationM',100,0)));
 const p=createRealProvider({...entry.site,lat:entry.site.lat+.001},science);assert.equal(evaluate(scenario,defaultRequirements,p).status,'insufficient_data');assert.ok(Number.isNaN(p.horizon(0)));
});
test('a nominal local fit remains uncertain and date proposals preserve that qualification',()=>{
 const p=createRealProvider(entry.site,science),settings={...defaultRequirements,minSun:0,minEarth:0,minOverlap:0};
 const r=evaluate(scenario,settings,p);assert.equal(r.status,'uncertain');assert.equal(r.nominalStatus,'pass');assert.match(r.reason,/Far-field/);
 const proposal=findAlternative(scenario,settings,p);assert.ok(proposal.scenario);assert.equal(proposal.result.status,'uncertain');assert.match(proposal.qualification,/far-field/);
});
test('gaps from real terrain share the evaluator records and respect enabled requirements',()=>{
 const p=createRealProvider(entries[1].site,science),s=makeScenario(entries[1].site),r=evaluate(s,defaultRequirements,p);
 for(const key of ['dark','solar','earth'])for(const g of r.gaps[key])assert.ok(g.start>=r.start&&g.end<=r.end&&g.hours>=0);
 const configured=evaluate(s,{...defaultRequirements,maxDark:0,maxEarth:0},p);assert.ok(configured.rules.some(r=>r.id==='gap-dark'));assert.ok(configured.rules.some(r=>r.id==='gap-earth'));
 assert.equal(r.records.length,1008);assert.ok(Math.abs(r.known-defaultRequirements.duration)<1e-8);
});
test('a real failure has a re-evaluated daily nominal flip while an infeasible loaded case stays no-flip',()=>{
 const site=science.sites['real-nobile'].site,p=createRealProvider(site,science),s={...makeScenario(site),date:'2027-01-01T00:00:00Z'},original=JSON.stringify([s,defaultRequirements]);
 const before=evaluate(s,defaultRequirements,p);assert.equal(before.status,'fail');assert.equal(before.sun,0);
 const proposal=findAlternative(s,defaultRequirements,p);assert.equal(proposal.delta,9);assert.equal(proposal.result.status,'uncertain');assert.equal(proposal.result.nominalStatus,'pass');assert.ok(proposal.result.rules.every(r=>r.pass));
 assert.deepEqual(evaluate(proposal.scenario,defaultRequirements,p),proposal.result);assert.equal(JSON.stringify([s,defaultRequirements]),original);
 const impossible=findAlternative(scenario,{...defaultRequirements,minSun:1,minEarth:1,minOverlap:1},createRealProvider(entry.site,science));assert.equal(impossible.scenario,null);assert.ok(impossible.tested>0);assert.ok(impossible.unavailable>0);
});
test('real-mode cache reuses unchanged results, invalidates changed requirements, and keeps A/B separate',()=>{
 const w=createWorkspace(reference,{science});assert.equal(w.state.mode,'real');const a=w.result('A'),b=w.result('B');assert.notStrictEqual(a,b);assert.strictEqual(w.result('A'),a);assert.strictEqual(w.provider('A'),w.provider('A'));
 w.setRequirements({minSun:.9});const changed=w.result('A');assert.notStrictEqual(changed,a);assert.notEqual(changed.rules[0].required,a.rules[0].required);assert.ok(w.cacheStats().resultHits>0);
 w.select('B');w.setOffset(2);assert.equal(w.state.scenarios.A.offset,0);assert.notStrictEqual(w.result('B'),b);
});
test('reports include real footprint statistics, horizon extent, source hashes, and independent limits',()=>{
 const report=createWorkspace(reference,{science}).serialize();assert.equal(report.preprocessing.algorithm.sha256,science.algorithm.sha256);
 assert.equal(report.scenarios.A.horizonModel.extentM,125000);assert.equal(report.scenarios.A.horizonModel.farFieldAssessed,true);assert.equal(report.scenarios.A.horizonModel.farFieldComplete,false);assert.ok(report.scenarios.A.terrainSummary.heightRmsM);
 assert.equal(report.scenarios.A.terrainSummary.cells,undefined);assert.equal(report.logistics,'not_evaluated');assert.equal(report.thermal,'historical_context');
});
test('multiscale horizons preserve local obstructions and enclose nominal metrics in declared sensitivity cases',()=>{
 let raised=0;
 for(const e of entries){const h=e.terrain.horizon;assert.equal(h.extentM,125000);assert.equal(h.samplingBands[0].pixelSpacingM,5);assert.equal(h.samplingBands[1].pixelSpacingM,80);
  for(let i=0;i<h.elevationDeg.length;i++){assert.ok(h.elevationDeg[i]>=e.terrain.localHorizon.elevationDeg[i]-1e-6);assert.ok(h.sensitivity.lowerDeg[i]<=h.elevationDeg[i]);assert.ok(h.sensitivity.upperDeg[i]>=h.elevationDeg[i]);}
  raised+=h.farFieldRaisesSectors;
  const r=evaluate(makeScenario(e.site),defaultRequirements,createRealProvider(e.site,science));assert.equal(r.sensitivity.status,'available');assert.equal(r.sensitivity.changesVerdict,false);
  for(const key of ['sun','earth','overlap']){assert.ok(r.sensitivity.fractions[key].lower<=r.fractions[key]+1e-10);assert.ok(r.sensitivity.fractions[key].upper>=r.fractions[key]-1e-10);}
 }
 assert.ok(raised>0,'The far field contributes actual obstructing terrain in the retained cases');
});
test('independent apparent orientation fixtures retain source hashes, tolerances and every bounded case',()=>{
 const report=science.orientationValidation;assert.equal(report.passed,true);assert.equal(Object.keys(report.sites).length,3);
 assert.equal(report.algorithm.sha256,sha(read(report.algorithm.file)));assert.equal(report.thresholds.sunAngularDeg,.01);assert.equal(report.thresholds.earthAngularDeg,.01);
 for(const entry of Object.values(report.sites))for(const check of Object.values(entry.checks)){assert.equal(check.cases.length,3);assert.equal(check.passed,true);assert.ok(check.maxAngularErrorDeg<.000009);}
});
test('negative real horizons remain visible in the horizon chart and the polar skyplot',()=>{
 const p=createRealProvider(entry.site,science),r=evaluate(scenario,defaultRequirements,p);assert.match(horizonChart(r,p,r.start),/Display range -\d+/);assert.match(skyplot(r,p,r.start),/Negative local horizons are shown/);
});
