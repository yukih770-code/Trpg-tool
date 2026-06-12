# Project Status

Last updated: 2026-06-11

## Project Overview

Multi-system TTRPG character manager.  
Three systems: **D&D 5e/2024**, **Call of Cthulhu (COC)**, **Cyberpunk RED (CP)**.  
Stack: React + TypeScript + Vite + Zustand (persist) + Tailwind + shadcn/ui.

---

## System Status

### Cross-System Rule & Feature Architecture

| Item | Status |
|------|--------|
| Cross-System Rule & Feature Architecture phase | 🚧 In Progress |
| TRPG_SYSTEM_FEATURE_MATRIX.md | ✅ Added |
| SYSTEM_PAGE_RESPONSIBILITY.md | ✅ Added |
| AI_HOST_ARCHITECTURE.md | ✅ Added |
| docs/rules/COC_RULE_COVERAGE.md | ✅ Added |
| docs/rules/CPRED_RULE_COVERAGE.md | ✅ Added |
| docs/rules/DND_RULE_COVERAGE.md | ✅ Added |
| IMPLEMENTATION_ROADMAP.md | ✅ Added |
| PLATFORM_ARCHITECTURE.md | ✅ Added |
| AI Context Index v1 (`docs/ai/PROJECT_INDEX.md`, `docs/ai/SYMBOL_MAP.md`, `docs/ai/TASK_CONTEXT_TEMPLATE.md`) | ✅ Added |
| AI Task Lifecycle v1 (`docs/ai/ACTIVE_TASK.md`, `docs/ai/TASK_ARCHIVE.md`) | ✅ Added |
| Documentation Governance v1 (`AI_WORKFLOW.md`, `docs/ai/*`, `docs/archive/README.md`) | ✅ Added |
| Documentation Consolidation v1 | ✅ Done |
| Hardcore Platform Reorientation v1 | ✅ Done |
| Open-Source Community Ecosystem Goal | ✅ Planned |
| Platform Shell / Home / Play Workspace Layering | ✅ Added |

Architecture phase scope:
- Documents DND / COC / Cyberpunk RED feature layers, priorities, page responsibilities, and freeze decisions.
- Documents AI Assistant / AI Co-Host / AI Host roles and future ProposedCommand boundaries.
- Materializes COC and CP RED rule coverage matrices.
- Defines the post-freeze implementation roadmap.
- Establishes ephemeral active-task context and compressed task archive; no `CODE_LANDMARKS.md`, with markdown navigation based on symbols and `rg -n`.
- Establishes documentation governance owner rules, archive firewall, active task lifecycle, and exact-file git safety.
- Consolidates A-class rule/index docs into `docs/rules/` and `docs/ai/`, archives one-off historical architecture docs under `docs/archive/`, and removes stale `CURRENT_PROJECT_STATE.md`.
- Clarifies the final target as a hardcore multi-system TRPG platform and the current strategy as staged hard-core architecture.
- Current phase is P1 Rules Runtime Closure; low-barrier UX is a delivery principle, not a feature ceiling.
- Full map, multiplayer, AI Host, full DND Wild Shape / Active Form, and outer platform layers remain deferred until Actor/Target, condition/effect, permissions, and schema dependencies are ready.
- Records open-source community content ecosystem as a long-term hard-core platform goal; public ecosystem content must be original or redistributable, private user import remains separate, and implementation is deferred until stable schemas and content package boundaries exist.
- Platform Home Shell v1 added: default entry is now Platform Home, and the previous complete main interface is preserved as `PlayWorkspace`.
- Platform Home Shell v1 now includes a lightweight i18n foundation in `src/i18n/`; default locale is `zh-CN`, English UI remains available, and locale persists via `localStorage` key `trpg-platform-locale`.
- Language switching was moved under Settings / Language; Home no longer presents language switching as a primary platform action.
- Platform Home Shell v1 product polish completed: Home microcopy was reduced to product-style labels; long developer explanations were removed from Home, the sidebar, Settings, and placeholder pages.
- Coming Soon placeholders remain visible and not misleading, using a short "即将开放 / Coming Soon" badge and a one-line "该功能已列入后续阶段。/ Planned for a later phase." note.
- The i18n foundation remains unchanged and extensible; removed copy had its translation keys cleaned up in both locales.
- No PlayWorkspace or rules logic was changed by the product polish.
- Only Platform Shell / Home / placeholder text was localized through translation keys; PlayWorkspace internal rules UI is not translated by this shell layer.
- Play enters the preserved ruleset workspace; DND / COC / Cyberpunk RED creator, sheet, gameplay, and CP RED market tabs remain inside `PlayWorkspace`.
- Campaigns, Community Modules, Content Studio, Private Import expansion, map, multiplayer, and AI Host remain explicit placeholders/deferred.
- No DND / COC / CP RED rule logic was changed.
- No package changes, store schema changes, schema changes, or migration changes.
- Freeze planning now has a roadmap; resumed code work must follow it one narrow, single-system phase at a time.
- Current readiness state: DND, COC, and CP RED Player Gameplay pages are componentized and aligned around local `RuntimeLogEntry[]` RollConsole patterns.

