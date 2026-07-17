import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { PrivateAlphaAuthService, SafePrivateAlphaUser } from '../auth/privateAlphaAuth.js';
import { createCurrentViewerContextFromAuthSession } from '../auth/currentViewerContext.js';
import { resolveApiAuthSession, type ApiRequestLike } from '../auth/requestAuthSession.js';
import { errorResponse, okResponse, type ServerApiResponse } from './apiResponse.js';

export type PrivateAlphaAuthApiRequest = {
  requestId?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  viewer?: CurrentViewerContext;
  user?: SafePrivateAlphaUser;
};

export type PrivateAlphaAuthApiHandlers = {
  me(input: PrivateAlphaAuthApiRequest): Promise<ServerApiResponse<{ authenticated: boolean; user?: SafePrivateAlphaUser; trustLevel?: string; authMode: 'localDev' | 'privateAlpha' | 'unauthenticated' }>>;
  login(input: PrivateAlphaAuthApiRequest): Promise<ServerApiResponse<{ user: SafePrivateAlphaUser; sessionToken: string; maxAgeSeconds: number }>>;
  logout(input: PrivateAlphaAuthApiRequest & { sessionId?: string }): Promise<ServerApiResponse<{ loggedOut: true }>>;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function fallbackViewer(input: PrivateAlphaAuthApiRequest, options: CreatePrivateAlphaAuthApiHandlersOptions): CurrentViewerContext {
  if (input.viewer) return input.viewer;
  return createCurrentViewerContextFromAuthSession(resolveApiAuthSession({ headers: input.headers } as ApiRequestLike, {
    allowDevAuthHeaders: options.allowDevAuthHeaders === true,
    nodeEnv: options.nodeEnv ?? 'production',
  }));
}

export type CreatePrivateAlphaAuthApiHandlersOptions = {
  service: PrivateAlphaAuthService;
  allowDevAuthHeaders?: boolean;
  nodeEnv?: string;
};

export function createPrivateAlphaAuthApiHandlers(
  options: CreatePrivateAlphaAuthApiHandlersOptions,
): PrivateAlphaAuthApiHandlers {
  return {
    async me(input) {
      const viewer = fallbackViewer(input, options);
      return okResponse({
        authenticated: viewer.isAuthenticated && Boolean(viewer.viewerUserId),
        authMode: viewer.authTrustLevel === 'dev_header'
          ? 'localDev'
          : viewer.authTrustLevel === 'verified_session'
            ? 'privateAlpha'
            : 'unauthenticated',
        ...(viewer.isAuthenticated && viewer.viewerUserId
          ? { user: input.user ?? { userId: viewer.viewerUserId, displayName: 'Private Alpha User' }, trustLevel: viewer.authTrustLevel }
          : {}),
      }, { requestId: input.requestId });
    },

    async login(input) {
      const body = record(input.body);
      const result = await options.service.login({
        displayName: body.displayName,
        accessCode: body.accessCode,
      });
      if (result.ok === false) {
        const statusCode = result.kind === 'bad_request' ? 400 : result.kind === 'invalid_credentials' ? 401 : 503;
        return errorResponse(statusCode, {
          kind: result.kind === 'bad_request' ? 'bad_request' : 'unavailable',
          message: result.message,
        }, { requestId: input.requestId });
      }
      return okResponse({
        user: result.user,
        sessionToken: result.sessionToken,
        maxAgeSeconds: result.maxAgeSeconds,
      }, { requestId: input.requestId });
    },

    async logout(input) {
      await options.service.logout(input.sessionId);
      return okResponse({ loggedOut: true }, { requestId: input.requestId });
    },
  };
}
