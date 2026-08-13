import type { RoomSnapshot } from '../protocol/room-protocol.js';
import type { RuntimeEventPersistenceBridgeResult } from '../runtime/runtimeEventPersistenceBridge.js';

export type LiveRoomDurableAppendConfirmation =
  | { decision: 'confirmed' }
  | { decision: 'notRequired' }
  | { decision: 'unavailable'; retryable: true };

export function requiresLiveRoomDurableAppend(room: RoomSnapshot | undefined): boolean {
  return Boolean(
    room?.campaignRef?.worldServerId
    && room.campaignRef.campaignId
    && room.identity.sessionId,
  );
}

/**
 * Persistent cloud rooms acknowledge live events only after PostgreSQL accepts
 * them. Portable memory-only rooms keep their existing immediate append model.
 */
export function confirmLiveRoomDurableAppend(
  room: RoomSnapshot | undefined,
  persistence: RuntimeEventPersistenceBridgeResult | undefined,
): LiveRoomDurableAppendConfirmation {
  if (!requiresLiveRoomDurableAppend(room)) return { decision: 'notRequired' };
  return persistence?.status === 'persisted'
    ? { decision: 'confirmed' }
    : { decision: 'unavailable', retryable: true };
}
