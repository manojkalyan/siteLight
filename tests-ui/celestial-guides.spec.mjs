import {test,expect,open,snapshot,idle} from './fixtures.mjs';
import science from '../data/science/real-workspace.json' with {type:'json'};
import {createRealProvider} from '../src/workspace/real-data.mjs';
import {visibilityRecord} from '../src/workspace/engine.mjs';
test('Nobile opens in cinematic terrain with looping playback and a persistent pause control',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1586,height:992});await open(page,{landing:true});
 await expect(page.locator('#mission-panel [data-select=B]')).toHaveAttribute('aria-pressed','true');const before=await snapshot(page);expect(before.scenarios.B.site.id).toBe('real-nobile');expect(before.scenarios.A.site.id).toBe('real-shackleton');
 await expect(page.locator('#viewport canvas')).toHaveAttribute('data-terrain-presentation','cinematic');await expect(page.getByRole('button',{name:'Terrain',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('#play')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#play-hint')).toHaveText('Click to pause');
 const hour=await page.evaluate(()=>window.SiteLightWorkspace.state.hour);await expect.poll(()=>page.evaluate(()=>window.SiteLightWorkspace.state.hour)).toBeGreaterThan(hour);
 await page.locator('#play').click();await expect(page.locator('#play-hint')).toHaveText('Click to play');
 const frozen=await page.evaluate(async()=>{const s=window.SiteLightWorkspace.state,hour=s.hour;await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));return[hour,s.hour];});expect(frozen[1]).toBe(frozen[0]);
 await page.getByRole('tab',{name:'Evidence',exact:true}).click();await page.getByRole('tab',{name:'Explore',exact:true}).click();await expect(page.locator('#play')).toHaveAttribute('aria-pressed','false');
 await page.evaluate(()=>{const app=window.SiteLightWorkspace;app.state.hour=app.state.requirements.duration-.001;app.refresh();});await page.locator('#play').click();await expect.poll(()=>page.evaluate(()=>window.SiteLightWorkspace.state.hour)).toBeLessThan(2);await expect(page.locator('#play')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('tab',{name:'Evidence',exact:true}).click();expect(await page.evaluate(()=>window.SiteLightWorkspace.state.playing)).toBe(false);await page.getByRole('tab',{name:'Explore',exact:true}).click();await expect(page.locator('#play')).toHaveAttribute('aria-pressed','true');
 await page.locator('#time').fill('48');await page.locator('#time').dispatchEvent('input');await expect(page.locator('#play')).toHaveAttribute('aria-pressed','false');expect(await page.evaluate(()=>window.SiteLightWorkspace.state.hour)).toBeCloseTo(48,6);
 const after=await snapshot(page);expect(after.scenarios).toEqual(before.scenarios);expect(after.requirements).toEqual(before.requirements);await page.screenshot({path:'.deploy-local/celestial/default-nobile-playback.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('.timeline').scrollIntoViewIfNeeded();await expect(page.locator('#play-hint')).toBeVisible();await page.screenshot({path:'.deploy-local/celestial/timeline-mobile.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#play-hint')).toHaveText('Motion reduced');await page.locator('#play').click();expect(await page.evaluate(()=>window.SiteLightWorkspace.state.playing)).toBe(false);await expect(page.locator('#toast')).toContainText('Reduced motion');
 await open(page,{landing:true});await expect(page.locator('#play')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#play-hint')).toHaveText('Motion reduced');
});
test('Explore Sun/Earth cues follow real geometry and terrain visibility without editing scenarios',async({page})=>{
 await page.setViewportSize({width:1280,height:900});await open(page);await page.locator('#mission-panel [data-select=B]').click();const before=await snapshot(page);
 await page.getByRole('button',{name:'Terrain',exact:true}).click();const canvas=page.locator('#viewport canvas');await expect(page.locator('.celestial-panel')).toBeVisible();
 await expect(page.locator('#celestial-details')).toBeHidden();await page.getByRole('button',{name:'Sun and Earth details',exact:true}).click();await expect(page.locator('#celestial-details')).toBeVisible();await page.getByRole('button',{name:'Sun and Earth details',exact:true}).click();
 const baseline=Date.parse(before.scenarios.B.baselineUtc);
 const provider=createRealProvider(before.scenarios.B.site,science),records=Array.from({length:1008},(_,i)=>visibilityRecord(baseline+i*600000,before.requirements,provider)),lit=records.find(r=>r.lit===true&&r.eligible===true),dark=records.find(r=>r.lit===false);expect(lit).toBeTruthy();expect(dark).toBeTruthy();
 for(const record of [lit,dark]){
  const hour=(record.time-baseline)/3600000;await page.locator('#time').fill(String(hour));await page.locator('#time').dispatchEvent('input');
  await expect(canvas).toHaveAttribute('data-sun-rays',String(record.lit));await expect(canvas).toHaveAttribute('data-earth-sightline',String(record.earth));
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-sun-direction'))[0]).toBeCloseTo(record.sunAzimuth,4);await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-sun-direction'))[1]).toBeCloseTo(record.sunElevation,4);
 }
 await page.getByRole('button',{name:'Source DEM',exact:true}).click();await expect(canvas).toHaveAttribute('data-sun-rays','false');
 await page.locator('[data-celestial-toggle]').uncheck();await expect(canvas).toHaveAttribute('data-celestial-guides','false');await page.locator('[data-celestial-toggle]').check();await expect(canvas).toHaveAttribute('data-celestial-guides','true');
 const after=await snapshot(page);expect(after.scenarios).toEqual(before.scenarios);expect(after.requirements).toEqual(before.requirements);
 await page.getByRole('tab',{name:'Screening',exact:true}).click();await expect(page.locator('.celestial-panel')).toBeHidden();await expect(canvas).toHaveAttribute('data-celestial-guides','false');
});

