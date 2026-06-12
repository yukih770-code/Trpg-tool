/**
 * DND 2024 基础装备数据（v1，只读数据层）
 *
 * AI-LANDMARK: DND_EQUIPMENT_DATA_LAYER
 *
 * 只读规则数据。本文件不含任何运行时逻辑。
 * 本轮只提供小规模开发验证样例（6 武器 / 4 护甲与盾 / 4 装备工具），
 * 不搬运官方表全文，不写规则书长描述。
 *
 * 不做：inventory、装备/卸下、AC 自动计算、攻击/伤害、武器精通、
 * 弹药、魔法物品、attunement、Action Registry 接入。
 *
 * 数据来源标记：`dnd2024-basic`
 */

import type {
  DndArmorItem,
  DndEquipmentItem,
  DndGearItem,
  DndWeaponItem,
} from '../../lib/dnd2024/equipment-types';

// ─────────────────────────────────────────────────────────────────────────────
// 武器 Weapons
// ─────────────────────────────────────────────────────────────────────────────

export const DND_BASIC_WEAPONS: DndWeaponItem[] = [
  {
    id: 'weapon.dagger',
    name: 'Dagger',
    nameCn: '匕首',
    category: 'weapon',
    weaponCategory: 'simpleMelee',
    source: 'dnd2024-basic',
    damageDice: '1d4',
    damageType: 'piercing',
    properties: ['Finesse', 'Light', 'Thrown'],
    range: '20/60 ft',
    weight: 1,
    cost: '2 GP',
  },
  {
    id: 'weapon.quarterstaff',
    name: 'Quarterstaff',
    nameCn: '木棍',
    category: 'weapon',
    weaponCategory: 'simpleMelee',
    source: 'dnd2024-basic',
    damageDice: '1d6',
    damageType: 'bludgeoning',
    properties: ['Versatile (1d8)'],
    weight: 4,
    cost: '2 SP',
  },
  {
    id: 'weapon.shortbow',
    name: 'Shortbow',
    nameCn: '短弓',
    category: 'weapon',
    weaponCategory: 'simpleRanged',
    source: 'dnd2024-basic',
    damageDice: '1d6',
    damageType: 'piercing',
    properties: ['Ammunition', 'Two-Handed'],
    range: '80/320 ft',
    weight: 2,
    cost: '25 GP',
  },
  {
    id: 'weapon.light-crossbow',
    name: 'Light Crossbow',
    nameCn: '轻弩',
    category: 'weapon',
    weaponCategory: 'simpleRanged',
    source: 'dnd2024-basic',
    damageDice: '1d8',
    damageType: 'piercing',
    properties: ['Ammunition', 'Loading', 'Two-Handed'],
    range: '80/320 ft',
    weight: 5,
    cost: '25 GP',
  },
  {
    id: 'weapon.longsword',
    name: 'Longsword',
    nameCn: '长剑',
    category: 'weapon',
    weaponCategory: 'martialMelee',
    source: 'dnd2024-basic',
    damageDice: '1d8',
    damageType: 'slashing',
    properties: ['Versatile (1d10)'],
    weight: 3,
    cost: '15 GP',
  },
  {
    id: 'weapon.greatsword',
    name: 'Greatsword',
    nameCn: '巨剑',
    category: 'weapon',
    weaponCategory: 'martialMelee',
    source: 'dnd2024-basic',
    damageDice: '2d6',
    damageType: 'slashing',
    properties: ['Heavy', 'Two-Handed'],
    weight: 6,
    cost: '50 GP',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 护甲与盾 Armor & Shield
// ─────────────────────────────────────────────────────────────────────────────

export const DND_BASIC_ARMOR: DndArmorItem[] = [
  {
    id: 'armor.leather',
    name: 'Leather Armor',
    nameCn: '皮甲',
    category: 'armor',
    armorCategory: 'light',
    source: 'dnd2024-basic',
    baseAc: 11,
    dexModifier: 'full',
    weight: 10,
    cost: '10 GP',
  },
  {
    id: 'armor.chain-shirt',
    name: 'Chain Shirt',
    nameCn: '链甲衫',
    category: 'armor',
    armorCategory: 'medium',
    source: 'dnd2024-basic',
    baseAc: 13,
    dexModifier: 'max2',
    weight: 20,
    cost: '50 GP',
  },
  {
    id: 'armor.chain-mail',
    name: 'Chain Mail',
    nameCn: '链甲',
    category: 'armor',
    armorCategory: 'heavy',
    source: 'dnd2024-basic',
    baseAc: 16,
    dexModifier: 'none',
    strengthRequirement: 13,
    stealthDisadvantage: true,
    weight: 55,
    cost: '75 GP',
  },
  {
    id: 'armor.shield',
    name: 'Shield',
    nameCn: '盾牌',
    category: 'shield',
    armorCategory: 'shield',
    source: 'dnd2024-basic',
    baseAc: 2,
    description: 'AC +2（展示用；v1 不做 AC 自动计算）',
    weight: 6,
    cost: '10 GP',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 工具与冒险装备 Gear & Tools
// ─────────────────────────────────────────────────────────────────────────────

export const DND_BASIC_GEAR: DndGearItem[] = [
  {
    id: 'gear.explorers-pack',
    name: "Explorer's Pack",
    nameCn: '探索者背包',
    category: 'adventuringGear',
    source: 'dnd2024-basic',
    description: '常用冒险补给合集（内容物不展开建模）',
    weight: 55,
    cost: '10 GP',
  },
  {
    id: 'gear.rope-50ft',
    name: 'Rope (50 ft)',
    nameCn: '绳索（50 尺）',
    category: 'adventuringGear',
    source: 'dnd2024-basic',
    weight: 5,
    cost: '1 GP',
  },
  {
    id: 'gear.torch',
    name: 'Torch',
    nameCn: '火把',
    category: 'adventuringGear',
    source: 'dnd2024-basic',
    weight: 1,
    cost: '1 CP',
  },
  {
    id: 'gear.thieves-tools',
    name: "Thieves' Tools",
    nameCn: '盗贼工具',
    category: 'tool',
    source: 'dnd2024-basic',
    weight: 1,
    cost: '25 GP',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 汇总与查询
// ─────────────────────────────────────────────────────────────────────────────

export const DND_EQUIPMENT_CATALOG: DndEquipmentItem[] = [
  ...DND_BASIC_WEAPONS,
  ...DND_BASIC_ARMOR,
  ...DND_BASIC_GEAR,
];

export function getDndEquipmentById(id: string): DndEquipmentItem | undefined {
  return DND_EQUIPMENT_CATALOG.find(item => item.id === id);
}
