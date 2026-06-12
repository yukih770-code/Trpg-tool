# CPRED Rule Coverage Matrix

Last updated: 2026-06-12

## 1. Purpose

This file records Cyberpunk RED rule coverage in the current project: implemented layers, gaps, priorities, and recommended next steps.

It is a planning and freeze document. It does not implement rules, UI, store state, schema, migration, GM Console, or gameplay automation.

## Data Integrity Warning

Rules Data Integrity Audit v1 found high-risk unverified/source-light datasets across the project, including CP RED data that already reaches Creator, Market, Gameplay, and runtime logs.

Coverage levels in this document describe implemented mechanics and app wiring, not verified publication-safe rules data. Source/trust metadata foundation is being introduced before further rules feature expansion.

Rule data must declare source and trust metadata before being treated as verified runtime/core data. Unknown-source or suspicious data must not be promoted into new gameplay features. Public/free sources may be embedded only within allowed scope; paid-book or official-but-not-public content may be referenced by metadata but must not copy long rules text. Homebrew/demo/placeholder data must be visibly labeled or quarantined.

## 2. Coverage Level Definitions

| Level | Meaning |
|---:|---|
| Level 0 | Not implemented. |
| Level 1 | Static text / pure data exists. |
| Level 2 | State container exists. |
| Level 3 | Pure function calculation exists. |
| Level 4 | Runtime state / store actions are wired. |
| Level 5 | UI is operable, but GM judgment is still required. |
| Level 6 | Complete automated rules loop. |

## 3. Character Creation Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Basic information | 5 | CpCreator exists. | Needs rule coverage audit. | P0 |
| Lifepath | 1 | May have static/background fields. | Needs systematic audit and workflow. | P2 |
| Role | 2 | Role data/state exists partially. | Role ability coverage needs audit. | P0 |
| Role Ability | 1 | Existing state/data likely partial. | Needs role-specific coverage matrix. | P1 |
| Stats | 5 | Core stats exist. | Needs creation responsibility audit. | P0 |
| Skills | 5 | Skills exist. | Skill point allocation needs audit. | P0 |
| Skill point allocation | 1 | Existing behavior needs review. | Needs Creator constraint audit. | P0 |
| Starting money / gear | 1 | May exist as fields/static data. | Needs economy/gear workflow audit. | P2 |
| Weapons | 1 | Static/field support may exist. | No full attack/damage automation. | P1 |
| Armor | 1 | Static/field support may exist. | SP/ablation automation deferred. | P1 |
| Cyberware | 1 | Static/field support may exist. | Humanity loss/install workflow missing. | P2 |
| Humanity Loss | 3 | Pure utilities exist for related values. | Cyberware-driven loss not automated. | P1 |
| EMP | 3 | Basic pure/store logic exists. | Runtime semantics need audit. | P1 |
| HP | 4 | cpStore/cp-utils support basic HP. | Gameplay/runtime responsibility needs audit. | P0 |
| Seriously Wounded threshold | 3 | Pure utility exists. | UI/runtime alignment needs audit. | P1 |
| Death Save base | 3 | Pure utility exists. | Death Save workflow needs audit. | P1 |
| Background / friends / enemies / romance / goals | 1 | Likely static text fields. | Needs lifepath audit. | P2 |
| Fashion / style | 1 | Likely static text fields. | Needs lifepath/aesthetic audit. | P3 |
| Housing / lifestyle | 0 | Not systematically covered. | Future economy/lifestyle layer. | P3 |

CpCreator, cp-types, cpStore, and cp-utils have partial foundations. Role, Stats, and Skills are P0. Lifepath/lifestyle/housing can follow later. Humanity loss and cyberware installation automation are missing. CP RED creation flow needs a dedicated audit.

