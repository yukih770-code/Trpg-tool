/**
 * Room WebSocket transport client (frontend, v0).
 *
 * AI-LANDMARK: ROOM_SOCKET_CLIENT_V0
 *
 * Browser-native WebSocket wrapper for the room transport scaffold. Connects to
 * `<baseUrl>/ws`, subscribes to rooms (via message, not URL), and surfaces room
 * snapshot envelopes via callbacks. No React, no server (`ws`) import, no
 * localhost hardcoding (caller supplies baseUrl). Handles room transport
 * messages only — no Runtime / RuntimeLog / map.
 */

import type {
  RoomSocketClientMessage,
  RoomSocketEnvelopeBase,
  RoomSocketErrorMessage,
  RoomSocketRoomSnapshotMessage,
  RoomSocketRuntimeLogAppendedMessage,
  RoomSocketServerMessage,
} from './roomTransportTypes';

export type RoomSocketConnectionState = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export interface RoomSocketClientOptions {
  baseUrl: string;
  path?: string;
  onMessage?: (message: RoomSocketServerMessage) => void;
  onRoomSnapshot?: (message: RoomSocketRoomSnapshotMessage) => void;
  onRuntimeLogAppended?: (message: RoomSocketRuntimeLogAppendedMessage) => void;
  onErrorMessage?: (message: RoomSocketErrorMessage) => void;
  onConnectionStateChange?: (state: RoomSocketConnectionState) => void;
}

export interface RoomSocketClient {
  connect(): void;
  close(): void;
  subscribeRoom(roomId: string): void;
  unsubscribeRoom(roomId: string): void;
  ping(): void;
  getState(): RoomSocketConnectionState;
}

/** Convert an http(s) base URL into a ws(s) URL with the transport path. */
export function toRoomSocketUrl(baseUrl: string, path = '/ws'): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  const wsBase = trimmed.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  return `${wsBase}${path}`;
}

function makeId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return c?.randomUUID ? c.randomUUID() : `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function envelope(): RoomSocketEnvelopeBase {
  return { protocolVersion: 'room-ws-v0', messageId: makeId(), sentAt: new Date().toISOString() };
}

export function createRoomSocketClient(options: RoomSocketClientOptions): RoomSocketClient {
  let socket: WebSocket | null = null;
  let state: RoomSocketConnectionState = 'idle';

  const setState = (next: RoomSocketConnectionState) => {
    state = next;
    options.onConnectionStateChange?.(next);
  };

  const send = (message: RoomSocketClientMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };

  return {
    connect() {
      const url = toRoomSocketUrl(options.baseUrl, options.path);
      setState('connecting');
      socket = new WebSocket(url);
      socket.onopen = () => setState('open');
      socket.onclose = () => setState('closed');
      socket.onerror = () => setState('error');
      socket.onmessage = (ev: MessageEvent) => {
        let message: RoomSocketServerMessage;
        try {
          message = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data)) as RoomSocketServerMessage;
        } catch {
          return;
        }
        options.onMessage?.(message);
        if (message.type === 'roomSnapshot') options.onRoomSnapshot?.(message);
        else if (message.type === 'runtimeLogAppended') options.onRuntimeLogAppended?.(message);
        else if (message.type === 'error') options.onErrorMessage?.(message);
      };
    },
    close() {
      socket?.close();
      socket = null;
    },
    subscribeRoom(roomId) {
      send({ ...envelope(), type: 'subscribeRoom', roomId });
    },
    unsubscribeRoom(roomId) {
      send({ ...envelope(), type: 'unsubscribeRoom', roomId });
    },
    ping() {
      send({ ...envelope(), type: 'ping' });
    },
    getState() {
      return state;
    },
  };
}
