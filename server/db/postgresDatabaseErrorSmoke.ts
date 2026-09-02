/**
 * PostgreSQL driver error envelope smoke (pure; no database, no `pg`).
 *
 * AI-LANDMARK: POSTGRES_DATABASE_ERROR_SMOKE_V1
 *
 * Guards the seam that previously erased `error.code`: `queryPostgres` wrapped
 * every driver failure in a `PostgresDatabaseError` that carried only a kind and
 * a classification string, so the `23505` / `23503` / `42P01` branches already
 * written in every repository adapter were unreachable and distinguishable
 * failures all collapsed into `database_error` -> HTTP 503.
 *
 * Asserted here:
 *  - a wrapped driver error preserves a SAFE code and constraint;
 *  - non-PG / unknown / hostile errors are still classified safely and carry
 *    nothing forward;
 *  - nothing but a short identifier can ever cross the seam (no SQL text, no
 *    connection string, no driver detail, no stack).
 */

import {
  PostgresDatabaseError,
  classifyPostgresDriverError,
  readSafePostgresErrorCode,
  readSafePostgresErrorConstraint,
  wrapPostgresQueryError,
} from './postgresDatabaseError.js';

const cases: string[] = [];

function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

/** Shape of a real `pg` error: code, constraint, plus detail fields we must drop. */
function driverError(code: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(
    new Error('insert or update on table "world_servers" violates foreign key constraint'),
    { code, ...extra },
  );
}

// ── A wrapped driver error preserves the safe identifiers ───────────────────
const fkError = wrapPostgresQueryError(driverError('23503', { constraint: 'world_servers_owner_id_fkey' }));
check('foreign key violation keeps its code', fkError.code === '23503');
check('foreign key violation keeps its constraint', fkError.constraint === 'world_servers_owner_id_fkey');
check('foreign key violation stays a query_error', fkError.kind === 'query_error');
check('foreign key violation keeps the legacy classification message', fkError.message === 'database_error');

const uniqueError = wrapPostgresQueryError(driverError('23505', { constraint: 'uq_runtime_events_session_idem' }));
check('unique violation keeps its code', uniqueError.code === '23505');
check('unique violation keeps its constraint', uniqueError.constraint === 'uq_runtime_events_session_idem');

const missingTable = wrapPostgresQueryError(driverError('42P01'));
check('missing table keeps its code', missingTable.code === '42P01');
check('missing table still classifies as schema_missing', missingTable.message === 'schema_missing');
check('missing table has no constraint', missingTable.constraint === undefined);

// Node errno values travel the same path and must keep classifying as before.
check('connection refused classification unchanged', classifyPostgresDriverError(driverError('ECONNREFUSED')) === 'connection_refused');
check('connection timeout classification unchanged', classifyPostgresDriverError(driverError('ETIMEDOUT')) === 'connection_timeout');
check('host not found classification unchanged', classifyPostgresDriverError(driverError('ENOTFOUND')) === 'host_not_found');
check('auth failure classification unchanged', classifyPostgresDriverError(driverError('28P01')) === 'authentication_failed');
check('missing database classification unchanged', classifyPostgresDriverError(driverError('3D000')) === 'database_not_found');

// ── Non-PG and unknown errors stay safely classified ────────────────────────
const plain = wrapPostgresQueryError(new Error('boom'));
check('plain Error carries no code', plain.code === undefined);
check('plain Error carries no constraint', plain.constraint === undefined);
check('plain Error classifies as database_error', plain.message === 'database_error');

const nonErrors: Array<readonly [string, unknown]> = [
  ['null', null],
  ['undefined', undefined],
  ['string', 'ECONNREFUSED'],
  ['number', 42],
];
for (const [name, value] of nonErrors) {
  const wrapped = wrapPostgresQueryError(value);
  check(`${name} rejection carries no code`, wrapped.code === undefined);
  check(`${name} rejection classifies as database_error`, wrapped.message === 'database_error');
}

const unknownCode = wrapPostgresQueryError(driverError('99999'));
check('unrecognised code is still preserved verbatim', unknownCode.code === '99999');
check('unrecognised code classifies as database_error', unknownCode.message === 'database_error');

// ── Only a short identifier may cross the seam ──────────────────────────────
const hostile = [
  "23503'; DROP TABLE users; --",
  'postgres://trpg_local:secret@localhost:55432/trpg_platform_dev',
  'insert or update on table "world_servers" violates foreign key constraint',
  'has spaces',
  'has-a-dash',
  '',
  'x'.repeat(65),
];
for (const value of hostile) {
  check(`unsafe code is dropped: ${value.slice(0, 24)}`, readSafePostgresErrorCode({ code: value }) === undefined);
  check(`unsafe constraint is dropped: ${value.slice(0, 24)}`, readSafePostgresErrorConstraint({ constraint: value }) === undefined);
}
check('exactly 64 characters is still accepted', readSafePostgresErrorCode({ code: 'x'.repeat(64) }) === 'x'.repeat(64));
check('non-string non-number code is dropped', readSafePostgresErrorCode({ code: { nested: 'x' } }) === undefined);
check('numeric code is normalised to a string', readSafePostgresErrorCode({ code: 23503 }) === '23503');
check('absent field yields undefined', readSafePostgresErrorCode({}) === undefined);

// The wrapper must never carry the driver's own message, detail, hint or stack.
const rich = driverError('23503', {
  constraint: 'world_servers_owner_id_fkey',
  detail: 'Key (owner_id)=(dev-viewer-001) is not present in table "users".',
  hint: 'connect to postgres://trpg_local:secret@localhost:55432',
  where: 'SQL statement "INSERT INTO world_servers ..."',
  table: 'world_servers',
});
const wrappedRich = wrapPostgresQueryError(rich);
const serialized = JSON.stringify({
  kind: wrappedRich.kind,
  message: wrappedRich.message,
  code: wrappedRich.code,
  constraint: wrappedRich.constraint,
});
check('wrapper drops driver detail', !serialized.includes('is not present in table'));
check('wrapper drops driver hint and connection string', !serialized.includes('postgres://') && !serialized.includes('secret'));
check('wrapper drops raw SQL text', !serialized.toUpperCase().includes('INSERT INTO'));
check('wrapper exposes no stack', !serialized.includes(' at '));
check('wrapper keeps only four fields', Object.keys(JSON.parse(serialized) as Record<string, unknown>).length === 4);

// A directly constructed error stays clean when no options are supplied.
const bare = new PostgresDatabaseError('not_configured', 'DATABASE_URL is not configured.');
check('bare error has no code', bare.code === undefined);
check('bare error has no constraint', bare.constraint === undefined);
check('bare error keeps its kind', bare.kind === 'not_configured');

// eslint-disable-next-line no-console
console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
