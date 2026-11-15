import {test,expect,open,snapshot,idle,tab,navigate,screening} from './fixtures.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import os from 'node:os';

test('headed Windows Chrome renders Moon and terrain on its reported GPU and records review evidence',async({page,browser},testInfo)=>{
 test.setTimeout(120000);expect(process.platform).toBe('win32');
 const folder=new URL('../docs/review/windows-chrome/',import.meta.url);await mkdir(folder,{recursive:true});
 const capture=async name=>{const path=fileURLToPath(new URL(name+'.png',folder));await page.screenshot({path,fullPage:false,animations:'disabled'});await testInfo.attach(name,{path,contentType:'image/png'});};
 const start=performance.now();await open(page);const readyMs=performance.now()-start;
 const session=await browser.newBrowserCDPSession(),system=await session.send('SystemInfo.getInfo');
 const webgl=await page.evaluate(()=>{const gl=document.querySelector('#viewport canvas')?.getContext('webgl2');if(!gl)return null;const ext=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),version:gl.getParameter(gl.VERSION),contextLost:gl.isContextLost(),attributes:gl.getContextAttributes()};});
 expect(webgl).not.toBeNull();expect(webgl.contextLost).toBe(false);const hardwareObserved=!/swiftshader|llvmpipe|software|basic render|warp/i.test(webgl.renderer);expect(hardwareObserved,'A hardware renderer must be observed for the GPU review').toBe(true);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await capture('desktop-moon');
 await page.getByRole('button',{name:'Terrain',exact:true}).click();await expect(page.locator('#viewport canvas')).toHaveAttribute('data-terrain-presentation','cinematic');await capture('desktop-cinematic');await page.getByRole('button',{name:'Source DEM',exact:true}).click();await expect(page.locator('#scene-data-label')).toContainText('Real NASA DEM');await capture('desktop-terrain');
 const canvas=page.locator('#viewport canvas');await canvas.focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('+');await capture('desktop-terrain-orbit');
 // Sample the actual browser frame loop during the app's live timeline, not a Node compute loop.
 await page.locator('#play').click();
 const frames=await page.evaluate(()=>new Promise(resolve=>{const deltas=[];let previous=performance.now();function frame(now){deltas.push(now-previous);previous=now;if(deltas.length<120)requestAnimationFrame(frame);else{const measured=deltas.slice(10).sort((a,b)=>a-b);resolve({measuredIntervals:measured.length,meanMs:measured.reduce((a,b)=>a+b,0)/measured.length,p95Ms:measured[Math.floor(measured.length*.95)],maxMs:measured.at(-1),meaning:'requestAnimationFrame cadence during timeline playback; not GPU-only render time'});}}requestAnimationFrame(frame);}));
 await page.locator('#play').click();
 // Exercise native WebGL context loss/recovery on the same real renderer.
 await page.evaluate(()=>{const gl=document.querySelector('#viewport canvas').getContext('webgl2');window.__reviewContext=gl;window.__reviewLoss=gl.getExtension('WEBGL_lose_context');if(!window.__reviewLoss)throw Error('Context-loss test extension unavailable');window.__reviewLoss.loseContext();});
 await expect(page.locator('#toast')).toContainText('3D graphics interrupted');
 await page.evaluate(()=>window.__reviewLoss.restoreContext());await page.waitForFunction(()=>!window.__reviewContext.isContextLost());
 await expect(page.locator('#toast')).toContainText('3D graphics restored.');
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await capture('desktop-terrain-recovered');
 await tab(page,'Compare').click();await capture('desktop-compare');
 await page.locator('[data-select="B"]:visible').first().click();await navigate(page,'Schedule');await page.locator('[data-action="start-window-scan"]').click();await idle(page);await capture('desktop-start-windows');
 await expect(page.locator('#toast')).toBeHidden({timeout:10000});
 // Deferred tabs stay hidden; exercise their retained models through the workspace API.
 for(const [name,id] of [['Thermal & dust','dust'],['Plume','plume'],['Radiation','radiation']]){if(id==='dust')await screening(page,name);else await page.evaluate(section=>window.SiteLightWorkspace.setScreening(section),id);await page.locator('[data-'+id+'="enabled"]').check();await page.locator('#'+id+'-planning h2').scrollIntoViewIfNeeded();await capture(id+'-planning');}
 await screening(page,'Terrain');await page.locator('.terrain-evidence-rows>details').first().locator('summary').first().click();await page.locator('#terrain-reference-review h2').scrollIntoViewIfNeeded();await capture('terrain-reference-evidence');await screening(page,'Logistics');await page.locator('#nasa-reference-logistics').scrollIntoViewIfNeeded();await capture('nasa-reference-study');
 await page.setViewportSize({width:1024,height:900});await tab(page,'Layout').click();await capture('tablet-layout');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await capture('mobile-layout');await page.locator('#result-panel').scrollIntoViewIfNeeded();await capture('mobile-comparison');await navigate(page,'Schedule');await page.evaluate(()=>window.scrollTo(0,0));await capture('mobile-start-windows');
 const overflow=await page.evaluate(()=>({viewport:innerWidth,client:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));expect(overflow.document).toBeLessThanOrEqual(overflow.client+1);
 await page.setViewportSize({width:1440,height:1000});await tab(page,'Report').click();await page.emulateMedia({media:'print'});await page.pdf({path:fileURLToPath(new URL('evidence-report.pdf',folder)),format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});
 const evidence={recordedUtc:new Date().toISOString(),platform:process.platform,windowsRelease:os.release(),browser:browser.version(),channel:'chrome',headed:true,viewport:{width:1440,height:1000},launch:'Isolated Playwright test browser, not the user profile',applicationModel:(await snapshot(page)).model,scientificBundle:'dem-de421-4',readyMs,webgl,hardwareObserved,gpu:system.gpu,frames,contextRecovery:'Observed lost event, requested restore, observed non-lost context and captured recovered scene',overflow,reviewStatus:'Screenshots captured; human/model inspection must be recorded separately before calling visual acceptance complete',limits:['One Windows machine and installed Chrome version; not cross-device certification','Local production-preview load includes the automation/readiness wait; not a cold network benchmark','rAF cadence is an observed browser frame loop, not isolated GPU timing','Screenshots and automation do not certify screen-reader usability or scientific/engineering acceptance']};
 await writeFile(new URL('review.json',folder),JSON.stringify(evidence,null,2));await testInfo.attach('Windows Chrome GPU evidence',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
});
