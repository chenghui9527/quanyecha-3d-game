# 十种无名群妖 · 基础小怪资源

日期：2026-10-26。用户已确认全部十个参考对象用于基础小怪制作。01～06沿用已完成资源，本轮追加07～10；十种均已制作并接入普通怪库，连同既有五种，现有总库为十五种。

## 查看与文件

- [十种资源预览](../assets/monsters/preview.html)：循环八个姿势、单姿势定格、左右朝向、整图和取帧数据。
- [离线战斗验证场](../dist/monster-lab.html)：选择各物种的单只／3只／5只，或四组基础小怪混合组合；支持双角色、爪击连招与技能预览。
- [已通过的动画参考](unnamed-monster-reference-review.md)：四张完整动画画面、十个局部位置及来源。

| 编号 | 基础小怪 | PNG动作图 | 取帧数据 | 首版行为 |
| --- | --- | --- | --- | --- |
| 01 | 赤眼多足妖 | [crawler.png](../assets/monsters/crawler.png) | [crawler.atlas.json](../assets/monsters/crawler.atlas.json) | 多足爬行，抬前躯后短冲突咬 |
| 02 | 巨口长躯妖 | [maw.png](../assets/monsters/maw.png) | [maw.atlas.json](../assets/monsters/maw.atlas.json) | 腹部蠕行，收颈后巨口扑咬 |
| 03 | 多眼长虫 | [manyeye.png](../assets/monsters/manyeye.png) | [manyeye.atlas.json](../assets/monsters/manyeye.atlas.json) | 蠕行接近，蜷身后顶咬 |
| 04 | 赤瞳眼球妖 | [eyeball.png](../assets/monsters/eyeball.png) | [eyeball.atlas.json](../assets/monsters/eyeball.atlas.json) | 低空漂浮，锁定方向后冲撞 |
| 05 | 巨颚甲虫妖 | [beetle.png](../assets/monsters/beetle.png) | [beetle.atlas.json](../assets/monsters/beetle.atlas.json) | 六足爬行，张颚后短冲夹击 |
| 06 | 长舌鬼面妖 | [tongue.png](../assets/monsters/tongue.png) | [tongue.atlas.json](../assets/monsters/tongue.atlas.json) | 四足贴地爬行，伏低后原地伸舌 |
| 07 | 翼膜人面妖 | [wingface.png](../assets/monsters/wingface.png) | [wingface.atlas.json](../assets/monsters/wingface.atlas.json) | 振翼低飞，收翼后锁定方向扑抓 |
| 08 | 瘤背长颈妖 | [humpneck.png](../assets/monsters/humpneck.png) | [humpneck.atlas.json](../assets/monsters/humpneck.atlas.json) | 四足慢行，抬颈后伸颈突咬 |
| 09 | 青面独眼妖 | [cyclops.png](../assets/monsters/cyclops.png) | [cyclops.atlas.json](../assets/monsters/cyclops.atlas.json) | 双足弓身前行，张口短扑 |
| 10 | 骷面垂须妖 | [skullwhisker.png](../assets/monsters/skullwhisker.png) | [skullwhisker.atlas.json](../assets/monsters/skullwhisker.atlas.json) | 四足贴地爬行，低头后短冲突咬 |

十张均为1774×887、真实透明RGBA PNG，4列×2行布局，共80个姿势。本轮新增四张、32个姿势。顺序：待机、移动A、移动B、预警、攻击、收招、受击、死亡。主角与已有怪物的PNG资源继续沿用。

## 动画外形与游戏补全

