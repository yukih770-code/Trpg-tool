import { createPostgresDndPrivateMonsterRepository } from '../adapters/postgresDndPrivateMonsterRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import { checkPostgresDndPrivateMonsterSchemaReadiness, type PostgresDndPrivateMonsterSchemaReadinessResult } from './postgresDndPrivateMonsterSchemaReadiness.js';

export async function runPostgresDndPrivateMonsterRepositoryReadOnlySmoke(): Promise<{ status: string; database: Awaited<ReturnType<typeof checkPostgresHealth>>; schema: PostgresDndPrivateMonsterSchemaReadinessResult; probe?: Record<string, boolean>; errorKind?: string }> {
  const database = await checkPostgresHealth();
  if (!database.configured) return { status: 'not_configured', database, schema: { status: 'not_configured' } };
  if (database.status !== 'ok') return { status: 'unreachable', database, schema: { status: 'unreachable', errorKind: database.errorKind }, errorKind: database.errorKind };
  const schema = await checkPostgresDndPrivateMonsterSchemaReadiness();
  if (schema.status !== 'ready') return { status: schema.status, database, schema, errorKind: schema.errorKind };
  const repo = createPostgresDndPrivateMonsterRepository();
  const missing = await repo.getPrivateMonsterTemplate('dnd_private_monster_readonly_missing');
  const list = await repo.listPrivateMonsterTemplates('dnd_private_monster_readonly_missing');
  if (missing.ok === false) return { status: 'error', database, schema, errorKind: missing.error.kind };
  if (list.ok === false) return { status: 'error', database, schema, errorKind: list.error.kind };
  return { status: 'ready', database, schema, probe: { ranEmptyList: true, ranNonexistentLookup: true, foundUnexpectedRow: Boolean(missing.value) || list.value.length > 0 } };
}
