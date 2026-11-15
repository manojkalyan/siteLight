import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {parseThermalRow} from '../src/workspace/thermal.mjs';
const root=new URL('../',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8'),science=JSON.parse(read('data/science/real-workspace.json')),context=JSON.parse(read('data/science/thermal-context.json'));
const inputs=JSON.parse(read('data/thermal-inputs.json')).records,bounds=Object.values(science.sites).map(e=>e.terrain.metadata.boundsM);
const result={schema:'sitelight-custom-thermal-index-1',sourceAlgorithm:context.algorithm,algorithm:{file:'scripts/index-custom-thermal.mjs',sha256:createHash('sha256').update(read('scripts/index-custom-thermal.mjs')).digest('hex')},boundsM:bounds,products:[]};
for(const b of Object.values(context.sites)[0]){
 const {match,...metadata}=b,source=inputs.find(s=>s.name===b.product+'.tab'),hash=createHash('sha256'),path=new URL('data/raw/thermal/'+source.name,root);
 for await(const chunk of createReadStream(path))hash.update(chunk);
 if(hash.digest('hex')!==source.sha256)throw Error('Thermal table checksum changed');
 const rows=[];let lineNumber=0;
 for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){
  lineNumber++;if(lineNumber===1)continue;const r=parseThermalRow(line);if(!r)continue;
  const x=r.x*1737400,y=r.y*1737400;
  if(bounds.some(([left,bottom,right,top])=>x>=left-500&&x<=right+500&&y>=bottom-500&&y<=top+500))rows.push([r.lat,r.lon,r.kelvin,lineNumber]);
 }
 result.products.push({metadata,rows});console.log(b.product,rows.length,'indexed nearby observed bins');
}
writeFileSync(new URL('data/science/custom-thermal-index.json',root),JSON.stringify(result)+'\n');
