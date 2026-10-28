import { FLOOR, WIDTH, clamp, overlaps } from './data.js';

// Library entries include anime species and the ten approved unnamed basic enemies.
// Main-story placement remains chapter-specific.
export const MONSTERS = {
  crow: { name: '尸舞鸦', role: '空中 · 俯冲', region: '枫之村外', hp: 58, damage: 12, speed: 78, w: 38, h: 30, flying: true, hover: 66, range: 210, windupTime: 0.7, duration: 0.62, recovery: 0.75, spriteHeight: 64,
    image: './assets/monsters/crow.png', lore: '三眼妖鸦，窥伺着四魂之玉的力量。阴森的羽翼之下，藏着附身与操纵尸体的妖术。', move: '收拢双翼后沿直线俯冲，冲过目标后低空减速。', tip: '预警时错开路线；低空停顿时爪击，或用箭提前射落。' },
  spider: { name: '蜘蛛头', role: '地面 · 扑咬 / 吐丝', region: '新月山寺', hp: 62, damage: 12, speed: 88, w: 44, h: 37, range: 105, windupTime: 0.68, duration: 0.3, recovery: 0.65, spriteHeight: 65,
    image: './assets/monsters/spider.png', lore: '寄居于死者头部的妖怪，散乱的长发间伸出细长蛛足，成群潜伏于山寺附近。', move: '抬足后扑咬；少量个体会在远处蓄势吐丝。', tip: '主动攻击打断蓄势。丝团可被打散，命中仅造成短暂减速。' },
  hornet: { name: '最猛胜', role: '空中 · 毒针', region: '奈落势力相关区域', hp: 30, damage: 8, speed: 100, w: 32, h: 25, flying: true, hover: 58, range: 155, windupTime: 0.6, duration: 0.4, recovery: 0.7, spriteHeight: 47,
    image: './assets/monsters/hornet.png', lore: '奈落放出的毒虫，既是耳目，也是危险的蜂群。其毒性甚至让风穴的使用受到牵制。', move: '悬停蓄势后挺起毒针，向前短距离突刺。', tip: '血量很低，抢先击杀或用范围技能清群。多次中毒分别计时，切人后仍需留意同伴生命。' },
  harpy: { name: '极乐鸟', role: '空地 · 扑抓', region: '妖狼族山谷', hp: 92, damage: 14, speed: 60, w: 66, h: 64, flying: true, hover: 90, range: 240, windupTime: 0.8, duration: 0.5, recovery: 0.9, spriteHeight: 105,
    image: './assets/monsters/harpy.png', lore: '人形与鸟身结合的异形妖鸟，群居于山谷高处，是妖狼族的天敌。', move: '先以利爪降落扑击，落地蓄势后再进行一次抓挠。', tip: '避开落点后近身压制。体形虽大，普通攻击依然能打出硬直。' },
  rat: { name: '妖鼠群', role: '地面 · 群体扑咬', region: '铁鼠事件中的村落', hp: 30, damage: 10, speed: 138, w: 34, h: 24, range: 95, windupTime: 0.55, duration: 0.3, recovery: 0.55, spriteHeight: 38,
    image: './assets/monsters/rat.png', lore: '铁鼠操纵的鼠群，贴地涌过村落。锐利门牙与细长鼠尾交错，数量是它们的威胁。', move: '快速接近，短暂停顿后跃起扑咬。', tip: '单只十分脆弱，用爪击或穿透箭覆盖多只，连续清理。' },
  crawler: { name: '赤眼多足妖', role: '基础小怪 · 多足突咬', region: '群妖相关章节（待配置）', basic: true, reference: '01', atlasMode: 'silhouette', hp: 52, damage: 10, speed: 82, w: 54, h: 32, range: 105, windupTime: 0.62, duration: 0.3, recovery: 0.65, lungeSpeed: 180, lungeArc: 0, spriteHeight: 56,
    image: './assets/monsters/crawler.png', lore: '第30话群妖画面中的紫色赤眼异形。名称为游戏归类名，低伏体态、完整尾部和战斗动作由游戏补足。', move: '抬起前躯与口部附肢，随后沿面向短距离突咬。', tip: '预警时近身打断，或闪开正面后连续爪击。' },
  maw: { name: '巨口长躯妖', role: '基础小怪 · 巨口扑咬', region: '群妖相关章节（待配置）', basic: true, reference: '02', atlasMode: 'silhouette', hp: 60, damage: 12, speed: 62, w: 54, h: 44, range: 112, windupTime: 0.72, duration: 0.3, recovery: 0.8, lungeSpeed: 165, lungeArc: 0, spriteHeight: 70,
    image: './assets/monsters/maw.png', lore: '第30话群妖中的浅紫色巨口长躯异形。名称为游戏归类名，短躯与腹部爬行属于横版游戏改编。', move: '后缩颈部蓄势，张开獠牙巨口向前扑咬。', tip: '观察收颈动作，打断蓄势或避开扑咬后压制。' },
  manyeye: { name: '多眼长虫', role: '基础小怪 · 蠕行顶咬', region: '群妖相关章节（待配置）', basic: true, reference: '03', atlasMode: 'silhouette', hp: 44, damage: 10, speed: 92, w: 48, h: 40, range: 110, windupTime: 0.62, duration: 0.28, recovery: 0.65, lungeSpeed: 210, lungeArc: 0, spriteHeight: 64,
    image: './assets/monsters/manyeye.png', lore: '第30话群妖中的红紫色长虫，面部聚集绿色眼睛。名称为游戏归类名，紧凑尾部与地面动作由游戏补足。', move: '蜷缩身体后向前顶咬，不发射弹体，也不施加额外异常。', tip: '抢先打断蓄势，范围攻击可覆盖紧靠的多只个体。' },
  eyeball: { name: '赤瞳眼球妖', role: '基础小怪 · 低空冲撞', region: '群妖相关章节（待配置）', basic: true, reference: '04', atlasMode: 'silhouette', hp: 38, damage: 9, speed: 90, w: 38, h: 38, flying: true, hover: 36, range: 155, windupTime: 0.65, duration: 0.42, recovery: 0.8, chargeSpeed: 290, spriteHeight: 49,
    image: './assets/monsters/eyeball.png', lore: '第30话群妖中的赤瞳眼球异形。名称为游戏归类名，短尾与低空漂浮为游戏补足，不赋予原作未确认的射线能力。', move: '向后收拢眼缘蓄势，随后沿已锁定的方向低空冲撞。', tip: '贴近时可直接爪击；冲撞出手后不会继续转向追踪。' },
  beetle: { name: '巨颚甲虫妖', role: '基础小怪 · 巨颚夹击', region: '群妖相关章节（待配置）', basic: true, reference: '05', atlasMode: 'silhouette', hp: 70, damage: 12, speed: 55, w: 55, h: 36, range: 100, windupTime: 0.76, duration: 0.28, recovery: 0.85, lungeSpeed: 155, lungeArc: 0, spriteHeight: 59,
    image: './assets/monsters/beetle.png', lore: '第21话奈落诞生回忆中的大眼巨颚异形。名称为游戏归类名，六足与后部甲壳由游戏补全；甲壳不提供霸体。', move: '低伏身体张开巨颚，向前短冲夹击，随后停顿。', tip: '蓄势和攻击均可打断，抓住停顿连续攻击。' },
  tongue: { name: '长舌鬼面妖', role: '基础小怪 · 长舌突刺', region: '群妖相关章节（待配置）', basic: true, reference: '06', atlasMode: 'silhouette', hp: 42, damage: 10, speed: 72, w: 48, h: 36, range: 132, windupTime: 0.72, duration: 0.22, recovery: 0.85, attackKind: 'tongue', reach: 90, spriteHeight: 58,
    image: './assets/monsters/tongue.png', lore: '第21话奈落诞生回忆左上角的浅发长舌鬼面。名称为游戏归类名，毛发覆盖的短躯与四足爬行由游戏补足。', move: '伏低鬼面并收舌蓄势，停在原地朝正面伸舌刺击。', tip: '观察伏低动作，打断或绕开正面；长舌不抓取、不定身。' },
  wingface: { name: '翼膜人面妖', role: '基础小怪 · 低空扑抓', region: '群妖相关章节（待配置）', basic: true, reference: '07', atlasMode: 'silhouette', hp: 46, damage: 10, speed: 85, w: 40, h: 42, flying: true, hover: 38, range: 145, windupTime: 0.68, duration: 0.4, recovery: 0.85, chargeSpeed: 280, spriteHeight: 78,
    image: './assets/monsters/wingface.png', lore: '第24话群妖中的深发人面、浅褐翼膜异形。名称为游戏归类名，短小下身、双足和低空飞行属于横版游戏补全。', move: '收翼后锁定方向，低空向前扑抓，出手后不继续追踪。', tip: '普通爪击可触及，预警时打断或闪开扑击路线。' },
  humpneck: { name: '瘤背长颈妖', role: '基础小怪 · 伸颈突咬', region: '群妖相关章节（待配置）', basic: true, reference: '08', atlasMode: 'silhouette', hp: 66, damage: 12, speed: 48, w: 58, h: 38, range: 115, windupTime: 0.84, duration: 0.28, recovery: 0.9, lungeSpeed: 145, lungeArc: 0, spriteHeight: 64,
    image: './assets/monsters/humpneck.png', lore: '第24话群妖中的紫灰长颈与深蓝瘤背异形。名称为游戏归类名，四足、短尾与完整躯体由游戏补全；背部凸起不提供免伤。', move: '缓慢贴近，抬起长颈预警，随后伸颈短冲咬击。', tip: '预警和收招较长，可近身打断并连续攻击。' },
  cyclops: { name: '青面独眼妖', role: '基础小怪 · 张口扑咬', region: '群妖相关章节（待配置）', basic: true, reference: '09', atlasMode: 'silhouette', hp: 54, damage: 11, speed: 78, w: 42, h: 48, range: 105, windupTime: 0.66, duration: 0.28, recovery: 0.75, lungeSpeed: 185, lungeArc: 8, spriteHeight: 67,
    image: './assets/monsters/cyclops.png', lore: '第28话屋檐间的青面圆眼异形。独眼为画面归类暂称，深青短躯、双臂双足和扑咬由游戏补全，不认定为原作正式物种。', move: '弓身收头蓄势，再张开尖牙口向前短扑。', tip: '贴近时抢先打断；圆眼不发射弹体或施加控制。' },
  skullwhisker: { name: '骷面垂须妖', role: '基础小怪 · 贴地突咬', region: '群妖相关章节（待配置）', basic: true, reference: '10', atlasMode: 'silhouette', hp: 48, damage: 10, speed: 95, w: 50, h: 34, range: 105, windupTime: 0.65, duration: 0.26, recovery: 0.7, lungeSpeed: 205, lungeArc: 0, spriteHeight: 57,
    image: './assets/monsters/skullwhisker.png', lore: '第28话横梁下的灰紫骷面、浅色垂须异形。名称为游戏归类名，低伏四足和短尾由游戏补全；垂须按游戏须状附肢表现。', move: '贴地爬行，低头后向前短冲咬击，垂须随头部摆动。', tip: '可打断和浮空；须状附肢不抓取、不远程伸长。' }
};

