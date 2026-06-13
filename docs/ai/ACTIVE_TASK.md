# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Platform Pattern + Workspace Section Contract v1
- Name: Platform Pattern + Workspace Section Contract v1
- Goal: Establish the platform-level Pattern and Workspace Section Contract baseline so DND / COC / CP RED / future systems implement platform patterns instead of copying one another. Docs only.
- Phase: P1 platform architecture
- Status: Done (docs only; no src change)

## Result Summary

- New document `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` defines 9 platform patterns, the 9-entry Workspace Section Contract with implemented/planned/absent three-state semantics, top-navigation rules, Builder/Sheet/Runtime pattern detail, Rules Compendium vs Source Status boundary, Navigation Back/Up/Breadcrumb concept (implementation deferred), future-extension coverage, high-risk boundary list, and a Codex/CC pre-implementation acceptance template.
- Complements `docs/architecture/PLATFORM_CORE_CONCEPTS.md` (vocabulary/registry) with the pattern + contract layer (how systems surface objects in UI/IA).
- Landmark: `PLATFORM_PATTERNS_WORKSPACE_CONTRACT_V1`.
- No `src/`, store schema, migration, runtime logic, dice algorithm, rule data, import/export, routing, workshop, map, inventory, or session implementation changed.

## Scope

### Allowed Files

- `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` (new)
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`

### Forbidden Changes

- `src/` (any UI component, store, type, data, i18n)
- store schema / migration / save format
- runtime rule logic / dice algorithm
- rule data
- import / export
- React Router / URL routing
- Workshop / Plugin / map / token / session / inventory / item
- git add / commit

### Do Not Do

- Implement any pattern in code this round (docs only).
- Resume or commit the paused CP RED / COC Builder BG3-like shells as final pattern implementations.
- `git add .` / `git add -A` / auto commit.

## Navigation

### Key Symbols

- `PLATFORM_PATTERNS_WORKSPACE_CONTRACT_V1` — landmark in `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`

### Locate Commands

```powershell
rg -n "PLATFORM_PATTERNS_WORKSPACE_CONTRACT_V1" docs
```

## Completion Criteria

- New doc exists and defines 9 patterns + 9-section contract + three-state + nav concept + high-risk + acceptance template.
- DND is described as a reference implementation, not a hard template.
- Future-system extension is covered.
- Owner docs updated.
- No `src/` change.

## Verification

```powershell
cd D:\Download\dnd
git status --short
```

Expected: only documentation files changed (no `src/`). `tsc` / `build` not required this round (no code change).
