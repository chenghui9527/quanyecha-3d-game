import { Game } from './engine.js';
import { Renderer } from './art.js';
import { MONSTERS, MONSTER_IDS, isAttacking } from './monsters.js';
import { freshSave } from './save.js';
import { FLOOR, HEROES, statsFor } from './data.js';
import { Audio } from './audio.js';
import { INUYASHA_MOVES } from './inuyasha.js';
import { launchMonster } from './monsters.js';

const labCanvas = document.querySelector('#lab-game');
const labRenderer = new Renderer(labCanvas);
const labAudio = new Audio();
document.addEventListener('pointerdown', () => labAudio.unlock(), { once: true });
const labSelect = document.querySelector('#lab-species');
const labCount = document.querySelector('#lab-count');
const labMixed = { ground: ['spider', 'spider', 'crow'], venom: ['spider', 'hornet', 'hornet'], landing: ['harpy', 'rat', 'rat'], swarm: Array(5).fill('rat'), basicGround: ['crawler', 'maw', 'manyeye'], basicMixed: ['beetle', 'tongue', 'eyeball'], villageHorde: ['wingface', 'humpneck', 'crawler'], templeHorde: ['cyclops', 'skullwhisker', 'tongue'] };
labSelect.innerHTML = '<option value="training">犬夜叉 · 动作练习</option>' + MONSTER_IDS.map(id => `<option value="${id}">${MONSTERS[id].basic ? '基础小怪 · ' : ''}${MONSTERS[id].name}</option>`).join('') + '<option value="ground">蜘蛛头＋尸舞鸦</option><option value="venom">蜘蛛头＋最猛胜</option><option value="landing">极乐鸟＋妖鼠</option><option value="swarm">妖鼠群连续3波</option><option value="basicGround">基础小怪 · 多足＋巨口＋多眼</option><option value="basicMixed">基础小怪 · 甲虫＋长舌＋眼球</option><option value="villageHorde">基础小怪 · 翼膜＋瘤背＋多足</option><option value="templeHorde">基础小怪 · 青面＋骷面＋长舌</option>';
document.querySelector('#lab-catalog').innerHTML = MONSTER_IDS.map(id => `<article><canvas width="230" height="140" data-lab-portrait="${id}" aria-label="${MONSTERS[id].name}"></canvas><h2>${MONSTERS[id].name}</h2><p>${MONSTERS[id].role}<br>${MONSTERS[id].move}</p></article>`).join('');
let labGame, labInput = {}, labTime = 0, labPrevious = performance.now(), labMessage = '', labWave = 1, labWaveWait = 0, labScenario = '', labPreview = false, labDemo = null, labFrozenAction = null;
const labStorage = { setItem() {} };

