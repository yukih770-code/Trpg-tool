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
- COC owner-provided source manifest: `docs/rule-sources/COC_SOURCES.md`
- CP RED owner-provided source manifest: `docs/rule-sources/CPRED_SOURCES.md`
- DND owner-provided root source: `https://github.com/DND5eChm`
- DND primary sourceId: `dnd5echm-srd52-primary`
- DND XGtE sourceId: `dnd5echm-xgte`
- DND TCoE sourceId: `dnd5echm-tcoe`
- `AI-LANDMARK: RULE_SOURCE_AUTHORITY_POLICY`: `docs/rule-sources/RULE_SOURCE_MANIFEST.md`

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

## DND Class / Subclass Correction

- DND class/subclass source metadata enrichment: `src/data/classes.ts`
- DND missing class gap report: `DND_CLASS_SOURCE_GAP_REPORT` in `src/data/classes.ts`
- Optional class/subclass provenance fields: `ClassDef.ruleMeta` and `SubclassDef.ruleMeta` in `src/lib/dnd-types.ts`
- Owner source manifest for class/subclass source paths: `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`
- `AI-LANDMARK: DND_CLASS_SUBCLASS_CORRECTION`: `src/data/classes.ts`

## DND Species / Background Display Cleanup

- Sheet species/background display cleanup: `src/pages/Sheet.tsx`
- Current DND species data: `DND_2024_SPECIES_DATA` / `RACE_DATA` in `src/data/races.ts`
- Legacy DND race fallback: `LEGACY_RACE_DATA` in `src/data/races.ts`
- Current DND background data: `DND_2024_BACKGROUND_DATA` / `BACKGROUND_DATA` in `src/data/backgrounds.ts`
- Legacy DND background fallback: `LEGACY_BACKGROUND_DATA` in `src/data/backgrounds.ts`
- `AI-LANDMARK: DND_SPECIES_BACKGROUND_DISPLAY_CLEANUP`: `src/pages/Sheet.tsx`

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
