import { FLOOR, HEROES, statsFor, overlaps, clamp } from './data.js';
import { isOrdinary, launchMonster } from './monsters.js';

// Seconds are shared by gameplay, sprite poses, and effects: contact begins at
// `windup`, never on the input frame. Each move can hit a given target once.
export const INUYASHA_MOVES = {
  claw1: { name: '一式 · 横爪', duration: 0.30, windup: 0.07, activeEnd: 0.17, cancelAt: 0.20, frames: [0, 1], damage: 1, reach: 91, knock: 5, effect: 'clawArc', sound: 'slash' },
  claw2: { name: '二式 · 返爪', duration: 0.31, windup: 0.07, activeEnd: 0.18, cancelAt: 0.20, frames: [2, 3], damage: 1, reach: 96, knock: 5, effect: 'clawArc', sound: 'clawReturn' },
  claw3: { name: '三式 · 横扫', duration: 0.41, windup: 0.11, activeEnd: 0.25, cancelAt: 0.29, frames: [4, 5], damage: 1.4, reach: 110, knock: 18, effect: 'clawArc', sound: 'clawHeavy' },
  upper: { name: '上挑', duration: 0.42, windup: 0.09, activeEnd: 0.23, cancelAt: 0.22, jumpCancel: 0.13, frames: [6, 7], damage: 0.9, reach: 90, knock: 3, effect: 'risingClaw', sound: 'upper' },
  air1: { name: '空中追爪', duration: 0.30, windup: 0.06, activeEnd: 0.18, cancelAt: 0.20, frames: [8, 9], damage: 1, reach: 96, knock: 4, effect: 'airClaw', sound: 'slash' },
  air2: { name: '空中返爪', duration: 0.33, windup: 0.07, activeEnd: 0.20, cancelAt: 0.22, frames: [8, 9], damage: 1.15, reach: 103, knock: 7, effect: 'airClaw', sound: 'clawReturn' },
  plunge: { name: '坠地爪击', duration: 1.35, windup: 0.12, activeEnd: 1.35, cancelAt: 1.35, frames: [10, 11], damage: 1.6, reach: 76, knock: 15, effect: 'plungeTrail', sound: 'plunge' },
  landing: { name: '落地冲击', duration: 0.28, windup: 0, activeEnd: 0.10, cancelAt: 0.24, frames: [6, 4], damage: 1.6, reach: 110, knock: 24, effect: 'groundShock', sound: 'slam' },
  scatter: { name: '散魂铁爪', duration: 0.56, windup: 0.14, activeEnd: 0.33, cancelAt: 0.39, frames: [12, 13], damage: 2.7, reach: 175, knock: 30, effect: 'clawBurst', sound: 'sankon' },
  blood: { name: '飞刃血爪', duration: 0.64, windup: 0.20, activeEnd: 0.44, cancelAt: 0.46, frames: [0, 1, 2, 3], damage: 2.3, reach: 0, knock: 18, effect: 'bloodRelease', sound: 'bloodCast' }
};

export function cancelInuyasha(game) {
  game.action = null; game.combatBuffer = null; game.attackClock = 0; game.attackCooldown = 0;
}

export function bufferInuyashaInput(game, input) {
  const previous = game.combatPrevious || {}, press = key => input[key] && !previous[key];
  game.combatPrevious = { ...input };
  if (game.active !== 'inuyasha') return;
  let command = null;
  if (press('skill1')) command = { skill: 0 };
  else if (press('skill2')) command = { skill: 1 };
  else if (input.attack && input.down && (press('attack') || press('down'))) command = { skill: -1, move: game.hero.grounded ? 'upper' : 'plunge' };
  else if (press('attack')) command = { skill: -1 };
  if (command) game.combatBuffer = { ...command, life: 0.20 };
}

