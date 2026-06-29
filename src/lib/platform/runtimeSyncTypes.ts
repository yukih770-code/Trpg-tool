/**
 * Runtime state synchronization contracts (v0, types only).
 *
 * AI-LANDMARK: RUNTIME_STATE_SYNC_CONTRACTS_V0
 *
 * These are platform-level Runtime state synchronization contracts for the
 * portable Room Server model. They describe authoritative runtime snapshots,
 * role-based projections, state patches, event-stream metadata, and client cache
 * boundaries. They do not implement networking, patch application, permission
 * filtering, Runtime mutation, storage, logging, map sync, or UI.
 *
 * Principle: the Room Server owns authoritative Runtime state; clients hold only
 * projection/cache and submit M3 intents. DM-only data is filtered server-side
 * (different payloads per role), never hidden by UI. This module imports nothing
 * and stays platform-neutral (no DND/COC/CP RED rules); concrete
 * DndRuntimeEncounterState is carried via `payload` / a future mapper.
 */

export type RuntimeSyncProjectionRole = 'host' | 'player' | 'spectator';

export type RuntimeSyncVisibility = 'hostOnly' | 'playerVisible' | 'public' | 'hidden';

export type RuntimeSyncAuthority = 'serverAuthoritative' | 'clientCache' | 'projectionOnly';

export interface RuntimeStateSnapshotRef {
  snapshotId: string;
  roomId: string;
  sessionId?: string;
  encounterId?: string;
  systemId: string;
  authority: RuntimeSyncAuthority;
  serverSeq: number;
  createdAt?: string;
}

/** Snapshot envelope; concrete system state goes in `payload` (no DND import). */
export interface RuntimeStateSnapshotEnvelope {
  ref: RuntimeStateSnapshotRef;
  projectionRole: RuntimeSyncProjectionRole;
  projectedForMemberId?: string;
  actorIds: string[];
  activeActorId?: string;
  round?: number;
  turnIndex?: number;
  quickViewIds?: string[];
  pendingIntentIds?: string[];
  visibility: RuntimeSyncVisibility;
  payload?: unknown;
}

export type RuntimeStatePatchKind =
  | 'snapshot'
  | 'actorAdded'
  | 'actorRemoved'
  | 'actorUpdated'
  | 'hpChanged'
  | 'conditionAdded'
  | 'conditionRemoved'
  | 'resourceChanged'
  | 'turnChanged'
  | 'initiativeChanged'
  | 'selectionChanged'
  | 'targetChanged'
  | 'pendingIntentChanged'
  | 'manualOverride'
  | 'custom';

/** A sync message structure (not an apply function). May derive from a RuntimeChange. */
export interface RuntimeStatePatch {
  patchId: string;
  kind: RuntimeStatePatchKind;
  roomId: string;
  sessionId?: string;
  encounterId?: string;
  actorId?: string;
  targetId?: string;
  /** Correlates to the M3 client intent that caused this (id only). */
  sourceIntentId?: string;
  /** Correlates to a future M5 log event (id only; not used this round). */
  sourceLogEventId?: string;
  serverSeq: number;
  visibility: RuntimeSyncVisibility;
  payload?: unknown;
  createdAt?: string;
}

/** A per-recipient broadcast packet; player/spectator packets exclude hostOnly data. */
export interface RuntimeProjectionPacket {
  packetId: string;
  roomId: string;
  sessionId?: string;
  recipientMemberId?: string;
  projectionRole: RuntimeSyncProjectionRole;
  serverSeq: number;
  snapshot?: RuntimeStateSnapshotEnvelope;
  patches?: RuntimeStatePatch[];
  /** Debug/audit only — ids of host-only patches withheld from this projection. */
  omittedHostOnlyPatchIds?: string[];
  warnings?: string[];
  createdAt?: string;
}

export interface RuntimeSyncCursor {
  roomId: string;
  sessionId?: string;
  memberId: string;
  lastReceivedServerSeq: number;
  lastSnapshotId?: string;
  updatedAt?: string;
}

export type RuntimeSyncResumeDecision =
  | 'resumeFromPatch'
  | 'sendFreshSnapshot'
  | 'rejoinRequired'
  | 'rejected';

export interface RuntimeSyncResumeResult {
  decision: RuntimeSyncResumeDecision;
  roomId: string;
  memberId?: string;
  fromServerSeq?: number;
  snapshot?: RuntimeStateSnapshotEnvelope;
  patches?: RuntimeStatePatch[];
  message?: string;
}

/** Description of a client's projection cache — NOT authoritative state, not a store impl. */
export interface RuntimeClientProjectionCache {
  roomId: string;
  sessionId?: string;
  memberId: string;
  projectionRole: RuntimeSyncProjectionRole;
  lastServerSeq: number;
  snapshotId?: string;
  actorIds: string[];
  quickViewIds?: string[];
  pendingIntentIds?: string[];
  cacheUpdatedAt?: string;
}

export type RuntimeSyncRejectionReason =
  | 'clientCannotMutateAuthoritativeState'
  | 'unauthorized'
  | 'invalidPatch'
  | 'staleClientSeq'
  | 'unknownActor'
  | 'projectionMismatch'
  | 'hostOnlyDataNotAllowed'
  | 'requiresIntent'
  | 'custom';

export interface RuntimeSyncRejection {
  rejectionId: string;
  roomId: string;
  memberId?: string;
  sourceIntentId?: string;
  reason: RuntimeSyncRejectionReason;
  message?: string;
  createdAt?: string;
}
