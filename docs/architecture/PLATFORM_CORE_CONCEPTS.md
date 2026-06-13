# Platform Core Concepts & Game System Registry Baseline

<!-- AI-LANDMARK: PLATFORM_CORE_CONCEPTS_GAME_SYSTEM_REGISTRY_BASELINE -->

Last updated: 2026-06-13

## Purpose

This document establishes the platform-level architectural vocabulary and the Game System Registry baseline for this project.

The project is a **Chinese-first, extensible, multi-ruleset TRPG / tabletop game tool platform**. DND 5e 2024, Call of Cthulhu 7e, and Cyberpunk RED are the first three built-in Game Systems — they are **sample instances of the platform**, not the platform boundary.

This document is:
- A conceptual baseline for future development decisions
- A vocabulary alignment document for AI assistant context
- A planning anchor for data contracts, schema design, and feature phasing
- **Not** a code spec. Nothing here requires immediate implementation.

---

## Section 1 — Platform Positioning

> **中文优先，可扩展，多规则 TRPG / 桌游工具平台。**
> Chinese-first, extensible, multi-ruleset TRPG / tabletop game tool platform.

Key principles:
1. DND / COC / CP RED are built-in Game Systems, not platform constraints.
2. The platform must eventually support: Japanese TRPG, wargames, custom boardgames, narrative games, community rule packages, and player-private licensed imports.
3. Platform abstraction layer must be generic enough to describe all of the above.
4. Current P1 phase builds on the three built-in systems; abstractions are defined here and adopted incrementally.

---

## Section 2 — Core Concept Definitions

### 2.1 Game System

**Responsible for:** Defining a complete ruleset profile — dice profile, actor type, sheet/builder templates, board capability level, compendium categories, source packages, and automation level. A Game System is the top-level registry entry that binds all other concepts together for one ruleset.

**Not responsible for:** Storing character data, running dice, rendering UI, managing session state.

**Current project mapping:** DND / COC / CP RED are each a Game System. Presently they are implemented as hardcoded branches (`system === 'D&D' | 'CoC' | 'CP'`). The long-term goal is a registry-driven dispatch.

**Future goal:** `GameSystemRegistry.lookup(systemId)` returns a `GameSystemEntry` that drives all system-specific behavior declaratively.

**V1 implementation:** No. This document is a baseline only.

**Requires data contract:** Yes — `GameSystemEntry` schema is deferred.

**Risk level:** Low (this is a doc baseline). Medium when schema is introduced.

---

### 2.2 Actor / Player Asset

**Responsible for:** Representing a single playable entity — a character, investigator, Edgerunner, crew member, unit, etc. An Actor belongs to a Game System and a player. It carries identity, stats, inventory, and personal runtime state.

**Not responsible for:** Party/group management, session ownership, board positioning.

**Current project mapping:**
- DND: `CharacterData` in `characterStore`
- COC: `CocCharacter` in `cocStore`
- CP RED: `CpCharacter` in `cpStore`

These are currently one-per-system local stores. The platform abstraction is "Actor".

**Terminology alignment:**
- "Character" / "Investigator" / "Edgerunner" are **system display labels** — the name the Game System assigns to its actors.
- "Actor" / "Player Asset" is the **platform abstraction term**.
- The Character Vault, Investigator Vault, and Edgerunner Vault are all **Actor Vaults** at the platform level. Future naming: **Player Asset Vault**.

**Future goal:** Actor abstraction with multi-system, multi-character store. One player can own actors across multiple Game Systems. One Actor can be enrolled in multiple Campaigns / Modules / Sessions.

**V1 implementation:** No — current stores are per-system singletons. Abstraction is vocabulary-only.

**Requires data contract:** Yes — multi-actor store is a P2+ dependency.

**Risk level:** Medium (store redesign required when implemented).

---

### 2.3 Asset Collection

**Responsible for:** A named, owned group of Actors for shared play contexts — a D&D party, a CP RED crew, a COC investigator group, a wargame army roster, a boardgame player hand.

**Not responsible for:** Session management, map state, GM tools.

**Current project mapping:** Not implemented. No collection concept exists today.

**Future goal:** `AssetCollection` with a type label (party / crew / army / roster / hand) per Game System.

**Terminology note:** "Party" is the DND display label. "Crew" is the CP RED label. The platform abstraction is "Asset Collection".

