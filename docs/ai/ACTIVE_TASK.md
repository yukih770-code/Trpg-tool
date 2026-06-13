# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: CP RED stable item instance id / equipment disappearing fix v1
- Name: CPRED_STABLE_ITEM_INSTANCE_ID_EQUIPMENT_FIX_V1
- Goal: Fix CP RED item disappearance around inventory/equipped movement by preserving stable item instance identity across equip, unequip, install, remove, carry, and wear flows. Keep legacy no-id data compatible through lazy id assignment. Do not change CP RED rule data, dice, combat formula, save schema, migration, DND, or COC.
- Phase: P1 platform/runtime stability
- Status: Done

## Result Summary

- `src/store/cpStore.ts`: Added `ensureCpItemInstanceId` and applied it at CP RED inventory/equipment movement boundaries. Actions now remove items by their original inventory key, assign a stable instance id before moving into equipped state, and preserve the moved item payload when returning it to inventory.
- `src/pages/CpGameplay.tsx`: Damage weapon lookup now prefers `instanceId`, with legacy name fallback for old selected values.
- `src/pages/cpGameplay/CpDamagePanel.tsx`: Damage weapon select option values now use `instanceId ?? name`, so duplicate same-name carried weapons remain distinguishable.
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/SYMBOL_MAP.md`, `docs/ai/TASK_ARCHIVE.md`: Updated task status, acceptance checks, and landmark navigation.
- No DND / COC files changed. No CP RED rule data, dice algorithm, combat formula, store schema, migration, save format, React Router, URL routing, browser History API, map, session, workshop, or plugin logic changed.
- Landmark: `CPRED_STABLE_ITEM_INSTANCE_ID_EQUIPMENT_FIX_V1` in `src/store/cpStore.ts`.

## Scope

### Allowed Files

- `src/store/cpStore.ts`
- `src/pages/CpGameplay.tsx`
- `src/pages/cpGameplay/CpDamagePanel.tsx`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`

### Forbidden Changes

- DND / COC code
- CP RED rule data / dice algorithm / combat formula / netrunning rules / market prices
- store schema / migration / save format
- true inventory data contract / item system rewrite
- map / session / workshop / plugin / router
- git add / commit

## Navigation

### Key Symbols

- `CPRED_STABLE_ITEM_INSTANCE_ID_EQUIPMENT_FIX_V1` — landmark in `src/store/cpStore.ts`
- `ensureCpItemInstanceId` — lazy stable id helper in `src/store/cpStore.ts`
- `installCyberware`, `removeCyberware`, `equipArmor`, `unequipArmor`, `carryWeapon`, `removeWeapon`, `wearFashion`, `removeClothing` — stable movement boundaries in `src/store/cpStore.ts`
- `weaponOptionKey` — damage panel option key/value helper in `src/pages/cpGameplay/CpDamagePanel.tsx`

### Locate Commands

```powershell
rg -n "CPRED_STABLE_ITEM_INSTANCE_ID_EQUIPMENT_FIX_V1|ensureCpItemInstanceId|weaponOptionKey" src docs
rg -n "installCyberware|removeCyberware|equipArmor|unequipArmor|carryWeapon|removeWeapon|wearFashion|removeClothing" src/store/cpStore.ts
```
