import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BASIC_MONSTER_IDS } from '../src/monsters.js';
import { inspectMonsterAtlas } from '../scripts/monster-atlases.mjs';

test('ten generated RGBA atlases expose eight complete silhouettes and matching portable frame metadata', async () => {
  for (const id of BASIC_MONSTER_IDS) {
    const atlas = await inspectMonsterAtlas(id);
    const recorded = JSON.parse(await readFile(new URL(`../assets/monsters/${id}.atlas.json`, import.meta.url), 'utf8'));
    assert.deepEqual(recorded, atlas, `${id}: regenerate atlas metadata after artwork changes`);
    assert.equal(atlas.frames.length, 8);
    for (const frame of atlas.frames) {
      const mask = Buffer.from(frame.mask.data, 'base64');
      let pixels = 0;
      for (const byte of mask) { let value = byte; while (value) { value &= value - 1; pixels++; } }
      assert.equal(pixels, frame.pixels, `${id}: mask must contain only the selected body`);
    }
    if (id === 'tongue') {
      const attack = atlas.frames[4];
      assert.ok(attack.w > atlas.frames[0].w * 1.2, 'the extended tongue must be included');
      assert.ok(attack.x + attack.w > atlas.width / 4, 'the cross-cell tongue tip must not be cut at the grid line');
    }
  }
});