## 4. Sheet Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Basic info display | 5 | CpSheet exists and responsibility cleanup is complete. | Polish only. | P0 |
| Stats display | 5 | Sheet displays stats without sheet-side rolling. | None for current Sheet scope. | P0 |
| Skills display | 5 | Sheet displays skills without sheet-side rolling. | None for current Sheet scope. | P0 |
| Role / Role Ability display | 2 | Likely partial. | Needs role coverage audit. | P1 |
| HP display | 4 | Existing. | Runtime mutation should belong in Gameplay. | P0 |
| Seriously Wounded / Death Save display | 3 | Utilities exist. | UI alignment needs audit. | P1 |
| Humanity / EMP display | 4 | Existing logic. | Runtime semantics need audit. | P1 |
| Weapons display | 5 | Sheet shows carried weapons and inventory weapons. | Structured attack model deferred. | P1 |
| Armor display | 5 | Sheet shows equipped body/head armor and inventory armor. | SP/ablation deferred. | P1 |
| Cyberware display | 5 | Sheet shows installed and inventory cyberware. | Humanity Loss automation deferred. | P2 |
| Gear / Inventory display | 5 | Sheet shows inventory and equipment state. | Weight/carry limits deferred. | P2 |
| Lifepath display | 1 | Existing partial/static. | Needs audit. | P2 |
| Sheet runtime operations | 5 | Sheet cleanup removed gameplay runtime ownership; inventory equip/unequip is downtime maintenance. | Combat runtime remains in Gameplay. | P0 |
| Sheet roll/check responsibility | 5 | Sheet no longer owns gameplay checks or local Roll Log. | Gameplay owns rolls/results. | P0 |

CpSheet has received DND/COC-style responsibility cleanup. Sheet is display plus downtime maintenance; Player Gameplay owns rolls/results and runtime operation.

## 5. Gameplay Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Runtime state panel | 5 | CpGameplay has runtime state/resource panels. | Armor/ammo runtime remains deferred. | P0 |
| HP changes | 5 | Store/util support and Gameplay RuntimeLogEntry logs exist. | No full combat damage pipeline. | P0 |
| Humanity changes | 5 | Store/util support and Gameplay RuntimeLogEntry logs exist. | Cyberware install/therapy automation deferred. | P1 |
| EMP display | 5 | Runtime foundation and Gameplay display exist. | Deeper semantics can be audited later. | P1 |
| Seriously Wounded display | 5 | Runtime and Gameplay handling exist. | Full death/damage pipeline deferred. | P1 |
| Death Save display | 5 | Gameplay death save action exists and logs RuntimeLogEntry. | Full mortally wounded workflow deferred. | P1 |
| Skill Checks | 5 | Gameplay skill checks write RuntimeLogEntry results. | Opposed/target model deferred. | P0 |
| Stat Checks | 5 | Gameplay stat checks write RuntimeLogEntry results. | Opposed/target model deferred. | P0 |
| Exploding d10 | 5 | cp-utils foundation is used in Gameplay and displayed through RollConsole. | None for current check scope. | P0 |
| DV input / no DV waiting GM judgment | 5 | No-DV checks display `等待 GM 判定`. | No target/enemy model. | P0 |
| RollConsole | 5 | Player RollConsole is wired. | GM Console remains deferred. | P0 |
| RuntimeLogEntry[] | 5 | CpGameplay uses local RuntimeLogEntry[]; legacy string log writing path is removed/confirmed absent. | No store/schema persistence by design. | P0 |
| Latest Result | 5 | Derived from latest local RuntimeLogEntry. | No visibility filtering. | P0 |
| History Log | 5 | RuntimeLogEntry history is displayed in RollConsole. | No persistent session log. | P0 |
| Result visibility | 0 | Documented only. | No filtering/reveal. | P3 |
| GM Console boundary | 1 | Documented. | No GM Console implementation. | P3 |
| Weapons / attacks | 1 | Existing partial/static. | Combat automation deferred. | P2 |
| Damage | 0 | Not automated. | Needs combat model. | P2 |
| Armor SP / ablation | 0 | Deferred. | Needs armor runtime model. | P2 |
| Ammo | 0 | Deferred. | Needs weapon runtime model. | P2 |
| Critical Injuries | 5 | Manual Tracking v1: body/head entries from the existing 2d6 tables can be manually added/removed in CpGameplay and are logged as RuntimeLogEntry records. | No automatic damage triggers, treatment workflow, or full injury automation. | P2 |
| Netrunning | 0 | Deferred. | Large subsystem. | P3 |
| Market / Gear | 5 | CpMarket can add weapons, armor, cyberware, fashion, and gear to character inventory with stable item instance ids. | Dynamic gear economy deferred. | P2 |
| Vehicles | 0 | Deferred. | Future subsystem. | P3 |

CP Gameplay is unified to local RuntimeLogEntry and RollConsole, with componentized panels. Runtime log producers use structured log envelopes rather than string log fallback paths. Complex combat, armor, ammo, netrunning, vehicles, GM Console, and visibility filtering are deferred.

