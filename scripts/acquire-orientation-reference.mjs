import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../data/validation/orientation/',import.meta.url);mkdirSync(root,{recursive:true});
const science=JSON.parse(readFileSync(new URL('../data/science/real-workspace.json',import.meta.url)));
const output={schema:'sitelight-orientation-reference-1',purpose:'Independent Horizons airless apparent topocentric AZ/EL cases; validation recipe only, not the production geometric evaluator.',
 thresholds:{sunAngularDeg:.01,earthAngularDeg:.01},thresholdRationale:'Predeclared 0.01 degree screening tolerance for independent DE441/Horizons orientation versus DE421/ME, including kernel and apparent-correction differences; not flight certification.',sites:{}};
for(const id of ['real-shackleton','real-gerlache','real-nobile']){
 const site=science.sites[id].site,targets={},sources=[];
 for(const [body,command] of [['SUN','10'],['EARTH','399']]){
  const params={format:'json',COMMAND:command,OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'OBSERVER',CENTER:'coord@301',COORD_TYPE:'GEODETIC',SITE_COORD:`${(site.lon+360)%360},${site.lat},${site.altKm}`,START_TIME:'2027-01-13 00:00',STOP_TIME:'2027-01-13 12:00',STEP_SIZE:'6 h',QUANTITIES:'4',CSV_FORMAT:'YES',CAL_FORMAT:'JD',APPARENT:'AIRLESS',ANG_FORMAT:'DEG',EXTRA_PREC:'YES',ELEV_CUT:'-90'};
  const q=new URLSearchParams(Object.entries(params).map(([k,v])=>[k,k==='format'?v:"'"+v+"'"])),url='https://ssd.jpl.nasa.gov/api/horizons.api?'+q,name=id+'-'+body+'.json',path=new URL(name,root);
  if(!existsSync(path)){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(r.status);const json=await r.json();if(json.error)throw Error(json.error);writeFileSync(path,JSON.stringify(json));}
  const bytes=readFileSync(path),text=JSON.parse(bytes).result;
  const center=text.match(/Center geodetic\s*:\s*([^\n{]+)/)?.[1]?.split(',').map(Number);
  if(!center||Math.abs(center[0]-(site.lon+360)%360)>1e-5||Math.abs(center[1]-site.lat)>1e-5||Math.abs(center[2]-site.altKm)>1e-5||!text.includes('AIRLESS'))throw Error('Unexpected apparent reference recipe');
  const rows=text.split('$$SOE')[1]?.split('$$EOE')[0].trim().split(/\r?\n/).map(line=>{const a=line.split(',');return [Math.round((Number(a[0])-2440587.5)*86400)*1000,Number(a[3]),Number(a[4])];});
  if(rows?.length!==3||rows.some(r=>r.some(v=>!Number.isFinite(v))))throw Error('Invalid orientation reference');
  targets[body]=rows;sources.push({name:'orientation/'+name,url,sha256:createHash('sha256').update(bytes).digest('hex'),orientation:text.match(/Center pole\/equ[^\n]+/)?.[0],refraction:text.match(/Atmos refraction[^\n]+/)?.[0]});
  console.log(id,body,'3 apparent reference epochs');
 }
 output.sites[id]={coordinates:{lat:site.lat,lon:site.lon,altKm:site.altKm},targets,sources};
}
writeFileSync(new URL('../data/validation/orientation-references.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
