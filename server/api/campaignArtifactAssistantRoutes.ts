import type { Express, Request, Response } from 'express';
import { getVerifiedViewer } from '../auth/requestViewer.js';
import type { CampaignArtifactAssistantApiHandlers, CampaignArtifactAssistantApiRequest } from './campaignArtifactAssistantHandlers.js';

function requestId(req: Request): string | undefined {
  const value = req.header('x-request-id');
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function invoke(req: Request, res: Response, handler: (input: CampaignArtifactAssistantApiRequest) => Promise<Awaited<ReturnType<CampaignArtifactAssistantApiHandlers['status']>>>): Promise<void> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  req.once('aborted', abort);
  try {
    const result = await handler({ requestId: requestId(req), params: req.params as Record<string, unknown>, query: req.query as Record<string, unknown>, body: req.body, headers: req.headers as Record<string, string | string[] | undefined>, viewer: getVerifiedViewer(req) ?? { viewerUserId: null, isAuthenticated: false, authTrustLevel: 'anonymous', isDevOnly: false, isServiceInternal: false, notes: ['No verified viewer was attached to the request.'] }, signal: controller.signal });
    if (!res.headersSent) res.status(result.statusCode).json(result);
  } catch {
    if (!res.headersSent) res.status(500).json({ ok: false, statusCode: 500, error: { kind: 'internal', message: 'Campaign AI request failed.' }, requestId: requestId(req) });
  } finally { req.removeListener('aborted', abort); }
}

export function registerCampaignArtifactAssistantApiRoutes(app: Express, handlers: CampaignArtifactAssistantApiHandlers): void {
  const root = '/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts';
  app.get(`${root}/status`, (req, res) => void invoke(req, res, handlers.status));
  app.get(root, (req, res) => void invoke(req, res, handlers.list));
  app.post(`${root}/suggestions`, (req, res) => void invoke(req, res, handlers.generate));
  app.post(`${root}/suggestions/:suggestionId/confirm`, (req, res) => void invoke(req, res, handlers.confirm));
  app.post(`${root}/:artifactId/adopt`, (req, res) => void invoke(req, res, handlers.adopt));
  app.post(`${root}/:artifactId/withdraw-adoption`, (req, res) => void invoke(req, res, handlers.withdrawAdoption));
  app.post(`${root}/:artifactId/archive`, (req, res) => void invoke(req, res, handlers.archive));
  app.post(`${root}/:artifactId/restore`, (req, res) => void invoke(req, res, handlers.restore));
}
