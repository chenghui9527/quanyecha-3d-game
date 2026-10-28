import { LEVELS, HEROES, STORY, FLOOR, clamp, overlaps, statsFor } from './data.js';
import { persist } from './save.js';
import { grantGrowth, GROWTH_EVENTS, transferShard, resolveWorldEvent, raceWinner, progressSnapshot, restoreProgress } from './campaign.js';
import { reducedDamage, absorbBarrier } from './combat.js';
import { MONSTERS, isOrdinary, updateMonster, interruptMonster } from './monsters.js';
import { INUYASHA_MOVES, bufferInuyashaInput, startInuyasha, advanceInuyasha, cancelInuyasha, inuyashaMotion, resolveInuyasha, updateBloodBlade } from './inuyasha.js';
import { createScenery, nearbySceneDoor } from './scenery.js';

const ENEMY = {
  ...MONSTERS,
  centipede: { hp: 320, damage: 24, speed: 42, w: 96, h: 84 },
  yura: { name: '逆发结罗', hp: 1050, damage: 25, speed: 70, w: 46, h: 80, boss: true },
  sesshomaru: { name: '杀生丸', hp: 920, damage: 23, speed: 78, w: 48, h: 88, boss: true }
};

export function moveBody(body, dt, platforms) {
  const previousBottom = body.y + body.h;
  body.vy += 1540 * dt;
  body.x += body.vx * dt;
  body.y += body.vy * dt;
  body.grounded = false;
  if (body.vy >= 0) {
    for (const p of platforms) {
      if (body.x + body.w > p.x && body.x < p.x + p.w && previousBottom <= p.y + 1 && body.y + body.h >= p.y) {
        body.y = p.y - body.h; body.vy = 0; body.grounded = true; break;
      }
    }
  }
}

export class Game {
  constructor(save, emit = () => {}, storage) {
    this.save = save; this.emit = emit; this.storage = storage;
    this.state = 'menu'; this.time = 0; this.camera = 0; this.input = {}; this.previous = {};
    this.level = LEVELS[0]; this.hero = { x: 350, y: FLOOR - 68, w: 30, h: 68, vx: 0, vy: 0, facing: 1, grounded: true };
    this.active = 'inuyasha'; this.enemies = []; this.projectiles = []; this.particles = []; this.effects = [];
    this.health = {}; this.cooldowns = {}; this.hitStop = 0; this.shake = 0;
    this.clearStatuses();
    this.controls = { inuyasha: { hurt: 0 }, kagome: { hurt: 0 } };
    this.barriers = { inuyasha: null, kagome: null };
    this.lab = false;
    this.action = null; this.combatBuffer = null; this.airAttacks = 0; this.kagomeBuffer = null;
    this.combatPrevious = {};
    this.sceneObjects = []; this.openDoors = new Set();
  }
  get hurtClock() { return this.controls[this.active].hurt; }
  set hurtClock(value) { this.controls[this.active].hurt = value; }

  store() {
    if (!persist(this.save, this.storage)) this.emit('warning', '浏览器未允许保存，请在暂停菜单导出存档备份。');
  }

