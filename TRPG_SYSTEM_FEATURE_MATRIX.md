# TRPG System Feature Matrix

Last updated: 2026-05-31

## 1. Purpose

This file tracks feature coverage across DND, Call of Cthulhu, and Cyberpunk RED. It exists to keep the three systems aligned instead of letting each system grow its own incompatible Creator / Sheet / Gameplay / log architecture.

Goals:

- Clarify which features each system needs.
- Clarify what is already complete.
- Assign P0 / P1 / P2 / P3 priority.
- Mark deferred work explicitly.
- Provide implementation boundaries for future Codex rounds.

## 2. Priority Definition

| Priority | Meaning |
|---|---|
| P0 | Must do. Required for a core usable loop. |
| P1 | Should do. Improves usability and system correctness. |
| P2 | Later. Valuable extension after foundations stabilize. |
| P3 | Deferred. Complex, broad, or dependent on future architecture. |

## 3. Shared Feature Layers

| Layer | Meaning |
|---|---|
| Creator | Creation-time choices, attributes, starting skills/resources, initial derived values, and initial equipment where needed. |
| Sheet | Character display and downtime maintenance. Should not own gameplay rolls or unrestricted creation-time allocation. |
| Player Gameplay | Runtime play console for checks, resource changes, actions, state flags, and player-visible results. |
| Roll Console | The single result center for Latest Result, calculations, outcomes, tags, and history log. |
| Host Console | Future DM/KP/GM workspace for hidden results, free roll, NPCs, reveal controls, random tables, scenes, maps, and full session log. |
| NPC / Enemy / Target Layer | Future target model for enemies, NPCs, AC/DV/DC targets, HP, conditions, and opposed resolution. |
| Map / Scene / Module Layer | Future scenario state, clues, scenes, map controls, encounter framing, and module content. |
| Multiplayer / Sync Layer | Future shared session state, visibility filtering, player ownership, permissions, and sync. |

## 4. DND Feature Matrix

| Feature | Layer | Priority | Current Status | Notes |
|---|---|---|---|---|
| Character Creator | Creator | P0 | Done | Functional DND creator exists. |
| Sheet responsibility cleanup | Sheet | P0 | Done | Sheet is closer to display/maintenance; gameplay rolls moved out. |
| classResources | Runtime / Sheet / Gameplay | P0 | Done | Runtime container, initialization, display, manual controls, rest recovery, and level-up refresh exist. Reference implementation for resource runtime. |
| pactMagicState | Runtime / Sheet / Gameplay | P0 | Done | Dedicated state exists; manual controls and resource display exist. |
| restShort / restLong | Player Gameplay / Store | P1 | Done for basic resources | Basic recovery and selected special recovery are implemented; complex feature workflows remain deferred. |
| special recovery | Runtime / Store | P1 | Done v1 | Safe special recovery only; complex cases such as Rage hit dice and Arcane Recovery choices are deferred. |
| levelUp resource refresh | Runtime / Store | P1 | Done | Existing/new level resources refresh while preserving current where appropriate. |
| Gameplay Checks | Player Gameplay | P0 | Done | Ability, skill, save, initiative checks exist with optional DC. |
| Gameplay Actions | Player Gameplay | P1 | Done v0.1 | Resource-backed Actions panel exists. |
| Action Registry v0/v0.1 | Shared DND data/UI | P1 | Done v0.1 | Describes resource-backed actions and consumes `classResource` / `pactMagic`; still v0 and intentionally narrow. |
| RollConsole | Roll Console | P0 | Done | DND has single player result center and no top ResultFocusPanel. |
| RuntimeLogEntry[] | Roll Console | P0 | Done | DND local `combatLog` uses `RuntimeLogEntry[]`; reference implementation for structured logs. |
| Optional DC | Player Gameplay / Roll Console | P1 | Done | No DC means waiting for DM judgment; DC enables success/failure. |
| NAT 20 / NAT 1 labels | Roll Console | P1 | Done | Labels shown without universal success/failure interpretation. |
| spellSlot consumption path | Player Gameplay | P1 | Existing legacy path | Standard spell slot consumption exists outside Action Registry. Do not add `spellSlot` to Action Registry yet. |
| Attack / damage | Player Gameplay / Target Layer | P2 | Deferred | Needs target/equipment/damage architecture. |
| Enemy / target | Target Layer | P3 | Deferred | Do not introduce until target model is designed. |
| Host Console | Host Console | P3 | Deferred | Player Gameplay must not contain Host Tools. |
| visibility filtering | Roll Console / Multiplayer | P3 | Reserved only | RuntimeLogEntry has visibility model; no filtering/reveal implementation yet. |
| multiplayer | Multiplayer / Sync | P3 | Deferred | Requires ownership, visibility, and sync architecture. |

