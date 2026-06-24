/**
 * DND 2024 Item Definitions (v1).
 *
 * AI-LANDMARK: DND_ITEM_DEFINITIONS
 *
 * Promotes the read-only `DND_EQUIPMENT_CATALOG` sample rows into the long-term
 * `DndItemDefinition` shape and adds a small set of pending-source stubs for
 * items that the class starter strings reference but that are not yet in the
 * sourced catalog (Rapier, Diplomat's / Entertainer's Pack, Musical Instrument).
 *
 * No official numeric values are invented here: stubs carry
 * `sourceStatus: 'pending-source'` and omit damage / weight / value / contents.
 * Only structural facts that do not require a source (a rapier is a weapon that
 * can be held in a hand; a pack is a container) are encoded.
 */

import { DND_EQUIPMENT_CATALOG } from '../../data/dnd2024/equipment';
import type {
  DndEquipmentItem,
  DndItemCategory,
  DndItemDefinition,
} from './equipment-types';
import type { EquipmentSlot } from '../platform/characterInventory';

function isPackName(name: string | undefined, id: string): boolean {
  if (id.includes('pack')) return true;
  if (!name) return false;
  return /套件|背包|包$|pack/i.test(name);
}

function mapWeaponCategory(raw: string | undefined): 'simple' | 'martial' | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('simple')) return 'simple';
  if (raw.startsWith('martial')) return 'martial';
  return undefined;
}

function mapDexModifier(raw: string | undefined): boolean | 'max2' | undefined {
  if (raw === 'full') return true;
  if (raw === 'none') return false;
  if (raw === 'max2') return 'max2';
  return undefined;
}

/** Convert one legacy catalog row into a sourced DndItemDefinition. */
function fromCatalog(row: DndEquipmentItem): DndItemDefinition {
  const anyRow = row as DndEquipmentItem & Record<string, unknown>;
  const id = row.id;
  const nameCn = row.nameCn ?? row.name;
  const base: DndItemDefinition = {
    id,
    system: 'dnd5e-2024',
    source: row.source,
    sourceStatus: 'sourced',
    nameCn,
    nameEn: row.name,
    category: 'adventuringGear',
    weight: row.weight,
    value: row.cost,
    description: row.description,
  };

  if (row.category === 'weapon') {
    base.category = 'weapon';
    base.equipSlots = ['mainHand', 'offHand'];
    const props = Array.isArray(anyRow.properties) ? (anyRow.properties as string[]) : [];
    const twoHanded = props.some((p) => /two-?hand/i.test(p));
    base.equipProfile = twoHanded
      ? { allowedSlots: ['mainHand'], defaultSlot: 'mainHand', occupiedSlots: ['mainHand', 'offHand'], slotUsage: 'twoHands' }
      : { allowedSlots: ['mainHand', 'offHand'], defaultSlot: 'mainHand', slotUsage: 'oneHand' };
    base.weapon = {
      damage: typeof anyRow.damageDice === 'string' ? anyRow.damageDice : undefined,
      damageType: typeof anyRow.damageType === 'string' ? anyRow.damageType : undefined,
      properties: props.length > 0 ? props : undefined,
      range: typeof anyRow.range === 'string' ? anyRow.range : undefined,
      weaponCategory: mapWeaponCategory(anyRow.weaponCategory as string | undefined),
    };
    base.tags = props.length > 0 ? props : undefined;
    return base;
  }

  if (row.category === 'armor') {
    base.category = 'armor';
    base.equipSlots = ['armor'];
    base.equipProfile = { allowedSlots: ['armor'], defaultSlot: 'armor', slotUsage: 'worn' };
    base.armor = {
      baseAc: typeof anyRow.baseAc === 'number' ? anyRow.baseAc : undefined,
      armorCategory: anyRow.armorCategory as 'light' | 'medium' | 'heavy' | undefined,
      dexModifier: mapDexModifier(anyRow.dexModifier as string | undefined),
      strengthRequirement: typeof anyRow.strengthRequirement === 'number' ? anyRow.strengthRequirement : undefined,
      stealthDisadvantage: anyRow.stealthDisadvantage === true || undefined,
    };
    return base;
  }

  if (row.category === 'shield') {
    base.category = 'shield';
    base.equipSlots = ['offHand'];
    base.equipProfile = { allowedSlots: ['offHand'], defaultSlot: 'offHand', occupiedSlots: ['offHand'], slotUsage: 'offHandOnly' };
    base.shield = { acBonus: typeof anyRow.baseAc === 'number' ? anyRow.baseAc : undefined };
    return base;
  }

  if (row.category === 'tool') {
    base.category = 'tool';
    return base;
  }

  // adventuringGear: split packs (containers) from loose gear / light sources.
  if (isPackName(nameCn, id)) {
    base.category = 'pack';
    base.pack = { isContainer: true };
    base.platformExtension = false;
    return base;
  }
  base.category = 'adventuringGear';
  if (/torch|火把|lantern|灯/i.test(nameCn)) {
    // A light source can be held in the off hand OR clipped to a utility slot.
    // It occupies only the chosen slot (no two-hand), and being in offHand does
    // NOT grant any off-hand ATTACK eligibility — that is a later combat-rules
    // concern, separate from physical slot occupancy.
    base.equipSlots = ['utility', 'offHand'];
    base.equipProfile = { allowedSlots: ['utility', 'offHand'], defaultSlot: 'utility', slotUsage: 'utility' };
  }
  return base;
}