export function startInuyasha(game, skill = -1, requested) {
  if (game.state !== 'playing' || game.dodgeClock > 0 || game.hurtClock > 0) return false;
  if (skill >= 0 && game.cooldowns.inuyasha[skill] > 0) return false;
  const h = game.hero, current = game.action;
  const special = requested === 'upper' || requested === 'plunge';
  if (current) {
    const def = INUYASHA_MOVES[current.id];
    if (current.elapsed < def.cancelAt || (skill < 0 && !special)) return false;
  } else if (game.attackCooldown > 0) return false;
  let id;
  if (skill >= 0) id = skill === 0 ? 'scatter' : 'blood';
  else if (special) {
    if ((requested === 'upper') !== h.grounded) return false;
    id = requested;
  } else if (h.grounded) {
    game.combo = game.comboTime > 0 ? (game.combo + 1) % 3 : 0;
    id = ['claw1', 'claw2', 'claw3'][game.combo];
  } else {
    id = game.airAttacks % 2 === 0 ? 'air1' : 'air2';
  }
  const def = INUYASHA_MOVES[id], stats = statsFor('inuyasha', game.save.heroes.inuyasha);
  game.action = { id, elapsed: 0, facing: h.facing, hits: new Set(), effectStarted: false, trailClock: 0, weapon: skill < 0 && game.save.heroes.inuyasha.unlocks.includes('tessaiga-awaken'), damageType: skill >= 0 ? 'demon' : 'physical', damage: (skill >= 0 ? stats.power : stats.damage) * def.damage };
  game.combatBuffer = null; game.attackClock = def.duration; game.attackCooldown = def.duration;
  game.comboTime = 1.05;
  if (skill >= 0) game.cooldowns.inuyasha[skill] = HEROES.inuyasha.cooldown[skill];
  if (id === 'air1' || id === 'air2') {
    // Only two strikes per jump grant lift; holding J cannot hover forever.
    if (game.airAttacks < 2) h.vy = Math.max(-220, Math.min(h.vy, -80));
    game.airAttacks++;
  }
  return true;
}

export function advanceInuyasha(game, dt) {
  const a = game.action;
  if (!a) return;
  a.elapsed += dt;
  const def = INUYASHA_MOVES[a.id];
  game.attackClock = Math.max(0, def.duration - a.elapsed);
  game.attackCooldown = game.attackClock;
  if (a.elapsed >= def.duration) { game.action = null; game.attackClock = 0; game.attackCooldown = 0; }
}

export function inuyashaMotion(game, dt, direction) {
  const a = game.action, h = game.hero;
  if (!a) return;
  const def = INUYASHA_MOVES[a.id];
  h.facing = a.facing;
  if ((a.id === 'blood' || a.id === 'scatter') && a.elapsed <= def.activeEnd) h.vx = 0;
  else if (a.id === 'plunge') {
    h.vx = a.facing * 45;
    h.vy = a.elapsed < def.windup ? Math.min(h.vy, -35) : 860;
  } else if (a.id === 'landing') h.vx = 0;
  else if (a.id.startsWith('claw') && a.elapsed >= def.windup && a.elapsed < def.activeEnd) h.vx += a.facing * 65;
  if ((a.id === 'air1' || a.id === 'air2') && game.airAttacks <= 2 && a.elapsed < def.cancelAt) h.vy -= 1150 * dt;
  if (!h.grounded && a.id !== 'plunge') h.vx = direction * 150;
}

export function inuyashaHitbox(game) {
  const a = game.action;
  if (!a) return null;
  const def = INUYASHA_MOVES[a.id], h = game.hero;
  const reach = def.reach + (a.weapon ? 28 : 0);
  if (a.id === 'blood' || a.id === 'scatter') return null;
  if (a.elapsed < def.windup || a.elapsed > def.activeEnd) return null;
  if (a.id === 'landing') return { x: h.x + h.w / 2 - reach, y: h.y + h.h - 75, w: reach * 2, h: 80 };
  if (a.id === 'plunge') return { x: h.x - 22, y: h.y + 14, w: h.w + 64, h: h.h + 16 };
  return { x: a.facing > 0 ? h.x - 8 : h.x + h.w - reach, y: h.y - (a.id === 'upper' ? 80 : 28), w: reach + 8, h: h.h + (a.id === 'upper' ? 100 : 48) };
}

