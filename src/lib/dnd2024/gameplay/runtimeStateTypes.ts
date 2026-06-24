/**
 * DND runtime combat state contracts (v1, types only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_RUNTIME_STATE_TYPES_V1
 *
 * Boundary (do not blur):
 *   - Runtime State is short-lived encounter/session state (current HP, temp HP,
 *     applied conditions, concentration, per-encounter resources).
 *   - It is NOT Character Library State (the permanent character / loadout).
 *   - It is NOT Campaign Actor permanent inventory / gold / growth.
 *   - It is NOT the RuntimeLog (the log records results; it is not state).
 *
 * Flow: Resolvers READ Runtime State and OUTPUT DndRuntimeChange; Stores APPLY
 * the change to Runtime State; Logs RECORD the result. This module declares the
 * state SHAPES only — no resolver, no store, no roll/attack/damage logic, no
 * initiative, no map/grid, no visibility.
 */

import type { DndAppliedCondition } from './conditionTypes';
import type { DndResourceState } from './resourceTypes';

export type DndRuntimeActorKind =
  | 'playerCharacter'
  | 'npc'
  | 'monster'
  | 'summon'
  | 'object'
  | 'custom';

/** How an actor's AC is known this encounter. `derived` is a placeholder for a
 * future armor/feat-driven derivation; v0 uses `manual`. */
export type DndRuntimeAcMode = 'manual' | 'derived' | 'unknown';

export interface DndRuntimeAcState {
  mode: DndRuntimeAcMode;
  value?: number;
  sourceRefs?: string[];
  note?: string;
}

export interface DndRuntimeHpState {
  /** Current HP — the canonical Runtime value. */
  current: number;
  /** Max HP is optional here; it is derived from the character / campaign actor. */
  max?: number;
  /** Temporary HP, absorbed before current HP. */
  temp?: number;
  deathSaveSuccesses?: number;
  deathSaveFailures?: number;
  note?: string;
}

/** Concentration is Runtime State (one active at a time), NOT an EffectDefinition. */
export interface DndRuntimeConcentrationState {
  active: boolean;
  sourceActionId?: string;
  sourceEffectId?: string;
  startedAtRound?: number;
  note?: string;
}

export interface DndRuntimeActorState {
  actorId: string;
  displayName?: string;
  kind: DndRuntimeActorKind;

  hp: DndRuntimeHpState;
  ac?: DndRuntimeAcState;

  /** Applied conditions (Runtime State), not condition definitions. */
  conditions?: DndAppliedCondition[];
  /** Per-encounter resource state (action/bonus/reaction/slots/...). Refresh is NOT implemented this round. */
  resources?: DndResourceState[];
  concentration?: DndRuntimeConcentrationState;

  isDefeated?: boolean;
  isHidden?: boolean;

  sourceRef?: string;
  note?: string;
}

/** Turn / round bookkeeping. Optional placeholder — no initiative this round. */
export interface DndRuntimeRoundState {
  round?: number;
  activeActorId?: string;
  turnOrder?: string[];
  note?: string;
}

/** A single encounter's runtime state. NOT equal to Campaign State. */
export interface DndRuntimeEncounterState {
  encounterId: string;
  campaignId?: string;
  sessionId?: string;

  actors: Record<string, DndRuntimeActorState>;
  roundState?: DndRuntimeRoundState;

  createdAt?: string;
  updatedAt?: string;
  note?: string;
}
