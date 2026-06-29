/**
 * Client intent protocol contracts (v0, types only).
 *
 * AI-LANDMARK: CLIENT_INTENT_PROTOCOL_CONTRACTS_V0
 *
 * These are platform-level client intent contracts for the portable Room Server
 * model. They describe messages a client may submit to the Room Server for
 * validation and execution. They do not implement networking, validation,
 * permissions, rule resolution, Runtime mutation, logging, storage, or UI.
 *
 * Principle: the client never mutates authoritative state — it submits an
 * intent; the Room Server validates (member/role/binding/permission/session/
 * rules), applies, logs, and broadcasts projected results. This module imports
 * nothing and stays platform-neutral (no DND/COC/CP RED rules). `runtime.attack`
 * and `runtime.castSpell.placeholder` are protocol kinds only; rule resolution
 * lives in the system resolver / M4 runtime sync.
 */

export type ClientIntentKind =
  | 'room.join'
  | 'room.leave'
  | 'room.reconnect'
  | 'room.selectActor'
  | 'room.bindActor'
  | 'room.requestActorBindingApproval'

  | 'token.move'
  | 'token.ping'
  | 'token.setVisibility'

  | 'dice.roll'

  | 'runtime.attack'
  | 'runtime.castSpell.placeholder'
  | 'runtime.updateHp'
  | 'runtime.applyCondition'
  | 'runtime.removeCondition'
  | 'runtime.endTurn'
  | 'runtime.setInitiative'
  | 'runtime.manualOverride'

  | 'scene.change'
  | 'handout.publish'
  | 'media.cue.placeholder'
  | 'trigger.fire.placeholder'

  | 'log.appendPublic'
  | 'log.appendHostOnly'

  | 'chat.message'
  | 'custom';

export type ClientIntentAuthorityPolicy =
  | 'hostOnly'
  | 'playerAllowed'
  | 'spectatorAllowed'
  | 'serverOnly'
  | 'futurePlaceholder';

export type ClientIntentApprovalPolicy =
  | 'serverValidated'
  | 'hostConfirmRequired'
  | 'autoAcceptedIfValid'
  | 'alwaysRejectedInV0'
  | 'futurePlaceholder';

export type ClientIntentExecutionLane =
  | 'room'
  | 'map'
  | 'dice'
  | 'runtime'
  | 'scene'
  | 'handout'
  | 'media'
  | 'trigger'
  | 'log'
  | 'chat'
  | 'custom';

/** Generic envelope; payload stays `unknown` (no serialization/transport here). */
export interface ClientIntentEnvelope {
  intentId: string;
  kind: ClientIntentKind;
  roomId: string;
  sessionId?: string;
  memberId: string;
  actorId?: string;
  targetId?: string;
  clientSeq?: number;
  createdAt?: string;
  payload?: unknown;
}

/** Static metadata for routing/permission/audit. NOT a permission engine. */
export interface ClientIntentDefinition {
  kind: ClientIntentKind;
  lane: ClientIntentExecutionLane;
  authorityPolicy: ClientIntentAuthorityPolicy;
  approvalPolicy: ClientIntentApprovalPolicy;
  requiresActorBinding?: boolean;
  requiresActiveSession?: boolean;
  requiresHostReview?: boolean;
  isPlaceholder?: boolean;
  description?: string;
}

