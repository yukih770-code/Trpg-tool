-- P5.11A Postgres Campaign first slice: campaigns table only.
-- Manual DDL only. This project does not run migrations automatically yet.
-- Apply AFTER 0001_user_identity.sql (campaigns.owner_id references users.user_id).
--
-- Boundaries (see docs/implementation/POSTGRES_CAMPAIGN_REPOSITORY_FIRST_SLICE_V1.md):
-- - owner_id is the ASSET OWNER (a users.user_id), NOT the live-session hostUserId.
--   The live host identity belongs in a future runtime_sessions table, never here.
-- - The Room Server's campaignRef stays a read-only echo; this row is the durable
--   asset, not runtime authority.
-- - No membership/sharing, no actor instances, no runtime events in this slice.

CREATE TABLE IF NOT EXISTS campaigns (
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
);

CREATE INDEX IF NOT EXISTS idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_updated_at ON campaigns(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_owner_lifecycle ON campaigns(owner_id, lifecycle_status);
