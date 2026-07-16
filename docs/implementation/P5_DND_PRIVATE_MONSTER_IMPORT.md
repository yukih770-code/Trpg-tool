# P5.DND-PRIVATE-MONSTER-IMPORT

## Purpose

This slice provides a private, local DND monster-template library for a specific World Server. It does not ship, seed, publish, or distribute monster content.

## Privacy and Rights Boundary

- Imported records are stored in `dnd_private_monster_templates` with `visibility = private` enforced by the database.
- Records are scoped to one `world_server_id`; API reads require World Server access and writes require existing server-management permission.
- The repository stores structured fields and a short source hash only. It never stores raw input files or local folder paths.
- Importer source content is never placed in `src/`, `docs/`, seed files, fixtures, migrations, or tests.

## Local Importer

Set local-only process values, or pass equivalent CLI flags:

```powershell
$env:DND_PRIVATE_MONSTER_IMPORT_DIR = 'D:\REPLACE_WITH_MY_LOCAL_MONSTER_FOLDER'
$env:DND_PRIVATE_MONSTER_WORLD_SERVER_ID = '<world-server-id>'
$env:DND_PRIVATE_MONSTER_CREATED_BY_USER_ID = '<local-user-id>'
npm run dnd:monster-import:dry-run
```

Run `npm run dnd:monster-import:apply` only after dry-run validation is satisfactory. Supported formats are JSON, JSONL, and simple CSV. Markdown is explicitly reported as unsupported in this slice; PDFs, images, and unstructured text are not OCR'd or inferred.

The importer prints only aggregate counts and file-level parse reasons. It does not print stat blocks, raw content, or secrets.

## UI and Runtime Integration

The DND workspace has a private monster library with search, compact stat summaries, manual creation, archive, combat prefill, actor-draft creation, and action-to-dice prefill. Adding a monster only pre-fills the existing local combat form. It does not apply damage, create a full rules engine, or make a live-sync change.

## Verification

- `db:verify:dnd-monsters` is read-only.
- `db:verify:dnd-monsters:write` uses synthetic Training Goblin data inside a rollback transaction.
- `frontend:verify:dnd-monsters` verifies JSON, JSONL, CSV, and unsupported-format parsing with synthetic names only.

## Deferred

HP/damage application, grid measurement, spellcasting-lite behavior, a private compendium-pack workflow, live synchronization, upload/object storage, and public sharing are explicitly deferred.
