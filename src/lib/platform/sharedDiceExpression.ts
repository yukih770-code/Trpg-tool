/**
 * Shared dice expression parser + roller (pure, platform-level).
 *
 * AI-LANDMARK: SHARED_DICE_EXPRESSION_V0
 *
 * Pure, dependency-free parsing/normalizing of the manual dice grammar, reused by
 * BOTH the server (crypto RNG, room authority) and the client (browser RNG, local
 * authority). It does NOT do randomness itself — the roller takes an injected RNG.
 * No eval, no node:crypto, no server/DOM imports. Grammar: one or more additive
 * `[N]dM` dice terms plus integer +/- modifiers. Safety limits: sides ∈
 * {4,6,8,10,12,20,100}, per-term count 1..20, total dice ≤ 50, modifier -100..100.
 * No parentheses / * / kh / kl / advantage / exploding.
 */

// NodeNext note: this module is compiled into BOTH the Vite frontend and the
// Room Server program (server tsconfig uses moduleResolution NodeNext), so the
// relative import must carry an explicit .js suffix.
import type { SharedDiceRollResult, SharedDiceTermResult } from './sharedDiceTypes.js';

export const ALLOWED_DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type AllowedDiceSides = (typeof ALLOWED_DICE_SIDES)[number];

const ALLOWED_SIDES_SET = new Set<number>(ALLOWED_DICE_SIDES);
const MAX_TERM_COUNT = 20;
const MAX_TOTAL_DICE = 50;
const MODIFIER_MIN = -100;
const MODIFIER_MAX = 100;
const EXPRESSION_RE = /^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/;

/** Injected RNG: given a die's sides, returns an integer in [1, sides]. */
export type DiceRng = (sides: number) => number;

export interface ParsedDiceTerm {
  count: number;
  sides: number;
}

export interface ParsedDiceExpression {
  terms: ParsedDiceTerm[];
  modifier: number;
  normalizedExpression: string;
}

export type DiceErrorCode = 'invalidExpression' | 'expressionTooLarge';

export type ParseDiceOutcome =
  | { ok: true; parsed: ParsedDiceExpression }
  | { ok: false; code: DiceErrorCode; message: string };

export type RollDiceOutcome =
  | { ok: true; roll: SharedDiceRollResult }
  | { ok: false; code: DiceErrorCode; message: string };

/** Parse + validate only (no randomness). */
export function parseSharedDiceExpression(raw: string): ParseDiceOutcome {
  const norm = raw.replace(/\s+/g, '').toLowerCase();
  if (norm === '' || !EXPRESSION_RE.test(norm)) {
    return { ok: false, code: 'invalidExpression', message: `Invalid dice expression "${raw}".` };
  }
  const signed = norm[0] === '+' || norm[0] === '-' ? norm : `+${norm}`;
  const tokens = [...signed.matchAll(/([+-])(\d*d\d+|\d+)/g)];
  if (tokens.map((m) => m[0]).join('') !== signed) {
    return { ok: false, code: 'invalidExpression', message: `Invalid dice expression "${raw}".` };
  }

  const terms: ParsedDiceTerm[] = [];
  let modifier = 0;
  let totalDice = 0;

  for (const m of tokens) {
    const sign = m[1];
    const token = m[2];
    if (token.includes('d')) {
      if (sign === '-') return { ok: false, code: 'invalidExpression', message: 'Negative dice terms are not supported.' };
      const [countStr, sidesStr] = token.split('d');
      const count = countStr === '' ? 1 : Number.parseInt(countStr, 10);
      const sides = Number.parseInt(sidesStr, 10);
      if (!ALLOWED_SIDES_SET.has(sides)) return { ok: false, code: 'invalidExpression', message: `Unsupported die d${sides}.` };
      if (!Number.isInteger(count) || count < 1 || count > MAX_TERM_COUNT) {
        return { ok: false, code: 'expressionTooLarge', message: `Dice count out of range (1-${MAX_TERM_COUNT}).` };
      }
      totalDice += count;
      if (totalDice > MAX_TOTAL_DICE) return { ok: false, code: 'expressionTooLarge', message: `Too many dice (max ${MAX_TOTAL_DICE}).` };
      terms.push({ count, sides });
    } else {
      const value = Number.parseInt(token, 10);
      modifier += sign === '-' ? -value : value;
    }
  }

  if (terms.length === 0) return { ok: false, code: 'invalidExpression', message: 'At least one dice term is required.' };
  if (modifier < MODIFIER_MIN || modifier > MODIFIER_MAX) {
    return { ok: false, code: 'expressionTooLarge', message: `Modifier out of range (${MODIFIER_MIN}..${MODIFIER_MAX}).` };
  }

  const normalizedExpression =
    terms.map((t) => `${t.count}d${t.sides}`).join('+') +
    (modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '');

  return { ok: true, parsed: { terms, modifier, normalizedExpression } };
}

/** Parse then roll with the injected RNG. Randomness comes ONLY from `rng`. */
export function rollSharedDiceExpression(raw: string, rng: DiceRng, label?: string): RollDiceOutcome {
  const parsed = parseSharedDiceExpression(raw);
  if (parsed.ok === false) {
    return { ok: false, code: parsed.code, message: parsed.message };
  }

  const terms: SharedDiceTermResult[] = parsed.parsed.terms.map((t) => {
    const rolls: number[] = [];
    for (let i = 0; i < t.count; i += 1) rolls.push(rng(t.sides));
    return { count: t.count, sides: t.sides, rolls, subtotal: rolls.reduce((a, b) => a + b, 0) };
  });
  const diceTotal = terms.reduce((a, t) => a + t.subtotal, 0);
  const trimmedLabel = label?.trim() || undefined;

  const roll: SharedDiceRollResult = {
    expression: raw,
    normalizedExpression: parsed.parsed.normalizedExpression,
    label: trimmedLabel,
    terms,
    modifier: parsed.parsed.modifier,
    total: diceTotal + parsed.parsed.modifier,
  };
  return { ok: true, roll };
}

/** Human-readable summary, e.g. "掷骰 2d4+1d20：[2, 4] + [17] = 23". Shared by both modes. */
export function formatSharedDiceRoll(roll: SharedDiceRollResult): string {
  const rollsPart = roll.terms.map((t) => `[${t.rolls.join(', ')}]`).join(' + ');
  const modPart = roll.modifier > 0 ? ` + ${roll.modifier}` : roll.modifier < 0 ? ` - ${Math.abs(roll.modifier)}` : '';
  const prefix = roll.label ? `${roll.label} · ` : '';
  return `${prefix}掷骰 ${roll.normalizedExpression}：${rollsPart}${modPart} = ${roll.total}`;
}