export const MONSTER_IDS = Object.keys(MONSTERS);
export const BASIC_MONSTER_IDS = MONSTER_IDS.filter(id => MONSTERS[id].basic);
export const isOrdinary = e => Object.hasOwn(MONSTERS, e.type);
export const isAttacking = e => e.hp > 0 && ['windup', 'attack'].includes(e.state);

export function moveMonster(game, e, dx, dy = 0) {
  const next = clamp(e.x + dx, 20, game.level.length - e.w - 20);
  if (e.flying || !game.level.gaps.some(([x, w]) => next + e.w > x && next < x + w)) e.x = next;
  e.y = clamp(e.y + dy, 100, FLOOR - e.h);
}

function beginAttack(game, e, kind) {
  e.state = 'windup'; e.stateClock = kind === 'claw' ? 0.6 : e.windupTime;
  e.windup = e.stateClock; e.kind = kind; e.moving = false; e.hit = false;
  e.facing = game.hero.x + game.hero.w / 2 < e.x + e.w / 2 ? -1 : 1;
  e.targetX = game.hero.x + game.hero.w / 2; e.targetY = game.hero.y + game.hero.h / 2;
  e.attackX = e.x; e.attackY = e.y;
  const dx = e.targetX - (e.x + e.w / 2), dy = e.targetY - (e.y + e.h / 2);
  const distance = Math.hypot(dx, dy) || 1;
  const speed = e.chargeSpeed ?? (e.type === 'hornet' ? 420 : 365);
  e.aimX = dx / distance * speed; e.aimY = dy / distance * speed;
  e.attackFacing = e.facing;
  game.emit('sound', e.type);
}

