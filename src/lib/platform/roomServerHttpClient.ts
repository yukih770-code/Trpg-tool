/**
 * Room Server HTTP client (frontend, v0).
 *
 * AI-LANDMARK: ROOM_SERVER_HTTP_CLIENT_V0
 *
 * Thin fetch wrapper over the portable Room Server's HTTP scaffold (M9/M10).
 * UI components call these instead of scattering fetch details. No WebSocket, no
 * caching, no auth. Reuses platform room types. `baseUrl` default is the caller's
 * concern (not hardcoded here).
 */

import type {
  RoomJoinRequest,
  RoomJoinResult,
  RoomSnapshot,
  RoomSystemId,
} from './roomTypes';

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
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
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
): Promise<RoomSnapshot> {
  return request<RoomSnapshot>(config, `/rooms/${encodeURIComponent(roomId)}`);
}

export async function createRoomOnServer(
  config: RoomServerHttpClientConfig,
  input: { hostDisplayName: string; systemId?: RoomSystemId; displayName?: string },
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
): Promise<unknown> {
  return request<unknown>(config, `/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function rejectRoomMemberOnServer(
  config: RoomServerHttpClientConfig,
  roomId: string,
  memberId: string,
  reason?: string,
): Promise<unknown> {
  return request<unknown>(config, `/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
