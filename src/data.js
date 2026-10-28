export const WIDTH = 960;
export const HEIGHT = 540;
export const FLOOR = 454;
export const HERO_SWITCH_COOLDOWN = 1;
export const HEROES = {
  inuyasha: { name: '犬夜叉', title: '半妖少年', role: '近战 · 血刃', color: '#ed775e', maxHp: 180, damage: 26, speed: 244, skill: ['散魂铁爪', '飞刃血爪'], cooldown: [5.5, 8], description: '白发随风，赤衣如火。以连续爪击压制近敌，挥出自身鲜血化成的飞刃，截击远处的妖怪。' },
  kagome: { name: '戈薇', title: '跨越时空的少女', role: '远程 · 净化', color: '#88c9ac', maxHp: 145, damage: 22, speed: 228, skill: ['破魔之矢', '灵光守护'], cooldown: [5.5, 11], description: '从食骨之井来到战国的少女。以弓箭保持距离，用灵力击破妖气，在危急时刻守护同伴。' }
};
export const CHAPTERS = [
  { id: '犬主01', name: '封印与玉碎', stages: [0, 1], summary: '穿过古井，解开封印，在碎玉之光中约定同行。' },
  { id: '犬主02', name: '逆发之森', stages: [2, 3], summary: '戈薇辨认发丝，犬夜叉开路，共同击破结罗的赤骸。' },
  { id: '犬主03', name: '父亲的墓地', stages: [4, 5], summary: '识破假母，进入父亲的墓地，面对杀生丸与铁碎牙的选择。' }
];
export const GROWTH = {
  inuyasha: [{ name: '封印初解', hp: 0, power: 0 }, { name: '并肩同行', hp: 16, power: 4 }, { name: '守护之牙', hp: 32, power: 8 }],
  kagome: [{ name: '异世来客', hp: 0, power: 0 }, { name: '寻玉之约', hp: 16, power: 4 }]
};
export const SPEAKERS = { narrator: '战国物语', yura: '逆发结罗', kaede: '枫', myoga: '冥加', sesshomaru: '杀生丸', jaken: '邪见', mother: '母亲的幻影' };
const line = (who, text) => ({ who, text });
export const STORY = {
  intro: [line('narrator', '一口古井，连接着相隔五百年的两个世界。十五岁的日暮戈薇，还不知道自己的命运即将改变。'), line('kagome', '这里……不是神社？先沿着这条路找找看吧。')],
  release: [line('kagome', '那棵树上……有人？白色的头发，还有耳朵……'), line('inuyasha', '喂！想活命的话，就把这支箭拔掉！'), line('narrator', '封印之箭被拔下。沉睡的半妖少年睁开眼，红衣掠过林间。'), line('inuyasha', '这种小妖怪，就交给我！')],
  level0End: [line('kagome', '你叫……犬夜叉？谢谢你刚才救了我。'), line('inuyasha', '少啰嗦。那颗四魂之玉，可不是普通的石头。'), line('narrator', '在枫婆婆的帮助下，两人的命运第一次交织。村落外，新的妖气正在靠近。')],
  level1Start: [line('narrator', '四魂之玉引来了窥伺的妖怪。一只尸舞鸦掠过村庄，夺走了那颗发光的玉。'), line('kagome', '它往村外飞了！我也要去，不能再让村民受伤。'), line('inuyasha', '跟紧了！对付天上的家伙，你的弓应该派得上用场。')],
  shatter: [line('kagome', '就是现在……！'), line('narrator', '箭矢划破天空。尸舞鸦坠落，四魂之玉也随之碎裂，化作无数光芒飞向远方。'), line('kagome', '碎……碎掉了？这些光，散到四面八方去了。'), line('inuyasha', '这下麻烦了。碎片落进妖怪手里，也一样危险。')],
  level1End: [line('narrator', '枫婆婆叮嘱：哪怕只是一小片四魂之玉，也可能让妖怪变得强大。'), line('kagome', '既然是我打碎的，我会把它们找回来。'), line('inuyasha', '哼……那就别拖后腿。')],
  level2Start: [line('kagome', '等一下。树之间好像有什么东西……是一根根头发？'), line('inuyasha', '我看不见。你来告诉我位置，我把它们劈开。'), line('narrator', '追寻碎片的路上，无形的发丝正将整片森林织成陷阱。')],
  level2End: [line('kagome', '这些头发都连向前面。操纵它们的妖怪，一定在那里。'), line('inuyasha', '躲在暗处算什么本事？走，去找她算账。')],
  level3Start: [line('yura', '真是稀罕的白发……还有四魂之玉的气息。你们一个也别想走。'), line('kagome', '红色的骷髅……那里的妖气最强！先打碎那些发丝结点！'), line('inuyasha', '你指路，我来开路。可别被她的头发缠住了！')],
  ending: [line('narrator', '发丝散去，森林恢复了风声。结罗持有的碎片，回到了两人手中。'), line('kagome', '刚才……我们配合得还不错吧？'), line('inuyasha', '也、也就那样。下次可别再乱来了。'), line('myoga', '犬夜叉少爷！有关您父亲留下的东西，有人也在寻找……')],
  villageShard: [line('kagome', '这就是落在村外的那一片。光芒很微弱，可我能感觉到它。'), line('kaede', '把它收好。剩下的玉散落在各地，别让妖怪借它伤人。')],
  yuraShard: [line('kagome', '发丝结点里的碎片……拿到了！'), line('inuyasha', '先收好。还有别的家伙也在找这些东西。')],
  shardMoved: [line('kagome', '这里曾经有碎片的气息，但它已经被带走了。'), line('inuyasha', '回到原地也找不回来。得追查现在的持有者。')],
  tombStart: [line('myoga', '少爷，您的兄长杀生丸正在寻找铁碎牙，那是您父亲留下的刀。'), line('inuyasha', '杀生丸？他来找我，可不会有什么好事。'), line('mother', '犬夜叉，过来……让我看看你。'), line('kagome', '等等。她的脚下没有影子。先靠近查清楚！')],
  unmask: [line('kagome', '她不是你的母亲！这只是用回忆造出的幻影！'), line('inuyasha', '竟敢拿我母亲来做这种事……'), line('sesshomaru', '墓地的入口，原来藏在你的右眼中。'), line('narrator', '黑珍珠显现，通往妖怪墓地的门在巨大的骸骨间打开。')],
  tombGate: [line('myoga', '这具骸骨，就是您父亲长眠的地方。铁碎牙就在前面。'), line('inuyasha', '跟紧我。杀生丸一定也进去了。')],
  fangStart: [line('jaken', '半妖也想染指铁碎牙？这把刀该由杀生丸少爷继承！'), line('sesshomaru', '让开。'), line('narrator', '锈迹斑斑的刀插在石台上。结界拒绝着杀生丸；犬夜叉也没能将它拔出。'), line('kagome', '我来试试。切换为戈薇，靠近石台按 E。')],
  fangFailed: [line('inuyasha', '可恶……为什么还是拔不出来？'), line('kagome', '先让我来。也许它在等的，不是妖力。')],
  fangTaken: [line('kagome', '啊……拔出来了！'), line('sesshomaru', '人类竟然能越过结界。'), line('inuyasha', '戈薇，退到后面！'), line('narrator', '铁碎牙被取下，但仍是一把锈刀。先抵挡杀生丸的攻势。')],
  fangAwaken: [line('sesshomaru', '你护着这个人类，能改变什么？'), line('inuyasha', '我不会让你伤害她！'), line('narrator', '回应守护之心，锈刀化为巨大的獠牙。铁碎牙终于显露力量。'), line('myoga', '这才是老爷留下的刀！用斩击迎战，小心他化成妖犬后的扑袭！')],
  tombEnd: [line('sesshomaru', '这把刀……竟然选择了你。'), line('narrator', '杀生丸退去。兄弟之间的争端尚未结束，铁碎牙却已有了归属。'), line('kagome', '铁碎牙保护了我们。接下来，一起把碎片找回来吧。'), line('inuyasha', '哼，走了。'), line('narrator', '前三篇的旅程告一段落。远方仍有散落的玉，也有等待相遇的伙伴。')]
};

