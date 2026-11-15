const metrics=['meanSlopeDeg','maxSlopeDeg','p95SlopeDeg','roughnessM','usableAreaM2'];
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function ensembleRequestKey(body){return JSON.stringify([body.siteId,body.radius,body.baseline,body.limit]);}
export function validateEnsembleResponse(result,body,{science,terrainEvidence}={}){
 const entry=science?.sites?.[body.siteId],reference=terrainEvidence?.sites?.[body.siteId]?.localCorrelatedTerrain,s=result?.source,q=result?.settings;
 if(!entry||!reference||terrainEvidence.scienceVersion!==science.version||result?.schema!=='sitelight-terrain-ensemble-1'||result.model!=='local-correlated-footprint-1'||result.siteId!==body.siteId||result.members!==100||result.acceptedForVerdict!==false||result.fullDomainCovariance!==false||q?.radiusM!==body.radius||q?.baselineM!==body.baseline||q?.slopeLimitDeg!==body.limit||!['lat','lon','altKm'].every(k=>result.coordinates?.[k]===entry.site[k]))throw Error('The terrain ensemble does not match this point and footprint.');
 if(s?.scienceVersion!==science.version||s.scienceSha256!==terrainEvidence.scienceSha256||s.sourceAlgorithmSha256!==science.algorithm.sha256||s.cloneManifestSha256!==terrainEvidence.cloneManifestSha256||s.footprintAlgorithmSha256!==terrainEvidence.preparerSha256||!hash(s.evaluatorSha256)||!hash(result.cacheKey)||s.sourcePage!=='https://pgda.gsfc.nasa.gov/products/78'||!Array.isArray(s.retainedWindowHashes)||s.retainedWindowHashes.length!==100||s.retainedWindowHashes.some((h,i)=>!hash(h)||h!==reference.retainedWindowHashes[i])||!Array.isArray(s.sourceCloneNumbers)||s.sourceCloneNumbers.length!==100||s.sourceCloneNumbers.some((n,i)=>n!==reference.sourceCloneNumbers[i])||new Set(s.sourceCloneNumbers).size!==100)throw Error('Terrain ensemble source identities differ from the pinned reference.');
 for(const key of metrics){const values=result.metrics?.[key];if(!values||!['p2_5','median','p97_5'].every(k=>typeof values[k]==='number'&&Number.isFinite(values[k])&&values[k]>=0)||values.p2_5>values.median||values.median>values.p97_5||key.endsWith('Deg')&&values.p97_5>90||key==='usableAreaM2'&&values.p97_5>Math.PI*body.radius**2+1e-6)throw Error('Terrain ensemble contains invalid empirical percentiles.');}
 if(typeof result.interpretation!=='string'||!result.interpretation.includes('Not guaranteed confidence bounds'))throw Error('Terrain ensemble interpretation is missing.');
 return result;
}
export function createEnsembleClient(fetcher,context){
 const cache=new Map(),pending=new Map();
 function validateRequest(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['siteId','radius','baseline','limit'].includes(k))||!Object.hasOwn(context?.science?.sites||{},body.siteId))throw Error('A catalog point with published terrain realizations is required.');
  for(const [key,min,max] of [['radius',20,300],['baseline',5,100],['limit',0,45]])if(typeof body[key]!=='number'||!Number.isFinite(body[key])||body[key]<min||body[key]>max)throw Error('Unsupported ensemble '+key+'.');
 }
 async function load(body){
  validateRequest(body);const request={siteId:body.siteId,radius:body.radius,baseline:body.baseline,limit:body.limit},key=ensembleRequestKey(request);
  if(cache.has(key))return structuredClone(cache.get(key));
  if(pending.has(key))return structuredClone(await pending.get(key));
  const job=(async()=>{
   let response;try{response=await fetcher('/api/science/terrain-ensemble',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:globalThis.AbortSignal?.timeout?.(60000)});}catch(error){throw Error(error?.name==='TimeoutError'||error?.name==='AbortError'?'Terrain ensemble evaluation timed out. Retry when the local service is ready.':'Cannot reach the local ensemble service. The reference footprint evidence remains available.');}
   let result;try{result=await response.json();}catch{throw Error('The local ensemble service returned an unreadable response.');}
   if(!response.ok)throw Error(typeof result?.error==='string'?result.error:'The requested terrain ensemble could not be evaluated.');
   validateEnsembleResponse(result,request,context);cache.set(key,structuredClone(result));if(cache.size>16)cache.delete(cache.keys().next().value);return result;
  })();pending.set(key,job);try{return structuredClone(await job);}finally{pending.delete(key);}
 }
 return {load,clear(){cache.clear();},cacheSize:()=>cache.size};
}
