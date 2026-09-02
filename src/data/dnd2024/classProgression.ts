/**
 * DND 2024 Class Progression Data
 *
 * 只读规则数据。本文件不含任何运行时逻辑。
 * 本轮提供 4 个样例职业完整数据（1-5 级）：
 *   - barbarian（野蛮人）：职业资源型样例
 *   - bard（吟游诗人）：固定已知法术施法者样例
 *   - warlock（邪术师）：契约魔法施法者样例
 *   - wizard（法师）：法术书准备施法者样例
 *
 * 战士与牧师另依据本机所有者资料源补齐了 1-20 级的等级表。
 * 其余 6 个职业为最小占位数据（待后续补全）。
 *
 * 数据来源：DND 2024 玩家手册
 */

import {
  Dnd2024ClassProgression,
  DndClassKey,
  ClassResourceDefinition,
  ActionDefinition,
  PassiveFeatureDefinition,
  ConditionDefinition,
  SpellSlotProgression,
  SpellcastingProgression,
  Dnd2024LevelProgression,
} from '../../lib/dnd2024/progression-types.js';
import type { RuleDataMetadata } from '../../lib/rules/rule-data-metadata.js';

export const DND_CLASS_PROGRESSION_ACCURACY: RuleDataMetadata = {
  source: 'dnd-local-chm-primary',
  trustLevel: 'owner-source-matched',
  usagePolicy: 'core-runtime-ok',
  sourceRef:
    'docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md#class-resource--progression',
  sourceNote:
    'All twelve standard-class level-table facts are matched to the local DND 2024 owner source. Existing declarative action and passive detail remains separately bounded and is not automatic rules execution.',
};

// ─────────────────────────────────────────────────────────────────────────────
// 工具：生成标准熟练加值
// ─────────────────────────────────────────────────────────────────────────────

function profBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

// ─────────────────────────────────────────────────────────────────────────────
// 全施法者标准法术位进阶表（DND 2024）
// index = level - 1
// ─────────────────────────────────────────────────────────────────────────────

const FULL_CASTER_SLOT_TABLE: (SpellSlotProgression | null)[] = [
  // Lv1
  { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv2
  { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv3
  { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv4
  { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv5
  { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv6
  { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv7
  { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv8
  { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv9
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv10
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 },
  // Lv11
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 0, level8: 0, level9: 0 },
  // Lv12
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 0, level8: 0, level9: 0 },
  // Lv13
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 0, level9: 0 },
  // Lv14
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 0, level9: 0 },
  // Lv15
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 0 },
  // Lv16
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 0 },
  // Lv17
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 1 },
  // Lv18
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 1, level7: 1, level8: 1, level9: 1 },
  // Lv19
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 2, level7: 1, level8: 1, level9: 1 },
  // Lv20
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 2, level7: 2, level8: 1, level9: 2 },
];

