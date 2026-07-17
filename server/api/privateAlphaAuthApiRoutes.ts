import type { Express, Request, Response } from 'express';

import { PRIVATE_ALPHA_SESSION_COOKIE } from '../auth/privateAlphaAuth.js';
import { getVerifiedSessionId, getVerifiedViewer, getVerifiedViewerUser } from '../auth/requestViewer.js';
import type { ServerApiResponse } from './apiResponse.js';
import type { PrivateAlphaAuthApiHandlers, PrivateAlphaAuthApiRequest } from './privateAlphaAuthApiHandlers.js';

const PREFIX = '/api/auth';

function requestId(req: Request): string | undefined {
  const value = req.header('x-request-id');
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function inputOf(req: Request): PrivateAlphaAuthApiRequest {
  return {
    requestId: requestId(req),
    body: req.body,
    headers: req.headers as Record<string, string | string[] | undefined>,
    viewer: getVerifiedViewer(req),
    user: getVerifiedViewerUser(req),
  };
}

function send(res: Response, response: ServerApiResponse<unknown>): void {
  res.status(response.statusCode).json(response);
}

function cookie(value: string, maxAgeSeconds: number, secure: boolean): string {
  return `${PRIVATE_ALPHA_SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

function clearCookie(secure: boolean): string {
  return `${PRIVATE_ALPHA_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/** Private-alpha HTTP auth only; it does not affect Room/WebSocket authority. */
export function registerPrivateAlphaAuthApiRoutes(
  app: Express,
  handlers: PrivateAlphaAuthApiHandlers,
  options: { secureCookies: boolean },
): void {
  app.get(`${PREFIX}/me`, async (req, res) => {
    try {
      send(res, await handlers.me(inputOf(req)));
    } catch {
      send(res, { ok: false, statusCode: 500, error: { kind: 'internal', message: 'Authentication request failed.' }, requestId: requestId(req) });
    }
  });

  app.post(`${PREFIX}/private-alpha/login`, async (req, res) => {
    try {
      const response = await handlers.login(inputOf(req));
      if (response.ok) {
        res.setHeader('Set-Cookie', cookie(response.value.sessionToken, response.value.maxAgeSeconds, options.secureCookies));
        send(res, {
          ok: true,
          statusCode: response.statusCode,
          value: { user: response.value.user },
          requestId: response.requestId,
        });
        return;
      }
      send(res, response);
    } catch {
      send(res, { ok: false, statusCode: 500, error: { kind: 'internal', message: 'Sign-in request failed.' }, requestId: requestId(req) });
    }
  });

  app.post(`${PREFIX}/logout`, async (req, res) => {
    try {
      const response = await handlers.logout({ ...inputOf(req), sessionId: getVerifiedSessionId(req) });
      res.setHeader('Set-Cookie', clearCookie(options.secureCookies));
      send(res, response);
    } catch {
      res.setHeader('Set-Cookie', clearCookie(options.secureCookies));
      send(res, { ok: false, statusCode: 500, error: { kind: 'internal', message: 'Sign-out request failed.' }, requestId: requestId(req) });
    }
  });
}
