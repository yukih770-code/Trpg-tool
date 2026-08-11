/**
 * Room WebSocket transport client (frontend, v0).
 *
 * AI-LANDMARK: ROOM_SOCKET_CLIENT_V0
 * AI-LANDMARK: ROOM_SOCKET_RECONNECT_STREAM_CATCHUP_V1
 *
 * Browser-native WebSocket wrapper for the room transport scaffold. Connects to
 * `<baseUrl>/ws`, preserves desired room subscriptions across bounded
 * exponential-backoff reconnects, and carries per-stream cursors so the server
 * can replay missed RuntimeLog / Room Map deltas. No React, no server (`ws`)
 * import, no localhost hardcoding (caller supplies baseUrl).
 */

import type {
  RoomSocketClientMessage,
  RoomSocketEnvelopeBase,
  RoomSocketErrorMessage,
  RoomSocketRoomSnapshotMessage,
  RoomSocketMapEventAppendedMessage,
  RoomSocketMapPreviewBroadcastMessage,
  RoomSocketRuntimeLogAppendedMessage,
  RoomSocketServerMessage,
  RoomSocketSubscribedMessage,
} from './roomTransportTypes';
import type { MapInteractionPreview } from '../map/mapRuntimeTypes';

export type RoomSocketConnectionState = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export interface RoomSocketReconnectOptions {
  /** Enabled by default. Explicit `close()` always disables pending retries. */
  enabled?: boolean;
  initialDelayMs?: number;
  maxDelayMs?: number;
  multiplier?: number;
}

export interface RoomSocketClientOptions {
  baseUrl: string;
  path?: string;
  /** Local-dev only identity hint; production authority comes from the session cookie. */
  localDevViewerUserId?: string;
  reconnect?: RoomSocketReconnectOptions;
  onMessage?: (message: RoomSocketServerMessage) => void;
  onSubscribedRoom?: (message: RoomSocketSubscribedMessage) => void;
  onRoomSnapshot?: (message: RoomSocketRoomSnapshotMessage) => void;
  onRuntimeLogAppended?: (message: RoomSocketRuntimeLogAppendedMessage) => void;
  onMapEventAppended?: (message: RoomSocketMapEventAppendedMessage) => void;
  onMapPreview?: (message: RoomSocketMapPreviewBroadcastMessage) => void;
  onErrorMessage?: (message: RoomSocketErrorMessage) => void;
  onConnectionStateChange?: (state: RoomSocketConnectionState) => void;
}

export interface RoomSocketClient {
  connect(): void;
  close(): void;
  subscribeRoom(roomId: string, memberId?: string): void;
  unsubscribeRoom(roomId: string): void;
  ping(): void;
  shareMapPreview(input: { roomId: string; authorMemberId: string; mapId: string; phase: 'update' | 'clear'; preview?: MapInteractionPreview }): void;
  getState(): RoomSocketConnectionState;
}

