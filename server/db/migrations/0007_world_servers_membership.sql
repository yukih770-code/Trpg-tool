-- P5.16-P5.18 Postgres World Server + Membership/Role/Invite + Game System bindings.
-- Manual DDL only. This project does not run migrations automatically yet.
-- Apply AFTER 0001_user_identity.sql and 0002_campaigns.sql
--   (owner/user FKs -> users; campaign binding -> campaigns).
--
-- NOTE: This file is the P5.16-P5.18 combined slice (seven tables). It supersedes
-- the earlier P5.16-P5.17 six-table draft; the filename is kept to avoid a duplicate
-- numbered 0007 migration. It adds world_server_game_system_bindings and replaces the
-- world_servers ruleset columns with a convenience-only default_game_system_id.
--
-- Boundaries (see docs/implementation/P5_16_WORLD_SERVER_MEMBERSHIP_DB_FIRST_SLICE.md):
-- - A World Server is a SCOPED COMMUNITY. The Global Public Surface is NOT a normal
--   server and is NOT modeled here — no main/global/default server row/seed.
-- - Server != Game System: a server may ENABLE MULTIPLE game systems via
--   world_server_game_system_bindings. default_game_system_id is a convenience HINT
--   only, NOT an exclusivity constraint. Worldview consistency is the owner's job,
--   not a platform constraint. Exactly-one-default is NOT enforced in DB.
-- - owner_id is the canonical owner for this slice; an owner membership row MAY exist.
-- - roles/permissions_payload, membership_status, server_visibility, join_policy,
--   invite_code, join requests, and game-system bindings are STORED METADATA /
--   workflow state — this slice enforces NO permissions, sends NO email, and
--   implements NO redemption/approval/compendium/ruleset logic.
-- - Campaign binding does NOT change campaign/runtime authority.
-- - game_system_id / ruleset_template_id / current_ruleset_version_id /
--   enabled_pack_version_ids are forward-compatible OPAQUE refs (no FK to
--   not-yet-existing game-system/ruleset/pack tables).
-- - No Postgres enums; string conventions only. No destructive SQL.

