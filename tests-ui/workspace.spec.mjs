import {test,expect,open,snapshot,idle,tab,navigate,screening,editMission} from './fixtures.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('real initial comparison and all four UI1 tabs plus Schedule and Export render in Chrome',async({page})=>{
 await open(page);const report=await snapshot(page);expect(report.scenarios.A.result.status).toBe('fail');expect(report.scenarios.B.result.status).toBe('uncertain');
 await expect(page.locator('#compare-strip .cmp-card')).toHaveCount(2);await expect(page.locator('#viewport canvas')).toBeVisible();
 for(const name of ['Compare','Screening','Evidence','Explore']){await navigate(page,name);await expect(tab(page,name)).toHaveAttribute('aria-selected','true');await expect(page.locator('#view-'+({Evidence:'data',Explore:'layout'}[name]||name.toLowerCase()))).toBeVisible();}await navigate(page,'Schedule');await expect(page.locator('#view-calendar')).toBeVisible();await navigate(page,'Report');await expect(page.locator('#view-report')).toBeVisible();
});

test('sourced terrain ensembles, corrected horizons and NASA architecture are visible and exported',async({page})=>{
 await open(page);const before=await snapshot(page);
 for(const id of ['A','B']){expect(before.scenarios[id].horizonModel.extentM).toBe(500000);expect(before.terrainReferenceEvidence[id].localCorrelatedTerrain.members).toBe(100);expect(before.terrainReferenceEvidence[id].acceptedForVerdict).toBe(false);}
 expect(before.nasaReferenceStudy.publishedValues).toHaveLength(23);expect(before.nasaReferenceStudy.checks.every(c=>c.passed)).toBe(true);expect(before.nasaReferenceStudy.calibratedLegacyParameters).toBe(0);
 await expect(page.locator('#horizon-label')).toContainText('500 km');await tab(page,'Screening').click();await expect(page.locator('#terrain-reference-review')).toContainText('100 NASA');await expect(page.locator('#terrain-reference-review')).toContainText('not guaranteed confidence bounds');
 await screening(page,'Logistics');await expect(page.locator('#nasa-reference-logistics')).toContainText('68 kW');await expect(page.locator('#nasa-reference-logistics')).toContainText('5 wt%');
 await tab(page,'Report').click();await expect(page.locator('#nasa-reference-report')).toContainText('7/7');expect((await snapshot(page)).scenarios.A.result).toEqual(before.scenarios.A.result);
});

test('ten-minute real scan applies a rechecked date and invalidates incompatible requirements',async({page})=>{
 await open(page);await page.locator('[data-select="B"]:visible').first().click();await navigate(page,'Schedule');
 const originalA=(await snapshot(page)).scenarios.A;await page.locator('[data-action="start-window-scan"]').click();await idle(page);
 const study=(await snapshot(page)).landingStartWindows;expect(study.tested).toBe(11953);expect(study.nominalFits).toBe(2303);expect(study.unknown).toBe(0);
 const utc=study.nominalFitWindows[0].lastStartUtc;await page.locator('[data-schedule-preview="'+utc+'"]').first().click();await page.locator('[data-action=schedule-apply]').click();await idle(page);
 let report=await snapshot(page);expect(report.scenarios.B.baselineUtc).toBe(utc);expect(report.scenarios.B.result.status).toBe('uncertain');expect(report.scenarios.A).toEqual(originalA);
 await editMission(page,{minSun:95});
 report=await snapshot(page);expect(report.landingStartWindows).toBeNull();await expect(page.locator('[data-start-window]')).toHaveCount(0);
});

test('future real date loads before committing and a failed request preserves the covered scenario',async({page})=>{
 await open(page);await editMission(page,{date:'2030-08-13T05:20'});
 const before=(await snapshot(page)).scenarios.A;expect(before.baselineUtc).toBe('2030-08-13T05:20:00Z');expect(before.result.status).not.toBe('insufficient_data');
 await page.route('**/api/science/coverage',route=>route.abort('failed'));
 await editMission(page,{date:'2031-08-13T05:20'});
 expect((await snapshot(page)).scenarios.A).toEqual(before);await expect(page.locator('#toast')).toContainText(/network|unavailable|reach|failed/i);
});

