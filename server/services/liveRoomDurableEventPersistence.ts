/** Shared per-room durable append queue for all live-room Runtime Session streams. */

import type { PostgresRuntimeEventRepository } from '../adapters/postgresRuntimeEventRepository.js';
import type { RoomMapEvent, RoomRuntimeLogEvent, RoomSnapshot } from '../protocol/room-protocol.js';
import type { RuntimeEventPersistenceBridgeResult } from '../runtime/runtimeEventPersistenceBridge.js';
import { persistLiveRoomMapEvent } from './liveRoomMapPersistence.js';
import { persistLiveRoomRuntimeLogEvent } from './liveRoomRuntimeLogPersistence.js';

type Repository = Pick<
  PostgresRuntimeEventRepository,
  'getRuntimeSessionById' | 'createRuntimeSession' | 'listRuntimeEvents' | 'appendRuntimeEvent'
>;

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createLiveRoomDurableEventPersistenceCoordinator(repository: Repository) {
  const queued = new Map<string, Promise<RuntimeEventPersistenceBridgeResult>>();

  const schedule = (
    roomId: string,
    append: () => Promise<RuntimeEventPersistenceBridgeResult>,
  ) => {
    const previous = queued.get(roomId);
    const next = (previous ?? Promise.resolve<RuntimeEventPersistenceBridgeResult>({ status: 'skipped', notes: [] }))
      .catch(() => ({ status: 'repository_error', notes: ['Previous durable room append failed.'] } as RuntimeEventPersistenceBridgeResult))
      .then(append)
      .catch(() => ({ status: 'repository_error', notes: ['Durable live-room append failed.'] } as RuntimeEventPersistenceBridgeResult));
    queued.set(roomId, next);
    void next.finally(() => {
      if (queued.get(roomId) === next) queued.delete(roomId);
    });
    return next;
  };

  const queueRuntimeLog = (room: RoomSnapshot, event: RoomRuntimeLogEvent) => {
    const roomCopy = copy(room);
    const eventCopy = copy(event);
    return schedule(event.roomId, () => persistLiveRoomRuntimeLogEvent(repository, roomCopy, eventCopy));
  };

  const queueMap = (room: RoomSnapshot, event: RoomMapEvent) => {
    const roomCopy = copy(room);
    const eventCopy = copy(event);
    return schedule(event.roomId, () => persistLiveRoomMapEvent(repository, roomCopy, eventCopy));
  };

  const flush = async (roomId: string): Promise<RuntimeEventPersistenceBridgeResult | undefined> => queued.get(roomId);
  return { queueRuntimeLog, queueMap, flush };
}