// The same tapered crescent surface is used by rendering and collision.
// Its outer curve is the bright cutting edge; the concave side stays hollow.
export function sankonBladeContours(claw, age) {
  const localAge = age - claw.delay;
  if (localAge <= 0 || localAge >= 0.195) return null;
  const head = clamp(localAge / 0.055, 0, 1), tail = clamp((localAge - 0.075) / 0.12, 0, 1);
  if (tail >= head) return null;
  const outer = [], inner = [];
  for (let j = 0; j <= 32; j++) {
    const u = tail + (head - tail) * j / 32, v = 1 - u;
    const x = v * v * claw.startX + 2 * v * u * claw.controlX + u * u * claw.endX;
    const y = v * v * claw.startY + 2 * v * u * claw.controlY + u * u * claw.endY;
    const dx = 2 * (v * (claw.controlX - claw.startX) + u * (claw.endX - claw.controlX));
    const dy = 2 * (v * (claw.controlY - claw.startY) + u * (claw.endY - claw.controlY));
    // Anime-style claw light has a smooth, thin surface. The rapid sweep
    // and retreating tail carry the tearing motion, rather than saw teeth.
    const thickness = Math.sin(j / 32 * Math.PI) ** 0.7 * claw.width, length = Math.hypot(dx, dy) || 1;
    outer.push([x, y]); inner.push([x - dy / length * thickness, y + dx / length * thickness]);
  }
  return { outer, inner, polygon: [...outer, ...inner.toReversed()], localAge, opacity: clamp((0.195 - localAge) / 0.065, 0, 1) };
}

function sankonPolygonHits(polygon, box) {
  const inside = ([x, y]) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
  if (polygon.some(inside)) return true;
  // A small target can lie entirely within the blade's narrow surface.
  for (const [x, y] of [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]]) {
    let contained = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [ax, ay] = polygon[i], [bx, by] = polygon[j];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) contained = !contained;
    }
    if (contained) return true;
  }
  // Clip each edge against the target rectangle, including targets thinner
  // than the distance between successive samples of the curved blade.
  for (let i = 0; i < polygon.length; i++) {
    const from = polygon[i], to = polygon[(i + 1) % polygon.length];
    let enter = 0, leave = 1;
    for (const [start, delta, low, high] of [[from[0], to[0] - from[0], box.x, box.x + box.w], [from[1], to[1] - from[1], box.y, box.y + box.h]]) {
      if (Math.abs(delta) < 0.0001) { if (start < low || start > high) { leave = -1; break; } continue; }
      let a = (low - start) / delta, b = (high - start) / delta;
      if (a > b) [a, b] = [b, a];
      enter = Math.max(enter, a); leave = Math.min(leave, b);
      if (enter > leave) break;
    }
    if (enter <= leave) return true;
  }
  return false;
}