### D&D 5e / 2024

| Item | Status |
|------|--------|
| schemaVersion + migrateDndCharacter | ✅ Done |
| 2024 progression foundation (XP / proficiency / ASI) | ✅ Done |
| classResources container | ✅ Done |
| pactMagicState container | ✅ Done |
| DND Gameplay Interaction v0 | ✅ Done |
| Action Registry v0 | ✅ Done |
| DND Structured LogEntry v1 | ✅ Done |
| DND Gameplay Componentization v1 | ✅ Done |
| DND 2024 Class Resources and Spell Preparation Closure v1 | ✅ Done |
| DND Spellcasting Path Unification v1 | ✅ Done |

Action Registry v0 scope:
- Supports only `classResource` and `pactMagic` resource costs.
- Does not support `spellSlot` resource costs.
- Does not implement full action economy, attack resolution, damage resolution, enemy targets, concentration, or combat log integration.

DND Structured LogEntry v1 scope:
- DND Gameplay local `combatLog` uses `RuntimeLogEntry[]` instead of `string[]`.
- Default visibility is `public`.
- Local UI state only; no store, schema, or migration changes.
- No visibility filtering, reveal workflow, Host Console, or multiplayer sync.

DND Gameplay Componentization v1 scope:
- `Gameplay.tsx` orchestrates local state, checks, action use, resources, spellbook, and RollConsole through panel components under `src/pages/gameplay/`.
- Sheet no longer owns gameplay roll controls; Player Gameplay owns checks, actions, runtime resource use, and player-visible result logging.
- No attack/damage target layer, spellSlot Action Registry refactor, Host Console, AI Host, or multiplayer work.

DND 2024 Class Resources and Spell Preparation Closure v1 scope:
- Base class resource definitions and runtime state cover Barbarian Rage, Bardic Inspiration, Fighter Second Wind / Action Surge, Monk Focus, Paladin Lay on Hands, Sorcerer Sorcery Points, Warlock Pact Magic state, and Wizard Arcane Recovery definition.
- DND short rest / long rest resource recovery now writes local `RuntimeLogEntry` records into the RollConsole; toast remains supplemental only.
- Long rest v1 refreshes long-rest resources and also covers short-rest resources because a long rest subsumes short-rest recovery in this tool model.
- `getDndSpellPreparationModel` centralizes preparation mode, spellcasting ability, standard slots, pact magic, prepared limit approximation, rule hints, and deferred markers.
- Prepared spell limits for formula-based classes remain v1 approximations; full official spell list, full spell preparation UI, Wizard spellbook workflow, HP/Hit Dice rest automation, exhaustion/conditions, enemy/target/damage pipeline, and full combat Action Registry remain deferred.

DND Spellcasting Path Unification v1 scope:
- Gameplay spell casting now routes through `consumeSpellcastingResource` for cantrips, standard spell slots, and Pact Magic slots.
- Legacy `consumeSpellSlot` remains as a compatibility wrapper instead of a separate UI path.
- Spell casting writes structured local `RuntimeLogEntry` records with spell name, spell level, resource type, slot level, previous/remaining slots, and pact magic metadata.
- Pact Magic slots take priority over standard spell slots for any spell at or below `pactMagicState.slotLevel`. When pact slots are exhausted, the cast returns `ok: false` without falling back to standard slots. This is correct for pure Warlocks and is a v1 simplification for multiclass characters who hold both slot types.
- No spell effects, target selection, concentration, saving throws, damage automation, Action Registry spellSlot costs, schema, migration, COC, or CP RED changes.

