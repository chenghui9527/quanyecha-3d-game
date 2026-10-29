import { HEROES, GROWTH, statsFor } from './data.js';
import { GROWTH_EVENTS } from './campaign.js';
import { energyView } from './hud.js';
import { EQUIPMENT_SLOTS, EQUIPMENT, COMMON_ITEMS, ownedEquipment, equippedItems, equipmentDetails, equipmentLocation, usesAwakenedFang, itemUseReason } from './inventory.js';

export function journalIcon(kind, color = '#d9c290', empty = false) {
  const drawings = {
    upper: '<path d="m32 16-22 17 13 20 12-8-3 39h37l-3-39 12 8 13-20-23-17-17 13Z"/><path d="m33 17 17 13 17-13M50 30l-8 27m-9 4h35" fill="none" stroke="#efc7a1"/>',
    lower: '<path d="M31 15h38l12 69H55L50 47l-5 37H19Z"/><path d="m32 23 8 51m28-51-8 51M32 16h36" fill="none" stroke="#efb991"/>',
    skirt: '<path d="M31 22h38l16 55H15Z"/><path d="m37 29-7 42m20-42v42m13-42 7 42" fill="none" stroke="#c6ded0"/>',
    hands: '<path d="m34 19 35 11-6 21-6 29-12 4-12-11 8-27-13-6Z"/><path d="m34 33 30 11m-25 5 19 5" fill="none"/>',
    feet: '<path d="M35 17h29l-2 39 21 12 2 14H34l-10-9 7-17Z"/><path d="M35 31h27M31 58l30 5" fill="none"/>',
    accessory: '<ellipse cx="50" cy="35" rx="25" ry="27" fill="none"/><path d="m51 60 13 14-13 17-13-17Z"/><path d="m51 66 7 8-7 10-7-10Z" fill="#d6c590"/>',
    sword: '<path d="m13 81 31-17 7 11-32 17Z" fill="#76503b" stroke="#352b27"/><path d="m20 79 5 9m2-13 5 9m3-13 5 9" fill="none" stroke="#cfac68" stroke-width="3"/><path d="M49 67C96 59 150 36 190 10c-11 40-53 73-133 70Z" fill="#e8dfc5" stroke="#a69c85"/><path d="M54 70C100 63 149 40 187 14c-19 34-65 56-130 62" fill="#fff5dc" stroke="none"/><path d="M59 79q76-7 111-46" fill="none" stroke="#c0b59d"/><path d="m42 57 8 3 5-5 2 10 8-1-5 7 7 6-10 1-1 11-6-6-6 5-1-12-9-2 7-6-5-8Z" fill="#d9c7a7" stroke="#9a8262"/><path d="m45 63 7 14m0-15 3 13m-11-6 3 10" fill="none" stroke="#fff0cc"/>',
    bow: '<path d="M28 13q59 37 0 75" fill="none" stroke-width="6"/><path d="m28 13 17 38-17 37M15 74l61-55m-17 0h17v17" fill="none" stroke="#ead9b5"/>',
    herb: '<path d="M48 87V39M49 61Q13 57 18 24q37 0 31 37ZM49 46Q51 14 85 14q2 35-36 32Z" fill="#78ad7d"/><path d="m27 35 22 26m0-15 23-21" fill="none" stroke="#cae1ac"/>',
    antidote: '<path d="M38 12h24v16l15 22v35H23V50l15-22Z" fill="#9bbec0"/><path d="M26 57h48v24H26Z" fill="#8db18d"/><path d="M37 13h26v11H37Z" fill="#bd9977"/><path d="M45 46h11v20H45Z" fill="#f0e5bc"/>',
    claw: '<path d="M16 79Q44 59 70 16M32 84Q58 63 84 23M12 59Q33 41 49 12" fill="none" stroke-width="6"/>',
    blood: '<path d="M12 79Q62 65 85 13Q71 70 25 88M14 48Q46 41 60 11M49 88Q78 74 88 45" fill="none" stroke="#ec7d76" stroke-width="5"/>',
    shield: '<path d="m50 10 32 13v24c0 22-17 35-32 44-15-9-32-22-32-44V23Z" fill="none"/><path d="m50 28 5 17 18 6-18 6-5 17-5-17-18-6 18-6Z"/>',
    spirit: '<path d="m50 8 10 30 30 12-30 10-10 31-10-31L9 50l31-12Z"/><path d="m14 12 12 12m49 52 12 12" fill="none"/>',
    lantern: '<path d="M47 9h6v9m-20 7h34l6 9v39l-7 8H34l-7-8V34Z" fill="#d68b32" stroke="#e9c576"/><path d="M33 34h34v37H33Z" fill="#ffce79"/><path d="M40 35v36m20-36v36M25 25h50M33 82h34m-17 0v10" fill="none" stroke="#9c632e"/><path d="m50 43 6 14-6 9-6-9Z" fill="#fff3b0"/>',
    lock: '<path d="M31 43V30a19 19 0 0 1 38 0v13M26 43h48v42H26Z" fill="none"/><circle cx="50" cy="61" r="5"/><path d="M50 66v9" fill="none"/>',
    dodge: '<circle cx="61" cy="18" r="9"/><path d="m50 32 19 15 17-6M50 32 32 54l23 11-13 25m13-25 20 22M43 37l-24 7M7 66h21" fill="none" stroke-width="5"/>'
  };
  return '<svg class="journal-item-icon' + (empty ? ' is-empty' : '') + ' icon-' + kind + '" viewBox="' + (kind === 'sword' ? '0 0 200 100' : '0 0 100 100') + '" aria-hidden="true" fill="' + (empty ? 'none' : color) + '" stroke="' + (empty ? '#71817d' : '#a69372') + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (drawings[kind] || drawings.accessory) + '</svg>';
}
const companionCardPortraits = {
  inuyasha: './assets/ui/companion-inuyasha-v1.png',
  kagome: './assets/ui/companion-kagome-v1.png'
};
const companionPages = [['attributes', '属性'], ['skills', '技能'], ['equipment', '装备'], ['growth', '成长']];
const gearName = (game, id) => id ? equipmentDetails(game.save, id)?.name || '未装备' : '徒手 · 爪击';
const hpText = (game, id) => Number.isFinite(game.health[id]) ? Math.ceil(game.health[id]) + ' / ' + statsFor(id, game.save.heroes[id]).maxHp : '— / ' + statsFor(id, game.save.heroes[id]).maxHp;

