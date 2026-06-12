# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Build Green + Commit Checkpoint
- Name: Build Green + Commit Checkpoint
- Goal: restore TypeScript/build health and provide precise commit grouping without staging or committing.
- Phase: P1 engineering health checkpoint
- Status: Completed; `npx tsc --noEmit` and `npm run build` pass

## Result Summary

- Fixed the DND Equipment Catalog TypeScript error caused by JSX `key` being treated as a component prop.
- The fix wraps each row component in a keyed native element and leaves row props as `{ item }`.
- No DND equipment data semantics, Sheet layout intent, store schema, migration, inventory, AC, attack, damage, or rule behavior changed.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- No `git add` or commit was run.

## Scope

### Allowed Files

- `src/pages/sheet/DndEquipmentCatalogPanel.tsx`
- `PROJECT_STATUS.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- DND / COC / CP RED rule behavior
- Store schema or migration
- Backend, local backend, storage adapter
- Campaign, multiplayer, AI Host, P2 features
- package / Vite / TypeScript config

### Do Not Do

- Add inventory, equip, attack, damage, AC, or Action Registry behavior
- Use `git add .` / `git add -A`
- Commit without explicit user approval

## Navigation

### Key Symbols

- `DndEquipmentCatalogPanel`
- `DND_EQUIPMENT_DATA_LAYER`

### Locate Commands

```powershell
rg -n "DndEquipmentCatalogPanel|DND_EQUIPMENT_DATA_LAYER" src docs
```

## Completion Criteria

- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Current dirty files are understood.
- Commit group suggestions use explicit file paths only.

## Verification

```powershell
cd D:\Download\dnd
git status --short
git diff --stat
npx tsc --noEmit
npm run build
```
