/**
 * Room WebSocket transport server scaffold (v0).
 *
 * AI-LANDMARK: ROOM_SOCKET_SERVER_V0
 *
 * Server-only `ws` scaffold attached to the HTTP server at `/ws`. Clients
 * connect, subscribe to a roomId (via message, not URL), and receive room
 * snapshot envelopes. Exposes `broadcastRoomSnapshot` for HTTP handlers to call.
 *
 * NO auth, NO permission, NO projection/filtering, NO Runtime / RuntimeLog /
 * map / intent payloads. Never imported by the frontend. Room snapshots are
 * always wrapped in an envelope (see roomTransportTypes).
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

export interface CreateRoomSocketServerOptions {
  server: HttpServer;
  registry: RoomRegistry;
  path?: string;
}

export interface RoomSocketServerHandle {
  broadcastRoomSnapshot(roomId: string, room: RoomSnapshot, reason: RoomSocketRoomSnapshotReason): void;
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

  const handleMessage = (ws: WebSocket, raw: { type?: string; roomId?: string }): void => {
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
      default: {
        send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', message: `Unknown message type "${String(raw.type)}".` });
      }
    }
  };

  wss.on('connection', (ws: WebSocket) => {
    socketRooms.set(ws, new Set<string>());
    send(ws, { ...envelope(), type: 'connected', connectionId: randomUUID() });

    ws.on('message', (data: unknown) => {
      let parsed: { type?: string; roomId?: string };
      try {
        parsed = JSON.parse(String(data)) as { type?: string; roomId?: string };
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
  };
}
