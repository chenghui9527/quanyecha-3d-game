# 方案B · 底部角色状态 · imagegen提示词

日期：2026-10-27。方法：**内置 image_gen**。用途：另一版布局参考，未实施、未替代方案A。

输入：[方案A v2](combat-layout-v2.png)。输出：[方案B v1](combat-layout-b-v1.png)。

## 完整提示词

Use case: precise-object-edit
Asset type: alternate layout B of an existing Chinese Inuyasha pixel-art action game's full-screen HUD, for A/B design review.
Edit target: attached combat-layout-v2.png. This is a new UI LAYOUT VARIANT, not a replacement of gameplay art.
Lock the entire world and characters: same 16:9 camera, same moonlit forest, platforms, hair threads and red knots, same small bare-handed Inuyasha facing right, same short-bob-haired female Yura facing left. Do not change their sizes, poses, locations, weapons or environment. Only remove and redesign the HUD over this exact scene.

Design direction: airy and understated, dark ink-jade translucent surfaces, fine muted bronze edges and sparse ivory typography. Reduce the previous strong ornamental gold frames and diamonds. Thin corner accents rather than heavy boxes. Life and energy are readable at a glance. Center of the world stays unobstructed.

NEW PRECISE LAYOUT:
1) TOP LEFT at x3%-27%, y4%-14%: a small floating objective block with NO large framed card, only a thin vertical bronze accent and subtle local dark gradient. Small '犬主02 · 赤骸之巢', then larger '击破发丝结点', then tiny '信物 1 / 3'. NO character portrait or character bars at the top.
2) TOP CENTER at x35%-73%, y3%-12%: '逆发结罗' centered over one elegant thin crimson boss health bar. Under the bar small '发丝结界 · 击破结点'. One boss bar only, much slimmer than the previous layout.
3) TOP RIGHT: three small low-profile icon buttons for fullscreen, speaker, pause with small 'Esc' under pause. Below the icons at x80%-97%, y11%-16%, a small jewel outline and a subtle text-only status, '四魂之玉' then '我方 2% · 敌方 0%'. NOT a giant gemstone box and not purchasable currency.

4) BOTTOM LEFT, entirely within x3%-29%, y83%-96%: the ACTIVE CHARACTER module. Left a medium Inuyasha portrait, to its right '犬夜叉' and small '出战' and keycap '1'. Below the name two comfortable long HORIZONTAL rows:
  - life row, thick RED bar labelled '生命', numeric '146 / 180'.
  - energy row, thinner VIOLET bar labelled exactly '妖力', numeric '68 / 100'; fill exactly 68%.
The module is around 120px high at original image scale, a low translucent ink panel with restrained thin corner lines, no big ornate gold frame.
5) Directly beside active module, in x30%-46%, y84%-96%: a SMALLER reserve Kagome module. Small portrait + '戈薇' + keycap '2'. Both slim bars still readable: GREEN life '142 / 161', CYAN-BLUE energy labelled exactly '灵力' with '42 / 80' (52.5% fill). Do NOT omit reserve energy. Keep clear gap between modules. Do not duplicate these modules elsewhere.
6) BOTTOM RIGHT in x64%-97%, y84%-96%: a compact horizontal action dock. Four separate subtle rounded-square tiles with clean icons and exact labels: 'J 普攻', 'K 闪避', 'U 散魂铁爪', 'I 飞刃血爪'. The first two can be smaller. Skill I has partial circular cooldown with '4.2s', leave the name and key visible. No bright glowing border. No new skills.
7) In the gap between party modules and skill dock near x49%-62%, y93%-96% place understated 'Tab 切换 · ? 操作'. Do not create a full-width dark footer. Leave scenery visible between the separate bottom clusters.

Important: all bottom HUD must remain BELOW the playable main platform and character feet, never over the mid-screen battle. Do not move the platform to make room. No large central panels. All stats belong to the named hero; demon energy is violet, spiritual energy is cyan. All example values must remain unchanged for fair A/B comparison. No new mana capacities, consumption costs, regen, XP, extra bars, inventory, map, store, big title, B label, outside annotation or watermark. One clean full-screen game UI design image.

## 输出归档

原始输出：`/Users/chenghui/.codex/generated_images/01a1786c-35a0-7fd1-8a31-d50b98f5e792/exec-9a7d63ca-9bde-4ae1-9ad3-4f5c6c03317b.png`。

原始PNG字节复制到本目录。人物、场景仍为构图示意；审核范围是HUD位置、层级和风格。生命、能量与份额沿用方案A的排版样例，不代表批准消耗、上限或恢复参数。
