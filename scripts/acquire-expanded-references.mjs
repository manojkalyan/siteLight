import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Thresholds are inherited unchanged from the original geometric-reference check,
// before acquiring or inspecting these additional epochs.
const folder=new URL('../data/validation/expanded/',import.meta.url);
const epochs=[];for(let year=2027;year<=2033;year++)for(const month of [0,3,6,9])epochs.push(Date.UTC(year,month,13));
epochs.push(Date.UTC(2028,1,29),Date.UTC(2032,1,29),Date.UTC(2033,11,31,23,50));epochs.sort((a,b)=>a-b);
const spec={schema:'sitelight-expanded-reference-spec-1',epochsUtc:epochs.map(t=>new Date(t).toISOString()),thresholds:{sunAngularDeg:.0001,earthAngularDeg:.005},thresholdMeaning:'Inherited predeclared software/geometric comparison thresholds, not approved mission accuracy requirements',convention:{center:'Moon (301)',frame:'ICRF',correction:'NONE',time:'UT',units:'KM-S'}};
await mkdir(folder,{recursive:true});
let previous=null;try{previous=JSON.parse(await readFile(new URL('reference-vectors.json',folder),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(previous&&JSON.stringify(previous.spec)!==JSON.stringify(spec))throw Error('Expanded reference specification changed; do not silently repin it.');
const output={spec,sources:[],targets:{}};
for(const [body,id] of [['SUN','10'],['EARTH','399']]){
 const parameters={format:'json',COMMAND:id,OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'VECTORS',CENTER:'500@301',REF_PLANE:'FRAME',REF_SYSTEM:'ICRF',VEC_CORR:'NONE',OUT_UNITS:'KM-S',VEC_TABLE:'1',TIME_TYPE:'UT',TLIST_TYPE:'JD',CSV_FORMAT:'YES',TIME_DIGITS:'FRACSEC'};
 const query=new URLSearchParams(Object.entries(parameters).map(([k,v])=>[k,k==='format'?v:"'"+v+"'"]));query.set('TLIST',epochs.map(t=>"'"+(t/86400000+2440587.5).toFixed(9)+"'").join(' '));
 const url='https://ssd.jpl.nasa.gov/api/horizons.api?'+query,path=new URL(body+'.json',folder);let bytes;
 try{bytes=await readFile(path);}catch(e){if(e.code!=='ENOENT')throw e;const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Horizons HTTP '+response.status);bytes=Buffer.from(JSON.stringify(await response.json()));}
 const sha256=createHash('sha256').update(bytes).digest('hex'),old=previous?.sources.find(s=>s.name===body+'.json');if(old&&(old.sha256!==sha256||old.url!==url))throw Error('Pinned expanded reference changed: '+body);
 const payload=JSON.parse(bytes),result=payload.result;if(payload.error||typeof result!=='string')throw Error('Horizons rejected the reference: '+payload.error);
 if(!result.includes('GEOMETRIC cartesian states')||!(/Reference frame\s*:\s*ICRF/.test(result))||!(/Output units\s*:\s*KM-S/.test(result))||!(/JDUT\s*,\s*Calendar Date \(UT \)/.test(result))||!new RegExp('Target body name:\\s*'+(body==='SUN'?'Sun':'Earth')+' \\('+id+'\\)').test(result)||!(/Center body name:\s*Moon \(301\)/.test(result)))throw Error('Unexpected target/frame/time/units reference contract: '+body);
 const ephemeris=result.match(/Target body name:[^\n]*source:\s*([^}\n]+)/)?.[1]?.trim();if(!ephemeris)throw Error('Missing reference ephemeris identity.');
 const rows=result.split('$$SOE')[1]?.split('$$EOE')[0].trim().split(/\r?\n/).map(line=>{const values=line.split(',');return [Math.round((Number(values[0])-2440587.5)*86400)*1000,...values.slice(2,5).map(Number)];});
 if(rows?.length!==epochs.length||rows.some((row,i)=>row.length!==4||row.some(v=>!Number.isFinite(v))||row[0]!==epochs[i]))throw Error('Changed reference epoch/vector contract: '+body);
 await writeFile(path,bytes);output.targets[body]=rows;output.sources.push({name:body+'.json',url,sha256,bytes:bytes.length,ephemeris,correction:'NONE',frame:'ICRF',time:'UT; future leap-second assumption retained',units:'KM-S'});
 console.log(body+': '+rows.length+' source-backed geometric epochs pinned ('+ephemeris+').');
}
await writeFile(new URL('reference-vectors.json',folder),JSON.stringify(output,null,2)+'\n');
