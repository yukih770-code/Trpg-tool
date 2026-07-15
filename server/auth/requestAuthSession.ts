/**
 * Request Auth Session boundary (P5.28) — server-only, dependency-light, DB-free.
 *
 * AI-LANDMARK: REQUEST_AUTH_SESSION_BOUNDARY_V1
 *
 * Determines WHO a request's viewer is, conservatively. Frontend login state is NOT
 * security: this trusts only (a) an explicit service-internal flag, or (b) dev auth
 * headers when explicitly enabled AND not in production. Bearer tokens / session
 * cookies are DETECTED but NOT trusted (no verifier exists in this slice). Anonymous
 * by default. No DB, no network, no env reads, no token values in notes.
 */

export type ApiAuthTrustLevel =
  | 'anonymous'
  | 'dev_header'
  | 'verified_session'
  | 'service_internal';

export interface ApiRequestLike {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  path?: string;
}

export interface ApiAuthSession {
  viewerUserId: string | null;
  isAuthenticated: boolean;
  trustLevel: ApiAuthTrustLevel;
  source: 'none' | 'dev_header' | 'session_cookie' | 'bearer_token' | 'service_internal';
  notes: string[];
}

export interface ResolveApiAuthSessionOptions {
  allowDevAuthHeaders?: boolean;
  nodeEnv?: string;
  serviceTokenAccepted?: boolean;
}

function getHeader(headers: Record<string, string | string[] | undefined> | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      const value = headers[key];
      const raw = Array.isArray(value) ? value[0] : value;
      return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
    }
  }
  return undefined;
}

/** Dev auth headers are honored ONLY when explicitly enabled and not in production. */
export function isDevAuthAllowed(options: ResolveApiAuthSessionOptions = {}): boolean {
  const env = options.nodeEnv ?? 'production';
  return options.allowDevAuthHeaders === true && env !== 'production';
}

export function createAnonymousApiAuthSession(notes: string[] = []): ApiAuthSession {
  return { viewerUserId: null, isAuthenticated: false, trustLevel: 'anonymous', source: 'none', notes };
}

export function resolveApiAuthSession(
  request: ApiRequestLike,
  options: ResolveApiAuthSessionOptions = {},
): ApiAuthSession {
  const headers = request.headers;

  // 1) Service-internal channel: trusted as a service, but NEVER a user (no viewer id).
  if (options.serviceTokenAccepted === true) {
    return {
      viewerUserId: null,
      isAuthenticated: false,
      trustLevel: 'service_internal',
      source: 'service_internal',
      notes: ['Service-internal caller; not a user identity — no user permissions are granted automatically.'],
    };
  }

  // 2) Dev auth headers (dev-only, opt-in, ignored in production).
  if (isDevAuthAllowed(options)) {
    const devUser = getHeader(headers, 'x-dev-user-id') ?? getHeader(headers, 'x-dev-viewer-user-id');
    if (devUser) {
      return {
        viewerUserId: devUser,
        isAuthenticated: true,
        trustLevel: 'dev_header',
        source: 'dev_header',
        notes: ['Dev auth header accepted (development only). NOT a verified session.'],
      };
    }
  }

  // 3) Bearer token / session cookie: DETECTED but NOT trusted (no verifier configured).
  const authorization = getHeader(headers, 'authorization');
  const hasBearer = typeof authorization === 'string' && /^bearer\s+/i.test(authorization);
  const hasCookie = getHeader(headers, 'cookie') !== undefined;
  if (hasBearer || hasCookie) {
    return createAnonymousApiAuthSession([
      hasBearer ? 'Bearer token present but not verified (no verifier configured); treated as anonymous.' : 'Session cookie present but not verified; treated as anonymous.',
    ]);
  }

  // 4) Anonymous by default.
  return createAnonymousApiAuthSession();
}
