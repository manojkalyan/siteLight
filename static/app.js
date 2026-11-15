'use strict';
const el = id => document.getElementById(id);
const endpoint = async (path, options = {}) => {
  const response = await fetch(path, {headers:{'Content-Type':'application/json'}, ...options});
  let data = {}; try { data = await response.json(); } catch {}
  if (!response.ok) {
    const detail = data.detail;
    throw new Error(typeof detail==='string' ? detail : `Request failed (${response.status})`);
  }
  return data;
};
let activeJob = null;
let pollTimer = null;
const setNote = (id, msg, good=null) => { const n=el(id);n.textContent=msg;n.className='resultnote'+(good===true?' good':good===false?' bad':''); };
function setConnected(connected,msg){const b=el('connectionBadge');b.className='status '+(connected?'connected':'failed');b.innerHTML='<span class="dot"></span>';b.append(document.createTextNode(connected?'CopperOS connected':'CopperOS offline'));el('brokerInfo').textContent=msg;}
async function status(){try {const d=await endpoint('/api/copper/status');setConnected(d.connected,d.reason || JSON.stringify(d.broker));}catch(e){setConnected(false,e.message);}}
function copiedTime(candidate){const s = candidate?.revised_landing_utc;
  if(s && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) el('approvedTime').value=s;
  // A date-only source MUST NOT be transformed into an invented UTC time.
}
async function startResearch(){const btn=el('researchBtn');btn.disabled=true;
  try{
    const mission=el('missionName').value.trim(); const url=el('sourceUrl').value.trim();
    const j=await endpoint('/api/evidence/start',{method:'POST',body:JSON.stringify({mission,url})});
    activeJob=j.job_id; el('approvedUrl').value=url;
    setNote('researchStatus','CopperOS task started. Read-only research may take several minutes.');
    if(pollTimer) clearInterval(pollTimer);
    pollTimer=setInterval(()=>pollJob().catch(e=>setNote('researchStatus',e.message,false)),3500);
    await pollJob();
  }catch(e){setNote('researchStatus',e.message,false);btn.disabled=false;}
}
async function pollJob(){if(!activeJob) return;const j=await endpoint(`/api/evidence/${activeJob}`);
  setNote('researchStatus',j.status==='running'?'Research in progress…':j.status==='done'?'Research finished. Review the original page before approving.':(j.error||'Status: '+j.status),j.status==='done'?true:j.status==='error'?false:null);
  if(['done','error','blocked','timeout'].includes(j.status)){
    clearInterval(pollTimer);pollTimer=null;el('researchBtn').disabled=false;
    el('researchRaw').textContent=j.text || j.error || '(No page data returned)';
    if(j.candidate){el('missionName').value=j.candidate.mission_name || el('missionName').value;
      el('approvedUrl').value=j.candidate.source_url || el('approvedUrl').value;
      el('evidenceExcerpt').value=j.candidate.evidence_excerpt || '';
      copiedTime(j.candidate);
      setNote('researchStatus','Agent extracted a candidate. Verify every date against the original website. A calendar date alone is NOT a landing time.',true);
    }
  }
}
async function approve(){const btn=el('approveBtn');btn.disabled=true;
 try{const body={mission:el('missionName').value,source_url:el('approvedUrl').value,
  approved_landing_utc:el('approvedTime').value.trim(),evidence_excerpt:el('evidenceExcerpt').value,
  user_reviewed_original:el('verifiedBox').checked,job_id:activeJob};
  const d=await endpoint('/api/evidence/approve',{method:'POST',body:JSON.stringify(body)});
  el('proposedTime').value=d.approved_landing_utc;
  setNote('approvalStatus','Approved locally at '+d.approved_at+'. The reviewed date has been copied to the proposed-time field. This is NOT independently authenticated source evidence.',true);
 }catch(e){setNote('approvalStatus',e.message,false);}finally{btn.disabled=false;}}
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
function percent(v){return (100*v).toFixed(0)+'%'}
function meter(label,value,isEarth){const box=node('div');box.append(node('small','',label));const bar=node('div','meter'+(isEarth?' earth':''));const fill=node('span');fill.style.width=(value*100)+'%';bar.append(fill);box.append(bar);return box;}
function makeColumn(title,value){const c=node('div','comp-col');c.append(node('small','',title));
  c.append(node('strong','',value.status==='insufficient_data'?'No data':`${percent(value.sun_fraction)} / ${percent(value.earth_fraction)}`));
  if(value.status!=='insufficient_data'){
    c.append(meter('Sunlit fraction',value.sun_fraction,false));c.append(meter('Earth-visible fraction',value.earth_fraction,true));
  }return c;}
