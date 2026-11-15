import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('data/seismic-inputs.json',root),'utf8'));
for(const record of manifest.records){
 const path=new URL('data/seismic/sources/'+record.name,root);let bytes;
 try{bytes=await readFile(path);}catch(error){if(error.code!=='ENOENT')throw error;const response=await fetch(record.url,{signal:AbortSignal.timeout(90000)});if(!response.ok)throw Error('Seismic source HTTP '+response.status+': '+record.name);bytes=Buffer.from(await response.arrayBuffer());await mkdir(new URL('./',path),{recursive:true});}
 if(bytes.length!==record.bytes||createHash('sha256').update(bytes).digest('hex')!==record.sha256)throw Error('Pinned seismic source differs: '+record.name);
 await writeFile(path,bytes);console.log('Verified seismic source: '+record.name);
}
