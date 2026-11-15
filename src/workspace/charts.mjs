export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(v).toFixed(2);
export function horizonChart(result,provider,time,{width=720,height=260}={}){
 width=Number.isFinite(width)&&width>=160?Math.round(width):720;height=Number.isFinite(height)&&height>=80?Math.round(height):260;
 const count=provider.terrain?.horizon?.elevationDeg?.length||360;
 const g=provider.geometry(time),elevations=result.records.flatMap(r=>[r.sunElevation,r.earthElevation]).filter(Number.isFinite);
 if(g)elevations.push(g.sunElevation,g.earthElevation);
 for(let i=0;i<count;i++){const h=provider.horizon(i*360/count);if(Number.isFinite(h))elevations.push(h);}
 const low=Math.max(-90,Math.floor(Math.min(-15,...elevations)/5)*5),high=Math.min(90,Math.ceil(Math.max(30,...elevations)/5)*5);
 const x=az=>44+az/360*(width-88),y=el=>height-25-(el-low)/(high-low)*(height-45);
 const horizon=Array.from({length:count+1},(_,i)=>{const az=i*360/count;return `${n(x(az))},${n(y(provider.horizon(az)))}`;}).join(' ');
 const tracks=['sun','earth'].map(kind=>{
  const az=kind+'Azimuth',el=kind+'Elevation';
  // Split at north, missing samples, and visibility changes. Dashed runs are ineligible.
  let d='',last=null,visible=null,paths='';
  const flush=()=>{if(d)paths+=`<path d="${d}" fill="none" class="track-${kind}" stroke-width="1.5" ${visible?'':'opacity=".4" stroke-dasharray="4 3"'}/>`;d='';};
  for(const r of result.records){
   if(!Number.isFinite(r[az])){flush();last=null;continue;}
   const on=kind==='sun'?r.eligible:r.earth;
   if(on!==visible){flush();visible=on;last=null;}
   d+=(last!==null&&Math.abs(r[az]-last)<180?'L':'M')+n(x(r[az]))+','+n(y(r[el]));last=r[az];
  }
  flush();return paths;
 }).join('');
 const markers=g?['sun','earth'].map(k=>`<circle data-live-body="${k}" cx="${n(x(g[k+'Azimuth']))}" cy="${n(y(g[k+'Elevation']))}" r="5" class="point-${k}"/><text data-live-label="${k}" x="${n(Math.min(width-48,Math.max(48,x(g[k+'Azimuth'])+8)))}" y="${n(Math.min(height-24,Math.max(13,y(g[k+'Elevation'])-7)))}">${k==='sun'?'Sun':'Earth'}</text>`).join(''):'';
 const tickCount=height<110?4:6,ticks=Array.from({length:tickCount},(_,i)=>Math.round((low+(high-low)*i/(tickCount-1))*10)/10);
 return `<svg class="horizon-chart" data-low="${low}" data-high="${high}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Sun and Earth altitude versus azimuth; gray fill is the selected horizon. Dashed tracks are below the selected visibility criterion. Display range ${low} to ${high} degrees."><defs><clipPath id="horizon-clip"><rect x="44" y="18" width="${width-88}" height="${height-34}"/></clipPath></defs>${ticks.map(e=>`<line x1="44" x2="${width-44}" y1="${y(e)}" y2="${y(e)}" class="gridline"/><text x="8" y="${y(e)+3}">${e}°</text>`).join('')}${[0,90,180,270,360].map(a=>`<text x="${x(a)}" y="${height-4}" text-anchor="middle">${a}°</text>`).join('')}<g clip-path="url(#horizon-clip)"><polygon points="44,${height-16} ${horizon} ${width-44},${height-16}" fill="#8c939e24"/><polyline points="${horizon}" fill="none" stroke="#99a2b2" stroke-width="1.4"/>${tracks}${markers}</g></svg>`;
}
export function skyplot(result,provider,time){
 const count=provider.terrain?.horizon?.elevationDeg?.length||360;
 const elevations=result.records.flatMap(r=>[r.sunElevation,r.earthElevation]).filter(Number.isFinite);
 for(let i=0;i<count;i++){const h=provider.horizon(i*360/count);if(Number.isFinite(h))elevations.push(h);}
 const low=Math.max(-90,Math.floor(Math.min(-10,...elevations)/10)*10),zeroRadius=90/(90-low)*105;
 const pos=(az,el)=>{const r=(90-el)/(90-low)*105,a=az*Math.PI/180;return [135+r*Math.sin(a),135-r*Math.cos(a)];};
 const outline=Array.from({length:count+1},(_,i)=>{const az=i*360/count;return pos(az,provider.horizon(az)).map(n).join(',');}).join(' ');
 const paths=['sun','earth'].map(k=>{let d='',connected=false;for(const r of result.records){if(!Number.isFinite(r[k+'Elevation'])||r[k+'Elevation']<low){connected=false;continue;}const point=pos(r[k+'Azimuth'],r[k+'Elevation']);d+=(connected?'L':'M')+point.map(n).join(',');connected=true;}return `<path d="${d}" fill="none" class="track-${k}" stroke-width="1.4"/>`;}).join('');
 const g=provider.geometry(time),markers=g?['sun','earth'].map(k=>{const p=pos(g[k+'Azimuth'],g[k+'Elevation']);return `<circle data-live-body="${k}" cx="${n(p[0])}" cy="${n(p[1])}" r="4.5" class="point-${k}"/>`;}).join(''):'';
 return `<svg viewBox="0 0 270 270" data-low="${low}" class="skyplot" role="img" aria-label="Polar skyplot. North up, east right; outer ring ${low} degrees elevation, dashed ring zero degrees. Negative local horizons are shown."><defs><clipPath id="sky-clip"><circle cx="135" cy="135" r="105"/></clipPath></defs>${[35,70,105].map(r=>`<circle cx="135" cy="135" r="${r}" class="gridline" fill="none"/>`).join('')}<circle cx="135" cy="135" r="${n(zeroRadius)}" fill="none" stroke="#aab0bb66" stroke-dasharray="3 3"/><path d="M30 135H240M135 30V240" class="gridline"/><text x="135" y="19" text-anchor="middle">N · 0°</text><text x="245" y="139">E</text><text x="135" y="258" text-anchor="middle">S · 180° · outer ${low}° elev.</text><text x="13" y="139">W</text><g clip-path="url(#sky-clip)"><polyline points="${outline}" stroke="#aab0bb" fill="#9aa4b40c"/>${paths}${markers}</g></svg>`;
}
// Update only the current bodies during playback. Static source paths and axes
// retain their DOM identity; a resize or changed scenario rebuilds them.
export function updateHorizonMarkers(chart,polar,geometry){
 for(const svg of [chart,polar]){
  if(!svg)continue;
  const low=Number(svg.dataset.low),high=Number(svg.dataset.high),view=svg.getAttribute('viewBox').split(' ').map(Number),width=view[2],height=view[3];
  for(const kind of ['sun','earth']){
   const marker=svg.querySelector(`[data-live-body="${kind}"]`),label=svg.querySelector(`[data-live-label="${kind}"]`);
   if(!marker)continue;
   const az=geometry?.[kind+'Azimuth'],el=geometry?.[kind+'Elevation'],valid=Number.isFinite(az)&&Number.isFinite(el);
   marker.style.display=valid?'':'none';if(label)label.style.display=valid?'':'none';if(!valid)continue;
   let x,y;
   if(svg===chart){x=44+az/360*(width-88);y=height-25-(el-low)/(high-low)*(height-45);}
   else{const radius=(90-el)/(90-low)*105,angle=az*Math.PI/180;x=135+radius*Math.sin(angle);y=135-radius*Math.cos(angle);}
   marker.setAttribute('cx',n(x));marker.setAttribute('cy',n(y));
   if(label){label.setAttribute('x',n(Math.min(width-48,Math.max(48,x+8))));label.setAttribute('y',n(Math.min(height-24,Math.max(13,y-7))));}
  }
 }
}
export function timelineSvg(result){
 if(!result.records.length)return '<div class="empty-mini">No loaded data for this full interval.</div>';
 const width=1000,start=result.start,span=result.end-start;
 return `<svg viewBox="0 0 1000 88" preserveAspectRatio="none" role="img" aria-label="Availability lanes for sunlight, Earth, and overlap">${['eligible','earth','overlap'].map((key,lane)=>{
  let runs='',active=null;
  for(let i=0;i<=result.records.length;i++){
   const row=result.records[i],on=row?.[key]===true;
   if(on&&active===null)active=row.time;
   if(!on&&active!==null){const end=row?.time??result.end;runs+=`<rect x="${n((active-start)/span*width)}" y="${lane*29+4}" width="${n((end-active)/span*width)}" height="20" rx="2" class="lane-${key}"/>`;active=null;}
  }
  return `<rect x="0" y="${lane*29+4}" width="1000" height="20" fill="#ffffff06"/>${runs}`;
 }).join('')}</svg>`;
}
export function terrainMap(result,route=null){
 const r=result.radius||100,scale=250/(2*r),size=r/10*scale;
 return `<svg viewBox="0 0 280 280" class="terrain-map" role="img" aria-label="Terrain slope footprint. Grid positive Y is up; gray cells have missing coverage. Optional white route is sampled connectivity only.">${result.cells.map(c=>`<rect x="${n(140+c.x*scale-size/2)}" y="${n(140-c.z*scale-size/2)}" width="${n(size+.4)}" height="${n(size+.4)}" fill="${c.slope===null?'#60646c':c.slope>result.limit?'#bd8954':'#648baf'}"/>`).join('')}<circle cx="140" cy="140" r="126" fill="none" stroke="#ffffff65" stroke-width="1"/><path d="M132 140H148M140 132V148" stroke="white"/>${route?.path?.length?`<polyline points="${route.path.map(c=>n(140+c.x*scale)+','+n(140-c.z*scale)).join(' ')}" fill="none" stroke="white" stroke-width="3"/>`:''}<text x="140" y="12" text-anchor="middle">Grid +Y</text><text x="248" y="140">+X</text></svg>`;
}
