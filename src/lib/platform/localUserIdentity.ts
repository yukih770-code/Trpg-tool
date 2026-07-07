/**
 * Local anonymous user identity + UserRepository skeleton (P5.1).
 *
 * AI-LANDMARK: LOCAL_ANONYMOUS_USER_IDENTITY_V1
 * AI-LANDMARK: USER_REPOSITORY_SKELETON_V1
 *
 * Offline-first identity foundation:
 * - A device-local anonymous user is created lazily on first use, persisted in
 *   localStorage, and stays stable across restarts. No login, no network, no
 *   cloud dependency, no vendor SDK.
 * - This user is the FUTURE owner of local content (ownerId backfill happens in
 *   a later P5 step — nothing is migrated here).
 *
 * Boundary fit (P4 — evolved, not redesigned):
 * - Identity shape reuses `AuthIdentity` (cloudBackendAdapters) with the new
 *   additive providerKind 'localAnonymous'.
 * - Profile shape reuses `UserProfile` (userProfile.ts) — metadata only.
 * - Ids come from the central identity factory (platformObjectIdentity).
 * - Projection integration goes through the existing `ViewerContext`.
 *
 * The repository intentionally keeps a minimal surface. A future cloud
 * UserRepository implements the SAME interface behind an adapter; callers never
 * talk to a vendor SDK.
 */

import type { AuthIdentity } from './cloudBackendAdapters';
import type { UserProfile } from './userProfile';
import type { ViewerContext } from '../architecture/projection';
import { identityFactory } from './platformObjectIdentity';
// P5.5: shared local persistence adapter (same key, same behavior, one impl).
import { createLocalJsonStore } from './localPersistenceAdapter';

// ── Record shape ─────────────────────────────────────────────────────────────

export interface LocalUserRecord {
  schemaVersion: 1;
  identity: AuthIdentity;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

// ── Repository contract (future cloud implementations use the same interface) ─

export interface UserRepository {
  /** Returns the persisted current user, or null when none exists yet. */
  loadCurrentUser(): LocalUserRecord | null;
  /** Creates (and persists) a fresh anonymous local user. */
  createAnonymousUser(): LocalUserRecord;
  /** Loads the current user, creating the anonymous user on first launch. */
  getOrCreateCurrentUser(): LocalUserRecord;
  /** Persists a full user record (updatedAt is refreshed). */
  saveUser(record: LocalUserRecord): LocalUserRecord;
  /** Shallow-merges profile metadata onto the current user and persists. */
  updateProfile(patch: Partial<Omit<UserProfile, 'userId'>>): LocalUserRecord;
}

// ── Local persistence (existing localStorage layer; no backend, no DB) ───────

export const LOCAL_USER_STORAGE_KEY = 'trpg-platform-local-user-v1';

function nowIso(): string {
  return new Date().toISOString();
}

function makeDefaultAnonymousRecord(): LocalUserRecord {
  const userId = identityFactory.createUserId();
  const createdAt = nowIso();
  return {
    schemaVersion: 1,
    identity: {
      userId,
      providerKind: 'localAnonymous',
      displayName: '本地玩家',
    },
    profile: {
      userId,
      handle: `local-${userId.slice(-6)}`,
      displayName: '本地玩家',
      tags: [],
      visibility: 'private',
      pinned: [],
      sectionVisibility: {},
    },
    createdAt,
    updatedAt: createdAt,
  };
}

function isLocalUserRecord(value: unknown): value is LocalUserRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<LocalUserRecord>;
  return (
    r.schemaVersion === 1 &&
    !!r.identity &&
    typeof r.identity === 'object' &&
    typeof (r.identity as AuthIdentity).userId === 'string' &&
    !!r.profile &&
    typeof r.profile === 'object' &&
    typeof (r.profile as UserProfile).userId === 'string'
  );
}

// P5.5: persistence goes through the shared local adapter (same key, same
// semantics). `cacheFallback: false` preserves the P5.1 behavior of re-checking
// storage until a real record exists; corrupt data still self-heals on the
// next getOrCreateCurrentUser call, and write failures never break offline play.
const localUserStore = createLocalJsonStore<LocalUserRecord | null>({
  key: LOCAL_USER_STORAGE_KEY,
  fallback: () => null,
  validate: (value): value is LocalUserRecord | null => isLocalUserRecord(value),
  cacheFallback: false,
});

// ── Repository implementation (local adapter) ────────────────────────────────

export const localUserRepository: UserRepository = {
  loadCurrentUser(): LocalUserRecord | null {
    return localUserStore.read();
  },

  createAnonymousUser(): LocalUserRecord {
    const record = makeDefaultAnonymousRecord();
    localUserStore.write(record);
    return record;
  },

  getOrCreateCurrentUser(): LocalUserRecord {
    return localUserRepository.loadCurrentUser() ?? localUserRepository.createAnonymousUser();
  },

  saveUser(record: LocalUserRecord): LocalUserRecord {
    const next: LocalUserRecord = { ...record, updatedAt: nowIso() };
    localUserStore.write(next);
    return next;
  },

  updateProfile(patch: Partial<Omit<UserProfile, 'userId'>>): LocalUserRecord {
    const current = localUserRepository.getOrCreateCurrentUser();
    const next: LocalUserRecord = {
      ...current,
      profile: { ...current.profile, ...patch, userId: current.profile.userId },
      updatedAt: nowIso(),
    };
    localUserStore.write(next);
    return next;
  },
};

// ── First-launch hook + projection bridge ────────────────────────────────────

/**
 * Idempotent first-launch bootstrap: ensures the device has a stable anonymous
 * user. Safe to call from app startup; returns the (existing or new) record.
 */
export function ensureLocalUserIdentity(): LocalUserRecord {
  return localUserRepository.getOrCreateCurrentUser();
}

/** Bridge the local user into the existing P4 projection ViewerContext. */
export function toViewerContext(record: LocalUserRecord): ViewerContext {
  return { userId: record.identity.userId, role: 'owner' };
}
