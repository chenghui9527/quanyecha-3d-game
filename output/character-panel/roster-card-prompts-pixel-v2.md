# 伙伴角色卡头像 v2 · 像素风修正

日期：2026-10-29。工具：内置 imagegen；意图：将v1平滑动漫半身头像重绘为像素画，保留身份与构图。透明背景输出。

编辑目标：[犬夜叉v1](../../assets/ui/companion-inuyasha-v1.png)、[戈薇v1](../../assets/ui/companion-kagome-v1.png)。像素风参考：[现有角色精灵图](../../assets/heroes.png)。

输出：[犬夜叉像素版](../../assets/ui/companion-inuyasha-pixel-v2.png)、[戈薇像素版](../../assets/ui/companion-kagome-pixel-v2.png)。保留imagegen导出的原始PNG及透明通道，卡片布局沿用已确认版本，并启用CSS像素缩放显示。

## 犬夜叉

```text
Use case: style-transfer. Image 1 is the EDIT TARGET: the existing companion-card bust portrait. Image 2 is a STYLE REFERENCE only: the game's current pixel-art character sprite sheet. Replace the smooth anime rendering of Image 1 with genuine hand-placed 16-bit RPG PIXEL ART. Preserve the target character identity, head-and-upper-chest composition, calm expression and three-quarter front view facing screen right; do not copy the full-body side pose of Image 2. Inuyasha: long white hair, complete white dog ears with pink inner ears, golden eyes, red robe and dark purple beaded necklace. Use cream/white and cool lavender pixel clusters for hair, warm skin, dark red/carmine robe clusters.
CRITICAL pixel specification: draw the entire portrait on a strict logical 128 by 128 pixel grid, then export as a large square using integer nearest-neighbor enlargement (ideally 1024 by 1024, each logical pixel 8 by 8). Every edge and facial detail must consist of deliberate square pixel clusters with visibly stepped diagonals. One-native-pixel dark outline, compact 3-5-tone shading ramps, about 32-48 total colors. Eyes, nose, mouth, hair strands and garment folds must all be pixel clusters. Prioritize crisp readable facial features at a 120px display size. Match the restrained detailed 16-bit style of the sprite sheet.
Composition: single head-and-shoulders portrait fills almost all the canvas; include full hair/ears at top with only a small margin, shoulders and chest crop at the lower edge, hair toward the left silhouette, face turned slightly right. Genuine transparent background outside the silhouette, binary hard pixel alpha edge with no soft halo.
Avoid: smooth line art, vector illustration, anti-aliasing, subpixel edges, airbrush, gradients, photographic textures, smooth anime cel shading, glossy rendering, blurred pixels, a high-resolution anime painting merely covered with a grid, card frames, UI, words, badges, weapons, extra figures. The result must be unmistakably pixel art when viewed without any CSS filter.
```

## 戈薇

```text
Use case: style-transfer. Image 1 is the EDIT TARGET: the existing companion-card bust portrait. Image 2 is a STYLE REFERENCE only: the game's current pixel-art character sprite sheet. Replace the smooth anime rendering of Image 1 with genuine hand-placed 16-bit RPG PIXEL ART. Preserve the target character identity, head-and-upper-chest composition, calm expression and three-quarter front view facing screen right; do not copy the full-body side pose of Image 2. Kagome: dark blue-black hair with bangs, brown eyes, white sailor school uniform with green collar and red tie. Use dark navy hair clusters, warm skin, white/cream uniform, muted green collar, red tie.
CRITICAL pixel specification: draw the entire portrait on a strict logical 128 by 128 pixel grid, then export as a large square using integer nearest-neighbor enlargement (ideally 1024 by 1024, each logical pixel 8 by 8). Every edge and facial detail must consist of deliberate square pixel clusters with visibly stepped diagonals. One-native-pixel dark outline, compact 3-5-tone shading ramps, about 32-48 total colors. Eyes, nose, mouth, hair strands and garment folds must all be pixel clusters. Prioritize crisp readable facial features at a 120px display size. Match the restrained detailed 16-bit style of the sprite sheet.
Composition: single head-and-shoulders portrait fills almost all the canvas; include full hair/ears at top with only a small margin, shoulders and chest crop at the lower edge, hair toward the left silhouette, face turned slightly right. Genuine transparent background outside the silhouette, binary hard pixel alpha edge with no soft halo.
Avoid: smooth line art, vector illustration, anti-aliasing, subpixel edges, airbrush, gradients, photographic textures, smooth anime cel shading, glossy rendering, blurred pixels, a high-resolution anime painting merely covered with a grid, card frames, UI, words, badges, weapons, extra figures. The result must be unmistakably pixel art when viewed without any CSS filter.
```
