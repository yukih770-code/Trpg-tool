/**
 * Shared dice expression smoke (grammar + T1 semantic d20 layer).
 *
 * AI-LANDMARK: SHARED_DICE_EXPRESSION_SMOKE_V1
 *
 * Covers the pure, server-authoritative dice module directly instead of relying
 * on the single incidental `1d20` assertion inside roomLifecycleSmoke. Every
 * roll uses a deterministic RNG fixture, so kept-die selection, DC comparison
 * and natural-face metadata are asserted on exact values.
 *
 * Boundaries asserted here:
 *  - the v0 result shape and `total = sum(terms) + modifier` invariant hold in
 *    every mode;
 *  - advantage / disadvantage / DC apply ONLY to a single-d20 expression;
 *  - a natural 20 / 1 never becomes automatic success or failure;
 *  - a request carrying no semantics produces exactly the v0 payload.
 */

import {
  isSemanticD20Expression,
  parseSharedDiceExpression,
  rollSharedDiceExpression,
  formatSharedDiceRoll,
  type DiceRng,
} from './sharedDiceExpression.js';
import type { SharedDiceRollResult } from './sharedDiceTypes.js';

const cases: string[] = [];

function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

/** Deterministic RNG fixture: yields the given faces in order. */
function faces(values: number[]): DiceRng {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 1;
}

function rolled(
  expression: string,
  rng: DiceRng,
  options?: Parameters<typeof rollSharedDiceExpression>[2],
): SharedDiceRollResult {
  const outcome = rollSharedDiceExpression(expression, rng, options);
  if (outcome.ok === false) throw new Error(`unexpected roll failure for "${expression}": ${outcome.message}`);
  return outcome.roll;
}

function rejected(name: string, expression: string, options?: Parameters<typeof rollSharedDiceExpression>[2]): void {
  const outcome = rollSharedDiceExpression(expression, faces([10, 10]), options);
  check(name, outcome.ok === false);
}

function totalInvariantHolds(roll: SharedDiceRollResult): boolean {
  const diceTotal = roll.terms.reduce((sum, term) => sum + term.subtotal, 0);
  return roll.total === diceTotal + roll.modifier;
}

// ── Grammar / parsing ───────────────────────────────────────────────────────
const parsedPool = parseSharedDiceExpression('2d6+3');
check('parse 2d6+3', parsedPool.ok === true && parsedPool.parsed.terms.length === 1
  && parsedPool.parsed.terms[0].count === 2 && parsedPool.parsed.terms[0].sides === 6
  && parsedPool.parsed.modifier === 3 && parsedPool.parsed.normalizedExpression === '2d6+3');

const parsedCheck = parseSharedDiceExpression('d20+5');
check('parse d20+5 normalizes to 1d20+5', parsedCheck.ok === true && parsedCheck.parsed.normalizedExpression === '1d20+5');

check('semantic d20 recognises 1d20', parsedCheck.ok === true && isSemanticD20Expression(parsedCheck.parsed));
const parsedTwoD20 = parseSharedDiceExpression('2d20');
check('semantic d20 rejects 2d20', parsedTwoD20.ok === true && !isSemanticD20Expression(parsedTwoD20.parsed));
const parsedD12 = parseSharedDiceExpression('1d12+4');
check('semantic d20 rejects 1d12+4', parsedD12.ok === true && !isSemanticD20Expression(parsedD12.parsed));
check('semantic d20 rejects 2d6+3', parsedPool.ok === true && !isSemanticD20Expression(parsedPool.parsed));

// ── Plain pool roll: unchanged v0 behaviour ─────────────────────────────────
const pool = rolled('2d6+3', faces([2, 5]));
check('plain 2d6+3 rolls every die', pool.terms.length === 1 && pool.terms[0].rolls.join(',') === '2,5');
check('plain 2d6+3 total', pool.total === 10 && pool.modifier === 3);
check('plain 2d6+3 total invariant', totalInvariantHolds(pool));
check('plain roll carries no semantic fields', pool.mode === undefined && pool.rawRolls === undefined
  && pool.keptRoll === undefined && pool.dc === undefined && pool.outcome === undefined
  && pool.isNatural20 === undefined && pool.isNatural1 === undefined);