DND is the current reference implementation for Creator / Sheet / runtime resources / RollConsole / RuntimeLogEntry. Action Registry remains v0. `spellSlot` must not be reintroduced to Action Registry until spellcasting resource selection is designed. Attack, damage, target model, Host Console, and multiplayer are frozen.

## 5. COC Feature Matrix

| Feature | Layer | Priority | Current Status | Notes |
|---|---|---|---|---|
| Character Creation | Creator | P0 | Existing | Basic COC creator exists. |
| Creator skill point constraint | Creator | P0 | Done | Step 3 supports EDU x 4 occupational points and INT x 2 personal interest points. |
| Sheet responsibility cleanup | Sheet | P0 | Done | Sheet no longer owns roll/toast checks or unrestricted skill value editing. |
| Runtime Foundation v2 | Runtime / Store | P0 | Done | `runtime` state added and migrated. |
| hp / mp / san / luck runtime | Runtime / Store | P0 | Done | Store actions exist; CocGameplay not wired yet. |
| major wound / dying / unconscious flags | Runtime / Store | P1 | In foundation | Flags and HP delta utility exist; UI automation not wired. |
| temporary / indefinite insanity flags | Runtime / Store | P2 | In foundation | Flags exist; full insanity flow deferred. |
| skillGrowthMarks | Sheet / Runtime | P1 | Done | Sheet growth marks use runtime state; no growth resolution. |
| pushedRollContext | Runtime | P2 | In foundation | State/actions exist; UI deferred. |
| d100 success level utils | Rules / Utils | P0 | Done | Pure function exists. |
| SAN loss parser | Rules / Utils | P1 | Done foundation | Basic expression parser/roller exists; no SAN Check UI. |
| HP delta / major wound utils | Rules / Utils | P1 | Done foundation | Pure function exists; UI automation deferred. |
| CocGameplay runtime actions | Player Gameplay | P0 | Not done | Store actions exist, but CocGameplay has not been aligned to runtime. |
| CocGameplay RollConsole | Roll Console | P0 | Not done | Still needs DND-style player RollConsole. |
| RuntimeLogEntry[] | Roll Console | P0 | Not done | COC still needs structured log migration. |
| Skill checks | Player Gameplay | P0 | Existing partial | Current Gameplay can roll checks, but not yet aligned to RuntimeLogEntry/RollConsole contract. |
| SAN Check | Player Gameplay | P1 | Not done | Needs runtime SAN loss workflow; no full insanity system yet. |
| Luck spending | Player Gameplay | P1 | Not done | Store action exists for luck changes; UI/rules not wired. |
| Pushed Roll | Player Gameplay | P2 | Not done | Context state exists; consequence flow deferred. |
| Growth marks | Sheet / Downtime | P1 | Partial | Marking exists; growth resolution deferred. |
| Keeper Console | Host Console | P3 | Deferred | No KP tools in player Gameplay. |
| Hidden results | Host Console / Visibility | P3 | Reserved only | Visibility principle documented; no filtering. |
| NPC / Combat / Chase | Target / Scene | P3 | Deferred | Requires separate rule coverage. |
| Clues / Investigation | Scene / Module | P2 | Deferred | Future module/scene layer. |
| Assets / Equipment | Sheet / Creator | P2 | Existing maintenance | Sheet can maintain assets/inventory; no structured equipment automation. |

COC has completed Runtime Foundation, Creator skill constraints, and Sheet cleanup. CocGameplay has not yet been wired to runtime actions, RuntimeLogEntry, or the unified RollConsole. Keeper Console, gmOnly filtering, full insanity automation, combat, and chase rules remain deferred.

