import { HEROES, HERO_SWITCH_COOLDOWN, statsFor } from './data.js';

// User-approved display defaults; spending, recovery and persisted capacity
// remain separate from this presentation value and from attack strength.
const DEFAULT_ENERGY = Object.freeze({ current: 100, max: 100 });
export function energyView(game, id) {
  const label = id === 'kagome' ? '灵力' : '妖力';
  const configured = game.energy?.[id];
  const defaulted = !(Number.isFinite(configured?.current) && Number.isFinite(configured?.max) && configured.max > 0);
  const reserve = defaulted ? DEFAULT_ENERGY : configured;
  const current = Math.max(0, Math.min(reserve.max, reserve.current));
  return { label, available: true, defaulted, current, max: reserve.max,
    ratio: current / reserve.max, text: `${Math.ceil(current)} / ${Math.ceil(reserve.max)}` };
}

export function partyView(game) {
  const ids = [game.active, ...Object.keys(HEROES).filter(id => id !== game.active)];
  return ids.map(id => {
    const unlocked = game.save.unlocked.includes(id), max = statsFor(id, game.save.heroes[id]).maxHp;
    const hp = unlocked ? Math.max(0, Math.min(max, game.health[id] || 0)) : 0;
    const status = game.statuses[id], barrier = game.barriers[id];
    const switchCd = cooldownView(game.switchCooldown, HERO_SWITCH_COOLDOWN);
    const effects = [];
    if (unlocked && status.poison.length) effects.push(`中毒×${status.poison.length}`);
    if (unlocked && status.slow > 0) effects.push('减速');
    if (unlocked && barrier?.hp > 0 && barrier.life > 0) effects.push(`结界 ${Math.ceil(barrier.hp)} · ${barrier.life.toFixed(1)}秒`);
    return { id, name: HEROES[id].name, key: id === 'inuyasha' ? '1' : '2',
      active: id === game.active, unlocked, max, hp: Math.ceil(hp), ratio: hp / max,
      state: !unlocked ? '尚未加入' : hp <= 0 ? '已倒下' : id === game.active ? '出战' : '队友',
      effects: effects.join(' · '), switchCd,
      switchCooling: unlocked && hp > 0 && id !== game.active && switchCd.cooling,
      energy: unlocked ? energyView(game, id) : { label: id === 'kagome' ? '灵力' : '妖力', available: false, defaulted: false, current: null, max: null, ratio: 0, text: '— / —' } };
  });
}

export function objectiveText(game) {
  const item = game.availableInteractions()[0];
  if (game.encounter) return `净化道路 · 第 ${game.encounter.wave} 波敌人`;
  if (game.bossSpawned && !game.bossDefeated) return game.level.boss === 'sesshomaru'
    ? '避开落点与光鞭，趁收招时反击' : '击破发丝结点，寻找首领破绽';
  if (item) return `${item.hero && game.active !== item.hero ? '切换戈薇 · ' : ''}${item.label}`;
  if (game.level.id === 5 && !game.bossDefeated) return '继续前进，迎战杀生丸';
  if (game.objectiveComplete() && (game.level.required?.length || game.events.has('release'))) return '沿道路前进，抵达出口';
  return game.level.goal;
}

export function relicCount(game) {
  return game.level.relics.filter((_, index) => game.save.relics.includes(`${game.level.id}:${index}`)).length;
}

export function cooldownView(remaining, duration) {
  const seconds = Math.max(0, remaining || 0);
  return { cooling: seconds > 0, text: seconds > 0 ? `${Math.max(.1, seconds).toFixed(1)}s` : '',
    ratio: duration > 0 ? Math.max(0, Math.min(1, seconds / duration)) : 0 };
}
