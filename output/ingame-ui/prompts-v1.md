# 游戏内界面布局 · imagegen 提示词归档

日期：2026-10-27。方法：内置 image_gen。仅为待审核概念图，不是游戏运行素材或已实现界面。

## 战斗界面初稿

Use case: ui-mockup
Asset type: high fidelity approval mockup for an existing Chinese Inuyasha pixel-art 2D side-scrolling action adventure. One full screen landscape 16:9 game screen, edge-to-edge, no device or browser, no annotations outside the screen.
Input images: attached local faction-selection mockup is a STYLE REFERENCE ONLY for dark jade, subtle warm gold linework and Chinese fantasy visual language; do NOT copy its split cards, promotional art composition or big title.
Primary request: design an elegant, highly usable, restrained in-game combat HUD. Large unobstructed center, readable Chinese typography, small decorative diamonds, translucent dark ink-jade panels and refined muted gold hairline borders. Crisp HUD text above a detailed pixel-art world, UI uses clean typography, not pixel lettering. Avoid excessive ornamental flourishes or bright glowing borders.
Scene/backdrop: existing side-view game '赤骸之巢', moonlit teal Japanese forest with a few red hair threads, stone moss platforms and shrine silhouettes. Flat horizontal platform ground at 76% height, deliberately visible to avoid UI covering enemies or feet. Inuyasha (white hair, dog ears, red robe, 3 to 4 heads tall) around x39% y64%, action stance facing right. Only ONE controlled hero on the battlefield. Reverse-haired Yura in dark clothing at x73% y62% as distant boss, two red hair anchor knots. Preserve readable side-scrolling sprite scale, pixel-art terrain and parallax depth. Background should look like playable 2D scene, not splash art or 3D.
Precise UI layout:
1) TOP LEFT within 3% safe area: one medium horizontal active portrait card, white-haired red-clad Inuyasha portrait left, text '犬夜叉' with small '出战' badge, red HP bar '146 / 180'. Under it a smaller slimmer reserve Kagome portrait row, text '戈薇', green HP bar '142 / 161', keycap '2'. Active has keycap '1'. These occupy leftmost 25% width and topmost 22% height. No level, XP, mana, coins or stamina bars. Do not place hero-stage names next to tiny HP.
2) TOP CENTER between left and right blocks: elegant thin crimson boss HP bar about 32% screen width with name '逆发结罗' and second small label '发丝结界 · 击破结点'. This bar appears once only.
3) TOP RIGHT: three unobtrusive icon-only buttons fullscreen, sound, pause with tiny 'Esc'. Beneath tools a compact two-line objective panel: small '犬主02 · 赤骸之巢', larger '击破发丝结点', lower tiny '信物 1 / 3'. This right panel takes at most 23% width.
4) BOTTOM LEFT: tiny jewel shard emblem and restrained transparent progress strip, exact two rows '四魂之玉' and '我方 2%  ·  敌方 0%'. Does not look like currency or purchasable resource.
5) BOTTOM CENTER at 86%-97% screen height: visually balanced skill dock, four compact tiles ordered 'J 普攻', 'K 闪避', 'U 散魂铁爪', 'I 飞刃血爪'. J and K smaller, U and I slightly wider with elegant claw icons. The I tile shows a partial circular cooldown overlay and '4.2s' while skill name and key remain fully readable. U ready state has a restrained gold outline. No extra invented skills.
6) BOTTOM RIGHT: minimal discreet text 'Tab 切换  ·  ? 操作'. No always-visible long keyboard legend.
Typography: Chinese headings in elegant Songti, clear sans-serif details, ivory text, muted gold hierarchy, HP red for Inuyasha and green for Kagome. Visual emphasis on life, threat and next action. High legibility at 1280 x720.
Constraints: ONE coherent full screen mockup, no big game logo, no title-page menu, no monetization, no inventory bag, no minimap, no minimap pins, no XP or skill points, no invented quest systems, no huge floating character portraits over world, no permanently displayed tutorial paragraph, no gore, no watermark. Do not show a dialogue box or touch controls in this desktop battle mockup.

## 战斗界面修正（采用）

