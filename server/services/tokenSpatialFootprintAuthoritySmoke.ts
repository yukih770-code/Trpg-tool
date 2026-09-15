import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createInMemoryRoomMapRegistry } from '../room-map-registry.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';
import { createTokenSpatialFootprintV1, resolveTokenWorldBounds } from '../../src/lib/map/tokenSpatialFootprint.js';
import { createSceneSpatialV1 } from '../../src/lib/map/sceneSpatial.js';
import { readDndAttackIntent } from './declareDndAttack.js';
import { appendRoomMapEvent } from './appendRoomMapEvent.js';
import { createRoom } from './createRoom.js';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const rooms = createInMemoryRoomRegistry();
const maps = createInMemoryRoomMapRegistry();
const room = createRoom({ hostDisplayName: 'Host', systemId: 'dnd5e-2024' }).room;
const host = room.members[0];
room.members.push(
  { memberId: 'player-footprint', displayName: 'Player', role: 'player', status: 'active' },
  { memberId: 'spectator-footprint', displayName: 'Spectator', role: 'spectator', status: 'active' },
);
rooms.create(room);
const mapId = 'footprint-map';
const footprint = createTokenSpatialFootprintV1({ width: 1.5, height: 2 });

expect(appendRoomMapEvent(rooms, maps, {
  roomId: room.identity.roomId,
  authorMemberId: host.memberId,
  mapId,
  eventKind: 'map.token_added',
  payload: { token: { id: 'token-1', name: 'Token', x: 20, y: 30 } },
}).decision === 'appended', 'host may add a Token');

const updated = appendRoomMapEvent(rooms, maps, {
  roomId: room.identity.roomId,
  authorMemberId: host.memberId,
  mapId,
  eventKind: 'map.token_updated',
  payload: { token: { id: 'token-1', footprint: { ...footprint, occupiedCells: ['A1'], reach: 10 } } },
});
expect(updated.decision === 'appended', 'host may set a valid footprint');
const storedFootprint = (updated.event?.payload.token as { footprint?: Record<string, unknown> } | undefined)?.footprint;
expect(storedFootprint?.width === 1.5 && !('occupiedCells' in storedFootprint) && !('reach' in storedFootprint), 'server allowlists footprint fields');

for (const authorMemberId of ['player-footprint', 'spectator-footprint']) {
  const denied = appendRoomMapEvent(rooms, maps, {
    roomId: room.identity.roomId,
    authorMemberId,
    mapId,
    eventKind: 'map.token_updated',
    payload: { token: { id: 'token-1', footprint } },
  });
  expect(denied.decision === 'memberNotAuthorized', `${authorMemberId} cannot edit authoritative footprint`);
}

for (const bad of [
  { ...footprint, width: 0 },
  { ...footprint, height: -1 },
  { ...footprint, width: Number.NaN },
  { ...footprint, width: Number.POSITIVE_INFINITY },
  { ...footprint, width: 1_000_000_001 },
  { ...footprint, schemaVersion: 99 },
]) {
  const invalid = appendRoomMapEvent(rooms, maps, {
    roomId: room.identity.roomId,
    authorMemberId: host.memberId,
    mapId,
    eventKind: 'map.token_updated',
    payload: { token: { id: 'token-1', footprint: bad } },
  });
  expect(invalid.decision === 'invalidMapEvent', 'server rejects malformed footprint');
}

expect(appendRoomMapEvent(rooms, maps, {
  roomId: room.identity.roomId,
  authorMemberId: host.memberId,
  mapId,
  eventKind: 'map.token_moved',
  payload: { tokenId: 'token-1', x: 70, y: 80 },
}).decision === 'appended', 'ordinary movement still appends');
const replayed = replayMapRuntimeEvents(maps.list(room.identity.roomId).events, mapId);
expect(replayed.tokens[0]?.x === 70 && replayed.tokens[0]?.footprint?.height === 2, 'movement preserves authoritative footprint');
const serverBounds = resolveTokenWorldBounds(createSceneSpatialV1({ width: 20, height: 10 }), replayed.tokens[0]!);
expect(serverBounds.status === 'bounded' && serverBounds.bounds.center.x === 14 && serverBounds.bounds.minX === 13.25, 'server-readable durable state resolves deterministic world bounds');

const intent = readDndAttackIntent({
  intentId: '4f68bab7-f876-4d35-95a7-775aab71cc9f',
  actorCombatantId: 'actor',
  targetCombatantId: 'target',
  actionId: 'action',
  mode: 'normal',
  footprint,
  occupiedCells: ['A1'],
  nearestBoundaryDistance: 0,
  targetBounds: { width: 1000 },
});
expect(Object.keys(intent).length === 5 && !('footprint' in intent) && !('occupiedCells' in intent), 'T12 intent allowlist ignores footprint-derived claims');

console.log(JSON.stringify({ status: 'passed', checks: 15 }));
