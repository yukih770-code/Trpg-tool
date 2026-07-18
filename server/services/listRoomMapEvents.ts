/** Read one Room Map stream without putting map state in RoomSnapshot. */

import type { RoomRegistry } from '../room-registry.js';
import type { RoomMapRegistry } from '../room-map-registry.js';
import type { RoomMapEventListResult } from '../protocol/room-protocol.js';

export interface ListRoomMapEventsInput {
  roomId: string;
  afterSeq?: number;
  mapId?: string;
}

export interface ListRoomMapEventsResult {
  decision: 'ok' | 'roomNotFound' | 'invalidRequest';
  result?: RoomMapEventListResult;
  message?: string;
}

export function listRoomMapEvents(
  roomRegistry: RoomRegistry,
  mapRegistry: RoomMapRegistry,
  input: ListRoomMapEventsInput,
): ListRoomMapEventsResult {
  if (!roomRegistry.get(input.roomId)) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
  if (input.afterSeq !== undefined && (!Number.isInteger(input.afterSeq) || input.afterSeq < 0)) {
    return { decision: 'invalidRequest', message: 'afterSeq must be a non-negative integer.' };
  }
  if (input.mapId !== undefined && (input.mapId.trim() === '' || input.mapId.length > 240)) {
    return { decision: 'invalidRequest', message: 'mapId is invalid.' };
  }
  return { decision: 'ok', result: mapRegistry.list(input.roomId, { afterSeq: input.afterSeq, mapId: input.mapId }) };
}
