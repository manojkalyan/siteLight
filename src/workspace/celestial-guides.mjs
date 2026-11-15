import * as THREE from 'three';
import {enuDirectionToScene} from './viewport-geometry.mjs';

// Visual direction cues only. Visibility comes from the existing evaluator.
export function createCelestialGuides(container,{onLocate=()=>{},onLayout=()=>{}}={}){
 const group=new THREE.Group();group.visible=false;
 const sun=new THREE.Mesh(new THREE.SphereGeometry(.48,24,16),new THREE.MeshBasicMaterial({color:0xffdf8c}));
 const earth=new THREE.Mesh(new THREE.SphereGeometry(.48,24,16),new THREE.MeshBasicMaterial({color:0x78b9ef}));
 const earthBand=new THREE.Mesh(new THREE.TorusGeometry(.43,.065,8,40),new THREE.MeshBasicMaterial({color:0xd2e9f9}));earthBand.rotation.x=.8;earth.add(earthBand);
 const glow=new THREE.Mesh(new THREE.SphereGeometry(.76,16,12),new THREE.MeshBasicMaterial({color:0xffb74e,transparent:true,opacity:.13,depthWrite:false}));sun.add(glow);group.add(sun,earth);
 const rays=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffce72,transparent:true,opacity:.5,depthWrite:false}));group.add(rays);
 const link=new THREE.LineDashedMaterial({color:0x86beff,dashSize:.65,gapSize:.4,transparent:true,opacity:.75,depthWrite:false});
 const earthLine=new THREE.Line(new THREE.BufferGeometry(),link);group.add(earthLine);
 const arrows=[new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(),3,0xffd27b,.8,.42),new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),3,0x92c8ff,.8,.42)];group.add(...arrows);
 const panel=document.createElement('section');panel.className='celestial-panel';panel.hidden=true;panel.setAttribute('aria-label','Sun and Earth direction guide');
 panel.innerHTML='<div class="celestial-toolbar"><button type="button" data-celestial-locate="sun" aria-label="Locate Sun in terrain"><span class="celestial-body-icon sun" aria-hidden="true">☀</span><span><b>Sun</b><small data-celestial-brief="sun">Loading…</small></span><span class="celestial-locate-icon" aria-hidden="true">⌖</span></button><button type="button" data-celestial-locate="earth" aria-label="Locate Earth in terrain"><span class="celestial-body-icon earth" aria-hidden="true">◉</span><span><b>Earth</b><small data-celestial-brief="earth">Loading…</small></span><span class="celestial-locate-icon" aria-hidden="true">⌖</span></button><label class="celestial-effects"><input type="checkbox" data-celestial-toggle checked/><span>Light effects</span></label><button type="button" class="celestial-info" aria-label="Sun and Earth details" aria-expanded="false" aria-controls="celestial-details">ⓘ</button></div><small class="celestial-view-note" hidden>Inspection lighting keeps shadowed terrain visible.</small><div id="celestial-details" hidden><div class="celestial-readouts"><div><b>Sun</b><output data-celestial-readout="sun"></output><small data-celestial-status="sun"></small></div><div><b>Earth</b><output data-celestial-readout="earth"></output><small data-celestial-status="earth"></small></div></div><p></p></div><span class="celestial-feedback" aria-live="polite"></span>';
 container.append(panel);
 for(const button of panel.querySelectorAll('[data-celestial-locate]')){const name=button.dataset.celestialLocate==='sun'?'Sun':'Earth';button.querySelector('b').textContent='Find '+name;button.title='Bring '+name+' direction into view';}
 const info=panel.querySelector('.celestial-info'),details=panel.querySelector('#celestial-details');
 const toggleDetails=()=>{details.hidden=!details.hidden;info.setAttribute('aria-expanded',String(!details.hidden));onLayout();};info.addEventListener('click',toggleDetails);
 const locate=event=>{const button=event.target.closest('[data-celestial-locate]');if(button&&!button.disabled){const check=panel.querySelector('[data-celestial-toggle]');if(!check.checked){check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));}onLocate(button.dataset.celestialLocate);panel.querySelector('.celestial-feedback').textContent=`Following ${button.dataset.celestialLocate==='sun'?'Sun':'Earth'} direction. Drag the terrain to explore.`;}};panel.addEventListener('click',locate);
 const labels=['Sun','Earth'].map((name,i)=>{const label=document.createElement('div');label.className='celestial-direction-label '+name.toLowerCase();label.hidden=true;label.innerHTML=`<span aria-hidden="true">${i?'◉':'☀'}</span> ${name}<small></small>`;container.append(label);return label;});
 const readouts=['sun','earth'].map(k=>panel.querySelector(`[data-celestial-readout="${k}"]`)),statuses=['sun','earth'].map(k=>panel.querySelector(`[data-celestial-status="${k}"]`));
 const basis=new THREE.Vector3(),perp=new THREE.Vector3(),point=new THREE.Vector3();let rayKey='',linkKey='',readoutKey='';
 function setLine(object,points){const old=object.geometry;object.geometry=new THREE.BufferGeometry().setFromPoints(points);old.dispose();}
 function placeLabel(label,containerRect,occupied){
  // Avoid complete rendered label bounds, including its upward CSS transform.
  const r=label.getBoundingClientRect(),gap=12,left=Math.max(containerRect.left,0)+gap,top=Math.max(containerRect.top,0)+gap,right=Math.min(containerRect.right,innerWidth)-gap,bottom=Math.min(containerRect.bottom,innerHeight)-gap;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),overlaps=(a,b)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
  const xs=[r.left],ys=[r.top];
  for(const b of occupied){xs.push(b.left-r.width-gap,b.right+gap);ys.push(b.top-r.height-gap,b.bottom+gap);}
  let best=null,score=Infinity;
  for(const px of xs)for(const py of ys){const x=clamp(px,left,right-r.width),y=clamp(py,top,bottom-r.height),box={left:x,top:y,right:x+r.width,bottom:y+r.height};if(occupied.some(b=>overlaps(box,b)))continue;const distance=(x-r.left)**2+(y-r.top)**2;if(distance<score){score=distance;best=box;}}
  if(best){const style=getComputedStyle(label);label.style.left=(parseFloat(style.left)+(best.left-r.left)*container.clientWidth/containerRect.width)+'px';label.style.top=(parseFloat(style.top)+(best.top-r.top)*container.clientHeight/containerRect.height)+'px';occupied.push(best);}
  else occupied.push(r);
 }
 function update({enabled,shown,sky,anchor,camera,radius,settingsOpen,assessmentMode}){
  panel.hidden=!shown||settingsOpen;
  const valid=!!sky&&['sunAzimuth','sunElevation','earthAzimuth','earthElevation'].every(k=>Number.isFinite(sky[k]));
  group.visible=shown&&enabled&&valid&&!settingsOpen;
  const check=panel.querySelector('[data-celestial-toggle]');if(check.checked!==enabled)check.checked=enabled;
  labels.forEach(l=>l.hidden=true);
  if(!shown)return;
  panel.querySelector('.celestial-view-note').hidden=sky?.lit===true;
  const key=JSON.stringify([assessmentMode,valid,sky?.sunAzimuth,sky?.sunElevation,sky?.earthAzimuth,sky?.earthElevation,sky?.lit,sky?.eligible,sky?.earth]);
  if(key!==readoutKey){readoutKey=key;
   panel.querySelector('p').textContent=(assessmentMode==='sample'?'Synthetic demo. ':assessmentMode==='horizons'?'JPL reference · tangent horizon. ':'')+'Click Sun or Earth to find its direction. Move the timeline to see changes. Symbols and rays are illustrative. Neutral inspection lighting keeps terrain readable, including when the Sun is blocked. It is not a simulation of surface brightness.';
   for(const [i,k] of ['sun','earth'].entries())readouts[i].textContent=valid?`Az ${sky[k+'Azimuth'].toFixed(1)}° · El ${sky[k+'Elevation'].toFixed(1)}°`:'No loaded direction';
   statuses[0].textContent=!valid||sky.lit===null?'Visibility unavailable':sky.lit?(sky.eligible?'Sunlight reaches site':'Visible · below solar requirement'):'Sun blocked by terrain horizon';
   statuses[1].textContent=!valid||sky.earth===null?'Visibility unavailable':sky.earth?'Earth above terrain horizon':'Earth blocked by terrain horizon';
   panel.dataset.sunVisible=String(sky?.lit??'unknown');panel.dataset.earthVisible=String(sky?.earth??'unknown');
   panel.querySelector('[data-celestial-brief="sun"]').textContent=!valid||sky.lit===null?'No data':sky.lit?(sky.eligible?'Sunlight reaches site':'Below solar limit'):'Blocked by terrain';
   panel.querySelector('[data-celestial-brief="earth"]').textContent=!valid||sky.earth===null?'No data':sky.earth?'Visible from site':'Blocked by terrain';
   panel.querySelectorAll('[data-celestial-locate]').forEach(button=>button.disabled=!valid);
  }
  const containerRect=container.getBoundingClientRect();
  const occupied=[...document.querySelectorAll('.mission-panel,.result-panel,.horizon-drawer,.timeline')].filter(el=>el.getClientRects().length&&!el.hidden&&getComputedStyle(el).visibility!=='hidden').map(el=>el.getBoundingClientRect()).filter(r=>r.right>containerRect.left&&r.left<containerRect.right&&r.bottom>containerRect.top&&r.top<containerRect.bottom);
  if(!panel.hidden){panel.style.left='';panel.style.top='';placeLabel(panel,containerRect,occupied);}
  if(!group.visible)return;
  const a=new THREE.Vector3(...anchor),sunDir=new THREE.Vector3(...enuDirectionToScene(sky.sunAzimuth,sky.sunElevation)),earthDir=new THREE.Vector3(...enuDirectionToScene(sky.earthAzimuth,sky.earthElevation));
  sun.position.copy(a).addScaledVector(sunDir,radius);earth.position.copy(a).addScaledVector(earthDir,radius);
  const scale=radius/30;sun.scale.setScalar(scale);earth.scale.setScalar(scale);
  sun.material.color.set(sky.lit===true?0xffdf8c:0x80735b);earth.material.color.set(sky.earth===true?0x78b9ef:0x50657a);glow.visible=sky.lit===true;
  const nextRayKey=[...anchor,sky.sunAzimuth,sky.sunElevation,radius].join(':');
  if(nextRayKey!==rayKey){rayKey=nextRayKey;basis.crossVectors(sunDir,new THREE.Vector3(0,1,0));if(basis.lengthSq()<.001)basis.set(1,0,0);basis.normalize();perp.crossVectors(sunDir,basis).normalize();const points=[];
   for(const [x,y] of [[0,0],[-1,0],[1,0],[0,1],[0,-1]]){const end=a.clone().addScaledVector(basis,x*radius*.055).addScaledVector(perp,y*radius*.055);points.push(end.clone().addScaledVector(sunDir,radius*.9),end);}
   setLine(rays,points);
  }
  rays.visible=sky.lit===true;
  const nextLinkKey=[...anchor,sky.earthAzimuth,sky.earthElevation,radius].join(':');if(nextLinkKey!==linkKey){linkKey=nextLinkKey;setLine(earthLine,[a,earth.position]);earthLine.computeLineDistances();}
  earthLine.visible=sky.earth===true;
  for(const [i,direction] of [sunDir,earthDir].entries()){
   const visible=i===0?sky.lit===true:sky.earth===true;arrows[i].visible=visible;
   arrows[i].setDirection(i===0?direction.clone().negate():direction);arrows[i].position.copy(a).addScaledVector(direction,radius*(i===0?.58:.45));arrows[i].setLength(radius*.16,radius*.035,radius*.018);
  }
  const w=container.clientWidth,h=container.clientHeight;
  for(const [i,mesh] of [sun,earth].entries()){
   point.copy(mesh.position).project(camera);if(point.z>1||point.z< -1||Math.abs(point.x)>.95||Math.abs(point.y)>.95)continue;
   const label=labels[i];label.hidden=false;label.style.left=((point.x+1)/2*w)+'px';label.style.top=((-point.y+1)/2*h-12)+'px';
   label.querySelector('small').textContent=i===0?(sky.lit?(sky.eligible?'Sunlight':'Below solar limit'):'Blocked'):(sky.earth?'Visible':'Blocked');
   const bounds=label.getBoundingClientRect(),markerX=containerRect.left+(point.x+1)/2*containerRect.width,markerY=containerRect.top+(-point.y+1)/2*containerRect.height;
   label.hidden=bounds.left<containerRect.left+10||bounds.right>containerRect.right-10||bounds.top<containerRect.top+10||bounds.bottom>containerRect.bottom-10||occupied.some(b=>(bounds.left<b.right+8&&bounds.right>b.left-8&&bounds.top<b.bottom+8&&bounds.bottom>b.top-8)||(markerX>b.left-10&&markerX<b.right+10&&markerY>b.top-10&&markerY<b.bottom+10));
   if(!label.hidden)occupied.push(bounds);
  }
 }
 return {group,update,dispose(){info.removeEventListener('click',toggleDetails);panel.removeEventListener('click',locate);panel.remove();labels.forEach(l=>l.remove());}};
}
