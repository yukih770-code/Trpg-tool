# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Class / Subclass Correction v1
- Name: DND Class / Subclass Correction v1
- Goal: apply source/trust metadata to DND class and subclass data without correcting rule content or changing runtime behavior.
- Phase: P1 Rules Runtime Closure / DND data integrity correction
- Status: Implemented; verification pending

## Result Summary

- `ClassDef` and `SubclassDef` now support optional `id` / `ruleMeta` provenance fields.
- Existing `CLASS_DATA` entries are retained and enriched with owner-source, XGtE/TCoE, needs-human-check, or out-of-source metadata.
- `破誓者` is explicitly marked out-of-source / quarantine.
- XGtE/TCoE subclass source labels were added where the owner manifest supports them; name conflicts remain marked for human confirmation.
- 2014/2024 conflict areas such as wizard schools, cleric domains, and warlock level-1 subclass timing are marked `needs-human-check`.
- `classProgression`, Creator, Sheet, Gameplay, Action Registry, store schema, and migration behavior were not changed.
- Landmark: `AI-LANDMARK: DND_CLASS_SUBCLASS_CORRECTION`.

## Scope

### Allowed Files

- `src/lib/dnd-types.ts`
- `src/data/classes.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/rules/DND_RULE_COVERAGE.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- COC code or data
- CP RED code or data
- Platform Shell / Play Menu
- DND species/background data
- DND spells, feats, equipment data
- `src/data/dnd2024/classProgression.ts` values
- Creator / Gameplay / Sheet behavior
- Store schema / migration
- Backend / P2

### Do Not Do

- Delete class/subclass entries
- Add full class/subclass mechanics
- Correct subclass feature text or unlock levels
- Use model memory, BG3, third-party wiki, or unspecified web sources
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `DND_CLASS_SUBCLASS_CORRECTION`
- `DND_CLASS_DATA_ACCURACY`
- `DND_CLASS_SOURCE_GAP_REPORT`
- `CLASS_METADATA_BY_NAME`
- `SUBCLASS_METADATA_BY_CLASS`
- `ClassDef.ruleMeta`
- `SubclassDef.ruleMeta`

### Locate Commands

```powershell
rg -n "DND_CLASS_SUBCLASS_CORRECTION|DND_CLASS_SOURCE_GAP_REPORT|CLASS_METADATA_BY_NAME|SUBCLASS_METADATA_BY_CLASS|ruleMeta" src/data/classes.ts src/lib/dnd-types.ts docs
```

## Completion Criteria

- Class/subclass data carries source/trust metadata.
- Legacy/out-of-source subclasses remain retained but are not presented as verified owner-source data.
- XGtE / TCoE source-labeled subclasses are marked with the correct source family or needs-human-check naming notes.
- Missing owner-source class gap is recorded without adding runtime behavior.
- No classProgression values, Creator behavior, Gameplay logic, Action Registry behavior, schema, or migration changed.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
