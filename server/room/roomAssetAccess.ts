import type { RoomSnapshot } from '../protocol/room-protocol.js';
import type { RoomMapRegistry } from '../room-map-registry.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveRoomParticipant } from './roomRuntimePermissionGuard.js';
import { projectRoomMapEventsForViewer } from './roomRuntimeVisibilityProjection.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';

/** Campaign association is NOT a grant. Only the current viewer-visible map grants room use. */
export function canReadRoomAsset(room: RoomSnapshot | undefined, maps: RoomMapRegistry, viewer: CurrentViewerContext, memberId: string, assetId: string): boolean {
  if (!room || !resolveRoomParticipant({ room, viewer, memberId }).allowed) return false;
  const events = projectRoomMapEventsForViewer(room, memberId, maps.list(room.identity.roomId).events);
  return [...new Set(events.map(e => e.mapId))].some(mapId => {
    const board = replayMapRuntimeEvents(events.filter(e => e.mapId === mapId), mapId);
    return board.backgroundAssetId === assetId || board.tokens.some(token => token.imageAssetId === assetId);
  });
}
