# 妖力／灵力条 · 图像提示词 v2

日期：2026-10-27。方法：**内置 image_gen**，对已审核中的战斗布局进行局部编辑。

输入：[战斗界面 v1](combat-layout-v1.png)。输出：[战斗界面 v2](combat-layout-v2.png)。

用户已明确选择“可消耗能量：技能会消耗，消耗与恢复规则另定”。整体界面仍待审核，未实施。图中68/100与42/80为排版示例，不是正式能量配置，不改变已有力量强度字段。

## 完整提示词

Use case: precise-object-edit
Asset type: version 2 of an existing Chinese action game's combat HUD design for approval.
Edit target: the attached full-screen combat-layout-v1.png, 16:9. Make ONLY the requested character HUD update, preserve the entire rest of the image exactly: world, sprites, bare-handed red-robed Inuyasha, short-haired female Yura, all skill tiles and boss/goal/jewel/utility UI, all existing text and numbers, camera and framing. This is a UI design edit, not a new splash illustration.

PRIMARY CHANGE: add a clearly labeled CONSUMABLE ENERGY bar under each hero's HP bar, personalized to the hero. This is energy reserve, not attack strength, XP, level progress or barrier durability.
- Inuyasha (犬夜叉, active card): keep red HP '146 / 180'. Below that add a second thinner muted VIOLET energy bar labeled exactly '妖力' with numeric example '68 / 100'. This violet energy fill is 68% of the track. Display the LABEL, TRACK and NUMBERS clearly on one row. Do not change the existing portrait, hero name, key 1 or 出战 badge.
- Kagome (戈薇, smaller reserve card): keep green HP '142 / 161'. Below that add a second thinner CYAN-BLUE energy bar labeled exactly '灵力' with numeric example '42 / 80'. This cyan energy fill is 52.5% of the track. Display the LABEL, TRACK and NUMBERS clearly on one row. Do not change portrait, name or key 2.
- Enlarge both top-left dark jade portrait frames vertically only as much as needed for two comfortable rows: HP then energy. Keep their original widths and left alignment. Place the smaller Kagome reserve card below the enlarged active card with a clean 10px gap. Both cards together should finish by about 27% of screen height, not extend into the center action area.
- HP must remain more visually prominent (thicker bar) than energy. Keep thin gold frame style, cream numerals, readable Chinese, quiet translucent background. Do not confuse the two resource colors with health, poison or jade jewel collection.
- No energy bar on the boss; do not add third bars, stamina, XP, or use the existing strength numbers 26 as energy reserve. Do not add skill costs, recharge rules, or any claims about restoration.
Every change should be contained in the top-left party HUD; preserve every other region. No new annotation or title.

## 输出归档

原始输出：`/Users/chenghui/.codex/generated_images/01a1786c-35a0-7fd1-8a31-d50b98f5e792/exec-9b879837-8ce2-45f5-81ed-51ef56a76e35.png`。

保留工具生成的原始PNG字节，复制至本目录；v1保留。暂停总览继续沿用v1，本次仅更新角色条与对话、触屏线框。
