import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import os from 'node:os';
import {performance} from 'node:perf_hooks';
import {createWorkspace} from '../src/workspace/store.mjs';
import {evaluate,findAlternative} from '../src/workspace/engine.mjs';
import {realTerrainScreen} from '../src/workspace/real-data.mjs';
const root=new URL('../',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8');
const source=read('data/science/real-workspace.json'),reference=JSON.parse(read('data/horizons/workspace-ephemeris.json'));
const start=performance.now(),science=JSON.parse(source),terrainEvidence=JSON.parse(read('data/science/terrain-acceptance-evidence.json')),w=createWorkspace(reference,{science,terrainEvidence});w.result('A');w.result('B');const decodeCompare=performance.now()-start;
function measure(name,n,fn){const times=[];for(let i=0;i<n;i++){const t=performance.now();fn(i);times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {name,runs:n,medianMs:times[Math.floor(n*.5)],p95Ms:times[Math.min(n-1,Math.floor(n*.95))],maxMs:times.at(-1)};}
const s=w.state.scenarios.A,p=w.provider('A'),r=w.state.requirements;
const metrics=[measure('Uncached seven-day real scenario',40,()=>evaluate(s,r,p)),
 measure('Cached unchanged verdict',500,()=>w.result('A')),
 measure('Uncached settled requirement edit',30,i=>{w.setRequirements({minElevation:1+i*.01});w.result('A');}),
 measure('Real footprint statistics',40,()=>realTerrainScreen(p.entry,w.state.terrain)),
 measure('Bounded date search',5,()=>findAlternative(s,{...r,minSun:1,minEarth:1,minOverlap:1},p)),
 measure('29-cell uncached calendar',5,()=>{for(let offset=-14;offset<=14;offset++)evaluate({...s,offset},r,p);})];
const targets={initialDataDecodeAndComparisonMs:5000,cachedVerdictP95Ms:2000,settledEditP95Ms:1000};
const checks={dataDecodeAndComparison:decodeCompare<5000,cachedVerdict:metrics[1].p95Ms<2000,settledEdit:metrics[2].p95Ms<1000};
const report={recordedUtc:new Date().toISOString(),environment:{kind:'Node local compute benchmark; not browser end-to-end',node:process.version,platform:process.platform,cpu:os.cpus()[0].model,logicalCpus:os.cpus().length,totalMemoryGiB:os.totalmem()/1024**3},
 applicationModel:w.serialize().model,dataset:{terrainEvidenceBytes:Buffer.byteLength(read('data/science/terrain-acceptance-evidence.json')),catalogHorizonExtentM:500000,scienceBytes:Buffer.byteLength(source),referenceBytes:Buffer.byteLength(read('data/horizons/workspace-ephemeris.json')),sites:Object.keys(science.sites).length},initialDataDecodeAndComparisonMs:decodeCompare,metrics,targets,checks,cacheStats:w.cacheStats(),
 limitations:['Does not measure network, browser parse/layout, GPU rendering, real-device accessibility, or full user-perceived latency','Initial figure includes scientific JSON parsing and first A/B computations; not full app load','LCSS timing is not applicable until an accepted model exists']};
mkdirSync(new URL('docs/performance/',root),{recursive:true});writeFileSync(new URL('docs/performance/latest.json',root),JSON.stringify(report,null,2));
console.log(JSON.stringify({initialDataDecodeAndComparisonMs:decodeCompare,metrics,checks},null,2));
if(Object.values(checks).some(v=>!v))process.exitCode=1;