function recover(e) {
  e.state = 'recover'; e.stateClock = e.recovery; e.windup = 0; e.moving = false;
}

export function interruptMonster(game, e, knock = 1, force = 8) {
  e.state = 'hurt'; e.stateClock = 0.35; e.stun = 0.35; e.windup = 0;
  e.attackBox = null; e.hit = true; e.kind = null; e.moving = false;
  moveMonster(game, e, knock * force, e.flying ? 9 : 0);
}

export function launchMonster(e, vy, vx = 0) {
  e.juggle = { vy, vx }; e.state = 'hurt'; e.stateClock = 0.35;
  e.windup = 0; e.attackBox = null; e.hit = true; e.kind = null;
}

export function updateMonster(game, e, dt) {
  e.flash = Math.max(0, e.flash - dt);
  e.age += dt; e.moving = false;
  if (e.juggle) {
    const previousBottom = e.y + e.h;
    e.juggle.vy += 1160 * dt;
    moveMonster(game, e, e.juggle.vx * dt);
    e.y = Math.max(75, e.y + e.juggle.vy * dt);
    for (const p of game.platforms) if (e.juggle.vy >= 0 && e.x + e.w > p.x && e.x < p.x + p.w && previousBottom <= p.y + 1 && e.y + e.h >= p.y) {
      e.y = p.y - e.h; e.juggle = null; e.state = 'hurt'; e.stateClock = 0.35; break;
    }
    if (e.y > FLOOR + 120) { e.y = FLOOR - e.h; e.juggle = null; e.stateClock = 0.35; }
    return;
  }
  // A whole actor, rather than just its origin, must be visible before an attack.
  const visible = e.x >= game.camera && e.x + e.w <= game.camera + WIDTH;
  if (!visible) {
    if (isAttacking(e)) recover(e);
    e.windup = 0;
    return;
  }
  if (e.state === 'spawn' || e.state === 'hurt' || e.state === 'recover') {
    e.stateClock -= dt; e.stun = Math.max(0, e.stun - dt);
    if (e.stateClock <= 0) { e.timer = e.state === 'spawn' ? 0.35 : 0.25; e.state = 'idle'; }
    return;
  }
  if (e.state === 'windup') {
    e.stateClock -= dt; e.windup = Math.max(0, e.stateClock);
    if (e.stateClock <= 0) {
      e.state = 'attack'; e.stateClock = e.kind === 'claw' ? 0.2 : e.duration;
      if (e.kind === 'silk') {
        const dx = e.targetX - (e.x + e.w / 2), dy = e.targetY - (e.y + e.h / 2), length = Math.hypot(dx, dy) || 1;
        game.projectiles.push({ owner: 'enemy', kind: 'silk', source: e, x: e.x + e.w / 2, y: e.y + 10, vx: dx / length * 225, vy: dy / length * 225, w: 15, h: 12, damage: 4, life: 2.2, color: '#dedbd0' });
        recover(e);
      }
    }
    return;
  }
  if (e.state === 'attack') {
    e.stateClock -= dt;
    const progress = clamp(1 - e.stateClock / e.duration, 0, 1);
    if (e.kind === 'tongue') {
      const mouth = e.x + e.w / 2;
      e.attackBox = { x: e.attackFacing > 0 ? mouth : mouth - e.reach, y: e.y + e.h * 0.25, w: e.reach, h: e.h * 0.5 };
    } else if (e.kind === 'claw') {
      e.attackBox = { x: e.facing > 0 ? e.x + 15 : e.x - 35, y: e.y, w: e.w + 20, h: e.h };
    } else {
      if (e.type === 'crow' || e.type === 'hornet' || e.chargeSpeed) moveMonster(game, e, e.aimX * dt, e.aimY * dt);
      else if (e.type === 'harpy') {
        const target = clamp(e.targetX - e.w / 2, e.attackX - 240, e.attackX + 240);
        moveMonster(game, e, (target - e.attackX) * dt / e.duration);
        e.y = e.attackY + (FLOOR - e.h - e.attackY) * progress;
      } else {
        moveMonster(game, e, e.facing * (e.lungeSpeed ?? (e.type === 'rat' ? 260 : 210)) * dt);
        e.y = FLOOR - e.h - Math.sin(progress * Math.PI) * (e.lungeArc ?? (e.type === 'rat' ? 30 : 17));
      }
      e.attackBox = { x: e.x - 4, y: e.y - 3, w: e.w + 8, h: e.h + 6 };
    }
    if (!e.hit && overlaps(e.attackBox, game.hero)) {
      e.hit = true;
      const target = game.active;
      if (game.damageHero(e.damage, e.attackFacing) && e.type === 'hornet') game.applyStatus('poison', target);
    }
    if (e.stateClock <= 0) {
      e.attackBox = null;
      if (!e.flying || e.type === 'harpy') e.y = FLOOR - e.h;
      if (e.type === 'harpy' && e.kind !== 'claw') beginAttack(game, e, 'claw');
      else recover(e);
    }
    return;
  }

  const h = game.hero, dx = h.x + h.w / 2 - (e.x + e.w / 2);
  e.facing = dx < 0 ? -1 : 1;
  e.timer -= dt;
  if (e.flying) {
    const targetY = FLOOR - e.h - e.hover + Math.sin(game.time * 3 + e.seed) * 9;
    moveMonster(game, e, 0, (targetY - e.y) * Math.min(1, dt * 4));
  }
  const ranged = e.type === 'spider' && e.spitter;
  const range = ranged ? 260 : e.range;
  const closeHeight = Math.abs(h.y + h.h / 2 - e.y - e.h / 2) < (e.flying || ranged ? 190 : 85);
  const slots = game.enemies.filter(other => isOrdinary(other) && isAttacking(other)).length;
  if (e.timer <= 0 && Math.abs(dx) < range && closeHeight && slots < 2) {
    beginAttack(game, e, ranged ? 'silk' : e.attackKind || 'lunge');
  } else if (Math.abs(dx) > range * 0.7) {
    const before = e.x;
    moveMonster(game, e, e.facing * e.speed * dt);
    e.moving = e.x !== before;
  }
}
