# 人物面板 UI v0.3 · imagegen 提示词
日期：2026-10-28。使用内置imagegen，未使用CLI。
编辑对象：character-equipment-v2.png。
最终图片：character-equipment-v3.png。
原始生成输出保留，最终图片原样复制到项目。

```text
Use case: ui-mockup. Make a focused edit to the supplied Chinese Inuyasha equipment-menu screenshot. Preserve the same 1672x941 full-screen image, dark blue-green translucent surfaces, antique gold cut-corner borders, pixel characters, moonlit shrine background, full top header and six global menus, left two-person roster, right weapon-detail panel, and footer. Do not redesign unrelated content.
USER CHANGE: Split the single "衣装" equipment part into TWO INDEPENDENT equipment slots named exactly "上衣" and "下衣". There must now be SEVEN unique equipment slots in total, exactly one each of: "头部", "上衣", "下衣", "手部", "饰物", "武器", "足部". Remove the old 衣装 slot and the text 初始衣装 entirely.
Reflow only the equipment squares around the central full-body Inuyasha:
- LEFT of the character: FOUR aligned compact equal-size square slots in one vertical column, top to bottom "头部", "上衣", "下衣", "手部".
- RIGHT of the character: THREE compact squares of the same size, top to bottom "饰物", "武器", "足部", with generous equal vertical gaps.
- Keep all seven slots clearly separate and legible, approximately 96x96 pixels each; they fit between y=335 and y=770, outside the character silhouette, and must not collide with the title or bottom count. Slightly reduce all slot sizes together if necessary; preserve the big full-body character and right-side detail pane.
Filled equipment slots:
1. 上衣: a distinct miniature RED KIMONO TOP / JACKET icon only, with sleeves and short upper-body garment, caption "初始上衣". No trousers in this icon.
2. 下衣: a distinct miniature RED HAKAMA / TROUSERS icon only, caption "初始下衣". No jacket in this icon.
3. 武器: existing ivory fang sword miniature and caption "铁碎牙", still SELECTED with bright gold border and diamond.
Empty slots:
头部, 手部, 饰物, 足部 remain subdued grey outline icons with little "空". Character keeps his original red upper garment AND red trousers, white hair, dog ears, bare feet and awakened Tessaiga; this is a slot split, not a costume change.
Update center-bottom count from "已装备 2 / 6" to exact "已装备 3 / 7". Keep the line "每件装备仅属于当前人物". The number three now counts his initial top, initial trousers and weapon.
Everything else stays exactly as before, including top global menu "旅程 伙伴 公用道具 四魂之玉 妖怪图鉴 设置" with 伙伴 selected, local tabs "属性 技能 装备 成长" with 装备 selected, safe location "安全地点 · 神社灯笼", name "犬夜叉", current stage "守护之牙", details "铁碎牙" "犬夜叉专属", current shape 已觉醒, chapter 犬主03 父亲的墓地, physical slash and reach effects, history "锈刀 → 觉醒", button "更换武器", hint "仅限安全地点更换", primary footer "继续旅程 →".
Constraints: Seven slots exactly. 上衣 and 下衣 are separate selectable parts, not two captions inside one slot. No duplicate 部位, no eighth slot, no remaining 衣装 label. All slot boxes visually use the same family and size. Preserve full portrait visibility, all menus, texts, safe-location rule, exclusive equipment ownership, screenshot framing and all footer content. Clean simplified Chinese typography. No new stats, buffs, gear rarity, currencies or story unlocks.
```
