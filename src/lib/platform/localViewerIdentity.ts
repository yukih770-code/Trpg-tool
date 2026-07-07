/**
 * Local viewer identity bridge + legacy seed-owner compatibility (P5.4).
 *
 * AI-LANDMARK: LOCAL_VIEWER_IDENTITY_BRIDGE_V1
 *
 * Before P5.4, the platform's "current user" was the hardcoded mock id
 * 'author-sample'. P5.1 introduced the real device-local anonymous user; this
 * bridge makes THAT user the active viewer everywhere, while keeping legacy
 * seed content (still stored with ownerId 'author-sample') readable.
 *
 * Compatibility contract — deliberately NARROW:
 * - 'author-sample' is a LEGACY SEED OWNER ALIAS, never the active user.
 * - Seed/mock records keep their stored ownerId (no seed migration). At READ
 *   time only, the literal 'author-sample' resolves to the CURRENT DEVICE's
 *   local anonymous user id, so the local user "owns" the sample content.
 * - Anonymous visitors gain nothing (they have no userId to match), and any
 *   FUTURE real user id (cloud or otherwise) never inherits this behavior —
 *   the alias applies to the literal legacy constant only.
 * - Ownership/projection checks stay in place; this is aliasing, not removal
 *   of filtering.
 *
 * No second user system, no new identity factory, no new storage: everything
 * delegates to the P5.1 `localUserRepository`.
 */

import type { ViewerContext } from '../architecture/projection';
import type { UserProfile } from './userProfile';
import { localUserRepository, toViewerContext } from './localUserIdentity';

/** Legacy mock author id used by seed data. Kept for seed compatibility only. */
export const LEGACY_SAMPLE_AUTHOR_ID = 'author-sample';

/** True when an ownerId is the legacy sample seed owner. */
export function isLegacySampleOwnerId(ownerId?: string | null): boolean {
  return ownerId === LEGACY_SAMPLE_AUTHOR_ID;
}

/** The current (real) local anonymous user id — the active profile identity. */
export function getCurrentLocalProfileUserId(): string {
  return localUserRepository.getOrCreateCurrentUser().identity.userId;
}

/** The current local user's profile (P5.1 record; metadata only). */
export function getCurrentLocalUserProfile(): UserProfile {
  return localUserRepository.getOrCreateCurrentUser().profile;
}

/** The current viewer context — always the local anonymous user (P5.1). */
export function getCurrentLocalViewerContext(): ViewerContext {
  return toViewerContext(localUserRepository.getOrCreateCurrentUser());
}

/**
 * Read-time owner aliasing for seed data: the literal legacy sample owner id
 * resolves to the current local user id; every other id passes through
 * unchanged. Feed the RESULT into projection/ownership comparisons so legacy
 * seed content behaves as owned by the local user — without rewriting seeds.
 */
export function resolveSeedOwnerIdForCurrentUser(ownerId?: string): string | undefined {
  return isLegacySampleOwnerId(ownerId) ? getCurrentLocalProfileUserId() : ownerId;
}

/**
 * Owner comparison with legacy-seed compatibility, symmetric-safe:
 * - raw match keeps legacy callers working (e.g. viewing the sample author's
 *   own profile page still finds seed content), and
 * - resolved match lets the current local user own legacy seed content.
 */
export function seedOwnerMatchesUser(
  ownerId: string | undefined,
  userId: string | undefined,
): boolean {
  if (!ownerId || !userId) return false;
  return ownerId === userId || resolveSeedOwnerIdForCurrentUser(ownerId) === userId;
}

/**
 * True when a REQUESTED owner id refers to the seed-owner alias set: the
 * legacy sample id itself, or the current local user (who owns the seeds via
 * the alias). Used by mock personal-content reads.
 */
export function isSeedOwnerAliasForCurrentUser(ownerId: string): boolean {
  return isLegacySampleOwnerId(ownerId) || ownerId === getCurrentLocalProfileUserId();
}