**V1 implementation:** No.

**Requires data contract:** Yes.

**Risk level:** Low to introduce vocabulary; Medium to implement.

---

### 2.4 Sheet Template

**Responsible for:** Defining the layout and field structure of a character sheet display for a given Game System. A Sheet Template is a presentation contract — it maps Actor data fields to display regions.

**Not responsible for:** Dice rolls, runtime state, edit logic.

**Current project mapping:** `Sheet.tsx` (DND), `CocSheet.tsx` (COC), `CpSheet.tsx` (CP RED). These are hardcoded per system.

**Future goal:** Sheet Template as a Game System registry entry that the platform renders generically.

**V1 implementation:** No — current sheets are hardcoded.

**Requires data contract:** Yes — template schema deferred.

**Risk level:** Low as vocabulary; High if system sheets are refactored.

---

### 2.5 Builder Template

**Responsible for:** Defining the creation flow and step structure for building an Actor in a given Game System — species/class/ability/skill selection, point buy, derived stat calculation order.

**Not responsible for:** Storing the result, dice rolls, sheet display.

**Current project mapping:** `Creator.tsx` (DND), `CocCreator.tsx` (COC), `CpCreator.tsx` (CP RED). Hardcoded per system.

**Future goal:** Builder Template as a Game System registry entry that declares creation steps, field types, and validation rules declaratively.

**V1 implementation:** No — current builders are hardcoded.

**Requires data contract:** Yes — template schema deferred.

**Risk level:** Low as vocabulary; High if builders are refactored.

---

### 2.6 Dice Profile

**Responsible for:** Declaring the canonical dice set, roll syntax, and exploding/bonus/penalty conventions for a Game System.

**Not responsible for:** Executing rolls, logging results, resolving targets.

**Current project mapping:**
- DND: d20-based (`src/pages/Gameplay.tsx`, `src/pages/gameplay/*`)
- COC: d100 with bonus/penalty dice (`src/pages/CocGameplay.tsx`, `src/pages/cocGameplay/*`)
- CP RED: exploding d10 / d10-based (`src/pages/CpGameplay.tsx`, `src/pages/cpGameplay/*`)

**Future goal:** `DiceProfile` as a Game System registry field. Roll engine reads it to know which dice to render.

**Defined dice profiles (vocabulary):**

| profileId | Game System | Core Die | Special Rules |
|---|---|---|---|
| `d20-standard` | DND | d20 | Advantage/Disadvantage |
| `d100-bonus-penalty` | COC | d% (d100) | Bonus/Penalty dice (extra tens, keep best/worst) |
| `exploding-d10` | CP RED | d10 | Exploding on 10, critical failure on 1 |
| `d6-pool` | Future (Shadowrun-like) | d6 | Pool with threshold |
| `d10-pool` | Future (WoD-like) | d10 | Pool with difficulty |
| `d6-narrative` | Future (narrative games) | d6 | Outcome ladder |

**V1 implementation:** No — this is a vocabulary baseline. Current dice are hardcoded.

**Requires data contract:** Yes — DiceProfile schema deferred.

**Risk level:** Low as vocabulary.

---

### 2.7 Rules Compendium

**Responsible for:** An indexed, read-only reference library of rule entries for a Game System — spells, skills, feats, equipment, occupations, roles, cyberware, weapons, etc.

**Not responsible for:** Character state, runtime dispatch, dice execution.

**Current project mapping:**
- DND: `DndWorkspaceShell.tsx` compendium view; `src/data/dnd2024/spellIndex.ts`, `characterOptionsIndex.ts`
- COC: `multiWorkspace.coc.modules.compendium` — planned
- CP RED: `multiWorkspace.cp.modules.compendium` — planned

**Source authority:** Owner-provided sources only (see `docs/rule-sources/RULE_SOURCE_MANIFEST.md`).

**Future goal:** Compendium as a searchable registry driven by a `CompendiumEntry[]` schema per Game System.

**V1 implementation:** Partial (DND index layer exists as display-only). COC and CP RED are planned.

**Requires data contract:** Yes — CompendiumEntry schema and search contract deferred.

**Risk level:** Low for index layer; Medium when search/filter is added.

---

### 2.8 Source Package

**Responsible for:** A named unit of rule source material — a PHB, a supplement, a community expansion, a locally imported licensed PDF. A Source Package carries a `sourceId`, a trust level, an allowed-use policy, and a content scope.

