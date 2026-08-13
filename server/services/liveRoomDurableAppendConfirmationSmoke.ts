import { createInMemoryRoomMapRegistry } from '../room-map-registry.js';
import { createInMemoryRuntimeLogRegistry } from '../runtime-log-registry.js';
import { createRoom } from './createRoom.js';
import { confirmLiveRoomDurableAppend } from './liveRoomDurableAppendConfirmation.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const localRoom = createRoom({ hostDisplayName: 'Local Host' }).room;
assert(confirmLiveRoomDurableAppend(localRoom, undefined).decision === 'notRequired', 'Memory-only rooms must not require PostgreSQL confirmation.');

const durableRoom = createRoom({
  hostDisplayName: 'Cloud Host',
  hostUserId: 'host-user',
  sessionId: 'runtime-session-1',
  campaignRef: {
    source: 'unknown',
    worldServerId: 'world-1',
    campaignId: 'campaign-1',
    displayName: 'Campaign',
    systemId: 'dnd5e-2024',
  },
}).room;
assert(confirmLiveRoomDurableAppend(durableRoom, { status: 'persisted', notes: [] }).decision === 'confirmed', 'A persisted cloud event must be confirmed.');
assert(confirmLiveRoomDurableAppend(durableRoom, { status: 'repository_error', notes: [] }).decision === 'unavailable', 'A rejected cloud event must not be acknowledged.');
assert(confirmLiveRoomDurableAppend(durableRoom, undefined).decision === 'unavailable', 'A missing cloud persistence result must fail closed.');

const logs = createInMemoryRuntimeLogRegistry();
const firstLog = logs.append(durableRoom.identity.roomId, {
  eventId: 'log-1',
  roomId: durableRoom.identity.roomId,
  createdAt: '2026-08-13T00:00:00.000Z',
  kind: 'system.note',
  visibility: 'public',
}, { pending: true });
logs.append(durableRoom.identity.roomId, {
  eventId: 'log-2',
  roomId: durableRoom.identity.roomId,
  createdAt: '2026-08-13T00:00:01.000Z',
  kind: 'system.note',
  visibility: 'public',
});
assert(logs.list(durableRoom.identity.roomId).events.map((event) => event.eventId).join(',') === 'log-2', 'Pending RuntimeLog events must stay invisible before confirmation.');
assert(logs.discardPending(durableRoom.identity.roomId, firstLog.eventId) === 'discarded', 'A failed non-tail RuntimeLog append must be removable by ID.');
assert(logs.list(durableRoom.identity.roomId).events.map((event) => event.eventId).join(',') === 'log-2', 'Confirmed later RuntimeLog events must remain after compensation.');
const pendingLog = logs.append(durableRoom.identity.roomId, {
  eventId: 'log-3',
  roomId: durableRoom.identity.roomId,
  createdAt: '2026-08-13T00:00:02.000Z',
  kind: 'system.note',
  visibility: 'public',
}, { pending: true });
assert(!logs.list(durableRoom.identity.roomId).events.some((event) => event.eventId === pendingLog.eventId), 'A successful append must remain hidden before confirmation.');
assert(logs.confirmPending(durableRoom.identity.roomId, pendingLog.eventId) === 'confirmed', 'A persisted RuntimeLog append must be confirmable.');
assert(logs.list(durableRoom.identity.roomId).events.some((event) => event.eventId === pendingLog.eventId), 'A confirmed RuntimeLog append must become visible.');

const maps = createInMemoryRoomMapRegistry();
const firstMap = maps.append(durableRoom.identity.roomId, {
  mapEventId: 'map-1',
  roomId: durableRoom.identity.roomId,
  mapId: 'main-map',
  createdAt: '2026-08-13T00:00:00.000Z',
  authorMemberId: durableRoom.members[0].memberId,
  eventKind: 'map.grid_updated',
  payload: { grid: { enabled: true } },
}, { pending: true });
maps.append(durableRoom.identity.roomId, {
  mapEventId: 'map-2',
  roomId: durableRoom.identity.roomId,
  mapId: 'main-map',
  createdAt: '2026-08-13T00:00:01.000Z',
  authorMemberId: durableRoom.members[0].memberId,
  eventKind: 'map.grid_updated',
  payload: { grid: { enabled: false } },
});
assert(maps.list(durableRoom.identity.roomId).events.map((event) => event.mapEventId).join(',') === 'map-2', 'Pending map events must stay invisible before confirmation.');
assert(maps.discardPending(durableRoom.identity.roomId, firstMap.mapEventId) === 'discarded', 'A failed non-tail map append must be removable by ID.');
assert(maps.list(durableRoom.identity.roomId).events.map((event) => event.mapEventId).join(',') === 'map-2', 'Confirmed later map events must remain after compensation.');
const failedTail = maps.append(durableRoom.identity.roomId, {
  mapEventId: 'map-failed-tail',
  roomId: durableRoom.identity.roomId,
  mapId: 'main-map',
  createdAt: '2026-08-13T00:00:02.000Z',
  authorMemberId: durableRoom.members[0].memberId,
  eventKind: 'map.grid_updated',
  payload: { grid: { enabled: true } },
}, { pending: true });
assert(maps.discardPending(durableRoom.identity.roomId, failedTail.mapEventId) === 'discarded', 'A failed tail map append must be removable.');
const nextMap = maps.append(durableRoom.identity.roomId, {
  mapEventId: 'map-after-failure',
  roomId: durableRoom.identity.roomId,
  mapId: 'main-map',
  createdAt: '2026-08-13T00:00:03.000Z',
  authorMemberId: durableRoom.members[0].memberId,
  eventKind: 'map.grid_updated',
  payload: { grid: { enabled: false } },
});
assert(nextMap.seq > failedTail.seq, 'Runtime sequence numbers must not be reused after compensation.');

console.log('liveRoomDurableAppendConfirmationSmoke: confirmation and compensating discard passed');
