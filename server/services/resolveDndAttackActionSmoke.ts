import assert from 'node:assert/strict';
import { createCombatant } from '../../src/lib/combat/combatRuntimeTypes.js';
import { resolveDndAttackAction } from './resolveDndAttackAction.js';

const target = createCombatant({ id: 'target', kind: 'npc', initiativeModifier: 0, conditions: [], hpCurrent: 30, hpMax: 30, armorClass: 15, temporaryHp: 4 });
const payload = { dndLiteActorSheetV1: { schemaVersion: 1, actions: [{ id: 'sword', name: 'Secret name', kind: 'weapon_attack', attackBonus: 5, damageFormula: '1d8+3' }] } };
function resolve(faces: number[], mode: 'normal' | 'advantage' | 'disadvantage' = 'normal', override = {}) {
  let count = 0;
  const result = resolveDndAttackAction({ target, actionPayload: payload,
    intent: { intentId: 'intent', actorCombatantId: 'actor', targetCombatantId: 'target', actionId: 'sword', mode },
    resolutionId: 'resolution', random: () => { assert.ok(count < faces.length, 'unexpected RNG'); return faces[count++]; }, ...override });
  assert.equal(count, faces.length);
  return result;
}
const before = structuredClone(target);
const hit = resolve([0.45, 0.5]); // exact 10+5 = 15, damage 5+3
assert.equal(hit.publicFacts.outcome, 'hit');
assert.equal(hit.mutations[0].afterHp, 26);
assert.equal(hit.mutations[0].afterTemporaryHp, 0);
assert.equal(hit.privilegedFacts.amount, 4);
assert.deepEqual(target, before, 'pure damage application');
assert.equal(resolve([0.4]).publicFacts.outcome, 'miss');
assert.equal(resolve([0.1, 0.7, 0], 'advantage').publicFacts.attackKeptRoll, 15);
assert.equal(resolve([0.1, 0.7], 'disadvantage').publicFacts.attackKeptRoll, 3);
const critical = resolve([0.99, 0, 0.5], 'normal', { target: { ...target, armorClass: 999 } });
assert.equal(critical.publicFacts.damageTotal, 9, 'critical doubles dice only');
assert.equal(critical.publicFacts.critical, true);
assert.equal(resolve([0], 'normal', { target: { ...target, armorClass: 0 } }).publicFacts.outcome, 'miss');
assert.equal(resolve([0.7, 0.9], 'normal', { target: { ...target, hpCurrent: 1, temporaryHp: 0 } }).mutations[0].afterHp, 0);
const noDamage = { dndLiteActorSheetV1: { schemaVersion: 1, actions: [{ id: 'sword', kind: 'spell_attack', attackBonus: 5 }] } };
assert.equal(resolve([0.7], 'normal', { actionPayload: noDamage }).mutations[0].afterHp, 30);
assert.throws(() => resolve([], 'normal', { actionPayload: {} }), /unknown_action/);
assert.equal(hit.publicSummaryText, 'Attack: 15, hit. 8 damage rolled.');
assert.ok(!hit.publicSummaryText.includes('Secret'));
console.log('T12 resolver smoke passed: hit/miss/equality, modes, naturals, critical, temp HP, floor, unknown/no-damage action, purity and public text.');
