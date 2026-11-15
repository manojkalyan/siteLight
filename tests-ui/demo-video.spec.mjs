import {test,expect,open,snapshot} from './fixtures.mjs';
import guide from '../data/demo/walkthrough.json' with {type:'json'};

test('Demo video follows Evidence, plays real media and seeks chapters without changing scenarios',async({page})=>{
 await open(page);const before=await snapshot(page);
 await expect(page.locator('.ws-tabs [role=tab]')).toHaveText(['Explore','Compare','Screening','Evidence','Demo video']);
 await page.getByRole('tab',{name:'Demo video',exact:true}).click();
 const video=page.locator('#demo-video');await expect(video).toBeVisible();
 await page.waitForFunction(()=>document.querySelector('#demo-video').readyState>=1);
 const duration=await video.evaluate(v=>v.duration);expect(duration).toBeGreaterThan(120);expect(duration).toBeLessThanOrEqual(180);expect(Math.abs(duration-guide.duration)).toBeLessThan(.6);
 expect(await video.evaluate(v=>v.paused)).toBe(true);
 const button=page.locator('[data-demo-chapter="5"]');await button.scrollIntoViewIfNeeded();await button.click();
 await page.waitForFunction(start=>{const v=document.querySelector('#demo-video');return !v.paused&&v.currentTime>=start&&v.currentTime<start+8;},guide.chapters[5].start);
 await page.locator('#demo-speed').selectOption('1.5');expect(await video.evaluate(v=>v.playbackRate)).toBe(1.5);
 expect((await snapshot(page)).scenarios).toEqual(before.scenarios);expect((await snapshot(page)).requirements).toEqual(before.requirements);
 await page.getByRole('tab',{name:'Explore',exact:true}).click();expect(await video.evaluate(v=>v.paused)).toBe(true);
});

test('Demo deep link, transcript and navigation fit mobile and desktop',async({page})=>{
 await page.goto('/?view=demo');await page.waitForFunction(()=>window.SiteLightWorkspace);await expect(page.locator('#view-demo')).toBeVisible();
 await expect(page.locator('[data-demo-chapter]')).toHaveCount(13);
 await page.getByText('Read the complete walkthrough',{exact:true}).click();await expect(page.locator('.demo-transcript')).toContainText('Compare the actual results');
 for(const [width,height] of [[1920,1080],[1280,900],[768,1000],[390,844]]){await page.setViewportSize({width,height});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);expect(overflow,'Overflow at '+width).toBe(false);}
 const vtt=await page.request.get('/demo/sitelight-walkthrough.vtt');expect(vtt.status()).toBe(200);expect(await vtt.text()).toContain('WEBVTT');
});
