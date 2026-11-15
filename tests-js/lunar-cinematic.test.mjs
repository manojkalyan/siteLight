import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('lunar-cinematic-prototype.html');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const embedded=Buffer.from(script.match(/const explorerDocumentB64 = '([^']+)';/)[1],'base64').toString('utf8');
const childScripts=[...embedded.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const app=childScripts.find(s=>s.includes('class LegacyLunarRenderer'));
const sha=b=>createHash('sha256').update(b).digest('hex');

// Minimal contracts only; these harnesses do not emulate a browser layout or GPU.
function dom(){
  const nodes=new Map();
  const drawing=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
  function node(id,tagName='DIV'){
    if(nodes.has(id))return nodes.get(id);
    const classes=new Set();
    const item={id,tagName,value:'',dataset:{},style:{},listeners:{},attributes:{},children:[],
      classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,force){const yes=force??!classes.has(k);yes?classes.add(k):classes.delete(k);return yes;}},
      addEventListener(name,fn){this.listeners[name]=fn;},setAttribute(k,v){this.attributes[k]=String(v);},
      append(c){this.children.push(c);},replaceChildren(){this.children=[];},focus(){},scrollIntoView(){},
      getContext(name){return name.startsWith('webgl')?null:drawing;},
      cloneNode(){return {...this,listeners:{},style:{...this.style}};},replaceWith(other){nodes.set(id,other);},
      showModal(){this.open=true;},close(){this.open=false;},contentWindow:{postMessage(){}},
    };
    nodes.set(id,item);return item;
  }
  const nav=['compare','explore','screening','logistics','data'].map(v=>{const b=node('tab-'+v,'BUTTON');b.dataset.view=v;return b;});
  const tabs=['terrain','gaps','thermal','research'].map(v=>{const b=node('screen-tab-'+v,'BUTTON');b.dataset.screenTab=v;return b;});
  const layers=[0,1,2].map(i=>{const b=node('layer-'+i,'BUTTON');b.dataset.layer=i;return b;});
  const markers=[0,1,2].map(i=>{const b=node('marker-'+i,'BUTTON');b.dataset.site=i;return b;});
  const doc={body:node('body','BODY'),hidden:false,getElementById:node,
    querySelector:selector=>node(selector),querySelectorAll:s=>s==='[data-view]'?nav:s==='[data-screen-tab]'?tabs:s==='[data-layer]'?layers:s==='[data-site]'?markers:[],
    createElement:tag=>node('created-'+nodes.size,tag.toUpperCase()),addEventListener(){}};
  return {doc,node};
}
function parent(){
  const d=dom(),listeners=new Map();
  const context=vm.createContext({document:d.doc,window:{addEventListener:(k,v)=>listeners.set(k,v)},
    matchMedia:()=>({matches:false}),setTimeout(fn,ms){const t=setTimeout(fn,ms);t.unref();return t;},clearTimeout,TextDecoder,Uint8Array,atob});
  vm.runInContext(script,context,{timeout:20000});
  return {...d,api:context.window.SiteLightHybrid,listeners,screening:context.window.SiteLightScreening};
}
function child({fallback=false,width=1440,bundled=false}={}){
  const d=dom();d.doc.body.dataset={scene:'moon',panels:'shown'};
  let options,frames=0;
  const context=vm.createContext({document:d.doc,window:{addEventListener(){},SiteLightCinematicAssets:{}},
    SiteLightCinematic:{createStudio(o){if(fallback)throw Error('No WebGL 2');options=o;return {camera:{yaw:.13,pitch:.12,distance:38,tx:0,tz:-1},draw(){frames++;}};}},
    matchMedia:()=>({matches:false,addEventListener(){}}),innerWidth:width,innerHeight:900,devicePixelRatio:1,
    performance:{now:()=>100},requestAnimationFrame(){},setTimeout(fn,ms){const t=setTimeout(fn,ms);t.unref();return t;},clearTimeout,console:{warn(){},error(){}},
  });
  if(bundled)vm.runInContext(childScripts[1],context,{timeout:15000});
  vm.runInContext(app,context,{timeout:15000});
  return {...d,context,get options(){return options;},frames:()=>frames};
}

test('cinematic file and every embedded script parse without external script or stylesheet dependencies',()=>{
  for(const code of [script,...childScripts])assert.doesNotThrow(()=>new vm.Script(code));
  assert.equal(childScripts.length,4);
  for(const document of [html,embedded])assert.doesNotMatch(document,/<script[^>]+src=|<link[^>]+href=|@import\b/);
  assert.match(embedded,/Three.js MIT license/);
  assert.match(embedded,/not computed visibility rasters/);
  assert.match(html,/Imagery for rendering only/);
});

