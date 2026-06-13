# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: CP RED Workspace Contract Alignment v1
- Name: CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1
- Goal: Align CP RED workspace top navigation to Platform Workspace Section Contract. Top nav limited to 4 system-level Sections: overview / actorVault / rulesCompendium / sourceStatus. Remove createMethod / sheet / runtime (play/mission) from top nav; keep accessible via Actor/Creation context CTAs. Add actorFlowNote in createMethod view. No CP RED rule logic, dice, Edgerunner save format, or runtime changed.
- Phase: P1 platform architecture
- Status: Done

## Result Summary

- `src/pages/cpWorkspace/CpWorkspaceShell.tsx`: Added `CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1` landmark (doc-block + inline comment). Removed `createMethod`, `sheet`, `gameplay(mission)` from `navItems` → now 4 items: dashboard / vault / compendium / sources. Simplified navItems type (removed `kind`/`view?`/`tab?` fields). Simplified `isActiveNav` to `view === item.key`. Simplified `handleNavClick(nextView)` — no more playTab branch. Updated nav button `onClick` to `handleNavClick(item.key)`. Added `actorFlowNote` paragraph at bottom of createMethod view section.
- `src/i18n/locales/zh-CN.ts`: Added `cpWorkspace.creation.actorFlowNote`.
- `src/i18n/locales/en.ts`: Added `cpWorkspace.creation.actorFlowNote`.
- createMethod/play views and their CTAs unchanged — accessible via renderEdgerunnerCard and overview empty state.
- No DND / COC files changed. No store schema, Edgerunner save format, CP RED rule data, runtime logic, dice algorithm, React Router, URL routing, or browser History API changed.
- Landmark: `CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1` in `src/pages/cpWorkspace/CpWorkspaceShell.tsx`.

## Scope

### Allowed Files

- `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`

### Forbidden Changes

- DND / COC related pages
- store schema / migration / Edgerunner save structures / CP RED rule data
- CP RED runtime rule logic / dice algorithm / import / export
- Workshop / Plugin / map / token / session / inventory / item data contract
- React Router / URL routing / browser History API
- git add / commit

## Navigation

### Key Symbols

- `CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1` — landmark in `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- `CPRED_WORKSPACE_CLEANUP_V1` — earlier nav cleanup landmark (same file)
- `COC_CPRED_DND_ALIGNED_WORKSPACE_RECONSTRUCTION` — original CP RED workspace landmark (same file)
- `navItems` — 4-item top nav array in `CpWorkspaceShell.tsx`
- `cpWorkspace.creation.actorFlowNote` — new i18n key in both locales

### Locate Commands

```powershell
rg -n "CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1" src
rg -n "navItems" src/pages/cpWorkspace/CpWorkspaceShell.tsx
rg -n "actorFlowNote" src/i18n
```
