import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {horizonChart,skyplot,updateHorizonMarkers} from '../src/workspace/charts.mjs';
test('live horizon markers match a fresh source plot at the same geometry without replacing paths',()=>{
 const res={records:[]},provider={horizon:()=>5,geometry:t=>t?{sunAzimuth:270,sunElevation:12,earthAzimuth:130,earthElevation:8}:{sunAzimuth:90,sunElevation:10,earthAzimuth:180,earthElevation:20}};
 const {document}=parseHTML(`<main id="current">${horizonChart(res,provider,0,{width:920,height:112})}${skyplot(res,provider,0)}</main><main id="fresh">${horizonChart(res,provider,1,{width:920,height:112})}${skyplot(res,provider,1)}</main>`),chart=document.querySelector('#current .horizon-chart'),polar=document.querySelector('#current .skyplot'),path=chart.querySelector('polyline');
 updateHorizonMarkers(chart,polar,provider.geometry(1));assert.equal(chart.querySelector('polyline'),path);
 for(const kind of ['sun','earth'])for(const type of ['horizon-chart','skyplot']){const a=document.querySelector(`#current .${type} [data-live-body=${kind}]`),b=document.querySelector(`#fresh .${type} [data-live-body=${kind}]`);for(const key of ['cx','cy'])assert.equal(a.getAttribute(key),b.getAttribute(key));}
 updateHorizonMarkers(chart,polar,null);assert.equal(chart.querySelector('[data-live-body=sun]').style.display,'none');
});
