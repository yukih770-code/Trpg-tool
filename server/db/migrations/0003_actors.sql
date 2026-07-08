-- P5.12A Postgres Actor / Character Vault first slice: actors table only.
-- Manual DDL only. This project does not run migrations automatically yet.
-- Apply AFTER 0001_user_identity.sql (actors.owner_id references users.user_id).
--
-- Boundaries (see docs/implementation/POSTGRES_ACTOR_REPOSITORY_FIRST_SLICE_V1.md):
-- - owner_id is the ASSET OWNER (a users.user_id) of the long-term Character Vault
--   record. It is NOT a live-session hostUserId and NOT campaign-scoped authority.
-- - system_id distinguishes DND 5e (dnd5e-2024) / COC 7e (coc7e) / CP RED (cp-red)
--   and future systems. Character sheets differ per system, so the full sheet is
--   stored as JSONB (actor_payload), NOT relationalized field-by-field yet.
-- - local_actor_id is the migration/source-origin id from the local per-system
--   character store. It is NOT globally unique (ids collide across users/systems),
--   so the global identity is actor_id and the origin key is
--   (owner_id, system_id, local_actor_id).
-- - This is the Character Vault (long-term asset). It is NOT the Campaign Actor
--   Instance (future campaign-scoped HP/inventory/growth) and NOT live runtime
--   state (current HP/SAN authority lives in the runtime layer, not here).
-- - No campaign binding table, no runtime state table, no membership in this slice.

CREATE TABLE IF NOT EXISTS actors (
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
);

-- Origin key: local actor ids are only unique within one owner + one system.
CREATE UNIQUE INDEX IF NOT EXISTS uq_actors_owner_system_local
  ON actors(owner_id, system_id, local_actor_id);

CREATE INDEX IF NOT EXISTS idx_actors_owner_id ON actors(owner_id);
CREATE INDEX IF NOT EXISTS idx_actors_system_id ON actors(system_id);
CREATE INDEX IF NOT EXISTS idx_actors_updated_at ON actors(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_actors_owner_archived ON actors(owner_id, archived_at);
