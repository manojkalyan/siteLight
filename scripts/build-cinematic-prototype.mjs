import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';

const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const sha=data=>createHash('sha256').update(data).digest('hex');
const preserved=Object.fromEntries(['lunar-prototype.html','lunar-hybrid-prototype.html','lunar-validation-prototype.html'].map(name=>[name,sha(read(name))]));
let page=read('lunar-validation-prototype.html');
let embedded=Buffer.from(page.match(/const explorerDocumentB64 = '([^']+)';/)[1],'base64').toString('utf8');
const assets={}, provenance=[];
for(const [key,filename] of [['color','lroc_color_2k.jpg'],['height','ldem_3_8bit.jpg']]){
  const data=readFileSync(new URL('assets/cinematic/'+filename,root));
  if(data[0]!==255||data[1]!==216)throw Error('Expected JPEG: '+filename);
  assets[key]='data:image/jpeg;base64,'+data.toString('base64');
  provenance.push({filename,url:'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/'+filename,
    sourcePage:'https://svs.gsfc.nasa.gov/4720/',retrieved:'2026-11-14',sha256:sha(data),bytes:data.length,
    purpose:'Visualization only; not accepted mission-analysis input'});
}
writeFileSync(new URL('assets/cinematic/provenance.json',root),JSON.stringify({credit:'NASA’s Scientific Visualization Studio',assets:provenance},null,2)+'\n');
const library=await build({configFile:false,logLevel:'warn',publicDir:false,
  build:{write:false,target:'es2020',minify:true,lib:{entry:fileURLToPath(new URL('scripts/cinematic/scene.mjs',root)),name:'SiteLightCinematic',formats:['iife']}}});
const outputs=Array.isArray(library)?library:[library];
const bundle=outputs.flatMap(o=>o.output).filter(o=>o.type==='chunk').map(o=>o.code).join('\n');
if(!bundle.includes('createStudio'))throw Error('Scene library build missing factory.');
const license=read('node_modules/three/LICENSE');
mkdirSync(new URL('docs/licenses/',root),{recursive:true});
writeFileSync(new URL('docs/licenses/three-MIT.txt',root),license);

