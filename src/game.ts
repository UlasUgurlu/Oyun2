export type Phase = 'home' | 'playing' | 'paused' | 'over';
export type Lane = 0 | 1;
export type Mode = 'classic' | 'sprint' | 'rift';
export type Core = 'balanced' | 'guardian' | 'volatile';
export type Anomaly = 'none' | 'surge' | 'mirror' | 'magnet';
export type Mission = 'collect' | 'phase' | 'near';
export const CORES = {
  balanced: { score: 1, speed: 1, cooldown: 9 },
  guardian: { score: .85, speed: 1, cooldown: 9 },
  volatile: { score: 1.4, speed: 1.1, cooldown: 12 },
} as const;
export const RADII = [2.0, 3.2] as const;
export const ENTITY_POOL_SIZE = 24;
export const FIXED_STEP = 1 / 120;
export const SPRINT_SECONDS = 60;
export type Entity = { id: number; angle: number; lane: Lane; kind: 'spark' | 'gate' | 'shield'; closest?: number; laneBlend?: number; shiftFrom?: Lane; shiftTo?: Lane };
export type Burst = { id: number; kind: 'spark' | 'switch' | 'crash' | 'shield' | 'nova'; x: number; z: number; life: number; duration: number };
export type GameEvent = { type: 'pickup' | 'combo' | 'crash' | 'shield' | 'shieldHit' | 'nearMiss' | 'finish' | 'warning' | 'anomaly' | 'resolved' | 'mission'; points?: number; streak?: number; anomaly?: Anomaly };
export type Run = {
  phase: Phase; mode: Mode; angle: number; targetLane: Lane; laneBlend: number;
  prevAngle: number; prevBlend: number; displayAngle: number; displayBlend: number;
  accumulator: number; visualTime: number; time: number; score: number; streak: number;
  maxStreak: number; collected: number; speed: number; nextAngle: number; nextId: number;
  spawnIndex: number; entities: Entity[]; bursts: Burst[]; burstCursor: number; fxId: number;
  shake: number; switchPulse: number; seed: number; shield: boolean; invulnerable: number;
  charge: number; novaLeft: number; novas: number; nearMisses: number; finishReason: 'crash' | 'complete';
  events: GameEvent[];
  core: Core; phaseLeft: number; phaseCooldown: number; phaseUses: number;
  anomaly: Anomaly; upcoming: Anomaly; anomalyLeft: number; nextAnomaly: number;
  anomalyIndex: number; anomalyOffset: number; anomaliesCleared: number; direction: 1 | -1;
  mission: Mission; missionComplete: boolean;
};
const EMPTY_EVENTS: GameEvent[] = [];
function random(r: Run) { r.seed = (Math.imul(1664525, r.seed) + 1013904223) >>> 0; return r.seed / 4294967296; }
function fill(r: Run) {
  while (r.nextAngle < r.angle + 5.1 && r.entities.length < ENTITY_POOL_SIZE - 2) {
    const i = r.spawnIndex++, lane: Lane = i === 0 ? 0 : random(r) > .5 ? 1 : 0;
    const kind = i > 0 && i % 10 === 9 ? 'shield' : 'spark';
    const spark: Entity = { id:r.nextId++, angle:r.nextAngle, lane, kind };
    r.entities.push(spark);
    if (i > 1 && (i % 3 === 2 || (r.mode === 'rift' && i > 10 && i % 4 === 0))) {
      const other: Lane = lane === 0 ? 1 : 0;
      const gate: Entity = {id:r.nextId++,angle:r.nextAngle,lane:other,kind:'gate',closest:Infinity};
      if (r.mode === 'rift' && i % 6 === 5 && kind === 'spark') {
        spark.shiftFrom=lane;spark.shiftTo=other;
        gate.shiftFrom=other;gate.shiftTo=lane;
      }
      r.entities.push(gate);
    }
    r.nextAngle += r.mode === 'rift' ? Math.max(.70,.82-r.time*.001) : Math.max(.59,.76-r.time*.0013);
  }
}
export function createRun(phase:Phase='home',seed=Date.now()>>>0,mode:Mode='classic',core:Core='balanced'):Run {
  seed=seed>>>0;
  const r:Run={phase,mode,angle:0,targetLane:0,laneBlend:0,prevAngle:0,prevBlend:0,displayAngle:0,displayBlend:0,
    accumulator:0,visualTime:0,time:0,score:0,streak:0,maxStreak:0,collected:0,speed:1.25,nextAngle:.78,nextId:0,
    spawnIndex:0,entities:[],bursts:Array.from({length:6},()=>({id:0,kind:'spark' as const,x:0,z:0,life:0,duration:1})),
    burstCursor:0,fxId:0,shake:0,switchPulse:0,seed,shield:phase==='playing'&&core==='guardian',invulnerable:0,charge:0,novaLeft:0,novas:0,nearMisses:0,finishReason:'crash',events:[],
    core,phaseLeft:0,phaseCooldown:0,phaseUses:0,anomaly:'none',upcoming:'none',anomalyLeft:0,nextAnomaly:8,
    anomalyIndex:0,anomalyOffset:seed%3,anomaliesCleared:0,direction:1,mission:(['collect','phase','near'] as const)[seed%3],missionComplete:false};
  fill(r);return r;
}
function burst(r:Run,kind:Burst['kind'],x:number,z:number) {
  const b=r.bursts[r.burstCursor];r.burstCursor=(r.burstCursor+1)%r.bursts.length;
  b.id=r.fxId++;b.kind=kind;b.x=x;b.z=z;b.duration=kind==='crash'?1.3:kind==='nova'?1:.6;b.life=b.duration;
}
export function switchLane(r:Run) {
  if(r.phase!=='playing')return false;
  r.targetLane=r.targetLane===0?1:0;r.switchPulse=1;
  burst(r,'switch',0,RADII[0]+r.laneBlend*(RADII[1]-RADII[0]));return true;
}
export function activateNova(r:Run) {
  if(r.phase!=='playing'||r.charge<100||r.novaLeft>0)return false;
  r.charge=0;r.novaLeft=5;r.novas++;burst(r,'nova',0,RADII[0]+r.laneBlend*(RADII[1]-RADII[0]));return true;
}
export function activatePhase(r:Run) {
  if(r.phase!=='playing'||r.phaseCooldown>0||r.phaseLeft>0)return false;
  r.phaseLeft=1.25;r.invulnerable=Math.max(r.invulnerable,r.phaseLeft);
  r.phaseCooldown=CORES[r.core].cooldown;r.phaseUses++;
  burst(r,'shield',0,RADII[0]+r.laneBlend*1.2);return true;
}
export function multiplier(r:Run) { return Math.min(5,1+Math.floor(r.streak/5))*(r.novaLeft>0?2:1)*(r.anomaly==='surge'?2:1); }
export function missionProgress(r:Run) {return r.mission==='collect'?r.collected:r.mission==='phase'?r.phaseUses:r.nearMisses;}
export function missionTarget(r:Run) {return r.mission==='collect'?18:r.mission==='phase'?2:3;}
export function entityLane(e:Entity) {return e.laneBlend??e.lane;}
export function entityAngle(r:Run,e:Entity) {return Math.PI/2+(e.angle-r.displayAngle)*r.direction;}
function anomalies(r:Run,dt:number) {
  if(r.mode!=='rift')return;
  if(r.anomalyLeft>0){
    r.anomalyLeft=Math.max(0,r.anomalyLeft-dt);
    if(r.anomalyLeft===0){
      if(r.direction===-1)r.invulnerable=Math.max(r.invulnerable,.6);
      r.direction=1;r.anomaly='none';r.anomaliesCleared++;r.score+=60;
      r.events.push({type:'resolved',points:60});
    }
  }
  if(r.anomaly==='none'&&r.time>=r.nextAnomaly-2.5&&r.upcoming==='none'){
    r.upcoming=(['surge','mirror','magnet'] as const)[(r.anomalyIndex+r.anomalyOffset)%3];
    r.events.push({type:'warning',anomaly:r.upcoming});
  }
  if(r.upcoming!=='none'&&r.time>=r.nextAnomaly){
    r.anomaly=r.upcoming;r.upcoming='none';r.anomalyLeft=6;
    r.direction=r.anomaly==='mirror'?-1:1;
    r.invulnerable=Math.max(r.invulnerable,.6);
    r.anomalyIndex++;r.nextAnomaly=r.time+15;
    burst(r,'nova',0,0);r.events.push({type:'anomaly',anomaly:r.anomaly});
  }
}
function simulate(r:Run) {
  const dt=FIXED_STEP;r.time+=dt;r.invulnerable=Math.max(0,r.invulnerable-dt);r.novaLeft=Math.max(0,r.novaLeft-dt);
  r.phaseLeft=Math.max(0,r.phaseLeft-dt);r.phaseCooldown=Math.max(0,r.phaseCooldown-dt);
  anomalies(r,dt);
  if(r.mode==='sprint'&&r.time>=SPRINT_SECONDS-1e-8){r.time=SPRINT_SECONDS;r.phase='over';r.finishReason='complete';r.events.push({type:'finish'});return;}
  r.speed=Math.min(r.mode==='rift'?2.5:2.35,(r.mode==='rift'?1.35:1.25)+r.time*.014)*CORES[r.core].speed*(r.novaLeft>0?1.12:1)*(r.anomaly==='surge'?1.35:1);
  r.laneBlend+=(r.targetLane-r.laneBlend)*(1-Math.exp(-dt*23));r.angle+=r.speed*dt;
  let write=0;
  for(let i=0;i<r.entities.length;i++) {
    const e=r.entities[i],offset=e.angle-r.angle;
    if(e.shiftFrom!==undefined&&e.shiftTo!==undefined){
      const p=Math.max(0,Math.min(1,(2.9-offset)/1.3));
      e.laneBlend=e.shiftFrom+(e.shiftTo-e.shiftFrom)*p*p*(3-2*p);
      if(p===1)e.lane=e.shiftTo;
    }
    const distance=Math.abs(entityLane(e)-r.laneBlend)*(RADII[1]-RADII[0]);
    if(e.kind==='gate'&&Math.abs(offset)<.16)e.closest=Math.min(e.closest??Infinity,distance);
    let consumed=false;
    if(Math.abs(offset)<.115) {
      if(e.kind==='gate'&&distance<.28&&r.invulnerable<=0) {
        if(r.shield){r.shield=false;r.invulnerable=.6;consumed=true;burst(r,'shield',0,RADII[0]+r.laneBlend*1.2);r.events.push({type:'shieldHit'});}
        else {r.phase='over';r.finishReason='crash';r.shake=.6;burst(r,'crash',0,RADII[0]+r.laneBlend*1.2);r.events.push({type:'crash'});}
      } else if(e.kind!=='gate'&&(distance<.28||(e.kind==='spark'&&(r.novaLeft>0||r.anomaly==='magnet')))) {
        consumed=true;
        if(e.kind==='shield'){r.shield=true;burst(r,'shield',0,RADII[e.lane]);r.events.push({type:'shield'});}
        else {
          r.streak++;r.maxStreak=Math.max(r.maxStreak,r.streak);r.collected++;
          const points=Math.round(12*multiplier(r)*CORES[r.core].score);r.score+=points;if(r.novaLeft<=0)r.charge=Math.min(100,r.charge+12);
          burst(r,'spark',0,RADII[e.lane]);r.events.push({type:r.streak%5===0?'combo':'pickup',points,streak:r.streak});
        }
      }
    }
    if(!consumed&&offset<-.14) {
      consumed=true;
      if(e.kind==='spark')r.streak=0;
      if(e.kind==='gate'&&(e.closest??Infinity)<.70&&r.invulnerable<=0){r.nearMisses++;r.score+=8;if(r.novaLeft<=0)r.charge=Math.min(100,r.charge+8);r.events.push({type:'nearMiss',points:8});}
    }
    if(!consumed)r.entities[write++]=e;
    if(r.phase==='over') { for(let j=i+1;j<r.entities.length;j++)r.entities[write++]=r.entities[j];break; }
  }
  r.entities.length=write;
  if(r.phase==='playing'){
    if(!r.missionComplete&&missionProgress(r)>=missionTarget(r)){r.missionComplete=true;r.score+=150;r.events.push({type:'mission',points:150});}
    fill(r);
  }
}
export function advance(r:Run,delta:number):GameEvent[] {
  if(r.phase==='paused')return EMPTY_EVENTS;
  r.events.length=0;
  const dt=Number.isFinite(delta)?Math.min(.1,Math.max(0,delta)):0;
  r.visualTime+=dt;r.shake=Math.max(0,r.shake-dt*1.4);r.switchPulse=Math.max(0,r.switchPulse-dt*3);
  for(let i=0;i<r.bursts.length;i++)r.bursts[i].life=Math.max(0,r.bursts[i].life-dt);
  if(r.phase!=='playing')return r.events;
  r.accumulator+=dt;
  while(r.accumulator+1e-10>=FIXED_STEP&&r.phase==='playing') {
    r.prevAngle=r.angle;r.prevBlend=r.laneBlend;simulate(r);r.accumulator=Math.max(0,r.accumulator-FIXED_STEP);
  }
  const a=r.phase==='playing'?r.accumulator/FIXED_STEP:1;
  r.displayAngle=r.prevAngle+(r.angle-r.prevAngle)*a;r.displayBlend=r.prevBlend+(r.laneBlend-r.prevBlend)*a;
  return r.events;
}
