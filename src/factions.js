export const FACTIONS = Object.freeze({
  inuyasha: Object.freeze({ name: '犬夜叉阵营', opening: '封印与玉碎', description: '守护同伴，踏上寻玉之旅。', status: '已开放 · 前三篇', playable: true, startStage: 0 }),
  naraku: Object.freeze({ name: '奈落阵营', opening: '奈落诞生', description: '从鬼蜘蛛的旧事，走向夺玉之局。', status: '筹备中', playable: false, startStage: null })
});

export function playableFaction(id) {
  if (!Object.hasOwn(FACTIONS, id)) throw new Error('无法识别的阵营');
  if (!FACTIONS[id].playable) throw new Error(`${FACTIONS[id].name}的篇章尚未开放`);
  return FACTIONS[id];
}