/** Convert an http(s) base URL into a ws(s) URL with the transport path. */
export function toRoomSocketUrl(baseUrl: string, path = '/ws', localDevViewerUserId?: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  const wsBase = trimmed.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  const suffix = localDevViewerUserId ? `?devViewerUserId=${encodeURIComponent(localDevViewerUserId)}` : '';
  return `${wsBase}${path}${suffix}`;
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
  let manuallyClosed = false;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const reconnectEnabled = options.reconnect?.enabled !== false;
  const reconnectInitialDelayMs = Math.max(0, options.reconnect?.initialDelayMs ?? 500);
  const reconnectMaxDelayMs = Math.max(reconnectInitialDelayMs, options.reconnect?.maxDelayMs ?? 10_000);
  const reconnectMultiplier = Math.max(1, options.reconnect?.multiplier ?? 2);
  const desiredSubscriptions = new Map<string, {
    memberId?: string;
    afterRuntimeLogSeq?: number;
    afterMapEventSeq?: number;
  }>();
  const sentSubscriptions = new Set<string>();

  const setState = (next: RoomSocketConnectionState) => {
    state = next;
    options.onConnectionStateChange?.(next);
  };

  const send = (message: RoomSocketClientMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };

  const updateCursor = (roomId: string, stream: 'runtimeLog' | 'mapEvent', seq: number | undefined) => {
    if (seq === undefined || !Number.isSafeInteger(seq) || seq < 0) return;
    const subscription = desiredSubscriptions.get(roomId);
    if (!subscription) return;
    if (stream === 'runtimeLog') {
      subscription.afterRuntimeLogSeq = Math.max(subscription.afterRuntimeLogSeq ?? 0, seq);
    } else {
      subscription.afterMapEventSeq = Math.max(subscription.afterMapEventSeq ?? 0, seq);
    }
  };

  const sendSubscription = (roomId: string) => {
    const subscription = desiredSubscriptions.get(roomId);
    if (!subscription || sentSubscriptions.has(roomId) || !socket || socket.readyState !== WebSocket.OPEN) return;
    sentSubscriptions.add(roomId);
    send({
      ...envelope(),
      type: 'subscribeRoom',
      roomId,
      ...(subscription.memberId ? { memberId: subscription.memberId } : {}),
      ...(subscription.afterRuntimeLogSeq !== undefined ? { afterRuntimeLogSeq: subscription.afterRuntimeLogSeq } : {}),
      ...(subscription.afterMapEventSeq !== undefined ? { afterMapEventSeq: subscription.afterMapEventSeq } : {}),
    });
  };

  const clearReconnectTimer = () => {
    if (reconnectTimer === null) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };

  const scheduleReconnect = () => {
    if (manuallyClosed || !reconnectEnabled || reconnectTimer !== null) return;
    const delay = Math.min(
      reconnectMaxDelayMs,
      reconnectInitialDelayMs * reconnectMultiplier ** reconnectAttempt,
    );
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      openSocket();
    }, delay);
  };

  const openSocket = () => {
    if (manuallyClosed || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    clearReconnectTimer();
    const url = toRoomSocketUrl(options.baseUrl, options.path, options.localDevViewerUserId);
    setState('connecting');
    let nextSocket: WebSocket;
    try {
      nextSocket = new WebSocket(url);
    } catch {
      socket = null;
      setState('error');
      scheduleReconnect();
      return;
    }
    socket = nextSocket;
    nextSocket.onopen = () => {
      if (socket !== nextSocket || manuallyClosed) return;
      reconnectAttempt = 0;
      sentSubscriptions.clear();
      setState('open');
      for (const roomId of desiredSubscriptions.keys()) sendSubscription(roomId);
    };
    nextSocket.onclose = () => {
      if (socket !== nextSocket) return;
      socket = null;
      sentSubscriptions.clear();
      setState('closed');
      scheduleReconnect();
    };
    nextSocket.onerror = () => {
      if (socket === nextSocket) setState('error');
    };
    nextSocket.onmessage = (ev: MessageEvent) => {
      if (socket !== nextSocket) return;
      let message: RoomSocketServerMessage;
      try {
        message = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data)) as RoomSocketServerMessage;
      } catch {
        return;
      }
      if (message.type === 'subscribedRoom') {
        updateCursor(message.roomId, 'runtimeLog', message.runtimeLogLatestSeq);
        updateCursor(message.roomId, 'mapEvent', message.mapEventLatestSeq);
      } else if (message.type === 'runtimeLogAppended') {
        updateCursor(message.roomId, 'runtimeLog', message.events.reduce((latest, event) => Math.max(latest, event.seq), 0));
      } else if (message.type === 'mapEventAppended') {
        updateCursor(message.roomId, 'mapEvent', message.events.reduce((latest, event) => Math.max(latest, event.seq), 0));
      }
      options.onMessage?.(message);
      if (message.type === 'subscribedRoom') options.onSubscribedRoom?.(message);
      else if (message.type === 'roomSnapshot') options.onRoomSnapshot?.(message);
      else if (message.type === 'runtimeLogAppended') options.onRuntimeLogAppended?.(message);
      else if (message.type === 'mapEventAppended') options.onMapEventAppended?.(message);
      else if (message.type === 'roomMapPreview') options.onMapPreview?.(message);
      else if (message.type === 'error') options.onErrorMessage?.(message);
    };
  };

  return {
    connect() {
      manuallyClosed = false;
      openSocket();
    },
    close() {
      manuallyClosed = true;
      clearReconnectTimer();
      const activeSocket = socket;
      socket = null;
      sentSubscriptions.clear();
      activeSocket?.close();
      setState('closed');
    },
    subscribeRoom(roomId, memberId) {
      const existing = desiredSubscriptions.get(roomId);
      desiredSubscriptions.set(roomId, existing?.memberId === memberId ? existing : { memberId });
      sendSubscription(roomId);
    },
    unsubscribeRoom(roomId) {
      send({ ...envelope(), type: 'unsubscribeRoom', roomId });
      desiredSubscriptions.delete(roomId);
      sentSubscriptions.delete(roomId);
    },
    ping() {
      send({ ...envelope(), type: 'ping' });
    },
    shareMapPreview(input) {
      send({ ...envelope(), type: 'roomMapPreview', ...input });
    },
    getState() {
      return state;
    },
  };
}
