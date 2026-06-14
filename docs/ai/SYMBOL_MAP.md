# Symbol Map

## Purpose

This file helps AI quickly locate important types, helper functions, store actions, and UI panels. Use it after `docs/ai/PROJECT_INDEX.md` when a task names a feature, action, or type.

## Navigation Policy

- Do not write fixed line numbers in markdown.
- Use symbol names, landmarks, and `rg -n` commands.
- `docs/ai/SYMBOL_MAP.md` answers "where is X?"
- Code `AI-LANDMARK` comments act as precise semantic anchors.
- Do not create a separate `CODE_LANDMARKS.md`; generate landmark listings with `rg -n "AI-LANDMARK"` when needed.
- Task history belongs in `docs/ai/TASK_ARCHIVE.md`.

## Platform Home Launchpad + System Library IA

- `Home` component: `src/pages/Home.tsx`
- `AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V2`: `src/pages/Home.tsx`
- Home sections: 继续上次 / 最近使用 / 固定入口 / 平台状态摘要 — `src/pages/Home.tsx`
- `pinnedEntries[]`: key/labelKey/icon/placeholderKey entries for fixed shortcuts — `src/pages/Home.tsx`
- `SystemLibrary` component: `src/pages/SystemLibrary.tsx`
- `AI-LANDMARK: SYSTEM_LIBRARY_SCAFFOLD_V1`: `src/pages/SystemLibrary.tsx`
- `AppView` union: `'home' | 'play' | 'placeholder' | 'systemLibrary'` — `src/App.tsx`
- `openPlaceholder(feature)` intercept: `feature === 'ruleSystems' || feature === 'systemLibrary'` → `setAppView('systemLibrary')` — `src/App.tsx`
- `navItems` key union: `'home' | 'systemLibrary' | 'settings'` (play removed) — `src/App.tsx`
- `fallbackNavigation`: workspace case → `setAppView('systemLibrary')` — `src/App.tsx`
- `AvailabilityKey`: `'available' | 'unavailable'` — `src/pages/SystemLibrary.tsx`
- `SourceKey`: `'builtin' | 'local' | 'community'` — `src/pages/SystemLibrary.tsx`
- `CategoryKey`: `'trpg' | 'boardgame' | 'wargame' | 'cardgame' | 'custom'` — `src/pages/SystemLibrary.tsx`
- `SystemEntry.tagKeys[]`: i18n key array for genre tag chips; included in search corpus — `src/pages/SystemLibrary.tsx`
- `filterRow()` helper: renders label + chip row — `src/pages/SystemLibrary.tsx`
- `PlayMenu`: **deleted** (`src/pages/PlayMenu.tsx` removed; import + JSX block removed from App.tsx)
- `getParentNodeType` return type: `WorkspaceNodeType | 'systemLibrary'` — `src/App.tsx`
- goUp `'actorVault'` parent: → `setAppView('systemLibrary')` (was `setPlayStage('menu')`) — `src/App.tsx`
- `enterPlay(system)`: guard `if (!system) return;` at top; no dead else/menu branch — `src/App.tsx`
- `playStage` / `PlayStage`: still present; only `'workspace'` is reachable from UI — `src/App.tsx`

## CP RED Inventory / Equipment

- `CpInventory`: `src/lib/cp-types.ts`
- `CpCharacter.inventory`: `src/lib/cp-types.ts`
- `CpGearItem`: `src/lib/cp-types.ts`
- `instanceId` item fields: `src/lib/cp-types.ts`
- CP RED inventory migration: `src/lib/cpMigration.ts`
- `addWeaponToInventory`: `src/store/cpStore.ts`
- `carryWeapon`: `src/store/cpStore.ts`
- `removeWeapon`: `src/store/cpStore.ts`
- `addArmorToInventory`: `src/store/cpStore.ts`
- `equipArmor`: `src/store/cpStore.ts`
- `unequipArmor`: `src/store/cpStore.ts`
- `addCyberwareToInventory`: `src/store/cpStore.ts`
- `installCyberware`: `src/store/cpStore.ts`
- `removeCyberware`: `src/store/cpStore.ts`
- `discardCyberware`: `src/store/cpStore.ts`
- `addFashionToInventory`: `src/store/cpStore.ts`
- `wearFashion`: `src/store/cpStore.ts`
- `removeClothing`: `src/store/cpStore.ts`
- `addGearToInventory`: `src/store/cpStore.ts`
- `CpMarket`: `src/pages/CpMarket.tsx`
- `InventoryPanel`: `src/pages/CpSheet.tsx`
- `ensureCpItemInstanceId`: `src/store/cpStore.ts`
- CP RED stable item movement boundaries (`installCyberware`, `removeCyberware`, `equipArmor`, `unequipArmor`, `carryWeapon`, `removeWeapon`, `wearFashion`, `removeClothing`): `src/store/cpStore.ts`
- CP RED damage weapon instance selection: `src/pages/CpGameplay.tsx`, `src/pages/cpGameplay/CpDamagePanel.tsx`
- `AI-LANDMARK: CPRED_STABLE_ITEM_INSTANCE_ID_EQUIPMENT_FIX_V1`: `src/store/cpStore.ts`

## CP RED Critical Injury Manual Tracking

- Critical injury definitions adapter (`CP_CRITICAL_INJURY_DEFINITIONS`, `getCpCriticalInjuryDefinitions`): `src/lib/cp2024/critical-injuries.ts`
- Original 2d6 tables (`CP_CRIT_INJURIES_BODY` / `CP_CRIT_INJURIES_HEAD`): `src/lib/cp-types.ts`
- Manual tracking panel: `src/pages/cpGameplay/CpCriticalInjuryPanel.tsx`
- Manual add/remove handlers + log wiring: `src/pages/CpGameplay.tsx`
- Runtime container and store actions (`runtime.criticalInjuries`, `addCriticalInjury`, `removeCriticalInjury`): `src/store/cpStore.ts`
- `AI-LANDMARK: CPRED_CRITICAL_INJURY_MANUAL_TRACKING`: `src/lib/cp2024/critical-injuries.ts`, `src/pages/cpGameplay/CpCriticalInjuryPanel.tsx`, `src/pages/CpGameplay.tsx`

## Rule Data Source / Trust Metadata

- Shared rule data source/trust metadata types: `src/lib/rules/rule-data-metadata.ts`
- `RuleDataSource`: `src/lib/rules/rule-data-metadata.ts`
- `RuleDataTrustLevel`: `src/lib/rules/rule-data-metadata.ts`
- `RuleDataPublicScope`: `src/lib/rules/rule-data-metadata.ts`
- `RuleDataContentPolicy`: `src/lib/rules/rule-data-metadata.ts`
- `RuleDataMetadata`: `src/lib/rules/rule-data-metadata.ts`
- `AI-LANDMARK: RULE_DATA_SOURCE_TRUST_METADATA`: `src/lib/rules/rule-data-metadata.ts`

## Rule Source Authority Policy

- Rule source authority manifest: `docs/rule-sources/RULE_SOURCE_MANIFEST.md`
- DND owner-provided source manifest: `docs/rule-sources/DND_SOURCES.md`
- DND owner source entry manifest: `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`
- DND local CHM primary source path: `C:\TRPG_CHM_WORK\extracted`
- DND local CHM primary sourceId: `dnd-local-chm-primary`
- COC owner-provided source manifest: `docs/rule-sources/COC_SOURCES.md`
- CP RED owner-provided source manifest: `docs/rule-sources/CPRED_SOURCES.md`
- DND owner-provided root source: `https://github.com/DND5eChm`
- DND primary sourceId: `dnd5echm-srd52-primary`
- DND XGtE sourceId: `dnd5echm-xgte`
- DND TCoE sourceId: `dnd5echm-tcoe`
- `AI-LANDMARK: RULE_SOURCE_AUTHORITY_POLICY`: `docs/rule-sources/RULE_SOURCE_MANIFEST.md`
- `AI-LANDMARK: DND_LOCAL_CHM_PRIMARY_SOURCE_AUTHORITY`: `docs/rule-sources/RULE_SOURCE_MANIFEST.md`, `docs/rule-sources/DND_SOURCES.md`, `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`

## DND Local CHM Full Coverage Audit

- CHM full coverage baseline: `docs/rules/DND_RULE_COVERAGE.md`
- Local CHM primary source root: `C:\TRPG_CHM_WORK\extracted`
- Key audited directories: `玩家手册2024`, `塔莎的万事坩埚`, `珊娜萨的万事指南`, optional `城主指南2024`, optional `DNDBeyond`
- Corrected background baseline: 16 standard DND 2024 backgrounds under `玩家手册2024/角色起源/背景`
- Corrected species baseline: 10 PHB 2024 species under `玩家手册2024/角色起源/种族`
- Spell heading baseline: 507 total (`391` PHB 2024 + `21` TCoE + `95` XGtE)
- `AI-LANDMARK: DND_LOCAL_CHM_FULL_COVERAGE_AUDIT`: `docs/rules/DND_RULE_COVERAGE.md`

## DND Rule Metadata Application

- DND metadata source/trust types: `src/lib/rules/rule-data-metadata.ts`
- Legacy DND class metadata: `DND_CLASS_DATA_ACCURACY` in `src/data/classes.ts`
- Legacy DND race/species metadata: `DND_RACE_DATA_ACCURACY` in `src/data/races.ts`
- Legacy DND spell metadata: `DND_SPELL_DATA_ACCURACY` in `src/data/spells.ts`
- Legacy DND feat metadata: `DND_FEAT_DATA_ACCURACY` in `src/data/feats.ts`
- Legacy DND background metadata: `DND_BACKGROUND_DATA_ACCURACY` in `src/data/backgrounds.ts`
- DND equipment sample metadata: `DND_EQUIPMENT_DATA_ACCURACY` in `src/data/dnd2024/equipment.ts`
- DND class progression metadata: `DND_CLASS_PROGRESSION_ACCURACY` in `src/data/dnd2024/classProgression.ts`
- `AI-LANDMARK: DND_RULE_METADATA_APPLICATION`: `src/data/classes.ts`

## DND Spell Manifest Correction

