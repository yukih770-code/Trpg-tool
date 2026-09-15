import { createInMemoryRoomRegistry } from './room-registry.js';
import { createRoom } from './services/createRoom.js';
import { createInMemoryRoomMapRegistry } from './room-map-registry.js';
import { appendRoomMapEvent } from './services/appendRoomMapEvent.js';
import { listRoomMapEvents } from './services/listRoomMapEvents.js';
import { setRoomMapMemberPermission } from './services/setRoomMapMemberPermission.js';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const rooms = createInMemoryRoomRegistry();
const mapEvents = createInMemoryRoomMapRegistry();
const room = createRoom({ hostDisplayName: 'Host', systemId: 'dnd5e-2024' }).room;
rooms.create(room);
const host = room.members[0];

const first = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: host.memberId,
  mapId: 'room-map-smoke',
  eventKind: 'map.grid_updated',
  payload: { grid: { enabled: true, sizePx: 50, feetPerSquare: 5 } },
});
expect(first.decision === 'appended' && first.event?.seq === 1, 'host should append the first room map event');

const spatial = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: host.memberId,
  mapId: 'room-map-smoke',
  eventKind: 'map.spatial_updated',
  payload: { spatial: { schemaVersion: 1, coordinateSystem: 'normalized-100', tokenAnchor: 'center', world: { width: 20, height: 12 }, grid: { kind: 'square', originX: 0, originY: 0, cellSize: 1 }, scale: { unitsPerGridCell: 5, unitLabel: 'ft' } } },
});
expect(spatial.decision === 'appended' && spatial.event?.seq === 2, 'host should append authoritative Scene geometry');

const second = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: host.memberId,
  mapId: 'room-map-smoke',
  eventKind: 'map.token_added',
  payload: { token: { id: 'token-smoke', name: 'Scout', x: 25, y: 50, size: 'medium', sourceType: 'manual' } },
});
expect(second.decision === 'appended' && second.event?.seq === 3, 'room map events should be monotonic');

const footprint = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: host.memberId,
  mapId: 'room-map-smoke',
  eventKind: 'map.token_updated',
  payload: { token: { id: 'token-smoke', footprint: { schemaVersion: 1, shape: 'axis-aligned-rectangle', coordinateSpace: 'scene-world', anchor: 'center', width: 1.5, height: 2 } } },
});
expect(footprint.decision === 'appended' && footprint.event?.seq === 4, 'host should append authoritative Token bounds');

const playerId = 'member_player_smoke';
rooms.update(room.identity.roomId, (current) => ({
  ...current,
  members: [...current.members, { memberId: playerId, displayName: 'Player', role: 'player', status: 'active' }],
}));
const playerRejected = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: playerId,
  mapId: 'room-map-smoke',
  eventKind: 'map.token_removed',
  payload: { tokenId: 'token-smoke' },
});
expect(playerRejected.decision === 'memberNotAuthorized', 'active players must not mutate the host-managed room map');

const permission = setRoomMapMemberPermission(rooms, {
  roomId: room.identity.roomId,
  authorizedByMemberId: host.memberId,
  memberId: playerId,
  canPinRanges: true,
});
expect(permission.decision === 'updated' && permission.room?.mapPermissions?.[0]?.canPinRanges, 'host should be able to grant a player fixed-range permission');

const playerRange = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: playerId,
  mapId: 'room-map-smoke',
  eventKind: 'map.template_added',
  payload: { template: { id: 'range-smoke', shape: 'circle', x: 50, y: 50, sizeFeet: 15, rotation: 0 } },
});
expect(playerRange.decision === 'appended' && playerRange.event?.seq === 5, 'a granted player should be able to pin a range');

const playerStillRejected = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: playerId,
  mapId: 'room-map-smoke',
  eventKind: 'map.token_removed',
  payload: { tokenId: 'token-smoke' },
});
expect(playerStillRejected.decision === 'memberNotAuthorized', 'range permission must not grant token control');

const unknownRejected = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: 'unknown-member',
  mapId: 'room-map-smoke',
  eventKind: 'map.token_removed',
  payload: { tokenId: 'token-smoke' },
});
expect(unknownRejected.decision === 'memberNotFound', 'unknown members must not mutate the room map');

const listed = listRoomMapEvents(rooms, mapEvents, { roomId: room.identity.roomId, mapId: 'room-map-smoke' });
expect(listed.decision === 'ok' && listed.result?.events.length === 5, 'map listing should replay host and delegated range events');
expect(listed.result?.events[0]?.eventKind === 'map.grid_updated', 'map event order must be preserved');

// eslint-disable-next-line no-console
console.log('Room Map bridge smoke passed: host append, delegated range permission, restricted player edits, ordered replay.');
