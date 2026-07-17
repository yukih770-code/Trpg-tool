export type CombatantKind = 'character' | 'npc' | 'other';

export type CombatantSourceType = 'campaign_actor' | 'manual_npc' | 'manual_pc' | 'unknown';

export type CombatantStatus = 'active' | 'defeated' | 'removed';

export type CombatRuntimeStatus = 'setup' | 'active' | 'paused' | 'ended';

export type Combatant = {
  id: string;
  name: string;
  displayName: string;
  sourceType: CombatantSourceType;
  kind: CombatantKind;
  sourceActorInstanceId?: string;
  controllerUserId?: string;
  initiative?: number;
  initiativeModifier: number;
  initiativeFormula?: string;
  hpCurrent?: number;
  hpMax?: number;
  temporaryHp?: number;
  armorClass?: number;
  conditions: string[];
  notes?: string;
  isDefeated: boolean;
  status: CombatantStatus;
  hitPoints?: number;
  maxHitPoints?: number;
};

export type CombatTurnState = {
  activeCombatantId?: string;
  roundNumber: number;
  turnIndex: number;
  startedAt?: string;
  status: CombatRuntimeStatus;
};

export type CombatRuntimeTableState = {
  combatants: Combatant[];
  turn: CombatTurnState;
};

export type CombatantInput = {
  id?: string;
  name?: string;
  displayName?: string;
  sourceType?: CombatantSourceType;
  kind: CombatantKind;
  sourceActorInstanceId?: string;
  controllerUserId?: string;
  initiative?: number;
  initiativeModifier: number;
  initiativeFormula?: string;
  hpCurrent?: number;
  hpMax?: number;
  temporaryHp?: number;
  armorClass?: number;
  conditions: string[];
  notes?: string;
  isDefeated?: boolean;
  status?: CombatantStatus;
  hitPoints?: number;
  maxHitPoints?: number;
};

export type CombatRuntimeEventDraft = {
  eventKind:
    | 'combat.started'
    | 'combat.turn_advanced'
    | 'combat.round_advanced'
    | 'combat.combatant_added'
    | 'combat.combatant_updated'
    | 'combat.combatant_removed'
    | 'combat.damage_applied'
    | 'combat.healing_applied'
    | 'combat.temporary_hp_applied'
    | 'combat.condition_added'
    | 'combat.condition_removed'
    | 'combat.condition_toggled'
    | 'combat.hp_overridden'
    | 'combat.table_cleared'
    | 'combat.paused'
    | 'combat.resumed'
    | 'combat.ended';
  payload: Record<string, unknown>;
};

export function createCombatant(input: CombatantInput): Combatant {
  const displayName = input.displayName?.trim() || input.name?.trim() || 'Unnamed combatant';
  const hpCurrent = input.hpCurrent ?? input.hitPoints;
  const hpMax = input.hpMax ?? input.maxHitPoints;
  const isDefeated = input.isDefeated ?? input.status === 'defeated';
  return {
    ...input,
    id: input.id ?? '',
    name: input.name?.trim() || displayName,
    displayName,
    sourceType: input.sourceType ?? 'unknown',
    status: isDefeated ? 'defeated' : input.status ?? 'active',
    isDefeated,
    hpCurrent,
    hpMax,
    hitPoints: hpCurrent,
    maxHitPoints: hpMax,
    conditions: [...input.conditions],
  };
}

export function createCombatRuntimeTableState(): CombatRuntimeTableState {
  return { combatants: [], turn: { status: 'setup', roundNumber: 1, turnIndex: -1 } };
}

export function sortCombatants(combatants: Combatant[]): Combatant[] {
  return combatants
    .map((combatant, index) => ({ combatant, index }))
    .sort((left, right) => {
      if (left.combatant.initiative === undefined && right.combatant.initiative !== undefined) return 1;
      if (left.combatant.initiative !== undefined && right.combatant.initiative === undefined) return -1;
      if (left.combatant.initiative !== undefined && right.combatant.initiative !== undefined) {
        const difference = right.combatant.initiative - left.combatant.initiative;
        if (difference !== 0) return difference;
      }
      return left.index - right.index;
    })
    .map(({ combatant }) => combatant);
}