const encounter = (x, types, count = 1) => ({ x, types, count });
export const LEVELS = [
  { id: 0, name: '封印之森', subtitle: '食骨之井 · 命运的相遇', badge: '壹', palette: 'forest', length: 6200, goal: '沿森林前行，找到神木', intro: 'intro', outro: 'level0End', gaps: [[1560, 128], [2940, 142], [4490, 146]], platforms: [[1080, 360, 150], [1350, 326, 130], [2520, 354, 180], [2760, 306, 120], [4110, 350, 170]], checkpoints: [1980, 3930, 5440], relics: [[1390, 285], [2810, 265], [4200, 310]], encounters: [encounter(940, ['centipede'])], storyEvents: [{ x: 640, key: 'release', unlock: 'inuyasha' }] },
  { id: 1, name: '碎玉之光', subtitle: '枫之村外 · 飞散的四魂之玉', badge: '贰', palette: 'village', length: 7000, goal: '追踪妖鸟，守护村外道路', intro: 'level1Start', outro: 'level1End', gaps: [[1820, 138], [3590, 146], [5160, 152]], platforms: [[1410, 350, 180], [1650, 302, 120], [3120, 350, 180], [3370, 300, 140], [4700, 350, 170], [4940, 300, 135]], checkpoints: [2310, 4110, 6010], relics: [[1700, 260], [3410, 260], [5000, 260]], encounters: [encounter(600, ['crow']), encounter(2440, ['crow', 'crow', 'crow']), encounter(3500, ['crow', 'crow'])], storyEvents: [{ x: 3800, key: 'shatter' }] },
  { id: 2, name: '发丝迷林', subtitle: '幽暗山道 · 看不见的陷阱', badge: '叁', palette: 'night', length: 7400, goal: '避开发丝，追寻妖气的源头', intro: 'level2Start', outro: 'level2End', gaps: [[1640, 146], [3350, 150], [5210, 152]], platforms: [[1210, 350, 170], [1460, 302, 130], [2890, 346, 160], [3140, 300, 135], [4750, 345, 170], [5010, 300, 130]], checkpoints: [2050, 3910, 5860], relics: [[1510, 260], [3190, 260], [5060, 260]], encounters: [], traps: [970, 2660, 4530, 6470], storyEvents: [] },
  { id: 3, name: '赤骸之巢', subtitle: '逆发结罗 · 第一次并肩作战', badge: '肆', palette: 'yura', length: 4300, goal: '击破发丝结点，战胜逆发结罗', intro: 'level3Start', outro: 'ending', gaps: [[1420, 138]], platforms: [[1020, 350, 150], [1250, 300, 140], [2260, 350, 160]], checkpoints: [1930, 2890], relics: [[1300, 260], [2330, 310], [2820, 366]], encounters: [], traps: [2110], storyEvents: [], bossX: 3550, boss: 'yura' },
  { id: 4, name: '假母与黑珍珠', subtitle: '墓地之门 · 被利用的思念', badge: '伍', palette: 'grave', length: 3100, goal: '靠近母亲幻影，按 E 查明真相', intro: 'tombStart', outro: 'tombGate', gaps: [[1370, 130], [2210, 140]], platforms: [[1000, 350, 180], [1700, 325, 180], [1980, 360, 150]], checkpoints: [1600, 2580], relics: [[1060, 310], [1780, 285], [2650, 390]], encounters: [], storyEvents: [], interactions: [{ id: 'unmask', x: 850, dialogue: 'unmask', label: '查明幻影' }], required: ['unmask'] },
  { id: 5, name: '守护之牙', subtitle: '父亲的墓地 · 铁碎牙的选择', badge: '陆', palette: 'grave', length: 2650, goal: '切换戈薇，靠近石台按 E 拔刀', intro: 'fangStart', outro: 'tombEnd', gaps: [], platforms: [[340, 370, 180], [1780, 345, 210]], checkpoints: [900], relics: [[420, 330], [1850, 305], [2300, 390]], encounters: [], storyEvents: [], bossX: 1580, boss: 'sesshomaru', interactions: [{ id: 'fang-taken', x: 680, dialogue: 'fangTaken', label: '拔出铁碎牙', hero: 'kagome' }], required: ['fang-taken', 'fang-awaken'] }
];
LEVELS[1].storyEvents[0].afterEncounters = true;
LEVELS[1].interactions = [{ id: 'village-shard', x: 4140, dialogue: 'villageShard', label: '拾起四魂碎片', shard: 'village', needs: 'shatter' }];
LEVELS[1].required = ['shatter', 'village-shard'];
LEVELS[3].interactions = [{ id: 'yura-shard', x: 3550, dialogue: 'yuraShard', label: '收取结罗的碎片', shard: 'yura', bossDefeated: true }];
LEVELS[3].required = ['yura-shard'];
LEVELS.forEach(level => { level.chapter = CHAPTERS.find(chapter => chapter.stages.includes(level.id)).id; });

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export function statsFor(id, hero) {
  const base = HEROES[id];
  const growth = GROWTH[id][clamp(hero?.stage || 0, 0, GROWTH[id].length - 1)];
  return { maxHp: base.maxHp + growth.hp, damage: base.damage, power: base.damage + growth.power, powerType: id === 'kagome' ? 'spirit' : 'demon', speed: base.speed, stageName: growth.name };
}
