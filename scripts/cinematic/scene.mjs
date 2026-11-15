import * as THREE from 'three';

// Rendering only. This module never evaluates a scientific mission requirement.
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export function lightDirection(azimuth, elevation) {
  const a = azimuth * Math.PI / 180, e = elevation * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}
export function orbitPosition(c, target = [0, 0, 0]) {
  return [target[0] + Math.sin(c.yaw) * Math.cos(c.pitch) * c.distance,
    target[1] + Math.sin(c.pitch) * c.distance,
    target[2] + Math.cos(c.yaw) * Math.cos(c.pitch) * c.distance];
}
export function seededRandom(seed = 7291) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

export function createStudio({canvas, sites, height, sample, reduced, onMessage, assets}) {
  const gpu = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'low-power'});
  gpu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  gpu.outputColorSpace = THREE.SRGBColorSpace;
  gpu.toneMapping = THREE.ACESFilmicToneMapping;
  gpu.toneMappingExposure = 1.12;
  gpu.shadowMap.enabled = true;
  gpu.shadowMap.type = THREE.PCFShadowMap;
  gpu.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const view = new THREE.PerspectiveCamera(42, 1, .1, 240);
  const camera = {yaw:.13, pitch:.12, distance:38, tx:0, tz:-1};
  const smooth = {...camera}, velocity = Object.fromEntries(Object.keys(camera).map(k=>[k,0]));
  const globeGroup = new THREE.Group(), terrainGroup = new THREE.Group();
  scene.add(globeGroup, terrainGroup);
  terrainGroup.visible = false;
  let mode = 'moon', revision = 0, signature = '', lost = false, textureFailures = 0;
  const sun = new THREE.DirectionalLight(0xfff5e8, 3.6);
  sun.position.set(-26, 12, 30);
  sun.castShadow = false;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera, {left:-43,right:43,top:43,bottom:-43,near:1,far:180});
  sun.shadow.bias = -.00012;
  sun.shadow.normalBias = .025;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
  // A very dim studio fill preserves readability; no lunar atmosphere is modeled.
  const fill = new THREE.AmbientLight(0xb9c4d5,.045);
  scene.add(fill);
  const loader = new THREE.TextureLoader();
  function loadTexture(url, color = false) {
    const texture = loader.load(url,()=>{revision++;},undefined,()=>{
      textureFailures++; revision++;
      onMessage('A Moon texture could not load. Showing an incomplete visual preview.');
      document.getElementById('visual-credit').textContent='Moon texture unavailable · visual preview incomplete';
    });
    if(color) texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(gpu.capabilities.getMaxAnisotropy(),8);
    return texture;
  }
  const moonMaterial = new THREE.MeshStandardMaterial({
    map:loadTexture(assets.color,true), bumpMap:loadTexture(assets.height), bumpScale:.075,
    roughness:1,metalness:0,color:0xe8e8e8
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9.2,160,96),moonMaterial);
  // Art direction, not a SPICE attitude or a georeferenced mission camera.
  moon.rotation.y=-Math.PI/2;
  moon.rotation.z=.055;
  globeGroup.add(moon);

  let surfaceBuilt=false, surfaceMaterial, surfaceMesh;
  const rings=[];
  function buildSurface() {
    if(surfaceBuilt)return;
    const geo=new THREE.PlaneGeometry(80,80,256,256);
    geo.rotateX(-Math.PI/2);
    const p=geo.attributes.position, colors=new Float32Array(p.count*3), color=new THREE.Color();
    const rng=seededRandom(812);
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i),y=height(x,z);
      p.setY(i,y);
      color.setScalar(.55 + rng()*.045 + Math.min(.025,Math.max(-.05,y*.008)));
      color.toArray(colors,i*3);
    }
    geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    geo.computeVertexNormals();geo.computeBoundingSphere();
    const tile=document.createElement('canvas');tile.width=tile.height=512;
    const ctx=tile.getContext('2d'), pixels=ctx.createImageData(512,512), random=seededRandom(71);
    for(let i=0;i<pixels.data.length;i+=4){
      const g=Math.round(125+random()*62);
      pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=g;pixels.data[i+3]=255;
    }
    ctx.putImageData(pixels,0,0);
    const grain=new THREE.CanvasTexture(tile);
    grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(34,34);
    grain.anisotropy=Math.min(8,gpu.capabilities.getMaxAnisotropy());
    surfaceMaterial=new THREE.MeshStandardMaterial({color:0xdddddf,vertexColors:true,roughness:1,
      metalness:0,bumpMap:grain,bumpScale:.022});
    surfaceMesh=new THREE.Mesh(geo,surfaceMaterial);
    surfaceMesh.castShadow=surfaceMesh.receiveShadow=true;
    terrainGroup.add(surfaceMesh);
    // Extend the landscape beyond the detailed patch without a visible square edge.
    const outer=new THREE.PlaneGeometry(480,480,192,192);outer.rotateX(-Math.PI/2);
    const op=outer.attributes.position,ouv=outer.attributes.uv,oc=new Float32Array(op.count*3);
    for(let i=0;i<op.count;i++){
      const x=op.getX(i),z=op.getZ(i);op.setY(i,height(x,z));
      ouv.setXY(i,(x+40)/80,(40-z)/80);color.setScalar(.57);color.toArray(oc,i*3);
    }
    const oi=outer.index.array,kept=[];
    for(let i=0;i<oi.length;i+=3){
      const x=(op.getX(oi[i])+op.getX(oi[i+1])+op.getX(oi[i+2]))/3;
      const z=(op.getZ(oi[i])+op.getZ(oi[i+1])+op.getZ(oi[i+2]))/3;
      if(Math.abs(x)>=40||Math.abs(z)>=40)kept.push(oi[i],oi[i+1],oi[i+2]);
    }
    outer.setIndex(kept);outer.setAttribute('color',new THREE.BufferAttribute(oc,3));outer.computeVertexNormals();
    const landscape=new THREE.Mesh(outer,surfaceMaterial);landscape.receiveShadow=true;terrainGroup.add(landscape);
    // Small deterministic rocks add scale. Their positions are wholly procedural.
    const rockGeo=new THREE.IcosahedronGeometry(1,1);
    const rockMat=new THREE.MeshStandardMaterial({color:0x777779,roughness:1,metalness:0});
    const rocks=new THREE.InstancedMesh(rockGeo,rockMat,420),dummy=new THREE.Object3D();
    for(let i=0;i<420;i++){
      const x=(rng()-.5)*66,z=(rng()-.5)*66,s=.025+Math.pow(rng(),3)*.25;
      dummy.position.set(x,height(x,z)+s*.28,z);
      dummy.rotation.set(rng()*2,rng()*6.28,rng());dummy.scale.set(s,s*(.45+rng()*.4),s*(.6+rng()*.6));
      dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
    }
    rocks.castShadow=rocks.receiveShadow=true;rocks.computeBoundingSphere();terrainGroup.add(rocks);
    for(const site of sites){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.012,8,64),new THREE.MeshBasicMaterial({color:0xb7d3ea,transparent:true,opacity:.85}));
      ring.rotation.x=-Math.PI/2;ring.position.set(site.x,height(site.x,site.z)+.13,site.z);
      terrainGroup.add(ring);rings.push(ring);
    }
    surfaceBuilt=true;
  }
  const direction=new THREE.Vector3(-.7,.3,.7).normalize(), point=new THREE.Vector3();
  const toward=new THREE.Vector3();
  function hideMarkers(){sites.forEach((_,i)=>{document.getElementById('marker-'+i).hidden=true;});}
  function setMode(next){
    if(!['moon','terrain'].includes(next))return;
    mode=next;
    if(mode==='terrain')buildSurface();
    globeGroup.visible=mode==='moon';terrainGroup.visible=mode==='terrain';sun.castShadow=mode==='terrain';
    Object.assign(camera, mode==='moon'?{yaw:.13,pitch:.12,distance:38,tx:0,tz:-1}:{yaw:-.44,pitch:.54,distance:38,tx:0,tz:-1});
    Object.assign(smooth,camera);Object.keys(velocity).forEach(k=>velocity[k]=0);
    document.body.dataset.scene=mode;
    for(const name of ['moon','terrain'])document.getElementById('scene-'+name).setAttribute('aria-pressed',String(name===mode));
    document.querySelector('.terrain-label').textContent=mode==='moon'?'NASA visual maps · artistic orientation':'Procedural crater terrain · not a real landing site';
    if(!textureFailures)document.getElementById('visual-credit').textContent=mode==='moon'?'Moon maps: NASA’s Scientific Visualization Studio':'Sun direction: sample model · terrain: procedural';
    hideMarkers();revision++;
  }
  for(const name of ['moon','terrain'])document.getElementById('scene-'+name).addEventListener('click',()=>setMode(name));
  document.getElementById('cinematic-panels').addEventListener('click',()=>{
    const button=document.getElementById('cinematic-panels'),shown=document.body.dataset.panels!=='hidden';
    document.body.dataset.panels=shown?'hidden':'shown';button.setAttribute('aria-expanded',String(!shown));
    button.textContent=shown?'Show planning':'Hide planning';
  });
  let pointer=null;
  canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,yaw:camera.yaw,pitch:camera.pitch};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    if(!pointer)return;
    camera.yaw=pointer.yaw-(e.clientX-pointer.x)*.005;
    camera.pitch=clamp(pointer.pitch+(e.clientY-pointer.y)*.003,mode==='moon'?-.9:.16,1.2);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>pointer=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();camera.distance=clamp(camera.distance+e.deltaY*.025,mode==='moon'?24:16,65);},{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft')camera.yaw-=.15;
    else if(e.key==='ArrowRight')camera.yaw+=.15;
    else if(e.key==='ArrowUp')camera.pitch=clamp(camera.pitch+.1,mode==='moon'?-.9:.16,1.2);
    else if(e.key==='ArrowDown')camera.pitch=clamp(camera.pitch-.1,mode==='moon'?-.9:.16,1.2);
    else if(e.key==='+'||e.key==='=')camera.distance=clamp(camera.distance-3,mode==='moon'?24:16,65);
    else if(e.key==='-')camera.distance=clamp(camera.distance+3,16,65);
    else return;e.preventDefault();
  });
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;onMessage('3D view interrupted. Waiting for the graphics context to restore.');});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;revision++;});
  function resize(){
    const w=window.innerWidth,h=window.innerHeight;
    gpu.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));gpu.setSize(w,h,false);
    view.aspect=w/h;view.updateProjectionMatrix();revision++;
  }
  window.addEventListener('resize',resize);
  resize();setMode('moon');
  function draw(dt){
    if(lost)return;
    const s=sample(),g=s.geometry;
    camera.distance=clamp(camera.distance,mode==='moon'?24:16,65);
    for(const k of Object.keys(camera)){
      if(reduced()){smooth[k]=camera[k];velocity[k]=0;}
      else{velocity[k]+=(camera[k]-smooth[k])*95*dt;velocity[k]*=Math.exp(-18*dt);smooth[k]+=velocity[k]*dt;}
    }
    const target=mode==='moon'?[0,0,0]:[smooth.tx,-.1,smooth.tz-2];
    const orbit=mode==='moon'?{...smooth,distance:smooth.distance*Math.max(1,.82/view.aspect)}:smooth;
    view.position.fromArray(orbitPosition(orbit,target));view.lookAt(...target);view.updateMatrixWorld();
    // Global studio lighting is artistic. Only the procedural surface uses the sample local Sun angles.
    const desired=mode==='moon'?[-.72+Math.sin(s.hour/168*Math.PI)*.18,.3,.8]:lightDirection(g.sunAzimuth,g.sunElevation);
    direction.lerp(toward.fromArray(desired),reduced()?1:Math.min(1,dt*4)).normalize();
    sun.position.copy(direction).multiplyScalar(72);sun.target.position.set(0,0,0);
    sun.intensity=mode==='moon'?3.6:(direction.y>0?3.8:0);
    fill.intensity=mode==='moon'?.045:.075;
    if(surfaceBuilt){
      // Color tint is an illustrative overlay, not a calculated visibility raster.
      surfaceMaterial.color.set(s.layer===1?0xe2d1b1:s.layer===2?0xb9cfe3:0xdddddf);
      rings.forEach((ring,i)=>{ring.material.opacity=i===s.site ? .95 : .3;});
    }
    const next=[mode,revision,s.layer,s.site,...Object.values(smooth),...direction.toArray()].map(v=>typeof v==='number'?v.toFixed(4):v).join(';');
    if(next===signature)return;signature=next;
    gpu.render(scene,view);
    if(mode==='terrain'){
      const w=window.innerWidth,h=window.innerHeight;
      sites.forEach((site,i)=>{
        const el=document.getElementById('marker-'+i);
        point.set(site.x,height(site.x,site.z)+.45,site.z);
        // Cheap artistic marker occlusion; independent of the mission horizon evaluator.
        let occluded=false;
        for(let j=1;j<=48;j++){
          const t=j/49,x=point.x+(view.position.x-point.x)*t,z=point.z+(view.position.z-point.z)*t;
          const y=point.y+(view.position.y-point.y)*t;
          if(Math.abs(x)<40&&Math.abs(z)<40&&height(x,z)>y+.06){occluded=true;break;}
        }
        point.project(view);
        el.hidden=occluded||Math.abs(point.x)>.94||Math.abs(point.y)>.8||point.z>1||point.z< -1;
        if(!el.hidden){el.style.left=((point.x+1)/2*w)+'px';el.style.top=((-point.y+1)/2*h)+'px';}
      });
    }else hideMarkers();
  }
  return {camera,draw,resize,setMode,get mode(){return mode;},get diagnostics(){return {mode,textureFailures,webgl:2};}};
}
