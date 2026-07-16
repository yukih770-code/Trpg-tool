-- User-imported DND monster templates. This table deliberately has no public
-- visibility: imported data remains private to its world server and creator.

CREATE TABLE IF NOT EXISTS dnd_private_monster_import_batches (
  import_batch_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  source_format TEXT,
  source_hash TEXT,
  import_status TEXT NOT NULL DEFAULT 'running' CHECK (import_status IN ('running', 'completed', 'failed')),
  total_records INTEGER NOT NULL DEFAULT 0,
  imported_records INTEGER NOT NULL DEFAULT 0,
  skipped_records INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dnd_private_monster_templates (
  monster_template_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  import_batch_id TEXT REFERENCES dnd_private_monster_import_batches(import_batch_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  size TEXT,
  creature_type TEXT,
  alignment TEXT,
  armor_class INTEGER,
  hit_points_average INTEGER,
  hit_points_formula TEXT,
  speed_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  abilities_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  saving_throws_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  skills_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  senses_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  languages TEXT,
  challenge_rating TEXT,
  proficiency_bonus INTEGER,
  traits_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  reactions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  legendary_actions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  spellcasting_json JSONB,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_format TEXT,
  source_hash TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility = 'private'),
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  UNIQUE (world_server_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_dnd_private_monsters_world_active
  ON dnd_private_monster_templates(world_server_id, updated_at DESC)
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dnd_private_monsters_world_type
  ON dnd_private_monster_templates(world_server_id, creature_type)
  WHERE archived_at IS NULL;