const style=`<style>
body{background:#010204}#atmosphere{background:linear-gradient(180deg,#0003,transparent 24%,transparent 72%,#0007)}
.glass{background:linear-gradient(135deg,#34363c94,#13151bb0);backdrop-filter:blur(30px) saturate(115%);-webkit-backdrop-filter:blur(30px) saturate(115%);border-color:#ffffff22;box-shadow:0 16px 55px #0005,inset 0 1px 0 #ffffff09}
.scene-title{top:29px;width:44vw}.scene-title .eyebrow{font-size:8px;letter-spacing:2.8px;color:#c0c0c8}.scene-title h1{font-size:clamp(26px,3vw,42px);font-weight:440;letter-spacing:-1.7px;margin:10px 0}.scene-title p{font-size:11px;color:#b9bbc4}.scene-title .rule{display:none}
.panel{top:63px;width:252px;padding:20px;max-height:calc(100dvh - 248px);border-radius:20px}.setup{left:24px}.inspector{right:24px;width:256px}.panel-heading{margin-bottom:17px}.panel-heading h2{font-size:13px}.field{margin-bottom:16px}.divider{margin:17px 0}.metric strong{font-size:23px}
.scene-switch{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);display:flex;gap:3px;padding:5px;border-radius:22px;z-index:8}.scene-switch button{background:transparent;color:#c7c8ce;padding:9px 18px;border-radius:17px;font-size:11px}.scene-switch button[aria-pressed=true]{background:#f1f1f4;color:#202126}
#cinematic-panels{position:fixed;left:24px;bottom:150px;z-index:8;border-radius:22px;padding:12px 17px;font-size:10px;color:#e1e1e8}.tools{left:24px;bottom:200px}.tools button{font-size:10px;padding:9px 11px}.camera-tools{right:24px;bottom:150px}.terrain-label{bottom:204px;color:#b8bac2;font-size:8px;letter-spacing:1.4px;text-align:center;white-space:nowrap}
#visual-credit{position:fixed;left:50%;transform:translateX(-50%);bottom:130px;text-align:center;white-space:nowrap;font-size:8px;color:#b1b4be;pointer-events:none}.timeline{bottom:30px;width:min(680px,calc(100% - 48px));border-radius:22px;padding:14px 19px}.bottom-note{bottom:9px;left:24px;font-size:8px}.gesture-note{bottom:9px;right:24px}.toast{bottom:242px}
body[data-scene=moon] .tools,body[data-scene=moon] .site-marker{display:none!important}body[data-panels=hidden] .panel{display:none!important}#fallback-notice{top:17px;max-width:90vw;text-align:center;font-size:10px;background:#191b25d9;padding:8px 15px;border-radius:20px}
@media(max-width:1100px){.panel{width:224px;padding:17px}.inspector{width:224px}.setup{left:17px}.inspector{right:17px}.scene-title{width:40vw;top:30px}.scene-title h1{font-size:30px}.scene-title p{font-size:10px}.scene-title .eyebrow{letter-spacing:2px}.tools{left:17px}.tools button{font-size:9px;padding:8px}.terrain-label{max-width:40vw;white-space:normal;line-height:1.6}}
@media(max-width:850px){.scene-title{top:24px;width:90vw}.scene-title h1{font-size:30px}.panel{top:142px;max-height:calc(100dvh - 340px)}.setup{display:block;left:16px}.inspector{right:16px}.scene-switch{bottom:146px}.terrain-label{bottom:198px}#cinematic-panels{bottom:146px;left:16px}.camera-tools{bottom:197px;right:16px}.tools{bottom:197px;left:16px}.bottom-note{max-width:70vw;font-size:7px}#visual-credit{bottom:126px;font-size:7px}.timeline{width:calc(100% - 32px);bottom:30px}.scene-title p{font-size:10px}}
@media(max-width:560px){.scene-title h1{font-size:27px}.scene-title .eyebrow{font-size:7px}.panel{top:132px;max-height:calc(100dvh - 330px);width:215px}.inspector{display:none}.setup{display:block}.scene-switch{left:auto;right:16px;transform:none}.scene-switch button{font-size:10px;padding:9px 13px}#cinematic-panels{padding:11px 12px;font-size:9px}.terrain-label{display:block;bottom:204px;max-width:42vw;font-size:7px}.tools button{padding:7px;font-size:8px}.tools{bottom:248px}.camera-tools{bottom:248px}.clock{min-width:112px}.gesture-note{display:none}.bottom-note{max-width:96vw}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>`;
embedded=embedded.replace('</head>',style+'</head>')
  .replace('<body>','<body data-scene="moon" data-panels="shown">')
  .replace('A different perspective','The lunar studio')
  .replace('Find your moment<br>on the Moon.','A closer look.<br>A clearer decision.')
  .replace('Explore the light. Understand the trade-offs.','From the whole Moon to the shape of the surface.')
  .replace('<div class="terrain-label">','<div class="scene-switch glass" role="group" aria-label="Scene scale"><button id="scene-moon" aria-pressed="true">Moon</button><button id="scene-terrain" aria-pressed="false">Terrain</button></div><button class="glass" id="cinematic-panels" aria-expanded="true" aria-controls="setup-panel inspector-panel">Hide planning</button><div id="visual-credit">Moon maps: NASA’s Scientific Visualization Studio</div><div class="terrain-label">')
  .replace('South polar concept terrain','NASA visual maps · artistic orientation')
  .replace('<aside class="panel inspector glass"','<aside id="inspector-panel" class="panel inspector glass"')
  .replace('PROCEDURAL TERRAIN & SYNTHETIC GEOMETRY · NOT FOR MISSION PLANNING','SYNTHETIC PLANNING SAMPLE · NOT FOR MISSION USE')
  .replace('Rendered with native WebGL; a reduced-detail Canvas fallback is included.','Rendered with Three.js. A reduced-detail terrain fallback is included if WebGL 2 is unavailable. The globe uses NASA SVS CGI Moon Kit maps, optimized for visualization. Its orientation and lighting are artistic, not mission predictions.')
  .replace('No remote service, texture, font, library, or tracking is used by this file.','The NASA visualization maps and the Three.js renderer are embedded in this file. No runtime downloads or tracking are used.')
  .replace('Requirement sliders change evaluation and overlay thresholds.','Requirement sliders change evaluation. Terrain overlay tints are illustrative, not computed visibility rasters.')
  .replace('>Sunlight</button>','>Sun tint</button>').replace('>Earth view</button>','>Earth tint</button>')
  .replace('class LunarRenderer{','class LegacyLunarRenderer{');
