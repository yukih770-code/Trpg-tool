# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Owner Source Entry Manifest Build v1
- Name: DND Owner Source Entry Manifest Build v1
- Goal: build an entry-level DND manifest from owner-confirmed `SRD5.2Chm` and `DND5e_chm` sources without modifying app rule data.
- Phase: P1 Rules Runtime Closure / data integrity hardening
- Status: Implemented; verification pending

## Result Summary

- Cloned/read owner-confirmed DND sources outside the project under `D:\TRPG-Rule-Sources`.
- Added `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`.
- Manifest records classes, subclasses, species/races, backgrounds, feat source files, spell heading IDs, equipment category files, and class-resource/progression source paths.
- Spell effect text is source-referenced only; future full effect text should use safe structured fields or private/local import.
- No app rule data, Creator, Gameplay, Sheet, store schema, migration, backend, or P2 work.

## Scope

### Allowed Files

- `docs/rule-sources/RULE_SOURCE_MANIFEST.md`
- `docs/rule-sources/DND_SOURCES.md`
- `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`
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
- Copy spell effect prose or long rules text into the public project
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `RULE_SOURCE_AUTHORITY_POLICY`
- `DND5eChm`
- `DND_OWNER_SOURCE_ENTRY_MANIFEST`
- `dnd5echm-srd52-primary`
- `dnd5echm-xgte`
- `dnd5echm-tcoe`
- `missing`
- `out-of-source`
- `needs-human-check`

### Locate Commands

```powershell
rg -n "DND_OWNER_SOURCE_ENTRY_MANIFEST|dnd5echm-srd52-primary|dnd5echm-xgte|dnd5echm-tcoe|Effect Text Policy" docs/rule-sources docs/ai PROJECT_STATUS.md TEST_CHECKLIST.md
```

## Completion Criteria

- DND entry-level owner source manifest exists.
- Manifest uses only owner-confirmed DND sources: `SRD5.2Chm` and `DND5e_chm`.
- Manifest does not use BG3, third-party wiki, model memory, or unspecified web sources.
- Manifest records spell effect source policy without copying long effect text.
- Status/checklist/SYMBOL_MAP/TASK_ARCHIVE are updated.
- Rule data files remain untouched.
- No gameplay, creator, sheet, market, store schema, or migration behavior changed.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
