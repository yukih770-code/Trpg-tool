/** Append one persistent Room Map event. Hosts retain full control; a host may
 * explicitly grant active players permission to pin new range markers only. */

import { randomUUID } from 'node:crypto';
import { checkMapBackgroundSource } from '../../src/lib/map/mapBackgroundSource.js';

import type { RoomRegistry } from '../room-registry.js';
import type { RoomMapRegistry } from '../room-map-registry.js';
import { resolveRoomMemberTokenMove } from '../room/roomTokenControlGuard.js';
import { ROOM_MAP_EVENT_KINDS } from '../../src/lib/platform/roomMapTypes.js';
import type { RoomMapEvent, RoomMapEventKind } from '../protocol/room-protocol.js';
import { requiresLiveRoomDurableAppend } from './liveRoomDurableAppendConfirmation.js';
import { parseSceneSpatialV1 } from '../../src/lib/map/sceneSpatial.js';
import { parseTokenSpatialFootprintV1 } from '../../src/lib/map/tokenSpatialFootprint.js';

export interface AppendRoomMapEventInput {
  roomId: string;
  authorMemberId: string;
  mapId: string;
  eventKind: RoomMapEventKind;
  payload: Record<string, unknown>;
}

export interface AppendRoomMapEventResult {
  decision: 'appended' | 'roomNotFound' | 'roomClosed' | 'memberNotFound' | 'memberNotActive' | 'memberNotAuthorized' | 'invalidMapEvent';
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
  if (room.identity.lifecycleStatus === 'closed' || room.identity.lifecycleStatus === 'archived') {
    return { decision: 'roomClosed', message: 'The room is closed.' };
  }

  const author = room.members.find((member) => member.memberId === input.authorMemberId);
  if (!author) return { decision: 'memberNotFound', message: `No member "${input.authorMemberId}".` };
  if (author.status !== 'active') return { decision: 'memberNotActive', message: `Member status is "${author.status}".` };
  const isHost = author.role === 'host';
  const canPinRanges = room.mapPermissions?.some((permission) => permission.memberId === author.memberId && permission.canPinRanges) === true;
  const isPinnedRangeAdd = input.eventKind === 'map.template_added';
  const tokenMove = input.eventKind === 'map.token_moved'
    ? resolveRoomMemberTokenMove({ room, mapRegistry, memberId: author.memberId, mapId: input.mapId, payload: input.payload })
    : undefined;
  if (!isHost && !(canPinRanges && isPinnedRangeAdd) && !tokenMove?.allowed) {
    return { decision: 'memberNotAuthorized', message: 'Room map changes require an active host, an explicit range grant, or a verified owned character token.' };
  }

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

  if (input.eventKind === 'map.background_set') {
    const { backgroundAssetId, backgroundUrl } = input.payload;
    if ((backgroundAssetId != null && (typeof backgroundAssetId !== 'string' || !/^[0-9a-f-]{36}$/.test(backgroundAssetId))) ||
      (backgroundAssetId != null && backgroundUrl != null) ||
      (backgroundUrl != null && (typeof backgroundUrl !== 'string' || !checkMapBackgroundSource(backgroundUrl).ok))) {
      return { decision: 'invalidMapEvent', message: 'Use an asset ID or a durable image URL.' };
    }
  }
  if (input.eventKind === 'map.spatial_updated') {
    const spatial = parseSceneSpatialV1(input.payload.spatial);
    if (!spatial) return { decision: 'invalidMapEvent', message: 'A valid versioned Scene spatial configuration is required.' };
    input = { ...input, payload: { spatial } };
  }
  if (input.eventKind === 'map.token_added' || input.eventKind === 'map.token_updated') {
    const token = input.payload.token;
    if (token && typeof token === 'object' && !Array.isArray(token) && Object.prototype.hasOwnProperty.call(token, 'footprint')) {
      const rawFootprint = (token as Record<string, unknown>).footprint;
      const footprint = parseTokenSpatialFootprintV1(rawFootprint);
      if (rawFootprint !== null && !footprint) {
        return { decision: 'invalidMapEvent', message: 'A valid versioned Token spatial footprint is required.' };
      }
      const sanitizedToken = { ...(token as Record<string, unknown>), footprint: footprint ?? null };
      input = { ...input, payload: { ...input.payload, token: sanitizedToken } };
    }
  }
  const event = mapRegistry.append(input.roomId, {
    mapEventId: `mapevent_${randomUUID()}`,
    roomId: input.roomId,
    mapId: input.mapId.trim(),
    createdAt: new Date().toISOString(),
    authorMemberId: input.authorMemberId,
    eventKind: input.eventKind,
    payload: input.payload,
  }, { pending: requiresLiveRoomDurableAppend(room) });
  return { decision: 'appended', event };
}