export const CLIENT_INTENT_DEFINITIONS: ClientIntentDefinition[] = [
  // ── room ──
  { kind: 'room.join', lane: 'room', authorityPolicy: 'playerAllowed', approvalPolicy: 'hostConfirmRequired', requiresActiveSession: false, requiresHostReview: true, description: 'Request to join a room.' },
  { kind: 'room.leave', lane: 'room', authorityPolicy: 'playerAllowed', approvalPolicy: 'autoAcceptedIfValid', description: 'Leave the room.' },
  { kind: 'room.reconnect', lane: 'room', authorityPolicy: 'playerAllowed', approvalPolicy: 'serverValidated', description: 'Reconnect to an existing membership.' },
  { kind: 'room.selectActor', lane: 'room', authorityPolicy: 'playerAllowed', approvalPolicy: 'serverValidated', description: 'Select the actor this member controls.' },
  { kind: 'room.bindActor', lane: 'room', authorityPolicy: 'playerAllowed', approvalPolicy: 'hostConfirmRequired', requiresHostReview: true, description: 'Bind an owned actor to this room.' },
  { kind: 'room.requestActorBindingApproval', lane: 'room', authorityPolicy: 'playerAllowed', approvalPolicy: 'hostConfirmRequired', requiresHostReview: true, description: 'Ask the host to approve an actor binding.' },

  // ── map / token ──
  { kind: 'token.move', lane: 'map', authorityPolicy: 'playerAllowed', approvalPolicy: 'serverValidated', requiresActiveSession: true, description: 'Move an owned token (server validates ownership).' },
  { kind: 'token.ping', lane: 'map', authorityPolicy: 'playerAllowed', approvalPolicy: 'serverValidated', description: 'Ping/marker on the map.' },
  { kind: 'token.setVisibility', lane: 'map', authorityPolicy: 'hostOnly', approvalPolicy: 'serverValidated', description: 'Set token visibility (host only).' },

  // ── dice ──
  { kind: 'dice.roll', lane: 'dice', authorityPolicy: 'playerAllowed', approvalPolicy: 'serverValidated', description: 'Roll dice.' },

  // ── runtime ──
  { kind: 'runtime.attack', lane: 'runtime', authorityPolicy: 'playerAllowed', approvalPolicy: 'hostConfirmRequired', requiresActorBinding: true, requiresActiveSession: true, requiresHostReview: true, description: 'Declare an attack (rule resolution server-side).' },
  { kind: 'runtime.castSpell.placeholder', lane: 'runtime', authorityPolicy: 'futurePlaceholder', approvalPolicy: 'futurePlaceholder', isPlaceholder: true, description: 'Reserved: cast a spell (not implemented).' },
  { kind: 'runtime.updateHp', lane: 'runtime', authorityPolicy: 'playerAllowed', approvalPolicy: 'hostConfirmRequired', requiresActiveSession: true, requiresHostReview: true, description: 'Adjust HP (host confirm; host may also do directly).' },
  { kind: 'runtime.applyCondition', lane: 'runtime', authorityPolicy: 'playerAllowed', approvalPolicy: 'hostConfirmRequired', requiresActiveSession: true, requiresHostReview: true, description: 'Apply a condition.' },
  { kind: 'runtime.removeCondition', lane: 'runtime', authorityPolicy: 'playerAllowed', approvalPolicy: 'hostConfirmRequired', requiresActiveSession: true, requiresHostReview: true, description: 'Remove a condition.' },
  { kind: 'runtime.endTurn', lane: 'runtime', authorityPolicy: 'playerAllowed', approvalPolicy: 'serverValidated', requiresActiveSession: true, description: 'End the current turn (server validates whose turn).' },
  { kind: 'runtime.setInitiative', lane: 'runtime', authorityPolicy: 'hostOnly', approvalPolicy: 'serverValidated', requiresActiveSession: true, description: 'Set/reorder initiative (host only).' },
  { kind: 'runtime.manualOverride', lane: 'runtime', authorityPolicy: 'hostOnly', approvalPolicy: 'serverValidated', requiresActiveSession: true, description: 'Host manual override of a result/state.' },

  // ── scene / handout / media / trigger ──
  { kind: 'scene.change', lane: 'scene', authorityPolicy: 'hostOnly', approvalPolicy: 'serverValidated', description: 'Change the active scene (host only).' },
  { kind: 'handout.publish', lane: 'handout', authorityPolicy: 'hostOnly', approvalPolicy: 'serverValidated', description: 'Publish a handout to players (host only).' },
  { kind: 'media.cue.placeholder', lane: 'media', authorityPolicy: 'futurePlaceholder', approvalPolicy: 'futurePlaceholder', isPlaceholder: true, description: 'Reserved: media cue (not implemented).' },
  { kind: 'trigger.fire.placeholder', lane: 'trigger', authorityPolicy: 'futurePlaceholder', approvalPolicy: 'futurePlaceholder', isPlaceholder: true, description: 'Reserved: fire a prep trigger (not implemented).' },

  // ── log ──
  { kind: 'log.appendPublic', lane: 'log', authorityPolicy: 'playerAllowed', approvalPolicy: 'serverValidated', description: 'Append a public log entry (server validates).' },
  { kind: 'log.appendHostOnly', lane: 'log', authorityPolicy: 'hostOnly', approvalPolicy: 'serverValidated', description: 'Append a host-only log entry (host only).' },

  // ── chat ──
  { kind: 'chat.message', lane: 'chat', authorityPolicy: 'playerAllowed', approvalPolicy: 'serverValidated', description: 'Send a chat message.' },

  { kind: 'custom', lane: 'custom', authorityPolicy: 'futurePlaceholder', approvalPolicy: 'futurePlaceholder', isPlaceholder: true, description: 'Reserved: custom intent.' },
];

