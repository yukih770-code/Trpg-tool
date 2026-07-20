import type { Express, Request, Response } from 'express';

import type { ServerApiResponse } from './apiResponse.js';
import type { ActorApiHandlers, ActorApiRequest } from './actorApiHandlers.js';
import { getVerifiedViewer } from '../auth/requestViewer.js';

const PREFIX = '/api/actors';

function requestId(req: Request): string | undefined {
  const value = req.header('x-request-id');
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function inputOf(req: Request): ActorApiRequest {
  return {
    requestId: requestId(req),
    params: req.params as Record<string, unknown>,
    query: req.query as Record<string, unknown>,
    body: req.body,
    headers: req.headers as Record<string, string | string[] | undefined>,
    viewer: getVerifiedViewer(req),
  };
}

async function invoke(
  res: Response,
  handler: (input: ActorApiRequest) => Promise<ServerApiResponse<unknown>>,
  req: Request,
): Promise<void> {
  try {
    const result = await handler(inputOf(req));
    res.status(result.statusCode).json(result);
  } catch {
    res.status(500).json({ ok: false, statusCode: 500, error: { kind: 'internal', message: 'Actor vault request failed.' }, requestId: requestId(req) });
  }
}

/** Registers authenticated actor-vault asset routes only. No room/runtime API lives here. */
export function registerActorApiRoutes(app: Express, handlers: ActorApiHandlers): void {
  app.get(PREFIX, (req, res) => void invoke(res, handlers.listActors, req));
  app.post(PREFIX, (req, res) => void invoke(res, handlers.createActor, req));
  app.get(`${PREFIX}/:actorId`, (req, res) => void invoke(res, handlers.getActor, req));
  app.patch(`${PREFIX}/:actorId`, (req, res) => void invoke(res, handlers.updateActor, req));
  app.post(`${PREFIX}/:actorId/archive`, (req, res) => void invoke(res, handlers.archiveActor, req));
  app.post(`${PREFIX}/:actorId/restore`, (req, res) => void invoke(res, handlers.restoreActor, req));
}