test('monthly real-data grid applies the identical December 2033 sample',async({page})=>{
 await open(page);await page.locator('[data-select="B"]:visible').first().click();await navigate(page,'Schedule');await page.locator('[data-action="monthly-study"]').click();await idle(page);
 await expect(page.locator('[data-monthly-date]')).toHaveCount(84);const study=(await snapshot(page)).monthlyRobustness;
 expect(study.horizon.extentM).toBe(500000);expect(study.terrainSources.some(s=>s.extentM===500000&&s.url?.includes('240MPP'))).toBe(true);
 await page.locator('[data-monthly-date="2033-12-01T00:00:00Z"]').click();await idle(page);const result=(await snapshot(page)).scenarios.B;
 expect(result.baselineUtc).toBe('2033-12-01T00:00:00Z');expect(result.result.fractions).toEqual(study.cells.at(-1).result.fractions);
});

test('LCSS inputs remain assumptions and preserve the other scenario and environmental verdict',async({page})=>{
 await open(page);const before=await snapshot(page);await screening(page,'Logistics');await page.locator('[data-logistics="enabled"]').check();
 expect((await snapshot(page)).logisticsExploration.results.A.totalKg).toBe(21670);
 await page.locator('[data-logistics="ice"]').fill('6');await page.locator('[data-logistics="ice"]').press('Tab');const after=await snapshot(page);
 expect(after.logisticsExploration.results.A.totalKg).toBe(11990);expect(after.logisticsExploration.results.B.iceWtPercent).toBe(1);expect(after.logisticsExploration.acceptedForVerdict).toBe(false);expect(after.scenarios.A.result).toEqual(before.scenarios.A.result);
});

test('conditional rescue requires an asset and re-declaration when the start changes',async({page})=>{
 await open(page);await editMission(page,{site:'real-connector'});await screening(page,'Rescue');
 await page.locator('[data-rescue="assetDeclared"]').check();await page.locator('[data-rescue="available"]').check();expect((await snapshot(page)).rescueExploration.results.A.status).toBe('conditional_fit');
 await navigate(page,'Schedule');await page.locator('.schedule-daily-alternatives>summary').click();await page.locator('[data-calendar="1"]').click();await idle(page);await screening(page,'Rescue');
 await expect(page.locator('[data-rescue="assetDeclared"]')).not.toBeChecked();expect((await snapshot(page)).rescueExploration.results.A.status).toBe('not_evaluated');
});

test('dust, ejecta and proton controls show their qualified models without changing environmental records',async({page})=>{
 await open(page);const before=await snapshot(page);await screening(page,'Thermal & dust');
 await page.locator('[data-dust="enabled"]').check();await page.locator('[data-dust="coveragePercent"]').fill('0');await page.locator('[data-dust="coveragePercent"]').press('Tab');expect((await snapshot(page)).dustExploration.results.A.deltaTemperatureK).toBe(0);
 await screening(page,'Plume');await page.locator('[data-plume="enabled"]').check();await page.locator('[data-action="plume-add"]').click();await expect(page.locator('[data-plume-asset][data-plume-field="name"]')).toHaveCount(3);
 await page.locator('[data-plume-asset="asset-1"][data-plume-field="name"]').fill('<script>asset</script>');await page.locator('[data-plume-asset="asset-1"][data-plume-field="name"]').press('Tab');await expect(page.locator('#plume-planning script')).toHaveCount(0);
 await screening(page,'Radiation');await page.locator('[data-radiation="enabled"]').check();await page.locator('[data-radiation="arealDensityGcm2"]').fill('10.01');await page.locator('[data-radiation="arealDensityGcm2"]').press('Tab');
 const after=await snapshot(page);expect(after.radiationExploration.results.A.protonComparison.status).toBe('csda_range_exhausted');expect(after.radiationExploration.results.A.effectiveDose).toBe('not_evaluated');expect(after.radiationExploration.results.B.status).toBe('not_evaluated');expect(after.scenarios.A.result).toEqual(before.scenarios.A.result);expect(after.scenarios.A.thermalContext).toEqual(before.scenarios.A.thermalContext);
});

