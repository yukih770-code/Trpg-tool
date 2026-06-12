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

## Platform Shell / Home / Play Workspace

- Platform shell default entry: `src/App.tsx`
- Platform Home dashboard: `src/pages/Home.tsx`
- Preserved previous main interface: `src/pages/PlayWorkspace.tsx`
- `appView: "home" | "play" | "placeholder"` state: `src/App.tsx`
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
- class resource utilities: `src/lib/dnd2024/resource-utils.ts`
- spell preparation model: `src/lib/dnd2024/spell-preparation-model.ts`
- progression utilities: `src/lib/dnd2024/progression-utils.ts`
- class progression data: `src/data/dnd2024/classProgression.ts`
- unified spellcasting resource consumption: `consumeSpellcastingResource` in `src/store/characterStore.ts`
- legacy spell slot wrapper: `consumeSpellSlot` in `src/store/characterStore.ts`
- `AI-LANDMARK: DND_SPELLCASTING_RESOURCE_CONSUMPTION`: `src/store/characterStore.ts`

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
