import { getCombatModeHudModel } from './combatModeHud';
import { advanceTurn, createCombatRuntimeTableState, createCombatant, endCombat, pauseCombat, resumeCombat, startCombat } from './combatRuntimeTypes';

const cases: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

const manual = createCombatant({ id: 'manual', name: 'Manual', kind: 'character', sourceType: 'manual_pc', initiative: 18, initiativeModifier: 2, conditions: [] });
const missing = createCombatant({ id: 'missing', name: 'Missing', kind: 'npc', sourceType: 'manual_npc', initiativeModifier: 3, conditions: [] });
const setup = { ...createCombatRuntimeTableState(), combatants: [manual, missing] };

check('setup mode is explicit when a table has not started', getCombatModeHudModel(setup).mode === 'combat_setup');
const started = startCombat(setup, () => 12);
const startedModel = getCombatModeHudModel(started.state);
check('start assigns initiative only to missing entries', started.state.combatants.find((combatant) => combatant.id === 'manual')?.initiative === 18 && started.state.combatants.find((combatant) => combatant.id === 'missing')?.initiative === 15);
check('started event persists order inputs for replay', Array.isArray(started.event?.payload.combatants) && Array.isArray(started.event?.payload.initiativeRolls));
check('hud marks exactly one current combatant', startedModel.mode === 'in_combat' && startedModel.combatants.filter((combatant) => combatant.isCurrent).length === 1 && startedModel.activeCombatant?.id === 'manual');
check('hud exposes adjacent active turns for compact navigation', startedModel.previousCombatant?.id === 'missing' && startedModel.nextCombatant?.id === 'missing');

const next = advanceTurn(started.state);
check('hud follows the advanced current combatant', getCombatModeHudModel(next.state).activeCombatant?.id === 'missing');
check('hud adjacency follows the advanced current combatant', getCombatModeHudModel(next.state).nextCombatant?.id === 'manual');
const paused = pauseCombat(next.state);
check('paused mode remains distinct', getCombatModeHudModel(paused.state).mode === 'paused');
const resumed = resumeCombat(paused.state);
check('resume restores active mode', getCombatModeHudModel(resumed.state).mode === 'in_combat');
const ended = endCombat(resumed.state);
check('ended mode is explicit', getCombatModeHudModel(ended.state).mode === 'ended');

console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
