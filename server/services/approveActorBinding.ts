/**
 * approveActorBinding service (Room Lobby scaffold, M15).
 *
 * AI-LANDMARK: ROOM_SERVER_APPROVE_ACTOR_BINDING_V0
 *
 * Marks a lobby actor binding summary approved. SCAFFOLD host action — NO real
 * auth / permission engine (reviewerMemberId is recorded, not verified). Does
 * NOT create a RuntimeActor / CampaignActorInstance and does NOT write back to
 * any actor library. In-memory via the registry.
 */

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';

export interface ApproveActorBindingInput {
  roomId: string;
  bindingId: string;
  reviewerMemberId?: string;
}

export interface ApproveActorBindingResult {
  decision: 'approved' | 'roomNotFound' | 'bindingNotFound' | 'memberNotFound' | 'memberNotActive';
  room?: RoomSnapshot;
  bindingId?: string;
  message?: string;
}

export function approveActorBinding(registry: RoomRegistry, input: ApproveActorBindingInput): ApproveActorBindingResult {
  const room = registry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };

  const binding = room.lobby?.actorBindings.find((b) => b.bindingId === input.bindingId);
  if (!binding) return { decision: 'bindingNotFound', message: `No binding "${input.bindingId}".` };

  // The binding's member must still be active — never approve a binding for a
  // kicked / left / disconnected / pendingApproval / invited member.
  const member = room.members.find((m) => m.memberId === binding.memberId);
  if (!member) return { decision: 'memberNotFound', message: `No member "${binding.memberId}".` };
  if (member.status !== 'active') {
    return { decision: 'memberNotActive', message: `Member status is "${member.status}".` };
  }

  const now = new Date().toISOString();
  const updated = registry.update(input.roomId, (current) => {
    const lobby = current.lobby ?? { actorBindings: [], readyStates: [] };
    return {
      ...current,
      lobby: {
        ...lobby,
        actorBindings: lobby.actorBindings.map((b) =>
          b.bindingId === input.bindingId
            ? { ...b, status: 'approved' as const, reviewedAt: now, reviewerMemberId: input.reviewerMemberId, rejectionReason: undefined }
            : b,
        ),
      },
      identity: { ...current.identity, updatedAt: now },
    };
  });

  return { decision: 'approved', room: updated, bindingId: input.bindingId };
}
