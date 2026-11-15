import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../data/validation/',import.meta.url);mkdirSync(root,{recursive:true});
const output={purpose:'External Horizons geometric inertial-vector cross-check of DE421. Not an independent terrain/orientation certification.',
 thresholds:{sunAngularDeg:.0001,earthAngularDeg:.005},sources:[],targets:{}};
for(const [body,id] of [['SUN','10'],['EARTH','399']]){
 const params={format:'json',COMMAND:id,OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'VECTORS',CENTER:'500@301',REF_PLANE:'FRAME',REF_SYSTEM:'ICRF',VEC_CORR:'NONE',OUT_UNITS:'KM-S',VEC_TABLE:'1',TIME_TYPE:'UT',START_TIME:'2027-01-13 00:00',STOP_TIME:'2027-01-13 01:00',STEP_SIZE:'30 m',CSV_FORMAT:'YES'};
 const q=new URLSearchParams(Object.entries(params).map(([k,v])=>[k,k==='format'?v:"'"+v+"'"])),url='https://ssd.jpl.nasa.gov/api/horizons.api?'+q,path=new URL(body+'.json',root);
 if(!existsSync(path)){const r=await fetch(url);if(!r.ok)throw Error(r.status);const j=await r.json();if(j.error)throw Error(j.error);writeFileSync(path,JSON.stringify(j));}
 const bytes=readFileSync(path),text=JSON.parse(bytes).result;
 if(!text.includes('GEOMETRIC cartesian states')||!text.includes('ICRF'))throw Error('Unexpected reference convention');
 const rows=text.split('$$SOE')[1]?.split('$$EOE')[0].trim().split(/\r?\n/).map(line=>{const a=line.split(',');return [Math.round((Number(a[0])-2440587.5)*86400000/1000)*1000,...a.slice(2,5).map(Number)];});
 if(rows?.length!==3||rows.some(row=>row.some(v=>!Number.isFinite(v))))throw Error('Invalid reference rows');
 output.targets[body]=rows;output.sources.push({name:body+'.json',url,sha256:createHash('sha256').update(bytes).digest('hex'),ephemeris:'DE441',correction:'NONE',frame:'ICRF',time:'UTC, future leap-second assumption retained'});
}
writeFileSync(new URL('reference-vectors.json',root),JSON.stringify(output,null,2));console.log('Pinned external geometric-vector references.');
