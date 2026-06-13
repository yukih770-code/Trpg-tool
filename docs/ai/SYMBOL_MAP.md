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

## Platform Navigation History Stack

- App-level navigation state: `NavigationState` in `src/App.tsx`
- Navigation stack state and helpers: `navigationStack`, `pushNavigation`, `goBack`, `restoreNavigation`, `fallbackNavigation` in `src/App.tsx`
- Workspace navigation snapshot: `PlayWorkspaceNavigationState` and `defaultPlayWorkspaceNavigationState` in `src/pages/PlayWorkspace.tsx`
- PlayWorkspace navigation callbacks: `onNavigationChange`, `onBeforeNavigate`, `onBack`, `canGoBack` in `src/pages/PlayWorkspace.tsx`
- Workspace back behavior: outer workspace back button in `src/App.tsx`; non-DND workspace back buttons through `navigateBackOrDashboard` in `src/pages/PlayWorkspace.tsx`
- Current-location breadcrumb copy: `navigation.currentLocation`, `navigation.breadcrumb.*` in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- `AI-LANDMARK: PLATFORM_NAVIGATION_HISTORY_STACK`: `src/App.tsx`

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

## General Search Notes

- If a symbol listed here cannot be found, use targeted search for the exact symbol name.
- If a task asks for a feature not listed here, locate via targeted search and update this file only in a docs-focused round.
