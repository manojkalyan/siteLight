import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),folder=new URL('data/validation/expanded/orientation/',root);
const science=JSON.parse(await readFile(new URL('data/science/real-workspace.json',root),'utf8'));
const geometry=JSON.parse(await readFile(new URL('data/validation/expanded/reference-vectors.json',root),'utf8'));
const original=JSON.parse(await readFile(new URL('data/validation/orientation-references.json',root),'utf8'));
await mkdir(folder,{recursive:true});
let previous=null;const target=new URL('data/validation/expanded/orientation-references.json',root);try{previous=JSON.parse(await readFile(target,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const epochs=geometry.spec.epochsUtc.map(Date.parse),spec={epochsUtc:geometry.spec.epochsUtc,thresholds:original.thresholds,thresholdMeaning:original.thresholdRationale,correction:'Apparent airless topocentric observer AZ/EL; compared with CSPICE reception CN+S only, not the production NONE directions'};
if(previous&&JSON.stringify(previous.spec)!==JSON.stringify(spec))throw Error('Expanded apparent reference specification changed.');
const output={schema:'sitelight-expanded-apparent-reference-1',spec,sites:{}};
for(const [identifier,entry] of Object.entries(science.sites)){
 const site=entry.site,sources=[],targets={};
 for(const [body,command] of [['SUN','10'],['EARTH','399']]){
  const parameters={format:'json',COMMAND:command,OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'OBSERVER',CENTER:'coord@301',COORD_TYPE:'GEODETIC',SITE_COORD:`${(site.lon+360)%360},${site.lat},${site.altKm}`,QUANTITIES:'4',CSV_FORMAT:'YES',CAL_FORMAT:'JD',APPARENT:'AIRLESS',ANG_FORMAT:'DEG',EXTRA_PREC:'YES',ELEV_CUT:'-90',TIME_TYPE:'UT',TLIST_TYPE:'JD'};
  const query=new URLSearchParams(Object.entries(parameters).map(([k,v])=>[k,k==='format'?v:"'"+v+"'"]));query.set('TLIST',epochs.map(t=>"'"+(t/86400000+2440587.5).toFixed(9)+"'").join(' '));
  const url='https://ssd.jpl.nasa.gov/api/horizons.api?'+query,name=identifier+'-'+body+'.json',path=new URL(name,folder);let bytes;
  try{bytes=await readFile(path);}catch(e){if(e.code!=='ENOENT')throw e;const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Horizons HTTP '+response.status);bytes=Buffer.from(JSON.stringify(await response.json()));}
  const sha256=createHash('sha256').update(bytes).digest('hex'),old=previous?.sites[identifier]?.sources.find(s=>s.name===name);if(old&&(old.sha256!==sha256||old.url!==url))throw Error('Pinned apparent reference changed: '+name);
  const payload=JSON.parse(bytes),text=payload.result;if(payload.error||typeof text!=='string')throw Error('Horizons reference rejected: '+payload.error);
  const center=text.match(/Center geodetic\s*:\s*([^\n{]+)/)?.[1]?.split(',').map(Number);
  if(!center||Math.abs(center[0]-(site.lon+360)%360)>1e-5||Math.abs(center[1]-site.lat)>1e-5||Math.abs(center[2]-site.altKm)>1e-5||!text.includes('AIRLESS')||!text.includes('MEAN_ME')||!new RegExp('Target body name:\\s*'+(body==='SUN'?'Sun':'Earth')+' \\('+command+'\\)').test(text))throw Error('Unexpected apparent target/observer/orientation contract: '+name);
  const rows=text.split('$$SOE')[1]?.split('$$EOE')[0].trim().split(/\r?\n/).map(line=>{const v=line.split(',');return [Math.round((Number(v[0])-2440587.5)*86400)*1000,Number(v[3]),Number(v[4])];});
  if(rows?.length!==epochs.length||rows.some((row,i)=>row.some(v=>!Number.isFinite(v))||row[0]!==epochs[i]||row[1]<0||row[1]>=360||Math.abs(row[2])>90))throw Error('Invalid apparent reference rows: '+name);
  await writeFile(path,bytes);targets[body]=rows;sources.push({name,url,sha256,bytes:bytes.length,orientation:text.match(/Center pole\/equ[^\n]+/)?.[0],refraction:text.match(/Atmos refraction[^\n]+/)?.[0]});console.log(identifier+' '+body+': '+rows.length+' independent apparent epochs pinned.');
 }
 output.sites[identifier]={coordinates:{lat:site.lat,lon:site.lon,altKm:site.altKm},targets,sources};
}
await writeFile(target,JSON.stringify(output,null,2)+'\n');
