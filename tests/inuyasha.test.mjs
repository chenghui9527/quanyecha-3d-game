import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { freshSave } from '../src/save.js';
import { HEROES, LEVELS, FLOOR, statsFor } from '../src/data.js';

function arena() {
  const save = freshSave(); save.unlocked = ['inuyasha', 'kagome'];
  const game = new Game(save, () => {}, { setItem() {} }); game.lab = true; game.start(0);
  game.state = 'playing'; game.dialogue = null;
  game.level = { ...LEVELS[0], length: 2000, gaps: [], encounters: [], storyEvents: [], relics: [], checkpoints: [], traps: [] };
  game.platforms = [{ x: 0, y: FLOOR, w: 2000, h: 100 }];
  Object.assign(game.hero, { x: 300, y: FLOOR - 68, grounded: true });
  return game;
}
function target(game, x = 355, type = 'harpy') {
  const e = game.spawnEnemy(type, x);
  Object.assign(e, { training: type !== 'yura', hp: 10000, maxHp: 10000, y: FLOOR - e.h, state: 'idle', stateClock: 0 });
  return e;
}
function step(game, seconds, input = {}) { for (let i = 0; i < Math.ceil(seconds * 60); i++) game.update(1 / 60, input); }

test('the awakened fang extends a normal strike beyond claw range without changing base physical attack', () => {
  const claw = arena(), a = target(claw, 418), sword = arena(), b = target(sword, 418);
  sword.save.heroes.inuyasha.unlocks.push('tessaiga-awaken');
  claw.attack(); sword.attack(); step(claw, 0.17); step(sword, 0.17);
  assert.equal(a.hp, 10000); assert.equal(b.hp, 10000 - 26);
  assert.equal(statsFor('inuyasha', sword.save.heroes.inuyasha).damage, 26);
});

test('claws have startup, deal one hit per target, and holding attack cycles three distinct moves', () => {
  const game = arena(), e = target(game), damage = statsFor('inuyasha', game.save.heroes.inuyasha).damage;
  game.attack(); assert.equal(e.hp, 10000);
  step(game, 0.04); assert.equal(e.hp, 10000);
  step(game, 0.13); assert.equal(e.hp, 10000 - damage);
  step(game, 0.16); assert.equal(e.hp, 10000 - damage);
  const moves = new Set();
  for (let i = 0; i < 110; i++) { game.update(1 / 60, { attack: true }); if (game.action) moves.add(game.action.id); }
  assert.deepEqual([...moves].sort(), ['claw1', 'claw2', 'claw3']);
});

test('directional attack launches an ordinary target; bosses stay grounded', () => {
  const game = arena(), e = target(game);
  game.update(1 / 60, { attack: true, down: true }); step(game, 0.18);
  assert.equal(game.action.id, 'upper'); assert.ok(e.juggle); assert.ok(e.y < FLOOR - e.h);
  step(game, 1.3); assert.equal(e.juggle, null); assert.equal(e.y, FLOOR - e.h);
  const bossGame = arena(), boss = target(bossGame, 355, 'yura'), y = boss.y;
  bossGame.attack(-1, 'upper'); step(bossGame, 0.19);
  assert.ok(boss.hp < 10000); assert.equal(boss.juggle, undefined); assert.equal(boss.y, y);
});

test('the full ground-to-air chain connects both aerial hits and ends with a grounded skill', () => {
  const game = arena(), e = target(game), hits = new Set();
  const moves = ['claw1', 'claw2', 'upper', 'jump', 'air1', 'air2', 'plunge', 'scatter']; let index = 0;
  for (let i = 0; i < 240; i++) {
    const id = moves[index]; let input = {};
    if (id === 'jump') {
      if (game.action?.id === 'upper' && game.action.elapsed >= 0.14) { input = { jump: true }; index++; }
    } else if (id && game.attack(id === 'scatter' ? 0 : -1, id)) index++;
    const before = e.hp; game.update(1 / 60, input);
    if (e.hp < before) hits.add(game.action.id);
  }
  assert.equal(index, moves.length);
  for (const id of ['claw1', 'claw2', 'upper', 'air1', 'air2', 'scatter']) assert.ok(hits.has(id), `${id} should connect`);
  assert.ok(hits.has('plunge') || hits.has('landing'), 'the descending claw or its ground impact should connect');
  assert.equal(game.hero.grounded, true); assert.equal(game.action, null);
});

