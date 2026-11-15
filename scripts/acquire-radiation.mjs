import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),manifestPath=new URL('data/radiation-inputs.json',root),rawRoot=new URL('data/raw/radiation/',root);
mkdirSync(rawRoot,{recursive:true});
const previous=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')).records:[];
const inputs=[{name:'crater-daily-dose.html',url:'https://crater-products.sr.unh.edu/data/inst/dose/table_l30drate.php',canonicalization:'none'},
 ...[['013','aluminum'],['221','polyethylene'],['276','water']].flatMap(([id,name])=>[
  {name:'pstar-'+name+'.txt',url:'https://physics.nist.gov/cgi-bin/Star/ap_table-t.pl',method:'POST',body:{prog:'PSTAR',matno:id,Energies:'',ShowDefault:'on'},canonicalization:'pstar-pre-v1'},
  {name:'pstar-'+name+'-composition.txt',url:'https://physics.nist.gov/cgi-bin/Star/compos.pl?ap-text'+id,canonicalization:'nist-composition-v1'}]),
 ...[['pstar-help.txt','https://physics.nist.gov/PhysRefData/Star/Text/programs.html'],['pstar-appendix.txt','https://physics.nist.gov/PhysRefData/Star/Text/appendix.html']].map(([name,url])=>({name,url,canonicalization:'body-text-v1'}))];
const strip=t=>t.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim();
function canonicalize(raw,kind){const s=raw.toString('utf8');if(kind==='none')return raw;
 if(kind==='pstar-pre-v1'){const pre=s.match(/<pre>([\s\S]*?)<\/pre>/i)?.[1];if(!pre||!pre.includes('RANGE(c)'))throw Error('Missing NIST proton table.');return Buffer.from(pre.split(/Show <a/i)[0].replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,'').replace(/\r/g,'').trim()+'\n');}
 const body=s.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];if(!body)throw Error('Missing source body.');return Buffer.from(strip(kind==='nist-composition-v1'?body.split(/<form/i)[0]:body)+'\n');
}
const records=[];
for(const input of inputs){const path=new URL(input.name,rawRoot),pinned=previous.find(r=>r.name===input.name);let bytes;
 if(existsSync(path))bytes=readFileSync(path);
 else{const response=await fetch(input.url,{method:input.method||'GET',...(input.body?{headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(input.body)}:{}),signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Radiation input HTTP '+response.status);bytes=canonicalize(Buffer.from(await response.arrayBuffer()),input.canonicalization);}
 const sha256=createHash('sha256').update(bytes).digest('hex');if(pinned&&(pinned.sha256!==sha256||pinned.bytes!==bytes.length))throw Error('Pinned radiation source mismatch: '+input.name);
 if(!existsSync(path))writeFileSync(path,bytes);records.push(pinned||{...input,bytes:bytes.length,sha256});console.log('Verified radiation source: '+input.name);
}
writeFileSync(manifestPath,JSON.stringify({schema:'sitelight-radiation-inputs-1',retrievedUtc:existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')).retrievedUtc:new Date().toISOString(),records},null,2)+'\n');