## 6. Skill / Stat Check Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| d10 roll | 5 | Gameplay checks roll and log exploding d10 results. | None for current check scope. | P0 |
| Natural 10 upward explosion | 5 | cp-utils supports exploding d10 and Gameplay logs it. | None for current check scope. | P0 |
| Natural 1 downward explosion | 5 | cp-utils supports exploding d10 and Gameplay logs it. | None for current check scope. | P0 |
| stat + skill + modifier | 5 | Gameplay checks use stat + skill + modifier. | Luck/spend modifiers beyond current UI deferred. | P0 |
| DV comparison | 5 | DV comparison is wired when DV is present. | Target model deferred. | P0 |
| Opposed check | 0 | Not implemented. | Needs target/opposed model. | P2 |
| No DV = waiting GM judgment | 5 | No-DV checks display `等待 GM 判定`. | None for current check scope. | P0 |
| Result calculation display | 5 | RollConsole displays structured calculation details. | None for current check scope. | P0 |

## 7. Combat / Damage / Armor Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Initiative | 1 | Needs audit. | Runtime/combat workflow not defined. | P2 |
| Attack checks | 1 | Existing skill checks may support manual rolls. | No attack model. | P2 |
| Melee / ranged / autofire | 0 | Not implemented. | Needs weapon/action model. | P2 |
| Weapon damage dice | 1 | Static weapon data may exist. | No damage workflow. | P2 |
| Armor SP | 1 | Static/field support may exist. | No runtime SP tracking. | P2 |
| Armor ablation | 0 | Deferred. | Needs armor runtime state. | P2 |
| Head / body armor | 0 | Deferred. | Needs hit location/body part model. | P2 |
| Cover | 0 | Deferred. | Needs combat scene model. | P3 |
| HP damage | 2 | HP state exists. | Combat damage application not automated. | P2 |
| Seriously Wounded | 5 | Runtime and Gameplay display exist. | Auto trigger prompt deferred. | P1 |
| Mortally Wounded | 1 | Needs audit. | Death workflow not complete. | P2 |
| Death Saves | 5 | Gameplay death save action exists and logs RuntimeLogEntry. | Full mortally wounded workflow deferred. | P1 |
| Critical Injuries | 5 | Manual Tracking v1: manual add/remove with RuntimeLogEntry logging; persisted via existing `runtime.criticalInjuries`. | Automatic triggers, treatment, surgery, and recovery remain deferred. | P2 |
| Critical Injury tables | 2 | Existing 2d6 body/head tables in `cp-types.ts` are adapted into id/location-tagged definitions in `src/lib/cp2024/critical-injuries.ts`. | No table rolling UI beyond the pre-existing damage-roll path. | P2 |
| Stabilization | 0 | Deferred. | Needs medical workflow. | P2 |
| Healing | 0 | Deferred. | Needs recovery workflow. | P2 |
| Suppressive fire | 0 | Deferred. | Combat subsystem later. | P3 |
| Aimed shots | 0 | Deferred. | Combat subsystem later. | P3 |
| Martial arts | 0 | Deferred. | Combat subsystem later. | P3 |
| Brawling / melee weapon rules | 0 | Deferred. | Combat subsystem later. | P3 |
| Drones | 0 | Deferred. | Needs actor/control model, hardware inventory, NET/security links, and encounter state. | P3 |
| Vehicles | 0 | Deferred. | Needs vehicle stats, movement, combat positioning, damage, and repair workflow. | P3 |

Weapons, armor, and critical injury static data may exist, but full combat is deferred. P1/P2 work should favor manual tracking and UI-assisted workflows rather than attempting full combat in one round.

Combat dependency note:
- Armor SP / ablation, ammo, aimed shots, autofire, critical injuries, death saves, and full damage pipeline are hard-core platform targets.
- They should be built after weapon/equipment instances, actor/target references, condition/effect handling, and encounter state are ready.
- Current CP RED Gameplay can log checks/results, but it is not a complete combat engine.

