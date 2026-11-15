import test from 'node:test';
import assert from 'node:assert/strict';
import {createCoverageClient} from '../src/workspace/coverage-client.mjs';
import {validatePreparedPointMetadata} from '../scripts/custom-science-api.mjs';
import {defaultLogistics,findLogisticsFlip} from '../src/workspace/logistics.mjs';
test('data service failures return actionable messages for network, timeout, malformed and rejected responses',async()=>{
 const cases=[
  [async()=>{throw Error('network');},/Cannot reach.*previous scenario/],
  [async()=>{throw Object.assign(Error('timeout'),{name:'TimeoutError'});},/timed out.*previous scenario/],
  [async()=>({ok:true,json:async()=>{throw SyntaxError('HTML response');}}),/unreadable response/],
  [async()=>({ok:false,json:async()=>({error:'Missing pinned terrain'} )}),/Missing pinned terrain/],
 ];
 for(const [fetcher,expected] of cases){const client=createCoverageClient(fetcher);await assert.rejects(client.load({}),expected);await assert.rejects(client.preparePoint({}),expected);}
 assert.equal(await createCoverageClient(async()=>{throw Error('offline');}).probe(),false);
});
test('prepared point provenance rejects independently changed terrain algorithms and thermal index versions',()=>{
 const science={version:'v4',algorithm:{sha256:'science'}},algorithm={sha256:'terrain',thermalIndexSha256:'index'},point={schema:'sitelight-custom-point-1',preprocessingVersion:'v4',sourceAlgorithm:{sha256:'science'},pointAlgorithm:algorithm,entry:{site:{id:'point'},pointPreparation:algorithm}};
 assert.doesNotThrow(()=>validatePreparedPointMetadata(point,science,'point','terrain','index'));
 assert.throws(()=>validatePreparedPointMetadata(point,science,'point','new-terrain','index'),/terrain algorithm/);
 assert.throws(()=>validatePreparedPointMetadata(point,science,'point','terrain','new-index'),/thermal source index/);
 assert.throws(()=>validatePreparedPointMetadata(point,science,'different-point','terrain','index'),/scientific inputs/);
});
test('logistics search rejects invalid global settings instead of presenting an unsupported search as no fit',()=>{
 assert.throws(()=>findLogisticsFlip({...defaultLogistics,duty:0},18000,1));
 assert.throws(()=>findLogisticsFlip(defaultLogistics,NaN,1));assert.throws(()=>findLogisticsFlip(defaultLogistics,18000,NaN));
 const r=findLogisticsFlip({...defaultLogistics,demandKgPerCrewDay:50,recovery:0,duty:.01,throughputKgHour:.1,extractable:1,extractionRecovery:1},10000000,1);
 assert.equal(r.evaluated,1);assert.equal(r.unavailable,60);assert.equal(r.match.iceWtPercent,0);assert.match(r.meaning,/60 unsupported/);
});