### Call of Cthulhu (COC)

| Item | Status |
|------|--------|
| schemaVersion + migrateCocCharacter | ✅ Done |
| coc-utils pure functions (HP/MP/SAN/d100 check) | ✅ Done |
| CocCreator — uses getCocDerivedHp/Mp/InitialSan/SanMax | ✅ Done |
| CocSheet — uses evaluateCocD100Check | ✅ Done |
| CocGameplay — uses evaluateCocD100Check | ✅ Done |
| COC runtime state v2 foundation | ✅ Done |
| COC Runtime State UI Panel v1 | ✅ Done |
| COC Gameplay RollConsole RuntimeLogEntry v1 | ✅ Done |
| COC Skill Check Wiring v1 | ✅ Done |
| COC SAN Check + Luck Spending v1 | ✅ Done |
| COC Pushed Roll v1 | ✅ Done |
| COC Growth Check v1 | ✅ Done |
| COC Gameplay Componentization v1 | ✅ Done |
| COC Creator skill point constraint v1 | ✅ Done |
| COC Sheet responsibility cleanup v1 | ✅ Done |

COC runtime state v2 foundation scope:
- Adds local character `runtime` state for HP, MP, SAN, Luck, status flags, skill growth marks, and pushed roll context.
- Migrates old COC characters to schemaVersion 2 and fills missing runtime fields idempotently.
- Adds store actions for runtime initialization and manual HP/MP/SAN/Luck/flag/growth-mark/pushed-roll updates.
- No COC UI wiring, Keeper Console, visibility filtering, full insanity flow, Luck spending UI, or pushed roll UI.

COC Runtime State UI Panel v1 scope:
- CocGameplay displays runtime-first HP, MP, SAN, and Luck values with legacy fallback.
- CocGameplay uses existing runtime store actions for HP/MP/SAN/Luck adjustment and manual runtime flag toggles.
- No RollConsole, RuntimeLogEntry, Skill Check wiring, SAN Check workflow, Luck spending workflow, Pushed Roll UI, Keeper Console, or visibility filtering.

COC Gameplay RollConsole RuntimeLogEntry v1 scope:
- CocGameplay local logs use `RuntimeLogEntry[]` instead of `string[]`.
- CocGameplay displays a RollConsole-style Latest Result and structured history log from local runtime log entries.
- Existing resource adjustments, flag toggles, runtime initialization, SAN quick roll, and free dice roll log producers write local COC RuntimeLogEntry objects.
- No store, schema, migration, full Skill Check wiring, SAN Check workflow, Luck spending workflow, Pushed Roll UI, Keeper Console, gmOnly filtering, reveal workflow, combat, or chase changes.

COC Skill Check Wiring v1 scope:
- CocGameplay displays player-facing public skill checks from the existing character skills list.
- Skill check results use `evaluateCocD100Check` and write local `RuntimeLogEntry` objects for CocRollConsolePanel Latest Result and history display.
- SAN quick roll now uses the runtime-first SAN current value.
- No store, schema, migration, Luck spending, Pushed Roll, growth resolution, SAN Check workflow, Keeper Console, gmOnly filtering, reveal workflow, combat, or chase changes.

COC SAN Check + Luck Spending v1 scope:
- CocGameplay has a minimum SAN Check panel with preset/custom SAN loss expressions, applies SAN loss through existing `changeSan`, and writes local `RuntimeLogEntry` results.
- Eligible failed public skill checks can spend Luck to become ordinary success through existing `changeLuck`, with a follow-up `RuntimeLogEntry`.
- No full insanity automation, Pushed Roll, growth resolution, Keeper Console, AI Host, multiplayer, store, schema, migration, DND, or CP RED changes.

COC Pushed Roll v1 scope:
- Eligible failed non-fumble public skill checks can make one local Pushed Roll from CocGameplay.
- Pushed Roll does not modify the original failed skill check entry; it appends a new local `RuntimeLogEntry` with `pushed-roll`, source entry id, result tags, and Keeper-adjudication note on failure.
- Luck Spending and Pushed Roll are mutually cleared after either correction path is used; no store/schema/migration changes.
- No full Keeper Console, full insanity automation, Growth Check, AI Host, map, multiplayer, DND, or CP RED changes.

