import {
  getGeneratedArtifactById,
  getAiMemoryEntryById,
  getAiContextSourceById,
} from '../adapters/postgresGeneratedArtifactRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import {
  checkPostgresGeneratedArtifactSchemaReadiness,
  type PostgresGeneratedArtifactSchemaReadinessResult,
} from './postgresGeneratedArtifactSchemaReadiness.js';

/**
 * Read-only GeneratedArtifact / AI Memory smoke (P5.15B). Mirrors the other read
 * smokes: health → schema readiness → harmless nonexistent-id probes for an
 * artifact, a memory entry, and a context source. Writes NOTHING, creates no
 * tables, runs no migration, never prints the connection string.
 */

export type PostgresGeneratedArtifactRepositorySmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'runtime_event_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresGeneratedArtifactRepositorySmokeResult {
  status: PostgresGeneratedArtifactRepositorySmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresGeneratedArtifactSchemaReadinessResult;
  probe?: {
    ranNonexistentArtifactLookup: boolean;
    ranNonexistentMemoryLookup: boolean;
    ranNonexistentContextSourceLookup: boolean;
    foundUnexpectedRow: boolean;
  };
  errorKind?: string;
}

// Deterministic, harmless ids that must never exist.
const READONLY_PROBE_ARTIFACT_ID = 'artifact_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_MEMORY_ID = 'memoryEntry_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_CONTEXT_SOURCE_ID = 'contextSource_readonly_smoke_probe_nonexistent';

export async function runPostgresGeneratedArtifactRepositoryReadOnlySmoke(): Promise<PostgresGeneratedArtifactRepositorySmokeResult> {
  const database = await checkPostgresHealth();
  if (database.configured === false) {
    return { status: 'not_configured', database, schema: { status: 'not_configured' } };
  }
  if (database.status !== 'ok') {
    return {
      status: 'unreachable',
      database,
      schema: { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs },
      errorKind: database.errorKind,
    };
  }

  const schema = await checkPostgresGeneratedArtifactSchemaReadiness();
  if (schema.status !== 'ready') {
    return { status: schema.status, database, schema, errorKind: schema.errorKind };
  }

  const artifactProbe = await getGeneratedArtifactById(READONLY_PROBE_ARTIFACT_ID);
  if (artifactProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: artifactProbe.error.kind };
  }
  const memoryProbe = await getAiMemoryEntryById(READONLY_PROBE_MEMORY_ID);
  if (memoryProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: memoryProbe.error.kind };
  }
  const contextProbe = await getAiContextSourceById(READONLY_PROBE_CONTEXT_SOURCE_ID);
  if (contextProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: contextProbe.error.kind };
  }

  return {
    status: 'ready',
    database,
    schema,
    probe: {
      ranNonexistentArtifactLookup: true,
      ranNonexistentMemoryLookup: true,
      ranNonexistentContextSourceLookup: true,
      foundUnexpectedRow: artifactProbe.value !== null || memoryProbe.value !== null || contextProbe.value !== null,
    },
  };
}

export { READONLY_PROBE_ARTIFACT_ID, READONLY_PROBE_MEMORY_ID, READONLY_PROBE_CONTEXT_SOURCE_ID };
