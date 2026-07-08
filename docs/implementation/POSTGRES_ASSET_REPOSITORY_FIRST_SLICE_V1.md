# Postgres Asset / Media Metadata Repository — First Slice v1 (P5.13A-D)

Server-only Asset / Media **metadata** database foundation, mirroring the User,
Campaign, and Actor first slices. **Metadata only — binary blobs are never stored in
Postgres.** No file upload/download, no object-storage provider, no signed URLs, no
frontend sync, no Asset API routes, no permission model, no runtime map authority.

## DDL — `server/db/migrations/0004_asset_metadata.sql`

Two tables. Manual DDL (no runner, no auto-create). Apply **after**
`0001_user_identity.sql` and `0002_campaigns.sql`.

### `object_storage_refs` (created first — asset_metadata references it)

```
object_storage_refs(
  storage_ref_id TEXT PRIMARY KEY,          -- storageRef_<uuid>
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  provider_kind TEXT NOT NULL,              -- s3Compatible | custom | unknown
  bucket TEXT, object_key TEXT, url TEXT, content_hash TEXT,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
)
indexes: (owner_id), (content_hash)
```

A vendor-neutral **pointer** into future S3-compatible object storage. No blob IO in
this slice — the table can exist empty. No provider SDK, no credentials, no signed
URLs, no public file route.

### `asset_metadata`

```
asset_metadata(
  asset_id TEXT PRIMARY KEY,                -- asset_<uuid>
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  asset_kind TEXT NOT NULL,                 -- map|image|handout|document|token|thumbnail|other
  title TEXT NOT NULL, description TEXT,
  mime_type TEXT, file_name TEXT, file_size_bytes BIGINT,
  storage_ref_id TEXT REFERENCES object_storage_refs(storage_ref_id) ON DELETE SET NULL,
  external_url TEXT,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
)
indexes: (owner_id), (campaign_id), (asset_kind), (updated_at DESC),
         (owner_id, archived_at), (storage_ref_id)
```

## asset_metadata vs object_storage_refs — and why blobs aren't in Postgres

`asset_metadata` holds **domain metadata** (kind, title, mime, size, owner,
optional campaign association). `object_storage_refs` holds the **storage location**
(provider/bucket/object_key/url/hash). Separating them lets the storage provider
change without touching domain rows, and keeps Postgres free of file bytes — blobs
belong in object storage, never in a relational column.

## external_url compatibility

Today's assets (static maps, portraits from `mediaAsset.ts` seeds) are URL/opaque
references with no managed blob. Such assets set `external_url` and leave
`storage_ref_id` NULL. When real object storage arrives, an asset gains a
`storage_ref_id` and can drop its `external_url` — no schema change required.

## Repository — `server/adapters/postgresAssetRepository.ts`

Same style as the User/Campaign/Actor repositories: safe result union
(`PostgresAssetRepositoryResult<T>`), injectable `executor` (transaction-friendly),
DB error mapping that never leaks raw driver errors.

Storage-ref methods: `getStorageRefById`, `createStorageRef`, `updateStorageRef`
(COALESCE partial), `archiveStorageRef`, `restoreStorageRef`.
Asset methods: `getAssetById`, `listAssetsByOwner`, `listAssetsByCampaign`
(both take `{assetKind, includeArchived, limit}`; exclude `archived_at IS NULL` by
default), `createAsset`, `updateAsset` (COALESCE partial), `archiveAsset`,
`restoreAsset`, `checkReadiness`. `createPostgresAssetRepository(executor?)` +
default instance + top-level convenience exports. Callers supply opaque ids.

Error mapping: `not_configured`, `schema_missing` (missing table / `42P01`),
`conflict` (`23505` duplicate id, `23503` missing owner/campaign/storage-ref FK),
`database_error` (retryable on ECONN*), `unknown`.

## Schema readiness — `server/db/postgresAssetSchemaReadiness.ts`

Statuses: `not_configured` | `unreachable` | `user_schema_missing` |
`campaign_schema_missing` | `schema_missing` | `ready` | `error`. It reuses the
Campaign readiness helper (which already chains the User schema check) to enforce
the FK dependencies, then verifies both `asset_metadata` and `object_storage_refs`
tables + required columns. Never prints the connection string, never creates tables.

## Read-only smoke — `server/db/postgresAssetRepositorySmoke.ts`

health → asset schema readiness → harmless `getAssetById` and `getStorageRefById`
probes on deterministic ids that must never exist (expect null). Writes nothing.
Runner: `server/db/verifyPostgresAssetSlice.ts` → `npm run db:verify:asset`.

## Rollback-only write smoke — `server/db/postgresAssetRepositoryWriteSmoke.ts`

Inside ONE transaction: create smoke owner user + smoke campaign (reusing the User
and Campaign repositories with the same client executor) → create storage ref →
getById → update → create asset (linked to storage ref + campaign) → getById →
listByOwner → listByCampaign → update → archive/restore asset → archive/restore
storage ref → **always ROLLBACK**. Status `rolled_back` on success; no permanent
rows, no commit path, no file IO. Runner:
`server/db/verifyPostgresAssetWriteSmoke.ts` → `npm run db:verify:asset:write`.

## Verification commands

```
npm run db:verify:asset          # read-only; not_configured OK without local Postgres
npm run db:verify:asset:write    # rollback-only; not_configured OK
```

- **not_configured:** returned when the server DB env is unset — expected, not faked.
- **schema_missing / user_schema_missing / campaign_schema_missing:** returned when
  the relevant tables are absent (apply 0001, 0002, then 0004 first).

## Relationship to the User / Campaign / Actor slices

Same pattern, same primitives, same safe envelope. Asset depends on **both** the
User (owner_id) and Campaign (campaign_id) schemas, so its readiness reuses the
Campaign helper. `owner_id` is the asset owner (a `users.user_id`); `campaign_id`
is an OPTIONAL association (`ON DELETE SET NULL`), **not** a permission/membership
model.

## /health

`/health` now includes `database.assetSchema` (readiness status only — no
connection string, no secret), consistent with `schema`, `campaignSchema`, and
`actorSchema`. This adds a light information_schema read; if health polling ever
proves too heavy the readiness reads can be cached or removed without affecting the
scripts.

## Out of scope (unchanged)

File upload/download, signed URLs, S3/R2/Supabase storage adapters, object-storage
credentials, public file-serving route, frontend media/map/scene/document/token/
workshop UI integration, Asset API routes, asset permission/sharing model,
RuntimeEvent DB, AI asset generation, auth/login/session, migration runner, auto
table creation, destructive SQL, Room protocol/WebSocket changes, runtime map
authority.