test('evidence JSON is a real download with a verified SHA and print view retains the start study',async({page})=>{
 await open(page);await page.locator('[data-select="B"]:visible').first().click();await navigate(page,'Schedule');await page.locator('[data-action="start-window-scan"]').click();await idle(page);await tab(page,'Report').click();
 const pending=page.waitForEvent('download');await page.locator('.report-options [data-action="export-json"]').click();const download=await pending;expect(download.suggestedFilename()).toBe('sitelight-evidence-report.json');const report=JSON.parse(await readFile(await download.path(),'utf8'));
 expect(report.landingStartWindows.tested).toBe(11953);expect(report.canonicalInputsSha256).toMatch(/^[a-f0-9]{64}$/);expect(report.model).toBe('workspace-evaluator-11');
 const keys=['model','mode','requirements','convention','preprocessing','stepMinutes','scenarios','terrain','logisticsExploration','nasaReferenceStudy','terrainReferenceEvidence','terrainEnsembleStudy','monthlyRobustness','landingStartWindows','rescueExploration','dustExploration','plumeExploration','radiationExploration','seismicContext'];
 expect(report.canonicalInputsSha256).toBe(createHash('sha256').update(JSON.stringify(Object.fromEntries(keys.map(key=>[key,report[key]])))).digest('hex'));
 await page.emulateMedia({media:'print'});await expect(page.locator('#start-window-report')).toBeVisible();await expect(page.locator('.topbar')).toBeHidden();await expect(page.locator('#view-report')).toBeVisible();
});

test('keyboard navigation, guide dialog and reduced motion work in a rendered browser',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);await tab(page,'Layout').focus();await page.keyboard.press('ArrowRight');await expect(tab(page,'Compare')).toBeFocused();await expect(tab(page,'Compare')).toHaveAttribute('aria-selected','true');
 await navigate(page,'Evidence');await page.getByRole('button',{name:'Open guide',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();
 await navigate(page,'Layout');await page.locator('#play').click();expect(await page.evaluate(()=>window.SiteLightWorkspace.state.playing)).toBe(false);await expect(page.locator('#toast')).toContainText('Reduced motion');
});

test('mobile and tablet controls stay inside the viewport and the site menu stays usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);await page.locator('#mission-panel [data-action="sites"]').click();await page.locator('[data-site="real-nobile"]').click();await idle(page);await page.locator('#catalog-popover [data-action="sites"]').click();
 const lastMetric=page.locator('#result-panel .summary-metrics strong').last();await lastMetric.scrollIntoViewIfNeeded();await expect(lastMetric).toBeInViewport({ratio:.9});
 await expect.poll(()=>page.locator('#horizon-chart svg').evaluate(el=>Math.abs(el.viewBox.baseVal.width-el.parentElement.clientWidth))).toBeLessThanOrEqual(1);
 await navigate(page,'Schedule');await page.locator('[data-action="start-window-scan"]').click();await idle(page);
 const table=page.getByRole('region',{name:'Tested landing-start windows; scroll horizontally to view all columns'});await table.focus();await table.press('ArrowRight');await expect.poll(()=>table.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 for(const width of [390,768,1024]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'No horizontal document overflow at '+width).toBe(true);await expect(tab(page,'Calendar')).toBeVisible();}
});

test('a browser with unavailable WebGL retains scientific charts and the full start scan',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:original.call(this,kind,...args);};});
 await open(page);await expect(page.locator('#viewport')).toHaveClass(/graphics-unavailable/);await expect(page.locator('#horizon-drawer')).toHaveAttribute('open','');await expect(page.locator('#horizon-chart svg')).toBeVisible();await navigate(page,'Schedule');await page.locator('[data-action="start-window-scan"]').click();await idle(page);expect((await snapshot(page)).landingStartWindows.tested).toBe(11953);
});
