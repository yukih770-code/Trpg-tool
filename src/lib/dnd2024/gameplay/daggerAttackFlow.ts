/**
 * DND dagger melee attack flow (v0) — pure orchestration.
 *
 * AI-LANDMARK: DND_DAGGER_ATTACK_FLOW_V0
 *
 * This is a v0 PURE orchestration flow for a dagger melee attack. It composes
 * resolver -> RuntimeChange applier -> RuntimeLog draft adapter. It does not
 * roll dice, mutate stores, append logs, run UI, manage turns, or persist state.
 * The encounter returned inside `applyResult` is the next RuntimeEncounterState
 * CANDIDATE; a future Runtime Store task may choose to commit it.
 */

import type { DndRuntimeEncounterState } from './runtimeStateTypes';
import {
  DAGGER_MELEE_ACTION_ID,
  resolveDaggerMeleeWeaponAttackV0,
  type DndWeaponAttackResolverResult,
} from './weaponAttackResolver';
import { applyRuntimeChangesV0, type DndRuntimeChangeApplyResult } from './runtimeChangeApplier';
import {
  createDaggerAttackRuntimeLogDraftsV0,
  type DndRuntimeLogDraftAdapterResult,
} from './runtimeLogDraftAdapter';

export interface DndDaggerAttackFlowInput {
  encounter: DndRuntimeEncounterState;

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

export interface DndDaggerAttackFlowResult {
  resolverResult: DndWeaponAttackResolverResult;
  applyResult: DndRuntimeChangeApplyResult;
  logDrafts: DndRuntimeLogDraftAdapterResult;
  notes: string[];
}

/**
 * Run the full (non-persisted) dagger melee attack flow: resolve the attack,
 * apply its RuntimeChanges to a NEW encounter candidate, and build RuntimeLog
 * drafts. Throws if the actor or target is not in the encounter (the resolver
 * throws on an invalid/missing manual target AC).
 */
export function runDaggerMeleeAttackFlowV0(input: DndDaggerAttackFlowInput): DndDaggerAttackFlowResult {
  const { encounter, actorId, targetId } = input;

  const actor = encounter.actors[actorId];
  if (!actor) {
    throw new Error(`[daggerAttackFlow v0] Actor not found: "${actorId}".`);
  }
  const target = encounter.actors[targetId];
  if (!target) {
    throw new Error(`[daggerAttackFlow v0] Target not found: "${targetId}".`);
  }

  const resolverResult = resolveDaggerMeleeWeaponAttackV0({
    actionId: DAGGER_MELEE_ACTION_ID,
    actor,
    target,
    d20: input.d20,
    abilityModifier: input.abilityModifier,
    proficiencyBonus: input.proficiencyBonus,
    otherAttackBonus: input.otherAttackBonus,
    damageRollTotal: input.damageRollTotal,
    otherDamageBonus: input.otherDamageBonus,
  });

  const applyResult = applyRuntimeChangesV0(encounter, resolverResult.runtimeChanges);

  const logDrafts = createDaggerAttackRuntimeLogDraftsV0({
    encounterId: encounter.encounterId,
    sessionId: encounter.sessionId,
    actorName: input.actorName,
    targetName: input.targetName,
    resolverResult,
    // Pass the resolver's emitted changes (do not re-derive from applyResult).
    appliedChanges: resolverResult.runtimeChanges,
    timestamp: input.timestamp,
  });

  const notes: string[] = [
    `Dagger melee flow: ${resolverResult.hit ? 'hit' : 'miss'}.`,
    `Applied ${applyResult.appliedChangeIds.length} change(s), skipped ${applyResult.skippedChangeIds.length}.`,
    'Pure flow — nothing persisted. applyResult.encounter is the next candidate; logDrafts are not appended.',
  ];

  return { resolverResult, applyResult, logDrafts, notes };
}
