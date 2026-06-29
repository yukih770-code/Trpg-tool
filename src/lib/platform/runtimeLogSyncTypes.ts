/**
 * RuntimeLog synchronization contracts (v0, types only).
 *
 * AI-LANDMARK: RUNTIME_LOG_SYNC_CONTRACTS_V0
 *
 * These are platform-level RuntimeLog synchronization contracts for the portable
 * Room Server model. They describe authoritative log event envelopes, role-based
 * log projection, correction/tombstone metadata, and log stream cursors. They do
 * not implement networking, log append, storage, projection filtering, Runtime
 * mutation, or UI.
 *
 * Principle: server append is authoritative; clients receive only projected
 * events; host-only events are not sent to players; corrections/tombstones reuse
 * the existing RuntimeLog approach (no append implemented). `payload` stays
 * `unknown` — no RuntimeLogLocalStore import. Platform-neutral (no DND rules).
 */

export type RuntimeLogSyncVisibility = 'hostOnly' | 'playerVisible' | 'public' | 'hidden';

export type RuntimeLogSyncEventKind =
  | 'roll'
  | 'hpChange'
  | 'conditionChange'
  | 'resourceChange'
  | 'manualOverride'
  | 'systemNote'
  | 'chat'
  | 'handoutPublished'
  | 'sceneChanged'
  | 'runtimeStatePatch'
  | 'custom';

export interface RuntimeLogSyncEventEnvelope {
  logEventId: string;
  roomId: string;
  sessionId?: string;
  encounterId?: string;
  sourceIntentId?: string;
  sourcePatchId?: string;
  actorId?: string;
  targetId?: string;
  kind: RuntimeLogSyncEventKind;
  visibility: RuntimeLogSyncVisibility;
  serverSeq: number;
  message: string;
  payload?: unknown;
  createdAt?: string;
}

export type RuntimeLogCorrectionKind =
  | 'correctsEvent'
  | 'tombstone'
  | 'visibilityChange'
  | 'redaction'
  | 'custom';

export interface RuntimeLogCorrectionEnvelope {
  correctionId: string;
  roomId: string;
  logEventId: string;
  kind: RuntimeLogCorrectionKind;
  correctedByMemberId?: string;
  reason?: string;
  replacementMessage?: string;
  createdAt?: string;
}

export interface RuntimeLogProjectionPacket {
  packetId: string;
  roomId: string;
  sessionId?: string;
  recipientMemberId?: string;
  projectionRole: 'host' | 'player' | 'spectator';
  serverSeq: number;
  events?: RuntimeLogSyncEventEnvelope[];
  corrections?: RuntimeLogCorrectionEnvelope[];
  /** Debug/audit only — host-only events withheld from this projection. */
  omittedHostOnlyEventIds?: string[];
  warnings?: string[];
  createdAt?: string;
}

export interface RuntimeLogSyncCursor {
  roomId: string;
  sessionId?: string;
  memberId: string;
  lastReceivedServerSeq: number;
  updatedAt?: string;
}
