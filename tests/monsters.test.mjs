import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { freshSave, normalizeSave } from '../src/save.js';
import { LEVELS, FLOOR } from '../src/data.js';
import { MONSTERS, MONSTER_IDS, BASIC_MONSTER_IDS, isAttacking } from '../src/monsters.js';

function arena() {
  const save = freshSave(); save.unlocked = ['inuyasha', 'kagome'];
  const game = new Game(save, () => {}, { setItem() {} }); game.lab = true; game.start(0);
  game.state = 'playing'; game.dialogue = null;
  game.level = { ...LEVELS[0], length: 2000, gaps: [], encounters: [], storyEvents: [], relics: [], checkpoints: [], traps: [] };
  game.platforms = [{ x: 0, y: FLOOR, w: 2000, h: 100 }];
  Object.assign(game.hero, { x: 300, y: FLOOR - 68, grounded: true }); game.camera = 0;
  return game;
}
function step(game, seconds, input = {}) { for (let i = 0; i < Math.ceil(seconds * 60); i++) game.update(1 / 60, input); }
function ready(enemy) { enemy.state = 'idle'; enemy.timer = 0; }

test('route A reserves later species and removes the old generic enemies from all story encounters', () => {
  assert.deepEqual(MONSTER_IDS.slice(0, 5), ['crow', 'spider', 'hornet', 'harpy', 'rat']);
  assert.equal(MONSTER_IDS.length, 15);
  assert.deepEqual(LEVELS[0].encounters.flatMap(e => e.types), ['centipede']);
  assert.ok(LEVELS[1].encounters.every(e => e.types.every(type => type === 'crow') && e.count === 1));
  assert.equal(LEVELS[2].encounters.length, 0); assert.equal(LEVELS[3].encounters.length, 0);
});
test('invalid or negative first-frame time cannot reverse clocks or create status effects', () => {
  const game = arena(), time = game.time, x = game.hero.x;
  for (const dt of [-0.2, NaN, Infinity, 0]) game.update(dt, { attack: true, right: true });
  assert.equal(game.time, time); assert.equal(game.hero.x, x); assert.equal(game.statuses.inuyasha.slow, 0); assert.equal(game.projectiles.length, 0);
});
test('approved unnamed enemies are ordinary basic monsters with no inherited boss immunity', () => {
  assert.deepEqual(BASIC_MONSTER_IDS, ['crawler', 'maw', 'manyeye', 'eyeball', 'beetle', 'tongue', 'wingface', 'humpneck', 'cyclops', 'skullwhisker']);
  for (const type of BASIC_MONSTER_IDS) {
    const game = arena(), e = game.spawnEnemy(type, 360);
    assert.equal(e.basic, true); assert.equal(e.boss, undefined); assert.ok(e.hp <= 70);
    game.hitEnemy(e, 1); assert.equal(e.state, 'hurt');
    const save = normalizeSave({ ...freshSave(), bestiary: [type] }); assert.deepEqual(save.bestiary, [type]);
  }
});
test('low-hovering basic enemies commit to their telegraphed charge and remain in ordinary claw reach', () => {
  for (const type of ['eyeball', 'wingface']) {
    const game = arena(), e = game.spawnEnemy(type, 430); ready(e);
    game.updateEnemy(e, 1 / 60); assert.equal(e.state, 'windup');
    const x = e.x, y = e.y, target = e.targetX; game.hero.x = 800;
    for (let i = 0; i < 48; i++) game.updateEnemy(e, 1 / 60);
    assert.equal(e.targetX, target); assert.equal(e.attackFacing, -1); assert.ok(e.x < x); assert.ok(e.y >= y); assert.ok(e.y + e.h <= FLOOR);
    const close = arena(), targetEnemy = close.spawnEnemy(type, 350);
    targetEnemy.state = 'recover'; targetEnemy.stateClock = 5;
    step(close, 3.2, { attack: true }); assert.ok(targetEnemy.hp <= 0, `${type}: claws must reach its natural hover height`);
  }
});
test('a tongue strike extends only forward, deals a single hit, and is canceled by damage', () => {
  for (const facing of [-1, 1]) {
    const game = arena(), e = game.spawnEnemy('tongue', 440);
    Object.assign(game.hero, { x: facing > 0 ? 520 : 375, y: FLOOR - 68 });
    ready(e); game.updateEnemy(e, 1 / 60); assert.equal(e.kind, 'tongue');
    const x = e.x, hp = game.health.inuyasha;
    game.updateEnemy(e, e.windupTime + 0.01); assert.equal(e.state, 'attack');
    for (let i = 0; i < 5; i++) game.updateEnemy(e, 1 / 60);
    assert.equal(e.x, x); assert.equal(game.health.inuyasha, hp - e.damage);
    assert.equal(e.attackBox.w, MONSTERS.tongue.reach);
    game.hitEnemy(e, 1); assert.equal(e.attackBox, null); assert.equal(e.state, 'hurt');
    game.updateEnemy(e, 0.1); assert.equal(game.health.inuyasha, hp - e.damage);
  }
});
test('old saves gain an empty bestiary; imported ids are filtered and unlocks survive a round trip', () => {
  const old = freshSave(); delete old.bestiary;
  assert.deepEqual(normalizeSave(old).bestiary, []);
  const save = normalizeSave({ ...old, bestiary: ['crow', 'crow', '__proto__', 'constructor', 'rat', null] });
  assert.deepEqual(save.bestiary, ['crow', 'rat']);
  assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(save))).bestiary, ['crow', 'rat']);
});
test('legacy encounter indices migrate by checkpoint position without losing chapter or hero growth', () => {
  const save = freshSave(); save.stage = 1; save.unlockedStage = 1; save.heroes.kagome.stage = 1;
  save.checkpoint = { stage: 1, x: 2335, waves: [0, 1, 2, 3], events: ['shatter'] };
  const game = new Game(normalizeSave(save), () => {}, { setItem() {} }); game.start(1, true);
  assert.equal(game.hero.x, 2335); assert.deepEqual([...game.cleared], [0]);
  assert.equal(game.save.heroes.kagome.stage, 1); assert.ok(game.events.has('shatter'));
});
test('all ordinary attacks are canceled by a hit, including attacks already in their active phase', () => {
  for (const type of MONSTER_IDS) for (const state of ['windup', 'attack']) {
    const game = arena(), e = game.spawnEnemy(type, 345);
    Object.assign(e, { state, stateClock: 0.2, windup: 0.2, aimX: 0, aimY: 0, hit: false, attackBox: { ...game.hero } });
    const hp = game.health.inuyasha;
    game.hitEnemy(e, 1); game.updateEnemy(e, 0.2);
    assert.equal(e.state, 'hurt', `${type}: ${state}`); assert.equal(e.windup, 0); assert.equal(e.attackBox, null); assert.equal(game.health.inuyasha, hp);
  }
});
test('five ready enemies never acquire more than two simultaneous attack slots', () => {
  const game = arena(); game.health.inuyasha = 10000; game.health.kagome = 10000;
  for (let i = 0; i < 5; i++) ready(game.spawnEnemy('hornet', 410 + i * 15));
  let maximum = 0;
  for (let i = 0; i < 500; i++) { game.update(1 / 60); maximum = Math.max(maximum, game.enemies.filter(isAttacking).length); }
  assert.equal(maximum, 2);
});
test('skills produce stronger knockback than an opening normal claw without bypassing terrain checks', () => {
  // Keep the target in both attacks' actual contact surfaces. At x=350 the
  // randomized crescent can leave it in the deliberately non-damaging hollow.
  const normal = arena(), a = normal.spawnEnemy('harpy', 380); a.y = FLOOR - a.h; normal.attack();
  const skill = arena(), b = skill.spawnEnemy('harpy', 380); b.y = FLOOR - b.h; skill.attack(0);
  step(normal, 0.18); step(skill, 0.23);
  assert.ok(b.x - 380 > a.x - 380); assert.equal(a.state, 'hurt'); assert.equal(b.state, 'hurt');
});
test('offscreen enemies cannot start or continue an attack', () => {
  const game = arena(), e = game.spawnEnemy('crow', 1250); ready(e);
  for (let i = 0; i < 100; i++) game.updateEnemy(e, 1 / 60);
  assert.equal(e.state, 'idle');
  e.state = 'windup'; e.stateClock = 0.1; e.windup = 0.1;
  game.updateEnemy(e, 0.2); assert.equal(e.state, 'recover'); assert.equal(e.windup, 0);
});
test('a diving crow commits to its telegraphed direction after the hero crosses behind it', () => {
  const game = arena(), e = game.spawnEnemy('crow', 470); ready(e);
  game.updateEnemy(e, 1 / 60); assert.equal(e.state, 'windup');
  const x = e.x, target = e.targetX; game.hero.x = 800;
  for (let i = 0; i < 50; i++) game.updateEnemy(e, 1 / 60);
  assert.equal(e.targetX, target); assert.equal(e.facing, -1); assert.ok(e.x < x);
});
test('contact alone causes no damage, and grounded enemies respect gaps even while lunging', () => {
  const game = arena(), e = game.spawnEnemy('rat', 300); e.state = 'idle'; e.timer = 100;
  const hp = game.health.inuyasha; game.updateEnemy(e, 0.1); assert.equal(game.health.inuyasha, hp);
  game.level.gaps = [[400, 120]]; Object.assign(e, { x: 360, y: FLOOR - e.h, state: 'attack', stateClock: 0.3, duration: 0.3, facing: 1, attackFacing: 1, kind: 'lunge' });
  for (let i = 0; i < 15; i++) game.updateEnemy(e, 1 / 60);
  assert.ok(e.x + e.w <= 400);
});
test('spider silk is telegraphed and can be destroyed by claws or an arrow before it hits', () => {
  const game = arena(), e = game.spawnEnemy('spider', 500); e.spitter = true; ready(e);
  game.updateEnemy(e, 1 / 60); assert.equal(e.kind, 'silk');
  for (let i = 0; i < 45; i++) game.updateEnemy(e, 1 / 60);
  assert.equal(game.projectiles[0].kind, 'silk');
  game.projectiles = [{ owner: 'enemy', kind: 'silk', x: 355, y: 410, w: 15, h: 12, vx: 0, vy: 0, life: 2, damage: 4 }];
  const clawSilk = game.projectiles[0]; game.attack(); step(game, 0.12); assert.equal(clawSilk.life, 0);
  game.active = 'kagome'; game.attackCooldown = 0; game.enemies = [];
  const silk = { owner: 'enemy', kind: 'silk', x: 355, y: 410, w: 15, h: 12, vx: 0, vy: 0, life: 2, damage: 4 };
  game.projectiles = [silk]; game.attack(); game.updateProjectiles(0.02); assert.equal(silk.life, 0);
});
test('poison stacks independently and the strongest timed slow persists on its original hero', () => {
  const game = arena(); game.applyStatus('poison'); game.applyStatus('slow', 'inuyasha', { strength: 0.4, life: 1 }); game.updateStatuses(0.25);
  game.applyStatus('poison'); game.applyStatus('slow', 'inuyasha', { strength: 0.2, life: 3 });
  assert.equal(game.statuses.inuyasha.poison[0].life, 2.75); assert.equal(game.statuses.inuyasha.poison[1].life, 3);
  game.switchTo('kagome'); const hp = game.health.kagome;
  game.updateStatuses(1); assert.equal(game.statuses.inuyasha.slow, 0.2);
  for (let i = 0; i < 9; i++) game.updateStatuses(0.25);
  assert.equal(game.health.kagome, hp); assert.equal(game.health.inuyasha, 165);
  assert.deepEqual(game.statuses.inuyasha.poison, []); assert.equal(game.hurtClock, 0);
});
test('a fatal venom strike does not transfer poison onto the companion who takes over', () => {
  const game = arena(), e = game.spawnEnemy('hornet', 300); game.health.inuyasha = 1;
  Object.assign(e, { state: 'attack', stateClock: 0.2, kind: 'lunge', y: FLOOR - 25, aimX: 0, aimY: 0, attackFacing: 1, hit: false });
  game.updateEnemy(e, 1 / 60); assert.equal(game.active, 'kagome'); assert.deepEqual(game.statuses.kagome.poison, []);
});
test('harpy lands before its separately telegraphed claw follow-up', () => {
  const game = arena(), e = game.spawnEnemy('harpy', 490); ready(e); const kinds = new Set(); let landed = false;
  for (let i = 0; i < 150; i++) {
    game.updateEnemy(e, 1 / 60);
    if (e.state === 'windup') kinds.add(e.kind);
    if (e.kind === 'claw') landed ||= e.y === FLOOR - e.h;
  }
  assert.ok(kinds.has('lunge')); assert.ok(kinds.has('claw')); assert.equal(landed, true);
});
test('kills unlock the bestiary once without farmable permanent growth; lab leaves progression untouched', () => {
  const game = arena(); game.lab = false; const e = game.spawnEnemy('crow', 450), heroes = structuredClone(game.save.heroes);
  game.hitEnemy(e, 1000); game.hitEnemy(e, 1000);
  assert.deepEqual(game.save.heroes, heroes); assert.deepEqual(game.save.bestiary, ['crow']);
  assert.equal('essence' in game.save, false);
  const lab = arena(), rat = lab.spawnEnemy('rat', 450); lab.hitEnemy(rat, 1000);
  assert.deepEqual(lab.save.heroes, heroes); assert.deepEqual(lab.save.bestiary, []);
});
test('both heroes can defeat every ordinary species in its close-range punish window', () => {
  for (const id of ['inuyasha', 'kagome']) for (const type of MONSTER_IDS) {
    const game = arena(); game.active = id;
    const e = game.spawnEnemy(type, 350); e.state = 'recover'; e.stateClock = 5; e.y = FLOOR - e.h;
    step(game, 3.2, { attack: true }); assert.ok(e.hp <= 0, `${id} should defeat ${type}`);
  }
});
test('checkpoints and retries clear status effects and active enemy hitboxes', () => {
  const game = arena(); game.applyStatus('poison'); game.applyStatus('slow'); game.activateCheckpoint(500);
  assert.deepEqual(game.statuses.inuyasha.poison, []); assert.equal(game.statuses.inuyasha.slow, 0);
  const e = game.spawnEnemy('crow', 450); e.attackBox = { ...game.hero }; game.applyStatus('poison'); game.retry();
  assert.equal(game.enemies.length, 0); assert.deepEqual(game.statuses.inuyasha.poison, []);
});
