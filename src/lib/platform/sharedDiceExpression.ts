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
 * The EXPRESSION grammar itself is unchanged: no parentheses / * / kh / kl /
 * exploding, and `normalizedExpression` still renders as e.g. "1d20+5".
 *
 * T1 semantic layer: advantage / disadvantage / DC ride as OPTIONS beside the
 * expression, never inside it. They apply only to a semantic d20 — exactly one
 * `1d20` term plus an optional modifier — so an arbitrary pool such as `2d6+3`,
 * `2d20` or `1d12+4` can never be reinterpreted as a D&D check. Natural 20 / 1
 * are recorded as metadata; `outcome` is derived solely from `total >= dc`. No
 * universal auto-success or auto-failure is encoded here.
 */

// NodeNext note: this module is compiled into BOTH the Vite frontend and the
// Room Server program (server tsconfig uses moduleResolution NodeNext), so the
// relative import must carry an explicit .js suffix.
import type {
  SharedDiceRollMode,
  SharedDiceRollResult,
  SharedDiceTermResult,
} from './sharedDiceTypes.js';

export const ALLOWED_DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type AllowedDiceSides = (typeof ALLOWED_DICE_SIDES)[number];

const ALLOWED_SIDES_SET = new Set<number>(ALLOWED_DICE_SIDES);
const MAX_TERM_COUNT = 20;
const MAX_TOTAL_DICE = 50;
const MODIFIER_MIN = -100;
const MODIFIER_MAX = 100;
const DC_MIN = 0;
const DC_MAX = 100;
const SEMANTIC_D20_SIDES = 20;
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

export type DiceErrorCode =
  | 'invalidExpression'
  | 'expressionTooLarge'
  | 'invalidRollMode'
  | 'invalidDc';

export type ParseDiceOutcome =
  | { ok: true; parsed: ParsedDiceExpression }
  | { ok: false; code: DiceErrorCode; message: string };

export type RollDiceOutcome =
  | { ok: true; roll: SharedDiceRollResult }
  | { ok: false; code: DiceErrorCode; message: string };

/**
 * Optional semantic intent supplied alongside the expression. It carries INTENT
 * only — the resolved faces, kept die, total and outcome are always computed
 * here from the injected RNG, never accepted from a caller.
 */
export interface SharedDiceRollOptions {
  label?: string;
  mode?: SharedDiceRollMode;
  dc?: number;
}

/**
 * A semantic d20 check is exactly one `1d20` term plus an optional modifier.
 * `2d20`, `2d6+3` and `1d12+4` are deliberately NOT semantic d20 checks.
 */
export function isSemanticD20Expression(parsed: ParsedDiceExpression): boolean {
  return parsed.terms.length === 1
    && parsed.terms[0].count === 1
    && parsed.terms[0].sides === SEMANTIC_D20_SIDES;
}

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

/**
 * Parse then roll with the injected RNG. Randomness comes ONLY from `rng`.
 *
 * The third argument accepts the original `label` string for backward
 * compatibility, or a `SharedDiceRollOptions` bag carrying the T1 semantic
 * intent. With no `mode`/`dc` the produced result is byte-identical to v0.
 */