- DND spell runtime data: `SPELL_DATA` in `src/data/spells.ts`
- DND spell manifest gap report: `DND_SPELL_MANIFEST_GAP_REPORT` in `src/data/spells.ts`
- DND spell translation anomaly report: `DND_SPELL_TRANSLATION_ANOMALY_REPORT` in `src/data/spells.ts`
- Optional spell provenance fields: `SpellInfo.id`, `SpellInfo.nameCn`, and `SpellInfo.ruleMeta` in `src/lib/dnd-types.ts`
- Owner source spell manifest entries: `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`
- `AI-LANDMARK: DND_SPELL_MANIFEST_CORRECTION`: `src/data/spells.ts`

## DND Class / Subclass Correction

- DND class/subclass source metadata enrichment: `src/data/classes.ts`
- DND missing class gap report: `DND_CLASS_SOURCE_GAP_REPORT` in `src/data/classes.ts`
- Optional class/subclass provenance fields: `ClassDef.ruleMeta` and `SubclassDef.ruleMeta` in `src/lib/dnd-types.ts`
- Owner source manifest for class/subclass source paths: `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`
- `AI-LANDMARK: DND_CLASS_SUBCLASS_CORRECTION`: `src/data/classes.ts`

## DND Feat / Background Link Correction

- DND feat data and origin feat placeholder: `src/data/feats.ts`
- Background origin feat link report: `DND_BACKGROUND_ORIGIN_FEAT_LINK_REPORT` in `src/data/feats.ts`
- Optional feat provenance fields: `FeatDef.id`, `FeatDef.nameCn`, and `FeatDef.ruleMeta` in `src/lib/dnd-types.ts`
- Current DND background `originFeat` strings: `src/data/backgrounds.ts`
- Owner source manifest feat category entries: `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`
- `AI-LANDMARK: DND_FEAT_BACKGROUND_LINK_CORRECTION`: `src/data/feats.ts`

## DND Species / Background Display Cleanup

- Sheet species/background display cleanup: `src/pages/Sheet.tsx`
- Current DND species data: `DND_2024_SPECIES_DATA` / `RACE_DATA` in `src/data/races.ts`
- Legacy DND race fallback: `LEGACY_RACE_DATA` in `src/data/races.ts`
- Current DND background data: `DND_2024_BACKGROUND_DATA` / `BACKGROUND_DATA` in `src/data/backgrounds.ts`
- Legacy DND background fallback: `LEGACY_BACKGROUND_DATA` in `src/data/backgrounds.ts`
- `AI-LANDMARK: DND_SPECIES_BACKGROUND_DISPLAY_CLEANUP`: `src/pages/Sheet.tsx`

## DND Sheet Layout Compact

- Compact player-facing DND sheet layout: `src/pages/Sheet.tsx`
- Core status compact row: HP / AC / Initiative / Speed / PB in `Sheet`
- Compact ability grid: `attrList.map` rendering in `Sheet`
- Dense skills and saving throws: `allSkills` and `savingThrows` rendering in `Sheet`
- Summary zones: attacks/equipment, spell summary, class resources, feats, and details in `Sheet`
- Sheet layout i18n keys: `dndSheet.compact.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- `AI-LANDMARK: DND_SHEET_LAYOUT_COMPACT_V1`: `src/pages/Sheet.tsx`

## DND Background Runtime Completion

- DND 2024 runtime background list: `DND_2024_BACKGROUND_DATA` / `BACKGROUND_DATA` in `src/data/backgrounds.ts`
- Local CHM background source root: `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色起源\背景`
- Background display name support: optional `BackgroundDef.nameCn` in `src/lib/dnd-types.ts`
- Local CHM source id support: `dnd-local-chm-primary` in `src/lib/rules/rule-data-metadata.ts`
- Legacy DND background fallback remains: `LEGACY_BACKGROUND_DATA` in `src/data/backgrounds.ts`
- `AI-LANDMARK: DND_BACKGROUND_RUNTIME_COMPLETION`: `src/data/backgrounds.ts`

## DND Character Builder Responsive Workbench

- Responsive DND Builder Workbench UI: `src/pages/Creator.tsx`
- Builder section ids: `BuilderSection` in `src/pages/Creator.tsx`
- Builder summary / todo helpers: `SummaryRows`, `TodoList`, `InfoRow` in `src/pages/Creator.tsx`
- DND-only reduced utility actions menu: `src/pages/PlayWorkspace.tsx`
- Builder i18n keys: `dndBuilder.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- `AI-LANDMARK: DND_CHARACTER_BUILDER_RESPONSIVE_WORKBENCH_PHASE_1`: `src/pages/Creator.tsx`

## DND Gameplay Entry Preservation

- DND Workspace Play / Combat navigation route: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- DND play view delegation: `src/pages/PlayWorkspace.tsx`
- Preserved DND Gameplay runtime: `src/pages/Gameplay.tsx`
- Preserved DND RollConsole panel: `src/pages/gameplay/RollConsolePanel.tsx`
- Workspace Play / Combat i18n keys: `dndWorkspace.nav.play`, `dndWorkspace.modules.play` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- `AI-LANDMARK: DND_GAMEPLAY_ENTRY_PRESERVATION`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`

## Multi-System Workspace Planned Slots

- COC / CP RED workspace dashboard and planned placeholder routing: `src/pages/PlayWorkspace.tsx`
- DND planned module cards: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- Shared workspace i18n keys: `multiWorkspace.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- DND planned slot keys: `dndWorkspace.modules.inventory`, `dndWorkspace.modules.map`, `dndWorkspace.modules.journal`
- COC module keys: `multiWorkspace.coc.modules.*`
- CP RED module keys: `multiWorkspace.cp.modules.*`
- Planned slot message: `multiWorkspace.planned.message`
- `AI-LANDMARK: MULTI_SYSTEM_WORKSPACE_PLANNED_SLOTS`: `src/pages/PlayWorkspace.tsx`, `src/pages/dndWorkspace/DndWorkspaceShell.tsx`

## DND Character Vault / Creation Method Entry

- DND Character Vault shell: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- DND creation method selection: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- Standard Creation route to existing Builder: `onOpenPlayTab('creator')` in `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- Sheet Start Playing CTA: `src/pages/Sheet.tsx`
- DND play view Sheet wiring: `src/pages/PlayWorkspace.tsx`
- Vault / creation / Start Playing i18n keys: `dndWorkspace.characters.*`, `dndWorkspace.creation.*`, `dndWorkspace.actions.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- `AI-LANDMARK: DND_CHARACTER_VAULT_CREATION_METHOD_ENTRY`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`, `src/pages/Sheet.tsx`

## System / Actor / Session Workspace IA Correction

- Three-tier IA definition: System Workspace (rule scope, compendium, sources, completion); Actor Workspace (character card, status, resources, inventory, journal); Session / Campaign Workspace (map, token, handout, session log, encounter, GM tools)
- DND IA concept card section: `src/pages/dndWorkspace/DndWorkspaceShell.tsx` (dashboard view, after modules section)
- COC / CP RED IA concept card section: `renderNonDndWorkspaceDashboard` in `src/pages/PlayWorkspace.tsx`
- DND planned IA notes: `dndWorkspace.planned.inventory` (Actor), `dndWorkspace.planned.map` (Session), `dndWorkspace.planned.journal` (Actor)
- COC planned IA notes: `multiWorkspace.coc.notes.handouts` (Session), `multiWorkspace.coc.notes.notes` (Actor), `multiWorkspace.coc.notes.locations` (Session)
- CP RED planned IA notes: `multiWorkspace.cp.notes.encounter` (Session), `multiWorkspace.cp.notes.map` (Session), `multiWorkspace.cp.notes.sessionLog` (Session)
- New COC System Workspace planned cards: `multiWorkspace.coc.modules.compendium`, `multiWorkspace.coc.modules.completion`
- New CP RED System Workspace planned cards: `multiWorkspace.cp.modules.compendium`, `multiWorkspace.cp.modules.completion`
- IA i18n keys: `dndWorkspace.ia.*` and `multiWorkspace.ia.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- `AI-LANDMARK: SYSTEM_ACTOR_SESSION_WORKSPACE_IA_CORRECTION`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`, `src/pages/PlayWorkspace.tsx`
- **Follow-up (IA Correction Follow-up v1)**: DND `inventory`/`map`/`journal`, COC `handouts`/`notes`/`locations`, CP RED `encounter`/`map`/`sessionLog` removed from `moduleCards`/`cocModuleCards`/`cpModuleCards` arrays. These 9 cards no longer appear as `<button>` entries in the module grid. They are described only in the workspace-tier `<section>` (informational `<div>`, not entry points).
- New i18n keys (follow-up): `dndWorkspace.ia.note`, `multiWorkspace.ia.note`
- Updated i18n keys (follow-up): `dndWorkspace.ia.actorWorkspaceNote`, `dndWorkspace.ia.sessionWorkspaceNote`, `multiWorkspace.ia.actorWorkspaceNote`, `multiWorkspace.ia.sessionWorkspaceNote`

## System Home Simplification

- `AI-LANDMARK: SYSTEM_HOME_SIMPLIFICATION`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`, `src/pages/PlayWorkspace.tsx`
- **DND**: `spellIndex`, `featIndex`, `equipmentIndex`, `classIndex` removed from `moduleCards`. Now only 5 cards: `characters`, `create`, `sheet`, `compendium`, `sources`. `completionRows` full grid replaced with a compact footnote linking to Sources view.
- **COC**: `completion` planned card removed from `cocModuleCards`. Cards: `vault`, `create`, `sheet`, `skillChecks`, `pushedRolls`, `growth`, `compendium`, `sources`.
- **CP RED**: `completion` planned card removed from `cpModuleCards`. Cards: `vault`, `create`, `sheet`, `skillChecks`, `combat`, `market`, `cyberware`, `netrunning`, `compendium`, `sources`.
- New i18n keys: `dndWorkspace.modules.compendiumNote`, `dndWorkspace.modules.sourcesNote`, `dndWorkspace.dashboard.completionFootnote`
- Updated labels: `dndWorkspace.modules.compendium` → 'Rules Compendium' (en) / '规则库' (zh); `dndWorkspace.modules.sources` → 'Source Status / System Health' (en) / '规则源状态 / System Health' (zh)
- Updated COC/CP notes: `multiWorkspace.coc.notes.compendium`, `multiWorkspace.coc.notes.sources`, `multiWorkspace.cp.notes.compendium`, `multiWorkspace.cp.notes.sources`
- No store, schema, runtime, or rule data changed

