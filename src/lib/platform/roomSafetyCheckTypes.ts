/**
 * Room safety check contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_SAFETY_CHECK_CONTRACTS_V0
 *
 * These are platform-level room safety check contracts for the portable Room
 * Server model. They describe join checks, actor binding checks, package/source
 * checks, and host review results. They do not implement validation, anti-cheat,
 * rule legality, authentication, storage, Runtime mutation, or UI.
 *
 * Platform-neutral (no DND/COC/CP RED rules — DND-specific legality is a later
 * safety mapper). Imports nothing. Includes a static policy table (v0/v1/future).
 */

export type RoomSafetyCheckStage =
  | 'joinRoom'
  | 'actorBinding'
  | 'sessionStart'
  | 'runtimeAction'
  | 'packageLoad'
  | 'custom';

export type RoomSafetySeverity = 'info' | 'warning' | 'error' | 'blocking';

export type RoomSafetyDecision = 'pass' | 'passWithWarning' | 'requiresHostReview' | 'reject';

export type RoomSafetyCheckKind =
  | 'memberIdentity'
  | 'inviteValid'
  | 'roomOpen'
  | 'actorOwnership'
  | 'actorSystemMatch'
  | 'actorSourceAllowed'
  | 'actorVersionCompatible'
  | 'actorLevelAllowed'
  | 'duplicateActor'
  | 'malformedData'
  | 'packageAllowed'
  | 'packageVersionCompatible'
  | 'custom';

export interface RoomSafetyCheckInput {
  checkId: string;
  roomId: string;
  memberId?: string;
  actorId?: string;
  packageId?: string;
  stage: RoomSafetyCheckStage;
  checkKinds: RoomSafetyCheckKind[];
  payload?: unknown;
}

export interface RoomSafetyIssue {
  issueId: string;
  kind: RoomSafetyCheckKind;
  severity: RoomSafetySeverity;
  message: string;
  targetId?: string;
  note?: string;
}

export interface RoomSafetyCheckResult {
  checkId: string;
  roomId: string;
  memberId?: string;
  actorId?: string;
  decision: RoomSafetyDecision;
  issues: RoomSafetyIssue[];
  requiresHostConfirm: boolean;
  createdAt?: string;
}

export type RoomSafetyHostReviewDecision = 'approved' | 'rejected' | 'approvedWithWarning';

export interface RoomSafetyHostReview {
  reviewId: string;
  checkId: string;
  decidedByMemberId: string;
  decision: RoomSafetyHostReviewDecision;
  note?: string;
  decidedAt?: string;
}

export type RoomSafetyCheckPriority = 'v0Required' | 'v1Recommended' | 'future';

export interface RoomSafetyCheckPolicyItem {
  kind: RoomSafetyCheckKind;
  priority: RoomSafetyCheckPriority;
  defaultSeverity: RoomSafetySeverity;
  requiresHostReviewByDefault: boolean;
  description?: string;
}

/** Static policy table (description only; no validation implemented). */
export const ROOM_SAFETY_CHECK_POLICY: RoomSafetyCheckPolicyItem[] = [
  { kind: 'memberIdentity', priority: 'v0Required', defaultSeverity: 'blocking', requiresHostReviewByDefault: false, description: 'Member has a valid in-room identity.' },
  { kind: 'inviteValid', priority: 'v0Required', defaultSeverity: 'blocking', requiresHostReviewByDefault: false, description: 'Invite/room code is valid and active.' },
  { kind: 'roomOpen', priority: 'v0Required', defaultSeverity: 'blocking', requiresHostReviewByDefault: false, description: 'Room is open to joins.' },
  { kind: 'actorOwnership', priority: 'v0Required', defaultSeverity: 'error', requiresHostReviewByDefault: true, description: 'Member owns the actor they bind.' },
  { kind: 'actorSystemMatch', priority: 'v0Required', defaultSeverity: 'error', requiresHostReviewByDefault: false, description: 'Actor systemId matches the room.' },
  { kind: 'actorSourceAllowed', priority: 'v0Required', defaultSeverity: 'warning', requiresHostReviewByDefault: true, description: 'Actor source package is permitted.' },
  { kind: 'malformedData', priority: 'v0Required', defaultSeverity: 'error', requiresHostReviewByDefault: false, description: 'Actor data is not obviously malformed.' },

  { kind: 'actorVersionCompatible', priority: 'v1Recommended', defaultSeverity: 'warning', requiresHostReviewByDefault: true, description: 'Actor/source version compatible with the room.' },
  { kind: 'actorLevelAllowed', priority: 'v1Recommended', defaultSeverity: 'warning', requiresHostReviewByDefault: true, description: 'Actor level within the campaign range.' },
  { kind: 'duplicateActor', priority: 'v1Recommended', defaultSeverity: 'warning', requiresHostReviewByDefault: true, description: 'No duplicate of the same actor in the room.' },
  { kind: 'packageVersionCompatible', priority: 'v1Recommended', defaultSeverity: 'warning', requiresHostReviewByDefault: true, description: 'Loaded package version compatible.' },
  { kind: 'packageAllowed', priority: 'v1Recommended', defaultSeverity: 'warning', requiresHostReviewByDefault: true, description: 'Package is permitted on this server.' },

  { kind: 'custom', priority: 'future', defaultSeverity: 'info', requiresHostReviewByDefault: false, description: 'Reserved: deep rule legality / anti-cheat.' },
];
