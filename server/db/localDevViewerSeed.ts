/**
 * Local development viewer fixture (idempotent).
 *
 * AI-LANDMARK: LOCAL_DEV_VIEWER_SEED_V1
 *
 * `dev:local` runs with the local development identity seam, where the browser
 * sends `x-dev-user-id: $VITE_DEV_VIEWER_USER_ID` and the server accepts it
 * WITHOUT a database lookup (see `resolveApiAuthSession`). Reads therefore work
 * against a database that has no such user — they simply return nothing — while
 * the first write fails on a foreign key (`world_servers.owner_id -> users`).
 *
 * `Ensure-LocalDatabaseReady` guaranteed migrations and schema readiness but
 * never guaranteed this one row, so a recreated PostgreSQL volume produced a
 * runtime that looked completely healthy and could not create anything.
 *
 * This module owns only the decision. It is dependency-free at runtime (the
 * repository types are `import type`), so the contract is smoke-testable
 * without a database or the `pg` driver.
 */

import type {
  CreateUserWithIdentityInput,
  PostgresUserRecord,
  PostgresUserRepository,
  PostgresUserRepositoryResult,
} from '../adapters/postgresUserRepository.js';

/** Narrow port: read one user, create one user. No profile rewrite, no delete. */
export interface LocalDevViewerSeedRepository {
  getUserById(userId: string): Promise<PostgresUserRepositoryResult<PostgresUserRecord | null>>;
  createUserWithIdentity(
    input: CreateUserWithIdentityInput,
  ): Promise<PostgresUserRepositoryResult<PostgresUserRecord>>;
}

/** Compile-time proof the narrow port stays a subset of the real repository. */
export type LocalDevViewerSeedRepositoryShape =
  PostgresUserRepository extends LocalDevViewerSeedRepository ? true : never;

export type SeedLocalDevViewerDecision =
  /** The row was absent and has now been created. */
  | 'seeded'
  /** A user with this id already existed; nothing was written. */
  | 'alreadyPresent'
  /** No usable `VITE_DEV_VIEWER_USER_ID` was configured. */
  | 'missingConfiguration'
  /** The database could not be reached or the schema is not ready. */
  | 'unavailable';

export interface SeedLocalDevViewerResult {
  decision: SeedLocalDevViewerDecision;
  /** The configured local dev viewer id. Local fixture id only; never a secret. */
  userId?: string;
  /** Safe repository error kind when `decision` is `unavailable`. */
  errorKind?: string;
  notes: string[];
}

export const LOCAL_DEV_VIEWER_PROVIDER_KIND = 'localAnonymous';
export const LOCAL_DEV_VIEWER_DISPLAY_NAME = 'Local Dev Viewer';
export const LOCAL_DEV_VIEWER_ENV_KEY = 'VITE_DEV_VIEWER_USER_ID';

/**
 * Builds the fixture identity. The handle is intentionally left unset so the
 * repository derives its deterministic default from the user id — a second run
 * with the same id can never collide with the first.
 */
function fixtureInput(userId: string): CreateUserWithIdentityInput {
  return {
    identity: {
      userId,
      providerKind: LOCAL_DEV_VIEWER_PROVIDER_KIND,
      // Stable subject: re-running must not create a second identity row.
      providerUserId: userId,
      displayName: LOCAL_DEV_VIEWER_DISPLAY_NAME,
    },
    providerSubject: userId,
    profile: {
      displayName: LOCAL_DEV_VIEWER_DISPLAY_NAME,
      bio: 'Local development fixture created by dev:local. Not a real account.',
      tags: ['local-dev'],
      visibility: 'private',
      pinned: [],
      sectionVisibility: {},
    },
  };
}

export function readLocalDevViewerUserId(
  env: Record<string, string | undefined>,
): string | undefined {
  const raw = env[LOCAL_DEV_VIEWER_ENV_KEY];
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Ensures the configured local dev viewer exists. Safe to run on every start:
 *  - an existing user is READ and left exactly as it is (no profile reset);
 *  - the user is created only when the lookup proves it absent;
 *  - a `conflict` from a concurrent run is treated as already present.
 */
export async function seedLocalDevViewer(
  repository: LocalDevViewerSeedRepository,
  userId: string | undefined,
): Promise<SeedLocalDevViewerResult> {
  if (!userId) {
    return {
      decision: 'missingConfiguration',
      notes: [`${LOCAL_DEV_VIEWER_ENV_KEY} is missing or blank; the local development identity cannot be prepared.`],
    };
  }

  const existing = await repository.getUserById(userId);
  if (existing.ok === false) {
    return {
      decision: 'unavailable',
      userId,
      errorKind: existing.error.kind,
      notes: ['The local dev viewer could not be looked up; the database is not ready.'],
    };
  }
  if (existing.value) {
    return {
      decision: 'alreadyPresent',
      userId,
      notes: ['The configured local dev viewer already exists; no profile, identity or state was rewritten.'],
    };
  }

  const created = await repository.createUserWithIdentity(fixtureInput(userId));
  if (created.ok === false) {
    if (created.error.kind === 'conflict') {
      // Another dev:local start won the race; the row we needed now exists.
      return {
        decision: 'alreadyPresent',
        userId,
        notes: ['A concurrent run created the local dev viewer first; nothing was rewritten.'],
      };
    }
    return {
      decision: 'unavailable',
      userId,
      errorKind: created.error.kind,
      notes: ['The local dev viewer could not be created.'],
    };
  }

  return {
    decision: 'seeded',
    userId,
    notes: [`Created the local development user "${LOCAL_DEV_VIEWER_DISPLAY_NAME}" so local writes have a valid owner.`],
  };
}
