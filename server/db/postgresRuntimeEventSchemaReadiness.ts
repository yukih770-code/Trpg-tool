import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresCampaignSchemaReadiness } from './postgresCampaignSchemaReadiness.js';
import { checkPostgresActorSchemaReadiness } from './postgresActorSchemaReadiness.js';

/**
 * RuntimeEvent schema readiness (P5.14B) — read-only, server-only.
 *
 * Mirrors the Campaign/Actor/Asset readiness helpers. It verifies the dependency
 * chain (owner/campaign/actor/user FKs) by reusing the Actor readiness helper
 * (which chains User) and the Campaign readiness helper (which chains User), then
 * verifies both runtime tables + required columns. Never prints the connection
 * string, never creates tables, never runs a migration.
 */

export type PostgresRuntimeEventSchemaReadinessStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'actor_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresRuntimeEventSchemaReadinessResult {
  status: PostgresRuntimeEventSchemaReadinessStatus;
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
  runtime_sessions: [
    'runtime_session_id',
    'campaign_id',
    'host_user_id',
    'room_id',
    'title',
    'status',
    'session_payload',
    'schema_version',
    'started_at',
    'ended_at',
    'created_at',
    'updated_at',
    'archived_at',
  ],
  runtime_events: [
    'runtime_event_id',
    'runtime_session_id',
    'campaign_id',
    'seq',
    'event_kind',
    'visibility',
    'actor_id',
    'caused_by_event_id',
    'idempotency_key',
    'event_payload',
    'schema_version',
    'created_by_user_id',
    'created_at',
  ],
};

const RUNTIME_TABLES = ['runtime_sessions', 'runtime_events'];

function classifySchemaError(error: unknown): Pick<PostgresRuntimeEventSchemaReadinessResult, 'status' | 'errorKind'> {
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

export async function checkPostgresRuntimeEventSchemaReadiness(): Promise<PostgresRuntimeEventSchemaReadinessResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  if (!config.configured) {
    return { status: 'not_configured' };
  }

  // Dependency chain precedence: User -> Campaign -> Actor. Actor readiness chains
  // User; Campaign readiness chains User. Check both to classify precisely.
  const actorSchema = await checkPostgresActorSchemaReadiness();
  if (actorSchema.status === 'not_configured') return { status: 'not_configured' };
  if (actorSchema.status === 'unreachable') {
    return { status: 'unreachable', errorKind: actorSchema.errorKind, latencyMs: actorSchema.latencyMs };
  }
  if (actorSchema.status === 'error') {
    return { status: 'error', errorKind: actorSchema.errorKind, latencyMs: actorSchema.latencyMs };
  }
  if (actorSchema.status === 'user_schema_missing') {
    return { status: 'user_schema_missing', missingTables: actorSchema.missingTables, missingColumns: actorSchema.missingColumns, latencyMs: actorSchema.latencyMs };
  }

  const campaignSchema = await checkPostgresCampaignSchemaReadiness();
  if (campaignSchema.status === 'user_schema_missing') {
    return { status: 'user_schema_missing', missingTables: campaignSchema.missingTables, missingColumns: campaignSchema.missingColumns, latencyMs: campaignSchema.latencyMs };
  }
  if (campaignSchema.status === 'schema_missing') {
    return { status: 'campaign_schema_missing', missingTables: campaignSchema.missingTables ?? ['campaigns'], missingColumns: campaignSchema.missingColumns, latencyMs: campaignSchema.latencyMs };
  }

  if (actorSchema.status === 'schema_missing') {
    return { status: 'actor_schema_missing', missingTables: actorSchema.missingTables ?? ['actors'], missingColumns: actorSchema.missingColumns, latencyMs: actorSchema.latencyMs };
  }

  const startedAt = Date.now();
  try {
    const result = await queryPostgres<InformationSchemaColumnRow>(
      `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name IN ('runtime_sessions', 'runtime_events')
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

    const missingTables = RUNTIME_TABLES.filter((table) => !columnsByTable.has(table));
    if (missingTables.length > 0) {
      return { status: 'schema_missing', missingTables, latencyMs };
    }

    const missingColumns: { table: string; columns: string[] }[] = [];
    for (const table of RUNTIME_TABLES) {
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

export function getRequiredPostgresRuntimeEventSchemaColumns(): Record<string, string[]> {
  return {
    runtime_sessions: [...REQUIRED_COLUMNS.runtime_sessions],
    runtime_events: [...REQUIRED_COLUMNS.runtime_events],
  };
}
