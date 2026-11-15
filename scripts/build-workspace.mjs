import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'vite';
import {coverage,challengeUrl} from '../src/workspace/coverage.mjs';
const root=new URL('../',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8'),sha=s=>createHash('sha256').update(s).digest('hex');
const preserved=Object.fromEntries(['lunar-prototype.html','lunar-hybrid-prototype.html','lunar-validation-prototype.html','lunar-cinematic-prototype.html'].map(name=>[name,sha(read(name))]));
const result=await build({configFile:false,publicDir:false,logLevel:'warn',build:{write:false,target:'es2022',minify:true,assetsInlineLimit:2000000,lib:{entry:fileURLToPath(new URL('src/workspace/main.mjs',root)),name:'SiteLightReferenceWorkspace',formats:['iife']}}});
const chunks=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).filter(f=>f.type==='chunk');if(chunks.length!==1)throw Error('Expected one standalone script');
const code=chunks[0].code.replace(/<\/script/gi,'<\\/script'),license=read('node_modules/three/LICENSE');
let html=read('index.html').replace('<link rel="stylesheet" href="/src/workspace/ui1.css" />',()=>'<style>'+read('src/workspace/ui1.css')+'</style>').replace('<link rel="stylesheet" href="/src/workspace/style.css" />',()=>'<style>'+read('src/workspace/style.css')+'</style>')
 .replace('<link rel="stylesheet" href="/src/workspace/seismic.css" />',()=>'<style>'+read('src/workspace/seismic.css')+'</style>')
 .replace('<script type="module" src="/src/workspace/main.mjs"></script>',()=>'<script>/* Three.js MIT license\n'+license.replaceAll('*/','* /')+'*/\n'+code+'</script>');
writeFileSync(new URL('lunar-workspace.html',root),html);
writeFileSync(new URL('docs/reference/workspace-lineage.json',root),JSON.stringify({preserved,referenceDesignSHA256:sha(read('docs/reference/user-workspace-design.html')),challengeTextSHA256:sha(read('docs/reference/nasa-challenge-2026.txt'))},null,2));
const matrix=`# NASA challenge coverage review

Reviewed: 14 November 2026. Source: [official 2026 Lunar Landing Site Navigator challenge](${challengeUrl}) and [user-supplied challenge text](reference/nasa-challenge-2026.txt).

The core goal is rapid comparison of site/date options with Sun and Earth positions relative to the horizon, supporting power-potential and direct-to-Earth-window assessment. The challenge lists suggested objectives and optional considerations; these are not all mandatory features. This review records implementation evidence and limits. It is not NASA certification, an endorsement, or a guarantee of judging eligibility.

| ID | Objective / consideration | Current status | Evidence and remaining limit |
| --- | --- | --- | --- |
${coverage.map(c=>`| ${c.id} | ${c.requirement} | ${c.status} | ${c.evidence} |`).join('\n')}

## Honest conclusion

The main workflow now has real NASA PGDA terrain and matched DE421 geometry at six sourced study points, plus separate reference/sample modes. Packaged records cover January–March 2027; the local scientific service computes other supported dates throughout 2027–2033 before applying them. Source heights, a 2 m observer, curved multiscale 500 km catalog rays, footprint statistics, 100 published local correlated realizations per point, partial stereo comparisons, and source-RMS context are implemented. Full scientific acceptance is **not complete**: independent absolute terrain truth, global/orientation covariance, broader scientific and engineering acceptance remain open. Beyond 500 km exclusion is conditional on a declared 20 km height ceiling. Custom points retain their own prepared extent. Historical Diviner context, 372 expanded geometric and 372 separate apparent comparisons, and a published NASA water-ISRU reference study are implemented. Nominal fits remain uncertain; no advanced model is assumed to pass.

The recent terrain, gap, thermal, connectivity, dust, plume, radiation, rescue, and logistics features support the product plan. They are not additional NASA challenge mandates. Numerical temperature, logistics, dose, plume, and rescue predictions retain their PRD data/model gates.

## Verification evidence

- Implementation: [workspace source](../src/workspace/main.mjs), [evaluator](../src/workspace/engine.mjs), [state](../src/workspace/store.mjs), [coverage source](../src/workspace/coverage.mjs).
- Data: source manifests in data/science-inputs.json; local DEM/kernel assets in data/raw; scientific bundle in data/science; external Horizons geometric-vector references in data/validation. Reference-mode responses remain in data/horizons. External vector checks do not certify the terrain/orientation model.
- Automated evaluator, source-integrity, state, and DOM contracts: [workspace tests](../tests-js/workspace.test.mjs).
- Delivery and remaining work: [workspace implementation notes](WORKSPACE_IMPLEMENTATION.md).
- Real-data increment, feature order, and acceptance limits: [real-data implementation](REAL_DATA_INCREMENT.md). Local compute measurements: [performance report](performance/latest.json).
- Coverage-safe selection, six-site source definitions, and real date-block loading: [coverage correction](DATA_COVERAGE_FIX.md).
- Production build: **npm.cmd run build**. Offline standalone build: **npm.cmd run build:workspace**. Tests: **npm.cmd test**.
- Playwright UI and headed Windows Chrome hardware/GPU review are recorded in [browser validation](BROWSER_VALIDATION.md); broader devices, accessibility and cold-load performance remain open.

This file is generated from the same coverage records shown in the Evidence screen.
`;
writeFileSync(new URL('docs/NASA_CHALLENGE_COVERAGE.md',root),matrix);
for(const [name,hash] of Object.entries(preserved))if(sha(read(name))!==hash)throw Error('Prior prototype modified: '+name);
console.log('Built offline lunar-workspace.html ('+Buffer.byteLength(html)+' bytes). Four earlier prototypes preserved.');