// 本机 2024 圣武士 / 游侠等级表使用的半施法者法术位进阶。
// 两职业均从 1 级开始具有 1 环法术位。
const HALF_CASTER_SLOT_TABLE: (SpellSlotProgression | null)[] = [
  { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 },
  { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// ████  BARBARIAN（野蛮人）
// ─────────────────────────────────────────────────────────────────────────────

// 资源定义
const BARBARIAN_RAGE: ClassResourceDefinition = {
  id: 'barbarian_rage',
  nameCn: '狂暴',
  nameEn: 'Rage',
  sourceFeature: '狂暴 (Rage)',
  unlockLevel: 1,
  maxUses: 'table',
  maxUsesByLevel: [
    2, 2, 3, 3, 3, // 1-5
    4, 4, 4, 4, 4, // 6-10
    4, 5, 5, 5, 5, // 11-15
    5, 6, 6, 6, 'unlimited', // 16-20（20级无限）
  ],
  recoveryType: 'longRest',
  notes:
    '附赠动作激活。必须在未穿重甲状态下使用。持续时间：直到战斗结束或你倒地或你选择结束。' +
    '20 级狂暴次数为无限。短休可消耗生命骰恢复 1 次狂暴（每长休限 1 次），本轮不实现该特殊恢复。',
};

const BARBARIAN_WEAPON_MASTERY: ClassResourceDefinition = {
  id: 'barbarian_weapon_mastery',
  nameCn: '武器掌握',
  nameEn: 'Weapon Mastery',
  sourceFeature: '武器掌握 (Weapon Mastery)',
  unlockLevel: 1,
  maxUses: 'table',
  maxUsesByLevel: [
    2, 2, 2, 3, 3, // 1-5
    3, 3, 3, 3, 4, // 6-10
    4, 4, 4, 4, 4, // 11-15
    4, 4, 4, 4, 4, // 16-20
  ],
  recoveryType: 'longRest',
  notes:
    '可同时掌握的武器数量（按等级提升）。长休后可更换已选武器。' +
    '武器掌握属性（如推击、劈砍）在攻击命中时触发，无需额外动作。',
};

// 动作定义
const BARBARIAN_RAGE_ACTION: ActionDefinition = {
  id: 'barbarian_rage_activate',
  nameCn: '激活狂暴',
  nameEn: 'Activate Rage',
  sourceType: 'resource',
  sourceId: 'barbarian_rage',
  unlockLevel: 1,
  actionType: 'bonusAction',
  rollType: 'none',
  resourceCost: { barbarian_rage: 1 },
  duration: '直到战斗结束、你倒地，或你在自己回合结束前未攻击敌方生物且未受到伤害',
  target: '自身',
  notes:
    '激活后获得：' +
    '① 力量检定和豁免获得优势；' +
    '② 力量属性伤害骰附加奖励（d6→d8→d10随等级提升）；' +
    '③ 获得钝击、穿刺、挥砍伤害的抗性。' +
    '不可穿重甲激活。',
};

const BARBARIAN_RAGE_END_ACTION: ActionDefinition = {
  id: 'barbarian_rage_end',
  nameCn: '结束狂暴',
  nameEn: 'End Rage',
  sourceType: 'classFeature',
  sourceId: 'barbarian_rage',
  unlockLevel: 1,
  actionType: 'bonusAction',
  rollType: 'none',
  duration: '即时',
  target: '自身',
  notes: '可在自己的回合使用附赠动作主动结束狂暴状态。',
};

// 被动特性
const BARBARIAN_UNARMORED_DEFENSE: PassiveFeatureDefinition = {
  id: 'barbarian_unarmored_defense',
  nameCn: '无甲防御',
  nameEn: 'Unarmored Defense',
  sourceFeature: '无甲防御 (Unarmored Defense)',
  unlockLevel: 1,
  affects: ['ac'],
  notes:
    '未穿护甲时，AC = 10 + 敏捷调整值 + 体质调整值。可持盾。' +
    '穿任何护甲后此特性失效。',
};

const BARBARIAN_WEAPON_MASTERY_PASSIVE: PassiveFeatureDefinition = {
  id: 'barbarian_weapon_mastery_passive',
  nameCn: '武器掌握（被动）',
  nameEn: 'Weapon Mastery (Passive)',
  sourceFeature: '武器掌握 (Weapon Mastery)',
  unlockLevel: 1,
  affects: ['attack', 'damage', 'special'],
  notes:
    '对已掌握的武器可使用该武器的掌握属性（如推击、劈砍、快击等）。' +
    '掌握属性在普通攻击命中时触发，无需消耗资源。',
};

const BARBARIAN_DANGER_SENSE: PassiveFeatureDefinition = {
  id: 'barbarian_danger_sense',
  nameCn: '危险感知',
  nameEn: 'Danger Sense',
  sourceFeature: '危险感知 (Danger Sense)',
  unlockLevel: 2,
  affects: ['savingThrow', 'dexterity'],
  notes:
    '对敏捷豁免有优势（针对可见范围内的效果）。' +
    '条件：不能是目盲、耳聋或失能状态。',
};

const BARBARIAN_RECKLESS_ATTACK: PassiveFeatureDefinition = {
  id: 'barbarian_reckless_attack',
  nameCn: '鲁莽攻击',
  nameEn: 'Reckless Attack',
  sourceFeature: '鲁莽攻击 (Reckless Attack)',
  unlockLevel: 2,
  affects: ['attack'],
  notes:
    '回合首次攻击时可选择鲁莽攻击：本回合所有近战武器攻击获得优势，' +
    '但直到下一回合开始，敌方对你的攻击也获得优势。',
};

const BARBARIAN_PRIMAL_KNOWLEDGE: PassiveFeatureDefinition = {
  id: 'barbarian_primal_knowledge',
  nameCn: '原始知识',
  nameEn: 'Primal Knowledge',
  sourceFeature: '原始知识 (Primal Knowledge)',
  unlockLevel: 3,
  affects: ['skills'],
  notes:
    '3 级获得额外 1 个技能熟练（从野蛮人技能列表选择）。' +
    '狂暴时，可将已有熟练的技能改用力量属性进行检定。',
};

// 状态定义
const BARBARIAN_RAGING_CONDITION: ConditionDefinition = {
  id: 'condition_barbarian_raging',
  nameCn: '狂暴中',
  nameEn: 'Raging',
  source: 'barbarian_rage',
  durationType: 'special',
  effects: [
    '力量检定和力量豁免获得优势',
    '近战武器伤害骰附加力量奖励骰（1级d6，9级d8，16级d10）',
    '获得钝击、穿刺、挥砍伤害抗性',
  ],
  endsWhen:
    '战斗结束；你倒地；你在自己回合结束前：既未攻击敌方生物，也未受到伤害；' +
    '你穿上重甲；或你使用附赠动作主动结束。',
  notes: '激活需要穿非重甲。同一时间只能处于一次狂暴。',
};

// 构建等级进阶
const BARBARIAN_SOURCE_FEATURES_BY_LEVEL: string[][] = [
  ['狂暴', '无甲防御', '武器精通'],
  ['危险感应', '鲁莽攻击'],
  ['野蛮人子职', '原初学识'],
  ['属性值提升'],
  ['额外攻击', '快速移动'],
  ['子职特性'],
  ['野性直觉', '莽驰'],
  ['属性值提升'],
  ['凶蛮打击'],
  ['子职特性'],
  ['坚韧狂暴'],
  ['属性值提升'],
  ['强化凶蛮打击'],
  ['子职特性'],
  ['持久狂暴'],
  ['属性值提升', '狂暴伤害提升（+4）'],
  ['强化凶蛮打击'],
  ['不屈勇武'],
  ['传奇恩惠'],
  ['原初斗士'],
];

function buildBarbarianLevel(level: number): Dnd2024LevelProgression {
  const features: string[] = [];
  const resources: ClassResourceDefinition[] = [];
  const actions: ActionDefinition[] = [];
  const passiveFeatures: PassiveFeatureDefinition[] = [];
  const conditions: ConditionDefinition[] = [];

  if (level === 1) {
    features.push('狂暴', '无甲防御', '武器掌握');
    resources.push(BARBARIAN_RAGE);
    actions.push(BARBARIAN_RAGE_ACTION, BARBARIAN_RAGE_END_ACTION);
    passiveFeatures.push(BARBARIAN_UNARMORED_DEFENSE, BARBARIAN_WEAPON_MASTERY_PASSIVE);
    conditions.push(BARBARIAN_RAGING_CONDITION);
  }
  if (level === 2) {
    features.push('鲁莽攻击', '危险感知');
    passiveFeatures.push(BARBARIAN_DANGER_SENSE, BARBARIAN_RECKLESS_ATTACK);
  }
  if (level === 3) {
    features.push('野蛮人子职业', '原始知识');
    passiveFeatures.push(BARBARIAN_PRIMAL_KNOWLEDGE);
  }
  if (level === 4) {
    features.push('属性值提升或通用专长');
  }
  if (level === 5) {
    features.push('额外攻击', '迅速移动');
  }

  return {
    level,
    proficiencyBonus: profBonus(level),
    features: BARBARIAN_SOURCE_FEATURES_BY_LEVEL[level - 1] ?? features,
    resources,
    actions,
    passiveFeatures,
    conditions,
    spellcasting: null,
  };
}

const BARBARIAN_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'barbarian',
  classNameCn: '野蛮人',
  classNameEn: 'Barbarian',
  hitDie: 12,
  spellcasting: null,
  levels: Array.from({ length: 20 }, (_, i) => buildBarbarianLevel(i + 1)),
};

// ─────────────────────────────────────────────────────────────────────────────
// ████  BARD（吟游诗人）
// ─────────────────────────────────────────────────────────────────────────────

// 资源定义
const BARD_BARDIC_INSPIRATION: ClassResourceDefinition = {
  id: 'bard_bardic_inspiration',
  nameCn: '诗人激励',
  nameEn: 'Bardic Inspiration',
  sourceFeature: '诗人激励 (Bardic Inspiration)',
  unlockLevel: 1,
  maxUses: 'manual',
  maxFormula: 'charismaModifierMin1',
  recoveryType: 'longRest',
  dice: [
    // 每等级的激励骰面
    'd6','d6','d6','d6', // 1-4
    'd8','d8','d8','d8','d8','d8', // 5-10
    'd10','d10','d10','d10', // 11-14
    'd12','d12','d12','d12','d12','d12', // 15-20
  ],
  notes:
    '最大使用次数 = 魅力调整值（最少1）。' +
    '5 级起恢复类型改为"短休或长休"（Font of Inspiration）。' +
    '激励骰：1-4级d6，5-10级d8，11-14级d10，15-20级d12。',
};

const BARD_BARDIC_INSPIRATION_FONT: ClassResourceDefinition = {
  ...BARD_BARDIC_INSPIRATION,
  unlockLevel: 5,
  recoveryType: 'shortOrLongRest',
  notes:
    '最大使用次数 = 魅力调整值（最少1）。' +
    '5 级起诗人激励在短休或长休后恢复（Font of Inspiration）。' +
    '激励骰：1-4级d6，5-10级d8，11-14级d10，15-20级d12。',
};

// 施法进阶
const BARD_SPELLCASTING: SpellcastingProgression = {
  mode: 'fixedPreparedUpgradeReplace',
  ability: 'charisma',
  casterType: 'full',
  cantripsKnown: [
    2, 2, 2, 3, 3, // 1-5
    3, 3, 3, 3, 4, // 6-10
    4, 4, 4, 4, 4, // 11-15
    4, 4, 4, 4, 4, // 16-20
  ],
  preparedSpellCount: [
    4, 5, 6, 7, 9, // 1-5
    10, 11, 12, 14, 15, // 6-10
    16, 16, 17, 17, 18, // 11-15
    18, 19, 20, 21, 22, // 16-20
  ],
  preparedSpellFormula:
    'Fixed known spells table. 升级时可用 1 个已知法术替换为同等级或更低环级的职业法术。',
  spellSlotTable: FULL_CASTER_SLOT_TABLE,
  pactMagic: null,
  ritualCasting: 'ifPrepared',
  notes:
    '吟游诗人施法模式：fixedPreparedUpgradeReplace。\n' +
    '法术来自诗人法术列表，数量固定（见表），升级时可替换1个已知法术。\n' +
    '仪式施法：已知并已"准备"（即在已知列表中）的仪式法术可进行仪式施法。\n' +
    '施法法器：可用乐器作为法器。',
};

// 动作定义
const BARD_BARDIC_INSPIRATION_ACTION: ActionDefinition = {
  id: 'bard_bardic_inspiration_grant',
  nameCn: '授予诗人激励',
  nameEn: 'Grant Bardic Inspiration',
  sourceType: 'resource',
  sourceId: 'bard_bardic_inspiration',
  unlockLevel: 1,
  actionType: 'bonusAction',
  rollType: 'none',
  resourceCost: { bard_bardic_inspiration: 1 },
  duration: '10 分钟（或被使用/时间耗尽）',
  target: '60 尺内除自身以外的生物（可见）',
  notes:
    '目标获得诗人激励骰（当前等级对应骰面）。' +
    '目标可在此后 10 分钟内，在任意属性检定、攻击骰或豁免骰上，在掷骰后使用反应，' +
    '加入激励骰的结果。每名生物同一时间只能持有 1 个诗人激励骰。',
};

// 被动特性
const BARD_JACK_OF_ALL_TRADES: PassiveFeatureDefinition = {
  id: 'bard_jack_of_all_trades',
  nameCn: '万事通',
  nameEn: 'Jack of All Trades',
  sourceFeature: '万事通 (Jack of All Trades)',
  unlockLevel: 2,
  affects: ['skills', 'abilityChecks'],
  notes:
    '对任何没有熟练加值的属性检定，可额外加上熟练加值的一半（向下取整）。' +
    '从 2 级起生效。',
};

const BARD_EXPERTISE: PassiveFeatureDefinition = {
  id: 'bard_expertise',
  nameCn: '精通专项',
  nameEn: 'Expertise',
  sourceFeature: '精通专项 (Expertise)',
  unlockLevel: 3,
  affects: ['skills'],
  notes:
    '3 级选择 2 个已熟练的技能（或工具），这些技能的熟练加值加倍。' +
    '10 级再选 2 个。',
};

const BARD_SONG_OF_REST: PassiveFeatureDefinition = {
  id: 'bard_song_of_rest',
  nameCn: '休憩之歌',
  nameEn: 'Song of Rest',
  sourceFeature: '休憩之歌 (Song of Rest)',
  unlockLevel: 2,
  affects: ['healing'],
  notes:
    '短休期间，通过音乐激励你或盟友使用生命骰时，每人额外恢复激励骰数值的 HP。' +
    '（同诗人激励骰面，随等级提升）',
};

// 状态定义
const BARD_INSPIRED_CONDITION: ConditionDefinition = {
  id: 'condition_bard_inspired',
  nameCn: '受到激励',
  nameEn: 'Inspired',
  source: 'bard_bardic_inspiration',
  durationType: 'special',
  effects: [
    '持有 1 个诗人激励骰（当前等级对应骰面）',
    '可在 10 分钟内任意时刻，使用反应，在属性检定/攻击骰/豁免骰结果上加入激励骰',
    '使用后激励骰消失',
  ],
  endsWhen: '使用激励骰后；或 10 分钟未使用；或获得新的激励骰（替换旧的）。',
  notes: '每名生物同一时间只能持有 1 个激励骰。',
};

const BARD_SOURCE_FEATURES_BY_LEVEL: string[][] = [
  ['吟游诗人激励', '施法'],
  ['专精', '万事通'],
  ['吟游诗人子职'],
  ['属性值提升'],
  ['激励之源'],
  ['子职特性'],
  ['反迷惑'],
  ['属性值提升'],
  ['专精'],
  ['魔法奥秘'],
  [],
  ['属性值提升'],
  [],
  ['子职特性'],
  [],
  ['属性值提升'],
  [],
  ['先发激励'],
  ['传奇恩惠'],
  ['创生圣言'],
];

// 构建等级进阶
function buildBardLevel(level: number): Dnd2024LevelProgression {
  const features: string[] = [];
  const resources: ClassResourceDefinition[] = [];
  const actions: ActionDefinition[] = [];
  const passiveFeatures: PassiveFeatureDefinition[] = [];
  const conditions: ConditionDefinition[] = [];

  if (level === 1) {
    features.push('施法（吟游诗人）', '诗人激励', '武器掌握');
    resources.push(BARD_BARDIC_INSPIRATION);
    actions.push(BARD_BARDIC_INSPIRATION_ACTION);
    conditions.push(BARD_INSPIRED_CONDITION);
  }
  if (level === 2) {
    features.push('万事通', '休憩之歌');
    passiveFeatures.push(BARD_JACK_OF_ALL_TRADES);
  }
  if (level === 3) {
    features.push('精通专项', '吟游诗人子职业');
    passiveFeatures.push(BARD_EXPERTISE);
  }
  if (level === 4) {
    features.push('属性值提升或通用专长');
  }
  if (level === 5) {
    features.push('字体激励（诗人激励改为短休/长休恢复）', '诗人激励骰升至 d8');
    resources.push(BARD_BARDIC_INSPIRATION_FONT);
  }

  return {
    level,
    proficiencyBonus: profBonus(level),
    features: BARD_SOURCE_FEATURES_BY_LEVEL[level - 1] ?? features,
    resources,
    actions,
    passiveFeatures,
    conditions,
    spellcasting: FULL_CASTER_SLOT_TABLE[level - 1] ?? null,
  };
}

const BARD_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'bard',
  classNameCn: '吟游诗人',
  classNameEn: 'Bard',
  hitDie: 8,
  spellcasting: BARD_SPELLCASTING,
  levels: Array.from({ length: 20 }, (_, i) => buildBardLevel(i + 1)),
};

