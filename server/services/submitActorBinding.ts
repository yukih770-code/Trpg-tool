/**
 * submitActorBinding service (Room Lobby scaffold, M15 / M15.2).
 *
 * AI-LANDMARK: ROOM_SERVER_SUBMIT_ACTOR_BINDING_V0
 *
 * Records a LIGHTWEIGHT pre-session actor binding SUMMARY for a member (not a
 * RuntimeActor / CampaignActorInstance — it stores no full Actor Vault payload
 * and no rules). Persisted actor ids are canonicalized by the HTTP boundary
 * before this service runs. Pre-session lobby state only.
 *
 * Invariants (M15.2): only ACTIVE members may submit; actorRef.source must be a
 * known enum; actorRef.systemId (if given) must match the room's system (no
 * cross-system binding in v0); and re-submitting resets the binding to
 * pendingHostApproval AND clears that member's ready flag (ready may only stand
 * on an approved binding). In-memory via the registry.
 */

import { randomUUID } from 'node:crypto';

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';
// Lobby summary types live in the platform layer; imported directly here (same
// pattern the transport layer uses) so room-protocol.ts stays untouched.
import type {
  RoomActorBindingSource,
  RoomActorBindingSummary,
  RoomLobbyState,
  RoomMemberReadyState,
  RoomPersonalContentReferenceSummary,
  RoomSystemId,
} from '../../src/lib/platform/roomTypes.js';
import { normalizeCharacterClearanceDetails } from '../../src/lib/platform/characterClearanceDetails.js';

const VALID_SOURCES: readonly RoomActorBindingSource[] = ['localActorVault', 'quickDraft', 'manualScaffold', 'imported', 'unknown'];

export interface SubmitActorBindingInput {
  roomId: string;
  memberId: string;
  actorRef: {
    systemId?: string;
    actorId?: string;
    displayName: string;
    source?: string;
    summary?: string;
    hpCurrent?: number;
    hpMax?: number;
    armorClass?: number;
    details?: unknown;
    contentReferences?: RoomPersonalContentReferenceSummary[];
  };
}

export interface SubmitActorBindingResult {
  decision: 'submitted' | 'roomNotFound' | 'roomClosed' | 'memberNotFound' | 'memberNotActive' | 'invalidActorRef' | 'systemMismatch';
  room?: RoomSnapshot;
  bindingId?: string;
  message?: string;
}

function emptyLobby(): RoomLobbyState {
  return { actorBindings: [], readyStates: [] };
}

export function submitActorBinding(registry: RoomRegistry, input: SubmitActorBindingInput): SubmitActorBindingResult {
  const room = registry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
  if (room.identity.lifecycleStatus === 'closed' || room.identity.lifecycleStatus === 'archived') {
    return { decision: 'roomClosed', message: 'The room is closed.' };
  }

  const member = room.members.find((m) => m.memberId === input.memberId);
  if (!member) return { decision: 'memberNotFound', message: `No member "${input.memberId}".` };
  // Only active members may submit. UI hides the entry for non-active members,
  // but HTTP could bypass it — enforce here.
  if (member.status !== 'active') {
    return { decision: 'memberNotActive', message: `Member status is "${member.status}".` };
  }

  const displayName = (input.actorRef?.displayName ?? '').trim();
  if (!displayName) return { decision: 'invalidActorRef', message: 'actorRef.displayName is required.' };

  // Validate source enum — reject unknown values rather than letting dirty data
  // into the roomSnapshot.
  const rawSource = input.actorRef.source;
  if (rawSource !== undefined && !VALID_SOURCES.includes(rawSource as RoomActorBindingSource)) {
    return { decision: 'invalidActorRef', message: `Invalid actorRef.source "${rawSource}".` };
  }
  const source: RoomActorBindingSource = (rawSource as RoomActorBindingSource | undefined) ?? 'manualScaffold';

  // systemId: default to the room's system; if provided it MUST match (no
  // cross-system binding in v0 — compared against this room only, not hardcoded).
  const roomSystemId = room.identity.systemId;
  if (input.actorRef.systemId !== undefined && input.actorRef.systemId !== roomSystemId) {
    return {
      decision: 'systemMismatch',
      message: `actorRef.systemId "${input.actorRef.systemId}" does not match room system "${roomSystemId}".`,
    };
  }
  const systemId: RoomSystemId = roomSystemId;

  const now = new Date().toISOString();

  const updated = registry.update(input.roomId, (current) => {
    const lobby = current.lobby ?? emptyLobby();
    const existing = lobby.actorBindings.find((b) => b.memberId === input.memberId);
    // Re-submitting replaces the previous binding (same bindingId) and resets it
    // to pendingHostApproval, clearing any prior review.
    const bindingId = existing?.bindingId ?? `binding_${randomUUID()}`;
    const nextBinding: RoomActorBindingSummary = {
      bindingId,
      memberId: input.memberId,
      actorRef: {
        systemId,
        actorId: input.actorRef.actorId?.trim() || undefined,
        displayName,
        source,
        summary: input.actorRef.summary?.trim() || undefined,
        hpCurrent: Number.isFinite(input.actorRef.hpCurrent) ? input.actorRef.hpCurrent : undefined,
        hpMax: Number.isFinite(input.actorRef.hpMax) ? input.actorRef.hpMax : undefined,
        armorClass: Number.isFinite(input.actorRef.armorClass) ? input.actorRef.armorClass : undefined,
        details: normalizeCharacterClearanceDetails(input.actorRef.details),
        contentReferences: input.actorRef.contentReferences?.length ? input.actorRef.contentReferences : undefined,
      },
      status: 'pendingHostApproval',
      submittedAt: now,
      // Reset clearance on (re)submit: a stale prior approval must NOT let the
      // member ready-up until this new submission is cleared again (M24.2b).
      clearance: { status: 'notSubmitted', updatedAt: now },
    };
    const actorBindings = existing
      ? lobby.actorBindings.map((b) => (b.memberId === input.memberId ? nextBinding : b))
      : [...lobby.actorBindings, nextBinding];

    // Invariant: a (re)submitted binding is pendingHostApproval, so the member
    // must NOT remain ready. Upsert ready state to notReady for this member only.
    const notReady: RoomMemberReadyState = { memberId: input.memberId, status: 'notReady', updatedAt: now };
    const hasReady = lobby.readyStates.some((r) => r.memberId === input.memberId);
    const readyStates = hasReady
      ? lobby.readyStates.map((r) => (r.memberId === input.memberId ? notReady : r))
      : [...lobby.readyStates, notReady];

    return {
      ...current,
      lobby: { ...lobby, actorBindings, readyStates },
      identity: { ...current.identity, updatedAt: now },
    };
  });

  const bindingId = updated?.lobby?.actorBindings.find((b) => b.memberId === input.memberId)?.bindingId;
  return { decision: 'submitted', room: updated, bindingId };
}
