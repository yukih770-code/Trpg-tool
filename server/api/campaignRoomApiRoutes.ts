/** Express registration for the P5.API-CAMPAIGN-ROOM surface. */

import type { Express, Request, Response } from 'express';

import type { ServerApiResponse } from './apiResponse.js';
import type { CampaignRoomApiHandlers, CampaignRoomApiRequest } from './campaignRoomApiHandlers.js';

const PREFIX = '/api/world-servers';

function requestId(req: Request): string | undefined {
  const value = req.header('x-request-id');
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function inputOf(req: Request): CampaignRoomApiRequest {
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
  handler: (input: CampaignRoomApiRequest) => Promise<ServerApiResponse<unknown>>,
  req: Request,
): Promise<void> {
  try {
    send(res, await handler(inputOf(req)));
  } catch {
    send(res, {
      ok: false,
      statusCode: 500,
      error: { kind: 'internal', message: 'Campaign room request failed.' },
      requestId: requestId(req),
    });
  }
}

/** Register metadata/history routes only; no migration or readiness work occurs here. */
export function registerCampaignRoomApiRoutes(app: Express, handlers: CampaignRoomApiHandlers): void {
  const campaigns = `${PREFIX}/:worldServerId/campaigns`;
  app.get(campaigns, (req, res) => void invoke(res, handlers.listCampaigns, req));
  app.post(campaigns, (req, res) => void invoke(res, handlers.createCampaign, req));
  app.get(`${campaigns}/:campaignId`, (req, res) => void invoke(res, handlers.getCampaign, req));
  app.patch(`${campaigns}/:campaignId`, (req, res) => void invoke(res, handlers.updateCampaign, req));
  app.post(`${campaigns}/:campaignId/archive`, (req, res) => void invoke(res, handlers.archiveCampaign, req));
  app.post(`${campaigns}/:campaignId/restore`, (req, res) => void invoke(res, handlers.restoreCampaign, req));

  app.get(`${campaigns}/:campaignId/actors`, (req, res) => void invoke(res, handlers.listCampaignActors, req));
  app.post(`${campaigns}/:campaignId/actors`, (req, res) => void invoke(res, handlers.createCampaignActor, req));
  app.get(`${campaigns}/:campaignId/actors/:actorInstanceId`, (req, res) => void invoke(res, handlers.getCampaignActor, req));
  app.post(`${campaigns}/:campaignId/actors/:actorInstanceId/archive`, (req, res) => void invoke(res, handlers.archiveCampaignActor, req));

  const rooms = `${campaigns}/:campaignId/rooms`;
  app.get(rooms, (req, res) => void invoke(res, handlers.listRooms, req));
  app.post(rooms, (req, res) => void invoke(res, handlers.createRoom, req));
  app.get(`${rooms}/:roomId`, (req, res) => void invoke(res, handlers.getRoom, req));
  app.patch(`${rooms}/:roomId`, (req, res) => void invoke(res, handlers.updateRoom, req));
  app.get(`${rooms}/:roomId/participants`, (req, res) => void invoke(res, handlers.listParticipants, req));
  app.get(`${rooms}/:roomId/lobby-slots`, (req, res) => void invoke(res, handlers.listLobbySlots, req));

  const runtimeSession = `${rooms}/:roomId/runtime-session`;
  app.get(runtimeSession, (req, res) => void invoke(res, handlers.getRuntimeSession, req));
  app.post(runtimeSession, (req, res) => void invoke(res, handlers.createRuntimeSession, req));
  app.patch(runtimeSession, (req, res) => void invoke(res, handlers.updateRuntimeSession, req));

  const runtimeEvents = `${rooms}/:roomId/runtime-events`;
  app.get(runtimeEvents, (req, res) => void invoke(res, handlers.listRuntimeEvents, req));
  app.post(runtimeEvents, (req, res) => void invoke(res, handlers.appendRuntimeEvent, req));
}

