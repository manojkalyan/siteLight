import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {displaySiteName,terrainPreview,compactExplanation} from '../src/workspace/scene-presentation.mjs';
import {horizonChart} from '../src/workspace/charts.mjs';
test('compact scene explanations retain unknowns and nominal uncertainty rather than assuming a fit',()=>{
 assert.match(compactExplanation({status:'insufficient_data'}),/unavailable/);
 assert.match(compactExplanation({status:'uncertain',nominalStatus:'pass'}),/uncertainty/);
 assert.match(compactExplanation({status:'fail',rules:[{pass:false,label:'Earth visibility'}]}),/Earth visibility/);
 assert.equal(displaySiteName({name:'Nobile · DEM study point'}),'Nobile rim');
});
test('source preview uses the selected DEM and does not fabricate missing coverage',()=>{
 const science=JSON.parse(readFileSync(new URL('../data/science/real-workspace.json',import.meta.url)));
 const entry=science.sites['real-nobile'],before=JSON.stringify(entry.terrain.grid),svg=terrainPreview(entry);
 assert.match(svg,/source DEM preview/);assert.ok(svg.includes('<polygon'));assert.equal(JSON.stringify(entry.terrain.grid),before);assert.match(terrainPreview(null),/No DEM/);
});
test('responsive horizon plots retain real angles and source samples without stretching their view box',()=>{
 const provider={horizon:()=>5,geometry:()=>({sunAzimuth:90,sunElevation:10,earthAzimuth:180,earthElevation:20})};
 const svg=horizonChart({records:[]},provider,0,{width:920,height:140});assert.match(svg,/viewBox="0 0 920 140"/);assert.match(svg,/cx="252.00"/);assert.match(svg,/Sun/);assert.ok(!svg.includes('preserveAspectRatio="none"'));
 const mobile=horizonChart({records:[]},provider,0,{width:196,height:132});assert.match(mobile,/viewBox="0 0 196 132"/);assert.match(mobile,/cx="71.00"/);
});
