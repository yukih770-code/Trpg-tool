import {
  getWorldServerById,
  getWorldServerByHandle,
  listDiscoverableWorldServers,
  getWorldServerInviteByCode,
  getWorldServerGameSystemBinding,
} from '../adapters/postgresWorldServerRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import {
  checkPostgresWorldServerSchemaReadiness,
  type PostgresWorldServerSchemaReadinessResult,
} from './postgresWorldServerSchemaReadiness.js';

/**
 * Read-only World Server repository smoke (P5.16-P5.17B). Mirrors the other read
 * smokes: health → schema readiness → harmless nonexistent-id/handle/code probes and
 * a bounded discoverable list. Writes NOTHING, creates no tables, runs no migration,
 * never prints the connection string.
 */

export type PostgresWorldServerRepositorySmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresWorldServerRepositorySmokeResult {
  status: PostgresWorldServerRepositorySmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresWorldServerSchemaReadinessResult;
  probe?: {
    ranNonexistentServerLookup: boolean;
    ranNonexistentHandleLookup: boolean;
    ranNonexistentInviteLookup: boolean;
    ranNonexistentGameSystemBindingLookup: boolean;
    ranDiscoverableList: boolean;
    foundUnexpectedRow: boolean;
  };
  errorKind?: string;
}

// Deterministic, harmless ids/handles/codes that must never exist.
const READONLY_PROBE_SERVER_ID = 'worldServer_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_HANDLE = 'readonly-smoke-probe-nonexistent-handle';
const READONLY_PROBE_INVITE_CODE = 'readonly_smoke_probe_nonexistent_invite_code';
const READONLY_PROBE_GSB_ID = 'worldServerGameSystemBinding_readonly_smoke_probe_nonexistent';

export async function runPostgresWorldServerRepositoryReadOnlySmoke(): Promise<PostgresWorldServerRepositorySmokeResult> {
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

  const schema = await checkPostgresWorldServerSchemaReadiness();
  if (schema.status !== 'ready') {
    return { status: schema.status, database, schema, errorKind: schema.errorKind };
  }

  const serverProbe = await getWorldServerById(READONLY_PROBE_SERVER_ID);
  if (serverProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: serverProbe.error.kind };
  }
  const handleProbe = await getWorldServerByHandle(READONLY_PROBE_HANDLE);
  if (handleProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: handleProbe.error.kind };
  }
  const inviteProbe = await getWorldServerInviteByCode(READONLY_PROBE_INVITE_CODE);
  if (inviteProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: inviteProbe.error.kind };
  }
  const gsbProbe = await getWorldServerGameSystemBinding(READONLY_PROBE_GSB_ID);
  if (gsbProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: gsbProbe.error.kind };
  }
  const discoverable = await listDiscoverableWorldServers({ limit: 5 });
  if (discoverable.ok === false) {
    return { status: 'error', database, schema, errorKind: discoverable.error.kind };
  }

  return {
    status: 'ready',
    database,
    schema,
    probe: {
      ranNonexistentServerLookup: true,
      ranNonexistentHandleLookup: true,
      ranNonexistentInviteLookup: true,
      ranNonexistentGameSystemBindingLookup: true,
      ranDiscoverableList: true,
      foundUnexpectedRow: serverProbe.value !== null || handleProbe.value !== null || inviteProbe.value !== null || gsbProbe.value !== null,
    },
  };
}

export { READONLY_PROBE_SERVER_ID, READONLY_PROBE_HANDLE, READONLY_PROBE_INVITE_CODE, READONLY_PROBE_GSB_ID };
