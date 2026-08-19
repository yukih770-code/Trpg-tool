import type {
  AppendRuntimeEventInput,
  PostgresRuntimeEventRepository,
  RuntimeEventRecord,
  RuntimeSessionRecord,
} from '../adapters/postgresRuntimeEventRepository.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createInMemoryRuntimeLogRegistry } from '../runtime-log-registry.js';
import type { RoomRuntimeLogEvent } from '../protocol/room-protocol.js';
import { createRoom } from './createRoom.js';
import {
  LIVE_ROOM_RUNTIME_LOG_PAYLOAD_KEY,
  createLiveRoomRuntimeLogPersistenceCoordinator,
  persistLiveRoomRuntimeLogEvent,
  prepareLiveRoomRuntimeSession,
  restoreLiveRoomRuntimeLogs,
} from './liveRoomRuntimeLogPersistence.js';

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
    listRuntimeEvents: async (runtimeSessionId, options) => {
      const afterSeq = options?.afterSeq ?? 0;
      const limit = options?.limit ?? 100;
      return {
        ok: true,
        value: (events.get(runtimeSessionId) ?? [])
          .filter((event) => event.seq > afterSeq)
          .slice(0, limit),
      };
    },
    appendRuntimeEvent: async (input: AppendRuntimeEventInput) => {
      repository.activeAppends += 1;
      repository.maxActiveAppends = Math.max(repository.maxActiveAppends, repository.activeAppends);
      if (repository.appendDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, repository.appendDelayMs));
      }
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
        createdAt: `2026-08-12T00:${String(stream.length).padStart(2, '0')}:00.000Z`,
      };
      stream.push(record);
      events.set(input.runtimeSessionId, stream);
      repository.activeAppends -= 1;
      return { ok: true, value: record };
    },
  };
  return repository;
}

