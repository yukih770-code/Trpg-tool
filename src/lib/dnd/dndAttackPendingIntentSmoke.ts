import assert from 'node:assert/strict';
import { DndAttackPendingIntent } from './dndAttackPendingIntent.js';
const stored = new Map<string, string>();
const storage = { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); }, removeItem: (key: string) => { stored.delete(key); } };
let mints = 0;
const pending = new DndAttackPendingIntent('room:session:member', storage);
const first = pending.begin({ actorCombatantId: 'pc', targetCombatantId: 'npc', actionId: 'sword', mode: 'advantage' }, () => `intent-${++mints}`);
assert.equal(mints, 1);
// Network failure leaves the frozen declaration available, including after reload.
const restored = new DndAttackPendingIntent('room:session:member', storage);
assert.deepEqual(restored.read(), first);
assert.throws(() => restored.begin({ ...first, targetCombatantId: 'different' }));
assert.equal(new DndAttackPendingIntent('other-room:session:member', storage).read(), undefined);
restored.complete('unrelated'); assert.deepEqual(restored.read(), first);
restored.complete(first.intentId); assert.equal(restored.read(), undefined);
assert.equal(new DndAttackPendingIntent('room:session:member', storage).read(), undefined);
const next = restored.begin({ ...first, mode: 'normal' }, () => `intent-${++mints}`);
assert.notEqual(next.intentId, first.intentId);
console.log('T12 UI intent smoke passed: one mint, frozen retry, remount/reload recovery, scope separation, success clearing and new deliberate action.');
