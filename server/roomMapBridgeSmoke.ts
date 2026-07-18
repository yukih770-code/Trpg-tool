import { createInMemoryRoomRegistry } from './room-registry.js';
import { createRoom } from './services/createRoom.js';
import { createInMemoryRoomMapRegistry } from './room-map-registry.js';
import { appendRoomMapEvent } from './services/appendRoomMapEvent.js';
import { listRoomMapEvents } from './services/listRoomMapEvents.js';

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

const second = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: host.memberId,
  mapId: 'room-map-smoke',
  eventKind: 'map.token_added',
  payload: { token: { id: 'token-smoke', name: 'Scout', x: 25, y: 50, size: 'medium', sourceType: 'manual' } },
});
expect(second.decision === 'appended' && second.event?.seq === 2, 'room map events should be monotonic');

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

const unknownRejected = appendRoomMapEvent(rooms, mapEvents, {
  roomId: room.identity.roomId,
  authorMemberId: 'unknown-member',
  mapId: 'room-map-smoke',
  eventKind: 'map.token_removed',
  payload: { tokenId: 'token-smoke' },
});
expect(unknownRejected.decision === 'memberNotFound', 'unknown members must not mutate the room map');

const listed = listRoomMapEvents(rooms, mapEvents, { roomId: room.identity.roomId, mapId: 'room-map-smoke' });
expect(listed.decision === 'ok' && listed.result?.events.length === 2, 'map listing should replay both events');
expect(listed.result?.events[0]?.eventKind === 'map.grid_updated', 'map event order must be preserved');

// eslint-disable-next-line no-console
console.log('Room Map bridge smoke passed: host append, authorization, ordered replay.');
