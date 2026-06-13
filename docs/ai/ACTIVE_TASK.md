# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Workspace Contract Alignment v1
- Name: DND Workspace Contract Alignment v1
- Goal: Align DND workspace top navigation to Platform Workspace Section Contract: only system-level Sections in top nav (overview / actorVault / rulesCompendium / sourceStatus). Remove 'create' (creationMethod) from top nav; keep it accessible via CTAs from overview and actorVault. Add actor flow note clarifying builder/sheet/runtime are Actor-context flows. Add landmark.
- Phase: P1 platform architecture
- Status: Done

## Result Summary

- `src/pages/dndWorkspace/DndWorkspaceShell.tsx`: Added `DND_WORKSPACE_CONTRACT_ALIGNMENT_V1` landmark. Removed `create` entry from `navItems` (now 4 items: dashboard / characters / compendium / sources). Added contract alignment comment above `navItems`. Added `actorFlowNote` paragraph at the bottom of the `create` view section.
- `src/i18n/locales/zh-CN.ts`: Added `dndWorkspace.creation.actorFlowNote`.
- `src/i18n/locales/en.ts`: Added `dndWorkspace.creation.actorFlowNote`.
- `create` view (`dndWorkspaceView='create'`) remains reachable via CTAs in dashboard (empty state) and characters (header button). `DndWorkspaceView` type unchanged. `deriveNodeType` mapping unchanged.
- No COC / CP RED files changed. No store schema, save format, runtime logic, dice algorithm, rule data, React Router, URL routing, or browser History API changed.
- Landmark: `DND_WORKSPACE_CONTRACT_ALIGNMENT_V1` in `src/pages/dndWorkspace/DndWorkspaceShell.tsx`.

## Scope

### Allowed Files

- `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`

### Forbidden Changes

- COC / CP RED related pages
- store schema / migration / CharacterData save structures
- DND rule data / runtime rule logic / dice algorithm / spell preparation logic / class resource logic
- import / export
- Workshop / Plugin / map / token / session / inventory / item data contract
- React Router / URL routing / browser History API
- git add / commit

## Navigation

### Key Symbols

- `DND_WORKSPACE_CONTRACT_ALIGNMENT_V1` — landmark in `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `DND_PRODUCT_SHELL_PHASE_1` — original DND workspace shell landmark (same file)
- `DND_GAMEPLAY_ENTRY_PRESERVATION` — gameplay entry guard (same file)
- `DND_CHARACTER_VAULT_CREATION_METHOD_ENTRY` — creation method entry via CTA (same file)
- `navItems` — 4-item top nav array in `DndWorkspaceShell.tsx`

### Locate Commands

```powershell
rg -n "DND_WORKSPACE_CONTRACT_ALIGNMENT_V1" src
rg -n "navItems" src/pages/dndWorkspace/DndWorkspaceShell.tsx
rg -n "actorFlowNote" src/i18n
```
