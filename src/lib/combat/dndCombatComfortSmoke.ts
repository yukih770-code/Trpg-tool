import {
  addCondition,
  applyDamage,
  applyHealing,
  applyTemporaryHp,
  createConditionEvent,
  createDamageEvent,
  createHealingEvent,
  createHitPointOverrideEvent,
  createTemporaryHpEvent,
  overrideHitPoints,
  removeCondition,
  toggleCondition,
} from './combatComfort';
import { replayCombatRuntimeEvents, type CombatRuntimeReplayEvent } from './combatRuntimeReplay';
import type { Combatant } from './combatRuntimeTypes';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const target: Combatant = {
  id: 'fighter', name: 'Fighter', displayName: '战士', sourceType: 'manual_pc', kind: 'character', initiativeModifier: 2,
  hpCurrent: 18, hpMax: 18, temporaryHp: 4, conditions: [], isDefeated: false, status: 'active',
};

const damaged = applyDamage(target, 7);
assert(damaged.afterTemporaryHp === 0 && damaged.afterHp === 15 && damaged.absorbedByTemporaryHp === 4, 'damage consumes temporary HP before HP');
const healed = applyHealing(damaged.combatant, 9);
assert(healed.afterHp === 18, 'healing caps at max HP');
const raisedTemp = applyTemporaryHp(healed.combatant, 3);
assert(raisedTemp.afterTemporaryHp === 3, 'temporary HP is applied');
const lowerTemp = applyTemporaryHp(raisedTemp.combatant, 1);
assert(lowerTemp.afterTemporaryHp === 3, 'lower temporary HP does not replace by default');
const replacedTemp = applyTemporaryHp(lowerTemp.combatant, 1, true);
assert(replacedTemp.afterTemporaryHp === 1, 'manual temporary HP replacement is available');
const prone = addCondition(replacedTemp.combatant, '倒地');
assert(prone.conditions.includes('倒地'), 'condition is added');
assert(removeCondition(prone, '倒地').conditions.length === 0, 'condition is removed');
assert(toggleCondition(prone, '中毒').added, 'condition toggles on');
const overridden = overrideHitPoints(replacedTemp.combatant, 12);
assert(overridden.afterHp === 12, 'HP override is deterministic');

const events: CombatRuntimeReplayEvent[] = [
  { seq: 1, createdAt: '2026-07-18T00:00:00.000Z', eventKind: 'combat.combatant_added', payload: { combatant: target } },
  { seq: 2, createdAt: '2026-07-18T00:00:01.000Z', ...createDamageEvent(damaged, 7, { sourceName: '骷髅', rollRef: '1d6+2' }) },
  { seq: 3, createdAt: '2026-07-18T00:00:02.000Z', ...createHealingEvent(healed, 9, { sourceName: '牧师' }) },
  { seq: 4, createdAt: '2026-07-18T00:00:03.000Z', ...createTemporaryHpEvent(raisedTemp, 3) },
  { seq: 5, createdAt: '2026-07-18T00:00:04.000Z', ...createConditionEvent({ ...raisedTemp.combatant, conditions: ['倒地'] }, '倒地', true, {}, true) },
  { seq: 6, createdAt: '2026-07-18T00:00:05.000Z', ...createHitPointOverrideEvent(overridden) },
];
const replayed = replayCombatRuntimeEvents(events).combatants[0];
assert(replayed.hpCurrent === 12 && replayed.temporaryHp === 1 && replayed.conditions.includes('倒地'), 'replay applies comfort events in sequence');
console.log('DND comfort combat smoke passed.');
