/**
 * Room / invite / member contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_INVITE_MEMBER_CONTRACTS_V0
 *
 * These are platform-level room, invite, and member contracts for the portable
 * Room Server model. They describe room identity, invite resolution inputs,
 * member roles, reconnect identity, and actor binding. They do not implement
 * networking, room creation, invite resolution, authentication, storage,
 * Runtime synchronization, or UI.
 *
 * Continues the principle: LAN is a deployment target, not a different
 * architecture. `host` is a ROOM role; authoritative state always belongs to the
 * Room Server even when the host runs it on a LAN computer. This module is
 * platform-neutral (no DND/COC/CP RED rules) and has only a single type-only
 * import: ActorSnapshotHash, used by the OPTIONAL clearance summary (M24.2a).
 */

import type { ActorSnapshotHash } from './characterClearanceTypes.js';
import type { CharacterClearanceDetails } from './characterClearanceDetails.js';
import type { RoomMapMemberPermissionSummary } from './roomMapTypes.js';

export type RoomMemberRole = 'host' | 'player' | 'spectator';

export type RoomMemberStatus =
  | 'invited'
  | 'pendingApproval'
  | 'active'
  | 'disconnected'
  | 'left'
  | 'kicked';

export type RoomJoinApprovalMode =
  | 'hostApprovalRequired'
  | 'autoApproveWithInviteCode'
  | 'closed';

export type RoomSystemId = 'dnd5e-2024' | 'coc7e' | 'cp-red' | 'custom';

export type RoomLifecycleStatus =
  | 'draft'
  | 'open'
  | 'inSession'
  | 'paused'
  | 'closed'
  | 'archived';

