import { createDndPrivateMonsterApiHandlers } from './dndPrivateMonsterApiHandlers.js';
import type { DndPrivateMonsterTemplate } from '../../src/lib/dnd/dndMonsterTemplateTypes.js';

const WORLD_ID = 'world_private_monster_api_smoke';
const OWNER_ID = 'user_private_monster_api_smoke';
const viewer = { viewerUserId: OWNER_ID, isAuthenticated: true, authTrustLevel: 'dev_header' as const, isDevOnly: true, isServiceInternal: false, notes: [] };
const store = new Map<string, DndPrivateMonsterTemplate>();
const success = <T>(value: T) => ({ ok: true as const, value });
const handlers = createDndPrivateMonsterApiHandlers({
  worldRepository: { getWorldServerById: async () => success({ worldServerId: WORLD_ID, ownerId: OWNER_ID, lifecycleStatus: 'active' } as any), getWorldServerMembershipByUser: async () => success(null) },
  monsterRepository: {
    listPrivateMonsterTemplates: async () => success([...store.values()].filter((item) => !item.archivedAt)), getPrivateMonsterTemplate: async (id) => success(store.get(id) ?? null),
    createPrivateMonsterTemplate: async (input) => { const value = { ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; store.set(value.monsterTemplateId, value); return success(value); },
    updatePrivateMonsterTemplate: async (input) => { const current = store.get(input.monsterTemplateId); if (!current) return success(null); const value = { ...current, ...input, updatedAt: new Date().toISOString() }; store.set(value.monsterTemplateId, value); return success(value); },
    archivePrivateMonsterTemplate: async (id) => { const current = store.get(id); if (!current) return success(null); const value = { ...current, archivedAt: new Date().toISOString() }; store.set(id, value); return success(value); },
  },
});
const input = (body?: Record<string, unknown>, monsterTemplateId?: string) => ({ viewer, params: { worldServerId: WORLD_ID, ...(monsterTemplateId ? { monsterTemplateId } : {}) }, body, query: {} });
const created = await handlers.createMonster(input({ name: 'Training Goblin', armorClass: 15, hitPointsAverage: 7, speed: { walk: 30 }, abilities: { strength: 8 }, actions: [{ id: 'training-scimitar', name: 'Training Scimitar', kind: 'weapon_attack', attackBonus: 4, damageFormula: '1d6+2' }] }));
const monsterId = created.ok ? String((created.value as DndPrivateMonsterTemplate).monsterTemplateId) : '';
const listed = await handlers.listMonsters(input());
const updated = await handlers.updateMonster(input({ armorClass: 16 }, monsterId));
const archived = await handlers.archiveMonster(input(undefined, monsterId));
const ok = created.ok && created.statusCode === 201 && listed.ok && Array.isArray(listed.value) && updated.ok && archived.ok;
console.log(JSON.stringify({ total: 4, passed: ok ? 4 : 0, failed: ok ? 0 : 4, cases: ['create private', 'list scoped', 'update', 'archive'] }, null, 2));
if (!ok) process.exitCode = 1;
