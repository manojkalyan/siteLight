// Record actual public SiteLight interactions. No simulated results or generated footage.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dry=process.argv.includes('--dry');
const appUrl=process.env.SITELIGHT_DEMO_URL||'https://sitelight.vercel.app/';
const work=path.join(root,'.deploy-local/tutorial');await fs.mkdir(work,{recursive:true});
const chapters=[],errors=[];let epoch=0,origin=0;
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,...(!dry?{recordVideo:{dir:work,size:{width:1920,height:1080}}}:{})});
origin=Date.now();const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
const wait=ms=>page.waitForTimeout(ms);
await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SiteLight guided walkthrough</title><style>*{box-sizing:border-box}body{margin:0;background:#05080d;color:#edf3fa;font-family:Arial,sans-serif;display:grid;grid-template-columns:1536px 384px;width:1920px;height:1080px}iframe{width:1536px;height:1080px;border:0;background:#000}aside{border-left:1px solid #35414c;background:linear-gradient(160deg,#162132,#080c13 75%);padding:48px 32px;display:flex;flex-direction:column}header{font-size:25px;letter-spacing:-.5px;font-weight:bold}header small{display:block;font-size:14px;letter-spacing:2px;color:#97abc4;margin-top:12px;font-weight:normal}#number{color:#80bbff;font-size:16px;margin-top:64px;letter-spacing:1px}h1{font-size:33px;line-height:1.2;margin:24px 0 28px;letter-spacing:-.7px}#description{font-size:24px;line-height:1.5;margin:0;color:#d8e1ef}#why{font-size:21px;line-height:1.5;margin-top:36px;padding-left:17px;border-left:3px solid #68aaff;color:#a9ceff}footer{margin-top:auto;font-size:15px;line-height:1.6;color:#91a1b7}#progress{height:3px;background:#354154;margin-top:25px}#progress span{display:block;height:100%;background:#79b4ff;width:0}</style></head><body><iframe title="Actual SiteLight application" src="https://sitelight.vercel.app/"></iframe><aside><header>SiteLight<small>GUIDED WALKTHROUGH</small></header><div id="number">GETTING READY</div><h1 id="title">Lunar sites and mission dates</h1><p id="description">A real application walkthrough with written explanations.</p><p id="why">The demonstration uses NASA-derived records and preserves the app's model limits.</p><footer>Real app interactions<br>Written guidance. No audio.<div id="progress"><span></span></div></footer></aside></body></html>`);
if(appUrl!=='https://sitelight.vercel.app/')await page.locator('iframe').evaluate((el,url)=>el.src=url,appUrl);
const frame=await page.locator('iframe').elementHandle().then(e=>e.contentFrame());
await frame.waitForFunction(()=>window.SiteLightWorkspace);
await frame.evaluate(()=>window.SiteLightWorkspace.whenReady());
await frame.waitForFunction(()=>document.querySelector('#root').getAttribute('aria-busy')==='false');
await frame.evaluate(()=>{
 const pointer=document.createElement('div');pointer.id='tutorial-cursor';pointer.style.cssText='position:fixed;left:-50px;top:-50px;width:17px;height:17px;border:2px solid #fff;border-radius:50%;background:#469fff88;box-shadow:0 0 0 5px #5aa8ff22;pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%)';document.body.append(pointer);
 document.addEventListener('pointermove',e=>{pointer.style.left=e.clientX+'px';pointer.style.top=e.clientY+'px';},true);
 document.addEventListener('pointerdown',()=>{pointer.style.boxShadow='0 0 0 15px #69b0ff66';setTimeout(()=>pointer.style.boxShadow='0 0 0 5px #5aa8ff22',400);},true);
});
async function click(locator){await locator.scrollIntoViewIfNeeded();await locator.hover();await wait(dry?30:400);await locator.click();await wait(dry?80:550);}
async function fill(locator,value){await click(locator);await locator.fill(String(value));await wait(dry?30:550);await locator.press('Tab');}
const tab=name=>frame.getByRole('tab',{name,exact:true});
async function idle(){await frame.evaluate(()=>window.SiteLightWorkspace.whenIdle());}
async function chapter(title,description,use,duration,actions=async()=>{}){
 const index=chapters.length,started=Date.now();
 const entry={title,description,use,start:Number(((started-epoch)/1000).toFixed(3)),end:0};chapters.push(entry);
 await page.evaluate(({index,title,description,use})=>{document.querySelector('#number').textContent='CHAPTER '+String(index+1).padStart(2,'0')+' / 13';document.querySelector('#title').textContent=title;document.querySelector('#description').textContent=description;document.querySelector('#why').textContent=use;document.querySelector('#progress span').style.width=((index+1)/13*100)+'%';},{index,title,description,use});
 console.log((dry?'Rehearsing':'Recording')+' '+(index+1)+': '+title);
 await actions();
 if(!dry)await wait(Math.max(0,duration*1000-(Date.now()-started)));
 entry.end=Number(((Date.now()-epoch)/1000).toFixed(3));
 await page.screenshot({path:path.join(work,`chapter-${String(index+1).padStart(2,'0')}.jpg`),type:'jpeg',quality:86});
}
try{
 await wait(dry?200:1500);epoch=Date.now();
 await chapter('Why SiteLight?','Compare lunar sites and mission dates in one workspace. See sunlight and Earth visibility.','Useful when a schedule changes and you need to reassess a site.',8);
 await chapter('Two independent scenarios','Mission A and B hold separate sites and start times. Begin by selecting B, the Nobile study point.','Use the same requirements to compare choices fairly.',10,async()=>{
  await click(frame.locator('#mission-panel [data-select="B"]'));
  await click(frame.getByRole('button',{name:'Toggle site catalog',exact:true}));
  await wait(dry?100:1300);
  await click(frame.getByRole('button',{name:'Close site catalog',exact:true}));
 });
 await chapter('Set mission requirements','Choose the site, UTC start and duration. Here we require 70% sunlight, 90% Earth visibility and 70% overlap.','Apply settings evaluates the draft before replacing the current result.',22,async()=>{
  await click(frame.getByRole('button',{name:'Open mission settings',exact:true}));
  await click(frame.locator('#settings-site'));await frame.locator('#settings-site').selectOption('real-nobile');await frame.locator('#settings-site').press('Tab');
  await fill(frame.locator('#settings-date'),'2027-01-13T00:00');
  await fill(frame.locator('#settings-duration'),168);
  for(const [id,value] of [['minSun',70],['minEarth',90],['minOverlap',70]])await fill(frame.locator('#settings-'+id),value);
  await click(frame.getByRole('button',{name:'Apply settings',exact:true}));await idle();
 });
 await chapter('Moon and terrain views','Moon shows the wider location. Terrain offers a cinematic view and a separate measured Source DEM.','Use Source DEM for the selected elevation grid. Cinematic landforms are illustrative.',18,async()=>{
  await click(frame.getByRole('button',{name:'Terrain',exact:true}));await wait(dry?100:2200);
  await click(frame.getByRole('button',{name:'Source DEM',exact:true}));await wait(dry?100:2800);
  await click(frame.getByRole('button',{name:'Cinematic',exact:true}));await wait(dry?100:1000);
  await click(frame.getByRole('button',{name:'Moon',exact:true}));
 });
 await chapter('Horizon and time lanes','The horizon plot places the Sun and Earth against surrounding terrain. Scrub time or play the timeline.','The Sun, Earth and Overlap lanes show when the selected conditions are available.',12,async()=>{
  const range=frame.locator('#time');await click(range);await range.press('Home');for(let i=0;i<30;i++)await range.press('ArrowRight');
  await click(frame.locator('#play'));await wait(dry?100:3000);await click(frame.locator('#play'));await range.press('Home');
 });
 await chapter('Compare the actual results','Compare keeps both scenarios under shared requirements. Read the sunlight, Earth and overlap values side by side.','A nominal fit remains uncertain. The explanation identifies conditions below your requirements.',22,async()=>{
  await click(tab('Compare'));await wait(dry?100:2000);
  await click(frame.locator('[data-select="A"]:visible').first());await wait(dry?100:2300);
  await click(frame.locator('[data-select="B"]:visible').first());await wait(dry?100:2300);
  const fractions=await frame.evaluate(()=>({A:window.SiteLightWorkspace.snapshot().scenarios.A.result.fractions,B:window.SiteLightWorkspace.snapshot().scenarios.B.result.fractions}));
  const message=`For this setup: A sunlight ${Math.round(fractions.A.sun*100)}%. B sunlight ${(fractions.B.sun*100).toFixed(1)}%, Earth ${(fractions.B.earth*100).toFixed(0)}%, overlap ${(fractions.B.overlap*100).toFixed(1)}%.`;
  await entryUpdate(message);function entryUpdate(value){chapters.at(-1).use=value;return page.evaluate(t=>document.querySelector('#why').textContent=t,value);}
 });
 await chapter('Test a different start','Schedule scans loaded records for this site and these requirements. Preview a tested start, then apply it.','Preview keeps the baseline unchanged. Apply tested start rechecks it before updating the mission.',14,async()=>{
  await click(tab('Schedule'));await click(frame.locator('[data-action="start-window-scan"]'));await idle();
  await click(frame.locator('[data-schedule-preview]').first());
  await click(frame.locator('[data-action="schedule-apply"]'));await idle();
 });
 await chapter('Inspect the ground','Terrain shows slope, roughness and coverage. Switch to Source DEM for measured elevation.','A footprint or sampled route provides screening evidence. Landing safety needs further assessment.',10,async()=>{
  await click(tab('Screening'));await click(frame.locator('[data-screening-presentation="measured"]'));await wait(dry?100:1800);
 });
 await chapter('Replay Apollo evidence','Seismic adds historical catalogs and real archived impact waveforms. Replay the record and inspect its source.','Normalized waveforms explain historical observations. They do not predict local shaking or future events.',12,async()=>{
  await click(tab('Seismic'));await frame.evaluate(()=>window.SiteLightWorkspace.whenSeismicReady());
  await frame.locator('.seismic-wave-panel').scrollIntoViewIfNeeded();await click(frame.locator('[data-action="seismic-play"]'));await wait(dry?100:2300);await click(frame.locator('[data-action="seismic-play"]'));
 });
 await chapter('Thermal and dust context','View historical Diviner observations. Update sensitivity to explore assumed dust coverage.','Historical data provide context. Dust sensitivity remains an exploratory model.',10,async()=>{
  await click(tab('Thermal & dust'));await click(frame.getByRole('button',{name:'Update sensitivity',exact:true}));
 });
 await chapter('Logistics trade-offs','Explore assumed ice and budget inputs beside a published NASA water-ISRU reference.','Ice and equipment choices are hypothetical. The reference study stays separate.',10,async()=>{await click(tab('Logistics'));});
 await chapter('Trace and export evidence','Evidence links layers to their sources, validation and limits. Export keeps settings, results and qualifications together.','Use JSON for full evidence, CSV for time records, or Print / PDF for a review copy.',16,async()=>{
  await click(tab('Evidence'));await click(frame.getByRole('tab',{name:'Validation',exact:true}));await wait(dry?100:1000);await click(frame.getByRole('tab',{name:'Limits',exact:true}));await wait(dry?100:1000);
  await click(frame.locator('.topbar [data-view="report"]'));await wait(dry?100:1400);
 });
 await chapter('Your next comparison','Start another comparison in Explore. Set your requirements, compare the results and inspect the evidence.','Prepared real records. On-demand science needs a backend. Scientific acceptance remains open.',10,async()=>{
  await click(frame.getByRole('button',{name:'Close report',exact:true}));await click(tab('Explore'));
 });
 if(errors.length)throw Error('Browser errors: '+errors.join('; '));
 const result={schema:'sitelight-tutorial-1',recordedDate:'2026-11-15',appUrl:'https://sitelight.vercel.app/',captureOrigin:appUrl,capture:'Actual Chrome interactions with the production application build; written sidebar guidance; no audio',duration:chapters.at(-1).end,trimStartSeconds:(epoch-origin)/1000,chapters,errors,siDisclosure:'ChatGPT/Codex assisted the script, written explanations and implementation. App observations come from retained NASA/partner sources. This is a real application screen recording, not SI-generated imagery or audio.'};
 await fs.writeFile(path.join(work,dry?'rehearsal.json':'recording.json'),JSON.stringify(result,null,2));
 if(!dry){const v=page.video();await page.close();await context.close();const original=await v.path();await fs.rename(original,path.join(work,'raw.webm'));}
 console.log(JSON.stringify({dry,duration:result.duration,chapters:chapters.length,trimStartSeconds:result.trimStartSeconds}));
}catch(e){await page.screenshot({path:path.join(work,'error.png')});console.error(e);process.exitCode=1;}
finally{await browser.close();}
