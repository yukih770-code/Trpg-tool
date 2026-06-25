/**
 * DND Runtime Combat Store — flush smoke scenario (v0).
 *
 * AI-LANDMARK: DND_RUNTIME_COMBAT_STORE_FLUSH_SMOKE_V0
 *
 * Manually-invoked runner exercising: startEncounter → runDaggerAttack →
 * flushPendingLogDrafts → local RuntimeLog append → drafts cleared.
 *
 * IMPORTANT: importing this module has NO side effects. Calling
 * `runRuntimeCombatStoreFlushSmokeV0()` DOES append events to the local
 * RuntimeLog store under the dedicated smoke campaign id below — it never
 * clears, deletes, or tombstones any logs and never touches a real campaign.
 */

import { useRuntimeCombatStore } from './runtimeCombatStore';
import { makeDaggerAttackFlowSmokeEncounter } from './daggerAttackFlowSmoke';
import { useRuntimeLogLocalStore } from '../../platform/runtimeLogLocalStore';

const SMOKE_CAMPAIGN_ID = 'campaign.smoke.dnd-runtime';
const SMOKE_SESSION_ID = 'session.smoke.dnd-runtime';

export interface DndRuntimeCombatStoreFlushSmokeSummary {
  pendingBeforeFlush: number;
  appendedCount: number;
  skippedCount: number;
  pendingAfterFlush: number;
  warningCount: number;
  targetHpAfter: number | undefined;
  localLogCountBefore?: number;
  localLogCountAfter?: number;
}

/** Pure expected-value constant (does NOT touch any store). */
export const RUNTIME_COMBAT_STORE_FLUSH_SMOKE_EXPECTED = {
  pendingBeforeFlush: 2,
  appendedCount: 2,
  skippedCount: 0,
  pendingAfterFlush: 0,
  warningCount: 0,
  targetHpAfter: 5,
} as const;

/**
 * Drive the combat store through an attack and a log flush, then read back
 * state. Only runs when called; appends to the local RuntimeLog under the smoke
 * campaign id. Lets errors propagate (smoke failures must be visible).
 */
export function runRuntimeCombatStoreFlushSmokeV0(): DndRuntimeCombatStoreFlushSmokeSummary {
  const store = useRuntimeCombatStore.getState();
  const logStore = useRuntimeLogLocalStore.getState();

  const localLogCountBefore = logStore.listRuntimeLogEvents(SMOKE_CAMPAIGN_ID).length;

  store.resetEncounter();
  store.startEncounter({ encounter: makeDaggerAttackFlowSmokeEncounter() });
  store.selectActor('actor.attacker');
  store.selectTarget('actor.target');

  store.runDaggerAttack({
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

  const pendingBeforeFlush = useRuntimeCombatStore.getState().pendingLogDrafts.length;

  const flushResult = store.flushPendingLogDrafts({
    campaignId: SMOKE_CAMPAIGN_ID,
    sessionId: SMOKE_SESSION_ID,
    actorId: 'actor.attacker',
    targetId: 'actor.target',
  });

  const stateAfter = useRuntimeCombatStore.getState();
  const target = stateAfter.encounter?.actors['actor.target'];
  const localLogCountAfter = useRuntimeLogLocalStore
    .getState()
    .listRuntimeLogEvents(SMOKE_CAMPAIGN_ID).length;

  return {
    pendingBeforeFlush,
    appendedCount: flushResult.appendedCount,
    skippedCount: flushResult.skippedCount,
    pendingAfterFlush: stateAfter.pendingLogDrafts.length,
    warningCount: flushResult.warnings.length,
    targetHpAfter: target?.hp.current,
    localLogCountBefore,
    localLogCountAfter,
  };
}
