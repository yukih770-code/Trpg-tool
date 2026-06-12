# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Project Rule Source Authority Policy v1
- Name: Project Rule Source Authority Policy v1
- Goal: establish owner-provided GitHub / PDF rule sources as the authoritative source layer for future rule data audit and correction.
- Phase: P1 Rules Runtime Closure / data integrity hardening
- Status: Implemented; verification pending

## Result Summary

- Added source authority policy to the rule source manifest.
- Recorded owner-provided sources as authoritative over existing app data, old AI-generated data, model memory, third-party sources, and general web search.
- Recorded DND owner-provided root source `https://github.com/DND5eChm` while keeping repository-level source selection subject to owner confirmation.
- Defined conflict, `missing`, `out-of-source`, and `needs-human-check` handling.
- No rule data, Creator, Gameplay, Market, store schema, migration, backend, or P2 work.
- Landmark: `AI-LANDMARK: RULE_SOURCE_AUTHORITY_POLICY`.

## Scope

### Allowed Files

- `docs/rule-sources/RULE_SOURCE_MANIFEST.md`
- `docs/rule-sources/DND_SOURCES.md`
- `docs/rule-sources/COC_SOURCES.md`
- `docs/rule-sources/CPRED_SOURCES.md`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- Existing rule data files
- DND / COC / CP RED Gameplay rule logic
- Creator behavior
- Market behavior
- Store schema / migration
- package / Vite / TypeScript config
- Backend, storage adapter, multiplayer, AI Host, P2

### Do Not Do

- Add new rule content
- Fill official tables
- Copy official rules text
- Delete or quarantine existing data
- Select a single DND subrepository as the sole canonical source without owner confirmation
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `RULE_SOURCE_AUTHORITY_POLICY`
- `DND5eChm`
- `missing`
- `out-of-source`
- `needs-human-check`

### Locate Commands

```powershell
rg -n "RULE_SOURCE_AUTHORITY_POLICY|owner-provided|DND5eChm|out-of-source|needs-human-check" docs/rule-sources docs/ai PROJECT_STATUS.md TEST_CHECKLIST.md
```

## Completion Criteria

- Rule source manifest includes owner-provided source authority policy.
- DND source manifest records `https://github.com/DND5eChm` without selecting a sole subrepository.
- COC / CP RED manifests define pending or partial owner-source authority boundaries.
- Status/checklist/SYMBOL_MAP/TASK_ARCHIVE are updated.
- Rule data files remain untouched.
- No gameplay, creator, market, store schema, or migration behavior changed.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
