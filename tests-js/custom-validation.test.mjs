import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWorkspace} from '../src/workspace/store.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const source=read('data/science/real-workspace.json'),reference=read('data/horizons/workspace-ephemeris.json');
function fixture(){const original=source.sites['real-shackleton'],site={...original.site,id:'custom-real-000000000000000000000001',custom:true};return {schema:'sitelight-custom-point-1',frame:'MOON_ME',ephemeris:'DE421',correction:'NONE',preprocessingVersion:source.version,sourceAlgorithm:source.algorithm,start:source.interval.start,end:source.interval.end,request:{siteId:site.id,lat:site.lat,lon:site.lon,observerHeightM:site.observerHeightM},entry:{...original,site}};}
const workspace=()=>createWorkspace(reference,{science:{...source,sites:{...source.sites}}});
test('incomplete custom terrain cannot replace a working assessment or cause a rendering crash',()=>{
 for(const change of [
  p=>{p.entry={...p.entry,terrain:{...p.entry.terrain,grid:null}};},
  p=>{p.entry={...p.entry,terrain:{...p.entry.terrain,horizon:{...p.entry.terrain.horizon,azimuthStepDeg:undefined}}};},
  p=>{p.entry={...p.entry,terrain:{...p.entry.terrain,horizon:{...p.entry.terrain.horizon,rayCoverage:[]}}};},
  p=>{p.entry={...p.entry,terrain:{...p.entry.terrain,grid:{...p.entry.terrain.grid,elevationM:[]}}};},
 ]){const w=workspace(),before=JSON.stringify(w.state.scenarios),p=fixture();change(p);assert.throws(()=>w.registerCustomPoint(p));assert.equal(JSON.stringify(w.state.scenarios),before);assert.notEqual(w.result().status,'insufficient_data');}
 assert.throws(()=>workspace().registerCustomPoint(null),/Invalid prepared coordinate response/);
});
test('prepared point registration rejects malformed records, wrong coordinates and unpinned inputs before mutation',()=>{
 for(const alter of [p=>{p.entry={...p.entry,records:p.entry.records.slice(0,-1)};},p=>{p.entry={...p.entry,coordinates:{...p.entry.coordinates,lat:0}};},p=>{p.entry={...p.entry,sources:[]};},p=>{p.request={...p.request,observerHeightM:10};},p=>{p.entry={...p.entry,records:p.entry.records.map((r,i)=>i===2?[r[0]+1,...r.slice(1)]:r)};}]){
  const w=workspace(),before=JSON.stringify(w.state.scenarios),count=w.availableSites().length,p=fixture();alter(p);assert.throws(()=>w.registerCustomPoint(p));assert.equal(JSON.stringify(w.state.scenarios),before);assert.equal(w.availableSites().length,count);
 }
});
test('a prepared custom point must cover the current mission; valid registration preserves B and its data scope',()=>{
 const w=workspace(),b=JSON.stringify(w.state.scenarios.B);w.setDate('2030-01-01T00:00:00Z');assert.throws(()=>w.registerCustomPoint(fixture()),/current mission interval/);w.setDate('2027-01-13T00:00:00Z');
 w.registerCustomPoint(fixture());assert.equal(w.state.scenarios.A.site.custom,true);assert.equal(w.result().status,'fail');assert.equal(JSON.stringify(w.state.scenarios.B),b);assert.equal(w.availableSites().length,7);
});
