import {sampleGrid} from './real-data.mjs';
import {escapeHtml as esc} from './charts.mjs';
const cache=new Map();
export function displaySiteName(site){const raw=site.name.replace(/ · DEM study point$/,'');return raw==='Shackleton'?'Shackleton rim':raw==='Nobile'?'Nobile rim':raw;}
export function terrainPreview(entry){
 if(!entry)return '<div class="preview-unavailable">No DEM preview</div>';
 const key=entry.site.id;if(cache.has(key))return cache.get(key);
 const grid=entry.terrain.grid,size=18,step=24,reference=entry.site.surfaceElevationM;
 const point=(i,j)=>{const x=(i-size/2)*step,z=(j-size/2)*step,h=sampleGrid(grid,'elevationM',x,z);return {x:80+(i-j)*4,y:16+(i+j)*1.5-(h-reference)*.045,h};};
 let polygons='';for(let j=0;j<size;j++)for(let i=0;i<size;i++){const p=[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)];if(!p.every(v=>Number.isFinite(v.h)))continue;const dx=(p[1].h-p[0].h)/step,dz=(p[3].h-p[0].h)/step,light=Math.max(.08,Math.min(.9,(.6-dx*.45+dz*.3)/Math.sqrt(1+dx*dx+dz*dz))),shade=Math.round(35+light*195);polygons+=`<polygon points="${p.map(v=>v.x.toFixed(1)+','+v.y.toFixed(1)).join(' ')}" fill="rgb(${shade},${shade},${shade})"/>`;}
 const svg=`<svg viewBox="0 0 160 100" role="img" aria-label="${esc(displaySiteName(entry.site))} source DEM preview"><rect width="160" height="100" fill="#080808"/>${polygons}</svg>`;cache.set(key,svg);if(cache.size>16)cache.delete(cache.keys().next().value);return svg;
}
export function compactExplanation(result){
 if(result.status==='insufficient_data')return 'Coverage is unavailable for this interval.';
 if(result.nominalStatus==='pass')return 'Nominal criteria met. Scientific uncertainty remains.';
 const rule=result.rules?.find(r=>!r.pass);return rule?`${rule.label} is below the selected requirement.`:'Review the enabled mission requirements.';
}
export const calendarIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v5m8-5v5M4 11h16"/></svg>';
export const clockIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>';
