import type { Express, Request, Response } from 'express';

import { getVerifiedViewer } from '../auth/requestViewer.js';
import type { ServerApiResponse } from './apiResponse.js';
import type { PrivateCompendiumPackApiHandlers, PrivateCompendiumPackApiRequest } from './privateCompendiumPackApiHandlers.js';

const PREFIX = '/api/world-servers/:worldServerId/compendium-packs';

function input(req: Request): PrivateCompendiumPackApiRequest {
  return {
    requestId: typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined,
    params: req.params as Record<string, unknown>, query: req.query as Record<string, unknown>, body: req.body,
    headers: req.headers as Record<string, string | string[] | undefined>, viewer: getVerifiedViewer(req),
  };
}

async function invoke(res: Response, handler: (value: PrivateCompendiumPackApiRequest) => Promise<ServerApiResponse<unknown>>, req: Request): Promise<void> {
  try {
    const result = await handler(input(req));
    res.status(result.statusCode).json(result);
  } catch {
    res.status(500).json({ ok: false, statusCode: 500, error: { kind: 'internal', message: 'Private content pack request failed.' } });
  }
}

export function registerPrivateCompendiumPackApiRoutes(app: Express, handlers: PrivateCompendiumPackApiHandlers): void {
  app.get(PREFIX, (req, res) => void invoke(res, handlers.listPacks, req));
  app.post(PREFIX, (req, res) => void invoke(res, handlers.publishPack, req));
}
