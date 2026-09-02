/**
 * Combat-relevant character source hash (T11a, server side).
 *
 * AI-LANDMARK: DND_CHARACTER_COMBAT_RELEVANT_HASH_V1
 *
 * Owns the digest for the covered set defined by
 * `dndCharacterCombatRelevantFields`. Hashing stays server-side for the same
 * reason clearance hashing does: a client-supplied hash is never trusted.
 *
 * What this hash is NOT:
 *  - It is not the clearance hash. `hashActorSnapshot` covers the
 *    `clearanceRelevant` tier and feeds the admission pipeline that gates room
 *    entry. This one gates nothing. It never produces an admission status, and
 *    in particular it never produces `ActorAdmissionStatus = 'stale'`.
 *  - It is not authority. A difference means "a host may want to look", not
 *    "this character is invalid", "this player must leave", or "re-derive the
 *    combat sheet".
 */

import { createHash } from 'node:crypto';

import {
  DND_CHARACTER_COMBAT_RELEVANT_FIELD_VERSION,
  canonicalDndCharacterCombatRelevantJsonFromPayload,
} from '../../src/lib/dnd/dndCharacterCombatRelevantFields.js';

/** The only system whose characters this covered set understands. */
export const DND_COMBAT_RELEVANT_HASH_SYSTEM_ID = 'dnd5e-2024';

/**
 * Self-describing stored prefix.
 *
 * `campaign_actor_instances.snapshot_hash` is a bare TEXT column shared with
 * anything else that may later want to store a hash there. The prefix carries
 * the system, the covered set, its version and the algorithm, so a stored value
 * this build does not recognise reads as UNKNOWN instead of being compared
 * against a string it was never comparable to.
 */
export const DND_COMBAT_RELEVANT_HASH_PREFIX =
  `${DND_COMBAT_RELEVANT_HASH_SYSTEM_ID}:combatRelevantV${DND_CHARACTER_COMBAT_RELEVANT_FIELD_VERSION}:sha256:`;

/**
 * Whether a stored `snapshot_hash` was written by THIS build's covered set.
 *
 * A `false` here must be treated as "unknown", never as "changed": an older or
 * newer field version is simply not comparable.
 */
export function isDndCharacterCombatRelevantHash(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.startsWith(DND_COMBAT_RELEVANT_HASH_PREFIX);
}

/**
 * Computes the stored hash string for a DND character snapshot payload.
 *
 * Returns `undefined` when the payload is not a character this build can read.
 * A character that cannot be read must produce NO hash, so the row keeps its
 * NULL and comparison honestly reports "unknown".
 */
export function formatDndCharacterCombatRelevantHash(payload: unknown): string | undefined {
  const canonical = canonicalDndCharacterCombatRelevantJsonFromPayload(payload);
  if (canonical === undefined) return undefined;
  // Domain-separated: the prefix is inside the digest as well as in front of
  // it, so this value can never collide with another tier's hash of the same
  // canonical bytes.
  const digest = createHash('sha256')
    .update(`${DND_COMBAT_RELEVANT_HASH_PREFIX}${canonical}`)
    .digest('hex');
  return `${DND_COMBAT_RELEVANT_HASH_PREFIX}${digest}`;
}

/**
 * Result of comparing a stored baseline against the character source as it
 * stands now.
 *
 *  - `unchanged`: both sides readable and identical.
 *  - `changed`: both sides readable and different.
 *  - `unknown`: no stored baseline, an unrecognised stored baseline, or a
 *    current payload this build cannot read. NEVER collapse this to
 *    `unchanged` — a missing baseline is an absence of evidence, and reporting
 *    it as "unchanged" would tell a host a review had happened when none had.
 */
export type DndCharacterSourceChangeStatus = 'unchanged' | 'changed' | 'unknown';

/**
 * Compares the stored campaign baseline against the current Vault payload.
 *
 * Pure apart from the digest. It reads no database and mutates nothing: the
 * caller supplies both sides.
 */
export function compareDndCharacterCombatRelevantHash(input: {
  storedHash: string | undefined | null;
  currentPayload: unknown;
}): DndCharacterSourceChangeStatus {
  const stored = typeof input.storedHash === 'string' ? input.storedHash.trim() : '';
  if (!stored || !isDndCharacterCombatRelevantHash(stored)) return 'unknown';
  const current = formatDndCharacterCombatRelevantHash(input.currentPayload);
  if (current === undefined) return 'unknown';
  return current === stored ? 'unchanged' : 'changed';
}

/**
 * The projected boolean, or `undefined` when the answer is unknown.
 *
 * Omission is the honest projection of "unknown": the field is optional
 * precisely so a reader cannot mistake absence for "verified unchanged".
 */
export function sourceChangedSinceApprovalFlag(
  status: DndCharacterSourceChangeStatus,
): boolean | undefined {
  return status === 'unknown' ? undefined : status === 'changed';
}
