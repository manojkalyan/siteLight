import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {createEnsembleClient,validateEnsembleResponse} from '../src/workspace/ensemble-client.mjs';
import {scienceApi,normalizeEnsembleRequest} from '../scripts/science-api.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url)),json=name=>JSON.parse(read(name));
const science=json('data/science/real-workspace.json'),terrainEvidence=json('data/science/terrain-acceptance-evidence.json'),context={science,terrainEvidence};
const body={siteId:'real-nobile',radius:100,baseline:20,limit:12};
function fixture(){const r=terrainEvidence.sites[body.siteId].localCorrelatedTerrain;return {schema:'sitelight-terrain-ensemble-1',model:'local-correlated-footprint-1',siteId:body.siteId,coordinates:structuredClone(terrainEvidence.sites[body.siteId].coordinates),settings:{radiusM:100,baselineM:20,slopeLimitDeg:12},members:100,metrics:structuredClone(r.metrics),source:{scienceVersion:science.version,scienceSha256:terrainEvidence.scienceSha256,sourceAlgorithmSha256:science.algorithm.sha256,cloneManifestSha256:terrainEvidence.cloneManifestSha256,footprintAlgorithmSha256:terrainEvidence.preparerSha256,evaluatorSha256:createHash('sha256').update(read('scripts/evaluate-terrain-ensemble.py')).digest('hex'),retainedWindowHashes:[...r.retainedWindowHashes],sourceCloneNumbers:[...r.sourceCloneNumbers],sourcePage:'https://pgda.gsfc.nasa.gov/products/78'},cacheKey:'a'.repeat(64),acceptedForVerdict:false,fullDomainCovariance:false,interpretation:'Not guaranteed confidence bounds; published local correlated realizations only.'};}
test('ensemble API normalization rejects coercion, unsupported points and out-of-domain controls',()=>{
 assert.deepEqual(normalizeEnsembleRequest(body,science),body);
 for(const patch of [{siteId:'../../x'},{radius:301},{radius:19},{radius:NaN},{radius:true},{baseline:'20'},{baseline:101},{limit:-1},{limit:46},{extra:1}])assert.throws(()=>normalizeEnsembleRequest({...body,...patch},science));
});
test('strict ensemble parser rejects point/settings/source substitutions and invalid probability claims',()=>{
 assert.equal(validateEnsembleResponse(fixture(),body,context).members,100);
 const mutations=[r=>r.siteId='real-peak',r=>r.coordinates.lat+=.001,r=>r.settings.radiusM=150,r=>r.members=99,r=>r.source.scienceSha256='b'.repeat(64),r=>r.source.footprintAlgorithmSha256='b'.repeat(64),r=>r.source.retainedWindowHashes[0]='b'.repeat(64),r=>r.source.sourceCloneNumbers[1]=r.source.sourceCloneNumbers[0],r=>r.metrics.meanSlopeDeg.median=100,r=>r.metrics.usableAreaM2.p97_5=1e9,r=>r.metrics.roughnessM.p2_5=NaN,r=>r.acceptedForVerdict=true,r=>r.fullDomainCovariance=true,r=>r.interpretation='Guaranteed mission confidence'];
 for(const mutate of mutations){const r=fixture();mutate(r);assert.throws(()=>validateEnsembleResponse(r,body,context));}
});
test('client coalesces requests, caches bounded validated results and isolates returned objects',async()=>{
 let calls=0;const client=createEnsembleClient(async(url,options)=>{calls++;assert.equal(url,'/api/science/terrain-ensemble');assert.deepEqual(JSON.parse(options.body),body);return {ok:true,json:async()=>fixture()};},context);
 const [a,b]=await Promise.all([client.load(body),client.load(body)]);assert.equal(calls,1);a.members=1;assert.equal(b.members,100);assert.equal((await client.load(body)).members,100);assert.equal(calls,1);assert.equal(client.cacheSize(),1);client.clear();assert.equal(client.cacheSize(),0);
 await assert.rejects(client.load({...body,radius:'100'}),/Unsupported/);
});
test('client preserves actionable network, JSON and service failures without caching invalid output',async()=>{
 for(const [fetcher,pattern] of [[async()=>{throw Error('offline');},/Cannot reach/],[async()=>{throw {name:'TimeoutError'};},/timed out/],[async()=>({ok:true,json:async()=>{throw Error('bad');}}),/unreadable/],[async()=>({ok:false,json:async()=>({error:'Missing retained terrain windows'})}),/Missing retained/],[async()=>({ok:true,json:async()=>({...fixture(),members:1})}),/does not match/]]){const client=createEnsembleClient(fetcher,context);await assert.rejects(client.load(body),pattern);assert.equal(client.cacheSize(),0);}
});
test('actual local HTTP endpoint recomputes a changed footprint from the 100 retained NASA windows',async()=>{
 const server=await createServer({configFile:false,root:fileURLToPath(new URL('../',import.meta.url)),plugins:[scienceApi()],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 try{
  await server.listen();const base='http://127.0.0.1:'+server.httpServer.address().port,client=createEnsembleClient((url,options)=>fetch(base+url,options),context),changed={...body,radius:150,baseline:30,limit:10};
  const result=await client.load(changed);assert.equal(result.members,100);assert.deepEqual(result.settings,{radiusM:150,baselineM:30,slopeLimitDeg:10});assert.notDeepEqual(result.metrics,fixture().metrics);assert.equal(result.acceptedForVerdict,false);assert.match(result.cacheKey,/^[a-f0-9]{64}$/);
  const forbidden=await fetch(base+'/api/science/terrain-ensemble',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://foreign.test'},body:JSON.stringify(body)});assert.equal(forbidden.status,403);
  const invalid=await fetch(base+'/api/science/terrain-ensemble',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,siteId:'unprepared-custom'})});assert.equal(invalid.status,400);
 }finally{await server.close();}
});