export interface RoomIdentity {
  roomId: string;
  /** Human-shareable room code; resolution to a server differs per deployment. */
  roomCode: string;
  inviteCode?: string;
  serverId: string;
  /** Connection target; kept separate from roomCode. */
  serverAddress?: string;
  campaignId?: string;
  sessionId?: string;
  systemId: RoomSystemId;
  lifecycleStatus: RoomLifecycleStatus;
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RoomInviteKind =
  | 'roomCode'
  | 'inviteCode'
  | 'directServerAddress'
  | 'lanDiscoveryPlaceholder'
  | 'thirdPartyAddress';

export type RoomInviteStatus = 'active' | 'expired' | 'revoked' | 'used' | 'disabled';

/** Describes an invite; generation/resolution is NOT implemented here. */
export interface RoomInviteDescriptor {
  inviteId: string;
  roomId: string;
  kind: RoomInviteKind;
  code: string;
  serverAddress?: string;
  status: RoomInviteStatus;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
  createdByMemberId?: string;
  note?: string;
}

export interface RoomMemberIdentity {
  /** Stable identity within the room (does not require a cloud account). */
  memberId: string;
  userId?: string;
  displayName: string;
  role: RoomMemberRole;
  status: RoomMemberStatus;
  joinedAt?: string;
  lastSeenAt?: string;
  /** For reconnect correlation; no token logic implemented here. */
  reconnectTokenId?: string;
}

export type RoomActorBindingStatus = 'pending' | 'approved' | 'rejected' | 'removed';

/** Joining a room != bringing an actor into the campaign; binding is separate. */
export interface RoomActorBinding {
  bindingId: string;
  memberId: string;
  actorId: string;
  actorSourceType: 'characterLibrary' | 'npcCard' | 'monsterStatBlock' | 'runtimeActor' | 'custom';
  systemId: RoomSystemId;
  status: RoomActorBindingStatus;
  approvedByMemberId?: string;
  note?: string;
}

/** A flat permission summary (NOT a permission engine — no computation here). */
export interface RoomMemberPermissionSummary {
  memberId: string;
  canApproveMembers: boolean;
  canKickMembers: boolean;
  canBindOwnActor: boolean;
  canApproveActorBindings: boolean;
  canControlAssignedActors: boolean;
  canMoveOwnTokens: boolean;
  canMoveAnyToken: boolean;
  canAppendPublicLog: boolean;
  canAppendHostOnlyLog: boolean;
  canRevealHandouts: boolean;
  canChangeScene: boolean;
  canManageRuntimeState: boolean;
}

// ── Room Lobby pre-session state (M15) ──────────────────────────────────────
//
// Lightweight, pre-Runtime lobby state: a player submits an actor binding
// SUMMARY (not a real RuntimeActor / CampaignActorInstance) and toggles a ready
// flag. System-agnostic — no DND/COC/CP RED rule fields. This is intentionally
// separate from the older `RoomActorBinding` (M2) contract above; the lobby
// summary describes a pre-session draft, not a runtime actor instance.

export type RoomLobbyActorBindingStatus =
  | 'notSubmitted'
  | 'pendingHostApproval'
  | 'approved'
  | 'rejected';

export type RoomActorBindingSource = 'localActorVault' | 'quickDraft' | 'manualScaffold' | 'imported' | 'unknown';

/** A pre-session reference to whatever the player intends to play (any system). */
export interface RoomActorRefSummary {
  systemId: RoomSystemId;
  actorId?: string;
  displayName: string;
  source: RoomActorBindingSource;
  /** Optional entry-preview fields. They are not a character-sheet schema. */
  summary?: string;
  hpCurrent?: number;
  hpMax?: number;
  armorClass?: number;
  /** Optional compact review metadata. It is not a character sheet or rules engine. */
  details?: CharacterClearanceDetails;
  /** Compact, server-verified references. Room state never carries pack entries. */
  contentReferences?: RoomPersonalContentReferenceSummary[];
}

export interface RoomPersonalContentReferenceSummary {
  packId: string;
  packVersionId: string;
  displayName: string;
  versionLabel: string;
  contentKind: 'personalCompendiumPack';
}

// ── Clearance summary (M24.2a, OPTIONAL future layer) ───────────────────────
//
// IMPORTANT: this is a SEPARATE layer from `status: RoomLobbyActorBindingStatus`.
// `RoomActorBinding` remains the v0 LOBBY BINDING DRAFT — i.e. "did the player
// submit an actor reference, and did the host accept that draft?". Character
// Clearance / admission (whether a specific actor snapshot passed the campaign's
// rules) is a different concern carried here. The two statuses must NOT be merged,
// and the existing binding.status enum is unchanged. Nothing currently populates
// `clearance` — server / RoomLobby are not required to provide it yet.

export type RoomActorBindingClearanceStatus =
  | 'notSubmitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'stale';

export interface RoomActorBindingClearanceSummary {
  admissionId?: string;
  status: RoomActorBindingClearanceStatus;
  snapshotId?: string;
  snapshotHash?: ActorSnapshotHash;
  inspectionResultId?: string;
  updatedAt: string;
}

export interface RoomActorBindingSummary {
  bindingId: string;
  memberId: string;
  actorRef: RoomActorRefSummary;
  /** Lobby binding-draft status (unchanged). NOT the clearance status. */
  status: RoomLobbyActorBindingStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerMemberId?: string;
  rejectionReason?: string;
  /** Optional future clearance/admission layer (M24.2a). Separate from `status`. */
  clearance?: RoomActorBindingClearanceSummary;
  /**
   * Server-owned reference to the durable campaign actor created from an approved
   * persisted Vault actor. It is absent for quick drafts, local-only rooms, and
   * legacy snapshots. It is not a permission grant or a character payload.
   */
  campaignActorInstanceId?: string;
}

export type RoomReadyStatus = 'notReady' | 'ready';

export interface RoomMemberReadyState {
  memberId: string;
  status: RoomReadyStatus;
  updatedAt: string;
}

/** Pre-session lobby state. NOT Runtime — no map/log/combat/actor instances. */
export interface RoomLobbyState {
  actorBindings: RoomActorBindingSummary[];
  readyStates: RoomMemberReadyState[];
}

// ── Campaign linkage (M19) ──────────────────────────────────────────────────
//
// Optional, read-only descriptive link from a room to the campaign it was hosted
// from. NOT a permission, NOT a CampaignMembership, NOT a CampaignActorInstance.
// Absent for ad-hoc / test rooms and for external rooms with no campaign. The
// room-local roomCode and the campaign-local roomCode are intentionally separate.

export type RoomCampaignRefSource = 'localCampaignLibrary' | 'imported' | 'workshop' | 'unknown';

export interface RoomCampaignRef {
  source: RoomCampaignRefSource;
  /**
   * Optional durable World Server context. A room with this plus `campaignId`
   * may bridge approved Vault actors into campaign_actor_instances; descriptive
   * local campaign links deliberately leave it absent.
   */
  worldServerId?: string;
  campaignId?: string;
  displayName: string;
  systemId: RoomSystemId;
}

/** Room state description — NOT RuntimeEncounterState (no map/log/combat here). */
export interface RoomSnapshot {
  identity: RoomIdentity;
  joinApprovalMode: RoomJoinApprovalMode;
  members: RoomMemberIdentity[];
  actorBindings: RoomActorBinding[];
  invites: RoomInviteDescriptor[];
  permissions?: RoomMemberPermissionSummary[];
  /** Optional room-scoped map collaboration grants; host authority remains implicit. */
  mapPermissions?: RoomMapMemberPermissionSummary[];
  notes?: string[];
  /** Room Lobby pre-session state (actor binding drafts + ready check). */
  lobby?: RoomLobbyState;
  /** Optional read-only link to the campaign this room was hosted from. */
  campaignRef?: RoomCampaignRef;
}

export interface RoomJoinRequest {
  inviteCodeOrRoomCode: string;
  requestedDisplayName: string;
  requestedRole?: RoomMemberRole;
  userId?: string;
  clientVersion?: string;
  protocolVersion?: string;
}

export type RoomJoinDecision =
  | 'accepted'
  | 'pendingHostApproval'
  | 'rejected'
  | 'roomClosed'
  | 'versionMismatch'
  | 'invalidInvite';

export interface RoomJoinResult {
  decision: RoomJoinDecision;
  roomId?: string;
  memberId?: string;
  assignedRole?: RoomMemberRole;
  reconnectTokenId?: string;
  message?: string;
  requiresHostApproval?: boolean;
}

/** Describes reconnect identity only; no authentication implemented. */
export interface RoomReconnectDescriptor {
  roomId: string;
  memberId: string;
  reconnectTokenId: string;
  lastKnownSessionId?: string;
  lastSeenAt?: string;
}
