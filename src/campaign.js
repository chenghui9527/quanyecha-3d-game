import { CHAPTERS } from './data.js';
import { equippedItems, normalizeInventory, normalizeItemClaims } from './inventory.js';

// Opening content uses a small part of the same finite jewel. Units are 1/100%.
export const SHARDS = {
  village: { share: 200, name: '村外散落的碎片' },
  yura: { share: 300, name: '结罗持有的碎片' },
  patrol: { share: 300, name: '敌方追索的碎片' },
  forest: { share: 200, name: '敌方截获的碎片' },
  distant: { share: 9000, name: '散落各地的余玉' }
};
export const GROWTH_EVENTS = {
  promise: { hero: 'kagome', stage: 1, name: '寻玉之约' },
  cooperation: { hero: 'inuyasha', stage: 1, name: '并肩同行' },
  tessaiga: { hero: 'inuyasha', stage: 2, name: '守护之牙', unlock: 'tessaiga-awaken' }
};
export function freshJewel() { return { started: false, owners: Object.fromEntries(Object.keys(SHARDS).map(id => [id, 'world'])), known: [] }; }
export function jewelProgress(save) {
  const totals = { inuyasha: 0, naraku: 0, world: 0 };
  for (const [id, shard] of Object.entries(SHARDS)) totals[save.jewel.owners[id]] += shard.share;
  return totals;
}
export function raceWinner(save) {
  if (!save.jewel.started) return null;
  const total = jewelProgress(save);
  return total.inuyasha === 10000 ? 'inuyasha' : total.naraku === 10000 ? 'naraku' : null;
}
export function transferShard(save, id, owner) {
  if (!save.jewel.started || !Object.hasOwn(SHARDS, id) || !['world', 'inuyasha', 'naraku'].includes(owner)) return false;
  if (save.jewel.owners[id] === owner) return false;
  save.jewel.owners[id] = owner;
  if (owner === 'inuyasha' && !save.jewel.known.includes(id)) save.jewel.known.push(id);
  return true;
}
export function grantGrowth(save, id) {
  const event = GROWTH_EVENTS[id];
  if (!event || save.growthEvents.includes(id)) return false;
  save.growthEvents.push(id);
  const hero = save.heroes[event.hero];
  hero.stage = Math.max(hero.stage, event.stage);
  if (event.unlock && !hero.unlocks.includes(event.unlock)) {
    hero.unlocks.push(event.unlock);
    if (event.unlock === 'tessaiga-awaken') hero.equipment = { ...equippedItems(save, 'inuyasha'), weapon: 'tessaiga' };
  }
  return true;
}
export function resolveWorldEvent(save, id) {
  const shard = id === 'yura-resolved' ? 'patrol' : id === 'tomb-returned' ? 'forest' : null;
  if (!shard || !save.jewel.started || save.worldEvents.includes(id)) return false;
  save.worldEvents.push(id);
  return save.jewel.owners[shard] === 'world' && transferShard(save, shard, 'naraku');
}
export function completedChapters(save) { return CHAPTERS.filter(chapter => chapter.stages.every(id => save.completed.includes(id))); }
export function progressSnapshot(save) {
  return structuredClone({ ...Object.fromEntries(['unlocked', 'heroes', 'growthEvents', 'worldEvents', 'flags', 'relics', 'jewel', 'bestiary'].map(key => [key, save[key]])), inventory: normalizeInventory(save.inventory), itemClaims: normalizeItemClaims(save.itemClaims) });
}
export function restoreProgress(save, snapshot) {
  if (snapshot) for (const [key, value] of Object.entries(progressSnapshot(snapshot))) save[key] = value;
}