function eligibleCombatants(state: CombatRuntimeTableState): Combatant[] {
  return sortCombatants(state.combatants.filter((combatant) => combatant.status === 'active' && !combatant.isDefeated));
}

function turnPayload(state: CombatRuntimeTableState, activeCombatantId?: string): Record<string, unknown> {
  return { roundNumber: state.turn.roundNumber, turnIndex: state.turn.turnIndex, activeCombatantId };
}

export function startCombat(state: CombatRuntimeTableState): { state: CombatRuntimeTableState; event: CombatRuntimeEventDraft | null } {
  const order = eligibleCombatants(state);
  if (order.length === 0) return { state, event: null };
  const activeCombatantId = order[0].id;
  const nextState = { combatants: state.combatants, turn: { status: 'active' as const, roundNumber: 1, turnIndex: 0, startedAt: new Date().toISOString(), activeCombatantId } };
  return { state: nextState, event: { eventKind: 'combat.started', payload: { ...turnPayload(nextState), combatantCount: order.length } } };
}

export function advanceTurn(state: CombatRuntimeTableState, direction: 'next' | 'previous' = 'next'):
  { state: CombatRuntimeTableState; event: CombatRuntimeEventDraft | null } {
  const order = eligibleCombatants(state);
  if (order.length === 0) return { state, event: null };
  const currentIndex = state.turn.activeCombatantId ? order.findIndex((combatant) => combatant.id === state.turn.activeCombatantId) : -1;
  const baseIndex = currentIndex < 0 ? (direction === 'next' ? -1 : 0) : currentIndex;
  const nextIndex = direction === 'next' ? (baseIndex + 1) % order.length : (baseIndex - 1 + order.length) % order.length;
  const wrapped = direction === 'next' ? nextIndex <= baseIndex : nextIndex >= baseIndex;
  const roundNumber = direction === 'next' ? state.turn.roundNumber + (wrapped ? 1 : 0) : Math.max(1, state.turn.roundNumber - (wrapped ? 1 : 0));
  const nextState = { combatants: state.combatants, turn: { ...state.turn, status: 'active' as const, roundNumber, turnIndex: nextIndex, activeCombatantId: order[nextIndex].id } };
  return { state: nextState, event: { eventKind: wrapped ? 'combat.round_advanced' : 'combat.turn_advanced', payload: { direction, ...turnPayload(nextState, order[nextIndex].id) } } };
}

export function pauseCombat(state: CombatRuntimeTableState): { state: CombatRuntimeTableState; event: CombatRuntimeEventDraft | null } {
  if (state.turn.status !== 'active') return { state, event: null };
  const nextState = { combatants: state.combatants, turn: { ...state.turn, status: 'paused' as const } };
  return { state: nextState, event: { eventKind: 'combat.paused', payload: turnPayload(nextState, nextState.turn.activeCombatantId) } };
}

export function resumeCombat(state: CombatRuntimeTableState): { state: CombatRuntimeTableState; event: CombatRuntimeEventDraft | null } {
  if (state.turn.status !== 'paused') return { state, event: null };
  const nextState = { combatants: state.combatants, turn: { ...state.turn, status: 'active' as const } };
  return { state: nextState, event: { eventKind: 'combat.resumed', payload: turnPayload(nextState, nextState.turn.activeCombatantId) } };
}

export function endCombat(state: CombatRuntimeTableState): { state: CombatRuntimeTableState; event: CombatRuntimeEventDraft } {
  const nextState = { combatants: state.combatants, turn: { ...state.turn, status: 'ended' as const } };
  return { state: nextState, event: { eventKind: 'combat.ended', payload: turnPayload(nextState, nextState.turn.activeCombatantId) } };
}