test('air attacks cannot hover forever, and landing restores the next jump attack budget', () => {
  const game = arena(); game.update(1 / 60, { jump: true });
  let landed = false;
  for (let i = 0; i < 160; i++) { game.update(1 / 60, { attack: true }); if (game.hero.grounded) { landed = true; break; } }
  assert.ok(landed); assert.equal(game.airAttacks, 0);
});

test('plunge hits a target once across descent and impact, and lands on a raised platform', () => {
  const game = arena(), e = target(game, 320);
  game.hero.y -= 140; game.hero.grounded = false; game.attack(-1, 'plunge');
  step(game, 1.1);
  const damage = statsFor('inuyasha', game.save.heroes.inuyasha).damage * 1.6;
  assert.ok(Math.abs(10000 - e.hp - damage) < 0.001); assert.equal(game.hero.grounded, true);
  const raised = arena(); raised.platforms.unshift({ x: 250, y: FLOOR - 90, w: 200, h: 20 });
  raised.hero.y = FLOOR - 68 - 210; raised.hero.grounded = false; raised.attack(-1, 'plunge');
  step(raised, 0.4);
  assert.equal(raised.hero.y + raised.hero.h, FLOOR - 90); assert.equal(raised.action.id, 'landing');
  assert.ok(raised.effects.some(effect => effect.type === 'groundShock' && effect.y === FLOOR - 90));
});

test('skill input during a normal attack buffers into its cancel window without duplicate hits', () => {
  const game = arena(), e = target(game); game.attack();
  step(game, 0.1); game.update(1 / 60, { attack: true, skill1: true });
  step(game, 0.5);
  assert.ok(game.cooldowns.inuyasha[0] > 4);
  const base = statsFor('inuyasha', game.save.heroes.inuyasha).damage;
  assert.ok(Math.abs(10000 - e.hp - base * 3.7) < 0.001);
});

test('a tap buffered near the end of a claw survives the action boundary', () => {
  const game = arena(); game.attack(); step(game, 0.23);
  game.update(1 / 60, { attack: true }); step(game, 0.12);
  assert.equal(game.action.id, 'claw2');
});

test('a jump tapped during uppercut hit-stop is retained for the aerial follow-up', () => {
  const game = arena(); target(game); game.attack(-1, 'upper'); step(game, 0.12);
  assert.ok(game.hitStop > 0);
  game.update(1 / 60, { jump: true }); game.update(1 / 60, {}); step(game, 0.18);
  assert.equal(game.hero.grounded, false); assert.ok(game.hero.y < FLOOR - game.hero.h);
});

test('blood claws keep Inuyasha planted and stagger five travelling blades after startup', () => {
  const game = arena(), e = target(game, 630), start = game.hero.x, hp = game.health.inuyasha;
  assert.deepEqual(HEROES.inuyasha.skill, ['散魂铁爪', '飞刃血爪']);
  assert.equal(game.attack(1), true); assert.equal(game.attack(1), false);
  step(game, 0.15); assert.equal(e.hp, 10000); assert.equal(game.projectiles.length, 0);
  step(game, 0.10);
  let blades = game.projectiles.filter(p => p.kind === 'bloodBlade');
  assert.ok(blades.length >= 1 && blades.length < 5);
  step(game, 0.22); blades = game.projectiles.filter(p => p.kind === 'bloodBlade');
  assert.equal(blades.length, 5); assert.equal(new Set(blades.map(p => p.hits)).size, 1);
  assert.ok(blades.every(p => p.vx > 0)); assert.equal(game.hero.x, start); assert.equal(e.hp, 10000);
  assert.equal(game.invulnerable, 0); assert.equal(game.health.inuyasha, hp); assert.ok(game.cooldowns.inuyasha[1] > 7);
  step(game, 0.1); assert.ok(game.projectiles.every(p => p.y + p.h <= FLOOR + 0.001));
  step(game, 1);
  const damage = statsFor('inuyasha', game.save.heroes.inuyasha).damage * 2.3;
  assert.ok(Math.abs(10000 - e.hp - damage) < 0.001); assert.equal(game.projectiles.length, 0); assert.equal(game.hero.x, start);
});

