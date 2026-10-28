import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/engine.js';
import { MONSTERS, MONSTER_IDS, isAttacking, launchMonster } from '../src/monsters.js';
import { freshSave } from '../src/save.js';
import { FLOOR, HEROES, statsFor } from '../src/data.js';
import { INUYASHA_MOVES } from '../src/inuyasha.js';

// Exercise the actual lab event handlers against the real game simulation.
// Canvas/audio are replaced here; visible sprite clipping is checked in-app.
function lab() {
  function element(value = '') {
    const handlers = new Map();
    return { value, checked: false, disabled: false, dataset: {}, textContent: '', focus() {},
      addEventListener(name, handler) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(handler); },
      trigger(name, event = {}) { for (const handler of handlers.get(name) || []) handler({ target: this, preventDefault() {}, ...event }); }
    };
  }
  const elements = new Map(['game', 'species', 'count', 'catalog', 'hitboxes', 'reset', 'hero', 'heal', 'slow', 'freeze', 'status'].map(id => [`#lab-${id}`, element()]));
  elements.get('#lab-species').value = 'training'; elements.get('#lab-count').value = '1';
  const buttons = new Map(['combo', 'upper', 'air1', 'plunge', 'scatter', 'blood', 'chain'].map(id => [id, Object.assign(element(), { dataset: { labMove: id }, textContent: id })]));
  const document = { querySelector: id => elements.get(id), querySelectorAll: selector => selector === '[data-lab-move]' ? [...buttons.values()] : [], addEventListener() {} };
  const window = element();
  const dependencies = { Game, Renderer: class { render() {} monsterPortrait() {} }, Audio: class { unlock() {} play() {} update() {} }, MONSTERS, MONSTER_IDS, isAttacking, freshSave, FLOOR, HEROES, statsFor, INUYASHA_MOVES, launchMonster, document, window, performance: { now: () => 0 }, requestAnimationFrame() {} };
  const source = readFileSync(new URL('../src/monster-lab.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
  const state = new Function(...Object.keys(dependencies), `${source}\nreturn { game: () => labGame, frame: labFrame };`)(...Object.values(dependencies));
  let now = 0;
  return { ...state, elements, buttons, window, tick(frames = 1) { for (let i = 0; i < frames; i++) state.frame(now += 1000 / 60); } };
}

test('every lab preview keeps the selected monster species and count', () => {
  const page = lab(), species = page.elements.get('#lab-species'), count = page.elements.get('#lab-count');
  for (const type of MONSTER_IDS) for (const number of [1, 3, 5]) for (const button of page.buttons.values()) {
    species.value = type; count.value = String(number); button.trigger('click');
    assert.equal(species.value, type);
    assert.deepEqual(page.game().enemies.map(enemy => enemy.type), Array(number).fill(type));
    assert.ok(page.game().enemies.every(enemy => enemy.training && enemy.hp === 10000));
    assert.equal(count.disabled, false);
  }
});

test('changing lab selection takes effect immediately and keyboard skills keep that encounter', () => {
  const page = lab(), species = page.elements.get('#lab-species'), count = page.elements.get('#lab-count');
  species.value = 'spider'; species.trigger('change');
  assert.deepEqual(page.game().enemies.map(enemy => enemy.type), ['spider']);
  assert.equal(page.game().enemies[0].hp, MONSTERS.spider.hp);
  count.value = '3'; count.trigger('change');
  const enemies = [...page.game().enemies], canvas = page.elements.get('#lab-game');
  page.window.trigger('keydown', { target: canvas, code: 'KeyU' }); page.tick(12);
  page.window.trigger('keyup', { target: canvas, code: 'KeyU' });
  assert.equal(page.game().action.id, 'scatter'); assert.ok(page.game().cooldowns.inuyasha[0] > 0);
  assert.deepEqual(page.game().enemies, enemies); assert.ok(page.game().enemies.every(enemy => enemy.type === 'spider'));
  assert.match(page.elements.get('#lab-status').textContent, /蜘蛛头/);
});

test('lab previews preserve mixed encounters and put the selected target within claw reach', () => {
  const page = lab(), species = page.elements.get('#lab-species');
  for (const [scenario, types] of [['ground', ['spider', 'spider', 'crow']], ['venom', ['spider', 'hornet', 'hornet']], ['landing', ['harpy', 'rat', 'rat']], ['swarm', Array(5).fill('rat')], ['basicGround', ['crawler', 'maw', 'manyeye']], ['basicMixed', ['beetle', 'tongue', 'eyeball']], ['villageHorde', ['wingface', 'humpneck', 'crawler']], ['templeHorde', ['cyclops', 'skullwhisker', 'tongue']]]) {
    species.value = scenario; page.buttons.get('scatter').trigger('click');
    assert.deepEqual(page.game().enemies.map(enemy => enemy.type), types);
    assert.equal(page.elements.get('#lab-count').disabled, true);
  }
  for (const type of MONSTER_IDS) {
    species.value = type; page.elements.get('#lab-count').value = '1'; page.buttons.get('scatter').trigger('click');
    const target = page.game().enemies[0], hp = target.hp; page.tick(24);
    assert.ok(target.hp < hp, `${type} should be hit in its preview`);
    assert.ok(page.game().effects.some(effect => effect.type === 'clawImpact' && effect.target === target));
  }
  page.elements.get('#lab-reset').trigger('click');
  assert.equal(page.game().enemies[0].hp, MONSTERS[species.value].hp);
  assert.equal(page.game().enemies[0].training, undefined);
});

test('both heroes clear the new mixed hordes with normal lab health and controls without gaining progression rewards', () => {
  for (const hero of ['inuyasha', 'kagome']) for (const scenario of ['villageHorde', 'templeHorde']) {
    const page = lab(), species = page.elements.get('#lab-species');
    species.value = scenario; species.trigger('change');
    const game = page.game(), before = structuredClone(game.save);
    if (hero === 'kagome') page.elements.get('#lab-hero').trigger('click');
    const canvas = page.elements.get('#lab-game');
    for (let frame = 0; frame < 1800 && game.enemies.some(e => e.hp > 0); frame++) {
      const nearest = game.enemies.filter(e => e.hp > 0).sort((a, b) => Math.abs(a.x - game.hero.x) - Math.abs(b.x - game.hero.x))[0];
      const dx = nearest.x + nearest.w / 2 - game.hero.x - game.hero.w / 2;
      for (const [code, pressed] of [['KeyJ', true], ['KeyD', dx > 50], ['KeyA', dx < -50], ['KeyU', frame % 240 === 0], ['KeyI', frame % 300 === 0]]) {
        page.window.trigger(pressed ? 'keydown' : 'keyup', { target: canvas, code });
      }
      page.tick();
    }
    assert.equal(game.active, hero); assert.equal(game.state, 'playing');
    assert.ok(game.health[hero] > 0); assert.equal(game.enemies.filter(e => e.hp > 0).length, 0, `${hero}: ${scenario}`);
    assert.deepEqual({ ...game.save, playTime: before.playTime }, before);
  }
});
