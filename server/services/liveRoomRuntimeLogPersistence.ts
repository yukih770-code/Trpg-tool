/**
 * Durable mirror + restart recovery for campaign-linked cloud Room RuntimeLog.
 *
 * AI-LANDMARK: CLOUD_LIVE_ROOM_RUNTIME_LOG_RECOVERY_V1
 *
 * The in-memory RuntimeLog remains live authority. This service prepares one
 * dedicated PostgreSQL Runtime Session per recoverable live room, mirrors each
 * append through the existing idempotent RuntimeEvent bridge, and restores only
 * explicitly versioned Room RuntimeLog envelopes after lobby recovery.
 */

import type {
  PostgresRuntimeEventRepository,
  RuntimeEventRecord,
  RuntimeSessionRecord,
} from '../adapters/postgresRuntimeEventRepository.js';
import type { RoomRegistry } from '../room-registry.js';
import type { RuntimeLogRegistry } from '../runtime-log-registry.js';
import type {
  RoomCampaignRef,
  RoomRuntimeLogEvent,
  RoomSnapshot,
} from '../protocol/room-protocol.js';
import {
  persistRuntimeEventCandidate,
  type RuntimeEventPersistenceBridgeResult,
} from '../runtime/runtimeEventPersistenceBridge.js';
import { createRuntimeEventRepositoryPort } from '../runtime/runtimeEventRepositoryPortAdapter.js';
import { COMBAT_RUNTIME_EVENT_KINDS } from '../../src/lib/combat/combatRuntimeTypes.js';

export const LIVE_ROOM_RUNTIME_LOG_PAYLOAD_KEY = 'liveRoomRuntimeLogEventV1';
/**
 * Durable event-kind namespace reserved for live-room RuntimeLog recovery
 * envelopes. Only this module may produce it; the campaign runtime-event API
 * rejects it so a direct write can never be replayed as live-room state.
 */
export const LIVE_ROOM_RUNTIME_LOG_EVENT_KIND_PREFIX = 'room.runtimeLog.';
const EVENT_KIND_PREFIX = LIVE_ROOM_RUNTIME_LOG_EVENT_KIND_PREFIX;
const RESTORE_PAGE_SIZE = 200;
const ROOM_RUNTIME_LOG_KINDS: readonly RoomRuntimeLogEvent['kind'][] = [
  'system.note',
  'chat.message',
  'dice.roll',
  'host.note',
  'state.manualChange',
  ...COMBAT_RUNTIME_EVENT_KINDS,
];

type LiveRoomRuntimeRepository = Pick<
  PostgresRuntimeEventRepository,
  'getRuntimeSessionById' | 'createRuntimeSession' | 'listRuntimeEvents' | 'appendRuntimeEvent'
>;

export type PrepareLiveRoomRuntimeSessionDecision =
  | 'ready'
  | 'skippedNoPersistentContext'
  | 'contextConflict'
  | 'unavailable';

