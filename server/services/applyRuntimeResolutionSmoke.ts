import assert from 'node:assert/strict';
import { t12Fixture } from './t12TestFixture.js';
import { resolveDndAttackAction } from './resolveDndAttackAction.js';
import { applyRuntimeResolution, readAuthoritativeCombat } from './applyRuntimeResolution.js';
import { appendRuntimeLogEvent } from './appendRuntimeLogEvent.js';
import { createInMemoryRuntimeLogRegistry } from '../runtime-log-registry.js';
import { persistLiveRoomRuntimeLogEvent, restoreLiveRoomRuntimeLogs } from './liveRoomRuntimeLogPersistence.js';
import { ResolvedIntentIndex } from './resolvedIntentIndex.js';

const f = t12Fixture();
const proposal = resolveDndAttackAction({ target: f.target, actionPayload: f.actionPayload, intent: f.intent, resolutionId: 'resolution', random: () => 0.5 });
const context = { roomId: f.room.identity.roomId, sessionId: 'session', memberId: 'player', actorBindingId: 'binding',
  actorCombatantId: 'pc', targetCombatantId: 'npc', intentId: f.intent.intentId, fingerprint: 'fingerprint', expectedSeq: 1 };
for (const mutate of [
  (p: typeof proposal) => { p.mutations[0].afterHp = 31; },
  (p: typeof proposal) => { p.mutations[0].afterHp = -1; },
  (p: typeof proposal) => { p.mutations[0].afterHp = NaN; },
  (p: typeof proposal) => { p.mutations[0].beforeHp = 29; },
  (p: typeof proposal) => { p.mutations[0].beforeTemporaryHp = 0; },
  (p: typeof proposal) => { p.mutations[0].combatantId = 'unknown'; },
  (p: typeof proposal) => { p.systemId = 'other'; },
  (p: typeof proposal) => { p.mutations.push(p.mutations[0]); },
]) {
  const hostile = structuredClone(proposal); mutate(hostile);
  await assert.rejects(applyRuntimeResolution({ ...f, context, proposal: hostile, confirm: f.confirm }));
  assert.equal(f.log.list(context.roomId).events.length, 1);
  assert.equal(f.events.length, 0);
}
await assert.rejects(applyRuntimeResolution({ ...f, context, proposal, kind: 'chat.message', confirm: f.confirm }), /invalid_resolved_kind/);
for (const authorMemberId of ['host', 'player']) {
  assert.equal(appendRuntimeLogEvent(f.rooms, f.log, { roomId: context.roomId, authorMemberId, kind: 'combat.attack_resolved', payload: { resolvedByServer: true, ...proposal } }).decision, 'serverResolvedKind');
}
await persistLiveRoomRuntimeLogEvent(f.persistence, f.room, f.seed);
let release!: () => void;
const barrier = new Promise<void>((resolve) => { release = resolve; });
const inFlightProposal = structuredClone(proposal);
const inFlight = applyRuntimeResolution({ ...f, context, proposal: inFlightProposal, confirm: async (event) => { await barrier; return f.confirm(event); } });
await assert.rejects(applyRuntimeResolution({ ...f, context, proposal, confirm: f.confirm }), /resolution_pending/);
inFlightProposal.mutations[0].afterHp = 999; // retained resolver object cannot alter validated event
release();
const result = await inFlight;
assert.equal(result.kind, 'combat.attack_resolved');
assert.equal(readAuthoritativeCombat(f.log, context.roomId).combatants[1].hpCurrent, 26);
await assert.rejects(applyRuntimeResolution({ ...f, context, proposal, confirm: f.confirm }), /stale_resolution/);
const restored = createInMemoryRuntimeLogRegistry();
await restoreLiveRoomRuntimeLogs(f.persistence, f.rooms, restored);
const random = Math.random; Math.random = () => { throw new Error('replay must not roll'); };
try { assert.deepEqual(readAuthoritativeCombat(restored, context.roomId), readAuthoritativeCombat(f.log, context.roomId)); } finally { Math.random = random; }
assert.deepEqual(JSON.parse(JSON.stringify(restored.list(context.roomId).events)), JSON.parse(JSON.stringify(f.log.list(context.roomId).events)));
const recoveredRetry = await new ResolvedIntentIndex().run({ ...context,
  history: () => restored.list(context.roomId).events,
  execute: async () => { throw new Error('restored retry must never resolve'); },
});
assert.equal(recoveredRetry.replayed, true);
assert.equal(recoveredRetry.event.eventId, result.eventId);
assert.equal(restored.list(context.roomId).events.length, 2);
console.log('T12 kernel/recovery smoke passed: hostile proposals, append partition, stale revision, atomic HP, durable envelope and RNG-free restart equality.');