function resetLab() {
  const labSave = freshSave(); labSave.unlocked = ['inuyasha', 'kagome'];
  labGame = new Game(labSave, (kind, value) => { if (kind === 'toast') labMessage = value; if (kind === 'sound') labAudio.play(value); }, labStorage);
  labGame.lab = true; labGame.start(0);
  labGame.state = 'playing'; labGame.dialogue = null;
  labGame.level = { id: 0, badge: '验', name: '妖怪验证场', palette: 'forest', length: 1800, gaps: [], platforms: [], checkpoints: [], relics: [], encounters: [], storyEvents: [], traps: [] };
  labGame.platforms = [{ x: 0, y: FLOOR, w: 2000, h: 100 }];
  labGame.hero.x = 300; labGame.hero.y = FLOOR - labGame.hero.h; labGame.hero.grounded = true; labGame.camera = 0;
  labGame.debugHitboxes = document.querySelector('#lab-hitboxes').checked;
  labScenario = labSelect.value; labPreview = false; labWave = 1; labWaveWait = 0;
  labCount.disabled = labScenario === 'training' || Boolean(labMixed[labScenario]);
  const ids = labScenario === 'training' ? ['harpy'] : labMixed[labScenario] || Array(Number(labCount.value)).fill(labScenario);
  ids.forEach((id, i) => {
    const e = labGame.spawnEnemy(id, (labScenario === 'training' ? 355 : 540) + i * 68);
    if (id === 'spider') e.spitter = i % 2 === 1 || ids.length === 1 || labScenario === 'venom';
    if (labScenario === 'training') Object.assign(e, { training: true, hp: 10000, maxHp: 10000, y: FLOOR - e.h, state: 'idle', stateClock: 0 });
  });
  labDemo = null; labFrozenAction = null;
  labInput = {}; labMessage = '已重置 · 击败全部怪物后可更换组合再试';
  labCanvas.focus({ preventScroll: true });
}
const labKeys = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyS: 'down', ArrowDown: 'down', Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', KeyJ: 'attack', KeyK: 'dodge', ShiftLeft: 'dodge', ShiftRight: 'dodge', KeyU: 'skill1', KeyI: 'skill2', Digit1: 'one', Digit2: 'two', Tab: 'switch' };
window.addEventListener('keydown', event => {
  if (event.target !== labCanvas) return;
  if (event.code === 'Escape') { event.preventDefault(); if (labGame.state === 'paused') labGame.resume(); else labGame.pause(); return; }
  if (labKeys[event.code]) { event.preventDefault(); labDemo = null; labInput[labKeys[event.code]] = true; }
});
window.addEventListener('keyup', event => { if (labKeys[event.code]) labInput[labKeys[event.code]] = false; });
window.addEventListener('blur', () => { labInput = {}; labGame.pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { labInput = {}; labGame.pause(); } });
document.querySelector('#lab-reset').addEventListener('click', resetLab);
labSelect.addEventListener('change', resetLab);
labCount.addEventListener('change', resetLab);
document.querySelector('#lab-hero').addEventListener('click', () => { if (labGame.state === 'paused') labGame.resume(); labGame.switchCooldown = 0; labGame.switchTo(labGame.active === 'inuyasha' ? 'kagome' : 'inuyasha'); labCanvas.focus(); });
document.querySelector('#lab-heal').addEventListener('click', () => { labGame.clearStatuses(); for (const id of labGame.save.unlocked) labGame.health[id] = statsFor(id, labGame.save.heroes[id]).maxHp; labGame.state = 'playing'; labGame.invulnerable = 1; labCanvas.focus(); });
document.querySelector('#lab-hitboxes').addEventListener('change', event => { labGame.debugHitboxes = event.target.checked; labCanvas.focus(); });
document.querySelector('#lab-slow').addEventListener('change', () => labCanvas.focus());
document.querySelector('#lab-freeze').addEventListener('change', () => { if (labGame.state === 'paused') labGame.resume(); labCanvas.focus(); });

document.querySelectorAll('[data-lab-move]').forEach(button => button.addEventListener('click', () => {
  resetLab();
  const id = button.dataset.labMove, h = labGame.hero, target = labGame.enemies[0];
  labPreview = true;
  const targetX = h.x + (id === 'scatter' ? 110 : id === 'blood' ? 330 : id === 'plunge' ? 20 : 55), offsetX = targetX - target.x;
  for (const enemy of labGame.enemies) {
    enemy.x += offsetX;
    // Preview the chosen species with a durable, passive target so a light
    // monster does not die before its body-level hit feedback can be seen.
    Object.assign(enemy, { training: true, hp: 10000, maxHp: 10000, y: FLOOR - enemy.h, state: 'idle', stateClock: 0, timer: 0.8 });
  }
  labMessage = button.textContent.trim();
  if (id === 'combo' || id === 'chain') {
    labDemo = { steps: id === 'combo' ? ['claw1', 'claw2', 'claw3'] : ['claw1', 'claw2', 'upper', 'jump', 'air1', 'air2', 'plunge', 'scatter', 'blood'], index: 0, wait: 0 };
  } else {
    if (id === 'air1' || id === 'plunge') {
      h.y -= id === 'plunge' ? 145 : 85; h.grounded = false;
      if (id === 'air1') { target.y -= 85; launchMonster(target, 0); }
      else target.x = h.x + 20;
    }
    labGame.attack(id === 'scatter' ? 0 : id === 'blood' ? 1 : -1, id);
  }
  labCanvas.focus({ preventScroll: true });
}));

