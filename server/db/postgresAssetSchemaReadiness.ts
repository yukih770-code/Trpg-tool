import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresCampaignSchemaReadiness } from './postgresCampaignSchemaReadiness.js';

/**
 * Asset / Media schema readiness (P5.13B) — read-only, server-only.
 *
 * Mirrors the Campaign/Actor schema readiness helpers. It verifies the dependency
 * chain: `asset_metadata.owner_id` -> users, and `asset_metadata.campaign_id` ->
 * campaigns (nullable FK, but the campaigns table must exist for the FK to be
 * valid). It reuses the Campaign readiness helper, which already checks the User
 * schema, then verifies the two asset tables + required columns. Never prints the
 * connection string, never creates tables, never runs a migration.
 */

export type PostgresAssetSchemaReadinessStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresAssetSchemaReadinessResult {
  status: PostgresAssetSchemaReadinessStatus;
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
  object_storage_refs: [
    'storage_ref_id',
    'owner_id',
    'provider_kind',
    'bucket',
    'object_key',
    'url',
    'content_hash',
    'metadata_payload',
    'schema_version',
    'created_at',
    'updated_at',
    'archived_at',
  ],
  asset_metadata: [
    'asset_id',
    'owner_id',
    'campaign_id',
    'asset_kind',
    'title',
    'description',
    'mime_type',
    'file_name',
    'file_size_bytes',
    'storage_ref_id',
    'external_url',
    'metadata_payload',
    'schema_version',
    'created_at',
    'updated_at',
    'archived_at',
  ],
};

const ASSET_TABLES = ['asset_metadata', 'object_storage_refs'];

function classifySchemaError(error: unknown): Pick<PostgresAssetSchemaReadinessResult, 'status' | 'errorKind'> {
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

export async function checkPostgresAssetSchemaReadiness(): Promise<PostgresAssetSchemaReadinessResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  if (!config.configured) {
    return { status: 'not_configured' };
  }

  // Asset depends on the User schema (owner_id FK) and the Campaign schema
  // (campaign_id FK). The Campaign readiness helper already chains the User check.
  const campaignSchema = await checkPostgresCampaignSchemaReadiness();
  if (campaignSchema.status === 'not_configured') return { status: 'not_configured' };
  if (campaignSchema.status === 'unreachable') {
    return { status: 'unreachable', errorKind: campaignSchema.errorKind, latencyMs: campaignSchema.latencyMs };
  }
  if (campaignSchema.status === 'error') {
    return { status: 'error', errorKind: campaignSchema.errorKind, latencyMs: campaignSchema.latencyMs };
  }
  if (campaignSchema.status === 'user_schema_missing') {
    return {
      status: 'user_schema_missing',
      missingTables: campaignSchema.missingTables,
      missingColumns: campaignSchema.missingColumns,
      latencyMs: campaignSchema.latencyMs,
    };
  }
  if (campaignSchema.status === 'schema_missing') {
    return {
      status: 'campaign_schema_missing',
      missingTables: campaignSchema.missingTables ?? ['campaigns'],
      missingColumns: campaignSchema.missingColumns,
      latencyMs: campaignSchema.latencyMs,
    };
  }

  const startedAt = Date.now();
  try {
    const result = await queryPostgres<InformationSchemaColumnRow>(
      `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name IN ('asset_metadata', 'object_storage_refs')
        ORDER BY table_name, ordinal_position
      `,
      [],
      config,
    );

    const latencyMs = Date.now() - startedAt;
    const columnsByTable = new Map<string, Set<string>>();
    for (const row of result.rows) {
      if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, new Set());
      columnsByTable.get(row.table_name)!.add(row.column_name);
    }

    const missingTables = ASSET_TABLES.filter((table) => !columnsByTable.has(table));
    if (missingTables.length > 0) {
      return { status: 'schema_missing', missingTables, latencyMs };
    }

    const missingColumns: { table: string; columns: string[] }[] = [];
    for (const table of ASSET_TABLES) {
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

export function getRequiredPostgresAssetSchemaColumns(): Record<string, string[]> {
  return {
    asset_metadata: [...REQUIRED_COLUMNS.asset_metadata],
    object_storage_refs: [...REQUIRED_COLUMNS.object_storage_refs],
  };
}
