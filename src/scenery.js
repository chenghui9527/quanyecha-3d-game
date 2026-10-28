import { FLOOR, WIDTH } from './data.js';

// World dimensions use the same pixels as the hero and collision platforms.
export const SCENE_ASSETS = {
  tree: { name: '普通大树', image: './assets/scenery/forest-tree.png', columns: 1, rows: 1, height: 410, groundOverlap: 5 },
  sacred: { name: '御神木', image: './assets/scenery/sacred-tree.png', columns: 1, rows: 1, height: 555, groundOverlap: 32 },
  house: { name: '茅草屋', image: './assets/scenery/village-house.png', columns: 1, rows: 1, height: 278 },
  door: { name: '木门', image: './assets/scenery/wooden-door.png', columns: 2, rows: 1, height: 100 },
  well: { name: '食骨之井', image: './assets/scenery/bone-eaters-well.png', columns: 1, rows: 1, height: 64 },
  terrain: { name: '地面与岩石平台', image: './assets/scenery/terrain.png', columns: 3, rows: 2, height: 96 },
  torii: { name: '神社门 · 鸟居', image: './assets/scenery/shrine-torii.png', columns: 1, rows: 1, height: 260 }
};

export function createScenery(level, lab = false) {
  if (lab) return [];
  const objects = [];
  if (level.palette === 'grave') return [{ id: 'shrine-exit', type: 'torii', x: level.length - 230, height: SCENE_ASSETS.torii.height }];
  if (level.id === 0) {
    objects.push({ id: 'bone-well', type: 'well', x: 218, height: 64 });
    objects.push({ id: 'goshinboku', type: 'sacred', x: 650, height: 555 });
  }
  if (level.palette === 'village') {
    for (const [i, x] of [800, 2690, 4300, 6120].entries()) {
      objects.push({ id: `cottage-${i}`, type: 'house', x, height: i === 1 ? 296 : 278, door: true });
    }
  }
  const positions = level.palette === 'village' ? [300, 1530, 3290, 4930, 6670] : level.id === 0 ? [1270, 2240, 3210, 3940, 4920, 5800] : [270, 940, 1900, 2680, 3570, 4380, 5550, 6390, 7090];
  const spans = []; let from = 0;
  for (const [x, width] of level.gaps) { spans.push([from, x]); from = x + width; }
  spans.push([from, level.length]);
  for (const [i, x] of positions.entries()) if (x < level.length - 180) {
    const height = 360 + (i * 47 % 109), rootRadius = height * 0.53;
    const span = spans.find(([left, right]) => x >= left && x <= right && right - left >= rootRadius * 2);
    if (span) objects.push({ id: `tree-${i}`, type: 'tree', x: Math.max(span[0] + rootRadius, Math.min(span[1] - rootRadius, x)), height });
  }
  // Keep the whole lintel inside the camera's final view. Passing through the
  // open gate still uses the chapter's existing completion condition.
  objects.push({ id: 'shrine-exit', type: 'torii', x: level.length - 230, height: SCENE_ASSETS.torii.height });
  return objects;
}

export function nearbySceneDoor(game) {
  const hero = game.hero;
  if (!hero?.grounded || Math.abs(hero.y + hero.h - FLOOR) > 12) return null;
  return game.sceneObjects?.find(object => object.door && Math.abs(hero.x + hero.w / 2 - object.x) <= 64) || null;
}

export class SceneArt {
  constructor() {
    this.entries = {};
    this.ready = Promise.all(Object.entries(SCENE_ASSETS).map(([id, spec]) => new Promise(resolve => {
      const sheet = new Image(), entry = { sheet, spec, frames: null, error: false };
      this.entries[id] = entry;
      sheet.onload = () => {
        try { entry.frames = this.extractFrames(sheet, spec); } catch { entry.error = true; }
        resolve();
      };
      sheet.onerror = () => { entry.error = true; resolve(); };
      sheet.src = spec.image;
    })));
  }

  extractFrames(sheet, spec) {
    const buffer = document.createElement('canvas'); buffer.width = sheet.width; buffer.height = sheet.height;
    const ctx = buffer.getContext('2d', { willReadFrequently: true }); ctx.drawImage(sheet, 0, 0);
    const data = ctx.getImageData(0, 0, sheet.width, sheet.height).data, frames = [];
    let rowSplit = Math.floor(sheet.height / 2);
    if (spec.rows === 2) {
      // Terrain sheets can give the thick ground row more room than the thin
      // ledge row. Use their transparent gutter instead of cutting rock apart.
      let runStart = -1, bestStart = 0, bestLength = 0;
      for (let y = Math.floor(sheet.height * 0.4); y < sheet.height * 0.7; y++) {
        let opaque = 0;
        for (let x = 0; x < sheet.width; x++) if (data[(y * sheet.width + x) * 4 + 3] > 80) opaque++;
        if (opaque < sheet.width * 0.01) { if (runStart < 0) runStart = y; }
        else if (runStart >= 0) { if (y - runStart > bestLength) { bestStart = runStart; bestLength = y - runStart; } runStart = -1; }
      }
      if (bestLength > 4) rowSplit = Math.floor(bestStart + bestLength / 2);
    }
    for (let row = 0; row < spec.rows; row++) for (let col = 0; col < spec.columns; col++) {
      const x0 = Math.floor(col * sheet.width / spec.columns), y0 = spec.rows === 2 ? row === 0 ? 0 : rowSplit : 0;
      const x1 = Math.floor((col + 1) * sheet.width / spec.columns), y1 = spec.rows === 2 && row === 0 ? rowSplit : sheet.height;
      let left = x1, top = y1, right = x0 - 1, bottom = y0 - 1;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (data[(y * sheet.width + x) * 4 + 3] > 80) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      if (right < left) throw new Error(`Empty scenery cell: ${spec.name}`);
      let walkTop = top;
      // Grass tips sit above the collision line. Align the first solid band of
      // soil/stone to that line, rather than landing the hero on grass tips.
      if (spec.rows === 2) for (let y = top; y <= bottom; y++) {
        let solid = 0, samples = 0;
        for (let x = left + Math.floor((right - left) * 0.2); x <= right - Math.floor((right - left) * 0.2); x++) { samples++; if (data[(y * sheet.width + x) * 4 + 3] > 200) solid++; }
        if (solid / samples > 0.9) { walkTop = y; break; }
      }
      frames.push({ sx: left, sy: top, w: right - left + 1, h: bottom - top + 1, walkTop });
    }
    return frames;
  }

