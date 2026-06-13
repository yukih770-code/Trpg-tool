# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: System Home Simplification v1
- Name: System Home Simplification v1
- Goal: Simplify DND / COC / CP RED system dashboard home pages to function as Game System Home pages — core entry points only, no data index cards on home.
- Phase: P1 UI / IA simplification
- Status: Implemented; awaiting manual build verification

## Result Summary

### src/ changes

- **`src/pages/dndWorkspace/DndWorkspaceShell.tsx`**
  - Removed `spellIndex`, `featIndex`, `equipmentIndex`, `classIndex` from `moduleCards`
  - Added `noteKey` to `compendium` card (`dndWorkspace.modules.compendiumNote`)
  - Renamed `sources` card label to `dndWorkspace.modules.sources` (now "规则源状态 / System Health") with `noteKey`
  - Replaced `completionRows` full grid section on dashboard with a compact footnote + link to Sources view
  - Added landmark: `SYSTEM_HOME_SIMPLIFICATION`

- **`src/pages/PlayWorkspace.tsx`**
  - Removed `completion` planned card from `cocModuleCards`
  - Removed `completion` planned card from `cpModuleCards`
  - Added landmark comments: `SYSTEM_HOME_SIMPLIFICATION` on both COC and CP removal lines

- **`src/i18n/locales/zh-CN.ts`**
  - Added `dndWorkspace.modules.compendiumNote`
  - Added `dndWorkspace.modules.sourcesNote`
  - Updated `dndWorkspace.modules.sources` label to '规则源状态 / System Health'
  - Added `dndWorkspace.dashboard.completionFootnote`
  - Updated `multiWorkspace.coc.notes.compendium` (describes Rules Compendium content)
  - Updated `multiWorkspace.coc.notes.sources` (adds System Health context)
  - Updated `multiWorkspace.cp.notes.compendium`
  - Updated `multiWorkspace.cp.notes.sources`

- **`src/i18n/locales/en.ts`**
  - Same keys as zh-CN.ts in English
  - `dndWorkspace.modules.compendium` label changed to 'Rules Compendium'
  - `dndWorkspace.modules.sources` label changed to 'Source Status / System Health'

### No changes

- Store schema / migration — untouched
- CharacterData / Investigator / CP RED save structures — untouched
- Runtime rule logic / dice algorithms — untouched
- DND / COC / CP RED rule data — untouched

## Scope

### Allowed Files

- `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `src/pages/PlayWorkspace.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Changes

- Store schema / migration
- CharacterData / Investigator / CP RED save structures
- Runtime rule logic / dice algorithms
- DND / COC / CP RED rule data
- Any other src/ file
- git add / commit

## Navigation

### Key Symbols

- `SYSTEM_HOME_SIMPLIFICATION`
- `SYSTEM_ACTOR_SESSION_WORKSPACE_IA_CORRECTION`

### Locate Commands

```powershell
rg -n "SYSTEM_HOME_SIMPLIFICATION" src docs
rg -n "compendiumNote\|sourcesNote\|completionFootnote" src
```

## Completion Criteria

- `moduleCards` in DndWorkspaceShell no longer contains spellIndex / featIndex / equipmentIndex / classIndex
- `completionRows` grid no longer appears on the dashboard home; replaced with footnote
- `cocModuleCards` and `cpModuleCards` no longer contain a `completion` card
- New i18n keys exist and resolve in both zh-CN and en
- `SYSTEM_HOME_SIMPLIFICATION` landmark present in src files and SYMBOL_MAP.md
- Documentation updated

## Verification

```powershell
cd D:\Download\dnd
npx tsc --noEmit
npm run build
rg -n "SYSTEM_HOME_SIMPLIFICATION" src docs
rg -n "compendiumNote" src/i18n
```