## Platform Actor Entry Pattern Alignment

- `AI-LANDMARK: PLATFORM_ACTOR_ENTRY_PATTERN_ALIGNMENT`: `src/pages/PlayWorkspace.tsx`, `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- **COC/CP dashboard**: `renderNonDndWorkspaceDashboard` now shows 3 action buttons: view sheet / continue editing / start runtime (was 2; edit was missing from dashboard). `editActionKey` added alongside `sheetActionKey` and `startActionKey`.
- **DND characters view**: `actorNote` paragraph added below `vaultBoundary` note
- **Platform guidance section**: `actorAbstractionNote` and `actorMultiCampaignNote` added to the collapsible `<details>` in `renderNonDndWorkspaceDashboard`
- **`multiWorkspace.planned.message`** updated to mention Player Asset Vault / Workshop / Source Manager (was generic "later version" language)
- New i18n keys: `navigation.actorAbstractionNote`, `navigation.actorMultiCampaignNote`, `dndWorkspace.characters.actorNote`
- Actor / Player Asset is the platform abstraction; Character / Investigator / Edgerunner are system display names
- No store, schema, runtime, or rule data changed

## Platform Character Entry Pattern

- COC / CP RED lightweight Vault shell rendering: `renderCharacterVault` in `src/pages/PlayWorkspace.tsx`
- COC / CP RED creation method picker: `renderCreationMethod` in `src/pages/PlayWorkspace.tsx`
- COC module routing to Investigator Vault / creation method: `cocModuleCards` in `src/pages/PlayWorkspace.tsx`
- CP RED module routing to Edgerunner Vault / creation method: `cpModuleCards` in `src/pages/PlayWorkspace.tsx`
- Existing system creators remain the Standard Creation targets: `CocCreator` and `CpCreator` through `openWorkspaceTab('creator')`
- Existing sheets and runtimes remain context-action targets: `CocSheet`, `CpSheet`, `CocGameplay`, `CpGameplay`
- Shared entry i18n keys: `multiWorkspace.entryPattern.*`, `multiWorkspace.creation.*`, `multiWorkspace.coc.entry.*`, `multiWorkspace.coc.creation.*`, `multiWorkspace.cp.entry.*`, `multiWorkspace.cp.creation.*`
- `AI-LANDMARK: PLATFORM_CHARACTER_ENTRY_PATTERN_ALIGNMENT`: `src/pages/PlayWorkspace.tsx`

## System Navigation / Home Density Polish

- DND Game System Home overview and recommended-next actions: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- COC / CP RED Game System Home overview and recommended-next actions: `renderNonDndWorkspaceDashboard` in `src/pages/PlayWorkspace.tsx`
- Breadcrumb / system-home navigation copy: `navigation.*` keys in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- DND home copy: `dndWorkspace.home.*`
- COC / CP RED home copy: `multiWorkspace.coc.home.*`, `multiWorkspace.cp.home.*`
- `AI-LANDMARK: SYSTEM_NAVIGATION_HOME_DENSITY_POLISH`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`, `src/pages/PlayWorkspace.tsx`

## System Home Navigation Deduplication

- DND current-character home context and CTAs: dashboard branch in `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- COC / CP RED current-asset home context and CTAs: `renderNonDndWorkspaceDashboard` in `src/pages/PlayWorkspace.tsx`
- Homepage collapsed guidance: `navigation.platformGuidance`, `navigation.selectedActorGuidance`, `navigation.campaignGuidance`
- Rules/source/data placement hint: `navigation.rulesAndDataInTopNav`
- `AI-LANDMARK: SYSTEM_HOME_NAVIGATION_DEDUPLICATION`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`, `src/pages/PlayWorkspace.tsx`

## Platform Core Concepts / Game System Registry Baseline

- Full concept definitions: `docs/architecture/PLATFORM_CORE_CONCEPTS.md`
- `AI-LANDMARK: PLATFORM_CORE_CONCEPTS_GAME_SYSTEM_REGISTRY_BASELINE`: `docs/architecture/PLATFORM_CORE_CONCEPTS.md`
- Platform vocabulary: Game System, Actor / Player Asset, Asset Collection, Sheet Template, Builder Template, Dice Profile, Rules Compendium, Source Package, Content Package, Workshop Item, Board/Scene/Token, Session/Campaign, Plugin/Mod, UI Theme / Layout Pack
- Game System Registry V1 field spec: Section 3 of `PLATFORM_CORE_CONCEPTS.md`
- Built-in Game System entries: `dnd5e2024`, `coc7e`, `cpred` — Section 4 of `PLATFORM_CORE_CONCEPTS.md`
- Terminology alignment table (Character→Actor, Vault→Actor Vault, etc.): Section 6 of `PLATFORM_CORE_CONCEPTS.md`
- Atmospheric Minimalism / 氛围化简约 artistic direction: Section 7 of `PLATFORM_CORE_CONCEPTS.md`
- Workshop / Plugin safety model and content layer classification: Section 8 of `PLATFORM_CORE_CONCEPTS.md`
- Three-tier workspace IA model summary: Section 9 of `PLATFORM_CORE_CONCEPTS.md`
- Dice Profile vocabulary: `d20-standard` (DND), `d100-bonus-penalty` (COC), `exploding-d10` (CP RED) — Section 2.6
- Board Capability Levels L0–L4: Section 2.11 of `PLATFORM_CORE_CONCEPTS.md`
- Future Game System categories (Japanese TRPG, Wargame, Custom, Narrative): Section 5 of `PLATFORM_CORE_CONCEPTS.md`
- No store, schema, runtime, or rule data changed by this baseline

## Navigation Back / Up / Breadcrumb Model

- Full navigation model: `docs/architecture/NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md`
- `AI-LANDMARK: NAVIGATION_BACK_UP_BREADCRUMB_MODEL_V1`: `docs/architecture/NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md`
- Three navigation semantics (Back = history stack / Up = parent resolver / Breadcrumb = ancestor chain): Section 2
- `LocationNode` model + `NavigationNodeType` list: Section 3
- Deterministic parent resolver (`getParentNode`) with per-node examples: Section 4
- Breadcrumb derivation (`getBreadcrumb` walks parentId chain): Section 5
- Back stack push/skip/fallback rules: Section 6
- Per-Section default parents (overview…sessionCampaign) + future-system compatibility: Section 7
- V1 minimal implementation + V1 not-do: Section 8
- Navigation UI spec (distinct Back/Up labels, mobile breadcrumb collapse): Section 9
- DND / COC / CP RED / wargame example scenarios: Section 10
- High-risk boundaries: Section 11
- Navigation pre-implementation acceptance template: Section 12
- Existing Back implementation it builds on: `AI-LANDMARK: PLATFORM_NAVIGATION_HISTORY_STACK` in `src/App.tsx`
- Companion docs: `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` (Navigation Pattern §2.9, §10), `docs/architecture/PLATFORM_CORE_CONCEPTS.md`
- No store, schema, runtime, or rule data changed by this baseline

## Platform Patterns & Workspace Section Contract

- Full pattern + section contract definitions: `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`
- `AI-LANDMARK: PLATFORM_PATTERNS_WORKSPACE_CONTRACT_V1`: `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`
- `AI-LANDMARK: SYSTEM_APP_SHELL_THEME_LAYERING_PRINCIPLE_V1`: `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`
- `AI-LANDMARK: CAMPAIGN_SOURCE_WORKSHOP_SCAFFOLD_PATTERN_V1`: `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`, `docs/architecture/UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md`
- Nine platform patterns: Game System Workspace, Actor / Player Asset Entry, Builder, Sheet, Runtime / Gameplay, Rules Compendium, Source Status / System Health, Session / Campaign, Navigation — Section 2
- System App Shell / System Theme layering principle: near Game System Workspace Pattern in Section 2
- Campaign Vault / Source Settings / Workshop Scaffold principles: near Game System Workspace Pattern in Section 2
- Workspace Section Contract (9 sections: overview / actorVault / creationMethod / builder / sheet / runtime / rulesCompendium / sourceStatus / sessionCampaign): Section 3
- implemented / planned / absent three-state semantics: Section 4
- Top navigation rules: Section 5
- Builder Pattern three-column detail + DND/COC/CP RED builder steps: Section 6
- Sheet Pattern regions: Section 7
- Runtime embedded-mode rules: Section 8
- Rules Compendium vs Source Status boundary: Section 9
- Navigation Back / Up / Breadcrumb concept (implementation deferred to Navigation Back/Up/Breadcrumb Model v1): Section 10
- Future extension coverage: Section 11
- High-risk boundaries: Section 12
- Codex / CC pre-implementation acceptance template: Section 13
- Companion vocabulary/registry doc: `docs/architecture/PLATFORM_CORE_CONCEPTS.md`
- Reference implementations of the patterns: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`, `src/pages/cocWorkspace/CocWorkspaceShell.tsx`, `src/pages/cpWorkspace/CpWorkspaceShell.tsx`, `src/pages/PlayWorkspace.tsx`
- No store, schema, runtime, or rule data changed by this baseline

## Platform Shell / Home / Play Workspace

- Platform shell default entry: `src/App.tsx`
- Platform Home dashboard: `src/pages/Home.tsx`
- Play main menu (ruleset selection): `src/pages/PlayMenu.tsx`
- Preserved previous main interface: `src/pages/PlayWorkspace.tsx`
- `appView: "home" | "play" | "placeholder"` state: `src/App.tsx`
- `playStage: "menu" | "workspace"` state and back-to-menu button: `src/App.tsx`
- Collapsible sidebar state and `trpg-platform-sidebar-collapsed` localStorage key: `src/App.tsx`
- `AI-LANDMARK: PLATFORM_PLAY_MENU_COLLAPSIBLE_SIDEBAR`: `src/App.tsx`, `src/pages/PlayMenu.tsx`
- Lightweight i18n foundation: `src/i18n/index.ts`
- Default locale and `trpg-platform-locale` localStorage key: `src/i18n/index.ts`
- Chinese Platform Shell / Home / Placeholder messages: `src/i18n/locales/zh-CN.ts`
- English Platform Shell / Home / Placeholder messages: `src/i18n/locales/en.ts`
- Translation helpers: `createTranslator`, `t`, and `tList` in `src/i18n/index.ts`
- Shell locale state: `src/App.tsx`
- Settings / Language panel and locale setter UI: `src/App.tsx` (language switching lives only under Settings / Language)
- Coming Soon placeholder page (short badge + one-line note): `src/App.tsx`
- Home, Shell, and Placeholder translation key usage: `src/App.tsx`, `src/pages/Home.tsx`
- Shell placeholder definitions: `src/App.tsx`
- Existing system selector and creator / sheet / gameplay / market tabs: `src/pages/PlayWorkspace.tsx`
- Current ruleset state: `useAppStore` in `src/store/appStore.ts`
- Home character snapshot reads: `useCharacterStore`, `useCocStore`, and `useCpStore`

## COC Workspace Contract Alignment v1

- `AI-LANDMARK: COC_WORKSPACE_CONTRACT_ALIGNMENT_V1`: `src/pages/cocWorkspace/CocWorkspaceShell.tsx`
- `navItems` (4-item top nav): `src/pages/cocWorkspace/CocWorkspaceShell.tsx` — dashboard / vault / compendium / sources only; createMethod / sheet / play (runtime) removed from top nav
- `isActiveNav` (simplified): `view === item.key` — actor-context views never produce active highlight
- `handleNavClick` (simplified): `(nextView) => onViewChange(nextView)` — no more isPlayAction branch
- `actorFlowNote` note: displayed at bottom of `createMethod` view section in `CocWorkspaceShell.tsx`
- `cocWorkspace.creation.actorFlowNote` i18n key: `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en.ts`
- `createMethod` / `sheet` / `play` views: still present and reachable via Actor/Creation context CTAs (renderInvestigatorCard buttons + overview empty-state CTA)

## CP RED Workspace Contract Alignment v1

- `AI-LANDMARK: CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1`: `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- `navItems` (4-item top nav): `src/pages/cpWorkspace/CpWorkspaceShell.tsx` — dashboard / vault / compendium / sources only; createMethod / sheet / gameplay(mission) removed from top nav; navItems type simplified (no more `kind`/`view?`/`tab?`)
- `isActiveNav` (simplified): `view === item.key` — actor-context views never produce active highlight
- `handleNavClick` (simplified): `(nextView) => onViewChange(nextView)` — no more playTab branch
- `actorFlowNote` note: displayed at bottom of `createMethod` view section in `CpWorkspaceShell.tsx`
- `cpWorkspace.creation.actorFlowNote` i18n key: `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en.ts`
- `createMethod` / `play` views: still present and reachable via Actor/Creation context CTAs (renderEdgerunnerCard buttons + overview empty-state CTA)

