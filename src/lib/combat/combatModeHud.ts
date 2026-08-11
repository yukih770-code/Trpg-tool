import { sortCombatants, type Combatant, type CombatRuntimeTableState } from './combatRuntimeTypes';

export type CombatModeHudState = 'not_in_combat' | 'combat_setup' | 'in_combat' | 'paused' | 'ended';

export type CombatModeHudModel = {
  mode: CombatModeHudState;
  roundNumber: number;
  activeCombatant?: Combatant;
  previousCombatant?: Combatant;
  nextCombatant?: Combatant;
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
  const eligible = combatants.filter((combatant) => combatant.status === 'active' && !combatant.isDefeated);
  const activeIndex = activeCombatant ? eligible.findIndex((combatant) => combatant.id === activeCombatant.id) : -1;
  const previousCombatant = activeIndex >= 0 && eligible.length > 1
    ? eligible[(activeIndex - 1 + eligible.length) % eligible.length]
    : undefined;
  const nextCombatant = activeIndex >= 0 && eligible.length > 1
    ? eligible[(activeIndex + 1) % eligible.length]
    : undefined;

  return { mode, roundNumber: state.turn.roundNumber, activeCombatant, previousCombatant, nextCombatant, combatants };
}
