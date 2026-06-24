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

import type { EquipmentSlot } from '../platform/characterInventory';
import type {
  DndArmorProfile,
  DndConsumableProfile,
  DndContainerProfile,
  DndWeaponProfile,
} from './gameplay/itemGameplayTypes';

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

// ─────────────────────────────────────────────────────────────────────────────
// Long-term Item Definition layer (v1)
//
// AI-LANDMARK: DND_ITEM_DEFINITION_LAYER
//
// `DndItemDefinition` is the IDENTITY of an item (keyed by `id`, never by name).
// Owned copies (`CharacterInventoryItem`) reference it via `definitionId`. This
// layer is intentionally a superset of the legacy `DndEquipmentItem` catalog so
// existing data can be promoted without a rewrite. No rule values are invented:
// items whose stats are not yet sourced carry `sourceStatus: 'pending-source'`
// and omit numeric fields rather than guessing.
// ─────────────────────────────────────────────────────────────────────────────

export type DndItemSourceStatus = 'sourced' | 'pending-source' | 'platform';

/**
 * How an item occupies equipment slots. Drives the Loadout Equip Service: which
 * slots the item is eligible for, what it actually consumes when equipped, and a
 * preferred default. Definition-driven — equip legality is NEVER inferred from
 * the item name or category.
 */
export interface DndEquipProfile {
  /** Slots this item may be equipped into. */
  allowedSlots: EquipmentSlot[];
  /** Preferred slot for one-click / auto equip. */
  defaultSlot?: EquipmentSlot;
  /** Slots actually consumed when equipped (e.g. two-handed = mainHand + offHand). Defaults to the chosen target slot. */
  occupiedSlots?: EquipmentSlot[];
  slotUsage?: 'oneHand' | 'twoHands' | 'offHandOnly' | 'utility' | 'worn';
  /** Reserved for future dual-wield rules; unused in v1. */
  canDualWield?: boolean;
}

export type DndItemCategory =
  | 'weapon'
  | 'ammunition'
  | 'armor'
  | 'shield'
  | 'tool'
  | 'artisanTool'
  | 'gamingSet'
  | 'musicalInstrument'
  | 'spellcastingFocus'
  | 'adventuringGear'
  | 'pack'
  | 'container'
  | 'consumable'
  | 'foodAndDrink'
  | 'mount'
  | 'vehicle'
  | 'tackAndHarness'
  | 'tradeGood'
  | 'treasure'
  | 'currency'
  | 'clothing'
  | 'magicItem'
  | 'customItem';

export interface DndWeaponDefData {
  damage?: string;
  damageType?: string;
  properties?: string[];
  range?: string;
  weaponCategory?: 'simple' | 'martial';
  mastery?: string;
  ammunitionType?: string;
}

export interface DndArmorDefData {
  baseAc?: number;
  armorCategory?: 'light' | 'medium' | 'heavy';
  dexModifier?: boolean | 'max2';
  strengthRequirement?: number;
  stealthDisadvantage?: boolean;
}

export interface DndShieldDefData {
  acBonus?: number;
}

export interface DndToolDefData {
  toolCategory?: string;
  proficiencyType?: string;
  associatedAbility?: string;
}

export interface DndPackDefData {
  contents?: Array<{ definitionId: string; quantity: number }>;
  isContainer?: boolean;
}

export interface DndContainerDefData {
  capacityWeight?: number;
  containerType?: string;
}

export interface DndConsumableDefData {
  uses?: number;
  consumedOnUse?: boolean;
  effectText?: string;
}

export interface DndItemDefinition {
  /** Stable identity. Never rename once published, e.g. `weapon.rapier`. */
  id: string;
  system: 'dnd5e-2024';
  /** Data-provenance tag (e.g. `dnd2024-basic`). */
  source?: string;
  sourceRef?: string;
  sourceStatus: DndItemSourceStatus;

  nameCn: string;
  nameEn?: string;
  aliases?: string[];

  category: DndItemCategory;
  subCategory?: string;
  tags?: string[];

  rarity?: string;
  stackable?: boolean;
  quantityUnit?: string;
  /** Pounds. Omitted when not sourced. */
  weight?: number;
  /** Display cost string, e.g. `15 GP`. Omitted when not sourced. */
  value?: string;

  /** Which slots this item is ELIGIBLE for. Auto-equip reads this, never the name. */
  equipSlots?: EquipmentSlot[];
  /** Full equip rules (slot occupancy, default, two-hand). Preferred over `equipSlots`. */
  equipProfile?: DndEquipProfile;

  description?: string;
  rulesText?: string;
  notes?: string;
  /** True when the category/item is a platform extension, not an official catalog category. */
  platformExtension?: boolean;

  // Category-specific data bags (populate only the relevant one).
  weapon?: DndWeaponDefData;
  armor?: DndArmorDefData;
  shield?: DndShieldDefData;
  tool?: DndToolDefData;
  pack?: DndPackDefData;
  container?: DndContainerDefData;
  consumable?: DndConsumableDefData;

  // ── v2 gameplay-facing layer (additive; consumed by a FUTURE Action Generator
  // / Resolver — nothing reads these yet). Declares which actions an item will
  // generate and which passive effects it grants. The legacy data bags above are
  // intentionally kept for back-compat; migration is a later task. ──
  /** Ids of actions this item grants when equipped/used (see gameplay/actionTypes). */
  actionRefs?: string[];
  /** Ids of passive effects active while equipped (see gameplay/effectTypes). */
  passiveEffectRefs?: string[];
  weaponProfile?: DndWeaponProfile;
  armorProfile?: DndArmorProfile;
  consumableProfile?: DndConsumableProfile;
  containerProfile?: DndContainerProfile;
}
