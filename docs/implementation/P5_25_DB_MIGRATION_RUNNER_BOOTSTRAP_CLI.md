# P5.25-P5.27 DB Migration Runner / Bootstrap / All-Schema Verification CLI

Server-only database tooling: a migration registry + `schema_migrations` history table,
a dry-run-by-default apply/status runner, and a bootstrap + all-schema verification
harness. **Safe by default:** dry-run unless `--apply`, no connection-string output, no
SQL-body output, no destructive rollback, no auto-apply on server startup or `/health`,
no write smokes by default. Files: `server/db/postgresMigrationRegistry.ts`,
`server/db/postgresMigrationRunner.ts`, `server/db/postgresAllSchemaReadiness.ts`,
`server/db/verifyPostgresMigrationStatus.ts`, `server/db/applyPostgresMigrations.ts`,
`server/db/bootstrapPostgresDatabase.ts`, `server/db/verifyPostgresAllSchemas.ts`,
`server/db/migrations/0000_migration_history.sql`.

## Why after P5.22-P5.24

The project accumulated manual migrations `0001`–`0008` with no first-class way to see
what's applied, apply pending ones safely in order, or verify every schema at once. This
slice adds that operator tooling without changing runtime behavior or any repository.

## Migrations & the history table

Existing migrations: `0001_user_identity`, `0002_campaigns`, `0003_actors`,
`0004_asset_metadata`, `0005_runtime_events`, `0006_generated_artifacts_ai_memory`,
`0007_world_servers_membership` (seven tables incl. game systems),
`0008_visibility_scope_rights`. New: `0000_migration_history.sql` creating
`schema_migrations(migration_id PK, filename UNIQUE, checksum, applied_at, execution_ms,
schema_version, applied_by, notes)`. Numbered `0000` so it precedes `0001+`. The runner
**ensures** this table (idempotent `CREATE ... IF NOT EXISTS`) before reading/recording,
and treats `0000` as re-appliable, so it can be recorded applied without double-creating.

## Migration registry

`postgresMigrationRegistry.ts` discovers `*.sql` under `server/db/migrations`, parses the
`NNNN` id from each filename (`NNNN_name.sql`), computes a normalized-content SHA-256
checksum, and returns definitions sorted deterministically by `(id, filename)`. It also
exposes invalid-filename and duplicate-id detection. It never opens a DB connection and
never prints SQL bodies.

## Status / dry-run apply / explicit `--apply`

`getPostgresMigrationStatus()` compares files vs `schema_migrations` and returns per-file
states (`pending`/`applied`/`checksum_mismatch`/`missing_file`/`out_of_order`/`duplicate`)
plus a `blockingIssues` list. `applyPendingPostgresMigrations({ dryRun, targetMigrationId,
maxMigrations })` refuses to run when blocked, plans pending migrations (dry-run lists
them, no writes), and — only with `dryRun:false` — applies each in its own
`BEGIN/COMMIT` transaction (rolling back that one on error and stopping), recording
checksum + execution time. **It fails closed** on checksum mismatch, missing applied
file, out-of-order state, duplicate id, or invalid filename.

## Bootstrap / all-schema verify

`checkAllPostgresSchemaReadiness()` aggregates the eight read-only readiness helpers
(user/campaign/actor/asset/runtime/generated/world/visibility) into `ready` / `partial` /
`not_configured` / `unreachable` / `error`. `bootstrapPostgresDatabase.ts` runs a
dry-run apply (or real apply with `--apply`) then the aggregate. `verifyPostgresAllSchemas.ts`
runs the aggregate + migration status. Neither runs write smokes.

## CLI commands

```
npm run db:migrations:status                       # read-only status (safe)
npm run db:migrations:apply                        # DRY RUN (default)
npm run db:migrations:apply -- --apply             # actually apply, in order
npm run db:migrations:apply -- --target=0008 --max=1
npm run db:bootstrap                               # dry-run apply + readiness
npm run db:bootstrap -- --apply                    # apply + readiness
npm run db:verify:all                              # aggregate readiness + status
npm run db:verify:all -- --strict                  # nonzero unless all ready
```

Flags: `--apply` (required to write), `--dry-run`, `--target=NNNN`, `--max=N`, `--strict`.
Without a configured database every command reports `not_configured` (not an error unless
`--strict` on a mismatch/blocked state).

## Safety rules

No connection string in any output; no SQL bodies in normal output; dry-run default; no
destructive rollback / down migrations; no `/health` apply; no server-startup apply; write
smokes stay manual.

## Expected local workflow

`db:migrations:status` → `db:migrations:apply -- --dry-run` → `db:migrations:apply --
--apply` → `db:verify:all -- --strict` → optionally run individual `db:verify:*:write`
rollback smokes by hand.

## /health

Intentionally **unchanged** — migrations are operator tooling via CLI, never runtime
health. `/health` still shows read-only schema readiness only.

## Not implemented

Down migrations, destructive rollback, remote deploy orchestration, backup/restore, seed
data, production migration locking, provider-specific (Supabase/RDS/Railway) provisioning.

## Future path

Advisory migration lock (`pg_advisory_lock`) for concurrent-apply safety → deploy
preflight → cloud bootstrap → backup-before-migration → seed/dev fixtures → CI migration
check (status `--strict` in CI).
