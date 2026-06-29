/**
 * submitActorBinding service (Room Lobby scaffold, M15).
 *
 * AI-LANDMARK: ROOM_SERVER_SUBMIT_ACTOR_BINDING_V0
 *
 * Records a LIGHTWEIGHT pre-session actor binding SUMMARY for a member (not a
 * RuntimeActor / CampaignActorInstance — no actor library, no character vault,
 * no rules). Pre-session lobby state only. Minimal room/member existence checks;
 * NO real auth / permission engine. In-memory via the registry.
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
  RoomSystemId,
} from '../../src/lib/platform/roomTypes.js';

export interface SubmitActorBindingInput {
  roomId: string;
  memberId: string;
  actorRef: {
    systemId?: string;
    actorId?: string;
    displayName: string;
    source?: RoomActorBindingSource;
  };
}

export interface SubmitActorBindingResult {
  decision: 'submitted' | 'roomNotFound' | 'memberNotFound' | 'memberNotJoinable' | 'invalidActorRef';
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

  const member = room.members.find((m) => m.memberId === input.memberId);
  if (!member) return { decision: 'memberNotFound', message: `No member "${input.memberId}".` };
  if (member.status === 'kicked' || member.status === 'left') {
    return { decision: 'memberNotJoinable', message: `Member status is "${member.status}".` };
  }

  const displayName = (input.actorRef?.displayName ?? '').trim();
  if (!displayName) return { decision: 'invalidActorRef', message: 'actorRef.displayName is required.' };

  const now = new Date().toISOString();
  // Default the actor's systemId to the room's system (keeps it cross-system: the
  // room decides DND/COC/CP RED/custom, not this service).
  const systemId = (input.actorRef.systemId as RoomSystemId | undefined) ?? room.identity.systemId;
  const source: RoomActorBindingSource = input.actorRef.source ?? 'manualScaffold';

  const updated = registry.update(input.roomId, (current) => {
    const lobby = current.lobby ?? emptyLobby();
    const existing = lobby.actorBindings.find((b) => b.memberId === input.memberId);
    // Re-submitting replaces the previous binding (same bindingId) and resets it
    // to pendingHostApproval, clearing any prior review.
    const bindingId = existing?.bindingId ?? `binding_${randomUUID()}`;
    const nextBinding: RoomActorBindingSummary = {
      bindingId,
      memberId: input.memberId,
      actorRef: { systemId, actorId: input.actorRef.actorId, displayName, source },
      status: 'pendingHostApproval',
      submittedAt: now,
    };
    const actorBindings = existing
      ? lobby.actorBindings.map((b) => (b.memberId === input.memberId ? nextBinding : b))
      : [...lobby.actorBindings, nextBinding];
    return {
      ...current,
      lobby: { ...lobby, actorBindings },
      identity: { ...current.identity, updatedAt: now },
    };
  });

  const bindingId = updated?.lobby?.actorBindings.find((b) => b.memberId === input.memberId)?.bindingId;
  return { decision: 'submitted', room: updated, bindingId };
}
