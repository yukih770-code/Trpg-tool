-- P5.25 Postgres migration history table (bootstrap).
-- Manual DDL. The migration runner ensures this table exists BEFORE recording any
-- migration, and treats this file as re-appliable (CREATE ... IF NOT EXISTS), so it
-- can be recorded as applied without double-creating the table.
--
-- Safety: no destructive SQL, no rollback/DROP, no connection string, no auto-apply
-- from server startup or /health. Numbered 0000 so it precedes 0001+ ordering.

CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_id TEXT PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  execution_ms INTEGER,
  schema_version INTEGER NOT NULL DEFAULT 1,
  applied_by TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at DESC);
