/**
 * Room WebSocket transport server scaffold (v0).
 *
 * AI-LANDMARK: ROOM_SOCKET_SERVER_V0
 *
 * Server-only `ws` scaffold attached to the HTTP server at `/ws`. Clients
 * connect, subscribe to a roomId (via message, not URL), and receive room
 * snapshot envelopes. Exposes `broadcastRoomSnapshot` for HTTP handlers to call.
 *
 * NO auth, NO permission, NO projection/filtering, and no gameplay intent
 * handling. RuntimeLog and Room Map deltas are relayed as separate envelopes.
 * Never imported by the frontend. Room snapshots are always wrapped in an
 * envelope (see roomTransportTypes).
 */

import type { Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';
import type {
  RoomSocketEnvelopeBase,
  RoomSocketRoomSnapshotReason,
  RoomSocketServerMessage,
} from '../../src/lib/platform/roomTransportTypes.js';
import type { RoomRuntimeLogEvent } from '../protocol/room-protocol.js';
import type { RoomMapEvent, RoomMapLivePreview } from '../protocol/room-protocol.js';

export interface CreateRoomSocketServerOptions {
  server: HttpServer;
  registry: RoomRegistry;
  path?: string;
}

export interface RoomSocketServerHandle {
  broadcastRoomSnapshot(roomId: string, room: RoomSnapshot, reason: RoomSocketRoomSnapshotReason): void;
  broadcastRuntimeLogAppended(roomId: string, events: RoomRuntimeLogEvent[]): void;
  broadcastMapEventAppended(roomId: string, events: RoomMapEvent[]): void;
}

function envelope(): RoomSocketEnvelopeBase {
  return { protocolVersion: 'room-ws-v0', messageId: randomUUID(), sentAt: new Date().toISOString() };
}

export function createRoomSocketServer(options: CreateRoomSocketServerOptions): RoomSocketServerHandle {
  const path = options.path ?? '/ws';
  const wss = new WebSocketServer({ server: options.server, path });

  // roomId -> subscribed sockets
  const subscriptions = new Map<string, Set<WebSocket>>();
  // socket -> roomIds it is subscribed to (for cleanup on close)
  const socketRooms = new WeakMap<WebSocket, Set<string>>();
  let serverSeq = 0;

  // Error-isolated send: a single failing client must never throw into a caller
  // (HTTP mutation handler or another client's loop). On failure we drop the
  // socket from all subscriptions and best-effort terminate it.
  const safeSend = (ws: WebSocket, text: string): boolean => {
    if (ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(text);
      return true;
    } catch {
      dropSocket(ws);
      return false;
    }
  };

  const dropSocket = (ws: WebSocket): void => {
    const rooms = socketRooms.get(ws);
    if (rooms) {
      for (const roomId of rooms) subscriptions.get(roomId)?.delete(ws);
    }
    socketRooms.delete(ws);
    try {
      ws.terminate();
    } catch {
      // ignore — socket already gone
    }
  };

  const send = (ws: WebSocket, message: RoomSocketServerMessage): void => {
    safeSend(ws, JSON.stringify(message));
  };

  const broadcastMapPreview = (roomId: string, preview: RoomMapLivePreview): void => {
    const set = subscriptions.get(roomId);
    if (!set || set.size === 0) return;
    serverSeq += 1;
    const message: RoomSocketServerMessage = {
      ...envelope(),
      type: 'roomMapPreview',
      roomId,
      serverSeq,
      preview,
    };
    const text = JSON.stringify(message);
    for (const target of [...set]) safeSend(target, text);
  };

  const coordinate = (value: unknown): { x: number; y: number } | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const point = value as { x?: unknown; y?: unknown };
    if (typeof point.x !== 'number' || typeof point.y !== 'number' || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) return null;
    return { x: point.x, y: point.y };
  };

  const handleMessage = (ws: WebSocket, raw: Record<string, unknown>): void => {
    switch (raw.type) {
      case 'subscribeRoom': {
        if (typeof raw.roomId !== 'string') {
          send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', message: 'subscribeRoom requires a roomId.' });
          return;
        }
        const room = options.registry.get(raw.roomId);
        if (!room) {
          send(ws, { ...envelope(), type: 'error', code: 'roomNotFound', roomId: raw.roomId, message: `No room "${raw.roomId}".` });
          return;
        }
        let set = subscriptions.get(raw.roomId);
        if (!set) {
          set = new Set<WebSocket>();
          subscriptions.set(raw.roomId, set);
        }
        set.add(ws);
        socketRooms.get(ws)?.add(raw.roomId);
        send(ws, { ...envelope(), type: 'subscribedRoom', roomId: raw.roomId });
        serverSeq += 1;
        send(ws, { ...envelope(), type: 'roomSnapshot', roomId: raw.roomId, serverSeq, reason: 'initialSubscribe', payload: { room } });
        return;
      }
      case 'unsubscribeRoom': {
        if (typeof raw.roomId !== 'string') {
          send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', message: 'unsubscribeRoom requires a roomId.' });
          return;
        }
        subscriptions.get(raw.roomId)?.delete(ws);
        socketRooms.get(ws)?.delete(raw.roomId);
        send(ws, { ...envelope(), type: 'unsubscribedRoom', roomId: raw.roomId });
        return;
      }
      case 'ping': {
        send(ws, { ...envelope(), type: 'pong' });
        return;
      }
      case 'roomMapPreview': {
        if (typeof raw.roomId !== 'string' || typeof raw.authorMemberId !== 'string' || typeof raw.mapId !== 'string' || (raw.phase !== 'update' && raw.phase !== 'clear')) {
          send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', message: 'roomMapPreview requires roomId, authorMemberId, mapId, and phase.' });
          return;
        }
        if (!socketRooms.get(ws)?.has(raw.roomId)) {
          send(ws, { ...envelope(), type: 'error', code: 'notSubscribed', roomId: raw.roomId, message: 'Subscribe to the room before sharing a map preview.' });
          return;
        }
        const room = options.registry.get(raw.roomId);
        if (!room) {
          send(ws, { ...envelope(), type: 'error', code: 'roomNotFound', roomId: raw.roomId, message: `No room "${raw.roomId}".` });
          return;
        }
        const author = room.members.find((member) => member.memberId === raw.authorMemberId);
        if (!author || author.status !== 'active' || raw.mapId.trim() === '' || raw.mapId.length > 240) {
          send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', roomId: raw.roomId, message: 'Map previews require an active room member and valid mapId.' });
          return;
        }
        let preview: RoomMapLivePreview['preview'];
        if (raw.phase === 'update') {
          if (!raw.preview || typeof raw.preview !== 'object' || Array.isArray(raw.preview)) {
            send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', roomId: raw.roomId, message: 'Map preview update requires a preview payload.' });
            return;
          }
          const candidate = raw.preview as { kind?: unknown; start?: unknown; end?: unknown; shape?: unknown };
          const start = coordinate(candidate.start);
          const end = coordinate(candidate.end);
          const validShape = candidate.shape === undefined || candidate.shape === 'circle' || candidate.shape === 'cone' || candidate.shape === 'line' || candidate.shape === 'square' || candidate.shape === 'rectangle';
          if ((candidate.kind !== 'ruler' && candidate.kind !== 'area') || !start || !end || !validShape || (candidate.kind === 'area' && candidate.shape === undefined)) {
            send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', roomId: raw.roomId, message: 'Map preview geometry is invalid.' });
            return;
          }
          preview = candidate.kind === 'area'
            ? { kind: 'area', start, end, shape: candidate.shape as 'circle' | 'cone' | 'line' | 'square' | 'rectangle' }
            : { kind: 'ruler', start, end };
        }
        broadcastMapPreview(raw.roomId, {
          roomId: raw.roomId,
          mapId: raw.mapId.trim(),
          authorMemberId: author.memberId,
          authorDisplayName: author.displayName,
          phase: raw.phase,
          preview,
        });
        return;
      }
      default: {
        send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', message: `Unknown message type "${String(raw.type)}".` });
      }
    }
  };

  wss.on('connection', (ws: WebSocket) => {
    socketRooms.set(ws, new Set<string>());
    send(ws, { ...envelope(), type: 'connected', connectionId: randomUUID() });

    ws.on('message', (data: unknown) => {
      let parsed: Record<string, unknown>;
      try {
        const candidate = JSON.parse(String(data));
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Invalid payload.');
        parsed = candidate as Record<string, unknown>;
      } catch {
        send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', message: 'Invalid JSON.' });
        return;
      }
      handleMessage(ws, parsed);
    });

    ws.on('close', () => {
      const rooms = socketRooms.get(ws);
      if (rooms) {
        for (const roomId of rooms) subscriptions.get(roomId)?.delete(ws);
      }
      socketRooms.delete(ws);
    });
  });

  return {
    broadcastRoomSnapshot(roomId, room, reason) {
      const set = subscriptions.get(roomId);
      if (!set || set.size === 0) return; // no subscribers -> no-op
      serverSeq += 1;
      const message: RoomSocketServerMessage = {
        ...envelope(),
        type: 'roomSnapshot',
        roomId,
        serverSeq,
        reason,
        payload: { room },
      };
      const text = JSON.stringify(message);
      // Snapshot the subscriber set first: safeSend may mutate `set` (dropSocket)
      // when a send throws, so iterating the live set would be unsafe.
      for (const ws of [...set]) {
        safeSend(ws, text);
      }
    },

    broadcastRuntimeLogAppended(roomId, events) {
      if (events.length === 0) return;
      const set = subscriptions.get(roomId);
      if (!set || set.size === 0) return; // no subscribers -> no-op
      serverSeq += 1;
      const message: RoomSocketServerMessage = {
        ...envelope(),
        type: 'runtimeLogAppended',
        roomId,
        serverSeq,
        events,
      };
      const text = JSON.stringify(message);
      for (const ws of [...set]) {
        safeSend(ws, text);
      }
    },

    broadcastMapEventAppended(roomId, events) {
      if (events.length === 0) return;
      const set = subscriptions.get(roomId);
      if (!set || set.size === 0) return;
      serverSeq += 1;
      const message: RoomSocketServerMessage = {
        ...envelope(),
        type: 'mapEventAppended',
        roomId,
        serverSeq,
        events,
      };
      const text = JSON.stringify(message);
      for (const ws of [...set]) {
        safeSend(ws, text);
      }
    },
  };
}