## 8. Humanity / Cyberware Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Humanity | 3 | Pure/store logic exists. | Runtime state/UI audit needed. | P1 |
| EMP | 3 | Utility support exists. | Semantics need audit. | P1 |
| Humanity Loss | 1 | Humanity cost is displayed. | Cyberware-driven Humanity Loss automation deferred. | P2 |
| Cyberware installation | 5 | Cyberware can be installed from inventory as state-only equipment flow. | Humanity Loss automation deferred. | P2 |
| Cyberware removal | 5 | Cyberware can be uninstalled back to inventory without losing the item. | Humanity restoration automation deferred. | P3 |
| Therapy | 0 | Deferred. | Needs downtime workflow. | P3 |
| Cyberpsychosis | 1 | Utility/threshold may exist. | Needs runtime prompts/workflow. | P2 |
| Cyberware categories | 1 | Static data may exist. | Needs audit. | P2 |
| Humanity current vs max | 2 | Existing concepts likely. | Needs runtime semantics audit. | P1 |
| `computeEmpFromHumanity` / `getCpRuntimeEmp` semantic difference | 1 | Known project note exists. | Must be respected in future refactors. | P1 |

Humanity/EMP pure logic has a foundation. Cyberware inventory install/uninstall is state-only and preserves items. Humanity Loss, therapy, and full cyberpsychosis workflows remain deferred or GM-adjudicated.

Humanity dependency note:
- Humanity Loss automation, therapy, and cyberpsychosis are planned hard-core CP RED domains.
- Cyberware install/remove remains state-only until Humanity/EMP runtime semantics and confirmation boundaries are explicitly scheduled.

## 9. Netrunning Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Interface | 0 | Not implemented. | Future subsystem. | P3 |
| NET actions | 0 | Not implemented. | Future subsystem. | P3 |
| Black ICE | 0 | Not implemented. | Future subsystem. | P3 |
| Programs | 0 | Not implemented. | Future subsystem. | P3 |
| Nodes | 0 | Not implemented. | Future subsystem. | P3 |
| Pathfinder | 0 | Not implemented. | Future subsystem. | P3 |
| Backdoor | 0 | Not implemented. | Future subsystem. | P3 |
| Control | 0 | Not implemented. | Future subsystem. | P3 |
| Virus | 0 | Not implemented. | Future subsystem. | P3 |
| Zap | 0 | Not implemented. | Future subsystem. | P3 |
| Jack In / Jack Out | 0 | Not implemented. | Future subsystem. | P3 |
| Meatspace vs NET time | 0 | Not implemented. | Future subsystem. | P3 |
| Netrunning combat | 0 | Not implemented. | Future subsystem. | P3 |

Netrunning is fully deferred and should not enter current Player Gameplay v1/v2.

Netrunning dependency note:
- NET architecture, Interface actions, programs, Black ICE, nodes, meatspace/NET time, and Netrunning combat are hard-core platform targets.
- They depend on actor/action/resource/equipment layers, scene/encounter context, and eventually GM/Host tooling.

## 10. Market / Gear / Economy Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Market | 5 | CpMarket can add items to character inventory and uses existing EB/fashion EB where available. | Dynamic economy deferred. | P1 |
| Gear | 5 | Gear can be added to and shown in inventory as stable item instances. | Weight/carry limits deferred. | P2 |
| Weapons | 5 | Weapons can be bought, carried, dropped back to inventory, and displayed; same-name instances remain distinct. | No full attack/damage workflow. | P2 |
| Armor | 5 | Armor can be bought, equipped, unequipped back to inventory, and displayed; body/head slots preserve item instances. | No SP/ablation runtime. | P2 |
| Cyberware | 5 | Cyberware can be bought, installed, uninstalled back to inventory, and displayed as state-only stable instances. | Humanity Loss automation deferred. | P2 |
| Fashion | 5 | Fashion can be bought, worn, removed back to inventory, and displayed as stable instances. | Lifestyle/aesthetic workflow deferred. | P3 |
| Lifestyle | 0 | Deferred. | Future economy layer. | P3 |
| Rent | 0 | Deferred. | Future economy layer. | P3 |
| Buying / selling | 5 | Basic buy/sell/add-to-inventory flow exists for current market categories. | Availability/price volatility deferred. | P2 |
| Availability | 0 | Deferred. | Future market rules. | P3 |
| Black market | 0 | Deferred. | Future market rules. | P3 |
| Repair | 0 | Deferred. | Future gear workflow. | P3 |
| Upgrades | 0 | Deferred. | Future tech workflow. | P3 |

Market/gear v1 now supports basic character inventory flow: market items can be added to inventory, weapons can be carried/dropped, body/head armor can be equipped/unequipped, cyberware can be installed/removed as state flow, fashion can be worn/removed, and items remain in inventory/equipment flow instead of disappearing.

