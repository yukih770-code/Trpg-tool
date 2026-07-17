import type { Express, Request, Response } from 'express';
import type { DndPrivateMonsterApiHandlers, DndPrivateMonsterApiRequest } from './dndPrivateMonsterApiHandlers.js';
import type { ServerApiResponse } from './apiResponse.js';
import { getVerifiedViewer } from '../auth/requestViewer.js';

const PREFIX = '/api/world-servers/:worldServerId/dnd/monsters';
const input = (req: Request): DndPrivateMonsterApiRequest => ({ requestId: typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined, params: req.params as Record<string, unknown>, query: req.query as Record<string, unknown>, body: req.body, headers: req.headers as Record<string, string | string[] | undefined>, viewer: getVerifiedViewer(req) });
async function invoke(res: Response, handler: (value: DndPrivateMonsterApiRequest) => Promise<ServerApiResponse<unknown>>, req: Request) { try { const result = await handler(input(req)); res.status(result.statusCode).json(result); } catch { res.status(500).json({ ok: false, statusCode: 500, error: { kind: 'internal', message: 'Private monster request failed.' } }); } }
export function registerDndPrivateMonsterApiRoutes(app: Express, handlers: DndPrivateMonsterApiHandlers): void { app.get(PREFIX, (req,res) => void invoke(res, handlers.listMonsters, req)); app.post(PREFIX, (req,res) => void invoke(res, handlers.createMonster, req)); app.get(`${PREFIX}/:monsterTemplateId`, (req,res) => void invoke(res, handlers.getMonster, req)); app.patch(`${PREFIX}/:monsterTemplateId`, (req,res) => void invoke(res, handlers.updateMonster, req)); app.post(`${PREFIX}/:monsterTemplateId/archive`, (req,res) => void invoke(res, handlers.archiveMonster, req)); }
