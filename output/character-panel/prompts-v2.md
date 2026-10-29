# 人物面板 UI v0.2 · imagegen 提示词
日期：2026-10-28。使用内置 imagegen，未使用CLI。
编辑参考：character-equipment-v1.png。
最终图片：character-equipment-v2.png。
生成后原样复制到项目，保留第一版与原始生成输出。

```text
Use case: ui-mockup. Precisely redesign the attached Chinese Inuyasha game character-equipment menu into a high-fidelity BODY-SLOT EQUIPMENT UI. This is an edit of the attached previous screenshot, not a new unrelated visual style. Preserve the quiet moonlit Japanese forest background, near-black blue-green translucent menu, fine antique gold cut-corner framing, ivory Chinese typography, cloud motifs, gold diamond selection marks, two existing character identities and footer. Complete flat front-facing 16:9 screenshot at the same 1672x941 canvas. Do not crop any borders or buttons.
NEW INFORMATION ARCHITECTURE:
Top title "旅途手记" and badge "游戏已暂停". Top-right lantern and status "安全地点 · 神社灯笼"; close X, "Esc 返回".
Immediately below title, a GLOBAL navigation row with exactly SIX equally legible menu choices: "旅程" "伙伴" "公用道具" "四魂之玉" "妖怪图鉴" "设置". 伙伴 is selected; 公用道具 is a genuine peer in THIS top global row. Do not put common items inside character equipment.
LEFT roster remains about x=95..350, with heading "同行伙伴" and the two same portrait entries: selected "犬夜叉" "出战" "守护之牙"; "戈薇" "队友" "寻玉之约". Selecting a portrait is viewing a person's own equipment.
Across the top of the content region to the right of roster, use LOCAL tabs "属性" "技能" "装备" "成长"; 装备 selected. Remove the old label 装备与物品 and remove the old nested filters 专属装备/共用道具/剧情物品 entirely.
BODY SLOT AREA is the largest dominant region, roughly x=385..1060 and y=295..795:
At top moderate text "犬夜叉", small "半妖少年 · 守护之牙", and quiet "人物专属装备".
In the middle retain a beautiful clear full-body detailed-pixel Inuyasha, white hair, dog ears, red robes, barefoot, holding his awakened broad ivory fang sword, about 340px tall and scaled to leave ample room for six clearly recognizable square equipment item slots around him. Character must remain 3-to-4-head proportions and not overlap slot boxes or their labels.
SIX SAME-SIZE SQUARE BODY-PART ITEM SLOTS, each approximately 90x90px, antique gold thin cut-corner border and dark opaque interior, arranged THREE DOWN EACH SIDE OF THE CHARACTER. These are discrete clickable RPG item squares, NOT long list rows, NOT weapon cards, NOT floating labels. Align corresponding rows and give vertical breathing room.
- Upper left square labelled "头部": subdued grey headgear outline, little "空".
- Middle left square labelled "衣装": filled with miniature red robe item icon, small "初始衣装".
- Lower left square labelled "手部": subdued grey hand outline, little "空".
- Upper right square labelled "饰物": subdued grey pendant outline, little "空".
- Middle right square labelled "武器": filled with miniature ivory Tessaiga item icon, GOLD SELECTED BORDER and small diamond, small "铁碎牙".
- Lower right square labelled "足部": subdued grey footwear outline, little "空".
Slot labels are above or beside each square and must be readable, never cover the character. Empty outlines are interface icons only, do not dress him in those items. No connectors crossing through the character, no extra seventh slot or duplicate slot names.
Below the doll a small summary "已装备 2 / 6" and "每件装备仅属于当前人物".
RIGHT DETAIL AREA roughly x=1100..1575 separated by one quiet vertical gold line. Selected weapon detail:
small heading "武器详情"; large item name "铁碎牙"; tag "犬夜叉专属".
A moderate horizontal sword illustration inside a compact dark framed area.
"当前形态 · 已觉醒"
"获得篇章 · 犬主03 父亲的墓地"
Two effect lines "普通攻击变为刀斩" and "近战范围提升，保留妖力爪技".
Small noninteractive history "形态经历" "锈刀 → 觉醒".
At lower right a gold outlined, active-looking but modest action "更换武器", with quiet lantern hint "仅限安全地点更换". This screen is SAFE, so show a clear entry to open this part's character-exclusive equipment chooser. No invented extra candidate equipment, no upgrades. Footer's "继续旅程 →" remains the strongest primary gold action.
Footer: "C 人物面板", left/right arrow shortcut "切换页签", small "当前出战：犬夜叉", button "继续旅程 →".
Priority hierarchy: six body-part equipment squares around the character must be the obvious new interaction, not a list in a distant sidebar. Right side only provides selected-slot details. Menu 公用道具 must occur ONCE in top global navigation and nowhere inside 装备. Simplified Chinese exact copy, clean crisp text and numerals. No XP, skill points, currencies, rarity stars, crafting, random affixes, speculative bonuses, extra characters, shared equipment, trading or transfer buttons. Footwear/headgear/handwear/accessories are EMPTY, only weapon and initial robe are filled. The six body part choices are UI layout proposals, not new story unlocks. Preserve overall game aesthetic and practical desktop readability.
```
