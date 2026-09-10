import type { Combatant } from '../../src/lib/combat/combatRuntimeTypes.js';

const PUBLIC_KEYS = ['mode', 'attackRawRolls', 'attackKeptRoll', 'attackBonus', 'attackTotal',
  'outcome', 'critical', 'natural1', 'damageFormula', 'damageRawRolls', 'damageModifier', 'damageTotal', 'damageType'] as const;
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function pick(source: Record<string, unknown>, keys: readonly string[]) {
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}

/** The target's existing projected displays decide disclosure, including publicShared.
 * Unknown future tiers fail closed. This function does not assign visibility. */
export function projectAttackResolvedFacts(payload: Record<string, unknown>, target?: Pick<Combatant, 'hpDisplay' | 'acDisplay'>): Record<string, unknown> {
  const privileged = record(payload.privileged);
  const mutation = Array.isArray(payload.mutations)
    ? payload.mutations.map(record).find((m) => m.type === 'combatantHp' && m.combatantId === payload.targetCombatantId) ?? {} : {};
  const targetFacts: Record<string, unknown> = {};
  if (target?.acDisplay?.kind === 'exact') Object.assign(targetFacts, pick(privileged, ['targetAc']));
  if (target?.hpDisplay?.kind === 'exact') {
    if (typeof target.hpDisplay.current === 'number') {
      Object.assign(targetFacts, pick(mutation, ['beforeHp', 'afterHp']));
    }
    // HEAD's hpFor emits this property even when zero temp HP is represented
    // by undefined. An exact display that omits the property grants no temp
    // disclosure. Keep this check on the server's projection, before JSON.
    if (Object.prototype.hasOwnProperty.call(target.hpDisplay, 'temporary')) {
      Object.assign(targetFacts, pick(mutation, ['beforeTemporaryHp', 'afterTemporaryHp']));
      Object.assign(targetFacts, pick(privileged, ['absorbedByTemporaryHp']));
      if (typeof target.hpDisplay.current === 'number') Object.assign(targetFacts, pick(privileged, ['amount']));
    }
  }
  return {
    ...pick(payload, ['schemaVersion', 'systemId', 'resolutionId', 'intentId', 'actorCombatantId', 'targetCombatantId']),
    resolution: pick(record(payload.resolution), PUBLIC_KEYS),
    ...(Object.keys(targetFacts).length ? { privileged: targetFacts } : {}),
  };
}
