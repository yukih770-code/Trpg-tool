/** Rebuilds the live ActorAdmission index from a validated durable Room snapshot. */

import type { ActorAdmissionRegistry } from '../actor-admission-registry.js';
import type { ActorAdmissionRecord, ActorSnapshotHash, RoomSnapshot } from '../protocol/room-protocol.js';

export interface RestoreRoomActorAdmissionsResult {
  restoredCount: number;
  skippedCount: number;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function validSnapshotHash(value: unknown): value is ActorSnapshotHash {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const hash = value as Partial<ActorSnapshotHash>;
  return hash.algorithm === 'sha256'
    && typeof hash.value === 'string'
    && /^[a-f0-9]{64}$/i.test(hash.value)
    && Number.isSafeInteger(hash.schemaVersion)
    && (hash.schemaVersion as number) > 0
    && Array.isArray(hash.coveredFieldTiers)
    && hash.coveredFieldTiers.includes('clearanceRelevant')
    && validTimestamp(hash.computedAt);
}

/**
 * Room metadata is the durable authority for this v0 clearance pipeline. Only
 * complete, server-shaped records are restored; malformed summaries stay
 * unavailable instead of silently granting admission.
 */
export function restoreRoomActorAdmissions(
  room: RoomSnapshot,
  admissions: ActorAdmissionRegistry,
): RestoreRoomActorAdmissionsResult {
  let restoredCount = 0;
  let skippedCount = 0;
  const campaignId = room.campaignRef?.campaignId ?? room.identity.campaignId;

  for (const binding of room.lobby?.actorBindings ?? []) {
    const clearance = binding.clearance;
    const member = room.members.find((candidate) => candidate.memberId === binding.memberId);
    const admissionId = clearance?.admissionId?.trim();
    const status = clearance?.status;
    const completeApproval = status !== 'approved' || (clearance !== undefined &&
      typeof clearance.snapshotId === 'string'
      && clearance.snapshotId.trim() !== ''
      && validSnapshotHash(clearance.snapshotHash)
      && typeof clearance.inspectionResultId === 'string'
      && clearance.inspectionResultId.trim() !== ''
    );
    if (
      !campaignId
      || !member
      || !admissionId
      || !clearance
      || !status
      || status === 'notSubmitted'
      || !['pending', 'approved', 'rejected', 'stale'].includes(status)
      || !validTimestamp(clearance.updatedAt)
      || !completeApproval
    ) {
      if (clearance?.admissionId) skippedCount += 1;
      continue;
    }
    if (admissions.get(admissionId)) {
      skippedCount += 1;
      continue;
    }
    const createdAt = validTimestamp(binding.submittedAt) ? binding.submittedAt : clearance.updatedAt;
    const record: ActorAdmissionRecord = {
      admissionId,
      campaignId,
      ...(room.identity.sessionId ? { runtimeSessionId: room.identity.sessionId } : {}),
      roomId: room.identity.roomId,
      memberId: binding.memberId,
      ...(binding.actorRef.actorId ? { sourceActorId: binding.actorRef.actorId } : {}),
      ...(clearance.snapshotId ? { approvedSnapshotId: clearance.snapshotId } : {}),
      ...(clearance.snapshotHash ? { approvedSnapshotHash: clearance.snapshotHash } : {}),
      status,
      ...(clearance.inspectionResultId ? { inspectionResultId: clearance.inspectionResultId } : {}),
      ...(binding.reviewerMemberId ? { decidedByMemberId: binding.reviewerMemberId } : {}),
      ...(binding.reviewedAt ? { decidedAt: binding.reviewedAt } : {}),
      ...(binding.rejectionReason ? { reason: binding.rejectionReason } : {}),
      createdAt,
      updatedAt: clearance.updatedAt,
    };
    admissions.create(record, binding.bindingId);
    restoredCount += 1;
  }

  return { restoredCount, skippedCount };
}
