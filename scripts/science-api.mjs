import {readFile,access,mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {getCustomPoint,loadPreparedPoint} from './custom-science-api.mjs';
const exec=promisify(execFile),root=new URL('../',import.meta.url),pending=new Map();
let running=0;const queue=[];
async function limited(fn){if(running>=2)await new Promise(resolve=>queue.push(resolve));running++;try{return await fn();}finally{running--;queue.shift()?.();}}
const python=new URL('.tools/python/python.exe',root);
const ensembleCache=new Map();
export async function capabilities(){let available=true;try{await access(python);await access(new URL('data/raw/kernels/de421.bsp',root));}catch{available=false;}return {schema:'sitelight-science-service-1',available,start:'2027-01-01T00:00:00Z',end:'2034-01-01T00:00:00Z',stepMinutes:10};}
export function normalizeRequest(request,science){
 if(typeof request?.siteId!=='string'||!Object.hasOwn(science.sites,request.siteId))throw Error('Choose a sourced real-DEM study point.');
 const site=science.sites[request.siteId];if(typeof request.start!=='string'||typeof request.end!=='string')throw Error('Explicit UTC date strings are required.');
 const start=Date.parse(request.start),end=Date.parse(request.end);
 if(!Number.isFinite(start)||!Number.isFinite(end)||!request.start.endsWith('Z')||!request.end.endsWith('Z')||start<Date.UTC(2027,0,1)||end>Date.UTC(2034,0,1)||end<=start||end-start>180*86400000)throw Error('Choose a valid UTC date block within 2027–2033.');
 if(start%600000||end%600000)throw Error('Date block must align to ten minutes.');
 if(new Date(start).toISOString().slice(0,16)!==request.start.slice(0,16)||new Date(end).toISOString().slice(0,16)!==request.end.slice(0,16))throw Error('Invalid UTC calendar date.');
 return {siteId:site.site.id,start:new Date(start).toISOString(),end:new Date(end).toISOString()};
}
export async function getDateBlock(request){
 const science=JSON.parse(await readFile(new URL('data/science/real-workspace.json',root),'utf8'));
 const point=await loadPreparedPoint(request?.siteId,science);if(point)science.sites[request.siteId]=point.entry;
 const args=normalizeRequest(request,science);
 const script=await readFile(new URL('scripts/science_request.py',root));
 const key=createHash('sha256').update(JSON.stringify([args,science.sites[args.siteId].coordinates,science.sites[args.siteId].pointPreparation,science.version,science.algorithm,science.inputs.filter(r=>r.name.startsWith('kernels/')),script.toString()])).digest('hex');
 if(pending.has(key))return pending.get(key);
 const job=limited(async()=>{
  const file=new URL('data/cache/'+key+'.json',root);let data;
  try{data=await readFile(file,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;
   if(!(await capabilities()).available)throw Error('Real-data preprocessing runtime is unavailable. Keep the previous covered scenario.');
   await mkdir(new URL('data/cache/',root),{recursive:true});
   const cli=[fileURLToPath(new URL('scripts/science_request.py',root)),'--site',args.siteId,'--start',args.start,'--end',args.end,'--output',fileURLToPath(file)];
   if(point)cli.push('--point-file',fileURLToPath(new URL('data/cache/points/'+args.siteId+'.json',root)));
   try{await exec(fileURLToPath(python),cli,{cwd:fileURLToPath(root),windowsHide:true,env:{...process.env,OPENBLAS_NUM_THREADS:'1'},timeout:90000,maxBuffer:1024*1024});}catch(error){throw Error(error.stderr?.trim().split('\n').at(-1)||'The local scientific runtime could not prepare this date.');}
   data=await readFile(file,'utf8');
  }
  return {...JSON.parse(data),cacheKey:key};
 });pending.set(key,job);try{return await job;}finally{pending.delete(key);}
}
export function scienceApi(){
 const install=server=>{server.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith('/api/science/'))return next();
  const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
  try{
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Same-origin local requests only.'});
   if(req.url==='/api/science/capabilities'&&req.method==='GET')return send(200,await capabilities());
   if(!['/api/science/coverage','/api/science/point','/api/science/monthly','/api/science/terrain-ensemble'].includes(req.url)||req.method!=='POST')return send(404,{error:'Unknown scientific endpoint.'});
   if(!req.headers['content-type']?.includes('application/json'))return send(415,{error:'JSON required.'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return send(413,{error:'Request too large.'});}
   const request=JSON.parse(body);
   if(req.url==='/api/science/terrain-ensemble')return send(200,await getTerrainEnsemble(request));
   if(req.url==='/api/science/monthly')return send(200,await getMonthlyBlocks(request));
   if(req.url==='/api/science/point'){const science=JSON.parse(await readFile(new URL('data/science/real-workspace.json',root),'utf8'));return send(200,await getCustomPoint(request,science,normalizeRequest));}
   return send(200,await getDateBlock(request));
  }catch(error){return send(400,{error:error.message.split('\n')[0]||'Real-data preparation failed. The previous scenario is preserved.'});}
 });};
 return {name:'sitelight-local-science',configureServer:install,configurePreviewServer:install};
}
export function normalizeEnsembleRequest(request,science){
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!['siteId','radius','baseline','limit'].includes(k))||typeof request.siteId!=='string'||!Object.hasOwn(science.sites,request.siteId))throw Error('Choose a catalog point with retained published terrain realizations.');
 for(const [key,min,max] of [['radius',20,300],['baseline',5,100],['limit',0,45]])if(typeof request[key]!=='number'||!Number.isFinite(request[key])||request[key]<min||request[key]>max)throw Error('Unsupported terrain ensemble '+key+'.');
 return {siteId:request.siteId,radius:request.radius,baseline:request.baseline,limit:request.limit};
}
export async function getTerrainEnsemble(request){
 const scienceBytes=await readFile(new URL('data/science/real-workspace.json',root)),science=JSON.parse(scienceBytes),args=normalizeEnsembleRequest(request,science);
 const manifestBytes=await readFile(new URL('data/raw/terrain-evidence/clone-windows.json',root)),manifest=JSON.parse(manifestBytes),entry=science.sites[args.siteId],source=manifest.sites?.[args.siteId];
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),scienceSha256=sha(scienceBytes),cloneManifestSha256=sha(manifestBytes);
 if(manifest.scienceSha256!==scienceSha256||source?.status!=='acquired'||source.count!==100||source.sources?.length!==100||new Set(source.sources.map(r=>r.clone)).size!==100||!['lat','lon','altKm','tile'].every(k=>source.site[k]===entry.site[k]))throw Error('The retained ensemble is incomplete or belongs to a different scientific bundle.');
 const expectedWindow=[entry.site.sourcePixel[1]-74,entry.site.sourcePixel[0]-74,149,149];
 // Recheck retained identities even on a cache hit; never relabel changed local files.
 for(const record of source.sources){
  if(!record.subsetFile?.startsWith('data/raw/terrain-evidence/'+entry.site.tile+'/')||record.subsetFile.includes('..')||!record.subsetFile.endsWith('.npz')||JSON.stringify(record.window)!==JSON.stringify(expectedWindow)||JSON.stringify(record.shape)!=='[149,149]'||sha(await readFile(new URL(record.subsetFile,root)))!==record.subsetSha256)throw Error('A retained terrain realization changed or has mismatched coverage.');
 }
 const script=await readFile(new URL('scripts/evaluate-terrain-ensemble.py',root)),preparer=await readFile(new URL('scripts/prepare-terrain-acceptance.py',root)),evaluatorSha256=sha(script),footprintAlgorithmSha256=sha(preparer);
 const key=sha(JSON.stringify([args,entry.coordinates,scienceSha256,cloneManifestSha256,evaluatorSha256,footprintAlgorithmSha256]));
 if(ensembleCache.has(key))return structuredClone(ensembleCache.get(key));
 if(pending.has('ensemble:'+key))return structuredClone(await pending.get('ensemble:'+key));
 const job=limited(async()=>{
  let stdout;try{({stdout}=await exec(fileURLToPath(python),[fileURLToPath(new URL('scripts/evaluate-terrain-ensemble.py',root)),'--site',args.siteId,'--radius',String(args.radius),'--baseline',String(args.baseline),'--limit',String(args.limit)],{cwd:fileURLToPath(root),windowsHide:true,env:{...process.env,OPENBLAS_NUM_THREADS:'1'},timeout:45000,maxBuffer:1024*1024}));}catch(error){throw Error(error.stderr?.trim().split('\n').at(-1)||'Published terrain ensemble evaluation is unavailable.');}
  const result=JSON.parse(stdout);
  if(result.schema!=='sitelight-terrain-ensemble-1'||result.siteId!==args.siteId||result.members!==100||result.source?.scienceSha256!==scienceSha256||result.source?.cloneManifestSha256!==cloneManifestSha256||result.source?.evaluatorSha256!==evaluatorSha256||result.source?.footprintAlgorithmSha256!==footprintAlgorithmSha256||result.settings?.radiusM!==args.radius||result.settings?.baselineM!==args.baseline||result.settings?.slopeLimitDeg!==args.limit||result.acceptedForVerdict!==false)throw Error('Terrain ensemble response failed source/settings validation.');
  const data={...result,cacheKey:key};ensembleCache.set(key,data);if(ensembleCache.size>16)ensembleCache.delete(ensembleCache.keys().next().value);return data;
 });pending.set('ensemble:'+key,job);try{return structuredClone(await job);}finally{pending.delete('ensemble:'+key);}
}
export async function getMonthlyBlocks(request){
 const science=JSON.parse(await readFile(new URL('data/science/real-workspace.json',root),'utf8')),point=await loadPreparedPoint(request?.siteId,science);if(point)science.sites[request.siteId]=point.entry;
 const entry=typeof request?.siteId==='string'&&Object.hasOwn(science.sites,request.siteId)?science.sites[request.siteId]:null,duration=request?.durationHours;
 if(!entry||!Number.isFinite(duration)||duration<48||duration>336)throw Error('Choose a prepared real point and a 48–336 hour duration.');
 const script=await readFile(new URL('scripts/science_monthly.py',root)),key=createHash('sha256').update(JSON.stringify([request.siteId,duration,entry.coordinates,entry.pointPreparation,science.version,science.algorithm,science.inputs.filter(s=>s.name.startsWith('kernels/')),script.toString()])).digest('hex');
 if(pending.has(key))return pending.get(key);
 const job=limited(async()=>{const file=new URL('data/cache/monthly-'+key+'.json',root);let data;
  try{data=await readFile(file,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;await mkdir(new URL('data/cache/',root),{recursive:true});
   const args=[fileURLToPath(new URL('scripts/science_monthly.py',root)),'--site',request.siteId,'--duration',String(duration),'--output',fileURLToPath(file)];if(point)args.push('--point-file',fileURLToPath(new URL('data/cache/points/'+request.siteId+'.json',root)));
   try{await exec(fileURLToPath(python),args,{cwd:fileURLToPath(root),windowsHide:true,env:{...process.env,OPENBLAS_NUM_THREADS:'1'},timeout:180000,maxBuffer:1024*1024});}catch(error){throw Error(error.stderr?.trim().split('\n').at(-1)||'Monthly real-data preparation failed.');}
   data=await readFile(file,'utf8');}
  return {...JSON.parse(data),cacheKey:key};
 });pending.set(key,job);try{return await job;}finally{pending.delete(key);}
}
