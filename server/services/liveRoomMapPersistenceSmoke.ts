import type {
  AppendRuntimeEventInput,
  PostgresRuntimeEventRepository,
  RuntimeEventRecord,
  RuntimeSessionRecord,
} from '../adapters/postgresRuntimeEventRepository.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createInMemoryRoomMapRegistry } from '../room-map-registry.js';
import type { RoomMapEvent, RoomRuntimeLogEvent } from '../protocol/room-protocol.js';
import { createRoom } from './createRoom.js';
import { prepareLiveRoomRuntimeSession } from './liveRoomRuntimeLogPersistence.js';
import {
  LIVE_ROOM_MAP_PAYLOAD_KEY,
  persistLiveRoomMapEvent,
  restoreLiveRoomMaps,
} from './liveRoomMapPersistence.js';
import { createLiveRoomDurableEventPersistenceCoordinator } from './liveRoomDurableEventPersistence.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';

type Repository = Pick<
  PostgresRuntimeEventRepository,
  'getRuntimeSessionById' | 'createRuntimeSession' | 'listRuntimeEvents' | 'appendRuntimeEvent'
> & {
  sessions: Map<string, RuntimeSessionRecord>;
  events: Map<string, RuntimeEventRecord[]>;
  appendDelayMs: number;
  activeAppends: number;
  maxActiveAppends: number;
};

function createRepository(): Repository {
  const sessions = new Map<string, RuntimeSessionRecord>();
  const events = new Map<string, RuntimeEventRecord[]>();
  const repository: Repository = {
    sessions,
    events,
    appendDelayMs: 0,
    activeAppends: 0,
    maxActiveAppends: 0,
    getRuntimeSessionById: async (runtimeSessionId) => ({ ok: true, value: sessions.get(runtimeSessionId) ?? null }),
    createRuntimeSession: async (input) => {
      const record: RuntimeSessionRecord = {
        runtimeSessionId: input.runtimeSessionId,
        campaignId: input.campaignId,
        hostUserId: input.hostUserId,
        roomId: input.roomId,
        title: input.title,
        status: input.status ?? 'active',
        payload: input.payload ?? {},
        schemaVersion: input.schemaVersion ?? 1,
        startedAt: input.startedAt,
      };
      sessions.set(record.runtimeSessionId, record);
      return { ok: true, value: record };
    },
    listRuntimeEvents: async (runtimeSessionId, options) => ({
      ok: true,
      value: (events.get(runtimeSessionId) ?? [])
        .filter((event) => event.seq > (options?.afterSeq ?? 0))
        .slice(0, options?.limit ?? 100),
    }),
    appendRuntimeEvent: async (input: AppendRuntimeEventInput) => {
      repository.activeAppends += 1;
      repository.maxActiveAppends = Math.max(repository.maxActiveAppends, repository.activeAppends);
      if (repository.appendDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, repository.appendDelayMs));
      const stream = events.get(input.runtimeSessionId) ?? [];
      const duplicate = input.idempotencyKey
        ? stream.find((event) => event.idempotencyKey === input.idempotencyKey)
        : undefined;
      if (duplicate) {
        repository.activeAppends -= 1;
        return { ok: true, value: duplicate };
      }
      const record: RuntimeEventRecord = {
        runtimeEventId: input.runtimeEventId,
        runtimeSessionId: input.runtimeSessionId,
        campaignId: input.campaignId,
        seq: stream.length + 1,
        eventKind: input.eventKind,
        visibility: input.visibility ?? 'campaign',
        actorId: input.actorId,
        causedByEventId: input.causedByEventId,
        idempotencyKey: input.idempotencyKey,
        payload: input.payload ?? {},
        schemaVersion: input.schemaVersion ?? 1,
        createdByUserId: input.createdByUserId,
        createdAt: `2026-08-13T00:${String(stream.length % 60).padStart(2, '0')}:00.000Z`,
      };
      stream.push(record);
      events.set(input.runtimeSessionId, stream);
      repository.activeAppends -= 1;
      return { ok: true, value: record };
    },
  };
  return repository;
}

