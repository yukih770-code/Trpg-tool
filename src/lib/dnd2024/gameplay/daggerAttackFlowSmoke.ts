/**
 * DND dagger attack flow — pure smoke scenario (v0).
 *
 * AI-LANDMARK: DND_DAGGER_ATTACK_FLOW_SMOKE_V0
 *
 * This file is a pure smoke scenario for the dagger attack flow.
 * It does not run tests, access stores, write logs, or mutate state.
 * It exists to make the resolver -> applier -> log draft chain easy to inspect.
 * Future test tasks may convert this fixture into real unit tests.
 *
 * Note: the encounter fixture is exposed via a factory so importing this module
 * has NO side effects (the flow only runs when a function is called).
 */

import type { DndRuntimeEncounterState } from './runtimeStateTypes';
import { runDaggerMeleeAttackFlowV0, type DndDaggerAttackFlowResult } from './daggerAttackFlow';

/** Fresh, immutable-by-convention encounter fixture for the smoke scenario. */
export function makeDaggerAttackFlowSmokeEncounter(): DndRuntimeEncounterState {
  return {
    encounterId: 'encounter.smoke.dagger',
    sessionId: 'session.smoke',
    actors: {
      'actor.attacker': {
        actorId: 'actor.attacker',
        displayName: '测试游荡者',
        kind: 'playerCharacter',
        hp: { current: 12 },
        ac: { mode: 'manual', value: 14 },
      },
      'actor.target': {
        actorId: 'actor.target',
        displayName: '测试靶子',
        kind: 'monster',
        hp: { current: 10 },
        ac: { mode: 'manual', value: 12 },
      },
    },
  };
}

/** Run the fixed dagger melee attack scenario (no side effects). */
export function createDaggerAttackFlowSmokeResult(): DndDaggerAttackFlowResult {
  return runDaggerMeleeAttackFlowV0({
    encounter: makeDaggerAttackFlowSmokeEncounter(),
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
}

export interface DaggerAttackFlowSmokeSummary {
  hit: boolean;
  attackTotal: number;
  damageTotal: number;
  targetHpAfter?: number;
  appliedCount: number;
  skippedCount: number;
  logDraftCount: number;
}

/**
 * Inspectable summary of the smoke scenario. Expected:
 * { hit: true, attackTotal: 18, damageTotal: 5, targetHpAfter: 5,
 *   appliedCount: 1, skippedCount: 0, logDraftCount: 2 }
 * (No assertions / no throws — just a value to inspect.)
 */
export function summarizeDaggerAttackFlowSmoke(): DaggerAttackFlowSmokeSummary {
  const result = createDaggerAttackFlowSmokeResult();
  const target = result.applyResult.encounter.actors['actor.target'];

  return {
    hit: result.resolverResult.hit,
    attackTotal: result.resolverResult.attackRoll.total,
    damageTotal: result.resolverResult.damageRoll?.total ?? 0,
    targetHpAfter: target?.hp.current,
    appliedCount: result.applyResult.appliedChangeIds.length,
    skippedCount: result.applyResult.skippedChangeIds.length,
    logDraftCount: result.logDrafts.entries.length,
  };
}
