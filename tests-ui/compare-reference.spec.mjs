import {test,expect,open,snapshot,idle,tab} from './fixtures.mjs';
const pct=v=>(v*100).toFixed(1).replace(/\.0$/,'')+'%';

test('Compare reference shows live shared thresholds and independent A/B metrics without changing scenarios',async({page})=>{
 await page.setViewportSize({width:1586,height:992});await open(page);const before=await snapshot(page);await tab(page,'Compare').click();
 await expect(page.locator('#content-compare h1')).toHaveText('Compare scenarios');await expect(page.locator('.compare-scenario-card')).toHaveCount(2);await expect.poll(()=>page.locator('.compare-terrain-image').first().evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('blob:');await expect(page.locator('.timeline')).toBeHidden();
 for(const [metric,req] of [['sun','minSun'],['earth','minEarth'],['overlap','minOverlap']]){const row=page.locator(`[data-compare-metric=${metric}]`);await expect(row.locator('td').first()).toContainText(pct(before.requirements[req]));for(const id of ['A','B'])await expect(row.locator(`[data-result-scenario=${id}]`)).toHaveText(pct(before.scenarios[id].result.fractions[metric]));}
 await page.getByRole('button',{name:'Inspect scenario B',exact:true}).click();await expect(page.locator('.compare-active-context')).toContainText('Scenario B');expect((await snapshot(page)).scenarios).toEqual(before.scenarios);
 await page.screenshot({path:'docs/review/mission-settings/compare-desktop.png',animations:'disabled'});
});

test('Compare date preview is evaluated separately and applied only after testing the current inputs',async({page})=>{
 await open(page);await tab(page,'Compare').click();await page.getByRole('button',{name:'Inspect scenario B',exact:true}).click();const before=await snapshot(page);
 await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeDisabled();await page.locator('#compare-preview-date').fill('2027-01-22T00:00');await page.getByRole('button',{name:'Preview date',exact:true}).click();await idle(page);
 await expect(page.locator('.compare-preview-result')).toBeVisible();await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeEnabled();expect((await snapshot(page)).scenarios).toEqual(before.scenarios);expect((await snapshot(page)).requirements).toEqual(before.requirements);
 await page.locator('#compare-preview-date').fill('2027-01-23T00:00');await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Preview date',exact:true}).click();await idle(page);await page.getByRole('button',{name:'Apply tested start',exact:true}).click();await idle(page);
 const after=await snapshot(page);expect(after.scenarios.A).toEqual(before.scenarios.A);expect(after.scenarios.B.baselineUtc).toBe('2027-01-23T00:00:00Z');expect(after.requirements).toEqual(before.requirements);await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeDisabled();
});

test('failed Compare real-data request preserves both current scenarios and disables apply',async({page})=>{
 await open(page);await tab(page,'Compare').click();const before=(await snapshot(page)).scenarios;
 await page.route('**/api/science/coverage',route=>route.abort('failed'));
 await page.locator('#compare-preview-date').fill('2030-05-03T12:00');await page.getByRole('button',{name:'Preview date',exact:true}).click();await idle(page);await expect(page.locator('.compare-preview-error')).toContainText(/reach|available|coverage/i);await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeDisabled();expect((await snapshot(page)).scenarios).toEqual(before);
});

test('Compare keeps all controls inside desktop, tablet and mobile widths and retains Schedule',async({page})=>{
 await open(page);await tab(page,'Compare').click();const sizes=[];
 for(const [width,height] of [[1920,1080],[1586,992],[1280,720],[1024,900],[768,900],[390,844]]){
  await page.setViewportSize({width,height});const info=await page.evaluate(()=>{const selectors=['.compare-heading','#compare-navigation','.compare-summary','.compare-test-start'];return {overflow:document.documentElement.scrollWidth>innerWidth,boxes:Object.fromEntries(selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{left:r.left,right:r.right,top:r.top,bottom:r.bottom}]}))};});expect(info.overflow,'No overflow at '+width).toBe(false);for(const [s,box] of Object.entries(info.boxes)){expect(box.left,s+' left '+width).toBeGreaterThanOrEqual(0);expect(box.right,s+' right '+width).toBeLessThanOrEqual(width+1);}sizes.push({width,height,...info});
  if(width===390)await page.screenshot({path:'docs/review/mission-settings/compare-mobile.png',fullPage:true,animations:'disabled'});
 }
 await page.getByRole('tab',{name:'Schedule',exact:true}).click();await expect(page.locator('#view-calendar')).toBeVisible();await test.info().attach('Compare layout bounds',{body:JSON.stringify(sizes,null,2),contentType:'application/json'});
});
test('a real Compare preview loads future coverage without changing either scenario',async({page})=>{
 await open(page);await tab(page,'Compare').click();const before=await snapshot(page);await page.locator('#compare-preview-date').fill('2030-05-03T12:00');await page.getByRole('button',{name:'Preview date',exact:true}).click();await idle(page);await expect(page.locator('.compare-preview-result')).toBeVisible();await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeEnabled();
 expect((await snapshot(page)).scenarios.A.baselineUtc).toBe(before.scenarios.A.baselineUtc);expect((await snapshot(page)).scenarios.B).toEqual(before.scenarios.B);expect((await snapshot(page)).scenarios.A.result).toEqual(before.scenarios.A.result);
 await page.getByRole('button',{name:'Inspect scenario B',exact:true}).click();await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeDisabled();
});

test('Compare Edit opens the full mission sheet and shared requirement changes invalidate the tested start',async({page})=>{
 await page.setViewportSize({width:1586,height:992});await open(page);await tab(page,'Compare').click();await page.getByRole('button',{name:'Inspect scenario B',exact:true}).click();const before=await snapshot(page);await page.getByRole('button',{name:'Preview date',exact:true}).click();await idle(page);await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Edit scenario B settings',exact:true}).click();await expect(page.locator('#mission-settings')).toBeVisible();expect((await page.locator('#mission-settings').boundingBox()).height).toBeGreaterThan(500);await expect(page.locator('#settings-site')).toHaveValue('real-nobile');await page.locator('#settings-minSun').fill('50');await page.getByRole('button',{name:'Apply settings',exact:true}).click();await idle(page);
 await expect(page.locator('[data-compare-metric=sun] td').first()).toContainText('50%');await expect(page.getByRole('button',{name:'Apply tested start',exact:true})).toBeDisabled();const after=await snapshot(page);expect(after.scenarios.A.site).toEqual(before.scenarios.A.site);expect(after.scenarios.A.baselineUtc).toBe(before.scenarios.A.baselineUtc);expect(after.scenarios.B.baselineUtc).toBe(before.scenarios.B.baselineUtc);
});