// ─────────────────────────────────────────────────────────────────────────────
// ████  WARLOCK（邪术师）
// ─────────────────────────────────────────────────────────────────────────────

// 契约魔法进阶表（DND 2024）
// 注：邪术师不使用标准法术位表，使用独立契约法术位
const WARLOCK_PACT_SLOTS: number[] = [
  1, 2, 2, 2, 2, // 1-5
  2, 2, 2, 2, 2, // 6-10
  3, 3, 3, 3, 3, // 11-15
  3, 4, 4, 4, 4, // 16-20
];

const WARLOCK_PACT_SLOT_LEVEL: number[] = [
  1, 1, 2, 2, 3, // 1-5
  3, 4, 4, 5, 5, // 6-10
  5, 5, 5, 5, 5, // 11-15
  5, 5, 5, 5, 5, // 16-20
];

// 施法进阶
const WARLOCK_SPELLCASTING: SpellcastingProgression = {
  mode: 'pactMagicFixedPrepared',
  ability: 'charisma',
  casterType: 'pact',
  cantripsKnown: [
    2, 2, 2, 3, 3, // 1-5
    3, 3, 3, 3, 4, // 6-10
    4, 4, 4, 4, 4, // 11-15
    4, 4, 4, 4, 4, // 16-20
  ],
  preparedSpellCount: [
    2, 3, 4, 5, 6, // 1-5
    7, 8, 9, 10, 10, // 6-10
    11, 11, 12, 12, 13, // 11-15
    13, 14, 14, 15, 15, // 16-20
  ],
  preparedSpellFormula:
    'Fixed known spells. 邪术师法术为"已知"而非"准备"。' +
    '升级时可替换 1 个已知法术。不使用准备法术机制。',
  spellSlotTable: Array(20).fill(null),
  // 邪术师不使用标准法术位表——全部为 null，实际位数在 pactMagic 中
  pactMagic: {
    pactSlots: WARLOCK_PACT_SLOTS,
    pactSlotLevel: WARLOCK_PACT_SLOT_LEVEL,
    recoveryType: 'shortRest',
  },
  ritualCasting: 'none',
  notes:
    '邪术师使用契约魔法（Pact Magic），与标准法术位完全独立。\n' +
    '契约法术位数量少但位等级高，短休后完全恢复。\n' +
    '所有契约法术位等级相同（见 pactSlotLevel 表）。\n' +
    '邪术师不从普通法术位表获得法术位。\n' +
    '祈求（Eldritch Invocations）：2 级起选择，可授予额外能力或特殊法术（始终准备）。\n' +
    '契约恩赐（Pact Boon）：3 级选择，待后续补全。',
};

