/**
 * Room Server HTTP client (frontend, v0).
 *
 * AI-LANDMARK: ROOM_SERVER_HTTP_CLIENT_V0
 *
 * Thin fetch wrapper over the portable Room Server's HTTP scaffold (M9/M10).
 * UI components call these instead of scattering fetch details. No WebSocket, no
 * caching, or permission decisions. Browser credentials and the explicitly
 * gated local-dev viewer header are forwarded consistently so server-side room
 * authorization can bind a request to its real user. Reuses platform room types.
 */

import type {
  RoomCampaignRef,
  RoomJoinRequest,
  RoomJoinResult,
  RoomSnapshot,
  RoomSystemId,
} from './roomTypes';
import type {
  AppendRoomRuntimeLogEventInput,
  RoomRuntimeLogEvent,
  RoomRuntimeLogListResult,
} from './roomRuntimeLogTypes';
import type { SharedDiceRollResponse } from './sharedDiceTypes';
import type { AppendRoomMapEventInput, RoomMapEvent, RoomMapEventListResult } from './roomMapTypes';
import type { CharacterClearanceDetails } from './characterClearanceDetails';
import { resolveDevViewerUserId } from '../api/apiClient';

export interface RoomServerHttpClientConfig {
  baseUrl: string;
}

export class RoomServerHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'RoomServerHttpError';
    this.status = status;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

async function request<T>(config: RoomServerHttpClientConfig, path: string, init?: RequestInit): Promise<T> {
  const url = `${normalizeBaseUrl(config.baseUrl)}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: init?.credentials ?? 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(resolveDevViewerUserId() ? { 'x-dev-user-id': resolveDevViewerUserId() as string } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new RoomServerHttpError(0, `Network error contacting ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
  const text = await res.text();
  const data = text ? safeJsonParse(text) : undefined;
  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed: ${res.status}`);
    throw new RoomServerHttpError(res.status, message);
  }
  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function fetchRoomServerHealth(config: RoomServerHttpClientConfig): Promise<unknown> {
  return request<unknown>(config, '/health');
}

export async function listRoomServerRooms(config: RoomServerHttpClientConfig): Promise<RoomServerRoomListItem[]> {
  const data = await request<{ rooms?: RoomServerRoomListItem[] }>(config, '/rooms');
  return data.rooms ?? [];
}

/** Shape returned by GET /rooms (summary list, not a full RoomSnapshot). */
export interface RoomServerRoomListItem {
  roomId: string;
  roomCode: string;
  systemId: string;
  lifecycleStatus: string;
  memberCount: number;
}

export async function getRoomServerRoom(
  config: RoomServerHttpClientConfig,
  roomId: string,
  options?: { memberId?: string },
): Promise<RoomSnapshot> {
  const query = options?.memberId ? `?memberId=${encodeURIComponent(options.memberId)}` : '';
  return request<RoomSnapshot>(config, `/rooms/${encodeURIComponent(roomId)}${query}`);
}

export async function createRoomOnServer(
  config: RoomServerHttpClientConfig,
  input: { hostDisplayName: string; systemId?: RoomSystemId; displayName?: string; campaignRef?: RoomCampaignRef },
): Promise<{ room: RoomSnapshot }> {
  return request<{ room: RoomSnapshot }>(config, '/rooms/create', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function joinRoomOnServer(
  config: RoomServerHttpClientConfig,
  input: Pick<RoomJoinRequest, 'inviteCodeOrRoomCode' | 'requestedDisplayName' | 'requestedRole' | 'userId'>,
): Promise<RoomJoinResult> {
  return request<RoomJoinResult>(config, '/rooms/join', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function approveRoomMemberOnServer(
  config: RoomServerHttpClientConfig,
  roomId: string,
  memberId: string,
  decidedByMemberId: string,
): Promise<unknown> {
  return request<unknown>(config, `/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ decidedByMemberId }),
  });
}

export async function rejectRoomMemberOnServer(
  config: RoomServerHttpClientConfig,
  roomId: string,
  memberId: string,
  decidedByMemberId: string,
  reason?: string,
): Promise<unknown> {
  return request<unknown>(config, `/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ decidedByMemberId, reason }),
  });
}

// ── Room Lobby: actor binding + ready check (M15) ───────────────────────────
// Pre-session lobby mutations. Updates arrive via the WS roomSnapshot broadcast;
// these return the service result and do not require the UI to read the room.

/** Submit a lightweight pre-session actor binding SUMMARY (not a real actor). */
export async function submitActorBindingToRoomServer(
  config: RoomServerHttpClientConfig,
  roomId: string,
  input: {
    memberId: string;
    actorRef: {
      systemId?: string;
      actorId?: string;
      displayName: string;
      source?: string;
      summary?: string;
      hpCurrent?: number;
      hpMax?: number;
      armorClass?: number;
      details?: CharacterClearanceDetails;
    };
  },
): Promise<unknown> {
  return request<unknown>(config, `/rooms/${encodeURIComponent(roomId)}/actor-bindings/submit`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Host scaffold approval of an actor binding (NOT a real permission system). */
export async function approveActorBindingOnRoomServer(
  config: RoomServerHttpClientConfig,
  roomId: string,
  bindingId: string,
  reviewerMemberId?: string,
): Promise<unknown> {
  return request<unknown>(config, `/rooms/${encodeURIComponent(roomId)}/actor-bindings/${encodeURIComponent(bindingId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ reviewerMemberId }),
  });
}