## DND Workspace Contract Alignment v1

- `AI-LANDMARK: DND_WORKSPACE_CONTRACT_ALIGNMENT_V1`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `navItems` (4-item top nav): `src/pages/dndWorkspace/DndWorkspaceShell.tsx` — dashboard / characters / compendium / sources only; 'create' removed from top nav
- `actorFlowNote` note: displayed at bottom of `create` view section in `DndWorkspaceShell.tsx`
- `dndWorkspace.creation.actorFlowNote` i18n key: `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en.ts`
- `create` view (`DndWorkspaceView='create'`): still present and reachable via CTA from overview (empty state) and actorVault (header button)

## Navigation Up + Breadcrumb Minimal Implementation

- `AI-LANDMARK: NAVIGATION_UP_BREADCRUMB_MINIMAL_IMPLEMENTATION_V1`: `src/App.tsx`
- Workspace node type alias: `WorkspaceNodeType` (inline type in `App.tsx`) — values: `systemOverview | actorVault | creationMethod | actorSheet | rulesCompendium | sourceStatus | runtime | builder`
- Current location derivation: `deriveNodeType(sys, dndView, sysView, tab)` in `src/App.tsx` — maps `system + dndWorkspaceView/systemWorkspaceView + tab` → `WorkspaceNodeType`
- Deterministic parent resolver: `getParentNodeType(nodeType)` in `src/App.tsx` — returns `WorkspaceNodeType | 'playMenu'`; never reads history stack
- Breadcrumb view label key lookup: `getBreadcrumbViewLabelKey(nodeType)` in `src/App.tsx` — returns `navigation.breadcrumb.*` i18n key
- Up navigation action: `goUp()` in `src/App.tsx` — calls `pushNavigation()` then translates parent node type to `PlayWorkspaceNavigationState` or `setPlayStage('menu')`
- Up button: `ChevronUp` icon in workspace toolbar, `src/App.tsx` (added to lucide-react import)
- Breadcrumb text: `Platform / Play / {systemLabel} / {viewLabel}` displayed in workspace toolbar, `src/App.tsx`
- Parent chain: `runtime→actorSheet`, `builder→creationMethod`, `actorSheet→actorVault`, `actorVault/creationMethod/rulesCompendium/sourceStatus→systemOverview`, `systemOverview→playMenu`
- DND Up translation: `actorSheet→dndView='play'+tab='sheet'`, `actorVault→dndView='characters'`, `creationMethod→dndView='create'`, `systemOverview→dndView='dashboard'`, `playMenu→setPlayStage('menu')`
- COC Up translation: `actorSheet→sysView='sheet'`, `actorVault→sysView='vault'`, `creationMethod→sysView='createMethod'`, `systemOverview→sysView='dashboard'`
- CP RED Up translation: `actorSheet→sysView='play'+tab='sheet'`, same vault/createMethod/dashboard as COC
- Breadcrumb view i18n keys: `navigation.breadcrumb.{systemOverview,actorVault,creationMethod,actorSheet,rulesCompendium,sourceStatus,runtime,builder}` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- Up label i18n key: `navigation.upOneLevel` in both locales

## Platform Navigation History Stack

- App-level navigation state: `NavigationState` in `src/App.tsx`
- Navigation stack state and helpers: `navigationStack`, `pushNavigation`, `goBack`, `restoreNavigation`, `fallbackNavigation` in `src/App.tsx`
- Workspace navigation snapshot: `PlayWorkspaceNavigationState` and `defaultPlayWorkspaceNavigationState` in `src/pages/PlayWorkspace.tsx`
- PlayWorkspace navigation callbacks: `onNavigationChange`, `onBeforeNavigate`, `onBack`, `canGoBack` in `src/pages/PlayWorkspace.tsx`
- Workspace back behavior: outer workspace back button in `src/App.tsx`; non-DND workspace back buttons through `navigateBackOrDashboard` in `src/pages/PlayWorkspace.tsx`
- Current-location breadcrumb copy: `navigation.currentLocation`, `navigation.breadcrumb.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- `AI-LANDMARK: PLATFORM_NAVIGATION_HISTORY_STACK`: `src/App.tsx`

## System Default Entry / Generic Nav Labels

- `AI-LANDMARK: SYSTEM_DEFAULT_ENTRY_ACTOR_VAULT_GENERIC_NAV_LABELS_V1`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`, `src/pages/cocWorkspace/CocWorkspaceShell.tsx`, `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- Default system workspace entry: `defaultPlayWorkspaceNavigationState` in `src/pages/PlayWorkspace.tsx` — DND `characters`, COC/CP RED `vault`.
- Actor Vault parent/root resolver: `getParentNodeType()` and `goUp()` in `src/App.tsx` — `actorVault → playMenu`; `rulesCompendium/sourceStatus/systemOverview/creationMethod → actorVault`.
- Generic top-nav labels: `navigation.actorVault`, `navigation.rulesCompendium`, `navigation.sourceStatus` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`.
- Low-frequency overview label: `navigation.systemInfo` / `navigation.breadcrumb.systemOverview`.

## UI Action Hierarchy & Page Responsibility Contract

- `AI-LANDMARK: UI_ACTION_HIERARCHY_PAGE_RESPONSIBILITY_CONTRACT_V1`: `docs/architecture/UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md`
- Action tiers (A–H): Platform → System → Collection → Object → Creation-flow → Runtime-context → System-info → Planned
- Page responsibility contracts: `actorVault | actorSheet | creationMethod | builder | runtime | rulesCompendium | sourceStatus | systemOverview`
- Container placement rules: page header / object card / empty state / sidebar / footer (§4 in doc)
- Button priority rules: primary CTA table per page, secondary, tertiary (§5 in doc)
- Anti-patterns (9): see §6 in doc — key ones: Create Character inside actor card; Start Playing without session context; planned cards as primary visual; System Info as peer-level button
- Required UI task declaration: every task must declare page responsibility + action hierarchy + primary CTA + hidden actions before implementation (§7 in doc)
- Review checklist: 12-item audit checklist (§8 in doc)
- Relation to other docs: PLATFORM_PATTERNS_WORKSPACE_CONTRACT_V1 → Section definition; NAVIGATION_BACK_UP_BREADCRUMB_MODEL_V1 → nav semantics; this doc → action placement within Sections (§10 in doc)

## Actor Vault Responsibility Cleanup / Runtime CTA Gate

- `AI-LANDMARK: ACTOR_VAULT_RESPONSIBILITY_CLEANUP_HIDE_RUNTIME_CTA_V1`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx` (characters + dashboard views), `src/pages/cocWorkspace/CocWorkspaceShell.tsx` (renderInvestigatorCard + vault + sheet), `src/pages/cpWorkspace/CpWorkspaceShell.tsx` (renderEdgerunnerCard + vault + CpEdgerunnerSheetShell), `src/pages/PlayWorkspace.tsx`
- DND Sheet runtime gate: `<Sheet />` called without `onStartPlaying` in `src/pages/PlayWorkspace.tsx`; button already prop-gated in `src/pages/Sheet.tsx`.
- CP RED Sheet runtime gate: `startMission` button removed from `CpEdgerunnerSheetShell`; `continueEditing` retained (幕间维护).
- Runtime gate i18n: `navigation.runtimeGateNote` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`.
- System Info demotion: all 3 vault views now have System Info as a small text underline link (`text-[10px] ... underline`), not a peer-level button.

## Actor Vault Action Hierarchy Cleanup

