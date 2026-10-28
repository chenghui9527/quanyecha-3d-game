import { Game } from './engine.js';
import { Renderer } from './art.js';
import { SCENE_ASSETS } from './scenery.js';
import { freshSave } from './save.js';
import { FLOOR, LEVELS } from './data.js';

const sceneCanvas = document.querySelector('#scene-game'), sceneRenderer = new Renderer(sceneCanvas);
const scenePosition = document.querySelector('#scene-position'), sceneStatus = document.querySelector('#scene-status');
const sceneViews = { opening: [0, 140], forest: [0, 1370], village: [1, 785], shrine: [0, LEVELS[0].length - 480], night: [2, 1350], yura: [3, 1150] };
const sceneNotes = {
  tree: '分层叶簇、老树皮、藤蔓与外露树根；沿森林道路复用。',
  sacred: '更粗的树干与注连绳，承接第一关解除封印的剧情。',
  house: '茅草屋顶、木梁、土墙与格窗，门口与木门分开制作。',
  door: '关闭 / 打开两种状态；两帧共用尺寸与落地基准。',
  well: '低矮方形木井、厚木梁、幽暗井口与苔藓。',
  terrain: '泥土地面与薄岩台各含左端、中段、右端；对齐碰撞线。',
  torii: '朱红木柱、深色横梁、注连绳与纸垂；各关道路尽头的神社入口。'
};
document.querySelector('#scene-library').innerHTML = Object.entries(SCENE_ASSETS).map(([id, spec], i) => `<article class="scene-card"><canvas width="340" height="210" data-scene-asset="${id}" aria-label="${spec.name}"></canvas><span class="scene-number">0${i + 1}</span><h3>${spec.name}</h3><p>${sceneNotes[id]}</p></article>`).join('');
let sceneGame, sceneInput = {}, sceneTime = 0, scenePrevious = performance.now(), sceneCurrent = 'opening';

function resetScene(view) {
  sceneCurrent = view;
  const [stage, x] = sceneViews[view], save = freshSave();
  save.unlocked = ['kagome', 'inuyasha']; save.unlockedStage = 3;
  sceneGame = new Game(save, () => {}, { setItem() {} }); sceneGame.start(stage);
  // Reuse the real map and physics while keeping this inspection free of
  // encounters, chapter progression and writes to the player's main save.
  sceneGame.lab = true; sceneGame.state = 'playing'; sceneGame.dialogue = null;
  sceneGame.level = { ...sceneGame.level, checkpoints: [], relics: [], encounters: [], storyEvents: [], traps: [], bossX: null };
  sceneGame.active = document.querySelector('#scene-hero').value;
  sceneGame.debugHitboxes = document.querySelector('#scene-hitboxes').checked;
  sceneInput = {}; moveSceneTo(x);
  document.querySelectorAll('[data-scene-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sceneView === view)));
  document.querySelector('#scene-door').disabled = view !== 'village';
  sceneCanvas.focus({ preventScroll: true });
}

function moveSceneTo(x) {
  sceneGame.hero.x = x; sceneGame.hero.y = FLOOR - sceneGame.hero.h; sceneGame.hero.vx = 0; sceneGame.hero.vy = 0;
  sceneGame.hero.grounded = true; sceneGame.camera = Math.max(0, Math.min(sceneGame.level.length - 960, x - 340));
  scenePosition.max = sceneGame.level.length - 80; scenePosition.value = x;
}

function drawSceneCatalog() {
  for (const canvas of document.querySelectorAll('[data-scene-asset]')) {
    const id = canvas.dataset.sceneAsset, ctx = canvas.getContext('2d'), entry = sceneRenderer.scenery.entries[id];
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#b9bda133'; ctx.fillRect(12, 195, 316, 1);
    if (!entry.frames) continue;
    if (id === 'terrain') {
      for (let i = 0; i < 6; i++) {
        const f = entry.frames[i], x = 16 + i % 3 * 104, feet = i < 3 ? 105 : 186;
        ctx.drawImage(entry.sheet, f.sx, f.sy, f.w, f.h, x, feet - 66, 100, 66);
      }
    } else if (id === 'door') {
      sceneRenderer.scenery.sprite(ctx, id, 100, 195, 168, 0);
      sceneRenderer.scenery.sprite(ctx, id, 240, 195, 168, 1);
    } else {
      const f = entry.frames[0], height = Math.min(185, 308 * f.h / f.w);
      sceneRenderer.scenery.sprite(ctx, id, 170, 195, height);
    }
  }
}

const sceneKeys = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', KeyE: 'interact', Enter: 'interact' };
window.addEventListener('keydown', event => {
  if (event.target !== sceneCanvas || !sceneKeys[event.code]) return;
  event.preventDefault(); sceneInput[sceneKeys[event.code]] = true;
});
window.addEventListener('keyup', event => { if (sceneKeys[event.code]) sceneInput[sceneKeys[event.code]] = false; });
window.addEventListener('blur', () => { sceneInput = {}; });
document.addEventListener('visibilitychange', () => { if (document.hidden) sceneInput = {}; });
document.querySelectorAll('[data-scene-view]').forEach(button => button.addEventListener('click', () => resetScene(button.dataset.sceneView)));
document.querySelector('#scene-hero').addEventListener('change', event => { sceneGame.active = event.target.value; sceneCanvas.focus({ preventScroll: true }); });
document.querySelector('#scene-hitboxes').addEventListener('change', event => { sceneGame.debugHitboxes = event.target.checked; sceneCanvas.focus({ preventScroll: true }); });
scenePosition.addEventListener('input', () => { sceneInput = {}; moveSceneTo(Number(scenePosition.value)); });
document.querySelector('#scene-door').addEventListener('click', () => {
  const door = sceneGame.sceneObjects.find(object => object.door);
  if (!door) return;
  sceneInput = {}; sceneGame.previous = {};
  moveSceneTo(door.x - 65); sceneGame.interactScene(); sceneCanvas.focus({ preventScroll: true });
});

function sceneFrame(now) {
  const dt = Math.max(0, Math.min((now - scenePrevious) / 1000, 0.05)); scenePrevious = now; sceneTime += dt;
  sceneGame.update(dt, sceneInput); sceneRenderer.render(sceneGame, sceneTime);
  scenePosition.value = Math.round(sceneGame.hero.x);
  document.querySelector('#scene-coordinate').textContent = `${Math.round(sceneGame.hero.x)} / ${sceneGame.level.length}`;
  const firstDoor = sceneGame.sceneObjects.find(object => object.door);
  document.querySelector('#scene-door').textContent = firstDoor && sceneGame.openDoors.has(firstDoor.id) ? '查看关门' : '查看开门';
  requestAnimationFrame(sceneFrame);
}
resetScene(sceneCurrent);
sceneRenderer.scenery.ready.then(() => {
  const failed = Object.values(sceneRenderer.scenery.entries).filter(entry => entry.error);
  sceneStatus.textContent = failed.length ? `有 ${failed.length} 类素材未能载入，请重新打开页面。` : `${Object.keys(SCENE_ASSETS).length} 类素材已载入。可切换场景、拖动位置或走到门前查看细节。`;
  drawSceneCatalog();
});
requestAnimationFrame(sceneFrame);