export class CompanionMenu {
  constructor() { this.hero = null; this.page = 'attributes'; this.slot = 'weapon'; this.skill = 0; this.choosing = false; this.preview = null; this.notice = ''; this.flash = ''; }
  open(game) {
    this.hero = game.save.unlocked.includes(game.active) ? game.active : game.save.unlocked[0];
    this.choosing = false; this.notice = ''; this.flash = '';
  }
  back() { if (!this.choosing) return false; this.choosing = false; this.preview = null; this.notice = ''; return true; }
  candidates(game) {
    const ids = ownedEquipment(game.save, this.hero).filter(id => EQUIPMENT[id].slot === this.slot);
    if (this.hero === 'inuyasha' && this.slot === 'weapon') ids.push(null);
    return ids;
  }
  handle(game, button) {
    const d = button.dataset;
    this.flash = '';
    if (d.companionHero) {
      if (!game.save.unlocked.includes(d.companionHero)) return false;
      this.hero = d.companionHero; this.choosing = false; this.notice = ''; this.skill = 0;
    } else if (d.companionTab) {
      if (!companionPages.some(([key]) => key === d.companionTab)) return false;
      this.page = d.companionTab; if (d.companionSkill !== undefined) this.skill = Number(d.companionSkill); this.choosing = false; this.notice = '';
    } else if (d.gearSlot) { this.slot = d.gearSlot; this.choosing = false; this.notice = ''; }
    else if (d.gearChoose !== undefined) {
      if (!equipmentLocation(game).safe) { this.notice = '仅限安全地点更换装备'; return true; }
      this.choosing = true; this.preview = equippedItems(game.save, this.hero)[this.slot]; this.notice = '';
    } else if (d.gearCandidate !== undefined) {
      const id = d.gearCandidate === 'none' ? null : d.gearCandidate;
      if (!this.candidates(game).includes(id)) return false;
      this.preview = id; this.notice = '';
    } else if (d.gearConfirm !== undefined) {
      if (!this.choosing) return false;
      const result = game.equip(this.hero, this.slot, this.preview);
      this.notice = result.ok ? '已装备 · ' + gearName(game, this.preview) : result.reason;
      if (result.ok) { this.choosing = false; this.flash = this.slot; }
    } else if (d.gearCancel !== undefined) this.back();
    else if (d.companionSkill !== undefined) this.skill = Number(d.companionSkill);
    else return false;
    return true;
  }
  render(game) {
    if (!game.save.unlocked.includes(this.hero)) this.open(game);
    const hero = HEROES[this.hero], progress = game.save.heroes[this.hero], stats = statsFor(this.hero, progress);
    const location = equipmentLocation(game);
    const equipment = equippedItems(game.save, this.hero);
    const roster = Object.entries(HEROES).map(([id, spec]) => {
      const unlocked = game.save.unlocked.includes(id), live = Number.isFinite(game.health[id]);
      const state = !unlocked ? '尚未加入' : live && game.health[id] <= 0 ? '倒下' : game.active === id && game.state !== 'menu' ? '出战' : '队友';
      return '<button type="button" class="companion-member' + (id === this.hero ? ' selected' : '') + '" data-companion-hero="' + id + '" aria-pressed="' + (id === this.hero) + '" ' + (!unlocked ? 'disabled' : '') + '><span class="companion-card-art" aria-hidden="true"><img src="' + companionCardPortraits[id] + '" alt="" draggable="false"></span><span class="companion-card-copy"><span class="companion-card-heading"><strong>' + spec.name + '</strong><b class="companion-state">' + state + '</b></span><small>' + (unlocked ? statsFor(id, game.save.heroes[id]).stageName : '封印之森 · 主线加入') + '</small></span></button>';
    }).join('');
    const tabs = companionPages.map(([id, name]) => '<button type="button" role="tab" id="companion-tab-' + id + '" aria-controls="companion-detail" aria-selected="' + (this.page === id) + '" tabindex="' + (this.page === id ? 0 : -1) + '" data-companion-tab="' + id + '">' + name + '</button>').join('');
    const slots = EQUIPMENT_SLOTS.map(part => {
      const item = equipmentDetails(game.save, equipment[part.id]);
      return '<button type="button" class="equipment-slot slot-' + part.id + (this.slot === part.id ? ' selected' : '') + (this.flash === part.id ? ' equipped-flash' : '') + '" data-gear-slot="' + part.id + '" aria-pressed="' + (this.slot === part.id) + '" aria-label="' + part.name + '，' + (item ? item.name : '尚未装备') + '"><span class="slot-label">' + part.name + '</span>' + '<span class="slot-item-art">' + journalIcon(item?.icon || part.icon, item?.color, !item) + '</span><small>' + (item ? item.name : '空') + '</small></button>';
    }).join('');
    let detail;
    if (this.page === 'equipment') detail = this.gearDetail(game);
    else if (this.page === 'skills') detail = this.skills(game);
    else if (this.page === 'growth') detail = this.growth(game);
    else detail = this.attributes(game);
    return '<div class="companion-location' + (location.safe ? ' is-safe' : '') + '">' + journalIcon(location.safe ? 'lantern' : 'lock') + '<span>' + location.label + '</span>' + '</div><div class="companion-layout" data-view="' + this.page + '" data-companion="' + this.hero + '"><aside class="companion-roster"><h3>同行伙伴</h3>' + roster + '<p class="companion-roster-hint">◇ 选择人物查看档案</p></aside><section class="companion-showcase"><div class="companion-heading"><h3>' + hero.name + '</h3><p>' + hero.title + ' · ' + stats.stageName + '</p><small>' + (this.page === 'equipment' ? '◇ 人物专属装备 ◇' : hero.role) + '</small></div><div class="companion-doll' + (this.page === 'equipment' ? ' with-slots' : '') + '"><canvas width="560" height="620" data-companion-full="' + this.hero + '" aria-label="' + hero.name + '人物形象"></canvas>' + (this.page === 'equipment' ? slots : '') + '</div><div class="companion-stage">' + (this.page === 'equipment' ? '已装备 ' + Object.values(equipment).filter(Boolean).length + ' / 6' : '当前阶段 · ' + stats.stageName) + '<small>' + (this.page === 'equipment' ? '每件装备仅属于当前人物' : this.hero === 'inuyasha' ? '为守护而挥动的獠牙' : '跨越时空，循光寻玉') + '</small></div></section><section class="companion-information"><nav class="companion-tabs" role="tablist" aria-label="人物资料页">' + tabs + '</nav><div id="companion-detail" role="tabpanel" aria-labelledby="companion-tab-' + this.page + '">' + detail + '</div><p class="companion-feedback" role="status" aria-live="polite">' + this.notice + '</p></section></div>';
  }
  attributes(game) {
    const id = this.hero, spec = HEROES[id], stats = statsFor(id, game.save.heroes[id]), energy = energyView(game, id);
    const hp = game.health[id], ratio = Number.isFinite(hp) ? Math.max(0, hp / stats.maxHp) : 0;
    const status = game.statuses[id], barrier = game.barriers[id], effects = [];
    if (status.poison.length) effects.push('中毒×' + status.poison.length + ' · 每秒' + status.poison.reduce((sum, p) => sum + p.damage, 0).toFixed(1) + '点');
    if (status.slow > 0) effects.push('减速 ' + Math.round(status.slow * 100) + '%');
    if (barrier?.hp > 0 && barrier.life > 0) effects.push('结界 ' + Math.ceil(barrier.hp) + ' · ' + barrier.life.toFixed(1) + '秒');
    const weapon = equippedItems(game.save, id).weapon, item = equipmentDetails(game.save, weapon);
    const defenses = ['physical', 'demon', 'spirit'].map((type, i) => '<div><span>' + ['物理减伤', '妖力减伤', '灵力减伤'][i] + '</span><b>' + (spec.defense?.[type] === undefined && spec.clothing?.[type] === undefined ? '—' : Math.round(Math.min(.8, 1 - (1 - (spec.defense?.[type] || 0)) * (1 - (spec.clothing?.[type] || 0))) * 100) + '%') + '</b></div>').join('');
    return '<div class="companion-vitals"><div><label>生命</label><span class="companion-bar life-bar"><i style="width:' + ratio * 100 + '%"></i></span><b>' + hpText(game, id) + '</b></div><div><label>' + energy.label + '储量</label><span class="companion-bar power-bar"><i style="width:' + energy.ratio * 100 + '%"></i></span><b>' + energy.text + '</b></div></div><details class="reserve-note"><summary>储量说明</summary><p>' + (energy.defaulted ? '当前显示默认储量100／100。技能按冷却施放，储量消耗与恢复尚未开放。' : '技能可消耗的能量储量，与下方力量强度分别记录。') + '</p></details><div class="companion-stat-pair"><div><span>物理攻击</span><strong>' + stats.damage + '</strong></div><div><span>' + energy.label + '强度</span><strong>' + stats.power + '</strong></div></div><div class="companion-status"><span>当前状态</span><strong>' + (effects.join('；') || (Number.isFinite(hp) && hp <= 0 ? '已倒下' : '状态正常')) + '</strong></div><details class="companion-defenses"><summary>防御与抗性</summary><div class="defense-rows">' + defenses + '<div><span>状态免疫</span><b>' + (spec.statusImmunities?.join('、') || '—') + '</b></div></div></details><h4 class="companion-section-title">◇ 当前武器</h4><button type="button" class="equipped-summary" data-companion-tab="equipment">' + journalIcon(item?.icon || 'claw', item?.color) + '<span><strong>' + (item ? item.name + (item.form ? ' · ' + item.form : '') : '徒手 · 爪击') + '</strong><small>' + spec.name + '专属</small><small>' + (item?.effects[0] || '连续爪击压制近敌') + '</small></span><span aria-hidden="true">›</span></button><h4 class="companion-section-title">◇ 当前技能</h4><div class="companion-skill-summary">' + spec.skill.map((name, i) => '<button type="button" data-companion-tab="skills" data-companion-skill="' + (i + 2) + '">' + journalIcon(id === 'inuyasha' ? i ? 'blood' : 'claw' : i ? 'shield' : 'spirit') + '<span>' + name + '<small><kbd>' + (i ? 'I' : 'U') + '</kbd> 冷却 ' + spec.cooldown[i] + '秒</small></span></button>').join('') + '</div>';
  }
  gearDetail(game) {
    const part = EQUIPMENT_SLOTS.find(slot => slot.id === this.slot), current = equippedItems(game.save, this.hero)[this.slot];
    const candidate = this.choosing ? this.preview : current, item = equipmentDetails(game.save, candidate), location = equipmentLocation(game);
    const candidates = this.candidates(game);
    const name = item ? item.name : this.slot === 'weapon' && this.hero === 'inuyasha' ? '徒手 · 爪击' : '尚未装备';
    const details = '<h4 class="companion-section-title">' + part.name + '详情</h4><div class="gear-title"><h3>' + name + '</h3><span>' + HEROES[this.hero].name + '专属</span></div><div class="gear-illustration">' + journalIcon(item?.icon || part.icon, item?.color, !item) + '</div>' + (item ? '<dl class="gear-metadata">' + (item.form ? '<div><dt>当前形态</dt><dd>' + item.form + '</dd></div>' : '') + '<div><dt>获得篇章</dt><dd>' + item.source + '</dd></div></dl><ul class="gear-effects">' + item.effects.map(text => '<li>◇ ' + text + '</li>').join('') + '</ul>' + (item.history ? '<div class="gear-history"><span>形态经历</span><b>' + item.history + '</b></div>' : '') : '<p class="gear-empty">' + (this.slot === 'weapon' && this.hero === 'inuyasha' ? '不携带武器时使用爪击，妖力技能仍可施放。' : '此部位尚未装备物品。旅途中获得的专属装备会出现在候选清单中。') + '</p>');
    if (this.choosing) {
      const choices = candidates.map(id => {
        const gear = equipmentDetails(game.save, id);
        return '<button type="button" class="gear-candidate' + (this.preview === id ? ' selected' : '') + '" data-gear-candidate="' + (id || 'none') + '" aria-pressed="' + (this.preview === id) + '">' + journalIcon(gear?.icon || 'claw', gear?.color) + '<span>' + gearName(game, id) + '<small>' + (id === current ? '当前已装备' : id === null ? '使用爪击' : '可替换') + '</small></span></button>';
      }).join('');
      return '<div class="gear-picker"><div class="gear-picker-heading"><h4>' + part.name + '候选装备</h4><button type="button" data-gear-cancel>返回 <kbd>Esc</kbd></button></div>' + (choices ? '<div class="gear-candidates">' + choices + '</div>' : '<p class="gear-empty">暂无可更换装备。</p>') + '<div class="gear-comparison"><span>当前：' + (current ? gearName(game, current) : '未装备') + '</span><span>预览：' + name + '</span></div>' + details + '<div class="gear-actions"><button class="button secondary" type="button" data-gear-cancel>取消</button><button class="button primary" type="button" data-gear-confirm ' + (candidate === current || !location.safe ? 'disabled' : '') + '>' + (candidate === current ? '当前已装备' : '确认装备') + '</button></div><p class="gear-safety">' + (location.safe ? '选择后仅预览，确认才会更换。' : '仅限安全地点更换装备') + '</p></div>';
    }
    return '<div class="gear-detail">' + details + '<div class="gear-change"><span class="gear-safety">' + journalIcon(location.safe ? 'lantern' : 'lock') + (location.safe ? '仅限安全地点更换' : '返回神社安全地点后可更换') + '</span><button type="button" class="button secondary" data-gear-choose ' + (!location.safe ? 'disabled' : '') + '>' + (location.safe ? '更换' + part.name : '安全地点可更换') + '</button></div></div>';
  }
  skills(game) {
    const id = this.hero, hero = HEROES[id], stats = statsFor(id, game.save.heroes[id]);
    const entries = [
      { name: '普通攻击', icon: id === 'inuyasha' ? usesAwakenedFang(game.save) ? 'sword' : 'claw' : 'bow', key: 'J', type: '物理', cooldown: '连续攻击', effect: id === 'inuyasha' ? '按住J连续攻击；地面S＋J上挑，跳跃后J追击，空中S＋J下砸。' : '向前方目标射箭，辅助瞄准前方妖怪与结点。', value: '物理攻击 ' + stats.damage },
      { name: '闪避', icon: 'dodge', key: 'K / Shift', type: '位移动作', cooldown: '0.88秒', effect: '向面朝方向闪避，短暂无敌；已有中毒仍继续作用。', value: '把握敌人预警与出手时机。' },
      { name: hero.skill[0], icon: id === 'inuyasha' ? 'claw' : 'spirit', key: 'U', type: id === 'inuyasha' ? '妖力' : '灵力', cooldown: hero.cooldown[0] + '秒', effect: id === 'inuyasha' ? '向前挥出范围爪击，压制近处敌人。' : '发射穿透箭，沿途打击多个目标。', value: (id === 'inuyasha' ? '妖力强度 × 2.7' : '灵力强度 × 3.2') + '；目标减伤另算。' },
      { name: hero.skill[1], icon: id === 'inuyasha' ? 'blood' : 'shield', key: 'I', type: id === 'inuyasha' ? '妖力' : '自用结界', cooldown: hero.cooldown[1] + '秒', effect: id === 'inuyasha' ? '错落释放五道血刃，直线穿透目标；每个目标最多承受一次完整技能伤害。' : '为戈薇自身开启耐久48、持续4秒的结界；破界当次伤害不溢出。', value: id === 'inuyasha' ? '妖力强度 × 2.3；目标减伤另算。' : '不恢复生命，也不清除已有中毒。' }
    ];
    const index = Math.max(0, Math.min(this.skill, entries.length - 1)), selected = entries[index];
    const remaining = index >= 2 ? game.cooldowns[id]?.[index - 2] || 0 : index === 1 ? game.dodgeCooldown || 0 : 0;
    const availability = remaining > 0 ? '当前冷却 ' + remaining.toFixed(1) + '秒' : '当前可用';
    return '<h4 class="companion-section-title">◇ 战斗招式</h4><div class="skill-selection">' + entries.map((skill, i) => '<button type="button" data-companion-skill="' + i + '" class="' + (i === index ? 'selected' : '') + '" aria-pressed="' + (i === index) + '">' + journalIcon(skill.icon) + '<span>' + skill.name + '<small><kbd>' + skill.key + '</kbd></small></span></button>').join('') + '</div><div class="skill-detail"><h3>' + selected.name + '</h3><p class="skill-type">' + selected.type + ' · ' + selected.cooldown + ' · ' + availability + '</p><p>' + selected.effect + '</p><p>' + selected.value + '</p><dl><div><dt>获得方式</dt><dd>随人物加入</dd></div><div><dt>使用方式</dt><dd>' + (game.active === id ? '返回战斗后按 ' : '切换至' + hero.name + '后按 ') + selected.key + '</dd></div></dl></div>';
  }
  growth(game) {
    const stage = game.save.heroes[this.hero].stage;
    const nodes = GROWTH[this.hero].slice(0, stage + 1).map((node, i) => {
      const prior = i ? GROWTH[this.hero][i - 1] : null;
      const event = Object.values(GROWTH_EVENTS).find(record => record.hero === this.hero && record.stage === i);
      return '<li class="' + (i === stage ? 'current' : '') + '"><span class="growth-diamond">◇</span><div><h4>' + node.name + '</h4><small>' + (i === stage ? '当前阶段' : '已达成') + '</small><p>' + (prior ? '生命上限 +' + (node.hp - prior.hp) + ' · ' + (this.hero === 'inuyasha' ? '妖力' : '灵力') + '强度 +' + (node.power - prior.power) : '初次踏上旅途') + '</p>' + (event?.unlock ? '<p>解锁 · 铁碎牙觉醒</p>' : '') + '</div></li>';
    }).join('');
    return '<h4 class="companion-section-title">◇ 人物成长</h4><ol class="growth-timeline">' + nodes + '</ol><p class="growth-next">下一条线索<br><strong>继续当前主线，寻找故事中的转变。</strong></p><p class="growth-note">成长由指定剧情与任务触发；已完成事件只记录一次。</p>';
  }
}