const SOURCED: DndItemDefinition[] = (DND_EQUIPMENT_CATALOG as DndEquipmentItem[]).map(fromCatalog);

// ── Dagger source-backed gameplay bridge (data only) ────────────────────────
// `weapon.dagger` is generated from the catalog above; here we project its
// already-sourced data onto the v2 gameplay-facing fields so it can later
// generate a melee + thrown attack referencing a shared piercing-damage effect.
// Nothing reads these yet (no resolver). Only the dagger is touched; no rule
// values are invented (all from the owner-source weapon table).
const DAGGER_GAMEPLAY: Pick<DndItemDefinition, 'actionRefs' | 'weaponProfile'> = {
  actionRefs: [
    'action.item.dagger.melee-weapon-attack',
    'action.item.dagger.thrown-weapon-attack',
  ],
  weaponProfile: {
    properties: ['finesse', 'light', 'thrown'],
    damage: {
      dice: [{ count: 1, faces: 4 }],
      damageType: 'piercing',
    },
    range: { normal: 20, long: 60, unit: 'ft' },
    abilityOptions: ['str', 'dex'],
    generatedActionRefs: [
      'action.item.dagger.melee-weapon-attack',
      'action.item.dagger.thrown-weapon-attack',
    ],
    masteryRef: 'mastery.nick',
    sourceStatus: 'sourced',
    note: 'Dagger source-backed data bridge. Nick mastery mechanics are deferred to a future resolver.',
  },
};

const SOURCED_WITH_GAMEPLAY: DndItemDefinition[] = SOURCED.map((def) =>
  def.id === 'weapon.dagger' ? { ...def, ...DAGGER_GAMEPLAY } : def,
);

/**
 * Pending-source stubs for starter items missing from the sourced catalog.
 * Structural facts only — NO fabricated damage / weight / value / contents.
 */
const PENDING_STUBS: DndItemDefinition[] = [
  {
    id: 'weapon.rapier',
    system: 'dnd5e-2024',
    sourceStatus: 'pending-source',
    nameCn: '细剑',
    nameEn: 'Rapier',
    aliases: ['Rapier', '刺剑'],
    category: 'weapon',
    equipSlots: ['mainHand', 'offHand'],
    equipProfile: { allowedSlots: ['mainHand', 'offHand'], defaultSlot: 'mainHand', slotUsage: 'oneHand' },
    notes: '数值 / 来源待核对（damage / weight / value 需读取 owner source）。',
  },
  {
    id: 'pack.diplomats-pack',
    system: 'dnd5e-2024',
    sourceStatus: 'pending-source',
    nameCn: '外交官套件',
    nameEn: "Diplomat's Pack",
    aliases: ["Diplomat's Pack", 'Diplomat Pack', '外交官包'],
    category: 'pack',
    pack: { isContainer: true },
    notes: '内容物 / 重量 / 价值待核对（contents 需读取 owner source）。',
  },
  {
    id: 'pack.entertainers-pack',
    system: 'dnd5e-2024',
    sourceStatus: 'pending-source',
    nameCn: '艺人套件',
    nameEn: "Entertainer's Pack",
    aliases: ["Entertainer's Pack", 'Entertainer Pack', '艺人包', '表演者套件'],
    category: 'pack',
    pack: { isContainer: true },
    notes: '内容物 / 重量 / 价值待核对（contents 需读取 owner source）。',
  },
  {
    id: 'tool.musical-instrument',
    system: 'dnd5e-2024',
    sourceStatus: 'pending-source',
    nameCn: '乐器',
    nameEn: 'Musical Instrument',
    aliases: ['Musical Instrument', 'Instrument', '乐器(任意)'],
    category: 'musicalInstrument',
    subCategory: 'musicalInstrument',
    equipSlots: ['instrument'],
    equipProfile: { allowedSlots: ['instrument'], defaultSlot: 'instrument', slotUsage: 'utility' },
    tool: { toolCategory: 'musicalInstrument', proficiencyType: 'tool' },
    notes: '具体乐器 / 数值 / 来源待核对。',
  },
];

export const DND_ITEM_DEFINITIONS: DndItemDefinition[] = [...SOURCED_WITH_GAMEPLAY, ...PENDING_STUBS];

/** Map a definition category onto the inventory view-model category. */
export function inventoryCategoryForDefinition(category: DndItemCategory): string {
  switch (category) {
    case 'weapon': return 'weapon';
    case 'armor': return 'armor';
    case 'shield': return 'shield';
    case 'tool':
    case 'artisanTool':
    case 'gamingSet':
    case 'musicalInstrument':
    case 'spellcastingFocus': return 'tool';
    case 'pack':
    case 'container': return 'container';
    case 'consumable':
    case 'foodAndDrink': return 'consumable';
    case 'currency': return 'currency';
    case 'clothing': return 'fashion';
    case 'adventuringGear':
    case 'ammunition':
    case 'tackAndHarness': return 'gear';
    default: return 'misc';
  }
}

/** First eligible slot for a definition (auto-equip default). Prefers the equip profile. */
export function primaryEquipSlot(def: DndItemDefinition): EquipmentSlot | undefined {
  if (def.equipProfile?.defaultSlot) return def.equipProfile.defaultSlot;
  if (def.equipProfile?.allowedSlots && def.equipProfile.allowedSlots.length > 0) return def.equipProfile.allowedSlots[0];
  return def.equipSlots && def.equipSlots.length > 0 ? def.equipSlots[0] : undefined;
}
