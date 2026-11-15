import * as THREE from 'three';
import colorUrl from '../../assets/cinematic/lroc_color_2k.jpg?url';
import heightUrl from '../../assets/cinematic/ldem_3_8bit.jpg?url';
import {sampleGrid} from './real-data.mjs';
import {terrainPointToScene,footprintBoundary,footprintCellPolygon,lunarSiteToScene} from './viewport-geometry.mjs';
import {displaySiteName} from './scene-presentation.mjs';
import {createCelestialGuides} from './celestial-guides.mjs';
import {createCinematicTerrain,cinematicHeight} from './cinematic-terrain.mjs';

export function mountViewport(container,read,notify){
 const canvas=document.createElement('canvas');canvas.tabIndex=0;canvas.setAttribute('aria-label','3D lunar visualization. Drag or use arrow keys to orbit; plus and minus to zoom.');container.prepend(canvas);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch{canvas.remove();container.classList.add('graphics-unavailable');notify('3D unavailable on this device. The horizon charts and assessments remain available.');return {update(){},setMode(){},reset(){},zoom(){},setActive(){},dispose(){}};}
 let disposed=false,active=true,lost=false,frameId,dirty=1,last='',mode='moon',yaw=.14,pitch=-.46,distance=25,celestialFocus=null;
 const current={yaw,pitch,distance},listeners=[];
 const listen=(target,name,fn,options)=>{target.addEventListener(name,fn,options);listeners.push([target,name,fn,options]);};
 const sceneInfo=container.querySelector('.moon-scene-info');if(sceneInfo)listen(sceneInfo,'toggle',()=>dirty++);
 renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.setClearColor(0x000000,0);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.1,600);
 const celestial=createCelestialGuides(container,{onLocate:focusCelestial,onLayout:()=>dirty++});scene.add(celestial.group);
 const light=new THREE.DirectionalLight(0xffffff,3.3),ambient=new THREE.AmbientLight(0xffffff,.07);light.position.set(-22,9,27);scene.add(light,light.target,ambient);
 // Display-only, shadow-free key light preserves relief when the real Sun is blocked.
 const inspectionLight=new THREE.DirectionalLight(0xe8eef7,0);scene.add(inspectionLight,inspectionLight.target);
 light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:150});light.shadow.camera.updateProjectionMatrix();light.shadow.bias=-.00015;light.shadow.normalBias=.03;
 const loader=new THREE.TextureLoader(),ready=()=>dirty++,failed=()=>notify('A visualization texture failed to load. Assessment data is unaffected.');
 const color=loader.load(colorUrl,ready,undefined,failed);color.colorSpace=THREE.SRGBColorSpace;const bump=loader.load(heightUrl,ready,undefined,failed);
 const moonMaterial=new THREE.MeshStandardMaterial({map:color,bumpMap:bump,bumpScale:.11,color:0xffffff,roughness:1});
 // Neutralize only the artistic rendering map. Scientific DEM heights are untouched.
 moonMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat lunarGray=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722)); diffuseColor.rgb=vec3(lunarGray);');};
 const globe=new THREE.Group();scene.add(globe);const moon=new THREE.Mesh(new THREE.SphereGeometry(9,160,96),moonMaterial);moon.rotation.y=-Math.PI/2;globe.add(moon);
 const pin=new THREE.Mesh(new THREE.SphereGeometry(.085,12,8),new THREE.MeshBasicMaterial({color:0x91c5f6}));globe.add(pin);
 const halo=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),new THREE.MeshBasicMaterial({color:0x86b4ff,transparent:true,opacity:.22}));globe.add(halo);
 const label=document.createElement('div');label.className='moon-site-label';const labelText=document.createElement('span'),labelName=document.createElement('b'),labelCoordinate=document.createElement('small');labelText.append(labelName,labelCoordinate);label.append(labelText);label.hidden=true;container.append(label);
 const coordinateText=(site,digits=2)=>`${Math.abs(site.lat).toFixed(digits)}° ${site.lat<0?'S':'N'} · ${Math.abs(site.lon).toFixed(digits)}° ${site.lon<0?'W':'E'}`;
 function placeMoonLabel(x,y){
  const width=container.clientWidth,height=container.clientHeight,box=container.getBoundingClientRect(),sx=box.width/width,sy=box.height/height;
  const rect=labelText.getBoundingClientRect(),w=rect.width/sx,h=rect.height/sy,gap=12;
  const obstacles=[...document.querySelectorAll('.mission-panel,.result-panel,.horizon-drawer,.timeline,.scene-controls,.vp-camera,.moon-scene-info[open]>div')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>el.getBoundingClientRect()).filter(r=>r.right>box.left&&r.left<box.right&&r.bottom>box.top&&r.top<box.bottom).map(r=>({left:(r.left-box.left)/sx,top:(r.top-box.top)/sy,right:(r.right-box.left)/sx,bottom:(r.bottom-box.top)/sy}));
  const candidates=[[x+32,y-h-30],[x-w-32,y-h-30],[x+32,y+26],[x-w-32,y+26]];
  for(const r of obstacles)candidates.push([r.left-w-gap,y-h-30],[r.right+gap,y-h-30],[x-w/2,r.top-h-gap],[x-w/2,r.bottom+gap]);
  let best=null,score=Infinity;
  for(const [cx,cy] of candidates){const left=Math.max(gap,Math.min(width-w-gap,cx)),top=Math.max(gap,Math.min(height-h-gap,cy)),right=left+w,bottom=top+h;if(obstacles.some(r=>left<r.right+gap&&right>r.left-gap&&top<r.bottom+gap&&bottom>r.top-gap))continue;const distance=(left+w/2-x)**2+(top+h/2-y)**2;if(distance<score){score=distance;best={left,top};}}
  if(!best){label.hidden=true;return;}
  const dx=best.left-x,dy=best.top-y,ex=Math.max(dx,Math.min(dx+w,0)),ey=Math.max(dy,Math.min(dy+h,0));label.style.setProperty('--moon-label-x',dx+'px');label.style.setProperty('--moon-label-y',dy+'px');label.style.setProperty('--moon-line-length',Math.hypot(ex,ey)+'px');label.style.setProperty('--moon-line-angle',Math.atan2(ey,ex)+'rad');
 }
 const routeLabels=['Start','End','Sampled route'].map(text=>{const el=document.createElement('div');el.className='terrain-route-label'+(text==='Sampled route'?' route-midpoint':'');el.textContent=text;el.hidden=true;container.append(el);return el;});
 const landscape=new THREE.Group();landscape.visible=false;scene.add(landscape);const overlay=new THREE.Group();landscape.add(overlay);
 const cinematicOverlay=new THREE.Group();cinematicOverlay.visible=false;scene.add(cinematicOverlay);
 const schematic=data=>data.screeningTerrain&&data.presentation==='cinematic'&&!!data.terrainGrid;
 const overlayPoint=(data,p,liftM=1)=>{
  const point=terrainPointToScene(p,data.site,{liftM});if(!schematic(data))return new THREE.Vector3(...point);
  const x=point[0]*2.5+14,z=point[2]*2.5+12;return new THREE.Vector3(x,cinematicHeight(x,z)+.16,z);
 };
 let cinematic=null,presentation='measured',lastInspection='';
 const siteRing=new THREE.Mesh(new THREE.RingGeometry(.55,.8,48),new THREE.MeshBasicMaterial({color:0x53cfff,side:THREE.DoubleSide}));siteRing.rotation.x=-Math.PI/2;landscape.add(siteRing);
 const sunMarker=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshBasicMaterial({color:0xffd694})),earthMarker=new THREE.Mesh(new THREE.SphereGeometry(.24,16,12),new THREE.MeshBasicMaterial({color:0x92b8ff}));landscape.add(sunMarker,earthMarker);
 let surface=null,terrainKey='',overlayKey='';
 function disposeChildren(group){for(const child of [...group.children]){child.geometry?.dispose();if(child.material)for(const material of Array.isArray(child.material)?child.material:[child.material])material.dispose();group.remove(child);}}
 function syntheticHeight(x,z){let y=.2*Math.sin(x*.31)*Math.cos(z*.27)+.1*Math.sin(x*1.8+z*.9);for(const [cx,cz,r,d] of [[0,-2,6,2.4],[11,5,3,1.2],[-10,8,3.2,1.1],[-10,-12,4,1.3],[11,-14,5,1.6]]){const q=Math.hypot(x-cx,z-cz)/r;y-=d*Math.exp(-Math.pow(q/.76,5));y+=d*.4*Math.exp(-Math.pow((q-1)/.13,2));}return y;}
 function buildSurface(data){
  const key=data.terrainGrid?data.site.id:'procedural';if(surface&&key===terrainKey)return;terrainKey=key;overlayKey='';
  if(surface){landscape.remove(surface);surface.geometry.dispose();surface.material.dispose();}
  const real=!!data.terrainGrid,geometry=new THREE.PlaneGeometry(real?80:160,real?80:160,real?160:384,real?160:384);geometry.rotateX(-Math.PI/2);const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),h=real?(sampleGrid(data.terrainGrid,'elevationM',x*10,-z*10)-data.site.surfaceElevationM)/10:syntheticHeight(x,z);positions.setY(i,h);}
  geometry.computeVertexNormals();surface=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x858585,roughness:1}));if(real)surface.rotation.y=data.site.lon*Math.PI/180;surface.castShadow=surface.receiveShadow=true;landscape.add(surface);
 }
 function renderPreview(previewCamera){const visible=celestial.group.visible,inspectionVisible=inspectionLight.visible;celestial.group.visible=false;inspectionLight.visible=false;try{renderer.render(scene,previewCamera);}finally{celestial.group.visible=visible;inspectionLight.visible=inspectionVisible;}}
 const previewCache=new Map();
 function moonOverview(data){
  const host=document.getElementById('terrain-preview');if(!host||typeof btoa!=='function')return;
  const key=`moon:${data.site.id}:${color.version}:${bump.version}`;let url=previewCache.get(key);
  if(!url){
   const w=160,h=160,target=new THREE.WebGLRenderTarget(w,h),c=new THREE.PerspectiveCamera(43,1,.1,200),cinematicVisible=cinematic?.group.visible;if(cinematic)cinematic.group.visible=false;
   c.position.set(3,-11,22);c.lookAt(0,0,0);const previous={schematic:cinematicOverlay.visible,globe:globe.visible,terrain:landscape.visible,light:light.position.clone(),intensity:light.intensity};
   pin.position.fromArray(lunarSiteToScene(data.site));halo.position.copy(pin.position);
   cinematicOverlay.visible=false;globe.visible=true;landscape.visible=false;light.position.set(15,-5,40);light.intensity=3.3;
   renderer.setRenderTarget(target);renderPreview(c);const pixels=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(target,0,0,w,h,pixels);renderer.setRenderTarget(null);target.dispose();
   cinematicOverlay.visible=previous.schematic;globe.visible=previous.globe;landscape.visible=previous.terrain;light.position.copy(previous.light);light.intensity=previous.intensity;
   if(cinematic)cinematic.group.visible=cinematicVisible;
   const bytes=new Uint8Array(54+w*h*3),v=new DataView(bytes.buffer);bytes[0]=66;bytes[1]=77;v.setUint32(2,bytes.length,true);v.setUint32(10,54,true);v.setUint32(14,40,true);v.setInt32(18,w,true);v.setInt32(22,h,true);v.setUint16(26,1,true);v.setUint16(28,24,true);
   for(let i=0;i<w*h;i++){bytes[54+i*3]=pixels[i*4+2];bytes[55+i*3]=pixels[i*4+1];bytes[56+i*3]=pixels[i*4];}
   let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);url='data:image/bmp;base64,'+btoa(binary);previewCache.set(key,url);if(previewCache.size>12)previewCache.delete(previewCache.keys().next().value);
  }
  host.classList.add('moon-overview');if(host.firstElementChild?.getAttribute('src')!==url){const img=document.createElement('img');img.src=url;img.alt='Moon overview with the selected lunar site marked';host.replaceChildren(img);}
  const button=host.closest('button');if(button){button.dataset.scene='moon';button.setAttribute('aria-label','Show Moon overview');}
 }
 function updateTerrainPreview(data){
  if(mode==='terrain'){moonOverview(data);return;}
  const host=document.getElementById('terrain-preview');if(!host||!data.terrainGrid||typeof btoa!=='function')return;
  host.classList.remove('moon-overview');const button=host.closest('button');if(button){button.dataset.scene='terrain';button.setAttribute('aria-label','Show source terrain preview');}
  let url=previewCache.get(data.site.id);
  if(!url){
   buildSurface(data);const w=160,h=100,target=new THREE.WebGLRenderTarget(w,h),previewCamera=new THREE.PerspectiveCamera(43,w/h,.1,200);
   previewCamera.position.set(-24,18,24);previewCamera.lookAt(0,0,0);
   const previous={globe:globe.visible,landscape:landscape.visible,overlay:overlay.visible,sun:sunMarker.visible,earth:earthMarker.visible,position:light.position.clone(),intensity:light.intensity};
   globe.visible=false;landscape.visible=true;overlay.visible=false;sunMarker.visible=earthMarker.visible=false;light.position.set(-15,20,20);light.intensity=3.5;
   renderer.setRenderTarget(target);renderPreview(previewCamera);const pixels=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(target,0,0,w,h,pixels);renderer.setRenderTarget(null);target.dispose();
   globe.visible=previous.globe;landscape.visible=previous.landscape;overlay.visible=previous.overlay;sunMarker.visible=previous.sun;earthMarker.visible=previous.earth;light.position.copy(previous.position);light.intensity=previous.intensity;
   // Small uncompressed BMP from the actual DEM render, without a second canvas.
   const bytes=new Uint8Array(54+w*h*3),view=new DataView(bytes.buffer);bytes[0]=66;bytes[1]=77;view.setUint32(2,bytes.length,true);view.setUint32(10,54,true);view.setUint32(14,40,true);view.setInt32(18,w,true);view.setInt32(22,h,true);view.setUint16(26,1,true);view.setUint16(28,24,true);
   for(let i=0;i<w*h;i++){bytes[54+i*3]=pixels[i*4+2];bytes[55+i*3]=pixels[i*4+1];bytes[56+i*3]=pixels[i*4];}
   let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);url='data:image/bmp;base64,'+btoa(binary);previewCache.set(data.site.id,url);if(previewCache.size>8)previewCache.delete(previewCache.keys().next().value);
  }
  if(host.firstElementChild?.getAttribute('src')!==url){const image=document.createElement('img');image.alt=displaySiteName(data.site)+' source DEM preview';image.src=url;host.replaceChildren(image);}
 }
 function buildOverlays(data){
  const config=data.terrainConfig||{radius:100,baseline:20,limit:12},flags=data.overlays||{footprint:true},key=JSON.stringify([data.site.id,config,flags,data.screeningTerrain,data.presentation,data.route?.status,data.route?.direction,data.route?.path?.length]);if(key===overlayKey)return;overlayKey=key;disposeChildren(overlay);disposeChildren(cinematicOverlay);const host=schematic(data)?cinematicOverlay:overlay;canvas.dataset.footprintRadiusM=String(config.radius);canvas.dataset.slopeCells='0';canvas.dataset.slopeDrawGroups='0';canvas.dataset.routeStatus=data.route?.status||'not_evaluated';canvas.dataset.routeNodes=String(data.route?.path?.length||0);canvas.dataset.overlayBasis=schematic(data)?'schematic-source-grid':'registered-source-dem';if(!data.terrainGrid)return;
  const height=(x,z)=>sampleGrid(data.terrainGrid,'elevationM',x,z),point=p=>overlayPoint(data,p);
  const line=(points,color)=>{if(points.length<2)return;const mesh=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(point)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.9}));host.add(mesh);return mesh;};
  if(flags.footprint){line(footprintBoundary(config.radius,height).filter(Boolean),0x9bc8f7);if(schematic(data)){const ring=new THREE.Mesh(new THREE.RingGeometry(.4,.6,48),new THREE.MeshBasicMaterial({color:0x8ce1ff,side:THREE.DoubleSide,depthTest:false}));ring.rotation.x=-Math.PI/2;ring.position.copy(point({x:0,z:0,h:height(0,0)}));ring.renderOrder=5;host.add(ring);}}
  if(flags.slope){
   let count=0;const buckets=new Map(),edges=[];
   for(const cell of data.terrainResult?.cells||[]){
    if(!Number.isFinite(cell.h))continue;const polygon=footprintCellPolygon(cell,config.radius/20,config.radius,height);if(polygon.length<3)continue;
    const color=!Number.isFinite(cell.slope)?0x858c94:cell.slope<=config.limit?0x46a9ec:0xe4ac43,vertices=buckets.get(color)||[];buckets.set(color,vertices);
    const points=polygon.map(p=>point(p).toArray());for(let i=1;i<points.length-1;i++)vertices.push(...points[0],...points[i],...points[i+1]);for(let i=0;i<points.length;i++)edges.push(...points[i],...points[(i+1)%points.length]);count++;
   }
   // Batch cells by classification; changing the footprint does not create hundreds of draw calls.
   const geometryFor=vertices=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));return g;};
   for(const [color,vertices] of buckets){const mesh=new THREE.Mesh(geometryFor(vertices),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.48,depthWrite:false,depthTest:!schematic(data)}));mesh.renderOrder=2;host.add(mesh);}
   if(edges.length){const lines=new THREE.LineSegments(geometryFor(edges),new THREE.LineBasicMaterial({color:0xbee6ff,transparent:true,opacity:.24,depthWrite:false,depthTest:!schematic(data)}));lines.renderOrder=3;host.add(lines);}canvas.dataset.slopeCells=String(count);canvas.dataset.slopeDrawGroups=String(buckets.size+(edges.length?1:0));
  }
  if(flags.route&&data.route?.status==='found'){
   const path=data.route.path.map(p=>({...p,h:height(p.x,p.z)})).filter(p=>Number.isFinite(p.h)),routeLine=line(path,0xf3f8ff);if(routeLine){routeLine.renderOrder=4;routeLine.material.depthTest=false;routeLine.material.depthWrite=false;}
   for(const p of path){const dot=new THREE.Mesh(new THREE.SphereGeometry(config.radius/(schematic(data)?640:1600),8,6),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));dot.position.copy(point(p));dot.renderOrder=5;host.add(dot);}
  }
 }
 function reset(){celestialFocus=null;const data=read(),art=mode==='terrain'&&data.presentation==='cinematic';yaw=mode==='moon'?.14:art?.18:-.5;pitch=mode==='moon'?-.46:art?(data.screeningTerrain?.9:.27):data.screeningTerrain?.85:.52;distance=mode==='moon'?25:art?(data.screeningTerrain?Math.min(220,Math.max(46,data.terrainConfig.radius*.78)):78):data.screeningTerrain?Math.max(24,data.terrainConfig.radius*.32):32;dirty++;}
 function focusCelestial(body){const data=read(),sky=data.celestial;if(!['sun','earth'].includes(body)||!Number.isFinite(sky?.[body+'Azimuth']))return;celestialFocus=body;const direction=dir(sky[body+'Azimuth'],sky[body+'Elevation'],1);yaw=Math.atan2(direction.x,direction.z)+Math.PI/2;pitch=data.presentation==='cinematic'?.27:.4;distance=Math.max(data.presentation==='cinematic'?90:40,(data.presentation==='cinematic'?34:18)/(Math.tan(camera.fov*Math.PI/360)*camera.aspect));canvas.dataset.celestialFocus=body;dirty++;}
 function setMode(next){if(!['moon','terrain'].includes(next))return;const changed=mode!==next;mode=next;if(document.body.classList.contains('ui1'))document.body.dataset.renderedScene=mode;globe.visible=mode==='moon';landscape.visible=mode==='terrain';light.castShadow=mode==='terrain';if(mode==='terrain')buildSurface(read());if(changed){reset();Object.assign(current,{yaw,pitch,distance});}dirty++;canvas.dispatchEvent(new CustomEvent('sitelight-scenechange',{bubbles:true}));}
 function zoom(delta){distance=THREE.MathUtils.clamp(distance+delta,mode==='moon'?23:14,read().screeningTerrain?220:65);dirty++;}
 let pointer=null;listen(canvas,'pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);});listen(canvas,'pointermove',e=>{if(pointer){yaw=pointer.yaw-(e.clientX-pointer.x)*.005;pitch=THREE.MathUtils.clamp(pointer.pitch+(e.clientY-pointer.y)*.003,mode==='moon'?-.8:.18,1.25);}});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,name,()=>pointer=null);
 listen(canvas,'wheel',e=>{e.preventDefault();zoom(e.deltaY*.022);},{passive:false});listen(canvas,'keydown',e=>{if(e.key==='ArrowLeft')yaw-=.12;else if(e.key==='ArrowRight')yaw+=.12;else if(e.key==='ArrowUp')pitch=Math.min(1.25,pitch+.08);else if(e.key==='ArrowDown')pitch=Math.max(mode==='moon'?-.8:.18,pitch-.08);else if(['+','='].includes(e.key))zoom(-2);else if(e.key==='-')zoom(2);else return;e.preventDefault();});
 listen(canvas,'webglcontextlost',e=>{e.preventDefault();lost=true;notify('3D graphics interrupted. Waiting for context recovery.');});listen(canvas,'webglcontextrestored',()=>{lost=false;dirty++;notify('3D graphics restored.');});
 const resizeObserver=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;if(w&&h){renderer.setDrawingBufferSize(w,h,Math.min(globalThis.devicePixelRatio||1,1.5,Math.sqrt(4000000/(w*h))));camera.aspect=w/h;camera.updateProjectionMatrix();dirty++;}});resizeObserver.observe(container);
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),dir=(az,el,r)=>new THREE.Vector3(Math.sin(az*Math.PI/180)*Math.cos(el*Math.PI/180),Math.sin(el*Math.PI/180),-Math.cos(az*Math.PI/180)*Math.cos(el*Math.PI/180)).multiplyScalar(r),projected=new THREE.Vector3(),towardCamera=new THREE.Vector3();
 function draw(){
  if(disposed)return;frameId=requestAnimationFrame(draw);if(!active||document.hidden||lost||!container.getClientRects().length)return;
  const data=read(),nextPresentation=data.presentation||'measured',inspectionKey=data.screeningTerrain?`${data.site.id}:${data.terrainConfig.radius}`:'';if(nextPresentation!==presentation||inspectionKey!==lastInspection){presentation=nextPresentation;lastInspection=inspectionKey;reset();Object.assign(current,{yaw,pitch,distance});dirty++;}
  const art=mode==='terrain'&&presentation==='cinematic';if(art&&!cinematic){cinematic=createCinematicTerrain();scene.add(cinematic.group);}
  if(cinematic){cinematic.group.visible=art;cinematic.pin.visible=!data.screeningTerrain;cinematic.setInspectionDetail(art&&data.screeningTerrain);}landscape.visible=mode==='terrain'&&!art;cinematicOverlay.visible=art&&data.screeningTerrain;
  if(document.body.classList.contains('ui1')){document.body.dataset.terrainPresentation=presentation;if(document.body.dataset.renderedScene!==mode)document.body.dataset.renderedScene=mode;}
  canvas.dataset.terrainPresentation=mode==='terrain'?presentation:'globe';
  const scope=document.getElementById('terrain-scope-label');if(scope)scope.textContent=art?'Cinematic terrain · schematic site pin':data.terrainGrid?'Source DEM · measured terrain':'Procedural demo · no measured DEM';
  const note=document.getElementById('viewport-note');if(note)note.textContent=mode==='moon'?'Moon maps: NASA SVS · artistic studio lighting':art?'Cinematic terrain and schematic site marker · illustrative geometry':data.terrainGrid?'NASA PGDA elevation grid · local measured patch':'Procedural demo · not a measured site';
  const badge=document.getElementById('scene-data-label');if(badge&&mode==='terrain')badge.textContent=art?'Cinematic terrain · illustrative':data.terrainGrid?'Real NASA DEM · local patch':'Procedural surface · visual only';
  document.querySelectorAll('[data-terrain-presentation]').forEach(b=>{if(b.tagName==='BUTTON'){b.setAttribute('aria-pressed',String(b.dataset.terrainPresentation===presentation));b.disabled=b.dataset.terrainPresentation==='measured'&&!data.terrainGrid;}});
  updateTerrainPreview(data);if(mode==='terrain'&&(!art||data.screeningTerrain)){if(!art)buildSurface(data);buildOverlays(data);const h=data.terrainGrid?sampleGrid(data.terrainGrid,'elevationM',0,0):NaN;siteRing.visible=Number.isFinite(h);if(siteRing.visible)siteRing.position.fromArray(terrainPointToScene({x:0,z:0,h},data.site,{liftM:1}));}
  for(const [key,value] of Object.entries({yaw,pitch,distance}))current[key]+=(value-current[key])*(motion.matches?1:.14);
  const settingsOpen=!!document.getElementById('mission-settings')?.open;
  const signature=[mode,presentation,settingsOpen,data.showCelestial,dirty,...Object.values(current).map(v=>v.toFixed(4)),data.hour.toFixed(3),data.site.lat,data.site.lon,data.geometry?.sunElevation].join(';');if(signature===last)return;last=signature;
  const offset=settingsOpen&&mode==='terrain'?(art?4:8):0;if(camera.filmOffset!==offset){camera.filmOffset=offset;camera.updateProjectionMatrix();}
  if(settingsOpen&&mode==='moon'){const w=container.clientWidth,h=container.clientHeight;camera.setViewOffset(w,h,w*.31,-h*.15,w,h);}else if(camera.view?.enabled)camera.clearViewOffset();
  const d=current.distance*(mode==='moon'?Math.max(1,.78/camera.aspect)*(settingsOpen?2.1:1):1),target=schematic(data)?new THREE.Vector3(2,0,12):new THREE.Vector3(0,mode==='moon'?0:-.2,0);if(mode==='terrain'&&celestialFocus&&Number.isFinite(data.celestial?.[celestialFocus+'Azimuth']))target.addScaledVector(dir(data.celestial[celestialFocus+'Azimuth'],data.celestial[celestialFocus+'Elevation'],art?34:18),.55);camera.position.set(Math.sin(current.yaw)*Math.cos(current.pitch)*d+target.x,Math.sin(current.pitch)*d+target.y,Math.cos(current.yaw)*Math.cos(current.pitch)*d+target.z);camera.lookAt(target);camera.updateMatrixWorld();
  pin.position.fromArray(lunarSiteToScene(data.site));halo.position.copy(pin.position);
  towardCamera.copy(camera.position).sub(pin.position);label.hidden=mode!=='moon'||pin.position.dot(towardCamera)<=0;
  labelName.textContent=displaySiteName(data.site);labelCoordinate.textContent=coordinateText(data.site);
  if(!label.hidden){projected.copy(pin.position).project(camera);const x=(projected.x+1)/2*container.clientWidth,y=(-projected.y+1)/2*container.clientHeight;label.style.left=x+'px';label.style.top=y+'px';label.hidden=Math.abs(projected.x)>1||Math.abs(projected.y)>1||projected.z>1;if(!label.hidden)placeMoonLabel(x,y);}
  const marker=mode==='moon'?pin:art?(schematic(data)?{position:overlayPoint(data,{x:0,z:0,h:sampleGrid(data.terrainGrid,'elevationM',0,0)})}:cinematic.pin):siteRing;canvas.dataset.siteId=data.site.id;canvas.dataset.markerPosition=JSON.stringify(marker.position.toArray());canvas.dataset.markerBasis=mode==='moon'?'lunar-coordinate':art?'schematic':'source-dem-center';label.dataset.siteId=data.site.id;label.title=displaySiteName(data.site)+' · '+coordinateText(data.site,4)+(art?' · Schematic position':'');
  if(mode==='terrain'){projected.copy(marker.position).project(camera);label.hidden=Math.abs(projected.x)>1||Math.abs(projected.y)>1||projected.z>1;label.style.left=((projected.x+1)/2*container.clientWidth)+'px';label.style.top=((-projected.y+1)/2*container.clientHeight)+'px';}
  for(let i=0;i<routeLabels.length;i++){const el=routeLabels[i],path=data.route?.path;el.hidden=!data.screeningTerrain||!data.overlays.route||data.route?.status!=='found'||!path?.length;if(!el.hidden){const node=i===0?path[0]:i===1?path.at(-1):path[Math.floor(path.length/2)];projected.copy(overlayPoint(data,node,2)).project(camera);el.hidden=Math.abs(projected.x)>1||Math.abs(projected.y)>1||projected.z>1;el.style.left=((projected.x+1)/2*container.clientWidth)+'px';el.style.top=((-projected.y+1)/2*container.clientHeight)+'px';}}
  if(data.screeningTerrain){
   const groundHeight=data.terrainGrid?(sampleGrid(data.terrainGrid,'elevationM',0,0)-data.site.surfaceElevationM)/10:0,center=new THREE.Vector3(0,groundHeight,0).project(camera),north=new THREE.Vector3(0,groundHeight,-1).project(camera),arrow=document.getElementById('terrain-compass-arrow');if(arrow)arrow.style.transform=`rotate(${Math.atan2(north.x-center.x,north.y-center.y)*180/Math.PI}deg)`;
   const metres=data.terrainConfig.radius<=100?50:data.terrainConfig.radius<=200?100:200,edge=new THREE.Vector3(Math.cos(current.yaw)*metres/10,groundHeight,-Math.sin(current.yaw)*metres/10).project(camera),pixels=Math.abs(edge.x-center.x)*container.clientWidth/2,bar=document.getElementById('terrain-scale-line'),text=document.getElementById('terrain-scale-text');if(bar){bar.style.width=pixels+'px';bar.hidden=schematic(data);}if(text)text.textContent=schematic(data)?'Schematic view; analysis radius '+data.terrainConfig.radius+' m':metres+' m · source grid';
  }
  sunMarker.visible=earthMarker.visible=false;
  if(art){light.position.set(-32,24,20);light.intensity=3.8;ambient.intensity=.17;light.castShadow=true;}else if(data.screeningTerrain){light.position.set(-25,40,28);light.intensity=3.1;ambient.intensity=.42;light.castShadow=true;}else if(mode==='terrain'&&data.geometry){const g=data.geometry;ambient.intensity=.07;light.position.copy(dir(g.sunAzimuth,g.sunElevation,70));light.intensity=3.8;sunMarker.position.copy(dir(g.sunAzimuth,g.sunElevation,20));earthMarker.position.copy(dir(g.earthAzimuth,g.earthElevation,20));}else{ambient.intensity=.07;light.position.set(30,10,24);light.intensity=3.3;}
  const sky=data.celestial,showSky=mode==='terrain'&&data.exploring;
  celestial.update({enabled:data.showCelestial!==false,shown:showSky,sky,anchor:marker.position.toArray(),camera,radius:art?34:18,settingsOpen,assessmentMode:data.assessmentMode});
  canvas.dataset.celestialGuides=String(celestial.group.visible);
  canvas.dataset.sunRays=String(showSky&&data.showCelestial!==false&&!settingsOpen&&sky?.lit===true);
  canvas.dataset.earthSightline=String(showSky&&data.showCelestial!==false&&!settingsOpen&&sky?.earth===true);
  canvas.dataset.sunDirection=JSON.stringify([sky?.sunAzimuth??null,sky?.sunElevation??null]);
  canvas.dataset.earthDirection=JSON.stringify([sky?.earthAzimuth??null,sky?.earthElevation??null]);
  inspectionLight.intensity=0;
  if(showSky){
   const center=marker.position,solarEffects=data.showCelestial!==false&&sky&&Number.isFinite(sky.sunAzimuth)&&Number.isFinite(sky.sunElevation),sunlit=solarEffects&&sky.lit===true;
   if(solarEffects){light.position.copy(center).add(dir(sky.sunAzimuth,sky.sunElevation,70));light.target.position.copy(center);light.intensity=sunlit?3.8:0;light.castShadow=true;}else light.intensity=0;
   // An oblique camera-relative light reveals crater walls and surface normals.
   // This is inspection lighting, never an input to scientific visibility.
   inspectionLight.position.copy(center).add(new THREE.Vector3(Math.sin(current.yaw-1.05)*38,32,Math.cos(current.yaw-1.05)*38));inspectionLight.target.position.copy(center);inspectionLight.intensity=sunlit?.55:3.2;ambient.intensity=sunlit?.23:.3;
  }else light.target.position.set(0,0,0);
  canvas.dataset.inspectionLighting=String(showSky);canvas.dataset.inspectionIntensity=String(inspectionLight.intensity);
  renderer.render(scene,camera);
 }
 let api;
 const comparisonImages=new Map();
 function comparisonPreview(preset='compare'){
  let comparisonImage=comparisonImages.get(preset);
  if(comparisonImage||lost||disposed||typeof btoa!=='function')return comparisonImage;
  if(!cinematic){cinematic=createCinematicTerrain();scene.add(cinematic.group);}
  const previous={schematic:cinematicOverlay.visible,globe:globe.visible,terrain:landscape.visible,art:cinematic.group.visible,pin:cinematic.pin.visible,light:light.position.clone(),intensity:light.intensity,ambient:ambient.intensity,shadow:light.castShadow};
  const background=preset==='logistics',w=background?1600:768,h=background?960:384,target=new THREE.WebGLRenderTarget(w,h),c=new THREE.PerspectiveCamera(43,w/h,.1,600);
  if(background){cinematic.setInspectionDetail(true);c.position.set(0,16,75);c.lookAt(-8,-26,-40);}else{c.position.set(15,25,70);c.lookAt(-12,-1,-5);}cinematicOverlay.visible=false;globe.visible=landscape.visible=false;cinematic.group.visible=true;cinematic.pin.visible=false;light.position.set(-32,24,20);light.intensity=3.8;ambient.intensity=.17;light.castShadow=true;
  try{
   renderer.setRenderTarget(target);renderPreview(c);const pixels=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(target,0,0,w,h,pixels);
   const bytes=new Uint8Array(54+w*h*3),v=new DataView(bytes.buffer);bytes[0]=66;bytes[1]=77;v.setUint32(2,bytes.length,true);v.setUint32(10,54,true);v.setUint32(14,40,true);v.setInt32(18,w,true);v.setInt32(22,h,true);v.setUint16(26,1,true);v.setUint16(28,24,true);
   for(let i=0;i<w*h;i++){bytes[54+i*3]=pixels[i*4+2];bytes[55+i*3]=pixels[i*4+1];bytes[56+i*3]=pixels[i*4];}
   if(typeof URL?.createObjectURL==='function'&&typeof Blob==='function')comparisonImage=URL.createObjectURL(new Blob([bytes],{type:'image/bmp'}));else{let binary='';for(let offset=0;offset<bytes.length;offset+=8192)binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));comparisonImage='data:image/bmp;base64,'+btoa(binary);}
  }finally{renderer.setRenderTarget(null);target.dispose();if(background){const data=read();cinematic.setInspectionDetail(data.screeningTerrain&&data.presentation==='cinematic');}cinematicOverlay.visible=previous.schematic;globe.visible=previous.globe;landscape.visible=previous.terrain;cinematic.group.visible=previous.art;cinematic.pin.visible=previous.pin;light.position.copy(previous.light);light.intensity=previous.intensity;ambient.intensity=previous.ambient;light.castShadow=previous.shadow;dirty++;}
  comparisonImages.set(preset,comparisonImage);return comparisonImage;
 }
 if(typeof globalThis.addEventListener==='function'){listen(globalThis,'pagehide',e=>{if(!e.persisted)api?.dispose();else active=false;});listen(globalThis,'pageshow',e=>{if(e.persisted){active=true;dirty++;}});}
 draw();api={setMode,reset,zoom,comparisonPreview,setActive(value){active=!!value;dirty++;},update(){dirty++;},dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frameId);for(const [target,name,fn,options] of listeners)target.removeEventListener(name,fn,options);resizeObserver.disconnect();scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});color.dispose();bump.dispose();for(const url of comparisonImages.values())if(url?.startsWith('blob:'))URL.revokeObjectURL(url);comparisonImages.clear();cinematic?.disposeInactiveGeometry();renderer.dispose();renderer.forceContextLoss();celestial.dispose();label.remove();routeLabels.forEach(el=>el.remove());canvas.remove();}};return api;
}
