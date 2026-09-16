import type { RequestHandler } from 'express';

/** An origin check supplements authentication; it never grants identity.
 * Origin-less CLI/probe requests remain supported. Browser sockets send Origin.
 */
export function isAllowedBrowserOrigin(origin: string | undefined, allowedOrigins: readonly string[]): boolean {
  return origin === undefined || allowedOrigins.includes(origin);
}

export function createPilotOriginGuard(allowedOrigins: readonly string[]): RequestHandler {
  return (req, res, next) => {
    if (!isAllowedBrowserOrigin(req.headers.origin, allowedOrigins)
      || (req.headers.origin === undefined && req.headers['sec-fetch-site'] === 'cross-site')) {
      res.status(403).json({ ok: false, error: { kind: 'forbidden', message: 'Request origin is not allowed.' } });
      return;
    }
    next();
  };
}

/** Coarse single-process pilot limit. Ignores spoofable forwarding headers;
 * caps total login work, including requests through one shared reverse proxy.
 * Edge rate limiting remains an operator responsibility for a public endpoint.
 */
export function createPilotLoginLimiter(now: () => number = Date.now): RequestHandler {
  let windowStart = now();
  let attempts = 0;
  return (_req, res, next) => {
    const current = now();
    if (current - windowStart >= 60_000) { windowStart = current; attempts = 0; }
    if (++attempts > 60) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((windowStart + 60_000 - current) / 1000))));
      res.status(429).json({ ok: false, error: { kind: 'unavailable', message: 'Too many sign-in attempts. Try again shortly.' } });
      return;
    }
    next();
  };
}