CREATE TABLE IF NOT EXISTS world_servers (
  world_server_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  server_handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  server_visibility TEXT NOT NULL DEFAULT 'private',
  join_policy TEXT NOT NULL DEFAULT 'invite_only',
  lifecycle_status TEXT NOT NULL DEFAULT 'active',
  default_game_system_id TEXT,
  public_profile_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  server_settings_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  soft_update_policy_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_world_servers_owner_id ON world_servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_world_servers_server_visibility ON world_servers(server_visibility);
CREATE INDEX IF NOT EXISTS idx_world_servers_join_policy ON world_servers(join_policy);
CREATE INDEX IF NOT EXISTS idx_world_servers_lifecycle_status ON world_servers(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_world_servers_default_game_system_id ON world_servers(default_game_system_id);
CREATE INDEX IF NOT EXISTS idx_world_servers_updated_at ON world_servers(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_servers_archived_at ON world_servers(archived_at);

CREATE TABLE IF NOT EXISTS world_server_campaign_bindings (
  binding_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  binding_kind TEXT NOT NULL DEFAULT 'owned',
  visibility_scope TEXT NOT NULL DEFAULT 'server',
  binding_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_wscb_server_campaign UNIQUE (world_server_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_wscb_world_server_id ON world_server_campaign_bindings(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wscb_campaign_id ON world_server_campaign_bindings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_wscb_created_by_user_id ON world_server_campaign_bindings(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_wscb_visibility_scope ON world_server_campaign_bindings(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_wscb_archived_at ON world_server_campaign_bindings(archived_at);

-- A server can enable MULTIPLE game systems. No exclusivity; no FK to game-system/
-- ruleset/pack tables. Exactly-one-default is intentionally NOT DB-enforced here.
CREATE TABLE IF NOT EXISTS world_server_game_system_bindings (
  binding_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  game_system_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  system_kind TEXT NOT NULL DEFAULT 'template',
  binding_status TEXT NOT NULL DEFAULT 'enabled',
  is_default BOOLEAN NOT NULL DEFAULT false,
  ruleset_template_id TEXT,
  current_ruleset_version_id TEXT,
  config_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled_pack_version_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_wsgsb_server_system UNIQUE (world_server_id, game_system_id)
);

CREATE INDEX IF NOT EXISTS idx_wsgsb_world_server_id ON world_server_game_system_bindings(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wsgsb_game_system_id ON world_server_game_system_bindings(game_system_id);
CREATE INDEX IF NOT EXISTS idx_wsgsb_system_kind ON world_server_game_system_bindings(system_kind);
CREATE INDEX IF NOT EXISTS idx_wsgsb_binding_status ON world_server_game_system_bindings(binding_status);
CREATE INDEX IF NOT EXISTS idx_wsgsb_is_default ON world_server_game_system_bindings(is_default);
CREATE INDEX IF NOT EXISTS idx_wsgsb_current_ruleset_version_id ON world_server_game_system_bindings(current_ruleset_version_id);
CREATE INDEX IF NOT EXISTS idx_wsgsb_archived_at ON world_server_game_system_bindings(archived_at);

CREATE TABLE IF NOT EXISTS world_server_roles (
  role_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role_kind TEXT NOT NULL DEFAULT 'custom',
  permissions_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_wsr_server_role_key UNIQUE (world_server_id, role_key)
);

CREATE INDEX IF NOT EXISTS idx_wsr_world_server_id ON world_server_roles(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wsr_role_kind ON world_server_roles(role_kind);
CREATE INDEX IF NOT EXISTS idx_wsr_is_system_role ON world_server_roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_wsr_sort_order ON world_server_roles(sort_order);
CREATE INDEX IF NOT EXISTS idx_wsr_archived_at ON world_server_roles(archived_at);

CREATE TABLE IF NOT EXISTS world_server_memberships (
  membership_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id TEXT REFERENCES world_server_roles(role_id) ON DELETE SET NULL,
  role_key TEXT NOT NULL DEFAULT 'member',
  membership_status TEXT NOT NULL DEFAULT 'active',
  display_alias TEXT,
  invited_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  approved_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  membership_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_wsm_server_user UNIQUE (world_server_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wsm_world_server_id ON world_server_memberships(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wsm_user_id ON world_server_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_wsm_role_id ON world_server_memberships(role_id);
CREATE INDEX IF NOT EXISTS idx_wsm_role_key ON world_server_memberships(role_key);
CREATE INDEX IF NOT EXISTS idx_wsm_membership_status ON world_server_memberships(membership_status);
CREATE INDEX IF NOT EXISTS idx_wsm_archived_at ON world_server_memberships(archived_at);

CREATE TABLE IF NOT EXISTS world_server_invites (
  invite_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  target_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  target_email TEXT,
  default_role_key TEXT NOT NULL DEFAULT 'member',
  invite_status TEXT NOT NULL DEFAULT 'active',
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  invite_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wsi_world_server_id ON world_server_invites(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wsi_created_by_user_id ON world_server_invites(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_wsi_target_user_id ON world_server_invites(target_user_id);
CREATE INDEX IF NOT EXISTS idx_wsi_invite_status ON world_server_invites(invite_status);
CREATE INDEX IF NOT EXISTS idx_wsi_expires_at ON world_server_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_wsi_archived_at ON world_server_invites(archived_at);

CREATE TABLE IF NOT EXISTS world_server_join_requests (
  join_request_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  requester_user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reviewed_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  request_status TEXT NOT NULL DEFAULT 'pending',
  request_message TEXT,
  response_message TEXT,
  requested_role_key TEXT NOT NULL DEFAULT 'member',
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  requested_at TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wsjr_world_server_id ON world_server_join_requests(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wsjr_requester_user_id ON world_server_join_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_wsjr_reviewed_by_user_id ON world_server_join_requests(reviewed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_wsjr_request_status ON world_server_join_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_wsjr_requested_at ON world_server_join_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_wsjr_archived_at ON world_server_join_requests(archived_at);
