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
 * bonuses, no advantage/disadvantage, no COC bonus dice, no CP RED exploding, no
 * character-sheet checks. v0 expression = one or more `[N]dM` dice terms plus
 * integer +/- modifiers (e.g. d20, 1d20, 2d6, 1d20+5, 1d20-1, 3d8+2, d100,
 * 2d20+1d6, d20+10-5).
 *
 * type-only import of RoomRuntimeLogEvent is one-directional (roomRuntimeLogTypes
 * does NOT import this module → no cycle).
 */

import type { RoomRuntimeLogEvent } from './roomRuntimeLogTypes';

export interface SharedDiceTermResult {
  count: number;
  sides: number;
  rolls: number[];
  subtotal: number;
}

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
}

export interface SharedDiceRollRequest {
  memberId: string;
  expression: string;
  label?: string;
}

export type SharedDiceRollResponse =
  | { ok: true; event: RoomRuntimeLogEvent; roll: SharedDiceRollResult }
  | { ok: false; error: string; message: string };
