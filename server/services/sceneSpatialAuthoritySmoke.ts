import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createInMemoryRoomMapRegistry } from '../room-map-registry.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';
import { createSceneSpatialV1 } from '../../src/lib/map/sceneSpatial.js';
import { appendRoomMapEvent } from './appendRoomMapEvent.js';
import { createRoom } from './createRoom.js';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const rooms = createInMemoryRoomRegistry();
const maps = createInMemoryRoomMapRegistry();
const room = createRoom({ hostDisplayName: 'Host', systemId: 'custom' }).room;
const host = room.members[0];
const playerId = 'player-spatial';
const spectatorId = 'spectator-spatial';
room.members.push(
  { memberId: playerId, displayName: 'Player', role: 'player', status: 'active' },
  { memberId: spectatorId, displayName: 'Spectator', role: 'spectator', status: 'active' },
);
rooms.create(room);
const spatial = createSceneSpatialV1({ width: 30, height: 18, grid: { cellSize: 1 }, scale: { unitsPerGridCell: 2, unitLabel: 'm' } });

const hostResult = appendRoomMapEvent(rooms, maps, {
  roomId: room.identity.roomId, authorMemberId: host.memberId, mapId: 'main',
  eventKind: 'map.spatial_updated',
  payload: { spatial: { ...spatial, clientDistance: 0, boardWidthPx: 9999 } },
});
expect(hostResult.decision === 'appended', 'active host may configure Scene space');
expect(hostResult.event?.payload.spatial && !('boardWidthPx' in (hostResult.event.payload.spatial as object)), 'server strips non-contract fields');

for (const authorMemberId of [playerId, spectatorId]) {
  const denied = appendRoomMapEvent(rooms, maps, {
    roomId: room.identity.roomId, authorMemberId, mapId: 'main',
    eventKind: 'map.spatial_updated', payload: { spatial },
  });
  expect(denied.decision === 'memberNotAuthorized', `${authorMemberId} cannot rewrite Scene space`);
}

const invalid = appendRoomMapEvent(rooms, maps, {
  roomId: room.identity.roomId, authorMemberId: host.memberId, mapId: 'main',
  eventKind: 'map.spatial_updated',
  payload: { spatial: { ...spatial, world: { width: -1, height: 18 } } },
});
expect(invalid.decision === 'invalidMapEvent', 'malformed spatial state is rejected');

const replayed = replayMapRuntimeEvents(maps.list(room.identity.roomId).events, 'main');
expect(replayed.spatial?.world.width === 30 && replayed.spatial?.scale?.unitLabel === 'm', 'authoritative stream replays spatial state');
console.log(JSON.stringify({ status: 'passed', checks: 6 }));
