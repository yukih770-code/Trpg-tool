import { resolveOwnedRoomActorBinding } from './resolveOwnedRoomActorBinding.js';

const actor = {
  actorId: 'actor_owned',
  ownerId: 'user_owner',
  systemId: 'dnd5e-2024',
  localActorId: 'local_hero',
  displayName: 'Canonical Hero',
  payload: { hpCurrent: 24, hpMax: 31, armorClass: 16 },
  schemaVersion: 1,
};

const repository = {
  getActorById: async (actorId: string) => ({ ok: true as const, value: actorId === actor.actorId ? actor : null }),
};

const own = await resolveOwnedRoomActorBinding(repository, {
  viewerUserId: 'user_owner',
  roomSystemId: 'dnd5e-2024',
  actorRef: { actorId: actor.actorId, displayName: 'Forged Browser Name', source: 'manualScaffold', hpCurrent: 1 },
});
const foreign = await resolveOwnedRoomActorBinding(repository, {
  viewerUserId: 'user_other',
  roomSystemId: 'dnd5e-2024',
  actorRef: { actorId: actor.actorId, displayName: 'Forged Browser Name' },
});
const mismatch = await resolveOwnedRoomActorBinding(repository, {
  viewerUserId: 'user_owner',
  roomSystemId: 'coc7e',
  actorRef: { actorId: actor.actorId, displayName: 'Canonical Hero' },
});
const draft = await resolveOwnedRoomActorBinding(repository, {
  viewerUserId: 'user_owner',
  roomSystemId: 'dnd5e-2024',
  actorRef: { displayName: 'Quick Draft', source: 'quickDraft' },
});

const passed = own.ok && own.actorRef.displayName === 'Canonical Hero' && own.actorRef.source === 'localActorVault'
  && own.actorRef.hpCurrent === 24 && own.actorRef.hpMax === 31 && own.actorRef.armorClass === 16
  && foreign.ok === false && foreign.code === 'not_found'
  && mismatch.ok === false && mismatch.code === 'system_mismatch'
  && draft.ok && draft.actorRef.displayName === 'Quick Draft';

console.log(JSON.stringify({ total: 4, passed: passed ? 4 : 0, failed: passed ? 0 : 4, cases: ['canonical owned actor', 'hide foreign actor', 'reject system mismatch', 'preserve provisional draft'] }, null, 2));
if (!passed) process.exitCode = 1;
