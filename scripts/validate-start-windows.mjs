import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createWorkspace} from '../src/workspace/store.mjs';
import {scanStartWindows,verifyStartSelection,startWindowVersion} from '../src/workspace/start-windows.mjs';
import {evaluate,STEP} from '../src/workspace/engine.mjs';
const root=new URL('../',import.meta.url),bytes=readFileSync(new URL('data/science/real-workspace.json',root)),science=JSON.parse(bytes);
const w=createWorkspace(JSON.parse(readFileSync(new URL('data/horizons/workspace-ephemeris.json',root))),{science,terrainEvidence:JSON.parse(readFileSync(new URL('data/science/terrain-acceptance-evidence.json',root)))}),cases=[];
for(const site of w.availableSites()){
 w.setSite(site.id);const p=w.provider('A'),scenario=w.state.scenarios.A,requirements={...w.state.requirements},t=performance.now(),study=scanStartWindows(scenario,requirements,p),elapsedMs=performance.now()-t;
 let directChecks=0;
 for(let i=0;i<study.tested;i+=277){const time=study.coverageWindows[0][0]+i*STEP,r=evaluate({...scenario,date:new Date(time).toISOString(),offset:0},requirements,p),inside=study.nominalFitWindows.some(range=>time>=Date.parse(range.firstStartUtc)&&time<=Date.parse(range.lastStartUtc));assert.equal(inside,r.status==='uncertain'&&r.nominalStatus==='pass');directChecks++;}
 for(const range of study.nominalFitWindows)for(const time of [range.firstStartUtc,range.lastStartUtc]){assert.equal(verifyStartSelection(study,time,scenario,requirements,p).result.status,'uncertain');directChecks++;}
 assert.equal(study.tested,11953);assert.equal(study.unknown,0);assert.equal(study.unqualifiedPasses,0);
 cases.push({site:study.site,requirements,elapsedMs,directChecks,tested:study.tested,nominalFits:study.nominalFits,failed:study.failed,unknown:study.unknown,unsupportedStarts:study.unsupportedStarts,coverageWindows:study.coverageWindows,nominalFitWindows:study.nominalFitWindows,provenance:study.provenance});
}
const result={recordedUtc:new Date().toISOString(),model:startWindowVersion,applicationModel:w.serialize().model,dataset:{version:science.version,sha256:createHash('sha256').update(bytes).digest('hex'),terrainEvidenceSha256:createHash('sha256').update(readFileSync(new URL('data/science/terrain-acceptance-evidence.json',root))).digest('hex')},environment:{kind:'Local Node compute; not a browser/GPU measurement',node:process.version,cpu:os.cpus()[0].model},cases,limits:['Checks the loaded January-March 2027 study-point records at ten-minute UTC starts; does not sample all years or prove intervening starts','Direct comparisons reuse the declared evaluator and are software parity checks, not independent scientific truth','Nominal fits retain terrain/uncertainty qualifications; no operational feasibility or browser pass is inferred']};
writeFileSync(new URL('docs/START_WINDOW_VALIDATION.json',root),JSON.stringify(result,null,2));
console.log(JSON.stringify(cases.map(({site,tested,nominalFits,failed,unknown,elapsedMs,directChecks})=>({site:site.id,tested,nominalFits,failed,unknown,elapsedMs,directChecks})),null,2));
