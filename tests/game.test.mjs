import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,advance,switchLane,activateNova,activatePhase,entityAngle,entityLane,ENTITY_POOL_SIZE,SPRINT_SECONDS} from '../src/game.ts';
import {DEFAULT_PREFS,DEFAULT_PROFILE,parsePreferences,parseProfile,recordRun,earnedXP,levelProgress} from '../src/preferences.ts';
import {DICTIONARIES,LANGUAGES} from '../src/i18n.ts';
import {EXPANSION_TEXT} from '../src/expansionI18n.ts';

function isolated(kind='spark',lane=0) {
  const r=createRun('playing',1);r.entities=[{id:100,angle:.09,lane,kind}];r.nextAngle=100;
  return r;
}
test('a collected crystal scores once and emits one effect',()=>{
  const r=isolated();const events=advance(r,.016);
  assert.equal(events[0].type,'pickup');assert.equal(r.score,12);assert.equal(r.entities.length,0);
  advance(r,.016);assert.equal(r.score,12);assert.equal(r.collected,1);
});
test('only a gate on the occupied orbit ends a run',()=>{
  const blocked=isolated('gate',0);assert.equal(advance(blocked,.016)[0].type,'crash');assert.equal(blocked.phase,'over');
  const open=isolated('gate',1);advance(open,.016);assert.equal(open.phase,'playing');
});
test('a missed crystal resets the multiplier while preserving the best streak',()=>{
  const r=isolated('spark',1);r.streak=8;r.maxStreak=8;r.angle=.3;
  advance(r,.016);assert.equal(r.streak,0);assert.equal(r.maxStreak,8);assert.equal(r.score,0);
});
test('orbit change interpolates and pause freezes simulation',()=>{
  const r=isolated();r.entities=[];switchLane(r);assert.equal(r.targetLane,1);assert.equal(r.laneBlend,0);
  advance(r,.016);assert.ok(r.laneBlend>0&&r.laneBlend<1);
  r.phase='paused';const before=JSON.stringify(r);advance(r,1);assert.equal(JSON.stringify(r),before);
});
test('patterns fit the renderer pool and leave an open orbit at every gate',()=>{
  for(let seed=1;seed<120;seed++) {
    const r=createRun('playing',seed);r.angle=100;r.time=90;r.nextAngle=100.4;r.entities=[];
    advance(r,.016);assert.ok(r.entities.length<=ENTITY_POOL_SIZE);
    for(const gate of r.entities.filter(e=>e.kind==='gate')){
      assert.ok(r.entities.some(e=>e.angle===gate.angle&&e.kind==='spark'&&e.lane!==gate.lane));
      assert.ok(!r.entities.some(e=>e.angle===gate.angle&&e.kind==='gate'&&e.lane!==gate.lane));
    }
    assert.ok(r.entities.every(e=>e.angle-r.angle<Math.PI*2));
  }
});

