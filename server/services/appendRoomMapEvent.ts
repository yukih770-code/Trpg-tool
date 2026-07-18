/** Append one host-managed Room Map event (v0). */

import { randomUUID } from 'node:crypto';

import type { RoomRegistry } from '../room-registry.js';
import type { RoomMapRegistry } from '../room-map-registry.js';
import { ROOM_MAP_EVENT_KINDS } from '../../src/lib/platform/roomMapTypes.js';
import type { RoomMapEvent, RoomMapEventKind } from '../protocol/room-protocol.js';

export interface AppendRoomMapEventInput {
  roomId: string;
  authorMemberId: string;
  mapId: string;
  eventKind: RoomMapEventKind;
  payload: Record<string, unknown>;
}

export interface AppendRoomMapEventResult {
  decision: 'appended' | 'roomNotFound' | 'memberNotFound' | 'memberNotActive' | 'memberNotAuthorized' | 'invalidMapEvent';
  event?: RoomMapEvent;
  message?: string;
}

export function appendRoomMapEvent(
  roomRegistry: RoomRegistry,
  mapRegistry: RoomMapRegistry,
  input: AppendRoomMapEventInput,
): AppendRoomMapEventResult {
  const room = roomRegistry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };

  const author = room.members.find((member) => member.memberId === input.authorMemberId);
  if (!author) return { decision: 'memberNotFound', message: `No member "${input.authorMemberId}".` };
  if (author.status !== 'active') return { decision: 'memberNotActive', message: `Member status is "${author.status}".` };
  if (author.role !== 'host') return { decision: 'memberNotAuthorized', message: 'Room map changes require an active host member.' };

  if (
    typeof input.mapId !== 'string' ||
    input.mapId.trim() === '' ||
    input.mapId.length > 240 ||
    !ROOM_MAP_EVENT_KINDS.includes(input.eventKind) ||
    !input.payload ||
    typeof input.payload !== 'object' ||
    Array.isArray(input.payload)
  ) {
    return { decision: 'invalidMapEvent', message: 'A valid mapId, map event kind, and object payload are required.' };
  }

  const event = mapRegistry.append(input.roomId, {
    mapEventId: `mapevent_${randomUUID()}`,
    roomId: input.roomId,
    mapId: input.mapId.trim(),
    createdAt: new Date().toISOString(),
    authorMemberId: input.authorMemberId,
    eventKind: input.eventKind,
    payload: input.payload,
  });
  return { decision: 'appended', event };
}
