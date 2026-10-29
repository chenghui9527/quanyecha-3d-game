# 人物面板 UI v0.1 · imagegen 提示词
日期：2026-10-28。使用内置 imagegen；以既有图片为编辑参考，未使用CLI或API密钥。

## 参考与最终文件
- 原手记：../../output/ingame-ui/pause-overview-v1.png
- 原角色：../../assets/heroes.png
- 最终属性页：character-attributes-v1.png
- 最终装备页：character-equipment-v1.png
- 最终属性页以初稿为编辑对象；最终装备页以最终属性页为编辑对象，保持页头、人物及分栏一致。

## 1. 属性页初稿
```text
Use case: ui-mockup, high fidelity game menu screenshot.
Edit target: image 1 is the existing paused journal UI for this Chinese Inuyasha side-scrolling action game. Redesign its CONTENT into the selected 伙伴 character page while preserving its visual identity: widescreen 16:9, quiet defocused moonlit Japanese forest/shrine background, near-black blue-green translucent panels, fine antique gold double-line cut-corner borders, subtle Japanese cloud patterns, ivory Chinese typography, small diamond selection accents. Image 2 is ONLY the character identity and pixel illustration reference. Use its white-haired, dog-eared, red-robed barefoot Inuyasha and black-haired green-uniform Kagome; do not show a sprite sheet.
Primary request: a polished, believable, readable desktop CHARACTER ATTRIBUTES UI, a complete single 16:9 screen approximately 1920x1080. All on-screen copy must be simplified Chinese exactly as specified, numerals clean and crisp. Flat front-facing screenshot, no perspective, no presentation sheet or external notes.
Structure:
- The outer journal window fills about 92% width and 88% height, with safe interior padding and all footer buttons visible.
- Header: moderately sized title "旅途手记", secondary small "伙伴档案", badge "游戏已暂停". Top right a tiny lantern with quiet jade text "安全地点 · 神社灯笼" plus close X and "Esc 返回".
- Existing global navigation in one row: "旅程" "伙伴" "四魂之玉" "妖怪图鉴" "设置"; 伙伴 selected with thin gold underline/diamond.
- Main body has three aligned columns, approximately 17% roster, 31% character art, 52% information; restrained separators instead of excessive nested boxes.
- LEFT: title "同行伙伴". Two compact full-width portrait entries. Selected Inuyasha portrait with gold selected border, "犬夜叉", "出战", small "守护之牙"; second Kagome portrait, "戈薇", "队友", small "寻玉之约". Small bottom line "选择人物查看档案". No locked unknown roster slots.
- CENTER: large beautiful 3-to-4-head-tall detailed pixel character illustration, full body visible, reference identity faithful. Inuyasha relaxed confident standing pose, carrying awakened broad ivory Tessaiga, feet on a restrained misty circular ground accent, no attack effects. Above character: large name "犬夜叉"; below name "半妖少年 · 近战". Below art a compact stage marker "当前阶段 · 守护之牙", and one quiet line "为守护而挥动的獠牙".
- RIGHT: local tabs across top "属性" "技能" "装备与物品" "成长", 属性 selected. A clean generous two-row vital block: red life bar labelled "生命" with "176 / 212"; purple resource bar labelled "妖力储量" with "100 / 100" and a tiny unobtrusive info dot. Do NOT confuse the reserve with strength.
- Below vital block: two crisp side-by-side numeric attributes "物理攻击 26" and "妖力强度 34". Below a slim status row "当前状态" "状态正常". Then a quiet disclosure row "防御与抗性" with chevron, no invented percentages.
- Lower right compact current weapon summary with elegant small sword illustration, header "当前武器", title "铁碎牙 · 已觉醒", ownership "犬夜叉专属", description "刀斩普攻 · 近战范围提升". This is a summary row rather than a huge card.
- At the bottom of information area two compact skill entries with illustrated icons: "散魂铁爪" key U "冷却 5.5秒"; "飞刃血爪" key I "冷却 8秒". Clear hierarchy; no giant icon tiles, no action attack button in the paused menu.
- Footer inside outer frame: left quiet hint "C 人物面板" and "← → 切换页签". Lower middle subtle "当前出战：犬夜叉". Right a tasteful glowing gold primary button "继续旅程 →".
Constraints: each person owns exclusive equipment; no equipment-sharing or transfer button. Equipment changes allowed only in safe locations (this view is safe). All numbers are UI examples from actual initial three-chapter game configuration. No experience, XP, skill points, coins, rarity stars, gacha, upgrade resources, crafting, weight/capacity, ATK growth arrows or fabricated stats. Only two current playable characters. No photorealistic characters, no giant empty parchment, no bright white dashboard, no floating tooltips, no UI overlaps, no cropped footer, no huge title wasting space. Preserve game aesthetic while making dense information readable.
```