function mapEvent(roomId: string, seq: number): RoomMapEvent {
  return {
    mapEventId: `map-event-${seq}`,
    roomId,
    mapId: 'map-1',
    seq,
    createdAt: `2026-08-13T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    authorMemberId: 'host-member',
    eventKind: seq === 1 ? 'map.token_added' : seq === 2 ? 'map.spatial_updated' : seq === 3 ? 'map.token_updated' : 'map.grid_updated',
    payload: seq === 1
      ? { token: { id: 'hidden-token', name: 'Secret', notes: 'host-only clue', isHidden: true } }
      : seq === 2
        ? { spatial: { schemaVersion: 1, coordinateSystem: 'normalized-100', tokenAnchor: 'center', world: { width: 24, height: 16 }, grid: { kind: 'square', originX: 0, originY: 0, cellSize: 1 }, scale: { unitsPerGridCell: 5, unitLabel: 'ft' } } }
        : seq === 3
          ? { token: { id: 'hidden-token', footprint: { schemaVersion: 1, shape: 'axis-aligned-rectangle', coordinateSpace: 'scene-world', anchor: 'center', width: 2, height: 3 } } }
          : { grid: { enabled: true, sizePx: 40 + seq } },
  };
}

function persistedEnvelope(event: RoomMapEvent): Record<string, unknown> {
  return { [LIVE_ROOM_MAP_PAYLOAD_KEY]: { schemaVersion: 1, ...event } };
}

async function main(): Promise<void> {
  const repository = createRepository();
  const room = createRoom({
    hostDisplayName: 'Cloud Host',
    hostUserId: 'host-user',
    sessionId: 'runtime-session-map-1',
    campaignRef: {
      source: 'unknown',
      worldServerId: 'world-1',
      campaignId: 'campaign-1',
      displayName: 'Campaign',
      systemId: 'dnd5e-2024',
    },
  }).room;
  room.members[0].memberId = 'host-member';
  const prepared = await prepareLiveRoomRuntimeSession(repository, room);
  const first = mapEvent(room.identity.roomId, 1);
  const firstPersist = await persistLiveRoomMapEvent(repository, room, first);
  const retryPersist = await persistLiveRoomMapEvent(repository, room, first);
  const sessionId = room.identity.sessionId as string;

  for (let seq = 2; seq <= 205; seq += 1) {
    const event = mapEvent(room.identity.roomId, seq);
    await repository.appendRuntimeEvent({
      runtimeEventId: `stored-map-${seq}`,
      runtimeSessionId: sessionId,
      campaignId: 'campaign-1',
      eventKind: `room.mapEvent.${event.eventKind}`,
      visibility: 'hostOnly',
      idempotencyKey: `stored-map-${seq}`,
      payload: persistedEnvelope(event),
    });
  }
  await repository.appendRuntimeEvent({
    runtimeEventId: 'foreign-event',
    runtimeSessionId: sessionId,
    campaignId: 'campaign-1',
    eventKind: 'campaign.unrelated',
    idempotencyKey: 'foreign-event',
    payload: persistedEnvelope(mapEvent(room.identity.roomId, 206)),
  });

  const roomRegistry = createInMemoryRoomRegistry();
  roomRegistry.create(room);
  const restoredRegistry = createInMemoryRoomMapRegistry();
  const restore = await restoreLiveRoomMaps(repository, roomRegistry, restoredRegistry);
  const restoredStream = restoredRegistry.list(room.identity.roomId);
  const restoredBoard = replayMapRuntimeEvents(restoredStream.events, 'map-1');
  const hiddenToken = restoredStream.events[0]?.payload.token as Record<string, unknown> | undefined;
  const nextEvent = restoredRegistry.append(room.identity.roomId, {
    ...mapEvent(room.identity.roomId, 999),
    mapEventId: 'next-live-map-event',
  });

  repository.appendDelayMs = 2;
  repository.maxActiveAppends = 0;
  const coordinator = createLiveRoomDurableEventPersistenceCoordinator(repository);
  const concurrentLogEvent: RoomRuntimeLogEvent = {
    eventId: 'queued-log-between-maps',
    roomId: room.identity.roomId,
    seq: 1,
    createdAt: '2026-08-13T01:00:00.000Z',
    authorMemberId: 'host-member',
    kind: 'host.note',
    visibility: 'hostOnly',
    text: 'Shared queue ordering proof.',
  };
  await Promise.all([
    coordinator.queueMap(room, { ...mapEvent(room.identity.roomId, 300), mapEventId: 'queued-map-a' }),
    coordinator.queueRuntimeLog(room, concurrentLogEvent),
    coordinator.queueMap(room, { ...mapEvent(room.identity.roomId, 301), mapEventId: 'queued-map-b' }),
  ]);

  const stored = repository.events.get(sessionId) ?? [];
  const checks = [
    prepared.decision === 'ready',
    firstPersist.status === 'persisted' && retryPersist.status === 'persisted',
    firstPersist.idempotencyKey === `live-room-map-v1:${room.identity.roomId}:map-event-1`,
    stored.filter((record) => record.idempotencyKey === firstPersist.idempotencyKey).length === 1,
    stored.find((record) => record.idempotencyKey === firstPersist.idempotencyKey)?.visibility === 'hostOnly',
    restore.decision === 'restored' && restore.restoredRoomCount === 1 && restore.restoredEventCount === 205,
    restoredStream.events.length === 205 && restoredStream.latestSeq === 205,
    restoredBoard.spatial?.world.width === 24 && restoredBoard.spatial?.scale?.unitsPerGridCell === 5,
    restoredBoard.tokens[0]?.footprint?.width === 2 && restoredBoard.tokens[0]?.footprint?.height === 3,
    hiddenToken?.isHidden === true && hiddenToken.notes === 'host-only clue',
    nextEvent.seq === 206,
    repository.maxActiveAppends === 1,
  ];
  if (checks.some((check) => !check)) throw new Error('Live room map persistence smoke failed.');
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
}

void main();
