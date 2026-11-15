import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,defaultRequirements,makeScenario,HOUR} from '../src/workspace/engine.mjs';
const scenario=makeScenario({id:'fixture',lat:-89,lon:0}),start=Date.parse(scenario.date);
const provider=fn=>({mode:'sample',covers:()=>true,horizon:()=>0,geometry:t=>({sunAzimuth:(359+(t-start)/HOUR)%360,earthAzimuth:40,...fn((t-start)/HOUR)})});
test('disjoint failed availability intervals rank by declared weights and contain exact rule deficits',()=>{
 const r=evaluate(scenario,{...defaultRequirements,duration:48,minSun:.9,minEarth:.9,minOverlap:.9},provider(h=>({sunElevation:h<12?-2:5,earthElevation:h>=24&&h<36?-2:5})));
 assert.equal(r.diagnostics.length,2);const [sun,earth]=r.diagnostics;
 assert.equal(sun.score,12);assert.ok(Math.abs(earth.score-7.2)<1e-10);assert.equal(sun.hours,12);assert.equal(earth.hours,12);
 assert.deepEqual(sun.ruleIds,['overlap','sun']);assert.deepEqual(earth.ruleIds,['earth','overlap']);
 assert.ok(Math.abs(sun.relevantRules.find(r=>r.id==='sun').shortfallHours-7.2)<1e-8);
 assert.equal(sun.startUtc,'2027-01-13T00:00:00.000Z');assert.equal(sun.endUtc,'2027-01-13T12:00:00.000Z');assert.equal(sun.leftBoundary,true);
 assert.equal(sun.sunAzimuth.wrapsNorth,true);assert.ok(sun.sunAzimuth.spanDeg<12);assert.match(sun.plain,/Sun center/);
});
test('simultaneous outages use one timeline segment and nested elevation loss is not counted twice',()=>{
 const r=evaluate(scenario,{...defaultRequirements,duration:48,minSun:1,minEarth:1,minOverlap:1,minElevation:2},provider(h=>({sunElevation:h<6?-2:h<12?1:5,earthElevation:h<6?-2:5})));
 assert.equal(r.diagnostics.length,2);const [both,elevation]=r.diagnostics;
 assert.deepEqual(both.causes,['terrain','earth']);assert.ok(Math.abs(both.score-9.6)<1e-10);assert.equal(both.hours,6);
 assert.deepEqual(elevation.causes,['elevation']);assert.equal(elevation.score,6);
 assert.ok(Math.abs(r.diagnostics.reduce((s,d)=>s+d.score,0)-15.6)<1e-10);
 assert.match(elevation.plain,/clears terrain/);assert.match(both.consequence,/Geometric availability/);
});
test('passing aggregates do not make dark intervals diagnostic; only an enabled violated gap is relevant',()=>{
 const p=provider(h=>({sunElevation:h<6?-2:5,earthElevation:5})),req={...defaultRequirements,duration:48,minSun:.8,minEarth:1,minOverlap:.8};
 assert.deepEqual(evaluate(scenario,req,p).diagnostics,[]);
 const r=evaluate(scenario,{...req,maxDark:4},p);assert.equal(r.diagnostics.length,1);assert.deepEqual(r.diagnostics[0].ruleIds,['gap-dark']);assert.equal(r.diagnostics[0].relevantRules[0].shortfallHours,2);
});
test('partial final bins use actual duration and missing data has no causal attribution',()=>{
 const p=provider(()=>({sunElevation:-2,earthElevation:-2}));
 const r=evaluate(scenario,{...defaultRequirements,duration:48.25},p);assert.equal(r.diagnostics.length,1);assert.ok(Math.abs(r.diagnostics[0].hours-48.25)<1e-8);assert.equal(r.diagnostics[0].rightBoundary,true);
 assert.equal(evaluate(scenario,defaultRequirements,{...p,horizon:()=>NaN}).diagnostics.length,0);
});
