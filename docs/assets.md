# 像素素材

生成方式：内置 imagegen 工具。所有游戏使用的生成结果已复制到本项目，运行时无需连接图片服务。

| 文件 | 用途 | 规格 |
| --- | --- | --- |
| `assets/title-scene.png` | 标题场景与森林背景采样 | 1672 × 941，不透明 PNG |
| `assets/ui/title-logo.png` | 已确认全屏首页的朱红／金色书法标题 | 2020 × 778，透明 RGBA PNG；原始生成结果，未重新编码 |
| `assets/ui/faction-scene.png` | 已确认阵营选择页的双阵营无字背景 | 1672 × 941，不透明 PNG；文字、边框和按钮独立实现 |
| `assets/heroes.png` | 犬夜叉、戈薇的待机、奔跑、跳跃、攻击 | 1774 × 887，透明 PNG，4 列 × 2 行 |
| `assets/characters/inuyasha-combat.png` | 犬夜叉三段爪击、上挑、空中追爪、下砸和两项技能的起手与出手 | 1448 × 1086，透明 PNG，4 列 × 4 行，共16姿势 |
| `assets/characters/inuyasha-blood-claws.png` | 飞刃血爪的取血、蓄势、甩出和收势；替换原疾风爪袭的游戏表现 | 1448 × 1086，透明 PNG，2列 × 2行，共4姿势 |

游戏在 Canvas 中读取透明轮廓，按统一比例对齐角色脚底。十五种普通怪使用独立动作图；首批场景物件与平台使用下述独立透明素材，现有首领、机关、特效和界面由游戏代码绘制。音乐、动作音效由 Web Audio 合成。

全屏首页书法标题由内置imagegen参照已确认设计图提取，作为独立透明图叠加在现有森林背景上；菜单和图标为可操作界面，不将整张效果图作为按钮背景。最终提示词见[标题素材](title-logo-art-prompt.md)。

阵营背景由内置imagegen参照已确认选择图移除界面覆盖，保留犬夜叉、戈薇、奈落与两侧场景。奈落仅作路线预览，实际可玩内容另行制作。最终提示词见[阵营背景素材](faction-scene-art-prompt.md)。

## 首批场景资源

生成方式：内置 imagegen，首批六次独立生成，2026-10-24 追加神社门，均为透明 RGBA PNG。最终提示词见 [场景素材提示词](scene-art-prompts.md)，比例与组合规则见 [场景设计](scene-assets-design.md)。

| 文件 | 用途 | 规格 |
| --- | --- | --- |
| `assets/scenery/forest-tree.png` | 普通大树、树冠、藤蔓与树根 | 1254×1254，单体 |
| `assets/scenery/sacred-tree.png` | 御神木、注连绳与纸垂 | 1254×1254，单体 |
| `assets/scenery/village-house.png` | 茅草屋与空门口 | 1536×1024，单体 |
| `assets/scenery/wooden-door.png` | 木门关闭、打开两状态 | 1356×1160，2列×1行 |
| `assets/scenery/bone-eaters-well.png` | 食骨之井 | 1774×887，单体 |
| `assets/scenery/terrain.png` | 泥土地面、岩石平台，各含左右端与中段 | 1536×1024，3列×2行，按实际透明行间隔提取 |
| `assets/scenery/shrine-torii.png` | 神社门（鸟居），替换四关末尾的简易门框 | 1388×1133，单体，门洞透明 |

预览入口为 `scene-lab.html`，离线版本为 `dist/scene-lab.html`。场景单元位于 `src/scenery.js`，与主线、妖怪验证场共用，不改变已有地图碰撞数据。

犬夜叉战斗动作图由内置 imagegen 参照原双人动作图生成，保留原图供待机、奔跑、跳跃和戈薇使用。战斗图根据透明轮廓的连通区域提取完整人物，避免跨格脚尖被裁切或混入下一姿势。爪痕、残影、命中火花与落地冲击均由 Canvas 动态绘制，不烘焙在人物图中。完整提示词见 [犬夜叉战斗动作素材提示词](inuyasha-combat-art-prompt.md)。

飞刃血爪动作图由内置 imagegen 参照既有犬夜叉战斗图生成，独立保存，不覆盖原图；血刃主体、锋缘、拖尾与命中切痕由 Canvas 随弹体飞行绘制。最终提示词见 [飞刃血爪动作素材提示词](inuyasha-blood-claws-art-prompt.md)。

## 五种普通怪动作图

生成方式：内置 imagegen，透明背景；五张均为1774×887 PNG，4列×2行。顺序为待机、移动A、移动B、预警、攻击、收招、受击、死亡。渲染时根据每格透明边界进行对齐，保持同一种怪物的统一缩放比例。