## 2. 属性页导航及技能图标修订（最终）
```text
Use case: ui-mockup. Edit the supplied high fidelity 16:9 Chinese Inuyasha character menu. Preserve its dark blue-green translucent surfaces, delicate antique-gold cut-corner borders, Chinese ivory typography, original Inuyasha and Kagome pixel identities, full-body Inuyasha illustration, gold footer, quiet shrine background, two-person roster and layout. Complete front-on game screenshot with every text and button inside the frame, no crop and no external annotations.
Required navigation refinement: add a compact GLOBAL journal navigation row directly beneath the title header, above the three-column content: "旅程" "伙伴" "四魂之玉" "妖怪图鉴" "设置", with 伙伴 selected by a thin gold underline/diamond. These five global tabs must ALL be present in addition to the four local tabs on the right: "属性" "技能" "装备与物品" "成长". Reduce the giant journal title and body illustration/vertical spacing slightly to fit; preserve bottom footer visibility. The center full-body figure and stage marker remain. Do not add random stats, XP, skill points, coins, equipment rarity, crafting, trading, upgrade resources or unfamiliar characters. All text simplified Chinese and crisp.
Keep the 属性 local tab selected and preserve all current contents and exact values: 生命 176 / 212; 妖力储量 100 / 100 with tiny info dot; 物理攻击 26; 妖力强度 34; 当前状态 状态正常; 防御与抗性; 当前武器 铁碎牙·已觉醒 犬夜叉专属 刀斩普攻·近战范围提升; 散魂铁爪 U 冷却5.5秒; 飞刃血爪 I 冷却8秒. Make 散魂铁爪 icon five bright gold-white claw slashes; 飞刃血爪 stays crimson curved blood slashes. Header badge "安全地点 · 神社灯笼". Footer button "继续旅程 →". Main screenshot remains a safe-location attributes view.
```