// 资源定义（祈求为被动特性，不是独立资源）
const WARLOCK_ELDRITCH_INVOCATIONS: ClassResourceDefinition = {
  id: 'warlock_eldritch_invocations',
  nameCn: '祈求',
  nameEn: 'Eldritch Invocations',
  sourceFeature: '祈求 (Eldritch Invocations)',
  unlockLevel: 1,
  maxUses: 'table',
  maxUsesByLevel: [
    1, 3, 3, 3, 5, // 1-5
    5, 6, 6, 7, 7, // 6-10
    7, 8, 8, 8, 9, // 11-15
    9, 9, 10, 10, 10, // 16-20
  ],
  recoveryType: 'never',
  notes:
    '祈求是永久性特性选择，不消耗次数。数值表示"已选择的祈求数量上限"。' +
    '升级时可替换一个祈求为另一个已满足前提条件的祈求。' +
    '本轮不实现具体祈求列表，待后续补全。',
};

// 动作定义
const WARLOCK_ELDRITCH_BLAST_ACTION: ActionDefinition = {
  id: 'warlock_eldritch_blast',
  nameCn: '邪术爆破',
  nameEn: 'Eldritch Blast',
  sourceType: 'classFeature',
  sourceId: 'warlock_eldritch_blast',
  unlockLevel: 1,
  actionType: 'action',
  rollType: 'attack',
  duration: '即时',
  target: '120 尺内目标（1-4条光束随等级提升）',
  notes:
    '戏法（无限使用）。射线攻击：1d10 力场伤害/条光束。' +
    '11 级：2 条光束；17 级：3 条光束。（通过祈求可进一步增强）',
};

// 被动特性
const WARLOCK_DARK_ONES_BLESSING: PassiveFeatureDefinition = {
  id: 'warlock_dark_ones_blessing',
  nameCn: '黑暗祝福',
  nameEn: "Dark One's Blessing",
  sourceFeature: '天赋能力 (Otherworldly Patron)',
  unlockLevel: 1,
  affects: ['hp', 'tempHp'],
  notes:
    '（大法师契约示例）当你或同伴将敌方生物击杀时，你获得等于魅力调整值 + 邪术师等级的临时生命值。',
};

const WARLOCK_PACT_MAGIC_PASSIVE: PassiveFeatureDefinition = {
  id: 'warlock_pact_magic',
  nameCn: '契约魔法',
  nameEn: 'Pact Magic',
  sourceFeature: '契约魔法 (Pact Magic)',
  unlockLevel: 1,
  affects: ['spellcasting', 'spellSlots'],
  notes:
    '邪术师使用契约法术位而非标准法术位。' +
    '法术位数量和环级见 pactMagic 进阶表。' +
    '短休后完全恢复契约法术位。',
};

// 状态定义（暂无专属状态，祈求效果按需添加）

const WARLOCK_SOURCE_FEATURES_BY_LEVEL: string[][] = [
  ['魔能祈唤', '契约魔法'],
  ['秘法回流'],
  ['魔契师子职'],
  ['属性值提升'],
  [],
  ['子职特性'],
  [],
  ['属性值提升'],
  ['联络宗主'],
  ['子职特性'],
  ['玄奥秘法（六环）'],
  ['属性值提升'],
  ['玄奥秘法（七环）'],
  ['子职特性'],
  ['玄奥秘法（八环）'],
  ['属性值提升'],
  ['玄奥秘法（九环）'],
  [],
  ['传奇恩惠'],
  ['魔能掌控'],
];

// 构建等级进阶
function buildWarlockLevel(level: number): Dnd2024LevelProgression {
  const features: string[] = [];
  const resources: ClassResourceDefinition[] = [];
  const actions: ActionDefinition[] = [];
  const passiveFeatures: PassiveFeatureDefinition[] = [];
  const conditions: ConditionDefinition[] = [];

  if (level === 1) {
    features.push('秘主（来自守护者）', '契约魔法');
    resources.push(WARLOCK_ELDRITCH_INVOCATIONS);
    passiveFeatures.push(WARLOCK_PACT_MAGIC_PASSIVE);
  }
  if (level === 2) {
    features.push('邪术师祈求');
  }
  if (level === 3) {
    features.push('契约恩赐（Pact Boon）', '邪术师子职业特性');
  }
  if (level === 4) {
    features.push('属性值提升或通用专长');
  }
  if (level === 5) {
    features.push('邪术师祈求（增加至4个）', '契约法术位升至3环');
  }

  return {
    level,
    proficiencyBonus: profBonus(level),
    features: WARLOCK_SOURCE_FEATURES_BY_LEVEL[level - 1] ?? features,
    resources,
    actions,
    passiveFeatures,
    conditions,
    spellcasting: null, // 邪术师法术位通过 pactMagic 字段读取，不用 spellSlotTable
  };
}

const WARLOCK_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'warlock',
  classNameCn: '邪术师',
  classNameEn: 'Warlock',
  hitDie: 8,
  spellcasting: WARLOCK_SPELLCASTING,
  levels: Array.from({ length: 20 }, (_, i) => buildWarlockLevel(i + 1)),
};

// ─────────────────────────────────────────────────────────────────────────────
// ████  WIZARD（法师）
// ─────────────────────────────────────────────────────────────────────────────

// 资源定义
const WIZARD_ARCANE_RECOVERY: ClassResourceDefinition = {
  id: 'wizard_arcane_recovery',
  nameCn: '奥术回想',
  nameEn: 'Arcane Recovery',
  sourceFeature: '奥术回想 (Arcane Recovery)',
  unlockLevel: 1,
  maxUses: 1,
  recoveryType: 'special',
  notes:
    '一次短休期间（每次长休后重置）可恢复若干法术位，' +
    '恢复的法术位总环级不超过 ceil(法师等级 / 2)，' +
    '且每个法术位不超过 5 环。不可在长休期间使用。',
};