test('30, 60 and 120 fps produce the same simulation over ten seconds',()=>{
  const runs=[30,60,120].map(fps=>{
    const r=isolated();r.entities=[];r.nextAngle=1000;switchLane(r);
    for(let i=0;i<fps*10;i++)advance(r,1/fps);
    return r;
  });
  for(const r of runs){assert.ok(Math.abs(r.time-10)<1e-8);assert.ok(r.displayAngle<=r.angle);}
  assert.ok(Math.abs(runs[0].angle-runs[1].angle)<1e-8);
  assert.ok(Math.abs(runs[1].angle-runs[2].angle)<1e-8);
  assert.equal(runs[0].laneBlend,runs[2].laneBlend);
});
test('a long frame is capped and cannot skip a gate collision',()=>{
  const r=isolated('gate');r.entities[0].angle=.18;
  advance(r,10);assert.equal(r.phase,'over');assert.ok(r.time<=.1);
});
test('invalid delta values cannot corrupt the run',()=>{
  const r=isolated();const before=JSON.stringify(r);
  for(const dt of [NaN,Infinity,-3])advance(r,dt);
  assert.equal(JSON.stringify(r),before);
});
test('a shield collectible grants one protection without breaking the streak',()=>{
  const r=isolated('shield');r.streak=7;
  assert.equal(advance(r,.016)[0].type,'shield');
  assert.equal(r.shield,true);assert.equal(r.streak,7);assert.equal(r.score,0);
});
test('the shield absorbs one impact and the next impact after grace time ends the run',()=>{
  const r=isolated('gate');r.shield=true;
  assert.equal(advance(r,.016)[0].type,'shieldHit');
  assert.equal(r.phase,'playing');assert.equal(r.shield,false);
  for(let i=0;i<7;i++)advance(r,.1);
  r.entities=[{id:200,angle:r.angle+.09,lane:0,kind:'gate'}];
  assert.equal(advance(r,.016)[0].type,'crash');assert.equal(r.phase,'over');
});
test('Nova needs a full charge, collects the other orbit and expires',()=>{
  const r=isolated('spark',1);r.charge=99;assert.equal(activateNova(r),false);
  r.charge=100;assert.equal(activateNova(r),true);assert.equal(activateNova(r),false);
  advance(r,.016);assert.equal(r.score,24);assert.equal(r.collected,1);assert.equal(r.charge,0);assert.equal(r.novas,1);
  for(let i=0;i<51;i++)advance(r,.1);
  assert.equal(r.novaLeft,0);r.entities=[{id:201,angle:r.angle+.09,lane:1,kind:'spark'}];
  advance(r,.016);assert.equal(r.collected,1);
});
test('paused inputs cannot change lanes or consume Nova',()=>{
  const r=createRun('paused',1);r.charge=100;
  assert.equal(switchLane(r),false);assert.equal(activateNova(r),false);assert.equal(r.charge,100);
});
test('a close safe transition grants one near miss bonus',()=>{
  const r=isolated('gate',0);r.laneBlend=.3;r.targetLane=1;r.prevBlend=.3;
  let count=0;for(let i=0;i<5;i++)count+=advance(r,.1).filter(e=>e.type==='nearMiss').length;
  assert.equal(r.phase,'playing');assert.equal(count,1);assert.equal(r.score,8);assert.equal(r.charge,8);
});
test('a pickup followed by a crash in the same step is not duplicated',()=>{
  const r=isolated();r.entities.push({id:101,angle:.09,lane:0,kind:'gate'});
  const events=advance(r,.016).map(e=>e.type);assert.deepEqual(events,['pickup','crash']);
  advance(r,.1);assert.equal(r.score,12);assert.equal(r.collected,1);assert.ok(!r.entities.some(e=>e.id===100));
});
test('sprint finishes at exactly sixty seconds and emits finish once',()=>{
  const r=createRun('playing',1,'sprint');r.entities=[];r.nextAngle=1000;let finishes=0;
  for(let i=0;i<601;i++)finishes+=advance(r,.1).filter(e=>e.type==='finish').length;
  assert.equal(r.time,SPRINT_SECONDS);assert.equal(r.phase,'over');assert.equal(r.finishReason,'complete');assert.equal(finishes,1);
});
test('deterministic patterns remain bounded and never block both orbits',()=>{
  for(let seed=1;seed<=200;seed++){
    const r=createRun('playing',seed);assert.deepEqual(r.entities,createRun('playing',seed).entities);
    for(let window=0;window<20;window++){
      r.angle=window*6;r.time=window*5;r.entities=[];r.nextAngle=r.angle+.4;
      advance(r,.016);assert.ok(r.entities.length<=ENTITY_POOL_SIZE);
      for(const gate of r.entities.filter(e=>e.kind==='gate')){
        assert.ok(r.entities.some(e=>e.angle===gate.angle&&e.kind!=='gate'&&e.lane!==gate.lane));
        assert.ok(!r.entities.some(e=>e.angle===gate.angle&&e.kind==='gate'&&e.lane!==gate.lane));
      }
    }
  }
});
test('burst storage stays bounded after thousands of lane switches',()=>{
  const r=isolated();r.entities=[];r.nextAngle=1000;const bursts=r.bursts;
  for(let i=0;i<5000;i++)switchLane(r);
  assert.equal(r.bursts,bursts);assert.equal(r.bursts.length,6);assert.ok(r.bursts.every(b=>Number.isFinite(b.life)));
});
test('old preferences migrate and malformed storage falls back safely',()=>{
  assert.equal(parsePreferences('{"lowPower":true,"music":false}').quality,'low');
  assert.equal(parsePreferences('{"lowPower":true,"music":false}').music,false);
  for(const raw of ['broken','null','{"language":"xx","theme":"bad","quality":"bad"}'])assert.deepEqual(parsePreferences(raw),DEFAULT_PREFS);
});
test('legacy records survive migration and mode records stay separate',()=>{
  const profile=parseProfile('{"records":{"classic":80,"sprint":45}}','123');
  assert.deepEqual(profile.records,{classic:123,sprint:45,rift:0});
  const r=createRun('over',1,'sprint');r.score=100;r.collected=7;r.time=60;r.novas=2;
  const next=recordRun(profile,r);assert.deepEqual(next.records,{classic:123,sprint:100,rift:0});assert.equal(next.plays,1);assert.equal(next.crystals,7);assert.equal(next.novas,2);
  assert.deepEqual(profile.records,{classic:123,sprint:45,rift:0});
  assert.deepEqual(parseProfile('bad','321').records,{classic:321,sprint:0,rift:0});
  assert.equal(parseProfile('{"plays":-10,"records":{"classic":"oops"}}',null).plays,0);
});
test('all four languages provide every UI and accessibility string',()=>{
  const keys=Object.keys(DICTIONARIES.tr).sort();assert.equal(LANGUAGES.length,4);
  for(const {id} of LANGUAGES){assert.deepEqual(Object.keys(DICTIONARIES[id]).sort(),keys);assert.ok(Object.values(DICTIONARIES[id]).every(v=>typeof v==='string'&&v.length>0));}
});

