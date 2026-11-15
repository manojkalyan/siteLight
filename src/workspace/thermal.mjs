export function parseThermalRow(line){
 const fields=line.split(',');if(fields.some(v=>!v.trim()))return null;
 const values=fields.map(v=>Number(v.trim()));
 if(values.length!==5||values.some(v=>!Number.isFinite(v))||values.some(v=>v===-9998||v===-9999))return null;
 const [x,y,lon,lat,kelvin]=values;
 if(lat< -90||lat>90||lon< -180||lon>180||kelvin<=0||kelvin>500)return null;
 return {x,y,lon,lat,kelvin};
}
export function thermalDistanceM(a,b){
 const rad=Math.PI/180,p=a.lat*rad,q=b.lat*rad;
 const h=Math.sin((q-p)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin((b.lon-a.lon)*rad/2)**2;
 return 2*1737400*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));
}
export function thermalContext(entry){return entry?.thermalContext||null;}
