import React,{memo,useEffect,useMemo,useRef,type RefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {ENTITY_POOL_SIZE,RADII,type Run} from '../game';
import {THEMES,type ThemeName} from '../preferences';
export type Tier='low'|'medium'|'high';
export type WorldProps={runRef:RefObject<Run>;onFrame:(dt:number)=>void;tier:Tier;theme:ThemeName;reducedMotion:boolean;onQuality?:(tier:Tier)=>void;onReady?:()=>void};
const TAU=Math.PI*2;
const GLOW_VERTEX=`varying vec2 vUv;void main(){vUv=uv;vec4 p=vec4(position,1.);
#ifdef USE_INSTANCING
p=instanceMatrix*p;
#endif
gl_Position=projectionMatrix*modelViewMatrix*p;}`;
const GLOW_FRAGMENT=`uniform vec3 tint;uniform float strength;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;gl_FragColor=vec4(tint,pow(max(0.,1.-d),2.8)*strength);}`;
function Glow({color,size,opacity=.5,position=[0,0,0]}:{color:string;size:number;opacity?:number;position?:[number,number,number]}){
 const ref=useRef<T.Mesh>(null);const uniforms=useMemo(()=>({tint:{value:new T.Color(color)},strength:{value:opacity}}),[color,opacity]);
 useFrame(({camera})=>ref.current?.quaternion.copy(camera.quaternion));
 return <mesh ref={ref} scale={size} position={position} renderOrder={2}><planeGeometry/><shaderMaterial vertexShader={GLOW_VERTEX} fragmentShader={GLOW_FRAGMENT} uniforms={uniforms} transparent depthWrite={false} blending={T.AdditiveBlending} toneMapped={false}/></mesh>;
}
function Stars({runRef,tier}:Pick<WorldProps,'runRef'|'tier'>){
 const ref=useRef<T.Points>(null),geo=useRef<T.BufferGeometry>(null);
 const data=useMemo(()=>{const p=new Float32Array(320*3),c=new Float32Array(320*3);const color=new T.Color();for(let i=0;i<320;i++){p[i*3]=(Math.sin(i*132.7)) *13.5;p[i*3+1]=(Math.sin(i*45.12)*.5+.15)*15;p[i*3+2]=-14+(Math.sin(i*81.3)*.5+.5)*17;color.set(i%4===0?'#b599f7':i%4===1?'#3dc8dc':'#8799be');c[i*3]=color.r;c[i*3+1]=color.g;c[i*3+2]=color.b;}return{p,c};},[]);
 useEffect(()=>{geo.current?.setDrawRange(0,tier==='low'?80:tier==='medium'?180:320);},[tier]);
 useFrame(()=>{if(ref.current)ref.current.rotation.y=runRef.current.visualTime*.005;});
 return <points ref={ref}><bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" args={[data.p,3]}/><bufferAttribute attach="attributes-color" args={[data.c,3]}/></bufferGeometry><pointsMaterial size={.028} vertexColors transparent opacity={.7} depthWrite={false}/></points>;
}
function Track({radius,color}:{radius:number;color:string}){
 const ticks=useRef<T.InstancedMesh>(null);
 useEffect(()=>{const o=new T.Object3D(),c=new T.Color();for(let i=0;i<48;i++){const a=i/48*TAU;o.position.set(Math.cos(a)*(radius+.13),-.035,Math.sin(a)*(radius+.13));o.rotation.set(0,-a,0);o.scale.set(1,1,i%4===0?1.8:1);o.updateMatrix();ticks.current?.setMatrixAt(i,o.matrix);c.set(i%4===0?color:'#32324e');ticks.current?.setColorAt(i,c);}if(ticks.current)ticks.current.instanceMatrix.needsUpdate=true;},[radius,color]);
 return <group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.05,0]}><torusGeometry args={[radius,.10,8,72]}/><meshStandardMaterial color="#181b30" metalness={.75} roughness={.23}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]}><torusGeometry args={[radius-.055,.015,5,72]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.021,0]}><torusGeometry args={[radius+.065,.006,4,72]}/><meshBasicMaterial color={color} transparent opacity={.55} toneMapped={false}/></mesh>
  <instancedMesh ref={ticks} args={[undefined,undefined,48]}><boxGeometry args={[.022,.015,.055]}/><meshBasicMaterial color="white" toneMapped={false}/></instancedMesh>
 </group>;
}
function Core({runRef,theme,reducedMotion}:Pick<WorldProps,'runRef'|'theme'|'reducedMotion'>){
 const crystal=useRef<T.Group>(null),halo=useRef<T.Group>(null),turbine=useRef<T.InstancedMesh>(null),p=THEMES[theme];
 useEffect(()=>{const o=new T.Object3D();for(let i=0;i<8;i++){const a=i/8*TAU;o.position.set(Math.cos(a)*.53,.13,Math.sin(a)*.53);o.rotation.y=-a;o.updateMatrix();turbine.current?.setMatrixAt(i,o.matrix);}if(turbine.current)turbine.current.instanceMatrix.needsUpdate=true;},[]);
 useFrame(()=>{const time=runRef.current.visualTime;if(crystal.current){crystal.current.rotation.y=time*.23;crystal.current.position.y=.98+(reducedMotion?0:Math.sin(time*1.4)*.055);}if(halo.current)halo.current.rotation.y=-time*.16;});
 return <group>
  <mesh position={[0,-.18,0]}><cylinderGeometry args={[.87,.98,.31,36]}/><meshStandardMaterial color="#18152f" roughness={.3} metalness={.75}/></mesh>
  <mesh position={[0,-.015,0]}><cylinderGeometry args={[.76,.82,.10,36]}/><meshStandardMaterial color="#2d254a" roughness={.2} metalness={.8}/></mesh>
  <mesh position={[0,.045,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.70,.015,6,64]}/><meshBasicMaterial color={p.outer} toneMapped={false}/></mesh>
  <instancedMesh ref={turbine} args={[undefined,undefined,8]}><boxGeometry args={[.07,.18,.14]}/><meshStandardMaterial color="#63557e" metalness={.7} roughness={.25}/></instancedMesh>
  <Glow color={p.glow} size={3.7} opacity={.32} position={[0,.9,0]}/>
  <group ref={crystal} position={[0,.98,0]}><mesh scale={[.75,1.3,.75]}><icosahedronGeometry args={[.65,0]}/><meshStandardMaterial color={p.core} emissive={p.glow} emissiveIntensity={.17} metalness={.6} roughness={.17}/></mesh><mesh scale={[.756,1.305,.756]}><icosahedronGeometry args={[.65,0]}/><meshBasicMaterial color={p.core} wireframe transparent opacity={.24}/></mesh></group>
  <group ref={halo} position={[0,.98,0]} rotation={[.34,0,-.2]}><mesh rotation={[Math.PI/2,.5,0]}><torusGeometry args={[1.01,.025,6,64]}/><meshStandardMaterial color="#d0ac6b" metalness={.7} roughness={.22}/></mesh><mesh rotation={[.5,-.3,.4]}><torusGeometry args={[.93,.011,5,64]}/><meshBasicMaterial color={p.outer} transparent opacity={.65} toneMapped={false}/></mesh><mesh position={[1.01,0,0]}><sphereGeometry args={[.052,8,6]}/><meshBasicMaterial color="#ffe2a0" toneMapped={false}/></mesh></group>
  <pointLight position={[0,1.2,0]} color={p.core} intensity={5} distance={6} decay={2}/>
 </group>;
}
type InstRef=React.RefObject<T.InstancedMesh|null>;
function updateInstances(ref:InstRef,count:number){if(ref.current){ref.current.count=count;ref.current.instanceMatrix.needsUpdate=true;}}
function Batches({runRef,tier,reducedMotion}:Pick<WorldProps,'runRef'|'tier'|'reducedMotion'>){
 const spark=useRef<T.InstancedMesh>(null),ring=useRef<T.InstancedMesh>(null),sparkGlow=useRef<T.InstancedMesh>(null),gate=useRef<T.InstancedMesh>(null),beam=useRef<T.InstancedMesh>(null),panel=useRef<T.InstancedMesh>(null),shield=useRef<T.InstancedMesh>(null),shieldWire=useRef<T.InstancedMesh>(null);
 const o=useMemo(()=>new T.Object3D(),[]),glowUniforms=useMemo(()=>({tint:{value:new T.Color('#ffb558')},strength:{value:.62}}),[]);
 useEffect(()=>{for(const ref of [spark,ring,sparkGlow,gate,beam,panel,shield,shieldWire])ref.current?.instanceMatrix.setUsage(T.DynamicDrawUsage);},[]);
 const write=(ref:InstRef,i:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,yaw=0,rx=0)=>{o.position.set(x,y,z);o.rotation.set(rx,yaw,0);o.scale.set(sx,sy,sz);o.updateMatrix();ref.current?.setMatrixAt(i,o.matrix);};
 useFrame(({camera})=>{
  const r=runRef.current;let ns=0,ng=0,nsh=0;
  for(let i=0;i<r.entities.length;i++){
   const e=r.entities[i],a=Math.PI/2+e.angle-r.displayAngle,x=Math.cos(a)*RADII[e.lane],z=Math.sin(a)*RADII[e.lane],yaw=-a+Math.PI/2,y=.27+(reducedMotion?0:Math.sin(r.visualTime*2+e.id)*.03);
   if(e.kind==='spark'){
    write(spark,ns,x,y,z,.85,1.15,.85,r.visualTime*1.4+e.id);write(ring,ns,x,y,z,1,1,1,0,Math.PI/2);
    o.position.set(x,y,z);o.quaternion.copy(camera.quaternion);o.scale.setScalar(.88);o.updateMatrix();sparkGlow.current?.setMatrixAt(ns,o.matrix);ns++;
   }else if(e.kind==='shield'){
    write(shield,nsh,x,y,z,1,1,1,r.visualTime*.8);write(shieldWire,nsh,x,y,z,1,1,1,-r.visualTime*.7);nsh++;
   }else{
    const c=Math.cos(yaw),s=Math.sin(yaw);
    write(gate,ng*2,x-.22*c,.36,z+.22*s,.10,.54,.17,yaw);write(gate,ng*2+1,x+.22*c,.36,z-.22*s,.10,.54,.17,yaw);
    write(beam,ng,x,.60,z,.53,.08,.17,yaw);write(panel,ng,x,.35,z,1,1,1,yaw);ng++;
   }
  }
  updateInstances(spark,ns);updateInstances(ring,ns);updateInstances(sparkGlow,tier==='low'?0:ns);updateInstances(gate,ng*2);updateInstances(beam,ng);updateInstances(panel,ng);updateInstances(shield,nsh);updateInstances(shieldWire,nsh);
 });
 return <group>
  <instancedMesh ref={spark} args={[undefined,undefined,ENTITY_POOL_SIZE]} frustumCulled={false}><octahedronGeometry args={[.17,0]}/><meshStandardMaterial color="#ffc875" emissive="#bf6010" emissiveIntensity={.62} metalness={.6} roughness={.2}/></instancedMesh>
  <instancedMesh ref={ring} args={[undefined,undefined,ENTITY_POOL_SIZE]} frustumCulled={false}><torusGeometry args={[.21,.009,4,20]}/><meshBasicMaterial color="#ffe3a8" toneMapped={false}/></instancedMesh>
  <instancedMesh ref={sparkGlow} args={[undefined,undefined,ENTITY_POOL_SIZE]} frustumCulled={false} renderOrder={2}><planeGeometry/><shaderMaterial vertexShader={GLOW_VERTEX} fragmentShader={GLOW_FRAGMENT} uniforms={glowUniforms} transparent depthWrite={false} blending={T.AdditiveBlending} toneMapped={false}/></instancedMesh>
  <instancedMesh ref={gate} args={[undefined,undefined,ENTITY_POOL_SIZE*2]} frustumCulled={false}><boxGeometry/><meshStandardMaterial color="#44304b" metalness={.65} roughness={.25}/></instancedMesh>
  <instancedMesh ref={beam} args={[undefined,undefined,ENTITY_POOL_SIZE]} frustumCulled={false}><boxGeometry/><meshBasicMaterial color="#ff437d" toneMapped={false}/></instancedMesh>
  <instancedMesh ref={panel} args={[undefined,undefined,ENTITY_POOL_SIZE]} frustumCulled={false}><planeGeometry args={[.35,.44]}/><meshBasicMaterial color="#ff3871" opacity={.25} transparent side={T.DoubleSide} depthWrite={false} toneMapped={false}/></instancedMesh>
  <instancedMesh ref={shield} args={[undefined,undefined,ENTITY_POOL_SIZE]} frustumCulled={false}><octahedronGeometry args={[.18,0]}/><meshStandardMaterial color="#bdfcff" emissive="#238eaf" emissiveIntensity={.7} metalness={.45} roughness={.2}/></instancedMesh>
  <instancedMesh ref={shieldWire} args={[undefined,undefined,ENTITY_POOL_SIZE]} frustumCulled={false}><icosahedronGeometry args={[.26,0]}/><meshBasicMaterial color="#61eaff" wireframe toneMapped={false}/></instancedMesh>
 </group>;
}
function Ship({runRef,reducedMotion}:Pick<WorldProps,'runRef'|'reducedMotion'>){
 const root=useRef<T.Group>(null),trail=useRef<T.InstancedMesh>(null),bubble=useRef<T.Mesh>(null),novaRing=useRef<T.Mesh>(null),trailMat=useRef<T.MeshBasicMaterial>(null);
 const history=useMemo(()=>new Float32Array(15).fill(RADII[0]),[]),o=useMemo(()=>new T.Object3D(),[]);const prior=useRef(runRef.current);
 useEffect(()=>{trail.current?.instanceMatrix.setUsage(T.DynamicDrawUsage);},[]);
 useFrame((_,dt)=>{
  const r=runRef.current,radius=RADII[0]+r.displayBlend*1.2;
  if(prior.current!==r){history.fill(radius);prior.current=r;}
  const visible=r.phase!=='over'||r.finishReason==='complete'||r.shake>.3;
  if(root.current){root.current.visible=visible;root.current.position.set(0,.28+(reducedMotion?0:Math.sin(r.visualTime*4)*.01),radius);root.current.rotation.z=(r.targetLane-r.displayBlend)*-.35;}
  if(bubble.current)bubble.current.visible=r.shield;
  if(novaRing.current){novaRing.current.visible=r.novaLeft>0;novaRing.current.scale.setScalar(1+(reducedMotion?0:Math.sin(r.visualTime*5)*.08));}
  history[0]=radius;const weight=1-Math.exp(-Math.min(dt,.05)*25);
  for(let i=1;i<15;i++)history[i]+=(history[i-1]-history[i])*weight;
  for(let i=0;i<15;i++){const a=Math.PI/2-(i+1)*.030;o.position.set(Math.cos(a)*history[i],.21,Math.sin(a)*history[i]);o.rotation.set(0,0,0);o.scale.setScalar(Math.max(.012,.045-i*.0025));o.updateMatrix();trail.current?.setMatrixAt(i,o.matrix);}
  if(trail.current){trail.current.count=visible?15:0;trail.current.instanceMatrix.needsUpdate=true;}
  trailMat.current?.color.set(r.novaLeft>0?'#eebcff':'#6ee5f4');
 });
 return <><group ref={root} rotation={[0,Math.PI/2,0]}>
  <mesh rotation={[-Math.PI/2,0,0]}><coneGeometry args={[.18,.57,4]}/><meshStandardMaterial color="#dce8fc" metalness={.8} roughness={.17}/></mesh>
  <mesh position={[0,.048,.08]} scale={[.085,.06,.15]}><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color="#194b69" metalness={.75} roughness={.2} emissive="#197b98" emissiveIntensity={.55}/></mesh>
  {[-1,1].map(i=><mesh key={i} position={[i*.17,-.04,.17]} rotation={[0,0,i*.14]}><boxGeometry args={[.22,.05,.20]}/><meshStandardMaterial color="#6d83a6" metalness={.7} roughness={.23}/></mesh>)}
  <mesh position={[0,0,.26]}><sphereGeometry args={[.065,8,6]}/><meshBasicMaterial color="#a0f5ff" toneMapped={false}/></mesh><Glow color="#2de2ff" size={1.1} opacity={.7} position={[0,0,.27]}/>
  <mesh ref={bubble}><icosahedronGeometry args={[.38,1]}/><meshBasicMaterial color="#7befff" wireframe transparent opacity={.45} toneMapped={false}/></mesh>
  <mesh ref={novaRing} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.41,.013,5,24]}/><meshBasicMaterial color="#d5abff" toneMapped={false}/></mesh>
 </group><instancedMesh ref={trail} args={[undefined,undefined,15]} frustumCulled={false}><sphereGeometry args={[1,6,5]}/><meshBasicMaterial ref={trailMat} color="#6ee5f4" toneMapped={false}/></instancedMesh></>;
}
const BURST_COLORS={spark:new T.Color('#ffd488'),switch:new T.Color('#4de6ff'),crash:new T.Color('#ff4b86'),shield:new T.Color('#8befff'),nova:new T.Color('#d5a8ff')};
function Bursts({runRef,tier}:Pick<WorldProps,'runRef'|'tier'>){
 const geo=useRef<T.BufferGeometry>(null),points=useRef<T.Points>(null);const data=useMemo(()=>({p:new Float32Array(144*3),c:new Float32Array(144*3),s:new Float32Array(144)}),[]);
 useFrame(()=>{const per=tier==='low'?8:tier==='medium'?16:24;let active=false;for(let bIndex=0;bIndex<6;bIndex++){const b=runRef.current.bursts[bIndex];for(let j=0;j<per;j++){const i=bIndex*per+j;if(b.life<=0){data.s[i]=0;continue;}active=true;const p=1-b.life/b.duration,a=j*2.4+b.id*.8,dist=p*(b.kind==='crash'?1.6:b.kind==='nova'?1.1:.55)*(.5+(Math.sin(j*89)+1)*.25),c=BURST_COLORS[b.kind];data.p[i*3]=b.x+Math.cos(a)*dist;data.p[i*3+1]=.26+Math.sin(j*24)*dist*.6+p*.22;data.p[i*3+2]=b.z+Math.sin(a)*dist;data.c[i*3]=c.r;data.c[i*3+1]=c.g;data.c[i*3+2]=c.b;data.s[i]=(1-p)*.13;}}
  if(points.current)points.current.visible=active;if(geo.current){geo.current.setDrawRange(0,per*6);geo.current.attributes.position.needsUpdate=true;geo.current.attributes.aColor.needsUpdate=true;geo.current.attributes.aSize.needsUpdate=true;}
 });
 return <points ref={points} frustumCulled={false} renderOrder={3}><bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" args={[data.p,3]}/><bufferAttribute attach="attributes-aColor" args={[data.c,3]}/><bufferAttribute attach="attributes-aSize" args={[data.s,1]}/></bufferGeometry><shaderMaterial transparent depthWrite={false} blending={T.AdditiveBlending} toneMapped={false} vertexShader={`attribute vec3 aColor;attribute float aSize;varying vec3 vColor;varying float vAlive;void main(){vColor=aColor;vAlive=step(.001,aSize);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=aSize*450./-p.z;}`} fragmentShader={`varying vec3 vColor;varying float vAlive;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.||vAlive<.5)discard;gl_FragColor=vec4(vColor,pow(1.-d,1.5));}`}/></points>;
}
function Driver({runRef,onFrame,onQuality,onReady,tier,reducedMotion}:WorldProps){
 const {camera,size}=useThree();const prevPhase=useRef(runRef.current.phase),wasShaking=useRef(false),ready=useRef(false),renderTime=useRef(0),samples=useRef(0),average=useRef(.0167),lastTierChange=useRef(0);
 useEffect(()=>{if(camera instanceof T.PerspectiveCamera){camera.fov=2*Math.atan(Math.tan(T.MathUtils.degToRad(19))/(size.width/size.height))*180/Math.PI;camera.updateProjectionMatrix();camera.lookAt(0,.1,0);}},[camera,size.width,size.height]);
 useFrame((_,delta)=>{const phase=runRef.current.phase,changed=prevPhase.current!==phase;prevPhase.current=phase;const dt=changed?0:delta;onFrame(dt);const r=runRef.current;
  if(!reducedMotion&&r.shake>0){camera.position.x=Math.sin(r.visualTime*57)*r.shake*.13;camera.position.y=6.5+Math.cos(r.visualTime*49)*r.shake*.1;camera.lookAt(0,.1,0);wasShaking.current=true;}
  else if(wasShaking.current){camera.position.set(0,6.5,8.7);camera.lookAt(0,.1,0);wasShaking.current=false;}
  if(phase==='playing'||phase==='home'){average.current=average.current*.96+Math.min(delta,.1)*.04;samples.current++;if(samples.current>120&&r.visualTime-lastTierChange.current>6){if(average.current>.025&&tier!=='low'){lastTierChange.current=r.visualTime;onQuality?.(tier==='high'?'medium':'low');}else if(phase==='home'&&average.current<.018&&tier==='medium'){lastTierChange.current=r.visualTime;onQuality?.('high');}}}
 },-2);
 useFrame(({gl,scene,camera},dt)=>{renderTime.current+=dt;const phase=runRef.current.phase;if(phase==='home'&&ready.current&&renderTime.current<1/30)return;renderTime.current=0;gl.render(scene,camera);if(!ready.current){ready.current=true;onReady?.();}},1);
 return null;
}
const OrbitWorld=memo(function OrbitWorld(props:WorldProps){const p=THEMES[props.theme];return <>
 <Driver {...props}/><hemisphereLight args={['#b4c1fa','#130c22',2.2]}/><directionalLight position={[3,6,5]} intensity={3.7} color="#d5eaff"/>
 <Stars runRef={props.runRef} tier={props.tier}/><Glow color={p.glow} size={11} opacity={.11} position={[-3,1,-5]}/>
 <Track radius={RADII[0]} color={p.inner}/><Track radius={RADII[1]} color={p.outer}/><Core {...props}/><Batches {...props}/><Ship {...props}/><Bursts {...props}/>
 </>;});
export default OrbitWorld;
