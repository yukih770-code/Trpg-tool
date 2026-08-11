/**
 * Room WebSocket transport contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_TRANSPORT_TYPES_V0
 *
 * Platform-level message envelopes for the room WebSocket scaffold. Pure types;
 * imports only `RoomSnapshot` (type). No React / store / localStorage / server
 * code, no DND/LAN/localhost hardcoding. The room snapshot rides inside an
 * ENVELOPE (`payload`), so a future projection/filtering layer can replace the
 * payload without changing the envelope shape. Room RuntimeLog and Room Map
 * deltas have their own envelopes; neither rides inside RoomSnapshot.
 */

import type { RoomSnapshot } from './roomTypes.js';
import type { RoomRuntimeLogEvent } from './roomRuntimeLogTypes.js';
import type { MapInteractionPreview } from '../map/mapRuntimeTypes.js';
import type { RoomMapEvent, RoomMapLivePreview } from './roomMapTypes.js';

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
  /** Claimed room member id; server binds it to the authenticated socket viewer. */
  memberId?: string;
  /** Last fully observed RuntimeLog sequence; omitted on the first subscription. */
  afterRuntimeLogSeq?: number;
  /** Last fully observed Room Map sequence; omitted on the first subscription. */
  afterMapEventSeq?: number;
}

export interface RoomSocketUnsubscribeMessage extends RoomSocketEnvelopeBase {
  type: 'unsubscribeRoom';
  roomId: string;
}

export interface RoomSocketPingMessage extends RoomSocketEnvelopeBase {
  type: 'ping';
}

export interface RoomSocketMapPreviewMessage extends RoomSocketEnvelopeBase {
  type: 'roomMapPreview';
  roomId: string;
  authorMemberId: string;
  mapId: string;
  phase: 'update' | 'clear';
  preview?: MapInteractionPreview;
}

export type RoomSocketClientMessage =
  | RoomSocketSubscribeMessage
  | RoomSocketUnsubscribeMessage
  | RoomSocketPingMessage
  | RoomSocketMapPreviewMessage;

// ── Server -> Client ────────────────────────────────────────────────────────

export interface RoomSocketConnectedMessage extends RoomSocketEnvelopeBase {
  type: 'connected';
  connectionId: string;
}

export interface RoomSocketSubscribedMessage extends RoomSocketEnvelopeBase {
  type: 'subscribedRoom';
  roomId: string;
  /** Server baseline after any requested catch-up has been sent. */
  runtimeLogLatestSeq?: number;
  /** Server baseline after any requested catch-up has been sent. */
  mapEventLatestSeq?: number;
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
  | 'mapPermissionChanged'
  | 'roomDisbanded'
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

/**
 * Room Map delta. This is intentionally separate from RuntimeLog so map state
 * does not masquerade as a social/narrative event stream.
 */
export interface RoomSocketMapEventAppendedMessage extends RoomSocketEnvelopeBase {
  type: 'mapEventAppended';
  roomId: string;
  serverSeq: number;
  events: RoomMapEvent[];
}

/** A non-persistent ruler/area gesture relayed only to current room subscribers. */
export interface RoomSocketMapPreviewBroadcastMessage extends RoomSocketEnvelopeBase {
  type: 'roomMapPreview';
  roomId: string;
  serverSeq: number;
  preview: RoomMapLivePreview;
}

export type RoomSocketErrorCode = 'invalidMessage' | 'roomNotFound' | 'roomClosed' | 'notSubscribed' | 'notAuthorized' | 'internalError';

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
  | RoomSocketMapEventAppendedMessage
  | RoomSocketMapPreviewBroadcastMessage
  | RoomSocketErrorMessage;