const adapter=`
class LunarRenderer {
 constructor(canvas){
  try {
   this.studio=SiteLightCinematic.createStudio({canvas,sites,height:terrainHeight,
    sample:()=>({geometry:geometry(startMs()+state.hour*3600000,sites[state.site]),hour:state.hour,site:state.site,layer:state.layer}),
    reduced,onMessage:toast,assets:window.SiteLightCinematicAssets});
   this.camera=this.studio.camera;drawStars();window.addEventListener('resize',drawStars);
  }catch(error){
   console.warn('Cinematic view unavailable:',error.message);
   const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);
   this.legacy=new LegacyLunarRenderer(replacement);this.camera=this.legacy.camera;
   document.body.dataset.scene='terrain';
   $('scene-moon').disabled=true;$('scene-terrain').setAttribute('aria-pressed','true');$('scene-moon').setAttribute('aria-pressed','false');
   $('fallback-notice').hidden=false;$('fallback-notice').textContent='Basic terrain preview · cinematic WebGL 2 view unavailable';
   $('visual-credit').textContent='Procedural fallback · not real lunar terrain';
   document.querySelector('.terrain-label').textContent='Procedural fallback terrain';
   $('cinematic-panels').addEventListener('click',()=>{const shown=document.body.dataset.panels!=='hidden';document.body.dataset.panels=shown?'hidden':'shown';$('cinematic-panels').setAttribute('aria-expanded',String(!shown));$('cinematic-panels').textContent=shown?'Show planning':'Hide planning';});
  }
  if(innerWidth<850){document.body.dataset.panels='hidden';$('cinematic-panels').textContent='Show planning';$('cinematic-panels').setAttribute('aria-expanded','false');}
 }
 draw(dt){if(this.studio)this.studio.draw(dt);else this.legacy.draw(dt);}
}
`;
embedded=embedded.replace('renderer=new LunarRenderer',adapter+'\nrenderer=new LunarRenderer');
// Near-black background, sparse stars; no colored atmospheric glow.
embedded=embedded.replace("gradient.addColorStop(0,'#050914');gradient.addColorStop(.5,'#111720');gradient.addColorStop(1,'#131820');", "gradient.addColorStop(0,'#010204');gradient.addColorStop(.5,'#030407');gradient.addColorStop(1,'#050608');");
const intro='<script>window.SiteLightCinematicAssets='+JSON.stringify(assets)+';</script>\n<script>/* Three.js MIT license\n'+license.replaceAll('*/','* /')+'*/\n'+bundle.replace(/<\/script/gi,'<\\/script')+'</script>\n';
// A function replacement keeps $' and $` inside bundled library strings literal.
embedded=embedded.replace('<script>',()=>intro+'<script>');
page=page.replace(/const explorerDocumentB64 = '[^']*';/,()=>"const explorerDocumentB64 = '"+Buffer.from(embedded).toString('base64')+"';")
  .replace(/<title>[^<]+<\/title>/,'<title>SiteLight · Cinematic Lunar Studio</title>')
  .replace('Lunar workspace</small>','Cinematic studio</small>')
  .replace('Illustrative workspace</span>','Synthetic planning sample</span>')
  .replace('Immersive procedural lunar terrain with glass mission controls','Textured Moon and procedural crater terrain with floating planning controls')
  .replace('No remote scripts, fonts, textures, or automatic service requests. All views travel in this HTML file.','NASA visualization textures and Three.js are embedded. No runtime asset downloads. All views travel in this HTML file.');
const assetCard='<section class="card" style="margin-top:22px"><h2>Visualization assets</h2><span class="data-status">Imagery for rendering only</span><p>The globe uses the 2025 LROC color map (2048 × 1024 JPEG) and LOLA height preview (1024 × 512 JPEG) from <a href="https://svs.gsfc.nasa.gov/4720/" target="_blank" rel="noreferrer">NASA’s Scientific Visualization Studio — CGI Moon Kit</a>. These rendering maps are not validated inputs to the planning engine. The globe orientation and studio lighting are artistic. No fictional candidate is mapped onto a real lunar coordinate.</p><p>Close-up craters, rocks, site markers, and all scenario results remain synthetic. Terrain tints are illustrative. There is no accepted scientific terrain, temperature, or ephemeris pipeline in this sample.</p></section>';
page=page.replace('<section class="data-table card">',assetCard+'<section class="data-table card">');
page=page.replace('</head>',`<style>
body[data-view=explore]{background:#010204}body[data-view=explore] .header{background:#090b10e8;border-color:#ffffff12}body[data-view=explore] .navigation{background:#ffffff08;border-radius:20px}body[data-view=explore] .navigation button{border-radius:16px}.brand small{font-size:9px}body[data-view=explore] .sample{font-size:9px}#view-explore{background:#010204}@media(max-width:1000px){.brand small{display:none}.header{padding-left:24px;padding-right:24px}.sample{display:none}}@media(max-width:760px){#view-explore{top:118px}}
</style></head>`);
const lineage={preserved,threeVersion:JSON.parse(read('node_modules/three/package.json')).version,assets:provenance};
page=page.replace('</script>','\nconst cinematicLineage='+JSON.stringify(lineage)+';\nconst cinematicSnapshot=snapshot;snapshot=function(){return {...cinematicSnapshot(),uiVersion:"cinematic-lunar-1",visualization:{scientific:false,globe:"NASA SVS CGI Moon Kit; artistic lighting and orientation",terrain:"Procedural",lineage:cinematicLineage}};};window.SiteLightHybrid.snapshot=snapshot;window.SiteLightScreening.snapshot=snapshot;\nsetView("explore");\n</script>');
writeFileSync(new URL('lunar-cinematic-prototype.html',root),page);
for(const [name,fingerprint] of Object.entries(preserved))if(sha(read(name))!==fingerprint)throw Error('Preserved prototype changed: '+name);
console.log('Built lunar-cinematic-prototype.html: '+Buffer.byteLength(page)+' bytes; prior prototypes preserved.');