function renderCompare(data){const out=el('comparisonCards');out.replaceChildren();
  data.comparisons.forEach(item=>{
    const card=node('section','comp-card');const title=node('div','comp-title');title.append(node('h4','',item.site));
    const state=item.after.status;title.append(node('span','tag '+(state==='pass'?'pass':state==='fail'?'fail':'unknown'),state==='pass'?'CRITERIA MET':state==='fail'?'CRITERIA NOT MET':'INSUFFICIENT DATA'));card.append(title);
    const cols=node('div','comp-cols');cols.append(makeColumn('BEFORE · Sun / Earth',item.before));cols.append(makeColumn('AFTER · Sun / Earth',item.after));card.append(cols);
    card.append(node('div','comp-reason',item.after.reason));
    if(item.first_status_change){const b=item.first_status_change;card.append(node('div','comp-reason','First screened status change: '+b.at_utc+' ('+b.from_status+' → '+b.to_status+')'));}
    if(item.after.timeline?.length){const tracks=node('div','tracks');
      item.after.timeline.slice(0,48).forEach(hour=>{const sq=node('span',(hour.sun?'sun-on ':'')+(hour.earth?'earth-on':''));sq.title=hour.time+' · Sun '+(hour.sun?'yes':'no')+' · Earth '+(hour.earth?'yes':'no');tracks.append(sq);});
      card.append(tracks);
    }
    out.append(card);
  });
  const alts=el('alternatives');alts.replaceChildren();
  if(data.nearby_example_alternatives.length===0) alts.append(node('div','hint','No passing example window found within ±72 hours.'));
  data.nearby_example_alternatives.forEach(a=>{
    const box=node('div','alt');box.append(node('strong','',a.site));
    box.append(node('div','',a.time));box.append(node('div','',`Shift ${a.hours_from_proposed>0?'+':''}${a.hours_from_proposed} h · Sun ${percent(a.sun_fraction)} · Earth ${percent(a.earth_fraction)}`));alts.append(box);
  });
  setNote('compareMessage',`Time shift ${data.shift_hours} hours. Results are calculated only from synthetic training visibility data. Do not use for lunar mission decisions.`,true);
}
async function analyze(){el('analyzeBtn').disabled=true;
  try{const d=await endpoint('/api/mission/compare',{method:'POST',body:JSON.stringify({
     original_landing_utc:el('originalTime').value.trim(),proposed_landing_utc:el('proposedTime').value.trim(),
     duration_hours:Number(el('duration').value), min_sun_fraction:Number(el('sunMin').value),min_earth_fraction:Number(el('earthMin').value)})});
     renderCompare(d);
  }catch(e){setNote('compareMessage',e.message,false);}finally{el('analyzeBtn').disabled=false;}}
function init(){el('checkBtn').addEventListener('click',status);
  el('researchBtn').addEventListener('click',startResearch);
  el('approveBtn').addEventListener('click',approve);
  el('analyzeBtn').addEventListener('click',analyze);
  status();
  endpoint('/api/sample/info').then(d=>el('dataInfo').textContent=`${d.sites.length} simulated sites · ${d.resolution_hours}-hour samples · ${d.start.slice(0,10)} to ${d.end.slice(0,10)}`).catch(()=>{});
  analyze();
}
document.addEventListener('DOMContentLoaded',init);
