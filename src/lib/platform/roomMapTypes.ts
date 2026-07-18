/**
 * Room Map stream contracts (v0).
 *
 * Map changes are a distinct append-only room stream. They are deliberately not
 * RuntimeLog notes and do not belong in RoomSnapshot, which keeps lobby state
 * small. The current server registry is memory-only; persistence is a later
 * boundary.
 */

import {
  MAP_RUNTIME_EVENT_KINDS,
  type MapInteractionPreview,
  type MapRuntimeEventKind,
} from '../map/mapRuntimeTypes.js';

export const ROOM_MAP_EVENT_KINDS = MAP_RUNTIME_EVENT_KINDS;

export type RoomMapEventKind = MapRuntimeEventKind;

export interface RoomMapEvent {
  mapEventId: string;
  roomId: string;
  mapId: string;
  seq: number;
  createdAt: string;
  authorMemberId: string;
  eventKind: RoomMapEventKind;
  payload: Record<string, unknown>;
}

export interface RoomMapEventListResult {
  roomId: string;
  mapId?: string;
  latestSeq: number;
  events: RoomMapEvent[];
}

export interface AppendRoomMapEventInput {
  authorMemberId: string;
  mapId: string;
  eventKind: RoomMapEventKind;
  payload: Record<string, unknown>;
}

/**
 * Room-scoped collaboration grants. Only `canPinRanges` is active today;
 * the other fields reserve a stable, system-neutral boundary for later map
 * collaboration without granting broad host authority.
 */
export interface RoomMapMemberPermissionSummary {
  memberId: string;
  canPinRanges: boolean;
  canManageTokens: boolean;
  canManagePresentation: boolean;
}

/**
 * Ephemeral map interaction relayed over Room WebSocket. It is never stored in
 * RuntimeLog or the append-only room map stream, so a refresh/replay clears it.
 */
export interface RoomMapLivePreview {
  roomId: string;
  mapId: string;
  authorMemberId: string;
  authorDisplayName: string;
  phase: 'update' | 'clear';
  preview?: MapInteractionPreview;
}
