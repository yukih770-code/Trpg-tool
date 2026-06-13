# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Platform Core Concepts / Game System Registry Baseline v1
- Name: Platform Core Concepts / Game System Registry Baseline v1
- Goal: Establish platform-level architectural vocabulary and Game System Registry baseline. Documentation and metadata only — no code, store schema, runtime, or rule data changes.
- Phase: P1 platform architecture
- Status: Implemented; docs only, no tsc/build impact expected

## Result Summary

- New file: `docs/architecture/PLATFORM_CORE_CONCEPTS.md`
  - 14 core concept definitions (Game System through UI Theme / Layout Pack)
  - Game System Registry V1 field spec (V1 required / optional / future)
  - Built-in system entries: `dnd5e2024`, `coc7e`, `cpred`
  - Future system categories (Japanese TRPG, Wargame, Custom Boardgame, Narrative)
  - Terminology alignment table
  - Atmospheric Minimalism / 氛围化简约 artistic direction
  - Workshop / Plugin safety model and content layer classification
  - Three-tier workspace IA summary
  - Board Capability Levels L0–L4
  - Dice Profile vocabulary
  - Landmark: `PLATFORM_CORE_CONCEPTS_GAME_SYSTEM_REGISTRY_BASELINE`
- Updated: `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/SYMBOL_MAP.md`, `docs/ai/TASK_ARCHIVE.md`
- No src/ files modified. No store, schema, migration, runtime, or rule data changed.

## Scope

### Allowed Files

- `docs/architecture/PLATFORM_CORE_CONCEPTS.md` (new)
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
- Any src/ file
- Game System engine implementation
- Plugin execution
- Workshop subscription
- git add / commit

## Navigation

### Key Symbols

- `PLATFORM_CORE_CONCEPTS_GAME_SYSTEM_REGISTRY_BASELINE`
- Full doc: `docs/architecture/PLATFORM_CORE_CONCEPTS.md`

### Locate Commands

```powershell
rg -n "PLATFORM_CORE_CONCEPTS_GAME_SYSTEM_REGISTRY_BASELINE" docs
```

## Completion Criteria

- `docs/architecture/PLATFORM_CORE_CONCEPTS.md` exists with all 14 concepts, registry field spec, three system entries, terminology alignment, artistic direction, safety model, and landmark comment.
- `docs/ai/SYMBOL_MAP.md` references the new doc and landmark.
- `PROJECT_STATUS.md` records the task as completed.
- `TEST_CHECKLIST.md` has a Platform Core Concepts Baseline Check section.
- No src/ file was modified.
- `npx tsc --noEmit` and `npm run build` still pass (no src/ changes).

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
