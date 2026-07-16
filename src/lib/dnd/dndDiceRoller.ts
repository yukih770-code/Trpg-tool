import type {
  DndAttackResult,
  DndCheckKind,
  DndCheckResult,
  DndDamageResult,
  DndDiceGroup,
  DndDiceRoll,
  DndFormulaRollResult,
  DndRollMode,
  DndRollRandom,
  DndRuntimeEventDraft,
  ParsedDndDiceFormula,
} from './dndDiceTypes';

const MAX_FORMULA_LENGTH = 80;
const MAX_DICE = 100;
const MAX_SIDES = 1000;
const MAX_GROUPS = 12;

export class DndDiceFormulaError extends Error {}

function fail(message: string): never {
  throw new DndDiceFormulaError(message);
}

function asSafeInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value)) fail(`Invalid ${label}.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) fail(`Invalid ${label}.`);
  return parsed;
}

export function parseDndDiceFormula(input: string): ParsedDndDiceFormula {
  const formula = input.replace(/\s+/g, '');
  if (!formula || formula.length > MAX_FORMULA_LENGTH) fail('Formula is empty or too long.');

  const diceGroups: DndDiceGroup[] = [];
  let modifier = 0;
  let cursor = 0;
  let sign: 1 | -1 = 1;
  let totalDice = 0;

  while (cursor < formula.length) {
    if (formula[cursor] === '+') {
      sign = 1;
      cursor += 1;
    } else if (formula[cursor] === '-') {
      sign = -1;
      cursor += 1;
    } else if (cursor > 0) {
      fail('Formula terms must use + or -.');
    }

    const remainder = formula.slice(cursor);
    const diceMatch = /^(\d*)d(\d+)/i.exec(remainder);
    const numberMatch = /^(\d+)/.exec(remainder);
    if (diceMatch) {
      const count = diceMatch[1] ? asSafeInteger(diceMatch[1], 'dice count') : 1;
      const sides = asSafeInteger(diceMatch[2], 'dice sides');
      if (count < 1 || sides < 2 || sides > MAX_SIDES) fail('Dice count or sides are outside the supported range.');
      totalDice += count;
      if (totalDice > MAX_DICE || diceGroups.length >= MAX_GROUPS) fail('Formula has too many dice.');
      diceGroups.push({ count, sides, sign });
      cursor += diceMatch[0].length;
    } else if (numberMatch) {
      modifier += sign * asSafeInteger(numberMatch[1], 'modifier');
      cursor += numberMatch[0].length;
    } else {
      fail('Formula contains an unsupported term.');
    }
    sign = 1;
  }

  if (diceGroups.length === 0) fail('Formula needs at least one dice group.');
  return { formula, diceGroups, modifier };
}

function rollDie(sides: number, random: DndRollRandom): number {
  const value = random();
  if (!Number.isFinite(value)) fail('Random source returned an invalid value.');
  return Math.min(sides, Math.max(1, Math.floor(value * sides) + 1));
}

function rollGroup(group: DndDiceGroup, random: DndRollRandom, multiplier = 1): DndDiceRoll {
  const rolls = Array.from({ length: group.count * multiplier }, () => rollDie(group.sides, random));
  const subtotal = rolls.reduce((sum, roll) => sum + roll, 0) * group.sign;
  return { group, rolls, subtotal };
}

export function rollDndDiceFormula(input: string, random: DndRollRandom = Math.random, options: { critical?: boolean } = {}): DndFormulaRollResult {
  const parsed = parseDndDiceFormula(input);
  const multiplier = options.critical ? 2 : 1;
  const dice = parsed.diceGroups.map((group) => rollGroup(group, random, multiplier));
  const total = dice.reduce((sum, item) => sum + item.subtotal, parsed.modifier);
  return { formula: parsed.formula, parsed, dice, modifier: parsed.modifier, total };
}

function rollD20(mode: DndRollMode, random: DndRollRandom): { rawRolls: number[]; keptRoll: number } {
  const rawRolls = mode === 'normal' ? [rollDie(20, random)] : [rollDie(20, random), rollDie(20, random)];
  const keptRoll = mode === 'advantage' ? Math.max(...rawRolls) : mode === 'disadvantage' ? Math.min(...rawRolls) : rawRolls[0];
  return { rawRolls, keptRoll };
}

export function rollDndCheck(input: {
  kind: DndCheckKind;
  actorName?: string;
  label?: string;
  mode?: DndRollMode;
  modifier?: number;
  dc?: number;
}, random: DndRollRandom = Math.random): DndCheckResult {
  const mode = input.mode ?? 'normal';
  const modifier = Number.isFinite(input.modifier) ? Math.trunc(input.modifier ?? 0) : 0;
  const dc = Number.isFinite(input.dc) ? Math.trunc(input.dc as number) : undefined;
  const { rawRolls, keptRoll } = rollD20(mode, random);
  const total = keptRoll + modifier;
  return {
    kind: input.kind,
    actorName: input.actorName?.trim() || undefined,
    label: input.label?.trim() || undefined,
    mode,
    rawRolls,
    keptRoll,
    modifier,
    total,
    dc,
    outcome: dc === undefined ? undefined : total >= dc ? 'success' : 'failure',
    isNatural20: keptRoll === 20,
    isNatural1: keptRoll === 1,
  };
}

export function rollDndAttack(input: {
  attackerName?: string;
  targetName?: string;
  attackBonus?: number;
  targetAc?: number;
  mode?: DndRollMode;
}, random: DndRollRandom = Math.random): DndAttackResult {
  const mode = input.mode ?? 'normal';
  const attackBonus = Number.isFinite(input.attackBonus) ? Math.trunc(input.attackBonus ?? 0) : 0;
  const targetAc = Number.isFinite(input.targetAc) ? Math.trunc(input.targetAc as number) : undefined;
  const { rawRolls, keptRoll } = rollD20(mode, random);
  const isCritical = keptRoll === 20;
  const isNatural1 = keptRoll === 1;
  const total = keptRoll + attackBonus;
  const outcome = isCritical ? 'hit' : isNatural1 ? 'miss' : targetAc === undefined ? 'unknown' : total >= targetAc ? 'hit' : 'miss';
  return { attackerName: input.attackerName?.trim() || undefined, targetName: input.targetName?.trim() || undefined, mode, rawRolls, keptRoll, attackBonus, total, targetAc, outcome, isCritical, isNatural1 };
}

export function rollDndDamage(formula: string, options: { critical?: boolean; random?: DndRollRandom } = {}): DndDamageResult {
  const result = rollDndDiceFormula(formula, options.random ?? Math.random, { critical: options.critical });
  return { ...result, isCritical: options.critical === true };
}

function signedModifier(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function checkEventKind(kind: DndCheckKind): DndRuntimeEventDraft['eventKind'] {
  if (kind === 'skill') return 'dnd.skill_rolled';
  if (kind === 'save') return 'dnd.save_rolled';
  return 'dnd.check_rolled';
}

export function dndCheckToRuntimeEvent(result: DndCheckResult, locale: 'zh-CN' | 'en' = 'zh-CN'): DndRuntimeEventDraft {
  const subject = result.actorName || (locale === 'en' ? 'Someone' : '某角色');
  const kindLabel = locale === 'en'
    ? result.kind === 'skill' ? 'skill check' : result.kind === 'save' ? 'saving throw' : result.kind === 'ability' ? 'ability check' : 'check'
    : result.kind === 'skill' ? '技能检定' : result.kind === 'save' ? '豁免检定' : result.kind === 'ability' ? '属性检定' : '检定';
  const formula = `1d20${signedModifier(result.modifier)}`;
  const comparison = result.dc === undefined ? '' : locale === 'en'
    ? ` vs DC ${result.dc}, ${result.outcome === 'success' ? 'success' : 'failure'}.`
    : `，对抗 DC ${result.dc}，${result.outcome === 'success' ? '成功' : '失败'}。`;
  const natural = result.isNatural20 ? (locale === 'en' ? ' Natural 20.' : ' 大成功。') : result.isNatural1 ? (locale === 'en' ? ' Natural 1.' : ' 大失败。') : '';
  const summary = locale === 'en'
    ? `${subject} made a ${kindLabel}: ${formula} = ${result.total}.${comparison}${natural}`
    : `${subject}进行了${kindLabel}：${formula} = ${result.total}${comparison}${natural}`;
  return { eventKind: checkEventKind(result.kind), payload: { actorName: result.actorName, label: result.label, rollFormula: formula, mode: result.mode, rawRolls: result.rawRolls, keptResult: result.keptRoll, modifier: result.modifier, total: result.total, dc: result.dc, outcome: result.outcome, natural20: result.isNatural20, natural1: result.isNatural1, summary } };
}

export function dndAttackToRuntimeEvent(result: DndAttackResult, locale: 'zh-CN' | 'en' = 'zh-CN'): DndRuntimeEventDraft {
  const subject = result.attackerName || (locale === 'en' ? 'Someone' : '某角色');
  const target = result.targetName ? (locale === 'en' ? ` against ${result.targetName}` : `攻击${result.targetName}`) : '';
  const formula = `1d20${signedModifier(result.attackBonus)}`;
  const comparison = result.targetAc === undefined ? (locale === 'en' ? ' (AC unknown).' : '（AC 未填写）。') : locale === 'en'
    ? ` vs AC ${result.targetAc}, ${result.outcome === 'hit' ? 'hit' : 'miss'}.`
    : `，对抗 AC ${result.targetAc}，${result.outcome === 'hit' ? '命中' : '未命中'}。`;
  const marker = result.isCritical ? (locale === 'en' ? ' Critical hit.' : ' 暴击。') : result.isNatural1 ? (locale === 'en' ? ' Natural 1.' : ' 大失败。') : '';
  const summary = locale === 'en' ? `${subject} attacked${target}: ${formula} = ${result.total}.${comparison}${marker}` : `${subject}${target}：${formula} = ${result.total}${comparison}${marker}`;
  return { eventKind: 'dnd.attack_rolled', payload: { attackerName: result.attackerName, targetName: result.targetName, rollFormula: formula, mode: result.mode, rawRolls: result.rawRolls, keptResult: result.keptRoll, modifier: result.attackBonus, total: result.total, ac: result.targetAc, outcome: result.outcome, critical: result.isCritical, natural1: result.isNatural1, summary } };
}

export function dndDamageToRuntimeEvent(result: DndDamageResult, actorName?: string, locale: 'zh-CN' | 'en' = 'zh-CN'): DndRuntimeEventDraft {
  const subject = actorName?.trim() || (locale === 'en' ? 'Damage' : '伤害');
  const summary = locale === 'en' ? `${subject}: ${result.formula} = ${result.total}${result.isCritical ? ' (critical damage).' : '.'}` : `${subject}：${result.formula} = ${result.total}${result.isCritical ? '（暴击伤害）。' : '。'}`;
  return { eventKind: 'dnd.damage_rolled', payload: { actorName: actorName?.trim() || undefined, rollFormula: result.formula, rawRolls: result.dice.map((group) => group.rolls), modifier: result.modifier, total: result.total, critical: result.isCritical, summary } };
}

export function dndFormulaToRuntimeEvent(result: DndFormulaRollResult, locale: 'zh-CN' | 'en' = 'zh-CN'): DndRuntimeEventDraft {
  const summary = locale === 'en' ? `Dice roll: ${result.formula} = ${result.total}.` : `掷骰：${result.formula} = ${result.total}。`;
  return { eventKind: 'dnd.roll_note', payload: { rollFormula: result.formula, rawRolls: result.dice.map((group) => group.rolls), modifier: result.modifier, total: result.total, summary } };
}
