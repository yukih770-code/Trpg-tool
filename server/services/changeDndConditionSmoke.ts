import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { t12Fixture } from './t12TestFixture.js';
import { changeDndCondition } from './changeDndCondition.js';
import { ResolvedIntentIndex } from './resolvedIntentIndex.js';
import { readAuthoritativeCombat } from './applyRuntimeResolution.js';
import { projectRuntimeLogEventsForViewer } from '../room/roomRuntimeVisibilityProjection.js';
import { replayCombatRuntimeEvents } from '../../src/lib/combat/combatRuntimeReplay.js';
import { appendRuntimeLogEvent } from './appendRuntimeLogEvent.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { DND_CONDITIONS } from '../../src/lib/dnd/dndConditions.js';

const f = t12Fixture(); let storage = true;
const deps = { ...f, sessions: f.persistence, intents: new ResolvedIntentIndex(1), confirm: async (event: Parameters<typeof f.confirm>[0]) => storage ? f.confirm(event) : false };
const viewer = (id: string): CurrentViewerContext => ({ viewerUserId: id, isAuthenticated: true, authTrustLevel: 'dev_header', isDevOnly: true, isServiceInternal: false, notes: [] });
const input = (body = {}, memberId = 'host') => ({ roomId: f.room.identity.roomId, memberId, viewer: viewer(`${memberId}-user`), body: { intentId: randomUUID(), targetCombatantId: 'npc', conditionId: 'poisoned', level: 1, ...body } });
const original = input();
const [first, duplicate] = await Promise.all([changeDndCondition(deps, original), changeDndCondition(deps, original)]);
assert.equal(first.event.eventId, duplicate.event.eventId); assert.equal(f.events.length, 1);
assert.deepEqual(readAuthoritativeCombat(f.log, f.room.identity.roomId).combatants[1].conditionStates, [{ systemId: 'dnd5e-2024', conditionId: 'poisoned' }]);
await assert.rejects(changeDndCondition(deps, input({}, 'player')), { code: 'forbidden' });
await assert.rejects(changeDndCondition(deps, input({}, 'spectator')), { code: 'forbidden' });
for (const body of [{ conditionId: 'made-up' }, { level: 2 }, { conditionId: 'exhaustion', level: 7 }, { level: -1 }]) await assert.rejects(changeDndCondition(deps, input(body)), { code: 'invalid_condition' });
await changeDndCondition(deps, input({ conditionId: 'exhaustion', level: 3 }));
assert.equal((await changeDndCondition(deps, original)).replayed, true, 'history fallback after cache eviction');
await assert.rejects(changeDndCondition(deps, { ...original, body: { ...original.body, level: 0 } }), { code: 'intent_reuse_mismatch' });
const retry = input({ level: 0 }); storage = false;
await assert.rejects(changeDndCondition(deps, retry), { code: 'durableAppendUnavailable' });
assert.equal(readAuthoritativeCombat(f.log, f.room.identity.roomId).combatants[1].conditionStates?.length, 2);
storage = true; await changeDndCondition(deps, retry);
for (const condition of DND_CONDITIONS) await changeDndCondition(deps, input({ conditionId: condition.id, level: 1 }));
for (const member of ['host', 'player', 'other', 'spectator']) {
  const events = projectRuntimeLogEventsForViewer(f.room, member, f.log.list(f.room.identity.roomId).events, []);
  const last = events.at(-1)!;
  assert.equal((last.payload as any).mutations, undefined);
  assert.equal((last.payload as any).fingerprint, undefined);
  const replayed = replayCombatRuntimeEvents(events.map(e => ({ eventKind: e.kind, payload: e.payload as Record<string, unknown>, seq: e.seq })));
  assert.equal(replayed.combatants[1].conditionStates?.length, 15);
}
const saved = JSON.parse(JSON.stringify(f.log.list(f.room.identity.roomId).events));
const replayed = replayCombatRuntimeEvents(saved.map((e: any) => ({ eventKind: e.kind, payload: e.payload, seq: e.seq, createdAt: e.createdAt })));
assert.deepEqual(replayed, readAuthoritativeCombat(f.log, f.room.identity.roomId));
assert.equal(appendRuntimeLogEvent(f.rooms, f.log, { roomId: f.room.identity.roomId, authorMemberId: 'host', kind: 'combat.conditions_updated', payload: {} }).decision, 'serverResolvedKind');
const updated = appendRuntimeLogEvent(f.rooms, f.log, { roomId: f.room.identity.roomId, authorMemberId: 'host', kind: 'combat.combatant_updated', payload: { combatant: { ...replayed.combatants[1], hpCurrent: 21, conditionStates: [] } } });
assert.equal(updated.decision, 'appended');
if (updated.decision === 'appended') { f.log.confirmPending(f.room.identity.roomId, updated.event!.eventId); }
assert.equal(readAuthoritativeCombat(f.log, f.room.identity.roomId).combatants[1].conditionStates?.length, 15, 'generic edits preserve typed conditions');
console.log('T13 smoke passed: 15 typed identities, exhaustion levels, host authority, concurrent retries, cache eviction, mismatch denial, durable failure rollback, allowlist projection and replay.');