Stable Item Instance ID v1 adds `instanceId` to owned/equipped weapons, armor, cyberware, fashion, and gear. Same-name duplicate items can now coexist at the inventory/equip flow level, and legacy missing IDs use safe fallback/migration. Remaining deferred work includes ammo tracking, armor ablation, Humanity Loss automation, full damage pipeline, durability/repair, and deeper economy rules.

Humanity boundary: cyberware install/remove does not automatically deduct Humanity, restore Humanity, modify EMP, or modify `cyberPsycho`. UI copy should describe a displayed "Humanity cost" only, not imply that Humanity Loss has already been applied.

## 11. GM Console / Hidden Results / AI Host Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| `gmOnly` visibility | 1 | Documented architecture only. | No implementation. | P3 |
| Hidden NPC checks | 0 | Not implemented. | Future GM Console. | P3 |
| Hidden enemy tactics | 0 | Not implemented. | Future GM Console / AI Host. | P3 |
| Reveal full result | 0 | Not implemented. | Future visibility workflow. | P3 |
| Reveal outcome only | 0 | Not implemented. | Future visibility workflow. | P3 |
| Reveal narration only | 0 | Not implemented. | Future visibility workflow. | P3 |
| NPC / enemy management | 0 | Not implemented. | Future GM Console. | P3 |
| Scene / mission notes | 0 | Not implemented. | Future scene/module layer. | P3 |
| Random encounter / job generation | 0 | Not implemented. | Future Host/AI tools. | P3 |
| AI Co-Host suggestions | 1 | Documented in `PLATFORM_ARCHITECTURE.md`. | No implementation. | P3 |
| AI Host solo mode | 1 | Documented in `PLATFORM_ARCHITECTURE.md`. | No implementation. | P3 |

These features are deferred and must not enter Player Gameplay. AI Host, ProposedCommand, and Host boundary facts are owned by `PLATFORM_ARCHITECTURE.md`; historical reference exists at `docs/archive/2026-06-11-AI-HOST-ARCHITECTURE.md`.

## 12. RuntimeLogEntry Payload Recommendation

Recommended CP RED payload fields:

- `naturalRoll`
- `explodedRolls`
- `baseRollTotal`
- `stat`
- `skill`
- `modifier`
- `total`
- `dv`
- `outcome`
- `isCriticalSuccess`
- `isCriticalFailure`
- `checkType`
- `weaponId`
- `weaponName`
- `damageRolls`
- `damageTotal`
- `armorSpBefore`
- `armorSpAfter`
- `hpChange`
- `humanityChange`
- `empBefore`
- `empAfter`
- `criticalInjury`
- `ammoSpent`

Priority guidance:

- P0: `naturalRoll`, `explodedRolls`, `stat`, `skill`, `modifier`, `total`, `dv`, `outcome`
- P1: `hpChange`, `humanityChange`, `empBefore`, `empAfter`
- P2/P3: combat context, armor, ammo, and critical injuries

Critical Injury Manual Tracking v1 note:
- CP RED Critical Injury Manual Tracking v1 added. Supports manually adding/removing body/head critical injuries and logging them.
- Automatic damage triggers, armor ablation, ammo, treatment, death saves, and full damage pipeline remain deferred.
- Persistence reuses the existing safe `runtime.criticalInjuries` state; no schema or migration changed.

## 13. Recommended Next Steps

1. CP RED armor SP / ablation planning
2. CP RED ammo tracking planning
3. CP RED damage pipeline architecture
4. ~~CP RED critical injury manual tracking v1~~ — Done (automation deferred)
5. CP RED Humanity / therapy / cyberpsychosis workflow planning
6. CP RED role ability coverage audit
7. CP RED Netrunning architecture doc / audit
8. CP RED vehicles / drones later
9. GM Console / AI Host later

## 14. Current Freeze Note

This document records rule coverage only. It does not lift project governance. Rule coverage owner docs now live under `docs/rules/`; implementation sequencing, task discipline, and active task scope are governed by `PROJECT_STATUS.md`, `AI_WORKFLOW.md`, and `docs/ai/ACTIVE_TASK.md`.

仅创建文件不代表解除冻结；两份规则覆盖文档都必须审计通过，并且下一阶段代码任务必须由 `PROJECT_STATUS.md`、`AI_WORKFLOW.md` 与 `docs/ai/ACTIVE_TASK.md` 明确范围后，才可以恢复功能开发。历史路线图已归档在 `docs/archive/2026-06-11-IMPLEMENTATION-ROADMAP.md`，不是当前 source of truth。
