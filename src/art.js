import { WIDTH, HEIGHT, FLOOR, HEROES, clamp } from './data.js';
import { usesAwakenedFang } from './inventory.js';
import { MONSTERS } from './monsters.js';
import { INUYASHA_MOVES, inuyashaHitbox, sankonBladeContours } from './inuyasha.js';
import { SceneArt } from './scenery.js';

const palettes = {
  forest: ['#143b3b', '#7eaa9a', '#244c42', '#294432', '#6d8b4d', '#121e22'],
  village: ['#5e7266', '#d1c49a', '#5c7964', '#5b5136', '#8b995b', '#242b28'],
  night: ['#1a213c', '#66718b', '#303c51', '#2a323d', '#63716a', '#151b29'],
  yura: ['#302238', '#a0828f', '#443349', '#3f303f', '#8a687a', '#211a28'],
  grave: ['#141e33', '#71829b', '#344359', '#3d4353', '#a7b1bd', '#131b2b']
};
const noise = n => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
function poly(ctx, color, points) { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y))); ctx.closePath(); ctx.fill(); }
function rect(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }
function monsterPose(e, time) { return e.state === 'dead' ? 7 : e.state === 'hurt' ? 6 : e.state === 'recover' ? 5 : e.state === 'attack' ? 4 : e.state === 'windup' ? 3 : e.moving || e.flying ? 1 + Math.floor(time * 8 + e.seed) % 2 : 0; }

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.scenery = new SceneArt();
    this.sprites = new Image(); this.sprites.src = './assets/heroes.png';
    this.background = new Image(); this.background.src = './assets/title-scene.png';
    this.frames = null;
    this.sprites.onload = () => this.prepareFrames();
    this.combatSheet = new Image(); this.combatFrames = null;
    this.combatSheet.onload = () => this.prepareCombatFrames();
    this.combatSheet.src = './assets/characters/inuyasha-combat.png';
    this.bloodSheet = new Image(); this.bloodFrames = null;
    this.bloodSheet.onload = () => { this.bloodFrames = this.extractCombatFrames(this.bloodSheet, 2, 2); };
    this.bloodSheet.src = './assets/characters/inuyasha-blood-claws.png';
    this.monsterSheets = {};
    for (const [id, spec] of Object.entries(MONSTERS)) {
      const sheet = new Image();
      const entry = { sheet, frames: null, spec }; this.monsterSheets[id] = entry;
      sheet.onload = () => this.prepareMonsterFrames(entry);
      sheet.src = spec.image;
    }
  }
  prepareMonsterFrames(entry) {
    if (entry.spec.atlasMode === 'silhouette') {
      // Keep the whole pose when a long tongue or tail extends across a cell.
      entry.frames = this.extractCombatFrames(entry.sheet, 4, 2, true);
      if (!entry.frames) throw new Error(`Incomplete monster atlas: ${entry.spec.name}`);
      entry.frames.forEach((frame, i) => { frame.pivotX = (i % 4 + 0.5) * entry.sheet.width / 4 - frame.sx; });
      entry.factor = entry.spec.spriteHeight / entry.frames[0].h;
      return;
    }
    const sheet = entry.sheet, buffer = document.createElement('canvas');
    buffer.width = sheet.width; buffer.height = sheet.height;
    const ctx = buffer.getContext('2d', { willReadFrequently: true }); ctx.drawImage(sheet, 0, 0);
    const data = ctx.getImageData(0, 0, sheet.width, sheet.height).data;
    entry.frames = [];
    for (let i = 0; i < 8; i++) {
      const sx = Math.floor((i % 4) * sheet.width / 4), sy = Math.floor(Math.floor(i / 4) * sheet.height / 2);
      const w = Math.floor((i % 4 + 1) * sheet.width / 4) - sx, h = Math.floor((Math.floor(i / 4) + 1) * sheet.height / 2) - sy;
      let left = w, top = h, right = 0, bottom = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[((sy + y) * sheet.width + sx + x) * 4 + 3] > 80) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      entry.frames.push({ sx: sx + left, sy: sy + top, w: Math.max(1, right - left + 1), h: Math.max(1, bottom - top + 1) });
    }
    entry.factor = entry.spec.spriteHeight / entry.frames[0].h;
  }
  monsterSprite(ctx, type, x, feet, pose = 0, facing = 1, scale = 1) {
    const entry = this.monsterSheets[type];
    if (!entry?.frames) return false;
    const f = entry.frames[pose] || entry.frames[0], factor = entry.factor * scale;
    ctx.save(); ctx.translate(Math.round(x), Math.round(feet)); ctx.scale(facing, 1);
    ctx.drawImage(f.isolated || entry.sheet, f.isolated ? 0 : f.sx, f.isolated ? 0 : f.sy, f.w, f.h, -(f.pivotX ?? f.w / 2) * factor, -f.h * factor, f.w * factor, f.h * factor);
    ctx.restore(); return true;
  }
  monsterPortrait(canvas, type, time = 0) {
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
    const entry = this.monsterSheets[type];
    if (!entry?.frames) return;
    const pose = Math.max(0, Math.floor(time * 4)) % 3;
    const maxW = Math.max(...entry.frames.map(f => Math.max(f.pivotX ?? f.w / 2, f.w - (f.pivotX ?? f.w / 2)) * 2)), maxH = Math.max(...entry.frames.map(f => f.h));
    const scale = Math.min((canvas.width - 20) / maxW, (canvas.height - 14) / maxH) / entry.factor;
    this.monsterSprite(ctx, type, canvas.width / 2, canvas.height - 9, pose, 1, scale);
  }
  prepareFrames() {
    const sheet = this.sprites, cw = sheet.width / 4, ch = sheet.height / 2;
    const buffer = document.createElement('canvas'); buffer.width = sheet.width; buffer.height = sheet.height;
    const ctx = buffer.getContext('2d', { willReadFrequently: true }); ctx.drawImage(sheet, 0, 0);
    const data = ctx.getImageData(0, 0, sheet.width, sheet.height).data;
    this.frames = [[], []];
    for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
      let left = cw, top = ch, right = 0, bottom = 0;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const px = Math.floor(col * cw + x), py = Math.floor(row * ch + y);
        if (data[(py * sheet.width + px) * 4 + 3] > 64) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
      }
      this.frames[row][col] = { sx: col * cw, sy: row * ch, w: cw, h: ch, cx: (left + right) / 2, bottom, height: bottom - top };
    }
  }
  prepareCombatFrames() {
    this.combatFrames = this.extractCombatFrames(this.combatSheet, 4, 4);
    if (this.combatFrames) this.combatFactor = 88 / this.combatFrames[7].h;
  }
  extractCombatFrames(sheet, columns, rows, isolate = false) {
    const buffer = document.createElement('canvas');
    buffer.width = sheet.width; buffer.height = sheet.height;
    const ctx = buffer.getContext('2d', { willReadFrequently: true }); ctx.drawImage(sheet, 0, 0);
    const data = ctx.getImageData(0, 0, sheet.width, sheet.height).data;
    // Generated poses can extend a few pixels over a nominal cell edge. Find
    // whole silhouettes before assigning cells, so a neighbouring foot never
    // appears above the next pose and an uppercut's toes are not clipped.
    const width = sheet.width, height = sheet.height, seen = new Uint8Array(width * height), queue = new Int32Array(width * height);
    const frames = Array(columns * rows).fill(null);
    for (let origin = 0; origin < seen.length; origin++) {
      if (seen[origin] || data[origin * 4 + 3] <= 80) continue;
      let head = 0, tail = 1, left = width, right = 0, top = height, bottom = 0;
      queue[0] = origin; seen[origin] = 1;
      while (head < tail) {
        const pixel = queue[head++], x = pixel % width, y = Math.floor(pixel / width);
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
        for (const next of [x > 0 ? pixel - 1 : -1, x + 1 < width ? pixel + 1 : -1, y > 0 ? pixel - width : -1, y + 1 < height ? pixel + width : -1]) {
          if (next >= 0 && !seen[next] && data[next * 4 + 3] > 80) { seen[next] = 1; queue[tail++] = next; }
        }
      }
      const col = Math.min(columns - 1, Math.floor((left + right) / 2 / (width / columns))), row = Math.min(rows - 1, Math.floor((top + bottom) / 2 / (height / rows))), index = row * columns + col;
      if (tail > (frames[index]?.area || 0)) frames[index] = { sx: left, sy: top, w: right - left + 1, h: bottom - top + 1, area: tail, ...(isolate ? { members: queue.slice(0, tail) } : {}) };
    }
    if (frames.some(frame => !frame || frame.area < 100)) return null;
    if (isolate) for (const frame of frames) {
      const isolated = document.createElement('canvas'); isolated.width = frame.w; isolated.height = frame.h;
      const context = isolated.getContext('2d'), pixels = context.createImageData(frame.w, frame.h);
      frame.mask = new Uint8Array(Math.ceil(frame.w * frame.h / 8));
      for (const pixel of frame.members) {
        const index = (Math.floor(pixel / width) - frame.sy) * frame.w + pixel % width - frame.sx;
        frame.mask[index >> 3] |= 1 << (index & 7);
        pixels.data.set(data.subarray(pixel * 4, pixel * 4 + 4), index * 4);
      }
      context.putImageData(pixels, 0, 0); frame.isolated = isolated; delete frame.members;
    }
    return frames;
  }
  combatCharacter(ctx, x, feet, action, alpha = 1) {
    if (action.id === 'blood' && this.bloodFrames) {
      const t = action.elapsed || 0, frame = t < 0.10 ? 0 : t < INUYASHA_MOVES.blood.windup ? 1 : t < 0.45 ? 2 : 3;
      const f = this.bloodFrames[frame], factor = 87 / this.bloodFrames[0].h, offset = [0, -6, -9, -3][frame];
      ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(Math.round(x), Math.round(feet)); ctx.scale(action.facing || 1, 1);
      ctx.drawImage(this.bloodSheet, f.sx, f.sy, f.w, f.h, -f.w * factor / 2 + offset, -f.h * factor, f.w * factor, f.h * factor);
      ctx.restore(); return true;
    }
    if (!this.combatFrames) return false;
    const def = INUYASHA_MOVES[action.id], t = action.elapsed || 0;
    const striking = t >= def.windup;
    const frame = action.id === 'scatter' ? (t < def.windup ? 12 : t < 0.23 ? 13 : t < 0.40 ? 5 : 0) : action.id === 'blood' ? (striking ? 13 : 12) : def.frames[striking ? 1 : 0], f = this.combatFrames[frame];
    // Anchor the pelvis, rather than the bounding-box center: a reaching claw
    // should extend forward without dragging the character's feet backward.
    const offsets = [0, -9, 0, -5, 0, -12, 0, 1, 0, -9, 0, -12, 0, -10, 0, -17];
    const factor = this.combatFactor, follow = striking ? Math.sin(Math.min(1, (t - def.windup) / (def.duration - def.windup)) * Math.PI) : 0;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(Math.round(x), Math.round(feet)); ctx.scale(action.facing || 1, 1);
    const tilt = action.id === 'air2' ? -0.09 * follow : action.id === 'scatter' ? (striking ? 0.045 * Math.sin(Math.min(1, (t - def.windup) / 0.26) * Math.PI) : -0.025) : 0;
    ctx.rotate(tilt);
    const crouch = action.id === 'landing' ? 3 : action.id === 'upper' && !striking ? 3 : 0;
    ctx.drawImage(this.combatSheet, f.sx, f.sy, f.w, f.h, -f.w * factor / 2 + offsets[frame] + follow * 2, -f.h * factor + crouch, f.w * factor, f.h * factor);
    if (action.weapon) this.fang(ctx, 8, -48, striking ? 0.3 : -0.65);
    ctx.restore(); return true;
  }
  fang(ctx, x, y, angle = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    rect(ctx, '#483846', -9, -3, 24, 6); rect(ctx, '#d8b777', 10, -10, 5, 20);
    poly(ctx, '#6c7a89', [[14, -4], [70, -27], [100, -25], [83, -5], [34, 13], [14, 5]]);
    poly(ctx, '#f0e9c8', [[15, -5], [73, -25], [98, -25], [76, -8], [32, 9], [15, 4]]);
    poly(ctx, '#fff8e0', [[16, -5], [73, -25], [98, -25], [67, -18], [22, -1]]); ctx.restore();
  }
  combatRibbon(ctx, points, width, color) {
    const outline = [], inner = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i], before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
      const dx = after[0] - before[0], dy = after[1] - before[1], length = Math.hypot(dx, dy) || 1;
      const taper = Math.sin(i / (points.length - 1) * Math.PI) ** 0.6 * width;
      outline.push([p[0] - dy / length * taper, p[1] + dx / length * taper]);
      inner.unshift([p[0] + dy / length * taper, p[1] - dx / length * taper]);
    }
    poly(ctx, color, [...outline, ...inner]);
  }
  sankonSlash(ctx, e) {
    const age = e.maxLife - e.life;
    for (const claw of e.claws) {
      const blade = sankonBladeContours(claw, age);
      if (!blade) continue;
      ctx.save(); ctx.globalAlpha *= blade.opacity;
      ctx.save(); ctx.globalAlpha *= 0.20;
      ctx.shadowColor = '#ffe575'; ctx.shadowBlur = 7;
      this.combatRibbon(ctx, blade.outer, claw.width * 1.4, '#f7dc72'); ctx.restore();
      poly(ctx, '#f7de87', blade.polygon);
      const inset = blade.outer.map(([x, y], i) => [x + (blade.inner[i][0] - x) * 0.62, y + (blade.inner[i][1] - y) * 0.62]);
      poly(ctx, '#fff8d9', [...blade.outer, ...inset.toReversed()]);
      // Three pale-gold claw strokes: a clean white ridge cuts through,
      // followed by a short tapering smear instead of a held metal blade.
      ctx.strokeStyle = '#fffce7'; ctx.lineWidth = 1.3; ctx.beginPath();
      blade.outer.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      if (blade.localAge < 0.075) {
        ctx.save(); ctx.globalAlpha *= 1 - blade.localAge / 0.075;
        const tip = blade.outer.slice(-7);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.beginPath();
        tip.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
      }
      // A few short brush-like air streaks trail along the same motion.
      // No second crescents or large fragments are added to the three claws.
      for (const index of [10, 23]) {
        const p = blade.inner[index], before = blade.outer[index - 1], after = blade.outer[index + 1];
        const dx = after[0] - before[0], dy = after[1] - before[1], length = Math.hypot(dx, dy) || 1;
        const seed = claw.controlX + index * 9, peel = clamp((blade.localAge - 0.025) / 0.12, 0, 1);
        const drift = 2 + peel * 4, trail = 5 + noise(seed) * 8;
        const x = p[0] - dy / length * drift, y = p[1] + dx / length * drift;
        ctx.save(); ctx.globalAlpha *= Math.sin(peel * Math.PI) * 0.42;
        poly(ctx, '#fff0ba', [[x, y], [x - dx / length * trail - dy / length, y - dy / length * trail + dx / length], [x - dx / length * trail * 0.4, y - dy / length * trail * 0.4]]);
        ctx.restore();
      }
      ctx.restore();
    }
  }
  monsterClawMarks(ctx, effect, time) {
    const target = effect.target, entry = this.monsterSheets[target.type];
    const frame = entry?.frames?.[monsterPose(target, time)];
    if (!frame) {
      this.combatEffect(ctx, { ...effect, x: target.x + target.w / 2, y: target.y + target.h / 2 }); return;
    }
    const factor = entry.factor, width = Math.ceil(frame.w * factor), height = Math.ceil(frame.h * factor);
    const scratch = this.clawMarkCanvas ||= document.createElement('canvas');
    if (scratch.width !== width || scratch.height !== height) { scratch.width = width; scratch.height = height; }
    const marks = scratch.getContext('2d'); marks.clearRect(0, 0, width, height); marks.imageSmoothingEnabled = false;
    const age = effect.maxLife - effect.life, scale = clamp(height / 78, 0.5, 1.5), opening = Math.min(1, age / 0.09) * 1.8;
    marks.save(); marks.translate(width / 2, height * 0.48); marks.scale(effect.facing * scale, scale);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 9;
      const points = [[x - 9, -19], [x + 1, -14], [x + 7, -5], [x + 8, 7], [x + 2, 19]];
      this.combatRibbon(marks, points, 2.4 + opening * 0.5, '#151c23');
      marks.save(); marks.translate(opening + 0.8, -0.5);
      this.combatRibbon(marks, points, age < 0.07 ? 2.0 : 1.3, '#fff4c7'); marks.restore();
    }
    marks.restore();
    // Clip to the current sprite's opaque pixels, then place it at the same
    // feet anchor as the monster. Cuts follow motion, hurt poses and death.
    marks.save(); marks.globalCompositeOperation = 'destination-in'; marks.translate(width / 2, height); marks.scale(target.facing, 1);
    marks.drawImage(frame.isolated || entry.sheet, frame.isolated ? 0 : frame.sx, frame.isolated ? 0 : frame.sy, frame.w, frame.h, -frame.w * factor / 2, -frame.h * factor, frame.w * factor, frame.h * factor);
    marks.restore();
    ctx.save(); ctx.filter = 'none'; ctx.globalAlpha = Math.min(1, effect.life / 0.14) * (target.state === 'dead' ? clamp(target.deathClock / 0.5, 0, 1) : 1);
    const anchorShift = target.facing * ((frame.pivotX ?? frame.w / 2) - frame.w / 2) * factor;
    ctx.drawImage(scratch, Math.round(target.x + target.w / 2) - width / 2 - anchorShift, Math.round(target.y + target.h) - height);
    ctx.restore();
    // Keep only tiny contact flecks outside the silhouette, not floating
    // replacement claw blades. Their origin follows the visible body too.
    if (age < 0.15) {
      const t = age / 0.15, x = target.x + target.w / 2, y = target.y + target.h - height * 0.52;
      ctx.save(); ctx.translate(x, y); ctx.scale(effect.facing * scale, scale); ctx.globalAlpha = (1 - t) * 0.75;
      for (let i = 0; i < 4; i++) {
        const dx = (i % 2 ? 1 : -1) * (9 + t * 17), dy = (Math.floor(i / 2) ? 1 : -1) * (6 + t * 13);
        poly(ctx, '#fff5cf', [[dx, dy], [dx - 4, dy - 2], [dx - 2, dy + 1]]);
      }
      ctx.restore();
    }
  }
  sankonGround(ctx, e, t) {
    const age = e.maxLife - e.life, seed = e.seed, radius = 16 + Math.sqrt(t) * 86;
    // Keep the entire impact tied to the surface plane. Debris uses stable
    // per-cast seeds and simple ballistic motion, rather than frame noise.
    ctx.beginPath(); ctx.rect(-125, -150, 260, 153); ctx.clip();
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? -1 : 1, reach = 24 + noise(seed + i * 9) * 36;
      const points = [[0, 0], [side * reach * 0.35, -2 - i], [side * reach * 0.62, -1], [side * reach, -4 - noise(seed + i) * 5]];
      ctx.save(); ctx.globalAlpha *= 1 - t;
      ctx.beginPath(); points.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.strokeStyle = '#493c2a'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#e7b665'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha *= (1 - t) * 0.8;
    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = i ? '#fff4ce' : '#d9ae68'; ctx.lineWidth = i ? 1.4 : 3;
      ctx.beginPath(); ctx.ellipse(0, -3, radius - i * 7, 3 + t * 10, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    if (t < 0.32) {
      ctx.save(); ctx.globalAlpha *= 1 - t / 0.32;
      poly(ctx, '#fff7d7', [[-31, 0], [-13, -5], [-7, -20], [0, -9], [10, -24], [15, -6], [35, 0]]);
      ctx.restore();
    }
    for (let i = 0; i < 9; i++) {
      const drift = (i - 4) * (8 + t * 13), lift = Math.sin(t * Math.PI / 2) * (7 + noise(seed + i * 2) * 15);
      ctx.save(); ctx.globalAlpha *= (1 - t) * 0.34;
      ctx.fillStyle = i % 2 ? '#a18a61' : '#d1b788'; ctx.beginPath();
      ctx.ellipse(drift, -2 - lift, 7 + t * 13, 3 + t * 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    for (let i = 0; i < 11; i++) {
      const side = i % 2 ? -1 : 1, speed = 65 + noise(seed + i * 7) * 125;
      const x = side * (3 + speed * age), y = -3 - (75 + noise(seed + i * 3) * 100) * age + 390 * age * age;
      if (y > 0) continue;
      const size = 2 + noise(seed + i * 5) * 3;
      ctx.save(); ctx.translate(x, y); ctx.rotate(side * age * (3 + i));
      poly(ctx, '#685640', [[-size, 0], [-size * 0.6, -size], [size, -size * 0.6], [size * 0.6, size * 0.7]]);
      poly(ctx, '#d4b584', [[-size, 0], [-size * 0.6, -size], [size, -size * 0.6], [0, 0]]);
      ctx.restore();
    }
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * (5 + t * 18), y = -7 - Math.sin(t * Math.PI) * (15 + noise(seed + i * 11) * 25);
      rect(ctx, i % 2 ? '#f4cb7d' : '#fff8dc', x, y, 2, 3);
    }
  }
  bloodBlade(ctx, p) {
    ctx.save(); ctx.translate(Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)); ctx.rotate(Math.atan2(p.vy, p.vx));
    const scale = Math.min(1, p.life / 0.10); ctx.scale(scale, scale);
    // Sampled once on emission: varied hooks keep their shape throughout
    // flight, while every cutting edge still points in the travel direction.
    const curl = (p.curvature ?? 1) - 1;
    poly(ctx, '#9e21454d', [[-50, -7], [-2, -15], [10, 0], [-2, 15], [-50, 6], [-29, 0]]);
    // A solid curved blade with two sharp swept-back tips. The narrow lit
    // cutting edge keeps the crimson silhouette readable against red robes.
    ctx.fillStyle = '#53162e'; ctx.beginPath(); ctx.moveTo(-19 - curl * 28, -24);
    ctx.quadraticCurveTo(18 - curl * 12, -21, 27, 0); ctx.quadraticCurveTo(18 - curl * 12, 21, -19 - curl * 28, 24);
    ctx.quadraticCurveTo(4 - curl * 10, 11, 8 - curl * 5, 0); ctx.quadraticCurveTo(4 - curl * 10, -11, -19 - curl * 28, -24); ctx.fill();
    ctx.fillStyle = '#d93759'; ctx.beginPath(); ctx.moveTo(-17 - curl * 27, -22);
    ctx.quadraticCurveTo(18 - curl * 12, -18, 24, 0); ctx.quadraticCurveTo(18 - curl * 12, 18, -17 - curl * 27, 22);
    ctx.quadraticCurveTo(6 - curl * 10, 10, 10 - curl * 5, 0); ctx.quadraticCurveTo(6 - curl * 10, -10, -17 - curl * 27, -22); ctx.fill();
    ctx.strokeStyle = '#ffe3d2'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14 - curl * 26, -21);
    ctx.quadraticCurveTo(17 - curl * 10, -17, 24, 0); ctx.quadraticCurveTo(17 - curl * 10, 17, -14 - curl * 26, 21); ctx.stroke();
    ctx.strokeStyle = '#f98493'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4 - curl * 16, -16); ctx.quadraticCurveTo(12 - curl * 5, -9, 15, 0); ctx.quadraticCurveTo(12 - curl * 5, 9, -4 - curl * 16, 16); ctx.stroke();
    ctx.restore();
  }
  combatEffect(ctx, e) {
    const t = clamp(1 - e.life / e.maxLife, 0, 1);
    ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.scale(e.facing || 1, 1);
    ctx.globalAlpha = Math.min(1, e.life / e.maxLife * 2);
    if (e.type === 'swordArc') {
      const points = [];
      for (let i = 0; i <= 18; i++) { const a = -1.2 + i / 18 * 2.5 * Math.min(1, t * 4); points.push([Math.cos(a) * 100, Math.sin(a) * 65]); }
      this.combatRibbon(ctx, points, 6, '#a9b8cd'); this.combatRibbon(ctx, points, 3, '#fff4c9');
    } else if (e.type === 'clawBurst') {
      this.sankonSlash(ctx, e);
    } else if (e.type === 'clawSlam') {
      this.sankonGround(ctx, e, t);
    } else if (e.type === 'clawImpact') {
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 9, opening = Math.sin(Math.min(1, t * 2.4) * Math.PI / 2) * 2;
        const points = [[x - 8, -17], [x + 2, -13], [x + 8, -4], [x + 9, 7], [x + 2, 17]];
        this.combatRibbon(ctx, points, 1.5 + opening * 0.3, '#292b2e');
        ctx.save(); ctx.translate(opening + 0.7, -0.5);
        this.combatRibbon(ctx, points, t < 0.22 ? 2.0 : 0.9, '#fff9dc'); ctx.restore();
      }
      for (let i = 0; i < 6; i++) {
        const speed = 18 + noise(i * 13 + e.x) * 22, x = (i % 3 - 1) * 9 + t * speed, y = (Math.floor(i / 3) - 0.5) * 13 + t * speed * 0.8;
        const size = (1 - t) * (1.5 + noise(i * 7 + e.x));
        poly(ctx, '#fff4d3', [[x, y], [x - size * 3, y - size * 1.5], [x - size, y + size * 0.2]]);
      }
    } else if (e.type === 'bloodTrail') {
      ctx.rotate(e.angle); ctx.globalAlpha *= 0.45;
      poly(ctx, '#ab2448', [[-30 - t * 10, -2], [8, -6], [15, 0], [8, 6], [-30 - t * 10, 2], [-15, 0]]);
      poly(ctx, '#f47b8e', [[-19, 0], [8, -2], [12, 0], [8, 2]]);
    } else if (e.type === 'bloodRelease') {
      const points = [[-8, 0], [0, -2], [8, -1], [18 + t * 8, 0], [28 + t * 10, 0]];
      this.combatRibbon(ctx, points, 2.8, '#af2445'); this.combatRibbon(ctx, points, 1.0, '#ffb0ad');
    } else if (e.type === 'bloodImpact') {
      for (let i = 0; i < 3; i++) {
        const angle = -0.85 + i * 0.67, r = 18 + t * 20;
        ctx.save(); ctx.rotate(angle);
        poly(ctx, '#9d2049', [[-r, -2], [r * 0.65, -5], [r, 0], [-r * 0.7, 4]]);
        poly(ctx, '#ffe0d0', [[-r * 0.75, 0], [r * 0.65, -1], [r * 0.82, 0], [-r * 0.4, 1]]);
        ctx.restore();
      }
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, r = 12 + t * 24; rect(ctx, i % 2 ? '#f27b8c' : '#9f2345', Math.cos(a) * r, Math.sin(a) * r, 3, 2); }
    } else if (e.type === 'groundShock') {
      const r = 24 + t * 92;
      for (let i = 0; i < 2; i++) {
        ctx.strokeStyle = i ? '#fff2ce' : '#e0b16c'; ctx.lineWidth = i ? 2 : 4;
        ctx.beginPath(); ctx.ellipse(0, -3, r - i * 8, 7 + t * 12, 0, Math.PI, Math.PI * 2); ctx.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const x = (i - 3) * r / 3;
        poly(ctx, i % 2 ? '#e8c88d' : '#fff0c9', [[x - 5, -3], [x + (i - 3) * 4, -8 - Math.sin(t * Math.PI) * (22 - Math.abs(i - 3) * 4)], [x + 4, -3]]);
      }
    } else if (e.type === 'hitSpark') {
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3 + 0.2, r = 9 + t * 23;
        poly(ctx, i % 2 ? '#fff9e4' : '#ffd693', [[Math.cos(angle - 0.18) * r * 0.3, Math.sin(angle - 0.18) * r * 0.3], [Math.cos(angle) * r, Math.sin(angle) * r], [Math.cos(angle + 0.18) * r * 0.3, Math.sin(angle + 0.18) * r * 0.3]]);
      }
    } else if (e.type === 'risingClaw' || e.type === 'plungeTrail') {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const points = [];
        for (let j = 0; j <= 12; j++) {
          const u = j / 12, extension = 0.65 + Math.min(1, t * 3) * 0.35;
          if (e.type === 'risingClaw') points.push([8 + i * 13 + Math.sin(u * Math.PI * 0.8) * 34, 20 - u * 120 * extension]);
          else if (e.type === 'plungeTrail') points.push([(i - 1) * 13 + u * 7, -48 + u * 83]);
        }
        this.combatRibbon(ctx, points, 3.5, '#d68b48');
        this.combatRibbon(ctx, points, 1.8, '#fff3cd');
      }
    } else if (e.type === 'clawArc' || e.type === 'airClaw') {
      const reverse = e.move === 'claw2' || e.move === 'air2', heavy = e.move === 'claw3';
      const sweep = Math.min(1, t * 3.5), from = reverse ? 1.2 : -1.25, to = reverse ? -1.1 : 1.05;
      for (let i = 0; i < 3; i++) {
        const points = [], r = (heavy ? 91 : 73) + i * 8;
        for (let j = 0; j <= 14; j++) {
          const angle = from + (to - from) * (j / 14 * sweep);
          points.push([Math.cos(angle) * r, Math.sin(angle) * r * (heavy ? 0.49 : 0.63) + i * 5 - 10]);
        }
        this.combatRibbon(ctx, points, heavy ? 5 : 3.5, heavy ? '#dfa665' : '#e8cba0');
        this.combatRibbon(ctx, points, heavy ? 2.6 : 1.8, '#fff8e6');
      }
    }
    ctx.restore();
  }
  character(ctx, id, x, feet, pose = 0, facing = 1, time = 0, scale = 1) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(feet)); ctx.scale(facing * scale, scale);
    if (this.frames) {
      const row = id === 'inuyasha' ? 0 : 1;
      const f = this.frames[row][pose];
      const factor = 87 / this.frames[row][0].height;
      const bob = pose === 1 ? Math.sin(time * 17) * 2 : Math.sin(time * 2) * 0.5;
      ctx.drawImage(this.sprites, f.sx, f.sy, f.w, f.h, -f.cx * factor, -f.bottom * factor + bob, f.w * factor, f.h * factor);
    } else {
      const hair = id === 'inuyasha' ? '#e0e6e5' : '#152134', cloth = id === 'inuyasha' ? '#b93437' : '#e4e6d8';
      poly(ctx, hair, [[-13, -67], [0, -82], [13, -73], [13, -33], [-22, -22], [-15, -54]]);
      rect(ctx, '#e9ba8d', -5, -69, 17, 17); rect(ctx, '#17202b', 8, -63, 3, 3);
      poly(ctx, cloth, [[-11, -52], [9, -54], [20, -28], [-18, -28]]);
      rect(ctx, id === 'inuyasha' ? '#9f2932' : '#2f6552', -14, -30, 29, 18);
      rect(ctx, '#e1b591', -12, -14, 9, 13); rect(ctx, '#e1b591', 7, -14, 9, 13);
    }
    ctx.restore();
  }
  portrait(canvas, id) {
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
    this.character(ctx, id, canvas.width / 2 - 4, canvas.height + 40, 0, 1, 0, canvas.height < 80 ? 1.15 : 1.6);
  }
  backgroundLayer(ctx, game, t) {
    const palette = palettes[game.level.palette], camera = game.camera;
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT); gradient.addColorStop(0, palette[0]); gradient.addColorStop(0.8, palette[1]); gradient.addColorStop(1, palette[2]);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (this.background.complete && this.background.naturalWidth) {
      ctx.globalAlpha = game.level.palette === 'forest' ? 0.64 : 0.32;
      const sourceWidth = this.background.width * 0.56;
      const offset = -(camera * 0.04) % WIDTH;
      for (let i = 0; i < 2; i++) ctx.drawImage(this.background, 0, 0, sourceWidth, this.background.height * 0.8, offset + i * WIDTH, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;
      if (game.level.palette !== 'forest') { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = palette[1]; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.globalCompositeOperation = 'source-over'; }
    }
    for (let layer = 0; layer < 2; layer++) {
      const rate = layer ? 0.4 : 0.16, spacing = layer ? 290 : 170;
      ctx.globalAlpha = layer ? 0.32 : 0.2;
      for (let i = -1; i < 8; i++) {
        const worldIndex = Math.floor(camera * rate / spacing) + i;
        const x = worldIndex * spacing - camera * rate;
        const w = 18 + noise(worldIndex + layer * 20) * 36;
        poly(ctx, layer ? palette[0] : palette[2], [[x - 20, FLOOR], [x + w + 20, FLOOR], [x + w, -20], [x + 5, -20]]);
        poly(ctx, palette[0], [[x + 5, 160], [x - 80, 70], [x - 105, 55], [x - 20, 105], [x + w, 135]]);
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 4; i++) poly(ctx, '#fceabb', [[540 + i * 180, 0], [590 + i * 180, 0], [170 + i * 180, FLOOR], [30 + i * 180, FLOOR]]);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 28; i++) {
      const x = (noise(i + 50) * WIDTH + Math.sin(t * 0.24 + i) * 14 - camera * 0.1 % WIDTH + WIDTH) % WIDTH;
      const y = 80 + noise(i + 200) * 350 + Math.sin(t + i * 5) * 10;
      ctx.globalAlpha = 0.35 + Math.sin(t * 1.2 + i) * 0.25;
      rect(ctx, i % 3 ? '#dae7ac' : '#f2cf8e', x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
    if (game.level.palette === 'night' || game.level.palette === 'yura') {
      ctx.strokeStyle = '#c2a5bc60'; ctx.lineWidth = 1;
      for (let i = 0; i < 9; i++) { const x = (i * 163 - camera * 0.5) % 1200; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 200 + Math.sin(t + i) * 12, 420); ctx.stroke(); }
    }
  }
  platform(ctx, p, camera, palette) {
    if (this.scenery.drawPlatform(ctx, p, camera, palette)) return;
    const x = Math.floor(p.x - camera), y = p.y;
    if (x > WIDTH || x + p.w < 0) return;
    rect(ctx, palette[3], x, y, p.w, p.h);
    rect(ctx, palette[4], x, y, p.w, 7); rect(ctx, '#a4af6c', x, y, p.w, 2);
    rect(ctx, '#172d2d', x, y + 12, p.w, 4);
    const from = Math.max(0, Math.floor((camera - p.x) / 16)); const to = Math.min(Math.ceil(p.w / 16), from + 64);
    for (let i = from; i < to; i++) {
      const rx = x + i * 16;
      rect(ctx, i % 2 ? '#496146' : '#75844c', rx, y - 3 - noise(i + p.x) * 4, 5, 7);
      if (p.h > 30) {
        rect(ctx, '#334236', rx + 3, y + 27 + noise(i) * 35, 11, 5);
        rect(ctx, '#505341', rx + 9, y + 59 + noise(i + 3) * 19, 6, 4);
      }
    }
  }
  shrine(ctx, x, active, time) {
    rect(ctx, '#48574d', x - 20, FLOOR - 8, 42, 8); rect(ctx, '#849380', x - 14, FLOOR - 18, 30, 10);
    rect(ctx, '#827454', x - 5, FLOOR - 64, 11, 47); rect(ctx, '#edbb66', x - 8, FLOOR - 53, 17, 15);
    poly(ctx, '#364b43', [[x - 17, FLOOR - 62], [x, FLOOR - 77], [x + 19, FLOOR - 62]]);
    rect(ctx, active ? '#d7e6ba' : '#efc77c', x - 5, FLOOR - 49, 11, 6);
    ctx.globalAlpha = 0.1 + Math.sin(time * 2) * 0.03; ctx.fillStyle = active ? '#a0efd1' : '#ffcf79'; ctx.beginPath(); ctx.arc(x, FLOOR - 45, 40, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  enemy(ctx, e, time) {
    const x = e.x, y = e.y;
    if (Object.hasOwn(MONSTERS, e.type)) {
      ctx.save();
      if (e.flash > 0) ctx.filter = 'brightness(2)';
      if (e.state === 'dead') ctx.globalAlpha = clamp(e.deathClock / 0.5, 0, 1);
      if (e.state === 'spawn') ctx.globalAlpha = clamp(1 - e.stateClock / 0.65, 0, 1);
      const pose = monsterPose(e, time);
      this.monsterSprite(ctx, e.type, x + e.w / 2, y + e.h, pose, e.facing);
      ctx.restore();
      if (e.hp > 0 && e.hp < e.maxHp) { rect(ctx, '#141e24', x - 3, y - 16, e.w + 6, 4); rect(ctx, '#d7aa83', x - 3, y - 16, (e.w + 6) * Math.max(0, e.hp / e.maxHp), 3); }
      if (e.state === 'windup') {
        ctx.fillStyle = '#ffcf8d'; ctx.font = 'bold 19px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(e.kind === 'silk' ? '丝' : '!', x + e.w / 2, y - 24);
        ctx.save(); ctx.strokeStyle = e.kind === 'silk' ? '#e0ddd0a0' : '#efb28d85'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(x + e.w / 2, y + e.h / 2);
        if (e.type === 'crow' || e.type === 'hornet' || e.chargeSpeed) ctx.lineTo(x + e.w / 2 + e.aimX * e.duration, clamp(y + e.h / 2 + e.aimY * e.duration, 100, FLOOR));
        else if (e.kind === 'tongue') ctx.lineTo(x + e.w / 2 + e.attackFacing * e.reach, y + e.h / 2);
        else ctx.lineTo(e.targetX, e.type === 'harpy' && e.kind !== 'claw' ? FLOOR - 4 : e.targetY);
        ctx.stroke(); ctx.restore();
        if (e.type === 'harpy') rect(ctx, '#f0a27955', e.targetX - e.w / 2, FLOOR - 5, e.w, 5);
      }
      return;
    }
    ctx.save(); ctx.translate(Math.round(x + e.w / 2), Math.round(y + e.h)); ctx.scale(e.facing, 1);
    if (e.flash > 0) ctx.filter = 'brightness(2)';
    if (e.type === 'centipede') {
      for (let i = 0; i < 6; i++) {
        const cy = -16 - Math.sin(i * 0.5) * 36;
        rect(ctx, '#252927', -51 + i * 15, cy, 18, 25); rect(ctx, '#7f6650', -49 + i * 15, cy + 2, 13, 15);
        rect(ctx, '#d4b79a', -48 + i * 15, cy + 22, 4, 10 + Math.sin(time * 9 + i) * 4);
      }
      rect(ctx, '#d0ae91', 20, -82, 29, 29); poly(ctx, '#20202b', [[16, -73], [17, -90], [46, -95], [54, -61], [45, -63], [39, -83]]); rect(ctx, '#cd645e', 40, -70, 6, 4);
    } else if (e.type === 'sesshomaru' && e.phase === 2) {
      poly(ctx, '#b8c7d7', [[-80,-40],[-60,-90],[20,-110],[65,-80],[83,-35],[35,-10],[-55,-9]]);
      poly(ctx, '#f0f0e5', [[-65,-40],[-50,-83],[17,-103],[67,-72],[75,-34],[20,-20],[-48,-18]]);
      poly(ctx, '#d3deea', [[35,-83],[35,-133],[58,-103],[80,-123],[77,-75]]);
      rect(ctx, '#b84668', 57, -79, 17, 5); poly(ctx, '#4d3854', [[66,-53],[93,-48],[76,-32],[52,-35]]);
      poly(ctx, '#f9f4df', [[75,-45],[70,-29],[64,-44]]);
      for (const dx of [-47, -15, 30, 57]) rect(ctx, '#dce4e4', dx, -24, 13, 26);
      ctx.strokeStyle = '#9be0ab'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(38,-72); ctx.lineTo(72,-65); ctx.stroke();
    } else if (e.type === 'sesshomaru') {
      poly(ctx, '#dfe6e7', [[-18,-69],[-17,-96],[4,-108],[22,-93],[15,-18],[-29,-5],[-20,-64]]);
      rect(ctx, '#efd4b4', -6, -87, 24, 23); rect(ctx, '#ad4864', 8, -76, 9, 2); rect(ctx, '#edcc79', 8, -81, 5, 2);
      poly(ctx, '#272c3e', [[-14,-65],[11,-67],[25,-46],[18,-30],[-17,-30]]);
      poly(ctx, '#f0e9d5', [[-16,-58],[12,-58],[26,-25],[-22,-25]]);
      rect(ctx, '#bb354b', -20, -27, 42, 6); rect(ctx, '#e3dac3', -15, -21, 13, 19); rect(ctx, '#e3dac3', 6, -21, 13, 19);
      poly(ctx, '#edf0e6', [[-15,-72],[-31,-80],[-39,-63],[-33,-40],[-44,-22],[-29,-12],[-20,-29],[-22,-51]]);
      rect(ctx, '#7f8da4', -15, -64, 30, 9); rect(ctx, '#c0c7ce', -11, -63, 4, 5); rect(ctx, '#c0c7ce', 1, -63, 4, 5);
      rect(ctx, '#30435f', 0, -89, 5, 4);
    } else if (e.type === 'yura') {
      poly(ctx, '#171928', [[-17, -61], [-19, -83], [3, -95], [19, -83], [18, -59]]); rect(ctx, '#e9bda0', -6, -79, 22, 20); rect(ctx, '#e0b99c', -21, -59, 41, 7);
      poly(ctx, '#b3445d', [[-7, -60], [11, -60], [20, -26], [-19, -26]]); rect(ctx, '#e6bb9e', -12, -27, 10, 25); rect(ctx, '#e6bb9e', 9, -27, 10, 25); rect(ctx, '#34303b', -14, -8, 14, 8); rect(ctx, '#34303b', 8, -8, 15, 8); rect(ctx, '#eee0bd', -18, -78, 12, 3);
      ctx.strokeStyle = '#d2adc8'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(19, -54); ctx.quadraticCurveTo(55, -80 - i * 9, 100 + i * 20, -30 + i * 13); ctx.stroke(); }
    }
    ctx.restore();
    if (e.hp < e.maxHp && e.type !== 'yura') { rect(ctx, '#141e24', e.x - 3, y - 13, e.w + 6, 4); rect(ctx, '#d7aa83', e.x - 3, y - 13, (e.w + 6) * Math.max(0, e.hp / e.maxHp), 3); }
    if (e.windup > 0) {
      ctx.fillStyle = '#ffca86'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', e.x + e.w / 2, y - 19);
      ctx.fillStyle = '#e78f7760'; ctx.fillRect(e.x - 35, FLOOR - 5, e.w + 70, 5);
      if (e.type === 'yura' && e.pattern % 3 === 2) for (let i = -1; i <= 1; i++) rect(ctx, '#fa8b9866', e.targetX + i * 95 - 12, 160, 25, FLOOR - 160);
      if (e.type === 'sesshomaru' && e.pattern % 2 === 0) rect(ctx, '#9fe0ae55', e.targetX - (e.phase === 2 ? 85 : 55), FLOOR - 100, e.phase === 2 ? 170 : 110, 100);
    }
  }
  render(game, elapsed) {
    const ctx = this.ctx; ctx.save(); ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.backgroundLayer(ctx, game, elapsed);
    if (game.level.palette === 'grave') {
      ctx.save(); ctx.translate(-game.camera * 0.3, 0);
      for (let i = 0; i < 8; i++) { const x = i * 270 - 100; poly(ctx, '#ced4d126', [[x,454],[x+28,180],[x+90,100],[x+136,155],[x+76,190],[x+64,454]]); }
      ctx.fillStyle = '#d7dfd82e'; ctx.beginPath(); ctx.ellipse(880,245,210,170,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#172036'; ctx.beginPath(); ctx.ellipse(795,240,46,61,-0.2,0,Math.PI*2); ctx.ellipse(965,240,46,61,0.2,0,Math.PI*2); ctx.fill();
      poly(ctx, '#172036', [[875,270],[846,325],[906,325]]); ctx.restore();
    }
    ctx.translate(game.shake ? (Math.random() - 0.5) * game.shake : 0, game.shake ? (Math.random() - 0.5) * game.shake : 0);
    const palette = palettes[game.level.palette];
    this.scenery.drawObjects(ctx, game);
    if (game.platforms) for (const p of game.platforms) this.platform(ctx, p, game.camera, palette);
    ctx.save(); ctx.translate(-Math.round(game.camera), 0);
    for (const item of game.availableInteractions?.() || []) {
      const x = item.x;
      if (item.shard) { poly(ctx, '#f4c4ed', [[x,FLOOR-56],[x+8,FLOOR-40],[x,FLOOR-27],[x-8,FLOOR-40]]); }
      else if (item.id === 'fang-taken') {
        poly(ctx, '#798596', [[x-52,FLOOR],[x-39,FLOOR-35],[x+24,FLOOR-40],[x+49,FLOOR]]);
        rect(ctx, '#8e7663', x-2,FLOOR-88,5,55); rect(ctx, '#d2b67a', x-12,FLOOR-67,25,5);
      } else { this.character(ctx,'kagome',x,FLOOR,0,-1,elapsed,1); }
      if (game.state === 'playing') {
        ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f5dfbe';
        ctx.fillText(Math.abs(game.hero.x+15-x)<82 ? `E · ${item.label}` : item.label, x, FLOOR-126);
      }
    }
    for (const x of game.level.checkpoints) this.shrine(ctx, x, game.shrines?.has(x), elapsed);
    if (game.level.id === 0 && !game.lab) {
      if (!game.save.unlocked.includes('inuyasha')) {
        const sacredTree = game.sceneObjects?.find(object => object.type === 'sacred');
        const sealOffset = sacredTree ? this.scenery.objectFeet(sacredTree) - FLOOR : 0;
        this.character(ctx, 'inuyasha', 650, 350 + sealOffset, 0, 1, elapsed, 0.85);
        rect(ctx, '#c5b08a', 626, 292 + sealOffset, 60, 2);
        poly(ctx, '#e6dfc7', [[626, 293 + sealOffset], [616, 288 + sealOffset], [620, 293 + sealOffset], [616, 298 + sealOffset]]);
      }
    }
    for (const x of game.level.traps || []) {
      ctx.globalAlpha = Math.sin(game.time * 2 + x) > 0.2 ? 0.8 : 0.2;
      rect(ctx, '#e6a1b9', x, 340, 2, 114); rect(ctx, '#d8b9c5', x - 10, 340, 22, 2); ctx.globalAlpha = 1;
    }
    game.level.relics.forEach(([x, y], i) => {
      if (game.save.relics.includes(`${game.level.id}:${i}`)) return;
      const offset = Math.sin(elapsed * 2 + i) * 4;
      ctx.globalAlpha = 0.12; rect(ctx, '#ffe4a6', x - 15, y - 15 + offset, 30, 30); ctx.globalAlpha = 1;
      poly(ctx, '#dfbf82', [[x, y - 10 + offset], [x + 6, y + offset], [x, y + 10 + offset], [x - 6, y + offset]]); rect(ctx, '#fff1c5', x - 1, y - 5 + offset, 2, 8);
    });
    for (const a of game.anchors || []) if (a.hp > 0) {
      ctx.strokeStyle = '#c5a4bc90'; ctx.beginPath(); ctx.moveTo(a.x + 15, a.y); ctx.lineTo(a.x - 80, 0); ctx.moveTo(a.x + 15, a.y); ctx.lineTo(a.x + 100, 0); ctx.stroke();
      rect(ctx, a.flash ? '#fff1da' : '#8a4058', a.x, a.y, 28, 30); rect(ctx, '#ddd3bd', a.x + 5, a.y + 5, 19, 17); rect(ctx, '#592d42', a.x + 8, a.y + 10, 5, 5); rect(ctx, '#592d42', a.x + 18, a.y + 10, 4, 5);
    }
    for (const e of game.enemies) if (e.x > game.camera - 150 && e.x < game.camera + WIDTH + 150) this.enemy(ctx, e, elapsed);
    if (game.debugHitboxes) {
      ctx.strokeStyle = '#88dedaaa'; ctx.lineWidth = 1;
      for (const p of game.platforms || []) if (p.x + p.w >= game.camera && p.x <= game.camera + WIDTH) {
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#b4fff0'; ctx.fillRect(p.x, p.y, p.w, 1);
      }
      for (const e of game.enemies) if (e.hp > 0) {
        ctx.strokeRect(e.x, e.y, e.w, e.h);
        if (e.attackBox) { ctx.fillStyle = '#ff8e8355'; ctx.fillRect(e.attackBox.x, e.attackBox.y, e.attackBox.w, e.attackBox.h); }
      }
      ctx.strokeRect(game.hero.x, game.hero.y, game.hero.w, game.hero.h);
      const playerBox = inuyashaHitbox(game);
      if (playerBox) { ctx.fillStyle = '#ffe0a333'; ctx.fillRect(playerBox.x, playerBox.y, playerBox.w, playerBox.h); ctx.strokeStyle = '#ffe0a3'; ctx.strokeRect(playerBox.x, playerBox.y, playerBox.w, playerBox.h); }
      const slash = game.action?.id === 'scatter' && game.action.elapsed <= INUYASHA_MOVES.scatter.activeEnd ? game.action.scatterSlash : null;
      if (slash) {
        ctx.save(); ctx.translate(slash.x, slash.y); ctx.scale(slash.facing, 1);
        for (const claw of slash.claws) {
          const blade = sankonBladeContours(claw, slash.maxLife - slash.life);
          if (!blade) continue;
          poly(ctx, '#ffe0a355', blade.polygon); ctx.strokeStyle = '#ffe0a3'; ctx.lineWidth = 1;
          ctx.beginPath(); blade.polygon.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke();
        }
        ctx.restore();
      }
    }
    const h = game.hero;
    for (const e of game.effects) if (e.type === 'afterimage') this.combatCharacter(ctx, e.x, e.y, { id: e.move, elapsed: 0.2, facing: e.facing }, 0.24 * e.life / e.maxLife);
    ctx.globalAlpha = game.invulnerable > 0 && Math.floor(elapsed * 16) % 2 ? 0.45 : 1;
    const running = Math.abs(h.vx) > 20 && h.grounded;
    const pose = game.attackClock > 0 ? 3 : !h.grounded ? 2 : running && Math.floor(elapsed * 9) % 3 !== 0 ? 1 : 0;
    if (!(game.active === 'inuyasha' && game.action && this.combatCharacter(ctx, h.x + 15, h.y + h.h + 1, game.action))) this.character(ctx, game.active, h.x + 15, h.y + h.h + 1, pose, h.facing, elapsed);
    if (game.active === 'inuyasha' && !game.action && usesAwakenedFang(game.save)) { ctx.save(); ctx.translate(h.x+15,h.y+h.h); ctx.scale(h.facing,1); this.fang(ctx,8,-38,0.9); ctx.restore(); }
    ctx.globalAlpha = 1;
    if (game.action?.id === 'scatter' && game.action.elapsed < INUYASHA_MOVES.scatter.windup) {
      const p = game.action.elapsed / INUYASHA_MOVES.scatter.windup;
      ctx.save(); ctx.translate(h.x + 15, h.y + h.h - 66); ctx.scale(h.facing, 1); ctx.globalAlpha = p;
      for (let i = 0; i < 3; i++) {
        const reach = 18 * (1 - p), y = (i - 1) * 6;
        this.combatRibbon(ctx, [[-19 - reach, y - reach * 0.3], [-9 - reach * 0.4, y - 2], [1, y]], 1.5, '#f3ca7d');
      }
      rect(ctx, '#fff8de', -2, -3, 3, 5); ctx.restore();
    }
    const status = game.statuses?.[game.active];
    if (status?.poison.length || status?.slow > 0) {
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = status.poison.length ? '#d7b0e8' : '#ddd9c6';
      ctx.fillText(`${status.poison.length ? `中毒×${status.poison.length} ` : ''}${status.slow > 0 ? '减速' : ''}`, h.x + 15, h.y - 14);
    }
    if (game.itemUse) {
      const progress = 1 - game.itemUse.remaining / game.itemUse.duration;
      ctx.strokeStyle = '#b6e3ba'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(h.x + 15, h.y - 20, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
    }
    const barrier = game.barriers?.[game.active];
    if (barrier?.hp > 0 && barrier.life > 0) { ctx.strokeStyle = '#b8e7df'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(h.x+15,h.y+34,38,50,0,0,Math.PI*2); ctx.stroke(); }
    if (game.dodgeClock > 0) { ctx.globalAlpha = 0.17; this.character(ctx, game.active, h.x + 15 - h.facing * 28, h.y + h.h, pose, h.facing, elapsed); ctx.globalAlpha = 1; }
    for (const p of game.projectiles) {
      if (p.kind === 'bloodBlade') this.bloodBlade(ctx, p);
      else if (p.owner === 'hero') {
        rect(ctx, p.color, p.x - Math.sign(p.vx) * 15, p.y + p.h / 2 - 1, 30, p.pierce ? 5 : 2);
        poly(ctx, '#fff0d2', [[p.x + Math.sign(p.vx) * 15, p.y + p.h / 2], [p.x + Math.sign(p.vx) * 7, p.y - 2], [p.x + Math.sign(p.vx) * 7, p.y + p.h + 2]]);
      } else { rect(ctx, '#f5ddcd', p.x + 2, p.y + 2, p.w - 4, p.h - 4); rect(ctx, p.color, p.x, p.y, p.w, p.h / 2); }
    }
    for (const e of game.effects) {
      if (e.type === 'afterimage') continue;
      if (e.type === 'clawImpact' && e.target) { this.monsterClawMarks(ctx, e, elapsed); continue; }
      if (e.maxLife) { this.combatEffect(ctx, e); continue; }
      ctx.globalAlpha = clamp(e.life * 4, 0, 1);
      if (e.type === 'number') { ctx.font = 'bold 17px Georgia'; ctx.fillStyle = '#171f28'; ctx.fillText(e.text, e.x + 1, e.y + 1); ctx.fillStyle = e.color; ctx.fillText(e.text, e.x, e.y); }
      else if (e.type === 'shield') { ctx.strokeStyle = e.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 35 + (0.7 - e.life) * 50, 0, Math.PI * 2); ctx.stroke(); }
      else {
        ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing || 1, 1);
        const size = e.big ? 105 : 68;
        for (let i = 0; i < 3; i++) poly(ctx, e.color, [[-15, -22 + i * 16], [size, -38 + i * 14], [size - 18, -29 + i * 16], [-5, -12 + i * 16]]);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    for (const p of game.particles) { ctx.globalAlpha = Math.min(1, p.life * 3); rect(ctx, p.color, p.x, p.y, p.size, p.size); } ctx.globalAlpha = 1;
    if (game.encounter) {
      const x = game.level.encounters[game.encounter.index].x;
      for (const gateX of [x - 240, x + 675]) { ctx.globalAlpha = 0.18 + Math.sin(elapsed * 5) * 0.05; rect(ctx, '#d8d2b5', gateX, FLOOR - 100, 4, 100); ctx.globalAlpha = 1; }
    }
    ctx.restore();
    this.scenery.doorHint(ctx, game);
    ctx.restore();
  }
}
