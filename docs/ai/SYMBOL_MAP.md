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

## DND Runtime / Resources

- DND main gameplay: `src/pages/Gameplay.tsx`
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
