import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ResolvedIntentIndex } from './resolvedIntentIndex.js';
import { t12Fixture } from './t12TestFixture.js';
import { resolveDndAttackAction } from './resolveDndAttackAction.js';
import { applyRuntimeResolution, readAuthoritativeCombat } from './applyRuntimeResolution.js';

const f = t12Fixture(); const index = new ResolvedIntentIndex(1);
let rng = 0; let appends = 0; let fail = false;
const execute = (intentId: string) => async () => {
  const target = readAuthoritativeCombat(f.log, f.room.identity.roomId).combatants[1];
  const proposal = resolveDndAttackAction({ target, actionPayload: f.actionPayload, intent: { ...f.intent, intentId }, resolutionId: randomUUID(), random: () => { rng++; return 0.5; } });
  return applyRuntimeResolution({ ...f, proposal, context: { roomId: f.room.identity.roomId, sessionId: 'session', memberId: 'player', actorBindingId: 'binding',
    actorCombatantId: 'pc', targetCombatantId: 'npc', intentId, fingerprint: 'same', expectedSeq: f.log.list(f.room.identity.roomId).latestSeq },
    confirm: async (event) => { await Promise.resolve(); if (fail) return false; appends++; return f.confirm(event); } });
};
const input = (intentId: string) => ({ roomId: f.room.identity.roomId, sessionId: 'session', memberId: 'player', intentId,
  fingerprint: 'same', history: () => f.log.list(f.room.identity.roomId).events, execute: execute(intentId) });
const first = input(f.intent.intentId);
const a = index.run(first); const b = index.run(first);
await assert.rejects(index.run({ ...first, fingerprint: 'changed' }), /intent_reuse_mismatch/);
const [left, right] = await Promise.all([a, b]);
assert.equal(left.event.eventId, right.event.eventId); assert.equal(right.replayed, true);
assert.equal(rng, 2); assert.equal(appends, 1);
assert.equal(readAuthoritativeCombat(f.log, first.roomId).combatants[1].hpCurrent, 26);
assert.equal((await index.run(first)).event.eventId, left.event.eventId); assert.equal(rng, 2);
await assert.rejects(index.run({ ...first, fingerprint: 'changed' }), /intent_reuse_mismatch/);
await index.run(input(randomUUID())); // evicts first
const before = rng; assert.equal((await index.run(first)).event.eventId, left.event.eventId); assert.equal(rng, before);
assert.equal((await new ResolvedIntentIndex().run(first)).event.eventId, left.event.eventId); assert.equal(rng, before);
for (const scope of [{ memberId: 'host' }, { sessionId: 'other-session' }, { roomId: 'other-room' }]) {
  await assert.rejects(index.run({ ...first, ...scope,
    history: () => scope.roomId ? [] : first.history(),
    execute: async () => { throw new Error('independent scope reached resolution'); },
  }), /independent scope reached resolution/, 'another scope must not suppress the action');
}
await assert.rejects(new ResolvedIntentIndex(0).run({ ...first, fingerprint: 'changed' }), /intent_reuse_mismatch/, 'history fallback also checks fingerprint');
fail = true; const failed = input(randomUUID());
await assert.rejects(index.run(failed), /durableAppendUnavailable/);
const count = f.log.list(first.roomId).events.length;
fail = false; await index.run(failed); assert.equal(f.log.list(first.roomId).events.length, count + 1);
assert.equal(appends, 3);
console.log('T12 intent smoke passed: concurrent/sequential retries, one RNG resolution/append/HP mutation, mismatch, eviction/history fallback, fresh index and failure release.');