  start(index, resume = false) {
    if (!Number.isInteger(index) || index < 0 || index > this.save.unlockedStage || index >= LEVELS.length) return false;
    const onward = !resume && this.state === 'victory' && index === this.level.id + 1;
    const vitals = onward ? structuredClone({ health: this.health, statuses: this.statuses, controls: this.controls }) : null;
    const cp = resume && this.save.checkpoint?.stage === index ? this.save.checkpoint : null;
    const run = resume && this.save.runStart?.stage === index ? this.save.runStart : null;
    if (resume) restoreProgress(this.save, cp?.progress || run?.progress);
    else { this.save.checkpoint = null; this.save.runStart = { stage: index, progress: progressSnapshot(this.save), vitals }; }
    this.level = LEVELS[index]; this.save.stage = index;
    this.sceneObjects = createScenery(this.level, this.lab); this.openDoors = new Set();
    this.hero = { x: cp?.x || 140, y: FLOOR - 68, w: 30, h: 68, vx: 0, vy: 0, facing: 1, grounded: false };
    this.camera = Math.max(0, this.hero.x - 320);
    this.active = this.save.unlocked.includes('inuyasha') ? 'inuyasha' : 'kagome';
    this.health = Object.fromEntries(Object.keys(HEROES).map(id => [id, statsFor(id, this.save.heroes[id]).maxHp]));
    this.cooldowns = { inuyasha: [0, 0], kagome: [0, 0] };
    this.clearStatuses(); this.controls = { inuyasha: { hurt: 0 }, kagome: { hurt: 0 } };
    const restoredVitals = vitals || (!cp && run?.vitals);
    if (restoredVitals) { this.health = structuredClone(restoredVitals.health); this.statuses = structuredClone(restoredVitals.statuses); this.controls = structuredClone(restoredVitals.controls); }
    this.barriers = { inuyasha: null, kagome: null }; this.hitStop = 0; this.shake = 0;
    this.enemies = []; this.projectiles = []; this.particles = []; this.effects = []; this.damageTaken = 0; this.hazardHits = new Map();
    this.attackClock = 0; this.attackCooldown = 0; this.dodgeClock = 0; this.dodgeCooldown = 0; this.invulnerable = 0; this.switchCooldown = 0;
    this.jumpBuffer = 0; this.coyote = 0; this.combo = 0; this.comboTime = 0;
    this.action = null; this.combatBuffer = null; this.airAttacks = 0; this.kagomeBuffer = null;
    this.combatPrevious = {};
    // Old checkpoints used the previous, much denser encounter layout.
    this.cleared = new Set(cp ? cp.encounterVersion === 2 ? cp.waves : this.level.encounters.flatMap((zone, i) => zone.x < this.hero.x - 70 ? [i] : []) : []);
    this.events = new Set(cp?.events || []);
    this.shrines = new Set(this.level.checkpoints.filter(x => x <= this.hero.x + 20));
    this.encounter = null; this.waveWait = 0; this.bossSpawned = false; this.bossDefeated = cp?.bossDefeated || false; this.anchors = [];
    this.platforms = []; let start = 0;
    for (const [x, width] of this.level.gaps) { this.platforms.push({ x: start, y: FLOOR, w: x - start, h: 100 }); start = x + width; }
    this.platforms.push({ x: start, y: FLOOR, w: this.level.length - start + 200, h: 100 });
    this.platforms.push(...this.level.platforms.map(([x, y, w]) => ({ x, y, w, h: 20 })));
    this.state = 'playing'; this.previous = {}; this.input = {}; this.stageTime = 0; this.outroStarted = false;
    this.store(); this.emit('start', this.level);
    if (!cp) this.showDialogue(this.level.intro);
    if (this.health[this.active] <= 0) this.active = this.save.unlocked.find(id => this.health[id] > 0) || this.active;
    return true;
  }

