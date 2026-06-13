# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: COC Workspace Cleanup v1
- Name: COC Workspace Cleanup v1
- Goal: Clean up COC Workspace so all sections look like platform shell pages. Add Investigator Sheet summary shell and Investigation Panel (runtime) as dedicated nav views. UI/shell change only — no store, schema, COC rule data, runtime logic, or dice algorithm changes.
- Phase: P1 platform IA / workspace shell cleanup
- Status: Implemented; verification pending

## Result Summary

- Extended `CocWorkspaceView` and `NonDndWorkspaceView` with `'sheet'`.
- Added 2 new nav items: `sheet` (调查员卡) and `play` with isPlayAction (调查面板 — calls `onOpenPlayTab('gameplay')`).
- New `sheet` view renders HP/MP/SAN/Luck, characteristics, and top skills from store; CTAs for "开始调查" and "继续编辑".
- "查看调查员卡" in `renderInvestigatorCard` now navigates to view='sheet' instead of embedded CocSheet.
- `isActiveNav` updated so 'play' nav item is active when view='play'.
- Added `cocWorkspace.nav.sheet`, `cocWorkspace.nav.runtime`, `cocWorkspace.sheet.*` i18n keys (zh-CN + en).
- CocGameplay already has `embedded` prop from prior task (LEGACY_RUNTIME_EMBEDDED_MODE).
- No store schema, Investigator save format, COC rule data, runtime logic, or dice algorithm changed.
- Landmark: `COC_WORKSPACE_CLEANUP_V1`.

## Scope

### Allowed Files

- `src/pages/cocWorkspace/CocWorkspaceShell.tsx`
- `src/pages/PlayWorkspace.tsx` (NonDndWorkspaceView type extension only)
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`

### Forbidden Changes

- Store schema / migration
- Investigator / CP RED save structures
- COC / DND rule data
- Runtime rule logic / dice algorithms
- CocGameplay / CpGameplay internal rule logic
- True multi-investigator store / Actor data contract
- True Rules Compendium engine / Source Manager engine
- Workshop / Plugin / map / session / items data contracts
- CP RED Workspace / CpGameplay / DND pages
- Browser URL routing / React Router / git add / commit

## Navigation

### Key Symbols

- `COC_WORKSPACE_CLEANUP_V1` — landmark in CocWorkspaceShell view='sheet' section
- `CocWorkspaceView` — `src/pages/cocWorkspace/CocWorkspaceShell.tsx` (now includes 'sheet')
- `NonDndWorkspaceView` — `src/pages/PlayWorkspace.tsx` (now includes 'sheet')
- `cocWorkspace.sheet.*` — `src/i18n/locales/`

### Locate Commands

```powershell
rg -n "COC_WORKSPACE_CLEANUP_V1" src docs
rg -n "'sheet'" src/pages/cocWorkspace/CocWorkspaceShell.tsx
rg -n "NonDndWorkspaceView" src/pages/PlayWorkspace.tsx
```

## Completion Criteria

- COC Workspace nav shows 7 items.
- "调查员卡" nav shows sheet summary shell (HP/MP/SAN/Luck, characteristics, skills).
- "调查面板" nav launches investigation runtime with CocGameplay embedded.
- Only one top nav visible throughout COC Workspace.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
