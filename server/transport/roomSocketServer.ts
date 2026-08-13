/**
 * Room WebSocket transport server scaffold (v0).
 *
 * AI-LANDMARK: ROOM_SOCKET_SERVER_V0
 * AI-LANDMARK: ROOM_SOCKET_RECONNECT_STREAM_CATCHUP_V1
 *
 * Server-only `ws` scaffold attached to the HTTP server at `/ws`. Clients
 * connect, subscribe to a roomId (via message, not URL), and receive room
 * snapshot envelopes. Exposes `broadcastRoomSnapshot` for HTTP handlers to call.
 *
 * Room subscriptions and transient map previews require an authenticated active
 * room member. This remains a narrow Runtime Alpha boundary: it does not add
 * gameplay intent handling or broad projection/filtering. RuntimeLog and Room
 * Map deltas are relayed as separate envelopes.
 * Never imported by the frontend. Room snapshots are always wrapped in an
 * envelope (see roomTransportTypes).
 */

import type { Server as HttpServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';
import type {
  RoomSocketEnvelopeBase,
  RoomSocketRoomSnapshotReason,
  RoomSocketServerMessage,
} from '../../src/lib/platform/roomTransportTypes.js';
import type {
  RoomMapEvent,
  RoomMapEventListResult,
  RoomMapLivePreview,
  RoomRuntimeLogEvent,
  RoomRuntimeLogListResult,
} from '../protocol/room-protocol.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveRoomParticipant, resolveRoomRuntimePermission } from '../room/roomRuntimePermissionGuard.js';

export interface CreateRoomSocketServerOptions {
  server: HttpServer;
  registry: RoomRegistry;
  path?: string;
  /** Per-member projection callbacks keep authoritative Room data off non-host sockets. */
  projectRoomSnapshot?: (room: RoomSnapshot, memberId: string) => RoomSnapshot;
  projectRuntimeLogEvents?: (roomId: string, memberId: string, events: RoomRuntimeLogEvent[]) => RoomRuntimeLogEvent[];
  projectMapEvents?: (roomId: string, memberId: string, events: RoomMapEvent[]) => RoomMapEvent[];
  /** Reads a stream baseline or missing suffix for reconnect catch-up. */
  readRuntimeLogEvents?: (roomId: string, afterSeq?: number) => RoomRuntimeLogListResult;
  /** Reads a stream baseline or missing suffix for reconnect catch-up. */
  readMapEvents?: (roomId: string, afterSeq?: number) => RoomMapEventListResult;
  /** Resolves a browser session (or explicitly gated local-dev identity) per socket. */
  resolveViewer?: (request: IncomingMessage) => Promise<CurrentViewerContext>;
  /** Rejects the upgrade while durable live-room startup recovery is incomplete. */
  isReady?: () => boolean;
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
  const wss = new WebSocketServer({
    server: options.server,
    path,
    verifyClient: (_info, done) => {
      if (options.isReady?.() === false) {
        done(false, 503, 'Startup recovery is not ready.');
        return;
      }
      done(true);
    },
  });

  // roomId -> subscribed sockets
  const subscriptions = new Map<string, Set<WebSocket>>();
  // socket -> roomIds it is subscribed to (for cleanup on close)
  const socketRooms = new WeakMap<WebSocket, Set<string>>();
  // socket -> authenticated member id for each subscribed room
  const socketMembers = new WeakMap<WebSocket, Map<string, string>>();
  let serverSeq = 0;
  const anonymousViewer: CurrentViewerContext = {
    viewerUserId: null,
    isAuthenticated: false,
    authTrustLevel: 'anonymous',
    isDevOnly: false,
    isServiceInternal: false,
    notes: [],
  };

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
    socketMembers.delete(ws);
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

  const optionalSequenceCursor = (value: unknown): number | undefined | null => {
    if (value === undefined) return undefined;
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  };

  const handleMessage = (ws: WebSocket, raw: Record<string, unknown>, viewer: CurrentViewerContext): void => {
    switch (raw.type) {
      case 'subscribeRoom': {
        if (typeof raw.roomId !== 'string' || typeof raw.memberId !== 'string') {
          send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', message: 'subscribeRoom requires a roomId and memberId.' });
          return;
        }
        const afterRuntimeLogSeq = optionalSequenceCursor(raw.afterRuntimeLogSeq);
        const afterMapEventSeq = optionalSequenceCursor(raw.afterMapEventSeq);
        if (afterRuntimeLogSeq === null || afterMapEventSeq === null) {
          send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', roomId: raw.roomId, message: 'Reconnect cursors must be non-negative safe integers.' });
          return;
        }
        const room = options.registry.get(raw.roomId);
        if (!room) {
          send(ws, { ...envelope(), type: 'error', code: 'roomNotFound', roomId: raw.roomId, message: `No room "${raw.roomId}".` });
          return;
        }
        const access = resolveRoomParticipant({ room, viewer, memberId: raw.memberId });
        if (!access.allowed) {
          send(ws, { ...envelope(), type: 'error', code: 'notAuthorized', roomId: raw.roomId, message: 'Authenticated room membership is required.' });
          return;
        }
        // Existing subscribers receive the disband snapshot broadcast. A new
        // subscription after closure is rejected so it cannot masquerade as an
        // active room channel; the HTTP room snapshot remains the close-state
        // source for an existing member's direct return view.
        if (room.identity.lifecycleStatus === 'closed' || room.identity.lifecycleStatus === 'archived') {
          send(ws, { ...envelope(), type: 'error', code: 'roomClosed', roomId: raw.roomId, message: 'This room has been disbanded.' });
          return;
        }
        let set = subscriptions.get(raw.roomId);
        if (!set) {
          set = new Set<WebSocket>();
          subscriptions.set(raw.roomId, set);
        }
        set.add(ws);
        socketRooms.get(ws)?.add(raw.roomId);
        socketMembers.get(ws)?.set(raw.roomId, raw.memberId);
        // First subscription establishes a stream baseline without replaying
        // full history (the HTTP readers own initial history). A reconnect sends
        // its last observed cursor, so only the missing suffix is projected and
        // replayed. Transient map previews are deliberately never replayed.
        const runtimeCatchUp = options.readRuntimeLogEvents?.(raw.roomId, afterRuntimeLogSeq);
        if (afterRuntimeLogSeq !== undefined && runtimeCatchUp && runtimeCatchUp.events.length > 0) {
          const projected = options.projectRuntimeLogEvents?.(raw.roomId, raw.memberId, runtimeCatchUp.events) ?? runtimeCatchUp.events;
          if (projected.length > 0) {
            serverSeq += 1;
            send(ws, { ...envelope(), type: 'runtimeLogAppended', roomId: raw.roomId, serverSeq, events: projected });
          }
        }
        const mapCatchUp = options.readMapEvents?.(raw.roomId, afterMapEventSeq);
        if (afterMapEventSeq !== undefined && mapCatchUp && mapCatchUp.events.length > 0) {
          const projected = options.projectMapEvents?.(raw.roomId, raw.memberId, mapCatchUp.events) ?? mapCatchUp.events;
          if (projected.length > 0) {
            serverSeq += 1;
            send(ws, { ...envelope(), type: 'mapEventAppended', roomId: raw.roomId, serverSeq, events: projected });
          }
        }
        send(ws, {
          ...envelope(),
          type: 'subscribedRoom',
          roomId: raw.roomId,
          ...(runtimeCatchUp ? { runtimeLogLatestSeq: runtimeCatchUp.latestSeq } : {}),
          ...(mapCatchUp ? { mapEventLatestSeq: mapCatchUp.latestSeq } : {}),
        });
        serverSeq += 1;
        send(ws, { ...envelope(), type: 'roomSnapshot', roomId: raw.roomId, serverSeq, reason: 'initialSubscribe', payload: { room: options.projectRoomSnapshot?.(room, raw.memberId) ?? room } });
        return;
      }
      case 'unsubscribeRoom': {
        if (typeof raw.roomId !== 'string') {
          send(ws, { ...envelope(), type: 'error', code: 'invalidMessage', message: 'unsubscribeRoom requires a roomId.' });
          return;
        }
        subscriptions.get(raw.roomId)?.delete(ws);
        socketRooms.get(ws)?.delete(raw.roomId);
        socketMembers.get(ws)?.delete(raw.roomId);
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
        const subscribedMemberId = socketMembers.get(ws)?.get(raw.roomId);
        if (subscribedMemberId !== raw.authorMemberId) {
          send(ws, { ...envelope(), type: 'error', code: 'notAuthorized', roomId: raw.roomId, message: 'Map preview author does not match the authenticated room member.' });
          return;
        }
        const access = resolveRoomRuntimePermission({ room, viewer, memberId: raw.authorMemberId, action: 'map.preview.range.temporary' });
        const author = room.members.find((member) => member.memberId === raw.authorMemberId);
        if (!access.allowed || !author || raw.mapId.trim() === '' || raw.mapId.length > 240) {
          send(ws, { ...envelope(), type: 'error', code: 'notAuthorized', roomId: raw.roomId, message: 'Map previews require an authenticated active player with room access.' });
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

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    socketRooms.set(ws, new Set<string>());
    socketMembers.set(ws, new Map<string, string>());
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
      Promise.resolve(options.resolveViewer?.(request) ?? anonymousViewer).then((viewer) => handleMessage(ws, parsed, viewer)).catch(() => {
        send(ws, { ...envelope(), type: 'error', code: 'notAuthorized', message: 'Unable to verify this room connection.' });
      });
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
      // Snapshot the subscriber set first: safeSend may mutate `set` (dropSocket)
      // when a send throws, so iterating the live set would be unsafe.
      for (const ws of [...set]) {
        const memberId = socketMembers.get(ws)?.get(roomId);
        if (!memberId) continue;
        send(ws, {
          ...envelope(),
          type: 'roomSnapshot',
          roomId,
          serverSeq,
          reason,
          payload: { room: options.projectRoomSnapshot?.(room, memberId) ?? room },
        });
      }
    },

    broadcastRuntimeLogAppended(roomId, events) {
      if (events.length === 0) return;
      const set = subscriptions.get(roomId);
      if (!set || set.size === 0) return; // no subscribers -> no-op
      serverSeq += 1;
      for (const ws of [...set]) {
        const memberId = socketMembers.get(ws)?.get(roomId);
        if (!memberId) continue;
        const projected = options.projectRuntimeLogEvents?.(roomId, memberId, events) ?? events;
        if (projected.length > 0) send(ws, { ...envelope(), type: 'runtimeLogAppended', roomId, serverSeq, events: projected });
      }
    },

    broadcastMapEventAppended(roomId, events) {
      if (events.length === 0) return;
      const set = subscriptions.get(roomId);
      if (!set || set.size === 0) return;
      serverSeq += 1;
      for (const ws of [...set]) {
        const memberId = socketMembers.get(ws)?.get(roomId);
        if (!memberId) continue;
        const projected = options.projectMapEvents?.(roomId, memberId, events) ?? events;
        if (projected.length > 0) send(ws, { ...envelope(), type: 'mapEventAppended', roomId, serverSeq, events: projected });
      }
    },
  };
}
