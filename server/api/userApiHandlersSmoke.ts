/**
 * User API handler contract smoke (P5.10F) — fake repository, no database.
 *
 * Verifies the P5.10E `createUserApiHandlers` boundary WITHOUT a real Postgres
 * connection by injecting a fake `PostgresUserRepository`. It asserts the safe
 * envelope (status code + error kind) for success / bad_request / not_found /
 * unavailable / internal / validation, and that `saveUserProfileHandler` works
 * through a fake repo (but is never mounted as a public route — see room-server).
 *
 * Server-only: imports NOTHING from `src/` UI and never touches DATABASE_URL.
 */

import type { AuthIdentity } from '../../src/lib/platform/cloudBackendAdapters.js';
import type {
  CreateUserWithIdentityInput,
  PostgresUserProfile,
  PostgresUserRecord,
  PostgresUserRepository,
  PostgresUserRepositoryErrorKind,
  PostgresUserRepositoryResult,
} from '../adapters/postgresUserRepository.js';
import { createUserApiHandlers } from './userApiHandlers.js';
import type { ServerApiResponse } from './apiResponse.js';

// ── Fake repository (no DB, no pg) ───────────────────────────────────────────

export interface FakeUserRepositoryConfig {
  userById?: Record<string, PostgresUserRecord | null>;
  profileByUser?: Record<string, PostgresUserProfile | null>;
  userByIdentity?: Record<string, PostgresUserRecord | null>;
  /** When set, every read returns this repository error (unavailable/internal). */
  readError?: { kind: PostgresUserRepositoryErrorKind; retryable?: boolean };
  /** Optional custom saveUserProfile behavior; defaults to echo-ok. */
  saveProfile?: (profile: PostgresUserProfile) => PostgresUserRepositoryResult<PostgresUserProfile>;
}

function ok<T>(value: T): PostgresUserRepositoryResult<T> {
  return { ok: true, value };
}

/** A fully-typed fake `PostgresUserRepository`. No network, no DB. */
export function createFakeUserRepository(config: FakeUserRepositoryConfig = {}): PostgresUserRepository {
  const err = <T>(): PostgresUserRepositoryResult<T> =>
    ({ ok: false, error: { kind: config.readError!.kind, message: 'fake repository error', retryable: config.readError?.retryable } });

  return {
    async getUserById(userId) {
      if (config.readError) return err<PostgresUserRecord | null>();
      return ok(config.userById?.[userId] ?? null);
    },
    async getUserByIdentity(providerKind, providerSubject) {
      if (config.readError) return err<PostgresUserRecord | null>();
      return ok(config.userByIdentity?.[`${providerKind}:${providerSubject}`] ?? null);
    },
    async getUserProfile(userId) {
      if (config.readError) return err<PostgresUserProfile | null>();
      return ok(config.profileByUser?.[userId] ?? null);
    },
    async saveUserProfile(profile) {
      if (config.saveProfile) return config.saveProfile(profile);
      if (config.readError) return err<PostgresUserProfile>();
      return ok(profile);
    },
    // Not exercised by the API handlers under test; benign defaults for the interface.
    async createUserWithIdentity(input: CreateUserWithIdentityInput) {
      return ok<PostgresUserRecord>({ identity: input.identity, profile: input.profile as PostgresUserProfile | undefined });
    },
    async checkReadiness() {
      return ok({ usersTable: true, identitiesTable: true, profilesTable: true });
    },
  };
}

// ── Sample data ──────────────────────────────────────────────────────────────

const sampleIdentity: AuthIdentity = {
  userId: 'user_sample_1',
  providerKind: 'localAnonymous',
  providerUserId: 'subject_1',
  displayName: 'Sample User',
};

const sampleProfile: PostgresUserProfile = {
  userId: 'user_sample_1',
  handle: 'sample-user',
  displayName: 'Sample User',
  tags: [],
  visibility: 'private',
  pinned: [],
  sectionVisibility: {},
};

