import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresRuntimeEventSchemaReadiness } from './postgresRuntimeEventSchemaReadiness.js';

/**
 * GeneratedArtifact / AI Memory schema readiness (P5.15B) — read-only, server-only.
 *
 * Mirrors the other readiness helpers. generated_artifacts references users,
 * campaigns, runtime_sessions, and runtime_events, so it reuses the RuntimeEvent
 * readiness helper (which already chains User -> Campaign -> Actor -> Runtime) to
 * classify upstream dependency gaps, then verifies the three generated/AI tables
 * + required columns. Never prints the connection string, never creates tables,
 * never runs a migration.
 */

export type PostgresGeneratedArtifactSchemaReadinessStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'runtime_event_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresGeneratedArtifactSchemaReadinessResult {
  status: PostgresGeneratedArtifactSchemaReadinessStatus;
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
  generated_artifacts: [
    'artifact_id',
    'owner_id',
    'campaign_id',
    'runtime_session_id',
    'runtime_event_id',
    'artifact_kind',
    'title',
    'summary',
    'content_format',
    'visibility_scope',
    'artifact_payload',
    'source_payload',
    'model_payload',
    'schema_version',
    'created_at',
    'updated_at',
    'archived_at',
  ],
  ai_memory_entries: [
    'memory_entry_id',
    'owner_id',
    'campaign_id',
    'runtime_session_id',
    'source_artifact_id',
    'memory_kind',
    'memory_scope',
    'title',
    'content_text',
    'visibility_scope',
    'memory_payload',
    'source_payload',
    'confidence',
    'schema_version',
    'created_at',
    'updated_at',
    'archived_at',
  ],
  ai_context_sources: [
    'context_source_id',
    'owner_id',
    'campaign_id',
    'artifact_id',
    'memory_entry_id',
    'source_kind',
    'source_ref_id',
    'source_payload',
    'schema_version',
    'created_at',
  ],
};

const GENERATED_TABLES = ['generated_artifacts', 'ai_memory_entries', 'ai_context_sources'];

function classifySchemaError(error: unknown): Pick<PostgresGeneratedArtifactSchemaReadinessResult, 'status' | 'errorKind'> {
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

export async function checkPostgresGeneratedArtifactSchemaReadiness(): Promise<PostgresGeneratedArtifactSchemaReadinessResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  if (!config.configured) {
    return { status: 'not_configured' };
  }

  // Dependency chain: User -> Campaign -> Runtime (sessions/events). RuntimeEvent
  // readiness already validates all of these; map its statuses onto ours.
  const runtimeSchema = await checkPostgresRuntimeEventSchemaReadiness();
  if (runtimeSchema.status === 'not_configured') return { status: 'not_configured' };
  if (runtimeSchema.status === 'unreachable') {
    return { status: 'unreachable', errorKind: runtimeSchema.errorKind, latencyMs: runtimeSchema.latencyMs };
  }
  if (runtimeSchema.status === 'error') {
    return { status: 'error', errorKind: runtimeSchema.errorKind, latencyMs: runtimeSchema.latencyMs };
  }
  if (runtimeSchema.status === 'user_schema_missing') {
    return { status: 'user_schema_missing', missingTables: runtimeSchema.missingTables, missingColumns: runtimeSchema.missingColumns, latencyMs: runtimeSchema.latencyMs };
  }
  if (runtimeSchema.status === 'campaign_schema_missing') {
    return { status: 'campaign_schema_missing', missingTables: runtimeSchema.missingTables, missingColumns: runtimeSchema.missingColumns, latencyMs: runtimeSchema.latencyMs };
  }
  if (runtimeSchema.status === 'actor_schema_missing' || runtimeSchema.status === 'schema_missing') {
    // Actor/runtime tables are part of the runtime dependency the FKs need.
    return {
      status: 'runtime_event_schema_missing',
      missingTables: runtimeSchema.missingTables ?? ['runtime_sessions', 'runtime_events'],
      missingColumns: runtimeSchema.missingColumns,
      latencyMs: runtimeSchema.latencyMs,
    };
  }

  const startedAt = Date.now();
  try {
    const result = await queryPostgres<InformationSchemaColumnRow>(
      `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('generated_artifacts', 'ai_memory_entries', 'ai_context_sources')
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

    const missingTables = GENERATED_TABLES.filter((table) => !columnsByTable.has(table));
    if (missingTables.length > 0) {
      return { status: 'schema_missing', missingTables, latencyMs };
    }

    const missingColumns: { table: string; columns: string[] }[] = [];
    for (const table of GENERATED_TABLES) {
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

export function getRequiredPostgresGeneratedArtifactSchemaColumns(): Record<string, string[]> {
  return {
    generated_artifacts: [...REQUIRED_COLUMNS.generated_artifacts],
    ai_memory_entries: [...REQUIRED_COLUMNS.ai_memory_entries],
    ai_context_sources: [...REQUIRED_COLUMNS.ai_context_sources],
  };
}