- `AI-LANDMARK: ACTOR_VAULT_ACTION_HIERARCHY_CLEANUP_V1` (5 locations): `src/pages/dndWorkspace/DndWorkspaceShell.tsx` (characters comment block), `src/pages/cocWorkspace/CocWorkspaceShell.tsx` (renderInvestigatorCard CTA comment + vault section comment), `src/pages/cpWorkspace/CpWorkspaceShell.tsx` (renderEdgerunnerCard CTA comment + vault section comment)
- Note: Edit secondary buttons added in this task were subsequently removed by `ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1` (see below)

## Actor Vault Single-Actor Action Cleanup

- `AI-LANDMARK: ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1` (6 locations): `src/pages/dndWorkspace/DndWorkspaceShell.tsx` (characters comment + CTA inline comment), `src/pages/cocWorkspace/CocWorkspaceShell.tsx` (renderInvestigatorCard CTA comment + vault section comment), `src/pages/cpWorkspace/CpWorkspaceShell.tsx` (renderEdgerunnerCard CTA comment + vault section comment)
- DND vault (actor exists): header `createCharacter` hidden (`!hasCurrentCharacter` guard); actor card = `viewSheet` only; footer shows `replaceCurrentCharacter` small link + `singleActor.characterNote`
- COC vault (actor exists): header `createInvestigator` hidden; `renderInvestigatorCard()` = `viewInvestigatorSheet` only; footer shows `replaceCurrentInvestigator` + `singleActor.investigatorNote`
- CP RED vault (actor exists): header `createEdgerunner` hidden; `renderEdgerunnerCard()` = `viewCharacterSheet` only; footer shows `replaceCurrentEdgerunner` + `singleActor.edgerunnerNote`
- Empty state (no actor): unchanged — prominent Create CTA shown normally
- New i18n keys (both locales): `multiWorkspace.actions.replaceCurrentCharacter/Investigator/Edgerunner` + `multiWorkspace.singleActor.{characterNote,investigatorNote,edgerunnerNote}`
- Product rationale: current version is single-actor mode; showing Create when actor exists implies multi-actor support which is not implemented

## Local Data Contract / Character Export

- Character export envelope type: `TrpgCharacterExportEnvelope` in `src/lib/data-contract/export-envelope.ts`
- Envelope kind constant: `TRPG_CHARACTER_EXPORT_KIND` in `src/lib/data-contract/export-envelope.ts`
- Export serializer: `createCharacterExportEnvelope` in `src/lib/data-contract/export-envelope.ts`
- Import parser and compatibility path: `parseCharacterImportJson` in `src/lib/data-contract/export-envelope.ts`
- Platform/export system mapping: `platformSystemToExportSystem` and `exportSystemToPlatformSystem` in `src/lib/data-contract/export-envelope.ts`
- PlayWorkspace import/export call sites: `src/pages/PlayWorkspace.tsx`
- Store load actions still own migration after import: `loadCharacter` in `src/store/characterStore.ts`, `src/store/cocStore.ts`, and `src/store/cpStore.ts`
- `AI-LANDMARK: LOCAL_DATA_CONTRACT_CHARACTER_ENVELOPE`: `src/lib/data-contract/export-envelope.ts`

## DND Species / Background Correction

- 2024 species default list (`DND_2024_SPECIES_DATA`, `RACE_DATA`): `src/data/races.ts`
- Quarantined legacy races (`LEGACY_RACE_DATA`, `DND_RACE_DATA_ACCURACY`): `src/data/races.ts`
- 2024 background default list (`DND_2024_BACKGROUND_DATA`, `BACKGROUND_DATA`): `src/data/backgrounds.ts`
- Quarantined legacy backgrounds (`LEGACY_BACKGROUND_DATA`, `DND_BACKGROUND_DATA_ACCURACY`): `src/data/backgrounds.ts`
- Optional `id` / `ruleMeta` fields on `RaceDef` / `BackgroundDef`: `src/lib/dnd-types.ts`
- Creator placeholder-skip guards for species size/speed/languages: `src/pages/Creator.tsx`
- `AI-LANDMARK: DND_BACKGROUND_SPECIES_CORRECTION`: `src/data/races.ts`, `src/data/backgrounds.ts`, `src/pages/Creator.tsx`

## DND Product Shell

- DND workspace shell + dashboard + source overview + compendium placeholder: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `DndWorkspaceView` state and D&D-only delegation: `src/pages/PlayWorkspace.tsx`
- Completion cards data source: `DND_CHARACTER_OPTIONS_COMPLETION_REPORT`, `DND_SPELL_INDEX_COUNTS`, index exports
- `dndWorkspace.*` i18n keys: `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en.ts`
- `AI-LANDMARK: DND_PRODUCT_SHELL_PHASE_1`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`, `src/pages/PlayWorkspace.tsx`

## COC / CP RED DND-aligned Workspace Reconstruction

- `AI-LANDMARK: COC_CPRED_DND_ALIGNED_WORKSPACE_RECONSTRUCTION`: `src/pages/cocWorkspace/CocWorkspaceShell.tsx`, `src/pages/cpWorkspace/CpWorkspaceShell.tsx`, `src/pages/PlayWorkspace.tsx`
- `CocWorkspaceShell`: `src/pages/cocWorkspace/CocWorkspaceShell.tsx` — DND-aligned shell for COC 7e; views: dashboard / vault / createMethod / compendium / sources / play / planned
- `CpWorkspaceShell`: `src/pages/cpWorkspace/CpWorkspaceShell.tsx` — DND-aligned shell for CP RED; same view set with gold theme
- `NonDndWorkspaceView` (extended): `src/pages/PlayWorkspace.tsx` — added `'compendium' | 'sources'`
- `cocWorkspace.*` i18n keys: `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en.ts`
- `cpWorkspace.*` i18n keys: `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en.ts`

## COC Workspace Cleanup v1

- `AI-LANDMARK: COC_WORKSPACE_CLEANUP_V1`: `src/pages/cocWorkspace/CocWorkspaceShell.tsx` (view='sheet' section)
- `CocWorkspaceView` (extended): now includes `'sheet'` — dedicated Investigator Sheet summary shell
- `NonDndWorkspaceView` (extended): `src/pages/PlayWorkspace.tsx` — added `'sheet'`
- Nav: 7 items — dashboard / vault / createMethod / **sheet** / **play** (isPlayAction→gameplay) / compendium / sources
- `cocWorkspace.nav.sheet`, `cocWorkspace.nav.runtime`, `cocWorkspace.sheet.*` i18n keys: `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en.ts`
- Sheet view reads: `cocChar.runtime?.hp ?? cocChar.hp`, `characteristics`, `skills` from `useCocStore`
- "调查面板" nav item has `isPlayAction: true` — calls `onOpenPlayTab('gameplay')` instead of `onViewChange`

## COC Builder BG3-like Shell

- `AI-LANDMARK: COC_BUILDER_BG3_LIKE_SHELL_V1`: `src/pages/cocWorkspace/CocWorkspaceShell.tsx`
- `CocInvestigatorBuilderShell`: `src/pages/cocWorkspace/CocWorkspaceShell.tsx` — read-only/preview Builder shell with left step navigation, center section content, and right investigator summary.
- COC Standard Creation route: `src/pages/PlayWorkspace.tsx` renders `CocInvestigatorBuilderShell` when `system === 'CoC' && tab === 'creator'`.
- `currentPlayTab`: `src/pages/cocWorkspace/CocWorkspaceShell.tsx` prop used to highlight embedded creator/sheet/runtime states without restoring old tabs.
- Builder i18n keys: `cocBuilder.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`.
- No COC store schema, Investigator save format, rule data, runtime logic, dice algorithm, import/export behavior, or true multi-investigator store is changed by the shell.

## Legacy Runtime Embedded Mode

- `AI-LANDMARK: LEGACY_RUNTIME_EMBEDDED_MODE`: `src/pages/CocGameplay.tsx`, `src/pages/CpGameplay.tsx`, `src/pages/PlayWorkspace.tsx`, `src/pages/cocWorkspace/CocWorkspaceShell.tsx`, `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- `CocGameplay({ embedded })`: `src/pages/CocGameplay.tsx` — optional embedded mode hides the legacy gameplay title strip while preserving runtime panels and RollConsole.
- `CpGameplay({ embedded })`: `src/pages/CpGameplay.tsx` — optional embedded mode hides the legacy combat runtime hero strip while preserving RollConsole and runtime panels.
- `embeddedPlayBody`: `src/pages/PlayWorkspace.tsx` — COC / CP RED play view renderer that omits old toolbars, system selector, import/export buttons, settings/help buttons, and internal tabs.
- COC / CP RED workspace shells own system navigation chrome: `src/pages/cocWorkspace/CocWorkspaceShell.tsx`, `src/pages/cpWorkspace/CpWorkspaceShell.tsx`

## CP RED Workspace Cleanup

- `AI-LANDMARK: CPRED_WORKSPACE_CLEANUP_V1`: `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- `CpWorkspaceShell`: `src/pages/cpWorkspace/CpWorkspaceShell.tsx` — CP RED-only platform shell with overview, Edgerunner Vault, creation method, Edgerunner Sheet, Mission Panel, CP RED Compendium, and Source Status top navigation.
- `CpEdgerunnerSheetShell`: `src/pages/cpWorkspace/CpWorkspaceShell.tsx` — platform sheet summary shell for current Edgerunner; shows HP, Humanity, Armor, MOVE, REF, skill summary, equipment / black market / cyberware summary, Start Mission, and Continue Editing.
- `currentPlayTab`: `src/pages/cpWorkspace/CpWorkspaceShell.tsx` prop used to highlight CP RED Sheet / Mission Panel while `PlayWorkspace` owns the selected tab state.
- CP RED sheet branch in `embeddedPlayBody`: `src/pages/PlayWorkspace.tsx` renders `CpEdgerunnerSheetShell` instead of the old detailed `CpSheet` page.
- CP RED mission branch in `embeddedPlayBody`: `src/pages/PlayWorkspace.tsx` renders `<CpGameplay embedded />`.
- CP RED cleanup i18n keys: `cpWorkspace.nav.sheet`, `cpWorkspace.nav.mission`, `cpWorkspace.vault.*`, `cpWorkspace.sheet.*`, `cpWorkspace.sources.runtimeReady`, `cpWorkspace.sources.indexedOnly`, `cpWorkspace.sources.plannedOnly`

## CP RED Builder BG3-like Shell

- `AI-LANDMARK: CPRED_BUILDER_BG3_LIKE_SHELL_V1`: `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- `CpEdgerunnerBuilderShell`: `src/pages/cpWorkspace/CpWorkspaceShell.tsx` — read-only/preview Builder shell with left step navigation, center section content, and right Edgerunner summary.
- CP RED Standard Creation route: `src/pages/PlayWorkspace.tsx` renders `CpEdgerunnerBuilderShell` when `system === 'CP' && tab === 'creator'`.
- Builder steps: identity / lifepath / role / stats / skills / equipment / cyberware / review.
- Builder i18n keys: `cpBuilder.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`.
- No CP RED store schema, save format, rule data, runtime logic, dice algorithm, import/export behavior, true multi-Edgerunner store, Workshop, map, inventory, or session implementation is changed by the shell.