| 文件 | 形象 |
| --- | --- |
| `assets/monsters/crow.png` | 尸舞鸦，三眼、黑羽 |
| `assets/monsters/spider.png` | 蜘蛛头，人头与蛛足结合 |
| `assets/monsters/hornet.png` | 最猛胜，蜂形毒虫 |
| `assets/monsters/harpy.png` | 极乐鸟，人形与鸟身结合；羽毛覆盖人形躯干 |
| `assets/monsters/rat.png` | 铁鼠操纵的妖鼠 |

完整最终提示词见 [怪物素材提示词](monster-art-prompts.md)。独立验证场可同时检查五种造型与动态预览。

## 六种无名群妖基础小怪

2026-10-26使用内置 `image_gen`，参照已通过的动画画面和既有像素风逐种生成；原始RGBA输出直接复制到项目。每种1774×887，4列×2行布局、8个姿势，共48姿势。

| PNG文件 | 形象 | 配套数据 |
| --- | --- | --- |
| `assets/monsters/crawler.png` | 赤眼多足妖 | `crawler.atlas.json` |
| `assets/monsters/maw.png` | 巨口长躯妖 | `maw.atlas.json` |
| `assets/monsters/manyeye.png` | 多眼长虫 | `manyeye.atlas.json` |
| `assets/monsters/eyeball.png` | 赤瞳眼球妖 | `eyeball.atlas.json` |
| `assets/monsters/beetle.png` | 巨颚甲虫妖 | `beetle.atlas.json` |
| `assets/monsters/tongue.png` | 长舌鬼面妖 | `tongue.atlas.json` |

动作顺序同前五种；新六种按完整主体轮廓提取，使用JSON中的帧边界、锚点与主体掩码，保留跨格舌尖并隔离邻格尾端。主体掩码由源图透明轮廓计算，不重绘原始素材。查看[资源预览](../assets/monsters/preview.html)、[文件与改编说明](unnamed-monster-assets.md)、[完整生成提示词](unnamed-monster-generation-prompts.json)。

## 主场景最终提示词

Use case: stylized-concept. Asset type: finished pixel-art title scene and visual direction for a 2D side-scrolling Inuyasha browser action game. Wide 16:9 landscape composition. Create beautiful authentic finely detailed pixel art with visible crisp square pixels, restrained classic 32-bit game palette, atmospheric depth. Inuyasha, white long hair and dog ears, red robe, no sword yet, and Kagome with long black hair, white-and-green school uniform, bow, stand together on a mossy forest path in the right half of the image. Both have elegant 3.5-head-tall game sprite proportions, expressive and recognizable, not tiny chibi. Inuyasha poised facing left with claw ready, Kagome slightly behind with bow. Giant ancient sacred tree, shimenawa rope, distant torii, jade-blue mist, layered dark teal forest, warm shafts of pale gold light, tiny floating leaves and fireflies. The left third should be atmospheric darker forest with comfortable negative space for title and menu drawn separately in HTML. Lower edge has crisp moss-covered rocks and roots, rich forest depth. No text, no UI, no letters, no watermarks. Strict flat side-on game camera, no isometric view, no photorealism, no blurry painterly rendering. Make a polished production-quality pixel game scene.

## 双人动作图最终提示词

Use case: stylized-concept. Asset type: transparent production sprite sheet for a side-view 2D Inuyasha pixel-art action game. Exactly 4 equal-width columns by 2 equal-height rows, 8 cells, clean transparent background, no grid lines, no text. Each cell is a square, all characters have same 3.5-head-tall body proportions, perfectly aligned feet on an identical baseline at 88% of cell height, enough empty transparent padding, entire figure contained within each cell. Crisp handcrafted fine pixel art, not smooth painting, visible pixel edges. All characters face RIGHT. Top row only Inuyasha: long white hair, dog ears, red suikan robe and wide red trousers, barefoot, no sword. Four columns: (1) idle ready stance (2) mid-run with flowing hair (3) airborne jumping (4) powerful claw strike arm extended. Bottom row only Kagome: long black hair, white sailor school blouse with green collar, red bow, green pleated skirt, white knee socks, brown shoes, wooden bow. Four columns: (1) idle holding bow (2) running with bow (3) airborne jumping (4) bow drawn aiming RIGHT. Characters should read as elegant recognizable 3.5-head-tall pixel game sprites. Consistent scale, color, outlines, lighting across all 8 cells. No shadows outside sprites, no extra character, no cropped limbs, no lettering. Transparent alpha background.
