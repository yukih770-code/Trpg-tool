import { createPostgresSceneStateRepository } from '../adapters/postgresSceneStateRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import {
  checkPostgresSceneStateSchemaReadiness,
  type PostgresSceneStateSchemaReadinessResult,
} from './postgresSceneStateSchemaReadiness.js';

export type PostgresSceneStateRepositorySmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'runtime_schema_missing'
  | 'world_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresSceneStateRepositorySmokeResult {
  status: PostgresSceneStateRepositorySmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresSceneStateSchemaReadinessResult;
  probe?: { ranEmptyList: boolean; ranNonexistentLookup: boolean; foundUnexpectedRow: boolean };
  errorKind?: string;
}

export async function runPostgresSceneStateRepositoryReadOnlySmoke(): Promise<PostgresSceneStateRepositorySmokeResult> {
  const database = await checkPostgresHealth();
  if (database.configured === false) return { status: 'not_configured', database, schema: { status: 'not_configured' } };
  if (database.status !== 'ok') return { status: 'unreachable', database, schema: { status: 'unreachable', errorKind: database.errorKind }, errorKind: database.errorKind };
  const schema = await checkPostgresSceneStateSchemaReadiness();
  if (schema.status !== 'ready') return { status: schema.status, database, schema, errorKind: schema.errorKind };

  const repo = createPostgresSceneStateRepository();
  const missing = await repo.getSceneState('sceneState_readonly_smoke_probe_nonexistent');
  const list = await repo.listSceneStates('worldServer_readonly_smoke_probe_nonexistent', 'campaign_readonly_smoke_probe_nonexistent', 'room_readonly_smoke_probe_nonexistent');
  if (missing.ok === false) return { status: 'error', database, schema, errorKind: missing.error.kind };
  if (list.ok === false) return { status: 'error', database, schema, errorKind: list.error.kind };
  return { status: 'ready', database, schema, probe: { ranEmptyList: true, ranNonexistentLookup: true, foundUnexpectedRow: missing.value !== null || list.value.length > 0 } };
}
