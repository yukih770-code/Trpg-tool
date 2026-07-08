-- P5.13A Postgres Asset / Media metadata first slice: two tables only.
-- Manual DDL only. This project does not run migrations automatically yet.
-- Apply AFTER 0001_user_identity.sql and 0002_campaigns.sql
--   (asset_metadata.owner_id -> users.user_id, asset_metadata.campaign_id -> campaigns.campaign_id).
--
-- Boundaries (see docs/implementation/POSTGRES_ASSET_REPOSITORY_FIRST_SLICE_V1.md):
-- - Postgres stores METADATA ONLY. Binary blobs are NEVER stored here.
-- - object_storage_refs is a vendor-neutral POINTER into future S3-compatible
--   object storage (bucket/object_key/url). No upload/download, no signed URLs,
--   no provider SDK, no credentials, no public file route in this slice.
-- - external_url supports today's URL-referenced assets (static maps / portraits)
--   that have no managed blob yet; such assets have storage_ref_id NULL.
-- - owner_id is the ASSET OWNER (a users.user_id). campaign_id is an OPTIONAL
--   association, NOT a permission/membership model.
-- - asset_kind supports map/image/handout/document/token/thumbnail/other.

CREATE TABLE IF NOT EXISTS object_storage_refs (
  storage_ref_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  provider_kind TEXT NOT NULL,
  bucket TEXT,
  object_key TEXT,
  url TEXT,
  content_hash TEXT,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_object_storage_refs_owner_id ON object_storage_refs(owner_id);
CREATE INDEX IF NOT EXISTS idx_object_storage_refs_content_hash ON object_storage_refs(content_hash);

CREATE TABLE IF NOT EXISTS asset_metadata (
  asset_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  asset_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  mime_type TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  storage_ref_id TEXT REFERENCES object_storage_refs(storage_ref_id) ON DELETE SET NULL,
  external_url TEXT,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_asset_metadata_owner_id ON asset_metadata(owner_id);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_campaign_id ON asset_metadata(campaign_id);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_asset_kind ON asset_metadata(asset_kind);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_updated_at ON asset_metadata(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_owner_archived ON asset_metadata(owner_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_storage_ref_id ON asset_metadata(storage_ref_id);
