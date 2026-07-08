/**
 * rejectActorBinding service (Room Lobby scaffold, M15).
 *
 * AI-LANDMARK: ROOM_SERVER_REJECT_ACTOR_BINDING_V0
 *
 * Marks a lobby actor binding summary rejected. SCAFFOLD host action — NO real
 * auth / permission engine. As a consistency guard, the member's ready flag is
 * cleared to notReady (a rejected binding must not leave the member "ready").
 * In-memory via the registry; no Runtime, no actor library writes.
 */
export function rejectActorBinding(registry, admissions, input) {
    const room = registry.get(input.roomId);
    if (!room)
        return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
    const binding = room.lobby?.actorBindings.find((b) => b.bindingId === input.bindingId);
    if (!binding)
        return { decision: 'bindingNotFound', message: `No binding "${input.bindingId}".` };
    // The binding's member must exist. Reject is intentionally lenient on member
    // STATUS (it doubles as cleanup, e.g. for a member who has since
    // disconnected/left) — and it always clears ready, so no invariant breaks.
    const member = room.members.find((m) => m.memberId === binding.memberId);
    if (!member)
        return { decision: 'memberNotFound', message: `No member "${binding.memberId}".` };
    const now = new Date().toISOString();
    const memberId = binding.memberId;
    // Preserve audit trail: mark any existing admission rejected rather than delete.
    const existingAdmissionId = binding.clearance?.admissionId;
    if (existingAdmissionId) {
        admissions.update(existingAdmissionId, (rec) => ({ ...rec, status: 'rejected', reason: input.rejectionReason, updatedAt: now }));
    }
    const updated = registry.update(input.roomId, (current) => {
        const lobby = current.lobby ?? { actorBindings: [], readyStates: [] };
        return {
            ...current,
            lobby: {
                ...lobby,
                actorBindings: lobby.actorBindings.map((b) => b.bindingId === input.bindingId
                    ? {
                        ...b,
                        status: 'rejected',
                        reviewedAt: now,
                        reviewerMemberId: input.reviewerMemberId,
                        rejectionReason: input.rejectionReason,
                        clearance: {
                            admissionId: existingAdmissionId,
                            status: 'rejected',
                            snapshotId: b.clearance?.snapshotId,
                            snapshotHash: b.clearance?.snapshotHash,
                            inspectionResultId: b.clearance?.inspectionResultId,
                            updatedAt: now,
                        },
                    }
                    : b),
                // Consistency guard: a rejected binding can no longer be "ready".
                readyStates: lobby.readyStates.map((r) => r.memberId === memberId ? { ...r, status: 'notReady', updatedAt: now } : r),
            },
            identity: { ...current.identity, updatedAt: now },
        };
    });
    return { decision: 'rejected', room: updated, bindingId: input.bindingId };
}