## DND Character Options Source Index

- Spell source index (507 entries: `DND_2024_SPELL_INDEX_DATA`, `DND_SPELL_INDEX_COUNTS`): `src/data/dnd2024/spellIndex.ts`
- Class / background / feat / equipment indexes (`DND_2024_CLASS_INDEX_DATA`, `DND_2024_ARTIFICER_SUPPORT_INDEX_DATA`, `DND_2024_BACKGROUND_INDEX_DATA`, `DND_2024_FEAT_INDEX_DATA`, `DND_2024_EQUIPMENT_INDEX_DATA`): `src/data/dnd2024/characterOptionsIndex.ts`
- Completion gap report (`DND_CHARACTER_OPTIONS_COMPLETION_REPORT`): `src/data/dnd2024/characterOptionsIndex.ts`
- `AI-LANDMARK: DND_CHARACTER_OPTIONS_SOURCE_COMPLETION`: `src/data/dnd2024/spellIndex.ts`, `src/data/dnd2024/characterOptionsIndex.ts`
- `AI-LANDMARK: DND_ARTIFICER_SOURCE_COMPLETION`: `src/data/dnd2024/characterOptionsIndex.ts`
- Indexes are display-only and not imported by Creator / Sheet / Gameplay.

## DND Runtime / Resources

- DND main gameplay: `src/pages/Gameplay.tsx`
- DND equipment types (read-only data layer v1): `src/lib/dnd2024/equipment-types.ts`
- DND basic equipment data (`DND_BASIC_WEAPONS` / `DND_BASIC_ARMOR` / `DND_BASIC_GEAR` / `DND_EQUIPMENT_CATALOG`): `src/data/dnd2024/equipment.ts`
- `AI-LANDMARK: DND_EQUIPMENT_DATA_LAYER`: `src/lib/dnd2024/equipment-types.ts`, `src/data/dnd2024/equipment.ts`
- DND Sheet read-only equipment catalog panel: `src/pages/sheet/DndEquipmentCatalogPanel.tsx`
- DND gameplay panels: `src/pages/gameplay/*`
- DND store: `src/store/characterStore.ts`
- `restShort`: `src/store/characterStore.ts`
- `restLong`: `src/store/characterStore.ts`
- centralized class resource consumption: `consumeClassResource` in `src/store/characterStore.ts`
- class resource utilities: `src/lib/dnd2024/resource-utils.ts`
- spell preparation model: `src/lib/dnd2024/spell-preparation-model.ts`
- progression utilities: `src/lib/dnd2024/progression-utils.ts`
- class progression data: `src/data/dnd2024/classProgression.ts`
- unified spellcasting resource consumption: `consumeSpellcastingResource` in `src/store/characterStore.ts`
- legacy spell slot wrapper: `consumeSpellSlot` in `src/store/characterStore.ts`
- `AI-LANDMARK: DND_SPELLCASTING_RESOURCE_CONSUMPTION`: `src/store/characterStore.ts`
- `AI-LANDMARK: DND_RESOURCE_CONSUMPTION_UNIFICATION`: `src/store/characterStore.ts`

## COC Runtime / SAN / Luck

- COC main gameplay: `src/pages/CocGameplay.tsx`
- COC bonus / penalty dice evaluator: `rollCocD100WithDice`, `evaluateCocD100CheckWithDice` in `src/lib/coc-utils.ts`
- `AI-LANDMARK: COC_BONUS_PENALTY_DICE_RESOLUTION`: `src/lib/coc-utils.ts`
- COC dice modifier selector (惩罚 2 / 惩罚 1 / 普通 / 奖励 1 / 奖励 2): `src/pages/cocGameplay/CocChecksPanel.tsx`
- COC gameplay panels: `src/pages/cocGameplay/*`
- COC store: `src/store/cocStore.ts`
- SAN panel: `src/pages/cocGameplay/CocSanCheckPanel.tsx`
- SAN local utils: `src/pages/cocGameplay/cocSanUtils.ts`
- Luck Spending location: `src/pages/cocGameplay/CocChecksPanel.tsx` or locate via targeted search if refactored.
- Runtime state panel: `src/pages/cocGameplay/CocRuntimeStatePanel.tsx`
- COC RollConsole panel: `src/pages/cocGameplay/CocRollConsolePanel.tsx`
- COC Pushed Roll handler: `src/pages/CocGameplay.tsx`
- `AI-LANDMARK: COC_PUSHED_ROLL_RUNTIME_LOG`: `src/pages/CocGameplay.tsx`
- COC Growth Check handler: `src/pages/CocGameplay.tsx`
- `AI-LANDMARK: COC_GROWTH_CHECK_RESOLUTION`: `src/pages/CocGameplay.tsx`

## Shared Logs

- `RuntimeLogEntry`: `src/lib/runtime-log-types.ts`
- DND RollConsole panel: `src/pages/gameplay/RollConsolePanel.tsx`
- COC RollConsole panel: `src/pages/cocGameplay/CocRollConsolePanel.tsx`
- CP RED RollConsole panel: `src/pages/cpGameplay/CpRollConsolePanel.tsx`
- `AI-LANDMARK: CPRED_RUNTIME_LOG_ENVELOPE`: `src/pages/cpGameplay/CpGameplayShared.tsx`
- Each system runtime operation should write to local `RuntimeLogEntry[]` / RollConsole rather than Sheet-local toast-only result displays.

## Actor Vault Existing/Add Split

- `AI-LANDMARK: ACTOR_VAULT_EXISTING_ADD_SPLIT_V1` (3 locations): `src/pages/dndWorkspace/DndWorkspaceShell.tsx` (characters view comment), `src/pages/cocWorkspace/CocWorkspaceShell.tsx` (vault view comment), `src/pages/cpWorkspace/CpWorkspaceShell.tsx` (vault view comment)
- **Two-section vault layout**: `<div className="flex flex-col gap-6">` wrapping two `<section className={panelClass}>` — Existing Actors section + Add Actor section
- **Existing Actors section**: inline actor card (new render, not `renderInvestigatorCard()` / `renderEdgerunnerCard()`) + View Sheet CTA; empty state when no actor
- **DND actor card fields**: name / level / class / species / background / source (placeholder) / campaign (placeholder) — uses `dndChar.*` fields
- **COC actor card fields**: name / occupation / age / residence / source (placeholder) / campaign (placeholder) — uses `cocChar.*` fields; inline render separate from shared `renderInvestigatorCard()`
- **CP RED actor card fields**: handle (h3 heading) / name / role / roleLevel / source (placeholder) / campaign (placeholder) — uses `cpChar.*` fields; inline render separate from shared `renderEdgerunnerCard()`
- **Add Actor section**: maps over cards array with Standard Create (→ `onOpenPlayTab('creator')`) + planned entries
- **DND**: reuses existing `creationMethodCards` array (defined at component level, also used by `view === 'create'`)
- **COC / CP RED**: inline card array defined in vault section; each planned card sets `plannedSlotLabelKey`
- **Planned card visual**: lower weight styling + PLANNED badge (`multiWorkspace.status.planned`); Standard Create has primary styling
- **singleActor.* notes**: moved inside Add Actor section (no longer in footer Replace link area)
- **campaignTeaser**: displayed at bottom of Add Actor section
- **Standard Create → Builder directly**: `onOpenPlayTab('creator')` in all 3 systems (bypasses `view='create'` / `createMethod` navigation step)
- **`renderInvestigatorCard()` / `renderEdgerunnerCard()`**: shared functions untouched (still called by dashboard view)
- **i18n sub-object**: `multiWorkspace.actorVault.*` (13 keys: existingActors / addActor / emptyTitle / emptyNote / singleActorLimitNote / source / sourcePlatform / creator / creatorPlaceholder / campaign / campaignNone / campaignTeaser)
- Locate: `rg -n "ACTOR_VAULT_EXISTING_ADD_SPLIT_V1" src`
- Locate i18n: `rg -n "actorVault" src/i18n`

## Multi-Actor Store Architecture Review

- `AI-LANDMARK: MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1`: `docs/architecture/MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW.md`
- Full review document (L3 architecture, docs only, no src/ change): `docs/architecture/MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW.md`
- **Platform name**: Actor; system names: Character (DND) / Investigator (COC) / Edgerunner (CP RED)
- **ActorKind**: `playerCharacter | unit | vehicle | npc | companion | custom` (V1 only needs `playerCharacter`)
- **ActorInstanceId**: `string` — `actor-{timestamp}-{rand7}`; never derived from name/index
- **actorInstanceId source**: existing `id: string` field on `CharacterData` / `CocCharacter` / `CpCharacter` — lazy-populated if empty
- **ActorMeta**: universal fields (`actorInstanceId`, `systemId`, `actorKind`, `displayName`, `updatedAt`, source/creator, campaign) + `systemSummary: SystemActorSummary`
- **SystemActorSummary**: discriminated union — `DndActorSummary` (level/class/subclass/species/background) + `CocActorSummary` (occupation/age/residence) + `CpRedActorSummary` (handle/role/roleLevel)
- **ActorSourceType**: `platform-created | local-import | workshop-import | copied | preset | unknown`
- **Creator fields**: `creatorName?` / `creatorUid?` (reserved, future accounts) / `importedBy?`
- **CampaignStatus**: `none | bound | created-for | copied-from`; `campaignId?` / `campaignName?` reserved (no Campaign store in V1)
- **Recommended data model**: Option A (per-system arrays: `characters: T[]` + `activeCharacterId: string | null`)
- **Option B** (unified ActorRegistry): deferred — needed only for cross-system unified vault (V2+ feature)
- **Migration strategy**: single object → `characters[0]`; lazy `id` → `actorInstanceId`; additive in Zustand `migrate` callback; no destructive one-time script
- **UI impact**: two-section vault layout unchanged; Existing section becomes multi-item list; ordered by `updatedAt`
- **10 risk boundaries**: localStorage migration · import/export compat · actor switching call sites · current actor pointer · campaign binding · runtime actor reference · inventory ownership · spell/resource state · undo/trash · actor count limit
- Locate: `rg -n "MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1" docs/`

