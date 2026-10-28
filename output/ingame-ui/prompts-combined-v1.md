# 合成紧凑版 · imagegen提示词

日期：2026-10-27。方法：**内置 image_gen**。用途：根据用户最新指示组合A版人物与B版技能，缩小HUD占用，继续作为待审核设计图。

输入一：[A版](combat-layout-v2.png)，作为编辑目标，采用其左上叠放人物及其余基础分区。
输入二：[B版](combat-layout-b-v1.png)，仅参考其右下四个行动格。
采用输出：[合成紧凑版](combat-layout-combined-v1.png)。

## 第一轮完整提示词

Use case: precise-object-edit
Asset type: combined compact HUD approval mockup for the existing Chinese Inuyasha side-scrolling game.
Input images:
Image 1 (combat-layout-v2.png) is the EDIT TARGET and supplies the exact world, top-left stacked character HUD, top-center boss, top-right objective, bottom-left jewel progress.
Image 2 (combat-layout-b-v1.png) is a SUPPORTING UI REFERENCE ONLY for its bottom-right row of four action tiles.
Primary request: combine Image 1's TOP-LEFT party with Image 2's BOTTOM-RIGHT skill tiles, then make ALL HUD panels, portraits, icons and decorative chrome approximately 15% smaller in linear dimensions (about 85% of their previous size). Keep Chinese typography comfortably readable; do not simply shrink the entire image.

LOCKED INVARIANTS: preserve Image 1's exact full-screen 16:9 framing and all gameplay art: moonlit teal forest, platform height, both small battlefield characters, hair threads and red knots. Inuyasha remains bare-handed red-robed at the same location; Yura remains the same short-bob-haired female. No changes to world scale, character size, camera, level geometry or scene. Only the overlay UI is redesigned. No browser, device frame, title or outside annotation.

Precise final layout on this 1672x941 composition:
1. TOP LEFT: take the two VERTICALLY STACKED portrait cards from Image 1, preserving their A-style composition. Active Inuyasha above, smaller reserve Kagome below. Reduce panel/portrait footprints to about 85% of Image 1. Anchor left about 36px, top about 30px. Active card roughly 355px wide, 90px high. Reserve card slightly narrower, around 315-340px wide, 75-80px high, with a 10px gap. Total party HUD ends at about 22% image height. No party cards at bottom.
   - active text '犬夜叉', small '出战', key '1'; RED life bar with '146 / 180'; thinner VIOLET energy bar labeled exactly '妖力' with '68 / 100', 68% fill.
   - reserve text '戈薇', key '2'; GREEN life '142 / 161'; thinner CYAN-BLUE energy labeled exactly '灵力' with '42 / 80', 52.5% fill.
   - every number and resource label stays visible. Life and energy do NOT overlap portraits.
2. TOP CENTER: retain Image 1's boss info but make it about 15% more compact: name '逆发结罗', thin crimson health bar about 535-550px wide, phase '发丝结界 · 击破结点'. Center it without colliding with the left party or right objective.
3. TOP RIGHT: retain Image 1's utility trio fullscreen, sound, pause with Esc. Make the tools and objective card footprint about 15% smaller, with about 36px safe edge gap. Goal panel must be in TOP RIGHT, never top left. Exact text: '犬主02 · 赤骸之巢', '击破发丝结点', '信物 1 / 3'. Keep compact ivory-on-ink typography and fine muted gold borders.
4. BOTTOM LEFT: retain Image 1's jewel widget at bottom-left, about 15% smaller, roughly 300px wide and 75px high, 36px from left and bottom. Small jewel art; exact text '四魂之玉' and '我方 2% · 敌方 0%'. No giant gemstone.
5. BOTTOM RIGHT: copy the style, ORDER and LOCATION concept of Image 2's four action tiles, at about 85% of that reference tile size. Dock is right-aligned, about 36px from the right. Combined width about 435-445px and tile height about 105-110px. Exactly four tiles left-to-right: J '普攻', K '闪避', U '散魂铁爪', I '飞刃血爪'. Fine clipped gold corners, dark translucent ink surfaces, clean icon art, no dramatic glow. The I tile has partial circular cooldown '4.2s' around its icon. Keycaps and skill names remain readable during cooldown. NO center-bottom action tiles.
6. Put a discreet 'Tab 切换 · ? 操作' on ONE small line BELOW the right skill dock, aligned to its right edge, around 20px from bottom. It must not overlap a tile. Leave the rest of the lower center empty, with the forest foreground visible.

Overall visual: compact, calm and elegant deep jade / muted warm gold UI; increased negative space compared with either reference. Reduce panel padding and ornaments more than text. Body numerals/resource labels remain at least about 14px at native size, skill names about 16px. Each overlay only once.
No new bars, XP, stamina, map, inventory, costs or regeneration rules. Exact existing example values retained. Do not add A/B labels inside the mockup or claim this is already implemented. Opaque full-screen image, no watermark.

## 局部缩放修正提示词

Use case: precise-object-edit
Edit target: attached combined HUD mockup. Keep all world art and every other UI region EXACTLY unchanged. Only correct the sizes of these two overlay groups so the HUD is truly smaller:

1. BOTTOM RIGHT action dock: the current four-tile row is too wide. It currently spans approximately x1086 to1632 (546px wide) and y755 to875 (120px high). Scale this ENTIRE group proportionally down to about 80% of its current size: total width about 435-440px, total height about 96-100px. Anchor RIGHT edge at x1632 and BOTTOM at y880. Final group should start around x1192, NOT around1086. Keep four tiles in same order J普攻, K闪避, U散魂铁爪, I飞刃血爪 and the4.2s cooldown. Icons and frames shrink proportionally, labels stay crisply readable minimum14px. Preserve clean gaps. Do not add a fifth tile. No central action dock. Keep the helper text 'Tab 切换 · ? 操作' below this row right-aligned at its current safe position.

2. TOP CENTER boss group: shorten the gold/red health track from roughly635px to about540px, centered around x835 (left565, right1105). Keep '逆发结罗' and '发丝结界 · 击破结点' fitting above this shorter bar in a compact composition, reduce their size slightly if needed. Do not move the boss information to a different part of the screen. Keep same health fraction.

Do not change the already-correct small TOP LEFT stacked party cards, their HP and demon/spirit energy labels/values, top-right goal/utilities, or bottom-left jewel widget. No changes to portraits, playable character size, camera, scenario, or any text/numbers outside the two mentioned UI groups. This is only a localized UI scale adjustment, no new design, no added annotations or watermark.

## 原始输出

第一轮：`/Users/chenghui/.codex/generated_images/01a1786c-35a0-7fd1-8a31-d50b98f5e792/exec-8cc99b9f-0833-43c1-973c-cb2439903298.png`。
采用输出：`/Users/chenghui/.codex/generated_images/01a1786c-35a0-7fd1-8a31-d50b98f5e792/exec-3c2b6c90-881e-4b71-9e6f-9eabc187a157.png`。

采用图片保持原始PNG字节复制到本目录；A、B旧图保留。所有图片是布局构图示意，不重做关卡、人物素材、碰撞或镜头。能量数字是沿用的排版样例，正式上限、消耗与恢复规则仍待配置。

