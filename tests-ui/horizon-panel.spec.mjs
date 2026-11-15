import {test,expect,open,snapshot} from './fixtures.mjs';

test('horizon compass, axes, legend and readouts fit at short, large and zoomed widths',async({page})=>{
 await page.setViewportSize({width:1920,height:900});await open(page);const checks=[];
 for(const [width,height] of [[1920,900],[1920,720],[1536,864],[2560,1440],[3840,2160],[1280,720],[390,844]]){
  await page.setViewportSize({width,height});await expect.poll(()=>page.evaluate(()=>{const el=document.querySelector('#horizon-chart svg');return el?Math.abs(el.viewBox.baseVal.width-el.parentElement.clientWidth):Infinity;})).toBeLessThanOrEqual(1);
  const measured=await page.evaluate(()=>{
   const drawer=document.querySelector('#horizon-drawer').getBoundingClientRect(),svg=document.querySelector('#horizon-skyplot svg'),compass=svg.getBoundingClientRect(),chart=document.querySelector('#horizon-chart').getBoundingClientRect();
   const texts=[...document.querySelectorAll('#horizon-skyplot text,.horizon-axis-title,.horizon-legend,#horizon-readouts .readout')].map(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,top:r.top,bottom:r.bottom,left:r.left,right:r.right};});
   return {drawer:{top:drawer.top,bottom:drawer.bottom,left:drawer.left,right:drawer.right},compass:{width:compass.width,height:compass.height},texts,chart:{width:chart.width,height:chart.height},overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect(measured.overflow).toBe(false);expect(Math.abs(measured.compass.width-measured.compass.height)).toBeLessThanOrEqual(1);
  for(const text of measured.texts){expect(text.top,text.text).toBeGreaterThanOrEqual(measured.drawer.top);expect(text.bottom,text.text).toBeLessThanOrEqual(measured.drawer.bottom+1);expect(text.left,text.text).toBeGreaterThanOrEqual(measured.drawer.left);expect(text.right,text.text).toBeLessThanOrEqual(measured.drawer.right+1);}
  checks.push({width,height,...measured});if(width===1920&&height===720)await page.locator('#horizon-drawer').screenshot({path:'docs/review/mission-settings/horizon-short.png',animations:'disabled'});if(width===2560)await page.locator('#horizon-drawer').screenshot({path:'docs/review/mission-settings/horizon-large.png',animations:'disabled'});
 }
 await test.info().attach('horizon sizes and label bounds',{body:JSON.stringify(checks,null,2),contentType:'application/json'});
});

test('horizon playback moves existing markers without rebuilding source paths and collapse remains usable',async({page})=>{
 await page.setViewportSize({width:1920,height:900});await open(page);const before=(await snapshot(page)).scenarios;
 await page.evaluate(()=>{window.__horizonSvg=document.querySelector('#horizon-chart svg');window.__skyplot=document.querySelector('#horizon-skyplot svg');window.__sourcePath=document.querySelector('#horizon-chart polyline');window.__sourceShape=window.__sourcePath.getAttribute('points');});
 const position=await page.locator('#horizon-chart [data-live-body=sun]').getAttribute('cx');
 await page.locator('#time').fill('24');await expect.poll(()=>page.locator('#horizon-chart [data-live-body=sun]').getAttribute('cx')).not.toBe(position);
 expect(await page.evaluate(()=>document.querySelector('#horizon-chart svg')===window.__horizonSvg&&document.querySelector('#horizon-skyplot svg')===window.__skyplot&&document.querySelector('#horizon-chart polyline')===window.__sourcePath&&window.__sourcePath.getAttribute('points')===window.__sourceShape)).toBe(true);
 await page.getByRole('button',{name:'Play timeline',exact:true}).click();await expect(page.getByRole('button',{name:'Pause timeline',exact:true})).toBeVisible();const hour=await page.locator('#time').inputValue();await expect.poll(()=>page.locator('#time').inputValue()).not.toBe(hour);await page.getByRole('button',{name:'Pause timeline',exact:true}).click();
 await page.locator('#horizon-drawer summary').click();await expect(page.locator('#horizon-drawer')).not.toHaveAttribute('open','');await page.getByRole('button',{name:'Toggle horizon drawer'}).click();await expect(page.locator('#horizon-drawer')).toHaveAttribute('open','');await expect(page.locator('#horizon-chart svg')).toBeVisible();
 expect((await snapshot(page)).scenarios).toEqual(before);
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('#horizon-drawer').evaluate(e=>getComputedStyle(e,'::details-content').transitionDuration)).toBe('0s');await page.getByRole('button',{name:'Play timeline',exact:true}).click();expect(await page.evaluate(()=>window.SiteLightWorkspace.state.playing)).toBe(false);
});
