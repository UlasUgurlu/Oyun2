import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,advance,switchLane,activateNova,ENTITY_POOL_SIZE,SPRINT_SECONDS} from '../src/game.ts';
import {DEFAULT_PREFS,DEFAULT_PROFILE,parsePreferences,parseProfile,recordRun} from '../src/preferences.ts';
import {DICTIONARIES,LANGUAGES} from '../src/i18n.ts';

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
  assert.deepEqual(profile.records,{classic:123,sprint:45});
  const r=createRun('over',1,'sprint');r.score=100;r.collected=7;r.time=60;r.novas=2;
  const next=recordRun(profile,r);assert.deepEqual(next.records,{classic:123,sprint:100});assert.equal(next.plays,1);assert.equal(next.crystals,7);assert.equal(next.novas,2);
  assert.deepEqual(profile.records,{classic:123,sprint:45});
  assert.deepEqual(parseProfile('bad','321').records,{classic:321,sprint:0});
  assert.equal(parseProfile('{"plays":-10,"records":{"classic":"oops"}}',null).plays,0);
});
test('all four languages provide every UI and accessibility string',()=>{
  const keys=Object.keys(DICTIONARIES.tr).sort();assert.equal(LANGUAGES.length,4);
  for(const {id} of LANGUAGES){assert.deepEqual(Object.keys(DICTIONARIES[id]).sort(),keys);assert.ok(Object.values(DICTIONARIES[id]).every(v=>typeof v==='string'&&v.length>0));}
});
