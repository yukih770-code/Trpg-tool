/**
 * DND 2024 Progression Types
 *
 * 纯规则数据模型类型定义。
 * 这些类型描述"规则是什么"，不描述"角色当前状态是什么"。
 * 不要将这些类型加入 CharacterData。
 *
 * 本文件不依赖任何 React、Zustand 或现有 dnd-types.ts 内容。
 */

// ─────────────────────────────────────────────────────────────────────────────
// 基础枚举 / Union Types
// ─────────────────────────────────────────────────────────────────────────────

/** 12 个标准职业的标识键 */
export type DndClassKey =
  | 'barbarian'
  | 'bard'
  | 'cleric'
  | 'druid'
  | 'fighter'
  | 'monk'
  | 'paladin'
  | 'ranger'
  | 'rogue'
  | 'sorcerer'
  | 'warlock'
  | 'wizard';

/**
 * 职业资源的恢复类型
 * - shortRest: 短休恢复（如邪术师法术位、武僧专注点）
 * - longRest: 长休恢复（如狂暴次数、诗人激励 1-4 级）
 * - shortOrLongRest: 短休或长休均可恢复
 * - turn: 每回合自动刷新（如偷袭机会）
 * - manual: 由 KP/玩家手动重置（如某些传奇动作）
 * - special: 特殊规则恢复（如法师奥术回能：一次短休）
 * - never: 不恢复（如永久性选择、一次性特性）
 */
export type ClassResourceRecoveryType =
  | 'shortRest'
  | 'longRest'
  | 'shortOrLongRest'
  | 'turn'
  | 'manual'
  | 'special'
  | 'never';

/**
 * 法术准备模式
 * - none: 非施法职业
 * - fullListPrepared: 每日从完整职业法术列表准备（牧师、德鲁伊）
 * - fixedPreparedUpgradeReplace: 已知固定数量法术，升级时可替换（吟游诗人、术士、邪术师-法术部分）
 * - spellbookPrepared: 须先抄录到法术书，再从书中每日准备（法师）
 * - pactMagicFixedPrepared: 契约魔法模式，固定已知，短休恢复位（邪术师）
 * - featureGrantedOnly: 仅通过特性、子职业、传承等方式获得法术（战士魔导武士子职）
 */
export type SpellPreparationMode =
  | 'none'
  | 'fullListPrepared'
  | 'fixedPreparedUpgradeReplace'
  | 'spellbookPrepared'
  | 'pactMagicFixedPrepared'
  | 'featureGrantedOnly';

/** 施法属性 */
export type SpellcastingAbility =
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

/**
 * 法术来源类型
 * - classSpellList: 职业标准法术列表
 * - subclassFeature: 子职业特性赠予（始终准备，不占名额）
 * - domainSpell: 领域法术（牧师）
 * - oath: 誓言法术（圣武士）
 * - eldritchInvocation: 邪术师祈求
 * - spellbook: 法师法术书抄录
 * - feat: 通过专长获得
 * - racial: 种族特性
 * - other: 其他来源
 */
export type SpellSourceType =
  | 'classSpellList'
  | 'subclassFeature'
  | 'domainSpell'
  | 'oath'
  | 'eldritchInvocation'
  | 'spellbook'
  | 'feat'
  | 'racial'
  | 'other';

/**
 * 动作类型（DND 2024）
 * - action: 主动作
 * - bonusAction: 附赠动作
 * - reaction: 反应
 * - passive: 被动特性，无需激活
 * - special: 特殊动作类型（如传奇动作）
 * - rest: 休息相关操作（如奥术回能）
 */
export type ActionType =
  | 'action'
  | 'bonusAction'
  | 'reaction'
  | 'passive'
  | 'special'
  | 'rest';

/** 动作来源类型 */
export type ActionSourceType =
  | 'classFeature'
  | 'subclassFeature'
  | 'resource'       // 消耗某个资源来使用
  | 'spell'
  | 'item'
  | 'feat'
  | 'racial'
  | 'other';