## DND Multi-Actor Store + Actor Vault Library

- `AI-LANDMARK: DND_MULTI_ACTOR_STORE_ACTOR_VAULT_LIBRARY_V1`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- **DndWorkspaceView extended**: added `'characterLibrary'` — three-layer vault navigation:
  - `'characters'` → vault homepage (two entry cards: 已有角色 + 添加角色)
  - `'characterLibrary'` → existing character library (search + filter + sort + detailed cards)
  - `'create'` → add character (Standard Create / planned methods)
- **Vault homepage** (`view === 'characters'`):
  - 已有角色 card: stats (totalChars / completeChars / incompleteChars / recentUpdate=—), click → `'characterLibrary'`
  - 添加角色 card: addActorNote, click → `'create'`
  - Does NOT show character list (moved to characterLibrary view)
- **Character library** (`view === 'characterLibrary'`):
  - Local state: `libSearch` (string), `libFilter` ('all'|'complete'|'incomplete'), `libSort` ('default'|'name'|'level')
  - `isCharComplete`: name+jobClass+race+background all truthy
  - `libChars`: filtered + sorted derived list; active character slot always uses `dndChar` compat field
  - Search: name / jobClass / race / background (client-side, case-insensitive)
  - Filter tabs: 全部 / 资料完整 / 未完成 (functional)
  - Sort: 名称 (localeCompare zh) / 等级 (desc) / 最近更新 (insertion order)
  - Character cards: name + active badge + status badge (Complete/Incomplete) + level + class+subclass + race + background + source/creator/campaign metadata row + 进入 CTA
  - Back button → `'characters'`
- **Nav**: `isActive` check extended: `view === item.key || (item.key === 'characters' && view === 'characterLibrary')`
- **i18n added**:
  - `multiWorkspace.actorVault.addActorNote/totalCount/completeCount/incompleteCount/recentUpdate` (5 keys)
  - `dndWorkspace.characterLibrary.*`: title/backToVault/searchPlaceholder/noResults/statusComplete/statusIncomplete/filter.{all,complete,incomplete}/sort.{default,name,level} (11 keys)
- Locate: `rg -n "DND_MULTI_ACTOR_STORE_ACTOR_VAULT_LIBRARY_V1" src/`

## DND Multi-Actor Store Minimal Implementation

- `AI-LANDMARK: DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1`: `src/store/characterStore.ts`
- **Store changes** (DND only — COC/CP RED untouched):
  - New state fields: `characters: CharacterData[]`, `activeCharacterId: string | null`
  - `character: CharacterData` remains as compat mirror — all existing read/mutation call sites continue to work
  - `syncActiveCharacter(character, characters, activeCharacterId): CharacterData[]` helper — syncs compat field back into array at switch/reset/load checkpoints
  - New actions: `setActiveCharacterId(id)` (sync current → array, then load target), `addCharacter(data)` (sync + append)
  - Updated `resetCreator()` — syncs current → array, then creates new blank, adds to array, sets as active
  - Updated `loadCharacter(data)` — syncs current → array, upserts migrated char, sets as active
  - `merge` callback: legacy `{character}` → wraps to `characters[0]`; multi-actor shape → migrates all, substitutes compat field for active slot on rehydration
  - Initial state: `_initialChar` extracted as module-level constant; `characters = [_initialChar]`, `activeCharacterId = _initialChar.id`
- **DndWorkspaceShell.tsx** vault changes:
  - Reads `dndCharacters`, `dndActiveCharacterId`, `setDndActiveCharacterId`, `resetDndCreator` from store
  - Existing Actors section: iterates `dndCharacters[]`, renders a card per character; active character shows "当前" badge
  - "进入" button per card: calls `setActiveCharacterId(char.id)` then `onOpenPlayTab('sheet')`
  - Standard Creation onClick: calls `resetDndCreator()` then `onOpenPlayTab('creator')` (ensures fresh blank char added to array)
- **i18n keys added** (`multiWorkspace.actorVault.*`):
  - `multiActorNote`: "选择一个角色进入游玩或查看角色卡。" / "Select a character to enter play or view their sheet."
  - `activeIndicator`: "当前" / "Active"
- **Compatibility**: `character` compat field preserved — Sheet, Gameplay, and all runtime pages continue to read `state.character` without change
- Locate: `rg -n "DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1" src/`

## Platform Actor Vault Library Framework

- `AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1`: `src/lib/platform/actorVault.ts`, `src/components/platform/ActorVaultLibraryShell.tsx`, `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- **Platform types**: `ActorVaultSummary`, `ActorVaultStats`, `ActorVaultAddOption`, `ActorVaultSortOption`, `ActorVaultAdapter<TActor>`, `ActorVaultColorTheme`, `ActorVaultShellStrings`, `ActorVaultDetailField`, `ActorVaultMetaRow`: `src/lib/platform/actorVault.ts`
- **`deriveVaultSummaries<T>(adapter)`**: convenience helper → `adapter.getActors().map((actor, i) => adapter.getSummary(actor, i))`: `src/lib/platform/actorVault.ts`
- **`ActorVaultAdapter<TActor>`**: interface — `getActors()`, `getActiveActorId()`, `getSummary(actor, index)`, `getStats(summaries)`, `getAddOptions()`, `getSortOptions()`, `getDefaultSortKey()`, `onEnterActor(id)`: `src/lib/platform/actorVault.ts`
- **`ActorVaultSortOption.kind`**: `'default'` = insertion order, `'name'` = localeCompare sortName, `'numeric'` = sortNumeric desc: `src/lib/platform/actorVault.ts`
- **`ActorVaultColorTheme`**: includes explicit `hoverBorder`, `focusBorder`, `hoverText` fields (no dynamic `.replace()` in shell — all as Tailwind class literals for JIT scanning): `src/lib/platform/actorVault.ts`
- **`ActorVaultLibraryShell`**: platform reusable UI shell; internal state: `mode: 'home'|'existing'`, `search`, `filter: 'all'|'complete'|'incomplete'`, `sortKey`; home view = two entry cards (existing-actors stats + add-actor); existing view = search+sort+filter+card list: `src/components/platform/ActorVaultLibraryShell.tsx`
- **`ActorVaultCard`** (internal): renders name + active badge + status badge + detailFields grid + metaRows + Enter CTA: `src/components/platform/ActorVaultLibraryShell.tsx`
- **DND adapter**: `isDndCharComplete`, `buildDndActorSummary`, `buildDndVaultStats`, `buildDndSortOptions`, `buildDndVaultShellStrings`, `buildDndVaultAdapterStrings`: `src/pages/dndWorkspace/dndActorVaultAdapter.ts`
- **`DND_VAULT_COLOR_THEME`**: DND dark-red parchment Tailwind class string constants; all hover/focus variants as explicit literals: `src/pages/dndWorkspace/dndActorVaultAdapter.ts`
- **`DndWorkspaceView` change**: `'characterLibrary'` removed — shell now manages home/existing internally; type is `'dashboard'|'characters'|'create'|'compendium'|'sources'|'play'`: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- **DND adapter construction site**: `_dndVaultAdapter` built in `DndWorkspaceShell` from Zustand selectors; `getActors()` substitutes active char with live compat `dndChar` field: `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- **i18n**: reuses existing `multiWorkspace.actorVault.*` + `dndWorkspace.characterLibrary.*` keys — no new platform-level keys added
- Locate: `rg -n "PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1" src/`

## COC Actor Vault Library Adoption

- `AI-LANDMARK: COC_ACTOR_VAULT_LIBRARY_ADOPTION_V1`: `src/pages/cocWorkspace/cocActorVaultAdapter.ts`, `src/pages/cocWorkspace/CocWorkspaceShell.tsx`
- `cocActorVaultAdapter.ts`: `isCocCharComplete`, `buildCocActorSummary`, `buildCocVaultStats`, `buildCocSortOptions`, `buildCocVaultShellStrings`, `buildCocVaultAdapterStrings`, `COC_VAULT_COLOR_THEME`
- `COC_VAULT_COLOR_THEME`: dark teal theme; all Tailwind class strings as literals; includes `bgInput: 'bg-[#0d1211]/90'`
- `ActorVaultColorTheme.bgInput`: new field — used by shell for search/sort input backgrounds; dark-theme safe; DND sets `'bg-white/80'`
- V1 constraint: `getActors()` returns `[]` or `[cocChar]` (single-actor; no store change)
- `onEnterActor(_id)` → `onViewChange('sheet')`; `onRequestAdd()` → `onViewChange('createMethod')`
- Locate: `rg -n "COC_ACTOR_VAULT_LIBRARY_ADOPTION_V1" src/`

## CP RED Actor Vault Library Adoption

