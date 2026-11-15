import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog} from '../src/workspace/catalog.mjs';
const root=new URL('../data/horizons/',import.meta.url);mkdirSync(root,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
export function parseHorizons(text){
 const body=text.split('$$SOE')[1]?.split('$$EOE')[0];if(!body)throw Error('No Horizons table: '+text.slice(0,400));
 const rows=body.trim().split(/\r?\n/).map(line=>{const a=line.split(',');const row=[Math.round((Number(a[0])-2440587.5)*86400000/1000)*1000,Number(a[3]),Number(a[4])];if(row.some(v=>!Number.isFinite(v)))throw Error('Invalid Horizons row');return row;});
 if(rows.length<2)throw Error('Empty Horizons series');return rows;
}
const bundle={schema:'sitelight-horizons-1',retrievedUtc:new Date().toISOString(),interval:{start:'2027-01-01T00:00:00Z',end:'2027-02-01T00:00:00Z',stepMinutes:10},
 convention:'Airless apparent body-center azimuth/elevation, light-time/aberration included; azimuth clockwise from north; no atmospheric refraction. Reference tangent horizon only; no DEM.',
 validation:'Source-backed reference data; independent scientific validation and real terrain pending.',sites:{}};
for(const site of catalog){
 const targets={};const raw=[];
 for(const [name,id] of [['sun','10'],['earth','399']]){
  const filename=site.id+'-'+name+'.json',path=new URL(filename,root);let json;
  const params={format:'json',COMMAND:id,OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'OBSERVER',CENTER:'coord@301',COORD_TYPE:'GEODETIC',SITE_COORD:`${(site.lon+360)%360},${site.lat},${site.altKm}`,START_TIME:'2027-01-01 00:00',STOP_TIME:'2027-02-01 00:00',STEP_SIZE:'10 m',QUANTITIES:'4',CSV_FORMAT:'YES',CAL_FORMAT:'JD',APPARENT:'AIRLESS',ANG_FORMAT:'DEG',EXTRA_PREC:'YES',ELEV_CUT:'-90'};
  const q=new URLSearchParams(Object.entries(params).map(([k,v])=>[k,k==='format'?v:"'"+v+"'"]));
  const url='https://ssd.jpl.nasa.gov/api/horizons.api?'+q;
  if(existsSync(path))json=JSON.parse(readFileSync(path,'utf8'));
  else {const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Horizons HTTP '+response.status);json=await response.json();if(json.error)throw Error(json.error);writeFileSync(path,JSON.stringify(json));}
  targets[name]=parseHorizons(json.result);
  const header=json.result.match(/Center geodetic\s*:\s*([^\n{]+)/)?.[1]?.split(',').map(Number);
  if(!header||Math.abs(header[0]-(site.lon+360)%360)>1e-5||Math.abs(header[1]-site.lat)>1e-5||Math.abs(header[2]-site.altKm)>1e-5)throw Error('Cached observer coordinates do not match configured point: '+filename);
  if(targets[name][0][0]!==Date.parse(bundle.interval.start)||targets[name].at(-1)[0]!==Date.parse(bundle.interval.end))throw Error('Cached time coverage does not match configuration: '+filename);
  const text=json.result;
  raw.push({target:name,url,filename,sha256:sha(readFileSync(path)),apiSignature:json.signature,ephemeris:text.match(/Target body name:[^\n]+/)?.[0],orientation:text.match(/Center pole\/equ[^\n]+/)?.[0],refraction:text.match(/Atmos refraction[^\n]+/)?.[0]});
  console.log(site.id,name,targets[name].length);
 }
 if(targets.sun.length!==targets.earth.length)throw Error('Mismatched target rows');
 const records=targets.sun.map((s,i)=>{const e=targets.earth[i];if(e[0]!==s[0])throw Error('Mismatched timestamps');return [s[0],s[1],s[2],e[1],e[2]];});
 bundle.sites[site.id]={coordinates:{lat:site.lat,lon:site.lon,altKm:site.altKm},coordinateStatus:site.coordinateStatus,sources:raw,records};
}
writeFileSync(new URL('workspace-ephemeris.json',root),JSON.stringify(bundle));
console.log('Saved reference ephemerides; no DEM or independent validation claimed.');
