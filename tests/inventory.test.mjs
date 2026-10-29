import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { freshSave, normalizeSave } from '../src/save.js';
import { FLOOR, statsFor } from '../src/data.js';
import { EQUIPMENT_SLOTS, equippedItems, equipmentLocation, usesAwakenedFang, itemUseReason } from '../src/inventory.js';
import { CompanionMenu, CommonItemMenu } from '../src/companions.js';

const storage = { setItem() {} };
function fixture() {
  const save = freshSave(); save.unlockedStage = 5; save.unlocked = ['kagome', 'inuyasha'];
  save.heroes.inuyasha.unlocks = ['tessaiga', 'tessaiga-awaken']; save.heroes.inuyasha.stage = 2;
  const game = new Game(save, () => {}, storage); game.start(2);
  while (game.state === 'dialogue') game.nextDialogue();
  const x = game.level.checkpoints[0];
  Object.assign(game.hero, { x: x + 25, y: FLOOR - game.hero.h, grounded: true, vx: 0, vy: 0 });
  game.activateCheckpoint(x);
  return game;
}
function step(game, frames = 40) { for (let i = 0; i < frames; i++) game.update(1 / 60, {}); }

test('old v2 saves infer story equipment, reject foreign parts and preserve explicit unarmed choices', () => {
  const raw = freshSave(); raw.unlocked.push('inuyasha'); raw.heroes.inuyasha.unlocks.push('tessaiga-awaken');
  const old = normalizeSave(raw);
  assert.equal(equippedItems(old, 'inuyasha').weapon, 'tessaiga');
  assert.equal(equippedItems(old, 'kagome').weapon, 'kagome-bow');
  old.heroes.inuyasha.equipment.upper = 'kagome-upper'; old.heroes.inuyasha.equipment.hands = 'tessaiga';
  old.heroes.inuyasha.equipment.weapon = null;
  old.inventory = { herb: -1, antidote: 3.8, constructor: 99 };
  const loaded = normalizeSave(old);
  assert.equal(loaded.heroes.inuyasha.equipment.upper, 'inuyasha-upper');
  assert.equal(loaded.heroes.inuyasha.equipment.hands, null);
  assert.equal(loaded.heroes.inuyasha.equipment.weapon, null);
  assert.deepEqual(loaded.inventory, { herb: 0, antidote: 3 });
  assert.equal(loaded.version, 2);
});

test('six-slot viewing and candidate preview do not switch or change the actual character', () => {
  const game = fixture(), menu = new CompanionMenu(); game.pause(); menu.open(game);
  assert.equal(EQUIPMENT_SLOTS.length, 6); assert.ok(!EQUIPMENT_SLOTS.some(s => s.id === 'head'));
  const before = structuredClone(game.save), active = game.active;
  menu.handle(game, { dataset: { companionHero: 'kagome' } });
  menu.handle(game, { dataset: { companionTab: 'equipment' } });
  menu.handle(game, { dataset: { gearSlot: 'upper' } });
  assert.match(menu.render(game), /水手服上衣/);
  assert.equal(game.active, active); assert.deepEqual(game.save, before);
  menu.handle(game, { dataset: { companionHero: 'inuyasha' } }); menu.handle(game, { dataset: { gearSlot: 'weapon' } });
  menu.handle(game, { dataset: { gearChoose: '' } }); menu.handle(game, { dataset: { gearCandidate: 'none' } });
  assert.equal(usesAwakenedFang(game.save), true);
  assert.equal(menu.back(), true); assert.deepEqual(game.save, before);
  menu.handle(game, { dataset: { gearChoose: '' } }); menu.handle(game, { dataset: { gearCandidate: 'none' } });
  menu.handle(game, { dataset: { gearConfirm: '' } });
  assert.equal(usesAwakenedFang(game.save), false); assert.equal(game.active, active);
  assert.match(menu.notice, /已装备/);
});

test('equipment mutation is checked by the engine even if a chooser was opened in safety', () => {
  const game = fixture(); game.pause();
  assert.equal(equipmentLocation(game).safe, true);
  assert.equal(game.equip('inuyasha', 'weapon', 'kagome-bow').ok, false);
  assert.equal(game.equip('inuyasha', 'upper', 'tessaiga').ok, false);
  game.spawnEnemy('crow', game.hero.x + 120);
  assert.equal(equipmentLocation(game).safe, false);
  assert.equal(game.equip('inuyasha', 'weapon', null).ok, false);
  game.enemies = []; game.hero.grounded = false;
  assert.equal(game.equip('inuyasha', 'weapon', null).ok, false);
  game.hero.grounded = true; game.hero.x += 400;
  assert.equal(equipmentLocation(game).safe, false);
});

