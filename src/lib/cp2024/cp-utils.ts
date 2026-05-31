/**
 * cp-utils.ts  —  Cyberpunk RED 2045 pure-function rule utilities
 *
 * Contract
 * ────────
 * • All functions are pure (no React, no Zustand, no localStorage).
 * • All numeric inputs are coerced through safeNum() — NaN / undefined /
 *   non-finite values silently fall back to 0.
 * • Nothing in this file imports from any store, page, or MCP.
 * • This file does NOT import from cpStore.ts to avoid circular dependencies.
 *   The HP formula here mirrors computeCpDerived() in cpStore.ts exactly.
 *
 * Sections
 * ────────
 *   1. Internal helpers
 *   2. Derived stat functions    (HP / Seriously Wounded / Death Save /
 *                                 Humanity / EMP / Skill Base / REF / MOVE)
 *   3. Roll-evaluation types     (CpD10RollResult / CpSkillCheckResult)
 *   4. Roll-evaluation functions (evaluateCpExplodingD10 / evaluateCpSkillCheck)
 *   5. Armor / Damage functions  (getCpArmorPenetration /
 *                                 getCpHeadshotDamageAfterArmor /
 *                                 hasCpCriticalInjury)
 *
 * Source rule references
 * ──────────────────────
 * Cyberpunk RED Core Rulebook (R. Talsorian Games, 2020)
 *   HP              p.186
 *   Seriously Wounded / Mortally Wounded  p.187
 *   Death Save      p.188
 *   Humanity / EMP  p.228
 *   Skill total     p.130
 *   REF & MOVE penalties from armor  p.182
 *   Exploding d10   p.130
 *   Armor SP / ablation  p.183
 *   Headshot        p.184
 *   Critical injuries    p.184
 */

import type { CpCharacter, CpRuntimeState } from '../cp-types';

// ─── 1. Internal helpers ──────────────────────────────────────────────────────

/**
 * Coerce any value to a finite number.
 * Returns `fallback` (default 0) for NaN / Infinity / non-numeric inputs.
 */
