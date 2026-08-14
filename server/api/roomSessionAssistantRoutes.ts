import type { Express, Request, Response } from 'express';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { ServerApiResponse } from './apiResponse.js';
import type { RoomSessionAssistantApiHandlers, RoomSessionAssistantApiRequest } from './roomSessionAssistantHandlers.js';

function requestId(req: Request): string | undefined {
  const value = req.header('x-request-id');
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function invoke(
  req: Request,
  res: Response,
  input: Omit<RoomSessionAssistantApiRequest, 'requestId' | 'signal' | 'viewer'>,
  viewer: CurrentViewerContext,
  handler: (request: RoomSessionAssistantApiRequest) => Promise<ServerApiResponse<unknown>>,
): Promise<void> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  req.once('aborted', abort);
  try {
    const result = await handler({ ...input, requestId: requestId(req), viewer, signal: controller.signal });
    if (!res.headersSent) res.status(result.statusCode).json(result);
  } catch {
    if (!res.headersSent) res.status(500).json({ ok: false, statusCode: 500, error: { kind: 'internal', message: 'Session AI request failed.' }, requestId: requestId(req) });
  } finally {
    req.removeListener('aborted', abort);
  }
}

export function registerRoomSessionAssistantApiRoutes(
  app: Express,
  handlers: RoomSessionAssistantApiHandlers,
  resolveViewer: (request: Request) => CurrentViewerContext,
): void {
  app.get('/api/ai/rooms/:roomId/session-assistant/status', (req, res) => void invoke(req, res, {
    roomId: req.params.roomId,
    memberId: req.query.memberId,
  }, resolveViewer(req), handlers.status));
  app.post('/api/ai/rooms/:roomId/session-assistant/suggestions', (req, res) => void invoke(req, res, {
    roomId: req.params.roomId,
    memberId: req.body?.memberId,
    body: req.body,
  }, resolveViewer(req), handlers.generate));
  app.post('/api/ai/rooms/:roomId/session-assistant/suggestions/:suggestionId/confirm', (req, res) => void invoke(req, res, {
    roomId: req.params.roomId,
    memberId: req.body?.memberId,
    suggestionId: req.params.suggestionId,
    body: req.body,
  }, resolveViewer(req), handlers.confirm));
}
