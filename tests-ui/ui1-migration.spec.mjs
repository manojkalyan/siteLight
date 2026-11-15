import {test,expect,open,snapshot,idle} from './fixtures.mjs';

test('settings A/B and background toggles work while open and keep uncommitted drafts separate',async({page})=>{
 await page.setViewportSize({width:1586,height:992});await open(page);const before=await snapshot(page);await page.getByRole('button',{name:'Open mission settings',exact:true}).click();
 await page.locator('#settings-minSun').fill('55');await page.locator('#settings-date').fill('2027-01-20T00:00');await page.getByRole('button',{name:'Edit scenario B',exact:true}).click();await expect(page.locator('#settings-site')).toHaveValue('real-nobile');
 await page.getByRole('button',{name:'Edit scenario A',exact:true}).click();await expect(page.locator('#settings-minSun')).toHaveValue('55');await expect(page.locator('#settings-date')).toHaveValue('2027-01-20T00:00');
 await page.getByRole('button',{name:'Moon',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-rendered-scene','moon');await expect(page.locator('#mission-settings')).toBeVisible();await expect(page.getByRole('button',{name:'Moon',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Terrain',exact:true}).click();await expect(page.locator('#viewport canvas')).toHaveAttribute('data-terrain-presentation','cinematic');await expect(page.locator('#terrain-scope-label')).toContainText('schematic');
 await page.getByRole('button',{name:'Source DEM',exact:true}).click();await expect(page.locator('#viewport canvas')).toHaveAttribute('data-terrain-presentation','measured');
 await page.getByRole('button',{name:'Cinematic',exact:true}).click();await expect(page.locator('#viewport canvas')).toHaveAttribute('data-terrain-presentation','cinematic');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();expect((await snapshot(page)).scenarios).toEqual(before.scenarios);expect((await snapshot(page)).requirements).toEqual(before.requirements);
});

test('applying a selected B draft preserves the independent A inputs',async({page})=>{
 await open(page);const before=await snapshot(page);await page.getByRole('button',{name:'Open mission settings',exact:true}).click();await page.getByRole('button',{name:'Edit scenario B',exact:true}).click();await page.locator('#settings-date').fill('2027-01-20T00:00');await page.getByRole('button',{name:'Apply settings',exact:true}).click();await idle(page);
 const after=await snapshot(page);expect(after.scenarios.A).toEqual(before.scenarios.A);expect(after.scenarios.B.baselineUtc).toBe('2027-01-20T00:00:00Z');await expect(page.locator('#mission-settings')).not.toBeVisible();
});

test('terrain scene fills behind the dock and keeps a working Moon overview without changing results',async({page})=>{
 await page.setViewportSize({width:1586,height:992});await open(page);const before=await snapshot(page);
 await page.getByRole('button',{name:'Terrain',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-rendered-scene','terrain');
 await expect(page.locator('#terrain-preview.moon-overview img')).toBeVisible();
 const scene=await page.locator('#viewport').boundingBox();expect(scene.y).toBe(0);expect(scene.height).toBe(992);
 await page.getByRole('button',{name:'Open mission settings',exact:true}).click();
 await page.evaluate(()=>new Promise(resolve=>{let n=0;function f(){if(++n===40)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);}));
 await page.screenshot({path:'docs/review/mission-settings/continuous-terrain.png',animations:'disabled'});
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Show Moon overview',exact:true}).click();
 await expect(page.locator('body')).toHaveAttribute('data-rendered-scene','moon');expect((await snapshot(page)).scenarios).toEqual(before.scenarios);
});

test('settings sheet stays beside Mission and above playback at laptop and zoomed viewport sizes',async({page})=>{
 for(const [width,height] of [[1586,992],[1920,900],[1480,720],[1280,720],[1120,630]]){
  await page.setViewportSize({width,height});await open(page);const before=await snapshot(page),scene=await page.evaluate(()=>window.SiteLightWorkspace.state.scene);
  await page.getByRole('button',{name:'Open mission settings',exact:true}).click();
  const boxes=await page.evaluate(()=>Object.fromEntries(['#mission-settings','#mission-panel','.timeline','#mission-settings .dialog-actions'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return [s,{left:r.left,right:r.right,top:r.top,bottom:r.bottom,scroll:e.scrollHeight,client:e.clientHeight}];})));
  expect(boxes['#mission-settings'].left).toBeGreaterThan(boxes['#mission-panel'].right+10);
  expect(boxes['#mission-settings'].bottom).toBeLessThan(boxes['.timeline'].top);
  expect(boxes['#mission-settings .dialog-actions'].bottom).toBeLessThanOrEqual(boxes['#mission-settings'].bottom+1);
  await expect(page.locator('#settings-heading')).toBeVisible();await expect(page.getByRole('button',{name:'Apply settings',exact:true})).toBeInViewport();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();expect((await snapshot(page)).scenarios).toEqual(before.scenarios);expect(await page.evaluate(()=>window.SiteLightWorkspace.state.scene)).toBe(scene);
 }
});
test('reference Explore composition keeps the Moon, open horizon and panels separated at desktop sizes',async({page})=>{
 for(const [width,height] of [[1586,992],[1920,900]]){
  await page.setViewportSize({width,height});await open(page);const before=await snapshot(page);await page.locator('#mission-panel [data-select="B"]').click();
  await expect(page.locator('#horizon-drawer')).toHaveAttribute('open','');await expect(page.locator('#compare-strip')).toBeHidden();await expect(page.locator('#result-panel')).toContainText('Nobile rim');
  await expect(page.locator('#terrain-preview img')).toBeVisible();
  const boxes=await page.evaluate(()=>Object.fromEntries(['mission-panel','result-panel','horizon-drawer','viewport'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [id,{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}];})));
  expect(boxes['mission-panel'].right).toBeLessThan(boxes['result-panel'].left);expect(boxes['mission-panel'].bottom).toBeLessThan(boxes['horizon-drawer'].top);expect(boxes.viewport.bottom).toBeLessThanOrEqual(boxes['horizon-drawer'].top);expect(boxes['horizon-drawer'].width).toBeGreaterThan(width*.7);
  expect((await snapshot(page)).scenarios).toEqual(before.scenarios);
 }
});
test('mission settings are a cancelable draft and apply atomically to the live model',async({page})=>{
 await open(page);const before=await snapshot(page);await page.getByRole('button',{name:'Open mission settings'}).click();
 await page.locator('#settings-minSun').fill('88');await page.locator('#settings-date').fill('2027-01-20T00:00');expect((await snapshot(page)).requirements).toEqual(before.requirements);
 await page.locator('[data-settings-range="minSun"]').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await expect(page.locator('#settings-minSun')).toHaveValue('1');
 await page.locator('[data-settings-mode="sample"]').click();await expect(page.locator('#settings-mode')).toHaveValue('sample');expect((await snapshot(page)).scenarios).toEqual(before.scenarios);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();expect((await snapshot(page)).scenarios).toEqual(before.scenarios);expect((await snapshot(page)).requirements).toEqual(before.requirements);
 await page.getByRole('button',{name:'Open mission settings'}).click();await expect(page.locator('#settings-maxDark')).toBeDisabled();await page.locator('#settings-minSun').fill('50');await page.getByRole('button',{name:'Apply settings',exact:true}).click();await idle(page);
 await expect(page.locator('#mission-settings')).not.toBeVisible();const after=await snapshot(page);expect(after.requirements.minSun).toBe(.5);expect(after.scenarios.A.site).toEqual(before.scenarios.A.site);expect(after.scenarios.B.site).toEqual(before.scenarios.B.site);expect(after.scenarios.A.baselineUtc).toBe(before.scenarios.A.baselineUtc);
});
test('visible screening tabs skip deferred buttons while all seven sections retain the renderer and scenario',async({page})=>{
 await open(page);const before=await snapshot(page);await page.evaluate(()=>window.__ui1Canvas=document.querySelector('#viewport canvas'));
 for(const section of ['Terrain','Seismic','Thermal & dust','Logistics','Terrain']){await page.getByRole('tab',{name:'Screening',exact:true}).click();await page.getByRole('tab',{name:section,exact:true}).click();await expect(page.locator('#content-screening h1')).toBeVisible();expect(await page.locator('canvas').count()).toBe(1);}
 await expect(page.locator('#screening-navigation [role=tab]:visible')).toHaveText(['Terrain','Seismic','Thermal & dust','Logistics']);
 await page.locator('#screen-thermal').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#screen-logistics')).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.locator('#screen-terrain')).toBeFocused();
 for(const section of ['plume','radiation','rescue']){await expect(page.locator('#screen-'+section)).toBeHidden();await page.evaluate(id=>window.SiteLightWorkspace.setScreening(id),section);await expect(page.locator('#content-screening h1')).toBeVisible();expect(await page.locator('canvas').count()).toBe(1);}
 await page.getByRole('tab',{name:'Explore',exact:true}).click();expect(await page.evaluate(()=>document.querySelector('#viewport canvas')===window.__ui1Canvas)).toBe(true);expect((await snapshot(page)).scenarios).toEqual(before.scenarios);
});
test('changed footprint computes the actual 100-member ensemble and exports only applicable settings',async({page})=>{
 await open(page);const environment=(await snapshot(page)).scenarios.A.result;await page.getByRole('tab',{name:'Screening',exact:true}).click();
 for(const [key,value] of [['radius','150'],['baseline','30'],['limit','10']]){await page.locator(`[data-terrain-setting="${key}"]`).fill(value);await page.locator(`[data-terrain-setting="${key}"]`).press('Tab');await idle(page);}
 expect((await snapshot(page)).terrainEnsembleStudy).toBeNull();await page.getByText('Current footprint & sampled route',{exact:true}).click();await page.locator('[data-action="ensemble-study"]').click();await idle(page);const report=await snapshot(page),study=report.terrainEnsembleStudy;
 expect(study.members).toBe(100);expect(study.settings).toEqual({radiusM:150,baselineM:30,slopeLimitDeg:10});expect(study.acceptedForVerdict).toBe(false);expect(study.source.retainedWindowHashes).toHaveLength(100);expect(report.scenarios.A.result).toEqual(environment);await expect(page.locator('#ensemble-study')).toContainText('150 m radius');
 await page.locator('[data-terrain-setting="radius"]').fill('160');await page.locator('[data-terrain-setting="radius"]').press('Tab');expect((await snapshot(page)).terrainEnsembleStudy).toBeNull();
});
test('the actual footprint radius and layer controls update the sourced 3D overlay',async({page})=>{
 await open(page);await page.getByRole('tab',{name:'Screening',exact:true}).click();await page.locator('[data-terrain-setting="radius"]').fill('150');await page.locator('[data-terrain-setting="radius"]').press('Tab');
 await expect(page.locator('#viewport canvas')).toHaveAttribute('data-footprint-radius-m','150');await page.locator('#content-screening [data-overlay="slope"]').check();await expect(page.locator('#viewport canvas')).toHaveAttribute('data-slope-cells',/^[1-9]\d*$/);
});
test('source search and evidence subviews use real records and keep open acceptance gates explicit',async({page})=>{
 await open(page);const before=(await snapshot(page)).scenarios;await page.getByRole('tab',{name:'Evidence',exact:true}).click();await page.locator('[data-evidence-query]').fill('DE421');await expect(page.locator('.source-list')).toContainText(/de421/i);await expect(page.locator('.source-inspector')).toBeVisible();
 await page.locator('[data-evidence-query]').fill('<script>bad</script>');await expect(page.locator('#content-data script')).toHaveCount(0);
 await page.getByRole('tab',{name:'Validation',exact:true}).click();await expect(page.locator('#content-data')).toContainText('Recorded baseline verification');await page.getByRole('tab',{name:'Limits',exact:true}).click();await expect(page.locator('#content-data')).toContainText('Remaining physical acceptance gates');expect((await snapshot(page)).scenarios).toEqual(before);
});
