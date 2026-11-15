import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainRoute,skyContext} from '../src/workspace/routes.mjs';
import {terrainScreen,evaluate,defaultRequirements,makeScenario,interpolateRows} from '../src/workspace/engine.mjs';
import {assessMonthly,monthlyReport} from '../src/workspace/monthly.mjs';
import {getMonthlyBlocks} from '../scripts/science-api.mjs';
import {createRealProvider} from '../src/workspace/real-data.mjs';
import {readFileSync} from 'node:fs';
test('monthly service rejects unknown/inherited site names and invalid mission durations',async()=>{
 for(const request of [{siteId:'__proto__',durationHours:168},{siteId:['real-nobile'],durationHours:168},{siteId:'real-nobile',durationHours:1000},{siteId:'real-nobile',durationHours:'168'}])await assert.rejects(getMonthlyBlocks(request));
});
test('route screening finds a shortest plane path and rejects missing/steep endpoints and blocked barriers',()=>{
 const terrain=terrainScreen({lon:0},{radius:100,baseline:20,limit:12},(x,z)=>0),r=terrainRoute(terrain,'+X');assert.equal(r.status,'found');assert.equal(r.lengthM,80);assert.equal(r.path.length,9);
 const barrier={...terrain,cells:terrain.cells.map(c=>c.x===40?{...c,slope:null}:c)};assert.equal(terrainRoute(barrier,'+X').status,'no_route');
 const steep={...terrain,cells:terrain.cells.map(c=>c.x===80&&c.z===0?{...c,slope:30}:c)};assert.equal(terrainRoute(steep,'+X').status,'no_route');assert.throws(()=>terrainRoute(terrain,'bad'));assert.equal(terrainRoute(null).status,'not_evaluated');
});
test('diagonal connectivity does not cut between blocked adjacent cells',()=>{
 const t=terrainScreen({lon:0},{radius:100,baseline:20,limit:12},()=>0),blocked={...t,cells:t.cells.map(c=>c.x===0&&c.z===0||c.x>0&&c.z>0?c:{...c,slope:null})};assert.equal(terrainRoute(blocked,'+X+Y').status,'no_route');
});
test('upward solid angle matches analytic constant horizons and preserves missing sectors',()=>{
 for(const [h,f] of [[0,1],[30,.5],[90,0],[-5,1]]){const r=skyContext({elevationDeg:Array(720).fill(h)});assert.ok(Math.abs(r.visibleUpwardSolidAngleFraction-f)<1e-12);assert.match(r.meaning,/Not radiation dose/);}
 const values=Array(720).fill(0);values[5]=null;assert.equal(skyContext({elevationDeg:values}).visibleUpwardSolidAngleFraction,null);
});
test('real monthly study has 84 separate windows, reproduces direct evaluations and exports source metadata without bulk records',async()=>{
 const science=JSON.parse(readFileSync(new URL('../data/science/real-workspace.json',import.meta.url))),site=science.sites['real-nobile'].site,scenario=makeScenario(site),provider=createRealProvider(site,science),data=await getMonthlyBlocks({siteId:site.id,durationHours:168}),study=assessMonthly(data,scenario,defaultRequirements,provider,science);
 assert.equal(study.requested,84);assert.equal(study.evaluated+study.unknown,84);assert.equal(study.confirmedPasses,0);assert.equal(study.cells.at(-1).utc,'2033-12-01T00:00:00Z');
 for(const i of [0,20,83]){const block=data.blocks[i],p={...provider,covers:(a,b)=>a>=Date.parse(block.start)&&b<=Date.parse(block.end),geometry:t=>interpolateRows(block.records,t)},r=evaluate({...scenario,date:block.start,offset:0},defaultRequirements,p);assert.deepEqual(study.cells[i].result.fractions,r.fractions);assert.equal(study.cells[i].result.status,r.status);}
 assert.equal(monthlyReport(study).data,undefined);assert.ok(monthlyReport(study).provenance.sources.length);const invalid={...data,blocks:data.blocks.slice(0,-1)};assert.throws(()=>assessMonthly(invalid,scenario,defaultRequirements,provider,science));
 assert.ok(monthlyReport(study).terrainSources.some(s=>s.name.startsWith('terrain/')));assert.equal(monthlyReport(study).horizon.azimuthStepDeg,.5);
 const unknown=assessMonthly(data,scenario,{...defaultRequirements,minSun:0,minEarth:0,minOverlap:0},{...provider,horizon:()=>NaN},science);assert.equal(unknown.unknown,84);assert.equal(unknown.nominalFits,0);assert.equal(unknown.nominalFractionEvaluated,null);
});
test('monthly geometry preserves leap-year spacing and a partial final mission bin',async()=>{
 const science=JSON.parse(readFileSync(new URL('../data/science/real-workspace.json',import.meta.url))),site=science.sites['real-nobile'].site,data=await getMonthlyBlocks({siteId:site.id,durationHours:48.25});
 assert.equal(data.blocks[0].records.length,291);assert.equal(Date.parse(data.blocks[14].start)-Date.parse(data.blocks[13].start),29*86400000);
 const study=assessMonthly(data,makeScenario(site),{...defaultRequirements,duration:48.25},createRealProvider(site,science),science);assert.ok(Math.abs(study.cells[0].result.known-48.25)<1e-8);assert.equal(study.cells[0].result.end-study.cells[0].result.start,48.25*3600000);
});
