import {useSyncExternalStore} from 'react';
import {multiplier,type Run} from './game';
export type Hud={score:number;streak:number;time:number;speed:string;collected:number;maxStreak:number;shield:boolean;charge:number;nova:number;factor:number;mode:Run['mode']};
export function createHudStore(run:Run){
 const read=(r:Run):Hud=>({score:r.score,streak:r.streak,time:Math.floor(r.time),speed:(r.speed/1.25).toFixed(1),collected:r.collected,maxStreak:r.maxStreak,shield:r.shield,charge:r.charge,nova:Math.ceil(r.novaLeft),factor:multiplier(r),mode:r.mode});
 let snapshot=read(run);const listeners=new Set<()=>void>();
 return {subscribe:(cb:()=>void)=>{listeners.add(cb);return()=>{listeners.delete(cb);};},getSnapshot:()=>snapshot,publish:(r:Run)=>{
  const next=read(r);let changed=false;for(const key of Object.keys(next)as(keyof Hud)[])if(next[key]!==snapshot[key]){changed=true;break;}
  if(changed){snapshot=next;listeners.forEach(cb=>cb());}
 }};
}
export type HudStore=ReturnType<typeof createHudStore>;
export function useHud(store:HudStore){return useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);}
