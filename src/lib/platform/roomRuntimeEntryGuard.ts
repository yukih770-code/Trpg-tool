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
import { isRoomClosed } from './roomLifecycle';

export function evaluateRoomRuntimeEntryEligibility(
  room: RoomSnapshot | undefined,
  currentMemberId: string | undefined,
): RoomRuntimeEntryEligibility {
  if (!room) return { canEnter: false, reason: 'roomMissing' };
  if (isRoomClosed(room)) return { canEnter: false, reason: 'roomClosed' };

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
  // their own; include binding/ready/admission info opportunistically if present.
  if (member.role === 'host') {
    const hostClearance = approvedBinding?.clearance;
    return {
      canEnter: true,
      entryMode: 'hostPreview',
      approvedActorBindingId: approvedBinding?.bindingId,
      admissionId: hostClearance?.status === 'approved' ? hostClearance.admissionId : undefined,
      actorRef: approvedBinding?.actorRef,
      readyState,
    };
  }

  // Player (v0): requires an approved binding, an approved clearance/admission,
  // AND ready. This is the client/entry display gate; the authoritative ready
  // gate already runs server-side (M24.2b). Judged only from the RoomSnapshot's
  // clearance summary — no server admission registry call here.
  if (!binding) return { canEnter: false, reason: 'actorBindingMissing' };
  if (binding.status !== 'approved') return { canEnter: false, reason: 'actorBindingNotApproved' };

  const clearance = binding.clearance;
  if (!clearance || clearance.status === 'notSubmitted' || clearance.status === 'pending') {
    return { canEnter: false, reason: 'actorNotAdmitted' };
  }
  if (clearance.status === 'rejected') return { canEnter: false, reason: 'actorAdmissionRejected' };
  if (clearance.status === 'stale') return { canEnter: false, reason: 'actorAdmissionStale' };
  // status === 'approved'
  if (!clearance.admissionId) return { canEnter: false, reason: 'actorNotAdmitted' };

  if (readyState !== 'ready') return { canEnter: false, reason: 'memberNotReady' };

  return {
    canEnter: true,
    entryMode: 'playerReady',
    approvedActorBindingId: binding.bindingId,
    admissionId: clearance.admissionId,
    actorRef: binding.actorRef,
    readyState,
  };
}