**Not responsible for:** Dice execution, UI rendering, Actor storage.

**Current project mapping:**
- DND: `dnd-local-chm-primary`, `dnd5echm-srd52-primary`, `dnd5echm-xgte`, `dnd5echm-tcoe`
- COC: defined in `docs/rule-sources/COC_SOURCES.md`
- CP RED: defined in `docs/rule-sources/CPRED_SOURCES.md`

**Source Package trust levels (from `rule-data-metadata.ts`):**
- `owner-verified` — owner-provided primary source, human-checked
- `source-indexed` — indexed against owner source, content pending check
- `ai-assisted-unverified` — AI-generated, not yet verified
- `needs-human-check` — flagged for manual review
- `out-of-source` — cannot be traced to an owner-provided source
- `missing` — known to exist in source but not yet extracted

**V1 implementation:** Partial — metadata types exist, applied to DND data layer.

**Requires data contract:** Partially implemented (`RuleDataMetadata` in `src/lib/rules/rule-data-metadata.ts`).

**Risk level:** Low — metadata layer is additive.

---

### 2.9 Content Package

**Responsible for:** A distributable bundle of Source Packages, compendium entries, Actor templates, and asset stubs for a specific Game System or expansion. A Content Package is the distribution unit for community content.

**Not responsible for:** Plugin execution, UI overrides, automation logic.

**Content Package sub-types:**

| Type | Contents | Risk Level | V1? |
|---|---|---|---|
| Rule Package | Compendium entries, source index | Low | No |
| Actor Template Package | Builder templates, sheet templates | Medium | No |
| Automation Package | Dice macros, condition triggers, effect chains | High | No |
| Visual Asset Package | Tokens, portraits, map tiles | Low | No |
| GM Tool Package | Encounter tables, NPC generators | Medium | No |

**V1 implementation:** No.

**Requires data contract:** Yes — deferred.

**Risk level:** Low as vocabulary; varies by sub-type on implementation.

---

### 2.10 Workshop Item

**Responsible for:** A user-published Content Package listed in a community workshop. Includes versioning, author attribution, dependency declarations, and download/subscription metadata.

**Not responsible for:** Executing code, overriding platform behavior, accessing user data.

**Current project mapping:** Planned placeholder only. `multiWorkspace.creation.workshop` shows a Coming Soon state.

**Safety boundary:**
- Workshop items must be pure data (Content Packages), not executable code.
- No Workshop item may inject arbitrary JavaScript.
- Subscription, versioning, dependency resolution, and community feeds are deferred until Plugin Safety Model is designed.

**V1 implementation:** No.

**Requires data contract:** Yes — deferred until Plugin Safety Model complete.

**Risk level:** High if implemented without safety model.

---

### 2.11 Board / Scene / Token

**Responsible for:** The spatial layer of a play session — a tactical map, a scene background, token positions, and sight lines.

**Not responsible for:** Actor stats, dice rolls, session log text.

**Board Capability Levels:**

| Level | Capability | Notes |
|---|---|---|
| L0 | No board support | Current state for all systems |
| L1 | Static scene image / background | Low complexity — display only |
| L2 | Token placement on grid (manual) | Requires coordinate store |
| L3 | Fog of war / LOS / auto-movement | High complexity — full engine |
| L4 | Real-time multiplayer sync | Requires backend |

**Current project mapping:** All systems at L0. L1/L2 planned for DND, COC, CP RED.

**V1 implementation:** No — deferred until data contract for coordinates/tokens exists.

**Requires data contract:** Yes — scene/token/coordinate schema deferred.

**Risk level:** Low at L1; Medium at L2; High at L3/L4.

---

### 2.12 Session / Campaign

**Responsible for:** A named play context that binds a group of Actors, a GM, a set of scenes, and a session log. A Campaign is a long-running container; a Session is a single play instance within one.

**Not responsible for:** Actor stat storage, dice execution, rule enforcement.

**Current project mapping:** Not implemented. Session Log and GM tools are planned placeholders in all three workspace dashboards (Session / Campaign Workspace tier in the IA model).

**Actor / Campaign relationship:** One Actor can be enrolled in multiple Campaigns / Modules / Sessions. This is a core platform invariant.

**V1 implementation:** No.

**Requires data contract:** Yes — Session/Campaign store deferred.