// 施法进阶
const WIZARD_SPELLCASTING: SpellcastingProgression = {
  mode: 'spellbookPrepared',
  ability: 'intelligence',
  casterType: 'full',
  cantripsKnown: [
    3, 3, 3, 4, 4, // 1-5
    4, 4, 4, 4, 5, // 6-10
    5, 5, 5, 5, 5, // 11-15
    5, 5, 5, 5, 5, // 16-20
  ],
  preparedSpellCount: [
    4, 5, 6, 7, 9, // 1-5
    10, 11, 12, 14, 15, // 6-10
    16, 16, 17, 18, 19, // 11-15
    21, 22, 23, 24, 25, // 16-20
  ],
  spellSlotTable: FULL_CASTER_SLOT_TABLE,
  pactMagic: null,
  ritualCasting: 'fromSpellbook',
  notes:
    '法师施法模式：spellbookPrepared。\n\n' +
    '【法术书 vs 已准备法术的关系】\n' +
    '- 法术书（Spellbook）：抄录的所有法师法术。1 级时书中有 6 个法术（3 个戏法 + 至少 2 个 1 环 + 额外奖励）。\n' +
    '  升级时自动学会 2 个法术加入法术书。通过抄录卷轴/其他法术书可扩充。\n' +
    '- 已准备法术（Prepared Spells）：每次长休后，从法术书中选择 "INT调整值 + 法师等级" 个法术。\n' +
    '  准备的法术可在当日使用任意法术位施展。\n' +
    '- 仪式法术（Ritual）：法术书中存在的仪式法术，即使未准备，也可花 10 分钟进行仪式施法（不消耗法术位）。\n' +
    '- 戏法不需要准备，直接从已知戏法中使用。\n\n' +
    '【奥术回能】\n' +
    '每次长休后可使用一次（短休期间使用）：恢复总环级 ≤ ceil(等级/2)、单位 ≤ 5 环的法术位。',
};

// 动作定义
const WIZARD_ARCANE_RECOVERY_ACTION: ActionDefinition = {
  id: 'wizard_arcane_recovery_use',
  nameCn: '使用奥术回能',
  nameEn: 'Use Arcane Recovery',
  sourceType: 'resource',
  sourceId: 'wizard_arcane_recovery',
  unlockLevel: 1,
  actionType: 'rest',
  rollType: 'none',
  resourceCost: { wizard_arcane_recovery: 1 },
  duration: '即时（短休期间使用）',
  target: '自身',
  notes:
    '在短休期间使用（不占用动作经济）。' +
    '恢复的法术位总环级 ≤ ceil(法师等级 / 2)。单个法术位最高 5 环。' +
    '每次长休后重置使用次数。',
};

// 被动特性
const WIZARD_SPELLBOOK_MASTERY: PassiveFeatureDefinition = {
  id: 'wizard_spellbook_mastery',
  nameCn: '法术书',
  nameEn: 'Spellbook',
  sourceFeature: '施法（法师）',
  unlockLevel: 1,
  affects: ['spellcasting', 'ritualCasting'],
  notes:
    '法师的法术书是独特的魔法典籍。' +
    '1 级开始时书中有 3 个戏法 + 6 个 1 环法术（含升级奖励）。' +
    '每次升级后书中自动增加 2 个任意环级的法师法术。' +
    '可抄录其他法术书或法术卷轴来扩充（需支付金币和时间）。' +
    '法术书中的仪式法术即使未准备也可进行仪式施法。',
};

const WIZARD_SCHOLAR: PassiveFeatureDefinition = {
  id: 'wizard_scholar',
  nameCn: '学者',
  nameEn: 'Scholar',
  sourceFeature: '学者 (Scholar)',
  unlockLevel: 2,
  affects: ['skills', 'arcana', 'history'],
  notes:
    '2 级获得。在奥术、历史、自然、宗教任选 2 个技能获得熟练。' +
    '若已熟练，则改为专精（双倍熟练加值）。',
};

const WIZARD_MEMORIZE_SPELL: PassiveFeatureDefinition = {
  id: 'wizard_memorize_spell',
  nameCn: '记忆法术',
  nameEn: 'Memorize Spell',
  sourceFeature: '记忆法术 (Memorize Spell)',
  unlockLevel: 5,
  affects: ['spellcasting', 'prepared'],
  notes:
    '5 级获得。短休后，可将一个未准备的法术（来自法术书）临时替换入已准备列表一次。' +
    '下次长休后此临时准备失效。',
};

const WIZARD_SOURCE_FEATURES_BY_LEVEL: string[][] = [
  ['施法', '仪式学家', '奥术回想'],
  ['学者'],
  ['法师子职'],
  ['属性值提升'],
  ['记忆法术'],
  ['子职特性'],
  [],
  ['属性值提升'],
  [],
  ['子职特性'],
  [],
  ['属性值提升'],
  [],
  ['子职特性'],
  [],
  ['属性值提升'],
  [],
  ['法术精通'],
  ['传奇恩惠'],
  ['招牌法术'],
];

// 构建等级进阶
function buildWizardLevel(level: number): Dnd2024LevelProgression {
  const features: string[] = [];
  const resources: ClassResourceDefinition[] = [];
  const actions: ActionDefinition[] = [];
  const passiveFeatures: PassiveFeatureDefinition[] = [];
  const conditions: ConditionDefinition[] = [];

  if (level === 1) {
    features.push('施法（法师）', '奥术回能', '法术书');
    resources.push(WIZARD_ARCANE_RECOVERY);
    actions.push(WIZARD_ARCANE_RECOVERY_ACTION);
    passiveFeatures.push(WIZARD_SPELLBOOK_MASTERY);
  }
  if (level === 2) {
    features.push('学者', '法师子职业（法术学派）');
    passiveFeatures.push(WIZARD_SCHOLAR);
  }
  if (level === 3) {
    features.push('记忆法术');
    // 注：DND 2024 记忆法术于不同版本等级有差异，此处按 2024 版本
  }
  if (level === 4) {
    features.push('属性值提升或通用专长');
  }
  if (level === 5) {
    features.push('记忆法术（激活）');
    passiveFeatures.push(WIZARD_MEMORIZE_SPELL);
  }

  return {
    level,
    proficiencyBonus: profBonus(level),
    features: WIZARD_SOURCE_FEATURES_BY_LEVEL[level - 1] ?? features,
    resources,
    actions,
    passiveFeatures,
    conditions,
    spellcasting: FULL_CASTER_SLOT_TABLE[level - 1] ?? null,
  };
}

const WIZARD_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'wizard',
  classNameCn: '法师',
  classNameEn: 'Wizard',
  hitDie: 6,
  spellcasting: WIZARD_SPELLCASTING,
  levels: Array.from({ length: 20 }, (_, i) => buildWizardLevel(i + 1)),
};

// ─────────────────────────────────────────────────────────────────────────────
// 占位职业（待后续补全）
// ─────────────────────────────────────────────────────────────────────────────

const CLERIC_CHANNEL_DIVINITY: ClassResourceDefinition = {
  id: 'cleric_channel_divinity',
  nameCn: '引导神力',
  nameEn: 'Channel Divinity',
  sourceFeature: '引导神力 (Channel Divinity)',
  unlockLevel: 2,
  maxUses: 'table',
  maxUsesByLevel: [
    0, 2, 2, 2, 2, // 1-5
    3, 3, 3, 3, 3, // 6-10
    3, 3, 3, 3, 3, // 11-15
    3, 3, 4, 4, 4, // 16-20
  ],
  recoveryType: 'special',
  notes:
    '用于驱散亡灵等牧师能力。整理资料显示短休可恢复部分使用次数、长休回满；' +
    '本轮标记为 special，避免基础休息逻辑在短休时错误回满。',
};

