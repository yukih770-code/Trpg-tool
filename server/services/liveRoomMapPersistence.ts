/**
 * Durable mirror + restart recovery for campaign-linked cloud Room Map events.
 *
 * The in-memory Room Map registry remains live authority. Raw map envelopes are
 * stored as host-only records in the room's existing Runtime Session and are
 * projected for each viewer only after they have been restored.
 */

import type {
  PostgresRuntimeEventRepository,
  RuntimeEventRecord,
  RuntimeSessionRecord,
} from '../adapters/postgresRuntimeEventRepository.js';
import type { RoomRegistry } from '../room-registry.js';
import type { RoomMapRegistry } from '../room-map-registry.js';
import type { RoomMapEvent, RoomSnapshot } from '../protocol/room-protocol.js';
import { ROOM_MAP_EVENT_KINDS } from '../../src/lib/platform/roomMapTypes.js';
import {
  persistRuntimeEventCandidate,
  type RuntimeEventPersistenceBridgeResult,
} from '../runtime/runtimeEventPersistenceBridge.js';
import { createRuntimeEventRepositoryPort } from '../runtime/runtimeEventRepositoryPortAdapter.js';

export const LIVE_ROOM_MAP_PAYLOAD_KEY = 'liveRoomMapEventV1';
const EVENT_KIND_PREFIX = 'room.mapEvent.';
const RESTORE_PAGE_SIZE = 200;

type LiveRoomMapRepository = Pick<
  PostgresRuntimeEventRepository,
  'getRuntimeSessionById' | 'listRuntimeEvents' | 'appendRuntimeEvent'
>;

