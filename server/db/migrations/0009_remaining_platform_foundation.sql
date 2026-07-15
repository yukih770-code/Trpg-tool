-- P5.DB-CLOSURE Remaining Postgres foundation.
-- Manual DDL only. This project does not run migrations automatically yet.
-- Apply AFTER 0001-0008.
--
-- Boundaries:
-- - Database foundation only: no API routes, no auth provider, no runtime/WebSocket
--   behavior, no AI model calls, no import parser, no object upload/download.
-- - Public/private visibility remains governed by content_visibility_records and
--   rights policy metadata; this migration does not publish private content.
-- - Room server remains live authority; DB rows store durable metadata/history anchors.
-- - Runtime actor metadata is not Character Vault source data and not live runtime
--   state authority.
-- - Audit rows store ids/counts/reason codes/metadata only; denied private bodies or
--   model prompts must not be persisted here.

-- A. Auth / session / account runtime foundation.
CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  session_kind TEXT NOT NULL DEFAULT 'browser',
  session_status TEXT NOT NULL DEFAULT 'active',
  trust_level TEXT NOT NULL DEFAULT 'standard',
  device_label TEXT,
  issued_by_identity_id TEXT REFERENCES user_identities(identity_id) ON DELETE SET NULL,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_status ON auth_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_revoked_at ON auth_sessions(revoked_at);