test('Shadowed Malapert retains a readable inspection view without inventing sunlight',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1586,height:992});await open(page);await page.locator('#mission-panel [data-select=B]').click();await page.getByRole('button',{name:'Open mission settings',exact:true}).click();
 const site=await page.locator('#settings-site option').filter({hasText:/Malapert/}).getAttribute('value');await page.locator('#settings-site').selectOption(site);await page.getByRole('button',{name:'Apply settings',exact:true}).click();await idle(page);
 const before=await snapshot(page),provider=createRealProvider(before.scenarios.B.site,science),sky=visibilityRecord(Date.parse(before.scenarios.B.baselineUtc),before.requirements,provider);expect(sky.lit).toBe(false);
 await page.getByRole('button',{name:'Terrain',exact:true}).click();const canvas=page.locator('#viewport canvas');await expect(canvas).toHaveAttribute('data-sun-rays','false');await expect(page.locator('.celestial-view-note')).toBeVisible();await expect(page.locator('[data-celestial-brief=sun]')).toHaveText('Blocked by terrain');
 await expect(canvas).toHaveAttribute('data-inspection-lighting','true');await expect.poll(async()=>Number(await canvas.getAttribute('data-inspection-intensity'))).toBeGreaterThan(0);await page.screenshot({path:'.deploy-local/celestial/malapert-inspection-cinematic.png'});
 await page.getByRole('button',{name:'Source DEM',exact:true}).click();await expect(canvas).toHaveAttribute('data-marker-basis','source-dem-center');await expect(canvas).toHaveAttribute('data-sun-rays','false');await page.screenshot({path:'.deploy-local/celestial/malapert-inspection-dem.png'});
 await page.locator('[data-celestial-toggle]').uncheck();await expect(canvas).toHaveAttribute('data-celestial-guides','false');await expect(canvas).toHaveAttribute('data-inspection-lighting','true');await expect.poll(async()=>Number(await canvas.getAttribute('data-inspection-intensity'))).toBeGreaterThan(0);
 const after=await snapshot(page);expect(after.scenarios).toEqual(before.scenarios);expect(after.requirements).toEqual(before.requirements);
 await page.getByRole('button',{name:'Moon',exact:true}).click();await expect(canvas).toHaveAttribute('data-inspection-lighting','false');await expect(page.locator('.moon-site-label b')).toHaveText('Malapert');
});