const sampleRecord: PostgresUserRecord = {
  identity: sampleIdentity,
  profile: sampleProfile,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// ── Assertions ───────────────────────────────────────────────────────────────

export interface SmokeCaseResult {
  name: string;
  pass: boolean;
  expected: { ok: boolean; statusCode: number; errorKind?: string };
  actual: { ok: boolean; statusCode: number; errorKind?: string };
}

export interface UserApiHandlersSmokeReport {
  checkedAt: string;
  total: number;
  passed: number;
  failed: number;
  usesDatabase: false;
  cases: SmokeCaseResult[];
}

function evaluate(
  name: string,
  response: ServerApiResponse<unknown>,
  expected: { ok: boolean; statusCode: number; errorKind?: string },
): SmokeCaseResult {
  const actual = {
    ok: response.ok,
    statusCode: response.statusCode,
    errorKind: response.ok ? undefined : response.error.kind,
  };
  const pass =
    actual.ok === expected.ok &&
    actual.statusCode === expected.statusCode &&
    (expected.errorKind === undefined || actual.errorKind === expected.errorKind);
  return { name, pass, expected, actual };
}

export async function runUserApiHandlersSmoke(): Promise<UserApiHandlersSmokeReport> {
  const cases: SmokeCaseResult[] = [];

  // Handlers backed by a fake repo with sample data.
  const found = createUserApiHandlers({
    userRepository: createFakeUserRepository({
      userById: { user_sample_1: sampleRecord, missing_user: null },
      profileByUser: { user_sample_1: sampleProfile, missing_user: null },
      userByIdentity: { 'localAnonymous:subject_1': sampleRecord },
    }),
  });

  cases.push(evaluate('getUserByIdHandler.success', await found.getUserByIdHandler({ userId: 'user_sample_1' }), { ok: true, statusCode: 200 }));
  cases.push(evaluate('getUserByIdHandler.not_found', await found.getUserByIdHandler({ userId: 'missing_user' }), { ok: false, statusCode: 404, errorKind: 'not_found' }));
  cases.push(evaluate('getUserByIdHandler.bad_request', await found.getUserByIdHandler({ userId: '   ' }), { ok: false, statusCode: 400, errorKind: 'bad_request' }));

  cases.push(evaluate('getUserProfileHandler.success', await found.getUserProfileHandler({ userId: 'user_sample_1' }), { ok: true, statusCode: 200 }));
  cases.push(evaluate('getUserProfileHandler.not_found', await found.getUserProfileHandler({ userId: 'missing_user' }), { ok: false, statusCode: 404, errorKind: 'not_found' }));

  cases.push(evaluate('getUserByIdentityHandler.success', await found.getUserByIdentityHandler({ providerKind: 'localAnonymous', providerSubject: 'subject_1' }), { ok: true, statusCode: 200 }));
  cases.push(evaluate('getUserByIdentityHandler.bad_request', await found.getUserByIdentityHandler({ providerKind: 'localAnonymous' }), { ok: false, statusCode: 400, errorKind: 'bad_request' }));

  // Repository error mappings.
  const unavailable = createUserApiHandlers({ userRepository: createFakeUserRepository({ readError: { kind: 'not_configured' } }) });
  cases.push(evaluate('repository.not_configured→unavailable', await unavailable.getUserByIdHandler({ userId: 'user_sample_1' }), { ok: false, statusCode: 503, errorKind: 'unavailable' }));

  const dbError = createUserApiHandlers({ userRepository: createFakeUserRepository({ readError: { kind: 'database_error', retryable: true } }) });
  cases.push(evaluate('repository.database_error→unavailable', await dbError.getUserProfileHandler({ userId: 'user_sample_1' }), { ok: false, statusCode: 503, errorKind: 'unavailable' }));

  const internal = createUserApiHandlers({ userRepository: createFakeUserRepository({ readError: { kind: 'unknown' } }) });
  cases.push(evaluate('repository.unknown→internal', await internal.getUserByIdHandler({ userId: 'user_sample_1' }), { ok: false, statusCode: 500, errorKind: 'internal' }));

  // saveUserProfileHandler — validation + success (handler exists, but NOT mounted).
  cases.push(evaluate('saveUserProfileHandler.validation.notObject', await found.saveUserProfileHandler({ profile: 'nope' }), { ok: false, statusCode: 400, errorKind: 'validation' }));
  cases.push(evaluate('saveUserProfileHandler.validation.missingUserId', await found.saveUserProfileHandler({ profile: { handle: 'h', displayName: 'd' } }), { ok: false, statusCode: 400, errorKind: 'bad_request' }));
  cases.push(evaluate('saveUserProfileHandler.success', await found.saveUserProfileHandler({ profile: { userId: 'user_sample_1', handle: 'sample-user', displayName: 'Sample User' } }), { ok: true, statusCode: 200 }));

  const passed = cases.filter((c) => c.pass).length;
  return {
    checkedAt: new Date().toISOString(),
    total: cases.length,
    passed,
    failed: cases.length - passed,
    usesDatabase: false,
    cases,
  };
}
