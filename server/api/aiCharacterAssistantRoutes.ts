import type { Express, Request, Response } from 'express';
import { getVerifiedViewer } from '../auth/requestViewer.js';
import type { ServerApiResponse } from './apiResponse.js';
import type { AiCharacterAssistantApiHandlers, AiCharacterAssistantApiRequest } from './aiCharacterAssistantHandlers.js';

function requestId(req: Request): string | undefined {
  const value = req.header('x-request-id');
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function invoke(
  req: Request,
  res: Response,
  handler: (input: AiCharacterAssistantApiRequest) => Promise<ServerApiResponse<unknown>>,
): Promise<void> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  req.once('aborted', abort);
  try {
    const result = await handler({
      requestId: requestId(req),
      body: req.body,
      headers: req.headers as Record<string, string | string[] | undefined>,
      viewer: getVerifiedViewer(req),
      signal: controller.signal,
    });
    if (!res.headersSent) res.status(result.statusCode).json(result);
  } catch {
    if (!res.headersSent) res.status(500).json({ ok: false, statusCode: 500, error: { kind: 'internal', message: 'Character assistant request failed.' }, requestId: requestId(req) });
  } finally {
    req.removeListener('aborted', abort);
  }
}

export function registerAiCharacterAssistantApiRoutes(app: Express, handlers: AiCharacterAssistantApiHandlers): void {
  app.get('/api/ai/model-gateway/status', (req, res) => void invoke(req, res, handlers.status));
  app.post('/api/ai/dnd-character-assistant/suggest', (req, res) => void invoke(req, res, handlers.suggest));
}
