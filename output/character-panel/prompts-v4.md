# 人物面板 UI v0.4 · imagegen 提示词
日期：2026-10-28。使用内置imagegen，未使用CLI。
编辑对象：character-equipment-v3.png。
最终图片：character-equipment-v4.png。
最终图片原样复制到项目，保留原始生成输出及历史稿。

```text
Use case: ui-mockup. Make one localized revision to the supplied 1672x941 Chinese Inuyasha equipment UI screenshot.
USER REQUEST: REMOVE the HEAD EQUIPMENT SLOT entirely. This refers to the slot labelled "头部", not the character's physical head or dog ears.
There must now be exactly SIX separate body-part item squares, three down each side of the central full-body character:
LEFT column, top to bottom:
1. "上衣", miniature red kimono-top icon, caption "初始上衣".
2. "下衣", miniature red hakama/trousers icon, caption "初始下衣".
3. "手部", muted grey glove outline, caption "空".
RIGHT column, top to bottom, unchanged:
1. "饰物", muted grey pendant outline, caption "空".
2. "武器", ivory Tessaiga icon, caption "铁碎牙", selected bright gold border and diamond.
3. "足部", muted grey footwear outline, caption "空".
Rebalance the LEFT three squares to align horizontally with the existing RIGHT three squares, matching their sizes and vertical spacing. The row pairs must be 上衣/饰物, 下衣/武器, 手部/足部. Do not leave an empty head-slot placeholder, gap, outline or label; reflow the left column into a clean three-row arrangement around the character.
Update the count below the character from "已装备 3 / 7" to EXACT "已装备 3 / 6". Keep "每件装备仅属于当前人物". Three filled slots remain: initial top, initial trousers, Tessaiga. Six total slots only.
Preserve everything else in the image: central Inuyasha's full head, ears, white hair, red upper garment and trousers, bare feet and awakened sword; left Inuyasha/Kagome roster; header "旅途手记" "游戏已暂停"; six global menus "旅程 伙伴 公用道具 四魂之玉 妖怪图鉴 设置"; local tabs "属性 技能 装备 成长"; right weapon detail, exclusive ownership tag, chapter and effects, shape-history row; safety indicator "安全地点 · 神社灯笼"; changing-weapon action and safe-location hint; all footer text and gold "继续旅程" button. Same dark blue-green translucent surfaces, antique gold cut-corner frames, pixel illustrations, restrained clouds and moonlit shrine background. No changes to menus, character identity or equipment mechanics.
Constraints: no head slot, no label 头部 anywhere, no seventh slot, no duplicate 上衣/下衣. Same full screenshot framing and dimensions, no cropped footer. Readable exact simplified Chinese. This is a local slot removal and left-column reflow, not a full redesign.
```
