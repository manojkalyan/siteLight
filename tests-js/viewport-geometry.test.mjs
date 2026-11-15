import test from 'node:test';
import assert from 'node:assert/strict';
import {METERS_PER_WORLD_UNIT,lunarSiteToScene,terrainPointToScene,enuDirectionToScene,footprintBoundary,footprintCellPolygon} from '../src/workspace/viewport-geometry.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('lunar markers preserve cardinal coordinates and pole positions',()=>{
 const zero=lunarSiteToScene({lat:0,lon:0},10),east=lunarSiteToScene({lat:0,lon:90},10),south=lunarSiteToScene({lat:-90,lon:37},10);
 assert.deepEqual(zero,[0,0,10]);near(east[0],10);near(east[2],0);near(south[0],0);near(south[1],-10);near(south[2],0);assert.throws(()=>lunarSiteToScene({lat:91,lon:0}));
});
test('viewport preserves meters, relative height and known polar-grid convergence axes',()=>{
 assert.equal(METERS_PER_WORLD_UNIT,10);const site={lon:0,surfaceElevationM:1200};assert.deepEqual(terrainPointToScene({x:100,z:20,h:1230},site),[10,3,-2]);
 const east=terrainPointToScene({x:100,z:0,h:1200},{...site,lon:90}),north=terrainPointToScene({x:0,z:100,h:1200},{...site,lon:90});near(east[0],0);near(east[2],-10);near(north[0],-10);near(north[2],0);
 near(terrainPointToScene({x:0,z:0,h:1200},site,{liftM:1})[1],.1);assert.throws(()=>terrainPointToScene({x:0,z:0,h:NaN},site),/finite/);
});
test('local body directions follow east, north and up independently of display camera',()=>{
 const north=enuDirectionToScene(0,0),east=enuDirectionToScene(90,0),up=enuDirectionToScene(37,90,20);near(north[0],0);near(north[2],-1);near(east[0],1);near(east[2],0);near(up[1],20);near(up[0],0);near(up[2],0);
 assert.throws(()=>enuDirectionToScene(0,91),/Invalid/);
});
test('footprint boundary has the selected radius and preserves missing source arcs',()=>{
 const ring=footprintBoundary(150,(x,z)=>100+x*.1-z*.2);assert.equal(ring.length,129);
 for(const p of ring){near(Math.hypot(p.x,p.z),150);near(p.h,100+p.x*.1-p.z*.2);}
 const incomplete=footprintBoundary(100,x=>x>0?NaN:5);assert.ok(incomplete.some(p=>p===null));assert.ok(incomplete.some(p=>p?.h===5));assert.throws(()=>footprintBoundary(-1,()=>0),/Invalid/);
});
test('slope display cells stay inside footprint without extrapolating missing heights',()=>{
 const interior=footprintCellPolygon({x:0,z:0},5,100,(x,z)=>500+x*.1);assert.equal(interior.length,4);for(const p of interior)near(p.h,500+p.x*.1);
 const edge=footprintCellPolygon({x:100,z:0},5,100,()=>500);assert.ok(edge.length>=3);for(const p of edge)assert.ok(Math.hypot(p.x,p.z)<=100+1e-9);
 assert.deepEqual(footprintCellPolygon({x:0,z:0},5,100,()=>NaN),[]);assert.deepEqual(footprintCellPolygon({x:150,z:0},5,100,()=>1),[]);
});
