import type { RoomSnapshot } from '../protocol/room-protocol.js';
import type { LiveRoomLifecycleDecision } from './liveRoomLifecyclePersistence.js';

export type LiveRoomDurabilityFailureKind = 'room_lifecycle' | 'runtime_event' | 'runtime_session';

export interface LiveRoomDurabilitySnapshot {
  status: 'ready' | 'failed';
  failedAt?: string;
  failureKind?: LiveRoomDurabilityFailureKind;
}

export interface LiveRoomDurabilityCircuit {
  isReady(): boolean;
  snapshot(): LiveRoomDurabilitySnapshot;
  trip(failureKind: LiveRoomDurabilityFailureKind): LiveRoomDurabilitySnapshot;
}

export function requiresLiveRoomLifecyclePersistence(room: RoomSnapshot | undefined): boolean {
  return Boolean(room?.campaignRef?.worldServerId && room.campaignRef.campaignId);
}

export function confirmLiveRoomLifecyclePersistence(
  room: RoomSnapshot | undefined,
  decision: LiveRoomLifecycleDecision | undefined,
): 'confirmed' | 'notRequired' | 'unavailable' {
  if (!requiresLiveRoomLifecyclePersistence(room)) return 'notRequired';
  return decision === 'persisted' ? 'confirmed' : 'unavailable';
}

/** A process-local fail-closed circuit. Recovery requires a clean DB-backed restart. */
export function createLiveRoomDurabilityCircuit(now: () => Date = () => new Date()): LiveRoomDurabilityCircuit {
  let state: LiveRoomDurabilitySnapshot = { status: 'ready' };
  const snapshot = (): LiveRoomDurabilitySnapshot => ({ ...state });
  return {
    isReady: () => state.status === 'ready',
    snapshot,
    trip(failureKind) {
      if (state.status === 'ready') {
        state = { status: 'failed', failedAt: now().toISOString(), failureKind };
      }
      return snapshot();
    },
  };
}
