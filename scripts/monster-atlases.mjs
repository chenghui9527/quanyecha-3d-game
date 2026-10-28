import { readFile, writeFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { Renderer } from '../src/art.js';
import { MONSTERS, BASIC_MONSTER_IDS } from '../src/monsters.js';

// Inspect generated pixels without changing or re-encoding the artwork.
export async function readRgbaPng(path) {
  const bytes = await readFile(path), chunks = [];
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  let width, height;
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8), data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      assert.equal(data[8], 8, '8-bit pixels required'); assert.equal(data[9], 6, 'RGBA required'); assert.equal(data[12], 0, 'noninterlaced PNG required');
    }
    if (type === 'IDAT') chunks.push(data);
    offset += length + 12;
  }
  const packed = inflateSync(Buffer.concat(chunks)), stride = width * 4, pixels = new Uint8ClampedArray(width * height * 4);
  assert.equal(packed.length, (stride + 1) * height);
  function paeth(a, b, c) { const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c); return da <= db && da <= dc ? a : db <= dc ? b : c; }
  let cursor = 0;
  for (let y = 0; y < height; y++) {
    const filter = packed[cursor++]; assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x, left = x >= 4 ? pixels[index - 4] : 0, up = y ? pixels[index - stride] : 0, corner = y && x >= 4 ? pixels[index - stride - 4] : 0;
      const predict = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, corner)][filter];
      pixels[index] = (packed[cursor++] + predict) & 255;
    }
  }
  return { width, height, pixels };
}

export async function inspectMonsterAtlas(id) {
  const spec = MONSTERS[id], image = new URL(`../assets/monsters/${id}.png`, import.meta.url), sheet = await readRgbaPng(image);
  let transparent = 0, opaque = 0;
  for (let i = 3; i < sheet.pixels.length; i += 4) { if (sheet.pixels[i] === 0) transparent++; if (sheet.pixels[i] > 80) opaque++; }
  assert.ok(transparent > sheet.width * sheet.height * 0.2, `${id}: transparent background missing`);
  assert.ok(opaque > 1000, `${id}: empty artwork`);
  const renderer = Object.create(Renderer.prototype), entry = { sheet, spec }, previous = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => ({ data: sheet.pixels }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {} }) }) };
  try { renderer.prepareMonsterFrames(entry); } finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
  const poses = ['idle', 'moveA', 'moveB', 'windup', 'attack', 'recover', 'hurt', 'dead'];
  const frames = entry.frames.map((frame, i) => {
    assert.ok(frame.area > 100, `${id}: missing pose ${poses[i]}`);
    assert.ok(frame.sx >= 0 && frame.sy >= 0 && frame.sx + frame.w <= sheet.width && frame.sy + frame.h <= sheet.height);
    assert.ok(frame.pivotX >= 0 && frame.pivotX <= frame.w, `${id}: invalid body anchor`);
    return { pose: poses[i], x: frame.sx, y: frame.sy, w: frame.w, h: frame.h, pivotX: frame.pivotX, pivotY: frame.h, pixels: frame.area, mask: { encoding: 'bitset-base64-lsb', data: Buffer.from(frame.mask).toString('base64') } };
  });
  return { image: `${id}.png`, name: spec.name, reference: spec.reference, width: sheet.width, height: sheet.height, columns: 4, rows: 2, transparent: true, frameExtraction: 'largest-connected-silhouette-per-cell-with-mask', spriteHeight: spec.spriteHeight, frames };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const atlases = [];
  for (const id of BASIC_MONSTER_IDS) {
    const atlas = await inspectMonsterAtlas(id);
    atlases.push(atlas);
    if (process.argv.includes('--write')) await writeFile(new URL(`../assets/monsters/${id}.atlas.json`, import.meta.url), JSON.stringify(atlas, null, 2) + '\n');
    console.log(`${id}: ${atlas.width}×${atlas.height}, RGBA, ${atlas.frames.length} complete poses`);
  }
  if (process.argv.includes('--write')) {
    const page = new URL('../assets/monsters/preview.html', import.meta.url), html = await readFile(page, 'utf8');
    await writeFile(page, html.replace(/(<script id="atlas-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, start, end) => start + JSON.stringify(atlases) + end));
  }
}