function demoInput(dt) {
  if (!labDemo || labGame.state !== 'playing') return labInput;
  labDemo.wait += dt;
  const id = labDemo.steps[labDemo.index];
  if (!id) {
    if (!labGame.action && !labGame.projectiles.some(p => p.kind === 'bloodBlade' && p.life > 0)) { labDemo = null; labMessage = '演示完成 · 可点击招式重看，或用键盘自由练习'; }
    return {};
  }
  if (labDemo.wait > 3) { labDemo = null; labMessage = '演示结束 · 可重置后继续练习'; return {}; }
  if (id === 'jump') {
    if (labGame.action?.id === 'upper' && labGame.action.elapsed >= 0.14) { labDemo.index++; labDemo.wait = 0; return { jump: true }; }
  } else if (labGame.attack(id === 'scatter' ? 0 : id === 'blood' ? 1 : -1, id)) { labDemo.index++; labDemo.wait = 0; }
  return {};
}

function labFrame(now) {
  const dt = Math.max(0, Math.min((now - labPrevious) / 1000, 1 / 30)) * (document.querySelector('#lab-slow').checked ? 0.25 : 1); labPrevious = now; labTime += dt;
  labGame.update(dt, demoInput(dt));
  const action = labGame.action;
  if (document.querySelector('#lab-freeze').checked && labGame.state === 'playing' && action && action !== labFrozenAction && action.elapsed >= INUYASHA_MOVES[action.id].windup + (action.id === 'blood' ? 0.14 : action.id === 'scatter' ? 0.09 : 0.055)) { labFrozenAction = action; labGame.pause(); }
  labRenderer.render(labGame, labTime);
  labAudio.update(dt, labGame.state === 'playing');
  for (const canvas of document.querySelectorAll('[data-lab-portrait]')) labRenderer.monsterPortrait(canvas, canvas.dataset.labPortrait, labTime);
  const live = labGame.enemies.filter(e => e.hp > 0), status = labGame.statuses[labGame.active];
  if (labScenario === 'swarm' && labWave < 3 && live.length === 0 && labGame.state === 'playing') {
    labWaveWait += dt;
    if (labWaveWait >= 0.85) { labWave++; labWaveWait = 0; for (let i = 0; i < 5; i++) labGame.spawnEnemy('rat', Math.min(labGame.hero.x + 250, labGame.level.length - 420) + i * 65); }
  }
  const move = labGame.action ? ` · ${INUYASHA_MOVES[labGame.action.id].name}` : '';
  const scenarioName = labScenario === 'training' ? '动作练习' : MONSTERS[labScenario]?.name || (labScenario === 'swarm' ? '妖鼠群连续3波' : '混合遭遇');
  document.querySelector('#lab-status').textContent = `${HEROES[labGame.active].name} ${Math.ceil(labGame.health[labGame.active])} / ${statsFor(labGame.active, labGame.save.heroes[labGame.active]).maxHp}${move} · ${scenarioName}${labPreview ? ' · 耐打预览' : ''} · 在场 ${live.length} · 进攻 ${live.filter(isAttacking).length} / 2${labScenario === 'training' || labPreview ? ` · 练习伤害 ${Math.round(10000 - (live[0]?.hp ?? 0))}` : ''}${labScenario === 'swarm' ? ` · 第${labWave} / 3波` : ''}${status.poison.length ? ' · 中毒' : ''}${status.slow > 0 ? ' · 减速' : ''}${labGame.state === 'paused' ? ' · 已暂停，Esc继续' : labGame.state === 'dead' ? ' · 队伍倒下，可恢复或重置' : ''} ｜ ${labMessage}`;
  requestAnimationFrame(labFrame);
}
resetLab(); requestAnimationFrame(labFrame);