test('the blood volley pierces a group but never multiplies damage on a wide close target', () => {
  const game = arena(), enemies = [target(game, 345), target(game, 475), target(game, 650)];
  enemies[0].w = 125; game.attack(1); step(game, 1.4);
  const damage = statsFor('inuyasha', game.save.heroes.inuyasha).damage * 2.3;
  for (const e of enemies) assert.ok(Math.abs(10000 - e.hp - damage) < 0.001);
});

test('blood blades release at uneven times and heights while every heading stays identical', () => {
  for (const facing of [-1, 1]) {
    const game = arena(); game.hero.facing = facing; game.attack(1);
    const seen = new Set(), released = [];
    for (let frame = 0; frame < 40; frame++) {
      game.update(1 / 60);
      for (const p of game.projectiles) if (p.kind === 'bloodBlade' && !seen.has(p)) { seen.add(p); released.push({ p, frame, y: p.y }); }
    }
    assert.equal(released.length, 5);
    const gaps = released.slice(1).map((shot, i) => shot.frame - released[i].frame);
    assert.ok(gaps.every(gap => gap > 0)); assert.ok(new Set(gaps).size > 1);
    assert.ok(released[1].y < released[0].y && released[2].y > released[1].y);
    assert.ok(released.every(({ p }) => p.vx === facing * 720 && p.vy === 0));
  }
});

test('interrupting a staggered cast stops unsent blades and keeps released blades in flight', () => {
  for (const cancel of ['dodge', 'hurt', 'switch']) {
    const game = arena(); game.attack(1);
    for (let frame = 0; frame < 20 && game.projectiles.length === 0; frame++) game.update(1 / 60);
    const shots = [...game.projectiles]; assert.equal(shots.length, 1);
    if (cancel === 'dodge') game.update(1 / 60, { dodge: true });
    else if (cancel === 'hurt') game.damageHero(1);
    else game.switchTo('kagome');
    const x = shots[0].x; step(game, 0.3);
    assert.ok(game.projectiles.length > 0); assert.ok(game.projectiles.every(p => shots.includes(p)));
    assert.ok(shots[0].x > x); assert.ok(game.cooldowns.inuyasha[1] > 7);
  }
});

test('fast blood blades cut thin silk and hair anchors between simulation positions', () => {
  const game = arena(); game.attack(1); step(game, 0.24);
  const silk = { kind: 'silk', owner: 'enemy', x: 450, y: 408, w: 2, h: 4, vx: 0, vy: 0, life: 2 };
  const anchor = { x: 480, y: 408, w: 2, h: 4, hp: 1000 };
  game.projectiles.push(silk); game.anchors.push(anchor); game.updateProjectiles(0.35);
  assert.equal(silk.life, 0);
  assert.ok(Math.abs(1000 - anchor.hp - statsFor('inuyasha', game.save.heroes.inuyasha).damage * 2.3) < 0.001);
});

test('blood cast snapshots its damage and remains in flight after switching to Kagome', () => {
  const game = arena(), e = target(game, 630); game.save.heroes.inuyasha.stage = 2;
  game.attack(1); step(game, 0.25); assert.equal(game.switchTo('kagome'), true);
  game.save.heroes.inuyasha.stage = 0; step(game, 1);
  assert.ok(Math.abs(10000 - e.hp - 34 * 2.3) < 0.001); assert.equal(game.active, 'kagome');
});

test('canceling blood startup prevents emission, while its spent cooldown remains', () => {
  for (const cancel of ['dodge', 'hurt', 'switch']) {
    const game = arena(), e = target(game); game.attack(1);
    if (cancel === 'dodge') game.update(1 / 60, { dodge: true });
    else if (cancel === 'hurt') game.damageHero(1);
    else game.switchTo('kagome');
    step(game, 1);
    assert.equal(e.hp, 10000); assert.equal(game.projectiles.length, 0); assert.ok(game.cooldowns.inuyasha[1] > 6);
  }
});