test('Moon labels show the selected coordinates while credits stay under Scene info',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1586,height:992});await open(page);await page.getByRole('button',{name:'Moon',exact:true}).click();
 const label=page.locator('.moon-site-label'),caption=page.locator('.moon-site-label span');
 for(const id of ['A','B']){await page.locator(`#mission-panel [data-select=${id}]`).click();const state=await snapshot(page),site=state.scenarios[id].site;await expect(caption).toBeVisible();await expect(label).toHaveAttribute('data-site-id',site.id);await expect(caption.locator('small')).toContainText(`${Math.abs(site.lat).toFixed(2)}° S`);await expect(caption.locator('small')).toContainText(`${Math.abs(site.lon).toFixed(2)}° ${site.lon<0?'W':'E'}`);}
 await expect(caption.locator('b')).toHaveText('Nobile rim');await expect(page.locator('#viewport-note')).toBeHidden();
 const clear=()=>caption.evaluate(el=>{const a=el.getBoundingClientRect(),box=document.getElementById('viewport').getBoundingClientRect(),overlap=b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;return a.left>=box.left&&a.right<=box.right&&a.top>=box.top&&a.bottom<=box.bottom&&![...document.querySelectorAll('.mission-panel,.result-panel,.horizon-drawer,.timeline,.scene-controls,.vp-camera,.moon-scene-info[open]>div')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').some(e=>overlap(e.getBoundingClientRect()));});
 for(const [width,height] of [[1920,1080],[1280,900],[467,844],[390,844]]){await page.setViewportSize({width,height});await expect(caption).toBeVisible();await expect.poll(clear).toBe(true);if(width===467)await page.screenshot({path:'.deploy-local/celestial/moon-label-mobile.png'});}
 await expect(page.locator('.moon-scene-info>div')).toBeHidden();await page.locator('.moon-scene-info summary').click();const credit=page.getByRole('link',{name:/NASA SVS · CGI Moon Kit/});await expect(credit).toBeVisible();await expect(credit).toHaveAttribute('href','https://svs.gsfc.nasa.gov/4720/');
 const bounds=await page.locator('.moon-scene-info>div').boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(390);await expect.poll(clear).toBe(true);
 await page.screenshot({path:'.deploy-local/celestial/moon-scene-info.png'});
});

test('Compact sky controls locate Sun and Earth without covering Explore cards',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1900,height:887});await open(page);await page.locator('#mission-panel [data-select=B]').click();
 await page.getByRole('button',{name:'Open mission settings',exact:true}).click();
 const site=await page.locator('#settings-site option').filter({hasText:/Connecting ridge/}).getAttribute('value');await page.locator('#settings-site').selectOption(site);await page.getByRole('button',{name:'Apply settings',exact:true}).click();await idle(page);
 await page.getByRole('button',{name:'Terrain',exact:true}).click();await page.getByRole('button',{name:'Source DEM',exact:true}).click();
 const clear=()=>page.evaluate(()=>{
  const labels=[...document.querySelectorAll('.celestial-direction-label')].filter(e=>!e.hidden),blockers=[...document.querySelectorAll('.mission-panel,.result-panel,.horizon-drawer,.timeline,.celestial-panel')].filter(e=>e.getClientRects().length&&!e.hidden&&getComputedStyle(e).visibility!=='hidden');
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,errors=[];
  for(const [i,label] of labels.entries()){const a=label.getBoundingClientRect();if(a.left<0||a.right>innerWidth||a.top<0||a.bottom>innerHeight)errors.push('outside viewport');for(const el of [...blockers,...labels.slice(0,i)])if(overlap(a,el.getBoundingClientRect()))errors.push(label.className+' overlaps '+el.className);}
  const dock=document.querySelector('.celestial-panel');if(dock.hidden)return ['controls not ready'];const d=dock.getBoundingClientRect();for(const el of blockers)if(el!==dock&&overlap(d,el.getBoundingClientRect()))errors.push('controls overlap '+el.className);
  return errors;
 });
 await expect.poll(clear).toEqual([]);
 for(const body of ['Sun','Earth']){await page.getByRole('button',{name:`Locate ${body} in terrain`,exact:true}).click();await expect(page.locator(`.celestial-direction-label.${body.toLowerCase()}`)).toBeVisible();await expect.poll(clear).toEqual([]);await page.screenshot({path:`.deploy-local/celestial/friendly-${body.toLowerCase()}.png`});}
 for(const [width,height] of [[1586,992],[1280,900],[390,844]]){await page.setViewportSize({width,height});await expect.poll(clear).toEqual([]);for(const body of ['Sun','Earth']){await page.getByRole('button',{name:`Locate ${body} in terrain`,exact:true}).click();await expect(page.locator(`.celestial-direction-label.${body.toLowerCase()}`)).toBeVisible();await expect.poll(clear).toEqual([]);}if(width===390)await page.screenshot({path:'.deploy-local/celestial/friendly-mobile.png'});}
 await page.setViewportSize({width:1900,height:887});await page.getByRole('button',{name:'Cinematic',exact:true}).click();await page.getByRole('button',{name:'Locate Sun in terrain',exact:true}).click();await expect(page.locator('.celestial-direction-label.sun')).toBeVisible();await expect.poll(clear).toEqual([]);await page.screenshot({path:'.deploy-local/celestial/friendly-cinematic.png'});
 const canvas=page.locator('#viewport canvas');for(let i=0;i<4;i++)await canvas.press('ArrowRight');await expect.poll(clear).toEqual([]);
});
