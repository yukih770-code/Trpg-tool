# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Product Shell Phase 1 - Workspace Dashboard
- Name: DND Product Shell Phase 1 - Workspace Dashboard
- Goal: give DND a product-grade workspace shell (dashboard / character vault entry / compendium placeholder / source status / play) so entering DND no longer feels like a small utility panel.
- Phase: P1 DND system completion / product shell
- Status: Implemented; verification commands pending local run

## Result Summary

- DND Product Shell Phase 1 added. DND now enters through a workspace dashboard instead of a character sheet.
- `src/pages/dndWorkspace/DndWorkspaceShell.tsx`: full-screen shell with secondary nav (工作台总览 / 角色库 / 规则库 / 规则源状态 / 进入游玩), dashboard (scope DND 2024 / SRD5.2 + XGtE + TCoE, status, completion cards, module launcher), source overview (sourceId + runtime-ready / source-indexed / needs-human-check, display-only), compendium placeholder (counts only; no 507-spell grid), character vault placeholder.
- Completion cards are driven by `DND_CHARACTER_OPTIONS_COMPLETION_REPORT`, `DND_SPELL_INDEX_COUNTS`, and index exports — no scattered hardcoding.
- `PlayWorkspace` delegates to the shell only when system === 'D&D'; the preserved tab workspace renders unchanged as the play view; COC / CP RED untouched.
- zh/en copy added under `dndWorkspace.*`; no rules data, schema, migration, or runtime logic changed.
- Landmark: `AI-LANDMARK: DND_PRODUCT_SHELL_PHASE_1`.

## Scope

### Allowed Files

- `src/pages/dndWorkspace/DndWorkspaceShell.tsx` (new)
- `src/pages/PlayWorkspace.tsx` (delegation wrap only)
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/rules/DND_RULE_COVERAGE.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- COC / CP RED code and data
- DND rules data content
- Creator / Sheet / Gameplay internals
- Store schema / migration
- Platform Shell / Play Menu
- package / Vite / TypeScript config

### Do Not Do

- Real source toggle runtime filtering
- Compendium data grids / 507-spell dump
- Builder / Sheet / Gameplay rewrite, Campaign / GM tools, Marketplace
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `DndWorkspaceShell` / `DndWorkspaceView` / `DndPlayTab`
- `dndWorkspaceView` (PlayWorkspace state)
- `dndWorkspace.*` i18n keys
- `DND_PRODUCT_SHELL_PHASE_1`

### Locate Commands

```powershell
rg -n "DND_PRODUCT_SHELL_PHASE_1|DndWorkspaceShell|dndWorkspaceView|dndWorkspace\." src docs
```

## Completion Criteria

- Entering DND shows the dashboard first; module cards open the preserved Creator / Sheet / Gameplay.
- Source overview shows core + expansions with status labels, display-only.
- Compendium shows index counts only.
- COC / CP RED paths unchanged; no rules data / schema / migration / runtime changes.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