COC Growth Check v1 scope:
- Successful public skill checks can be marked for growth using existing persisted `runtime.skillGrowthMarks`.
- Marked skills can run a minimum growth check in CocGameplay: roll d100, improve only when roll is greater than current skill, then write `min(99, previousValue + 1d10)`.
- Growth success now applies maximum skill cap 99; the RuntimeLogEntry payload records `rawNewValue`, `cap`, and `capped`.
- Growth mark, clear, and resolution events write local `RuntimeLogEntry` records for the CocGameplay RollConsole.
- No Keeper Console, full campaign advancement, occupation/archetype progression, full insanity automation, map, multiplayer, AI Host, DND, or CP RED changes.

COC Gameplay Componentization v1 scope:
- `CocGameplay.tsx` now orchestrates local state, runtime handlers, roll handlers, and panel composition while COC Gameplay UI sections live under `src/pages/cocGameplay/`.
- Extracted RollConsole, Runtime State, Checks, Dice Tray, and COC Gameplay shared helper modules.
- Behavior is intended to stay unchanged: local RuntimeLogEntry history remains capped at 20, latest entry stays first, entries use `system: 'coc'` and `visibility: 'public'`.
- Free Dice Tray remains in Gameplay as an isolated utility panel for now.
- No store, schema, migration, SAN Check workflow expansion, Luck Spending, Pushed Roll, Growth resolution, Keeper Console, AI Host, multiplayer, DND, or CP RED changes.

COC Creator skill point constraint v1 scope:
- CocCreator Step 3 now provides creation-time skill allocation with EDU × 4 occupational points and INT × 2 personal interest points.
- Skills can be marked occupational, personal, or unallocated, with current values clamped between base value and 90.
- No occupation skill table, Credit Rating range, age adjustments, Sheet cleanup, Gameplay automation, or Keeper Console.

COC Sheet responsibility cleanup v1 scope:
- CocSheet no longer performs sheet-side roll/toast checks or unrestricted skill value editing.
- HP, MP, SAN, and Luck are displayed read-only from runtime state with legacy field fallback.
- Skill growth checkboxes use `runtime.skillGrowthMarks`; no automatic growth resolution or Gameplay RollConsole wiring.

### Cyberpunk RED (CP)

| Item | Status |
|------|--------|
| schemaVersion + migrateCpCharacter | ✅ Done |
| cp-utils pure functions (HP/SW/DB/Humanity/exploding-d10/skill-check) | ✅ Done |
| CpSheet responsibility cleanup v1 | ✅ Done |
| CP RED runtime state foundation v2 | ✅ Done |
| CP RED Gameplay RollConsole RuntimeLogEntry v1 | ✅ Done |
| CP RED Skill Check Wiring v1 | ✅ Done |
| CP RED Log Envelope Purification v1 | ✅ Done |
| CP RED Gameplay Componentization v1 | ✅ Done |
| CP RED Equipment / Market Inventory Flow v1 | ✅ Done |
| CP RED Stable Item Instance ID v1 | ✅ Done |
| CpGameplay — uses evaluateCpExplodingD10 / evaluateCpSkillCheck | ✅ Done |
| cpStore — uses getCpMaxHp / getCpSeriouslyWoundedThreshold / getCpDeathSaveBase / getCpHumanityMax / isCpCyberpsycho | ✅ Done |

CP RED runtime state foundation v2 scope:
- Adds optional `runtime` state for HP, Humanity, runtime EMP, armor SP shell, wound flags, and critical injury tracking.
- Runtime foundation migrated old CP RED characters to schemaVersion 2 and filled missing runtime state idempotently; Stable Item Instance ID v1 now bumps CP RED character schemaVersion to 3.
- Adds runtime store actions for initialization, refresh, HP/Humanity deltas, runtime flags, and critical injury tracking.
- No CP RED UI changes, RuntimeLogEntry integration, RollConsole, no-DV path, armor/ammo/damage automation, Netrunning, GM Console, or AI Host.

