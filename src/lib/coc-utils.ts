/**
 * coc-utils.ts
 *
 * Pure-function rule utilities for Call of Cthulhu 7th Edition.
 *
 * Contract
 * ────────
 * • All functions are pure (no React, no Zustand, no localStorage).
 * • All inputs are coerced through safeInt() — NaN / undefined / non-finite
 *   values silently fall back to 0 (or the documented default).
 * • Nothing in this file imports from any store or page.
 *
 * Sections
 * ────────
 *   1. Internal helpers
 *   2. Legacy composite function (kept for backward compat)
 *   3. Derived attribute functions  (HP / MP / SAN / DB / Build / MOV)
 *   4. Roll-evaluation types        (CocSuccessLevel / CocRollCheckResult)
 *   5. Roll-evaluation function     (evaluateCocD100Check)
 */

// ─── 1. Internal helpers ──────────────────────────────────────────────────────

/**
 * Coerce an unknown value to a finite integer.
 * Returns `fallback` (default 0) for NaN / Infinity / non-numeric inputs.
 */
function safeInt(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

// ─── 2. Legacy composite function (backward compat) ──────────────────────────

/**
 * getCocDerivedStats (legacy)
 *
 * Returns { db, build, move } from a raw characteristics map.
 * Kept unchanged so existing callers in CocCreator / CocSheet / CocGameplay
 * continue to work without modification.
 *
 * Prefer the individual functions below for new code.
 */
export function getCocDerivedStats(characteristics: Record<string, number>) {
  const str = characteristics.STR || 0;
  const siz = characteristics.SIZ || 0;
  const dex = characteristics.DEX || 0;

  // Build and Damage Bonus
  const dbBuildMap = [
    { max: 64,  db: '-2',   build: -2 },
    { max: 84,  db: '-1',   build: -1 },
    { max: 124, db: '0',    build:  0 },
    { max: 164, db: '+1D4', build:  1 },
    { max: 204, db: '+1D6', build:  2 },
    { max: 284, db: '+2D6', build:  3 }, // Simplified for higher bounds
  ];

  const totalStrSiz = str + siz;
  let db = '0';
  let build = 0;

  for (const threshold of dbBuildMap) {
    if (totalStrSiz <= threshold.max) {
      db = threshold.db;
      build = threshold.build;
      break;
    }
  }
  // Hard cap fallback
  if (totalStrSiz > 284) {
    db = '+2D6';
    build = 3;
  }

  // Move Rate
  let move = 8;
  if (dex < siz && str < siz) {
    move = 7;
  } else if (dex > siz && str > siz) {
    move = 9;
  }
  // Age penalties are usually applied to Move, skipping for simplicity unless needed

  return { db, build, move };
}

// ─── 3. Derived attribute functions ──────────────────────────────────────────

/**
 * getCocDerivedHp
 *
 * COC 7E Investigator Handbook p.43
 * HP = floor((CON + SIZ) / 10)
 */
export function getCocDerivedHp(con: number, siz: number): number {
  return Math.floor((safeInt(con) + safeInt(siz)) / 10);
}

/**
 * getCocDerivedMp
 *
 * COC 7E Investigator Handbook p.43
 * MP = floor(POW / 5)
 */
export function getCocDerivedMp(pow: number): number {
  return Math.floor(safeInt(pow) / 5);
}

/**
 * getCocInitialSan
 *
 * COC 7E Investigator Handbook p.43
 * Starting Sanity = POW  (before any Cthulhu Mythos purchases)
 */
export function getCocInitialSan(pow: number): number {
  return safeInt(pow);
}

/**
 * getCocSanMax
 *
 * COC 7E Investigator Handbook p.123
 * Maximum Sanity = 99 − Cthulhu Mythos skill value
 * Floored at 0 (a character with 99 Cthulhu Mythos cannot have any sanity).
 */
export function getCocSanMax(cthulhuMythosValue: number): number {
  return Math.max(0, 99 - safeInt(cthulhuMythosValue));
}

// ── DB / Build table ──────────────────────────────────────────────────────────

/**
 * Full COC 7E Damage Bonus / Build lookup table.
 * Source: Investigator Handbook p.100 / Keeper Rulebook p.117.
 *
 * Each entry covers the range (prevMax+1 … max].
 * Entries beyond 444 follow the same +80-point step pattern (+1D6 per step).
 */
const DB_BUILD_TABLE: ReadonlyArray<{
  readonly max: number;
  readonly damageBonus: string;
  readonly build: number;
}> = [
  { max:  64, damageBonus: '-2',    build: -2 },
  { max:  84, damageBonus: '-1',    build: -1 },
  { max: 124, damageBonus: 'None',  build:  0 },
  { max: 164, damageBonus: '+1D4',  build:  1 },
  { max: 204, damageBonus: '+1D6',  build:  2 },
  { max: 284, damageBonus: '+2D6',  build:  3 },
  { max: 364, damageBonus: '+3D6',  build:  4 },
  { max: 444, damageBonus: '+4D6',  build:  5 },
];

/**
 * getCocDamageBonusAndBuild
 *
 * Returns the damage bonus string and Build integer for an investigator
 * based on STR + SIZ.
 *
 * @param str  STR characteristic (before ×5 conversion — use the raw roll)
 * @param siz  SIZ characteristic (before ×5 conversion — use the raw roll)
 * @returns    { damageBonus: string, build: number }
 *
 * Examples
 *   str=50, siz=50  → total=100 → { damageBonus: 'None', build: 0 }
 *   str=80, siz=70  → total=150 → { damageBonus: '+1D4', build: 1 }
 *   str=90, siz=90  → total=180 → { damageBonus: '+1D6', build: 2 }
 */
export function getCocDamageBonusAndBuild(
  str: number,
  siz: number,
): { damageBonus: string; build: number } {
  const total = safeInt(str) + safeInt(siz);

  for (const entry of DB_BUILD_TABLE) {
    if (total <= entry.max) {
      return { damageBonus: entry.damageBonus, build: entry.build };
    }
  }

  // Beyond 444: each additional 80 points adds another 1D6.
  // e.g. 445–524 → +5D6 (build 6), 525–604 → +6D6 (build 7), …
  const overshoot = total - 444;                        // > 0
  const extraSteps = Math.ceil(overshoot / 80);         // ≥ 1
  const dice = 4 + extraSteps;                          // 4 + 1 = 5 for 445–524
  return {
    damageBonus: `+${dice}D6`,
    build: 5 + extraSteps,
  };
}

// ── Move Rate ─────────────────────────────────────────────────────────────────

/**
 * getCocMoveRate
 *
 * COC 7E Investigator Handbook p.44 / Keeper Rulebook p.116
 *
 * Base MOV
 *   DEX < SIZ  AND  STR < SIZ  →  7
 *   DEX > SIZ  AND  STR > SIZ  →  9
 *   otherwise                  →  8
 *
 * Age penalty (applied after base; minimum result is 1)
 *   40–49 → −1
 *   50–59 → −2
 *   60–69 → −3
 *   70–79 → −4
 *   80+   → −5
 */
export function getCocMoveRate(
  str: number,
  dex: number,
  siz: number,
  age: number,
): number {
  const s  = safeInt(str);
  const d  = safeInt(dex);
  const sz = safeInt(siz);
  const a  = safeInt(age);

  // Base move rate
  let move: number;
  if (d < sz && s < sz) {
    move = 7;
  } else if (d > sz && s > sz) {
    move = 9;
  } else {
    move = 8;
  }

  // Age-decade penalty
  if (a >= 80) {
    move -= 5;
  } else if (a >= 70) {
    move -= 4;
  } else if (a >= 60) {
    move -= 3;
  } else if (a >= 50) {
    move -= 2;
  } else if (a >= 40) {
    move -= 1;
  }

  return Math.max(1, move);
}

// ─── 4. Roll-evaluation types ─────────────────────────────────────────────────

/**
 * CocSuccessLevel
 *
 * Ordered from best to worst outcome:
 *
 *   critical  — 大成功 (Special Success / Critical)
 *   extreme   — 极难成功 (Extreme Success)
 *   hard      — 困难成功 (Hard Success)
 *   regular   — 普通成功 (Regular Success)
 *   failure   — 失败
 *   fumble    — 大失败 (Fumble)
 */
export type CocSuccessLevel =
  | 'critical'
  | 'extreme'
  | 'hard'
  | 'regular'
  | 'failure'
  | 'fumble';

/**
 * CocRollCheckResult
 *
 * The fully resolved outcome of a single d100 skill check.
 *
 * Fields
 * ──────
 * roll          The clamped die result used for evaluation (1–100).
 * target        The clamped skill value used for evaluation (≥ 0).
 * successLevel  The COC 7E tier.
 * isSuccess     true for critical / extreme / hard / regular.
 * isCritical    true only for 'critical'.
 * isFumble      true only for 'fumble'.
 */
export interface CocRollCheckResult {
  roll: number;
  target: number;
  successLevel: CocSuccessLevel;
  isSuccess: boolean;
  isCritical: boolean;
  isFumble: boolean;
  hardThreshold: number;
  extremeThreshold: number;
}

export type CocCheckKind = 'skill' | 'attribute' | 'luck' | 'san';

export interface CocD100CheckParams {
  roll: number;
  target: number;
  checkKind?: CocCheckKind;
}

// ─── 5. Roll-evaluation function ─────────────────────────────────────────────

/**
 * evaluateCocD100Check
 *
 * Resolves a single d100 roll against a skill target using COC 7E rules.
 *
 * @param target  Skill or characteristic value (e.g. 60 for a 60% skill).
 *                Values < 0 are clamped to 0.
 * @param roll    Die result. Must be in the range 1–100.
 *                Out-of-range values are clamped to [1, 100] and evaluated
 *                normally — callers should ensure the raw die value is valid.
 *
 * Success tiers (evaluated in priority order)
 * ───────────────────────────────────────────
 * 1. Critical  (大成功)   checked FIRST — highest priority
 *      roll === 1
 *
 * 2. Fumble    (大失败)   checked SECOND — prevents roll=1 at high skill from
 *                        being re-classified as a normal success on the way down
 *      target < 50  →  roll ∈ [96, 100]
 *      target ≥ 50  →  roll === 100
 *
 * 3. Extreme   (极难成功)  roll ≤ floor(target / 5)
 * 4. Hard      (困难成功)  roll ≤ floor(target / 2)
 * 5. Regular   (普通成功)  roll ≤ target
 * 6. Failure               everything else
 *
 * Priority rationale
 * ──────────────────
 * Critical and Fumble are checked before the graduated tiers so that:
 *   • roll=1 with target ≥ 5 is always critical, not merely extreme.
 *   • roll=96-100 with target < 50 is always a fumble, not a failure.
 *   • A high-skill investigator (target ≥ 50) at roll=100 is still a fumble,
 *     even though 100 ≤ target would normally be a regular success.
 */
export function evaluateCocD100Check(
  targetOrParams: number | CocD100CheckParams,
  maybeRoll?: number,
): CocRollCheckResult {
  // ── Input coercion ───────────────────────────────────────────────────────
  // rolls outside [1, 100] are clamped (e.g. a d% result read as 0 → 1)
  const target = typeof targetOrParams === 'number' ? targetOrParams : targetOrParams.target;
  const roll = typeof targetOrParams === 'number' ? maybeRoll : targetOrParams.roll;
  const clampedRoll   = Math.max(1, Math.min(100, safeInt(roll,   50)));
  const clampedTarget = Math.max(0,              safeInt(target,   0));

  // ── Critical threshold ───────────────────────────────────────────────────
  const isCritical = clampedRoll === 1;

  // ── Fumble threshold ─────────────────────────────────────────────────────
  const isFumble =
    clampedTarget < 50
      ? clampedRoll >= 96
      : clampedRoll === 100;

  // ── Graduated success thresholds ─────────────────────────────────────────
  const extremeThreshold = Math.floor(clampedTarget / 5);
  const hardThreshold    = Math.floor(clampedTarget / 2);

  // ── Priority resolution ──────────────────────────────────────────────────
  let successLevel: CocSuccessLevel;

  if (isCritical) {
    successLevel = 'critical';
  } else if (isFumble) {
    successLevel = 'fumble';
  } else if (clampedRoll <= extremeThreshold) {
    successLevel = 'extreme';
  } else if (clampedRoll <= hardThreshold) {
    successLevel = 'hard';
  } else if (clampedRoll <= clampedTarget) {
    successLevel = 'regular';
  } else {
    successLevel = 'failure';
  }

  const isSuccess =
    successLevel === 'critical' ||
    successLevel === 'extreme'  ||
    successLevel === 'hard'     ||
    successLevel === 'regular';

  return {
    roll:         clampedRoll,
    target:       clampedTarget,
    successLevel,
    isSuccess,
    isCritical,
    isFumble,
    hardThreshold,
    extremeThreshold,
  };
}

// ─── 6. SAN loss expression helpers ──────────────────────────────────────────

export function parseCocSanLossExpression(expr: string): {
  successExpr: string;
  failureExpr: string;
} {
  const trimmed = String(expr || '').trim();
  if (!trimmed) return { successExpr: '0', failureExpr: '0' };
  const [successExpr, failureExpr] = trimmed.split('/').map(part => part.trim());
  return {
    successExpr: successExpr || '0',
    failureExpr: failureExpr || successExpr || '0',
  };
}

function rollCocSimpleExpression(expr: string): { rolls: number[]; total: number } {
  const normalized = String(expr || '').trim().toLowerCase();
  if (!normalized) return { rolls: [], total: 0 };

  const fixed = Number(normalized);
  if (Number.isFinite(fixed)) {
    return { rolls: [], total: Math.max(0, Math.floor(fixed)) };
  }

  const match = normalized.match(/^(\d*)d(\d+)$/);
  if (!match) return { rolls: [], total: 0 };

  const count = Math.max(1, safeInt(match[1] || 1, 1));
  const sides = Math.max(1, safeInt(match[2], 1));
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return {
    rolls,
    total: rolls.reduce((sum, roll) => sum + roll, 0),
  };
}

export function rollCocSanLoss(expr: string, succeeded: boolean): {
  expression: string;
  rolls: number[];
  total: number;
} {
  const parsed = parseCocSanLossExpression(expr);
  const expression = succeeded ? parsed.successExpr : parsed.failureExpr;
  const result = rollCocSimpleExpression(expression);
  return {
    expression,
    rolls: result.rolls,
    total: result.total,
  };
}

// ─── 7. Runtime HP helpers ───────────────────────────────────────────────────

export function applyCocHpDelta(params: {
  currentHp: number;
  maxHp: number;
  delta: number;
  wasMajorWound: boolean;
}): {
  nextHp: number;
  isMajorWound: boolean;
  isDying: boolean;
  isUnconscious: boolean;
  majorWoundTriggered: boolean;
} {
  const currentHp = Math.max(0, safeInt(params.currentHp));
  const maxHp = Math.max(0, safeInt(params.maxHp));
  const delta = safeInt(params.delta);
  const nextHp = Math.max(0, Math.min(maxHp, currentHp + delta));
  const damage = delta < 0 ? Math.abs(delta) : 0;
  const majorWoundTriggered = damage >= Math.floor(maxHp / 2) && damage > 0;
  const isMajorWound = Boolean(params.wasMajorWound) || majorWoundTriggered;
  const isDying = nextHp <= 0 && isMajorWound;
  const isUnconscious = nextHp <= 0 && !isMajorWound;

  return {
    nextHp,
    isMajorWound,
    isDying,
    isUnconscious,
    majorWoundTriggered,
  };
}
