import { HEROES, LEVELS, CHAPTERS, SPEAKERS, HEIGHT, FLOOR, statsFor } from './data.js';
import { SHARDS, GROWTH_EVENTS, jewelProgress } from './campaign.js';
import { loadSave, normalizeSave, persist, newJourneySave } from './save.js';
import { FACTIONS } from './factions.js';
import { Game } from './engine.js';
import { Renderer } from './art.js';
import { Audio } from './audio.js';
import { MONSTERS, MONSTER_IDS } from './monsters.js';
import { partyView, energyView, objectiveText, relicCount, cooldownView } from './hud.js';
import { nearbySceneDoor } from './scenery.js';

const $ = selector => document.querySelector(selector);
const loaded = loadSave();
let save = loaded.save, hasSave = loaded.exists;
const renderer = new Renderer($('#game')), audio = new Audio();
let input = {}, game = new Game(save, onEvent), lastFrame = performance.now(), elapsed = 0, lastHud = 0, toastTimer;
let resumeAfterPanel = false, partySignature = '';
let selectedFaction = 'inuyasha', factionReturnFocus = null;
let panelJournalTab = null, panelReturnFocus = null, importReturnJournal = false;
let actionSignature = '';
const queuedActions = new Set();
const panel = $('#panel');
const isTouch = matchMedia('(pointer: coarse)').matches;
// Leave room for the visible grass/soil road edge below the collision line.
$('#battle-frame').style.setProperty('--road-bottom', `${(FLOOR + 12) / HEIGHT * 100}%`);
const timeText = seconds => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
const starsText = stars => '★'.repeat(stars) + '☆'.repeat(3 - stars);

function toast(message) {
  clearTimeout(toastTimer); const el = $('#toast'); el.textContent = message; el.hidden = false;
  toastTimer = setTimeout(() => { el.hidden = true; }, 3100);
}
function updateSummary() {
  $('#play-label').textContent = hasSave ? '继续旅程' : '开始旅程';
  $('#new-game-button').hidden = !hasSave;
  for (const button of document.querySelectorAll('[data-sound-toggle]')) {
    button.querySelector('.sound-label').textContent = save.sound ? '声音' : '静音';
    button.setAttribute('aria-label', save.sound ? '关闭声音' : '开启声音');
    button.setAttribute('aria-pressed', String(save.sound));
  }
  audio.enabled = save.sound;
}
function setHome(home) {
  $('.app-shell').classList.toggle('playing', !home);
  $('.app-shell').classList.remove('choosing-faction');
  $('#faction-screen').hidden = true;
  $('#battle-frame').hidden = home;
  $('#home-screen').hidden = !home; $('#hud').hidden = home; $('#combat-bottom').hidden = home;
  $('#touch-controls').hidden = home || !isTouch; $('#stage').classList.toggle('touch-mode', !home && isTouch);
  if (home) { $('#boss-hud').hidden = true; $('#dialogue').hidden = true; }
}
function goHome() {
  input = {}; game.store(); game.state = 'menu'; setHome(true); updateSummary();
}
function beginStage(index, resume = false) {
  resumeAfterPanel = false; if (panel.open) panel.close(); input = {}; audio.unlock();
  setHome(false); hasSave = true; partySignature = ''; game.start(index, resume); updateSummary();
  $('#game').focus({ preventScroll: true });
}
function showPanel(title, eyebrow, html, journalTab = null) {
  input = {};
  if (!panel.open) { panelReturnFocus = document.activeElement; resumeAfterPanel = game.pause(); }
  panelJournalTab = journalTab;
  panel.classList.toggle('journey-panel', !!journalTab);
  $('#journal-tabs').hidden = !journalTab; $('#journal-footer').hidden = !journalTab;
  $('#panel-title').textContent = journalTab ? '旅途手记' : title;
  $('#panel-eyebrow').textContent = journalTab ? '游戏已暂停' : eyebrow;
  $('#panel-content').setAttribute('role', journalTab ? 'tabpanel' : 'region');
  for (const tab of document.querySelectorAll('[data-journal]')) {
    const selected = tab.dataset.journal === journalTab;
    tab.id = `journal-tab-${tab.dataset.journal}`;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
  }
  if (journalTab) {
    $('#panel-content').setAttribute('aria-labelledby', `journal-tab-${journalTab}`);
    $('#journal-retry').textContent = save.checkpoint?.stage === game.level.id ? '从检查点重试' : '从本幕起点重试';
  } else $('#panel-content').removeAttribute('aria-labelledby');
  $('#panel-content').innerHTML = html;
  if (!panel.open) panel.showModal();
}
panel.addEventListener('close', () => {
  input = {};
  if (resumeAfterPanel && game.state === 'paused') game.resume();
  else if (['victory', 'dead', 'ending'].includes(game.state)) goHome();
  resumeAfterPanel = false;
  panelJournalTab = null;
  if (!$('#faction-screen').hidden) $('#faction-start').focus();
  else if (game.state === 'playing') $('#game').focus({ preventScroll: true });
  else if (panelReturnFocus?.isConnected && !panelReturnFocus.closest('[hidden]')) panelReturnFocus.focus({ preventScroll: true });
});
$('#panel-close').addEventListener('click', () => panel.close());
panel.addEventListener('click', event => { if (event.target === panel) { const rect = panel.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) panel.close(); } });

