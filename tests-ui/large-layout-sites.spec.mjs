import {test,expect,open,snapshot,idle} from './fixtures.mjs';
import {readFileSync} from 'node:fs';
import {sampleGrid} from '../src/workspace/real-data.mjs';

test('large and zoomed terrain layouts keep Mission, Moon preview and horizon separated',async({page})=>{
 const checks=[];await page.setViewportSize({width:1920,height:900});await open(page);await page.getByRole('button',{name:'Terrain',exact:true}).click();
 for(const [width,height] of [[1920,900],[1920,1080],[2560,1440],[3840,2160],[1536,864],[1480,720]]){
  await page.setViewportSize({width,height});await expect(page.locator('#terrain-preview.moon-overview img')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>{const m=document.getElementById('mission-panel').getBoundingClientRect(),c=document.querySelector('.scene-controls').getBoundingClientRect();return c.top-m.bottom;})).toBeGreaterThanOrEqual(10);
  const boxes=await page.evaluate(()=>Object.fromEntries(['#mission-panel','.scene-controls','#horizon-drawer','.timeline','.scene-thumbnail'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{left:r.left,right:r.right,top:r.top,bottom:r.bottom}];})));
  expect(boxes['.scene-controls'].right+8).toBeLessThanOrEqual(boxes['#horizon-drawer'].left);expect(boxes['.scene-controls'].bottom).toBeLessThan(boxes['.timeline'].top);expect(boxes['.scene-thumbnail'].top).toBeGreaterThan(boxes['#mission-panel'].bottom);
  await expect.poll(()=>page.locator('#viewport canvas').evaluate(c=>c.width*c.height)).toBeLessThanOrEqual(4000000);
  const labels=await page.getByRole('button',{name:'Source DEM',exact:true}).evaluate(e=>({height:e.getBoundingClientRect().height,font:parseFloat(getComputedStyle(e).fontSize)}));expect(labels.height).toBeLessThan(labels.font*2.5);
  checks.push({width,height,boxes});if(width===1920&&height===900)await page.screenshot({path:'docs/review/mission-settings/large-alignment.png',animations:'disabled'});
 }
 await test.info().attach('layout dimensions',{body:JSON.stringify(checks,null,2),contentType:'application/json'});
});

test('all six selected sites drive the source DEM marker, lunar coordinates and cinematic label',async({page})=>{
 const sites=Object.values(JSON.parse(readFileSync(new URL('../data/science/real-workspace.json',import.meta.url),'utf8')).sites);
 await page.setViewportSize({width:1920,height:1080});await open(page);const before=(await snapshot(page)).scenarios.B;await page.getByRole('button',{name:'Terrain',exact:true}).click();await page.getByRole('button',{name:'Source DEM',exact:true}).click();const checks=[];
 for(const entry of sites){
  await page.getByRole('button',{name:'Open mission settings',exact:true}).click();await page.locator('#settings-site').selectOption(entry.site.id);await page.getByRole('button',{name:'Apply settings',exact:true}).click();await idle(page);
  const canvas=page.locator('#viewport canvas');await expect(canvas).toHaveAttribute('data-site-id',entry.site.id);await expect(canvas).toHaveAttribute('data-marker-basis','source-dem-center');await expect(page.locator('.moon-site-label')).toHaveAttribute('data-site-id',entry.site.id);
  await expect(page.locator('.moon-site-label span')).toContainText(entry.site.name.split(' ·')[0]);
  const actual=JSON.parse(await canvas.getAttribute('data-marker-position')),height=(sampleGrid(entry.terrain.grid,'elevationM',0,0)-entry.site.surfaceElevationM+1)/10;
  expect(actual[0]).toBeCloseTo(0,10);expect(actual[1]).toBeCloseTo(height,8);expect(actual[2]).toBeCloseTo(0,10);expect((await snapshot(page)).scenarios.B).toEqual(before);
  await page.getByRole('button',{name:'Moon',exact:true}).click();await expect(canvas).toHaveAttribute('data-marker-basis','lunar-coordinate');const globe=JSON.parse(await canvas.getAttribute('data-marker-position')),lat=Math.atan2(globe[1],Math.hypot(globe[0],globe[2]))*180/Math.PI,lon=Math.atan2(globe[0],globe[2])*180/Math.PI;
  expect(lat).toBeCloseTo(entry.site.lat,8);expect(lon).toBeCloseTo(entry.site.lon,8);expect(Math.hypot(...globe)).toBeCloseTo(9.08,8);checks.push({id:entry.site.id,sourcePosition:actual,lunarPosition:globe,lat,lon});
  await page.getByRole('button',{name:'Terrain',exact:true}).click();
 }
 expect(checks).toHaveLength(6);await page.getByRole('button',{name:'Cinematic',exact:true}).click();await expect(page.locator('#viewport canvas')).toHaveAttribute('data-marker-basis','schematic');await expect(page.locator('#terrain-scope-label')).toContainText('schematic');await test.info().attach('selected-site position checks',{body:JSON.stringify(checks,null,2),contentType:'application/json'});
});