const DRUID_WILD_SHAPE: ClassResourceDefinition = {
  id: 'druid_wild_shape',
  nameCn: '荒野形态',
  nameEn: 'Wild Shape',
  sourceFeature: '荒野形态 (Wild Shape)',
  unlockLevel: 2,
  maxUses: 'table',
  maxUsesByLevel: [
    0, 2, 2, 2, 2, // 1-5
    3, 3, 3, 3, 3, // 6-10
    3, 3, 3, 3, 3, // 11-15
    3, 3, 4, 4, 4, // 16-20
  ],
  recoveryType: 'special',
  notes:
    '荒野形态使用次数。整理资料显示短休可恢复部分使用次数、长休回满；' +
    '本轮不实现变身形态、属性替换、临时生命值或 special recovery。',
};

const FIGHTER_SECOND_WIND: ClassResourceDefinition = {
  id: 'fighter_second_wind',
  nameCn: '回气',
  nameEn: 'Second Wind',
  sourceFeature: '回气 (Second Wind)',
  unlockLevel: 1,
  maxUses: 'table',
  maxUsesByLevel: [
    2, 2, 2, 3, 3, // 1-5
    3, 3, 3, 3, 4, // 6-10
    4, 4, 4, 4, 4, // 11-15
    4, 4, 4, 4, 4, // 16-20
  ],
  recoveryType: 'special',
  notes:
    '附赠动作恢复生命值。短休恢复 1 次、长休回满；本轮只记录资源池，不实现治疗骰或 special recovery。',
};

const FIGHTER_ACTION_SURGE: ClassResourceDefinition = {
  id: 'fighter_action_surge',
  nameCn: '动作如潮',
  nameEn: 'Action Surge',
  sourceFeature: '动作如潮 (Action Surge)',
  unlockLevel: 2,
  maxUses: 'table',
  maxUsesByLevel: [
    0, 1, 1, 1, 1, // 1-5
    1, 1, 1, 1, 1, // 6-10
    1, 1, 1, 1, 1, // 11-15
    1, 2, 2, 2, 2, // 16-20
  ],
  recoveryType: 'shortOrLongRest',
  notes:
    '在自己的回合额外获得一次动作。这里只记录使用次数，不实现动作经济。',
};

const FIGHTER_INDOMITABLE: ClassResourceDefinition = {
  id: 'fighter_indomitable',
  nameCn: '不屈',
  nameEn: 'Indomitable',
  sourceFeature: '不屈 (Indomitable)',
  unlockLevel: 9,
  maxUses: 'table',
  maxUsesByLevel: [
    0, 0, 0, 0, 0, // 1-5
    0, 0, 0, 1, 1, // 6-10
    1, 1, 2, 2, 2, // 11-15
    2, 3, 3, 3, 3, // 16-20
  ],
  recoveryType: 'longRest',
  notes:
    '失败豁免后可重掷。这里只记录使用次数，不实现豁免重掷流程。',
};

const MONK_FOCUS_POINTS: ClassResourceDefinition = {
  id: 'monk_focus_points',
  nameCn: '专注点',
  nameEn: 'Focus Points',
  sourceFeature: '专注点 (Focus Points)',
  unlockLevel: 2,
  maxUses: 'level',
  recoveryType: 'shortOrLongRest',
  notes:
    '最大值 = 武僧等级。用于武僧技艺/专注能力；本轮不实现具体动作。',
};

const PALADIN_LAY_ON_HANDS: ClassResourceDefinition = {
  id: 'paladin_lay_on_hands',
  nameCn: '圣疗池',
  nameEn: 'Lay on Hands Pool',
  sourceFeature: '圣疗 (Lay on Hands)',
  unlockLevel: 1,
  maxUses: 'manual',
  maxFormula: 'classLevelTimes5',
  recoveryType: 'longRest',
  notes:
    '治疗池最大值 = 5 × 圣武士等级。这里只记录点数，不实现治疗/解毒/疾病等具体选项。',
};

const PALADIN_CHANNEL_DIVINITY: ClassResourceDefinition = {
  id: 'paladin_channel_divinity',
  nameCn: '引导神力',
  nameEn: 'Channel Divinity',
  sourceFeature: '引导神力 (Channel Divinity)',
  unlockLevel: 3,
  maxUses: 1,
  recoveryType: 'special',
  notes:
    '用于圣武士誓言能力。恢复细节与誓言/版本资料相关，本轮标记为 special，不自动恢复。',
};

const RANGER_FAVORED_ENEMY_CHARGES: ClassResourceDefinition = {
  id: 'ranger_favored_enemy_charges',
  nameCn: '宿敌施法次数',
  nameEn: 'Favored Enemy Charges',
  sourceFeature: '宿敌 (Favored Enemy)',
  unlockLevel: 1,
  maxUses: 'proficiencyBonus',
  recoveryType: 'longRest',
  notes:
    '最大值 = 熟练加值。用于不消耗法术位施放/维持宿敌相关的 Hunter\'s Mark 支持；本轮不实现法术或专注联动。',
};

const SORCERER_INNATE_SORCERY: ClassResourceDefinition = {
  id: 'sorcerer_innate_sorcery',
  nameCn: '天生术法',
  nameEn: 'Innate Sorcery',
  sourceFeature: '天生术法 (Innate Sorcery)',
  unlockLevel: 1,
  maxUses: 2,
  recoveryType: 'longRest',
  notes:
    '每日有限次数激活术士内在魔法。这里只记录次数，不实现持续时间、法术 DC 或攻击加值。',
};

const SORCERER_SORCERY_POINTS: ClassResourceDefinition = {
  id: 'sorcerer_sorcery_points',
  nameCn: '术法点',
  nameEn: 'Sorcery Points',
  sourceFeature: '术法点 (Sorcery Points)',
  unlockLevel: 2,
  maxUses: 'level',
  recoveryType: 'longRest',
  notes:
    '最大值 = 术士等级。用于超魔和法术位转换；本轮不实现 Metamagic 或转换规则。',
};

// ─────────────────────────────────────────────────────────────────────────────
// 所有者资料源等级表：战士 / 牧师
//
// 资料源：C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\战士\战士.htm
//         C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\牧师\牧师.htm
// 这里只保留等级表中的特性名和数值列，不复制规则段落，也不实现效果。
// ─────────────────────────────────────────────────────────────────────────────

function buildSourceTableLevel(
  level: number,
  features: string[],
  resources: ClassResourceDefinition[] = [],
  spellcasting: SpellSlotProgression | null = null,
): Dnd2024LevelProgression {
  return {
    level,
    proficiencyBonus: profBonus(level),
    features,
    resources,
    actions: [],
    passiveFeatures: [],
    conditions: [],
    spellcasting,
  };
}

const FIGHTER_FEATURES_BY_LEVEL: string[][] = [
  ['战斗风格', '回气', '武器精通'],
  ['动作如潮（一次）', '战术思维'],
  ['战士子职'],
  ['属性值提升'],
  ['额外攻击', '战术转进'],
  ['属性值提升'],
  ['子职特性'],
  ['属性值提升'],
  ['不屈（一次）', '战术主宰'],
  ['子职特性'],
  ['额外攻击（二）'],
  ['属性值提升'],
  ['不屈（两次）', '究明攻击'],
  ['属性值提升'],
  ['子职特性'],
  ['属性值提升'],
  ['动作如潮（两次）', '不屈（三次）'],
  ['子职特性'],
  ['传奇恩惠'],
  ['额外攻击（三）'],
];

