# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Local CHM Source Authority + Full Coverage Audit v1
- Name: DND Local CHM Source Authority + Full Coverage Audit v1
- Goal: register the local CHM extraction as primary DND source authority and document the new full coverage baseline without changing runtime data.
- Phase: P1 DND source integrity / coverage baseline
- Status: Implemented; verification commands pending local run

## Result Summary

- Local CHM extracted source at `C:\TRPG_CHM_WORK\extracted` is now documented as the primary authoritative DND source (`dnd-local-chm-primary`).
- GitHub DND5eChm / SRD5.2Chm sources are secondary cross-check; official references are optional supplements only.
- Full coverage audit baseline added to `docs/rules/DND_RULE_COVERAGE.md`.
- Corrected source baselines:
  - Species: 10 PHB 2024 entries, including `阿斯莫`.
  - Backgrounds: 16 standard PHB 2024 backgrounds; previous 4-entry sparse baseline is superseded.
  - Spells: 507 CHM headings across PHB 2024 / TCoE / XGtE.
- No runtime data, `src/data/*`, Creator, Sheet, Gameplay, store schema, migration, COC, CP RED, or Platform behavior changed.
- Landmarks: `DND_LOCAL_CHM_PRIMARY_SOURCE_AUTHORITY`, `DND_LOCAL_CHM_FULL_COVERAGE_AUDIT`.

## Scope

### Allowed Files

- `docs/rule-sources/RULE_SOURCE_MANIFEST.md`
- `docs/rule-sources/DND_SOURCES.md`
- `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`
- `docs/rules/DND_RULE_COVERAGE.md`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- `src/data/*`
- DND Creator / Sheet / Gameplay
- Store schema / migration
- COC / CP RED code and data
- Platform Shell

### Do Not Do

- Import CHM entries into runtime data
- Copy long rule text
- Use BG3, third-party wiki, model memory, or unspecified web sources
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `DND_LOCAL_CHM_PRIMARY_SOURCE_AUTHORITY`
- `DND_LOCAL_CHM_FULL_COVERAGE_AUDIT`
- `dnd-local-chm-primary`

### Locate Commands

```powershell
rg -n "DND_LOCAL_CHM_PRIMARY_SOURCE_AUTHORITY|DND_LOCAL_CHM_FULL_COVERAGE_AUDIT|dnd-local-chm-primary" docs
```

## Completion Criteria

- Source policy clearly makes local CHM the DND primary authority.
- Full coverage audit baseline records corrected species/background/spell/equipment/class gaps.
- Runtime files and app behavior remain untouched.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
