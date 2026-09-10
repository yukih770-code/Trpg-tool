import type { Express, Request } from 'express';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { declareDndAttack, listDndAttackActions, type DndAttackDependencies } from '../services/declareDndAttack.js';
import { RuntimeResolutionError } from '../services/applyRuntimeResolution.js';
import { projectRuntimeLogEventsForViewer } from '../room/roomRuntimeVisibilityProjection.js';
import type { RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes.js';

export function registerDndAttackRoutes(app: Express, deps: DndAttackDependencies & {
  viewer: (req: Request) => CurrentViewerContext;
  broadcast: (roomId: string, events: RoomRuntimeLogEvent[]) => void;
}) {
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
