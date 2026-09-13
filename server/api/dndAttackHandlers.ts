import type { Express, Request } from 'express';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { declareDndAttack, listDndAttackActions, type DndAttackDependencies } from '../services/declareDndAttack.js';
import { RuntimeResolutionError } from '../services/applyRuntimeResolution.js';
import { projectRuntimeLogEventsForViewer } from '../room/roomRuntimeVisibilityProjection.js';
import type { RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes.js';
import { changeDndCondition } from '../services/changeDndCondition.js';
import { changeDndResource, listDndRuntimeResources } from '../services/changeDndResource.js';
import { resolveDndSavingThrow } from '../services/resolveDndSavingThrow.js';

export function registerDndAttackRoutes(app: Express, deps: DndAttackDependencies & {
  viewer: (req: Request) => CurrentViewerContext;
  broadcast: (roomId: string, events: RoomRuntimeLogEvent[]) => void;
}) {
  app.post('/rooms/:roomId/runtime/dnd-saving-throw', async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body as Record<string, unknown> : {};
      const memberId = typeof body.memberId === 'string' ? body.memberId : '';
      const result = await resolveDndSavingThrow(deps, { roomId: req.params.roomId, memberId, viewer: deps.viewer(req), body });
      if (!result.replayed) deps.broadcast(req.params.roomId, [result.event]);
      const event = projectRuntimeLogEventsForViewer(deps.rooms.get(req.params.roomId)!, memberId, deps.log.list(req.params.roomId).events, deps.maps.list(req.params.roomId).events).find(e => e.eventId === result.event.eventId);
      if (!event) throw new RuntimeResolutionError('projection_unavailable', 503);
      res.json({ event, replayed: result.replayed });
    } catch (error) { res.status(error instanceof RuntimeResolutionError ? error.status : 503).json({ error: error instanceof RuntimeResolutionError ? error.code : 'saving_throw_unavailable' }); }
  });
  app.get('/rooms/:roomId/runtime/dnd-resources', async (req, res) => {
    try { res.json(await listDndRuntimeResources(deps, { roomId: req.params.roomId, memberId: String(req.query.memberId ?? ''), actorInstanceId: String(req.query.actorInstanceId ?? ''), viewer: deps.viewer(req) })); }
    catch (error) { res.status(error instanceof RuntimeResolutionError ? error.status : 503).json({ error: error instanceof RuntimeResolutionError ? error.code : 'resource_unavailable' }); }
  });
  app.post('/rooms/:roomId/runtime/dnd-resource', async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body as Record<string, unknown> : {};
      const memberId = typeof body.memberId === 'string' ? body.memberId : '';
      const result = await changeDndResource(deps, { roomId: req.params.roomId, memberId, viewer: deps.viewer(req), body });
      if (!result.replayed) deps.broadcast(req.params.roomId, [result.event]);
      const event = projectRuntimeLogEventsForViewer(deps.rooms.get(req.params.roomId)!, memberId, deps.log.list(req.params.roomId).events, deps.maps.list(req.params.roomId).events).find(e => e.eventId === result.event.eventId);
      if (!event) throw new RuntimeResolutionError('projection_unavailable', 503);
      res.json({ event, replayed: result.replayed });
    } catch (error) { res.status(error instanceof RuntimeResolutionError ? error.status : 503).json({ error: error instanceof RuntimeResolutionError ? error.code : 'resource_unavailable' }); }
  });
  app.post('/rooms/:roomId/runtime/dnd-condition', async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body as Record<string, unknown> : {};
      const memberId = typeof body.memberId === 'string' ? body.memberId : '';
      const result = await changeDndCondition(deps, { roomId: req.params.roomId, memberId, viewer: deps.viewer(req), body });
      if (!result.replayed) deps.broadcast(req.params.roomId, [result.event]);
      const event = projectRuntimeLogEventsForViewer(deps.rooms.get(req.params.roomId)!, memberId, deps.log.list(req.params.roomId).events, deps.maps.list(req.params.roomId).events).find(e => e.eventId === result.event.eventId);
      if (!event) throw new RuntimeResolutionError('projection_unavailable', 503);
      res.json({ event, replayed: result.replayed });
    } catch (error) { res.status(error instanceof RuntimeResolutionError ? error.status : 503).json({ error: error instanceof RuntimeResolutionError ? error.code : 'condition_unavailable' }); }
  });
  app.get('/rooms/:roomId/runtime/dnd-actions', async (req, res) => {
    try {
      const actions = await listDndAttackActions(deps, { roomId: req.params.roomId,
        memberId: typeof req.query.memberId === 'string' ? req.query.memberId : '', viewer: deps.viewer(req),
        actorCombatantId: typeof req.query.actorCombatantId === 'string' ? req.query.actorCombatantId : '' });
      res.json({ actions });
    } catch (error) {
      res.status(error instanceof RuntimeResolutionError ? error.status : 503).json({ error: error instanceof RuntimeResolutionError ? error.code : 'action_unavailable' });
    }
  });
  app.post('/rooms/:roomId/runtime/dnd-attack', async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body as Record<string, unknown> : {};
      const memberId = typeof body.memberId === 'string' ? body.memberId : '';
      const result = await declareDndAttack(deps, { roomId: req.params.roomId, memberId, viewer: deps.viewer(req), body });
      if (!result.replayed) deps.broadcast(req.params.roomId, [result.event]);
      const room = deps.rooms.get(req.params.roomId)!;
      const projected = projectRuntimeLogEventsForViewer(room, memberId, deps.log.list(req.params.roomId).events, deps.maps.list(req.params.roomId).events)
        .find((event) => event.eventId === result.event.eventId);
      if (!projected) throw new RuntimeResolutionError('projection_unavailable', 503);
      res.json({ event: projected, replayed: result.replayed });
    } catch (error) {
      res.status(error instanceof RuntimeResolutionError ? error.status : 503).json({ error: error instanceof RuntimeResolutionError ? error.code : 'action_unavailable' });
    }
  });
}
