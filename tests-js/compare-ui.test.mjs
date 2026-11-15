import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';import {compareMarkup,compareInputKey,availabilityStrip} from '../src/workspace/compare-ui.mjs';
const state={mode:'real',active:'A',scenarios:{A:{site:{name:'Shackleton',id:'a'},date:'2027-01-13T00:00:00Z',offset:0},B:{site:{name:'Nobile',id:'b'},date:'2027-01-13T00:00:00Z',offset:0}},requirements:{duration:168,minSun:.4,minEarth:.3,minOverlap:.2}};
const inputs={state,results:{A:{status:'fail',records:[],rules:[{id:'sun',label:'Solar eligibility',value:0,required:67.2,margin:-67.2,operator:'≥',pass:false}],fractions:{sun:0,earth:0,overlap:0}},B:{status:'uncertain',records:[],rules:[],fractions:{sun:.731,earth:1,overlap:.731}}},providers:{A:{horizon:()=>0,geometry:()=>null},B:{horizon:()=>0,geometry:()=>null}},previewDate:'2027-01-22T00:00',busy:false,error:'',statusText:r=>r.status,explain:()=>'',diagnosticsMarkup:()=>'',proposalMarkup:()=>'',modeNotice:()=>'',bounds:{min:'2027-01-01T00:00',max:'2033-12-20T00:00'}};

test('Compare renders actual requirements/results and rejects stale preview controls',()=>{
 const result={...inputs.results.B},key=compareInputKey(state),preview={key,date:'2027-01-22T00:00:00Z',result};const {document}=parseHTML(compareMarkup({...inputs,preview}));
 assert.match(document.querySelector('[data-compare-metric=sun] td').textContent,/40%/);assert.equal(document.querySelector('[data-compare-metric=sun] [data-result-scenario=B]').textContent,'73.1%');assert.equal(document.querySelector('[data-action=compare-apply]').disabled,false);
 for(const change of [{requirements:{...state.requirements,minSun:.8}},{scenarios:{...state.scenarios,A:{...state.scenarios.A,site:{name:'Other',id:'c'}}}},{active:'B'}]){const stale=parseHTML(compareMarkup({...inputs,state:{...state,...change},preview})).document;assert.equal(stale.querySelector('[data-action=compare-apply]').disabled,true);}
 const unknown=parseHTML(compareMarkup({...inputs,results:{...inputs.results,A:{status:'insufficient_data',records:[],rules:[]}}})).document;assert.equal(unknown.querySelector('[data-result-scenario=A]').textContent,'Unknown');
});

test('Compare availability rows represent separate evaluated mission intervals',()=>{
 const result={start:100,end:200,records:[{time:100,eligible:false},{time:120,eligible:true},{time:150,eligible:false},{time:180,eligible:true}]},before=JSON.stringify(result),{document}=parseHTML(availabilityStrip(result,'#efcb78')),runs=[...document.querySelectorAll('rect[fill="#efcb78"]')];
 assert.equal(runs.length,2);assert.equal(runs[0].getAttribute('x'),'200');assert.equal(runs[0].getAttribute('width'),'300');assert.equal(runs[1].getAttribute('x'),'800');assert.equal(runs[1].getAttribute('width'),'200');assert.equal(JSON.stringify(result),before);assert.match(availabilityStrip(null,'#fff'),/Not evaluated/);
});
