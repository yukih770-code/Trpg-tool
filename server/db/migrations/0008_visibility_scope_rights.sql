-- P5.19 Postgres Visibility / Scope / Rights Policy first slice: three tables.
-- Manual DDL only. This project does not run migrations automatically yet.
-- Apply AFTER 0001_user_identity.sql, 0002_campaigns.sql, 0007_world_servers_membership.sql
--   (owner/user FKs -> users; world_server_id -> world_servers; campaign_id -> campaigns).
--
-- Boundaries (see docs/implementation/P5_19_VISIBILITY_SCOPE_RIGHTS_DB_FIRST_SLICE.md):
-- - This slice stores SCOPE + RIGHTS + REVIEW METADATA ONLY. It enforces NOTHING:
--   no permission checks, no publish workflow, no moderation, no public feed, no AI
--   retrieval, no AI scope guard. Future slices add enforcement/resolvers/guards.
-- - Public entry != public data. Tools may be publicly visible while objects made
--   with them stay private/server/campaign by default. Public flags DEFAULT FALSE;
--   ai_scope DEFAULTS private_only; visibility_scope DEFAULTS user_private.
-- - The Global Public Surface is NOT a server; global_public is a visibility_scope
--   value here, and a global_public projection is a SEPARATE record from its private
--   source (projection_kind), so publishing never mutates the private source.
-- - Generic content refs (content_kind/content_id/projection_kind) — NO FK fanout to
--   actors/assets/campaigns/generated_artifacts/etc. No Postgres enums; string
--   conventions only. No destructive SQL.

CREATE TABLE IF NOT EXISTS content_rights_policies (
  rights_policy_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  policy_kind TEXT NOT NULL,
  license_id TEXT,
  license_label TEXT,
  attribution_text TEXT,
  source_url TEXT,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  redistribution_allowed BOOLEAN NOT NULL DEFAULT false,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT false,
  public_sharing_allowed BOOLEAN NOT NULL DEFAULT false,
  derivative_allowed BOOLEAN NOT NULL DEFAULT false,
  ai_context_allowed BOOLEAN NOT NULL DEFAULT false,
  ai_training_allowed BOOLEAN NOT NULL DEFAULT false,
  rights_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crp_owner_id ON content_rights_policies(owner_id);
CREATE INDEX IF NOT EXISTS idx_crp_policy_kind ON content_rights_policies(policy_kind);
CREATE INDEX IF NOT EXISTS idx_crp_license_id ON content_rights_policies(license_id);
CREATE INDEX IF NOT EXISTS idx_crp_public_sharing_allowed ON content_rights_policies(public_sharing_allowed);
CREATE INDEX IF NOT EXISTS idx_crp_ai_context_allowed ON content_rights_policies(ai_context_allowed);
CREATE INDEX IF NOT EXISTS idx_crp_archived_at ON content_rights_policies(archived_at);

-- projection_kind lets a public projection be a SEPARATE record from a private source.
CREATE TABLE IF NOT EXISTS content_visibility_records (
  visibility_record_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  rights_policy_id TEXT REFERENCES content_rights_policies(rights_policy_id) ON DELETE SET NULL,
  content_kind TEXT NOT NULL,
  content_id TEXT NOT NULL,
  projection_kind TEXT NOT NULL DEFAULT 'source',
  visibility_scope TEXT NOT NULL DEFAULT 'user_private',
  public_search_allowed BOOLEAN NOT NULL DEFAULT false,
  public_profile_allowed BOOLEAN NOT NULL DEFAULT false,
  workshop_publish_allowed BOOLEAN NOT NULL DEFAULT false,
  community_feed_allowed BOOLEAN NOT NULL DEFAULT false,
  ai_scope TEXT NOT NULL DEFAULT 'private_only',
  review_status TEXT NOT NULL DEFAULT 'not_submitted',
  moderation_status TEXT NOT NULL DEFAULT 'not_reviewed',
  lifecycle_status TEXT NOT NULL DEFAULT 'active',
  visibility_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_cvr_content_projection UNIQUE (content_kind, content_id, projection_kind)
);

CREATE INDEX IF NOT EXISTS idx_cvr_owner_id ON content_visibility_records(owner_id);
CREATE INDEX IF NOT EXISTS idx_cvr_world_server_id ON content_visibility_records(world_server_id);
CREATE INDEX IF NOT EXISTS idx_cvr_campaign_id ON content_visibility_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cvr_rights_policy_id ON content_visibility_records(rights_policy_id);
CREATE INDEX IF NOT EXISTS idx_cvr_content_kind ON content_visibility_records(content_kind);
CREATE INDEX IF NOT EXISTS idx_cvr_content_id ON content_visibility_records(content_id);
CREATE INDEX IF NOT EXISTS idx_cvr_projection_kind ON content_visibility_records(projection_kind);
CREATE INDEX IF NOT EXISTS idx_cvr_visibility_scope ON content_visibility_records(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_cvr_public_search_allowed ON content_visibility_records(public_search_allowed);
CREATE INDEX IF NOT EXISTS idx_cvr_public_profile_allowed ON content_visibility_records(public_profile_allowed);
CREATE INDEX IF NOT EXISTS idx_cvr_workshop_publish_allowed ON content_visibility_records(workshop_publish_allowed);
CREATE INDEX IF NOT EXISTS idx_cvr_community_feed_allowed ON content_visibility_records(community_feed_allowed);
CREATE INDEX IF NOT EXISTS idx_cvr_ai_scope ON content_visibility_records(ai_scope);
CREATE INDEX IF NOT EXISTS idx_cvr_review_status ON content_visibility_records(review_status);
CREATE INDEX IF NOT EXISTS idx_cvr_moderation_status ON content_visibility_records(moderation_status);
CREATE INDEX IF NOT EXISTS idx_cvr_lifecycle_status ON content_visibility_records(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_cvr_archived_at ON content_visibility_records(archived_at);

CREATE TABLE IF NOT EXISTS content_publication_reviews (
  publication_review_id TEXT PRIMARY KEY,
  visibility_record_id TEXT NOT NULL REFERENCES content_visibility_records(visibility_record_id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  submitted_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  reviewed_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  target_surface TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending',
  submit_message TEXT,
  review_message TEXT,
  review_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cpr_visibility_record_id ON content_publication_reviews(visibility_record_id);
CREATE INDEX IF NOT EXISTS idx_cpr_owner_id ON content_publication_reviews(owner_id);
CREATE INDEX IF NOT EXISTS idx_cpr_submitted_by_user_id ON content_publication_reviews(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_cpr_reviewed_by_user_id ON content_publication_reviews(reviewed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_cpr_target_surface ON content_publication_reviews(target_surface);
CREATE INDEX IF NOT EXISTS idx_cpr_review_status ON content_publication_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_cpr_submitted_at ON content_publication_reviews(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_cpr_archived_at ON content_publication_reviews(archived_at);