test('embedded NASA images match pinned local assets and their provenance checksums',()=>{
  const ctx=vm.createContext({window:{}});vm.runInContext(childScripts[0],ctx);
  const provenance=JSON.parse(read('assets/cinematic/provenance.json'));
  for(const [key,filename] of [['color','lroc_color_2k.jpg'],['height','ldem_3_8bit.jpg']]){
    const b=Buffer.from(ctx.window.SiteLightCinematicAssets[key].split(',')[1],'base64');
    const p=provenance.assets.find(a=>a.filename===filename);
    assert.equal(b.readUInt16BE(0),0xffd8);assert.equal(b.readUInt16BE(b.length-2),0xffd9);
    assert.equal(p.sha256,sha(b));assert.equal(p.bytes,b.length);
    assert.equal(sha(readFileSync(new URL('../assets/cinematic/'+filename,import.meta.url))),p.sha256);
    assert.ok(p.url.startsWith('https://svs.gsfc.nasa.gov/'));
  }
});

test('prior prototypes and the complete shared scientific sample engines are preserved',()=>{
  const lineage=JSON.parse(script.match(/const cinematicLineage=(\{[^\n]+\});/)[1]);
  for(const [name,fingerprint] of Object.entries(lineage.preserved))assert.equal(sha(read(name)),fingerprint);
  const original=read('lunar-validation-prototype.html');
  for(const name of ['SHARED','SCREENING']){
    const re=new RegExp('/\\* BEGIN '+name+' ENGINE \\*/([\\s\\S]*?)/\\* END '+name+' ENGINE \\*/');
    assert.equal(script.match(re)[1],original.match(re)[1]);
  }
});

test('startup opens Explore, preserves independent previews across all planning views, and discloses visualization metadata',()=>{
  const w=parent();
  assert.equal(w.doc.body.dataset.view,'explore');
  assert.ok(w.node('explorer-frame').srcdoc.includes('scene-moon'));
  w.api.setDraft(14);
  for(const v of ['screening','logistics','compare','data','explore'])w.api.setView(v);
  const snap=w.api.snapshot();
  assert.equal(snap.scenarios[1].previewOffsetDays,14);
  assert.equal(snap.scenarios[1].baselineLandingUtc,'2027-01-13T00:00:00Z');
  assert.equal(snap.uiVersion,'cinematic-lunar-1');
  assert.equal(snap.visualization.scientific,false);
  assert.equal(w.screening.snapshot().visualization.terrain,'Procedural');
});

test('cinematic explorer input still synchronizes back to the selected comparison scenario',()=>{
  const w=parent();
  const payload={site:2,date:'2027-02-03',duration:216,minSun:.6,minEarth:.4,minOverlap:.25,minElevation:3,hour:15,layer:2};
  w.listeners.get('message')({source:w.node('explorer-frame').contentWindow,data:{type:'sitelight-hybrid:change',payload}});
  const snap=w.api.snapshot();
  assert.equal(snap.scenarios[1].site,'halo');assert.equal(snap.constraints.durationHours,216);
  assert.equal(snap.constraints.minimumSunElevationDeg,3);
  w.api.setView('screening');assert.equal(w.doc.body.dataset.view,'screening');
});

test('scene adapter reads live sample geometry, keeps requirement changes independent, and delegates rendering',()=>{
  const c=child(),before=JSON.stringify(c.options.sample().geometry);
  c.node('min-elevation').listeners.input({target:{value:'8'}});
  assert.equal(JSON.stringify(c.options.sample().geometry),before);
  c.node('time-slider').listeners.input({target:{value:'20'}});
  assert.equal(c.options.sample().hour,20);
  assert.notEqual(JSON.stringify(c.options.sample().geometry),before);
  vm.runInContext('frame(116)',c.context);assert.equal(c.frames(),1);
});

test('WebGL 2 initialization failure gives a working labeled terrain fallback and disables the Moon choice',()=>{
  const c=child({fallback:true});
  assert.equal(c.doc.body.dataset.scene,'terrain');
  assert.equal(c.node('scene-moon').disabled,true);
  assert.match(c.node('fallback-notice').textContent,/WebGL 2 view unavailable/);
  assert.doesNotThrow(()=>vm.runInContext('frame(116)',c.context));
  c.node('cinematic-panels').listeners.click();
  assert.equal(c.doc.body.dataset.panels,'hidden');
  c.node('cinematic-panels').listeners.click();assert.equal(c.doc.body.dataset.panels,'shown');
});

test('narrow-screen startup keeps planning panels closed with matching accessibility state',()=>{
  const c=child({width:390});
  assert.equal(c.doc.body.dataset.panels,'hidden');
  assert.equal(c.node('cinematic-panels').attributes['aria-expanded'],'false');
  assert.equal(c.node('cinematic-panels').textContent,'Show planning');
});

test('the actual embedded Three.js bundle initializes offline and reaches the fallback when graphics are unavailable',()=>{
  const c=child({bundled:true});
  assert.equal(c.doc.body.dataset.scene,'terrain');
  assert.equal(c.node('scene-moon').disabled,true);
  assert.doesNotThrow(()=>vm.runInContext('frame(116)',c.context));
});
