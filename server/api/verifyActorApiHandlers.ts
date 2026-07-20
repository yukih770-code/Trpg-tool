import { createActorApiHandlers } from './actorApiHandlers.js';

const OWNER_ID = 'user_actor_api_owner';
const OTHER_ID = 'user_actor_api_other';
const viewer = { viewerUserId: OWNER_ID, isAuthenticated: true, authTrustLevel: 'dev_header' as const, isDevOnly: true, isServiceInternal: false, notes: [] };
const otherViewer = { ...viewer, viewerUserId: OTHER_ID };
const now = () => new Date().toISOString();
const records = new Map<string, any>();
const ok = <T>(value: T) => ({ ok: true as const, value });

const repository = {
  listActorsByOwner: async (ownerId: string, options: any = {}) => ok([...records.values()].filter((actor) => actor.ownerId === ownerId && (options.includeArchived || !actor.archivedAt) && (!options.systemId || actor.systemId === options.systemId))),
  getActorById: async (actorId: string) => ok(records.get(actorId) ?? null),
  createActor: async (input: any) => { const value = { ...input, payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, createdAt: now(), updatedAt: now() }; records.set(value.actorId, value); return ok(value); },
  updateActor: async (input: any) => { const current = records.get(input.actorId); if (!current) return ok(null); const value = { ...current, ...(input.displayName === undefined ? {} : { displayName: input.displayName }), ...(input.payload === undefined ? {} : { payload: input.payload }), updatedAt: now() }; records.set(value.actorId, value); return ok(value); },
  archiveActor: async (actorId: string) => { const current = records.get(actorId); if (!current) return ok(null); const value = { ...current, archivedAt: now(), updatedAt: now() }; records.set(actorId, value); return ok(value); },
  restoreActor: async (actorId: string) => { const current = records.get(actorId); if (!current) return ok(null); const value = { ...current, archivedAt: undefined, updatedAt: now() }; records.set(actorId, value); return ok(value); },
};

const handlers = createActorApiHandlers({ actorRepository: repository });
const input = (body?: Record<string, unknown>, actorId?: string, currentViewer = viewer) => ({ viewer: currentViewer, params: actorId ? { actorId } : {}, query: {}, body });

const created = await handlers.createActor(input({ systemId: 'dnd5e-2024', localActorId: 'local_hero', displayName: 'Cloud Hero', payload: { level: 1 } }));
const actorId = created.ok ? String((created.value as any).actorId) : '';
const listed = await handlers.listActors(input());
const read = await handlers.getActor(input(undefined, actorId));
const updated = await handlers.updateActor(input({ displayName: 'Cloud Hero II' }, actorId));
const hiddenFromOther = await handlers.getActor(input(undefined, actorId, otherViewer));
const archived = await handlers.archiveActor(input(undefined, actorId));
const restored = await handlers.restoreActor(input(undefined, actorId));
const passed = created.ok && created.statusCode === 201 && listed.ok && Array.isArray(listed.value) && read.ok && updated.ok && hiddenFromOther.ok === false && hiddenFromOther.statusCode === 404 && archived.ok && restored.ok;

console.log(JSON.stringify({ total: 7, passed: passed ? 7 : 0, failed: passed ? 0 : 7, cases: ['create owned actor', 'list own vault', 'read owned actor', 'update owned actor', 'hide foreign actor', 'archive actor', 'restore actor'] }, null, 2));
if (!passed) process.exitCode = 1;
