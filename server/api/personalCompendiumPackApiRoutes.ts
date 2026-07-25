import type { Express, Request, Response } from 'express';

import { getVerifiedViewer } from '../auth/requestViewer.js';
import type { ServerApiResponse } from './apiResponse.js';
import type { PersonalCompendiumPackApiHandlers, PersonalCompendiumPackApiRequest } from './personalCompendiumPackApiHandlers.js';

const PREFIX = '/api/me/private-compendium-packs';

function input(req: Request): PersonalCompendiumPackApiRequest {
  return {
    requestId: typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined,
    body: req.body,
    headers: req.headers as Record<string, string | string[] | undefined>,
    viewer: getVerifiedViewer(req),
  };
}

async function invoke(res: Response, handler: (value: PersonalCompendiumPackApiRequest) => Promise<ServerApiResponse<unknown>>, req: Request): Promise<void> {
  try {
    const result = await handler(input(req));
    res.status(result.statusCode).json(result);
  } catch {
    res.status(500).json({ ok: false, statusCode: 500, error: { kind: 'internal', message: 'Personal content pack request failed.' } });
  }
}

export function registerPersonalCompendiumPackApiRoutes(app: Express, handlers: PersonalCompendiumPackApiHandlers): void {
  app.get(PREFIX, (req, res) => void invoke(res, handlers.listPacks, req));
  app.get(`${PREFIX}/:packId/versions/:packVersionId`, (req, res) => void invoke(res, (input) => handlers.getPackVersion(req.params.packId, req.params.packVersionId, input), req));
  app.post(PREFIX, (req, res) => void invoke(res, handlers.publishPack, req));
  app.post(`${PREFIX}/:packId/versions`, (req, res) => void invoke(res, (input) => handlers.publishVersion(req.params.packId, input), req));
}
