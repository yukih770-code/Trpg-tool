import type { RuntimeEvent } from '../api/campaignRoomApiClient';
import {
  createCombatant,
  createCombatRuntimeTableState,
  type CombatRuntimeTableState,
  type Combatant,
  type CombatantInput,
  type CombatantKind,
  type CombatantSourceType,
  type CombatantStatus,
} from './combatRuntimeTypes';

export type CombatRuntimeReplayEvent = Pick<RuntimeEvent, 'eventKind' | 'payload' | 'seq' | 'createdAt'>;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function sourceType(value: unknown): CombatantSourceType {
  return value === 'campaign_actor' || value === 'manual_npc' || value === 'manual_pc' ? value : 'unknown';
}

function kind(value: unknown): CombatantKind {
  return value === 'character' || value === 'npc' ? value : 'other';
}

function status(value: unknown): CombatantStatus | undefined {
  return value === 'active' || value === 'defeated' || value === 'removed' ? value : undefined;
}

function conditions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '') : [];
}

function combatantInput(value: unknown, fallback?: Combatant): Combatant | null {
  const input = record(value);
  const id = stringValue(input?.id) ?? fallback?.id;
  if (!id) return null;
  const name = stringValue(input?.name) ?? stringValue(input?.displayName) ?? fallback?.displayName ?? 'Unnamed combatant';
  const sourceActorInstanceId = stringValue(input?.sourceActorInstanceId) ?? fallback?.sourceActorInstanceId;
  const next: CombatantInput = {
    id,
    name,
    displayName: name,
    sourceType: input?.sourceType === undefined ? fallback?.sourceType : sourceType(input.sourceType),
    kind: input?.kind === undefined ? fallback?.kind ?? 'other' : kind(input.kind),
    sourceActorInstanceId,
    controllerUserId: stringValue(input?.controllerUserId) ?? fallback?.controllerUserId,
    initiative: numberValue(input?.initiative) ?? fallback?.initiative,
    initiativeModifier: numberValue(input?.initiativeModifier) ?? fallback?.initiativeModifier ?? 0,
    initiativeFormula: stringValue(input?.initiativeFormula) ?? fallback?.initiativeFormula,
    hpCurrent: numberValue(input?.hpCurrent) ?? numberValue(input?.hitPoints) ?? fallback?.hpCurrent,
    hpMax: numberValue(input?.hpMax) ?? numberValue(input?.maxHitPoints) ?? fallback?.hpMax,
    temporaryHp: numberValue(input?.temporaryHp) ?? fallback?.temporaryHp,
    armorClass: numberValue(input?.armorClass) ?? fallback?.armorClass,
    conditions: input?.conditions === undefined ? fallback?.conditions ?? [] : conditions(input.conditions),
    notes: stringValue(input?.notes) ?? fallback?.notes,
    isDefeated: typeof input?.isDefeated === 'boolean' ? input.isDefeated : fallback?.isDefeated,
    status: input?.status === undefined ? fallback?.status : status(input.status),
  };
  return createCombatant(next);
}

function applyTurnPayload(state: CombatRuntimeTableState, event: CombatRuntimeReplayEvent, statusValue: CombatRuntimeTableState['turn']['status']): CombatRuntimeTableState {
  const payload = event.payload ?? {};
  return {
    combatants: state.combatants,
    turn: {
      ...state.turn,
      status: statusValue,
      roundNumber: numberValue(payload.roundNumber) ?? numberValue(payload.round) ?? state.turn.roundNumber,
      turnIndex: numberValue(payload.turnIndex) ?? state.turn.turnIndex,
      activeCombatantId: stringValue(payload.activeCombatantId) ?? state.turn.activeCombatantId,
      startedAt: state.turn.startedAt ?? event.createdAt,
    },
  };
}

function applyCombatantsPayload(state: CombatRuntimeTableState, payload: Record<string, unknown>): CombatRuntimeTableState {
  if (!Array.isArray(payload.combatants)) return state;
  const combatants = payload.combatants.flatMap((value) => {
    const combatant = combatantInput(value);
    return combatant ? [combatant] : [];
  });
  return combatants.length > 0 ? { ...state, combatants } : state;
}