**Risk level:** High (requires Actor store redesign, board integration, backend for multiplayer).

---

### 2.13 Plugin / Mod

**Responsible for:** An extension that adds new behavior to the platform — a custom dice macro interpreter, a combat automation engine, an AI GM assistant, a custom UI panel. A Plugin has access to defined platform APIs.

**Not responsible for:** Arbitrary DOM access, network requests outside platform API.

**Plugin safety classification:**

| Class | Access Level | V1? | Risk |
|---|---|---|---|
| Content Plugin | Read-only compendium injection | No | Low |
| Automation Plugin | Dice macro execution | No | High — deferred |
| GM Tool Plugin | Encounter builder, NPC generator | No | Medium |
| UI Theme Plugin | Visual overrides (see Section 4) | No | Medium |
| Platform Plugin | New workspace views, store access | No | Very High — must design safety model first |

**V1 implementation:** No.

**Requires:** Plugin Safety Model design before any implementation.

**Risk level:** Very High if implemented without sandboxing.

---

### 2.14 UI Theme / Layout Pack

**Responsible for:** Defining the visual skin and layout density for a Game System workspace or platform shell. A Theme carries color tokens, font stacks, spacing scales, and optional background motifs.

**Not responsible for:** Dice logic, rule data, Actor state, network requests.

**Current project mapping:**
- DND: parchment/fantasy theme (hardcoded `#58180d`, `#fdf6e3`, `font-dnd-title`)
- COC: eldritch dark theme (hardcoded `#151a18`, `#2f7f68`, `font-elite`)
- CP RED: cyberpunk neon theme (hardcoded `#0d0d0d`, `#f5c518`, `font-cp-title`)
- Platform shell: neutral/minimal (Tailwind defaults)

**Artistic direction (see Section 4):** Atmospheric Minimalism / 氛围化简约.

**V1 implementation:** No formal Theme system. Current themes are hardcoded per system.

**Requires data contract:** Theme Token spec — low risk, additive when introduced.

**Risk level:** Low for token layer; Medium for Layout Pack; High for community CSS injection.

---

## Section 3 — Game System Registry

### 3.1 Registry Field Specification

The following table defines the complete V1-candidate field set for `GameSystemEntry`. Fields are classified as V1 required, V1 optional, or Future.

| Field | Type | Phase | Description |
|---|---|---|---|
| `systemId` | `string` | **V1 required** | Unique stable identifier (e.g. `dnd5e2024`, `coc7e`, `cpred`) |
| `displayName` | `string` | **V1 required** | English display name |
| `displayNameI18n` | `Record<string, string>` | **V1 required** | Localized display names (min: `zh-CN`, `en`) |
| `gameType` | `enum` | **V1 required** | `TRPG` \| `Investigation` \| `Wargame` \| `Boardgame` \| `Narrative` \| `Custom` |
| `primaryActorType` | `{ id: string; labelI18n: Record<string, string> }` | **V1 required** | Platform actor type + system display label (e.g. `{ id: 'actor', labelI18n: { 'zh-CN': '角色', 'en': 'Character' } }`) |
| `diceProfile` | `DiceProfileId` | **V1 required** | Reference to a Dice Profile entry (e.g. `d20-standard`) |
| `assetLabels` | `Record<string, string>` | **V1 required** | Display labels for Actor, Collection, etc. per locale |
| `sheetTemplate` | `SheetTemplateId \| 'hardcoded'` | **V1 optional** | Reference to sheet template; `'hardcoded'` for current built-ins |
| `builderTemplate` | `BuilderTemplateId \| 'hardcoded'` | **V1 optional** | Reference to builder template; `'hardcoded'` for current built-ins |
| `compendiumCategories` | `string[]` | **V1 optional** | List of compendium index categories |
| `sourcePackages` | `SourcePackageId[]` | **V1 optional** | Declared source packages for this system |
| `boardCapabilityLevel` | `0 \| 1 \| 2 \| 3 \| 4` | **V1 optional** | Current board capability (0 = none) |
| `sessionSupportLevel` | `0 \| 1 \| 2` | **V1 optional** | 0=none, 1=log only, 2=full campaign |
| `automationLevel` | `0 \| 1 \| 2 \| 3` | **V1 optional** | 0=none, 1=roll+log, 2=resource tracking, 3=full effect chain |
| `workshopSupportLevel` | `0 \| 1 \| 2` | Future | 0=none, 1=content packages, 2=full workshop |
| `themeProfile` | `ThemeProfileId \| 'hardcoded'` | Future | Reference to theme tokens; `'hardcoded'` for current systems |
| `translationAliases` | `Record<string, string>` | Future | Term aliases per locale (e.g. `{ 'roll': '掷骰' }`) |
| `importExportSupport` | `{ import: boolean; export: boolean; format: string }` | Future | Import/export capability declaration |
| `safetyRestrictions` | `string[]` | Future | Platform-level safety flags |
| `communityPackSupport` | `boolean` | Future | Whether this system accepts community Content Packages |
| `privateImportSupport` | `boolean` | Future | Whether players may import private licensed materials |

