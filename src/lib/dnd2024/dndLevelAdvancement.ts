import type { AttributeName, CharacterData, ClassDef } from '../dnd-types';
import { getDndClassAdvancementSummary, type DndClassAdvancementSummary } from './classAdvancementSummary';
import {
  canAllocateDndClassLevel,
  getDndClassLevelAllocation,
  incrementDndClassLevel,
  normalizeDndClassLevels,
  type DndClassLevelTarget,
} from './multiclass';
import { getPactMagicAtLevel, getSpellSlotsAtLevel } from './progression-utils';
import type { DndClassKey, SpellSlotProgression } from './progression-types';
import { refreshClassResourcesForClass } from './resource-utils';

export type DndLevelAdvancementIssueCode =
  | 'missing-target-class'
  | 'character-level-cap'
  | 'class-level-cap'
  | 'subclass-required'
  | 'advancement-choice-required'
  | 'conflicting-advancement-choice'
  | 'ability-score-cap'
  | 'duplicate-feat'
  | 'feat-prerequisite'
  | 'multiclass-prerequisites-unverified'
  | 'combined-spellcasting-deferred'
  | 'multiclass-automation-deferred'
  | 'spell-selection-review-required'
  | 'personal-class-manual-review';

export type DndLevelAdvancementIssue = {
  code: DndLevelAdvancementIssueCode;
  severity: 'blocker' | 'warning';
  message: string;
};

export type DndLevelAdvancementChoice = {
  targetClass?: DndClassLevelTarget;
  selectedSubclass?: string;
  abilityScoreIncreases?: AttributeName[];
  feat?: string;
  featEligible?: boolean;
};

export type DndLevelAdvancementPlan = {
  actorId: string;
  baseLevel: number;
  baseFingerprint: string;
  targetClassName: string;
  currentClassLevel: number;
  nextClassLevel: number;
  nextTotalLevel: number;
  hpIncrease: number;
  requiresAdvancementChoice: boolean;
  summary: DndClassAdvancementSummary;
  issues: DndLevelAdvancementIssue[];
  ready: boolean;
  nextCharacter?: CharacterData;
};

export type DndLevelAdvancementReceipt = {
  id: string;
  actorId: string;
  committedAt: number;
  targetClassName: string;
  fromTotalLevel: number;
  toTotalLevel: number;
  before: CharacterData;
  after: CharacterData;
};

const CLASS_KEY_BY_NAME: Record<string, DndClassKey> = {
  野蛮人: 'barbarian', 吟游诗人: 'bard', 牧师: 'cleric', 德鲁伊: 'druid',
  战士: 'fighter', 武僧: 'monk', 圣武士: 'paladin', 游侠: 'ranger',
  游荡者: 'rogue', 术士: 'sorcerer', 邪术师: 'warlock', 法师: 'wizard',
};

const SLOT_KEYS: Array<keyof SpellSlotProgression> = [
  'level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7', 'level8', 'level9',
];

function getClassKey(classDef?: ClassDef): DndClassKey | undefined {
  if (!classDef) return undefined;
  const canonicalId = classDef.id?.replace(/^class\./, '') as DndClassKey | undefined;
  return canonicalId && Object.values(CLASS_KEY_BY_NAME).includes(canonicalId)
    ? canonicalId
    : CLASS_KEY_BY_NAME[classDef.name];
}

function attributeScore(character: CharacterData, attribute: AttributeName): number {
  const value = character.attrs[attribute];
  return value.base + value.pointbuy + value.racebonus + value.extrabonus;
}

function updateStandardSlots(
  character: CharacterData,
  classKey: DndClassKey | undefined,
  classLevel: number,
): CharacterData['spellbook']['slots'] {
  if (!classKey) return character.spellbook.slots;
  const progression = getSpellSlotsAtLevel(classKey, classLevel);
  if (!progression) return character.spellbook.slots;

  const next: CharacterData['spellbook']['slots'] = {};
  SLOT_KEYS.forEach((key, index) => {
    const max = progression[key];
    if (max <= 0) return;
    const slotLevel = index + 1;
    const previous = character.spellbook.slots[slotLevel];
    const previousMax = previous?.max ?? 0;
    const previousCurrent = previous?.current ?? 0;
    next[slotLevel] = {
      max,
      // Preserve already-spent slots while making newly gained capacity usable.
      current: Math.min(max, previousCurrent + Math.max(0, max - previousMax)),
    };
  });
  return next;
}

