/**
 * PostgreSQL driver error envelope (dependency-free).
 *
 * AI-LANDMARK: POSTGRES_DATABASE_ERROR_V1
 *
 * This module deliberately imports nothing — not even `pg` — so the error
 * contract can be exercised by a pure smoke without a database or driver.
 *
 * Boundary: the ONLY driver details allowed past this seam are a SQLSTATE /
 * errno and a constraint name, both bounded to a short identifier shape. SQL
 * text, column values, connection strings, hints and stack traces never cross.
 */

export type PostgresDatabaseErrorKind = 'not_configured' | 'connection_error' | 'query_error';

/**
 * Bounded identifier shape. Anything containing SQL text, a column value, a URL,
 * whitespace or punctuation fails this test and is dropped, so no query,
 * credential or row content can ride along on a wrapped error.
 */
const SAFE_DRIVER_IDENTIFIER = /^[A-Za-z0-9_]{1,64}$/;

function readSafeIdentifier(error: unknown, field: 'code' | 'constraint'): string | undefined {
  if (typeof error !== 'object' || error === null || !(field in error)) return undefined;
  const value = (error as Record<string, unknown>)[field];
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const text = String(value);
  return SAFE_DRIVER_IDENTIFIER.test(text) ? text : undefined;
}

/** SQLSTATE (or Node errno) of a driver error, sanitized; undefined when unsafe or absent. */
export function readSafePostgresErrorCode(error: unknown): string | undefined {
  return readSafeIdentifier(error, 'code');
}

/** Violated constraint name of a driver error, sanitized; undefined when unsafe or absent. */
export function readSafePostgresErrorConstraint(error: unknown): string | undefined {
  return readSafeIdentifier(error, 'constraint');
}

export class PostgresDatabaseError extends Error {
  readonly kind: PostgresDatabaseErrorKind;

  /**
   * SQLSTATE / errno of the wrapped driver error, when the driver reported a
   * safe one. Repository adapters already branch on `23505` / `23503` / `42P01`;
   * before this field existed the wrapper erased the code, so every one of those
   * branches was unreachable and distinguishable failures all collapsed into
   * `database_error` — which the API then reported as a generic 503.
   */
  readonly code?: string;

  /** Violated constraint name, when reported. Used for idempotency-race recovery. */
  readonly constraint?: string;

  constructor(
    kind: PostgresDatabaseErrorKind,
    message: string,
    options: { code?: string; constraint?: string } = {},
  ) {
    super(message);
    this.name = 'PostgresDatabaseError';
    this.kind = kind;
    if (options.code !== undefined) this.code = options.code;
    if (options.constraint !== undefined) this.constraint = options.constraint;
  }
}

/** Stable classification string carried as the wrapped error's `message`. */
export function classifyPostgresDriverError(error: unknown): string {
  const code = readSafePostgresErrorCode(error) ?? '';
  if (code === 'ECONNREFUSED') return 'connection_refused';
  if (code === 'ETIMEDOUT') return 'connection_timeout';
  if (code === 'ENOTFOUND') return 'host_not_found';
  if (code === '28P01') return 'authentication_failed';
  if (code === '3D000') return 'database_not_found';
  if (code === '42P01') return 'schema_missing';
  return 'database_error';
}

/** Wraps a raw driver error, preserving only the bounded identifiers. */
export function wrapPostgresQueryError(error: unknown): PostgresDatabaseError {
  return new PostgresDatabaseError('query_error', classifyPostgresDriverError(error), {
    code: readSafePostgresErrorCode(error),
    constraint: readSafePostgresErrorConstraint(error),
  });
}
