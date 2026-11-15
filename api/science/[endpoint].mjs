import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const allowed=new Map([['capabilities','GET'],['coverage','POST'],['point','POST'],['monthly','POST'],['terrain-ensemble','POST']]);
const unavailable={schema:'sitelight-science-service-1',available:false,start:'2027-01-01T00:00:00Z',end:'2034-01-01T00:00:00Z',stepMinutes:10,deploymentMode:'bundled-real-data',reason:'Scientific backend is not connected. Bundled real-data assessments remain available.'};
function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));}
export function createScienceProxy({env=process.env,fetcher=globalThis.fetch}={}){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const endpoint=new URL(req.url,'https://sitelight.invalid').pathname.split('/').at(-1),method=allowed.get(endpoint);
  if(!method)return send(res,404,{error:'Unknown scientific endpoint.'});
  if(req.method!==method){res.setHeader('Allow',method);return send(res,405,{error:'Unsupported request method.'});}
  if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return send(res,403,{error:'Same-origin requests only.'});}catch{return send(res,403,{error:'Invalid request origin.'});}}
  if(!env.SCIENCE_API_URL)return endpoint==='capabilities'?send(res,200,unavailable):send(res,503,{error:unavailable.reason+' Your previous scenario is preserved.'});
  let target;
  try{const base=new URL(env.SCIENCE_API_URL);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw Error('Invalid backend URL');target=new URL('/api/science/'+endpoint,base);}catch{return send(res,503,{error:'Scientific backend configuration is invalid. Your previous scenario is preserved.'});}
  let body;
  if(method==='POST'){
   if(!req.headers['content-type']?.includes('application/json'))return send(res,415,{error:'JSON required.'});
   try{
    if(Number(req.headers['content-length'])>4096)return send(res,413,{error:'Request too large.'});
    if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
    else{body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return send(res,413,{error:'Request too large.'});}}
    if(Buffer.byteLength(body)>4096)return send(res,413,{error:'Request too large.'});
    const parsed=JSON.parse(body);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Invalid body');
   }catch{return send(res,400,{error:'A JSON request object is required.'});}
  }
  try{
   const headers={Accept:'application/json'};if(body)headers['Content-Type']='application/json';if(env.SCIENCE_API_TOKEN)headers.Authorization='Bearer '+env.SCIENCE_API_TOKEN;
   const upstream=await fetcher(target,{method,headers,body,redirect:'error',signal:AbortSignal.timeout(endpoint==='capabilities'?10000:245000)});
   if(!upstream.ok){try{await upstream.body?.cancel();}catch{}return send(res,upstream.status===400?400:502,{error:'The scientific backend could not complete this request. Your previous covered scenario is preserved.'});}
   if(!upstream.headers.get('content-type')?.includes('application/json')){await upstream.body?.cancel();return send(res,502,{error:'Scientific backend returned an invalid response. Your previous scenario is preserved.'});}
   res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');
   // Large real monthly/date responses are streamed, avoiding a buffered function payload.
   if(upstream.body)await pipeline(Readable.fromWeb(upstream.body),res);else res.end();
  }catch(error){if(!res.headersSent)return send(res,error?.name==='TimeoutError'?504:502,{error:'Scientific service is temporarily unavailable. Your previous scenario is preserved.'});res.destroy();}
 };
}
export default createScienceProxy();
