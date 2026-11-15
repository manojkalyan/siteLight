import {evaluate,startTime} from './engine.mjs';
import {escapeHtml as esc} from './charts.mjs';
export function calendarContent({workspace,provider,scenarioButtons,modeNotice,statusText,serviceAvailable,monthlySection='',startSection='',compact=false}){
 const {state}=workspace,s=state.scenarios[state.active];
 const entries=Array.from({length:29},(_,i)=>{
  const offset=s.offset+i-14,scenario={...s,offset},allowed=workspace.canPreview(offset),a=startTime(scenario),b=a+state.requirements.duration*3600000;
  if(!allowed)return {offset,scenario,allowed,status:'outside'};
  if(state.mode==='real'&&serviceAvailable&&!provider.covers(a,b))return {offset,scenario,allowed,status:'loadable'};
  const result=evaluate(scenario,state.requirements,provider);return {offset,scenario,allowed,result,status:result.status};
 });
 const label=e=>e.status==='outside'?'Outside supported range':e.status==='loadable'?'Load real records':e.status==='pass'?'Criteria met':e.status==='fail'?'Criteria unmet':e.status==='uncertain'?'Nominal fit · uncertain':'Data check required';
 const header=`<p class="eyebrow">Explore schedule flexibility</p><h1>A window of possibilities.</h1><p class="page-intro">Daily starts, 14 days either side of the current preview. Every enabled date uses the same ${state.requirements.duration}-hour interval and requirements.</p>${scenarioButtons()}`;
 return `${compact?'':header}${startSection}${monthlySection}<div class="notice">${esc(modeNotice())} ${serviceAvailable&&state.mode==='real'?'New date selections load actual SPICE records before applying.':'Dates outside the loaded records are disabled.'}</div><div class="calendar">${entries.map(e=>`<button class="${e.status} ${e.offset===s.offset?'selected':''}" data-calendar="${e.offset}" ${e.allowed?'':'disabled'} aria-label="${esc(label(e))}: ${new Date(startTime(e.scenario)).toISOString()}"><strong>${new Date(startTime(e.scenario)).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}</strong><small>${label(e)}</small></button>`).join('')}</div><p class="external-note">Daily sampling does not prove the intervening times are feasible. Disabled cells cannot replace a covered scenario with an unassessed request.</p>`;
}