Use case: precise-object-edit
Asset type: Chinese game combat HUD design for approval.
Edit target: the attached single 16:9 in-game HUD mockup.
Keep all HUD layouts, text, life values, colors, pixel forest, platforms, icon tiles, camera and framing exactly unchanged. Only fix these three local mistakes:
1. Replace the right-hand long-haired white-fur male entirely with a SMALL female Yura enemy sprite of the current game's style: short straight black bob haircut, pale skin, sleeveless burgundy short tunic, bare arms, dark footwear, small ivory hair comb, fine red hair threads streaming from hands to the two anchor knots. Face left. Her total height should be about 170 pixels at this image size, similar to Inuyasha, not a gigantic portrait. There must be NO Naraku, no white fur pelt, no long-haired male.
2. Remove the curved sword from Inuyasha's hands. At this story stage he has not inherited Tessaiga. Make his right hand a natural raised open claw, empty-handed claw combat stance. Preserve red robe, white hair, dog ears and the rest of his body. Do not introduce any weapon.
3. Top right three utility buttons should be: simple four-corner fullscreen icon, speaker icon, pause icon with tiny Esc text beneath the pause. Exactly three utility buttons, do not turn Esc into a fourth separate button.
All Chinese text elsewhere must remain exactly unchanged and readable, especially '逆发结罗', '犬主02 · 赤骸之巢', '击破发丝结点', all four skill names. No other edits.

采用输出：`combat-layout-v1.png`；原始输出：`/Users/chenghui/.codex/generated_images/01a1786c-35a0-7fd1-8a31-d50b98f5e792/exec-3d2f5bb2-4a7c-439b-a46b-a844c238bc3a.png`。

## 暂停总览（采用）

Use case: ui-mockup
Asset type: a high-fidelity Chinese 2D game PAUSE / journey overview UI for user approval. One coherent full-screen 16:9 landscape screenshot, no browser/device or presentation title.
Input images: attached combat mockup is a STYLE AND WORLD reference. Reuse its refined dark jade, warm gold hairline borders, ivory typography, tiny diamond details, moonlit teal forest, short white-haired red-robed Inuyasha and small short-haired Yura. This is the same game paused; the world is heavily dimmed and softly blurred behind the menu.
Primary request: design a beautiful readable full screen pause overlay '旅途手记'. Main content is one large calm translucent ink-green panel occupying 86% width and 83% height, centered with generous empty space, no flashy ornament and no marketing logo. No combat HUD visible on top of the paused menu.
Exact composition:
- Upper edge of panel: title '旅途手记' at left in large elegant Songti, a small warm neutral badge '游戏已暂停' nearby; top right a close × button and tiny 'Esc 返回'.
- Single HORIZONTAL tab bar across the panel under heading, evenly spaced: '旅程' (selected with gold underline), '伙伴', '四魂之玉', '妖怪图鉴', '设置'. No duplicated navigation.
- Two-column overview under tabs: LEFT 58%, RIGHT 36%.
- LEFT large chapter section: small muted label '当前篇章', medium title '犬主02 · 逆发之森', then smaller '当前场景 · 赤骸之巢'. Thin decorative divider. Below it a light gold heading '当前目标', large readable objective '击破发丝结点', small subordinate instruction '寻找红色结点，打开发丝结界。'. No invented multi-quest list or rewards. Under this content a wide restrained small row with lamp icon: '最近检查点' and '赤骸之巢 · 神社灯笼', plus subtle '已保存'.
- RIGHT: small inset comparison panel '四魂之玉', two clear progress rows with very short proportional colored fills: '我方持有 2%' and '敌方持有 0%'. Single muted text below '其余份额 98%'. Lower modest divider, then '本幕信物' with three small diamond glyphs (first gold, other two outlined) and large '1 / 3'. Avoid coins, currencies, rewards or purchase buttons.
- Bottom action area full width separated by thin hairline: LEFT most prominent gold button '继续旅程 →', next secondary outlined button '从检查点重试', RIGHT quiet text button '返回首页'. Bottom-most small note '重试将恢复最近检查点。'.
Chinese text must be correct, crisp, clearly readable, accurately spaced and not cover artwork behind margins. Title Songti, body clean modern Chinese sans-serif. Normal text ivory, secondary grey-green, muted gold highlights, ample vertical spacing.
Constraints: only a pause overview, current existing systems, no XP, character levels, mana, inventory bag, shop, battle pass, paid currency, new collectibles, new companions, skill tree or unimplemented quest system. This design reorganizes current functionality. Do not claim a whole campaign is finished. Background art is atmospheric context only, not a new scene asset. No watermark.

采用输出：`pause-overview-v1.png`；原始输出：`/Users/chenghui/.codex/generated_images/01a1786c-35a0-7fd1-8a31-d50b98f5e792/exec-0fe4fa22-b46c-4043-ada0-4ca1919df66b.png`。

图片保持内置工具的原始 PNG 字节，复制到本目录。人物、场景为构图示意，审批范围为界面布局；实施时沿用现有场景、人物、故事解锁与数值数据。原有场景位置、碰撞、镜头不依据本图修改。

