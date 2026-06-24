/**
 * DND runtime-change contracts (v1, types only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_RUNTIME_CHANGE_TYPES_V1
 *
 * A `DndRuntimeChange` is one of the OUTPUTS a future resolver emits — a
 * declarative description of a state delta (HP change, condition applied,
 * resource spent, concentration started, …). It is applied by the runtime store
 * and recorded by the log; it is NOT a UI mutation and contains no rule logic.
 * No resolver is implemented here.
 */

import type { DndDamageType } from './effectTypes';

export type DndRuntimeChangeType =
  | 'hpChange'
  | 'tempHpChange'
  | 'conditionApplied'
  | 'conditionRemoved'
  | 'resourceSpent'
  | 'resourceRestored'
  | 'positionChanged'
  | 'concentrationStarted'
  | 'concentrationEnded'
  | 'itemQuantityChanged'
  | 'custom';

export interface DndHpChange {
  actorId: string;
  /** Negative for damage, positive for healing. */
  delta: number;
  damageType?: DndDamageType;
  sourceActionId?: string;
  sourceEffectId?: string;
}

export interface DndRuntimeChange {
  id: string;
  type: DndRuntimeChangeType;
  actorId?: string;
  payload: DndHpChange | Record<string, unknown>;
  sourceActionId?: string;
  sourceEffectId?: string;
  /** ISO timestamp, set by the emitter. */
  timestamp?: string;
}