**Notes:**
- Fields marked `V1 required` are the minimum needed to drive a registry-based dispatch replacing the current `system === 'D&D'` branches.
- All fields are doc/metadata only today. No schema or store change is implied until implementation is scheduled.
- `sheetTemplate: 'hardcoded'` and `builderTemplate: 'hardcoded'` explicitly document the current state without forcing a migration.

### 3.2 Does the Registry Impact store/schema?

Introducing a `GameSystemEntry` doc/metadata object is zero-risk. Wiring it to the store or replacing hardcoded branches is a P2+ task that must be scheduled explicitly. This baseline document does not trigger any store, migration, or runtime change.

---

## Section 4 — Built-In Game System Entries (V1 Baseline Records)

### 4.1 DND 5e 2024

```
systemId:              dnd5e2024
displayName:           D&D 5e 2024
displayNameI18n:       { zh-CN: 'D&D 5e 2024', en: 'D&D 5e 2024' }
gameType:              TRPG
primaryActorType:      { id: 'actor', labelI18n: { zh-CN: '角色', en: 'Character' } }
assetLabels:
  actor:               { zh-CN: '角色', en: 'Character' }
  collection:          { zh-CN: '队伍', en: 'Party' }
  vault:               { zh-CN: '角色库', en: 'Character Vault' }
diceProfile:           d20-standard
sheetTemplate:         hardcoded  (Sheet.tsx)
builderTemplate:       hardcoded  (Creator.tsx)
compendiumCategories:
  - 法术 / Spells
  - 专长 / Feats
  - 装备 / Equipment
  - 职业与子职业 / Classes & Subclasses
  - 物种 / Species
  - 背景 / Backgrounds
sourcePackages:
  - dnd-local-chm-primary     (primary, owner-verified)
  - dnd5echm-srd52-primary    (secondary cross-check)
  - dnd5echm-xgte             (XGtE supplement)
  - dnd5echm-tcoe             (TCoE supplement)
boardCapabilityLevel:  0  (L1/L2 planned)
sessionSupportLevel:   0  (planned)
automationLevel:       2  (roll+log + resource tracking implemented)
workshopSupportLevel:  0  (deferred)
themeProfile:          hardcoded  (parchment / #58180d)
status:                built-in sample Game System
```

### 4.2 Call of Cthulhu 7e

```
systemId:              coc7e
displayName:           Call of Cthulhu 7th Edition
displayNameI18n:       { zh-CN: 'COC 7e 克苏鲁的呼唤', en: 'Call of Cthulhu 7th Edition' }
gameType:              TRPG / Investigation
primaryActorType:      { id: 'actor', labelI18n: { zh-CN: '调查员', en: 'Investigator' } }
assetLabels:
  actor:               { zh-CN: '调查员', en: 'Investigator' }
  collection:          { zh-CN: '调查小组', en: 'Investigator Group' }
  vault:               { zh-CN: '调查员库', en: 'Investigator Vault' }
diceProfile:           d100-bonus-penalty
sheetTemplate:         hardcoded  (CocSheet.tsx)
builderTemplate:       hardcoded  (CocCreator.tsx)
compendiumCategories:
  - 技能 / Skills
  - 规则库 / Rules Compendium  (planned)
sourcePackages:
  - (see docs/rule-sources/COC_SOURCES.md)
boardCapabilityLevel:  0  (L1/L2 planned)
sessionSupportLevel:   0  (planned)
automationLevel:       2  (roll+log + HP/SAN/MP/Luck + Pushed Rolls + Growth)
workshopSupportLevel:  0  (deferred)
themeProfile:          hardcoded  (eldritch dark / #2f7f68)
status:                built-in sample Game System
```

