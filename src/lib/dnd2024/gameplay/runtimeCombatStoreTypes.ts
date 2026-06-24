/**
 * DND Runtime Combat Store contract (v1, types only).
 *
 * AI-LANDMARK: DND_RUNTIME_COMBAT_STORE_TYPES_V1
 *
 * RuntimeCombatStoreTypes defines the CONTRACT only.
 *   - It does NOT implement a Zustand store, persistence, or log append.
 *   - The future store owns the current RuntimeEncounterState, selection state,
 *     warnings, and pending RuntimeLogEntry drafts.
 *   - It does NOT own UI layout state (floating panel positions, map zoom/pan,
 *     window size, z-index).
 *   - Resolver / flow / applier remain PURE services; store actions call them
 *     but never inline rules math.
 *
 * RuntimeLog two-model boundary (do not unify this round):
 *   - `RuntimeLogEntry` (runtime-log-types.ts) = gameplay draft / display model;
 *     this contract only BUFFERS these drafts (pendingLogDrafts).
 *   - `LocalRuntimeLogEvent` / `AppendRuntimeLogEventInput` (runtimeLogLocalStore)
 *     = persistence / local repository model.
 *   - Drafts are NOT persistence events. A future bridge (P5.4) must map
 *     RuntimeLogEntry drafts to the local append model; the persistence layer
 *     generates the final id and createdAt/timestamp. No mapper here.
 */

import type { RuntimeLogEntry } from '../../runtime-log-types';
import type { DndRuntimeChange } from './runtimeChangeTypes';
import type { DndRuntimeEncounterState } from './runtimeStateTypes';
import type { DndRuntimeChangeApplyResult } from './runtimeChangeApplier';
import type { DndDaggerAttackFlowResult } from './daggerAttackFlow';

export interface DndRuntimeCombatSelectionState {
  selectedActorId?: string;
  selectedTargetId?: string;
}

export interface DndRuntimeCombatWarning {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source?: 'store' | 'resolver' | 'applier' | 'log' | 'ui' | 'custom';
}

export interface DndRuntimeCombatStoreState {
  /** Current Runtime State — NOT Character Library or Campaign Actor state. */
  encounter?: DndRuntimeEncounterState;
  /** Buffered gameplay log DRAFTS — not persisted; not a source of truth. */
  pendingLogDrafts: RuntimeLogEntry[];
  selection: DndRuntimeCombatSelectionState;
  warnings: DndRuntimeCombatWarning[];
}

export interface DndRuntimeCombatStartEncounterInput {
  encounter: DndRuntimeEncounterState;
}

export interface DndRuntimeCombatCommitChangesInput {
  changes: DndRuntimeChange[];
}

export interface DndRuntimeCombatCommitChangesResult {
  applyResult: DndRuntimeChangeApplyResult;
  pendingLogDrafts: RuntimeLogEntry[];
  warnings: DndRuntimeCombatWarning[];
}

export interface DndRuntimeCombatDaggerAttackInput {
  actorId: string;
  targetId: string;

  d20: number;
  damageRollTotal: number;

  abilityModifier: number;
  proficiencyBonus?: number;
  otherAttackBonus?: number;
  otherDamageBonus?: number;

  actorName?: string;
  targetName?: string;
  timestamp?: number;
}

export interface DndRuntimeCombatDaggerAttackResult {
  flowResult: DndDaggerAttackFlowResult;
  pendingLogDrafts: RuntimeLogEntry[];
  warnings: DndRuntimeCombatWarning[];
}

export interface DndRuntimeCombatStoreActions {
  startEncounter(input: DndRuntimeCombatStartEncounterInput): void;
  setEncounter(encounter: DndRuntimeEncounterState): void;
  resetEncounter(): void;

  selectActor(actorId?: string): void;
  selectTarget(targetId?: string): void;

  /** Apply RuntimeChanges via the pure applier and commit the next encounter. */
  commitRuntimeChanges(
    input: DndRuntimeCombatCommitChangesInput,
  ): DndRuntimeCombatCommitChangesResult;

  /** Thin action: delegates to the pure dagger flow service, commits, buffers drafts. */
  runDaggerAttack(
    input: DndRuntimeCombatDaggerAttackInput,
  ): DndRuntimeCombatDaggerAttackResult;

  clearPendingLogDrafts(): void;
  clearWarnings(): void;
}

export type DndRuntimeCombatStoreContract = DndRuntimeCombatStoreState &
  DndRuntimeCombatStoreActions;
