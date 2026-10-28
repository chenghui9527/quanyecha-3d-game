import { HEROES, LEVELS, GROWTH, clamp, statsFor } from './data.js';
import { playableFaction } from './factions.js';
import { MONSTERS } from './monsters.js';
import { SHARDS, GROWTH_EVENTS, freshJewel, grantGrowth, resolveWorldEvent, transferShard, progressSnapshot } from './campaign.js';
export const SAVE_KEY = 'shikon-journey-save-v1';
export function freshSave(faction = 'inuyasha') {
  const route = playableFaction(faction);
  return { version: 2, faction, stage: route.startStage, unlockedStage: route.startStage, completed: [], unlocked: ['kagome'], heroes: { inuyasha: { stage: 0, unlocks: [] }, kagome: { stage: 0, unlocks: [] } }, growthEvents: [], worldEvents: [], jewel: freshJewel(), relics: [], flags: [], bestiary: [], stars: {}, checkpoint: null, runStart: null, playTime: 0, sound: true };
}
export function newJourneySave(faction, current) {
  const save = freshSave(faction);
  save.sound = current?.sound !== false;
  return save;
}
const integer = (value, min, max, fallback = min) => Number.isFinite(Number(value)) ? clamp(Math.floor(Number(value)), min, max) : fallback;
const strings = value => [...new Set((Array.isArray(value) ? value : []).filter(x => typeof x === 'string' && x.length < 100))].slice(0, 1000);
const stages = value => [...new Set((Array.isArray(value) ? value : []).filter(x => Number.isInteger(x) && x >= 0 && x < LEVELS.length))];
function cleanSnapshot(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return progressSnapshot(normalizeSave({ ...raw, version: 2, stage: 0, unlockedStage: 0, completed: [], checkpoint: null, runStart: null }));
}
function cleanVitals(raw, save) {
  if (!raw?.health || !raw.statuses || !raw.controls) return null;
  const vitals = { health: {}, statuses: {}, controls: {} };
  for (const id of Object.keys(HEROES)) {
    vitals.health[id] = clamp(Number(raw.health[id]) || 0, 0, statsFor(id, save.heroes[id]).maxHp);
    const status = raw.statuses[id];
    const slows = (Array.isArray(status?.slows) ? status.slows : []).filter(slow => Number.isFinite(slow.life) && slow.life > 0 && Number.isFinite(slow.strength)).map(slow => ({ life: Math.min(slow.life, 9999), strength: clamp(slow.strength, 0, 1) }));
    const poison = (Array.isArray(status?.poison) ? status.poison : []).filter(layer => Number.isFinite(layer.life) && layer.life > 0 && Number.isFinite(layer.damage) && layer.damage > 0).map(layer => ({ life: Math.min(layer.life, 9999), damage: layer.damage, tick: clamp(Number(layer.tick) || 1, 0, 1) }));
    vitals.statuses[id] = { slow: Math.max(0, ...slows.map(slow => slow.strength)), slows, poison };
    vitals.controls[id] = { hurt: clamp(Number(raw.controls[id]?.hurt) || 0, 0, 10) };
  }
  return vitals;
}
export function normalizeSave(input) {
  if (!input || typeof input !== 'object' || ![1, 2].includes(input.version)) throw new Error('无法识别的存档版本');
  const legacy = input.version === 1, save = freshSave(input.faction ?? 'inuyasha');
  for (const key of ['stage', 'unlockedStage']) save[key] = integer(input[key], 0, legacy ? 3 : LEVELS.length - 1);
  save.completed = stages(input.completed);
  if (legacy) save.completed = save.completed.filter(id => id < 4);
  if (legacy && save.completed.includes(3)) { save.unlockedStage = 4; if (!input.checkpoint) save.stage = 4; }
  save.stage = Math.min(save.stage, save.unlockedStage);
  save.unlocked = [...new Set(['kagome', ...strings(input.unlocked).filter(x => Object.hasOwn(HEROES, x))])];
  if (save.unlockedStage > 0 || save.completed.includes(0)) save.unlocked = ['kagome', 'inuyasha'];
  save.playTime = integer(input.playTime, 0, 99999999);
  for (const key of ['relics', 'flags']) save[key] = strings(input[key]);
  for (let i = 0; i < LEVELS.length; i++) save.stars[i] = integer(input.stars?.[i], 0, 3);
  save.sound = input.sound !== false;
  save.bestiary = strings(input.bestiary).filter(id => Object.hasOwn(MONSTERS, id));
  if (!legacy) {
    for (const id of Object.keys(HEROES)) {
      save.heroes[id].stage = integer(input.heroes?.[id]?.stage, 0, GROWTH[id].length - 1);
      save.heroes[id].unlocks = strings(input.heroes?.[id]?.unlocks).filter(x => id === 'inuyasha' && ['tessaiga', 'tessaiga-awaken'].includes(x));
    }
    save.growthEvents = strings(input.growthEvents).filter(id => Object.hasOwn(GROWTH_EVENTS, id));
    save.worldEvents = strings(input.worldEvents).filter(id => ['yura-resolved', 'tomb-returned'].includes(id));
    save.jewel.started = input.jewel?.started === true;
    if (save.jewel.started) for (const id of Object.keys(SHARDS)) {
      const owner = input.jewel?.owners?.[id];
      if (['inuyasha', 'naraku'].includes(owner)) save.jewel.owners[id] = owner;
    }
    save.jewel.known = strings(input.jewel?.known).filter(id => Object.hasOwn(SHARDS, id));
  } else {
    save.jewel.started = save.completed.includes(1) || save.unlockedStage >= 2 || Array.isArray(input.checkpoint?.events) && input.checkpoint.events.includes('shatter');
    if (save.completed.includes(1)) { transferShard(save, 'village', 'inuyasha'); grantGrowth(save, 'promise'); }
    if (save.completed.includes(3)) { transferShard(save, 'yura', 'inuyasha'); grantGrowth(save, 'cooperation'); resolveWorldEvent(save, 'yura-resolved'); }
  }
  const cp = input.checkpoint;
  if (cp && Number.isFinite(cp.x) && cp.stage === save.stage) {
    save.checkpoint = { stage: save.stage, x: clamp(cp.x, 0, LEVELS[save.stage].length - 160), waves: (Array.isArray(cp.waves) ? cp.waves : []).filter(x => Number.isInteger(x) && x >= 0 && x < 20), events: strings(cp.events), encounterVersion: cp.encounterVersion === 2 ? 2 : 1, bossDefeated: cp.bossDefeated === true, progress: legacy ? progressSnapshot(save) : cleanSnapshot(cp.progress) };
  }
  if (!legacy && input.runStart?.stage === save.stage) save.runStart = { stage: save.stage, progress: cleanSnapshot(input.runStart.progress), vitals: cleanVitals(input.runStart.vitals, save) };
  return save;
}
export function loadSave(storage = globalThis.localStorage) {
  try { const text = storage?.getItem(SAVE_KEY); return text ? { save: normalizeSave(JSON.parse(text)), exists: true } : { save: freshSave(), exists: false }; }
  catch { return { save: freshSave(), exists: false, warning: '存档无法读取，已使用新的旅程。你仍可导入备份。' }; }
}
export function persist(save, storage = globalThis.localStorage) {
  try { storage?.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}
