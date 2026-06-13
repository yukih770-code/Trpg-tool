# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Legacy Runtime Embedded Mode v1
- Name: Legacy Runtime Embedded Mode v1
- Goal: Hide legacy COC / CP RED runtime page chrome when those runtimes are embedded inside the new workspace shells, preserving the actual creator / sheet / runtime / market content.
- Phase: P1 platform IA / workspace shell cleanup
- Status: Implemented; verification pending

## Result Summary

- Added optional `embedded?: boolean` props to `CocGameplay` and `CpGameplay`.
- `CocGameplay embedded` hides the old gameplay title strip while preserving runtime panels and RollConsole.
- `CpGameplay embedded` hides the old combat runtime hero strip while preserving RollConsole, checks, damage, critical injury, dice tray, and role ability panels.
- Replaced the non-DND legacy `PlayWorkspace` toolbar/tab shell with an embedded content body owned by `CocWorkspaceShell` / `CpWorkspaceShell`.
- Workspace shells remain the only visible system navigation when COC / CP RED play sections are open.
- No store schema, save format, runtime rule logic, dice algorithm, rule data, browser routing, Workshop, map, inventory, or session logic changed.
- Landmark: `LEGACY_RUNTIME_EMBEDDED_MODE`.

## Scope

### Allowed Files

- `src/pages/CocGameplay.tsx`
- `src/pages/CpGameplay.tsx`
- `src/pages/PlayWorkspace.tsx`
- `src/pages/cocWorkspace/CocWorkspaceShell.tsx`
- `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Changes

- Store schema / migration
- CharacterData / Investigator / CP RED save structures
- Runtime rule logic / dice algorithms
- DND / COC / CP RED rule data
- True multi-character store
- True Rules Compendium or Source Manager engines
- Workshop / Plugin
- Map / backpack / items / Token / Session data contracts
- Browser URL routing / React Router
- git add / commit

## Navigation

### Key Symbols

- `LEGACY_RUNTIME_EMBEDDED_MODE` — landmark in embedded runtime and workspace shell handoff points.
- `CocGameplay({ embedded })` — `src/pages/CocGameplay.tsx`
- `CpGameplay({ embedded })` — `src/pages/CpGameplay.tsx`
- `embeddedPlayBody` — `src/pages/PlayWorkspace.tsx`
- `CocWorkspaceShell` — `src/pages/cocWorkspace/CocWorkspaceShell.tsx`
- `CpWorkspaceShell` — `src/pages/cpWorkspace/CpWorkspaceShell.tsx`

### Locate Commands

```powershell
rg -n "LEGACY_RUNTIME_EMBEDDED_MODE" src docs
rg -n "embedded\\?: boolean|embeddedPlayBody|<CocGameplay embedded|<CpGameplay embedded" src
```

## Completion Criteria

- COC Workspace has only one visible navigation shell.
- COC embedded play sections no longer show old import/export/data/settings/help or old Creation / Sheet / Gameplay tabs.
- CP RED Workspace has only one visible navigation shell.
- CP RED embedded play sections no longer show old import/export/data/settings/help or old Creation / Sheet / Gameplay / Market tabs.
- Existing COC / CP RED runtime components and dice behavior remain preserved.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
