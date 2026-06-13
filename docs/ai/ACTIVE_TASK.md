# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Character Vault & Creation Method Entry v1
- Name: DND Character Vault & Creation Method Entry v1
- Goal: move DND character entry into a lightweight Character Vault and creation method selection flow while preserving the existing Builder, Sheet, Gameplay, and RollConsole assets.
- Phase: P1 DND platform IA / character entry
- Status: Implemented; verification commands pending local run

## Result Summary

- DND Character Vault now shows the current local character, empty state, and character-context actions.
- Character creation now enters through a creation method selection screen.
- Standard Creation opens the existing BG3-like Builder.
- Quick Creation, Local Import, and Workshop Import are planned placeholders only.
- Sheet exposes a visible Start Playing / Enter Combat Panel action into the preserved Gameplay view.
- Workspace top navigation no longer presents Enter Play / Combat as a primary route.
- No true multi-character store, Workshop, import rewrite, map, backpack, item system, rule data, store schema, migration, dice algorithm, Sheet runtime, or Gameplay runtime changed.
- Landmark: `DND_CHARACTER_VAULT_CREATION_METHOD_ENTRY`.

## Scope

### Allowed Files

- `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `src/pages/PlayWorkspace.tsx`
- `src/pages/Sheet.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/rules/DND_RULE_COVERAGE.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- DND rule data
- COC / CP RED code and data
- `src/store/*`
- Store schema / migration
- CharacterData / save format
- Creator business logic
- Sheet rule calculation logic
- Gameplay runtime logic
- Dice algorithm
- Workshop / backend / subscription / community implementation
- Inventory / map / item systems

### Do Not Do

- Implement a real multi-character library
- Implement archive / duplicate / campaign ownership
- Implement real Quick Creation
- Implement real Workshop import, subscriptions, downloads, accounts, backend, dependencies, or community content
- Restore old Builder tabs or utility toolbar
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `DND_CHARACTER_VAULT_CREATION_METHOD_ENTRY`
- `dndWorkspace.characters.*`
- `dndWorkspace.creation.*`
- `dndWorkspace.actions.startPlaying`

### Locate Commands

```powershell
rg -n "DND_CHARACTER_VAULT_CREATION_METHOD_ENTRY|dndWorkspace\\.characters|dndWorkspace\\.creation|startPlaying" src docs
```

## Completion Criteria

- Character Vault shows current-character card or empty state.
- Vault actions route to Sheet / Builder / Gameplay.
- Creation method page appears before Builder.
- Standard Creation enters existing Builder.
- Planned creation methods are placeholders only.
- Sheet has a visible Start Playing action.
- Top Workspace nav no longer makes Play / Combat the primary route.
- No schema, migration, store, rule data, dice algorithm, Sheet runtime, or Gameplay runtime changes.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
