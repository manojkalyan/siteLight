import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultRescue,assessRescue,rescueContext} from '../src/workspace/rescue.mjs';
import {terrainRoute} from '../src/workspace/routes.mjs';
import {terrainScreen} from '../src/workspace/engine.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
const context={mode:'sample',siteId:'fixture',lat:-89,lon:0,altKm:0,incidentUtc:'2027-01-13T00:00:00.000Z'};
const terrain=terrainScreen({lon:0},{radius:100,baseline:20,limit:12},()=>0),route=terrainRoute(terrain);
const inputs={...defaultRescue,assetDeclared:true,available:true,assetScope:context};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('independently calculated response timeline includes slower loaded return and exact time-limit boundaries',()=>{
 const r=assessRescue(route,{...inputs,enduranceMin:33,deadlineMin:33},context);
 assert.equal(r.status,'conditional_fit');close(r.timing.outboundMin,8/3);close(r.timing.returnMin,16/3);close(r.timing.arrivalMin,38/3);close(r.timing.completionMin,33);close(r.timing.totalDistanceM,160);
 assert.equal(r.timing.completionUtc,'2027-01-13T00:33:00.000Z');assert.ok(r.checks.every(c=>c.fits));assert.equal(r.acceptedForVerdict,false);
 const miss=assessRescue(route,{...inputs,enduranceMin:32,deadlineMin:30},context);assert.equal(miss.status,'conditional_shortfall');assert.deepEqual(miss.checks.map(c=>c.marginMin),[-1,-3]);
 const noReturn=assessRescue(route,{...inputs,returnRequired:false},context);close(noReturn.timing.completionMin,83/3);close(noReturn.timing.totalDistanceM,80);assert.match(noReturn.timing.completionMeaning,/evacuation not evaluated/);
});
test('no declared/available asset or changed incident scope cannot receive a response time',()=>{
 for(const [a,c,status] of [[defaultRescue,context,'not_evaluated'],[{...inputs,available:false},context,'asset_unavailable'],[inputs,{...context,incidentUtc:'2027-01-14T00:00:00.000Z'},'not_evaluated'],[inputs,{...context,siteId:'other'},'not_evaluated'],[inputs,{...context,lat:-88},'not_evaluated'],[inputs,{...context,mode:'real'},'not_evaluated']]){
  const r=assessRescue(route,a,c);assert.equal(r.status,status);assert.equal(r.timing,null);assert.equal(r.acceptedForVerdict,false);
 }
});
test('missing, blocked, invalid and inconsistent sampled routes cannot produce conditional fits',()=>{
 const blocked=terrainRoute({...terrain,cells:terrain.cells.map(c=>c.x===40?{...c,slope:null}:c)});
 assert.equal(assessRescue(blocked,inputs,context).status,'no_sampled_route');
 for(const r of [null,{...route,lengthM:NaN},{...route,lengthM:800},{...route,path:[]},{...route,path:[{x:0,z:0,h:NaN},{x:1,z:0,h:0}]}]){const x=assessRescue(r,inputs,context);assert.equal(x.status,'not_evaluated');assert.equal(x.timing,null);}
});
test('invalid time/speed/boolean assumptions reject rather than generating infinite or coerced results',()=>{
 for(const patch of [{outboundMps:0},{returnMps:-1},{handlingMin:NaN},{mobilizationMin:-1},{enduranceMin:0},{deadlineMin:Infinity},{available:1},{outboundMps:'1'}])assert.throws(()=>assessRescue(route,{...inputs,...patch},context));
 const before=JSON.stringify(inputs),r=assessRescue(route,inputs,context);r.assumptions.assetScope.siteId='changed';assert.equal(JSON.stringify(inputs),before);
});
test('A/B rescue inputs are independent, transactional, exported, and isolated from environmental decisions',()=>{
 const bundle=JSON.parse(readFileSync(new URL('../data/horizons/workspace-ephemeris.json',import.meta.url))),w=createWorkspace(bundle);w.setMode('sample');const before=w.result('A');
 assert.equal(w.rescueResult().status,'not_evaluated');w.setRescue({assetDeclared:true,available:true});assert.deepEqual(w.state.rescue.A.assetScope,rescueContext(w.state,'A'));assert.equal(w.state.rescue.B.assetDeclared,false);
 assert.strictEqual(w.result('A'),before);const report=w.serialize();assert.equal(report.rescueExploration.acceptedForVerdict,false);assert.equal(report.rescueExploration.results.B.timing,null);assert.equal(report.model,'workspace-evaluator-11');
 const saved=JSON.stringify(w.state.rescue);for(const patch of [{outboundMps:0},{assetScope:context},{__unknown:true}])assert.throws(()=>w.setRescue(patch));assert.equal(JSON.stringify(w.state.rescue),saved);
 w.setOffset(1);assert.equal(w.rescueResult().status,'not_evaluated');w.setRescue({assetDeclared:true});assert.equal(w.rescueResult().asset.declaredForCurrentScenario,true);w.setSite(w.availableSites()[1].id);assert.equal(w.rescueResult().status,'not_evaluated');
});
