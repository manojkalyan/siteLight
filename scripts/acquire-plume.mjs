import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync,rmSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
const root=new URL('../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('data/plume-inputs.json',root),'utf8'));
for(const record of manifest.records){
 const path=new URL('data/raw/plume/'+record.name,root);mkdirSync(new URL('./',path),{recursive:true});
 const verify=bytes=>{if(bytes.length!==record.bytes||createHash('sha256').update(bytes).digest('hex')!==record.sha256)throw Error('Pinned plume reference mismatch: '+record.name);};
 if(existsSync(path))verify(readFileSync(path));
 else{const r=await fetch(record.url,{signal:AbortSignal.timeout(180000)});if(!r.ok)throw Error('Plume reference HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());verify(b);const tmp=new URL(path.href+'.'+randomUUID()+'.partial');try{writeFileSync(tmp,b);renameSync(tmp,path);}finally{if(existsSync(tmp))rmSync(tmp);}}
 console.log('Verified pinned plume reference: '+record.name);
}
