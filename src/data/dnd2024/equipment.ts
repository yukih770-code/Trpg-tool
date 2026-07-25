/**
 * DND 2024 核心武器与护甲目录（只读数据层）
 *
 * AI-LANDMARK: DND_EQUIPMENT_DATA_LAYER
 *
 * 只读规则数据。本文件不含任何运行时逻辑。
 * 本轮按本地 CHM 主源提取武器与护甲表的结构化字段（38 武器 / 13 护甲与盾），
 * 不复制规则书长描述，也不把词条、精通或装备属性接入自动执行。
 *
 * 不做：inventory、装备/卸下、AC 自动计算、攻击/伤害、武器精通、
 * 弹药、魔法物品、attunement、Action Registry 接入。
 *
 * 数据来源标记：`dnd-local-chm-primary`。
 */

import type {
  DndArmorItem,
  DndEquipmentItem,
  DndGearItem,
  DndWeaponItem,
} from '../../lib/dnd2024/equipment-types';
import type { RuleDataMetadata } from '../../lib/rules/rule-data-metadata';

export const DND_EQUIPMENT_DATA_ACCURACY: RuleDataMetadata = {
  source: 'dnd-local-chm-primary',
  trustLevel: 'owner-source-matched',
  usagePolicy: 'display-only',
  sourceRef: 'dnd-local-chm-primary:玩家手册2024/装备',
  sourceNote:
    'Weapon and armor rows are extracted from the local CHM primary-source tables. Tools, adventuring gear, packs, mounts, services, magic items, and executable equipment rules remain separate follow-up work.',
};

const LOCAL_CHM_EQUIPMENT_REF = 'dnd-local-chm-primary:玩家手册2024/装备';

function weapon(
  id: string,
  nameCn: string,
  name: string,
  weaponCategory: DndWeaponItem['weaponCategory'],
  damageDice: string,
  damageType: string,
  properties: string[],
  mastery: string,
  weight: number | undefined,
  cost: string,
  range?: string,
  aliases?: string[],
): DndWeaponItem {
  return {
    id, nameCn, name, category: 'weapon', weaponCategory, damageDice, damageType,
    properties, mastery, weight, cost, range, aliases,
    source: 'dnd-local-chm-primary',
    sourceRef: `${LOCAL_CHM_EQUIPMENT_REF}/武器.htm`,
  };
}

function armor(
  id: string,
  nameCn: string,
  name: string,
  armorCategory: DndArmorItem['armorCategory'],
  baseAc: number,
  dexModifier: DndArmorItem['dexModifier'],
  weight: number,
  cost: string,
  strengthRequirement?: number,
  stealthDisadvantage?: boolean,
): DndArmorItem {
  return {
    id, nameCn, name, category: armorCategory === 'shield' ? 'shield' : 'armor', armorCategory,
    baseAc, dexModifier, weight, cost, strengthRequirement, stealthDisadvantage,
    source: 'dnd-local-chm-primary',
    sourceRef: `${LOCAL_CHM_EQUIPMENT_REF}/护甲.htm`,
  };
}

function tool(
  id: string,
  nameCn: string,
  name: string,
  cost: string,
  weight: number | undefined,
  sourceFile: '工匠工具.htm' | '其他工具.htm',
  aliases?: string[],
): DndGearItem {
  return {
    id, nameCn, name, category: 'tool', cost, weight, aliases,
    source: 'dnd-local-chm-primary',
    sourceRef: `${LOCAL_CHM_EQUIPMENT_REF}/${sourceFile}`,
  };
}

