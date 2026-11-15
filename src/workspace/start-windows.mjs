import {STEP,HOUR,validateRequirements,visibilityRecord,evaluate} from './engine.mjs';
import {escapeHtml as esc} from './charts.mjs';
export const startWindowVersion='loaded-ten-minute-starts-1';
const utc=t=>new Date(t).toISOString();
const targetStart=Date.UTC(2027,0,1),targetEnd=Date.UTC(2034,0,1);
export const loadedWindows=p=>(p.timeCoverage||[p.coverage]).filter(w=>Array.isArray(w)&&w.length===2&&w.every(Number.isFinite)&&w[1]>w[0]).map(([a,b])=>[Math.max(a,targetStart),Math.min(b,targetEnd)]).filter(([a,b])=>b>a);
export const startStudyKey=(state,p)=>JSON.stringify([state.mode,state.scenarios[state.active].site,state.requirements,loadedWindows(p),p.metadata||[]]);
// Queries must advance monotonically; whole interior runs use a monotone deque.
export function longestGapQuery(flags){
 const n=flags.length,forward=new Int32Array(n+1),runStart=new Int32Array(n),runs=[];
 for(let i=n-1;i>=0;i--)forward[i]=flags[i]===false?forward[i+1]+1:0;
 for(let i=0;i<n;i++){runStart[i]=flags[i]===false&&i&&flags[i-1]===false?runStart[i-1]:i;if(flags[i]===false&&(i===n-1||flags[i+1]!==false))runs.push({start:runStart[i],end:i+1,length:i+1-runStart[i]});}
 const queue=[];let head=0,ptr=0,last=-1;
 return (start,width)=>{
  if(start<last)throw Error('Gap scan queries must advance.');last=start;const end=start+width;
  while(ptr<runs.length&&runs[ptr].end<=end){const run=runs[ptr++];while(queue.length>head&&queue.at(-1).length<=run.length)queue.pop();queue.push(run);}
  while(head<queue.length&&queue[head].start<start)head++;
  const tail=Math.ceil(end)-1,tailLength=flags[tail]===false?end-Math.max(start,runStart[tail]):0;
  return Math.max(head<queue.length?queue[head].length:0,Math.min(width,forward[start]),tailLength)*STEP/HOUR;
 };
}
function mergedSamplingWindows(windows){const out=[];for(const [a,b] of [...windows].sort((x,y)=>x[0]-y[0])){const last=out.at(-1);if(last&&a<=last[1])last[1]=Math.max(last[1],b);else out.push([a,b]);}return out;}
function prefix(flags){const p=new Float64Array(flags.length+1);for(let i=0;i<flags.length;i++)p[i+1]=p[i]+(flags[i]===true?1:0);return p;}
function hours(p,flags,i,whole,remainder){return (p[i+whole]-p[i])*STEP/HOUR+(remainder?Number(flags[i+whole]===true)*remainder/HOUR:0);}
export function scanStartWindows(scenario,requirements,provider){
 validateRequirements(requirements);const coverage=loadedWindows(provider),segments=mergedSamplingWindows(coverage),durationMs=requirements.duration*HOUR,width=durationMs/STEP,whole=Math.floor(width),remainder=durationMs-whole*STEP;
 const count=segments.reduce((n,[a,b])=>n+Math.max(0,Math.ceil((b-Math.ceil(a/STEP)*STEP)/STEP)),0);
 if(count>400000)throw Error('This scan exceeds the supported 400000 source-bin limit.');
 const study={model:startWindowVersion,classification:provider.classification||provider.label||'Declared provider',site:{...scenario.site},requirements:{...requirements},stepMinutes:10,durationHours:requirements.duration,
  coverageWindows:coverage,sourceBins:0,tested:0,nominalFits:0,failed:0,unknown:0,unsupportedStarts:0,unqualifiedPasses:0,nominalFitWindows:[],unknownStartRanges:[],
  provenance:{sources:structuredClone(provider.metadata||[]),horizon:provider.horizonDescription||null,acceptance:provider.acceptance||null},
  meaning:'All supported UTC ten-minute grid starts in currently loaded coverage. Consecutive sampled starts do not prove intervening starts, absolute terrain accuracy or operational feasibility.'};
 if(!coverage.length)return {...study,status:'not_evaluated',reason:'No finite loaded date coverage in this mode. Choose real or JPL reference data.'};
 for(const [rawStart,end] of segments){
  const start=Math.ceil(rawStart/STEP)*STEP,n=Math.max(0,Math.ceil((end-start)/STEP));
  if(end-start<durationMs)continue;
  const flags={sun:[],earth:[],overlap:[],lit:[],known:[]};
  for(let j=0;j<n;j++){const r=visibilityRecord(start+j*STEP,requirements,provider);flags.sun.push(r.eligible);flags.earth.push(r.earth);flags.overlap.push(r.overlap);flags.lit.push(r.lit);flags.known.push(r.eligible!==null);}
  study.sourceBins+=n;const sums=Object.fromEntries(['sun','earth','overlap','known'].map(k=>[k,prefix(flags[k])])),dark=longestGapQuery(flags.lit),earthGap=longestGapQuery(flags.earth);
  let active=null;
  for(let i=0;start+i*STEP+durationMs<=end;i++){
   const time=start+i*STEP,longest={dark:dark(i,width),earth:earthGap(i,width)};
   if(!provider.covers(time,time+durationMs)){study.unsupportedStarts++;active=null;continue;}
   const values=Object.fromEntries(Object.entries(sums).map(([k,p])=>[k,hours(p,flags[k],i,whole,remainder)])),complete=Math.abs(values.known-requirements.duration)<1e-7;
   const fit=['sun','earth','overlap'].every(k=>values[k]+1e-8>=requirements['min'+k[0].toUpperCase()+k.slice(1)]*requirements.duration)&&(requirements.maxDark===null||longest.dark<=requirements.maxDark+1e-8)&&(requirements.maxEarth===null||longest.earth<=requirements.maxEarth+1e-8);
   const status=!complete?'insufficient_data':fit?(provider.qualifyPassAsUncertain?'uncertain':'pass'):'fail';
   study.tested++;if(!complete)study.unknown++;else if(fit){study.nominalFits++;if(status==='pass')study.unqualifiedPasses++;}else study.failed++;
   if(!complete||fit){
    if(!active||active.status!==status||Date.parse(active.lastStartUtc)+STEP!==time){active={status,firstStartUtc:utc(time),lastStartUtc:utc(time),gridStarts:0,firstResult:{status,nominalStatus:fit?'pass':'fail',fractions:complete?Object.fromEntries(['sun','earth','overlap'].map(k=>[k,values[k]/requirements.duration])):null,longest,start:time,end:time+durationMs}};(complete?study.nominalFitWindows:study.unknownStartRanges).push(active);}
    active.lastStartUtc=utc(time);active.gridStarts++;
   }else active=null;
  }
 }
 return {...study,status:'evaluated',reason:study.tested?'':'No loaded interval is long enough for this mission duration.'};
}
export function verifyStartSelection(study,utcStart,scenario,requirements,provider){
 const time=Date.parse(utcStart);
 if(!Number.isFinite(time)||!study||study.site.id!==scenario.site.id||!['lat','lon','altKm'].every(k=>study.site[k]===scenario.site[k])||JSON.stringify(study.requirements)!==JSON.stringify(requirements)||!study.nominalFitWindows.some(w=>time>=Date.parse(w.firstStartUtc)&&time<=Date.parse(w.lastStartUtc)&&(time-Date.parse(w.firstStartUtc))%STEP===0))throw Error('This start is not in the current tested nominal-fit windows.');
 const candidate={...scenario,date:utc(time),offset:0},result=evaluate(candidate,requirements,provider);
 if(result.status!=='pass'&&!(result.status==='uncertain'&&result.nominalStatus==='pass'))throw Error('The selected start no longer meets the enabled nominal requirements. Run the scan again.');
 return {candidate,result};
}
export function startWindowReportMarkup(study){
 if(!study)return '';
 return `<section class="card section-gap" id="start-window-report"><h2>Loaded-record landing-start study</h2><p>${study.tested} tested ten-minute starts; ${study.nominalFits} nominal fits in ${study.nominalFitWindows.length} grouped windows; ${study.failed} failed; ${study.unknown} unknown. ${study.unsupportedStarts} unsupported starts excluded.</p><p>${esc(study.reason||study.meaning)}</p><ul>${study.nominalFitWindows.slice(0,50).map(w=>`<li>${w.firstStartUtc} through ${w.lastStartUtc} UTC (last inclusive): ${w.gridStarts} starts, ${esc(w.status)}.</li>`).join('')}</ul><p>JSON retains all windows, requirements, source metadata and loaded coverage. Sampling does not prove intervening starts or operational feasibility.</p></section>`;
}
export function startWindowMarkup(study,canRun){return `<section class="card section-gap" id="start-window-study"><h2>Landing-start windows in loaded records</h2><p>Scan every UTC ten-minute start with a complete mission interval. Sun, Earth, overlap and enabled outage limits use the same visibility rules.</p><button data-action="start-window-scan" ${canRun?'':'disabled'}>Scan loaded ten-minute starts</button>${!canRun?'<p class="field-note">Use loaded real or JPL records. The scan does not fetch or invent missing geometry.</p>':''}${study?`<p>${study.tested.toLocaleString()} tested starts · ${study.nominalFits.toLocaleString()} nominal fits · ${study.failed.toLocaleString()} failed · ${study.unknown.toLocaleString()} unknown. ${study.unsupportedStarts} starts outside a single supported coverage window were excluded.</p><p>${esc(study.reason||'Each row groups consecutive nominally fitting grid starts; the last listed start is inclusive.')}</p><div class="scroll-table" tabindex="0" role="region" aria-label="Tested landing-start windows; scroll horizontally to view all columns"><table class="evidence-table"><thead><tr><th>First tested start (UTC)</th><th>Last tested start (UTC, inclusive)</th><th>Starts</th><th>Apply after recheck</th></tr></thead><tbody>${study.nominalFitWindows.slice(0,50).map(w=>`<tr><td>${w.firstStartUtc}</td><td>${w.lastStartUtc}</td><td>${w.gridStarts} · ${w.status==='uncertain'?'uncertain':'model fit'}</td><td><button data-start-window="${w.firstStartUtc}">First</button><button data-start-window="${w.lastStartUtc}">Last</button></td></tr>`).join('')}</tbody></table></div>${study.nominalFitWindows.length>50?'<p>First 50 windows shown; JSON retains the full study.</p>':''}<p class="external-note">${esc(study.meaning)} Selecting a boundary re-evaluates it with the complete evaluator before applying.</p>`:''}</section>`;}
