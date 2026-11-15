import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const root=new URL('../',import.meta.url),exec=promisify(execFile),pending=new Map();let tail=Promise.resolve();
const hash=value=>createHash('sha256').update(value).digest('hex');
export function customPointId(lat,lon,observerHeightM){return 'custom-real-'+hash(JSON.stringify([lat,lon,observerHeightM])).slice(0,24);}
export function validatePreparedPointMetadata(point,science,siteId,scriptSha,indexSha){
 if(point?.schema!=='sitelight-custom-point-1'||point.preprocessingVersion!==science.version||point.sourceAlgorithm?.sha256!==science.algorithm.sha256||point.entry?.site?.id!==siteId)throw Error('This prepared coordinate uses older scientific inputs. Prepare it again before choosing new dates.');
 if(point.pointAlgorithm?.sha256!==scriptSha||point.entry?.pointPreparation?.sha256!==scriptSha)throw Error('This prepared coordinate uses an older terrain algorithm. Prepare it again.');
 if(point.pointAlgorithm?.thermalIndexSha256!==indexSha||point.entry?.pointPreparation?.thermalIndexSha256!==indexSha)throw Error('The thermal source index has changed. Prepare this coordinate again to refresh its evidence.');
}
export function normalizeCustomRequest(request,science){
 const {lat,lon,observerHeightM=2}=request||{};
 if(![lat,lon,observerHeightM].every(v=>typeof v==='number'&&Number.isFinite(v))||lat< -90||lat>90||lon< -180||lon>180||observerHeightM<.1||observerHeightM>100)throw Error('Use latitude −90…90°, longitude −180…180°, and observer height 0.1…100 m above terrain.');
 const a=Number(lat.toFixed(8)),b=Number(lon.toFixed(8)),height=Number(observerHeightM.toFixed(3)),r=2*1737400*Math.tan(Math.PI/4+a*Math.PI/360),x=r*Math.sin(b*Math.PI/180),y=r*Math.cos(b*Math.PI/180);
 const candidates=Object.values(science.sites).filter(e=>!e.site.custom).map(e=>{const [left,bottom,right,top]=e.terrain.metadata.boundsM;return {tile:e.site.tile,margin:Math.min(x-left,right-x,y-bottom,top-y)};}).filter(e=>e.margin>=660).sort((a,b)=>b.margin-a.margin);
 if(!candidates.length)throw Error('This coordinate needs a high-resolution DEM not available locally, or is too close to its edge. Choose a point inside a prepared PGDA area. Your previous assessment is preserved.');
 return {lat:a,lon:b,observerHeightM:height,tile:candidates[0].tile,siteId:customPointId(a,b,height)};
}
export async function loadPreparedPoint(siteId,science){
 if(!/^custom-real-[a-f0-9]{24}$/.test(siteId||''))return null;
 let point;try{point=JSON.parse(await readFile(new URL('data/cache/points/'+siteId+'.json',root),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}
 validatePreparedPointMetadata(point,science,siteId,hash(await readFile(new URL('scripts/prepare-custom-point.py',root))),hash(await readFile(new URL('data/science/custom-thermal-index.json',root))));
 return point;
}
export async function getCustomPoint(request,science,normalizeDates){
 const normalized=normalizeCustomRequest(request,science),dates=normalizeDates({...request,siteId:Object.keys(science.sites)[0]},science);
 const script=await readFile(new URL('scripts/prepare-custom-point.py',root)),index=await readFile(new URL('data/science/custom-thermal-index.json',root));
 const key=hash(JSON.stringify([normalized,dates.start,dates.end,science.version,science.algorithm,science.inputs,hash(script),hash(index)]));
 if(pending.has(key))return pending.get(key);
 const job=tail.catch(()=>{}).then(async()=>{
  const file=new URL('data/cache/custom-'+key+'.json',root);let data;
  try{data=await readFile(file,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;
   await mkdir(new URL('data/cache/',root),{recursive:true});
   try{await exec(fileURLToPath(new URL('.tools/python/python.exe',root)),[fileURLToPath(new URL('scripts/prepare-custom-point.py',root)),'--request',JSON.stringify({...normalized,start:dates.start,end:dates.end}),'--output',fileURLToPath(file)],{cwd:fileURLToPath(root),windowsHide:true,env:{...process.env,OPENBLAS_NUM_THREADS:'1'},timeout:120000,maxBuffer:1024*1024});}
   catch(error){throw Error(error.stderr?.trim().split('\n').at(-1)||'Real terrain preparation failed. Your previous assessment is preserved.');}
   data=await readFile(file,'utf8');
  }
  const result={...JSON.parse(data),cacheKey:key};
  validatePreparedPointMetadata(result,science,normalized.siteId,hash(script),hash(index));
  await mkdir(new URL('data/cache/points/',root),{recursive:true});
  const destination=new URL('data/cache/points/'+normalized.siteId+'.json',root),temporary=new URL(destination.href+'.'+randomUUID()+'.partial');
  await writeFile(temporary,JSON.stringify(result));await rename(temporary,destination);return result;
 });tail=job;pending.set(key,job);try{return await job;}finally{pending.delete(key);}
}