test('equip confirmation changes weapon behavior, not growth, and retry restores equipment and supplies together', () => {
  const game = fixture(), initial = structuredClone(game.save.inventory), stats = statsFor('inuyasha', game.save.heroes.inuyasha);
  game.pause(); assert.equal(game.equip('inuyasha', 'weapon', null).ok, true);
  game.resume(); game.health.inuyasha -= 30;
  assert.equal(game.useItem('herb', 'inuyasha').ok, true); step(game);
  assert.equal(game.save.inventory.herb, initial.herb - 1);
  assert.equal(usesAwakenedFang(game.save), false);
  assert.deepEqual(statsFor('inuyasha', game.save.heroes.inuyasha), stats);
  const loaded = normalizeSave(JSON.parse(JSON.stringify(game.save))), resumed = new Game(loaded, () => {}, storage);
  resumed.start(2, true);
  assert.equal(usesAwakenedFang(resumed.save), true);
  assert.deepEqual(resumed.save.inventory, initial);
  assert.equal(resumed.save.itemClaims.length, 1);
  resumed.activateCheckpoint(resumed.level.checkpoints[0]);
  assert.deepEqual(resumed.save.inventory, initial);
});

test('healing is targeted, capped, delayed and charged once; choosing an item is read-only', () => {
  const game = fixture(); game.health.kagome -= 12; game.pause();
  const menu = new CommonItemMenu(); menu.open(game); menu.choosing = true; menu.target = 'kagome';
  const before = structuredClone(game.save);
  assert.match(menu.render(game), /确认使用/); assert.deepEqual(game.save, before);
  assert.equal(game.useItem('herb', 'kagome').ok, false);
  game.resume(); const count = game.save.inventory.herb;
  assert.equal(game.useItem('herb', 'kagome').ok, true);
  assert.equal(game.save.inventory.herb, count);
  step(game, 12); assert.equal(game.health.kagome, game.statsForHero('kagome').maxHp - 12);
  step(game); assert.equal(game.health.kagome, game.statsForHero('kagome').maxHp);
  assert.equal(game.save.inventory.herb, count - 1);
  step(game); assert.equal(game.save.inventory.herb, count - 1);
});

test('pause freezes the pending use, while a direct hit or successful switch interrupts without charging', () => {
  const game = fixture(); game.health.inuyasha -= 30;
  const count = game.save.inventory.herb;
  game.useItem('herb', 'inuyasha'); step(game, 8); game.pause();
  const remaining = game.itemUse.remaining;
  step(game, 120); assert.equal(game.itemUse.remaining, remaining); assert.equal(game.save.inventory.herb, count);
  game.resume(); game.damageHero(1);
  assert.equal(game.itemUse, null); assert.equal(game.save.inventory.herb, count);
  game.hurtClock = 0; game.action = null;
  assert.equal(game.useItem('herb', 'inuyasha').ok, true);
  assert.equal(game.switchTo('kagome'), true);
  assert.equal(game.itemUse, null); assert.equal(game.save.inventory.herb, count);
});

test('antidote clears every layer at completion before a same-frame poison tick without granting immunity', () => {
  const game = fixture(); game.health.inuyasha = 1;
  game.applyStatus('poison', 'inuyasha', { life: 10, damage: 2 });
  game.applyStatus('poison', 'inuyasha', { life: 10, damage: 3 });
  for (const layer of game.statuses.inuyasha.poison) layer.tick = .6;
  const count = game.save.inventory.antidote;
  assert.equal(game.useItem('antidote', 'inuyasha').ok, true);
  step(game, 36);
  assert.equal(game.health.inuyasha, 1); assert.deepEqual(game.statuses.inuyasha.poison, []);
  assert.equal(game.save.inventory.antidote, count - 1);
  game.applyStatus('poison'); assert.equal(game.statuses.inuyasha.poison.length, 1);
});

test('no-op, dead-target and controlled-actor uses cannot consume supplies or revive a character', () => {
  const game = fixture(), before = structuredClone(game.save.inventory);
  assert.match(itemUseReason(game, 'herb', 'kagome'), /生命已满/);
  assert.match(itemUseReason(game, 'antidote', 'kagome'), /没有中毒/);
  game.health.kagome = 0;
  assert.equal(game.useItem('herb', 'kagome').ok, false);
  game.health.inuyasha -= 20; game.hurtClock = .3;
  assert.equal(game.useItem('herb', 'inuyasha').ok, false);
  assert.equal(game.health.kagome, 0); assert.deepEqual(game.save.inventory, before);
});
