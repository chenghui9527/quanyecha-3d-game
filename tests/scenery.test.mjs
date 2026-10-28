import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/engine.js';
import { freshSave } from '../src/save.js';
import { LEVELS, FLOOR } from '../src/data.js';
import { SCENE_ASSETS, nearbySceneDoor } from '../src/scenery.js';

function sceneGame(stage = 1) {
  const save = freshSave(); save.unlockedStage = LEVELS.length - 1; save.unlocked = ['kagome', 'inuyasha'];
  const game = new Game(save, () => {}, { setItem() {} }); game.start(stage);
  while (game.state === 'dialogue') game.nextDialogue();
  game.cleared = new Set(game.level.encounters.map((_, i) => i));
  game.events = new Set(game.level.storyEvents.map(event => event.key));
  return game;
}
function atDoor(game) {
  const door = game.sceneObjects.find(object => object.door);
  Object.assign(game.hero, { x: door.x - game.hero.w / 2, y: FLOOR - game.hero.h, vy: 0, grounded: true });
  return door;
}

test('door toggles once per press, leaves movement and hero stats intact, and resets on restart', () => {
  const game = sceneGame(), door = atDoor(game), health = { ...game.health }, x = game.hero.x;
  game.update(1 / 60, { interact: true });
  assert.equal(game.openDoors.has(door.id), true);
  for (let i = 0; i < 15; i++) game.update(1 / 60, { interact: true });
  assert.equal(game.openDoors.has(door.id), true);
  assert.equal(game.hero.x, x); assert.deepEqual(game.health, health);
  game.update(1 / 60, {}); game.update(1 / 60, { interact: true });
  assert.equal(game.openDoors.has(door.id), false);
  game.update(1 / 60, {}); game.update(1 / 60, { interact: true });
  game.start(1); assert.equal(game.openDoors.size, 0);
});

test('door interaction requires a nearby ground-level hero in active play', () => {
  const game = sceneGame(); atDoor(game);
  assert.ok(nearbySceneDoor(game));
  game.hero.x += 100; assert.equal(game.interactScene(), false);
  atDoor(game); game.hero.grounded = false; assert.equal(game.interactScene(), false);
  atDoor(game); game.hero.y -= 70; assert.equal(game.interactScene(), false);
  atDoor(game); game.pause(); assert.equal(game.interactScene(), false);
  game.resume(); game.action = { id: 'claw1' }; assert.equal(game.interactScene(), false);
  game.action = null; assert.equal(game.interactScene(), true);
});

test('scenery keeps every chapter collision platform and gap unchanged; houses sit on solid ground', () => {
  for (const level of LEVELS) {
    const game = sceneGame(level.id), expected = []; let start = 0;
    for (const [x, width] of level.gaps) { expected.push({ x: start, y: FLOOR, w: x - start, h: 100 }); start = x + width; }
    expected.push({ x: start, y: FLOOR, w: level.length - start + 200, h: 100 });
    expected.push(...level.platforms.map(([x, y, w]) => ({ x, y, w, h: 20 })));
    assert.deepEqual(game.platforms, expected);
    for (const house of game.sceneObjects.filter(object => object.door)) {
      assert.ok(game.platforms.some(platform => platform.y === FLOOR && house.x - 240 >= platform.x && house.x + 240 <= platform.x + platform.w));
    }
    for (const tree of game.sceneObjects.filter(object => object.type === 'tree')) {
      assert.ok(game.platforms.some(platform => platform.y === FLOOR && tree.x - tree.height * 0.53 >= platform.x && tree.x + tree.height * 0.53 <= platform.x + platform.w), 'roots must not appear to bridge a gap');
    }
    const gate = game.sceneObjects.find(object => object.type === 'torii');
    assert.ok(gate && gate.x < level.length - 150, 'the gate must appear before chapter completion');
    assert.ok(game.platforms.some(platform => platform.y === FLOOR && gate.x - 220 >= platform.x && gate.x + 220 <= Math.min(level.length, platform.x + platform.w)), 'the gate must stand on solid ground and fit the final camera view');
  }
  const game = sceneGame(0);
  assert.deepEqual(game.sceneObjects.filter(object => ['sacred', 'well'].includes(object.type)).map(object => object.type), ['well', 'sacred']);
  game.lab = true; game.start(0); assert.deepEqual(game.sceneObjects, []);
});

test('all environment sprites are project-local RGBA PNGs', () => {
  for (const spec of Object.values(SCENE_ASSETS)) {
    const bytes = readFileSync(new URL(`../${spec.image}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 1, 4), 'PNG');
    assert.equal(bytes[25], 6, `${spec.name} must retain RGBA transparency`);
    assert.ok(bytes.readUInt32BE(16) > 600 && bytes.readUInt32BE(20) > 600);
  }
});
