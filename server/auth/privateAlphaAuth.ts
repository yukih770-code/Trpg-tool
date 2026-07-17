import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

import {
  createPostgresPlatformFoundationRepository,
  type AuthSessionRecord,
} from '../adapters/postgresPlatformFoundationRepository.js';
import {
  createPostgresUserRepository,
  type PostgresUserRecord,
  type PostgresUserRepository,
} from '../adapters/postgresUserRepository.js';
import type { ServerDeploymentEnvironment, ServerRuntimeEnv } from '../config/serverRuntimeConfig.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from './currentViewerContext.js';

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const PRIVATE_ALPHA_SESSION_COOKIE = 'trpg_private_alpha_session';

export type PrivateAlphaAuthConfig = {
  enabled: boolean;
  inviteCode?: string;
  sessionSecret?: string;
  sessionMaxAgeSeconds: number;
  secureCookies: boolean;
};

export type PrivateAlphaViewer = {
  viewer: CurrentViewerContext;
  sessionId: string;
  user: SafePrivateAlphaUser;
};

type AuthSessionRepository = Pick<
  ReturnType<typeof createPostgresPlatformFoundationRepository>,
  'createAuthSession' | 'getAuthSessionById' | 'updateAuthSessionStatus'
>;

type UserRepository = Pick<
  PostgresUserRepository,
  'getUserById' | 'getUserByIdentity' | 'createUserWithIdentity'
>;

export type PrivateAlphaAuthService = {
  isEnabled(): boolean;
  login(input: { displayName?: unknown; accessCode?: unknown }): Promise<
    | { ok: true; user: SafePrivateAlphaUser; sessionToken: string; maxAgeSeconds: number }
    | { ok: false; kind: 'invalid_credentials' | 'unavailable' | 'bad_request'; message: string }
  >;
  resolveRequestViewer(request: Request): Promise<PrivateAlphaViewer | null>;
  logout(sessionId: string | undefined): Promise<void>;
};

export type SafePrivateAlphaUser = {
  userId: string;
  displayName: string;
};

function readString(env: ServerRuntimeEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value === '' ? undefined : value;
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Reads secrets server-side only. Callers must never serialize this config. */
export function readPrivateAlphaAuthConfigFromEnv(
  env: ServerRuntimeEnv,
  environment: ServerDeploymentEnvironment,
): PrivateAlphaAuthConfig {
  const enabled = readString(env, 'PRIVATE_ALPHA_AUTH_ENABLED') === 'true';
  return {
    enabled,
    inviteCode: readString(env, 'PRIVATE_ALPHA_INVITE_CODE'),
    sessionSecret: readString(env, 'PRIVATE_ALPHA_SESSION_SECRET'),
    sessionMaxAgeSeconds: readPositiveInteger(readString(env, 'PRIVATE_ALPHA_SESSION_MAX_AGE_SECONDS'), DEFAULT_SESSION_MAX_AGE_SECONDS),
    secureCookies: environment !== 'localDev',
  };
}

export function isPrivateAlphaAuthConfigured(config: PrivateAlphaAuthConfig): boolean {
  return config.enabled && Boolean(config.inviteCode) && Boolean(config.sessionSecret);
}

function normalizeDisplayName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length >= 2 && normalized.length <= 80 ? normalized : undefined;
}

function constantTimeMatches(candidate: unknown, expected: string | undefined): boolean {
  if (typeof candidate !== 'string' || !expected) return false;
  const left = Buffer.from(candidate.trim());
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function identitySubject(displayName: string, sessionSecret: string): string {
  return `private-alpha:${createHmac('sha256', sessionSecret).update(displayName.trim().toLocaleLowerCase()).digest('hex')}`;
}

function signSessionId(sessionId: string, sessionSecret: string): string {
  return createHmac('sha256', sessionSecret).update(sessionId).digest('base64url');
}

export function createPrivateAlphaSessionToken(sessionId: string, sessionSecret: string): string {
  return `${sessionId}.${signSessionId(sessionId, sessionSecret)}`;
}

function parseCookies(request: Request): Record<string, string> {
  const raw = request.headers.cookie;
  if (!raw) return {};
  return raw.split(';').reduce<Record<string, string>>((cookies, item) => {
    const separator = item.indexOf('=');
    if (separator <= 0) return cookies;
    const name = item.slice(0, separator).trim();
    const value = item.slice(separator + 1).trim();
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      // Ignore malformed cookies; callers stay anonymous.
    }
    return cookies;
  }, {});
}

