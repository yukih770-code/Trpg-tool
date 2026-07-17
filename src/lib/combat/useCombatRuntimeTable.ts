import { useCallback, useEffect, useState } from 'react';
import {
  createCombatant,
  createCombatRuntimeTableState,
  advanceTurn,
  endCombat,
  pauseCombat,
  resumeCombat,
  startCombat,
  type Combatant,
  type CombatantInput,
  type CombatRuntimeEventDraft,
  type CombatRuntimeTableState,
} from './combatRuntimeTypes';
import { replayCombatRuntimeEvents, type CombatRuntimeReplayEvent } from './combatRuntimeReplay';
import {
  applyDamage,
  applyHealing,
  applyTemporaryHp,
  createConditionEvent,
  createDamageEvent,
  createHealingEvent,
  createHitPointOverrideEvent,
  createTemporaryHpEvent,
  overrideHitPoints,
  toggleCondition,
  type CombatChangeContext,
} from './combatComfort';

function newCombatantId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `combatant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useCombatRuntimeTable(scopeKey: string) {
  const [state, setState] = useState<CombatRuntimeTableState>(createCombatRuntimeTableState);

  useEffect(() => {
    setState(createCombatRuntimeTableState());
  }, [scopeKey]);

  const addCombatant = useCallback((input: CombatantInput): { combatant: Combatant; event: CombatRuntimeEventDraft } => {
    const combatant = createCombatant({ ...input, id: newCombatantId() });
    setState((previous) => ({ ...previous, combatants: [...previous.combatants, combatant] }));
    return { combatant, event: { eventKind: 'combat.combatant_added', payload: { combatant } } };
  }, []);

  const updateCombatant = useCallback((id: string, patch: Partial<Omit<Combatant, 'id'>>): CombatRuntimeEventDraft | null => {
    const current = state.combatants.find((combatant) => combatant.id === id);
    if (!current) return null;
    const updated = { ...current, ...patch, conditions: patch.conditions ? [...patch.conditions] : current.conditions };
    setState((previous) => ({ ...previous, combatants: previous.combatants.map((combatant) => combatant.id === id ? updated : combatant) }));
    return { eventKind: 'combat.combatant_updated', payload: { combatant: updated } };
  }, [state.combatants]);

  const removeCombatant = useCallback((id: string): CombatRuntimeEventDraft | null => {
    const removed = state.combatants.find((combatant) => combatant.id === id);
    if (!removed) return null;
    setState((previous) => ({
      ...previous,
      combatants: previous.combatants.filter((combatant) => combatant.id !== id),
      turn: previous.turn.activeCombatantId === id ? { ...previous.turn, activeCombatantId: undefined } : previous.turn,
    }));
    return { eventKind: 'combat.combatant_removed', payload: { combatantId: id, displayName: removed.displayName } };
  }, [state.combatants]);

  const markDefeated = useCallback((id: string): CombatRuntimeEventDraft | null => updateCombatant(id, { status: 'defeated' }), [updateCombatant]);

  const replaceCombatant = useCallback((next: Combatant) => {
    setState((previous) => ({ ...previous, combatants: previous.combatants.map((combatant) => combatant.id === next.id ? next : combatant) }));
  }, []);

  const damage = useCallback((id: string, amount: number, context?: CombatChangeContext): CombatRuntimeEventDraft | null => {
    const current = state.combatants.find((combatant) => combatant.id === id);
    if (!current) return null;
    const change = applyDamage(current, amount);
    replaceCombatant(change.combatant);
    return createDamageEvent(change, amount, context);
  }, [replaceCombatant, state.combatants]);

  const heal = useCallback((id: string, amount: number, context?: CombatChangeContext): CombatRuntimeEventDraft | null => {
    const current = state.combatants.find((combatant) => combatant.id === id);
    if (!current) return null;
    const change = applyHealing(current, amount);
    replaceCombatant(change.combatant);
    return createHealingEvent(change, amount, context);
  }, [replaceCombatant, state.combatants]);

  const temporaryHp = useCallback((id: string, amount: number, replace: boolean, context?: CombatChangeContext): CombatRuntimeEventDraft | null => {
    const current = state.combatants.find((combatant) => combatant.id === id);
    if (!current) return null;
    const change = applyTemporaryHp(current, amount, replace);
    replaceCombatant(change.combatant);
    return createTemporaryHpEvent(change, amount, context, replace);
  }, [replaceCombatant, state.combatants]);

  const overrideHp = useCallback((id: string, value: number, context?: CombatChangeContext): CombatRuntimeEventDraft | null => {
    const current = state.combatants.find((combatant) => combatant.id === id);
    if (!current) return null;
    const change = overrideHitPoints(current, value);
    replaceCombatant(change.combatant);
    return createHitPointOverrideEvent(change, context);
  }, [replaceCombatant, state.combatants]);

  const setCondition = useCallback((id: string, condition: string): CombatRuntimeEventDraft | null => {
    const current = state.combatants.find((combatant) => combatant.id === id);
    if (!current || !condition.trim()) return null;
    const changed = toggleCondition(current, condition);
    replaceCombatant(changed.combatant);
    return createConditionEvent(changed.combatant, condition, changed.added, {}, true);
  }, [replaceCombatant, state.combatants]);

  const rollInitiative = useCallback((id: string): CombatRuntimeEventDraft | null => {
    const current = state.combatants.find((combatant) => combatant.id === id);
    if (!current) return null;
    const die = Math.floor(Math.random() * 20) + 1;
    const initiative = die + current.initiativeModifier;
    const updated = { ...current, initiative };
    setState((previous) => ({ ...previous, combatants: previous.combatants.map((combatant) => combatant.id === id ? updated : combatant) }));
    return { eventKind: 'combat.combatant_updated', payload: { combatant: updated, initiativeRoll: die, initiativeModifier: current.initiativeModifier } };
  }, [state.combatants]);

  const start = useCallback(() => {
    const result = startCombat(state);
    setState(result.state);
    return result.event;
  }, [state]);

  const moveTurn = useCallback((direction: 'next' | 'previous') => {
    const result = advanceTurn(state, direction);
    setState(result.state);
    return result.event;
  }, [state]);

  const end = useCallback(() => {
    const result = endCombat(state);
    setState(result.state);
    return result.event;
  }, [state]);

  const pause = useCallback(() => {
    const result = pauseCombat(state);
    setState(result.state);
    return result.event;
  }, [state]);

  const resume = useCallback(() => {
    const result = resumeCombat(state);
    setState(result.state);
    return result.event;
  }, [state]);

  const restore = useCallback((events: ReadonlyArray<CombatRuntimeReplayEvent>) => {
    const nextState = replayCombatRuntimeEvents(events);
    setState(nextState);
    return nextState;
  }, []);

  const replaceState = useCallback((nextState: CombatRuntimeTableState) => {
    const normalized = {
      combatants: nextState.combatants.map((combatant) => createCombatant({ ...combatant, conditions: [...combatant.conditions] })),
      turn: { ...nextState.turn },
    };
    setState(normalized);
    return normalized;
  }, []);

  const clear = useCallback((): CombatRuntimeEventDraft => {
    setState(createCombatRuntimeTableState());
    return { eventKind: 'combat.table_cleared', payload: {} };
  }, []);

  return { state, addCombatant, updateCombatant, removeCombatant, markDefeated, damage, heal, temporaryHp, overrideHp, setCondition, rollInitiative, start, moveTurn, pause, resume, end, clear, restore, replaceState };
}