export interface LiveRoomMapRestoreResult {
  decision: 'restored' | 'unavailable';
  restoredRoomCount: number;
  restoredEventCount: number;
  skippedRoomCount: number;
  unavailableRoomCount: number;
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function eventKindOf(value: unknown): RoomMapEvent['eventKind'] | undefined {
  const kind = stringOf(value);
  return kind && ROOM_MAP_EVENT_KINDS.includes(kind as RoomMapEvent['eventKind'])
    ? kind as RoomMapEvent['eventKind']
    : undefined;
}

function durableContext(room: RoomSnapshot): {
  worldServerId: string;
  campaignId: string;
  runtimeSessionId: string;
} | null {
  const worldServerId = room.campaignRef?.worldServerId?.trim();
  const campaignId = room.campaignRef?.campaignId?.trim();
  const runtimeSessionId = room.identity.sessionId?.trim();
  return worldServerId && campaignId && runtimeSessionId
    ? { worldServerId, campaignId, runtimeSessionId }
    : null;
}

function sessionMatchesRoom(session: RuntimeSessionRecord, room: RoomSnapshot): boolean {
  const context = durableContext(room);
  return Boolean(
    context
    && session.runtimeSessionId === context.runtimeSessionId
    && session.campaignId === context.campaignId
    && session.roomId === room.identity.roomId
    && !session.archivedAt,
  );
}

function persistenceEnvelope(event: RoomMapEvent): Record<string, unknown> {
  return {
    schemaVersion: 1,
    mapEventId: event.mapEventId,
    roomId: event.roomId,
    mapId: event.mapId,
    seq: event.seq,
    createdAt: event.createdAt,
    authorMemberId: event.authorMemberId,
    eventKind: event.eventKind,
    payload: event.payload,
  };
}

export async function persistLiveRoomMapEvent(
  repository: LiveRoomMapRepository,
  room: RoomSnapshot,
  event: RoomMapEvent,
): Promise<RuntimeEventPersistenceBridgeResult> {
  const context = durableContext(room);
  if (!context || event.roomId !== room.identity.roomId) {
    return { status: 'missing_context', notes: ['Live room map persistence context is incomplete.'] };
  }
  const authorUserId = room.members.find((member) => member.memberId === event.authorMemberId)?.userId;
  return persistRuntimeEventCandidate({
    worldServerId: context.worldServerId,
    campaignId: context.campaignId,
    roomId: room.identity.roomId,
    runtimeSessionId: context.runtimeSessionId,
    source: 'room_server',
    eventKind: `${EVENT_KIND_PREFIX}${event.eventKind}`,
    eventPayload: { [LIVE_ROOM_MAP_PAYLOAD_KEY]: persistenceEnvelope(event) },
    actorUserId: authorUserId,
    idempotencyKey: `live-room-map-v1:${room.identity.roomId}:${event.mapEventId}`,
    clientEventId: event.mapEventId,
    occurredAt: event.createdAt,
    // Raw map events can contain hidden tokens or host notes. Viewer-specific
    // projection remains the only public read boundary.
    visibilityScope: 'hostOnly',
  }, {
    repository: createRuntimeEventRepositoryPort(repository),
  });
}

function restoredEvent(record: RuntimeEventRecord, room: RoomSnapshot): RoomMapEvent | null {
  if (!record.eventKind.startsWith(EVENT_KIND_PREFIX)) return null;
  const envelope = recordOf(record.payload[LIVE_ROOM_MAP_PAYLOAD_KEY]);
  if (!envelope || envelope.schemaVersion !== 1) return null;
  const mapEventId = stringOf(envelope.mapEventId);
  const roomId = stringOf(envelope.roomId);
  const mapId = stringOf(envelope.mapId);
  const createdAt = stringOf(envelope.createdAt) ?? record.createdAt;
  const authorMemberId = stringOf(envelope.authorMemberId);
  const eventKind = eventKindOf(envelope.eventKind);
  const payload = recordOf(envelope.payload);
  const seq = envelope.seq;
  if (
    roomId !== room.identity.roomId
    || !mapEventId
    || !mapId
    || !createdAt
    || Number.isNaN(Date.parse(createdAt))
    || !authorMemberId
    || !eventKind
    || !payload
    || !Number.isSafeInteger(seq)
    || (seq as number) <= 0
    || record.eventKind !== `${EVENT_KIND_PREFIX}${eventKind}`
  ) return null;
  return {
    mapEventId,
    roomId,
    mapId,
    seq: seq as number,
    createdAt,
    authorMemberId,
    eventKind,
    payload,
  };
}

async function readAllPersistedEvents(
  repository: LiveRoomMapRepository,
  runtimeSessionId: string,
): Promise<{ ok: true; events: RuntimeEventRecord[] } | { ok: false }> {
  const events: RuntimeEventRecord[] = [];
  let afterSeq = 0;
  for (;;) {
    const page = await repository.listRuntimeEvents(runtimeSessionId, { afterSeq, limit: RESTORE_PAGE_SIZE });
    if (!page.ok) return { ok: false };
    events.push(...page.value);
    if (page.value.length < RESTORE_PAGE_SIZE) return { ok: true, events };
    const nextAfterSeq = page.value[page.value.length - 1]?.seq;
    if (!Number.isSafeInteger(nextAfterSeq) || nextAfterSeq <= afterSeq) return { ok: false };
    afterSeq = nextAfterSeq;
  }
}

export async function restoreLiveRoomMaps(
  repository: LiveRoomMapRepository,
  roomRegistry: RoomRegistry,
  roomMapRegistry: RoomMapRegistry,
): Promise<LiveRoomMapRestoreResult> {
  let restoredRoomCount = 0;
  let restoredEventCount = 0;
  let skippedRoomCount = 0;
  let unavailableRoomCount = 0;

  for (const room of roomRegistry.list()) {
    const context = durableContext(room);
    if (!context || room.identity.lifecycleStatus !== 'open') {
      skippedRoomCount += 1;
      continue;
    }
    try {
      const session = await repository.getRuntimeSessionById(context.runtimeSessionId);
      if (!session.ok) {
        unavailableRoomCount += 1;
        continue;
      }
      if (!session.value || !sessionMatchesRoom(session.value, room)) {
        skippedRoomCount += 1;
        continue;
      }
      const persisted = await readAllPersistedEvents(repository, context.runtimeSessionId);
      if (!persisted.ok) {
        unavailableRoomCount += 1;
        continue;
      }
      const events = persisted.events
        .map((record) => restoredEvent(record, room))
        .filter((event): event is RoomMapEvent => event !== null);
      const restored = roomMapRegistry.restoreRoom(room.identity.roomId, events);
      if (restored.decision === 'skippedNonEmpty') {
        skippedRoomCount += 1;
        continue;
      }
      restoredRoomCount += 1;
      restoredEventCount += restored.restoredCount;
    } catch {
      unavailableRoomCount += 1;
    }
  }

  return {
    decision: unavailableRoomCount > 0 && restoredRoomCount === 0 ? 'unavailable' : 'restored',
    restoredRoomCount,
    restoredEventCount,
    skippedRoomCount,
    unavailableRoomCount,
  };
}
