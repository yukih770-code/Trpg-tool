import { replayCombatRuntimeEvents } from './combatRuntimeReplay.js';
import { createCombatant, createCombatRuntimeTableState, startCombat } from './combatRuntimeTypes.js';

const checks: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  checks.push(name);
}

const manual = createCombatant({
  id: 'hero', displayName: 'Hero', kind: 'character', sourceType: 'manual_pc', mapTokenId: 'token-hero',
  initiative: 16, initiativeModifier: 2, hpCurrent: 12, hpMax: 18, armorClass: 15, conditions: [],
});
const missing = createCombatant({
  id: 'goblin', displayName: 'Goblin', kind: 'npc', sourceType: 'manual_npc', mapTokenId: 'token-goblin',
  initiativeModifier: 2, hpCurrent: 7, hpMax: 7, armorClass: 13, conditions: [],
});
const start = startCombat({ ...createCombatRuntimeTableState(), combatants: [manual, missing] }, () => 11);

check('combat start preserves manually entered initiative', start.state.combatants.find((combatant) => combatant.id === 'hero')?.initiative === 16);
check('combat start rolls only missing initiative', start.state.combatants.find((combatant) => combatant.id === 'goblin')?.initiative === 13);
check('combat start selects the highest initiative actor', start.state.turn.activeCombatantId === 'hero');

const replayed = replayCombatRuntimeEvents([
  { seq: 1, eventKind: 'combat.combatant_added', payload: { combatant: manual } },
  { seq: 2, eventKind: 'combat.combatant_added', payload: { combatant: missing } },
  { seq: 3, eventKind: 'combat.initiative_rolled', payload: { combatants: start.state.combatants, rollMode: 'missing' } },
  { seq: 4, eventKind: 'combat.started', payload: start.event?.payload ?? {} },
  { seq: 5, eventKind: 'combat.combatant_updated', payload: { combatant: { id: 'hero', hpCurrent: 8, temporaryHp: 3, armorClass: 17, conditions: ['中毒'] } } },
  { seq: 6, eventKind: 'combat.turn_advanced', payload: { roundNumber: 1, turnIndex: 1, activeCombatantId: 'goblin' } },
]);

const hero = replayed.combatants.find((combatant) => combatant.id === 'hero');
check('replay preserves the map token link', hero?.mapTokenId === 'token-hero');
check('replay restores HP, temp HP, AC, and conditions', hero?.hpCurrent === 8 && hero.temporaryHp === 3 && hero.armorClass === 17 && hero.conditions.includes('中毒'));
check('replay restores the active turn', replayed.turn.activeCombatantId === 'goblin');
check('replay keeps combat active after turn advance', replayed.turn.status === 'active');

console.log(JSON.stringify({ total: checks.length, passed: checks.length, failed: 0, checks }, null, 2));