test('blood blades travel left when facing left and cannot hit beyond their range', () => {
  const left = arena(), near = target(left, 100); left.hero.facing = -1; left.attack(1); step(left, 1.3);
  assert.ok(Math.abs(10000 - near.hp - 26 * 2.3) < 0.001);
  const far = arena(), outside = target(far, 1050); far.attack(1); step(far, 1.4);
  assert.equal(outside.hp, 10000); assert.equal(far.projectiles.length, 0);
});

test('blood claws work in midair and pause freezes their flight', () => {
  const game = arena(); game.hero.y -= 100; game.hero.grounded = false; game.attack(1); step(game, 0.25);
  const blade = game.projectiles.find(p => p.kind === 'bloodBlade'), x = blade.x, life = blade.life;
  game.pause(); step(game, 0.5); assert.equal(blade.x, x); assert.equal(blade.life, life);
  game.resume(); step(game, 0.1); assert.ok(blade.x > x);
});

test('Sankon Tesso sweeps exactly three gold claws and keeps one melee hit and its original cooldown', () => {
  const game = arena(), e = target(game); game.attack(0); step(game, 0.24);
  assert.ok(Math.abs(10000 - e.hp - 26 * 2.7) < 0.001);
  assert.equal(game.effects.find(effect => effect.type === 'clawBurst').claws.length, 3);
  assert.ok(game.effects.some(effect => effect.type === 'clawImpact'));
  assert.equal(game.projectiles.length, 0); assert.ok(game.cooldowns.inuyasha[0] > 5);
  step(game, 0.6); assert.ok(Math.abs(10000 - e.hp - 26 * 2.7) < 0.001);
});

test('Sankon body tears stay attached to each victim and outlast the passing claw light', () => {
  for (const type of ['crow', 'spider', 'hornet', 'harpy', 'rat']) {
    const game = arena(), enemy = target(game, 410, type); game.attack(0);
    for (let frame = 0; frame < 30 && !game.effects.some(effect => effect.type === 'clawImpact'); frame++) game.update(1 / 60);
    const mark = game.effects.find(effect => effect.type === 'clawImpact');
    assert.ok(mark, `${type} should have a body tear`); assert.equal(mark.target, enemy);
    enemy.x += 60; enemy.y -= 30; step(game, 0.34);
    assert.ok(game.effects.includes(mark), `${type} marks must remain visible after the claw passes`);
    assert.equal(mark.target.x, enemy.x); assert.equal(mark.target.y, enemy.y);
    assert.ok(Math.abs(10000 - enemy.hp - 26 * 2.7) < 0.001);
  }
});

test('Sankon damages the visible curved blade on both facings but leaves its hollow untouched', t => {
  t.mock.method(Math, 'random', () => 0.5);
  for (const facing of [-1, 1]) {
    const game = arena(); game.hero.facing = facing;
    const rim = target(game, facing === 1 ? 455 : 171);
    const hollow = target(game, facing === 1 ? 365 : 261);
    const behind = target(game, facing === 1 ? 295 : 331);
    Object.assign(rim, { y: 394, w: 4, h: 4 });
    Object.assign(hollow, { y: 419, w: 4, h: 4 });
    Object.assign(behind, { y: 410, w: 4, h: 4 });
    game.attack(0); step(game, 0.17);
    assert.equal(rim.hp, 10000, 'the curved edge has not reached this target yet');
    step(game, 0.65);
    assert.ok(Math.abs(10000 - rim.hp - 26 * 2.7) < 0.001);
    assert.equal(hollow.hp, 10000, 'the open area behind the crescent does not deal damage');
    assert.equal(behind.hp, 10000, 'the old rectangle around the caster is no longer damaging');
  }
});