// ── Minimal payload types (platform-neutral; no system rules) ───────────────

export interface JoinRoomIntentPayload {
  inviteCodeOrRoomCode: string;
  requestedDisplayName: string;
  requestedRole?: 'host' | 'player' | 'spectator';
  userId?: string;
}

export interface SelectActorIntentPayload {
  actorId: string;
  bindingId?: string;
}

export interface MoveTokenIntentPayload {
  tokenId: string;
  x: number;
  y: number;
  mapId?: string;
  reason?: string;
}

export interface RollDiceIntentPayload {
  expression: string;
  label?: string;
  visibility?: 'public' | 'hostOnly' | 'private';
}

export interface AttackIntentPayload {
  attackerActorId: string;
  targetActorId: string;
  actionId?: string;
  itemId?: string;
  manualRollTotal?: number;
  note?: string;
}

export interface UpdateHpIntentPayload {
  actorId: string;
  delta?: number;
  setTo?: number;
  reason?: string;
}

export interface ApplyConditionIntentPayload {
  actorId: string;
  conditionId: string;
  label?: string;
  durationHint?: string;
  reason?: string;
}

export interface ChatMessageIntentPayload {
  channel: 'public' | 'hostOnly' | 'private';
  message: string;
}

export interface PublishHandoutIntentPayload {
  handoutId: string;
  targetMemberIds?: string[];
  note?: string;
}

export interface SceneChangeIntentPayload {
  sceneId: string;
  note?: string;
}

// ── Intent result / rejection (server outcome description, not execution) ───

export type ClientIntentDecision =
  | 'accepted'
  | 'pendingHostConfirm'
  | 'rejected'
  | 'ignoredDuplicate'
  | 'invalidPayload'
  | 'unauthorized'
  | 'requiresActiveSession'
  | 'requiresActorBinding'
  | 'futurePlaceholder';

export interface ClientIntentResult {
  intentId: string;
  kind: ClientIntentKind;
  decision: ClientIntentDecision;
  roomId?: string;
  memberId?: string;
  message?: string;
  warnings?: string[];
  acceptedAt?: string;
  serverSeq?: number;
}

// ── Pending host-confirm queue (description only; no UI) ────────────────────

export interface PendingHostConfirmIntent {
  intent: ClientIntentEnvelope;
  requestedByMemberId: string;
  requestedAt?: string;
  reason?: string;
  expiresAt?: string;
}

export type HostConfirmDecision = 'approved' | 'rejected' | 'modified';

export interface HostConfirmResult {
  intentId: string;
  decision: HostConfirmDecision;
  decidedByMemberId: string;
  decidedAt?: string;
  note?: string;
}
