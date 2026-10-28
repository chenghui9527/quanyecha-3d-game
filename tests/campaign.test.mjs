import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { freshSave, normalizeSave } from '../src/save.js';
import { FLOOR, statsFor } from '../src/data.js';
import { SHARDS, jewelProgress, transferShard, raceWinner, resolveWorldEvent, completedChapters } from '../src/campaign.js';
import { reducedDamage } from '../src/combat.js';
import { playOpening } from './opening-player.mjs';
const storage = { setItem() {} };
function closeStory(game) { while (game.state === 'dialogue') game.nextDialogue(); }
function stage(id = 1) { const save = freshSave(); save.unlockedStage = id; save.unlocked = ['kagome','inuyasha']; const game = new Game(save, () => {}, storage); game.start(id); closeStory(game); return game; }

test('one finite jewel is conserved through captures, transfers and repeated AI resolutions', () => {
  const save = freshSave(); assert.equal(Object.values(SHARDS).reduce((n,s)=>n+s.share,0),10000);
  assert.equal(transferShard(save,'village','inuyasha'),false); save.jewel.started = true;
  assert.equal(transferShard(save,'village','inuyasha'),true); assert.equal(transferShard(save,'village','inuyasha'),false);
  assert.equal(resolveWorldEvent(save,'yura-resolved'),true); assert.equal(resolveWorldEvent(save,'yura-resolved'),false);
  transferShard(save,'patrol','inuyasha'); resolveWorldEvent(save,'yura-resolved');
  assert.deepEqual(jewelProgress(save),{inuyasha:500,naraku:0,world:9500}); assert.deepEqual(save.jewel.known,['village','patrol']);
});
test('pre-shattering ownership never wins; either faction wins immediately after a legitimate full capture', () => {
  for (const faction of ['inuyasha','naraku']) {
    const game = stage(); for (const id of Object.keys(SHARDS)) game.save.jewel.owners[id] = faction;
    assert.equal(raceWinner(game.save),null); game.save.jewel.started = true;
    assert.equal(game.checkRace(),faction); assert.equal(game.state,'ending');
  }
});
test('dialogue, pause and idle play cannot invent an enemy collection event', () => {
  const game = stage(); game.save.jewel.started = true;
  game.pause(); const initial = structuredClone(game.save.jewel);
  for (let i=0;i<600;i++) game.update(1/30,{right:true});
  assert.deepEqual(game.save.jewel,initial); game.resume(); game.showDialogue('level1Start');
  for (let i=0;i<600;i++) game.update(1/30,{});
  assert.deepEqual(game.save.jewel,initial); assert.deepEqual(game.save.worldEvents,[]);
});
test('a checkpoint retry restores shard ownership, knowledge and growth as one snapshot', () => {
  const game = stage(); game.save.jewel.started = true; game.activateCheckpoint(2310);
  transferShard(game.save,'village','inuyasha'); game.grow('promise'); resolveWorldEvent(game.save,'yura-resolved');
  const loaded = normalizeSave(JSON.parse(JSON.stringify(game.save))), resumed = new Game(loaded,()=>{},storage);
  resumed.start(1,true);
  assert.deepEqual(jewelProgress(resumed.save),{inuyasha:0,naraku:0,world:10000});
  assert.deepEqual(resumed.save.jewel.known,[]); assert.deepEqual(resumed.save.growthEvents,[]); assert.deepEqual(resumed.save.worldEvents,[]);
  assert.equal(resumed.save.heroes.kagome.stage,0); assert.equal(resumed.hero.x,2335);
});
test('physical, demon and spirit defenses are separate and combined mitigation caps at 80 percent', () => {
  assert.equal(reducedDamage(100,'physical',{defense:{physical:.5},clothing:{physical:.5}}),25);
  assert.ok(Math.abs(reducedDamage(100,'demon',{defense:{demon:.9},clothing:{demon:.9}})-20)<1e-9);
  assert.equal(reducedDamage(100,'spirit',{defense:{demon:.9}}),100);
});
test('being hit grants no invulnerability; a breaking barrier absorbs its entire hit and keeps existing poison', () => {
  const game = stage(); game.active='kagome'; const hp=game.health.kagome;
  game.damageHero(10); game.damageHero(10); assert.equal(game.health.kagome,hp-20); assert.equal(game.invulnerable,0);
  game.hurtClock=0; game.applyStatus('poison'); assert.equal(game.attack(1),true);
  assert.equal(game.damageHero(100),false); assert.equal(game.health.kagome,hp-20);
  assert.equal(game.damageHero(10),true); assert.equal(game.health.kagome,hp-30); assert.equal(game.statuses.kagome.poison.length,1);
});
test('one projectile volley hits a hero once while separate attacks can both hurt in the same frame', () => {
  const game=stage(), hp=game.health.inuyasha, hits=new Set();
  const projectile=()=>({owner:'enemy',x:game.hero.x,y:game.hero.y,w:15,h:15,vx:0,vy:0,life:1,damage:10});
  game.projectiles=[{...projectile(),hits},{...projectile(),hits},projectile()];
  game.updateProjectiles(1/60); assert.equal(game.health.inuyasha,hp-20);
});
test('revisiting a previous collection site cannot reclaim a shard now held by the rival', () => {
  const game=stage(); game.save.jewel.started=true; transferShard(game.save,'village','naraku');
  game.events.add('shatter'); Object.assign(game.hero,{x:4125,y:FLOOR-68,grounded:true});
  assert.equal(game.interactScene(),true); assert.equal(game.dialogue.key,'shardMoved'); closeStory(game);
  assert.equal(game.save.jewel.owners.village,'naraku'); assert.ok(game.events.has('village-shard'));
});
test('cross-scene poison and life survive saving the start of the next scene; barriers end at the transition', () => {
  const game=stage(0); game.save.unlockedStage=1; game.health.inuyasha=90; game.applyStatus('poison'); game.state='victory';
  game.start(1); closeStory(game); assert.equal(game.health.inuyasha,90); assert.equal(game.statuses.inuyasha.poison.length,1);
  const loaded=normalizeSave(JSON.parse(JSON.stringify(game.save))), resumed=new Game(loaded,()=>{},storage);
  resumed.start(1,true); closeStory(resumed);
  assert.equal(resumed.health.inuyasha,90); assert.equal(resumed.statuses.inuyasha.poison.length,1); assert.equal(resumed.barriers.inuyasha,null);
});
test('the tomb requires Kagome to pull the fang; protection unlocks the blade and survives replay without duplicate growth', () => {
  const game=stage(5); Object.assign(game.hero,{x:665,y:FLOOR-68,grounded:true});
  game.active='inuyasha'; assert.equal(game.interactScene(),false); closeStory(game); assert.equal(game.events.has('fang-taken'),false);
  game.switchCooldown=0; game.switchTo('kagome'); assert.equal(game.interactScene(),true); closeStory(game);
  assert.ok(game.save.heroes.inuyasha.unlocks.includes('tessaiga')); game.activateCheckpoint(900);
  const boss=game.spawnEnemy('sesshomaru',1580); game.bossSpawned=true;
  game.hitEnemy(boss,1e6); assert.equal(boss.hp,boss.maxHp*.5); game.updateEnemy(boss,1/60); closeStory(game);
  assert.equal(boss.phase,2); assert.ok(game.save.heroes.inuyasha.unlocks.includes('tessaiga-awaken'));
  game.switchCooldown=0; game.switchTo('inuyasha'); game.hurtClock=0;
  for (let i=0;i<10;i++) game.update(1/60,{});
  assert.equal(game.attack(),true); assert.equal(game.action.weapon,true);
  game.retry(); assert.equal(game.save.heroes.inuyasha.unlocks.includes('tessaiga-awaken'),false);
  assert.ok(game.save.heroes.inuyasha.unlocks.includes('tessaiga')); assert.deepEqual(game.save.growthEvents,[]);
});
test('all three chapters are playable from a fresh save using movement, interaction, arrows and skills', t => {
  let seed=12345; t.mock.method(Math,'random',()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
  const game=new Game(freshSave(),()=>{},storage), scenes=playOpening(game);
  assert.equal(scenes.length,6); assert.deepEqual(game.save.completed,[0,1,2,3,4,5]);
  assert.equal(completedChapters(game.save).length,3);
  assert.deepEqual(jewelProgress(game.save),{inuyasha:500,naraku:500,world:9000});
  assert.equal(raceWinner(game.save),null); assert.ok(game.save.heroes.inuyasha.unlocks.includes('tessaiga-awaken'));
  assert.deepEqual([...game.save.growthEvents].sort(),['cooperation','promise','tessaiga']);
  assert.equal(statsFor('inuyasha',game.save.heroes.inuyasha).damage,26);
});
