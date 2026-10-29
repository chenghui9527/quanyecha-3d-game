# 伙伴角色卡头像 v1 · 生成记录

日期：2026-10-29。工具：内置 imagegen，透明背景输出；参考图为 [已确认六部位UI](character-equipment-v4.png)。

用途：伙伴列表角色卡使用独立半身头像，左侧占满卡片高度，右侧姓名与身份同一行，成长阶段另起一行。头像不替换战斗、HUD或中央人物素材。

已保存并接入：`assets/ui/companion-inuyasha-v1.png`、`assets/ui/companion-kagome-v1.png`。保留生成原图及透明通道，不裁切改写历史UI设计图。

## 犬夜叉

```text
Use case: background-extraction. Edit target: the supplied approved Chinese game UI. Extract ONLY Inuyasha's head-and-shoulders portrait from the TOP LEFT companion roster card (the small white-haired red-clothed boy card, not the large central standing figure). Produce a clean standalone transparent PNG portrait asset at high resolution. Preserve the design card's exact three-quarter front-facing direction toward screen right, visible golden eyes, serious calm expression, white dog ears, long white hair, red robe, face proportions and bold dark anime outlines. Match the original illustrated/pixel-painterly game UI rendering; do not use the side-profile battle sprite. Composition: one single bust only, include complete ears and top of hair with very little blank space above; white hair fills the left silhouette; shoulders and red upper robe continue to the lower edge, cropped at upper chest. The silhouette fills most of a roughly square canvas, with only a small transparent margin. Preserve genuine alpha transparency. No card, no frame, no background, no text, no badge, no weapon, no other character, no UI. Do not redraw the whole screenshot. This asset will occupy the full height of the left 43 percent of a horizontal companion card.
```

## 戈薇

```text
Use case: background-extraction. Edit target: the supplied approved Chinese game UI. Extract ONLY Kagome's head-and-shoulders portrait from the SECOND LEFT companion roster card (the black-haired girl in a white and green sailor school uniform). Produce a clean standalone transparent PNG portrait asset at high resolution. Preserve the design card's exact three-quarter front-facing direction toward screen right, clearly visible brown eyes, dark blue-black hair with bangs, calm attentive expression, white school uniform with green sailor collar and red tie, face proportions and bold dark anime outlines. Match the original illustrated/pixel-painterly game UI rendering; do not use a side-profile battle sprite. Composition: one single bust only, include complete top of hair with very little blank space above; hair fills the left silhouette; shoulders and white-green upper uniform continue to the lower edge, cropped at upper chest. The silhouette fills most of a roughly square canvas, with only a small transparent margin. Preserve genuine alpha transparency. No card, no frame, no background, no text, no badge, no weapon, no other character, no UI. Do not redraw the whole screenshot. This asset will occupy the full height of the left 43 percent of a horizontal companion card.
```

两份输出均保留原始RGBA透明通道。原始生成结果保留在Codex生成目录，项目资产为独立副本。