### 4.3 Cyberpunk RED

```
systemId:              cpred
displayName:           Cyberpunk RED
displayNameI18n:       { zh-CN: 'Cyberpunk RED', en: 'Cyberpunk RED' }
gameType:              TRPG
primaryActorType:      { id: 'actor', labelI18n: { zh-CN: 'Edgerunner', en: 'Edgerunner' } }
assetLabels:
  actor:               { zh-CN: 'Edgerunner', en: 'Edgerunner' }
  collection:          { zh-CN: '团队', en: 'Crew' }
  vault:               { zh-CN: 'Edgerunner 库', en: 'Edgerunner Vault' }
diceProfile:           exploding-d10
sheetTemplate:         hardcoded  (CpSheet.tsx)
builderTemplate:       hardcoded  (CpCreator.tsx)
compendiumCategories:
  - 装备与武器 / Equipment & Weapons
  - 义体 / Cyberware
  - 职业能力 / Role Abilities
  - 规则库 / Rules Compendium  (planned)
sourcePackages:
  - (see docs/rule-sources/CPRED_SOURCES.md)
boardCapabilityLevel:  0  (L1/L2 planned)
sessionSupportLevel:   0  (planned)
automationLevel:       2  (roll+log + resource tracking + inventory + cyberware install)
workshopSupportLevel:  0  (deferred)
themeProfile:          hardcoded  (cyberpunk neon / #f5c518)
status:                built-in sample Game System
```

---

## Section 5 — Future Game System Examples

The platform is designed to eventually support the following categories. These are recorded as planning vocabulary only — no implementation is implied.

| Category | Examples | Primary Actor Label | Dice Profile | Notes |
|---|---|---|---|---|
| Japanese TRPG | ソード・ワールド 2.5, クトゥルフ TRPGシリーズ | キャラクター / Character | Varies | Community-provided Source Packages |
| Wargame / Warhammer-like | Warhammer 40K, Age of Sigmar | Unit / 单元 | d6-pool | Asset Collection = Army/Roster |
| Custom Boardgame | Owner-defined | Player / 玩家 | Custom | Fully declarative Game System entry |
| Narrative Game | Ironsworn, Fiasco | Character / 角色 | d6-narrative | Minimal dice profile |
| Community Rule System | Owner/player-created | Varies | Custom | Private import or Workshop |

---

## Section 6 — Terminology Alignment

This section establishes the canonical vocabulary mapping between current code terms and platform abstraction terms.

| Current Code Term | Platform Abstraction Term | Notes |
|---|---|---|
| `Character` | Actor (DND display label: Character / 角色) | System display label only |
| `Investigator` | Actor (COC display label: Investigator / 调查员) | System display label only |
| `Edgerunner` | Actor (CP RED display label: Edgerunner) | System display label only |
| `Character Vault` | Actor Vault / Player Asset Vault | Future rename target |
| `Investigator Vault` | Actor Vault (COC) | Future rename target |
| `Edgerunner Vault` | Actor Vault (CP RED) | Future rename target |
| `Rule System Workspace` | Game System Workspace | Future rename target |
| `system === 'D&D' \| 'CoC' \| 'CP'` | `GameSystemRegistry.lookup(systemId)` | Future dispatch target |
| `PlayWorkspace` | System Host / Multi-System Container | Compatibility layer |
| `DndWorkspaceShell` | Game System Workspace (DND) | Future: generalized shell |
| `multiWorkspace.ia.*` | Workspace Tier Guidance section | Already uses platform terms |

**Invariants:**
1. DND / COC / CP RED are **not the platform boundary** — they are three built-in Game Systems.
2. "Character" / "Investigator" / "Edgerunner" are **system display labels**, not platform types.
3. One Actor can be enrolled in multiple Campaigns / Modules / Sessions.
4. Asset Collection (Party / Crew / Army) is a platform concept, not a system-specific one.

---

## Section 7 — Artistic Direction

### 7.1 Atmospheric Minimalism / 氛围化简约

The platform's visual design philosophy is **Atmospheric Minimalism** — a layered approach where the platform shell is clean and neutral, while each Game System workspace expresses its world through controlled atmosphere.

**Layer rules:**

