# TRPG Gameplay UI Layout & Readability Contract

Last updated: 2026-05-30

This contract applies to all Gameplay / play-session pages in the project:

- DND Gameplay
- COC Gameplay
- Cyberpunk RED Gameplay

The goal is not visual decoration. The goal is usable play-console structure, readable results, stable layout, and cross-system consistency.

## 1. Roll Console Is The Only Result Center

Gameplay pages should have one primary result area:

- Roll Console / 掷骰日志
- Do not use a large top `ResultFocusPanel`.
- `ChecksPanel` should not display the latest result.
- `ActionsPanel` should not display an independent result area.
- All checks, rolls, and action-use results should enter Roll Console.

## 2. Latest Result Rules

Roll Console must contain a prominent Latest Result area.

Latest Result must include:

- Check / action / roll type.
- A large final value.
- Calculation details.
- Special-result tags when relevant.
- If success or failure cannot be determined, show "等待 DM/KP/GM 判定" or equivalent text.

Latest Result is not plain log text. Historical logs record events; Latest Result is the first thing players should read after an operation.

## 3. DND Result Rules

DND d20 checks should display:

- Check type, for example `技能检定：宗教 / Religion`.
- Large final total, for example `17`.
- Calculation, for example `d20=15 + 修正=+2`.
- If the natural d20 is 20, show `天然 20 / NAT 20`.
- If the natural d20 is 1, show `天然 1 / NAT 1`.

Do not automatically interpret NAT 20 / NAT 1 as universal success or failure for all DND checks. Attack rolls, saving throws, and ability checks can have different rule handling later. Current UI only shows the NAT 20 / NAT 1 tag.

## 4. DND Success / Failure Rules

If a DND check has no DC / AC / target:

- Show the final total.
- Show the calculation.
- Show `未设置 DC，等待 DM 判定`.
- Do not automatically show success or failure.

If a DND check has a DC:

- `total >= DC`: success.
- `total < DC`: failure.

Current phase may support only an optional DC input. Do not introduce Enemy UI, Target Model, AC targets, or opposed-object systems for this purpose.

## 5. COC Result Rules

Future COC result displays should show:

- Check type, for example `技能检定：侦查 / Spot Hidden`.
- Large rolled value.
- Skill target value.
- Success level:
  - 大成功 / Extreme Success
  - 困难成功 / Hard Success
  - 普通成功 / Regular Success
  - 失败 / Failure
  - 大失败 / Fumble

Most COC skill checks can determine success level from the skill value. Exact thresholds belong in the COC rules module.

## 6. Cyberpunk RED Result Rules

Future Cyberpunk RED result displays should show:

- Check type, for example `技能检定：Handgun`.
- Large final total.
- Calculation, for example `d10=10 + 爆炸=6 + 技能=12，总计=28`.
- Natural 10 should show `爆炸成功 / Critical Success`.
- Natural 1 should show `爆炸失败 / Critical Failure`.

If Cyberpunk RED has no DV / target:

- Show the final total.
- Show the calculation.
- Show `未设置 DV，等待 GM 判定`.
- Do not automatically show success or failure.

If a DV exists:

- `total >= DV`: success.
- `total < DV`: failure.

## 7. Player Mode / Host Tools

Player mode defaults to:

- Latest Result.
- Calculation details.
- Historical log.
- System prompts.

Player mode should not default to a large free-roll tool.

Free roll belongs to host tools or advanced tools:

- DND: DM Tools
- COC: KP Tools
- Cyberpunk RED: GM Tools

Current phase does not implement real permissions. Use local UI collapsed state only:

- `主持人工具 / GM Tools`
- `自由掷骰 / Free Roll`

Do not write this state to store. Do not write it to schema. Do not add account permissions or multiplayer permission sync.

## 8. Text Readability

Do not use low-contrast text on light backgrounds for logs, calculations, or result explanations.

Forbidden for those areas:

- `text-gray-300`
- `text-gray-400`
- `text-stone-300`
- `text-stone-400`
- Any similarly pale, hard-to-read gray.

Recommended colors on white / parchment backgrounds:

- Main text: `#3a1712` / `#4a241c`
- Secondary text: `#6b3328` / `#7a4a3a`
- Weak but readable hint text: `#8a5a4a`
- Borders: `#6b1f16` / `#8a3a2a`

Calculation text can be smaller than the final result, but it must remain readable.

## 9. Result Visibility / 结果可见性原则

Hidden rolls are not an independent dice type.

Hidden rolls are result visibility:

- If players cannot see it, it is a `gmOnly` result.
- If players can see it, it is a `public` or `revealed` result.

All future checks, rolls, actions, damage, and system results should consider visibility.

Recommended visibility types:

- `public`: visible to players and host.
- `gmOnly`: visible only to DM/KP/GM.
- `playerOnly`: visible only to the relevant player.
- `revealed`: originally hidden, later made public by the host.

Player Gameplay should show only:

- `public`
- `revealed`
- `playerOnly` results relevant to that player

DM/KP/GM Console may show:

- `public`
- `gmOnly`
- `playerOnly`
- `revealed`

Free roll is not a primary player Gameplay feature. It should mainly belong to DM/KP/GM Console or advanced tools.

Free-roll results should also support visibility.

In the future, the host should be able to decide whether to:

- Reveal the full result.
- Reveal only success / failure.
- Reveal only narration.
- Hide the result completely.

Current phase does not implement real permissions, store changes, or schema changes. This section records the principle only.

## 10. System Examples

### DND

- Monster stealth, hidden traps, and passive Perception-related hidden rolls can be `gmOnly`.
- Player-initiated checks are usually `public`.
- The DM can later mark a hidden result as `revealed` or reveal narration only.

### COC

- Psychology, hidden clues, and Keeper-side hidden judgments are good `gmOnly` examples.
- The KP can reveal narration only, without exposing dice values or success levels.

### Cyberpunk RED

- NPC Perception, hidden netrunning opposition, and enemy-side action checks can be `gmOnly`.
- The GM can reveal the full result or reveal narration only.

## 11. Roll Console And Visibility

- Player Roll Console should not display `gmOnly` results.
- Player Roll Console should display `public`, `revealed`, and self-visible `playerOnly` results.
- Future Host Console should display `gmOnly` results and host tools.
- Current player Gameplay should not be overloaded with full host tooling.
