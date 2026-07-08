# P5.14 RuntimeEvent DB Persistence — First Slice

Server-only append-only RuntimeEvent persistence foundation, mirroring the User /
Campaign / Actor / Asset first slices. **Long-term persistence only — the Room
Server remains the live runtime authority.** No frontend sync, no WebSocket change,
no Runtime API, no live-event persistence, no AI Memory / Session Recap /
GeneratedArtifact, no auth.

## DDL — `server/db/migrations/0005_runtime_events.sql`

Two tables. Manual DDL (no runner/auto-create). Apply **after** 0001, 0002, 0003.

`runtime_sessions`: `runtime_session_id` PK, `campaign_id` FK→campaigns (CASCADE),
`host_user_id` FK→users (SET NULL), `room_id`, `title`, `status` (default 'active'),
`session_payload` JSONB, `schema_version`, `started_at`, `ended_at`, `created_at`,
`updated_at`, `archived_at`. Indexes: campaign_id, (campaign_id, updated_at DESC),
host_user_id. Sessions are mutable lifecycle rows (end/archive/restore).

`runtime_events` (**append-only**): `runtime_event_id` PK, `runtime_session_id`
FK→runtime_sessions (CASCADE), `campaign_id` FK→campaigns (CASCADE), `seq` BIGINT,
`event_kind`, `visibility` (default 'private'), `actor_id` FK→actors (SET NULL),
`caused_by_event_id` self-FK (SET NULL), `idempotency_key`, `event_payload` JSONB,
`schema_version`, `created_by_user_id` FK→users (SET NULL), `created_at`.
**Intentionally NO `updated_at` / `archived_at`.** Constraints:
`UNIQUE(runtime_session_id, seq)` and a partial `UNIQUE(runtime_session_id,
idempotency_key) WHERE idempotency_key IS NOT NULL`. Indexes: (session, seq),
(campaign, created_at), event_kind, actor_id.

## Append-only semantics · runtime_sessions vs runtime_events

`runtime_sessions` is a mutable container (status/lifecycle). `runtime_events` is an
immutable append log: the repository never UPDATEs or DELETEs an event.
**Corrections and tombstones are future event rows** (linked via
`caused_by_event_id`), never in-place edits — matching the local RuntimeLog rule.

## seq per session · idempotency · afterSeq pagination

`seq` is **per-session monotonic**, allocated transactionally: within a transaction
the repo runs `SELECT COALESCE(MAX(seq),0)+1 FROM runtime_events WHERE
runtime_session_id=$1`, then inserts; `UNIQUE(session, seq)` guards races.
`idempotency_key` de-duplicates: `appendRuntimeEvent` pre-checks for an existing
event with the same `(session, key)` and returns it instead of inserting; a lost
race surfaces as a `23505` on the idempotency index, which is caught and resolved by
returning the existing row. Reads use an **afterSeq cursor** (`seq > $afterSeq`,
`ORDER BY seq ASC`) — never OFFSET.

## Repository — `server/adapters/postgresRuntimeEventRepository.ts`

Safe result union, injectable executor, DB error mapping (no raw driver errors).
Sessions: `getRuntimeSessionById`, `listRuntimeSessionsByCampaign`,
`createRuntimeSession`, `endRuntimeSession`, `archiveRuntimeSession`,
`restoreRuntimeSession`. Events: `getRuntimeEventById`, `listRuntimeEvents`
(`afterSeq`/`limit`/`eventKind`/`visibility`/`actorId`), `appendRuntimeEvent`,
`checkReadiness`. `appendRuntimeEvent` opens its own transaction when
`useInternalTransactions` is true (default); smoke tests pass an already-transactional
client with `false` so the seq allocation + insert run on the caller's transaction.
Error kinds: not_configured, schema_missing (42P01), conflict (23505/23503,
retryable on seq race), database_error (retryable ECONN*), unknown.

## Schema readiness — `server/db/postgresRuntimeEventSchemaReadiness.ts`

Statuses: `not_configured` | `unreachable` | `user_schema_missing` |
`campaign_schema_missing` | `actor_schema_missing` | `schema_missing` | `ready` |
`error`. Reuses the Actor readiness (chains User) and Campaign readiness helpers to
classify FK-dependency gaps, then verifies both runtime tables + required columns.
Never creates tables or prints the connection string.

## Read-only smoke — `server/db/postgresRuntimeEventRepositorySmoke.ts`

health → readiness → harmless nonexistent-id probes for a session, an event, and an
empty `listRuntimeEvents` on a nonexistent session (empty is not an error). Writes
nothing. Runner: `verifyPostgresRuntimeEventSlice.ts` → `npm run db:verify:runtime`.

## Rollback append smoke — `server/db/postgresRuntimeEventRepositoryWriteSmoke.ts`

One transaction: create smoke user + campaign + actor + runtime session → append A
(assert seq 1) → append B (assert seq 2, with actor_id + caused_by) → append C with
idempotency key (assert seq 3) → retry same key with a different id (assert it
returns C: same id + seq, no new row) → getById → listRuntimeEvents afterSeq 0
(assert 3) → afterSeq 1 (assert 2) → end → archive → restore → **always ROLLBACK**.
Because it uses `useInternalTransactions:false`, every append stays on the outer
transaction (no nested connection). Runner:
`verifyPostgresRuntimeEventWriteSmoke.ts` → `npm run db:verify:runtime:write`.

## Verification commands

```
npm run db:verify:runtime          # read-only; not_configured OK without local Postgres
npm run db:verify:runtime:write    # rollback-only; not_configured OK
```

- **not_configured:** DB env unset — expected, not faked.
- **schema_missing / user_/campaign_/actor_schema_missing:** apply 0001–0003 then
  0005 first.

## Relationship & boundaries

Same pattern/primitives/envelope as the prior slices; depends on User, Campaign, and
Actor schemas. **The DB is long-term persistence, not the live authority** — the
Room Server keeps live runtime authority, and nothing here is wired to the WebSocket
protocol or live broadcast. `host_user_id` records the session host (distinct from a
campaign's `owner_id`). `/health` gains `database.runtimeEventSchema` (readiness
status only; light information_schema read, cacheable/removable later).

## Out of scope (unchanged)

Frontend RuntimeLog persistence, Runtime API routes, Room Server event-persistence
integration, WebSocket changes, live runtime snapshots/checkpoints, GeneratedArtifact
DB, AI Memory / embeddings / vector search, Session Recap generation, auth/session,
permission model, migration runner, auto-create, destructive SQL.
