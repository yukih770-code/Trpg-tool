# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Rule Metadata Application v1
- Name: DND Rule Metadata Application v1
- Goal: apply source/trust metadata to existing DND data before any content correction.
- Phase: P1 Rules Runtime Closure / data integrity hardening
- Status: Implemented; verification pending

## Result Summary

- Extended the shared rule data metadata contract with DND5eChm source IDs, DND trust levels, and usage policy.
- Added module-level metadata constants for legacy DND classes, races/species, spells, feats, and backgrounds.
- Added source-labeled display-only metadata for the DND equipment sample.
- Added `needs-human-check` runtime-active metadata for DND class progression data.
- No rule content, Creator, Gameplay, Sheet, store schema, migration, backend, or P2 work.
- Landmark: `AI-LANDMARK: DND_RULE_METADATA_APPLICATION`.

## Scope

### Allowed Files

- `src/lib/rules/rule-data-metadata.ts`
- `src/data/classes.ts`
- `src/data/races.ts`
- `src/data/spells.ts`
- `src/data/feats.ts`
- `src/data/backgrounds.ts`
- `src/data/dnd2024/classProgression.ts`
- `src/data/dnd2024/equipment.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/rules/DND_RULE_COVERAGE.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- Creator / Gameplay / Sheet behavior
- DND / COC / CP RED Gameplay rule logic
- Market behavior
- Store schema / migration
- COC and CP RED data
- Platform Shell
- package / Vite / TypeScript config
- Backend, storage adapter, multiplayer, AI Host, P2

### Do Not Do

- Add new rule content
- Fill official tables
- Copy official rules text
- Delete or quarantine existing data
- Correct names, translations, rules text, spell effects, class features, background/species/feat mechanics, or progression values
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `DND_RULE_METADATA_APPLICATION`
- `DND_CLASS_DATA_ACCURACY`
- `DND_RACE_DATA_ACCURACY`
- `DND_SPELL_DATA_ACCURACY`
- `DND_FEAT_DATA_ACCURACY`
- `DND_BACKGROUND_DATA_ACCURACY`
- `DND_EQUIPMENT_DATA_ACCURACY`
- `DND_CLASS_PROGRESSION_ACCURACY`

### Locate Commands

```powershell
rg -n "DND_RULE_METADATA_APPLICATION|DND_.*_DATA_ACCURACY|DND_CLASS_PROGRESSION_ACCURACY|RuleDataUsagePolicy" src docs PROJECT_STATUS.md TEST_CHECKLIST.md
```

## Completion Criteria

- Shared metadata type supports DND source IDs, DND trust levels, and usage policy.
- Legacy DND data files export accuracy metadata without changing data content.
- DND equipment sample and class progression export accuracy metadata.
- Status/checklist/SYMBOL_MAP/TASK_ARCHIVE are updated.
- No rule content or data entries are corrected, added, or removed.
- No gameplay, creator, sheet, market, store schema, or migration behavior changed.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
