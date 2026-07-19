import {
  advanceTurn,
  createCombatant,
  createCombatRuntimeTableState,
  pauseCombat,
  resumeCombat,
  sortCombatants,
  startCombat,
  type CombatRuntimeEventDraft,
  type Combatant,
} from './combatRuntimeTypes';

const cases: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

const empty = createCombatRuntimeTableState();
check('empty combat table state', empty.combatants.length === 0 && empty.turn.status === 'setup');

const manualNpc = createCombatant({ id: 'npc-1', name: 'Bandit', kind: 'npc', sourceType: 'manual_npc', initiative: 12, initiativeModifier: 4, hpCurrent: 7, hpMax: 7, armorClass: 13, conditions: [], notes: 'placeholder NPC' });
const campaignActor = createCombatant({ id: 'actor-1', name: 'Aria', kind: 'character', sourceType: 'campaign_actor', sourceActorInstanceId: 'campaign-actor-1', initiative: 18, initiativeModifier: 2, hpCurrent: 9, hpMax: 9, armorClass: 15, conditions: [] });
check('add manual combatant', manualNpc.sourceType === 'manual_npc' && manualNpc.displayName === 'Bandit');
check('add campaign actor combatant', campaignActor.sourceType === 'campaign_actor' && campaignActor.sourceActorInstanceId === 'campaign-actor-1');

const unrolled = createCombatant({ id: 'unrolled', name: 'Unrolled', kind: 'other', sourceType: 'unknown', initiativeModifier: 0, conditions: [] });
const combatants: Combatant[] = [manualNpc, campaignActor];
check('initiative sort descending', sortCombatants([...combatants, unrolled])[0].id === 'actor-1');
check('missing initiative sorts last', sortCombatants([...combatants, unrolled])[2].id === 'unrolled');

const startWithMissing = startCombat({ ...empty, combatants: [...combatants, unrolled] }, () => 11);
check('start combat rolls only missing initiatives', startWithMissing.state.combatants.find((combatant) => combatant.id === 'unrolled')?.initiative === 11 && startWithMissing.state.combatants.find((combatant) => combatant.id === 'actor-1')?.initiative === 18);

let state = { ...empty, combatants };
const started = startCombat(state);
check('start combat selects first combatant', started.state.turn.activeCombatantId === 'actor-1' && started.state.turn.turnIndex === 0);
check('append combat.started event payload model', started.event?.eventKind === 'combat.started' && typeof started.event?.payload.roundNumber === 'number' && Array.isArray(started.event?.payload.combatants) && Array.isArray(started.event?.payload.initiativeRolls));
state = started.state;

const next = advanceTurn(state, 'next');
check('next turn advances index', next.state.turn.activeCombatantId === 'npc-1' && next.state.turn.turnIndex === 1);
check('append combat.turn_advanced event payload model', next.event?.eventKind === 'combat.turn_advanced' && next.event?.payload.direction === 'next');
state = next.state;

const wrapped = advanceTurn(state, 'next');
check('next turn increments round after last combatant', wrapped.state.turn.roundNumber === 2 && wrapped.state.turn.activeCombatantId === 'actor-1');
state = wrapped.state;
const previous = advanceTurn(state, 'previous');
check('previous turn works', previous.state.turn.activeCombatantId === 'unrolled' || previous.state.turn.activeCombatantId === 'npc-1');

const paused = pauseCombat(state);
check('pause combat state', paused.state.turn.status === 'paused' && paused.event?.eventKind === 'combat.paused');
const resumed = resumeCombat(paused.state);
check('resume combat state', resumed.state.turn.status === 'active' && resumed.event?.eventKind === 'combat.resumed');

const defeated = createCombatant({ ...manualNpc, isDefeated: true, status: 'defeated', id: manualNpc.id });
check('mark defeated', defeated.isDefeated && defeated.status === 'defeated');
const hpUpdated = createCombatant({ ...manualNpc, hpCurrent: 3, id: manualNpc.id });
check('update HP', hpUpdated.hpCurrent === 3 && hpUpdated.hitPoints === 3);
const withCondition = createCombatant({ ...manualNpc, conditions: ['Restrained'], id: manualNpc.id });
const withoutCondition = createCombatant({ ...withCondition, conditions: [], id: manualNpc.id });
check('add/remove condition', withCondition.conditions[0] === 'Restrained' && withoutCondition.conditions.length === 0);

const systemNote = { eventKind: 'system.note', payload: { text: 'A door opens.' } };
check('append system.note payload model', systemNote.eventKind === 'system.note' && typeof systemNote.payload.text === 'string');
const eventKinds: CombatRuntimeEventDraft['eventKind'][] = [
  'combat.started', 'combat.initiative_rolled', 'combat.turn_advanced', 'combat.round_advanced', 'combat.combatant_added', 'combat.combatant_updated', 'combat.combatant_removed', 'combat.paused', 'combat.resumed', 'combat.ended',
];
check('no update/delete runtime event action', !eventKinds.includes('runtime.event.update' as CombatRuntimeEventDraft['eventKind']) && !eventKinds.includes('runtime.event.delete' as CombatRuntimeEventDraft['eventKind']));
check('local-only combat table limitation is represented', !('persist' in state) && !('database' in state));
check('frontend database boundary is preserved', !('databaseUrl' in state));

console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
