import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Embed the existing explorer and evaluator without modifying their source file.
const originalURL = new URL('../lunar-prototype.html', import.meta.url);
const hybridURL = new URL('../lunar-hybrid-prototype.html', import.meta.url);
const source = readFileSync(originalURL, 'utf8');
const originalSHA = createHash('sha256').update(source).digest('hex');
const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const boundary = script?.indexOf('let result=null');
if (!script || boundary < 0) throw new Error('Original evaluator boundary missing.');
const core = script.slice(0, boundary);
const bridge = `
window.hybridExploreActive=true;
let hybridNotifyTimer;
function hybridNotify(){clearTimeout(hybridNotifyTimer);hybridNotifyTimer=setTimeout(()=>window.parent.postMessage({type:'sitelight-hybrid:change',payload:{site:state.site,date:state.date,duration:state.duration,minSun:state.minSun,minEarth:state.minEarth,minOverlap:state.minOverlap,minElevation:state.minElevation,hour:state.hour,layer:state.layer}},'*'),35);}
const hybridOriginalClock=updateClock;updateClock=function(){hybridOriginalClock();if(window.hybridExploreActive)hybridNotify();};
window.addEventListener('message',event=>{if(event.source!==window.parent||event.data?.type!=='sitelight-hybrid:scenario')return;const p=event.data.payload;if(!p||!Number.isInteger(p.site)||p.site<0||p.site>=sites.length||!/^\\d{4}-\\d{2}-\\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date+'T00:00:00Z')))return;for(const key of ['duration','minSun','minEarth','minOverlap','minElevation','hour'])if(!Number.isFinite(p[key]))return;if(p.duration<48||p.duration>336||p.minSun<0||p.minSun>1||p.minEarth<0||p.minEarth>1||p.minOverlap<0||p.minOverlap>1||p.minElevation<0||p.minElevation>8)return;window.hybridExploreActive=!!event.data.active;if(!window.hybridExploreActive)play(false);state.site=p.site;state.date=p.date;state.duration=p.duration;state.minSun=p.minSun;state.minEarth=p.minEarth;state.minOverlap=p.minOverlap;state.minElevation=p.minElevation;state.hour=clamp(p.hour,0,p.duration);setLayer(Number.isInteger(p.layer)?clamp(p.layer,0,2):0);renderer.camera.tx=sites[p.site].x*.27;renderer.camera.tz=sites[p.site].z*.27;refresh();});
document.addEventListener('input',hybridNotify);document.addEventListener('change',hybridNotify);document.addEventListener('click',hybridNotify);window.parent.postMessage({type:'sitelight-hybrid:ready'},'*');
`;
const embedStyle = '<style>.topbar{display:none!important}.scene-title{top:48px}.panel{top:48px;max-height:calc(100dvh - 220px)}@media(max-width:850px){.scene-title{top:35px}.panel{top:145px;max-height:calc(100dvh - 325px)}.mobile-toggle{display:none}.setup{display:block}.setup{left:16px}.inspector{right:16px}}@media(max-width:560px){.setup{display:none}.panel{top:143px;max-height:calc(100dvh - 325px)}.scene-title h1{font-size:27px}.scene-title p{font-size:10px}}</style>';
let embedded = source.replace('</head>', embedStyle + '</head>')
  .replace('if(!document.hidden)renderer.draw(dt)', 'if(!document.hidden&&window.hybridExploreActive!==false)renderer.draw(dt)')
  .replace('</body>', '<script>' + bridge + '</script></body>');
let hybrid = readFileSync(hybridURL, 'utf8');
hybrid = hybrid.replace(/\/\* BEGIN SHARED ENGINE \*\/[\s\S]*?\/\* END SHARED ENGINE \*\//,
  () => '/* BEGIN SHARED ENGINE */\n' + core + '\n/* END SHARED ENGINE */');
hybrid = hybrid.replace(/const explorerDocumentB64 = '[^']*';/, () => "const explorerDocumentB64 = '" + Buffer.from(embedded).toString('base64') + "';");
hybrid = hybrid.replace(/const originalPrototypeSHA = '[^']*';/, () => "const originalPrototypeSHA = '" + originalSHA + "';");
writeFileSync(hybridURL, hybrid, 'utf8');
if (createHash('sha256').update(readFileSync(originalURL)).digest('hex') !== originalSHA) throw new Error('Original prototype changed unexpectedly.');
console.log('Assembled standalone hybrid prototype. Original preserved: ' + originalSHA);
