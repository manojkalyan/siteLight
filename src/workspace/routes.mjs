export const routeDirections={'+X':[1,0],'-X':[-1,0],'+Y':[0,1],'-Y':[0,-1],'+X+Y':[1,1],'+X-Y':[1,-1],'-X+Y':[-1,1],'-X-Y':[-1,-1]};
export function terrainRoute(terrain,direction='+X'){
 if(!terrain)return {status:'not_evaluated',reason:'No assessed terrain grid.'};
 if(!routeDirections[direction])throw Error('Unknown terrain-grid direction.');
 const step=terrain.radius/10,limit=terrain.limit,cells=new Map(terrain.cells.map(c=>[Math.round(c.x/step)+','+Math.round(c.z/step),c])),[dx,dy]=routeDirections[direction],scale=8/Math.hypot(dx,dy),goalKey=Math.round(dx*scale)+','+Math.round(dy*scale),startKey='0,0';
 const good=c=>c&&Number.isFinite(c.h)&&Number.isFinite(c.slope)&&c.slope<=limit,start=cells.get(startKey),goal=cells.get(goalKey);
 const base={model:'sampled-grid-route-1',direction,spacingM:step,slopeLimitDeg:limit,classification:terrain.classification||'SYNTHETIC DEMONSTRATION',meaning:'Sampled geometric connectivity only. Between-sample hazards, boulders, soil/traction, vehicle geometry, energy, thermal conditions and safe return are not modeled.'};
 if(!good(start)||!good(goal))return {...base,status:'no_route',reason:'The start or destination has missing data or exceeds the selected slope limit.',path:[]};
 const costs=new Map([[startKey,0]]),parent=new Map(),open=new Set([startKey]),closed=new Set();let expanded=0;
 while(open.size){let current=null,best=Infinity;for(const key of open){const c=cells.get(key),f=costs.get(key)+Math.hypot(c.x-goal.x,c.z-goal.z);if(f<best){best=f;current=key;}}
  if(current===goalKey){const path=[];let key=current;while(key){const c=cells.get(key);path.unshift({x:c.x,z:c.z,h:c.h,slope:c.slope});key=parent.get(key);}return {...base,status:'found',qualification:base.classification.includes('REAL')?'uncertain_real_terrain':'synthetic',path,lengthM:costs.get(current),expanded};}
  open.delete(current);closed.add(current);expanded++;const [x,y]=current.split(',').map(Number),a=cells.get(current);
  for(const [nx,ny] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const key=(x+nx)+','+(y+ny),b=cells.get(key);if(closed.has(key)||!good(b)||nx&&ny&&(!good(cells.get((x+nx)+','+y))||!good(cells.get(x+','+(y+ny)))))continue;
   const horizontal=Math.hypot(b.x-a.x,b.z-a.z);if(Math.atan2(Math.abs(b.h-a.h),horizontal)*180/Math.PI>limit)continue;
   const cost=costs.get(current)+Math.hypot(horizontal,b.h-a.h);if(cost<(costs.get(key)??Infinity)){costs.set(key,cost);parent.set(key,current);open.add(key);}
  }
 }
 return {...base,status:'no_route',reason:'No connected path meets the sampled cell/edge slope limits. Diagonal shortcuts across missing or blocked corners are prohibited.',path:[],expanded};
}
export function skyContext(horizon){
 const values=horizon?.elevationDeg;if(!values?.length)return {status:'not_evaluated'};
 const known=values.filter(Number.isFinite),coverage=known.length/values.length;
 if(coverage!==1)return {status:'insufficient_data',coverage,visibleUpwardSolidAngleFraction:null};
 const fraction=known.reduce((sum,h)=>sum+1-Math.sin(Math.max(0,Math.min(90,h))*Math.PI/180),0)/known.length;
 return {model:'upward-solid-angle-1',status:'geometric_context',coverage,visibleUpwardSolidAngleFraction:fraction,meaning:'Uniform-solid-angle fraction of the upward hemisphere above the sampled horizon. Not radiation dose, shielding efficiency or a transport calculation.'};
}
