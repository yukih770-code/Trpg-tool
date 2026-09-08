/**
 * Canonical Room game-system id registry (P8 boundary cleanup, P0-A).
 *
 * AI-LANDMARK: ROOM_SYSTEM_REGISTRY_V1
 *
 * `RoomSystemId` is an OPAQUE identifier. Membership is decided here and only
 * here: before this module the same four literals were hand-copied into
 * `roomTypes.ts`, `createRoom.ts` and the live-room recovery guard, so adding a
 * Game System meant editing three kernel files and silently forgetting one was
 * possible.
 *
 * This is deliberately NOT a plugin-registration framework. It is a static
 * array plus two predicates. A future Game System is added by appending one
 * string here — nothing registers itself, and nothing outside the platform may
 * contribute an id.
 *
 * Pure: no I/O, no store, no React, no persistence, no rules.
 */

import type { RoomSystemId } from './roomTypes.js';

/**
 * Every system id the platform currently accepts. Order is not meaningful.
 * `custom` is the deliberate escape hatch for a room that declares no system.
 */
export const KNOWN_ROOM_SYSTEM_IDS = ['dnd5e-2024', 'coc7e', 'cp-red', 'custom'] as const;

/** The id assumed when a caller supplies none. Unchanged from the previous inline default. */
export const DEFAULT_ROOM_SYSTEM_ID: RoomSystemId = 'dnd5e-2024';

/**
 * Runtime membership test. This is the single source consulted by room
 * creation and by live-room restart recovery, so the two can never disagree.
 */
export function isKnownRoomSystemId(value: unknown): value is RoomSystemId {
  return typeof value === 'string'
    && (KNOWN_ROOM_SYSTEM_IDS as readonly string[]).includes(value);
}

/**
 * Trims and validates an untrusted value, returning `undefined` rather than a
 * fallback. A caller that wants the default must ask for it explicitly — an
 * unknown id must never be silently rewritten into a supported one.
 */
export function normalizeRoomSystemId(value: unknown): RoomSystemId | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return isKnownRoomSystemId(trimmed) ? trimmed : undefined;
}
