import React,{memo} from 'react';
import {Canvas} from '@react-three/fiber';
import {ACESFilmicToneMapping} from 'three';
import OrbitWorld from './OrbitWorld';
import {useSceneConfig,type SceneProps} from './config';
const Scene=memo(function Scene(props:SceneProps){const c=useSceneConfig(props);return <Canvas camera={{position:[0,6.5,8.7],near:.1,far:60}} dpr={c.tier==='low'?1:c.tier==='medium'?1.25:1.6} frameloop={props.active?c.frameloop:'never'} gl={{alpha:true,antialias:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.setClearColor('#080b16',0);gl.toneMapping=ACESFilmicToneMapping;gl.toneMappingExposure=1.25;}}><OrbitWorld {...c.world}/></Canvas>;});
export default Scene;
