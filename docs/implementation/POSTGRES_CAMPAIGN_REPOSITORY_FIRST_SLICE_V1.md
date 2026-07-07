# Postgres Campaign Repository — First Slice v1 (P5.11A-C)

Server-only Campaign database foundation, mirroring the User first slice. **Asset
persistence only — NOT runtime/room authority.** No frontend sync, no Campaign API
routes, no membership/sharing, no actor/runtime persistence, no auth.

## DDL — `server/db/migrations/0002_campaigns.sql`

Manual DDL (no runner, no auto-create). Apply **after** `0001_user_identity.sql`.

```
campaigns(
  campaign_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  system_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  lifecycle_status TEXT NOT NULL DEFAULT 'active',
  campaign_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
)
indexes: (owner_id), (updated_at DESC), (owner_id, lifecycle_status)
```

Opaque string ids (no auto-increment). Columns mirror `LocalCampaign`
(id/title/description/systemId/status/lifecycleStatus/timestamps/archivedAt) plus a
`campaign_payload JSONB` for durable domain data and a `schema_version`.

## Repository — `server/adapters/postgresCampaignRepository.ts`

Same style as `PostgresUserRepository`: safe result union
(`PostgresCampaignRepositoryResult<T>`), injectable `executor` (transaction-friendly),
and DB error mapping that never leaks raw driver errors.

Methods: `getCampaignById`, `listCampaignsByOwner(owner, {includeArchived,
includeTrashed, limit})`, `createCampaign` (caller supplies the opaque
`campaign_<uuid>` id), `updateCampaign` (COALESCE partial update), `archiveCampaign`,
`restoreCampaign`, `checkReadiness`. `createPostgresCampaignRepository(executor?)`
+ a default instance + top-level convenience exports.

Error mapping: `not_configured` (DB env unset), `schema_missing` (missing table /
`42P01`), `conflict` (`23505` duplicate id / `23503` unknown owner), `database_error`
(other, retryable on ECONN*), `unknown`.

## Schema readiness — `server/db/postgresCampaignSchemaReadiness.ts`

Statuses: `not_configured` | `unreachable` | `user_schema_missing` | `schema_missing`
| `ready` | `error`. It first checks the **User schema dependency** (owner_id FK →
users) and returns `user_schema_missing` if the user tables are absent; then checks
the `campaigns` table + required columns. Never prints the connection string, never
creates tables.

## Read-only smoke — `server/db/postgresCampaignRepositorySmoke.ts`

health → campaign schema readiness → a harmless `getCampaignById` probe on a
deterministic id that must never exist (expects `value: null`). Writes nothing.
Runner: `server/db/verifyPostgresCampaignSlice.ts` → `npm run db:verify:campaign`.

## Rollback-only write smoke — `server/db/postgresCampaignRepositoryWriteSmoke.ts`

Inside ONE transaction: create a deterministic smoke **owner user** (reusing
`PostgresUserRepository` with the same client executor, `useInternalTransactions:false`)
→ create smoke campaign → getById → listByOwner → update → archive → restore →
**always ROLLBACK**. Status `rolled_back` on success; no permanent rows, no commit
path. Runner: `server/db/verifyPostgresCampaignWriteSmoke.ts` →
`npm run db:verify:campaign:write`.

## Verification commands

```
npm run db:verify:campaign          # read-only; not_configured OK without local Postgres
npm run db:verify:campaign:write    # rollback-only; not_configured OK
```

- **not_configured:** returned when the server DB env is unset — expected, not faked.
- **schema_missing / user_schema_missing:** returned when tables are absent (apply
  the two DDL files first).

## Relationship to the User first slice

Same pattern, same primitives (`postgresClient`, schema readiness style, rollback
smoke shape), same safe envelope. The campaign write smoke depends on the user
tables because `campaigns.owner_id` references `users.user_id`.

## Boundaries

- **`owner_id` is the asset owner** (a `users.user_id`) — **NOT** `hostUserId`. The
  live-session host identity belongs in a future `runtime_sessions` table, never in
  `campaigns.owner_id`. Do not backfill owner from a room's host.
- **`campaignRef` is not DB authority:** the Room Server's `campaignRef` stays a
  read-only echo (protocol frozen); the `campaigns` row is the durable asset.
- **No frontend sync yet:** the local campaign store/adapter remains the active
  frontend authority; nothing calls this repository from the browser.
- **No membership/sharing, no actor instances, no runtime events** in this slice.

## /health

`/health` now includes `database.campaignSchema` (readiness status only — no
connection string, no secret). This adds a light information_schema read; if it ever
proves too heavy for health polling it can be removed without affecting the scripts.

## Out of scope (unchanged)

Frontend Campaign sync/upload, Campaign API routes, membership/sharing, Actor DB,
`campaign_actor_instances`, RuntimeEvent DB, Asset DB, auth/login/session, migration
runner, auto table creation, Room protocol/WebSocket changes.
