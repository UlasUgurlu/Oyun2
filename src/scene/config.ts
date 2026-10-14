import {useCallback,useEffect,useState,type RefObject} from 'react';
import type {Phase,Run} from '../game';
import type {Preferences} from '../preferences';
import type {Tier} from './OrbitWorld';
export type SceneProps={runRef:RefObject<Run>;onFrame:(dt:number)=>void;phase:Phase;active:boolean;preferences:Preferences;onReady?:()=>void};
export function useSceneConfig(props:SceneProps){
 const mode=props.preferences.quality;
 const [tier,setTier]=useState<Tier>(mode==='low'?'low':mode==='high'?'high':'medium');
 const [settled,setSettled]=useState(false);
 useEffect(()=>setTier(mode==='low'?'low':mode==='high'?'high':'medium'),[mode]);
 useEffect(()=>{setSettled(false);if(props.phase==='over'){const id=setTimeout(()=>setSettled(true),1500);return()=>clearTimeout(id);}},[props.phase]);
 const onQuality=useCallback((next:Tier)=>{if(mode==='auto')setTier(next);},[mode]);
 const running=props.active&&props.phase!=='paused'&&!(props.phase==='over'&&settled);
 return {tier,onQuality,frameloop:(running?'always':'demand')as 'always'|'demand',world:{runRef:props.runRef,onFrame:props.onFrame,tier,theme:props.preferences.theme,reducedMotion:props.preferences.reducedMotion,onQuality,onReady:props.onReady}};
}
