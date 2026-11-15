import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync,rmSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
const root=new URL('../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('data/engineering-inputs.json',root),'utf8'));
for(const record of manifest.records){
 const path=new URL('data/raw/engineering/'+record.name,root);mkdirSync(new URL('./',path),{recursive:true});
 const verify=bytes=>{if(bytes.length!==record.bytes||createHash('sha256').update(bytes).digest('hex')!==record.sha256)throw Error('Pinned engineering reference mismatch: '+record.name);};
 if(existsSync(path))verify(readFileSync(path));
 else{
  const response=await fetch(record.url,{signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error('Reference download: HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());verify(bytes);
  const temporary=new URL(path.href+'.'+randomUUID()+'.partial');
  try{writeFileSync(temporary,bytes);renameSync(temporary,path);}finally{if(existsSync(temporary))rmSync(temporary);}
 }
 console.log('Verified pinned reference: '+record.name);
}
