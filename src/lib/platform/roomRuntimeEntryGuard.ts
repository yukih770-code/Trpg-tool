/**
 * Room Runtime Entry guard (v0, pure).
 *
 * AI-LANDMARK: ROOM_RUNTIME_ENTRY_GUARD_V0
 *
 * Pure eligibility function: given a RoomSnapshot and the current memberId, decide
 * whether that member may open the read-only Runtime Entry Preview, and in which
 * mode. NO store / file / network access, NO RuntimeActor / CampaignActorInstance
 * creation. roomCode and Host role here are NOT treated as real auth — this is a
 * scaffold-stage gate only. System-agnostic.
 */

import type { RoomSnapshot } from './roomTypes';
import type { RoomRuntimeEntryEligibility } from './roomRuntimeEntryTypes';

export function evaluateRoomRuntimeEntryEligibility(
  room: RoomSnapshot | undefined,
  currentMemberId: string | undefined,
): RoomRuntimeEntryEligibility {
  if (!room) return { canEnter: false, reason: 'roomMissing' };

  if (!currentMemberId) return { canEnter: false, reason: 'memberMissing' };
  const member = room.members.find((m) => m.memberId === currentMemberId);
  if (!member) return { canEnter: false, reason: 'memberMissing' };

  // All roles must be active to enter any preview.
  if (member.status !== 'active') return { canEnter: false, reason: 'memberNotActive' };

  // The member's lobby actor binding + ready state (if any).
  const binding = room.lobby?.actorBindings.find((b) => b.memberId === currentMemberId);
  const readyState = room.lobby?.readyStates.find((r) => r.memberId === currentMemberId)?.status;
  const approvedBinding = binding && binding.status === 'approved' ? binding : undefined;

  // Spectator (v0): an active spectator gets a read-only spectator preview.
  if (member.role === 'spectator') {
    return { canEnter: true, entryMode: 'spectatorPreview' };
  }

  // Host (v0): an active host may open hostPreview without an actor binding of
  // their own; include binding/ready info opportunistically if present.
  if (member.role === 'host') {
    return {
      canEnter: true,
      entryMode: 'hostPreview',
      approvedActorBindingId: approvedBinding?.bindingId,
      actorRef: approvedBinding?.actorRef,
      readyState,
    };
  }

  // Player (v0): requires an approved actor binding AND ready.
  if (!binding) return { canEnter: false, reason: 'actorBindingMissing' };
  if (binding.status !== 'approved') return { canEnter: false, reason: 'actorBindingNotApproved' };
  if (readyState !== 'ready') return { canEnter: false, reason: 'memberNotReady' };

  return {
    canEnter: true,
    entryMode: 'playerReady',
    approvedActorBindingId: binding.bindingId,
    actorRef: binding.actorRef,
    readyState,
  };
}
