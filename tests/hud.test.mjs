import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { freshSave } from '../src/save.js';
import { partyView, energyView, objectiveText, relicCount, cooldownView } from '../src/hud.js';

function fixture(stage = 0) {
  const save = freshSave(); save.unlockedStage = stage;
  if (stage) save.unlocked.push('inuyasha');
  const game = new Game(save, () => {}, { setItem() {} });
  game.start(stage); while (game.state === 'dialogue') game.nextDialogue();
  return game;
}

test('the HUD follows the active hero without unlocking companions or inventing energy capacity', () => {
  const game = fixture(), before = structuredClone(game.save);
  const [active, locked] = partyView(game);
  assert.equal(active.id, 'kagome'); assert.equal(active.key, '2'); assert.equal(active.state, '出战');
  assert.equal(active.energy.label, '灵力'); assert.equal(active.energy.text, '— / —');
  assert.equal(active.energy.available, false); assert.equal(active.energy.max, null);
  assert.equal(locked.id, 'inuyasha'); assert.equal(locked.state, '尚未加入'); assert.equal(locked.hp, 0);
  assert.equal(locked.energy.label, '妖力');
  assert.deepEqual(game.save, before); assert.equal(game.energy, undefined);
});

test('background health, poison and barrier stay bound to their hero when the HUD reorders the party', () => {
  const game = fixture(2);
  game.health.inuyasha = 54; game.statuses.inuyasha.poison.push({ life: 2, tick: 1, damage: 2 });
  game.barriers.kagome = { hp: 37, life: 2.3 };
  game.switchTo('kagome');
  const view = partyView(game);
  assert.equal(view[0].id, 'kagome'); assert.match(view[0].effects, /结界 37 · 2.3秒/);
  assert.equal(view[1].hp, 54); assert.equal(view[1].max, 180); assert.equal(view[1].effects, '中毒×1');
  assert.equal(game.barriers.kagome.hp, 37); assert.equal(game.statuses.inuyasha.poison.length, 1);
  game.health.inuyasha = 0;
  assert.equal(partyView(game)[1].state, '已倒下');
});

test('energy presentation never treats attack strength as a reserve, and clamps real reserves without modifying them', () => {
  const game = fixture();
  assert.equal(energyView(game, 'kagome').available, false);
  game.energy = { kagome: { current: 100, max: 80 } };
  assert.equal(energyView(game, 'kagome').text, '80 / 80');
  assert.equal(energyView(game, 'kagome').ratio, 1);
  assert.equal(game.energy.kagome.current, 100);
  game.energy.kagome.current = 0;
  assert.equal(energyView(game, 'kagome').text, '0 / 80');
  assert.equal(energyView(game, 'kagome').available, true);
});

test('scene goals and collectibles come from live progress; a final cooldown fraction never looks ready', () => {
  const game = fixture(5);
  assert.match(objectiveText(game), /切换戈薇/);
  game.switchTo('kagome'); assert.doesNotMatch(objectiveText(game), /切换戈薇/);
  game.save.relics.push('4:0', '5:1'); assert.equal(relicCount(game), 1);
  game.events.add('fang-taken'); game.events.add('fang-awaken'); game.bossDefeated = true;
  assert.equal(objectiveText(game), '沿道路前进，抵达出口');
  assert.deepEqual(cooldownView(0, 8), { cooling: false, text: '', ratio: 0 });
  assert.equal(cooldownView(.01, 8).text, '0.1s');
  assert.equal(cooldownView(20, 8).ratio, 1);
});
