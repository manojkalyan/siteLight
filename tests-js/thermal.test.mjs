import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {parseThermalRow,thermalDistanceM} from '../src/workspace/thermal.mjs';
import {thermalMarkup} from '../src/workspace/thermal-view.mjs';
import {sensitivityMarkup} from '../src/workspace/sensitivity-view.mjs';
import {createWorkspace} from '../src/workspace/store.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const science=JSON.parse(read('data/science/real-workspace.json')),reference=JSON.parse(read('data/horizons/workspace-ephemeris.json'));
test('Diviner parsing preserves Kelvin and rejects documented missing constants or absent fields',()=>{
 assert.equal(parseThermalRow('0.01,0.02,-137,-89,140.792358').kelvin,140.792358);
 for(const row of ['0,0,10,-89,-9999','0,0,10,-89,-9998','0,0,10,-89,0',',0,10,-89,120','x,y,lon,lat,temp'])assert.equal(parseThermalRow(row),null);
 assert.equal(thermalDistanceM({lat:-90,lon:0},{lat:-90,lon:180})<1e-8,true);
 assert.ok(Math.abs(thermalDistanceM({lat:0,lon:0},{lat:0,lon:1})-1737400*Math.PI/180)<1e-8);
});
test('real thermal context matches pinned records, local-time periods, and explicit spatial limits',()=>{
 const context=JSON.parse(read('data/science/thermal-context.json'));
 assert.equal(context.algorithm.sha256,createHash('sha256').update(read('scripts/acquire-thermal.mjs')).digest('hex'));
 let valid=0,missing=0;
 for(const e of Object.values(science.sites)){
  assert.deepEqual(e.thermalContext,context.sites[e.site.id]);assert.equal(e.thermalContext.length,2);
  assert.deepEqual(e.thermalContext.map(b=>b.localTimeHours),[[0,.25],[12,12.25]]);
  for(const b of e.thermalContext){assert.equal(b.unit,'K');assert.equal(b.pixelSpacingM,240);assert.equal(b.observationPeriod.start.slice(0,10),'2009-07-05');
   if(b.match){valid++;assert.deepEqual(parseThermalRow(b.match.rawLine),Object.fromEntries(['x','y','lon','lat','kelvin'].map(k=>[k,b.match[k]])));assert.ok(b.match.distanceM<=Math.SQRT2*120+2);assert.ok(Math.abs(thermalDistanceM(e.site,b.match)-b.match.distanceM)<1e-8);}
   else{missing++;assert.equal(b.status,'no_matching_bin');assert.equal(b.match,null);}
  }
 }
 assert.equal(valid,8);assert.equal(missing,4);
});
test('reports keep historical context unchanged by mission date and exclude it in reference/sample modes',()=>{
 const w=createWorkspace(reference,{science}),before=w.serialize();assert.equal(before.thermal,'historical_context');
 w.setOffset(1);assert.deepEqual(w.serialize().scenarios.A.thermalContext,before.scenarios.A.thermalContext);
 w.setMode('sample');const sample=w.serialize();assert.equal(sample.thermal,'not_evaluated');assert.equal(sample.scenarios.A.thermalContext,null);assert.equal(sample.logistics,'not_evaluated');
});
test('temperature view renders local time, source offsets and missing bins without inventing daily extremes',()=>{
 const {document}=parseHTML(thermalMarkup(science.sites['real-connector']));
 const text=document.documentElement.textContent;assert.match(text,/140.8 K/);assert.match(text,/No matching observation/);assert.match(text,/00:00–00:15 local time/);assert.match(text,/12:00–12:15 local time/);assert.match(text,/not a daily minimum\/maximum or mission forecast/);
 assert.match(thermalMarkup(null),/Not evaluated/);
 assert.match(sensitivityMarkup({sensitivity:{fractions:null}}),/no full-window sensitivity range/);
});
