-- P5.14A Postgres RuntimeEvent persistence first slice: two tables only.
-- Manual DDL only. This project does not run migrations automatically yet.
-- Apply AFTER 0001_user_identity.sql, 0002_campaigns.sql, 0003_actors.sql
--   (runtime_sessions.campaign_id -> campaigns, host_user_id -> users;
--    runtime_events.campaign_id -> campaigns, actor_id -> actors,
--    created_by_user_id -> users).
--
-- Boundaries (see docs/implementation/P5_14_RUNTIME_EVENT_DB_FIRST_SLICE.md):
-- - This is LONG-TERM PERSISTENCE, NOT the live room authority. The Room Server
--   remains the live runtime authority; nothing here is wired to the WebSocket
--   protocol or to live event broadcast in this slice.
-- - runtime_events is APPEND-ONLY: no updated_at, no archived_at, no UPDATE, no
--   DELETE in the repository. Corrections/tombstones are FUTURE event rows
--   (caused_by_event_id), never in-place edits.
-- - seq is per-runtime_session monotonic, allocated transactionally by the
--   repository (SELECT COALESCE(MAX(seq),0)+1 inside a transaction).
-- - idempotency_key de-duplicates appends within one session.

CREATE TABLE IF NOT EXISTS runtime_sessions (
  runtime_session_id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  host_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  room_id TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  session_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_runtime_sessions_campaign_id ON runtime_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_runtime_sessions_campaign_updated ON runtime_sessions(campaign_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_sessions_host_user_id ON runtime_sessions(host_user_id);

-- APPEND-ONLY. Intentionally NO updated_at and NO archived_at columns.
CREATE TABLE IF NOT EXISTS runtime_events (
  runtime_event_id TEXT PRIMARY KEY,
  runtime_session_id TEXT NOT NULL REFERENCES runtime_sessions(runtime_session_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  seq BIGINT NOT NULL,
  event_kind TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  actor_id TEXT REFERENCES actors(actor_id) ON DELETE SET NULL,
  caused_by_event_id TEXT REFERENCES runtime_events(runtime_event_id) ON DELETE SET NULL,
  idempotency_key TEXT,
  event_payload JSONB NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT uq_runtime_events_session_seq UNIQUE (runtime_session_id, seq)
);

-- Idempotency: at most one event per (session, idempotency_key) when key present.
CREATE UNIQUE INDEX IF NOT EXISTS uq_runtime_events_session_idem
  ON runtime_events(runtime_session_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_runtime_events_session_seq ON runtime_events(runtime_session_id, seq);
CREATE INDEX IF NOT EXISTS idx_runtime_events_campaign_created ON runtime_events(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_runtime_events_event_kind ON runtime_events(event_kind);
CREATE INDEX IF NOT EXISTS idx_runtime_events_actor_id ON runtime_events(actor_id);
