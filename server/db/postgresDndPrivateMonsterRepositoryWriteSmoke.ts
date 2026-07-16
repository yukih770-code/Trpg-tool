import type { QueryResultRow } from 'pg';
import { createPostgresDndPrivateMonsterRepository, type DndPrivateMonsterRepositoryExecutor } from '../adapters/postgresDndPrivateMonsterRepository.js';
import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresWorldServerRepository } from '../adapters/postgresWorldServerRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import { checkPostgresDndPrivateMonsterSchemaReadiness } from './postgresDndPrivateMonsterSchemaReadiness.js';

const USER_ID = 'user_dnd_monster_smoke';
const WORLD_ID = 'world_dnd_monster_smoke';
const BATCH_ID = 'batch_dnd_monster_smoke';
const MONSTER_ID = 'monster_dnd_training_goblin';
const executorOf = (query: DndPrivateMonsterRepositoryExecutor['query']): DndPrivateMonsterRepositoryExecutor => ({ query: <T extends QueryResultRow>(text: string, values?: readonly unknown[]) => query<T>(text, values) });

export async function runPostgresDndPrivateMonsterRepositoryRollbackWriteSmoke(): Promise<{ status: string; steps: Array<{ name: string; ok: boolean; errorKind?: string }>; transaction: { attempted: boolean; rolledBack: boolean }; errorKind?: string }> {
  const database = await checkPostgresHealth();
  if (!database.configured) return { status: 'not_configured', steps: [], transaction: { attempted: false, rolledBack: false } };
  if (database.status !== 'ok') return { status: 'unreachable', steps: [], transaction: { attempted: false, rolledBack: false }, errorKind: database.errorKind };
  const schema = await checkPostgresDndPrivateMonsterSchemaReadiness();
  if (schema.status !== 'ready') return { status: schema.status, steps: [], transaction: { attempted: false, rolledBack: false }, errorKind: schema.errorKind };
  const steps: string[] = [];
  try {
    await withPostgresClient(async (client) => {
      await client.query('BEGIN');
      try {
        const executor = executorOf((text, values) => client.query(text, values ? [...values] : undefined));
        const users = createPostgresUserRepository(executor, { useInternalTransactions: false });
        const user = await users.createUserWithIdentity({ identity: { userId: USER_ID, providerKind: 'localAnonymous', providerUserId: 'dnd-monster-smoke', displayName: 'Monster Smoke User' }, profile: { handle: 'dnd-monster-smoke', displayName: 'Monster Smoke User', tags: [], visibility: 'private', pinned: [], sectionVisibility: {} } });
        if (user.ok === false) throw new Error(user.error.kind); steps.push('createUser');
        const worlds = createPostgresWorldServerRepository(executor, { useInternalTransactions: false });
        const world = await worlds.createWorldServer({ worldServerId: WORLD_ID, ownerId: USER_ID, serverHandle: 'dnd-monster-smoke', displayName: 'Monster Smoke Server' });
        if (world.ok === false) throw new Error(world.error.kind); steps.push('createWorldServer');
        const repo = createPostgresDndPrivateMonsterRepository(executor);
        const batch = await repo.createMonsterImportBatch({ importBatchId: BATCH_ID, worldServerId: WORLD_ID, createdByUserId: USER_ID, sourceFormat: 'synthetic', sourceHash: 'synthetic-only', totalRecords: 1, importedRecords: 0, skippedRecords: 0, errorCount: 0 });
        if (batch.ok === false) throw new Error(batch.error.kind); steps.push('createMonsterImportBatch');
        const created = await repo.createPrivateMonsterTemplate({ monsterTemplateId: MONSTER_ID, worldServerId: WORLD_ID, createdByUserId: USER_ID, importBatchId: BATCH_ID, name: 'Training Goblin', slug: 'training-goblin', speed: { walk: 30 }, abilities: { strength: 8, dexterity: 14 }, savingThrows: {}, skills: {}, senses: {}, traits: [], actions: [{ id: 'training-scimitar', name: 'Training Scimitar', kind: 'weapon_attack', attackBonus: 4, damageFormula: '1d6+2' }], reactions: [], legendaryActions: [], tags: ['synthetic'], visibility: 'private', schemaVersion: 1 });
        if (created.ok === false) throw new Error(created.error.kind); steps.push('createPrivateMonsterTemplate');
        const listed = await repo.listPrivateMonsterTemplates(WORLD_ID);
        if (listed.ok === false || listed.value.length !== 1) throw new Error(listed.ok === false ? listed.error.kind : 'stale_read'); steps.push('listPrivateMonsterTemplates');
        const updated = await repo.updatePrivateMonsterTemplate({ monsterTemplateId: MONSTER_ID, armorClass: 15 });
        if (updated.ok === false || updated.value?.armorClass !== 15) throw new Error(updated.ok === false ? updated.error.kind : 'stale_read'); steps.push('updatePrivateMonsterTemplate');
        const archived = await repo.archivePrivateMonsterTemplate(MONSTER_ID);
        if (archived.ok === false || !archived.value?.archivedAt) throw new Error(archived.ok === false ? archived.error.kind : 'archive_failed'); steps.push('archivePrivateMonsterTemplate');
        const completed = await repo.completeMonsterImportBatch({ importBatchId: BATCH_ID, importedRecords: 1, skippedRecords: 0, errorCount: 0 });
        if (completed.ok === false || completed.value?.importStatus !== 'completed') throw new Error(completed.ok === false ? completed.error.kind : 'batch_failed'); steps.push('completeMonsterImportBatch');
      } finally { await client.query('ROLLBACK'); }
    });
    return { status: 'rolled_back', steps: steps.map((name) => ({ name, ok: true })), transaction: { attempted: true, rolledBack: true } };
  } catch (error) { return { status: 'repository_failed', steps: steps.map((name) => ({ name, ok: true })), transaction: { attempted: true, rolledBack: true }, errorKind: error instanceof Error ? error.message : 'unknown' }; }
}
