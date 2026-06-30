/**
 * approveActorBinding service (Room Lobby, M15 / clearance-aware M24.2b).
 *
 * AI-LANDMARK: ROOM_SERVER_APPROVE_ACTOR_BINDING_V0
 *
 * Host approves a lobby actor binding. M24.2b makes it clearance-aware: it builds
 * a synthetic ActorSnapshot from the binding's actorRef, computes a server-side
 * hash, runs the inspection stub, creates an ActorAdmissionRecord, and writes a
 * `binding.clearance` summary. The lobby `binding.status` enum is unchanged.
 *
 * Still SCAFFOLD: no real rules engine, no AI, no RuntimeActor / actor-store
 * writes. reviewerMemberId, when provided, must be an active host (best-effort).
 */

import { randomUUID } from 'node:crypto';

import type { RoomRegistry } from '../room-registry.js';
import type { ActorAdmissionRegistry } from '../actor-admission-registry.js';
import type { ActorAdmissionRecord, RoomSnapshot } from '../protocol/room-protocol.js';
import { createSyntheticActorSnapshot, hashActorSnapshot, inspectActorSnapshot } from './characterClearance.js';

export interface ApproveActorBindingInput {
  roomId: string;
  bindingId: string;
  reviewerMemberId?: string;
}

export interface ApproveActorBindingResult {
  decision:
    | 'approved'
    | 'roomNotFound'
    | 'bindingNotFound'
    | 'memberNotFound'
    | 'memberNotActive'
    | 'reviewerNotFound'
    | 'reviewerNotActive'
    | 'reviewerNotHost';
  room?: RoomSnapshot;
  bindingId?: string;
  admissionId?: string;
  message?: string;
}

export function approveActorBinding(
  registry: RoomRegistry,
  admissions: ActorAdmissionRegistry,
  input: ApproveActorBindingInput,
): ApproveActorBindingResult {
  const room = registry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };

  // If a reviewer is named, it must be an active host (best-effort; not real auth).
  if (input.reviewerMemberId !== undefined) {
    const reviewer = room.members.find((m) => m.memberId === input.reviewerMemberId);
    if (!reviewer) return { decision: 'reviewerNotFound', message: `No reviewer "${input.reviewerMemberId}".` };
    if (reviewer.status !== 'active') return { decision: 'reviewerNotActive', message: `Reviewer status is "${reviewer.status}".` };
    if (reviewer.role !== 'host') return { decision: 'reviewerNotHost', message: 'Reviewer must be a host.' };
  }

  const binding = room.lobby?.actorBindings.find((b) => b.bindingId === input.bindingId);
  if (!binding) return { decision: 'bindingNotFound', message: `No binding "${input.bindingId}".` };

  // The binding's member must still be active.
  const member = room.members.find((m) => m.memberId === binding.memberId);
  if (!member) return { decision: 'memberNotFound', message: `No member "${binding.memberId}".` };
  if (member.status !== 'active') {
    return { decision: 'memberNotActive', message: `Member status is "${member.status}".` };
  }

  // Clearance pipeline (deterministic, v0): synthetic snapshot -> hash -> inspect.
  const campaignId = room.campaignRef?.campaignId ?? room.identity.campaignId ?? '';
  const snapshot = createSyntheticActorSnapshot(binding.actorRef);
  const snapshotHash = hashActorSnapshot(snapshot);
  const inspection = inspectActorSnapshot(snapshot, campaignId);
  // v0: inspection always passes -> approved. No needsHostReview branch yet.

  const now = new Date().toISOString();
  const admission: ActorAdmissionRecord = {
    admissionId: `admission_${randomUUID()}`,
    campaignId,
    roomId: input.roomId,
    memberId: binding.memberId,
    sourceActorId: binding.actorRef.actorId,
    approvedSnapshotId: snapshot.snapshotId,
    approvedSnapshotHash: snapshotHash,
    status: 'approved',
    inspectionResultId: inspection.inspectionResultId,
    decidedByMemberId: input.reviewerMemberId,
    decidedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  admissions.create(admission, binding.bindingId);

  const updated = registry.update(input.roomId, (current) => {
    const lobby = current.lobby ?? { actorBindings: [], readyStates: [] };
    return {
      ...current,
      lobby: {
        ...lobby,
        actorBindings: lobby.actorBindings.map((b) =>
          b.bindingId === input.bindingId
            ? {
                ...b,
                status: 'approved' as const,
                reviewedAt: now,
                reviewerMemberId: input.reviewerMemberId,
                rejectionReason: undefined,
                clearance: {
                  admissionId: admission.admissionId,
                  status: 'approved' as const,
                  snapshotId: snapshot.snapshotId,
                  snapshotHash,
                  inspectionResultId: inspection.inspectionResultId,
                  updatedAt: now,
                },
              }
            : b,
        ),
      },
      identity: { ...current.identity, updatedAt: now },
    };
  });

  return { decision: 'approved', room: updated, bindingId: input.bindingId, admissionId: admission.admissionId };
}