function event(roomId: string, seq: number, visibility: RoomRuntimeLogEvent['visibility'] = 'public'): RoomRuntimeLogEvent {
  return {
    eventId: `event-${seq}`,
    roomId,
    seq,
    createdAt: `2026-08-12T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    authorMemberId: 'host-member',
    kind: seq % 2 === 0 ? 'host.note' : 'chat.message',
    visibility,
    text: `Event ${seq}`,
  };
}

function persistedEnvelope(runtimeEvent: RoomRuntimeLogEvent): Record<string, unknown> {
  return {
    [LIVE_ROOM_RUNTIME_LOG_PAYLOAD_KEY]: {
      schemaVersion: 1,
      ...runtimeEvent,
    },
  };
}

async function main(): Promise<void> {
  const repository = createRepository();
  const localRoom = createRoom({ hostDisplayName: 'Local Host' }).room;
  const localPrepare = await prepareLiveRoomRuntimeSession(repository, localRoom);

  const room = createRoom({
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
  room.members[0].memberId = 'host-member';
  const firstPrepare = await prepareLiveRoomRuntimeSession(repository, room);
  const secondPrepare = await prepareLiveRoomRuntimeSession(repository, room);
  const conflictingRoom = createRoom({
    hostDisplayName: 'Other Host',
    sessionId: room.identity.sessionId,
    campaignRef: room.campaignRef,
  }).room;
  const conflict = await prepareLiveRoomRuntimeSession(repository, conflictingRoom);

  const firstEvent = event(room.identity.roomId, 1);
  const firstPersist = await persistLiveRoomRuntimeLogEvent(repository, room, firstEvent);
  const retryPersist = await persistLiveRoomRuntimeLogEvent(repository, room, firstEvent);
  const privatePersist = await persistLiveRoomRuntimeLogEvent(repository, room, event(room.identity.roomId, 2, 'actorPrivate'));
  const sessionId = room.identity.sessionId as string;

  // Exceed the internal recovery page size to prove cursor pagination and
  // preserve the original Room RuntimeLog sequence independently of DB seq.
  for (let seq = 3; seq <= 205; seq += 1) {
    const runtimeEvent = event(room.identity.roomId, seq);
    await repository.appendRuntimeEvent({
      runtimeEventId: `stored-${seq}`,
      runtimeSessionId: sessionId,
      campaignId: 'campaign-1',
      eventKind: `room.runtimeLog.${runtimeEvent.kind}`,
      visibility: runtimeEvent.visibility,
      idempotencyKey: `stored-${seq}`,
      payload: persistedEnvelope(runtimeEvent),
    });
  }
  await repository.appendRuntimeEvent({
    runtimeEventId: 'malformed-event',
    runtimeSessionId: sessionId,
    campaignId: 'campaign-1',
    eventKind: 'room.runtimeLog.not-a-real-kind',
    idempotencyKey: 'malformed-event',
    payload: {
      [LIVE_ROOM_RUNTIME_LOG_PAYLOAD_KEY]: {
        schemaVersion: 1,
        ...event(room.identity.roomId, 206),
        kind: 'not-a-real-kind',
      },
    },
  });
  await repository.appendRuntimeEvent({
    runtimeEventId: 'foreign-event',
    runtimeSessionId: sessionId,
    campaignId: 'campaign-1',
    eventKind: 'campaign.unrelated',
    idempotencyKey: 'foreign-event',
    payload: persistedEnvelope(event(room.identity.roomId, 207)),
  });

  const roomRegistry = createInMemoryRoomRegistry();
  roomRegistry.create(room);
  const restoredRegistry = createInMemoryRuntimeLogRegistry();
  const restore = await restoreLiveRoomRuntimeLogs(repository, roomRegistry, restoredRegistry);
  const restoredStream = restoredRegistry.list(room.identity.roomId);
  const nextEvent = restoredRegistry.append(room.identity.roomId, {
    ...event(room.identity.roomId, 999),
    eventId: 'next-live-event',
  });

  const nonEmptyRegistry = createInMemoryRuntimeLogRegistry();
  nonEmptyRegistry.append(room.identity.roomId, event(room.identity.roomId, 1));
  const nonEmptyRestore = await restoreLiveRoomRuntimeLogs(repository, roomRegistry, nonEmptyRegistry);

  repository.appendDelayMs = 2;
  repository.maxActiveAppends = 0;
  const coordinator = createLiveRoomRuntimeLogPersistenceCoordinator(repository);
  const queuedA = coordinator.queue(room, { ...event(room.identity.roomId, 300), eventId: 'queued-a' });
  const queuedB = coordinator.queue(room, { ...event(room.identity.roomId, 301), eventId: 'queued-b' });
  await Promise.all([queuedA, queuedB]);

  // ── T1: a semantic d20 dice.roll must survive persist -> restore verbatim ──
  // The kind stays `dice.roll`, so the recovery whitelist in
  // liveRoomRuntimeLogPersistence must not need widening. This proves it, and
  // proves the additive semantic payload fields are not stripped on the way
  // through the durable envelope.
  const diceRepository = createRepository();
  const diceRoom = createRoom({
    hostDisplayName: 'Dice Host',
    hostUserId: 'dice-host-user',
    sessionId: 'runtime-session-dice',
    campaignRef: {
      source: 'unknown',
      worldServerId: 'world-1',
      campaignId: 'campaign-1',
      displayName: 'Campaign',
      systemId: 'dnd5e-2024',
    },
  }).room;
  diceRoom.members[0].memberId = 'dice-host-member';
  await prepareLiveRoomRuntimeSession(diceRepository, diceRoom);
  const semanticDiceEvent: RoomRuntimeLogEvent = {
    eventId: 'dice-advantage-1',
    roomId: diceRoom.identity.roomId,
    seq: 1,
    createdAt: '2026-08-19T00:00:00.000Z',
    authorMemberId: 'dice-host-member',
    kind: 'dice.roll',
    visibility: 'public',
    text: '掷骰 1d20+5（优势）：[7, 15] → 15 + 5 = 20 · DC 15 成功',
    payload: {
      expression: '1d20+5',
      normalizedExpression: '1d20+5',
      label: 'Alpha turn check',
      terms: [{ count: 1, sides: 20, rolls: [15], subtotal: 15 }],
      modifier: 5,
      total: 20,
      mode: 'advantage',
      rawRolls: [7, 15],
      keptRoll: 15,
      dc: 15,
      outcome: 'success',
      isNatural20: false,
      isNatural1: false,
    },
  };
  const dicePersist = await persistLiveRoomRuntimeLogEvent(diceRepository, diceRoom, semanticDiceEvent);
  const diceRoomRegistry = createInMemoryRoomRegistry();
  diceRoomRegistry.create(diceRoom);
  const diceLogRegistry = createInMemoryRuntimeLogRegistry();
  const diceRestore = await restoreLiveRoomRuntimeLogs(diceRepository, diceRoomRegistry, diceLogRegistry);
  const restoredDice = diceLogRegistry.list(diceRoom.identity.roomId).events[0];
  const restoredDicePayload = (restoredDice?.payload ?? {}) as Record<string, unknown>;

  const stored = repository.events.get(sessionId) ?? [];
  const checks = [
    dicePersist.status === 'persisted',
    diceRestore.decision === 'restored' && diceRestore.restoredEventCount === 1,
    restoredDice?.kind === 'dice.roll' && restoredDice?.eventId === 'dice-advantage-1',
    restoredDicePayload.mode === 'advantage',
    Array.isArray(restoredDicePayload.rawRolls)
      && (restoredDicePayload.rawRolls as number[]).join(',') === '7,15',
    restoredDicePayload.keptRoll === 15,
    restoredDicePayload.dc === 15 && restoredDicePayload.outcome === 'success',
    restoredDicePayload.isNatural20 === false && restoredDicePayload.isNatural1 === false,
    restoredDicePayload.total === 20 && restoredDicePayload.normalizedExpression === '1d20+5',
    restoredDice?.text === semanticDiceEvent.text,
    localPrepare.decision === 'skippedNoPersistentContext',
    firstPrepare.decision === 'ready' && secondPrepare.decision === 'ready' && repository.sessions.size === 1,
    conflict.decision === 'contextConflict',
    firstPersist.status === 'persisted' && retryPersist.status === 'persisted',
    firstPersist.idempotencyKey === `live-room-runtime-log-v1:${room.identity.roomId}:event-1`,
    stored.filter((record) => record.idempotencyKey === firstPersist.idempotencyKey).length === 1,
    privatePersist.status === 'persisted' && stored.find((record) => record.idempotencyKey?.endsWith(':event-2'))?.visibility === 'private',
    restore.decision === 'restored' && restore.restoredRoomCount === 1 && restore.restoredEventCount === 205,
    restoredStream.events.length === 205 && restoredStream.latestSeq === 205,
    nextEvent.seq === 206,
    nonEmptyRestore.skippedRoomCount === 1 && nonEmptyRegistry.list(room.identity.roomId).events.length === 1,
    repository.maxActiveAppends === 1,
  ];
  if (checks.some((check) => !check)) throw new Error('Live room RuntimeLog persistence smoke failed.');
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
}

void main();
