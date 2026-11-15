import {defineConfig,devices} from '@playwright/test';
const baseURL=process.env.SITELIGHT_UI_BASE_URL||'http://127.0.0.1:4174';

export default defineConfig({
 testDir:'./tests-ui',timeout:60000,expect:{timeout:15000},fullyParallel:false,workers:1,retries:0,
 outputDir:'artifacts/playwright-results',
 reporter:[['list'],['html',{outputFolder:'artifacts/playwright-report',open:'never'}],['json',{outputFile:'artifacts/playwright-results.json'}]],
 use:{baseURL,trace:'off',screenshot:'only-on-failure',acceptDownloads:true},
 webServer:process.env.SITELIGHT_UI_BASE_URL?undefined:{command:'node scripts/run-vite.mjs preview --host 127.0.0.1 --port 4174 --strictPort',url:baseURL,reuseExistingServer:false,timeout:60000},
 projects:[
  {name:'ui-chrome',testMatch:['workspace.spec.mjs','ui1-migration.spec.mjs','large-layout-sites.spec.mjs','horizon-panel.spec.mjs','compare-reference.spec.mjs','schedule-reference.spec.mjs','terrain-reference.spec.mjs','logistics-reference.spec.mjs','thermal-reference.spec.mjs','evidence-export-reference.spec.mjs','seismic-reference.spec.mjs','demo-video.spec.mjs'],use:{...devices['Desktop Chrome'],channel:'chrome',headless:true,viewport:{width:1440,height:1000}}},
  {name:'windows-chrome-review',testMatch:'chrome-review.spec.mjs',use:{...devices['Desktop Chrome'],channel:'chrome',headless:false,viewport:{width:1440,height:1000}}}
 ]
});