  showDialogue(key, done) {
    this.state = 'dialogue'; this.hero.vx = 0;
    this.dialogue = { key, lines: STORY[key] || [], index: 0, done };
    this.emit('dialogue', this.dialogue);
  }
  nextDialogue() {
    if (this.state !== 'dialogue' || !this.dialogue) return;
    this.dialogue.index++;
    if (this.dialogue.index < this.dialogue.lines.length) this.emit('dialogue', this.dialogue);
    else {
      const done = this.dialogue.done; this.dialogue = null; this.state = 'playing'; this.input = {}; this.previous = {};
      this.emit('dialogueEnd'); done?.();
    }
  }
  pause() { if (this.state === 'playing') { this.state = 'paused'; this.store(); return true; } return false; }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.input = {}; this.previous = {}; this.combatPrevious = {}; } }

  interactScene() {
    if (this.state !== 'playing' || this.action || this.dodgeClock > 0 || this.hurtClock > 0) return false;
    const item = this.nearbyInteraction();
    if (item) {
      if (item.hero && this.active !== item.hero) { this.showDialogue('fangFailed'); return false; }
      const moved = item.shard && this.save.jewel.owners[item.shard] === 'naraku';
      this.showDialogue(moved ? 'shardMoved' : item.dialogue, () => {
        this.events.add(item.id);
        if (item.shard && !moved) transferShard(this.save, item.shard, 'inuyasha');
        if (item.id === 'fang-taken' && !this.save.heroes.inuyasha.unlocks.includes('tessaiga')) this.save.heroes.inuyasha.unlocks.push('tessaiga');
        this.store(); this.checkRace();
      });
      return true;
    }
    const door = nearbySceneDoor(this);
    if (!door) return false;
    if (this.openDoors.has(door.id)) this.openDoors.delete(door.id); else this.openDoors.add(door.id);
    return true;
  }
  availableInteractions() {
    return (this.level.interactions || []).filter(item => !this.events.has(item.id) && (!item.needs || this.events.has(item.needs)) && (!item.bossDefeated || this.bossDefeated));
  }
  nearbyInteraction() {
    return this.hero.grounded && this.availableInteractions().find(item => Math.abs(this.hero.x + this.hero.w / 2 - item.x) < 82 && Math.abs(this.hero.y + this.hero.h - FLOOR) < 18);
  }
  objectiveComplete() { return (this.level.required || []).every(key => this.events.has(key)); }
  checkRace() {
    const winner = raceWinner(this.save);
    if (winner) { this.state = 'ending'; this.store(); this.emit('raceEnd', winner); }
    return winner;
  }
  grow(id) {
    if (!grantGrowth(this.save, id)) return;
    const event = GROWTH_EVENTS[id];
    this.emit('toast', `${HEROES[event.hero].name} · ${event.name}`); this.emit('growth', id);
  }

  switchTo(id) {
    if (this.state !== 'playing' || id === this.active || !this.save.unlocked.includes(id) || this.health[id] <= 0 || this.switchCooldown > 0) return false;
    cancelInuyasha(this); this.combo = 0; this.comboTime = 0; this.airAttacks = 0;
    this.active = id; this.hero.vx = 0; this.kagomeBuffer = null; this.switchCooldown = 0.35; this.attackCooldown = 0.1;
    this.burst(this.hero.x + 15, this.hero.y + 35, HEROES[id].color, 20);
    this.emit('sound', 'switch'); this.emit('switch', id); return true;
  }

  burst(x, y, color, amount = 12) {
    for (let i = 0; i < amount; i++) this.particles.push({ x, y, vx: (Math.random() - 0.5) * 210, vy: (Math.random() - 0.7) * 170, life: 0.35 + Math.random() * 0.45, color, size: 2 + Math.floor(Math.random() * 3) });
  }

  hitEnemy(enemy, damage, knock = 1, force = this.combo === 2 ? 18 : 7, type = 'physical') {
    if (enemy.hp <= 0) return;
    if (enemy.type === 'yura' && this.anchors.some(a => a.hp > 0)) damage *= 0.3;
    damage = reducedDamage(damage, type, enemy);
    if (enemy.type === 'sesshomaru' && enemy.phase === 1) damage = Math.min(damage, enemy.hp - enemy.maxHp * 0.5);
    enemy.hp -= damage; enemy.flash = 0.13;
    if (isOrdinary(enemy)) interruptMonster(this, enemy, knock, force);
    else if (!enemy.boss) { enemy.x += knock * 12; enemy.stun = 0.22; enemy.windup = 0; }
    this.effects.push({ type: 'number', x: enemy.x + enemy.w / 2, y: enemy.y, text: `${Math.round(damage)}`, life: 0.65, color: '#fff0b4' });
    this.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#efb77b', 7);
    this.hitStop = 0.035; this.shake = Math.max(this.shake, 2); this.emit('sound', 'hit');
    if (enemy.hp <= 0) {
      enemy.state = 'dead'; enemy.deathClock = 0.5; enemy.windup = 0; enemy.attackBox = null;
      if (this.lab) { this.burst(enemy.x + enemy.w / 2, enemy.y + 20, '#addec5', 10); return; }
      if (isOrdinary(enemy) && !this.save.bestiary.includes(enemy.type)) {
        this.save.bestiary.push(enemy.type); this.store(); this.emit('toast', `妖怪图鉴已收录 · ${enemy.name}`);
      }
      this.burst(enemy.x + enemy.w / 2, enemy.y + 20, '#addec5', 18);
      if (enemy.boss) { this.bossDefeated = true; this.anchors = []; this.projectiles = []; this.emit('toast', enemy.type === 'yura' ? '发丝散去 · 靠近赤骸按 E 收取碎片' : '杀生丸退去 · 带着铁碎牙离开墓地'); }
    }
  }

  damageHero(amount, direction = 1, type = 'physical') {
    if (this.invulnerable > 0 || this.state !== 'playing') return false;
    if (absorbBarrier(this.barriers[this.active], amount, type)) return false;
    amount = reducedDamage(amount, type, HEROES[this.active]);
    this.health[this.active] = Math.max(0, this.health[this.active] - amount); this.damageTaken += amount;
    cancelInuyasha(this);
    this.hurtClock = Math.max(this.hurtClock, 0.24); this.hero.vx = direction * 170; this.hero.vy = -150; this.shake = 6;
    this.burst(this.hero.x + 15, this.hero.y + 30, '#f19c91', 15); this.emit('sound', 'hurt');
    this.resolveDefeat();
    return true;
  }

  resolveDefeat() {
    if (this.health[this.active] <= 0) {
      this.statuses[this.active] = { slow: 0, slows: [], poison: [] }; this.barriers[this.active] = null;
      const other = this.save.unlocked.find(id => this.health[id] > 0);
      if (other) { this.switchCooldown = 0; this.switchTo(other); this.emit('toast', '同伴接战！在神社检查点可以恢复生命。'); }
      else { this.state = 'dead'; this.emit('dead'); }
    }
  }

  clearStatuses() {
    this.statuses = { inuyasha: { slow: 0, slows: [], poison: [] }, kagome: { slow: 0, slows: [], poison: [] } };
  }

  applyStatus(kind, id = this.active, config = {}) {
    if (this.state !== 'playing' || this.health[id] <= 0) return;
    const status = this.statuses[id];
    if (kind === 'poison') status.poison.push({ life: config.life || 3, tick: 1, damage: config.damage || 2.5 });
    if (kind === 'slow') status.slows.push({ life: config.life || 1.1, strength: config.strength || 0.35 });
  }

  updateStatuses(dt) {
    for (const [id, status] of Object.entries(this.statuses)) {
      this.controls[id].hurt = Math.max(0, this.controls[id].hurt - dt);
      if (this.barriers[id]) this.barriers[id].life = Math.max(0, this.barriers[id].life - dt);
      status.slows.forEach(slow => { slow.life -= dt; });
      status.slows = status.slows.filter(slow => slow.life > 0);
      status.slow = Math.max(0, ...status.slows.map(slow => slow.strength));
      for (const poison of status.poison) {
        const active = Math.min(dt, poison.life); poison.life -= dt; poison.tick -= active;
        while (poison.tick <= 0.000001 && this.health[id] > 0) {
          poison.tick += 1;
          const amount = Math.min(poison.damage, this.health[id]);
          this.health[id] -= amount; this.damageTaken += amount;
          if (id === this.active) this.effects.push({ type: 'number', x: this.hero.x, y: this.hero.y - 10, text: '毒', life: 0.4, color: '#d2a7e6' });
        }
      }
      status.poison = status.poison.filter(poison => poison.life > 0 && this.health[id] > 0);
    }
    this.resolveDefeat();
  }

  attack(skill = -1, move) {
    if (this.active === 'inuyasha') return startInuyasha(this, skill, move);
    if (this.state !== 'playing' || this.attackCooldown > 0 || this.dodgeClock > 0 || this.hurtClock > 0) return false;
    if (skill >= 0 && this.cooldowns[this.active][skill] > 0) return false;
    const h = this.hero, stats = statsFor(this.active, this.save.heroes[this.active]);
    this.attackClock = skill >= 0 ? 0.48 : 0.3; this.attackCooldown = skill >= 0 ? 0.5 : this.active === 'kagome' ? 0.4 : 0.32;
    this.combo = this.comboTime > 0 ? (this.combo + 1) % 3 : 0; this.comboTime = 0.9;
    if (skill >= 0) this.cooldowns[this.active][skill] = HEROES[this.active].cooldown[skill];
    if (this.active === 'kagome' && skill === 1) {
      this.barriers.kagome = { hp: 48, life: 4, defense: {} };
      this.effects.push({ type: 'shield', x: h.x + 15, y: h.y + 30, life: 0.7, color: '#bbedd8' });
      this.emit('sound', 'heal'); this.emit('toast', '灵光守护 · 四秒结界，耐久48'); return true;
    }
    if (this.active === 'kagome') {
      const target = [...this.enemies.filter(e => e.hp > 0), ...this.anchors.filter(e => e.hp > 0)].filter(e => (e.x - h.x) * h.facing > -15 && Math.abs(e.x - h.x) < 570).sort((a, b) => Number(this.anchors.includes(b)) - Number(this.anchors.includes(a)) || Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
      const x = h.x + 15 + h.facing * 22, y = h.y + 26;
      const dx = target ? target.x + target.w / 2 - x : h.facing * 400;
      const dy = target ? target.y + target.h / 2 - y : 0;
      const angle = Math.atan2(dy, dx); const speed = skill === 0 ? 650 : 590;
      this.projectiles.push({ owner: 'hero', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, w: skill === 0 ? 34 : 23, h: skill === 0 ? 16 : 6, damage: skill === 0 ? stats.power * 3.2 : stats.damage, damageType: skill === 0 ? 'spirit' : 'physical', life: 1.2, pierce: skill === 0, hits: new Set(), color: skill === 0 ? '#f6c4f7' : '#c8e8ce' });
      this.emit('sound', skill === 0 ? 'skill' : 'arrow');
    }
    return true;
  }

  damageAnchor(anchor, damage) {
    anchor.hp -= damage; anchor.flash = 0.14; this.burst(anchor.x + 12, anchor.y + 18, '#f3a0ba', 7);
    if (anchor.hp <= 0) { this.burst(anchor.x + 12, anchor.y + 18, '#e4d0ab', 22); if (!this.anchors.some(a => a.hp > 0)) { this.emit('toast', '结点已破！结罗露出了破绽！'); const boss = this.enemies.find(e => e.type === 'yura'); if (boss) boss.stun = 3; } }
  }

  spawnEnemy(type, x) {
    if (!Object.hasOwn(ENEMY, type)) throw new Error(`Unknown enemy type: ${type}`);
    const spec = ENEMY[type]; const tier = 1 + this.level.id * 0.12;
    const gap = this.level.gaps.find(([gx, width]) => x > gx - 45 && x < gx + width + 45);
    if (gap) x = gap[0] + gap[1] + 60;
    const enemy = { ...spec, type, x, y: FLOOR - spec.h - (spec.hover || 0), maxHp: spec.hp * tier, hp: spec.hp * tier, timer: 0.6 + Math.random() * 0.5, windup: 0, stun: 0, flash: 0, facing: -1, seed: Math.random() * 8, phase: 1, pattern: 0, state: 'spawn', stateClock: 0.65, age: 0, attackBox: null, deathClock: 0, spitter: false };
    this.enemies.push(enemy); return enemy;
  }
  spawnWave() {
    const data = this.level.encounters[this.encounter.index];
    this.encounter.wave++;
    data.types.forEach((type, i) => this.spawnEnemy(type, Math.min(this.level.length - 140, data.x + 190 + i * 70)));
    this.emit('toast', `${this.encounter.wave === 1 ? '妖气涌动' : '后续敌人出现'} · ${this.encounter.wave} / ${data.count}`);
  }
  activateCheckpoint(x) {
    this.save.checkpoint = { stage: this.level.id, x: x + 25, waves: [...this.cleared], events: [...this.events], encounterVersion: 2, bossDefeated: this.bossDefeated, progress: progressSnapshot(this.save) };
    this.shrines.add(x);
    for (const id of this.save.unlocked) this.health[id] = statsFor(id, this.save.heroes[id]).maxHp;
    this.clearStatuses();
    this.store(); this.emit('toast', '神社检查点 · 进度已保存，队伍生命已恢复'); this.emit('sound', 'checkpoint');
    this.burst(x, FLOOR - 55, '#b9e3c3', 30);
  }
  retry() { return this.start(this.level.id, true); }

  finishStage() {
    if (this.outroStarted || !this.objectiveComplete() || this.checkRace()) return false;
    this.outroStarted = true;
    this.showDialogue(this.level.outro, () => {
      const first = !this.save.completed.includes(this.level.id);
      if (first) this.save.completed.push(this.level.id);
      if (this.level.id === 1) this.grow('promise');
      if (this.level.id === 3) { this.grow('cooperation'); resolveWorldEvent(this.save, 'yura-resolved'); }
      if (this.level.id === 5) resolveWorldEvent(this.save, 'tomb-returned');
      this.save.unlockedStage = Math.max(this.save.unlockedStage, Math.min(LEVELS.length - 1, this.level.id + 1));
      const relics = this.level.relics.filter((_, i) => this.save.relics.includes(`${this.level.id}:${i}`)).length;
      const stars = 1 + (relics === 3 ? 1 : 0) + (this.damageTaken < 180 ? 1 : 0);
      this.save.stars[this.level.id] = Math.max(stars, this.save.stars[this.level.id] || 0);
      this.barriers = { inuyasha: null, kagome: null };
      this.save.checkpoint = null; this.save.runStart = null; this.save.stage = Math.min(LEVELS.length - 1, this.level.id + 1); this.state = 'victory'; this.store();
      if (this.checkRace()) return;
      this.emit('victory', { first, stars, relics, chapterComplete: [1, 3, 5].includes(this.level.id), final: this.level.id === LEVELS.length - 1, time: this.stageTime });
    });
  }

  update(dt, input = {}) {
    this.input = input;
    if (this.state !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 1 / 30);
    this.time += dt; this.stageTime += dt; this.save.playTime += dt;
    bufferInuyashaInput(this, input);
    if (this.hitStop > 0) { if (input.jump && !this.previous.jump) this.jumpBuffer = 0.14; this.hitStop -= dt; return; }
    this.updateStatuses(dt);
    if (this.state !== 'playing') return;
    const press = key => input[key] && !this.previous[key];
    const h = this.hero;
    if (press('interact')) { this.interactScene(); if (this.state !== 'playing') return; }
    this.attackClock = Math.max(0, this.attackClock - dt); this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.dodgeClock = Math.max(0, this.dodgeClock - dt); this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt); this.switchCooldown = Math.max(0, this.switchCooldown - dt);
    this.comboTime -= dt; this.shake *= 0.85;
    const buffered = this.combatBuffer;
    if (buffered) { buffered.life -= dt; if (buffered.life <= 0) this.combatBuffer = null; }
    advanceInuyasha(this, dt);
    for (const cds of Object.values(this.cooldowns)) for (let i = 0; i < cds.length; i++) cds[i] = Math.max(0, cds[i] - dt);
    if (press('one')) this.switchTo('inuyasha');
    if (press('two')) this.switchTo('kagome');
    if (press('switch')) this.switchTo(this.active === 'inuyasha' ? 'kagome' : 'inuyasha');
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (direction && !this.dodgeClock && !this.hurtClock && !this.action) h.facing = direction;
    if (press('jump')) this.jumpBuffer = 0.14; else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = h.grounded ? 0.12 : Math.max(0, this.coyote - dt);
    const jumpCancelAt = this.action ? INUYASHA_MOVES[this.action.id].jumpCancel ?? INUYASHA_MOVES[this.action.id].cancelAt : 0;
    if (this.jumpBuffer > 0 && this.coyote > 0 && !this.dodgeClock && !this.hurtClock && (!this.action || this.action.elapsed >= jumpCancelAt)) { if (this.active === 'inuyasha') cancelInuyasha(this); h.vy = -620; h.grounded = false; this.coyote = 0; this.jumpBuffer = 0; this.emit('sound', 'jump'); }
    if (press('dodge') && this.dodgeCooldown <= 0 && !this.hurtClock) { if (this.active === 'inuyasha') cancelInuyasha(this); this.dodgeClock = 0.25; this.dodgeCooldown = 0.88; this.invulnerable = 0.3; this.emit('sound', 'dodge'); }
    if (!this.hurtClock) h.vx = this.dodgeClock > 0 ? h.facing * 590 : direction * statsFor(this.active, this.save.heroes[this.active]).speed * (this.attackClock > 0 ? 0.55 : 1) * (1 - this.statuses[this.active].slow);
    if (this.active === 'inuyasha') {
      const pending = this.combatBuffer;
      if (pending) this.attack(pending.skill, pending.move);
      else if (input.attack && !input.down) this.attack();
      inuyashaMotion(this, dt, direction);
    } else {
      if (press('skill1')) this.kagomeBuffer = { skill: 0, life: 0.45 };
      else if (press('skill2')) this.kagomeBuffer = { skill: 1, life: 0.45 };
      if (this.kagomeBuffer) {
        this.kagomeBuffer.life -= dt;
        if (this.attack(this.kagomeBuffer.skill) || this.kagomeBuffer.life <= 0) this.kagomeBuffer = null;
      } else if (input.attack) this.attack();
    }
    moveBody(h, dt, this.platforms);
    h.x = clamp(h.x, 20, this.level.length - h.w - 20);
    if (this.encounter) {
      const zone = this.level.encounters[this.encounter.index];
      h.x = clamp(h.x, Math.max(20, zone.x - 240), zone.x + 650);
    }
    if (this.bossSpawned && !this.bossDefeated) h.x = clamp(h.x, this.level.bossX - 550, this.level.length - 60);
    if (h.grounded) this.airAttacks = 0;
    if (this.active === 'inuyasha') resolveInuyasha(this, dt);
    if (h.y > 620) {
      this.damageHero(24); if (this.state !== 'playing') return;
      const gap = this.level.gaps.find(([x, w]) => h.x + h.w > x && h.x < x + w);
      h.x = gap ? gap[0] - 75 : Math.max(100, h.x - 200); h.y = FLOOR - h.h - 10; h.vy = 0;
      cancelInuyasha(this);
    }
    for (const event of this.level.storyEvents) {
      if (h.x >= event.x && !this.events.has(event.key) && (!event.afterEncounters || this.cleared.size === this.level.encounters.length)) {
        this.events.add(event.key);
        this.showDialogue(event.key, () => {
          if (event.key === 'shatter') this.save.jewel.started = true;
          if (event.unlock && !this.save.unlocked.includes(event.unlock)) {
            this.save.unlocked.push(event.unlock); this.active = event.unlock;
            this.health[event.unlock] = statsFor(event.unlock, this.save.heroes[event.unlock]).maxHp;
            this.emit('unlock', event.unlock);
          }
          this.store();
        });
        return;
      }
    }
    if (!this.encounter) {
      const index = this.level.encounters.findIndex((zone, i) => !this.cleared.has(i) && h.x >= zone.x - 70);
      if (index >= 0) { this.encounter = { index, wave: 0 }; this.waveWait = 0; this.spawnWave(); }
    } else if (!this.enemies.some(e => e.hp > 0)) {
      this.waveWait += dt;
      if (this.waveWait > 0.7) {
        const zone = this.level.encounters[this.encounter.index]; this.waveWait = 0;
        if (this.encounter.wave < zone.count) this.spawnWave();
        else { this.cleared.add(this.encounter.index); this.encounter = null; this.emit('toast', '道路已净化 · 继续前进'); }
      }
    }
    if (!this.encounter) for (const x of this.level.checkpoints) if (h.x >= x && !this.shrines.has(x)) this.activateCheckpoint(x);
    this.level.relics.forEach(([x, y], i) => {
      const key = `${this.level.id}:${i}`;
      if (!this.save.relics.includes(key) && Math.hypot(h.x + 15 - x, h.y + 36 - y) < 43) {
        this.save.relics.push(key);
        this.burst(x, y, '#fce5a6', 20); this.emit('toast', '寻得旅途信物 · 收藏已记录'); this.emit('sound', 'pickup'); this.store();
      }
    });
    for (const x of this.level.traps || []) if (Math.sin(this.time * 2 + x) > 0.2 && overlaps(h, { x, y: 340, w: 16, h: 114 }) && this.time >= (this.hazardHits.get(x) || 0)) {
      this.hazardHits.set(x, this.time + 0.8); this.damageHero(16, h.x < x ? -1 : 1);
    }
    if (this.level.bossX && !this.bossSpawned && !this.bossDefeated && !this.encounter && h.x > this.level.bossX - 500 && (this.level.boss !== 'sesshomaru' || this.events.has('fang-taken'))) {
      this.bossSpawned = true; this.spawnEnemy(this.level.boss || 'yura', this.level.bossX);
      if (this.level.boss === 'yura') this.anchors = [0, 1, 2].map((i) => ({ x: this.level.bossX - 300 + i * 220, y: FLOOR - 85 - (i % 2) * 45, w: 28, h: 38, hp: 85, flash: 0 }));
      this.emit('boss'); this.emit('toast', this.level.boss === 'yura' ? '结罗现身 · 用箭矢或跳跃爪击打碎发丝结点' : '杀生丸迎战 · 躲开预警，趁他收招时反击');
    }
    for (const e of this.enemies) {
      if (e.hp > 0 && this.state === 'playing') this.updateEnemy(e, dt);
      else if (e.hp <= 0) e.deathClock = Math.max(0, e.deathClock - dt);
    }
    if (this.state !== 'playing') return;
    this.updateProjectiles(dt);
    for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const e of this.effects) { e.life -= dt; if (e.type === 'number') e.y -= dt * 40; }
    this.effects = this.effects.filter(e => e.life > 0);
    for (const a of this.anchors) a.flash = Math.max(0, a.flash - dt);
    this.enemies = this.enemies.filter(e => e.hp > 0 || e.deathClock > 0);
    const desiredCamera = clamp(h.x - 340, 0, this.level.length - 960);
    this.camera += (desiredCamera - this.camera) * Math.min(1, dt * 7);
    if (!this.lab && this.state === 'playing' && !this.encounter && this.cleared.size === this.level.encounters.length && h.x > this.level.length - 150 && (!this.level.bossX || this.bossDefeated) && this.objectiveComplete()) this.finishStage();
    this.previous = { ...input };
  }

  updateEnemy(e, dt) {
    if (e.training && !e.juggle) { e.flash = Math.max(0, e.flash - dt); e.stateClock = Math.max(0, e.stateClock - dt); e.windup = 0; e.attackBox = null; e.state = e.stateClock > 0 ? 'hurt' : 'idle'; return; }
    if (isOrdinary(e)) { updateMonster(this, e, dt); return; }
    e.flash = Math.max(0, e.flash - dt); e.stun = Math.max(0, e.stun - dt);
    if (e.stun > 0) return;
    const h = this.hero; const distance = h.x - e.x; e.facing = distance < 0 ? -1 : 1;
    if (e.type === 'sesshomaru') { this.updateSesshomaru(e, dt); return; }
    if (e.type === 'yura') { this.updateBoss(e, dt); return; }
    e.timer -= dt;
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        if (e.flying) {
          const dx = h.x + 15 - (e.x + e.w / 2), dy = h.y + 32 - (e.y + e.h / 2), length = Math.hypot(dx, dy) || 1;
          this.projectiles.push({ owner: 'enemy', x: e.x + e.w / 2, y: e.y + e.h / 2, vx: dx / length * 220, vy: dy / length * 220, w: 12, h: 10, life: 3, damage: e.damage, color: '#d4a1c4' });
        } else {
          const box = { x: e.facing > 0 ? e.x : e.x - 65, y: e.y - 8, w: e.w + 65, h: e.h + 10 };
          if (overlaps(h, box)) this.damageHero(e.damage, e.facing);
          this.effects.push({ type: 'enemySlash', x: e.x + e.w / 2 + e.facing * 35, y: e.y + e.h / 2, facing: e.facing, life: 0.2, color: '#ec9e9a' });
        }
        e.timer = e.type === 'centipede' ? 1.15 : 1.6;
      }
      return;
    }
    const range = e.flying ? 350 : e.w + 35;
    if (Math.abs(distance) < range && Math.abs(h.y - e.y) < 160 && e.timer <= 0) e.windup = e.type === 'centipede' ? 0.85 : 0.65;
    else if (Math.abs(distance) > range * 0.7) {
      const next = e.x + e.facing * e.speed * dt;
      if (e.flying || !this.level.gaps.some(([x, w]) => next + e.w / 2 > x && next + e.w / 2 < x + w)) e.x = next;
    }
    if (e.flying) e.y = FLOOR - e.h - 70 + Math.sin(this.time * 3 + e.seed) * 18;
  }

  updateBoss(e, dt) {
    const h = this.hero;
    if (e.hp < e.maxHp * 0.5 && e.phase === 1) { e.phase = 2; e.timer = 1.8; this.emit('toast', '结罗怒意升腾 · 注意连续的攻击预警'); this.shake = 7; }
    e.timer -= dt;
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        const type = e.pattern % 3;
        if (type === 0) {
          const box = { x: e.x - 115, y: FLOOR - 65, w: e.w + 230, h: 75 };
          if (overlaps(h, box)) this.damageHero(e.damage, e.facing);
          this.effects.push({ type: 'slash', x: e.x + 20, y: FLOOR - 40, facing: e.facing, big: true, life: 0.32, color: '#e4a4cc' });
        } else if (type === 1) {
          const dx = h.x - e.x, dy = h.y + 32 - (e.y + 30), base = Math.atan2(dy, dx);
          const hits = new Set();
          for (let i = -2; i <= 2; i++) { const a = base + i * 0.15; this.projectiles.push({ owner: 'enemy', x: e.x + 20, y: e.y + 30, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, w: 15, h: 8, life: 4, damage: 18, hits, color: '#e0abc9' }); }
        } else {
          for (let i = -1; i <= 1; i++) this.projectiles.push({ owner: 'enemy', x: e.targetX + i * 95, y: 80, vx: 0, vy: 510, w: 14, h: 55, life: 1, damage: 23, color: '#ed9da8' });
        }
        e.pattern++; e.timer = e.phase === 2 ? 1.1 : 1.65;
      }
      return;
    }
    if (e.timer <= 0) { e.windup = e.phase === 2 ? 0.72 : 0.95; e.targetX = h.x; }
    else if (Math.abs(h.x - e.x) > 100) e.x += e.facing * e.speed * dt;
  }

  updateSesshomaru(e, dt) {
    const h = this.hero;
    if (e.phase === 1 && e.hp <= e.maxHp * 0.5) {
      e.phase = 2; e.windup = 0; e.timer = 1.6; e.pattern = 0;
      e.w = 150; e.h = 118; e.y = FLOOR - e.h;
      this.projectiles = []; cancelInuyasha(this);
      this.showDialogue('fangAwaken', () => {
        this.events.add('fang-awaken'); this.grow('tessaiga');
        this.health.inuyasha = Math.min(statsFor('inuyasha', this.save.heroes.inuyasha).maxHp, this.health.inuyasha + 32);
        this.store();
      });
      return;
    }
    e.timer -= dt;
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        const type = e.pattern % 2;
        if (type === 0) {
          const box = { x: e.targetX - (e.phase === 2 ? 85 : 55), y: FLOOR - 100, w: e.phase === 2 ? 170 : 110, h: 105 };
          e.x = clamp(e.targetX - e.w / 2, this.level.bossX - 450, this.level.length - e.w - 80);
          if (overlaps(h, box)) this.damageHero(e.damage, e.facing, 'demon');
          this.effects.push({ type: 'enemySlash', x: e.targetX, y: FLOOR - 40, facing: e.facing, life: 0.3, color: '#92e2a6' });
        } else {
          const base = Math.atan2(h.y + 30 - (e.y + 35), h.x + 15 - (e.x + e.w / 2));
          const hits = new Set();
          for (let i = -1; i <= 1; i++) this.projectiles.push({ owner: 'enemy', x: e.x + e.w / 2, y: e.y + 35, vx: Math.cos(base + i * 0.2) * 275, vy: Math.sin(base + i * 0.2) * 275, w: 15, h: 11, life: 3, damage: 17, hits, damageType: 'demon', color: '#93e1a4' });
        }
        e.pattern++; e.timer = e.phase === 2 ? 1.1 : 1.5;
      }
      return;
    }
    if (e.timer <= 0) { e.windup = e.phase === 2 ? 0.85 : 1; e.targetX = h.x + h.w / 2; }
    else if (Math.abs(h.x - e.x) > 130) e.x += e.facing * e.speed * dt;
    e.x = clamp(e.x, this.level.bossX - 450, this.level.length - e.w - 80);
  }

  updateProjectiles(dt) {
    for (const p of this.projectiles) {
      if (p.life <= 0) continue;
      if (p.kind === 'bloodBlade') { updateBloodBlade(this, p, dt); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) continue;
      if (p.owner === 'hero') {
        for (const silk of this.projectiles) if (silk.life > 0 && silk.kind === 'silk' && overlaps(p, silk)) { silk.life = 0; if (!p.pierce) { p.life = 0; break; } }
        if (p.life <= 0) continue;
        for (const enemy of this.enemies) if (enemy.hp > 0 && !p.hits.has(enemy) && overlaps(p, enemy)) { this.hitEnemy(enemy, p.damage, Math.sign(p.vx), p.pierce ? 24 : 7, p.damageType); p.hits.add(enemy); if (!p.pierce) { p.life = 0; break; } }
        if (p.life > 0) for (const anchor of this.anchors) if (anchor.hp > 0 && !p.hits.has(anchor) && overlaps(p, anchor)) { this.damageAnchor(anchor, p.damage * 1.5); p.hits.add(anchor); if (!p.pierce) { p.life = 0; break; } }
      } else if (overlaps(p, this.hero)) {
        const target = this.active;
        if (!p.hits?.has(target)) {
          p.hits?.add(target);
          if (this.damageHero(p.damage, Math.sign(p.vx) || 1, p.damageType || 'demon') && p.kind === 'silk') this.applyStatus('slow', target);
        }
        p.life = 0;
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0 && p.y < 600);
  }
}
