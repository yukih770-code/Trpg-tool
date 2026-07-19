import { sortCombatants, type Combatant, type CombatRuntimeTableState } from './combatRuntimeTypes';

export type CombatModeHudState = 'not_in_combat' | 'combat_setup' | 'in_combat' | 'paused' | 'ended';

export type CombatModeHudModel = {
  mode: CombatModeHudState;
  roundNumber: number;
  activeCombatant?: Combatant;
  combatants: Array<Combatant & { isCurrent: boolean }>;
};

export function getCombatModeHudModel(state: CombatRuntimeTableState): CombatModeHudModel {
  const mode: CombatModeHudState = state.turn.status === 'active'
    ? 'in_combat'
    : state.turn.status === 'paused'
      ? 'paused'
      : state.turn.status === 'ended'
        ? 'ended'
        : state.combatants.length > 0
          ? 'combat_setup'
          : 'not_in_combat';
  const activeCombatant = state.turn.activeCombatantId
    ? state.combatants.find((combatant) => combatant.id === state.turn.activeCombatantId)
    : undefined;
  const combatants = sortCombatants(state.combatants).map((combatant) => ({
    ...combatant,
    isCurrent: combatant.id === activeCombatant?.id,
  }));

  return { mode, roundNumber: state.turn.roundNumber, activeCombatant, combatants };
}