  sprite(ctx, id, x, feet, height = SCENE_ASSETS[id].height, frame = 0) {
    const entry = this.entries[id], f = entry?.frames?.[frame];
    if (!f) return false;
    // Independently trim each door state, then fit it to the closed frame's
    // dimensions. Generated cells need not have identical transparent padding.
    const reference = id === 'door' ? entry.frames[0] : f;
    const width = reference.w * height / reference.h;
    ctx.drawImage(entry.sheet, f.sx, f.sy, f.w, f.h, Math.round(x - width / 2), Math.round(feet - height), Math.round(width), Math.round(height));
    return true;
  }

  houseDoor(object) {
    // The cottage's empty doorway and the independent door share a baseline.
    return { x: object.x - object.height * 0.002, feet: FLOOR - object.height * 0.07, height: object.height * 0.32 };
  }

  objectFeet(object) {
    const spec = SCENE_ASSETS[object.type];
    // The lowest root tip is not the tree's ground plane. Bury the root fan
    // behind the terrain, scaling its overlap with the placed sprite's size.
    return FLOOR + Math.round((spec.groundOverlap || 0) * object.height / spec.height);
  }

  drawObjects(ctx, game) {
    ctx.save(); ctx.translate(-Math.round(game.camera), 0);
    if (game.level.palette === 'night') ctx.filter = 'brightness(0.58) saturate(0.65)';
    if (game.level.palette === 'yura') ctx.filter = 'brightness(0.62) saturate(0.55)';
    for (const object of game.sceneObjects || []) {
      if (object.x < game.camera - 500 || object.x > game.camera + WIDTH + 500) continue;
      this.sprite(ctx, object.type, object.x, this.objectFeet(object), object.height);
      if (object.door) {
        const door = this.houseDoor(object);
        this.sprite(ctx, 'door', door.x, door.feet, door.height, game.openDoors?.has(object.id) ? 1 : 0);
      }
    }
    ctx.restore();
  }

  drawPlatform(ctx, platform, camera, palette) {
    const entry = this.entries.terrain;
    if (!entry?.frames) return false;
    const ground = platform.h > 30, row = ground ? 0 : 3;
    const left = Math.round(platform.x - camera), right = Math.round(platform.x + platform.w - camera);
    if (left > WIDTH || right < 0) return true;
    ctx.save();
    if (palette[0] === '#1a213c') ctx.filter = 'brightness(0.62) saturate(0.65)';
    if (palette[0] === '#302238') ctx.filter = 'brightness(0.68) saturate(0.55)';
    // Collision width is also the draw clip: no apparent bridge over a gap.
    ctx.beginPath(); ctx.rect(left, platform.y - 6, right - left, platform.h + 12); ctx.clip();
    if (ground) { ctx.fillStyle = palette[3]; ctx.fillRect(left, platform.y, right - left, platform.h); }
    const count = Math.max(1, Math.ceil(platform.w / (ground ? 128 : 72))), tileWidth = (right - left) / count;
    const start = Math.max(0, Math.floor((camera - platform.x) / tileWidth));
    const end = Math.min(count, Math.ceil((camera + WIDTH - platform.x) / tileWidth));
    for (let i = start; i < end; i++) {
      const f = entry.frames[row + (i === 0 ? 0 : i === count - 1 ? 2 : 1)];
      const tileX = left + Math.round(i * tileWidth), tileW = Math.round((i + 1) * tileWidth) - Math.round(i * tileWidth);
      const scaleY = (platform.h + (ground ? 0 : 5)) / (f.sy + f.h - f.walkTop);
      ctx.drawImage(entry.sheet, f.sx, f.sy, f.w, f.h, tileX, platform.y - (f.walkTop - f.sy) * scaleY, tileW, f.h * scaleY);
    }
    ctx.restore(); return true;
  }

  doorHint(ctx, game) {
    const object = nearbySceneDoor(game);
    if (!object || game.state !== 'playing' || game.action) return;
    const text = game.openDoors?.has(object.id) ? 'E / Enter  关门' : 'E / Enter  开门';
    const x = Math.round(object.x - game.camera), y = FLOOR - 140;
    ctx.save(); ctx.fillStyle = '#132626e8'; ctx.fillRect(x - 63, y - 17, 126, 28);
    ctx.strokeStyle = '#c9ae7966'; ctx.strokeRect(x - 63, y - 17, 126, 28);
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#e9d9b5'; ctx.fillText(text, x, y + 1); ctx.restore();
  }
}
