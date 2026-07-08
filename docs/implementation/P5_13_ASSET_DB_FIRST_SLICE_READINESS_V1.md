# P5.13 Asset / Media Metadata DB First Slice — Readiness v1

Rationale note for the Asset / Media metadata DB first slice. Implemented in
P5.13A-D — see `POSTGRES_ASSET_REPOSITORY_FIRST_SLICE_V1.md` for the mechanics.

## 1. Why Asset DB follows User / Campaign / Actor

- Every durable aggregate references a **User `ownerId`** (P4.3). User (P5.10),
  Campaign (P5.11), and Actor (P5.12) established and repeated the identity +
  repository + readiness + rollback-smoke pattern. Asset is the next owner-scoped
  asset family and reuses it exactly.
- `asset_metadata.owner_id` → users and `asset_metadata.campaign_id` → campaigns, so
  Asset depends on both prior schemas. Its readiness reuses the Campaign helper
  (which already chains the User check).

## 2. How maps / handouts / media will later use it

- The local `MediaAsset` model (`src/lib/architecture/mediaAsset.ts`) already
  separates metadata from opaque storage refs and forbids inlining blobs into
  domain objects. `asset_metadata` is the cloud counterpart of that metadata, and
  `object_storage_refs` is the cloud counterpart of its variant storage refs.
- Portraits/avatars, campaign maps, handouts, documents, tokens, and thumbnails all
  become `asset_metadata` rows keyed by an opaque `asset_id`; consumers
  (BlockDocument, actor media binding, campaign scenes) will reference `asset_id`
  only — never a blob or a raw URL.

## 3. Why object storage refs are metadata only

- Postgres must not hold file bytes. `object_storage_refs` stores only the location
  (provider/bucket/object_key/url/hash), so the storage vendor (S3/R2/Supabase/etc.)
  can change without touching domain rows and without a Postgres blob column.
- No upload/download, signed URLs, provider SDK, or credentials exist in this slice;
  the table can sit empty until an upload flow is built.

## 4. Why external_url exists

- Today's assets are URL/opaque references (static maps, seed portraits) with no
  managed blob. `external_url` lets those rows persist now with `storage_ref_id`
  NULL, and later migrate to a managed `storage_ref_id` without a schema change —
  bridging the pre-object-storage present to the managed-storage future.

## 5. owner_id and campaign_id semantics

- `owner_id` is the **asset owner** (a `users.user_id`).
- `campaign_id` is an **optional association** (`ON DELETE SET NULL`) — deleting a
  campaign nulls the link but keeps the asset. It is **not** a permission or
  sharing model; access control is out of scope for this slice.

## 6. What P5.13 completes

- `0004_asset_metadata.sql` (asset_metadata + object_storage_refs),
  `PostgresAssetRepository`, asset schema readiness, read-only asset smoke,
  rollback-only asset write smoke, `db:verify:asset` / `db:verify:asset:write`,
  `/health` `database.assetSchema`, and docs.

## 7. What remains for later

- File upload/download flow, signed URLs, and a concrete S3-compatible storage
  adapter (behind the existing cloud-adapter seam).
- Frontend media/map/document sync + asset picker wiring to the cloud.
- Asset API routes (env-gated dev read route first, mirroring the User pattern).
- Asset permission/sharing model, campaign asset sharing, workshop publishing.
- Content-hash dedupe, thumbnail/variant management, media usage index.
