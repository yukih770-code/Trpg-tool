# Postgres Actor / Character Vault Repository — First Slice v1 (P5.12A-C)

Server-only Actor / Character Vault database foundation, mirroring the User and
Campaign first slices. **Long-term character-sheet asset persistence only — NOT the
Campaign Actor Instance and NOT live runtime authority.** No frontend sync, no Actor
API routes, no campaign binding, no runtime state, no auth.

## DDL — `server/db/migrations/0003_actors.sql`

Manual DDL (no runner, no auto-create). Apply **after** `0001_user_identity.sql`.

```
actors(
  actor_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  system_id TEXT NOT NULL,
  local_actor_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  actor_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
)
UNIQUE(owner_id, system_id, local_actor_id)
indexes: (owner_id), (system_id), (updated_at DESC), (owner_id, archived_at)
```

### Origin key and identity

`actor_id` is the **global opaque cloud id** (caller-provided, `actor_<uuid>`).
`local_actor_id` is the **migration/source-origin id** taken from the local
per-system character store — it is **not globally unique** (ids collide across
users and systems), so the durable origin key is the composite
`UNIQUE(owner_id, system_id, local_actor_id)`. `system_id` distinguishes
`dnd5e-2024` / `coc7e` / `cp-red` / future systems.

### Full-sheet JSONB payload strategy

Character sheets differ radically per system (DND classes/levels, COC
skills/sanity, CP RED role/humanity). Rather than relationalize every field for
every system now, the **entire sheet is stored in `actor_payload JSONB`** with a
`schema_version`. Queryable/display fields (`display_name`, `system_id`,
`owner_id`, timestamps, `archived_at`) are promoted to columns; everything else
stays in the payload. Relationalizing specific fields is a deliberate later step.

## Repository — `server/adapters/postgresActorRepository.ts`

Same style as the User/Campaign repositories: safe result union
(`PostgresActorRepositoryResult<T>`), injectable `executor` (transaction-friendly),
and DB error mapping that never leaks raw driver errors.

Methods: `getActorById`, `getActorByOrigin(ownerId, systemId, localActorId)`,
`listActorsByOwner(ownerId, {systemId, includeArchived, limit})`, `createActor`
(caller supplies the opaque `actor_id`), `updateActor` (COALESCE partial update of
display_name + payload), `archiveActor` (sets `archived_at`), `restoreActor`
(clears `archived_at`), `checkReadiness`. `createPostgresActorRepository(executor?)`
+ a default instance + top-level convenience exports.

Lifecycle here is a single `archived_at` timestamp (NULL = active); the Campaign
slice's richer `lifecycle_status` is not needed for the Vault yet.

Error mapping: `not_configured` (DB env unset), `schema_missing` (missing table /
`42P01`), `conflict` (`23505` duplicate id/origin, `23503` unknown owner),
`database_error` (other, retryable on ECONN*), `unknown`.

## Schema readiness — `server/db/postgresActorSchemaReadiness.ts`

Statuses: `not_configured` | `unreachable` | `user_schema_missing` | `schema_missing`
| `ready` | `error`. It first checks the **User schema dependency** (owner_id FK →
users) and returns `user_schema_missing` if the user tables are absent; then checks
the `actors` table + required columns. Never prints the connection string, never
creates tables.

## Read-only smoke — `server/db/postgresActorRepositorySmoke.ts`

health → actor schema readiness → a harmless `getActorById` probe on a deterministic
id that must never exist (expects `value: null`). Writes nothing. Runner:
`server/db/verifyPostgresActorSlice.ts` → `npm run db:verify:actor`.

## Rollback-only write smoke — `server/db/postgresActorRepositoryWriteSmoke.ts`

Inside ONE transaction: create a deterministic smoke **owner user** (reusing
`PostgresUserRepository` with the same client executor,
`useInternalTransactions:false`) → create smoke actor (full sample sheet payload) →
getById → getByOrigin → listByOwner → update → archive → restore → **always
ROLLBACK**. Status `rolled_back` on success; no permanent rows, no commit path.
Runner: `server/db/verifyPostgresActorWriteSmoke.ts` →
`npm run db:verify:actor:write`.

## Verification commands

```
npm run db:verify:actor          # read-only; not_configured OK without local Postgres
npm run db:verify:actor:write    # rollback-only; not_configured OK
```

- **not_configured:** returned when the server DB env is unset — expected, not faked.
- **schema_missing / user_schema_missing:** returned when tables are absent (apply
  `0001_user_identity.sql` then `0003_actors.sql` first).

## Relationship to the User and Campaign first slices

Same pattern, same primitives (`postgresClient`, schema readiness style, rollback
smoke shape), same safe envelope. Like Campaign, the actor write smoke depends on
the user tables because `actors.owner_id` references `users.user_id`. Actor and
Campaign are sibling asset tables under the same User owner; there is **no**
actor↔campaign binding in this slice.

## Character Vault vs Campaign Actor Instance vs Runtime Read View

- **Character Vault (this slice):** the long-term, owner-scoped character asset
  (the durable sheet). One row per (owner, system, local origin).
- **Campaign Actor Instance (future):** a campaign-scoped instance with its own
  HP/inventory/growth/state — a separate table, not modeled here.
- **Runtime Read View (future/ongoing):** the live projection used during a
  session; current HP/SAN/resources are runtime authority, **never** written back
  as Vault DB authority in this slice.

## Boundaries

- **`owner_id` is the asset owner** (a `users.user_id`) — never a live-session
  `hostUserId`.
- **No frontend sync yet:** the local per-system character stores + the read-only
  `ActorVaultReadAdapter` remain the active frontend authority; nothing calls this
  repository from the browser.
- **No campaign binding, no runtime state, no combat automation, no rule
  validation** in this slice.

## /health

`/health` now includes `database.actorSchema` (readiness status only — no
connection string, no secret), consistent with the existing `schema` and
`campaignSchema` fields. This adds a light information_schema read; if it ever
proves too heavy for health polling it can be removed without affecting the scripts.

## Out of scope (unchanged)

Frontend Character Vault sync/upload, Actor API routes, Campaign Actor Instance DB,
actor↔campaign binding table, RuntimeEvent DB, Asset/Object Storage DB,
auth/login/session, permission model, migration runner, auto table creation,
destructive SQL, initiative/damage/healing automation, character clearance/rule
validation, Room protocol/WebSocket changes.
