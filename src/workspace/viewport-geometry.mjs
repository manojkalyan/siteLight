// Presentation coordinates only. Scientific heights, slopes and visibility are
// calculated by provider modules, never by the WebGL material.
export const METERS_PER_WORLD_UNIT=10;
export function lunarSiteToScene(site,radius=9.08){
 if(![site.lat,site.lon,radius].every(Number.isFinite)||Math.abs(site.lat)>90||radius<=0)throw Error('A finite lunar coordinate is required.');
 const lat=site.lat*Math.PI/180,lon=site.lon*Math.PI/180;
 return [radius*Math.cos(lat)*Math.sin(lon),radius*Math.sin(lat),radius*Math.cos(lat)*Math.cos(lon)];
}
export function terrainPointToScene(point,site,{real=true,liftM=0}={}){
 const {x,z,h}=point,reference=real?site.surfaceElevationM:0,angle=(real?site.lon:0)*Math.PI/180;
 if(![x,z,h,reference,angle,liftM].every(Number.isFinite))throw Error('A finite assessed terrain point is required.');
 const east=x/METERS_PER_WORLD_UNIT,north=z/METERS_PER_WORLD_UNIT;
 return [east*Math.cos(angle)-north*Math.sin(angle),(h-reference+liftM)/METERS_PER_WORLD_UNIT,-east*Math.sin(angle)-north*Math.cos(angle)];
}
export function enuDirectionToScene(azimuthDeg,elevationDeg,radius=1){
 if(![azimuthDeg,elevationDeg,radius].every(Number.isFinite)||Math.abs(elevationDeg)>90||radius<0)throw Error('Invalid local direction.');
 const az=azimuthDeg*Math.PI/180,el=elevationDeg*Math.PI/180;
 return [Math.sin(az)*Math.cos(el)*radius,Math.sin(el)*radius,-Math.cos(az)*Math.cos(el)*radius];
}
export function footprintBoundary(radiusM,heightAt,segments=128){
 if(!Number.isFinite(radiusM)||radiusM<=0||!Number.isInteger(segments)||segments<16||segments>512)throw Error('Invalid footprint boundary.');
 return Array.from({length:segments+1},(_,i)=>{const angle=i/segments*Math.PI*2,x=Math.cos(angle)*radiusM,z=Math.sin(angle)*radiusM,h=heightAt(x,z);return Number.isFinite(h)?{x,z,h}:null;});
}
// Clip display cells to an inscribed footprint. Source heights are sampled at
// clipping vertices; missing data never becomes extrapolated display terrain.
export function footprintCellPolygon(cell,halfSizeM,radiusM,heightAt){
 if(![cell.x,cell.z,halfSizeM,radiusM].every(Number.isFinite)||halfSizeM<=0||radiusM<=0)return [];
 let polygon=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>({x:cell.x+x*halfSizeM,z:cell.z+z*halfSizeM}));
 for(let i=0;i<64&&polygon.length;i++){
  const a={x:Math.cos(i/64*Math.PI*2)*radiusM,z:Math.sin(i/64*Math.PI*2)*radiusM},b={x:Math.cos((i+1)/64*Math.PI*2)*radiusM,z:Math.sin((i+1)/64*Math.PI*2)*radiusM};
  const side=p=>(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x),out=[];
  for(let j=0;j<polygon.length;j++){
   const p=polygon[j],q=polygon[(j+1)%polygon.length],sp=side(p),sq=side(q),insideP=sp>=-1e-9,insideQ=sq>=-1e-9;
   if(insideP)out.push(p);
   if(insideP!==insideQ){const t=sp/(sp-sq);out.push({x:p.x+t*(q.x-p.x),z:p.z+t*(q.z-p.z)});}
  }
  polygon=out;
 }
 const result=polygon.map(p=>({...p,h:heightAt(p.x,p.z)}));return result.every(p=>Number.isFinite(p.h))?result:[];
}
