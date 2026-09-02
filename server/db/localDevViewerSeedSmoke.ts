/**
 * Local dev viewer fixture smoke (pure; no database, no `pg`).
 *
 * AI-LANDMARK: LOCAL_DEV_VIEWER_SEED_SMOKE_V1
 *
 * Proves the idempotency contract `dev:local` depends on:
 *  - a missing / blank id is reported, never guessed;
 *  - an existing user is READ and left untouched (no second write of any kind);
 *  - an absent user is created exactly once, with a local-development profile;
 *  - repeated runs converge and never duplicate the user or its identity;
 *  - a database that is not ready is reported as unavailable, not "seeded".
 */

import {
  LOCAL_DEV_VIEWER_DISPLAY_NAME,
  LOCAL_DEV_VIEWER_PROVIDER_KIND,
  readLocalDevViewerUserId,
  seedLocalDevViewer,
  type LocalDevViewerSeedRepository,
} from './localDevViewerSeed.js';
import type {
  CreateUserWithIdentityInput,
  PostgresUserRecord,
  PostgresUserRepositoryErrorKind,
  PostgresUserRepositoryResult,
} from '../adapters/postgresUserRepository.js';

const cases: string[] = [];

function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

const VIEWER_ID = 'local-dev-viewer-001';

interface FakeRepository extends LocalDevViewerSeedRepository {
  readonly reads: string[];
  readonly writes: CreateUserWithIdentityInput[];
  readonly rows: Map<string, PostgresUserRecord>;
}

function userRecord(userId: string, displayName: string): PostgresUserRecord {
  return {
    identity: { userId, providerKind: 'localAnonymous', providerUserId: userId, displayName },
    profile: {
      userId,
      handle: `local-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toLowerCase()}`,
      displayName,
      tags: [],
      visibility: 'private',
      pinned: [],
      sectionVisibility: {},
    },
  };
}

function fakeRepository(options: {
  seededRows?: PostgresUserRecord[];
  readError?: PostgresUserRepositoryErrorKind;
  writeError?: PostgresUserRepositoryErrorKind;
} = {}): FakeRepository {
  const rows = new Map<string, PostgresUserRecord>(
    (options.seededRows ?? []).map((row) => [row.identity.userId, row]),
  );
  const reads: string[] = [];
  const writes: CreateUserWithIdentityInput[] = [];
  return {
    reads,
    writes,
    rows,
    async getUserById(userId): Promise<PostgresUserRepositoryResult<PostgresUserRecord | null>> {
      reads.push(userId);
      if (options.readError) return { ok: false, error: { kind: options.readError, message: 'unavailable' } };
      return { ok: true, value: rows.get(userId) ?? null };
    },
    async createUserWithIdentity(input): Promise<PostgresUserRepositoryResult<PostgresUserRecord>> {
      writes.push(input);
      if (options.writeError) return { ok: false, error: { kind: options.writeError, message: 'write failed' } };
      const record = userRecord(
        input.identity.userId,
        input.identity.displayName ?? LOCAL_DEV_VIEWER_DISPLAY_NAME,
      );
      rows.set(record.identity.userId, record);
      return { ok: true, value: record };
    },
  };
}

// ── Configuration reading ───────────────────────────────────────────────────
check('configured id is read', readLocalDevViewerUserId({ VITE_DEV_VIEWER_USER_ID: VIEWER_ID }) === VIEWER_ID);
check('surrounding whitespace is trimmed', readLocalDevViewerUserId({ VITE_DEV_VIEWER_USER_ID: `  ${VIEWER_ID}  ` }) === VIEWER_ID);
check('blank id is rejected', readLocalDevViewerUserId({ VITE_DEV_VIEWER_USER_ID: '   ' }) === undefined);
check('absent id is rejected', readLocalDevViewerUserId({}) === undefined);

// ── Missing configuration is reported, never guessed ────────────────────────
const unconfigured = fakeRepository();
const missing = await seedLocalDevViewer(unconfigured, undefined);
check('missing id reports missingConfiguration', missing.decision === 'missingConfiguration');
check('missing id performs no read', unconfigured.reads.length === 0);
check('missing id performs no write', unconfigured.writes.length === 0);
check('missing id names the variable in its note', missing.notes.join(' ').includes('VITE_DEV_VIEWER_USER_ID'));

