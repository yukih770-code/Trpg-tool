import type { Express, Request, Response } from 'express';
import { getVerifiedViewer } from '../auth/requestViewer.js';
import type { DndPersonalContentAssistantApiHandlers } from './dndPersonalContentAssistantHandlers.js';

function requestId(req: Request): string | undefined {
  const value = req.header('x-request-id');
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function registerDndPersonalContentAssistantApiRoutes(app: Express, handlers: DndPersonalContentAssistantApiHandlers): void {
  app.post('/api/ai/dnd-personal-content-assistant/suggest', async (req: Request, res: Response) => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    req.once('aborted', abort);
    try {
      const result = await handlers.suggest({
        requestId: requestId(req),
        body: req.body,
        headers: req.headers as Record<string, string | string[] | undefined>,
        viewer: getVerifiedViewer(req),
        signal: controller.signal,
      });
      if (!res.headersSent) res.status(result.statusCode).json(result);
    } catch {
      if (!res.headersSent) res.status(500).json({ ok: false, statusCode: 500, error: { kind: 'internal', message: 'Personal content drafting request failed.' }, requestId: requestId(req) });
    } finally {
      req.removeListener('aborted', abort);
    }
  });
}