## 3. 装备页初稿（历史，未选为最终）
```text
Use case: ui-mockup. Edit the supplied high fidelity 16:9 Chinese Inuyasha character menu. Preserve its dark blue-green translucent surfaces, delicate antique-gold cut-corner borders, Chinese ivory typography, original Inuyasha and Kagome pixel identities, full-body Inuyasha illustration, gold footer, quiet shrine background, two-person roster and layout. Complete front-on game screenshot with every text and button inside the frame, no crop and no external annotations.
Required navigation refinement: add a compact GLOBAL journal navigation row directly beneath the title header, above the three-column content: "旅程" "伙伴" "四魂之玉" "妖怪图鉴" "设置", with 伙伴 selected by a thin gold underline/diamond. These five global tabs must ALL be present in addition to the four local tabs on the right: "属性" "技能" "装备与物品" "成长". Reduce the giant journal title and body illustration/vertical spacing slightly to fit; preserve bottom footer visibility. The center full-body figure and stage marker remain. Do not add random stats, XP, skill points, coins, equipment rarity, crafting, trading, upgrade resources or unfamiliar characters. All text simplified Chinese and crisp.
Change ONLY the right content pane into 装备与物品 with that local tab selected, and show a combat-area equipment lock state. Preserve left roster and center illustration exactly, including selected 犬夜叉/出战 and 戈薇/队友, current stage守护之牙. Set top-right location status to a small lock with subdued amber text "战斗区域 · 仅可查看".
Right pane at top: three small internal text filters "专属装备" selected, "共用道具", "剧情物品".
Below: slim labelled equipment list with two rows. Selected row features small sword art and "武器" "铁碎牙 · 已觉醒" and "已装备". Second row features a small red robe icon and "衣装" "初始衣装". These are his own equipment; no transfer, sharing or swapping to Kagome controls.
Below selected list show a clear detail header "铁碎牙", tag "犬夜叉专属", and a wide horizontal ivory fang sword illustration on a very dark subtle panel. Detail text: "当前形态 · 已觉醒"; "获得篇章 · 犬主03 父亲的墓地". Short effect lines: "普通攻击变为刀斩" and "近战范围提升，保留妖力爪技".
At lower right a thin record "形态经历" with a small non-interactive history "锈刀 → 觉醒"; this is history, not swappable forms.
Below a full-width subdued outlined disabled action with small lock icon and exact label "安全地点可更换", and one readable quiet sentence "前往安全地点后，可更换该人物的专属装备". The disabled state must be unmistakable through both icon/text and reduced emphasis. No bright enabled equipment-change button in combat.
Footer keeps "C 人物面板", arrow shortcut, "当前出战：犬夜叉", and gold "继续旅程 →". The only bright gold primary action is continuing the journey. Keep detail pane readable, not cluttered.
```

## 4. 装备页最终局部修改
```text
Use case: ui-mockup. Make a precise localized edit to image 1, the supplied character ATTRIBUTES game-menu screenshot. The entire HEADER, global navigation row, LEFT roster, CENTER character illustration, all column boundaries, stage marker, outer window border and BOTTOM footer must remain EXACTLY in their existing locations and sizes. Do not rearrange or combine the two header rows. In particular keep the existing global row "旅程 伙伴 四魂之玉 妖怪图鉴 设置" on its OWN row below "旅途手记 游戏已暂停". Preserve the visible pause badge. Keep all styling and pixels outside the right content pane unchanged except the top-right location label described below.
Change the local right tab selection from 属性 to 装备与物品. Change header safe-location label only to small amber lock "战斗区域 · 仅可查看".
Replace ONLY the right-side pane below its local tabs, approximately x=930..1580 and y=283..804 in a 1672x941 image, with the following compact equipment content, fitting cleanly inside that rectangle:
- Three compact filters: "专属装备" active, "共用道具", "剧情物品".
- Two thin equipment rows: sword icon "武器" "铁碎牙 · 已觉醒" "已装备"; red robe icon "衣装" "初始衣装".
- Detail section: "铁碎牙" with small "犬夜叉专属" tag; a horizontal ivory broad fang sword illustration about 85 pixels tall, not oversized.
- Information lines "当前形态 · 已觉醒" and "获得篇章 · 犬主03 父亲的墓地".
- Two effects "普通攻击变为刀斩" and "近战范围提升，保留妖力爪技".
- Compact non-interactive history row "形态经历" "锈刀 → 觉醒".
- A clearly disabled grey outlined action with lock icon "安全地点可更换"; below it one short line "返回安全地点后可更换专属装备".
Use comfortable compact Chinese typography, align everything, reduce internal padding instead of changing the global header or center character. Each character owns his or her equipment, no transferring to other characters. This is a combat location so equipment changing is locked, while the existing bottom gold "继续旅程 →" remains enabled. No new equipment, no invented stats, XP, skills or effects. Same exact 16:9 image size and layout. This is a local pane replacement, not a full-screen redesign.
```
