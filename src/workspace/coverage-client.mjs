export function createCoverageClient(fetcher){
 async function request(path,body){
  let response;
  try{response=await fetcher(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:globalThis.AbortSignal?.timeout?.(240000)});}catch(error){throw Error(error?.name==='TimeoutError'||error?.name==='AbortError'?'Real-data preparation timed out. Your previous scenario is preserved; retry when the local service is ready.':'Cannot reach the local scientific service. Your previous scenario is preserved.');}
  let result;try{result=await response.json();}catch{throw Error('The local service returned an unreadable response. Your previous scenario is preserved.');}
  if(!response.ok)throw Error(typeof result?.error==='string'?result.error:'Real-data preparation failed. Your previous scenario is preserved.');
  return result;
 }
 return {
  async probe(){try{const r=await fetcher('/api/science/capabilities',{signal:globalThis.AbortSignal?.timeout?.(5000)});if(!r.ok)return false;const j=await r.json();return j.schema==='sitelight-science-service-1'&&j.available===true;}catch{return false;}},
  load:body=>request('/api/science/coverage',body),
  preparePoint:body=>request('/api/science/point',body),
  monthly:body=>request('/api/science/monthly',body),
 };
}
