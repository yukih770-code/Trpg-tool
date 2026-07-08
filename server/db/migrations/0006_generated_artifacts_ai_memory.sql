-- P5.15A Postgres GeneratedArtifact / AI Memory first slice: three tables only.
-- Manual DDL only. This project does not run migrations automatically yet.
-- Apply AFTER 0001_user_identity.sql, 0002_campaigns.sql, 0003_actors.sql,
--   0004_asset_metadata.sql, 0005_runtime_events.sql.
--
-- Boundaries (see docs/implementation/P5_15_GENERATED_ARTIFACT_AI_MEMORY_DB_FIRST_SLICE.md):
-- - This slice STORES AI outputs + curated memory records only. It generates
--   nothing, calls no model, runs no embeddings/vector search, and performs no
--   AI context retrieval.
-- - `visibility_scope` / `memory_scope` are METADATA for FUTURE scope enforcement,
--   NOT a permission system. AI memory is curated persistence, never automatic
--   global assistant memory, and must not be public by default.
-- - generated_artifacts + ai_memory_entries are CURATED (updatable/archivable);
--   ai_context_sources are append-only provenance links (no update/delete here).
-- - RuntimeEvent remains append-only and the live Room Server remains runtime
--   authority; this DB is long-term persistence, not live authority.

CREATE TABLE IF NOT EXISTS generated_artifacts (
  artifact_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  runtime_session_id TEXT REFERENCES runtime_sessions(runtime_session_id) ON DELETE SET NULL,
  runtime_event_id TEXT REFERENCES runtime_events(runtime_event_id) ON DELETE SET NULL,
  artifact_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content_format TEXT NOT NULL DEFAULT 'json',
  visibility_scope TEXT NOT NULL DEFAULT 'user_private',
  artifact_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_generated_artifacts_owner_id ON generated_artifacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_generated_artifacts_campaign_id ON generated_artifacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_generated_artifacts_runtime_session_id ON generated_artifacts(runtime_session_id);
CREATE INDEX IF NOT EXISTS idx_generated_artifacts_runtime_event_id ON generated_artifacts(runtime_event_id);
CREATE INDEX IF NOT EXISTS idx_generated_artifacts_artifact_kind ON generated_artifacts(artifact_kind);
CREATE INDEX IF NOT EXISTS idx_generated_artifacts_visibility_scope ON generated_artifacts(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_generated_artifacts_updated_at ON generated_artifacts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_artifacts_owner_archived ON generated_artifacts(owner_id, archived_at);

CREATE TABLE IF NOT EXISTS ai_memory_entries (
  memory_entry_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  runtime_session_id TEXT REFERENCES runtime_sessions(runtime_session_id) ON DELETE SET NULL,
  source_artifact_id TEXT REFERENCES generated_artifacts(artifact_id) ON DELETE SET NULL,
  memory_kind TEXT NOT NULL,
  memory_scope TEXT NOT NULL DEFAULT 'campaign',
  title TEXT,
  content_text TEXT NOT NULL,
  visibility_scope TEXT NOT NULL DEFAULT 'campaign',
  memory_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_owner_id ON ai_memory_entries(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_campaign_id ON ai_memory_entries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_runtime_session_id ON ai_memory_entries(runtime_session_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_source_artifact_id ON ai_memory_entries(source_artifact_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_memory_kind ON ai_memory_entries(memory_kind);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_memory_scope ON ai_memory_entries(memory_scope);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_visibility_scope ON ai_memory_entries(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_updated_at ON ai_memory_entries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entries_owner_archived ON ai_memory_entries(owner_id, archived_at);

-- Append-only provenance links (no updated_at / archived_at).
CREATE TABLE IF NOT EXISTS ai_context_sources (
  context_source_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  artifact_id TEXT REFERENCES generated_artifacts(artifact_id) ON DELETE CASCADE,
  memory_entry_id TEXT REFERENCES ai_memory_entries(memory_entry_id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL,
  source_ref_id TEXT,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_context_sources_owner_id ON ai_context_sources(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_sources_campaign_id ON ai_context_sources(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_sources_artifact_id ON ai_context_sources(artifact_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_sources_memory_entry_id ON ai_context_sources(memory_entry_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_sources_source_kind ON ai_context_sources(source_kind);
CREATE INDEX IF NOT EXISTS idx_ai_context_sources_source_ref_id ON ai_context_sources(source_ref_id);
