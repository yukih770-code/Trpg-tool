/**
 * DND item gameplay profiles (v1, types only).
 *
 * AI-LANDMARK: DND_ITEM_GAMEPLAY_TYPES_V1
 *
 * Gameplay-facing profiles that an `DndItemDefinition` can carry so an item can
 * DECLARE what actions it will generate and what passive effects it grants —
 * without implementing any of it. No attack/damage/AC/resource logic lives here.
 *
 * Future: ItemDefinition.actionRefs / weaponProfile.generatedActionRefs will be
 * consumed by the future Action Generator / Resolver. This module only declares
 * the shape; nothing reads it yet.
 *
 * Source grounding (prior owner-source audit, 装备/词条): weapon property keys
 * mirror the 2024 list. No numeric values are invented here — unconfirmed data
 * is left optional with `sourceStatus: 'pending-source'` / `note`.
 */

import type { DndAbilityKey, DndDiceFormula } from './rollTypes';
import type { DndDamageType } from './effectTypes';
import type { DndActionDefinition } from './actionTypes';

export type DndWeaponPropertyKey =
  | 'ammunition'
  | 'finesse'
  | 'heavy'
  | 'light'
  | 'loading'
  | 'range'
  | 'reach'
  | 'thrown'
  | 'twoHanded'
  | 'versatile'
  | 'improvised'
  | 'custom';

export interface DndWeaponRangeProfile {
  normal?: number;
  long?: number;
  unit?: 'ft' | 'm' | 'square';
  note?: string;
}

export interface DndWeaponDamageProfile {
  dice?: DndDiceFormula[];
  damageType?: DndDamageType;
  /** Damage when wielded two-handed (Versatile property). */
  versatileDice?: DndDiceFormula[];
  note?: string;
}

export interface DndWeaponProfile {
  properties?: DndWeaponPropertyKey[];
  damage?: DndWeaponDamageProfile;
  range?: DndWeaponRangeProfile;
  reach?: number;
  /** Abilities eligible for attack/damage (e.g. Finesse → [str, dex]). */
  abilityOptions?: DndAbilityKey[];
  /** Ids of the actions this weapon will generate (melee / thrown / ranged). */
  generatedActionRefs?: string[];
  /** Reference to a weapon-mastery definition (pending-source). */
  masteryRef?: string;
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
  note?: string;
}

export interface DndArmorProfile {
  baseAc?: number;
  addDexModifier?: boolean;
  maxDexModifier?: number;
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
  passiveEffectRefs?: string[];
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
  note?: string;
}

export interface DndConsumableProfile {
  /** Action used to consume the item (e.g. a Utilize-style action). */
  consumeActionRef?: string;
  effectRefs?: string[];
  quantityConsumed?: number;
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
  note?: string;
}

export interface DndContainerProfile {
  capacity?: number;
  capacityUnit?: 'lb' | 'item' | 'slot' | 'custom';
  canContainCategories?: string[];
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
  note?: string;
}

/** Aggregate gameplay profile an item definition may expose. */
export interface DndItemGameplayProfile {
  actionRefs?: string[];
  passiveEffectRefs?: string[];
  /**
   * Reserved for fully-materialized generated actions. Left optional so items
   * are not forced to inline action data; the Action Generator may populate it
   * later. Prefer `actionRefs` for now.
   */
  generatedActions?: DndActionDefinition[];
  weaponProfile?: DndWeaponProfile;
  armorProfile?: DndArmorProfile;
  consumableProfile?: DndConsumableProfile;
  containerProfile?: DndContainerProfile;
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
  note?: string;
}
