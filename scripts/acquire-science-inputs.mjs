import {mkdirSync,existsSync,readFileSync,writeFileSync,renameSync,openSync,writeSync,closeSync,ftruncateSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../data/raw/',import.meta.url);mkdirSync(root,{recursive:true});
const inputs=[
 ['kernels/de421.bsp','https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp'],
 ['kernels/moon_pa_de421_1900-2050.bpc','https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc'],
 ['kernels/moon_080317.tf','https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf'],
 ['kernels/naif0012.tls','https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls'],
 ['terrain/README','https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README'],
 ['terrain/LDEM_80S_80MPP_ADJ.TIF','https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_80MPP_ADJ.TIF'],
 ['terrain/LDEM_80S_80MPP_ADJ_ERR.TIF','https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_80MPP_ADJ_ERR.TIF'],
 ...['Site01','Site04','Site11','Site06','Site07','Site23'].flatMap(site=>['surf','toterr','slperr'].map(kind=>[`terrain/${site}_${kind}.tif`,`https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/${site}/${site}_final_adj_5mpp_${kind}.tif`]))
];
const records=[];
const manifestPath=new URL('../science-inputs.json',root);
const previous=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')).records:[];
async function download(url,path){
 const head=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(30000)});if(!head.ok)throw Error('HEAD '+head.status);
 const total=Number(head.headers.get('content-length')),etag=head.headers.get('etag');
 const temporary=new URL(path.href+'.partial');
 if(total>8000000&&head.headers.get('accept-ranges')==='bytes'){
  const fd=openSync(temporary,'w');ftruncateSync(fd,total);let cursor=0;const chunk=2*1024*1024;
  async function worker(){while(cursor<total){const start=cursor;cursor+=chunk;const end=Math.min(total-1,start+chunk-1);let success=false;
   for(let attempt=0;attempt<3&&!success;attempt++){try{const r=await fetch(url,{headers:{Range:`bytes=${start}-${end}`},signal:AbortSignal.timeout(60000)});if(r.status!==206)throw Error('Range response '+r.status);if(r.headers.get('content-range')!==`bytes ${start}-${end}/${total}`)throw Error('Wrong source byte range');if(etag&&r.headers.get('etag')!==etag)throw Error('Source changed during acquisition');const b=Buffer.from(await r.arrayBuffer());if(b.length!==end-start+1)throw Error('Incomplete chunk');let written=0;while(written<b.length)written+=writeSync(fd,b,written,b.length-written,start+written);success=true;}catch(error){if(attempt===2)throw error;}}
  }}
  try{const jobs=await Promise.allSettled(Array.from({length:4},worker));for(const job of jobs)if(job.status==='rejected')throw job.reason;}finally{closeSync(fd);}
 }else{const r=await fetch(url,{signal:AbortSignal.timeout(180000)});if(!r.ok)throw Error(url+': '+r.status);writeFileSync(temporary,Buffer.from(await r.arrayBuffer()));}
 renameSync(temporary,path);
}
// Serial requests keep acquisition polite and make partial runs resumable.
for(const [name,url] of inputs){
 const path=new URL(name,root);mkdirSync(new URL('./',path),{recursive:true});
 if(!existsSync(path)){
  await download(url,path);
 }
 const data=readFileSync(path),sha256=createHash('sha256').update(data).digest('hex'),pinned=previous.find(r=>r.name===name);
 if(pinned&&pinned.sha256!==sha256)throw Error('Pinned source changed: '+name+'; investigate instead of silently repinning.');
 records.push(pinned||{name,url,bytes:data.length,sha256,retrievedDate:new Date().toISOString().slice(0,10)});console.log(name,data.length);
}
writeFileSync(manifestPath,JSON.stringify({schema:'sitelight-science-inputs-1',sourcePage:'https://pgda.gsfc.nasa.gov/products/78',records},null,2)+'\n');
