/**
 * DND gameplay effect contracts (v1, types only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_EFFECT_TYPES_V1
 *
 * An EffectDefinition is WHAT happens (damage / heal / apply-condition / modify /
 * resource / move / light / …) — referenced by actions, never embedded with roll
 * logic. Damage and healing reuse `DndDiceFormula` so weapon and spell paths
 * share one damage shape. Concentration is expressed here only as a DURATION
 * KIND; the active concentration itself is Runtime State (single, tracked
 * elsewhere), not an effect. Source grounding: 法术/持续时间 (concentration /
 * instantaneous / time span) — confirmed.
 */

import type { DndAbilityKey, DndDiceFormula } from './rollTypes';

export type DndEffectType =
  | 'damage'
  | 'heal'
  | 'applyCondition'
  | 'removeCondition'
  | 'modifyAc'
  | 'modifyRoll'
  | 'grantAdvantage'
  | 'consumeResource'
  | 'restoreResource'
  | 'move'
  | 'light'
  | 'summon'
  | 'custom';

export type DndDamageType =
  | 'acid'
  | 'bludgeoning'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'piercing'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'slashing'
  | 'thunder'
  | 'custom';

export type DndDurationKind =
  | 'instantaneous'
  | 'timeSpan'
  | 'concentration'
  | 'untilEndOfTurn'
  | 'untilStartOfTurn'
  | 'permanent'
  | 'custom';

export interface DndDurationProfile {
  kind: DndDurationKind;
  rounds?: number;
  minutes?: number;
  hours?: number;
  note?: string;
}

export interface DndDamagePayload {
  dice?: DndDiceFormula[];
  flat?: number;
  damageType: DndDamageType;
  abilityModifier?: DndAbilityKey;
}

export interface DndHealPayload {
  dice?: DndDiceFormula[];
  flat?: number;
  abilityModifier?: DndAbilityKey;
}

export interface DndApplyConditionPayload {
  conditionId: string;
  duration?: DndDurationProfile;
  saveEnds?: boolean;
}

export interface DndEffectDefinition {
  id: string;
  name: string;
  type: DndEffectType;
  payload:
    | DndDamagePayload
    | DndHealPayload
    | DndApplyConditionPayload
    | Record<string, unknown>;
  duration?: DndDurationProfile;
  stacking?: 'replace' | 'stack' | 'ignoreDuplicate' | 'custom';
  sourceRef?: string;
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
  note?: string;
}
