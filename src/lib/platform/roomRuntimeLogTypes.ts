/**
 * Room RuntimeLog contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_RUNTIME_LOG_TYPES_V0
 *
 * Platform-level, system-agnostic append-only RuntimeLog for the Room Server. An
 * event is server-authoritative: seq / eventId / createdAt are assigned by the
 * server; campaignRef is a READ-ONLY copy of room.campaignRef. NOT formal Runtime,
 * NOT a RuntimeActor / CampaignActorInstance, NOT map/token/action-intent. The
 * event list does NOT live inside RoomSnapshot (it grows unbounded). `payload`
 * stays `unknown` — no DND/COC/CP RED rule schema is frozen here.
 */

import type { RoomCampaignRef } from './roomTypes.js';
import { COMBAT_RUNTIME_EVENT_KINDS } from '../combat/combatRuntimeTypes.js';

/**
 * Platform-level RuntimeLog event kinds that are not combat transitions.
 * Extending this list is a deliberate platform change: a client, a Game System
 * or a content pack can never contribute a kind.
 */
export const ROOM_RUNTIME_LOG_BASE_EVENT_KINDS = [
  'system.note',
  'chat.message',
  'dice.roll',
  'host.note',
  'state.manualChange',
] as const;

/**
 * THE canonical runtime-log event-kind list (P8 boundary cleanup, P0-B).
 *
 * Append validation and live-room restart recovery both consume this array.
 * They previously kept two hand-maintained copies, so a kind added to only one
 * was accepted live and then silently dropped on restart. Combat transitions
 * are host-authoritative and replayed by the Room Runtime.
 */
export const ROOM_RUNTIME_LOG_EVENT_KINDS = [
  ...ROOM_RUNTIME_LOG_BASE_EVENT_KINDS,
  ...COMBAT_RUNTIME_EVENT_KINDS,
] as const;

export type RoomRuntimeLogEventKind = typeof ROOM_RUNTIME_LOG_EVENT_KINDS[number];

export type RoomRuntimeLogVisibility = 'public' | 'hostOnly' | 'actorPrivate';

export interface RoomRuntimeLogEvent {
  eventId: string;
  roomId: string;
  /** Server-assigned, monotonic per room, starting at 1. */
  seq: number;
  createdAt: string;
  authorMemberId?: string;
  actorBindingId?: string;
  /** Read-only metadata copy of room.campaignRef at append time. */
  campaignRef?: RoomCampaignRef;
  kind: RoomRuntimeLogEventKind;
  visibility: RoomRuntimeLogVisibility;
  text?: string;
  payload?: unknown;
}

export interface AppendRoomRuntimeLogEventInput {
  authorMemberId?: string;
  actorBindingId?: string;
  kind: RoomRuntimeLogEventKind;
  visibility?: RoomRuntimeLogVisibility;
  text?: string;
  payload?: unknown;
}

export interface RoomRuntimeLogListResult {
  roomId: string;
  /**
   * The room's true latest seq (includes stored-but-withheld hostOnly events).
   * Clients should use THIS as the next `afterSeq` cursor — NOT `max(events.seq)`,
   * which can lag behind when non-public events are withheld and cause redundant
   * re-fetches.
   */
  latestSeq: number;
  /** Server-projected events for the verified reader; an active host may also receive hostOnly records. */
  events: RoomRuntimeLogEvent[];
}