function verifiedSessionId(request: Request, sessionSecret: string | undefined): string | null {
  if (!sessionSecret) return null;
  const token = parseCookies(request)[PRIVATE_ALPHA_SESSION_COOKIE];
  if (!token) return null;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;
  const sessionId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signSessionId(sessionId, sessionSecret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right) ? sessionId : null;
}

function isActiveSession(session: AuthSessionRecord): boolean {
  if (session.sessionStatus !== 'active' || session.revokedAt) return false;
  if (!session.expiresAt) return true;
  return Date.parse(session.expiresAt) > Date.now();
}

function safeUser(user: PostgresUserRecord): SafePrivateAlphaUser {
  return {
    userId: user.identity.userId,
    displayName: user.profile?.displayName ?? user.identity.displayName ?? 'Private Alpha User',
  };
}

export function createPrivateAlphaAuthService(
  config: PrivateAlphaAuthConfig,
  options: {
    userRepository?: UserRepository;
    sessionRepository?: AuthSessionRepository;
  } = {},
): PrivateAlphaAuthService {
  const userRepository = options.userRepository ?? createPostgresUserRepository();
  const sessionRepository = options.sessionRepository ?? createPostgresPlatformFoundationRepository();

  async function resolveRequestViewer(request: Request): Promise<PrivateAlphaViewer | null> {
    if (!isPrivateAlphaAuthConfigured(config)) return null;
    const sessionId = verifiedSessionId(request, config.sessionSecret);
    if (!sessionId) return null;
    const result = await sessionRepository.getAuthSessionById(sessionId);
    if (result.ok === false || !result.value || !isActiveSession(result.value)) return null;
    const userResult = await userRepository.getUserById(result.value.userId);
    if (userResult.ok === false || !userResult.value) return null;
    return {
      sessionId,
      user: safeUser(userResult.value),
      viewer: createCurrentViewerContextFromAuthSession({
        viewerUserId: result.value.userId,
        isAuthenticated: true,
        trustLevel: 'verified_session',
        source: 'session_cookie',
        notes: ['Verified private alpha browser session.'],
      }),
    };
  }

  return {
    isEnabled: () => isPrivateAlphaAuthConfigured(config),
    resolveRequestViewer,

    async login(input) {
      const displayName = normalizeDisplayName(input.displayName);
      if (!displayName) {
        return { ok: false, kind: 'bad_request', message: 'Enter a display name between 2 and 80 characters.' };
      }
      if (!isPrivateAlphaAuthConfigured(config)) {
        return { ok: false, kind: 'unavailable', message: 'Private alpha sign-in is unavailable.' };
      }
      if (!constantTimeMatches(input.accessCode, config.inviteCode)) {
        return { ok: false, kind: 'invalid_credentials', message: 'The access code is invalid.' };
      }

      const providerKind = 'custom';
      const providerSubject = identitySubject(displayName, config.sessionSecret!);
      const existing = await userRepository.getUserByIdentity(providerKind, providerSubject);
      if (existing.ok === false) {
        return { ok: false, kind: 'unavailable', message: 'Private alpha sign-in is temporarily unavailable.' };
      }
      const userResult = existing.value
        ? { ok: true as const, value: existing.value }
        : await userRepository.createUserWithIdentity({
          identity: {
            userId: `user_${randomUUID()}`,
            providerKind,
            providerUserId: providerSubject,
            displayName,
          },
          providerSubject,
          profile: { displayName },
        });
      if (userResult.ok === false) {
        return { ok: false, kind: 'unavailable', message: 'Private alpha sign-in is temporarily unavailable.' };
      }

      const sessionId = `pas_${randomBytes(32).toString('base64url')}`;
      const expiresAt = new Date(Date.now() + config.sessionMaxAgeSeconds * 1000).toISOString();
      const session = await sessionRepository.createAuthSession({
        sessionId,
        userId: userResult.value.identity.userId,
        sessionKind: 'browser',
        sessionStatus: 'active',
        trustLevel: 'private_alpha_invite',
        metadata: { authSource: 'private_alpha_invite' },
        expiresAt,
      });
      if (session.ok === false) {
        return { ok: false, kind: 'unavailable', message: 'Private alpha sign-in is temporarily unavailable.' };
      }
      return {
        ok: true,
        user: safeUser(userResult.value),
        sessionToken: createPrivateAlphaSessionToken(sessionId, config.sessionSecret!),
        maxAgeSeconds: config.sessionMaxAgeSeconds,
      };
    },

    async logout(sessionId) {
      if (!sessionId) return;
      await sessionRepository.updateAuthSessionStatus(sessionId, 'revoked', new Date().toISOString());
    },
  };
}
