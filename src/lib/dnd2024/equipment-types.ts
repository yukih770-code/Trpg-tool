/**
 * DND 2024 Structured Equipment Types (v1, read-only data layer)
 *
 * AI-LANDMARK: DND_EQUIPMENT_DATA_LAYER
 *
 * Scope of this layer
 * ───────────────────
 * • Pure TypeScript types for structured weapon / armor / gear data.
 * • No store integration, no CharacterData schema change, no migration.
 * • No inventory, equip/unequip, AC recalculation, attack/damage,
 *   weapon mastery, ammo, magic items, attunement, or Action Registry
 *   integration — those belong to later DND phases.
 *
 * Future layers (Action Registry v1, damage pipeline, structured
 * inventory) should extend these types instead of inventing parallel
 * equipment shapes.
 */

export type DndEquipmentCategory =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'adventuringGear'
  | 'tool';

export type DndWeaponCategory =
  | 'simpleMelee'
  | 'simpleRanged'
  | 'martialMelee'
  | 'martialRanged';

export type DndArmorCategory =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'shield';

/** How an armor piece interacts with the Dex modifier when computing AC. */
export type DndArmorDexModifier = 'none' | 'max2' | 'full';

/** Shared fields for every catalog entry. */
export interface DndEquipmentItemBase {
  /** Stable id, e.g. `weapon.longsword`. Never rename once published. */
  id: string;
  name: string;
  nameCn?: string;
  category: DndEquipmentCategory;
  /** Data provenance tag, e.g. `dnd2024-basic` for the built-in sample set. */
  source: 'dnd2024-basic' | string;
  /** Weight in pounds. */
  weight?: number;
  /** Display cost string, e.g. `15 GP`. */
  cost?: string;
  /** Short original summary only — no rulebook full text. */
  description?: string;
}

export interface DndWeaponItem extends DndEquipmentItemBase {
  category: 'weapon';
  weaponCategory: DndWeaponCategory;
  /** e.g. `1d8`; versatile alternates belong in `properties`. */
  damageDice?: string;
  /** e.g. `slashing` / `piercing` / `bludgeoning`. */
  damageType?: string;
  /** Property labels, e.g. `Finesse`, `Versatile (1d10)`. Display-only in v1. */
  properties: string[];
  /** e.g. `20/60 ft`. */
  range?: string;
}

export interface DndArmorItem extends DndEquipmentItemBase {
  category: 'armor' | 'shield';
  armorCategory: DndArmorCategory;
  /** Base AC for armor; AC bonus for shields. Display-only in v1. */
  baseAc?: number;
  dexModifier?: DndArmorDexModifier;
  strengthRequirement?: number;
  stealthDisadvantage?: boolean;
}

export interface DndGearItem extends DndEquipmentItemBase {
  category: 'adventuringGear' | 'tool';
}

export type DndEquipmentItem = DndWeaponItem | DndArmorItem | DndGearItem;