check('plain roll text unchanged', formatSharedDiceRoll(pool) === '掷骰 2d6+3：[2, 5] + 3 = 10');

// A bare d20 with no semantic intent must still look exactly like v0.
const bareD20 = rolled('1d20+5', faces([11]));
check('bare d20 stays v0 shaped', bareD20.mode === undefined && bareD20.rawRolls === undefined && bareD20.total === 16);

// ── Normal d20 check ────────────────────────────────────────────────────────
const normal = rolled('1d20+5', faces([11]), { mode: 'normal' });
check('normal d20 consumes one face', normal.rawRolls?.join(',') === '11' && normal.keptRoll === 11);
check('normal d20 total', normal.total === 16 && normal.modifier === 5);
check('normal d20 mode recorded', normal.mode === 'normal');
check('normal d20 total invariant', totalInvariantHolds(normal));
check('normal d20 keeps normalized expression', normal.normalizedExpression === '1d20+5');

// ── Advantage ───────────────────────────────────────────────────────────────
const advantage = rolled('1d20+5', faces([7, 15]), { mode: 'advantage' });
check('advantage rolls two faces', advantage.rawRolls?.join(',') === '7,15');
check('advantage keeps highest', advantage.keptRoll === 15 && advantage.total === 20);
check('advantage term carries the kept die', advantage.terms.length === 1
  && advantage.terms[0].rolls.join(',') === '15' && advantage.terms[0].subtotal === 15);
check('advantage total invariant', totalInvariantHolds(advantage));
check('advantage discarded face lives only in metadata', advantage.terms[0].rolls.includes(7) === false);
check('advantage text shows both faces', formatSharedDiceRoll(advantage) === '掷骰 1d20+5（优势）：[7, 15] → 15 + 5 = 20');

// ── Disadvantage ────────────────────────────────────────────────────────────
const disadvantage = rolled('1d20+5', faces([18, 4]), { mode: 'disadvantage' });
check('disadvantage rolls two faces', disadvantage.rawRolls?.join(',') === '18,4');
check('disadvantage keeps lowest', disadvantage.keptRoll === 4 && disadvantage.total === 9);
check('disadvantage term carries the kept die', disadvantage.terms[0].rolls.join(',') === '4');
check('disadvantage total invariant', totalInvariantHolds(disadvantage));

// ── DC comparison ───────────────────────────────────────────────────────────
const dcSuccess = rolled('1d20+5', faces([12]), { mode: 'normal', dc: 15 });
check('DC success', dcSuccess.total === 17 && dcSuccess.dc === 15 && dcSuccess.outcome === 'success');
const dcFailure = rolled('1d20+2', faces([5]), { mode: 'normal', dc: 15 });
check('DC failure', dcFailure.total === 7 && dcFailure.outcome === 'failure');
const dcExact = rolled('1d20', faces([15]), { dc: 15 });
check('DC met exactly is success', dcExact.total === 15 && dcExact.outcome === 'success');
check('DC without explicit mode defaults to normal', dcExact.mode === 'normal' && dcExact.rawRolls?.length === 1);
const dcWithAdvantage = rolled('1d20+1', faces([3, 19]), { mode: 'advantage', dc: 18 });
check('DC uses the kept die total', dcWithAdvantage.keptRoll === 19 && dcWithAdvantage.total === 20 && dcWithAdvantage.outcome === 'success');
check('advantage + DC text', formatSharedDiceRoll(dcWithAdvantage) === '掷骰 1d20+1（优势）：[3, 19] → 19 + 1 = 20 · DC 18 成功');

// ── No DC: never fabricate an outcome ───────────────────────────────────────
const noDc = rolled('1d20+5', faces([9]), { mode: 'normal' });
check('no DC means no outcome', noDc.dc === undefined && noDc.outcome === undefined);
const noDcAdvantage = rolled('1d20', faces([2, 20]), { mode: 'advantage' });
check('no DC on advantage means no outcome', noDcAdvantage.outcome === undefined);

