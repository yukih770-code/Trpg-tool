import {
  getRuntimeSessionById,
  getRuntimeEventById,
  listRuntimeEvents,
} from '../adapters/postgresRuntimeEventRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import {
  checkPostgresRuntimeEventSchemaReadiness,
  type PostgresRuntimeEventSchemaReadinessResult,
} from './postgresRuntimeEventSchemaReadiness.js';

/**
 * Read-only RuntimeEvent repository smoke (P5.14B). Mirrors the other read smokes:
 * health → schema readiness → harmless nonexistent-id probes for a session, an
 * event, and a nonexistent-session event list (which must return an empty list,
 * not an error). Writes NOTHING, creates no tables, runs no migration, never prints
 * the connection string.
 */

export type PostgresRuntimeEventRepositorySmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'actor_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresRuntimeEventRepositorySmokeResult {
  status: PostgresRuntimeEventRepositorySmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresRuntimeEventSchemaReadinessResult;
  probe?: {
    ranNonexistentSessionLookup: boolean;
    ranNonexistentEventLookup: boolean;
    ranEmptyEventList: boolean;
    foundUnexpectedRow: boolean;
  };
  errorKind?: string;
}

// Deterministic, harmless ids that must never exist.
const READONLY_PROBE_SESSION_ID = 'runtimeSession_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_EVENT_ID = 'runtimeEvent_readonly_smoke_probe_nonexistent';

export async function runPostgresRuntimeEventRepositoryReadOnlySmoke(): Promise<PostgresRuntimeEventRepositorySmokeResult> {
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

  const schema = await checkPostgresRuntimeEventSchemaReadiness();
  if (schema.status !== 'ready') {
    return { status: schema.status, database, schema, errorKind: schema.errorKind };
  }

  const sessionProbe = await getRuntimeSessionById(READONLY_PROBE_SESSION_ID);
  if (sessionProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: sessionProbe.error.kind };
  }
  const eventProbe = await getRuntimeEventById(READONLY_PROBE_EVENT_ID);
  if (eventProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: eventProbe.error.kind };
  }
  // Listing events for a nonexistent session is a safe empty read (not an error).
  const listProbe = await listRuntimeEvents(READONLY_PROBE_SESSION_ID, { afterSeq: 0 });
  if (listProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: listProbe.error.kind };
  }

  return {
    status: 'ready',
    database,
    schema,
    probe: {
      ranNonexistentSessionLookup: true,
      ranNonexistentEventLookup: true,
      ranEmptyEventList: true,
      foundUnexpectedRow: sessionProbe.value !== null || eventProbe.value !== null || listProbe.value.length > 0,
    },
  };
}

export { READONLY_PROBE_SESSION_ID, READONLY_PROBE_EVENT_ID };
