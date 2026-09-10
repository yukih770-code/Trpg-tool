import type { RoomRuntimeLogEvent } from '../platform/roomRuntimeLogTypes.js';

/** Intent only. Member identity is authenticated separately by the server. */
export interface DndAttackIntent {
  intentId: string;
  actorCombatantId: string;
  targetCombatantId: string;
  actionId: string;
  mode: 'normal' | 'advantage' | 'disadvantage';
}

export interface DndAttackResponse {
  event: RoomRuntimeLogEvent;
  replayed: boolean;
}
