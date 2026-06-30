/**
 * Room WebSocket transport contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_TRANSPORT_TYPES_V0
 *
 * Platform-level message envelopes for the room WebSocket scaffold. Pure types;
 * imports only `RoomSnapshot` (type). No React / store / localStorage / server
 * code, no DND/LAN/localhost hardcoding. The room snapshot rides inside an
 * ENVELOPE (`payload`), so a future projection/filtering layer can replace the
 * payload without changing the envelope shape. No Runtime / RuntimeLog / map /
 * intent payloads here.
 */

import type { RoomSnapshot } from './roomTypes.js';
import type { RoomRuntimeLogEvent } from './roomRuntimeLogTypes.js';

export type RoomTransportProtocolVersion = 'room-ws-v0';

export interface RoomSocketEnvelopeBase {
  protocolVersion: RoomTransportProtocolVersion;
  messageId: string;
  sentAt: string;
}

// ── Client -> Server ────────────────────────────────────────────────────────

export interface RoomSocketSubscribeMessage extends RoomSocketEnvelopeBase {
  type: 'subscribeRoom';
  roomId: string;
}

export interface RoomSocketUnsubscribeMessage extends RoomSocketEnvelopeBase {
  type: 'unsubscribeRoom';
  roomId: string;
}

export interface RoomSocketPingMessage extends RoomSocketEnvelopeBase {
  type: 'ping';
}

export type RoomSocketClientMessage =
  | RoomSocketSubscribeMessage
  | RoomSocketUnsubscribeMessage
  | RoomSocketPingMessage;

// ── Server -> Client ────────────────────────────────────────────────────────

export interface RoomSocketConnectedMessage extends RoomSocketEnvelopeBase {
  type: 'connected';
  connectionId: string;
}

export interface RoomSocketSubscribedMessage extends RoomSocketEnvelopeBase {
  type: 'subscribedRoom';
  roomId: string;
}

export interface RoomSocketUnsubscribedMessage extends RoomSocketEnvelopeBase {
  type: 'unsubscribedRoom';
  roomId: string;
}

export interface RoomSocketPongMessage extends RoomSocketEnvelopeBase {
  type: 'pong';
}

export type RoomSocketRoomSnapshotReason =
  | 'initialSubscribe'
  | 'roomCreated'
  | 'memberJoined'
  | 'memberApproved'
  | 'memberRejected'
  | 'actorBindingSubmitted'
  | 'actorBindingApproved'
  | 'actorBindingRejected'
  | 'memberReadyChanged'
  | 'manualBroadcast';

export interface RoomSocketRoomSnapshotMessage extends RoomSocketEnvelopeBase {
  type: 'roomSnapshot';
  roomId: string;
  serverSeq: number;
  reason: RoomSocketRoomSnapshotReason;
  payload: {
    room: RoomSnapshot;
  };
}

/**
 * RuntimeLog delta (M21). A growing event stream rides in its OWN message, never
 * inside RoomSnapshot. v0 carries public events only.
 */
export interface RoomSocketRuntimeLogAppendedMessage extends RoomSocketEnvelopeBase {
  type: 'runtimeLogAppended';
  roomId: string;
  serverSeq: number;
  events: RoomRuntimeLogEvent[];
}

export type RoomSocketErrorCode = 'invalidMessage' | 'roomNotFound' | 'notSubscribed' | 'internalError';

export interface RoomSocketErrorMessage extends RoomSocketEnvelopeBase {
  type: 'error';
  code: RoomSocketErrorCode;
  roomId?: string;
  message: string;
}

export type RoomSocketServerMessage =
  | RoomSocketConnectedMessage
  | RoomSocketSubscribedMessage
  | RoomSocketUnsubscribedMessage
  | RoomSocketPongMessage
  | RoomSocketRoomSnapshotMessage
  | RoomSocketRuntimeLogAppendedMessage
  | RoomSocketErrorMessage;