export interface LiveRoomRuntimeLogRestoreResult {
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

function eventKindOf(value: unknown): RoomRuntimeLogEvent['kind'] | undefined {
  const kind = stringOf(value);
  return kind && ROOM_RUNTIME_LOG_KINDS.includes(kind as RoomRuntimeLogEvent['kind'])
    ? kind as RoomRuntimeLogEvent['kind']
    : undefined;
}

function campaignRefOf(value: unknown): RoomCampaignRef | undefined {
  const candidate = recordOf(value);
  if (!candidate) return undefined;
  const source = stringOf(candidate.source);
  const displayName = stringOf(candidate.displayName);
  const systemId = stringOf(candidate.systemId);
  if (
    (source !== 'localCampaignLibrary' && source !== 'imported' && source !== 'workshop' && source !== 'unknown')
    || !displayName
    || (systemId !== 'dnd5e-2024' && systemId !== 'coc7e' && systemId !== 'cp-red' && systemId !== 'custom')
  ) return undefined;
  return {
    source,
    displayName,
    systemId,
    ...(stringOf(candidate.worldServerId) ? { worldServerId: stringOf(candidate.worldServerId) } : {}),
    ...(stringOf(candidate.campaignId) ? { campaignId: stringOf(candidate.campaignId) } : {}),
  };
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

export async function prepareLiveRoomRuntimeSession(
  repository: LiveRoomRuntimeRepository,
  room: RoomSnapshot,
): Promise<{ decision: PrepareLiveRoomRuntimeSessionDecision; session?: RuntimeSessionRecord }> {
  const context = durableContext(room);
  if (!context) return { decision: 'skippedNoPersistentContext' };
  try {
    const existing = await repository.getRuntimeSessionById(context.runtimeSessionId);
    if (!existing.ok) return { decision: 'unavailable' };
    if (existing.value) {
      return sessionMatchesRoom(existing.value, room)
        ? { decision: 'ready', session: existing.value }
        : { decision: 'contextConflict' };
    }
    const host = room.members.find((member) => member.role === 'host');
    const created = await repository.createRuntimeSession({
      runtimeSessionId: context.runtimeSessionId,
      campaignId: context.campaignId,
      hostUserId: host?.userId,
      roomId: room.identity.roomId,
      title: room.identity.displayName ?? room.campaignRef?.displayName,
      status: 'active',
      payload: {
        schemaVersion: 1,
        source: 'cloudLiveRoomRuntimeLog',
        worldServerId: context.worldServerId,
      },
      schemaVersion: 1,
      startedAt: room.identity.createdAt,
    });
    if (!created.ok) return { decision: 'unavailable' };
    return sessionMatchesRoom(created.value, room)
      ? { decision: 'ready', session: created.value }
      : { decision: 'contextConflict' };
  } catch {
    return { decision: 'unavailable' };
  }
}

function persistenceEnvelope(event: RoomRuntimeLogEvent): Record<string, unknown> {
  return {
    schemaVersion: 1,
    roomId: event.roomId,
    eventId: event.eventId,
    seq: event.seq,
    createdAt: event.createdAt,
    kind: event.kind,
    visibility: event.visibility,
    ...(event.authorMemberId ? { authorMemberId: event.authorMemberId } : {}),
    ...(event.actorBindingId ? { actorBindingId: event.actorBindingId } : {}),
    ...(event.campaignRef ? { campaignRef: event.campaignRef } : {}),
    ...(event.text !== undefined ? { text: event.text } : {}),
    ...(event.payload !== undefined ? { payload: event.payload } : {}),
  };
}

export async function persistLiveRoomRuntimeLogEvent(
  repository: LiveRoomRuntimeRepository,
  room: RoomSnapshot,
  event: RoomRuntimeLogEvent,
): Promise<RuntimeEventPersistenceBridgeResult> {
  const context = durableContext(room);
  if (!context || event.roomId !== room.identity.roomId) {
    return { status: 'missing_context', notes: ['Live room persistence context is incomplete.'] };
  }
  const authorUserId = room.members.find((member) => member.memberId === event.authorMemberId)?.userId;
  return persistRuntimeEventCandidate({
    worldServerId: context.worldServerId,
    campaignId: context.campaignId,
    roomId: room.identity.roomId,
    runtimeSessionId: context.runtimeSessionId,
    source: 'room_server',
    eventKind: `${EVENT_KIND_PREFIX}${event.kind}`,
    eventPayload: { [LIVE_ROOM_RUNTIME_LOG_PAYLOAD_KEY]: persistenceEnvelope(event) },
    actorUserId: authorUserId,
    idempotencyKey: `live-room-runtime-log-v1:${room.identity.roomId}:${event.eventId}`,
    clientEventId: event.eventId,
    occurredAt: event.createdAt,
    // Runtime events have no actorPrivate scope yet. The Room envelope remains
    // authoritative for projection, while the durable record stays non-public.
    visibilityScope: event.visibility === 'actorPrivate' ? 'private' : event.visibility,
  }, {
    repository: createRuntimeEventRepositoryPort(repository),
  });
}

function restoredEvent(record: RuntimeEventRecord, room: RoomSnapshot): RoomRuntimeLogEvent | null {
  if (!record.eventKind.startsWith(EVENT_KIND_PREFIX)) return null;
  const envelope = recordOf(record.payload[LIVE_ROOM_RUNTIME_LOG_PAYLOAD_KEY]);
  if (!envelope || envelope.schemaVersion !== 1) return null;
  const roomId = stringOf(envelope.roomId);
  const eventId = stringOf(envelope.eventId);
  const createdAt = stringOf(envelope.createdAt) ?? record.createdAt;
  const kind = eventKindOf(envelope.kind);
  const visibility = stringOf(envelope.visibility);
  const seq = envelope.seq;
  if (
    roomId !== room.identity.roomId
    || !eventId
    || !createdAt
    || Number.isNaN(Date.parse(createdAt))
    || !kind
    || !visibility
    || !Number.isSafeInteger(seq)
    || (seq as number) <= 0
    || record.eventKind !== `${EVENT_KIND_PREFIX}${kind}`
    || (visibility !== 'public' && visibility !== 'hostOnly' && visibility !== 'actorPrivate')
  ) return null;
  const campaignRef = campaignRefOf(envelope.campaignRef);
  return {
    eventId,
    roomId,
    seq: seq as number,
    createdAt,
    ...(stringOf(envelope.authorMemberId) ? { authorMemberId: stringOf(envelope.authorMemberId) } : {}),
    ...(stringOf(envelope.actorBindingId) ? { actorBindingId: stringOf(envelope.actorBindingId) } : {}),
    campaignRef: campaignRef ?? room.campaignRef,
    kind,
    visibility: visibility as RoomRuntimeLogEvent['visibility'],
    ...(typeof envelope.text === 'string' ? { text: envelope.text } : {}),
    ...('payload' in envelope ? { payload: envelope.payload } : {}),
  };
}

async function readAllPersistedEvents(
  repository: LiveRoomRuntimeRepository,
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

export async function restoreLiveRoomRuntimeLogs(
  repository: LiveRoomRuntimeRepository,
  roomRegistry: RoomRegistry,
  runtimeLogRegistry: RuntimeLogRegistry,
): Promise<LiveRoomRuntimeLogRestoreResult> {
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
        .filter((event): event is RoomRuntimeLogEvent => event !== null);
      const restored = runtimeLogRegistry.restoreRoom(room.identity.roomId, events);
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

/** Serializes durable appends per room so PostgreSQL sequence allocation cannot race. */
export function createLiveRoomRuntimeLogPersistenceCoordinator(repository: LiveRoomRuntimeRepository) {
  const queued = new Map<string, Promise<RuntimeEventPersistenceBridgeResult>>();

  const queue = (room: RoomSnapshot, event: RoomRuntimeLogEvent) => {
    const roomCopy = JSON.parse(JSON.stringify(room)) as RoomSnapshot;
    const eventCopy = JSON.parse(JSON.stringify(event)) as RoomRuntimeLogEvent;
    const previous = queued.get(event.roomId);
    const next = (previous ?? Promise.resolve<RuntimeEventPersistenceBridgeResult>({ status: 'skipped', notes: [] }))
      .catch(() => ({ status: 'repository_error', notes: ['Previous durable append failed.'] } as RuntimeEventPersistenceBridgeResult))
      .then(() => persistLiveRoomRuntimeLogEvent(repository, roomCopy, eventCopy))
      .catch(() => ({ status: 'repository_error', notes: ['Durable RuntimeLog append failed.'] } as RuntimeEventPersistenceBridgeResult));
    queued.set(event.roomId, next);
    void next.finally(() => {
      if (queued.get(event.roomId) === next) queued.delete(event.roomId);
    });
    return next;
  };

  const flush = async (roomId: string): Promise<RuntimeEventPersistenceBridgeResult | undefined> => queued.get(roomId);
  return { queue, flush };
}
