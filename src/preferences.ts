import type {Mode,Run} from './game';
export type Language='tr'|'en'|'de'|'es';
export type QualityMode='auto'|'high'|'low';
export type ThemeName='violet'|'aurora'|'solar';
export type Preferences={music:boolean;effects:boolean;haptics:boolean;language:Language;quality:QualityMode;theme:ThemeName;reducedMotion:boolean};
export type Profile={version:2;records:Record<Mode,number>;plays:number;crystals:number;bestTime:number;bestStreak:number;novas:number;nearMisses:number};
export const DEFAULT_PREFS:Preferences={music:true,effects:true,haptics:true,language:'tr',quality:'auto',theme:'violet',reducedMotion:false};
export const DEFAULT_PROFILE:Profile={version:2,records:{classic:0,sprint:0},plays:0,crystals:0,bestTime:0,bestStreak:0,novas:0,nearMisses:0};
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
    return {version:2,records:{classic:Math.max(number(p.records?.classic),number(Number(legacyBest))),sprint:number(p.records?.sprint)},plays:number(p.plays),crystals:number(p.crystals),bestTime:number(p.bestTime),bestStreak:number(p.bestStreak),novas:number(p.novas),nearMisses:number(p.nearMisses)};
  }catch{return {...DEFAULT_PROFILE,records:{classic:number(Number(legacyBest)),sprint:0}};}
}
export function recordRun(p:Profile,r:Run):Profile {
  return {...p,records:{...p.records,[r.mode]:Math.max(p.records[r.mode],r.score)},plays:p.plays+1,crystals:p.crystals+r.collected,bestTime:Math.max(p.bestTime,Math.floor(r.time)),bestStreak:Math.max(p.bestStreak,r.maxStreak),novas:p.novas+r.novas,nearMisses:p.nearMisses+r.nearMisses};
}
export const THEMES={
 violet:{outer:'#9d6cff',inner:'#43d6ec',core:'#b3a2ff',glow:'#7754df',name:'Violet'},
 aurora:{outer:'#44dda4',inner:'#72a5ff',core:'#b2ffde',glow:'#39b68c',name:'Aurora'},
 solar:{outer:'#f0b04e',inner:'#e979bc',core:'#ffdc9c',glow:'#d89a40',name:'Solar'},
} as const;
