/** Express registration for the P5.API-CORE World Server API surface. */

import type { Express, Request, Response } from 'express';

import type { ServerApiResponse } from './apiResponse.js';
import type { WorldServerApiHandlers, WorldServerApiRequest } from './worldServerApiHandlers.js';

const PREFIX = '/api/world-servers';

function requestId(req: Request): string | undefined {
  const value = req.header('x-request-id');
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function inputOf(req: Request): WorldServerApiRequest {
  return {
    requestId: requestId(req),
    params: req.params as Record<string, unknown>,
    query: req.query as Record<string, unknown>,
    body: req.body,
    headers: req.headers as Record<string, string | string[] | undefined>,
  };
}

function send(res: Response, response: ServerApiResponse<unknown>): void {
  res.status(response.statusCode).json(response);
}

async function invoke(
  res: Response,
  handler: (input: WorldServerApiRequest) => Promise<ServerApiResponse<unknown>>,
  req: Request,
): Promise<void> {
  try {
    send(res, await handler(inputOf(req)));
  } catch {
    send(res, {
      ok: false,
      statusCode: 500,
      error: { kind: 'internal', message: 'World server request failed.' },
      requestId: requestId(req),
    });
  }
}

/** Register HTTP routes only; no database readiness or migration work occurs here. */
export function registerWorldServerApiRoutes(app: Express, handlers: WorldServerApiHandlers): void {
  app.get(PREFIX, (req, res) => void invoke(res, handlers.listWorldServers, req));
  app.post(PREFIX, (req, res) => void invoke(res, handlers.createWorldServer, req));

  app.get(`${PREFIX}/:worldServerId`, (req, res) => void invoke(res, handlers.getWorldServer, req));
  app.patch(`${PREFIX}/:worldServerId`, (req, res) => void invoke(res, handlers.updateWorldServer, req));
  app.post(`${PREFIX}/:worldServerId/archive`, (req, res) => void invoke(res, handlers.archiveWorldServer, req));
  app.post(`${PREFIX}/:worldServerId/restore`, (req, res) => void invoke(res, handlers.restoreWorldServer, req));

  app.get(`${PREFIX}/:worldServerId/members`, (req, res) => void invoke(res, handlers.listMembers, req));
  app.patch(`${PREFIX}/:worldServerId/members/:membershipId`, (req, res) => void invoke(res, handlers.updateMember, req));
  app.get(`${PREFIX}/:worldServerId/roles`, (req, res) => void invoke(res, handlers.listRoles, req));
  app.post(`${PREFIX}/:worldServerId/roles`, (req, res) => void invoke(res, handlers.createRole, req));
  app.patch(`${PREFIX}/:worldServerId/roles/:roleId`, (req, res) => void invoke(res, handlers.updateRole, req));

  app.get(`${PREFIX}/:worldServerId/invites`, (req, res) => void invoke(res, handlers.listInvites, req));
  app.post(`${PREFIX}/:worldServerId/invites`, (req, res) => void invoke(res, handlers.createInvite, req));
  app.get(`${PREFIX}/:worldServerId/join-requests`, (req, res) => void invoke(res, handlers.listJoinRequests, req));
  app.post(`${PREFIX}/:worldServerId/join-requests`, (req, res) => void invoke(res, handlers.createJoinRequest, req));
  app.patch(`${PREFIX}/:worldServerId/join-requests/:joinRequestId`, (req, res) => void invoke(res, handlers.reviewJoinRequest, req));

  app.get(`${PREFIX}/:worldServerId/settings`, (req, res) => void invoke(res, handlers.getSettings, req));
  app.patch(`${PREFIX}/:worldServerId/settings`, (req, res) => void invoke(res, handlers.patchSettings, req));
  app.get(`${PREFIX}/:worldServerId/settings/versions`, (req, res) => void invoke(res, handlers.listSettingsVersions, req));
  app.post(`${PREFIX}/:worldServerId/settings/versions`, (req, res) => void invoke(res, handlers.createSettingsVersion, req));
  app.get(`${PREFIX}/:worldServerId/ruleset-versions`, (req, res) => void invoke(res, handlers.listRulesetVersions, req));
  app.post(`${PREFIX}/:worldServerId/ruleset-versions`, (req, res) => void invoke(res, handlers.createRulesetVersion, req));

  app.get(`${PREFIX}/:worldServerId/game-systems`, (req, res) => void invoke(res, handlers.listGameSystems, req));
  app.post(`${PREFIX}/:worldServerId/game-systems`, (req, res) => void invoke(res, handlers.createGameSystem, req));
  app.patch(`${PREFIX}/:worldServerId/game-systems/:bindingId`, (req, res) => void invoke(res, handlers.updateGameSystem, req));
  app.post(`${PREFIX}/:worldServerId/game-systems/:bindingId/archive`, (req, res) => void invoke(res, handlers.archiveGameSystem, req));
  app.post(`${PREFIX}/:worldServerId/game-systems/:bindingId/restore`, (req, res) => void invoke(res, handlers.restoreGameSystem, req));
}
