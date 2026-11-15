import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {scienceApi,normalizeRequest,getDateBlock} from '../scripts/science-api.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
import {createCoverageClient} from '../src/workspace/coverage-client.mjs';
const science=JSON.parse(readFileSync(new URL('../data/science/real-workspace.json',import.meta.url),'utf8'));
const reference=JSON.parse(readFileSync(new URL('../data/horizons/workspace-ephemeris.json',import.meta.url),'utf8'));

test('every selectable real study point has records; reference-only choices are not offered or committed',()=>{
 const w=createWorkspace(reference,{science});assert.equal(w.availableSites().length,6);
 for(const s of w.availableSites()){w.setSite(s.id);assert.notEqual(w.result().status,'insufficient_data',s.id);}
 const before=JSON.stringify(w.state.scenarios);assert.throws(()=>w.setSite('apollo'),/another data mode/);assert.equal(JSON.stringify(w.state.scenarios),before);
});
test('data-mode switches preserve separate valid scenarios instead of carrying incompatible point IDs',()=>{
 const w=createWorkspace(reference,{science});w.setOffset(4);const original=JSON.stringify(w.state.scenarios);
 for(const mode of ['horizons','sample','real']){w.setMode(mode);for(const id of ['A','B'])assert.notEqual(w.result(id).status,'insufficient_data');}
 assert.equal(JSON.stringify(w.state.scenarios),original);
});
test('offline dates, durations, and custom points reject unavailable changes without blanking the last result',async()=>{
 const w=createWorkspace(reference,{science}),before=JSON.stringify(w.state.scenarios),r=w.result();
 await assert.rejects(w.updateAsync(()=>w.setDate('2030-05-13T00:00:00Z')),/outside the loaded records/);
 assert.equal(JSON.stringify(w.state.scenarios),before);assert.strictEqual(w.result(),r);
 await assert.rejects(w.updateAsync(()=>w.setCustom(-86,0,0)),/Custom points/);assert.notEqual(w.result().status,'insufficient_data');
 const limits=w.inputBounds();assert.equal(limits.minOffset,-12);assert.equal(w.canPreview(-14),false);assert.equal(w.canPreview(3),true);
});
test('local service rejects unsupported sites, invalid dates, excessive blocks, and ambiguous time alignment',()=>{
 const base={siteId:'real-shackleton',start:'2030-01-01T00:00:00Z',end:'2030-02-01T00:00:00Z'};
 for(const patch of [{siteId:'../../x'},{start:'2026-01-01T00:00:00Z'},{end:'2031-01-01T00:00:00Z'},{start:'2030-01-01T00:01:00Z'},{start:'2030-02-30T00:00:00Z',end:'2030-04-01T00:00:00Z'}])assert.throws(()=>normalizeRequest({...base,...patch},science));
 assert.equal(normalizeRequest(base,science).siteId,'real-shackleton');
});
test('a failed real-data load leaves the previous covered assessment and inputs intact',async()=>{
 const w=createWorkspace(reference,{science,coverageLoader:async()=>{throw Error('Source preparation interrupted');}}),before=w.state.scenarios.A.date,r=w.result();
 await assert.rejects(w.updateAsync(()=>w.setDate('2031-05-13T00:00:00Z')),/interrupted/);
 assert.equal(w.state.scenarios.A.date,before);assert.strictEqual(w.result(),r);assert.notEqual(w.result().status,'insufficient_data');
});
test('Vite service hook returns void so middleware is not called as a post-install callback',()=>{
 let installed=0;assert.equal(scienceApi().configureServer({middlewares:{use(fn){assert.equal(typeof fn,'function');installed++;return ()=>{};}}}),undefined);assert.equal(installed,1);
});
test('the actual HTTP service supplies real future-date records and the client commits them only after loading',async()=>{
 const server=await createServer({configFile:false,root:fileURLToPath(new URL('../',import.meta.url)),plugins:[scienceApi()],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 try{
  await server.listen();const base='http://127.0.0.1:'+server.httpServer.address().port,client=createCoverageClient((url,options)=>fetch(base+url,options));assert.equal(await client.probe(),true);
  let release;const gate=new Promise(resolve=>release=resolve);
  const w=createWorkspace(reference,{science,coverageLoader:async request=>{await gate;return client.load(request);}}),before=w.state.scenarios.A.date;
  const pending=w.updateAsync(()=>w.setDate('2030-08-13T05:20:00Z'));assert.equal(w.state.scenarios.A.date,before);assert.notEqual(w.result().status,'insufficient_data');release();await pending;
  assert.equal(w.state.scenarios.A.date,'2030-08-13T05:20:00Z');assert.notEqual(w.result().status,'insufficient_data');assert.equal(w.result().records.length,1008);assert.ok(w.serialize().scenarios.A.sourceRecords.some(s=>s.kind==='locally generated real geometric date block'));
  const invalid=await fetch(base+'/api/science/coverage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({siteId:'not-a-site',start:'2030-01-01T00:00:00Z',end:'2030-02-01T00:00:00Z'})});assert.equal(invalid.status,400);
  const foreign=await fetch(base+'/api/science/coverage',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'});assert.equal(foreign.status,403);
 }finally{await server.close();}
});
test('generated late-2033 records obey the original numerical/source recipe and reuse the same cache identity',async()=>{
 const request={siteId:'real-shackleton',start:'2033-12-01T00:00:00Z',end:'2034-01-01T00:00:00Z'},a=await getDateBlock(request),b=await getDateBlock(request);
 assert.equal(a.cacheKey,b.cacheKey);assert.equal(a.records.length,4465);assert.equal(a.frame,'MOON_ME');assert.equal(a.correction,'NONE');assert.ok(a.transformPathMaxErrorDeg<1e-8);assert.notEqual(a.records[0][1],a.records.at(-1)[1]);
 const w=createWorkspace(reference,{science});w.registerCoverage(a);w.setDate('2033-12-20T00:00:00Z');assert.notEqual(w.result().status,'insufficient_data');
});
