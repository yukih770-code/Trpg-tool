import type { AttributeName, CharacterData } from '../dnd-types.js';
import type {
  DndClassKey,
  SpellPreparationMode,
  SpellSlotProgression,
  SpellcastingAbility,
} from './progression-types.js';
import {
  getClassProgression,
  getPactMagicAtLevel,
  getSpellSlotsAtLevel,
} from './progression-utils.js';

const CLASS_NAME_TO_KEY: Record<string, DndClassKey> = {
  野蛮人: 'barbarian',
  吟游诗人: 'bard',
  牧师: 'cleric',
  德鲁伊: 'druid',
  战士: 'fighter',
  武僧: 'monk',
  圣武士: 'paladin',
  游侠: 'ranger',
  游荡者: 'rogue',
  术士: 'sorcerer',
  邪术师: 'warlock',
  法师: 'wizard',
  barbarian: 'barbarian',
  bard: 'bard',
  cleric: 'cleric',
  druid: 'druid',
  fighter: 'fighter',
  monk: 'monk',
  paladin: 'paladin',
  ranger: 'ranger',
  rogue: 'rogue',
  sorcerer: 'sorcerer',
  warlock: 'warlock',
  wizard: 'wizard',
};

const ABILITY_TO_ATTR: Record<SpellcastingAbility, AttributeName> = {
  intelligence: 'Int',
  wisdom: 'Wis',
  charisma: 'Cha',
};

export type DndSpellPreparationModel = {
  classKey: DndClassKey | null;
  mode: SpellPreparationMode;
  spellcastingAbility: SpellcastingAbility | null;
  spellSlots: SpellSlotProgression | null;
  pactMagic: ReturnType<typeof getPactMagicAtLevel>;
  preparedSpellLimit: number | null;
  preparedSpellLimitFormula: string | null;
  ruleHint: string;
  deferred: string[];
  isCaster: boolean;
  isPreparedCaster: boolean;
  usesSpellbook: boolean;
  isApproximation: boolean;
};

function getClassKeyForCharacter(character: CharacterData): DndClassKey | null {
  return CLASS_NAME_TO_KEY[character.jobClass] ?? null;
}

function getAbilityModifier(character: CharacterData, ability: SpellcastingAbility): number {
  const attr = ABILITY_TO_ATTR[ability];
  const stat = character.attrs[attr];
  const score = stat.base + stat.pointbuy + stat.racebonus + (stat.extrabonus || 0);
  return Math.floor((score - 10) / 2);
}

export function getDndSpellPreparationModel(character: CharacterData): DndSpellPreparationModel {
  const classKey = getClassKeyForCharacter(character);
  const progression = classKey ? getClassProgression(classKey) : null;
  const spellcasting = progression?.spellcasting ?? null;

  if (!classKey || !spellcasting) {
    return {
      classKey,
      mode: 'none',
      spellcastingAbility: null,
      spellSlots: null,
      pactMagic: null,
      preparedSpellLimit: null,
      preparedSpellLimitFormula: null,
      ruleHint: '非施法职业或当前职业尚未接入 DND 2024 施法进阶。',
      deferred: ['完整职业法术列表与子职业法术来源后续整理。'],
      isCaster: false,
      isPreparedCaster: false,
      usesSpellbook: false,
      isApproximation: false,
    };
  }

  const levelIndex = Math.max(0, Math.min(19, character.level - 1));
  const mode = spellcasting.mode;
  const tableLimit = spellcasting.preparedSpellCount[levelIndex] ?? null;
  const formula = spellcasting.preparedSpellFormula ?? null;
  const isFormulaBased = tableLimit === null && Boolean(formula);
  const abilityModifier = getAbilityModifier(character, spellcasting.ability);
  const preparedSpellLimit = tableLimit ?? (isFormulaBased ? Math.max(1, character.level + abilityModifier) : null);
  const usesSpellbook = mode === 'spellbookPrepared';
  const isPreparedCaster = mode === 'fullListPrepared' || mode === 'spellbookPrepared';
  const deferred = [
    '完整官方法术列表、子职业赠法术与法术来源规则后续实现。',
  ];

  if (usesSpellbook) {
    deferred.push('法师完整法术书抄录、卷轴费用、升级自动加入法术等工作流仍 deferred。');
  }

  if (mode === 'pactMagicFixedPrepared') {
    deferred.push('契约魔法施法消耗路径与标准法术位选择仍 deferred。');
  }

  return {
    classKey,
    mode,
    spellcastingAbility: spellcasting.ability,
    spellSlots: getSpellSlotsAtLevel(classKey, character.level),
    pactMagic: getPactMagicAtLevel(classKey, character.level),
    preparedSpellLimit,
    preparedSpellLimitFormula: formula,
    ruleHint: isFormulaBased
      ? `${formula}；当前 v1 使用 等级 + 施法属性调整值 的近似上限。`
      : formula ?? '使用职业进阶表中的固定已知/准备法术数量。',
    deferred,
    isCaster: spellcasting.casterType !== 'none' && spellcasting.casterType !== 'featureOnly',
    isPreparedCaster,
    usesSpellbook,
    isApproximation: isFormulaBased,
  };
}
