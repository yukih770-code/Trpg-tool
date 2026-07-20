import type { RoomRecord } from '../adapters/postgresPlatformFoundationRepository.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createRoom } from './createRoom.js';
import {
  LIVE_ROOM_SNAPSHOT_METADATA_KEY,
  persistLiveRoomLifecycle,
  restoreLiveRoomLifecycles,
  type LiveRoomLifecycleRepository,
} from './liveRoomLifecyclePersistence.js';

type Result<T> = { ok: true; value: T } | { ok: false; error: unknown };

function createRepository(): LiveRoomLifecycleRepository & { records: Map<string, RoomRecord> } {
  const records = new Map<string, RoomRecord>();
  return {
    records,
    getRoomRecordByRoomId: async (roomId): Promise<Result<RoomRecord | null>> => ({ ok: true, value: records.get(roomId) ?? null }),
    createRoomRecord: async (input): Promise<Result<RoomRecord | null>> => {
      const record: RoomRecord = {
        roomRecordId: input.roomRecordId,
        roomId: input.roomId,
        worldServerId: input.worldServerId,
        campaignId: input.campaignId,
        hostUserId: input.hostUserId,
        roomCode: input.roomCode,
        roomStatus: input.roomStatus ?? 'lobby',
        multiplayerMode: input.multiplayerMode ?? 'cloud',
        accessPolicy: input.accessPolicy ?? {},
        metadata: input.metadata ?? {},
      };
      records.set(record.roomId, record);
      return { ok: true, value: record };
    },
    updateRoomRecord: async (input): Promise<Result<RoomRecord | null>> => {
      const record = [...records.values()].find((candidate) => candidate.roomRecordId === input.roomRecordId) ?? null;
      if (!record) return { ok: true, value: null };
      const next = {
        ...record,
        roomCode: input.roomCode ?? record.roomCode,
        roomStatus: input.roomStatus ?? record.roomStatus,
        multiplayerMode: input.multiplayerMode ?? record.multiplayerMode,
        metadata: input.metadata ?? record.metadata,
        closedAt: input.closedAt ?? record.closedAt,
      };
      records.set(next.roomId, next);
      return { ok: true, value: next };
    },
    listRecoverableRoomRecords: async (): Promise<Result<RoomRecord[]>> => ({
      ok: true,
      value: [...records.values()].filter((record) => record.roomStatus !== 'closed' && !record.closedAt && !record.archivedAt),
    }),
  };
}

async function main(): Promise<void> {
  const repository = createRepository();
  const { room } = createRoom({
    hostDisplayName: 'Host',
    hostUserId: 'host-user',
    displayName: 'Durable Lobby',
    systemId: 'dnd5e-2024',
    campaignRef: {
      source: 'unknown',
      worldServerId: 'world-1',
      campaignId: 'campaign-1',
      displayName: 'Campaign',
      systemId: 'dnd5e-2024',
    },
  });
  const first = await persistLiveRoomLifecycle(repository, room);
  const member = { ...room.members[0], memberId: 'member-player', userId: 'player-user', displayName: 'Player', role: 'player' as const, status: 'active' as const };
  const changed = { ...room, members: [...room.members, member] };
  const second = await persistLiveRoomLifecycle(repository, changed);
  const restoredRegistry = createInMemoryRoomRegistry();
  const restored = await restoreLiveRoomLifecycles(repository, restoredRegistry);
  const restoredRoom = restoredRegistry.get(room.identity.roomId);
  const snapshotStored = repository.records.get(room.identity.roomId)?.metadata[LIVE_ROOM_SNAPSHOT_METADATA_KEY];

  const closed = {
    ...changed,
    identity: { ...changed.identity, lifecycleStatus: 'closed' as const, updatedAt: new Date().toISOString() },
  };
  const third = await persistLiveRoomLifecycle(repository, closed);
  const afterClosedRegistry = createInMemoryRoomRegistry();
  const afterClosed = await restoreLiveRoomLifecycles(repository, afterClosedRegistry);

  const checks = [
    first.decision === 'persisted',
    second.decision === 'persisted',
    restored.decision === 'restored' && restored.restoredCount === 1,
    restoredRoom?.members.length === 2,
    typeof snapshotStored === 'object' && snapshotStored !== null,
    third.decision === 'persisted',
    afterClosed.decision === 'restored' && afterClosed.restoredCount === 0,
  ];
  if (checks.some((check) => !check)) throw new Error('Live room lifecycle persistence smoke failed.');
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
}

void main();
