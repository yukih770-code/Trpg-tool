-- Persisted local scene / encounter setup documents.
-- State is sanitized JSON only: no credentials, binary assets, live authority, or sync state.

CREATE TABLE IF NOT EXISTS scene_state_documents (
  scene_state_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  runtime_session_id TEXT REFERENCES runtime_sessions(runtime_session_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1,
  state_json JSONB NOT NULL,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  source_scene_state_id TEXT REFERENCES scene_state_documents(scene_state_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scene_state_documents_room_updated
  ON scene_state_documents(world_server_id, campaign_id, room_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scene_state_documents_runtime_session
  ON scene_state_documents(runtime_session_id);
CREATE INDEX IF NOT EXISTS idx_scene_state_documents_source
  ON scene_state_documents(source_scene_state_id);
