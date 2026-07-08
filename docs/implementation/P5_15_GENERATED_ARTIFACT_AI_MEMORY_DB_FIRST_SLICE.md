# P5.15 GeneratedArtifact / AI Memory DB — First Slice

Server-only persistence foundation for AI-generated outputs and curated AI memory,
mirroring the User / Campaign / Actor / Asset / RuntimeEvent first slices. **Stores
outputs + curated memory only — generates nothing, calls no model, runs no
embeddings / vector search, performs no AI context retrieval.** No frontend, no API
routes, no WebSocket change, no permission enforcement, no auth.

## DDL — `server/db/migrations/0006_generated_artifacts_ai_memory.sql`

Three tables. Manual DDL (no runner/auto-create). Apply **after** 0001–0005.

`generated_artifacts`: `artifact_id` PK, `owner_id` FK→users (CASCADE), optional
`campaign_id`→campaigns (SET NULL), `runtime_session_id`→runtime_sessions (SET NULL),
`runtime_event_id`→runtime_events (SET NULL), `artifact_kind`, `title`, `summary`,
`content_format` (default 'json'), `visibility_scope` (default 'user_private'),
`artifact_payload` / `source_payload` / `model_payload` JSONB, `schema_version`,
timestamps, `archived_at`. Curated (updatable/archivable).

`ai_memory_entries`: `memory_entry_id` PK, `owner_id` FK→users (CASCADE), optional
`campaign_id`, `runtime_session_id`, `source_artifact_id`→generated_artifacts
(SET NULL), `memory_kind`, `memory_scope` (default 'campaign'), `title`,
`content_text` NOT NULL, `visibility_scope` (default 'campaign'), `memory_payload` /
`source_payload` JSONB, `confidence` NUMERIC, `schema_version`, timestamps,
`archived_at`. Curated.

`ai_context_sources` (**append-only** provenance links; no updated_at/archived_at):
`context_source_id` PK, `owner_id` FK→users (CASCADE), optional `campaign_id`,
`artifact_id`→generated_artifacts (CASCADE), `memory_entry_id`→ai_memory_entries
(CASCADE), `source_kind`, `source_ref_id`, `source_payload` JSONB, `schema_version`,
`created_at`.

Indexes: owner/campaign/runtime/kind/scope/updated_at/archived on the two curated
tables; owner/campaign/artifact/memory/kind/ref on context sources.

## generated_artifacts vs ai_memory_entries vs ai_context_sources

- **generated_artifacts** = a produced AI output (session recap, host note, NPC
  draft, scene description, handout, rules summary, import draft). `artifact_kind`
  labels the output type; the body lives in `artifact_payload`.
- **ai_memory_entries** = a *curated* memory record derived from artifacts/events
  (a campaign fact, NPC note, running summary). `memory_kind` labels the memory
  type; `memory_scope` (campaign/user/session/…) says how broadly it applies;
  `content_text` is the retrievable text; `confidence` is optional curation signal.
- **ai_context_sources** = append-only provenance: which source (`source_kind` +
  `source_ref_id`, e.g. a runtime_event or another artifact) an artifact or memory
  entry was derived from. Provenance links, not sharing.

## Scope metadata · source_payload / model_payload

`visibility_scope` / `memory_scope` are **stored metadata for future scope
enforcement, NOT a permission system** — nothing in this slice reads them to gate
access. AI memory is **curated persistence, never automatic global assistant
memory**, and must not be public by default (defaults are `user_private` /
`campaign`). `source_payload` records provenance inputs; `model_payload` records
model/prompt metadata — **no model is ever called here**; these are just fields.

## Repository — `server/adapters/postgresGeneratedArtifactRepository.ts`

Safe result union, injectable executor, DB error mapping (no raw driver errors).
Artifacts: getById, listByOwner/Campaign/RuntimeSession (`artifactKind`/
`visibilityScope`/`includeArchived`/`limit`), create, update (COALESCE partial),
archive, restore. Memory entries: getById, listByOwner/Campaign/RuntimeSession
(`memoryKind`/`memoryScope`/`visibilityScope`/`includeArchived`/`limit`), create,
update, archive, restore. Context sources (append-only): getById,
listForArtifact, listForMemoryEntry, create. `checkReadiness`. Callers supply
opaque ids. Error kinds: not_configured, schema_missing (42P01), conflict
(23505/23503), database_error (ECONN*), unknown.

## Schema readiness — `server/db/postgresGeneratedArtifactSchemaReadiness.ts`

Statuses: `not_configured` | `unreachable` | `user_schema_missing` |
`campaign_schema_missing` | `runtime_event_schema_missing` | `schema_missing` |
`ready` | `error`. Reuses RuntimeEvent readiness (which chains User→Campaign→Actor
→Runtime) to classify upstream gaps (actor/runtime gaps collapse to
`runtime_event_schema_missing`), then verifies the three tables + required columns.
Never creates tables or prints the connection string.

## Read-only smoke — `server/db/postgresGeneratedArtifactRepositorySmoke.ts`

health → readiness → nonexistent-id probes for an artifact, a memory entry, and a
context source (expect null). Writes nothing. Runner:
`verifyPostgresGeneratedArtifactSlice.ts` → `npm run db:verify:generated`.

## Rollback write smoke — `server/db/postgresGeneratedArtifactRepositoryWriteSmoke.ts`

One transaction: create smoke user→campaign→actor→runtime session→runtime event →
generated artifact (linked to owner/campaign/session/event) → getById + list by
owner/campaign/session → update → memory entry (linked to artifact) → getById + list
by owner/campaign/session → update → two context sources (one for the artifact, one
for the memory) → list for artifact + for memory → archive/restore artifact →
archive/restore memory → **always ROLLBACK**. Uses `useInternalTransactions:false`.
Runner: `verifyPostgresGeneratedArtifactWriteSmoke.ts` →
`npm run db:verify:generated:write`.

## Verification commands

```
npm run db:verify:generated          # read-only; not_configured OK without local Postgres
npm run db:verify:generated:write    # rollback-only; not_configured OK
```

- **not_configured:** DB env unset — expected, not faked.
- **schema_missing / user_/campaign_/runtime_event_schema_missing:** apply 0001–0006 first.

## Relationship & boundaries

Same pattern/primitives/envelope as the prior slices; depends on User, Campaign, and
RuntimeEvent schemas. **RuntimeEvent stays append-only and the live Room Server stays
runtime authority** — this DB is long-term persistence, not live authority.
`/health` gains `database.generatedArtifactSchema` (readiness status only; reuses the
runtime readiness chain, so it is a heavier readiness read — cacheable/removable
later). Private/server/campaign/public scope enforcement is deferred to future
Visibility / Permission / AI Context Scope Guard work.

## Out of scope (unchanged)

AI generation / model calls / prompt execution, embeddings, vector DB, semantic
search, AI context retrieval, AI context scope guard, session recap generation,
frontend UI, GeneratedArtifact API routes, RuntimeEvent live-persistence integration,
WebSocket changes, auth/session, permission/membership/world-server model, compendium
import UI, migration runner, auto-create, destructive SQL.