function pack(
  id: string,
  nameCn: string,
  name: string,
  weight: number,
  cost: string,
  aliases?: string[],
): DndGearItem {
  return {
    id, nameCn, name, category: 'adventuringGear', weight, cost, aliases,
    source: 'dnd-local-chm-primary',
    sourceRef: `${LOCAL_CHM_EQUIPMENT_REF}/冒险装备.htm`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 武器 Weapons
// ─────────────────────────────────────────────────────────────────────────────

export const DND_BASIC_WEAPONS: DndWeaponItem[] = [
  weapon('weapon.club', '短棒', 'Club', 'simpleMelee', '1d4', '钝击', ['轻型'], '缓速', 2, '1 SP'),
  weapon('weapon.dagger', '匕首', 'Dagger', 'simpleMelee', '1d4', '穿刺', ['灵巧', '轻型', '投掷'], '迅击', 1, '2 GP', '20/60 尺'),
  weapon('weapon.greatclub', '巨棒', 'Greatclub', 'simpleMelee', '1d8', '钝击', ['双手'], '推离', 10, '2 SP'),
  weapon('weapon.handaxe', '手斧', 'Handaxe', 'simpleMelee', '1d6', '挥砍', ['轻型', '投掷'], '侵扰', 2, '5 GP', '20/60 尺'),
  weapon('weapon.javelin', '标枪', 'Javelin', 'simpleMelee', '1d6', '穿刺', ['投掷'], '缓速', 2, '5 SP', '30/120 尺'),
  weapon('weapon.light-hammer', '轻锤', 'Light Hammer', 'simpleMelee', '1d4', '钝击', ['轻型', '投掷'], '迅击', 2, '2 GP', '20/60 尺'),
  weapon('weapon.mace', '硬头锤', 'Mace', 'simpleMelee', '1d6', '钝击', [], '削弱', 4, '5 GP'),
  weapon('weapon.quarterstaff', '长棍', 'Quarterstaff', 'simpleMelee', '1d6', '钝击', ['多用（1d8）'], '失衡', 4, '2 SP', undefined, ['木棍']),
  weapon('weapon.sickle', '镰刀', 'Sickle', 'simpleMelee', '1d4', '挥砍', ['轻型'], '迅击', 2, '1 GP'),
  weapon('weapon.spear', '矛', 'Spear', 'simpleMelee', '1d6', '穿刺', ['投掷', '多用（1d8）'], '削弱', 3, '1 GP', '20/60 尺'),
  weapon('weapon.dart', '飞镖', 'Dart', 'simpleRanged', '1d4', '穿刺', ['灵巧', '投掷'], '侵扰', 0.25, '5 CP', '20/60 尺'),
  weapon('weapon.light-crossbow', '轻弩', 'Light Crossbow', 'simpleRanged', '1d8', '穿刺', ['弹药（弩矢）', '装填', '双手'], '缓速', 5, '25 GP', '80/320 尺'),
  weapon('weapon.shortbow', '短弓', 'Shortbow', 'simpleRanged', '1d6', '穿刺', ['弹药（箭矢）', '双手'], '侵扰', 2, '25 GP', '80/320 尺'),
  weapon('weapon.sling', '投石索', 'Sling', 'simpleRanged', '1d4', '钝击', ['弹药（子弹）'], '缓速', undefined, '1 SP', '30/120 尺'),
  weapon('weapon.battleaxe', '战斧', 'Battleaxe', 'martialMelee', '1d8', '挥砍', ['多用（1d10）'], '失衡', 4, '10 GP'),
  weapon('weapon.flail', '链枷', 'Flail', 'martialMelee', '1d8', '钝击', [], '削弱', 2, '10 GP'),
  weapon('weapon.glaive', '长柄刀', 'Glaive', 'martialMelee', '1d10', '挥砍', ['重型', '触及', '双手'], '擦掠', 6, '20 GP'),
  weapon('weapon.greataxe', '巨斧', 'Greataxe', 'martialMelee', '1d12', '挥砍', ['重型', '双手'], '横扫', 7, '30 GP'),
  weapon('weapon.greatsword', '巨剑', 'Greatsword', 'martialMelee', '2d6', '挥砍', ['重型', '双手'], '擦掠', 6, '50 GP'),
  weapon('weapon.halberd', '戟', 'Halberd', 'martialMelee', '1d10', '挥砍', ['重型', '触及', '双手'], '横扫', 6, '20 GP'),
  weapon('weapon.lance', '骑枪', 'Lance', 'martialMelee', '1d10', '穿刺', ['重型', '触及', '双手（骑乘时除外）'], '失衡', 6, '10 GP'),
  weapon('weapon.longsword', '长剑', 'Longsword', 'martialMelee', '1d8', '挥砍', ['多用（1d10）'], '削弱', 3, '15 GP'),
  weapon('weapon.maul', '巨锤', 'Maul', 'martialMelee', '2d6', '钝击', ['重型', '双手'], '失衡', 10, '10 GP'),
  weapon('weapon.morningstar', '钉头锤', 'Morningstar', 'martialMelee', '1d8', '穿刺', [], '削弱', 4, '15 GP'),
  weapon('weapon.pike', '长矛', 'Pike', 'martialMelee', '1d10', '穿刺', ['重型', '触及', '双手'], '推离', 18, '5 GP'),
  weapon('weapon.rapier', '刺剑', 'Rapier', 'martialMelee', '1d8', '穿刺', ['灵巧'], '侵扰', 2, '25 GP', undefined, ['细剑']),
  weapon('weapon.scimitar', '弯刀', 'Scimitar', 'martialMelee', '1d6', '挥砍', ['灵巧', '轻型'], '迅击', 3, '25 GP'),
  weapon('weapon.shortsword', '短剑', 'Shortsword', 'martialMelee', '1d6', '穿刺', ['灵巧', '轻型'], '侵扰', 2, '10 GP'),
  weapon('weapon.trident', '三叉戟', 'Trident', 'martialMelee', '1d8', '穿刺', ['投掷', '多用（1d10）'], '失衡', 4, '5 GP', '20/60 尺'),
  weapon('weapon.warpick', '战镐', 'Warpick', 'martialMelee', '1d8', '穿刺', ['多用（1d10）'], '削弱', 2, '5 GP'),
  weapon('weapon.warhammer', '战锤', 'Warhammer', 'martialMelee', '1d8', '钝击', ['多用（1d10）'], '推离', 2, '15 GP'),
  weapon('weapon.whip', '鞭', 'Whip', 'martialMelee', '1d4', '挥砍', ['灵巧', '触及'], '缓速', 3, '2 GP'),
  weapon('weapon.blowgun', '吹箭筒', 'Blowgun', 'martialRanged', '1', '穿刺', ['弹药（吹矢）', '装填'], '侵扰', 1, '10 GP', '25/100 尺'),
  weapon('weapon.hand-crossbow', '手弩', 'Hand Crossbow', 'martialRanged', '1d6', '穿刺', ['弹药（弩矢）', '轻型', '装填'], '侵扰', 3, '75 GP', '30/120 尺'),
  weapon('weapon.heavy-crossbow', '重弩', 'Heavy Crossbow', 'martialRanged', '1d10', '穿刺', ['弹药（弩矢）', '重型', '装填', '双手'], '推离', 18, '50 GP', '100/400 尺'),
  weapon('weapon.longbow', '长弓', 'Longbow', 'martialRanged', '1d8', '穿刺', ['弹药（箭矢）', '重型', '双手'], '缓速', 2, '50 GP', '150/600 尺'),
  weapon('weapon.musket', '火铳', 'Musket', 'martialRanged', '1d12', '穿刺', ['弹药（子弹）', '装填', '双手'], '缓速', 10, '500 GP', '40/120 尺'),
  weapon('weapon.pistol', '手铳', 'Pistol', 'martialRanged', '1d10', '穿刺', ['弹药（子弹）', '装填'], '侵扰', 3, '250 GP', '30/90 尺'),
];

// ─────────────────────────────────────────────────────────────────────────────
// 护甲与盾 Armor & Shield
// ─────────────────────────────────────────────────────────────────────────────

export const DND_BASIC_ARMOR: DndArmorItem[] = [
  armor('armor.padded', '布甲', 'Padded Armor', 'light', 11, 'full', 8, '5 GP', undefined, true),
  armor('armor.leather', '皮甲', 'Leather Armor', 'light', 11, 'full', 10, '10 GP'),
  armor('armor.studded-leather', '镶钉皮甲', 'Studded Leather Armor', 'light', 12, 'full', 13, '45 GP'),
  armor('armor.hide', '兽皮甲', 'Hide Armor', 'medium', 12, 'max2', 12, '10 GP'),
  armor('armor.chain-shirt', '链甲衫', 'Chain Shirt', 'medium', 13, 'max2', 20, '50 GP'),
  armor('armor.scale-mail', '鳞甲', 'Scale Mail', 'medium', 14, 'max2', 45, '50 GP', undefined, true),
  armor('armor.breastplate', '胸甲', 'Breastplate', 'medium', 14, 'max2', 20, '400 GP'),
  armor('armor.half-plate', '半身板甲', 'Half Plate Armor', 'medium', 15, 'max2', 40, '750 GP', undefined, true),
  armor('armor.ring-mail', '环甲', 'Ring Mail', 'heavy', 14, 'none', 40, '30 GP', undefined, true),
  armor('armor.chain-mail', '链甲', 'Chain Mail', 'heavy', 16, 'none', 55, '75 GP', 13, true),
  armor('armor.splint', '板条甲', 'Splint Armor', 'heavy', 17, 'none', 60, '200 GP', 15, true),
  armor('armor.plate', '板甲', 'Plate Armor', 'heavy', 18, 'none', 65, '1500 GP', 15, true),
  armor('armor.shield', '盾牌', 'Shield', 'shield', 2, undefined, 6, '10 GP'),
];

// ─────────────────────────────────────────────────────────────────────────────
// 工具与冒险装备 Gear & Tools
// ─────────────────────────────────────────────────────────────────────────────

export const DND_BASIC_GEAR: DndGearItem[] = [
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
];

// ─────────────────────────────────────────────────────────────────────────────
// 冒险套装 Packs
// ─────────────────────────────────────────────────────────────────────────────

export const DND_BASIC_PACKS: DndGearItem[] = [
  pack('pack.burglars-pack', '窃贼套组', "Burglar's Pack", 42, '16 GP', ['盗贼套件']),
  pack('pack.diplomats-pack', '外交套组', "Diplomat's Pack", 39, '39 GP', ['外交官套件', '外交官包']),
  pack('pack.dungeoneers-pack', '地城套组', "Dungeoneer's Pack", 55, '12 GP', ['地下城套件']),
  pack('pack.entertainers-pack', '艺人套组', "Entertainer's Pack", 58.5, '40 GP', ['艺人套件', '表演者套件', '艺人包']),
  pack('gear.explorers-pack', '探索套组', "Explorer's Pack", 55, '10 GP', ['探索者套件', '探险者套件', '探索者背包']),
  pack('pack.priests-pack', '祭司套组', "Priest's Pack", 29, '33 GP', ['牧师套件']),
  pack('pack.scholars-pack', '学者套组', "Scholar's Pack", 22, '40 GP'),
];

// ─────────────────────────────────────────────────────────────────────────────
// 工具 Tools
// ─────────────────────────────────────────────────────────────────────────────

export const DND_BASIC_TOOLS: DndGearItem[] = [
  tool('tool.alchemists-supplies', '炼金工具', "Alchemist's Supplies", '50 GP', 8, '工匠工具.htm'),
  tool('tool.brewers-supplies', '酿酒工具', "Brewer's Supplies", '20 GP', 9, '工匠工具.htm'),
  tool('tool.calligraphers-supplies', '书法工具', "Calligrapher's Supplies", '10 GP', 5, '工匠工具.htm'),
  tool('tool.carpenters-tools', '木匠工具', "Carpenter's Tools", '8 GP', 6, '工匠工具.htm'),
  tool('tool.cartographers-tools', '制图工具', "Cartographer's Tools", '15 GP', 6, '工匠工具.htm'),
  tool('tool.cobblers-tools', '鞋匠工具', "Cobbler's Tools", '5 GP', 5, '工匠工具.htm'),
  tool('tool.cooks-utensils', '厨师工具', "Cook's Utensils", '1 GP', 8, '工匠工具.htm'),
  tool('tool.glassblowers-tools', '玻璃匠工具', "Glassblower's Tools", '30 GP', 5, '工匠工具.htm'),
  tool('tool.jewelers-tools', '珠宝匠工具', "Jeweler's Tools", '25 GP', 2, '工匠工具.htm'),
  tool('tool.leatherworkers-tools', '皮匠工具', "Leatherworker's Tools", '5 GP', 5, '工匠工具.htm'),
  tool('tool.masons-tools', '石匠工具', "Mason's Tools", '10 GP', 8, '工匠工具.htm'),
  tool('tool.painters-supplies', '画家工具', "Painter's Supplies", '10 GP', 5, '工匠工具.htm'),
  tool('tool.potters-tools', '陶匠工具', "Potter's Tools", '10 GP', 3, '工匠工具.htm'),
  tool('tool.smiths-tools', '铁匠工具', "Smith's Tools", '20 GP', 8, '工匠工具.htm'),
  tool('tool.tinkers-tools', '修补工具', "Tinker's Tools", '50 GP', 10, '工匠工具.htm'),
  tool('tool.weavers-tools', '织布工具', "Weaver's Tools", '1 GP', 5, '工匠工具.htm'),
  tool('tool.woodcarvers-tools', '木雕工具', "Woodcarver's Tools", '1 GP', 5, '工匠工具.htm'),
  tool('tool.disguise-kit', '易容工具', 'Disguise Kit', '25 GP', 3, '其他工具.htm'),
  tool('tool.forgery-kit', '文书伪造工具', 'Forgery Kit', '15 GP', 5, '其他工具.htm'),
  tool('tool.gaming-set', '赌具（多种）', 'Gaming Set', '价格不定', undefined, '其他工具.htm', ['赌具（任选一种）']),
  tool('tool.herbalism-kit', '草药工具', 'Herbalism Kit', '5 GP', 3, '其他工具.htm'),
  tool('tool.musical-instrument', '乐器（多类）', 'Musical Instrument', '价格不定', undefined, '其他工具.htm', ['乐器', '乐器（任选一种）', '乐器(任意)']),
  tool('tool.navigators-tools', '领航工具', "Navigator's Tools", '25 GP', 2, '其他工具.htm'),
  tool('tool.poisoners-kit', '毒药工具', "Poisoner's Kit", '50 GP', 2, '其他工具.htm'),
  tool('tool.thieves-tools', '盗贼工具', "Thieves' Tools", '25 GP', 1, '其他工具.htm'),
];

// ─────────────────────────────────────────────────────────────────────────────
// 汇总与查询
// ─────────────────────────────────────────────────────────────────────────────

export const DND_EQUIPMENT_CATALOG: DndEquipmentItem[] = [
  ...DND_BASIC_WEAPONS,
  ...DND_BASIC_ARMOR,
  ...DND_BASIC_TOOLS,
  ...DND_BASIC_PACKS,
  ...DND_BASIC_GEAR,
];

export function getDndEquipmentById(id: string): DndEquipmentItem | undefined {
  return DND_EQUIPMENT_CATALOG.find(item => item.id === id);
}
