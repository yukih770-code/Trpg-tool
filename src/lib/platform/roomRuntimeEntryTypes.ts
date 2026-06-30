/**
 * Room Runtime Entry contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_RUNTIME_ENTRY_TYPES_V0
 *
 * A thin bridge layer between the multiplayer Room Lobby (RoomSnapshot / member /
 * lobby actor-binding + ready) and a future runtime. This is NOT the runtime
 * itself: no RuntimeActor, no CampaignActorInstance, no RuntimeLog, no map/token,
 * no action intent. The entry context is a read-only snapshot of "who is entering
 * which room as what", derived purely from a RoomSnapshot. System-agnostic.
 */

import type {
  RoomActorRefSummary,
  RoomCampaignRef,
  RoomMemberRole,
  RoomReadyStatus,
  RoomSystemId,
} from './roomTypes';

export type RoomRuntimeEntryMode = 'hostPreview' | 'playerReady' | 'spectatorPreview';

export interface RoomRuntimeEntryContext {
  roomId: string;
  roomCode: string;
  systemId: RoomSystemId;
  serverBaseUrl: string;
  currentMemberId: string;
  currentRole: RoomMemberRole;
  approvedActorBindingId?: string;
  actorRef?: RoomActorRefSummary;
  readyState?: RoomReadyStatus;
  entryMode: RoomRuntimeEntryMode;
  /** Optional read-only campaign linkage carried from the room snapshot. */
  campaignRef?: RoomCampaignRef;
  /**
   * Optional actor admission id (M24.2a). A future clearance-aware runtime entry
   * will carry the admission that cleared this actor. Optional — the current entry
   * guard does not produce or require it, and existing callers need not pass it.
   */
  admissionId?: string;
  /** serverSeq of the snapshot the entry was computed from (provenance only). */
  serverSeqAtEntry?: number;
}

export type RoomRuntimeEntryBlockedReason =
  | 'roomMissing'
  | 'memberMissing'
  | 'memberNotActive'
  | 'actorBindingMissing'
  | 'actorBindingNotApproved'
  | 'actorNotAdmitted'
  | 'actorAdmissionRejected'
  | 'actorAdmissionStale'
  | 'memberNotReady'
  | 'spectatorPreviewOnly'
  | 'unknown';

export interface RoomRuntimeEntryEligibility {
  canEnter: boolean;
  reason?: RoomRuntimeEntryBlockedReason;
  approvedActorBindingId?: string;
  /** Set when the binding's clearance is approved with an admission (M24.2c). */
  admissionId?: string;
  actorRef?: RoomActorRefSummary;
  readyState?: RoomReadyStatus;
  entryMode?: RoomRuntimeEntryMode;
}