function chapters() {
  showPanel('第一阶段 · 玉碎与启程', `CHAPTERS · ${FACTIONS[save.faction].name}`, `<p class="panel-description">前三篇共六幕。完成前一幕，解锁下一幕；已完成的道路可以重访。寻找碎片的旅途会继续。</p>${CHAPTERS.map(chapter => `<section class="chapter-section"><h3><span>${chapter.id}</span> ${chapter.name}</h3><p class="panel-description">${chapter.summary}</p><div class="chapter-grid">${chapter.stages.map(id => {
    const level = LEVELS[id], locked = id > save.unlockedStage;
    return `<button class="chapter-card ${locked ? 'locked' : ''}" data-stage="${id}" ${locked ? 'disabled' : ''}><div class="chapter-art ${level.palette}"><span class="chapter-number">${level.badge}</span></div><div class="chapter-details"><h3>${level.name}</h3><p>${level.subtitle}</p><div><span class="stars">${save.completed.includes(id) ? starsText(save.stars[id] || 1) : '☆☆☆'}</span><span>${locked ? '尚未解锁' : save.completed.includes(id) ? '再访此地 →' : '踏上旅途 →'}</span></div></div></button>`;
  }).join('')}</div></section>`).join('')}`);
  document.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click', () => beginStage(Number(button.dataset.stage))));
}
function heroes(journal = false) {
  showPanel('并肩的伙伴', 'COMPANIONS · 剧情成长', `<p class="panel-description">人物随指定剧情成长，技能与武器在相应故事节点解锁。已完成的成长只记录一次。</p><div class="heroes-layout">${Object.entries(HEROES).map(([id, hero]) => {
    const unlocked = save.unlocked.includes(id), progress = save.heroes[id], stats = statsFor(id, progress);
    const growth = save.growthEvents.filter(key => GROWTH_EVENTS[key].hero === id).map(key => GROWTH_EVENTS[key].name);
    const energy = energyView(game, id);
    return `<article class="hero-card ${unlocked ? '' : 'locked'}"><div class="hero-card-top"><canvas class="hero-large-portrait" data-portrait="${id}" width="100" height="130"></canvas><div><h3>${hero.name}</h3><small>${hero.title}</small><span class="hero-role">${hero.role}</span></div></div><p class="hero-description">${hero.description}</p><div class="stat-line"><span>${unlocked ? '人物阶段' : '获得方式'}</span><b>${unlocked ? stats.stageName : '封印之森 · 主线加入'}</b></div><div class="stat-line"><span>生命上限 / 物理攻击</span><b>${stats.maxHp} / ${stats.damage}</b></div><div class="stat-line"><span>${energy.label}储量</span><b>${energy.text}</b></div><div class="stat-line"><span>${energy.label}强度</span><b>${stats.power}</b></div><div class="skill-description">${hero.skill.join(' · ')}<br>${id === 'inuyasha' ? progress.unlocks.includes('tessaiga-awaken') ? '铁碎牙 · 已觉醒（普通攻击为刀斩）' : progress.unlocks.includes('tessaiga') ? '铁碎牙 · 锈刀，尚未觉醒' : '铁碎牙 · 父亲的墓地中等待继承' : '灵光守护 · 为自己开启短时结界'}<br>已完成：${growth.join('、') || '等待故事中的转变'}</div></article>`;
  }).join('')}</div>`, journal ? 'heroes' : null);
  document.querySelectorAll('[data-portrait]').forEach(canvas => renderer.character(canvas.getContext('2d'), canvas.dataset.portrait, 45, 130, 0, 1, 0, 1.27));
}
const shareText = units => `${(units / 100).toFixed(1).replace(/\.0$/, '')}%`;
function jewelPanel(journal = false) {
  const progress = jewelProgress(save);
  showPanel('四魂之玉', 'SHIKON JEWEL · 争夺进度', `<p class="panel-description">${save.jewel.started ? '双方争夺同一颗玉。任意一方集齐全部份额，立即确定胜负。敌方具体行动需通过剧情与侦察查明。' : '四魂之玉尚未破碎，收集争夺尚未开始。'}</p><div class="jewel-comparison">${[['inuyasha','犬夜叉阵营'],['naraku','奈落阵营'],['world','尚未归属双方']].map(([key,label]) => `<div class="jewel-row"><div><span>${label}</span><strong>${save.jewel.started ? shareText(progress[key]) : '—'}</strong></div><div class="jewel-track ${key}"><i style="width:${save.jewel.started ? progress[key]/100 : 0}%"></i></div></div>`).join('')}</div><h3>已掌握的碎片线索</h3><div class="shard-list">${save.jewel.known.length ? save.jewel.known.map(id => `<p><span>${SHARDS[id].name}</span><b>${shareText(SHARDS[id].share)} · ${save.jewel.owners[id] === 'inuyasha' ? '我方持有' : '归属已变化'}</b></p>`).join('') : '<p>先在旅途中寻找碎片。</p>'}</div><p class="settings-note">持有份额与已知情报分别记录。尚未查明的持玉者和位置不会在此公开。</p>`, journal ? 'jewel' : null);
}
function bestiary(journal = false) {
  const known = save.bestiary;
  showPanel('妖怪图鉴', 'BESTIARY · 战国妖异', `<p class="panel-description">记录旅途中遇见的妖怪。首次击败后，收录它的形貌、来历与应对之法。<span class="bestiary-count">已收录 ${known.length} / ${MONSTER_IDS.length}</span></p><div class="bestiary-grid">${MONSTER_IDS.map((id, index) => {
    if (!known.includes(id)) return `<article class="monster-card unknown"><span class="monster-index">${String(index + 1).padStart(2, '0')}</span><div class="monster-unknown" aria-hidden="true">?</div><h3>尚未遇见</h3><p>继续旅途，发现新的妖怪。</p></article>`;
    const m = MONSTERS[id];
    return `<article class="monster-card"><span class="monster-index">${String(index + 1).padStart(2, '0')}</span><canvas width="260" height="135" data-monster-preview="${id}" aria-label="${m.name}像素形象"></canvas><div class="monster-heading"><h3>${m.name}</h3><span>${m.role}</span></div><p>${m.lore}</p><dl><dt>出没之地</dt><dd>${m.region}</dd><dt>攻击方式</dt><dd>${m.move}</dd><dt>应对之法</dt><dd>${m.tip}</dd></dl></article>`;
  }).join('')}</div>`, journal ? 'bestiary' : null);
}
function toggleSound() { save.sound = !save.sound; audio.unlock(); audio.enabled = save.sound; if (hasSave) game.store(); updateSummary(); }
function settings(journal = false) {
  const running = ['playing', 'paused'].includes(game.state);
  showPanel(journal ? '片刻休憩' : '旅途指南', 'CONTROLS & SETTINGS', `<div class="settings-grid"><section><h3>掌握你的步伐</h3><div class="controls-list"><span>左右移动</span><span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd></span><span>跳跃</span><span><kbd>Space</kbd> / <kbd>W</kbd> / <kbd>↑</kbd></span><span>普通攻击 · 可按住</span><span><kbd>J</kbd></span><span>犬夜叉上挑 / 空中下砸</span><span><kbd>S</kbd> / <kbd>↓</kbd> ＋ <kbd>J</kbd></span><span>犬夜叉空中追打</span><span>跳跃后 <kbd>J</kbd></span><span>闪避 · 短暂无敌</span><span><kbd>K</kbd> / <kbd>Shift</kbd></span><span>主动技能</span><span><kbd>U</kbd> <kbd>I</kbd></span><span>切换犬夜叉 / 戈薇</span><span><kbd>1</kbd> <kbd>2</kbd> / <kbd>Tab</kbd></span><span>继续对话</span><span><kbd>E</kbd> / <kbd>Enter</kbd></span><span>暂停 / 继续</span><span><kbd>Esc</kbd></span></div><p class="settings-note">犬夜叉可用上挑将普通妖怪打浮空，再跳起追打，空中按S＋J下砸；飞刃血爪可从远处穿透多只妖怪。观察敌人头上的感叹号，及时闪避或跳跃。戈薇的箭会辅助瞄准前方目标；灵光守护为戈薇开启耐久结界，破界的一击不会溢出伤及本体。神社灯笼会保存检查点并恢复队伍。</p></section><section><h3>整装再出发</h3><div class="settings-actions">${running && !journal ? '<button class="button primary" id="resume-game">继续旅程 →</button><button class="button secondary" id="restart-checkpoint">从检查点重试</button>' : ''}<button class="button secondary" id="settings-sound">${save.sound ? '♫ 关闭声音' : '♩ 开启声音'}</button><button class="button secondary" id="export-save">导出存档</button><button class="button secondary" id="import-save">导入存档</button>${running && !journal ? '<button class="button secondary" id="return-home">返回首页</button>' : ''}<p class="settings-note">进度自动保存在当前浏览器。导出存档可保留备份，或将旅程带到另一台设备。导入将替换当前进度。</p></div></section></div>`, journal ? 'settings' : null);
  const displayButton = document.createElement('button');
  displayButton.id = 'settings-fullscreen';
  displayButton.className = 'button secondary';
  displayButton.textContent = fullscreenActive() ? '退出全屏' : '全屏体验';
  displayButton.addEventListener('click', async () => {
    await toggleFullscreen();
    displayButton.textContent = fullscreenActive() ? '退出全屏' : '全屏体验';
  });
  $('.settings-actions').prepend(displayButton);
  $('#panel-content').insertAdjacentHTML('beforeend', '<nav class="preview-links" aria-label="独立资源预览"><a href="./scene-lab.html">场景资源预览 ↗</a><a href="./monster-lab.html">招式与妖怪验证场 ↗</a></nav>');
  $('#resume-game')?.addEventListener('click', () => panel.close());
  $('#restart-checkpoint')?.addEventListener('click', () => beginStage(game.level.id, true));
  $('#settings-sound').addEventListener('click', () => { toggleSound(); settings(journal); });
  $('#export-save').addEventListener('click', exportSave);
  $('#import-save').addEventListener('click', () => { importReturnJournal = journal; $('#import-file').click(); });
  $('#return-home')?.addEventListener('click', () => { resumeAfterPanel = false; goHome(); panel.close(); });
}
function openJournal(tab = 'journey') {
  if (!['playing', 'paused'].includes(game.state)) return;
  if (tab === 'heroes') return heroes(true);
  if (tab === 'jewel') return jewelPanel(true);
  if (tab === 'bestiary') return bestiary(true);
  if (tab === 'settings') return settings(true);
  const chapter = CHAPTERS.find(item => item.id === game.level.chapter), progress = jewelProgress(save);
  const checkpoint = save.checkpoint?.stage === game.level.id;
  showPanel('旅途手记', '游戏已暂停', `<div class="journey-overview"><section class="journey-current"><small>当前篇章</small><h3>${chapter.id} · ${chapter.name}</h3><p class="journey-scene">当前场景 · ${game.level.name}</p><div class="journey-goal"><small>当前目标</small><strong>${objectiveText(game)}</strong></div><div class="checkpoint-summary"><span aria-hidden="true">◇</span><div><strong>${checkpoint ? '最近检查点' : '本幕起点'}</strong><p>${game.level.name}${checkpoint ? ' · 神社灯笼' : ''}</p></div><small>${checkpoint ? '已保存' : '尚未到达检查点'}</small></div></section><aside class="journey-details"><h3>四魂之玉</h3><div class="jewel-comparison">${[['inuyasha','我方持有'],['naraku','敌方持有']].map(([key,label]) => `<div class="jewel-row"><div><span>${label}</span><strong>${save.jewel.started ? shareText(progress[key]) : '—'}</strong></div><div class="jewel-track ${key}"><i style="width:${save.jewel.started ? progress[key]/100 : 0}%"></i></div></div>`).join('')}</div><p class="settings-note">${save.jewel.started ? `其余份额 ${shareText(progress.world)}` : '四魂之玉尚未破碎'}</p><h3>本幕信物</h3><p class="journey-relics"><span aria-hidden="true">${'◆'.repeat(relicCount(game))}${'◇'.repeat(3 - relicCount(game))}</span><strong>${relicCount(game)} / 3</strong></p></aside></div><p class="settings-note">重试将恢复${checkpoint ? '最近检查点' : '本幕起点'}。</p>`, 'journey');
}
document.querySelectorAll('[data-journal]').forEach(button => {
  button.addEventListener('click', () => openJournal(button.dataset.journal));
  button.addEventListener('keydown', event => {
    const tabs = [...document.querySelectorAll('[data-journal]')], index = tabs.indexOf(button);
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); openJournal(tabs[next].dataset.journal); tabs[next].focus();
  });
});
$('#journal-resume').addEventListener('click', () => panel.close());
$('#journal-retry').addEventListener('click', () => beginStage(game.level.id, true));
$('#journal-home').addEventListener('click', () => { resumeAfterPanel = false; goHome(); panel.close(); $('#play-button').focus(); });
function exportSave() {
  game.store();
  const url = URL.createObjectURL(new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `四魂初旅-存档-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 200000) throw new Error('存档文件过大');
    const imported = normalizeSave(JSON.parse(await file.text()));
    showPanel('接续另一段旅程', 'IMPORT SAVE', `<div class="confirmation">这个存档已完成 ${imported.completed.length} 幕，拥有 ${imported.unlocked.length} 位伙伴。导入后将替换本机当前进度。<div class="result-actions"><button class="button secondary" id="cancel-import">取消</button><button class="button primary" id="confirm-import">导入并返回首页</button></div></div>`);
    $('#cancel-import').addEventListener('click', () => importReturnJournal ? openJournal('settings') : settings());
    $('#confirm-import').addEventListener('click', () => { save = imported; game = new Game(save, onEvent); game.store(); hasSave = true; partySignature = ''; resumeAfterPanel = false; panel.close(); goHome(); toast('存档已导入，可以继续旅程。'); });
  } catch (error) { toast(`导入失败：${error instanceof SyntaxError ? '文件不是有效的存档 JSON' : error.message}`); }
  event.target.value = '';
});
function newJourney() {
  if (game.state !== 'menu') return;
  factionReturnFocus = document.activeElement;
  setHome(true);
  $('#home-screen').hidden = true;
  $('#faction-screen').hidden = false;
  $('.app-shell').classList.add('choosing-faction');
  selectFaction('inuyasha');
  $('#faction-inuyasha').focus({ preventScroll: true });
}
function selectFaction(id, focus = false) {
  if (!Object.hasOwn(FACTIONS, id)) return;
  selectedFaction = id;
  for (const card of document.querySelectorAll('[data-faction]')) {
    const selected = card.dataset.faction === id;
    card.classList.toggle('is-selected', selected);
    card.setAttribute('aria-checked', String(selected));
    card.tabIndex = selected ? 0 : -1;
    if (selected && focus) { card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  const route = FACTIONS[id], button = $('#faction-start');
  button.disabled = !route.playable;
  button.innerHTML = route.playable ? '开启犬夜叉篇 <span aria-hidden="true">→</span>' : '奈落篇筹备中';
  $('#faction-note').textContent = route.playable ? '阵营将在本次旅程中固定。' : '奈落篇正在筹备，暂时无法开始。';
  $('#faction-screen').dataset.selected = id;
}
function returnFromFaction() {
  setHome(true);
  updateSummary();
  const target = factionReturnFocus?.isConnected && !factionReturnFocus.hidden ? factionReturnFocus : $('#play-button');
  target.focus({ preventScroll: true });
}
function startNewJourney(id) {
  const route = FACTIONS[id];
  if (!route?.playable) return;
  save = newJourneySave(id, save);
  game = new Game(save, onEvent);
  beginStage(route.startStage);
}
function confirmFaction() {
  const id = selectedFaction, route = FACTIONS[id];
  if (!route.playable) return;
  if (!hasSave) { startNewJourney(id); return; }
  const currentLevel = LEVELS[save.stage], currentChapter = CHAPTERS.find(chapter => chapter.id === currentLevel.chapter);
  showPanel('开启新的旅程？', 'A NEW JOURNEY', `<div class="confirmation"><div class="new-journey-summary"><p><span>新旅程</span><strong>${route.name}</strong><small>开篇：${route.opening}</small></p><p><span>当前旅程</span><strong>${FACTIONS[save.faction].name}</strong><small>${currentChapter.id} · ${currentChapter.name} / ${currentLevel.name}</small></p></div><p>开启后将替换本机当前旅程。你可以先导出存档。</p><div class="result-actions new-journey-actions"><button class="button secondary" id="cancel-new">返回选择</button><button class="button secondary" id="export-before-new">导出当前存档</button><button class="button primary" id="confirm-new">开启新旅程 →</button></div></div>`);
  $('#cancel-new').addEventListener('click', () => panel.close());
  $('#export-before-new').addEventListener('click', exportSave);
  $('#confirm-new').addEventListener('click', () => startNewJourney(id));
}
function result(data) {
  updateSummary();
  const chapter = CHAPTERS.find(item => item.id === game.level.chapter), progress = jewelProgress(save);
  showPanel(data.chapterComplete ? `${chapter.id} · ${chapter.name}` : '道路已被照亮', data.chapterComplete ? 'CHAPTER COMPLETE' : 'SCENE COMPLETE', `<div class="result"><div class="result-symbol">✧</div><h3>${data.final ? '守护之牙，已找到归属' : `${game.level.name} · 完成`}</h3><p>${data.final ? '兄弟的交锋暂告一段落。<br>玉还散落在各地，寻玉之旅仍将继续。' : '伙伴的脚步，通往下一段故事。'}</p><div class="stars">${starsText(data.stars)}</div><div class="result-stats"><span><b>${shareText(progress.inuyasha)}</b>我方收集</span><span><b>${data.relics} / 3</b>旅途信物</span><span><b>${timeText(data.time)}</b>本次用时</span></div><p class="settings-note">${data.final ? '犬主01～03已完成。完成篇章与集齐四魂之玉分别结算。' : '星章：完成本幕 · 找齐三枚信物 · 总受伤低于180。'}</p><div class="result-actions"><button class="button secondary" id="result-heroes">伙伴成长</button><button class="button primary" id="result-next">${data.final ? '回顾篇章' : '前往下一幕'} →</button></div></div>`);
  $('#result-heroes').addEventListener('click', () => heroes());
  $('#result-next').addEventListener('click', () => { if (data.final) { resumeAfterPanel = false; goHome(); chapters(); } else beginStage(game.level.id + 1); });
}
function onEvent(type, value) {
  if (type === 'sound') { audio.play(value); return; }
  if (type === 'toast' || type === 'warning') { toast(value); return; }
  if (type === 'start') { setHome(false); $('#boss-hud').hidden = true; $('#dialogue').hidden = true; updateHud(); }
  if (type === 'dialogue') {
    const line = value.lines[value.index]; $('#dialogue').hidden = false; $('#combat-bottom').hidden = true; $('#touch-controls').hidden = true;
    $('#dialogue-name').textContent = HEROES[line.who]?.name || SPEAKERS[line.who] || '战国物语';
    $('#dialogue-text').textContent = line.text; $('#dialogue-count').textContent = `${value.index + 1} / ${value.lines.length}`;
    const known = line.who in HEROES; $('#dialogue-portrait').hidden = !known; $('#dialogue-symbol').hidden = known;
    if (known) renderer.portrait($('#dialogue-portrait'), line.who);
    updateHud();
  }
  if (type === 'dialogueEnd') { $('#dialogue').hidden = true; $('#combat-bottom').hidden = false; $('#touch-controls').hidden = !isTouch; input = {}; updateHud(); }
  if (type === 'unlock') { partySignature = ''; toast(`${HEROES[value].name}加入！按 1 / 2 或 Tab 随时切换伙伴。`); updateSummary(); }
  if (type === 'switch' || type === 'growth') partySignature = '';
  if (type === 'raceEnd') { showPanel('四魂之玉 · 争夺结束', 'JOURNEY END', `<div class="result"><h3>${value === 'inuyasha' ? '犬夜叉阵营获胜' : '奈落阵营获胜'}</h3><p>全部真实份额已经归于一方，争夺在此结束。</p><button class="button primary" id="race-home">返回旅程</button></div>`); $('#race-home').addEventListener('click', () => { resumeAfterPanel = false; panel.close(); goHome(); }); }
  if (type === 'victory') result(value);
  if (type === 'dead') {
    showPanel('旅途中的休憩', 'TRY AGAIN', '<div class="result"><div class="result-symbol">✧</div><h3>再试一次吧</h3><p>伙伴的故事还在等你。<br>从最近的检查点恢复生命，调整步伐再出发。</p><div class="result-actions"><button class="button secondary" id="dead-heroes">查看伙伴</button><button class="button primary" id="retry-button">从检查点重试 →</button></div></div>');
    $('#dead-heroes').addEventListener('click', () => heroes()); $('#retry-button').addEventListener('click', () => beginStage(game.level.id, true));
  }
}

function combatIcon(kind) {
  const paths = {
    claw: '<path d="M8 36C23 26 22 16 37 8M14 40C29 30 29 19 42 13M5 27C14 22 17 12 27 6"/>',
    blood: '<path d="M5 36Q27 28 41 7Q31 32 9 42M7 22Q23 19 30 5M24 43Q38 32 44 19"/>',
    sword: '<path d="m10 39 8-8M6 35l8 8M17 29C24 28 37 16 42 5C42 22 31 34 22 34Z"/>',
    arrow: '<path d="M8 39 40 7m-13 0h13v13M8 27v12h12M11 11Q38 13 37 37M11 11l26 26"/>',
    spirit: '<path d="m24 4 5 14 14 6-14 5-5 15-5-15-15-5 15-6ZM9 7l3 3m26 28 3 3M8 39l3-3m26-25 3-3"/>',
    shield: '<path d="m24 5 16 7v12c0 10-8 16-16 20C16 40 8 34 8 24V12Z"/><path d="m24 14 3 8 9 3-9 3-3 8-3-8-9-3 9-3Z"/>',
    dodge: '<circle cx="31" cy="10" r="4"/><path d="m25 17 9 7 8-3M25 17l-8 10 10 5-6 11m6-11 9 9M23 20 9 23M5 31h10M2 38h11"/>'
  };
  return `<svg class="action-vector" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]}</svg>`;
}
function drawPartyPortrait(canvas, id) {
  const frame = renderer.frames?.[id === 'inuyasha' ? 0 : 1]?.[0];
  if (!frame) { renderer.portrait(canvas, id); return; }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
  // Reframe the existing idle artwork around the face and shoulders for the HUD.
  const cropWidth = frame.w * (id === 'inuyasha' ? .38 : .36), cropHeight = cropWidth * canvas.height / canvas.width;
  ctx.drawImage(renderer.sprites, frame.sx + frame.w * (id === 'inuyasha' ? .3 : .24),
    frame.sy + frame.h * .025, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
}
function updateHud() {
  if (game.state === 'menu') return;
  const dialogue = game.state === 'dialogue';
  $('#battle-frame').classList.toggle('is-dialogue', dialogue);
  $('#combat-bottom').hidden = dialogue;
  $('#touch-controls').hidden = dialogue || !isTouch;
  $('.objective').hidden = dialogue;
  const members = partyView(game);
  const signature = save.unlocked.join(',') + game.active + Boolean(renderer.frames);
  if (signature !== partySignature) {
    partySignature = signature;
    $('#party').innerHTML = members.map(member => `<button class="party-member ${member.active ? 'active' : ''}" data-hero="${member.id}"><svg class="member-frame" viewBox="0 0 355 92" preserveAspectRatio="none" aria-hidden="true"><path d="M12 1H328L354 26V79L342 91H1V12Z"/><path class="frame-inner" d="M17 5H326L350 29V76L339 87H5V17Z"/><path class="frame-corners" d="M5 26V16L16 5H33M322 5H326L350 29M5 77V87H23M332 87H339L350 76"/></svg><span class="member-key"><b>${member.key}</b></span><span class="member-portrait"><canvas width="200" height="180" aria-hidden="true"></canvas></span><span class="member-info"><span class="member-heading"><strong>${member.name}</strong><small class="member-state"></small></span><span class="member-vital health-vital"><span class="vital-label">生命</span><span class="member-health" role="progressbar" aria-label="${member.name}生命" aria-valuemin="0"><i></i></span><span class="member-hp"></span></span><span class="member-vital energy-vital"><span class="vital-label">${member.energy.label}</span><span class="member-energy" role="progressbar" aria-label="${member.name}${member.energy.label}储量" aria-valuemin="0"><i></i></span><span class="member-energy-value"></span></span><span class="member-effects" hidden></span></span></button>`).join('');
    document.querySelectorAll('[data-hero]').forEach(button => { drawPartyPortrait(button.querySelector('canvas'), button.dataset.hero); button.addEventListener('click', () => game.switchTo(button.dataset.hero)); });
  }
  for (const member of members) {
    const button = $(`[data-hero="${member.id}"]`), health = button.querySelector('.member-health'), energy = button.querySelector('.member-energy');
    button.disabled = !member.unlocked || member.hp <= 0;
    button.classList.toggle('locked', !member.unlocked); button.classList.toggle('is-dead', member.unlocked && member.hp <= 0);
    button.classList.toggle('low-health', member.unlocked && member.hp > 0 && member.ratio < 0.25);
    button.setAttribute('aria-label', `切换${member.name}，${member.state}，生命 ${member.hp} / ${member.max}，${member.energy.label} ${member.energy.available ? member.energy.text : '暂未启用'}${member.effects ? `，${member.effects}` : ''}`);
    button.querySelector('.member-state').textContent = member.state;
    health.querySelector('i').style.width = `${member.ratio * 100}%`;
    health.setAttribute('aria-valuemax', member.max); health.setAttribute('aria-valuenow', member.hp);
    button.querySelector('.member-hp').textContent = member.unlocked ? `${member.hp} / ${member.max}` : '—';
    energy.querySelector('i').style.width = `${member.energy.ratio * 100}%`;
    energy.classList.toggle('is-unset', !member.energy.available);
    energy.setAttribute('aria-valuetext', member.energy.available ? member.energy.text : '暂未启用');
    if (member.energy.available) { energy.setAttribute('aria-valuenow', member.energy.current); energy.setAttribute('aria-valuemax', member.energy.max); }
    else { energy.removeAttribute('aria-valuenow'); energy.removeAttribute('aria-valuemax'); }
    button.querySelector('.member-energy-value').textContent = member.energy.text;
    const effects = button.querySelector('.member-effects'); effects.textContent = member.effects; effects.hidden = !member.effects;
  }
  $('#hud-chapter').textContent = `${game.level.chapter} · ${game.level.name}`;
  $('#hud-objective').textContent = objectiveText(game);
  $('#hud-relics').textContent = `信物 ${relicCount(game)} / 3`;
  if (isTouch && !dialogue) $('#battle-frame').style.setProperty('--objective-height', `${$('.objective').offsetHeight}px`);
  $('#journey-progress').style.width = `${Math.min(100, game.hero.x / game.level.length * 100)}%`;
  const iconSignature = game.active + save.heroes.inuyasha.unlocks.join(',');
  if (iconSignature !== actionSignature) {
    actionSignature = iconSignature;
    $('#basic-icon').innerHTML = combatIcon(game.active === 'kagome' ? 'arrow' : save.heroes.inuyasha.unlocks.includes('tessaiga-awaken') ? 'sword' : 'claw');
    $('#dodge-icon').innerHTML = combatIcon('dodge');
    $('#skill1 .skill-icon').innerHTML = combatIcon(game.active === 'kagome' ? 'spirit' : 'claw');
    $('#skill2 .skill-icon').innerHTML = combatIcon(game.active === 'kagome' ? 'shield' : 'blood');
    $('#battle-frame').dataset.activeHero = game.active;
  }
  for (let i = 0; i < 2; i++) {
    const button = $(`#skill${i + 1}`), cd = cooldownView(game.cooldowns[game.active]?.[i], HEROES[game.active].cooldown[i]);
    button.querySelector('.skill-name').textContent = HEROES[game.active].skill[i];
    button.querySelector('.cooldown-value').textContent = cd.text; button.classList.toggle('cooling', cd.cooling);
    button.style.setProperty('--cooldown', cd.ratio); button.setAttribute('aria-disabled', String(cd.cooling));
    button.setAttribute('aria-label', `${HEROES[game.active].skill[i]}${cd.cooling ? `，冷却 ${cd.text}` : '，可使用'}`);
    $(`#touch-skill${i + 1}`).textContent = HEROES[game.active].skill[i];
    $(`#touch-skill${i + 1}`).setAttribute('aria-label', button.getAttribute('aria-label'));
  }
  const progress = jewelProgress(save);
  $('#hud-jewel-shares').textContent = save.jewel.started ? `我方 ${shareText(progress.inuyasha)} · 敌方 ${shareText(progress.naraku)}` : '尚未玉碎';
  $('#hud-jewel-fill').style.width = `${save.jewel.started ? progress.inuyasha / 100 : 0}%`;
  const nearby = game.nearbyInteraction(), door = nearby ? null : nearbySceneDoor(game);
  $('#scene-interaction').hidden = game.state !== 'playing' || !(nearby || door);
  if (nearby || door) {
    $('#scene-interaction-label').textContent = nearby ? `${nearby.hero && game.active !== nearby.hero ? '切换戈薇 · ' : ''}${nearby.label}` : game.openDoors.has(door.id) ? '关门' : '开门';
    $('#scene-interaction').style.left = `${Math.max(15, Math.min(85, (game.hero.x + 15 - game.camera) / 960 * 100))}%`;
    $('#scene-interaction').style.top = `${Math.max(32, (game.hero.y - 12) / 540 * 100)}%`;
  }
  const boss = game.enemies.find(e => e.boss && e.hp > 0); $('#boss-hud').hidden = !boss || dialogue;
  $('.journey-track').hidden = !!boss;
  if (boss) { $('#boss-name').textContent = boss.name; $('#boss-health').style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`; $('#boss-state').textContent = boss.type === 'sesshomaru' ? boss.phase === 2 ? '妖犬形态 · 避开扑袭落点' : '兄弟之战 · 留意光鞭预警' : game.anchors.some(a => a.hp > 0) ? '发丝结界 · 击破结点' : boss.phase === 2 ? '第二阶段 · 怒意' : '破绽显现'; }
}

const mapping = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyS: 'down', ArrowDown: 'down', Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', KeyJ: 'attack', KeyK: 'dodge', ShiftLeft: 'dodge', ShiftRight: 'dodge', KeyU: 'skill1', KeyI: 'skill2', Digit1: 'one', Digit2: 'two', Tab: 'switch', KeyE: 'interact', Enter: 'interact' };
window.addEventListener('keydown', event => {
  if (panel.open) return;
  if (!$('#faction-screen').hidden && event.code === 'Escape') { event.preventDefault(); returnFromFaction(); return; }
  if (game.state === 'dialogue' && ['Enter', 'KeyE', 'Space'].includes(event.code)) { event.preventDefault(); if (!event.repeat) game.nextDialogue(); return; }
  if (game.state !== 'playing') return;
  if (event.code === 'Escape') { event.preventDefault(); openJournal(); return; }
  if (event.key === '?') { event.preventDefault(); openJournal('settings'); return; }
  if (event.target.closest?.('[data-input]') && ['Enter', 'Space'].includes(event.code)) return;
  if (mapping[event.code]) { event.preventDefault(); input[mapping[event.code]] = true; }
});
window.addEventListener('keyup', event => { if (mapping[event.code]) input[mapping[event.code]] = false; });
window.addEventListener('blur', () => { input = {}; if (game.state === 'playing' && !panel.open) openJournal(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'playing' && !panel.open) openJournal(); });
window.addEventListener('pagehide', () => { if (hasSave) persist(save); });
document.querySelectorAll('[data-input]').forEach(button => {
  button.addEventListener('pointerdown', event => { if (game.state !== 'playing' || panel.open) return; event.preventDefault(); button.setPointerCapture(event.pointerId); input[button.dataset.input] = true; audio.unlock(); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => { input[button.dataset.input] = false; });
  button.addEventListener('click', event => { if (event.detail === 0 && game.state === 'playing' && !panel.open) { input[button.dataset.input] = true; queuedActions.add(button.dataset.input); audio.unlock(); } });
});
$('#dialogue-next').addEventListener('click', () => game.nextDialogue());
$('#play-button').addEventListener('click', () => { if (hasSave) beginStage(save.stage, !!(save.checkpoint || save.runStart)); else newJourney(); });
$('#new-game-button').addEventListener('click', newJourney);
$('#faction-back').addEventListener('click', returnFromFaction);
$('#faction-start').addEventListener('click', confirmFaction);
for (const card of document.querySelectorAll('[data-faction]')) card.addEventListener('click', () => selectFaction(card.dataset.faction));
$('.faction-options').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const ids = Object.keys(FACTIONS), index = ids.indexOf(selectedFaction);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? ids.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + ids.length) % ids.length;
  selectFaction(ids[next], true);
});
$('#chapter-button').addEventListener('click', chapters);
$('#nav-heroes').addEventListener('click', () => heroes());
$('#nav-bestiary').addEventListener('click', () => bestiary());
$('#nav-jewel').addEventListener('click', () => jewelPanel());
$('#help-button').addEventListener('click', () => settings());
for (const button of document.querySelectorAll('[data-sound-toggle]')) button.addEventListener('click', toggleSound);
$('#pause-button').addEventListener('click', () => openJournal());
$('#hud-jewel').addEventListener('click', () => openJournal('jewel'));
$('#combat-help').addEventListener('click', () => openJournal('settings'));
function fullscreenActive() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function updateFullscreen() {
  const active = fullscreenActive();
  for (const button of document.querySelectorAll('[data-fullscreen-toggle]')) {
    button.querySelector('.fullscreen-label').textContent = active ? '退出全屏' : '全屏';
    button.querySelector('path').setAttribute('d', active
      ? 'M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5'
      : 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8 3 3m13 5 5-5M8 16l-5 5m13-5 5 5');
    button.setAttribute('aria-label', active ? '退出全屏' : '进入全屏');
    button.setAttribute('aria-pressed', String(active));
  }
  const settingsButton = $('#settings-fullscreen');
  if (settingsButton) settingsButton.textContent = active ? '退出全屏' : '全屏体验';
}
async function toggleFullscreen() {
  try {
    if (fullscreenActive()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const shell = $('#app-shell');
      await (shell.requestFullscreen || shell.webkitRequestFullscreen).call(shell);
    }
  } catch { toast('当前浏览器未开放全屏，可以扩大窗口体验。'); }
  updateFullscreen();
}
for (const button of document.querySelectorAll('[data-fullscreen-toggle]')) button.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreen);
document.addEventListener('webkitfullscreenchange', updateFullscreen);

const homeMenu = $('.home-menu');
function selectHomeItem(button) {
  homeMenu.querySelectorAll('button').forEach(item => item.classList.toggle('is-selected', item === button));
}
homeMenu.addEventListener('pointerover', event => { const item = event.target.closest('button'); if (item) selectHomeItem(item); });
homeMenu.addEventListener('focusin', event => { const item = event.target.closest('button'); if (item) selectHomeItem(item); });
homeMenu.addEventListener('pointerleave', () => selectHomeItem(homeMenu.contains(document.activeElement) ? document.activeElement : $('#play-button')));
homeMenu.addEventListener('keydown', event => {
  if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const items = [...homeMenu.querySelectorAll('button:not([hidden])')];
  const index = items.indexOf(document.activeElement);
  items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
});

function frame(now) {
  const dt = Math.max(0, Math.min((now - lastFrame) / 1000, 0.05)); lastFrame = now; elapsed += dt;
  game.update(dt, input);
  for (const action of queuedActions) input[action] = false;
  queuedActions.clear();
  if (game.state !== 'menu') renderer.render(game, elapsed);
  audio.update(dt, game.state === 'playing');
  if (panel.open) for (const canvas of document.querySelectorAll('[data-monster-preview]')) renderer.monsterPortrait(canvas, canvas.dataset.monsterPreview, elapsed);
  if (elapsed - lastHud > 0.1) { updateHud(); lastHud = elapsed; }
  requestAnimationFrame(frame);
}
updateSummary();
if (loaded.warning) toast(loaded.warning);
requestAnimationFrame(frame);
