# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Gameplay Entry Preservation v1
- Name: DND Gameplay Entry Preservation v1
- Goal: keep DND Gameplay / dice access visible after the Builder hierarchy cleanup without restoring old Builder tabs or changing runtime logic.
- Phase: P1 DND platform UX / runtime entry preservation
- Status: Implemented; verification commands pending local run

## Result Summary

- DND Workspace Play / Combat navigation now opens the preserved Gameplay view directly.
- Existing DND Gameplay and RollConsole remain reachable through the current `Gameplay` component.
- Old Builder-internal 创建器 / 角色卡 / 游玩战斗 tabs were not restored.
- No dice algorithm, Gameplay runtime logic, DND rule data, CharacterData, store schema, migration, COC, CP RED, or Platform Shell behavior changed.
- Landmark: `DND_GAMEPLAY_ENTRY_PRESERVATION`.

## Scope

### Allowed Files

- `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- DND rule data
- `src/pages/Gameplay.tsx` runtime logic
- `src/pages/gameplay/*` dice / RollConsole logic
- `src/store/*`
- Store schema / migration
- CharacterData / save format
- COC / CP RED code and data
- Platform Shell navigation outside DND Workspace

### Do Not Do

- Restore old Builder tabs
- Restore old top utility toolbar inside Builder
- Rewrite dice logic
- Rewrite Gameplay runtime
- Implement Action Registry, map, inventory, backpack, or item systems
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `DND_GAMEPLAY_ENTRY_PRESERVATION`
- `dndWorkspace.nav.play`
- `dndWorkspace.modules.play`

### Locate Commands

```powershell
rg -n "DND_GAMEPLAY_ENTRY_PRESERVATION|dndWorkspace\\.nav\\.play|dndWorkspace\\.modules\\.play|RollConsolePanel" src docs
```

## Completion Criteria

- DND Workspace has a clear Play / Combat entry.
- Clicking Play / Combat opens DND Gameplay, not the Builder.
- Existing DND RollConsole / dice area remains reachable when Gameplay renders.
- Old Builder tabs and utility toolbar are not restored.
- No schema, migration, rule data, dice algorithm, or runtime rule logic changes.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
