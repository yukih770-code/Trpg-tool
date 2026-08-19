/**
 * Shared Dice contracts (v0, types only).
 *
 * AI-LANDMARK: SHARED_DICE_TYPES_V0
 *
 * Platform-level, system-agnostic contracts for the SERVER-authoritative manual
 * shared dice fallback (M25). The server parses the expression and rolls (no
 * client random, no eval). A SharedDiceRollResult is stored as the payload of a
 * `dice.roll` RuntimeLog event and broadcast via the existing runtimeLogAppended.
 *
 * Positioning: a MANUAL fallback dice tray — NOT a rules engine. No system
 * bonuses, no COC bonus dice, no CP RED exploding, no character-sheet checks.
 * v0 expression = one or more `[N]dM` dice terms plus integer +/- modifiers
 * (e.g. d20, 1d20, 2d6, 1d20+5, 1d20-1, 3d8+2, d100, 2d20+1d6, d20+10-5).
 *
 * T1 adds ONE narrow semantic layer on the same expression grammar: a d20 check
 * may carry `mode` (advantage/disadvantage) and an optional `dc`. The semantic
 * fields are additive and optional; every field an older reader knows
 * (`terms`, `modifier`, `total`, `normalizedExpression`) keeps its meaning, and
 * a request without `mode`/`dc` produces exactly the v0 result shape.
 *
 * type-only import of RoomRuntimeLogEvent is one-directional (roomRuntimeLogTypes
 * does NOT import this module → no cycle).
 */

// NodeNext note: shared with the Room Server program — keep the .js suffix.
import type { RoomRuntimeLogEvent } from './roomRuntimeLogTypes.js';

export interface SharedDiceTermResult {
  count: number;
  sides: number;
  rolls: number[];
  subtotal: number;
}

/** Semantic d20 roll mode. Only meaningful for a single-d20 expression. */
export type SharedDiceRollMode = 'normal' | 'advantage' | 'disadvantage';

/** Derived ONLY from `total >= dc`. Never from a natural die face. */
export type SharedDiceRollOutcome = 'success' | 'failure';

export interface SharedDiceRollResult {
  /** The raw expression as submitted. */
  expression: string;
  /** Canonical normalized form, e.g. "1d20+5". */
  normalizedExpression: string;
  label?: string;
  terms: SharedDiceTermResult[];
  /** Net flat modifier (signed sum of integer terms). */
  modifier: number;
  total: number;

  // ── Additive semantic d20 metadata (T1) ───────────────────────────────────
  // Present ONLY when the request supplied `mode` and/or `dc` AND the parsed
  // expression is exactly one d20 term plus an optional modifier. Absent on
  // every ordinary pool roll, so v0 payloads and readers are unaffected.

  /** Resolved roll mode for this d20 check. */
  mode?: SharedDiceRollMode;
  /** Every d20 face rolled: two for advantage/disadvantage, one for normal. */
  rawRolls?: number[];
  /** The d20 face that contributed to `total`; it is also the face in `terms`. */
  keptRoll?: number;
  /** Difficulty class supplied with the request. */
  dc?: number;
  /** `total >= dc`. Present only when `dc` is. */
  outcome?: SharedDiceRollOutcome;
  /** Metadata only: the kept face was 20. Applies NO automatic success. */
  isNatural20?: boolean;
  /** Metadata only: the kept face was 1. Applies NO automatic failure. */
  isNatural1?: boolean;
}

export interface SharedDiceRollRequest {
  memberId: string;
  expression: string;
  label?: string;
  /** Optional semantic d20 mode; rejected on a non-d20 expression. */
  mode?: SharedDiceRollMode;
  /** Optional check DC; rejected on a non-d20 expression. */
  dc?: number;
}

export type SharedDiceRollResponse =
  | { ok: true; event: RoomRuntimeLogEvent; roll: SharedDiceRollResult }
  | { ok: false; error: string; message: string };