export function replayCombatRuntimeEvents(events: ReadonlyArray<CombatRuntimeReplayEvent>): CombatRuntimeTableState {
  const ordered = events
    .map((event, index) => ({ event, index }))
    .sort((left, right) => (left.event.seq ?? left.index) - (right.event.seq ?? right.index) || left.index - right.index)
    .map(({ event }) => event);
  let state = createCombatRuntimeTableState();

  for (const event of ordered) {
    const payload = event.payload ?? {};
    if (event.eventKind === 'combat.combatant_added') {
      const combatant = combatantInput(payload.combatant);
      if (combatant && !state.combatants.some((item) => item.id === combatant.id)) state = { ...state, combatants: [...state.combatants, combatant] };
      continue;
    }
    if (event.eventKind === 'combat.combatant_updated' || event.eventKind === 'combat.initiative_rolled') {
      const candidate = record(payload.combatant);
      const id = stringValue(candidate?.id);
      const existing = id ? state.combatants.find((item) => item.id === id) : undefined;
      const combatant = combatantInput(candidate, existing);
      if (combatant && existing) state = { ...state, combatants: state.combatants.map((item) => item.id === combatant.id ? combatant : item) };
      continue;
    }
    if (event.eventKind === 'combat.combatant_removed') {
      const id = stringValue(payload.combatantId);
      if (id) state = { ...state, combatants: state.combatants.filter((item) => item.id !== id), turn: state.turn.activeCombatantId === id ? { ...state.turn, activeCombatantId: undefined, turnIndex: -1 } : state.turn };
      continue;
    }
    if (event.eventKind === 'combat.table_cleared') {
      state = createCombatRuntimeTableState();
      continue;
    }
    if (
      event.eventKind === 'combat.damage_applied'
      || event.eventKind === 'combat.healing_applied'
      || event.eventKind === 'combat.temporary_hp_applied'
      || event.eventKind === 'combat.hp_overridden'
    ) {
      const id = stringValue(payload.targetCombatantId);
      if (!id) continue;
      state = {
        ...state,
        combatants: state.combatants.map((combatant) => {
          if (combatant.id !== id) return combatant;
          const hpCurrent = numberValue(payload.afterHp) ?? combatant.hpCurrent;
          const temporaryHp = numberValue(payload.afterTemporaryHp) ?? combatant.temporaryHp;
          return { ...combatant, hpCurrent, hitPoints: hpCurrent, temporaryHp: temporaryHp || undefined };
        }),
      };
      continue;
    }
    if (event.eventKind === 'combat.condition_added' || event.eventKind === 'combat.condition_removed' || event.eventKind === 'combat.condition_toggled') {
      const id = stringValue(payload.targetCombatantId);
      const condition = stringValue(payload.condition);
      if (!id || !condition) continue;
      state = {
        ...state,
        combatants: state.combatants.map((combatant) => {
          if (combatant.id !== id) return combatant;
          const has = combatant.conditions.includes(condition);
          const shouldAdd = event.eventKind === 'combat.condition_added' || (event.eventKind === 'combat.condition_toggled' && !has);
          return { ...combatant, conditions: shouldAdd ? (has ? combatant.conditions : [...combatant.conditions, condition]) : combatant.conditions.filter((item) => item !== condition) };
        }),
      };
      continue;
    }
    if (event.eventKind === 'combat.started' || event.eventKind === 'combat.started_turn_based') {
      state = applyTurnPayload(applyCombatantsPayload(state, payload), event, 'active');
      continue;
    }
    if (event.eventKind === 'combat.turn_advanced' || event.eventKind === 'combat.round_advanced') {
      state = applyTurnPayload(state, event, 'active');
      continue;
    }
    if (event.eventKind === 'combat.paused') {
      state = applyTurnPayload(state, event, 'paused');
      continue;
    }
    if (event.eventKind === 'combat.resumed') {
      state = applyTurnPayload(state, event, 'active');
      continue;
    }
    if (event.eventKind === 'combat.ended') state = applyTurnPayload(state, event, 'ended');
  }

  return state;
}

export function hasCombatRuntimeEvents(events: ReadonlyArray<Pick<RuntimeEvent, 'eventKind'>>): boolean {
  return events.some((event) => event.eventKind.startsWith('combat.'));
}
