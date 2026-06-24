/**
 * DND weapon attack resolver (v0) — pure function, dagger melee only.
 *
 * AI-LANDMARK: DND_WEAPON_ATTACK_RESOLVER_V0
 *
 * This resolver is a v0 PURE function.
 *   - It does NOT roll dice (d20 and damage totals are supplied by the caller).
 *   - It does NOT mutate RuntimeState (it returns RuntimeChange[] only).
 *   - It does NOT write RuntimeLog.
 *   - It does NOT spend resources.
 *   - It does NOT implement advantage/disadvantage, critical hits, resistance,
 *     vulnerability, temp-HP settlement, death saves, range/range-disadvantage,
 *     thrown attacks, Nick/Light, off-hand attacks, or reactions.
 * Stores will APPLY the returned RuntimeChange in a future task; Logs will be
 * appended in a future task.
 */

import type { DndRollResult } from './rollTypes';
import type { DndRuntimeActorState } from './runtimeStateTypes';
import type { DndHpChange, DndRuntimeChange } from './runtimeChangeTypes';

/** The only action this v0 resolver accepts. */
export const DAGGER_MELEE_ACTION_ID = 'action.item.dagger.melee-weapon-attack';
const DAGGER_DAMAGE_EFFECT_ID = 'effect.item.dagger.piercing-damage';

export interface DndWeaponAttackResolverInput {
  actionId: string;
  actor: DndRuntimeActorState;
  target: DndRuntimeActorState;

  /** The raw d20 face the caller rolled (1–20). Not rolled here. */
  d20: number;
  abilityModifier: number;
  proficiencyBonus?: number;
  otherAttackBonus?: number;

  /** The summed damage dice total the caller rolled (e.g. a 1d4 face). Not rolled here. */
  damageRollTotal: number;
  otherDamageBonus?: number;
}

export interface DndWeaponAttackResolverResult {
  actionId: string;
  actorId: string;
  targetId: string;

  hit: boolean;
  targetAc?: number;

  attackRoll: DndRollResult;
  damageRoll?: DndRollResult;
  runtimeChanges: DndRuntimeChange[];

  notes?: string[];
}

/**
 * Resolve a single dagger MELEE weapon attack.
 *
 * Precondition handling (explicit choice): this function THROWS on contract
 * violations rather than returning a misleading miss —
 *   1. `actionId !== DAGGER_MELEE_ACTION_ID`,
 *   2. target AC missing / not `mode:'manual'` / `value` not a number.
 * The caller is expected to pass a valid v0 melee request.
 */
export function resolveDaggerMeleeWeaponAttackV0(
  input: DndWeaponAttackResolverInput,
): DndWeaponAttackResolverResult {
  const {
    actionId,
    actor,
    target,
    d20,
    abilityModifier,
    proficiencyBonus = 0,
    otherAttackBonus = 0,
    damageRollTotal,
    otherDamageBonus = 0,
  } = input;

  if (actionId !== DAGGER_MELEE_ACTION_ID) {
    throw new Error(
      `[weaponAttackResolver v0] unsupported actionId "${actionId}". Only "${DAGGER_MELEE_ACTION_ID}" is supported.`,
    );
  }

  const ac = target.ac;
  if (!ac || ac.mode !== 'manual' || typeof ac.value !== 'number') {
    throw new Error(
      '[weaponAttackResolver v0] target.ac must be present with mode "manual" and a numeric value.',
    );
  }
  const targetAc = ac.value;

  const attackTotal = d20 + abilityModifier + proficiencyBonus + otherAttackBonus;
  const hit = attackTotal >= targetAc;

  const attackRoll: DndRollResult = {
    request: {
      actorId: actor.actorId,
      actionId,
      mode: 'attack',
      profile: { mode: 'attack', targetDefense: 'ac' },
      targetId: target.actorId,
      manualDc: targetAc,
    },
    d20,
    total: attackTotal,
    success: hit,
    critical: 'none',
    breakdown: [
      `d20 ${d20}`,
      `ability ${abilityModifier >= 0 ? '+' : ''}${abilityModifier}`,
      `proficiency +${proficiencyBonus}`,
      `other +${otherAttackBonus}`,
      `= ${attackTotal} vs AC ${targetAc} → ${hit ? 'hit' : 'miss'}`,
    ],
  };

  if (!hit) {
    return {
      actionId,
      actorId: actor.actorId,
      targetId: target.actorId,
      hit: false,
      targetAc,
      attackRoll,
      runtimeChanges: [],
      notes: ['Miss — no damage applied. RuntimeState is not mutated by this resolver.'],
    };
  }

  const damageTotal = damageRollTotal + abilityModifier + otherDamageBonus;

  const damageRoll: DndRollResult = {
    request: {
      actorId: actor.actorId,
      actionId,
      mode: 'damage',
      profile: { mode: 'damage' },
      targetId: target.actorId,
    },
    total: damageTotal,
    breakdown: [
      `damage dice ${damageRollTotal}`,
      `ability ${abilityModifier >= 0 ? '+' : ''}${abilityModifier}`,
      `other +${otherDamageBonus}`,
      `= ${damageTotal} piercing`,
    ],
  };

  const hpChangePayload: DndHpChange = {
    actorId: target.actorId,
    delta: -damageTotal,
    damageType: 'piercing',
    sourceActionId: actionId,
    sourceEffectId: DAGGER_DAMAGE_EFFECT_ID,
  };

  const hpChange: DndRuntimeChange = {
    // Deterministic id (no Date.now) to keep this function pure; the store/log
    // layer may stamp `timestamp` when it applies the change.
    id: `runtime-change.dagger.${actor.actorId}.${target.actorId}.${actionId}`,
    type: 'hpChange',
    actorId: target.actorId,
    payload: hpChangePayload,
    sourceActionId: actionId,
    sourceEffectId: DAGGER_DAMAGE_EFFECT_ID,
  };

  return {
    actionId,
    actorId: actor.actorId,
    targetId: target.actorId,
    hit: true,
    targetAc,
    attackRoll,
    damageRoll,
    runtimeChanges: [hpChange],
    notes: ['Hit — emitted an hpChange RuntimeChange. RuntimeState is NOT mutated here.'],
  };
}