CP RED Gameplay RollConsole RuntimeLogEntry v1 scope:
- CpGameplay local logs now use `RuntimeLogEntry[]` instead of `string[]`.
- CpGameplay displays a RollConsole-style Latest Result derived from the first runtime log entry, with structured history in the same result center.
- Existing CP RED skill checks, stat checks, role ability checks, death saves, damage rolls, resource adjustments, injury handling, free dice rolls, and system messages now write local CP RED `RuntimeLogEntry` objects.
- Log Envelope Purification v1 removes the legacy string `addLog` compatibility path; current CP RED runtime log writes must pass structured `RuntimeLogEntry` objects.
- No store, schema, migration, CP RED type, cp-utils, Sheet, Creator, DND, or COC changes.
- No armor ablation, ammo tracking, full combat automation, critical injury pipeline expansion, Netrunning expansion, GM Console, gmOnly/reveal, AI Host, multiplayer, map, or scene work.

CP RED Skill Check Wiring v1 scope:
- No-DV role ability checks now display `等待 GM 判定` instead of success/failure and include `no-dv` / `gm-adjudication` tags.
- CpGameplay skill check success handling avoids non-null assertion and keeps the existing DV-based behavior.
- Netrunner no-roll actions, NET damage prompts, Solo pool reset, and Lawman backup calls now write structured local `RuntimeLogEntry` objects instead of string system logs.
- The string `addLog` compatibility path has been removed; new writes must use structured local `RuntimeLogEntry` objects.
- No rule expansion, Netrunning state machine, armor ablation, ammo tracking, full damage pipeline, GM Console, AI Host, store, schema, migration, DND, or COC changes.

CP RED Gameplay Componentization v1 scope:
- `CpGameplay.tsx` now orchestrates local state, handlers, and panel composition while CP RED Gameplay UI sections live under `src/pages/cpGameplay/`.
- Extracted RollConsole, runtime state, checks, role ability, damage/death save/injury, and free dice tray panels.
- Behavior is intended to stay unchanged: local RuntimeLogEntry history remains capped at 20, latest entry stays first, entries use `system: 'cpred'` and `visibility: 'public'`.
- Free Dice Tray remains in Gameplay as an isolated utility panel for now.
- No store, schema, migration, armor/ammo automation, Netrunning state machine, GM Console, AI Host, multiplayer, DND, or COC changes.

CP RED Equipment / Market Inventory Flow v1 scope:
- Reuses existing CP RED inventory/equipment fields and store actions for market-to-inventory flow.
- CpMarket can add weapons, armor, cyberware, fashion, and gear to character inventory using existing EB/fashion EB purchase paths.
- CpSheet shows inventory/equipment state and supports equip/unequip/install/uninstall without losing items.
- Cyberware install/uninstall is state-only; Humanity Loss automation remains deferred.
- CP RED Stable Item Instance ID v1 adds `instanceId` to inventory/equipped weapons, armor, cyberware, fashion, and gear.
- Same-name duplicate items can coexist at the inventory/equip flow level; legacy missing `instanceId` values are migrated or handled by safe fallback.
- Durability, ammo, armor ablation, Humanity Loss automation, and full damage pipeline remain deferred.
- No armor ablation, ammo tracking, full damage pipeline, Netrunning state machine, GM Console, AI Host, DND, or COC changes.

---

## Build Status

| Check | Status |
|-------|--------|
| npx tsc --noEmit | ✅ Passing |
| npm run build | ✅ Passing |
| Git committed | ⏳ Pending |

---

## Known Intentional Non-Replacements

- `computeEmpFromHumanity` in `cpStore.ts` — delta-based (adjusts EMP only at ten-boundary crossings). Semantically different from `getCpRuntimeEmp` (absolute `floor(humanity/10)`). Left as-is by design.

---

## Explicitly Out of Scope (This Phase)

- CP: armorState, armor ablation, ammo consumption
- CP: roleAbilityState, netrunningState, vehicleState
- CP: getCpArmorPenetration / getCpHeadshotDamageAfterArmor / hasCpCriticalInjury
- COC: insanity system, skill improvement rolls
- DND: spell effects, target selection, concentration, action economy, combat automation

---

## Directory Layout (src)

```
src/
  lib/
    dnd-types.ts / dndMigration.ts
    coc-types.ts / cocMigration.ts / coc-utils.ts
    cp-types.ts  / cpMigration.ts
    cp2024/
      cp-utils.ts
  store/
    dndStore.ts
    cocStore.ts
    cpStore.ts
  pages/
    DndCreator.tsx / DndSheet.tsx / DndGameplay.tsx
    CocCreator.tsx / CocSheet.tsx / CocGameplay.tsx
    CpCreator.tsx  / CpSheet.tsx  / CpGameplay.tsx / CpMarket.tsx
```