CREATE TABLE IF NOT EXISTS service_identities (
  service_identity_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  service_kind TEXT NOT NULL DEFAULT 'internal',
  identity_status TEXT NOT NULL DEFAULT 'active',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_service_identities_status ON service_identities(identity_status);
CREATE INDEX IF NOT EXISTS idx_service_identities_archived_at ON service_identities(archived_at);

CREATE TABLE IF NOT EXISTS account_security_audit_records (
  account_audit_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  session_id TEXT REFERENCES auth_sessions(session_id) ON DELETE SET NULL,
  event_kind TEXT NOT NULL,
  decision_code TEXT NOT NULL DEFAULT 'recorded',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_security_audit_user_id ON account_security_audit_records(user_id);
CREATE INDEX IF NOT EXISTS idx_account_security_audit_session_id ON account_security_audit_records(session_id);
CREATE INDEX IF NOT EXISTS idx_account_security_audit_event_kind ON account_security_audit_records(event_kind);
CREATE INDEX IF NOT EXISTS idx_account_security_audit_created_at ON account_security_audit_records(created_at DESC);

-- B. Server settings / ruleset versions / soft update foundation.
CREATE TABLE IF NOT EXISTS world_server_settings_versions (
  settings_version_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  version_number INTEGER NOT NULL,
  settings_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  soft_update_policy_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_summary TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_wssv_server_version UNIQUE (world_server_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_wssv_world_server_id ON world_server_settings_versions(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wssv_created_by_user_id ON world_server_settings_versions(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_wssv_created_at ON world_server_settings_versions(created_at DESC);

CREATE TABLE IF NOT EXISTS world_server_ruleset_versions (
  ruleset_version_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  game_system_id TEXT NOT NULL,
  version_label TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'draft',
  ruleset_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  compatibility_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wsrv_world_server_id ON world_server_ruleset_versions(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wsrv_game_system_id ON world_server_ruleset_versions(game_system_id);
CREATE INDEX IF NOT EXISTS idx_wsrv_lifecycle_status ON world_server_ruleset_versions(lifecycle_status);

CREATE TABLE IF NOT EXISTS campaign_ruleset_snapshots (
  ruleset_snapshot_id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  ruleset_version_id TEXT REFERENCES world_server_ruleset_versions(ruleset_version_id) ON DELETE SET NULL,
  game_system_id TEXT NOT NULL,
  snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  pinned_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  pinned_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crs_campaign_id ON campaign_ruleset_snapshots(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crs_world_server_id ON campaign_ruleset_snapshots(world_server_id);
CREATE INDEX IF NOT EXISTS idx_crs_ruleset_version_id ON campaign_ruleset_snapshots(ruleset_version_id);

CREATE TABLE IF NOT EXISTS world_server_update_notices (
  update_notice_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  notice_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  lifecycle_status TEXT NOT NULL DEFAULT 'draft',
  policy_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wsun_world_server_id ON world_server_update_notices(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wsun_lifecycle_status ON world_server_update_notices(lifecycle_status);

-- C. Compendium / pack / ruleset content foundation.
CREATE TABLE IF NOT EXISTS game_system_registry (
  game_system_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  system_kind TEXT NOT NULL DEFAULT 'template',
  lifecycle_status TEXT NOT NULL DEFAULT 'active',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gsr_system_kind ON game_system_registry(system_kind);
CREATE INDEX IF NOT EXISTS idx_gsr_lifecycle_status ON game_system_registry(lifecycle_status);

CREATE TABLE IF NOT EXISTS ruleset_templates (
  ruleset_template_id TEXT PRIMARY KEY,
  game_system_id TEXT REFERENCES game_system_registry(game_system_id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  version_label TEXT,
  template_kind TEXT NOT NULL DEFAULT 'system',
  template_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ruleset_templates_game_system_id ON ruleset_templates(game_system_id);
CREATE INDEX IF NOT EXISTS idx_ruleset_templates_template_kind ON ruleset_templates(template_kind);

CREATE TABLE IF NOT EXISTS ruleset_versions (
  ruleset_version_id TEXT PRIMARY KEY,
  ruleset_template_id TEXT REFERENCES ruleset_templates(ruleset_template_id) ON DELETE SET NULL,
  game_system_id TEXT REFERENCES game_system_registry(game_system_id) ON DELETE SET NULL,
  version_label TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'draft',
  ruleset_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ruleset_versions_template_id ON ruleset_versions(ruleset_template_id);
CREATE INDEX IF NOT EXISTS idx_ruleset_versions_game_system_id ON ruleset_versions(game_system_id);

CREATE TABLE IF NOT EXISTS compendium_packs (
  pack_id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  rights_policy_id TEXT REFERENCES content_rights_policies(rights_policy_id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  pack_kind TEXT NOT NULL DEFAULT 'private',
  visibility_scope TEXT NOT NULL DEFAULT 'user_private',
  lifecycle_status TEXT NOT NULL DEFAULT 'draft',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compendium_packs_owner_id ON compendium_packs(owner_id);
CREATE INDEX IF NOT EXISTS idx_compendium_packs_world_server_id ON compendium_packs(world_server_id);
CREATE INDEX IF NOT EXISTS idx_compendium_packs_campaign_id ON compendium_packs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_compendium_packs_visibility_scope ON compendium_packs(visibility_scope);

CREATE TABLE IF NOT EXISTS compendium_pack_versions (
  pack_version_id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES compendium_packs(pack_id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  manifest_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  rights_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cpv_pack_id ON compendium_pack_versions(pack_id);

CREATE TABLE IF NOT EXISTS compendium_entries (
  compendium_entry_id TEXT PRIMARY KEY,
  pack_version_id TEXT NOT NULL REFERENCES compendium_pack_versions(pack_version_id) ON DELETE CASCADE,
  entry_kind TEXT NOT NULL,
  display_name TEXT NOT NULL,
  source_ref_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_ref_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compendium_entries_pack_version_id ON compendium_entries(pack_version_id);
CREATE INDEX IF NOT EXISTS idx_compendium_entries_entry_kind ON compendium_entries(entry_kind);

CREATE TABLE IF NOT EXISTS world_server_pack_bindings (
  pack_binding_id TEXT PRIMARY KEY,
  world_server_id TEXT NOT NULL REFERENCES world_servers(world_server_id) ON DELETE CASCADE,
  pack_version_id TEXT NOT NULL REFERENCES compendium_pack_versions(pack_version_id) ON DELETE CASCADE,
  binding_status TEXT NOT NULL DEFAULT 'enabled',
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_wspb_server_pack_version UNIQUE (world_server_id, pack_version_id)
);

CREATE INDEX IF NOT EXISTS idx_wspb_world_server_id ON world_server_pack_bindings(world_server_id);
CREATE INDEX IF NOT EXISTS idx_wspb_pack_version_id ON world_server_pack_bindings(pack_version_id);

CREATE TABLE IF NOT EXISTS campaign_pack_bindings (
  pack_binding_id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  pack_version_id TEXT NOT NULL REFERENCES compendium_pack_versions(pack_version_id) ON DELETE CASCADE,
  binding_status TEXT NOT NULL DEFAULT 'enabled',
  created_by_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT uq_cpb_campaign_pack_version UNIQUE (campaign_id, pack_version_id)
);

CREATE INDEX IF NOT EXISTS idx_cpb_campaign_id ON campaign_pack_bindings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cpb_pack_version_id ON campaign_pack_bindings(pack_version_id);

CREATE TABLE IF NOT EXISTS private_import_batches (
  import_batch_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  pack_id TEXT REFERENCES compendium_packs(pack_id) ON DELETE SET NULL,
  import_kind TEXT NOT NULL,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  import_status TEXT NOT NULL DEFAULT 'preview',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_private_import_batches_owner_id ON private_import_batches(owner_id);
CREATE INDEX IF NOT EXISTS idx_private_import_batches_pack_id ON private_import_batches(pack_id);

-- D. Campaign actor instance / runtime actor metadata foundation.
CREATE TABLE IF NOT EXISTS campaign_actor_instances (
  campaign_actor_instance_id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  source_actor_id TEXT REFERENCES actors(actor_id) ON DELETE SET NULL,
  owner_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  actor_kind TEXT NOT NULL DEFAULT 'pc',
  display_name TEXT NOT NULL,
  instance_status TEXT NOT NULL DEFAULT 'active',
  snapshot_hash TEXT,
  snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  override_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cai_campaign_id ON campaign_actor_instances(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cai_source_actor_id ON campaign_actor_instances(source_actor_id);
CREATE INDEX IF NOT EXISTS idx_cai_owner_id ON campaign_actor_instances(owner_id);
CREATE INDEX IF NOT EXISTS idx_cai_instance_status ON campaign_actor_instances(instance_status);

CREATE TABLE IF NOT EXISTS campaign_actor_bindings (
  actor_binding_id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  campaign_actor_instance_id TEXT NOT NULL REFERENCES campaign_actor_instances(campaign_actor_instance_id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  binding_role TEXT NOT NULL DEFAULT 'player',
  binding_status TEXT NOT NULL DEFAULT 'pending',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cab_campaign_id ON campaign_actor_bindings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cab_instance_id ON campaign_actor_bindings(campaign_actor_instance_id);
CREATE INDEX IF NOT EXISTS idx_cab_user_id ON campaign_actor_bindings(user_id);

CREATE TABLE IF NOT EXISTS runtime_actor_slots (
  runtime_actor_slot_id TEXT PRIMARY KEY,
  runtime_session_id TEXT REFERENCES runtime_sessions(runtime_session_id) ON DELETE SET NULL,
  campaign_actor_instance_id TEXT REFERENCES campaign_actor_instances(campaign_actor_instance_id) ON DELETE SET NULL,
  slot_kind TEXT NOT NULL DEFAULT 'player',
  slot_status TEXT NOT NULL DEFAULT 'active',
  snapshot_hash TEXT,
  runtime_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_runtime_actor_slots_session_id ON runtime_actor_slots(runtime_session_id);
CREATE INDEX IF NOT EXISTS idx_runtime_actor_slots_instance_id ON runtime_actor_slots(campaign_actor_instance_id);

-- E. Room / lobby / runtime session metadata foundation.
CREATE TABLE IF NOT EXISTS room_records (
  room_record_id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL UNIQUE,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  host_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  room_code TEXT,
  room_status TEXT NOT NULL DEFAULT 'lobby',
  multiplayer_mode TEXT NOT NULL DEFAULT 'lan',
  access_policy_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_room_records_room_id ON room_records(room_id);
CREATE INDEX IF NOT EXISTS idx_room_records_world_server_id ON room_records(world_server_id);
CREATE INDEX IF NOT EXISTS idx_room_records_campaign_id ON room_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_room_records_host_user_id ON room_records(host_user_id);
CREATE INDEX IF NOT EXISTS idx_room_records_room_status ON room_records(room_status);

CREATE TABLE IF NOT EXISTS room_participants (
  room_participant_id TEXT PRIMARY KEY,
  room_record_id TEXT NOT NULL REFERENCES room_records(room_record_id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  participant_role TEXT NOT NULL DEFAULT 'player',
  participant_status TEXT NOT NULL DEFAULT 'pending',
  ready_status TEXT NOT NULL DEFAULT 'not_ready',
  actor_binding_id TEXT REFERENCES campaign_actor_bindings(actor_binding_id) ON DELETE SET NULL,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_room_participants_room_record_id ON room_participants(room_record_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_actor_binding_id ON room_participants(actor_binding_id);

CREATE TABLE IF NOT EXISTS room_lobby_slots (
  lobby_slot_id TEXT PRIMARY KEY,
  room_record_id TEXT NOT NULL REFERENCES room_records(room_record_id) ON DELETE CASCADE,
  room_participant_id TEXT REFERENCES room_participants(room_participant_id) ON DELETE SET NULL,
  campaign_actor_instance_id TEXT REFERENCES campaign_actor_instances(campaign_actor_instance_id) ON DELETE SET NULL,
  slot_label TEXT,
  slot_status TEXT NOT NULL DEFAULT 'open',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_room_lobby_slots_room_record_id ON room_lobby_slots(room_record_id);
CREATE INDEX IF NOT EXISTS idx_room_lobby_slots_participant_id ON room_lobby_slots(room_participant_id);

CREATE TABLE IF NOT EXISTS runtime_session_bindings (
  runtime_session_binding_id TEXT PRIMARY KEY,
  runtime_session_id TEXT NOT NULL REFERENCES runtime_sessions(runtime_session_id) ON DELETE CASCADE,
  room_record_id TEXT REFERENCES room_records(room_record_id) ON DELETE SET NULL,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  binding_status TEXT NOT NULL DEFAULT 'active',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rsb_runtime_session_id ON runtime_session_bindings(runtime_session_id);
CREATE INDEX IF NOT EXISTS idx_rsb_room_record_id ON runtime_session_bindings(room_record_id);
CREATE INDEX IF NOT EXISTS idx_rsb_campaign_id ON runtime_session_bindings(campaign_id);

-- F. Chat / notes / maps / handouts foundation.
CREATE TABLE IF NOT EXISTS content_threads (
  content_thread_id TEXT PRIMARY KEY,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  owner_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  thread_kind TEXT NOT NULL DEFAULT 'chat',
  title TEXT NOT NULL,
  visibility_record_id TEXT REFERENCES content_visibility_records(visibility_record_id) ON DELETE SET NULL,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_content_threads_world_server_id ON content_threads(world_server_id);
CREATE INDEX IF NOT EXISTS idx_content_threads_campaign_id ON content_threads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_threads_owner_id ON content_threads(owner_id);

CREATE TABLE IF NOT EXISTS content_messages (
  content_message_id TEXT PRIMARY KEY,
  content_thread_id TEXT NOT NULL REFERENCES content_threads(content_thread_id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  message_kind TEXT NOT NULL DEFAULT 'chat',
  body_text TEXT,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_content_messages_thread_id ON content_messages(content_thread_id);
CREATE INDEX IF NOT EXISTS idx_content_messages_author_user_id ON content_messages(author_user_id);
CREATE INDEX IF NOT EXISTS idx_content_messages_created_at ON content_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS content_documents (
  content_document_id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  asset_id TEXT REFERENCES asset_metadata(asset_id) ON DELETE SET NULL,
  document_kind TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  body_text TEXT,
  visibility_record_id TEXT REFERENCES content_visibility_records(visibility_record_id) ON DELETE SET NULL,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_content_documents_owner_id ON content_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_content_documents_world_server_id ON content_documents(world_server_id);
CREATE INDEX IF NOT EXISTS idx_content_documents_campaign_id ON content_documents(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_documents_document_kind ON content_documents(document_kind);

CREATE TABLE IF NOT EXISTS map_records (
  map_record_id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  asset_id TEXT REFERENCES asset_metadata(asset_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  map_kind TEXT NOT NULL DEFAULT 'static',
  map_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility_record_id TEXT REFERENCES content_visibility_records(visibility_record_id) ON DELETE SET NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_map_records_owner_id ON map_records(owner_id);
CREATE INDEX IF NOT EXISTS idx_map_records_campaign_id ON map_records(campaign_id);

CREATE TABLE IF NOT EXISTS scene_map_bindings (
  scene_map_binding_id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  map_record_id TEXT REFERENCES map_records(map_record_id) ON DELETE SET NULL,
  runtime_session_id TEXT REFERENCES runtime_sessions(runtime_session_id) ON DELETE SET NULL,
  scene_key TEXT NOT NULL,
  binding_status TEXT NOT NULL DEFAULT 'active',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scene_map_bindings_campaign_id ON scene_map_bindings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_scene_map_bindings_map_record_id ON scene_map_bindings(map_record_id);

-- G. Audit / moderation / AI operation persistence.
CREATE TABLE IF NOT EXISTS server_audit_log (
  audit_log_id TEXT PRIMARY KEY,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  actor_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  action_kind TEXT NOT NULL,
  target_kind TEXT,
  target_id TEXT,
  decision_code TEXT NOT NULL DEFAULT 'recorded',
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_server_audit_world_server_id ON server_audit_log(world_server_id);
CREATE INDEX IF NOT EXISTS idx_server_audit_campaign_id ON server_audit_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_server_audit_actor_user_id ON server_audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_server_audit_action_kind ON server_audit_log(action_kind);
CREATE INDEX IF NOT EXISTS idx_server_audit_created_at ON server_audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS permission_decision_audit_records (
  permission_decision_id TEXT PRIMARY KEY,
  viewer_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT,
  action_kind TEXT NOT NULL,
  decision_code TEXT NOT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pdar_viewer_user_id ON permission_decision_audit_records(viewer_user_id);
CREATE INDEX IF NOT EXISTS idx_pdar_target ON permission_decision_audit_records(target_kind, target_id);
CREATE INDEX IF NOT EXISTS idx_pdar_decision_code ON permission_decision_audit_records(decision_code);

CREATE TABLE IF NOT EXISTS ai_operation_audit_records (
  ai_operation_audit_id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  operation_kind TEXT NOT NULL,
  decision_code TEXT NOT NULL,
  source_counts_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  retrieval_manifest_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_operation_audit_owner_id ON ai_operation_audit_records(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_operation_audit_operation_kind ON ai_operation_audit_records(operation_kind);
CREATE INDEX IF NOT EXISTS idx_ai_operation_audit_decision_code ON ai_operation_audit_records(decision_code);

CREATE TABLE IF NOT EXISTS moderation_actions (
  moderation_action_id TEXT PRIMARY KEY,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  actor_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT,
  action_kind TEXT NOT NULL,
  action_status TEXT NOT NULL DEFAULT 'active',
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_world_server_id ON moderation_actions(world_server_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_actor_user_id ON moderation_actions(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_kind, target_id);

-- H. Notifications / inbox foundation.
CREATE TABLE IF NOT EXISTS user_notifications (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  world_server_id TEXT REFERENCES world_servers(world_server_id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  notification_kind TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'unread',
  title TEXT NOT NULL,
  metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_status ON user_notifications(notification_status);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
