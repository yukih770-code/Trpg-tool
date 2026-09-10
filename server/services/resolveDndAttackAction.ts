import { rollDndAttack, rollDndDamage, parseDndDiceFormula } from '../../src/lib/dnd/dndDiceRoller.js';
import { applyDamage } from '../../src/lib/combat/combatComfort.js';
import type { Combatant } from '../../src/lib/combat/combatRuntimeTypes.js';
import type { DndAttackIntent } from '../../src/lib/dnd/dndAttackIntent.js';
import type { SystemResolutionProposal } from '../../src/lib/platform/systemResolutionTypes.js';

export type AuthoredDndAttack = {
  id: string; name: string; kind: 'weapon_attack' | 'spell_attack';
  attackBonus: number; damageFormula?: string; damageType?: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Read only authored Lite Sheet actions; malformed rules never become defaults. */
export function readAuthoredDndAttack(payload: Record<string, unknown>, actionId: string): AuthoredDndAttack {
  const sheet = record(payload.dndLiteActorSheetV1);
  const matches = sheet.schemaVersion === 1 && Array.isArray(sheet.actions)
    ? sheet.actions.map(record).filter((action) => action.id === actionId) : [];
  if (matches.length !== 1) throw new Error('unknown_action');
  const action = matches[0];
  if (action.kind !== 'weapon_attack' && action.kind !== 'spell_attack') throw new Error('unsupported_action');
  if (typeof action.attackBonus !== 'number' || !Number.isSafeInteger(action.attackBonus)
    || action.attackBonus < -100 || action.attackBonus > 100) throw new Error('invalid_attack_bonus');
  if (action.damageFormula !== undefined && action.damageFormula !== '') {
    if (typeof action.damageFormula !== 'string') throw new Error('invalid_damage_formula');
    parseDndDiceFormula(action.damageFormula);
  }
  return {
    id: actionId, name: typeof action.name === 'string' ? action.name : actionId,
    kind: action.kind, attackBonus: action.attackBonus,
    damageFormula: typeof action.damageFormula === 'string' && action.damageFormula ? action.damageFormula : undefined,
    damageType: typeof action.damageType === 'string' ? action.damageType.slice(0, 48) : undefined,
  };
}

export type DndAttackPublicSummaryInput = {
  attackTotal: number; outcome: 'hit' | 'miss'; critical: boolean; natural1: boolean;
  damageTotal?: number;
};

/** No names, free-form authored text, AC or target vitals can enter this text. */
export function buildDndAttackPublicSummary(facts: DndAttackPublicSummaryInput): string {
  const outcome = facts.critical ? 'critical hit' : facts.natural1 ? 'miss (natural 1)' : facts.outcome;
  return `Attack: ${facts.attackTotal}, ${outcome}.${facts.damageTotal === undefined ? '' : ` ${facts.damageTotal} damage rolled.`}`;
}

/** Pure except for the required injected RNG. No write or storage capabilities. */
export function resolveDndAttackAction(input: {
  target: Combatant; actionPayload: Record<string, unknown>; intent: DndAttackIntent;
  resolutionId: string; random: () => number;
}): SystemResolutionProposal {
  const action = readAuthoredDndAttack(input.actionPayload, input.intent.actionId);
  const { target } = input;
  if (!Number.isSafeInteger(target.armorClass) || !Number.isSafeInteger(target.hpCurrent)
    || (target.hpCurrent as number) < 0 || !Number.isSafeInteger(target.temporaryHp ?? 0)
    || (target.temporaryHp ?? 0) < 0) throw new Error('invalid_target_defenses');
  const attack = rollDndAttack({ attackBonus: action.attackBonus, targetAc: target.armorClass, mode: input.intent.mode }, input.random);
  const damage = attack.outcome === 'hit' && action.damageFormula
    ? rollDndDamage(action.damageFormula, { critical: attack.isCritical, random: input.random }) : undefined;
  const change = applyDamage(target, damage?.total ?? 0);
  const mutation = {
    type: 'combatantHp' as const, combatantId: target.id,
    beforeHp: target.hpCurrent as number, afterHp: change.afterHp as number,
    beforeTemporaryHp: target.temporaryHp ?? 0, afterTemporaryHp: change.afterTemporaryHp ?? 0,
  };
  const publicFacts = {
    mode: attack.mode, attackRawRolls: attack.rawRolls, attackKeptRoll: attack.keptRoll,
    attackBonus: attack.attackBonus, attackTotal: attack.total,
    outcome: attack.outcome as 'hit' | 'miss', critical: attack.isCritical, natural1: attack.isNatural1,
    ...(damage ? { damageFormula: damage.formula, damageRawRolls: damage.dice.map((group) => group.rolls),
      damageModifier: damage.modifier, damageTotal: damage.total, damageType: action.damageType } : {}),
  };
  return {
    systemId: 'dnd5e-2024', resolutionId: input.resolutionId,
    publicSummaryText: buildDndAttackPublicSummary(publicFacts), publicFacts,
    privilegedFacts: { targetAc: target.armorClass, amount: mutation.beforeHp - mutation.afterHp,
      absorbedByTemporaryHp: change.absorbedByTemporaryHp ?? 0 },
    mutations: [mutation],
  };
}
