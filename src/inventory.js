import { HEROES, FLOOR } from './data.js';

export const EQUIPMENT_SLOTS = [
  { id: 'upper', name: '上衣', icon: 'upper' }, { id: 'lower', name: '下衣', icon: 'lower' },
  { id: 'hands', name: '手部', icon: 'hands' }, { id: 'accessory', name: '饰物', icon: 'accessory' },
  { id: 'weapon', name: '武器', icon: 'sword' }, { id: 'feet', name: '足部', icon: 'feet' }
];
export const EQUIPMENT = {
  'inuyasha-upper': { owner: 'inuyasha', slot: 'upper', name: '初始上衣', icon: 'upper', color: '#c84b44', source: '封印之森 · 犬夜叉加入', effects: ['赤色上衣，随犬夜叉加入获得。'] },
  'inuyasha-lower': { owner: 'inuyasha', slot: 'lower', name: '初始下衣', icon: 'lower', color: '#c84b44', source: '封印之森 · 犬夜叉加入', effects: ['与上衣分别装备的赤色裤装。'] },
  'kagome-upper': { owner: 'kagome', slot: 'upper', name: '水手服上衣', icon: 'upper', color: '#b8d5c2', source: '异世来客 · 初始装备', effects: ['戈薇从现代带来的上衣。'] },
  'kagome-lower': { owner: 'kagome', slot: 'lower', name: '校服裙', icon: 'skirt', color: '#4d9478', source: '异世来客 · 初始装备', effects: ['与上衣分别装备的绿色裙装。'] },
  'kagome-bow': { owner: 'kagome', slot: 'weapon', name: '弓箭', icon: 'bow', source: '异世来客 · 初始装备', effects: ['普通箭造成物理伤害。', '破魔之矢使用灵力，穿透前方目标。'] },
  tessaiga: { owner: 'inuyasha', slot: 'weapon', name: '铁碎牙', icon: 'sword', source: '犬主03 · 父亲的墓地', effects: [] }
};
export const COMMON_ITEMS = {
  herb: { name: '药草', icon: 'herb', description: '为一名存活队员恢复40点生命，最高不超过生命上限。', castTime: .6, heal: 40 },
  antidote: { name: '解毒药', icon: 'antidote', description: '清除一名存活队员当前的全部中毒层数。', castTime: .6, cleanse: 'poison' }
};
export function ownedEquipment(save, hero) {
  if (!Object.hasOwn(HEROES, hero)) return [];
  const ids = [hero + '-upper', hero + '-lower'];
  if (hero === 'kagome') ids.push('kagome-bow');
  else if (save.heroes[hero].unlocks.some(id => id === 'tessaiga' || id === 'tessaiga-awaken')) ids.push('tessaiga');
  return ids;
}
export function normalizeEquipment(save, hero, raw) {
  const owned = ownedEquipment(save, hero);
  const defaults = { upper: hero + '-upper', lower: hero + '-lower', hands: null, accessory: null, weapon: owned.includes('tessaiga') ? 'tessaiga' : hero === 'kagome' ? 'kagome-bow' : null, feet: null };
  return Object.fromEntries(EQUIPMENT_SLOTS.map(slot => {
    const value = raw?.[slot.id];
    const valid = typeof value === 'string' && owned.includes(value) && EQUIPMENT[value].slot === slot.id;
    return [slot.id, valid ? value : value === null && !(hero === 'kagome' && slot.id === 'weapon') ? null : defaults[slot.id]];
  }));
}
export function equippedItems(save, hero) {
  return normalizeEquipment(save, hero, save.heroes[hero].equipment);
}
export function equipmentDetails(save, id) {
  if (!Object.hasOwn(EQUIPMENT, id)) return null;
  const item = EQUIPMENT[id];
  if (id !== 'tessaiga') return { ...item, form: null, history: '' };
  const awakened = save.heroes.inuyasha.unlocks.includes('tessaiga-awaken');
  return { ...item, form: awakened ? '已觉醒' : '锈刀 · 尚未觉醒', history: awakened ? '锈刀 → 觉醒' : '锈刀', effects: awakened ? ['普通攻击变为刀斩。', '近战范围提升，保留妖力爪技。'] : ['由戈薇拔出，等待守护之心的回应。', '尚未觉醒，普通攻击仍使用爪击。'] };
}
export function usesAwakenedFang(save) {
  return equippedItems(save, 'inuyasha').weapon === 'tessaiga' && save.heroes.inuyasha.unlocks.includes('tessaiga-awaken');
}
export function normalizeInventory(raw) {
  return Object.fromEntries(Object.keys(COMMON_ITEMS).map(id => [id, Number.isFinite(raw?.[id]) ? Math.max(0, Math.min(999, Math.floor(raw[id]))) : 0]));
}
export function normalizeItemClaims(raw) {
  return [...new Set((Array.isArray(raw) ? raw : []).filter(id => typeof id === 'string' && /^shrine-[0-5]-[0-9]+$/.test(id)))].slice(0, 100);
}
export function equipmentLocation(game) {
  if (!['playing', 'paused'].includes(game.state) || game.lab) return { safe: false, label: '旅途档案 · 仅可查看' };
  const danger = game.encounter || game.bossSpawned && !game.bossDefeated || game.enemies.some(e => e.hp > 0) || game.projectiles.some(p => p.owner === 'enemy');
  const point = game.level.checkpoints.find(x => game.shrines.has(x) && Math.abs(game.hero.x + game.hero.w / 2 - x) <= 110);
  const standing = game.hero.grounded && Math.abs(game.hero.y + game.hero.h - FLOOR) < 18;
  const busy = game.action || game.attackClock > 0 || game.dodgeClock > 0 || game.hurtClock > 0 || game.itemUse;
  const trap = (game.level.traps || []).some(x => Math.abs(game.hero.x - x) < 140);
  return !danger && point !== undefined && standing && !busy && !trap
    ? { safe: true, label: '安全地点 · 神社灯笼' }
    : { safe: false, label: danger ? '战斗区域 · 仅可查看' : '探索区域 · 仅可查看' };
}
export function equipGear(game, hero, slot, itemId) {
  if (!equipmentLocation(game).safe) return { ok: false, reason: '仅限安全地点更换装备' };
  if (!game.save.unlocked.includes(hero) || !EQUIPMENT_SLOTS.some(part => part.id === slot)) return { ok: false, reason: '人物或部位不可用' };
  const unarmed = hero === 'inuyasha' && slot === 'weapon' && itemId === null;
  if (!unarmed && (!ownedEquipment(game.save, hero).includes(itemId) || EQUIPMENT[itemId].owner !== hero || EQUIPMENT[itemId].slot !== slot)) return { ok: false, reason: '这件装备不属于该人物或不适用此部位' };
  const equipment = equippedItems(game.save, hero);
  if (equipment[slot] === itemId) return { ok: false, reason: '当前已装备' };
  game.save.heroes[hero].equipment = { ...equipment, [slot]: itemId };
  return { ok: true };
}
export function itemUseReason(game, id, target) {
  if (!Object.hasOwn(COMMON_ITEMS, id)) return '道具不存在';
  if (!['playing', 'paused'].includes(game.state)) return '请在旅途中使用道具';
  if (game.itemUse) return '正在施用道具';
  if (!(game.save.inventory?.[id] > 0)) return '道具数量不足';
  if (!game.save.unlocked.includes(game.active) || game.health[game.active] <= 0) return '当前人物无法行动';
  if (game.hurtClock > 0 || game.action || game.attackClock > 0 || game.dodgeClock > 0) return '当前动作结束后才能使用';
  if (!game.save.unlocked.includes(target) || !(game.health[target] > 0)) return '需要选择存活队员';
  const item = COMMON_ITEMS[id];
  if (item.heal && game.health[target] >= game.statsForHero(target).maxHp) return '该队员生命已满';
  if (item.cleanse === 'poison' && !game.statuses[target].poison.length) return '该队员没有中毒';
  return '';
}
export function checkpointSupplies(save, stage, x) {
  const claim = 'shrine-' + stage + '-' + x;
  if (save.itemClaims.includes(claim)) return false;
  save.itemClaims.push(claim);
  save.inventory.herb = Math.min(999, save.inventory.herb + 1);
  save.inventory.antidote = Math.min(999, save.inventory.antidote + 1);
  return true;
}
