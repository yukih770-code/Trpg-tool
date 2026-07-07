import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresUserSchemaReadiness } from './postgresSchemaReadiness.js';

/**
 * Campaign schema readiness (P5.11B) — read-only, server-only.
 *
 * Mirrors the User schema readiness helper. It also verifies the User schema
 * dependency, because `campaigns.owner_id` references `users(user_id)`. Never
 * prints the connection string, never creates tables, never runs a migration.
 */

export type PostgresCampaignSchemaReadinessStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresCampaignSchemaReadinessResult {
  status: PostgresCampaignSchemaReadinessStatus;
  missingTables?: string[];
  missingColumns?: { table: string; columns: string[] }[];
  errorKind?: string;
  latencyMs?: number;
}

interface InformationSchemaColumnRow {
  table_name: string;
  column_name: string;
}

const REQUIRED_CAMPAIGN_COLUMNS: string[] = [
  'campaign_id',
  'owner_id',
  'title',
  'description',
  'system_id',
  'status',
  'lifecycle_status',
  'campaign_payload',
  'schema_version',
  'created_at',
  'updated_at',
  'archived_at',
];

function classifySchemaError(error: unknown): Pick<PostgresCampaignSchemaReadinessResult, 'status' | 'errorKind'> {
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

export async function checkPostgresCampaignSchemaReadiness(): Promise<PostgresCampaignSchemaReadinessResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  if (!config.configured) {
    return { status: 'not_configured' };
  }

  // Campaign depends on the User schema (owner_id FK → users).
  const userSchema = await checkPostgresUserSchemaReadiness();
  if (userSchema.status === 'not_configured') return { status: 'not_configured' };
  if (userSchema.status === 'unreachable') {
    return { status: 'unreachable', errorKind: userSchema.errorKind, latencyMs: userSchema.latencyMs };
  }
  if (userSchema.status === 'error') {
    return { status: 'error', errorKind: userSchema.errorKind, latencyMs: userSchema.latencyMs };
  }
  if (userSchema.status === 'schema_missing') {
    return {
      status: 'user_schema_missing',
      missingTables: userSchema.missingTables,
      missingColumns: userSchema.missingColumns,
      latencyMs: userSchema.latencyMs,
    };
  }

  const startedAt = Date.now();
  try {
    const result = await queryPostgres<InformationSchemaColumnRow>(
      `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'campaigns'
        ORDER BY ordinal_position
      `,
      [],
      config,
    );

    const existingColumns = new Set(result.rows.map((row) => row.column_name));
    const latencyMs = Date.now() - startedAt;

    if (existingColumns.size === 0) {
      return { status: 'schema_missing', missingTables: ['campaigns'], latencyMs };
    }

    const missing = REQUIRED_CAMPAIGN_COLUMNS.filter((column) => !existingColumns.has(column));
    if (missing.length > 0) {
      return { status: 'schema_missing', missingColumns: [{ table: 'campaigns', columns: missing }], latencyMs };
    }

    return { status: 'ready', latencyMs };
  } catch (error) {
    return { ...classifySchemaError(error), latencyMs: Date.now() - startedAt };
  }
}

export function getRequiredPostgresCampaignSchemaColumns(): Record<string, string[]> {
  return { campaigns: [...REQUIRED_CAMPAIGN_COLUMNS] };
}