export function rollSharedDiceExpression(
  raw: string,
  rng: DiceRng,
  options?: string | SharedDiceRollOptions,
): RollDiceOutcome {
  const resolved: SharedDiceRollOptions = typeof options === 'string' ? { label: options } : options ?? {};
  const parsed = parseSharedDiceExpression(raw);
  if (parsed.ok === false) {
    return { ok: false, code: parsed.code, message: parsed.message };
  }

  const semanticD20 = isSemanticD20Expression(parsed.parsed);
  const requestedMode = resolved.mode;
  const requestedDc = resolved.dc;

  if (requestedMode !== undefined && requestedMode !== 'normal' && !semanticD20) {
    return {
      ok: false,
      code: 'invalidRollMode',
      message: 'Advantage and disadvantage require a single d20 expression (for example 1d20+5).',
    };
  }
  if (requestedDc !== undefined) {
    if (!Number.isInteger(requestedDc) || requestedDc < DC_MIN || requestedDc > DC_MAX) {
      return { ok: false, code: 'invalidDc', message: `DC must be an integer in ${DC_MIN}..${DC_MAX}.` };
    }
    if (!semanticD20) {
      return {
        ok: false,
        code: 'invalidDc',
        message: 'A check DC requires a single d20 expression (for example 1d20+5).',
      };
    }
  }

  // Semantic metadata is produced only when the caller actually asked for a
  // check. A bare pool roll keeps the exact v0 result shape.
  const applySemantics = semanticD20 && (requestedMode !== undefined || requestedDc !== undefined);
  const mode: SharedDiceRollMode = requestedMode ?? 'normal';

  let terms: SharedDiceTermResult[];
  let rawRolls: number[] | undefined;
  let keptRoll: number | undefined;

  if (applySemantics) {
    // Normal consumes exactly one d20 face, matching the generic path below, so
    // a deterministic RNG fixture behaves identically in both branches.
    const faces = mode === 'normal'
      ? [rng(SEMANTIC_D20_SIDES)]
      : [rng(SEMANTIC_D20_SIDES), rng(SEMANTIC_D20_SIDES)];
    const kept = mode === 'advantage'
      ? Math.max(...faces)
      : mode === 'disadvantage'
        ? Math.min(...faces)
        : faces[0];
    rawRolls = faces;
    keptRoll = kept;
    // The KEPT die is the ordinary term, so `total = sum(terms) + modifier`
    // still holds for every reader that knows nothing about `mode`.
    terms = [{ count: 1, sides: SEMANTIC_D20_SIDES, rolls: [kept], subtotal: kept }];
  } else {
    terms = parsed.parsed.terms.map((t) => {
      const rolls: number[] = [];
      for (let i = 0; i < t.count; i += 1) rolls.push(rng(t.sides));
      return { count: t.count, sides: t.sides, rolls, subtotal: rolls.reduce((a, b) => a + b, 0) };
    });
  }

  const diceTotal = terms.reduce((a, t) => a + t.subtotal, 0);
  const trimmedLabel = resolved.label?.trim() || undefined;
  const total = diceTotal + parsed.parsed.modifier;

  const roll: SharedDiceRollResult = {
    expression: raw,
    normalizedExpression: parsed.parsed.normalizedExpression,
    label: trimmedLabel,
    terms,
    modifier: parsed.parsed.modifier,
    total,
    ...(applySemantics && keptRoll !== undefined
      ? {
          mode,
          rawRolls,
          keptRoll,
          // Metadata only. Neither field is allowed to influence `outcome`.
          isNatural20: keptRoll === SEMANTIC_D20_SIDES,
          isNatural1: keptRoll === 1,
          ...(requestedDc !== undefined
            ? { dc: requestedDc, outcome: total >= requestedDc ? 'success' as const : 'failure' as const }
            : {}),
        }
      : {}),
  };
  return { ok: true, roll };
}

const ROLL_MODE_LABEL: Record<SharedDiceRollMode, string> = {
  normal: '普通',
  advantage: '优势',
  disadvantage: '劣势',
};

/**
 * Human-readable summary, e.g. "掷骰 2d4+1d20：[2, 4] + [17] = 23". Shared by
 * both modes. A semantic d20 check adds the mode, both rolled faces and the DC
 * outcome, e.g. "掷骰 1d20+5（优势）：[7, 15] → 15 + 5 = 20 · DC 15 成功".
 * The v0 branch is unchanged so existing log text stays identical.
 */
export function formatSharedDiceRoll(roll: SharedDiceRollResult): string {
  const modPart = roll.modifier > 0 ? ` + ${roll.modifier}` : roll.modifier < 0 ? ` - ${Math.abs(roll.modifier)}` : '';
  const prefix = roll.label ? `${roll.label} · ` : '';

  if (roll.mode && roll.rawRolls && roll.keptRoll !== undefined) {
    const facesPart = roll.rawRolls.length > 1
      ? `[${roll.rawRolls.join(', ')}] → ${roll.keptRoll}`
      : `[${roll.keptRoll}]`;
    const dcPart = roll.dc === undefined
      ? ''
      : ` · DC ${roll.dc} ${roll.outcome === 'success' ? '成功' : '失败'}`;
    return `${prefix}掷骰 ${roll.normalizedExpression}（${ROLL_MODE_LABEL[roll.mode]}）：${facesPart}${modPart} = ${roll.total}${dcPart}`;
  }

  const rollsPart = roll.terms.map((t) => `[${t.rolls.join(', ')}]`).join(' + ');
  return `${prefix}掷骰 ${roll.normalizedExpression}：${rollsPart}${modPart} = ${roll.total}`;
}