function safeNum(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Coerce any value to a finite integer (floor towards −∞).
 */
function safeInt(v: unknown, fallback = 0): number {
  return Math.floor(safeNum(v, fallback));
}

function clampNumber(value: number, min: number, max: number): number {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.max(low, Math.min(high, safeNum(value, low)));
}

// ─── 2. Derived stat functions ────────────────────────────────────────────────

// ── HP ────────────────────────────────────────────────────────────────────────

/**
 * getCpMaxHp
 *
 * Cyberpunk RED Core Rulebook p.186
 * Max HP = 10 + ceil((BODY + WILL) / 2) × 5
 *
 * This formula exactly mirrors computeCpDerived() in cpStore.ts.
 * Minimum result is 10 (both stats at 0).
 */
export function getCpMaxHp(body: number, will: number): number {
  const b = safeNum(body);
  const w = safeNum(will);
  return 10 + Math.ceil((b + w) / 2) * 5;
}

// ── Wound states ──────────────────────────────────────────────────────────────

/**
 * getCpSeriouslyWoundedThreshold
 *
 * Cyberpunk RED Core Rulebook p.187
 * Seriously Wounded threshold = ceil(maxHp / 2)
 */
export function getCpSeriouslyWoundedThreshold(maxHp: number): number {
  return Math.ceil(safeNum(maxHp) / 2);
}

/**
 * isCpSeriouslyWounded
 *
 * Returns true when current HP is at or below the Seriously Wounded threshold.
 * At this point the character suffers a −2 penalty to all actions.
 */
export function isCpSeriouslyWounded(
  currentHp: number,
  maxHp: number,
): boolean {
  const threshold = getCpSeriouslyWoundedThreshold(maxHp);
  return safeNum(currentHp) <= threshold;
}

/**
 * isCpMortallyWounded
 *
 * Returns true when current HP drops to 0 or below.
 * The character must begin making Death Saves each turn.
 */
export function isCpMortallyWounded(currentHp: number): boolean {
  return safeNum(currentHp) <= 0;
}

// ── Death Save ────────────────────────────────────────────────────────────────

/**
 * getCpDeathSaveBase
 *
 * Cyberpunk RED Core Rulebook p.188
 * Death Save target = BODY stat value.
 * Roll ≥ BODY on a d10 to survive; each failed save raises the required roll by 1.
 */
export function getCpDeathSaveBase(body: number): number {
  return safeNum(body);
}

// ── Humanity & EMP ────────────────────────────────────────────────────────────

/**
 * getCpHumanityMax
 *
 * Cyberpunk RED Core Rulebook p.228
 * Maximum Humanity = EMP × 10
 */
export function getCpHumanityMax(emp: number): number {
  return Math.max(0, safeNum(emp)) * 10;
}

/**
 * getCpRuntimeEmp
 *
 * The effective EMP stat derived from current Humanity at runtime.
 * Cyberpunk RED Core Rulebook p.228
 * Runtime EMP = floor(humanityCurrent / 10), minimum 0.
 *
 * Note: this is the EMP value used for all skill checks; it drops as
 * Humanity is lost to cyberware installation.
 */
export function getCpRuntimeEmp(humanityCurrent: number): number {
  return Math.max(0, Math.floor(safeNum(humanityCurrent) / 10));
}

/**
 * Explicit alias for the absolute runtime EMP calculation. This intentionally
 * does not replace cpStore.computeEmpFromHumanity(), which preserves legacy
 * delta-based EMP behavior for existing store actions.
 */
export function computeCpRuntimeEmpFromHumanity(humanityCurrent: number): number {
  return getCpRuntimeEmp(humanityCurrent);
}

/**
 * isCpCyberpsycho
 *
 * Returns true when Humanity reaches 0 or below, triggering Cyberpsychosis.
 * Cyberpunk RED Core Rulebook p.229
 */
export function isCpCyberpsycho(humanityCurrent: number): boolean {
  return safeNum(humanityCurrent) <= 0;
}

// ── Skill & movement checks ───────────────────────────────────────────────────

/**
 * getCpSkillBase
 *
 * Cyberpunk RED Core Rulebook p.130
 * Skill Check base = STAT + Skill Level
 * (The d10 roll and any modifiers are added on top of this.)
 */
export function getCpSkillBase(statValue: number, skillLevel: number): number {
  return safeNum(statValue) + safeNum(skillLevel);
}

/**
 * getCpFinalRef
 *
 * Effective REF after applying armor encumbrance penalty.
 * Cyberpunk RED Core Rulebook p.182
 * Minimum 0.
 */
export function getCpFinalRef(rawRef: number, armorPenalty: number): number {
  return Math.max(0, safeNum(rawRef) - safeNum(armorPenalty));
}

/**
 * getCpFinalMove
 *
 * Effective MOVE after applying armor encumbrance penalty.
 * Cyberpunk RED Core Rulebook p.182
 * Minimum 0.
 */
export function getCpFinalMove(rawMove: number, armorPenalty: number): number {
  return Math.max(0, safeNum(rawMove) - safeNum(armorPenalty));
}

// ── Runtime state helpers ─────────────────────────────────────────────────────

export function getCpRuntimeMaxHp(character: CpCharacter): number {
  return Math.max(
    0,
    safeNum(character.hp?.max, safeNum(character.maxHp, getCpMaxHp(character.stats.BODY, character.stats.WILL))),
  );
}

export function getCpRuntimeMaxHumanity(character: CpCharacter): number {
  return Math.max(
    0,
    safeNum(character.humanity?.max, safeNum(character.maxHumanity, getCpHumanityMax(character.stats.EMP))),
  );
}

function buildCpRuntimeArmor(character: CpCharacter, previous?: CpRuntimeState['armor']): CpRuntimeState['armor'] {
  const armor: CpRuntimeState['armor'] = {};

  if (character.armorHead) {
    const maxSp = Math.max(0, safeNum(character.armorHead.sp));
    armor.head = {
      currentSp: clampNumber(previous?.head?.currentSp ?? maxSp, 0, maxSp),
      maxSp,
    };
  }

  if (character.armorBody) {
    const maxSp = Math.max(0, safeNum(character.armorBody.sp));
    armor.body = {
      currentSp: clampNumber(previous?.body?.currentSp ?? maxSp, 0, maxSp),
      maxSp,
    };
  }

  return armor.head || armor.body ? armor : undefined;
}

export function buildInitialCpRuntime(character: CpCharacter): CpRuntimeState {
  const hpMax = getCpRuntimeMaxHp(character);
  const hpCurrent = clampNumber(character.hp?.current ?? hpMax, 0, hpMax);
  const humanityMax = getCpRuntimeMaxHumanity(character);
  const humanityCurrent = clampNumber(character.humanity?.current ?? humanityMax, 0, humanityMax);
  const empMax = Math.max(0, safeNum(character.stats.EMP));
  const empCurrent = clampNumber(computeCpRuntimeEmpFromHumanity(humanityCurrent), 0, empMax);

  return {
    hp: {
      current: hpCurrent,
      max: hpMax,
    },
    humanity: {
      current: humanityCurrent,
      max: humanityMax,
    },
    emp: {
      current: empCurrent,
      max: empMax,
    },
    armor: buildCpRuntimeArmor(character),
    flags: {
      isSeriouslyWounded: isCpSeriouslyWounded(hpCurrent, hpMax),
      isMortallyWounded: isCpMortallyWounded(hpCurrent),
    },
    criticalInjuries: [...(character.injuries ?? [])],
  };
}

export function refreshCpRuntimeDerived(
  runtime: CpRuntimeState,
  character: CpCharacter,
): CpRuntimeState {
  const hpMax = getCpRuntimeMaxHp(character);
  const hpCurrent = clampNumber(runtime.hp.current, 0, hpMax);
  const humanityMax = getCpRuntimeMaxHumanity(character);
  const humanityCurrent = clampNumber(runtime.humanity.current, 0, humanityMax);
  const empMax = Math.max(0, safeNum(character.stats.EMP));
  const empCurrent = clampNumber(computeCpRuntimeEmpFromHumanity(humanityCurrent), 0, empMax);

  return {
    ...runtime,
    hp: {
      current: hpCurrent,
      max: hpMax,
    },
    humanity: {
      current: humanityCurrent,
      max: humanityMax,
    },
    emp: {
      current: empCurrent,
      max: empMax,
    },
    armor: buildCpRuntimeArmor(character, runtime.armor),
    flags: {
      ...runtime.flags,
      isSeriouslyWounded: isCpSeriouslyWounded(hpCurrent, hpMax),
      isMortallyWounded: isCpMortallyWounded(hpCurrent),
    },
    criticalInjuries: runtime.criticalInjuries ?? [],
  };
}

export function applyCpHpDelta(runtime: CpRuntimeState, delta: number): CpRuntimeState {
  const nextHp = clampNumber(runtime.hp.current + safeNum(delta), 0, runtime.hp.max);
  return {
    ...runtime,
    hp: {
      ...runtime.hp,
      current: nextHp,
    },
    flags: {
      ...runtime.flags,
      isSeriouslyWounded: isCpSeriouslyWounded(nextHp, runtime.hp.max),
      isMortallyWounded: isCpMortallyWounded(nextHp),
    },
  };
}

export function applyCpHumanityDelta(runtime: CpRuntimeState, delta: number): CpRuntimeState {
  const nextHumanity = clampNumber(runtime.humanity.current + safeNum(delta), 0, runtime.humanity.max);
  return {
    ...runtime,
    humanity: {
      ...runtime.humanity,
      current: nextHumanity,
    },
    emp: {
      ...runtime.emp,
      current: clampNumber(computeCpRuntimeEmpFromHumanity(nextHumanity), 0, runtime.emp.max),
    },
  };
}

// ─── 3. Roll-evaluation types ─────────────────────────────────────────────────

/**
 * CpD10RollResult
 *
 * The resolved outcome of a single exploding d10 roll.
 *
 * Fields
 * ──────
 * natural                The clamped result of the main d10 (1–10).
 * extra                  The clamped result of the extra d10, if rolled (1–10).
 *                        Present only when natural === 10 (critical success) or
 *                        natural === 1 (critical failure).
 * totalModifierFromCritical
 *                        The bonus or penalty added to the final total:
 *                          critical success  → +extra  (positive)
 *                          critical failure  → -extra  (negative)
 *                          neither           →  0
 * isCriticalSuccess      true when natural === 10.
 * isCriticalFailure      true when natural === 1.
 */
export interface CpD10RollResult {
  natural: number;
  extra?: number;
  totalModifierFromCritical: number;
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
}

/**
 * CpSkillCheckResult
 *
 * The fully resolved outcome of a Cyberpunk RED skill check.
 *
 * Fields
 * ──────
 * stat           The STAT value used.
 * skill          The Skill Level used.
 * base           stat + skill (before roll).
 * natural        The main d10 result (clamped 1–10).
 * extra          The extra d10 result if a critical was triggered (clamped 1–10).
 * luckSpent      Luck points added by the player.
 * modifiers      Net situational modifiers (positive = bonus, negative = penalty).
 * total          base + natural + totalModifierFromCritical + luckSpent + modifiers.
 * dv             Difficulty Value to beat, if provided.
 * success        true/false if dv was provided; undefined otherwise.
 * isCriticalSuccess   true when the d10 roll was a natural 10.
 * isCriticalFailure   true when the d10 roll was a natural 1.
 */
export interface CpSkillCheckResult {
  stat: number;
  skill: number;
  base: number;
  natural: number;
  extra?: number;
  luckSpent: number;
  modifiers: number;
  total: number;
  dv?: number;
  success?: boolean;
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
}

// ─── 4. Roll-evaluation functions ─────────────────────────────────────────────

/**
 * evaluateCpExplodingD10
 *
 * Resolves the "exploding d10" mechanic used for all Cyberpunk RED skill checks.
 * Cyberpunk RED Core Rulebook p.130
 *
 * @param natural  The main d10 result. Must be 1–10; out-of-range values are
 *                 clamped to [1, 10].
 * @param extra    The second d10 result, rolled only when natural === 10 (critical
 *                 success) or natural === 1 (critical failure). Non-numeric or
 *                 out-of-range values are treated as undefined / 0.
 *
 * Critical success  (natural === 10):  totalModifierFromCritical = +extra
 * Critical failure  (natural === 1):   totalModifierFromCritical = −extra
 * Otherwise:                           totalModifierFromCritical = 0
 *
 * The `extra` value is always positive when stored; the sign is conveyed through
 * `isCriticalSuccess` / `isCriticalFailure` and `totalModifierFromCritical`.
 */
export function evaluateCpExplodingD10(
  natural: number,
  extra?: number,
): CpD10RollResult {
  // ── Input coercion ────────────────────────────────────────────────────────
  const clampedNatural = Math.max(1, Math.min(10, safeInt(natural, 5)));

  const isCriticalSuccess = clampedNatural === 10;
  const isCriticalFailure = clampedNatural === 1;
  const isCritical        = isCriticalSuccess || isCriticalFailure;

  // Extra die is only meaningful on a critical; treat invalid values as absent.
  let clampedExtra: number | undefined;
  if (isCritical && extra !== undefined) {
    const n = safeNum(extra, 0);
    if (Number.isFinite(n) && n >= 1 && n <= 10) {
      clampedExtra = Math.floor(n);
    } else if (n > 10) {
      clampedExtra = 10; // clamp generously rather than discard
    } else {
      clampedExtra = undefined;
    }
  }

  // totalModifierFromCritical carries the sign so callers just add it.
  let totalModifierFromCritical = 0;
  if (isCriticalSuccess && clampedExtra !== undefined) {
    totalModifierFromCritical = clampedExtra;
  } else if (isCriticalFailure && clampedExtra !== undefined) {
    totalModifierFromCritical = -clampedExtra;
  }

  return {
    natural:  clampedNatural,
    extra:    clampedExtra,
    totalModifierFromCritical,
    isCriticalSuccess,
    isCriticalFailure,
  };
}

/**
 * evaluateCpSkillCheck
 *
 * Resolves a complete Cyberpunk RED skill check.
 * Cyberpunk RED Core Rulebook p.130–131
 *
 * @param args.stat        STAT value (e.g. REF for Handgun).
 * @param args.skill       Skill Level (0–6 for non-role skills, can be higher).
 * @param args.natural     Main d10 result (clamped 1–10 internally).
 * @param args.extra       Extra d10 result on a critical (clamped 1–10 internally).
 * @param args.luckSpent   Luck points the player declares to add. This function
 *                         does not validate whether the player has enough Luck —
 *                         that responsibility belongs to the store / UI layer.
 * @param args.modifiers   Net situational modifier (positive = advantage,
 *                         negative = penalty). Pack all situational effects into
 *                         a single pre-computed value before calling.
 * @param args.dv          Difficulty Value to beat (optional). When present,
 *                         `success` is set to total >= dv; otherwise undefined.
 *
 * Formula
 * ───────
 *   base  = stat + skill
 *   roll  = evaluateCpExplodingD10(natural, extra)
 *   total = base + natural + roll.totalModifierFromCritical + luckSpent + modifiers
 */
export function evaluateCpSkillCheck(args: {
  stat: number;
  skill: number;
  natural: number;
  extra?: number;
  luckSpent: number;
  modifiers: number;
  dv?: number;
}): CpSkillCheckResult {
  const stat      = safeNum(args.stat);
  const skill     = safeNum(args.skill);
  const luckSpent = safeNum(args.luckSpent);
  const modifiers = safeNum(args.modifiers);

  const base = getCpSkillBase(stat, skill);
  const roll = evaluateCpExplodingD10(args.natural, args.extra);

  const total =
    base +
    roll.natural +
    roll.totalModifierFromCritical +
    luckSpent +
    modifiers;

  const success: boolean | undefined =
    args.dv !== undefined ? total >= safeNum(args.dv) : undefined;

  return {
    stat,
    skill,
    base,
    natural:          roll.natural,
    extra:            roll.extra,
    luckSpent,
    modifiers,
    total,
    dv:               args.dv,
    success,
    isCriticalSuccess: roll.isCriticalSuccess,
    isCriticalFailure: roll.isCriticalFailure,
  };
}

// ─── 5. Armor / Damage functions ──────────────────────────────────────────────

/**
 * ArmorHitResult  (internal return shape shared by both armor functions)
 *
 * penetrates          Whether the hit dealt dealt HP damage.
 * damageAfterArmor    HP damage actually applied to the target.
 * ablatedSp           The armor's SP after this hit (may be reduced by 1).
 */
export interface CpArmorHitResult {
  penetrates: boolean;
  damageAfterArmor: number;
  ablatedSp: number;
}

/**
 * getCpArmorPenetration
 *
 * Resolves a normal (non-headshot) hit against armor.
 * Cyberpunk RED Core Rulebook p.183
 *
 * Rules
 * ─────
 * • If damageTotal ≤ currentSp:
 *     – The hit is absorbed. No HP damage.
 *     – SP is ablated by 1 (armor degrades over time).
 * • If damageTotal > currentSp:
 *     – The hit penetrates. HP damage = damageTotal − currentSp.
 *     – SP is ablated by 1 (minimum 0).
 *
 * Note: ablation always reduces SP by 1 regardless of penetration, per
 * the base rules. Some optional rules vary this; they are not implemented here.
 *
 * @param damageTotal   Total rolled damage (after all dice and modifiers).
 * @param currentSp     Current SP of the relevant armor piece.
 */
export function getCpArmorPenetration(
  damageTotal: number,
  currentSp: number,
): CpArmorHitResult {
  const dmg = Math.max(0, safeNum(damageTotal));
  const sp  = Math.max(0, safeNum(currentSp));

  if (dmg <= sp) {
    return {
      penetrates:       false,
      damageAfterArmor: 0,
      ablatedSp:        Math.max(0, sp - 1),
    };
  }

  return {
    penetrates:       true,
    damageAfterArmor: dmg - sp,
    ablatedSp:        Math.max(0, sp - 1),
  };
}

/**
 * getCpHeadshotDamageAfterArmor
 *
 * Resolves a headshot hit against the head armor slot.
 * Cyberpunk RED Core Rulebook p.184
 *
 * Rules
 * ─────
 * 1. Check whether the raw damageTotal penetrates the head armor (SP check).
 * 2. If it penetrates, double the net damage AFTER subtracting SP.
 *    Formula: (damageTotal − currentHeadSp) × 2
 *    NOT:      damageTotal × 2 − currentHeadSp
 * 3. SP ablation follows the same rule as a normal hit (−1 per hit).
 *
 * @param damageTotal    Total rolled damage before armor.
 * @param currentHeadSp  Current SP of the head armor piece (0 if unarmored).
 */
export function getCpHeadshotDamageAfterArmor(
  damageTotal: number,
  currentHeadSp: number,
): CpArmorHitResult {
  const dmg = Math.max(0, safeNum(damageTotal));
  const sp  = Math.max(0, safeNum(currentHeadSp));

  if (dmg <= sp) {
    // Absorbed — same as body shot
    return {
      penetrates:       false,
      damageAfterArmor: 0,
      ablatedSp:        Math.max(0, sp - 1),
    };
  }

  // Penetrates: net damage × 2
  const netBeforeDoubling = dmg - sp;
  return {
    penetrates:       true,
    damageAfterArmor: netBeforeDoubling * 2,
    ablatedSp:        Math.max(0, sp - 1),
  };
}

/**
 * hasCpCriticalInjury
 *
 * Returns true when a damage roll triggers a Critical Injury.
 * Cyberpunk RED Core Rulebook p.184
 *
 * Rule: A Critical Injury is triggered when two or more individual damage dice
 * show a natural 6, regardless of whether the hit penetrated armor.
 *
 * @param damageDice  Array of individual die results from the damage roll
 *                    (e.g. [3, 6, 6] for a 3d6 roll that showed two sixes).
 *                    Values outside [1, 6] are kept as-is; the caller is
 *                    responsible for supplying valid die results.
 */
export function hasCpCriticalInjury(damageDice: number[]): boolean {
  if (!Array.isArray(damageDice)) return false;
  const sixCount = damageDice.filter(d => safeNum(d) === 6).length;
  return sixCount >= 2;
}
