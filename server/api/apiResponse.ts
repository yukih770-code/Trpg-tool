/**
 * Server API response envelope (v0).
 *
 * Server-only shape for future HTTP handlers. It intentionally carries safe
 * error kinds and status codes, never raw database errors or secrets.
 */

export type ServerApiErrorKind =
  | 'bad_request'
  | 'not_found'
  | 'unavailable'
  | 'validation'
  | 'conflict'
  | 'internal';

export interface ServerApiError {
  kind: ServerApiErrorKind;
  message: string;
  retryable?: boolean;
  /**
   * Optional machine-readable discriminator for cases where `kind` alone is
   * ambiguous (several distinct failures share `bad_request` / `conflict`).
   * Additive: existing errors omit it and existing clients ignore it.
   */
  reason?: string;
}

export type ServerApiResponse<T> =
  | {
      ok: true;
      statusCode: number;
      value: T;
      requestId?: string;
    }
  | {
      ok: false;
      statusCode: number;
      error: ServerApiError;
      requestId?: string;
    };

export function okResponse<T>(
  value: T,
  options: { statusCode?: number; requestId?: string } = {},
): ServerApiResponse<T> {
  return {
    ok: true,
    statusCode: options.statusCode ?? 200,
    value,
    requestId: options.requestId,
  };
}

export function errorResponse<T = never>(
  statusCode: number,
  error: ServerApiError,
  options: { requestId?: string } = {},
): ServerApiResponse<T> {
  return {
    ok: false,
    statusCode,
    error,
    requestId: options.requestId,
  };
}