- `AI-LANDMARK: CPRED_ACTOR_VAULT_LIBRARY_ADOPTION_V1`: `src/pages/cpWorkspace/cpActorVaultAdapter.ts`, `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- `cpActorVaultAdapter.ts`: `isCpCharComplete`, `buildCpActorSummary`, `buildCpVaultStats`, `buildCpSortOptions`, `buildCpVaultShellStrings`, `buildCpVaultAdapterStrings`, `CP_VAULT_COLOR_THEME`
- `CP_VAULT_COLOR_THEME`: dark gold theme; all Tailwind class strings as literals; `bgCard: 'bg-[#0d0d0d]/85'`, `bgInput: 'bg-[#0a0a0a]/90'`
- Sort options: `default` (insertionOrder), `name` (localeCompare), `roleLevel` (numeric desc via `sortNumeric`)
- `displayName` = `lifePath?.handle?.trim()` preferred over `name` (street handle first)
- V1 constraint: `getActors()` returns `[]` or `[cpChar]` when `name` or `handle` present (single-actor; no store change)
- `onEnterActor(_id)` → `onOpenPlayTab('sheet')`; `onRequestAdd()` → `onViewChange('createMethod')`
- Locate: `rg -n "CPRED_ACTOR_VAULT_LIBRARY_ADOPTION_V1" src/`

## Actor Vault Dead I18n Key Cleanup

- `AI-LANDMARK: ACTOR_VAULT_DEAD_I18N_CLEANUP_V1`: `docs/ai/ACTIVE_TASK.md` (task record only; deletion tasks have no inline landmark in source files)
- Dead keys removed: `multiWorkspace.singleActor.*`, `multiWorkspace.entryPattern.*`, `multiWorkspace.actions.(continueInvestigatorEditing|continueEditing|replaceCurrentCharacter|replaceCurrentInvestigator|replaceCurrentEdgerunner)`, `multiWorkspace.actorVault.(emptyTitle|emptyNote|singleActorLimitNote|multiActorNote|campaignTeaser)`, `multiWorkspace.coc.home.(openCurrentActor|startRuntime|systemHealth)`, `multiWorkspace.coc.(modules|notes).*`, `multiWorkspace.coc.entry.(vaultTitle|vaultHint|emptyNote|vaultBoundary)`, same for `multiWorkspace.cp.*`, `cocWorkspace.nav.(overview|vault|create|runtime|compendium|sources)`, `cpWorkspace.nav.*`, `cpWorkspace.vault.*`, `dndWorkspace.home.(openCurrentCharacter|openCurrentCharacterNote|enterCompendium|boundarySummary)`, `dndWorkspace.modules.(characters|create|sheet|play|compendium|compendiumNote|sources|sourcesNote|inventory|map|journal)`, `dndWorkspace.characters.(title|emptyNote|hint|vaultBoundary|actorNote|exportImport|exportImportNote)`
- Alive i18n keys preserved: `multiWorkspace.actorVault.existingActors/addActor/activeIndicator/addActorNote/totalCount/completeCount/incompleteCount/recentUpdate/source/sourcePlatform/creator/creatorPlaceholder/campaign/campaignNone`, `multiWorkspace.actions.(backToWorkspace|viewInvestigatorSheet|viewCharacterSheet|continueEdgerunnerEditing|startInvestigation|startMission|createInvestigator|createEdgerunner)`, `cocWorkspace.nav.sheet`, `dndWorkspace.modules.(spellIndex|featIndex|equipmentIndex|classIndex)`, `dndWorkspace.characters.(current|empty|unnamed|level|species|background|class)`
- Verify clean: `rg "vaultTitle|singleActorLimitNote|campaignTeaser|entryPattern|replaceCurrentCharacter|continueInvestigatorEditing" src/i18n/`

## System Library Filter Taxonomy Cleanup V1

- Changes are in `src/pages/SystemLibrary.tsx` (full rewrite) and i18n locales
- `AvailabilityKey`: `'available' | 'unavailable'` — replaces `StatusKey`
- `SourceKey`: `'builtin' | 'local' | 'community'`
- `SystemEntry.availability`: drives card badge + button + opacity
- `SystemEntry.source`: drives source filter
- `SystemEntry.tagKeys[]`: i18n key array; shown as small chips on card, also searched
- `AVAILABILITY_BADGE_CLASS`: `Record<AvailabilityKey, string>` — teal for available, muted for unavailable
- Filter rows use `filterRow()` helper with inline label prefix
- Available card: badge 「可进入」, Button「进入系统」→ `onEnterPlay(system)`
- Unavailable card: opacity-65, badge 「未接入」, disabled `<button>`「后续接入」
- i18n removed: `systemLibrary.statusFilter.*`, `systemLibrary.badge.(scaffold/planned/installed/community/local)`
- i18n added: `systemLibrary.category.label`, `systemLibrary.availability.*`, `systemLibrary.source.*`, `systemLibrary.badge.(available/unavailable)`, `systemLibrary.tags.*`, `systemLibrary.unavailableButton`
- Verify: `rg "statusFilter\|badge\.scaffold\|badge\.planned" src/`

## System Library Duplicate Entry Consolidation V1

- No new landmark (wiring change only); changes in `src/App.tsx`
- Left nav item: `{ key: 'systemLibrary', labelKey: 'shell.nav.systemLibrary', kind: 'view', icon: Library }` — calls `openPlaceholder('systemLibrary')` → intercepted → `setAppView('systemLibrary')`
- `openPlaceholder` intercept: `feature === 'ruleSystems' || feature === 'systemLibrary'` both → `setAppView('systemLibrary')`
- `fallbackNavigation`: workspace no-stack-fallback now → `setAppView('systemLibrary')` (not PlayMenu)
- Settings + placeholder page buttons: `openPlaceholder('ruleSystems')` (not `enterPlay()`)
- `PlayMenu`: no longer reachable through any UI flow; code retained. Dead render: `appView==='play' && playStage==='menu'`
- i18n keys added: `shell.nav.systemLibrary`, `systemLibrary.subtitle`
- Locate: `rg -n "systemLibrary\|ruleSystems" src/App.tsx`

## System Library Scaffold V1

- `AI-LANDMARK: SYSTEM_LIBRARY_SCAFFOLD_V1`: `src/pages/SystemLibrary.tsx` (top of file comment)
- Locate: `rg -n "SYSTEM_LIBRARY_SCAFFOLD_V1" src/`
- `SYSTEM_ENTRIES[]`: static array of `SystemEntry` — id, system?, nameKey, typeLabel, descKey, status, category. Installed = DND/COC/CP; Placeholder = 战锤/日式TRPG/自定义.
- `StatusKey`: `'installed' | 'scaffold' | 'planned' | 'community' | 'local'`
- `CategoryKey`: `'trpg' | 'boardgame' | 'wargame' | 'cardgame' | 'custom'`
- `STATUS_BADGE_CLASS`: `Record<StatusKey, string>` — tailwind classes per status
- Search: React `useState` on `search: string`; filters by `t(nameKey) + t(descKey) + typeLabel` (local, no API)
- Category + status: React `useState` on `'all' | CategoryKey` and `'all' | StatusKey`
- Props: `locale: Locale`, `onEnterPlay: (system?: System) => void`
- App.tsx: `AppView` extended with `'systemLibrary'`; `openPlaceholder('ruleSystems')` → `setAppView('systemLibrary')` (intercept before normalizeFeatureKey); `<SystemLibrary locale={locale} onEnterPlay={enterPlay} />` render added
- i18n keys added: `systemLibrary.title/searchPlaceholder/enterSystem/noResults/category.*/statusFilter.*/badge.*/systems.*`
- Verify: `rg -n "SYSTEM_LIBRARY_SCAFFOLD_V1" src/`

## Platform Home Launchpad IA Cleanup V2

- `AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V2`: `src/pages/Home.tsx` (top of file comment)
- Locate: `rg -n "PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V2" src/`
- **4-section structure**: 继续上次/Resume → 最近使用/Recent → 固定入口/Pinned → 平台状态摘要/Platform Status
- `systemCards[]`: per-system `resumeAccent` + `recentAccent` colour classes; no `cardAccent` or `descKey` (system descriptions no longer on home page)
- `pinnedEntries[]`: 3 entries with `key`, `labelKey`, `icon`, `placeholderKey`; all → `onOpenPlaceholder(key)`
- `platformStatusTagKeys`: const array of `home.platformStatus.tags.*` i18n keys — rendered as `<Badge>` chips
- Private Import: small utility `<button>` in Section 4 → `onOpenPlaceholder('privateImport')`
- `charNameBySystem`: `Record<System, string | undefined>` — derived from 3 store reads; char name shown in recent row if present
- i18n keys added: `home.recent.*`, `home.pinned.*`, `home.platformStatus.*`
- i18n keys removed: `home.systems.*`, `home.devZone.*` (and all `DevStatusKey` / `DevCardDef` types dropped)
- Verify clean: `rg "home\.systems\.\|home\.devZone\." src/pages/Home.tsx`

## Platform Home Launchpad IA Cleanup V1 (superseded by V2)

- `AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V1`: `src/pages/Home.tsx` (top of file comment)
- Locate: `rg -n "PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V1" src/`
- Three-section structure: `继续上次 / Resume` → `规则系统库 / Rule Systems` → `开发中功能 / In Development`
- `systemCards[]`: per-system accent colours (D&D parchment/COC teal/CP gold), `labelKey`, `descKey`, `cardAccent`, `resumeAccent`
- `devCards[]`: `DevCardDef` — `key`, `titleKey`, `icon`, `statusKey: DevStatusKey`, `placeholderKey?` (absent = disabled button)
- `DevStatusKey` union: `'scaffold' | 'interfaceReserved' | 'plannedImpl' | 'mock' | 'toolEntry'`
- `devStatusLabelKeys`: `Record<DevStatusKey, string>` mapping to `home.devZone.status.*` i18n keys
- Props: `onEnterPlay(system?: System)` → calls `setSystem` + `setPlayStage('workspace')` in App.tsx; `onOpenPlaceholder(feature)` → opens placeholder modal
- Active char detection: `system === 'CoC' ? cocChar : system === 'CP' ? cpChar : dndChar`
- i18n keys added: `home.resume.*`, `home.systems.*`, `home.devZone.*` (zh-CN + en)
- i18n keys removed: old `home.snapshot.*` / `home.workspaces.*` / `home.roadmap.*` (were in prior Home.tsx)
- Sidebar label: `shell.nav.play` → `'规则系统'` (zh) / `'Rule Systems'` (en)
- Private Import: moved from Hero → dev-zone card with `statusKey: 'toolEntry'`, `placeholderKey: 'privateImport'`
- Verify clean: `rg -n "home\.resume\|home\.systems\|home\.devZone" src/pages/Home.tsx`

## General Search Notes

- If a symbol listed here cannot be found, use targeted search for the exact symbol name.
- If a task asks for a feature not listed here, locate via targeted search and update this file only in a docs-focused round.