function moveEffect(game, a, def) {
  const h = game.hero;
  if (a.id === 'scatter') {
    const x = h.x + h.w / 2, y = h.y + h.h;
    // Shape and timing vary once per cast, then remain stable as the claw
    // sweeps down. The slash stays attached to this strike's world position.
    const claws = [0, 2, 4].map(i => ({
      startX: 12 + i * 4 + (Math.random() - 0.5) * 6,
      startY: -92 + i * 7 + (Math.random() - 0.5) * 8,
      controlX: 186 + i * 4 + (Math.random() - 0.5) * 12,
      controlY: -112 + i * 6 + (Math.random() - 0.5) * 12,
      endX: 100 + i * 14 + (Math.random() - 0.5) * 8,
      endY: -2 - Math.random() * 3,
      width: 4.0 + Math.random() * 1.8,
      delay: [0, 0.007, 0.020, 0.030, 0.044][i] + Math.random() * 0.003
    }));
    a.scatterSlash = { type: 'clawBurst', x, y, facing: a.facing, claws, life: 0.30, maxLife: 0.30 };
    game.effects.push(a.scatterSlash);
    const impactX = x + a.facing * claws[1].endX;
    // A downward sweep only kicks up earth where its tip meets a real
    // supporting surface, including raised platforms, never over a gap.
    if (h.grounded && game.platforms.some(p => impactX >= p.x && impactX <= p.x + p.w && Math.abs(p.y - y) < 2)) {
      a.scatterGround = { x: impactX, y, facing: a.facing, seed: Math.random() * 1000 };
    }
    game.emit('sound', def.sound); return;
  }
  if (a.id === 'blood') {
    // Uneven pauses and non-monotonic heights break up the old aligned fan.
    // Each shot adds independent vertical jitter, fixed for its whole flight.
    // Every blade keeps the same horizontal heading and flight speed.
    const heights = [0, -25, 10, -10, -35], gaps = [0, 0.032, 0.061, 0.024, 0.050];
    let at = 0;
    a.bloodShots = heights.map((y, i) => {
      if (i) at += gaps[i] + Math.random() * (i === 2 ? 0.018 : 0.012);
      return { at, x: (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 24 };
    });
    a.nextBloodShot = 0;
    game.emit('sound', def.sound); return;
  }
  const life = a.id === 'upper' ? 0.28 : 0.23;
  game.effects.push({ type: a.weapon ? 'swordArc' : def.effect, move: a.id, x: h.x + h.w / 2, y: a.id === 'upper' ? h.y + h.h - 22 : h.y + 29, facing: a.facing, life, maxLife: life });
  game.emit('sound', def.sound);
}

export function resolveInuyasha(game, dt) {
  let a = game.action;
  if (!a) return;
  let def = INUYASHA_MOVES[a.id];
  const h = game.hero;
  if (a.id === 'plunge' && h.grounded && a.elapsed >= def.windup) {
    a = game.action = { ...a, id: 'landing', elapsed: 0, effectStarted: true };
    def = INUYASHA_MOVES.landing;
    game.attackClock = def.duration; game.attackCooldown = def.duration;
    game.effects.push({ type: 'groundShock', x: h.x + h.w / 2, y: h.y + h.h, facing: a.facing, life: 0.42, maxLife: 0.42 });
    game.burst(h.x + 15, h.y + h.h - 4, '#d2bb94', 22);
    game.shake = Math.max(game.shake, 5); game.emit('sound', 'slam');
  }
  if (a.elapsed >= def.windup && !a.effectStarted) {
    a.effectStarted = true;
    if (a.id !== 'plunge') moveEffect(game, a, def);
    else game.emit('sound', def.sound);
  }
  if (a.id === 'scatter' && a.scatterGround && !a.scatterSlammed && a.elapsed >= def.windup + 0.075) {
    a.scatterSlammed = true;
    game.effects.push({ type: 'clawSlam', ...a.scatterGround, life: 0.42, maxLife: 0.42 });
    game.shake = Math.max(game.shake, 4); game.emit('sound', 'sankonSlam');
  }
  if (a.id === 'blood' && a.bloodShots) {
    while (a.nextBloodShot < a.bloodShots.length && a.elapsed - def.windup >= a.bloodShots[a.nextBloodShot].at) {
      const shot = a.bloodShots[a.nextBloodShot++], x = h.x + 15 + a.facing * (34 + shot.x), y = h.y + 24 + shot.y;
      // A shared hit record preserves one full skill hit per target across
      // the whole staggered volley, including after a character switch.
      game.projectiles.push({ owner: 'hero', kind: 'bloodBlade', x: x - 16, y: y - 18, w: 32, h: 36, vx: a.facing * 720, vy: 0, curvature: 0.65 + Math.random() * 0.85, damage: a.damage, damageType: 'demon', knock: def.knock, life: 600 / 720, age: 0, pierce: true, hits: a.hits, trailClock: 0 });
      game.effects.push({ type: 'bloodRelease', x: x - a.facing * 8, y, facing: a.facing, life: 0.10, maxLife: 0.10 });
    }
  }
  a.trailClock -= dt;
  if (a.id === 'plunge' && a.elapsed >= def.windup && a.elapsed <= def.activeEnd && a.trailClock <= 0) {
    a.trailClock = 0.045;
    game.effects.push({ type: 'afterimage', move: a.id, x: h.x + 15, y: h.y + h.h, facing: a.facing, life: 0.18, maxLife: 0.18 });
    if (a.id === 'plunge') game.effects.push({ type: 'plungeTrail', x: h.x + 15, y: h.y + 25, facing: a.facing, life: 0.15, maxLife: 0.15 });
  }
  const box = inuyashaHitbox(game), slash = a.id === 'scatter' && a.elapsed <= def.activeEnd ? a.scatterSlash : null;
  if (!box && !slash) return;
  // Effects advance by dt at the end of this update. Check precisely the
  // blade surface that will be drawn this frame, excluding glow and hollow.
  const blades = slash ? slash.claws.map(claw => sankonBladeContours(claw, slash.maxLife - slash.life + dt)).filter(Boolean) : null;
  const touches = target => {
    if (!slash) return overlaps(box, target);
    const left = (target.x - slash.x) * slash.facing, right = (target.x + target.w - slash.x) * slash.facing;
    const local = { x: Math.min(left, right), y: target.y - slash.y, w: target.w, h: target.h };
    return blades.some(blade => sankonPolygonHits(blade.polygon, local));
  };
  for (const e of game.enemies) if (e.hp > 0 && !a.hits.has(e) && touches(e)) {
    a.hits.add(e);
    game.hitEnemy(e, a.damage, a.facing, def.knock, a.damageType);
    if (e.hp > 0 && isOrdinary(e)) {
      if (a.id === 'upper') launchMonster(e, -490, a.facing * 24);
      else if (e.juggle && (a.id === 'air1' || a.id === 'air2')) launchMonster(e, -145, a.facing * 18);
      else if (e.juggle && (a.id === 'plunge' || a.id === 'landing')) launchMonster(e, 700, a.facing * 70);
    }
    game.effects.push(a.id === 'scatter'
      ? { type: 'clawImpact', target: e, x: e.x + e.w / 2, y: e.y + e.h / 2, facing: a.facing, life: 0.46, maxLife: 0.46 }
      : { type: 'hitSpark', x: e.x + e.w / 2, y: e.y + e.h / 2, life: 0.16, maxLife: 0.16 });
    if (a.id === 'scatter') { e.flash = 0.055; game.emit('sound', 'clawTear'); }
    if (['claw3', 'scatter', 'landing'].includes(a.id)) { game.hitStop = 0.055; game.shake = Math.max(game.shake, a.id === 'claw3' ? 3 : 5); }
  }
  for (const p of game.projectiles) if (p.kind === 'silk' && p.life > 0 && touches(p)) p.life = 0;
  for (const anchor of game.anchors) if (anchor.hp > 0 && !a.hits.has(anchor) && touches(anchor)) { a.hits.add(anchor); game.damageAnchor(anchor, a.damage); }
}

// Segment versus expanded rectangle: fast blades also hit thin hair anchors
// and silk between simulation frames, rather than tunnelling through them.
function bloodSegmentHit(p, fromX, fromY, target) {
  let enter = 0, leave = 1;
  for (const [start, delta, low, high] of [[fromX, p.x - fromX, target.x - p.w, target.x + target.w], [fromY, p.y - fromY, target.y - p.h, target.y + target.h]]) {
    if (Math.abs(delta) < 0.0001) { if (start < low || start > high) return false; continue; }
    let a = (low - start) / delta, b = (high - start) / delta;
    if (a > b) [a, b] = [b, a];
    enter = Math.max(enter, a); leave = Math.min(leave, b);
    if (enter > leave) return false;
  }
  return true;
}

export function updateBloodBlade(game, p, dt) {
  const fromX = p.x, fromY = p.y;
  let travel = Math.min(dt, p.life);
  if (p.vy > 0) travel = Math.min(travel, Math.max(0, (FLOOR - p.y - p.h) / p.vy));
  p.x += p.vx * travel; p.y += p.vy * travel; p.life -= dt; p.age += travel;
  p.trailClock -= dt;
  if (p.trailClock <= 0) {
    p.trailClock = 0.035;
    game.effects.push({ type: 'bloodTrail', x: fromX + p.w / 2, y: fromY + p.h / 2, angle: Math.atan2(p.vy, p.vx), life: 0.14, maxLife: 0.14 });
  }
  for (const silk of game.projectiles) if (silk.kind === 'silk' && silk.life > 0 && bloodSegmentHit(p, fromX, fromY, silk)) silk.life = 0;
  for (const e of game.enemies) if (e.hp > 0 && !p.hits.has(e) && bloodSegmentHit(p, fromX, fromY, e)) {
    p.hits.add(e); game.hitEnemy(e, p.damage, Math.sign(p.vx), p.knock, p.damageType || 'demon');
    game.effects.push({ type: 'bloodImpact', x: e.x + e.w / 2, y: e.y + e.h / 2, facing: Math.sign(p.vx), life: 0.23, maxLife: 0.23 });
    game.emit('sound', 'bloodHit');
  }
  for (const anchor of game.anchors) if (anchor.hp > 0 && !p.hits.has(anchor) && bloodSegmentHit(p, fromX, fromY, anchor)) {
    p.hits.add(anchor); game.damageAnchor(anchor, p.damage);
    game.effects.push({ type: 'bloodImpact', x: anchor.x + anchor.w / 2, y: anchor.y + anchor.h / 2, facing: Math.sign(p.vx), life: 0.23, maxLife: 0.23 });
  }
  if (p.y + p.h >= FLOOR - 0.001) p.life = 0;
}