// ── Natural faces are metadata, never a rule ────────────────────────────────
const natural20 = rolled('1d20', faces([20]), { mode: 'normal' });
check('natural 20 metadata', natural20.isNatural20 === true && natural20.isNatural1 === false);
const natural1 = rolled('1d20', faces([1]), { mode: 'normal' });
check('natural 1 metadata', natural1.isNatural1 === true && natural1.isNatural20 === false);

// A natural 20 that still misses a very high DC must FAIL, and a natural 1 that
// still clears a very low DC must SUCCEED. Nothing here auto-resolves.
const natural20BelowDc = rolled('1d20', faces([20]), { mode: 'normal', dc: 30 });
check('natural 20 does not auto-succeed', natural20BelowDc.isNatural20 === true && natural20BelowDc.outcome === 'failure');
const natural1AboveDc = rolled('1d20+10', faces([1]), { mode: 'normal', dc: 5 });
check('natural 1 does not auto-fail', natural1AboveDc.isNatural1 === true && natural1AboveDc.outcome === 'success');

// Natural markers must not appear on a non-d20 pool, even when a 20 is rolled.
const poolWithTwenty = rolled('2d20', faces([20, 20]));
check('non-semantic pool has no natural markers', poolWithTwenty.isNatural20 === undefined && poolWithTwenty.mode === undefined);

// ── Invalid semantic requests ───────────────────────────────────────────────
rejected('advantage on 2d6 is rejected', '2d6+3', { mode: 'advantage' });
rejected('disadvantage on 2d20 is rejected', '2d20', { mode: 'disadvantage' });
rejected('advantage on 1d12+4 is rejected', '1d12+4', { mode: 'advantage' });
rejected('DC on 2d6+3 is rejected', '2d6+3', { dc: 12 });
rejected('non-integer DC is rejected', '1d20', { dc: 12.5 });
rejected('negative DC is rejected', '1d20', { dc: -1 });
rejected('oversized DC is rejected', '1d20', { dc: 101 });
rejected('invalid expression still rejected', '1d20+process.exit()', { mode: 'advantage' });

const advantageOnPool = rollSharedDiceExpression('2d6+3', faces([3, 3]), { mode: 'advantage' });
check('advantage on a pool reports invalidRollMode', advantageOnPool.ok === false && advantageOnPool.code === 'invalidRollMode');
const dcOnPool = rollSharedDiceExpression('2d6+3', faces([3, 3]), { dc: 10 });
check('DC on a pool reports invalidDc', dcOnPool.ok === false && dcOnPool.code === 'invalidDc');

// `mode: 'normal'` is the harmless default and must not break a plain pool.
const normalOnPool = rolled('2d6+3', faces([4, 4]), { mode: 'normal' });
check('normal mode on a pool stays v0 shaped', normalOnPool.total === 11 && normalOnPool.mode === undefined && normalOnPool.rawRolls === undefined);

// ── Backward compatibility of the caller contract ───────────────────────────
const labelledLegacy = rolled('1d20+5', faces([10]), 'Alpha check');
check('legacy string label still supported', labelledLegacy.label === 'Alpha check' && labelledLegacy.mode === undefined);
const labelledOptions = rolled('1d20+5', faces([10]), { label: 'Alpha check', mode: 'normal' });
check('options label supported', labelledOptions.label === 'Alpha check' && labelledOptions.mode === 'normal');
check('legacy and options totals agree', labelledLegacy.total === labelledOptions.total);

const requiredV0Keys: Array<keyof SharedDiceRollResult> = ['expression', 'normalizedExpression', 'terms', 'modifier', 'total'];
check('every result still exposes the v0 keys', [pool, normal, advantage, disadvantage, dcSuccess]
  .every((roll) => requiredV0Keys.every((key) => roll[key] !== undefined)));

// eslint-disable-next-line no-console
console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