## 6. Cyberpunk RED Feature Matrix

| Feature | Layer | Priority | Current Status | Notes |
|---|---|---|---|---|
| Character Creation | Creator | P0 | Existing | CpCreator exists. Needs rule coverage audit. |
| Lifepath | Creator | P1 | Unknown / needs audit | Must be assessed before expansion. |
| Role | Creator / Runtime | P1 | Existing partial | Role data/state needs coverage audit. |
| Stats | Creator / Sheet | P0 | Existing | Basic stats exist. |
| Skills | Creator / Sheet / Gameplay | P0 | Existing | Skill checks exist via cp-utils. |
| Sheet | Sheet | P0 | Existing | Needs responsibility audit against global contract. |
| Player Gameplay | Player Gameplay | P0 | Existing | Needs RollConsole/RuntimeLogEntry alignment. |
| Skill Checks | Player Gameplay | P0 | Existing | Uses exploding d10 utilities. |
| Exploding d10 | Rules / Utils | P0 | Done | `evaluateCpExplodingD10` / `evaluateCpSkillCheck` exist. |
| DV | Player Gameplay / Roll Console | P1 | Existing partial | Needs contract-aligned latest result and no-target handling audit. |
| RuntimeLogEntry[] | Roll Console | P0 | Not done | CP Gameplay has not unified to structured log entries. |
| Humanity / EMP | Runtime / Store | P0 | Existing | cpStore utilities exist; semantics need audit before UI expansion. |
| Cyberware | Creator / Sheet / Runtime | P1 | Existing partial | Needs coverage audit. |
| HP | Runtime / Store | P0 | Existing | Basic HP logic exists. |
| Seriously Wounded | Runtime / Store | P1 | Existing utility | Needs Gameplay/UI alignment audit. |
| Death Save | Player Gameplay | P1 | Existing utility / needs audit | Needs full responsibility mapping. |
| Armor / SP / ablation | Runtime / Combat | P2 | Deferred | Listed as out of scope in current status. |
| Damage | Combat | P2 | Deferred | Requires armor, wounds, targets. |
| Ammo | Runtime / Combat | P2 | Deferred | Requires weapon/equipment model. |
| Critical Injuries | Combat / Runtime | P2 | Deferred | Needs rule coverage and UI plan. |
| Netrunning | Player Gameplay / Scene | P3 | Deferred | Large subsystem. |
| Market / Gear | Sheet / Creator / Scene | P1 | Existing partial | CpMarket exists; needs coverage audit. |
| Vehicles | Scene / Runtime | P3 | Deferred | Large subsystem. |
| GM Console | Host Console | P3 | Deferred | Future host tools only. |
| NPC / Enemy | Target Layer | P3 | Deferred | Requires target model. |
| Hidden results | Host Console / Visibility | P3 | Reserved only | No filtering/reveal yet. |

Cyberpunk RED has `cp-types`, `cpStore`, `CpCreator`, `CpSheet`, `CpGameplay`, and `CpMarket`, with `cp-utils` wired into several basic flows. It does not yet have a systemized coverage matrix. Armor ablation, ammo, critical injuries, netrunning, vehicles, RuntimeLogEntry, and Host Console remain frozen until a CP RED rule coverage audit is written.

## 7. Cross-System Shared Abstractions

Shared abstractions:

- `RuntimeLogEntry`
- Result visibility: `public`, `gmOnly`, `playerOnly`, `revealed`
- Latest Result
- RollConsole
- Player / Host boundary
- Creator / Sheet / Gameplay separation
- Runtime state panels
- Resource / state change logs
- Status flags

Do not force-abtract:

- d20 / d100 / exploding d10 check mathematics
- DND resources, COC SAN/Luck, CP Humanity/SP
- COC success levels vs. DND/CP target-value checks
- System-specific status flags
- Combat automation

## 8. Current Freeze Decision

Current freeze:

- Freeze new feature coding while cross-system architecture docs are being written.
- Do not continue DND Action Registry expansion.
- Do not continue COC Gameplay implementation until docs are complete.
- Do not continue CP RED implementation until rule coverage is complete.
- Do not implement Host Console.
- Do not implement Multiplayer.
- Do not implement complex combat automation.

