import test from 'node:test';
import assert from 'node:assert/strict';
import { freshSave, loadSave, normalizeSave, persist } from '../src/save.js';
import { LEVELS, FLOOR, statsFor } from '../src/data.js';
import { grantGrowth, jewelProgress, transferShard } from '../src/campaign.js';
import { Game, moveBody } from '../src/engine.js';

function storage() { const values = new Map(); return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }; }
function makeGame(stage = 0) {
  const save = freshSave(); if (stage > 0) { save.unlockedStage = stage; save.unlocked.push('inuyasha'); }
  const game = new Game(save, () => {}, storage()); game.start(stage); closeStory(game); return game;
}
function closeStory(game) { while (game.state === 'dialogue') game.nextDialogue(); }

test('save backup round trip preserves growth, unlocked heroes, chapter and checkpoint', () => {
  const s = freshSave(), store = storage(); s.unlocked.push('inuyasha'); s.unlockedStage = 2; s.stage = 2;
  grantGrowth(s, 'cooperation'); s.checkpoint = { stage: 2, x: 3910, waves: [0, 1, 2], events: [] };
  assert.equal(persist(s, store), true); const read = loadSave(store);
  assert.equal(read.exists, true); assert.equal(read.save.heroes.inuyasha.stage, 1); assert.equal(read.save.checkpoint.x, 3910);
  assert.deepEqual(read.save.unlocked, ['kagome', 'inuyasha']);
});
test('malformed or unsupported saves recover without breaking startup', () => {
  const store = { getItem: () => '{bad json' }; assert.equal(loadSave(store).exists, false);
  assert.throws(() => normalizeSave({ version: 999 }));
  const save = normalizeSave({ ...freshSave(), unlocked: ['constructor', '__proto__', 'kagome'], essence: -100 });
  assert.deepEqual(save.unlocked, ['kagome']); assert.equal('essence' in save, false);
});
test('story growth is granted once, raises life and the appropriate power, and never physical attack', () => {
  const save = freshSave(), before = statsFor('inuyasha', save.heroes.inuyasha);
  assert.equal(grantGrowth(save, 'cooperation'), true); assert.equal(grantGrowth(save, 'cooperation'), false);
  const after = statsFor('inuyasha', save.heroes.inuyasha);
  assert.equal(after.maxHp, before.maxHp + 16); assert.equal(after.power, before.power + 4); assert.equal(after.damage, before.damage);
  assert.equal('xp' in save.heroes.inuyasha, false); assert.equal('skill' in save.heroes.inuyasha, false);
});
test('v1 completed prototype saves migrate once to the tomb with story growth and unique fragments', () => {
  const save = normalizeSave({ version: 1, stage: 3, unlockedStage: 3, completed: [0,1,2,3], heroes: { inuyasha: { level: 20, xp: 900, skill: 5 } }, essence: 999 });
  assert.equal(save.version, 2); assert.equal(save.stage, 4); assert.equal(save.unlockedStage, 4);
  assert.equal(save.heroes.inuyasha.stage, 1); assert.equal(save.heroes.kagome.stage, 1);
  assert.deepEqual(jewelProgress(save), { inuyasha: 500, naraku: 300, world: 9200 });
  assert.deepEqual(normalizeSave(save).jewel, save.jewel); assert.equal('essence' in save, false);
});
test('falling body lands on top of a platform and can jump through it from below', () => {
  const platform = [{ x: 0, y: 100, w: 200, h: 20 }];
  const body = { x: 40, y: 0, w: 30, h: 50, vx: 0, vy: 0 };
  for (let i = 0; i < 60; i++) moveBody(body, 1 / 60, platform);
  assert.equal(body.y, 50); assert.equal(body.grounded, true);
  body.y = 130; body.vy = -600; moveBody(body, 0.1, platform); assert.ok(body.y < 100); assert.ok(body.vy < 0);
});
test('the intended jump clears the widest chapter gap without losing health', () => {
  const game = makeGame(1); game.cleared = new Set(LEVELS[1].encounters.map((_, i) => i)); game.events.add('shatter');
  const [start, width] = LEVELS[1].gaps[2]; game.hero.x = start - 40; game.hero.y = FLOOR - game.hero.h; game.hero.grounded = true;
  const hp = game.health[game.active]; game.update(1 / 60, { right: true, jump: true });
  for (let i = 0; i < 56; i++) game.update(1 / 60, { right: true });
  assert.ok(game.hero.x > start + width); assert.equal(game.health[game.active], hp); assert.equal(game.hero.grounded, true);
});
test('the first story encounter recruits Inuyasha, enabling the character switch', () => {
  const game = makeGame(); assert.deepEqual(game.save.unlocked, ['kagome']);
  for (let i = 0; i < 200 && game.state === 'playing'; i++) game.update(1 / 60, { right: true });
  assert.equal(game.state, 'dialogue'); closeStory(game);
  assert.ok(game.save.unlocked.includes('inuyasha')); assert.equal(game.active, 'inuyasha');
  assert.equal(game.switchTo('kagome'), true);
});
test('switching preserves independent health and skills, and enforces a full one-second interval', () => {
  const game = makeGame(1); game.health.inuyasha = 77; game.cooldowns.inuyasha[0] = 4;
  assert.equal(game.switchTo('kagome'), true); assert.equal(game.switchTo('inuyasha'), false);
  for (let i = 0; i < 59; i++) game.update(1 / 60, {});
  assert.equal(game.switchTo('inuyasha'), false);
  game.update(1 / 60, {});
  assert.equal(game.switchTo('inuyasha'), true); assert.equal(game.health.inuyasha, 77); assert.ok(Math.abs(game.cooldowns.inuyasha[0] - 3) < 1e-8);
});
test('keyboard switch requests share cooldown, pause and dialogue freeze it, and a fall still hands off', () => {
  const game = makeGame(1);
  game.update(1 / 60, { two: true }); assert.equal(game.active, 'kagome');
  game.update(1 / 60, { one: true }); assert.equal(game.active, 'kagome');
  game.update(1 / 60, { switch: true }); assert.equal(game.active, 'kagome');
  const cd = game.switchCooldown;
  game.pause(); for (let i = 0; i < 120; i++) game.update(1 / 60, {});
  assert.equal(game.switchCooldown, cd); game.resume();
  game.showDialogue('intro'); for (let i = 0; i < 120; i++) game.update(1 / 60, {});
  assert.equal(game.switchCooldown, cd); closeStory(game);
  game.health.kagome = 0; game.resolveDefeat();
  assert.equal(game.active, 'inuyasha'); assert.equal(game.state, 'playing');
  assert.equal(game.switchCooldown, 1);
});
test('holding attack still allows a priority skill, whose cooldown prevents immediate reuse', () => {
  const game = makeGame(1); game.update(1 / 60, { attack: true, skill1: true });
  assert.ok(game.cooldowns.inuyasha[0] > 5); assert.equal(game.attack(0), false);
});
test('checkpoints restore health and the cleared encounter state after retry', () => {
  const game = makeGame(1); game.cleared.add(0); game.cleared.add(1); game.health.inuyasha = 1;
  game.activateCheckpoint(2310); assert.equal(game.health.inuyasha, statsFor('inuyasha', game.save.heroes.inuyasha).maxHp);
  game.hero.x = 3000; game.health.inuyasha = 0; game.retry();
  assert.equal(game.hero.x, 2335); assert.equal(game.state, 'playing'); assert.deepEqual([...game.cleared], [0, 1]);
});
test('one fallen hero hands combat to the surviving companion; both fallen causes retry state', () => {
  const game = makeGame(1); game.health.inuyasha = 1; game.damageHero(10);
  assert.equal(game.active, 'kagome'); assert.equal(game.state, 'playing');
  game.invulnerable = 0; game.health.kagome = 1; game.damageHero(10); assert.equal(game.state, 'dead');
});
test('destroying Yura anchors removes her damage reduction', () => {
  const game = makeGame(3), boss = game.spawnEnemy('yura', 3550); game.anchors = [{ hp: 50, x: 3450, y: 350, w: 28, h: 38 }];
  const hp = boss.hp; game.hitEnemy(boss, 100); assert.equal(hp - boss.hp, 30);
  game.damageAnchor(game.anchors[0], 100); const nextHp = boss.hp; game.hitEnemy(boss, 100); assert.equal(nextHp - boss.hp, 100);
});
test('scene completion respects required interactions and reaches the end of all six scenes', () => {
  const game = makeGame(); game.save.unlocked.push('inuyasha'); game.save.jewel.started = true;
  for (let i = 0; i < LEVELS.length; i++) {
    assert.equal(game.start(i), true); closeStory(game);
    if (game.level.required?.length) { game.finishStage(); assert.equal(game.state, 'playing'); }
    for (const id of game.level.required || []) game.events.add(id);
    if (i === 1) transferShard(game.save, 'village', 'inuyasha');
    if (i === 3) transferShard(game.save, 'yura', 'inuyasha');
    game.finishStage(); closeStory(game);
    assert.equal(game.state, 'victory'); assert.ok(game.save.completed.includes(i));
    assert.equal(game.save.stage, Math.min(LEVELS.length - 1, i + 1));
  }
  assert.deepEqual(game.save.completed, [0,1,2,3,4,5]);
});
