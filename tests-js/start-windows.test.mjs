import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STEP,HOUR,evaluate,makeScenario} from '../src/workspace/engine.mjs';
import {catalog,defaultRequirements} from '../src/workspace/catalog.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
import {longestGapQuery,scanStartWindows,verifyStartSelection,loadedWindows,startStudyKey} from '../src/workspace/start-windows.mjs';
const base=Date.UTC(2027,0,1),scenario=makeScenario(catalog[0]);
const requirements={...defaultRequirements,duration:48.25};
const good={sunAzimuth:20,sunElevation:5,earthAzimuth:110,earthElevation:6};
function provider({windows=[[base,base+52*HOUR]],geometry=()=>good,qualified=false}={}){return {mode:'horizons',timeCoverage:windows,metadata:[],covers:(a,b)=>windows.some(([x,y])=>a>=x&&b<=y),horizon:()=>0,geometry,qualifyPassAsUncertain:qualified};}
const read=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url),'utf8'));
function bruteGap(flags,start,width){let current=0,longest=0;for(let i=start;i<Math.ceil(start+width);i++){const weight=Math.min(1,start+width-i);if(flags[i]===false)current+=weight;else current=0;longest=Math.max(longest,current);}return longest*STEP/HOUR;}
test('sliding longest gaps match an independent brute-force oracle, including unknown and fractional end bins',()=>{
 let seed=9127;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(let c=0;c<80;c++){const flags=Array.from({length:110},()=>[false,false,true,null][Math.floor(random()*4)]),width=1+Math.floor(random()*40)+[0,.25,.5,.9][c%4],query=longestGapQuery(flags);
  for(let i=0;i+width<=flags.length;i++)assert.ok(Math.abs(query(i,width)-bruteGap(flags,i,width))<1e-10,`case ${c}, start ${i}`);
 }
 const query=longestGapQuery(Array(10).fill(false));assert.equal(query(1,3.5),3.5/6);assert.throws(()=>query(0,2),/advance/);
});
test('scan includes exact final supported grid start, preserves fractional duration and rechecks applied boundaries',()=>{
 const p=provider(),study=scanStartWindows(scenario,requirements,p);assert.equal(study.tested,23);assert.equal(study.nominalFits,23);assert.equal(study.nominalFitWindows.length,1);
 const window=study.nominalFitWindows[0];assert.equal(window.firstStartUtc,'2027-01-01T00:00:00.000Z');assert.equal(window.lastStartUtc,'2027-01-01T03:40:00.000Z');
 const before=JSON.stringify(scenario),selected=verifyStartSelection(study,window.lastStartUtc,scenario,requirements,p);assert.equal(selected.result.status,'pass');assert.equal(JSON.stringify(scenario),before);assert.equal(selected.candidate.offset,0);
 assert.throws(()=>verifyStartSelection(study,'2027-01-01T00:05:00Z',scenario,requirements,p),/not in/);
 assert.throws(()=>verifyStartSelection(study,window.firstStartUtc,{...scenario,site:{...scenario.site,lat:-80}},requirements,p),/not in/);
 assert.throws(()=>verifyStartSelection(study,window.firstStartUtc,scenario,{...requirements,minSun:1},p),/not in/);
 assert.throws(()=>verifyStartSelection(study,window.firstStartUtc,scenario,requirements,provider({geometry:()=>({...good,sunElevation:-1})})),/no longer/);
});
test('disjoint/overlapping coverage never fabricates a supported mission interval or duplicates starts',()=>{
 const windows=[[base,base+49*HOUR],[base+48*HOUR,base+97*HOUR],[base+120*HOUR,base+169*HOUR]],p=provider({windows}),req={...requirements,duration:48};
 const study=scanStartWindows(scenario,req,p);assert.equal(study.tested,21);assert.equal(study.nominalFits,21);assert.equal(study.nominalFitWindows.length,3);assert.ok(study.unsupportedStarts>0);
 assert.equal(scanStartWindows(scenario,req,provider({windows:[windows[0],windows[0]]})).tested,7);
 assert.equal(scanStartWindows(scenario,req,provider({windows:[[base,base+47*HOUR]]})).tested,0);
});
test('unknown geometry is never a fit; strict horizon and separate physical darkness match full evaluator',()=>{
 const req={...requirements,duration:48,minSun:0,minEarth:0,minOverlap:0,maxDark:0,maxEarth:0},p=provider({geometry:t=>t===base?null:{...good,sunElevation:1}});
 const study=scanStartWindows(scenario,req,p);assert.equal(study.unknown,1);assert.equal(study.failed,0);assert.equal(study.nominalFits,24);assert.equal(study.unknownStartRanges[0].gridStarts,1);
 const equality=scanStartWindows(scenario,req,provider({geometry:()=>({...good,sunElevation:0})}));assert.equal(equality.nominalFits,0);assert.equal(equality.failed,equality.tested);
});
test('partial or non-finite geometry cannot be counted as a complete evaluated start',()=>{
 for(const geometry of [()=>({sunAzimuth:20}),()=>({...good,earthAzimuth:NaN}),()=>null]){
  const p=provider({geometry}),study=scanStartWindows(scenario,requirements,p);assert.equal(study.nominalFits,0);assert.equal(study.unknown,study.tested);assert.equal(evaluate({...scenario,date:new Date(base).toISOString()},requirements,p).status,'insufficient_data');
 }
});
test('sample coverage, invalid requirements and target-year clipping are explicit',()=>{
 assert.equal(scanStartWindows(scenario,requirements,{coverage:null}).status,'not_evaluated');assert.throws(()=>scanStartWindows(scenario,{...requirements,duration:47},provider()),/Duration/);
 assert.deepEqual(loadedWindows({timeCoverage:[[Date.UTC(2026,0,1),base+HOUR],[NaN,base],[base,base]]}),[[base,base+HOUR]]);
 assert.deepEqual(loadedWindows({coverage:[Date.UTC(2033,11,30),Date.UTC(2035,0,1)]}),[[Date.UTC(2033,11,30),Date.UTC(2034,0,1)]]);
});
test('nominal sampled decisions reproduce the full evaluator for fractional missions, enabled gaps and missing records',()=>{
 for(const duration of [48,48.05,48.25]){
  const req={...requirements,duration,minSun:.6,minEarth:.7,minOverlap:.5,maxDark:7,maxEarth:6},p=provider({windows:[[base,base+65*HOUR]],qualified:true,geometry:t=>{const k=Math.round((t-base)/STEP);return k===35?null:{...good,sunElevation:k%191<160?5:-2,earthElevation:k%163<141?6:-1};}}),study=scanStartWindows(scenario,req,p);
  const totals={fits:0,fail:0,unknown:0};
  for(let t=base;t+duration*HOUR<=base+65*HOUR;t+=STEP){const result=evaluate({...scenario,date:new Date(t).toISOString(),offset:0},req,p),inside=study.nominalFitWindows.some(w=>t>=Date.parse(w.firstStartUtc)&&t<=Date.parse(w.lastStartUtc));assert.equal(inside,result.status==='uncertain');if(result.status==='uncertain')totals.fits++;else if(result.status==='fail')totals.fail++;else totals.unknown++;}
  assert.equal(study.nominalFits,totals.fits);assert.equal(study.failed,totals.fail);assert.equal(study.unknown,totals.unknown);
 }
});
test('real PGDA/DE421 study retains uncertainty and matches full evaluation across loaded coverage',()=>{
 const w=createWorkspace(read('data/horizons/workspace-ephemeris.json'),{science:read('data/science/real-workspace.json')});w.setSite('real-nobile');const p=w.provider('A'),s=w.state.scenarios.A,req=w.state.requirements,study=scanStartWindows(s,req,p);
 assert.equal(study.tested,11953);assert.ok(study.nominalFits>0);assert.equal(study.unqualifiedPasses,0);assert.equal(study.unknown,0);assert.ok(study.provenance.sources.length>0);
 for(let k=0;k<study.tested;k+=277){const t=base+k*STEP,result=evaluate({...s,date:new Date(t).toISOString(),offset:0},req,p);assert.equal(study.nominalFitWindows.some(w=>t>=Date.parse(w.firstStartUtc)&&t<=Date.parse(w.lastStartUtc)),result.nominalStatus==='pass');}
 for(const range of study.nominalFitWindows){assert.equal(range.status,'uncertain');for(const utc of [range.firstStartUtc,range.lastStartUtc])assert.equal(verifyStartSelection(study,utc,s,req,p).result.status,'uncertain');}
 const key=startStudyKey(w.state,p);w.setDate('2027-02-01T00:00:00Z');assert.equal(startStudyKey(w.state,p),key);w.setRequirements({minSun:.8});assert.notEqual(startStudyKey(w.state,p),key);
 assert.notEqual(startStudyKey(w.state,{...p,metadata:[{changed:true}]}),startStudyKey(w.state,p));
});