/**
 * 投骰类型
 * - none: 无骰（如激活狂暴）
 * - attack: 攻击骰（d20 + 攻击加值）
 * - damage: 伤害骰
 * - healing: 恢复骰
 * - savingThrow: 豁免骰（对手方）
 * - abilityCheck: 属性检定
 * - skillCheck: 技能检定
 */
export type RollType =
  | 'none'
  | 'attack'
  | 'damage'
  | 'healing'
  | 'savingThrow'
  | 'abilityCheck'
  | 'skillCheck';

/** 状态持续类型 */
export type ConditionDurationType =
  | 'untilEndOfTurn'
  | 'untilStartOfNextTurn'
  | 'concentration'
  | 'rounds'
  | 'minutes'
  | 'hours'
  | 'untilDispelled'
  | 'special';

// ─────────────────────────────────────────────────────────────────────────────
// 法术位进阶表
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 某等级的法术位数量（9 个环位）
 * 0 表示该环位在此等级不可用
 */
export interface SpellSlotProgression {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  level6: number;
  level7: number;
  level8: number;
  level9: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 契约魔法（Pact Magic）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 邪术师契约魔法进阶表
 * pactSlots: 每等级可用的契约法术位数量（index 0 = 1级，length = 20）
 * pactSlotLevel: 每等级契约法术位的环级（index 0 = 1级）
 * recoveryType: 始终为 shortRest（DND 2024）
 */
export interface PactMagicProgression {
  /** 每等级的契约位数，length=20，index=level-1 */
  pactSlots: number[];
  /** 每等级契约位的环级，length=20，index=level-1 */
  pactSlotLevel: number[];
  recoveryType: ClassResourceRecoveryType;
}

// ─────────────────────────────────────────────────────────────────────────────
// 施法进阶
// ─────────────────────────────────────────────────────────────────────────────

/**
 * casterType 说明：
 * - none: 非施法者（野蛮人、战士基础等）
 * - full: 全施法者（法师、吟游诗人、牧师、德鲁伊、术士）
 * - half: 半施法者（圣武士、游侠），从2级起进阶，每两级提升一格
 * - third: 三分之一施法者（战士魔导武士子职、游荡者奥秘骗师子职）
 * - pact: 契约魔法施法者（邪术师），使用独立的 Pact Magic 规则
 * - featureOnly: 仅特性/子职业赠予法术，不独立施法（部分子职）
 */
export type CasterType = 'none' | 'full' | 'half' | 'third' | 'pact' | 'featureOnly';

/**
 * 施法进阶定义（不可变规则数据）
 */
export interface SpellcastingProgression {
  mode: SpellPreparationMode;
  ability: SpellcastingAbility;
  casterType: CasterType;

  /**
   * 已知/可准备戏法数量表
   * index = level - 1（length = 20）
   * null 表示无戏法进阶
   */
  cantripsKnown: (number | null)[];

  /**
   * 每等级可准备/已知法术数量表
   * 对 fullListPrepared：= 施法属性调整值 + 等级（运行时计算，此处写描述字符串）
   * 对 fixedPreparedUpgradeReplace：固定数字
   * 对 spellbookPrepared：= 智力调整值 + 等级（运行时计算）
   * index = level - 1（length = 20）
   *
   * 使用 null 表示由公式计算（运行时），number 表示固定值
   * 附带说明字段 preparedSpellFormula 描述公式
   */
  preparedSpellCount: (number | null)[];

  /**
   * 公式描述（可选）
   * 例："INT modifier + wizard level"
   * 运行时实现时读取此说明决定计算方式
   */
  preparedSpellFormula?: string;

  /**
   * 全施法者法术位进阶表（index = level - 1，length = 20）
   * pact 类型施法者不使用此字段（用 pactMagic 替代）
   * null 表示该等级无法术位（尚未解锁或非施法者）
   */
  spellSlotTable: (SpellSlotProgression | null)[];