const FIGHTER_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'fighter',
  classNameCn: '战士',
  classNameEn: 'Fighter',
  hitDie: 10,
  spellcasting: null,
  levels: FIGHTER_FEATURES_BY_LEVEL.map((features, index) => {
    const level = index + 1;
    return buildSourceTableLevel(
      level,
      features,
      [FIGHTER_SECOND_WIND, FIGHTER_ACTION_SURGE, FIGHTER_INDOMITABLE]
        .filter(resource => resource.unlockLevel === level),
    );
  }),
};

const CLERIC_SPELLCASTING: SpellcastingProgression = {
  mode: 'fullListPrepared',
  ability: 'wisdom',
  casterType: 'full',
  cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  preparedSpellCount: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  spellSlotTable: FULL_CASTER_SLOT_TABLE,
  pactMagic: null,
  ritualCasting: 'ifPrepared',
  notes: '戏法、准备法术和法术位数量来自本机 DND 2024 牧师等级表；本数据不执行施法或准备流程。',
};

const CLERIC_FEATURES_BY_LEVEL: string[][] = [
  ['施法', '圣职'],
  ['引导神力'],
  ['牧师子职'],
  ['属性值提升'],
  ['灼净亡灵'],
  ['子职特性'],
  ['受祝击'],
  ['属性值提升'],
  [],
  ['神圣干预'],
  [],
  ['属性值提升'],
  [],
  ['精通受祝击'],
  [],
  ['属性值提升'],
  ['子职特性'],
  [],
  ['传奇恩惠'],
  ['进阶神圣干预'],
];

const CLERIC_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'cleric',
  classNameCn: '牧师',
  classNameEn: 'Cleric',
  hitDie: 8,
  spellcasting: CLERIC_SPELLCASTING,
  levels: CLERIC_FEATURES_BY_LEVEL.map((features, index) => {
    const level = index + 1;
    return buildSourceTableLevel(
      level,
      features,
      level === CLERIC_CHANNEL_DIVINITY.unlockLevel ? [CLERIC_CHANNEL_DIVINITY] : [],
      FULL_CASTER_SLOT_TABLE[index] ?? null,
    );
  }),
};

const DRUID_SPELLCASTING: SpellcastingProgression = {
  mode: 'fullListPrepared',
  ability: 'wisdom',
  casterType: 'full',
  cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  preparedSpellCount: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  spellSlotTable: FULL_CASTER_SLOT_TABLE,
  pactMagic: null,
  ritualCasting: 'ifPrepared',
  notes: '戏法、准备法术和法术位数量来自本机 DND 2024 德鲁伊等级表；本数据不执行施法、准备或变形流程。',
};

const DRUID_FEATURES_BY_LEVEL: string[][] = [
  ['德鲁伊语', '原初职能', '施法'],
  ['荒野变形', '荒野伙伴'],
  ['德鲁伊子职'],
  ['属性值提升'],
  ['荒野复苏'],
  ['子职特性'],
  ['元素之怒'],
  ['属性值提升'],
  [],
  ['子职特性'],
  [],
  ['属性值提升'],
  [],
  ['子职特性'],
  ['元素神威'],
  ['属性值提升'],
  [],
  ['兽形施法'],
  ['传奇恩惠'],
  ['大德鲁伊'],
];

const DRUID_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'druid',
  classNameCn: '德鲁伊',
  classNameEn: 'Druid',
  hitDie: 8,
  spellcasting: DRUID_SPELLCASTING,
  levels: DRUID_FEATURES_BY_LEVEL.map((features, index) => {
    const level = index + 1;
    return buildSourceTableLevel(
      level,
      features,
      level === DRUID_WILD_SHAPE.unlockLevel ? [DRUID_WILD_SHAPE] : [],
      FULL_CASTER_SLOT_TABLE[index] ?? null,
    );
  }),
};

const MONK_FEATURES_BY_LEVEL: string[][] = [
  ['武艺（1d6）', '无甲防御'],
  ['武僧武功', '无甲移动（+10尺）', '运转周天'],
  ['拨挡攻击', '武僧子职'],
  ['属性值提升', '轻身坠'],
  ['额外攻击', '震慑拳', '武艺骰提升（1d8）'],
  ['真力注拳', '子职特性', '无甲移动（+15尺）'],
  ['反射闪避'],
  ['属性值提升'],
  ['飞檐走壁'],
  ['出神入化', '返本还元', '无甲移动（+20尺）'],
  ['子职特性', '武艺骰提升（1d10）'],
  ['属性值提升'],
  ['拨挡能量'],
  ['圆融自在', '无甲移动（+25尺）'],
  ['明镜止水'],
  ['属性值提升'],
  ['子职特性', '武艺骰提升（1d12）'],
  ['无懈可击', '无甲移动（+30尺）'],
  ['传奇恩惠'],
  ['天人合一'],
];

const MONK_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'monk',
  classNameCn: '武僧',
  classNameEn: 'Monk',
  hitDie: 8,
  spellcasting: null,
  levels: MONK_FEATURES_BY_LEVEL.map((features, index) => {
    const level = index + 1;
    return buildSourceTableLevel(
      level,
      features,
      level === MONK_FOCUS_POINTS.unlockLevel ? [MONK_FOCUS_POINTS] : [],
    );
  }),
};

const HALF_CASTER_PREPARED_SPELLS = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15];

const PALADIN_SPELLCASTING: SpellcastingProgression = {
  mode: 'fullListPrepared',
  ability: 'charisma',
  casterType: 'half',
  cantripsKnown: Array.from({ length: 20 }, () => null),
  preparedSpellCount: HALF_CASTER_PREPARED_SPELLS,
  spellSlotTable: HALF_CASTER_SLOT_TABLE,
  pactMagic: null,
  ritualCasting: 'none',
  notes: '准备法术与法术位数量来自本机 DND 2024 圣武士等级表；本数据不执行准备、圣武斩或灵光效果。',
};

const PALADIN_FEATURES_BY_LEVEL: string[][] = [
  ['圣疗', '施法', '武器精通'],
  ['战斗风格', '圣武斩'],
  ['引导神力', '圣武士子职'],
  ['属性值提升'],
  ['额外攻击', '信实坐骑'],
  ['守护灵光'],
  ['子职特性'],
  ['属性值提升'],
  ['弃绝众敌'],
  ['勇气灵光'],
  ['光耀打击'],
  ['属性值提升'],
  [],
  ['复原之触'],
  ['子职特性'],
  ['属性值提升'],
  [],
  ['灵光增效'],
  ['传奇恩惠'],
  ['子职特性'],
];

const PALADIN_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'paladin',
  classNameCn: '圣武士',
  classNameEn: 'Paladin',
  hitDie: 10,
  spellcasting: PALADIN_SPELLCASTING,
  levels: PALADIN_FEATURES_BY_LEVEL.map((features, index) => {
    const level = index + 1;
    return buildSourceTableLevel(
      level,
      features,
      [PALADIN_LAY_ON_HANDS, PALADIN_CHANNEL_DIVINITY]
        .filter(resource => resource.unlockLevel === level),
      HALF_CASTER_SLOT_TABLE[index] ?? null,
    );
  }),
};

