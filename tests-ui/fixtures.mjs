import {test as base,expect} from '@playwright/test';
export const test=base.extend({
 page:async({page},use)=>{
  const errors=[],failed=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(/^http:\/\/127\.0\.0\.1:\d+\//.test(response.url())&&response.status()>=400)failed.push(response.status()+' '+response.url());});
  await use(page);
  expect(errors,'Unexpected browser JavaScript exceptions').toEqual([]);
  expect(failed,'Unexpected failed local resources').toEqual([]);
 }
});
export {expect};
export async function open(page){await page.goto('/');await page.waitForFunction(()=>window.SiteLightWorkspace);await page.evaluate(()=>window.SiteLightWorkspace.whenReady());await expect(page.locator('#root')).toHaveAttribute('aria-busy','false');}
export const snapshot=page=>page.evaluate(()=>window.SiteLightWorkspace.snapshot());
export async function idle(page){await page.evaluate(()=>window.SiteLightWorkspace.whenIdle());await expect(page.locator('#root')).toHaveAttribute('aria-busy','false');}
export const tab=(page,name)=>name==='Report'?page.locator('.topbar [data-view="report"]'):page.getByRole('tab',{name:({Layout:'Explore',Calendar:'Schedule'}[name]||name),exact:true});
export async function navigate(page,name){
 if(name==='Schedule'||name==='Calendar'){await tab(page,'Compare').click();await tab(page,'Schedule').click();return;}
 await tab(page,name).click();
}
export async function screening(page,name){await tab(page,'Screening').click();await page.getByRole('tab',{name,exact:true}).click();}
export async function editMission(page,patch){
 await page.getByRole('button',{name:'Open mission settings',exact:true}).click();await expect(page.locator('#mission-settings')).toBeVisible();
 for(const [key,value] of Object.entries(patch)){
  const input=page.locator('#settings-'+key);
  if(key==='site'||key==='mode')await input.selectOption(String(value));else await input.fill(String(value));
 }
 await page.getByRole('button',{name:'Apply settings',exact:true}).click();await idle(page);
}
