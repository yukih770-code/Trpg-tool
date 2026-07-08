import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresWorldServerSchemaReadiness } from './postgresWorldServerSchemaReadiness.js';

/**
 * Visibility / Scope / Rights schema readiness (P5.19B) — read-only, server-only.
 *
 * Mirrors the other readiness helpers. Visibility records reference users, world
 * servers, and campaigns, so it reuses the World Server readiness helper (which
 * already chains User + Campaign + World Server), then verifies the three visibility
 * tables + required columns. Never prints the connection string, never creates
 * tables, never runs a migration.
 */

export type PostgresVisibilitySchemaReadinessStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'world_server_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresVisibilitySchemaReadinessResult {
  status: PostgresVisibilitySchemaReadinessStatus;
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
  content_rights_policies: [
    'rights_policy_id', 'owner_id', 'policy_kind', 'license_id', 'license_label',
    'attribution_text', 'source_url', 'source_payload', 'redistribution_allowed',
    'commercial_use_allowed', 'public_sharing_allowed', 'derivative_allowed',
    'ai_context_allowed', 'ai_training_allowed', 'rights_payload', 'schema_version',
    'created_at', 'updated_at', 'archived_at',
  ],
  content_visibility_records: [
    'visibility_record_id', 'owner_id', 'world_server_id', 'campaign_id', 'rights_policy_id',
    'content_kind', 'content_id', 'projection_kind', 'visibility_scope', 'public_search_allowed',
    'public_profile_allowed', 'workshop_publish_allowed', 'community_feed_allowed', 'ai_scope',
    'review_status', 'moderation_status', 'lifecycle_status', 'visibility_payload', 'schema_version',
    'created_at', 'updated_at', 'archived_at',
  ],
  content_publication_reviews: [
    'publication_review_id', 'visibility_record_id', 'owner_id', 'submitted_by_user_id',
    'reviewed_by_user_id', 'target_surface', 'review_status', 'submit_message', 'review_message',
    'review_payload', 'schema_version', 'submitted_at', 'reviewed_at', 'created_at', 'updated_at', 'archived_at',
  ],
};

const VISIBILITY_TABLES = Object.keys(REQUIRED_COLUMNS);

function classifySchemaError(error: unknown): Pick<PostgresVisibilitySchemaReadinessResult, 'status' | 'errorKind'> {
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

export async function checkPostgresVisibilitySchemaReadiness(): Promise<PostgresVisibilitySchemaReadinessResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  if (!config.configured) {
    return { status: 'not_configured' };
  }

  // Visibility depends on User + Campaign + World Server. World Server readiness
  // chains User + Campaign; map its statuses onto ours.
  const worldSchema = await checkPostgresWorldServerSchemaReadiness();
  if (worldSchema.status === 'not_configured') return { status: 'not_configured' };
  if (worldSchema.status === 'unreachable') {
    return { status: 'unreachable', errorKind: worldSchema.errorKind, latencyMs: worldSchema.latencyMs };
  }
  if (worldSchema.status === 'error') {
    return { status: 'error', errorKind: worldSchema.errorKind, latencyMs: worldSchema.latencyMs };
  }
  if (worldSchema.status === 'user_schema_missing') {
    return { status: 'user_schema_missing', missingTables: worldSchema.missingTables, missingColumns: worldSchema.missingColumns, latencyMs: worldSchema.latencyMs };
  }
  if (worldSchema.status === 'campaign_schema_missing') {
    return { status: 'campaign_schema_missing', missingTables: worldSchema.missingTables, missingColumns: worldSchema.missingColumns, latencyMs: worldSchema.latencyMs };
  }
  if (worldSchema.status === 'schema_missing') {
    return { status: 'world_server_schema_missing', missingTables: worldSchema.missingTables, missingColumns: worldSchema.missingColumns, latencyMs: worldSchema.latencyMs };
  }

  const startedAt = Date.now();
  try {
    const result = await queryPostgres<InformationSchemaColumnRow>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name IN (
         'content_rights_policies','content_visibility_records','content_publication_reviews')
       ORDER BY table_name, ordinal_position`,
      [],
      config,
    );

    const latencyMs = Date.now() - startedAt;
    const columnsByTable = new Map<string, Set<string>>();
    for (const row of result.rows) {
      if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, new Set());
      columnsByTable.get(row.table_name)!.add(row.column_name);
    }

    const missingTables = VISIBILITY_TABLES.filter((table) => !columnsByTable.has(table));
    if (missingTables.length > 0) {
      return { status: 'schema_missing', missingTables, latencyMs };
    }

    const missingColumns: { table: string; columns: string[] }[] = [];
    for (const table of VISIBILITY_TABLES) {
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

export function getRequiredPostgresVisibilitySchemaColumns(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const table of VISIBILITY_TABLES) out[table] = [...REQUIRED_COLUMNS[table]];
  return out;
}