function applyTargetClassResources(
  character: CharacterData,
  className: string,
  classLevel: number,
  classKey: DndClassKey | undefined,
): Pick<CharacterData, 'classResources' | 'pactMagicState'> {
  const refreshed = refreshClassResourcesForClass(character, className, classLevel);
  if (classKey !== 'warlock') {
    return { classResources: refreshed.classResources, pactMagicState: character.pactMagicState };
  }

  const pact = getPactMagicAtLevel('warlock', classLevel);
  if (!pact) return { classResources: refreshed.classResources, pactMagicState: character.pactMagicState };
  const previous = character.pactMagicState;
  return {
    classResources: refreshed.classResources,
    pactMagicState: {
      current: Math.min(pact.slots, (previous?.current ?? 0) + Math.max(0, pact.slots - (previous?.max ?? 0))),
      max: pact.slots,
      slotLevel: pact.slotLevel,
      recoveryType: pact.recoveryType,
      notes: refreshed.pactMagicState?.notes,
    },
  };
}

export function buildDndLevelAdvancementPlan(input: {
  character: CharacterData;
  classDef?: ClassDef;
  choice: DndLevelAdvancementChoice;
}): DndLevelAdvancementPlan {
  const { character, classDef, choice } = input;
  const target = choice.targetClass;
  const primary = { className: character.jobClass, level: character.level, subclass: character.subclass };
  const allocations = normalizeDndClassLevels(character.classLevels, primary);
  const allocation = target ? getDndClassLevelAllocation(allocations, target) : undefined;
  const currentClassLevel = allocation?.level ?? 0;
  const summary = getDndClassAdvancementSummary({
    classDef,
    currentLevel: currentClassLevel,
    hasSelectedSubclass: Boolean(allocation?.subclass || (target?.className === character.jobClass && character.subclass)),
  });
  const issues: DndLevelAdvancementIssue[] = [];
  const add = (code: DndLevelAdvancementIssueCode, severity: DndLevelAdvancementIssue['severity'], message: string) => {
    issues.push({ code, severity, message });
  };

  if (!target || !classDef) add('missing-target-class', 'blocker', '请选择一个可用职业。');
  if (target) {
    const check = canAllocateDndClassLevel(allocations, target);
    if (check.reason === 'character-level-cap') add('character-level-cap', 'blocker', '角色总等级已达 20。');
    if (check.reason === 'class-level-cap') add('class-level-cap', 'blocker', '目标职业等级已达 20。');
  }

  const selectedSubclass = choice.selectedSubclass?.trim();
  if (summary.subclassOptions.length > 0 && !selectedSubclass) {
    add('subclass-required', 'blocker', '本级需要选择子职业。');
  }

  const requiresAdvancementChoice = summary.features.some((feature) => feature.name.includes('属性值提升'));
  const asi = choice.abilityScoreIncreases ?? [];
  const feat = choice.feat?.trim();
  if (requiresAdvancementChoice && asi.length === 0 && !feat) {
    add('advancement-choice-required', 'blocker', '请选择两点属性提升或一个通用专长。');
  }
  if (asi.length > 0 && feat) add('conflicting-advancement-choice', 'blocker', '属性提升与通用专长只能选择一项。');
  if (requiresAdvancementChoice && asi.length > 0 && asi.length !== 2) {
    add('advancement-choice-required', 'blocker', '属性提升必须分配恰好两点。');
  }
  if (asi.some((attribute) => attributeScore(character, attribute) + asi.filter((item) => item === attribute).length > 20)) {
    add('ability-score-cap', 'blocker', '属性提升不能使属性值超过 20。');
  }
  if (feat && character.feats.includes(feat)) add('duplicate-feat', 'blocker', '角色已经拥有该专长。');
  if (feat && choice.featEligible === false) add('feat-prerequisite', 'blocker', '角色不满足该专长当前声明的前置条件。');

  const isNewClass = Boolean(target && !allocation);
  const nextAllocations = target
    ? incrementDndClassLevel(allocations, { ...target, subclass: selectedSubclass || allocation?.subclass }, primary)
    : allocations;
  const isMulticlass = nextAllocations.length > 1;
  if (isNewClass) add('multiclass-prerequisites-unverified', 'warning', '兼职前置条件尚未自动判定，提交房间时仍由主持人审核。');
  if (isMulticlass) {
    add('combined-spellcasting-deferred', 'warning', '多职业联合施法位尚未自动合并，本次保留现有标准法术位。');
    add('multiclass-automation-deferred', 'warning', '复杂多职业特性效果不会自动结算。');
  }
  if (summary.coverage === 'personal') add('personal-class-manual-review', 'warning', summary.coverageNote || '个人职业规则需人工复核。');

  const conMod = Math.floor((attributeScore(character, 'Con') - 10) / 2);
  const hpIncrease = Math.max(1, summary.averageHitPointIncrease + conMod);
  const blockers = issues.filter((issue) => issue.severity === 'blocker');
  let nextCharacter: CharacterData | undefined;

  if (blockers.length === 0 && target && classDef) {
    const nextTotalLevel = character.level + 1;
    const nextClassLevel = currentClassLevel + 1;
    const nextAttrs = { ...character.attrs };
    asi.forEach((attribute) => {
      nextAttrs[attribute] = { ...nextAttrs[attribute], extrabonus: nextAttrs[attribute].extrabonus + 1 };
    });
    const classKey = getClassKey(classDef);
    const standardSlots = isMulticlass
      ? character.spellbook.slots
      : updateStandardSlots(character, classKey, nextClassLevel);
    const baseNext: CharacterData = {
      ...character,
      level: nextTotalLevel,
      classLevels: nextAllocations,
      hpMax: character.hpMax + hpIncrease,
      hpCurrent: character.hpCurrent + hpIncrease,
      hitDiceCurrent: character.hitDiceCurrent + 1,
      subclass: target.className === character.jobClass ? (selectedSubclass || character.subclass) : character.subclass,
      attrs: nextAttrs,
      feats: feat ? [...character.feats, feat] : character.feats,
      spellbook: { ...character.spellbook, slots: standardSlots },
    };
    const resources = applyTargetClassResources(baseNext, target.className, nextClassLevel, classKey);
    nextCharacter = { ...baseNext, ...resources };
    const slotsChanged = JSON.stringify(standardSlots) !== JSON.stringify(character.spellbook.slots);
    if (slotsChanged) add('spell-selection-review-required', 'warning', '法术位已按本地职业进阶表更新；已知与准备法术仍需在法术书中复核。');
  }

  return {
    actorId: character.id,
    baseLevel: character.level,
    baseFingerprint: JSON.stringify(character),
    targetClassName: target?.className ?? '',
    currentClassLevel,
    nextClassLevel: currentClassLevel + 1,
    nextTotalLevel: character.level + 1,
    hpIncrease,
    requiresAdvancementChoice,
    summary,
    issues,
    ready: blockers.length === 0 && Boolean(nextCharacter),
    nextCharacter,
  };
}

export function makeDndLevelAdvancementReceipt(
  before: CharacterData,
  plan: DndLevelAdvancementPlan,
  committedAt = Date.now(),
): DndLevelAdvancementReceipt | null {
  if (!plan.ready || !plan.nextCharacter) return null;
  return {
    id: `dnd-level-${before.id}-${committedAt}`,
    actorId: before.id,
    committedAt,
    targetClassName: plan.targetClassName,
    fromTotalLevel: before.level,
    toTotalLevel: plan.nextCharacter.level,
    before,
    after: plan.nextCharacter,
  };
}

export function canUndoDndLevelAdvancement(
  current: CharacterData,
  receipt?: DndLevelAdvancementReceipt | null,
): boolean {
  return Boolean(receipt && receipt.actorId === current.id && JSON.stringify(receipt.after) === JSON.stringify(current));
}