const RANGER_SPELLCASTING: SpellcastingProgression = {
  mode: 'fullListPrepared',
  ability: 'wisdom',
  casterType: 'half',
  cantripsKnown: Array.from({ length: 20 }, () => null),
  preparedSpellCount: HALF_CASTER_PREPARED_SPELLS,
  spellSlotTable: HALF_CASTER_SLOT_TABLE,
  pactMagic: null,
  ritualCasting: 'none',
  notes: '准备法术与法术位数量来自本机 DND 2024 游侠等级表；本数据不执行准备、宿敌施法或职业特性效果。',
};

const RANGER_FEATURES_BY_LEVEL: string[][] = [
  ['施法', '宿敌', '武器精通'],
  ['熟练探险家', '战斗风格'],
  ['游侠子职业'],
  ['属性值提升'],
  ['额外攻击'],
  ['越野'],
  ['子职特性'],
  ['属性值提升'],
  ['专精'],
  ['不知疲倦'],
  ['子职特性'],
  ['属性值提升'],
  ['永恒追猎'],
  ['自然面纱'],
  ['子职特性'],
  ['属性值提升'],
  ['致命猎杀'],
  ['野性感官'],
  ['传奇恩惠'],
  ['屠灭众敌'],
];

const RANGER_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'ranger',
  classNameCn: '游侠',
  classNameEn: 'Ranger',
  hitDie: 10,
  spellcasting: RANGER_SPELLCASTING,
  levels: RANGER_FEATURES_BY_LEVEL.map((features, index) => {
    const level = index + 1;
    return buildSourceTableLevel(
      level,
      features,
      level === RANGER_FAVORED_ENEMY_CHARGES.unlockLevel ? [RANGER_FAVORED_ENEMY_CHARGES] : [],
      HALF_CASTER_SLOT_TABLE[index] ?? null,
    );
  }),
};

const ROGUE_FEATURES_BY_LEVEL: string[][] = [
  ['专精', '偷袭（1d6）', '盗贼黑话', '武器精通'],
  ['灵巧动作'],
  ['游荡者子职', '稳定瞄准', '偷袭提升（2d6）'],
  ['属性值提升'],
  ['诡诈打击', '直觉闪避', '偷袭提升（3d6）'],
  ['专精'],
  ['反射闪避', '可靠才能', '偷袭提升（4d6）'],
  ['属性值提升'],
  ['子职特性', '偷袭提升（5d6）'],
  ['属性值提升'],
  ['进阶诡诈打击', '偷袭提升（6d6）'],
  ['属性值提升'],
  ['子职特性', '偷袭提升（7d6）'],
  ['凶狡打击'],
  ['圆滑心智', '偷袭提升（8d6）'],
  ['属性值提升'],
  ['子职特性', '偷袭提升（9d6）'],
  ['飘忽不定'],
  ['传奇恩惠', '偷袭提升（10d6）'],
  ['幸运一击'],
];

const ROGUE_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'rogue',
  classNameCn: '游荡者',
  classNameEn: 'Rogue',
  hitDie: 8,
  spellcasting: null,
  levels: ROGUE_FEATURES_BY_LEVEL.map((features, index) =>
    buildSourceTableLevel(index + 1, features),
  ),
};

const SORCERER_SPELLCASTING: SpellcastingProgression = {
  mode: 'fixedPreparedUpgradeReplace',
  ability: 'charisma',
  casterType: 'full',
  cantripsKnown: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  preparedSpellCount: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  spellSlotTable: FULL_CASTER_SLOT_TABLE,
  pactMagic: null,
  ritualCasting: 'none',
  notes: '戏法、准备法术和法术位数量来自本机 DND 2024 术士等级表；本数据不执行超魔、术法点转换或法术选择。',
};

const SORCERER_FEATURES_BY_LEVEL: string[][] = [
  ['施法', '天生术法'],
  ['魔力泉涌', '超魔法'],
  ['术士子职'],
  ['属性值提升'],
  ['术法复苏'],
  ['子职特性'],
  ['术法化身'],
  ['属性值提升'],
  [],
  ['超魔法'],
  [],
  ['属性值提升'],
  [],
  ['子职特性'],
  [],
  ['属性值提升'],
  ['超魔法'],
  ['子职特性'],
  ['传奇恩惠'],
  ['奥术化神'],
];

const SORCERER_PROGRESSION: Dnd2024ClassProgression = {
  classKey: 'sorcerer',
  classNameCn: '术士',
  classNameEn: 'Sorcerer',
  hitDie: 6,
  spellcasting: SORCERER_SPELLCASTING,
  levels: SORCERER_FEATURES_BY_LEVEL.map((features, index) => {
    const level = index + 1;
    return buildSourceTableLevel(
      level,
      features,
      [SORCERER_INNATE_SORCERY, SORCERER_SORCERY_POINTS]
        .filter(resource => resource.unlockLevel === level),
      FULL_CASTER_SLOT_TABLE[index] ?? null,
    );
  }),
};

function makePlaceholder(
  classKey: DndClassKey,
  classNameCn: string,
  classNameEn: string,
  hitDie: 6 | 8 | 10 | 12,
  resources: ClassResourceDefinition[] = [],
): Dnd2024ClassProgression {
  return {
    classKey,
    classNameCn,
    classNameEn,
    hitDie,
    spellcasting: null,
    levels: Array.from({ length: 20 }, (_, i) => {
      const level = i + 1;
      const levelResources = resources.filter(resource => resource.unlockLevel === level);
      return {
        level,
        proficiencyBonus: profBonus(level),
        features: levelResources.map(resource => resource.sourceFeature),
        resources: levelResources,
        actions: [],
        passiveFeatures: [],
        conditions: [],
        spellcasting: null,
        notes: `（${classNameCn} 进阶数据待后续补全）`,
      };
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 主导出：所有职业进阶数据
// ─────────────────────────────────────────────────────────────────────────────

export const DND2024_CLASS_PROGRESSIONS: Partial<Record<DndClassKey, Dnd2024ClassProgression>> = {
  barbarian: BARBARIAN_PROGRESSION,
  bard: BARD_PROGRESSION,
  warlock: WARLOCK_PROGRESSION,
  wizard: WIZARD_PROGRESSION,

  // 所有者资料源已核对的等级表
  cleric: CLERIC_PROGRESSION,
  fighter: FIGHTER_PROGRESSION,
  druid: DRUID_PROGRESSION,
  monk: MONK_PROGRESSION,
  paladin: PALADIN_PROGRESSION,
  ranger: RANGER_PROGRESSION,
  rogue: ROGUE_PROGRESSION,
  sorcerer: SORCERER_PROGRESSION,

  // 所有 12 个标准职业均已有至少一份结构化成长表；仍可能存在较早批次的高等级占位条目。
};

// 便于外部按职业名检索
export {
  BARBARIAN_PROGRESSION,
  BARD_PROGRESSION,
  WARLOCK_PROGRESSION,
  WIZARD_PROGRESSION,
  CLERIC_PROGRESSION,
  FIGHTER_PROGRESSION,
  DRUID_PROGRESSION,
  MONK_PROGRESSION,
  PALADIN_PROGRESSION,
  RANGER_PROGRESSION,
  ROGUE_PROGRESSION,
  SORCERER_PROGRESSION,
  FULL_CASTER_SLOT_TABLE,
  HALF_CASTER_SLOT_TABLE,
};
