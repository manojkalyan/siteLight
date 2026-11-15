import * as THREE from 'three';
// Artistic geometry for visualization only. Never used as a terrain or visibility input.
const fract=x=>x-Math.floor(x),hash=(x,z)=>fract(Math.sin(x*127.1+z*311.7)*43758.5453),smooth=t=>t*t*(3-2*t);
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(a,b),hash(a+1,b),u),THREE.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v)*2-1;}
const craters=[[-28,-4,23,11],[43,-57,19,7],[-73,-78,31,13],[72,22,15,5],[-57,40,10,4],[12,62,8,3],[100,-105,38,14],[-130,-150,49,19]];
export function cinematicHeight(x,z){let h=0,a=2.8,f=.035;for(let i=0;i<5;i++){h+=noise(x*f,z*f)*a;a*=.45;f*=2.4;}for(const [cx,cz,r,d] of craters){const angle=Math.atan2(z-cz,x-cx),q=Math.hypot(x-cx,z-cz)/r,ragged=q*(1+.025*Math.sin(angle*13)+.018*Math.cos(angle*23));h-=d*Math.exp(-Math.pow(ragged/.78,6));h+=d*.38*Math.exp(-Math.pow((ragged-1)/.12,2));}return h;}
export function createCinematicTerrain(){
 const group=new THREE.Group(),geometry=new THREE.PlaneGeometry(440,440,384,384);geometry.rotateX(-Math.PI/2);const p=geometry.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,cinematicHeight(p.getX(i),p.getZ(i)));geometry.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({color:0x858585,roughness:1});
 material.onBeforeCompile=s=>{s.vertexShader='varying vec3 vRegolith;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRegolith=position;');s.fragmentShader='varying vec3 vRegolith;\n'+s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float grain=fract(sin(dot(floor(vRegolith.xz*15.0),vec2(127.1,311.7)))*43758.5453);
 float detail=1.0/(1.0+pow(max(fwidth(vRegolith.x),fwidth(vRegolith.z))*15.0,2.0));
 diffuseColor.rgb*=0.80+(grain-0.5)*0.30*detail;`);};
 const surface=new THREE.Mesh(geometry,material);surface.castShadow=surface.receiveShadow=true;group.add(surface);
 let detailGeometry=null,inspectionDetail=false;
 function setInspectionDetail(enabled){
  if(enabled===inspectionDetail)return;inspectionDetail=enabled;
  if(enabled&&!detailGeometry){detailGeometry=new THREE.PlaneGeometry(300,300,640,640);detailGeometry.rotateX(-Math.PI/2);const points=detailGeometry.attributes.position;for(let i=0;i<points.count;i++)points.setY(i,cinematicHeight(points.getX(i),points.getZ(i)));detailGeometry.computeVertexNormals();}
  surface.geometry=enabled?detailGeometry:geometry;
 }
 const stones=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0x797979,roughness:1}),2200),matrix=new THREE.Object3D();
 for(let i=0;i<2200;i++){const x=(hash(i,17)-.5)*210,z=(hash(i,31)-.5)*210,size=.07+Math.pow(hash(i,47),5)*.65;matrix.position.set(x,cinematicHeight(x,z)+size*.18,z);matrix.rotation.set(hash(i,3)*5,hash(i,5)*6,hash(i,7)*4);matrix.scale.set(size,size*(.5+hash(i,9)),size*(.8+hash(i,13)));matrix.updateMatrix();stones.setMatrixAt(i,matrix.matrix);}stones.castShadow=stones.receiveShadow=true;group.add(stones);
 const pin=new THREE.Group();pin.position.set(-10.5,cinematicHeight(-10.5,11)+.3,11);const normal=new THREE.Vector3(cinematicHeight(-10.7,11)-cinematicHeight(-10.3,11),.4,cinematicHeight(-10.5,10.8)-cinematicHeight(-10.5,11.2)).normalize();pin.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);const ring=new THREE.Mesh(new THREE.RingGeometry(.85,1.25,64),new THREE.MeshBasicMaterial({color:0x49cfff,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;pin.add(ring);const glow=new THREE.Mesh(new THREE.RingGeometry(1.25,2.1,64),new THREE.MeshBasicMaterial({color:0x42baff,transparent:true,opacity:.17,side:THREE.DoubleSide,depthWrite:false}));glow.rotation.x=-Math.PI/2;pin.add(glow);group.add(pin);group.visible=false;
 return {group,pin,setInspectionDetail,disposeInactiveGeometry(){if(surface.geometry!==geometry)geometry.dispose();if(detailGeometry&&surface.geometry!==detailGeometry)detailGeometry.dispose();}};
}
