/**
 * Server API response envelope (v0).
 *
 * Server-only shape for future HTTP handlers. It intentionally carries safe
 * error kinds and status codes, never raw database errors or secrets.
 */
export function okResponse(value, options = {}) {
    return {
        ok: true,
        statusCode: options.statusCode ?? 200,
        value,
        requestId: options.requestId,
    };
}
export function errorResponse(statusCode, error, options = {}) {
    return {
        ok: false,
        statusCode,
        error,
        requestId: options.requestId,
    };
}