| Layer | Style | Priority |
|---|---|---|
| Platform Shell | Minimalist neutral — no system theming bleeds in | Clarity |
| System Workspace Dashboard | Light system motif — color accent, logo treatment | Readability |
| Builder | Strong atmospheric immersion — backgrounds, textures, themed typography | Immersion |
| Character Sheet | Information density priority — typography, spacing, legibility | Legibility |
| Runtime / Gameplay | Dense, fast, focused — minimal decoration | Speed |
| Mobile | Information density and legibility over decoration | Accessibility |
| Workshop / Community | Neutral, trustworthy — no arbitrary visual overrides | Safety |

**Current DND/COC/CP RED themes are acceptable atmosphere-layer expressions.** Platform shell must never adopt system-specific colors.

### 7.2 Theme System Architecture Guidance

1. **Theme tokens** (CSS custom properties per system: `--system-accent`, `--system-bg`, `--system-text`) are low-risk and should be introduced when the first system workspace is refactored.
2. **Layout Packs** (responsive column presets, module grid density) are medium-risk and deferred until the workspace shell is generalized.
3. **Community CSS injection** is prohibited. Community visual content must be limited to pre-approved token overrides.
4. **Font stacks** per system (DND: `font-dnd-title`, COC: `font-elite`, CP RED: `font-cp-title`) are in scope for the current `hardcoded` theme profile.

---

## Section 8 — Workshop / Plugin Safety Model

### 8.1 Content Layer Classification

| Layer | Type | V1? | Safety Risk | Notes |
|---|---|---|---|---|
| Rule Content Package | Compendium entries, source index | No | Low | Pure data, no execution |
| Actor Template Package | Builder/sheet templates | No | Medium | Needs template sandbox |
| Visual Asset Package | Tokens, portraits, map tiles | No | Low | Static assets only |
| Automation Package | Dice macros, effect chains | No | High | Must sandbox JS execution |
| GM Tool Package | Encounter tables, NPC generators | No | Medium | Needs permission model |
| UI Theme Package | Token overrides | No | Medium | Must restrict to token layer |
| Platform Plugin | New views, store access, API hooks | No | Very High | Requires full plugin safety model |

### 8.2 Safety Invariants

1. **No Workshop item or Plugin may execute arbitrary JavaScript.**
2. **Workshop subscription, versioning, and community feeds are deferred** until Plugin Safety Model is designed and approved.
3. **Automation and Platform Plugins are deferred** until a plugin sandbox is implemented.
4. **Pure data Content Packages** (compendium entries, rule index) are the only candidates for early-phase community content.
5. **Player private import of licensed materials** (private PDF import, private local source) is a separate track from Workshop and must maintain clear source attribution and trust metadata.
6. The Plugin Safety Model design must precede any plugin execution implementation.

---

## Section 9 — Platform Workspace IA Model

This section summarizes the three-tier workspace IA model established in prior tasks for reference.

| Tier | Name | Contains | Current Status |
|---|---|---|---|
| Tier 1 | Game System Workspace | Rule scope, compendium, source status, completion, character library, creation method entry | Implemented (DND, COC, CP RED) |
| Tier 2 | Actor Workspace | Actor card, current status, resources, inventory, start playing, personal log | Planned — Actor store redesign required |
| Tier 3 | Session / Campaign Workspace | Map/scene, tokens, handouts, encounter, session log, GM tools, player list | Planned — data contract required |

**Module grid rule (follow-up IA correction):** System Workspace module grids show only Tier 1 entries. Tier 2 and Tier 3 modules are described in the workspace-tier guidance section only (informational `<div>`, not clickable `<button>` entries).

---

## Section 10 — Implementation Freeze Boundaries

The following are explicitly **not** implemented by this document or any V1 phase work:

- Game System engine / registry-driven dispatch
- Multi-actor store / Actor Vault redesign
- Asset Collection / Party / Crew management
- Sheet Template / Builder Template schema
- DiceProfile registry schema
- Board/Scene/Token data contract (all systems at L0)
- Session / Campaign store
- Workshop subscription system
- Plugin execution / sandboxing
- Community CSS injection
- Japanese TRPG / Wargame system support
- Formal Theme token system

These are vocabulary/planning artifacts only until explicitly scheduled.

---

## Document History

| Date | Change |
|---|---|
| 2026-06-13 | Initial baseline established — Platform Core Concepts & Game System Registry Baseline v1 |
