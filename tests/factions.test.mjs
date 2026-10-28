import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTIONS, playableFaction } from '../src/factions.js';
import { freshSave, newJourneySave, normalizeSave, persist, loadSave, SAVE_KEY } from '../src/save.js';
import { grantGrowth, transferShard, jewelProgress } from '../src/campaign.js';
import { Game } from '../src/engine.js';

test('the Naraku preview cannot create, import or silently become an Inuyasha campaign', () => {
  assert.equal(FACTIONS.naraku.playable, false);
  for (const create of [() => freshSave('naraku'), () => newJourneySave('naraku', freshSave()), () => normalizeSave({ ...freshSave(), faction: 'naraku' })]) {
    assert.throws(create, /尚未开放/);
  }
  for (const id of ['unknown', '__proto__', 'constructor']) {
    assert.throws(() => playableFaction(id), /无法识别/);
    assert.throws(() => normalizeSave({ ...freshSave(), faction: id }), /无法识别/);
  }
});

test('preparing a new journey resets its world without changing or aliasing the existing save', () => {
  const current = freshSave();
  current.sound = false; current.stage = 4; current.unlockedStage = 4; current.completed = [0, 1, 2, 3];
  current.unlocked.push('inuyasha'); current.jewel.started = true;
  grantGrowth(current, 'cooperation'); transferShard(current, 'village', 'inuyasha');
  current.flags.push('old-story'); current.relics.push('0:1'); current.bestiary.push('crow');
  const before = structuredClone(current), stored = new Map();
  const storage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) };
  persist(current, storage); const originalBytes = stored.get(SAVE_KEY);
  const next = newJourneySave('inuyasha', current);
  assert.deepEqual(current, before); assert.equal(stored.get(SAVE_KEY), originalBytes);
  assert.equal(next.faction, 'inuyasha'); assert.equal(next.stage, 0); assert.equal(next.sound, false);
  assert.deepEqual(next.unlocked, ['kagome']); assert.deepEqual(next.completed, []);
  assert.deepEqual(next.growthEvents, []); assert.deepEqual(next.flags, []);
  assert.deepEqual(next.relics, []); assert.deepEqual(next.bestiary, []);
  assert.equal(next.jewel.started, false);
  assert.deepEqual(jewelProgress(next), { inuyasha: 0, naraku: 0, world: 10000 });
  next.heroes.inuyasha.unlocks.push('tessaiga'); next.jewel.known.push('village');
  assert.deepEqual(current, before);
});

test('legacy and current saves resume the same Inuyasha route and retain checkpoint progress', () => {
  const legacy = normalizeSave({ version: 1, stage: 3, unlockedStage: 3, completed: [0, 1, 2, 3] });
  assert.equal(legacy.faction, 'inuyasha'); assert.equal(legacy.stage, 4);
  const save = freshSave(); save.unlockedStage = 1; save.stage = 1; save.unlocked.push('inuyasha');
  const game = new Game(save, () => {}, { setItem() {} });
  game.start(1); while (game.state === 'dialogue') game.nextDialogue();
  game.activateCheckpoint(2310);
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  persist(save, storage); const loaded = loadSave(storage);
  assert.equal(loaded.exists, true); assert.equal(loaded.save.faction, 'inuyasha');
  const resumed = new Game(loaded.save, () => {}, storage); resumed.start(1, true);
  assert.equal(resumed.hero.x, 2335); assert.equal(resumed.level.id, 1);
  assert.equal(resumed.save.faction, 'inuyasha');
});
