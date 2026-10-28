# 犬夜叉战斗动作图最终提示词

生成方式：内置 imagegen；参照 `assets/heroes.png`；透明背景。

项目文件：`assets/characters/inuyasha-combat.png`，1448 × 1086，4列 × 4行。原双人动作图保留。

```text
Use case: stylized-concept.
Asset type: production transparent character animation sprite sheet for an existing side scrolling pixel action game.
Input image 1 is REFERENCE ONLY for Inuyasha's character identity, detailed pixel style, red robe colors, white hair, dog ears, barefoot anatomy, face, and three-to-four-head-tall proportions. Ignore Kagome entirely. Make a NEW sprite sheet containing ONLY Inuyasha.
Layout: exactly FOUR equal columns by FOUR equal rows, sixteen individual sprites, evenly spaced regular grid. Transparent background, no text, no borders, no ground shadows, no particle effects or weapons. Every sprite is complete and separate, centered horizontally in its cell with consistent character scale, all looking and attacking RIGHT. Maximum character silhouette height 75% of the cell, feet on consistent 87% cell-height baseline, generous transparent gutters. Pixel art, crisp dark outlines and rich red fabric shading matching the reference.
Required poses by cell, reading left to right:
Row 1: [0] first claw wind-up, hips braced and right claw pulled back; [1] first claw strike rightward across chest height, right arm fully extended and fingers spread; [2] second claw wind-up, left arm pulled across torso, weight shifted; [3] second reverse claw sweep across torso toward right.
Row 2: [4] low crouched wind-up for a powerful horizontal finisher, both arms coiled; [5] broad low sweeping claw strike to right with wide stance; [6] deep crouch, claw near ground preparing uppercut; [7] rising claw uppercut, one arm extended diagonally upward-right, body straightening, hair flaring down-left.
Row 3: [8] airborne claw wind-up with bent knees, hand pulled behind shoulder; [9] airborne claw strike to right, bent legs, spread claw; [10] airborne tuck with both arms raised overhead preparing a downward plunge; [11] descending downward claw attack, torso diagonally down-right, both hands reaching downward and legs tucked.
Row 4: [12] powerful Sankon Tesso wind-up, hand wide open near face, low stable stance; [13] powerful forward fanned claw strike, open hand extended right, full body follow-through; [14] low compressed dash wind-up, leaning forward almost horizontal, feet braced; [15] very low fast lunging claw attack to right, long white hair streaming left, extended arm, rear leg stretched.
Keep the character identical across all 16 cells. These must be genuinely different full-body action poses, not mirrored duplicates. No swords, arrows, additional people, decorative light trails or baked-in effects. True transparent alpha.
```
