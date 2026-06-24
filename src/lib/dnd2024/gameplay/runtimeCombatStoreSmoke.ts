/**
 * DND Runtime Combat Store — smoke scenario (v0).
 *
 * AI-LANDMARK: DND_RUNTIME_COMBAT_STORE_SMOKE_V0
 *
 * Manually-invoked smoke runner for the in-memory `useRuntimeCombatStore`.
 * Importing this module has NO side effects — the store is only touched when
 * `runRuntimeCombatStoreSmokeV0()` is explicitly called. It does not access
 * localStorage, append RuntimeLog, render UI, or write Character Library /
 * Campaign authoritative state. On failure it lets the error surface (no fake
 * success). Future test tasks may convert this into a real unit test.
 */

import { useRuntimeCombatStore } from './runtimeCombatStore';
import { makeDaggerAttackFlowSmokeEncounter } from './daggerAttackFlowSmoke';

export interface DndRuntimeCombatStoreSmokeSummary {
  hit: boolean;
  attackTotal: number;
  damageTotal: number;
  targetHpAfter: number | undefined;
  pendingLogDraftCount: number;
  warningCount: number;
  selectedActorId?: string;
  selectedTargetId?: string;
}

/** Pure expected-value constant (does NOT touch the store). */
export const RUNTIME_COMBAT_STORE_SMOKE_EXPECTED = {
  hit: true,
  attackTotal: 18,
  damageTotal: 5,
  targetHpAfter: 5,
  pendingLogDraftCount: 2,
  warningCount: 0,
  selectedActorId: 'actor.attacker',
  selectedTargetId: 'actor.target',
} as const;

/**
 * Drive the store through start → select → dagger attack, then read back state.
 * Only runs when called. Lets errors propagate (smoke failures must be visible).
 */
export function runRuntimeCombatStoreSmokeV0(): DndRuntimeCombatStoreSmokeSummary {
  const store = useRuntimeCombatStore.getState();

  store.resetEncounter();
  store.startEncounter({ encounter: makeDaggerAttackFlowSmokeEncounter() });
  store.selectActor('actor.attacker');
  store.selectTarget('actor.target');

  const result = store.runDaggerAttack({
    actorId: 'actor.attacker',
    targetId: 'actor.target',
    d20: 13,
    damageRollTotal: 2,
    abilityModifier: 3,
    proficiencyBonus: 2,
    actorName: '测试游荡者',
    targetName: '测试靶子',
    timestamp: 0,
  });

  // Re-read the live state after the action committed.
  const state = useRuntimeCombatStore.getState();
  const target = state.encounter?.actors['actor.target'];

  return {
    hit: result.flowResult.resolverResult.hit,
    attackTotal: result.flowResult.resolverResult.attackRoll.total,
    damageTotal: result.flowResult.resolverResult.damageRoll?.total ?? 0,
    targetHpAfter: target?.hp.current,
    pendingLogDraftCount: state.pendingLogDrafts.length,
    warningCount: state.warnings.length,
    selectedActorId: state.selection.selectedActorId,
    selectedTargetId: state.selection.selectedTargetId,
  };
}