/** Host scaffold rejection of an actor binding (NOT a real permission system). */
export async function rejectActorBindingOnRoomServer(
  config: RoomServerHttpClientConfig,
  roomId: string,
  bindingId: string,
  reviewerMemberId?: string,
  rejectionReason?: string,
): Promise<unknown> {
  return request<unknown>(config, `/rooms/${encodeURIComponent(roomId)}/actor-bindings/${encodeURIComponent(bindingId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reviewerMemberId, rejectionReason }),
  });
}

/** Toggle a member's pre-session ready flag. */
export async function setRoomMemberReadyOnServer(
  config: RoomServerHttpClientConfig,
  roomId: string,
  memberId: string,
  ready: boolean,
): Promise<unknown> {
  return request<unknown>(config, `/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberId)}/ready`, {
    method: 'POST',
    body: JSON.stringify({ ready }),
  });
}

// ── RuntimeLog server v0 (M21) ──────────────────────────────────────────────
// Append-only per-room event stream. v0 lists/broadcasts public events only.

/** List a room's RuntimeLog events; afterSeq returns only events with seq > afterSeq. */
export async function listRoomRuntimeLog(
  config: RoomServerHttpClientConfig,
  roomId: string,
  options?: { afterSeq?: number },
): Promise<RoomRuntimeLogListResult> {
  const query = options?.afterSeq !== undefined ? `?afterSeq=${encodeURIComponent(String(options.afterSeq))}` : '';
  return request<RoomRuntimeLogListResult>(config, `/rooms/${encodeURIComponent(roomId)}/runtime-log${query}`);
}

/** Append a RuntimeLog event. campaignRef / seq / eventId / createdAt are server-assigned. */
export async function appendRoomRuntimeLogEvent(
  config: RoomServerHttpClientConfig,
  roomId: string,
  input: AppendRoomRuntimeLogEventInput,
): Promise<{ event: RoomRuntimeLogEvent }> {
  return request<{ event: RoomRuntimeLogEvent }>(config, `/rooms/${encodeURIComponent(roomId)}/runtime-log/events`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** List the distinct append-only Room Map stream; it is not RuntimeLog. */
export async function listRoomMapEvents(
  config: RoomServerHttpClientConfig,
  roomId: string,
  options?: { afterSeq?: number; mapId?: string; memberId?: string },
): Promise<RoomMapEventListResult> {
  const query = new URLSearchParams();
  if (options?.afterSeq !== undefined) query.set('afterSeq', String(options.afterSeq));
  if (options?.mapId) query.set('mapId', options.mapId);
  if (options?.memberId) query.set('memberId', options.memberId);
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return request<RoomMapEventListResult>(config, `/rooms/${encodeURIComponent(roomId)}/map-events${suffix}`);
}

/** Append one host-managed Room Map event. The server assigns id, seq, and time. */
export async function appendRoomMapEvent(
  config: RoomServerHttpClientConfig,
  roomId: string,
  input: AppendRoomMapEventInput,
): Promise<{ event: RoomMapEvent }> {
  return request<{ event: RoomMapEvent }>(config, `/rooms/${encodeURIComponent(roomId)}/map-events`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Host grants or revokes one active player's ability to pin a lasting map range. */
export async function setRoomMapMemberPermission(
  config: RoomServerHttpClientConfig,
  roomId: string,
  memberId: string,
  input: { authorizedByMemberId: string; canPinRanges: boolean },
): Promise<{ room: RoomSnapshot }> {
  return request<{ room: RoomSnapshot }>(config, `/rooms/${encodeURIComponent(roomId)}/map-permissions/${encodeURIComponent(memberId)}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Shared Dice v0 (M25): submit an expression; the SERVER parses + rolls and
 * returns the dice.roll event + roll. The client never computes randomness, and
 * never optimistically inserts the log event (it arrives via runtimeLogAppended
 * or the response here).
 */
export async function rollSharedDice(
  config: RoomServerHttpClientConfig,
  roomId: string,
  input: { memberId: string; expression: string; label?: string },
): Promise<SharedDiceRollResponse> {
  return request<SharedDiceRollResponse>(config, `/rooms/${encodeURIComponent(roomId)}/runtime/dice-roll`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
