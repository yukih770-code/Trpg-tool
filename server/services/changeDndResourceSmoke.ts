import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { t12Fixture } from './t12TestFixture.js';
import { changeDndResource, listDndRuntimeResources } from './changeDndResource.js';
import { ResolvedIntentIndex } from './resolvedIntentIndex.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { projectRuntimeLogEventsForViewer } from '../room/roomRuntimeVisibilityProjection.js';
import { replayDndRuntimeResources } from '../../src/lib/dnd/dndRuntimeResources.js';
import { appendRuntimeLogEvent } from './appendRuntimeLogEvent.js';

const f = t12Fixture(); let storage = true;
const deps = { ...f, sessions: f.persistence, intents: new ResolvedIntentIndex(1), confirm: async (event: Parameters<typeof f.confirm>[0]) => storage ? f.confirm(event) : false };
const viewer = (id: string): CurrentViewerContext => ({ viewerUserId: id, isAuthenticated: true, authTrustLevel: 'dev_header', isDevOnly: true, isServiceInternal: false, notes: [] });
const snapshot = { schemaVersion: 2, name: 'PC', level: 1, acMod: 0, jobClass: '法师', attrs: Object.fromEntries(['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].map(k => [k, { base: 14, pointbuy: 0, racebonus: 0, extrabonus: 0 }])),
  spellbook: { known: [{ name_cn: 'Test spell', level: 1 }, { name_cn: 'Test cantrip', level: 0 }, { name_cn: 'Unprepared', level: 1 }], prepared: ['Test spell'], slots: { 1: { current: 2, max: 2 } } },
  classResources: [{ id: 'approved-pool', sourceFeature: 'Approved pool', current: 3, max: 3 }] };
f.actors.get('pc-actor')!.snapshotPayload = snapshot;
const input = (body = {}, memberId = 'player') => ({ roomId: f.room.identity.roomId, memberId, viewer: viewer(`${memberId}-user`), body: { intentId: randomUUID(), actorInstanceId: 'pc-actor', operation: 'cast', spellId: 'Test spell', resourceId: 'slot:1', ...body } });
const read = () => listDndRuntimeResources(deps, { roomId: f.room.identity.roomId, memberId: 'player', viewer: viewer('player-user'), actorInstanceId: 'pc-actor' });
const saved = JSON.stringify(snapshot);
const intent = input();
const [a, b] = await Promise.all([changeDndResource(deps, intent), changeDndResource(deps, intent)]);
assert.equal(a.event.eventId, b.event.eventId); assert.equal((await read()).resources[0].current, 1);
await changeDndResource(deps, input({ spellId: 'Test cantrip', resourceId: undefined }));
assert.equal((await read()).resources[0].current, 1);
assert.equal((await changeDndResource(deps, intent)).replayed, true);
await assert.rejects(changeDndResource(deps, { ...intent, body: { ...intent.body, spellId: 'Test cantrip' } }), { code: 'intent_reuse_mismatch' });
await assert.rejects(changeDndResource(deps, input({ spellId: 'Unprepared' })), { code: 'spell_not_available' });
await assert.rejects(changeDndResource(deps, input({ resourceId: 'class:approved-pool' })), { code: 'invalid_spell_slot' });
await assert.rejects(changeDndResource(deps, input({ operation: 'set', amount: 2 })), { code: 'forbidden' });
await assert.rejects(changeDndResource(deps, input({}, 'other')), { code: 'actor_not_controlled' });
await assert.rejects(changeDndResource(deps, input({ actorInstanceId: 'npc-actor' })), { code: 'actor_not_controlled' });
const failed = input(); storage = false;
await assert.rejects(changeDndResource(deps, failed), { code: 'durableAppendUnavailable' });
assert.equal((await read()).resources[0].current, 1); storage = true;
await changeDndResource(deps, failed); assert.equal((await read()).resources[0].current, 0);
await assert.rejects(changeDndResource(deps, input()), { code: 'insufficient_or_invalid_resource' });
await changeDndResource(deps, input({ operation: 'set', amount: 2 }, 'host'));
assert.equal((await read()).resources[0].current, 2);
assert.equal(JSON.stringify(snapshot), saved, 'campaign definition is untouched');
// Ending/clearing combat does not reset session resource pools.
f.log.append(f.room.identity.roomId, { ...f.seed, eventId: randomUUID(), kind: 'combat.table_cleared', payload: {} });
assert.equal((await read()).resources[0].current, 2);
const events = JSON.parse(JSON.stringify(f.log.list(f.room.identity.roomId).events));
assert.equal(replayDndRuntimeResources(events, 'pc-actor')['slot:1'].current, 2);
for (const memberId of ['host', 'player', 'other', 'spectator']) {
  const projected = projectRuntimeLogEventsForViewer(f.room, memberId, events, []).filter(e => e.kind === 'runtime.resource_changed');
  const text = JSON.stringify(projected);
  assert.ok(!text.includes('fingerprint')); assert.ok(!text.includes('mutations'));
  assert.equal(replayDndRuntimeResources(projected, 'pc-actor')['slot:1']?.current, memberId === 'host' || memberId === 'player' ? 2 : undefined);
}
assert.equal(appendRuntimeLogEvent(f.rooms, f.log, { roomId: f.room.identity.roomId, authorMemberId: 'host', kind: 'runtime.resource_changed' }).decision, 'serverResolvedKind');
console.log('T14 smoke passed: approved slots/resources, prepared spell validation, cantrips, host adjustment, owner denial, concurrency/idempotency, storage rollback, replay, combat-independent lifetime and projection.');
