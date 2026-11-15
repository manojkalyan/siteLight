import {createReadStream,createWriteStream,mkdirSync,existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Readable,Transform} from 'node:stream';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import {parseThermalRow,thermalDistanceM} from '../src/workspace/thermal.mjs';
const raw=new URL('../data/raw/thermal/',import.meta.url);mkdirSync(raw,{recursive:true});
const base='https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_pcp/diurnal/ltim/pols/';
const manifestPath=new URL('../data/thermal-inputs.json',import.meta.url),previous=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath)).records:[],records=[];
const science=JSON.parse(readFileSync(new URL('../data/science/real-workspace.json',import.meta.url))),sites=Object.values(science.sites).map(e=>e.site);
const output={schema:'sitelight-diviner-context-1',algorithm:{file:'scripts/acquire-thermal.mjs',sha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),dependencies:[{file:'src/workspace/thermal.mjs',sha256:createHash('sha256').update(readFileSync(new URL('../src/workspace/thermal.mjs',import.meta.url))).digest('hex')}]},sites:Object.fromEntries(sites.map(s=>[s.id,[]]))};
for(const index of [1,49]){
 const stem=`pcp_avg_tbol_pols_sum_ltim${String(index).padStart(2,'0')}_240`,sources=[];
 for(const extension of ['lbl','xml','tab']){
  const name=stem+'.'+extension,path=new URL(name,raw),url=base+name,hash=createHash('sha256');let size=0;
  if(!existsSync(path)){
   const r=await fetch(url,{signal:AbortSignal.timeout(300000)});if(!r.ok)throw Error('Diviner HTTP '+r.status);
   const expected=Number(r.headers.get('content-length')),temporary=new URL(path.href+'.partial');
   await pipeline(Readable.fromWeb(r.body),new Transform({transform(chunk,encoding,callback){size+=chunk.length;hash.update(chunk);callback(null,chunk);}}),createWriteStream(temporary));
   if(expected&&size!==expected)throw Error('Incomplete Diviner product');renameSync(temporary,path);
  }else{for await(const chunk of createReadStream(path)){size+=chunk.length;hash.update(chunk);}}
  const sha256=hash.digest('hex'),pin=previous.find(p=>p.name===name);if(pin&&pin.sha256!==sha256)throw Error('Pinned thermal input changed: '+name);
  const record=pin||{name,url,bytes:size,sha256,retrievedDate:new Date().toISOString().slice(0,10)};records.push(record);sources.push(record);console.log(name,size);
 }
 const label=readFileSync(new URL(stem+'.lbl',raw),'utf8'),xml=readFileSync(new URL(stem+'.xml',raw),'utf8');
 const field=key=>label.match(new RegExp('^'+key+'\\s*=\\s*([^\\r\\n]+)','m'))?.[1]?.trim();
 if(field('RECORD_BYTES')!=='59'||field('MAP_SCALE')!=='240 <m/pix>'||!xml.includes('<unit>K</unit>')||!label.includes('summer season'))throw Error('Unexpected Diviner product semantics');
 const count=Number(field('FILE_RECORDS'))-1,localTimeHours=[Number(field('LRO:DLRE_CLOCTIME_MIN').split(' ')[0]),Number(field('LRO:DLRE_CLOCTIME_MAX').split(' ')[0])];
 const found=new Map();let lineNumber=0;
 for await(const line of createInterface({input:createReadStream(new URL(stem+'.tab',raw)),crlfDelay:Infinity})){
  lineNumber++;if(lineNumber===1)continue;const row=parseThermalRow(line);if(!row)continue;
  for(const site of sites){if(Math.abs(row.lat-site.lat)>.02)continue;const lonDelta=Math.abs(((row.lon-site.lon+540)%360)-180);if(lonDelta*Math.cos(site.lat*Math.PI/180)>.02)continue;
   const distanceM=thermalDistanceM(site,row);if(distanceM>Math.SQRT2*120+2)continue;
   const existing=found.get(site.id);if(!existing||distanceM<existing.distanceM)found.set(site.id,{...row,distanceM,sourceRecord:lineNumber,rawLine:line});
  }
 }
 if(lineNumber-1!==count)throw Error('Diviner record count disagrees with label');
 for(const site of sites)output.sites[site.id].push({status:found.has(site.id)?'observed_context':'no_matching_bin',product:stem,localTimeHours,season:'Southern summer: subsolar latitude < 0°',
  observationPeriod:{start:field('START_TIME'),end:field('STOP_TIME')},pixelSpacingM:240,quantity:'Average bolometric brightness temperature',unit:'K',
  match:found.get(site.id)||null,sources,interpretation:'Historical cumulative local-time/season bin near the study point; not a temperature prediction for the selected mission UTC. No observation-count, temperature error bar, or subpixel co-registration is supplied here. Missing bins are not filled.'});
}
writeFileSync(manifestPath,JSON.stringify({schema:'sitelight-thermal-inputs-1',sourcePage:'https://pds-geosciences.wustl.edu/missions/lro/diviner.htm',records},null,2)+'\n');
writeFileSync(new URL('../data/science/thermal-context.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
for(const [id,bins] of Object.entries(output.sites))console.log(id,bins.map(b=>b.match?`${b.match.kelvin} K / ${b.match.distanceM.toFixed(1)} m`:b.status).join(', '));