export class CommonItemMenu {
  constructor() { this.item = 'herb'; this.target = null; this.choosing = false; this.category = 'items'; }
  open(game) { this.target = game.active; this.choosing = false; }
  back() { if (!this.choosing) return false; this.choosing = false; return true; }
  render(game) {
    const item = COMMON_ITEMS[this.item];
    const count = game.save.inventory[this.item];
    const targets = game.save.unlocked.map(id => '<button type="button" class="item-target' + (this.target === id ? ' selected' : '') + '" data-item-target="' + id + '" aria-pressed="' + (this.target === id) + '" ' + (!(game.health[id] > 0) ? 'disabled' : '') + '><canvas width="200" height="180" data-companion-portrait="' + id + '" aria-hidden="true"></canvas><span><strong>' + HEROES[id].name + '</strong><small>生命 ' + hpText(game, id) + '</small><small>' + (game.statuses[id].poison.length ? '中毒×' + game.statuses[id].poison.length : '无中毒') + '</small></span></button>').join('');
    const reason = itemUseReason(game, this.item, this.target);
    const preview = item.heal && game.health[this.target] > 0 ? '生命 ' + Math.ceil(game.health[this.target]) + ' → ' + Math.ceil(Math.min(game.statsForHero(this.target).maxHp, game.health[this.target] + item.heal)) : '清除当前全部中毒层数';
    return '<div class="common-item-header"><h3>公用道具</h3><p>队伍共同携带，使用时指定目标。</p></div><div class="common-item-layout"><section><div class="common-item-grid">' + Object.entries(COMMON_ITEMS).map(([id, spec]) => '<button type="button" class="common-item-tile' + (this.item === id ? ' selected' : '') + '" data-common-item="' + id + '" aria-pressed="' + (this.item === id) + '">' + journalIcon(spec.icon) + '<strong>' + spec.name + '</strong><span>× ' + game.save.inventory[id] + '</span></button>').join('') + '</div><p class="item-acquisition">首次到访神社灯笼可领取补给，每处只领取一次。</p><details class="journey-collections"><summary>旅途收藏</summary><p>已收集旅途信物 ' + game.save.relics.length + ' 枚</p><p>四魂碎片与已知情报请查看顶部“四魂之玉”。</p></details></section><section class="common-item-detail"><div class="gear-title"><h3>' + item.name + '</h3><span>公用道具 · ' + count + '份</span></div><div class="gear-illustration">' + journalIcon(item.icon) + '</div><p>' + item.description + '</p><p>施用时间 ' + item.castTime + '秒 · 成功后消耗1份</p>' + (this.choosing ? '<h4 class="companion-section-title">选择目标</h4><div class="item-targets">' + targets + '</div><p class="item-effect-preview">' + preview + '</p><div class="gear-actions"><button type="button" class="button secondary" data-item-cancel>返回</button><button type="button" class="button primary" data-item-confirm ' + (reason ? 'disabled' : '') + '>确认使用</button></div><p class="item-use-reason" role="status">' + (reason || '确认后返回战斗施用；生效前取消或受击不消耗。') + '</p>' : '<button type="button" class="button secondary" data-item-choose ' + (!(count > 0) || !['playing', 'paused'].includes(game.state) ? 'disabled' : '') + '>选择使用目标</button><p class="item-use-reason">' + (count ? '由当前出战人物施用，可作用于存活队员。' : '尚未持有，在旅途中寻找未领取的神社补给。') + '</p>') + '</section></div>';
  }
}
