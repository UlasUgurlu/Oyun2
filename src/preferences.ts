import type {Mode,Run} from './game';
export type Language='tr'|'en'|'de'|'es';
export type QualityMode='auto'|'high'|'low';
export type ThemeName='violet'|'aurora'|'solar';
export type Preferences={music:boolean;effects:boolean;haptics:boolean;language:Language;quality:QualityMode;theme:ThemeName;reducedMotion:boolean};
export type Profile={version:3;records:Record<Mode,number>;plays:number;crystals:number;bestTime:number;bestStreak:number;novas:number;nearMisses:number;xp:number;phases:number;anomalies:number;missions:number};
export const DEFAULT_PREFS:Preferences={music:true,effects:true,haptics:true,language:'tr',quality:'auto',theme:'violet',reducedMotion:false};
export const DEFAULT_PROFILE:Profile={version:3,records:{classic:0,sprint:0,rift:0},plays:0,crystals:0,bestTime:0,bestStreak:0,novas:0,nearMisses:0,xp:0,phases:0,anomalies:0,missions:0};
function number(v:unknown){return typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.floor(v)):0;}
export function parsePreferences(raw:string|null):Preferences {
  try{const p=JSON.parse(raw||'{}');if(!p||typeof p!=='object')return {...DEFAULT_PREFS};
    return {music:p.music!==false,effects:p.effects!==false,haptics:p.haptics!==false,
      language:['tr','en','de','es'].includes(p.language)?p.language:'tr',quality:['auto','high','low'].includes(p.quality)?p.quality:p.lowPower?'low':'auto',
      theme:['violet','aurora','solar'].includes(p.theme)?p.theme:'violet',reducedMotion:p.reducedMotion===true};
  }catch{return {...DEFAULT_PREFS};}
}
export function parseProfile(raw:string|null,legacyBest:string|null):Profile {
  try{const p=JSON.parse(raw||'{}');if(!p||typeof p!=='object')throw new Error();
    return {version:3,records:{classic:Math.max(number(p.records?.classic),number(Number(legacyBest))),sprint:number(p.records?.sprint),rift:number(p.records?.rift)},plays:number(p.plays),crystals:number(p.crystals),bestTime:number(p.bestTime),bestStreak:number(p.bestStreak),novas:number(p.novas),nearMisses:number(p.nearMisses),xp:number(p.xp??(number(p.plays)*20+number(p.crystals)*2)),phases:number(p.phases),anomalies:number(p.anomalies),missions:number(p.missions)};
  }catch{return {...DEFAULT_PROFILE,records:{classic:number(Number(legacyBest)),sprint:0,rift:0}};}
}
export function recordRun(p:Profile,r:Run):Profile {
  return {...p,records:{...p.records,[r.mode]:Math.max(p.records[r.mode],r.score)},plays:p.plays+1,crystals:p.crystals+r.collected,bestTime:Math.max(p.bestTime,Math.floor(r.time)),bestStreak:Math.max(p.bestStreak,r.maxStreak),novas:p.novas+r.novas,nearMisses:p.nearMisses+r.nearMisses,xp:p.xp+earnedXP(r),phases:p.phases+r.phaseUses,anomalies:p.anomalies+r.anomaliesCleared,missions:p.missions+(r.missionComplete?1:0)};
}
export function earnedXP(r:Run) {return 8+Math.floor(r.time*1.5)+Math.floor(r.score/18)+r.anomaliesCleared*15+(r.missionComplete?35:0);}
export function levelProgress(xp:number){
  const safe=Math.max(0,Math.min(1e8,Number.isFinite(xp)?xp:0));
  const level=Math.floor(Math.sqrt(safe/90))+1,start=(level-1)**2*90,end=level**2*90;
  return {level,current:Math.floor(safe-start),required:end-start,progress:(safe-start)/(end-start)};
}
export const THEMES={
 violet:{outer:'#9d6cff',inner:'#43d6ec',core:'#b3a2ff',glow:'#7754df',name:'Violet'},
 aurora:{outer:'#44dda4',inner:'#72a5ff',core:'#b2ffde',glow:'#39b68c',name:'Aurora'},
 solar:{outer:'#f0b04e',inner:'#e979bc',core:'#ffdc9c',glow:'#d89a40',name:'Solar'},
} as const;