// ── Fresh database: create exactly once ─────────────────────────────────────
const fresh = fakeRepository();
const seeded = await seedLocalDevViewer(fresh, VIEWER_ID);
check('fresh database seeds the viewer', seeded.decision === 'seeded');
check('fresh database reports the id', seeded.userId === VIEWER_ID);
check('fresh database writes exactly once', fresh.writes.length === 1);
check('fresh database reads before writing', fresh.reads.length === 1 && fresh.reads[0] === VIEWER_ID);

const written = fresh.writes[0];
check('fixture uses the configured id', written.identity.userId === VIEWER_ID);
check('fixture uses the local provider kind', written.identity.providerKind === LOCAL_DEV_VIEWER_PROVIDER_KIND);
check('fixture uses a stable provider subject', written.providerSubject === VIEWER_ID && written.identity.providerUserId === VIEWER_ID);
check('fixture uses a clearly local display name', written.identity.displayName === LOCAL_DEV_VIEWER_DISPLAY_NAME);
check('fixture profile is private', written.profile?.visibility === 'private');
check('fixture profile is marked local-dev', (written.profile?.tags ?? []).includes('local-dev'));
check('fixture leaves the handle to the repository default', written.profile?.handle === undefined);

// ── Repeated runs are harmless ──────────────────────────────────────────────
const secondRun = await seedLocalDevViewer(fresh, VIEWER_ID);
check('second run reports alreadyPresent', secondRun.decision === 'alreadyPresent');
check('second run writes nothing', fresh.writes.length === 1);
check('second run keeps exactly one row', fresh.rows.size === 1);

const thirdRun = await seedLocalDevViewer(fresh, VIEWER_ID);
check('third run reports alreadyPresent', thirdRun.decision === 'alreadyPresent');
check('third run writes nothing', fresh.writes.length === 1);

// ── An existing user is never rewritten ─────────────────────────────────────
const customised = fakeRepository({ seededRows: [userRecord(VIEWER_ID, 'Yuki (renamed by hand)')] });
const untouched = await seedLocalDevViewer(customised, VIEWER_ID);
check('existing user reports alreadyPresent', untouched.decision === 'alreadyPresent');
check('existing user is not written', customised.writes.length === 0);
check('existing display name survives', customised.rows.get(VIEWER_ID)?.identity.displayName === 'Yuki (renamed by hand)');

// ── A different configured id does not disturb an existing one ──────────────
const other = fakeRepository({ seededRows: [userRecord('someone-else', 'Someone Else')] });
const seededOther = await seedLocalDevViewer(other, VIEWER_ID);
check('unrelated user is left alone', seededOther.decision === 'seeded' && other.rows.size === 2);
check('unrelated user keeps its name', other.rows.get('someone-else')?.identity.displayName === 'Someone Else');

// ── Failure modes are honest ────────────────────────────────────────────────
const unreadable = fakeRepository({ readError: 'schema_missing' });
const readFailed = await seedLocalDevViewer(unreadable, VIEWER_ID);
check('unreadable database reports unavailable', readFailed.decision === 'unavailable');
check('unreadable database surfaces a safe error kind', readFailed.errorKind === 'schema_missing');
check('unreadable database writes nothing', unreadable.writes.length === 0);

const unwritable = fakeRepository({ writeError: 'database_error' });
const writeFailed = await seedLocalDevViewer(unwritable, VIEWER_ID);
check('unwritable database reports unavailable', writeFailed.decision === 'unavailable');
check('unwritable database surfaces a safe error kind', writeFailed.errorKind === 'database_error');

// A concurrent start that already inserted the row must not fail this one.
const raced = fakeRepository({ writeError: 'conflict' });
const racedResult = await seedLocalDevViewer(raced, VIEWER_ID);
check('concurrent insert resolves to alreadyPresent', racedResult.decision === 'alreadyPresent');

// ── Reports never leak connection details ───────────────────────────────────
const allNotes = [missing, seeded, secondRun, untouched, readFailed, writeFailed, racedResult]
  .flatMap((result) => result.notes)
  .join(' ');
check('notes contain no connection string', !allNotes.includes('postgres://') && !allNotes.toUpperCase().includes('DATABASE_URL'));
check('notes contain no SQL', !allNotes.toUpperCase().includes('INSERT INTO') && !allNotes.toUpperCase().includes('SELECT '));

// eslint-disable-next-line no-console
console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