  /**
   * 邪术师契约魔法（仅 casterType = pact 时使用）
   * 其他职业此字段为 null
   */
  pactMagic: PactMagicProgression | null;

  /**
   * 仪式施法规则说明
   * - "fromSpellbook": 只需在法术书中有该法术，无需准备（法师）
   * - "ifPrepared": 需要准备（吟游诗人、牧师、德鲁伊）
   * - "none": 不支持仪式施法
   */
  ritualCasting: 'fromSpellbook' | 'ifPrepared' | 'none';

  /** 补充说明 */
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 职业资源
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 职业资源上限的表达方式
 * - number: 固定数值（如战士 1 次激励）
 * - 'proficiencyBonus': = 熟练加值（运行时计算）
 * - 'level': = 等级（如邪术师超魔点数量 = 等级）
 * - 'table': 见 maxUsesByLevel 字段
 * - 'manual': KP 手动设置
 * - 'unlimited': 无上限（如高等级野蛮人狂暴次数）
 */
export type ResourceMaxExpression =
  | number
  | 'proficiencyBonus'
  | 'level'
  | 'table'
  | 'manual'
  | 'unlimited';

export type ResourceMaxFormula =
  | 'charismaModifierMin1'
  | 'classLevel'
  | 'classLevelTimes5';

/**
 * 职业资源定义（不可变规则数据）
 *
 * 描述一个职业拥有的可量化资源（次数、点数、骰子等）。
 * 不存储当前值（current），current 存在 CharacterData.classResources 里（待 v1 实现）。
 */
export interface ClassResourceDefinition {
  /** 唯一键，如 "barbarian_rage"，用于 CharacterData 中的 ResourceState 对应 */
  id: string;
  nameCn: string;
  nameEn: string;
  /** 此资源来自哪个特性 */
  sourceFeature: string;
  /** 解锁等级 */
  unlockLevel: number;
  /**
   * 最大使用次数
   * 若为 'table'，参见 maxUsesByLevel
   */
  maxUses: ResourceMaxExpression;
  /**
   * Runtime formula for resource maximums that depend on character attributes
   * or level. When present, initialisation should use this formula instead of
   * the descriptive maxUses value.
   */
  maxFormula?: ResourceMaxFormula;
  /**
   * 每等级的最大使用次数（当 maxUses = 'table' 时使用）
   * index = level - 1，length = 20
   * 0 表示该等级尚未解锁
   */
  maxUsesByLevel?: (number | string)[];
  recoveryType: ClassResourceRecoveryType;
  /**
   * 关联骰面（如诗人激励骰从 d6 升至 d12）
   * index = level - 1，length = 20
   * null 表示无骰（纯次数资源）
   */
  dice?: (string | null)[];
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 动作定义
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 动作定义（不可变规则数据）
 *
 * 描述一个可执行的动作（主动激活类特性）。
 * 本轮不接入 Action Registry，仅作为数据定义。
 */
export interface ActionDefinition {
  id: string;
  nameCn: string;
  nameEn: string;
  sourceType: ActionSourceType;
  /** 来源特性/资源 ID（如 "barbarian_rage"） */
  sourceId: string;
  unlockLevel: number;
  actionType: ActionType;
  rollType: RollType;
  /**
   * 消耗的资源
   * key = resourceId，value = 消耗数量
   */
  resourceCost?: Record<string, number>;
  /**
   * 触发条件（如 "当你受到伤害时"）
   * 用于 reaction 类动作
   */
  trigger?: string;
  /** 持续时间描述 */
  duration?: string;
  /** 目标描述 */
  target?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 被动特性定义
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 被动特性定义（不可变规则数据）
 *
 * 描述无需主动激活、持续生效的规则修饰。
 * 本轮不接入角色计算，仅作为数据定义。
 */
export interface PassiveFeatureDefinition {
  id: string;
  nameCn: string;
  nameEn: string;
  /** 来源特性名 */
  sourceFeature: string;
  unlockLevel: number;
  /**
   * 影响的属性或系统（自由描述，供未来 UI 筛选用）
   * 例：["ac", "speed", "attack", "damage"]
   */
  affects: string[];
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 状态定义
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 状态/效果定义（不可变规则数据）
 *
 * 描述可施加在角色/目标上的规则状态（Condition / Effect）。
 * 本轮不接入状态追踪 UI，仅作为数据定义。
 */
export interface ConditionDefinition {
  id: string;
  nameCn: string;
  nameEn: string;
  /** 触发来源（如 "barbarian_rage"） */
  source: string;
  durationType: ConditionDurationType;
  /**
   * 效果描述列表
   * 每条描述一个规则效果
   */
  effects: string[];
  /**
   * 结束条件描述
   * 例："战斗结束、穿上重甲、被击倒"
   */
  endsWhen?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 法术相关条目
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 已准备法术条目（角色运行时用，此处仅作类型定义）
 * 用于未来 CharacterData 扩展，本轮不接入
 */
export interface PreparedSpellEntry {
  spellId: string;
  source: SpellSourceType;
  isPrepared: boolean;
  /** 始终准备（不占准备名额，如领域法术、誓言法术） */
  isAlwaysPrepared: boolean;
  /** 是否计入准备法术上限 */
  doesCountAgainstPreparedLimit: boolean;
  notes?: string;
}

/**
 * 法术书条目（法师专用，角色运行时用，本轮不接入）
 */
export interface SpellbookEntry {
  spellId: string;
  source: SpellSourceType;
  /** 是否为仪式法术 */
  isRitual: boolean;
  /** 抄录来源说明（如"从卷轴抄录"、"升级奖励"） */
  copiedFrom?: string;
  notes?: string;
}

/**
 * 始终准备法术定义（规则数据，描述哪些法术对某职业是 always prepared）
 * 例：圣武士誓言法术、牧师领域法术
 */
export interface AlwaysPreparedSpellDefinition {
  spellId: string;
  source: SpellSourceType;
  /** 解锁等级（子职业等级，若来自子职） */
  unlockLevel: number;
  doesCountAgainstPreparedLimit: boolean;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 等级进阶条目
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 某职业在某等级的进阶数据
 */
export interface Dnd2024LevelProgression {
  level: number;
  /** 熟练加值（1-4级=+2, 5-8级=+3, 9-12级=+4, 13-16级=+5, 17-20级=+6） */
  proficiencyBonus: number;
  /**
   * 本等级解锁的特性名称列表（用于 UI 展示）
   * 例：["狂暴", "无甲防御"]
   */
  features: string[];
  /**
   * 本等级生效的职业资源定义（含首次解锁和已有资源的等级变化）
   * 引用 ClassResourceDefinition.id
   */
  resources: ClassResourceDefinition[];
  /**
   * 本等级可用的动作定义
   */
  actions: ActionDefinition[];
  /**
   * 本等级生效的被动特性
   */
  passiveFeatures: PassiveFeatureDefinition[];
  /**
   * 本等级可施加的状态定义
   */
  conditions: ConditionDefinition[];
  /**
   * 本等级的施法进阶快照（null = 非施法职业或本等级无变化时可省略）
   * 注意：完整的施法进阶在 Dnd2024ClassProgression.spellcasting 中
   * 这里只放本等级法术位快照（方便 getLevelProgression 直接读取）
   */
  spellcasting: SpellSlotProgression | null;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 职业进阶主体
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 某职业的完整 DND 2024 进阶数据
 */
export interface Dnd2024ClassProgression {
  classKey: DndClassKey;
  classNameCn: string;
  classNameEn: string;
  /** 命中骰面数 */
  hitDie: 6 | 8 | 10 | 12;
  /**
   * 施法系统定义（非施法职业为 null）
   */
  spellcasting: SpellcastingProgression | null;
  /**
   * 1-20 级进阶数据
   * index = level - 1
   * 本轮样例职业只填 1-5 级，其余等级可为简化占位
   */
  levels: Dnd2024LevelProgression[];
}