test('Sankon uses its narrow blade surface for thin silk and anchors as well as monsters', t => {
  t.mock.method(Math, 'random', () => 0.5);
  const game = arena();
  const rimSilk = { kind: 'silk', owner: 'enemy', x: 455, y: 394, w: 2, h: 2, vx: 0, vy: 0, life: 2 };
  const hollowSilk = { ...rimSilk, x: 365, y: 419 };
  const rimAnchor = { x: 455, y: 394, w: 2, h: 2, hp: 1000, flash: 0 };
  const hollowAnchor = { ...rimAnchor, x: 365, y: 419 };
  game.projectiles.push(rimSilk, hollowSilk); game.anchors.push(rimAnchor, hollowAnchor);
  game.attack(0); step(game, 0.45);
  assert.equal(rimSilk.life <= 0, true); assert.ok(hollowSilk.life > 0);
  assert.ok(Math.abs(1000 - rimAnchor.hp - 26 * 2.7) < 0.001);
  assert.equal(hollowAnchor.hp, 1000);
});

test('Sankon ground impact follows the sweep on actual ground or raised platforms only', () => {
  for (const raised of [false, true]) {
    const game = arena();
    if (raised) { game.platforms.unshift({ x: 250, y: FLOOR - 90, w: 350, h: 20 }); game.hero.y -= 90; }
    const groundY = game.hero.y + game.hero.h;
    game.attack(0); step(game, 0.17);
    assert.ok(game.effects.some(effect => effect.type === 'clawBurst'));
    assert.ok(!game.effects.some(effect => effect.type === 'clawSlam'));
    step(game, 0.10);
    const impacts = game.effects.filter(effect => effect.type === 'clawSlam');
    assert.equal(impacts.length, 1); assert.equal(impacts[0].y, groundY);
    assert.ok(impacts[0].x > game.hero.x + game.hero.w);
  }
  for (const airborne of [false, true]) {
    const game = arena();
    if (airborne) { game.hero.y -= 160; game.hero.grounded = false; }
    else game.platforms = [{ x: 0, y: FLOOR, w: 360, h: 100 }];
    game.attack(0); step(game, 0.28);
    assert.ok(game.effects.some(effect => effect.type === 'clawBurst'));
    assert.ok(!game.effects.some(effect => effect.type === 'clawSlam'));
  }
});

test('interrupting Sankon after the sweep starts cancels the pending ground impact', () => {
  for (const cancel of ['dodge', 'hurt', 'switch']) {
    const game = arena(); game.attack(0); step(game, 0.17);
    assert.ok(game.effects.some(effect => effect.type === 'clawBurst'));
    if (cancel === 'dodge') game.update(1 / 60, { dodge: true });
    else if (cancel === 'hurt') game.damageHero(1);
    else game.switchTo('kagome');
    step(game, 0.30);
    assert.ok(!game.effects.some(effect => effect.type === 'clawSlam'));
  }
});

test('dodge, damage and character switching cancel pending claw damage without refunding a skill', () => {
  for (const cancel of ['dodge', 'hurt', 'switch']) {
    const game = arena(), e = target(game); game.attack(0);
    if (cancel === 'dodge') game.update(1 / 60, { dodge: true });
    else if (cancel === 'hurt') game.damageHero(1);
    else game.switchTo('kagome');
    step(game, 0.7);
    assert.equal(game.action, null); assert.equal(e.hp, 10000); assert.ok(game.cooldowns.inuyasha[0] > 4);
  }
});

test('claw facing is fixed through contact and can hit enemies on the left', () => {
  const game = arena(), e = target(game, 230); game.hero.facing = -1; game.attack();
  step(game, 0.2, { right: true }); assert.ok(e.hp < 10000); assert.equal(game.action.facing, -1);
});

test('paused gameplay freezes attack state and retry removes all combat state', () => {
  const game = arena(); game.attack(-1, 'upper'); step(game, 0.05);
  const elapsed = game.action.elapsed; game.pause(); step(game, 0.5); assert.equal(game.action.elapsed, elapsed);
  game.retry(); assert.equal(game.action, null); assert.equal(game.combatBuffer, null); assert.equal(game.airAttacks, 0);
});
