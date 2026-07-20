/**
 * Durable lifecycle seam for cloud-backed live Rooms (P6.6).
 *
 * The Room Registry remains the live authority. This adapter stores a versioned
 * lobby snapshot in the already-owned room record metadata so an open cloud
 * lobby can return after a process restart. Runtime log, map, and combat state
 * deliberately remain on their existing persistence paths and are not inferred
 * from this lifecycle snapshot.
 */

import { randomUUID } from 'node:crypto';

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';
import type {
  CreateRoomRecordInput,
  RoomRecord,
  UpdateRoomRecordInput,
} from '../adapters/postgresPlatformFoundationRepository.js';

export const LIVE_ROOM_SNAPSHOT_METADATA_KEY = 'liveRoomSnapshotV1';
export const LIVE_ROOM_LIFECYCLE_METADATA_KEY = 'liveRoomLifecycleV1';

type RepositoryResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

export interface LiveRoomLifecycleRepository {
  getRoomRecordByRoomId(roomId: string): Promise<RepositoryResult<RoomRecord | null>>;
  createRoomRecord(input: CreateRoomRecordInput): Promise<RepositoryResult<RoomRecord | null>>;
  updateRoomRecord(input: UpdateRoomRecordInput): Promise<RepositoryResult<RoomRecord | null>>;
  listRecoverableRoomRecords(limit?: number): Promise<RepositoryResult<RoomRecord[]>>;
}

export type LiveRoomLifecycleDecision = 'persisted' | 'skippedNoPersistentContext' | 'unavailable';

export interface RestoreLiveRoomsResult {
  decision: 'restored' | 'unavailable';
  restoredCount: number;
  skippedCount: number;
}

function durableContext(snapshot: RoomSnapshot): { worldServerId: string; campaignId: string } | null {
  const worldServerId = snapshot.campaignRef?.worldServerId?.trim();
  const campaignId = snapshot.campaignRef?.campaignId?.trim();
  return worldServerId && campaignId ? { worldServerId, campaignId } : null;
}

function roomStatus(snapshot: RoomSnapshot): string {
  return snapshot.identity.lifecycleStatus === 'closed' || snapshot.identity.lifecycleStatus === 'archived'
    ? 'closed'
    : 'lobby';
}

function copySnapshot(snapshot: RoomSnapshot): RoomSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as RoomSnapshot;
}

function lifecycleMetadata(snapshot: RoomSnapshot): Record<string, unknown> {
  return {
    schemaVersion: 1,
    recoverable: snapshot.identity.lifecycleStatus === 'open',
    lastPersistedAt: new Date().toISOString(),
  };
}

function metadataFor(snapshot: RoomSnapshot, existing?: Record<string, unknown>): Record<string, unknown> {
  const name = typeof existing?.name === 'string' && existing.name.trim()
    ? existing.name
    : snapshot.identity.displayName ?? snapshot.campaignRef?.displayName;
  return {
    ...existing,
    ...(name ? { name } : {}),
    [LIVE_ROOM_LIFECYCLE_METADATA_KEY]: lifecycleMetadata(snapshot),
    [LIVE_ROOM_SNAPSHOT_METADATA_KEY]: copySnapshot(snapshot),
  };
}

function readSnapshot(value: unknown): RoomSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Partial<RoomSnapshot>;
  const identity = snapshot.identity;
  if (!identity || typeof identity.roomId !== 'string' || typeof identity.roomCode !== 'string' || typeof identity.systemId !== 'string') return null;
  if (!Array.isArray(snapshot.members) || !Array.isArray(snapshot.actorBindings) || !Array.isArray(snapshot.invites)) return null;
  return copySnapshot(snapshot as RoomSnapshot);
}

export async function persistLiveRoomLifecycle(
  repository: LiveRoomLifecycleRepository,
  snapshot: RoomSnapshot,
): Promise<{ decision: LiveRoomLifecycleDecision }> {
  const context = durableContext(snapshot);
  if (!context) return { decision: 'skippedNoPersistentContext' };

  try {
    const existingResult = await repository.getRoomRecordByRoomId(snapshot.identity.roomId);
    if (!existingResult.ok) return { decision: 'unavailable' };
    const existing = existingResult.value;
    const nextStatus = roomStatus(snapshot);
    if (existing) {
      const updated = await repository.updateRoomRecord({
        roomRecordId: existing.roomRecordId,
        roomCode: snapshot.identity.roomCode,
        roomStatus: nextStatus,
        multiplayerMode: 'cloud',
        metadata: metadataFor(snapshot, existing.metadata),
        closedAt: nextStatus === 'closed' ? snapshot.identity.updatedAt : undefined,
      });
      return { decision: updated.ok ? 'persisted' : 'unavailable' };
    }

    const host = snapshot.members.find((member) => member.role === 'host');
    const created = await repository.createRoomRecord({
      roomRecordId: randomUUID(),
      roomId: snapshot.identity.roomId,
      worldServerId: context.worldServerId,
      campaignId: context.campaignId,
      hostUserId: host?.userId,
      roomCode: snapshot.identity.roomCode,
      roomStatus: nextStatus,
      multiplayerMode: 'cloud',
      accessPolicy: { joinApprovalMode: snapshot.joinApprovalMode },
      metadata: metadataFor(snapshot),
    });
    return { decision: created.ok ? 'persisted' : 'unavailable' };
  } catch {
    return { decision: 'unavailable' };
  }
}

export async function restoreLiveRoomLifecycles(
  repository: LiveRoomLifecycleRepository,
  registry: RoomRegistry,
): Promise<RestoreLiveRoomsResult> {
  try {
    const recordsResult = await repository.listRecoverableRoomRecords(200);
    if (!recordsResult.ok) return { decision: 'unavailable', restoredCount: 0, skippedCount: 0 };

    let restoredCount = 0;
    let skippedCount = 0;
    for (const record of recordsResult.value) {
      const snapshot = readSnapshot(record.metadata[LIVE_ROOM_SNAPSHOT_METADATA_KEY]);
      const context = snapshot ? durableContext(snapshot) : null;
      if (!snapshot || !context || snapshot.identity.roomId !== record.roomId || snapshot.identity.roomCode !== record.roomCode || context.worldServerId !== record.worldServerId || context.campaignId !== record.campaignId || snapshot.identity.lifecycleStatus !== 'open') {
        skippedCount += 1;
        continue;
      }
      if (!registry.get(snapshot.identity.roomId)) {
        registry.create(snapshot);
        restoredCount += 1;
      }
    }
    return { decision: 'restored', restoredCount, skippedCount };
  } catch {
    return { decision: 'unavailable', restoredCount: 0, skippedCount: 0 };
  }
}

/** Serializes background writes per room so older snapshots cannot win a race. */
export function createLiveRoomLifecyclePersistenceCoordinator(repository: LiveRoomLifecycleRepository) {
  const queued = new Map<string, Promise<void>>();

  const queue = (snapshot: RoomSnapshot) => {
    const roomId = snapshot.identity.roomId;
    const previous = queued.get(roomId) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => { await persistLiveRoomLifecycle(repository, snapshot); });
    queued.set(roomId, next);
    void next.finally(() => {
      if (queued.get(roomId) === next) queued.delete(roomId);
    });
  };

  return { queue, persist: (snapshot: RoomSnapshot) => persistLiveRoomLifecycle(repository, snapshot) };
}
