import {useCallback,useEffect,useMemo,useRef} from 'react';
import {setAudioModeAsync,useAudioPlayer,type AudioPlayer} from 'expo-audio';
import type {Phase} from './game';
import type {Preferences} from './preferences';
export type AudioSettings=Pick<Preferences,'music'|'effects'|'haptics'>;
export function useGameAudio(settings:AudioSettings,phase:Phase){
 const music=useAudioPlayer(require('../assets/audio/orbital-drift.mp3'),{downloadFirst:true});
 const start=useAudioPlayer(require('../assets/audio/start.wav')),shift=useAudioPlayer(require('../assets/audio/switch.wav')),
 crash=useAudioPlayer(require('../assets/audio/crash.wav')),combo=useAudioPlayer(require('../assets/audio/combo.wav')),
 p0=useAudioPlayer(require('../assets/audio/pickup-0.wav')),p1=useAudioPlayer(require('../assets/audio/pickup-1.wav')),
 p2=useAudioPlayer(require('../assets/audio/pickup-2.wav')),p3=useAudioPlayer(require('../assets/audio/pickup-3.wav')),
 shield=useAudioPlayer(require('../assets/audio/shield.wav')),nova=useAudioPlayer(require('../assets/audio/nova.wav')),victory=useAudioPlayer(require('../assets/audio/victory.wav'));
 const settingsRef=useRef(settings),phaseRef=useRef(phase),epoch=useRef(0);settingsRef.current=settings;phaseRef.current=phase;
 const effects=useMemo(()=>[start,shift,crash,combo,p0,p1,p2,p3,shield,nova,victory],[start,shift,crash,combo,p0,p1,p2,p3,shield,nova,victory]);
 const playMusic=useCallback(()=>{if(music.isLoaded&&settingsRef.current.music&&phaseRef.current==='playing'){music.loop=true;music.volume=.34;music.play();}},[music]);
 useEffect(()=>{
  setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:'mixWithOthers'}).catch(()=>{});
  effects.forEach(p=>{p.volume=.68;});let loaded=false;
  const sub=music.addListener('playbackStatusUpdate',status=>{if(status.isLoaded&&!loaded){loaded=true;music.loop=true;music.volume=.34;playMusic();}else if(!status.isLoaded)loaded=false;});
  if(music.isLoaded){loaded=true;music.loop=true;music.volume=.34;playMusic();}
  return()=>sub.remove();
 },[music,effects,playMusic]);
 useEffect(()=>{if(phase==='playing'&&settings.music)playMusic();else music.pause();
  if(!settings.effects||phase==='paused'||phase==='home'){epoch.current++;effects.forEach(p=>p.pause());}
 },[phase,settings.music,settings.effects,music,effects,playMusic]);
 const replay=useCallback((p:AudioPlayer)=>{if(!settingsRef.current.effects)return;const generation=epoch.current;
  p.seekTo(0).then(()=>{if(generation===epoch.current&&settingsRef.current.effects&&phaseRef.current!=='paused'&&phaseRef.current!=='home')p.play();}).catch(()=>{});
 },[]);
 return useMemo(()=>({
  begin:()=>{phaseRef.current='playing';playMusic();replay(start);},shift:()=>replay(shift),crash:()=>replay(crash),combo:()=>replay(combo),
  pickup:(streak:number)=>replay([p0,p1,p2,p3][(streak-1)%4]),shield:()=>replay(shield),nova:()=>replay(nova),victory:()=>replay(victory),
  silence:()=>{epoch.current++;phaseRef.current='paused';music.pause();effects.forEach(p=>p.pause());},
 }),[playMusic,replay,start,shift,crash,combo,p0,p1,p2,p3,shield,nova,victory,music,effects]);
}
