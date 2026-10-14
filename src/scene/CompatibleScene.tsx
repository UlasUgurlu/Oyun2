import React,{memo,useEffect,useRef,useState} from 'react';
import Svg,{Ellipse,Polygon,Circle,Defs,RadialGradient,Stop} from 'react-native-svg';
import {RADII} from '../game';
import {THEMES} from '../preferences';
import type {SceneProps} from './config';
export default memo(function CompatibleScene(props:SceneProps){
 const [,setFrame]=useState(0),ref=useRef(props);ref.current=props;
 useEffect(()=>{props.onReady?.();},[props.onReady]);
 useEffect(()=>{if(!props.active||props.phase!=='playing')return;let id=0,last=0,shown=0,alive=true;const tick=(now:number)=>{if(!alive)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;ref.current.onFrame(dt);if(now-shown>33){shown=now;setFrame(v=>v+1);}id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>{alive=false;cancelAnimationFrame(id);};},[props.active,props.phase]);
 const r=props.runRef.current,p=THEMES[props.preferences.theme],radius=RADII[0]+r.displayBlend*1.2;
 const y=160+radius*44*.46;
 return <Svg width="100%" height="100%" viewBox="0 0 360 320" accessibilityLabel="Orbit Tide">
  <Defs><RadialGradient id="core"><Stop offset="0" stopColor={p.core}/><Stop offset="1" stopColor={p.glow}/></RadialGradient></Defs>
  {RADII.map((radius,i)=><Ellipse key={radius} cx={180} cy={160} rx={radius*44} ry={radius*44*.46} stroke={i?p.outer:p.inner} strokeWidth={3} fill="none"/>)}
  <Ellipse cx={180} cy={166} rx={40} ry={19} fill="#24203c"/>
  <Polygon points="180,83 154,133 180,166 205,133" fill="url(#core)" stroke={p.core} strokeWidth={1}/>
  {r.entities.map(e=>{const a=Math.PI/2+e.angle-r.displayAngle,x=180+Math.cos(a)*RADII[e.lane]*44,y=160+Math.sin(a)*RADII[e.lane]*44*.46;return e.kind==='gate'?<Polygon key={e.id} points={`${x-7},${y-12} ${x+7},${y-12} ${x+7},${y+3} ${x-7},${y+3}`} fill="#e64478"/>:<Circle key={e.id} cx={x} cy={y} r={e.kind==='shield'?7:5} fill={e.kind==='shield'?'#70efff':'#ffd180'}/>;})}
  {(r.phase!=='over'||r.finishReason==='complete')&&<><Polygon points={`180,${y-8} 189,${y+6} 180,${y+2} 171,${y+6}`} fill="#d1f3ff"/>{r.shield&&<Circle cx={180} cy={y} r={15} stroke="#80edff" fill="none"/>}</>}
 </Svg>;
});
