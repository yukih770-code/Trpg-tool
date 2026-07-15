import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresVisibilitySchemaReadiness } from './postgresVisibilitySchemaReadiness.js';

/**
 * Remaining platform foundation schema readiness (P5.DB-CLOSURE).
 * Read-only: creates nothing, writes nothing, runs no migrations, prints no URL.
 */

export type PostgresPlatformFoundationSchemaReadinessStatus =
  | 'not_configured'
  | 'unreachable'
  | 'base_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresPlatformFoundationSchemaReadinessResult {
  status: PostgresPlatformFoundationSchemaReadinessStatus;
  missingTables?: string[];
  missingColumns?: { table: string; columns: string[] }[];
  errorKind?: string;
  latencyMs?: number;
}

interface InformationSchemaColumnRow {
  table_name: string;
  column_name: string;
}

const REQUIRED_COLUMNS: Record<string, string[]> = {
  auth_sessions: ['session_id', 'user_id', 'session_kind', 'session_status', 'trust_level', 'metadata_payload', 'created_at', 'last_seen_at', 'expires_at', 'revoked_at'],
  service_identities: ['service_identity_id', 'display_name', 'service_kind', 'identity_status', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  account_security_audit_records: ['account_audit_id', 'user_id', 'session_id', 'event_kind', 'decision_code', 'metadata_payload', 'created_at'],
  world_server_settings_versions: ['settings_version_id', 'world_server_id', 'created_by_user_id', 'version_number', 'settings_payload', 'soft_update_policy_payload', 'change_summary', 'created_at', 'archived_at'],
  world_server_ruleset_versions: ['ruleset_version_id', 'world_server_id', 'game_system_id', 'version_label', 'lifecycle_status', 'ruleset_payload', 'compatibility_payload', 'created_by_user_id', 'created_at', 'published_at', 'archived_at'],
  campaign_ruleset_snapshots: ['ruleset_snapshot_id', 'campaign_id', 'world_server_id', 'ruleset_version_id', 'game_system_id', 'snapshot_payload', 'pinned_by_user_id', 'pinned_at', 'archived_at'],
  world_server_update_notices: ['update_notice_id', 'world_server_id', 'notice_kind', 'title', 'body', 'lifecycle_status', 'policy_payload', 'created_by_user_id', 'created_at', 'published_at', 'archived_at'],
  game_system_registry: ['game_system_id', 'display_name', 'system_kind', 'lifecycle_status', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  ruleset_templates: ['ruleset_template_id', 'game_system_id', 'display_name', 'version_label', 'template_kind', 'template_payload', 'source_payload', 'created_at', 'updated_at', 'archived_at'],
  ruleset_versions: ['ruleset_version_id', 'ruleset_template_id', 'game_system_id', 'version_label', 'lifecycle_status', 'ruleset_payload', 'source_payload', 'created_at', 'published_at', 'archived_at'],
  compendium_packs: ['pack_id', 'owner_id', 'world_server_id', 'campaign_id', 'rights_policy_id', 'display_name', 'pack_kind', 'visibility_scope', 'lifecycle_status', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  compendium_pack_versions: ['pack_version_id', 'pack_id', 'version_label', 'manifest_payload', 'source_payload', 'rights_payload', 'created_at', 'published_at', 'archived_at'],
  compendium_entries: ['compendium_entry_id', 'pack_version_id', 'entry_kind', 'display_name', 'source_ref_payload', 'content_ref_payload', 'metadata_payload', 'created_at', 'archived_at'],
  world_server_pack_bindings: ['pack_binding_id', 'world_server_id', 'pack_version_id', 'binding_status', 'created_by_user_id', 'created_at', 'archived_at'],
  campaign_pack_bindings: ['pack_binding_id', 'campaign_id', 'pack_version_id', 'binding_status', 'created_by_user_id', 'created_at', 'archived_at'],
  private_import_batches: ['import_batch_id', 'owner_id', 'pack_id', 'import_kind', 'source_payload', 'import_status', 'metadata_payload', 'created_at', 'completed_at', 'archived_at'],
  campaign_actor_instances: ['campaign_actor_instance_id', 'campaign_id', 'source_actor_id', 'owner_id', 'actor_kind', 'display_name', 'instance_status', 'snapshot_hash', 'snapshot_payload', 'override_payload', 'created_at', 'updated_at', 'archived_at'],
  campaign_actor_bindings: ['actor_binding_id', 'campaign_id', 'campaign_actor_instance_id', 'user_id', 'binding_role', 'binding_status', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  runtime_actor_slots: ['runtime_actor_slot_id', 'runtime_session_id', 'campaign_actor_instance_id', 'slot_kind', 'slot_status', 'snapshot_hash', 'runtime_payload', 'created_at', 'updated_at', 'archived_at'],
  room_records: ['room_record_id', 'room_id', 'world_server_id', 'campaign_id', 'host_user_id', 'room_code', 'room_status', 'multiplayer_mode', 'access_policy_payload', 'metadata_payload', 'created_at', 'updated_at', 'closed_at', 'archived_at'],
  room_participants: ['room_participant_id', 'room_record_id', 'user_id', 'display_name', 'participant_role', 'participant_status', 'ready_status', 'actor_binding_id', 'metadata_payload', 'created_at', 'updated_at', 'left_at', 'archived_at'],
  room_lobby_slots: ['lobby_slot_id', 'room_record_id', 'room_participant_id', 'campaign_actor_instance_id', 'slot_label', 'slot_status', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  runtime_session_bindings: ['runtime_session_binding_id', 'runtime_session_id', 'room_record_id', 'campaign_id', 'binding_status', 'metadata_payload', 'created_at', 'archived_at'],
  content_threads: ['content_thread_id', 'world_server_id', 'campaign_id', 'owner_id', 'thread_kind', 'title', 'visibility_record_id', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  content_messages: ['content_message_id', 'content_thread_id', 'author_user_id', 'message_kind', 'body_text', 'metadata_payload', 'created_at', 'archived_at'],
  content_documents: ['content_document_id', 'owner_id', 'world_server_id', 'campaign_id', 'asset_id', 'document_kind', 'title', 'body_text', 'visibility_record_id', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  map_records: ['map_record_id', 'owner_id', 'world_server_id', 'campaign_id', 'asset_id', 'title', 'map_kind', 'map_payload', 'visibility_record_id', 'created_at', 'updated_at', 'archived_at'],
  scene_map_bindings: ['scene_map_binding_id', 'campaign_id', 'map_record_id', 'runtime_session_id', 'scene_key', 'binding_status', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  server_audit_log: ['audit_log_id', 'world_server_id', 'campaign_id', 'actor_user_id', 'action_kind', 'target_kind', 'target_id', 'decision_code', 'metadata_payload', 'created_at'],
  permission_decision_audit_records: ['permission_decision_id', 'viewer_user_id', 'world_server_id', 'campaign_id', 'target_kind', 'target_id', 'action_kind', 'decision_code', 'reason_codes', 'metadata_payload', 'created_at'],
  ai_operation_audit_records: ['ai_operation_audit_id', 'owner_id', 'world_server_id', 'campaign_id', 'operation_kind', 'decision_code', 'source_counts_payload', 'retrieval_manifest_payload', 'metadata_payload', 'created_at'],
  moderation_actions: ['moderation_action_id', 'world_server_id', 'campaign_id', 'actor_user_id', 'target_kind', 'target_id', 'action_kind', 'action_status', 'reason_codes', 'metadata_payload', 'created_at', 'updated_at', 'archived_at'],
  user_notifications: ['notification_id', 'user_id', 'world_server_id', 'campaign_id', 'notification_kind', 'notification_status', 'title', 'metadata_payload', 'created_at', 'read_at', 'archived_at'],
};

const PLATFORM_FOUNDATION_TABLES = Object.keys(REQUIRED_COLUMNS);

function classifySchemaError(error: unknown): Pick<PostgresPlatformFoundationSchemaReadinessResult, 'status' | 'errorKind'> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return { status: 'not_configured' };
  }
  const errorKind = error instanceof PostgresDatabaseError ? error.message : 'database_error';
  if (
    errorKind === 'connection_refused' ||
    errorKind === 'connection_timeout' ||
    errorKind === 'host_not_found' ||
    errorKind === 'authentication_failed' ||
    errorKind === 'database_not_found'
  ) {
    return { status: 'unreachable', errorKind };
  }
  return { status: 'error', errorKind };
}

export async function checkPostgresPlatformFoundationSchemaReadiness(): Promise<PostgresPlatformFoundationSchemaReadinessResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  if (!config.configured) {
    return { status: 'not_configured' };
  }

  const base = await checkPostgresVisibilitySchemaReadiness();
  if (base.status === 'not_configured') return { status: 'not_configured' };
  if (base.status === 'unreachable') return { status: 'unreachable', errorKind: base.errorKind, latencyMs: base.latencyMs };
  if (base.status === 'error') return { status: 'error', errorKind: base.errorKind, latencyMs: base.latencyMs };
  if (base.status !== 'ready') {
    return {
      status: 'base_schema_missing',
      missingTables: base.missingTables,
      missingColumns: base.missingColumns,
      latencyMs: base.latencyMs,
    };
  }

  const startedAt = Date.now();
  try {
    const result = await queryPostgres<InformationSchemaColumnRow>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1)
       ORDER BY table_name, ordinal_position`,
      [PLATFORM_FOUNDATION_TABLES],
      config,
    );

    const latencyMs = Date.now() - startedAt;
    const columnsByTable = new Map<string, Set<string>>();
    for (const row of result.rows) {
      if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, new Set());
      columnsByTable.get(row.table_name)!.add(row.column_name);
    }

    const missingTables = PLATFORM_FOUNDATION_TABLES.filter((table) => !columnsByTable.has(table));
    if (missingTables.length > 0) {
      return { status: 'schema_missing', missingTables, latencyMs };
    }

    const missingColumns: { table: string; columns: string[] }[] = [];
    for (const table of PLATFORM_FOUNDATION_TABLES) {
      const existing = columnsByTable.get(table) ?? new Set<string>();
      const missing = REQUIRED_COLUMNS[table].filter((column) => !existing.has(column));
      if (missing.length > 0) missingColumns.push({ table, columns: missing });
    }
    if (missingColumns.length > 0) {
      return { status: 'schema_missing', missingColumns, latencyMs };
    }

    return { status: 'ready', latencyMs };
  } catch (error) {
    return { ...classifySchemaError(error), latencyMs: Date.now() - startedAt };
  }
}

export function getRequiredPostgresPlatformFoundationSchemaColumns(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const table of PLATFORM_FOUNDATION_TABLES) out[table] = [...REQUIRED_COLUMNS[table]];
  return out;
}
