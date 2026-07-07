import { checkPostgresUserRepositoryReadiness, getUserById } from '../adapters/postgresUserRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import {
  checkPostgresUserSchemaReadiness,
  type PostgresSchemaReadinessResult,
} from './postgresSchemaReadiness.js';

export type PostgresUserRepositorySmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresUserRepositorySmokeResult {
  status: PostgresUserRepositorySmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresSchemaReadinessResult;
  repositoryRead?: {
    attempted: boolean;
    ok?: boolean;
    foundProbeUser?: boolean;
  };
  errorKind?: string;
}

const SMOKE_PROBE_USER_ID = '__postgres_user_repository_smoke_probe__';

export async function runPostgresUserRepositoryReadOnlySmoke(): Promise<PostgresUserRepositorySmokeResult> {
  const database = await checkPostgresHealth();
  if (database.configured === false) {
    return {
      status: 'not_configured',
      database,
      schema: { status: 'not_configured' },
      repositoryRead: { attempted: false },
    };
  }

  if (database.status !== 'ok') {
    return {
      status: 'unreachable',
      database,
      schema: {
        status: 'unreachable',
        errorKind: database.errorKind,
        latencyMs: database.latencyMs,
      },
      repositoryRead: { attempted: false },
      errorKind: database.errorKind,
    };
  }

  const schema = await checkPostgresUserSchemaReadiness();
  if (schema.status !== 'ready') {
    return {
      status: schema.status === 'schema_missing' ? 'schema_missing' : schema.status,
      database,
      schema,
      repositoryRead: { attempted: false },
      errorKind: schema.errorKind,
    };
  }

  const readiness = await checkPostgresUserRepositoryReadiness();
  if (readiness.ok === false) {
    return {
      status: readiness.error.kind === 'schema_missing' ? 'schema_missing' : 'error',
      database,
      schema,
      repositoryRead: { attempted: true, ok: false },
      errorKind: readiness.error.kind,
    };
  }

  const probeRead = await getUserById(SMOKE_PROBE_USER_ID);
  if (probeRead.ok === false) {
    return {
      status: probeRead.error.kind === 'schema_missing' ? 'schema_missing' : 'error',
      database,
      schema,
      repositoryRead: { attempted: true, ok: false },
      errorKind: probeRead.error.kind,
    };
  }

  return {
    status: 'ready',
    database,
    schema,
    repositoryRead: {
      attempted: true,
      ok: true,
      foundProbeUser: probeRead.value !== null,
    },
  };
}