test('phase protection passes a gate, preserves the shield and enforces its cooldown',()=>{
  const r=isolated('gate');r.shield=true;
  assert.equal(activatePhase(r),true);assert.equal(activatePhase(r),false);
  advance(r,.1);assert.equal(r.phase,'playing');assert.equal(r.shield,true);assert.equal(r.phaseUses,1);
  for(let i=0;i<13;i++)advance(r,.1);
  assert.equal(r.phaseLeft,0);assert.ok(r.phaseCooldown>0);
  r.entities=[{id:200,angle:r.angle+.08,lane:0,kind:'gate'}];
  assert.equal(advance(r,.016)[0].type,'shieldHit');assert.equal(r.shield,false);
  r.entities=[];r.nextAngle=1000;
  for(let i=0;i<90;i++)advance(r,.1);
  assert.equal(activatePhase(r),true);assert.equal(r.phaseUses,2);
});
test('phase and anomaly clocks freeze during pause and phase cannot be cast outside play',()=>{
  const r=createRun('playing',1,'rift');r.entities=[];r.nextAngle=1000;
  activatePhase(r);advance(r,.1);r.phase='paused';const before=JSON.stringify(r);
  advance(r,10);assert.equal(activatePhase(r),false);assert.equal(JSON.stringify(r),before);
  r.phase='over';assert.equal(activatePhase(r),false);
});
test('core choices change actual risk and points without changing the balanced baseline',()=>{
  const guard=createRun('playing',1,'classic','guardian');assert.equal(guard.shield,true);
  const base=createRun('playing',1,'classic','balanced'),risk=createRun('playing',1,'classic','volatile');
  for(const r of [base,risk]){r.entities=[{id:100,angle:.08,lane:0,kind:'spark'}];r.nextAngle=1000;advance(r,.016);}
  assert.equal(base.score,12);assert.equal(risk.score,17);assert.ok(risk.speed>base.speed);
  activatePhase(risk);assert.equal(risk.phaseCooldown,12);
});
test('a shifting gate and its reward settle into opposite orbits before contact',()=>{
  const r=createRun('playing',0,'rift');
  const gate=r.entities.find(e=>e.kind==='gate'&&e.shiftFrom!==undefined);
  const spark=r.entities.find(e=>e.angle===gate.angle&&e.kind==='spark');
  assert.ok(gate&&spark);r.entities=[spark,gate];r.nextAngle=1000;r.invulnerable=100;
  let sawMovement=false;
  while(gate.angle-r.angle>1.55){advance(r,1/60);const position=entityLane(gate);if(position>.05&&position<.95)sawMovement=true;assert.ok(Math.abs(entityLane(gate)+entityLane(spark)-1)<1e-8);}
  assert.equal(sawMovement,true);assert.equal(entityLane(gate),gate.shiftTo);assert.equal(gate.lane,gate.shiftTo);
  assert.ok(gate.angle-r.angle>1.4);
});
test('mirror anomaly warns, reverses the visible approach and returns safely to normal',()=>{
  const r=createRun('playing',1,'rift');r.entities=[];r.nextAngle=1000;
  let warnings=0,starts=0,ends=0;
  for(let i=0;i<81;i++)for(const e of advance(r,.1)){warnings+=e.type==='warning';starts+=e.type==='anomaly';}
  assert.equal(warnings,1);assert.equal(starts,1);assert.equal(r.anomaly,'mirror');assert.equal(r.direction,-1);
  const e={id:1,lane:0,kind:'spark',angle:r.displayAngle+.5};assert.ok(entityAngle(r,e)<Math.PI/2);
  e.angle=r.displayAngle;assert.equal(entityAngle(r,e),Math.PI/2);
  for(let i=0;i<65;i++)for(const e of advance(r,.1))ends+=e.type==='resolved';
  assert.equal(ends,1);assert.equal(r.direction,1);assert.equal(r.anomaliesCleared,1);assert.equal(r.score,60);
});
test('overdrive doubles points while magnet collects a crystal from the other orbit',()=>{
  for(const [seed,kind,lane,expected] of [[0,'surge',0,24],[2,'magnet',1,12]]){
    const r=createRun('playing',seed,'rift');r.entities=[];r.nextAngle=1000;
    for(let i=0;i<81;i++)advance(r,.1);
    assert.equal(r.anomaly,kind);r.entities=[{id:100,angle:r.angle+.08,lane,kind:'spark'}];
    advance(r,.016);assert.equal(r.collected,1);assert.equal(r.score,expected);
  }
});
test('a side mission awards points and XP once, and progress is preserved in the profile',()=>{
  const r=isolated();r.mission='collect';r.collected=17;
  const events=advance(r,.016);assert.equal(events.filter(e=>e.type==='mission').length,1);assert.equal(r.score,162);assert.equal(r.missionComplete,true);
  assert.equal(advance(r,.1).filter(e=>e.type==='mission').length,0);
  const p=recordRun(parseProfile(null,null),r);assert.equal(p.missions,1);assert.equal(p.xp,earnedXP(r));assert.ok(p.xp>=35);
});
test('old profiles gain progress credit and all three mode records survive another save',()=>{
  const p=parseProfile('{"version":2,"plays":3,"crystals":5,"records":{"classic":123,"sprint":456}}',null);
  assert.equal(p.xp,70);assert.equal(p.version,3);assert.deepEqual(p.records,{classic:123,sprint:456,rift:0});
  const r=createRun('over',1,'rift');r.score=789;r.anomaliesCleared=2;r.phaseUses=3;
  const saved=recordRun(p,r),restored=parseProfile(JSON.stringify(saved),null);
  assert.deepEqual(restored,saved);assert.equal(restored.records.rift,789);assert.equal(restored.records.classic,123);assert.equal(restored.anomalies,2);
  assert.deepEqual(levelProgress(0),{level:1,current:0,required:90,progress:0});assert.equal(levelProgress(90).level,2);
  assert.ok(Number.isFinite(levelProgress(Infinity).progress));
});
test('rift mode stays deterministic across frame rates and keeps bounded, avoidable patterns',()=>{
  const runs=[30,60,120].map(fps=>{const r=createRun('playing',1,'rift');r.entities=[];r.nextAngle=1000;for(let i=0;i<fps*20;i++)advance(r,1/fps);return r;});
  assert.ok(Math.abs(runs[0].angle-runs[2].angle)<1e-8);assert.equal(runs[0].anomaliesCleared,runs[2].anomaliesCleared);assert.equal(runs[0].score,runs[2].score);
  for(let seed=0;seed<100;seed++){
    const r=createRun('playing',seed,'rift');assert.ok(r.entities.length<=ENTITY_POOL_SIZE);
    for(const gate of r.entities.filter(e=>e.kind==='gate'))assert.ok(r.entities.some(e=>e.angle===gate.angle&&e.kind!=='gate'&&e.lane!==gate.lane));
  }
});
test('all expansion text, tactics and mode labels are present in every language',()=>{
  const keys=Object.keys(EXPANSION_TEXT.tr).sort();
  for(const {id} of LANGUAGES){assert.deepEqual(Object.keys(EXPANSION_TEXT[id]).sort(),keys);assert.ok(Object.values(EXPANSION_TEXT[id]).every(v=>typeof v==='string'&&v.trim().length));}
});