- 01保留紫色分节、赤眼、青绿口部附肢与多足；补出低伏躯体和尾端。
- 02保留浅紫色长躯、突眼、巨口与獠牙；缩短长躯，补出腹部爬行。
- 03保留红紫色分节、头部绿色多眼与口须；补出紧凑尾端和蠕行动作。
- 04保留白色眼球、赤色虹膜、黑色瞳孔与周边肉质轮廓；补出短尾及低空漂浮。
- 05保留灰绿甲壳、圆形大眼与巨颚；补成六足、圆腹的完整甲虫轮廓。
- 06保留参考画面左上角的浅发、红紫鬼面与长舌；补成毛发覆盖的短躯和四足爬行。
- 07保留深发人面、浅褐上身与翼膜轮廓；补出短小下身、双足、翼膜连接与低空飞行、扑抓动作。
- 08保留紫灰长颈、深蓝圆块状瘤背与褐色刺毛边缘；补出四足、短尾和紧凑躯体，瘤背不设置护甲免伤。
- 09保留青蓝面部、斑点圆眼、黑色毛刺与尖牙口；补出深青色短躯、双臂双足和扑咬。单眼形态是本次游戏设计，不认定原帧已证明其另一侧无眼。
- 10保留灰紫骷面、暗色眼窝状区域、齿口与浅色垂须；补出低伏四足、短尾和暗绿灰腹部。垂须按游戏须状附肢表现，其真实原作性质仍未确认。

这些称呼是游戏图鉴归类名，身体补全、尺寸、动作和攻击规则属于游戏改编；不将其写为原作正式物种、命名或已确认能力。不额外增加射线、催眠、抓取、定身等能力。

## 基础小怪定位

- 十种均可被普通攻击打断、被上挑浮空、连续爪击与范围技能清理；不设置霸体、护甲免伤、回血或阶段变化。
- 所有攻击有独立预警、出手与收招；接触身体不造成伤害，同一次攻击只命中一次，进攻槽沿用最多两只。
- 04、07的低空高度保持普通爪击可处理，出手后不继续追踪；06长舌只朝锁定面向出击，不抓取或控制角色。08～10沿用短冲咬击，速度、预警与收招分别配置，09不放眼部射线，10垂须不延伸为远程攻击。
- 生命、伤害、速度和尺寸为首版调试值，见 `src/monsters.js`；仍按主线成长及双角色体验继续平衡。
- 四组基础小怪验证组合为“多足＋巨口＋多眼”“甲虫＋长舌＋眼球”“翼膜＋瘤背＋多足”“青面＋骷面＋长舌”。后两组为本轮新增，用于验证，不等同于主线遭遇配置。
- 已纳入图鉴与存档认可的ID集合；主线目前仍沿用前三篇原有投放，十种无名小怪留待对应的群妖章节配置。

## 素材读取与复用

使用内置 `image_gen`，逐种独立生成，输入为动画结构参考及现有 `spider.png` 像素风参考。原始输出直接复制到项目，没有重绘、抠色或重新编码；完整提示词见 [生成提示词集](unnamed-monster-generation-prompts.json)，原始生成路径记录见 [生成文件记录](references/unnamed-yokai/generated-files.json)。

长舌、翼膜、长颈和部分长躯姿势跨越名义格线，因此资源使用**每格主轮廓的完整边界**取帧。对应 `.atlas.json` 给出每姿势的 `x/y/w/h`、`pivotX/pivotY` 与主体位掩码 `mask`。位掩码按帧内逐行像素编码，Base64解码后，每字节从低位到高位对应8个像素；仅绘制置1的像素，避免相邻尾端进入矩形边界。不应只按等宽格线机械裁切，也不应省略主体掩码。渲染保持身体锚点，伸舌时不会把整个身体拉向后方。独立的死亡妖气散点不纳入主体轮廓，实机沿用共通妖气消散反馈。

原图有少量轻微的像素边缘杂色，当前未对生成图片做颜色清理。此批作为可用首版动作资源；后续可在不改变轮廓与取帧契约的前提下继续精修。

更换图片后运行 `node scripts/monster-atlases.mjs --write`，重新生成取帧数据和资源预览；只检查时运行 `node scripts/monster-atlases.mjs`。回归覆盖透明通道、80个完整主体轮廓、长舌跨格取帧、攻击取消、两名角色击杀全部十五种怪物及验证场选择、两组新增混合战。
