/**
 * submitActorBinding service (Room Lobby scaffold, M15 / M15.2).
 *
 * AI-LANDMARK: ROOM_SERVER_SUBMIT_ACTOR_BINDING_V0
 *
 * Records a LIGHTWEIGHT pre-session actor binding SUMMARY for a member (not a
 * RuntimeActor / CampaignActorInstance — no actor library, no character vault,
 * no rules). Pre-session lobby state only. NO real auth / permission engine.
 *
 * Invariants (M15.2): only ACTIVE members may submit; actorRef.source must be a
 * known enum; actorRef.systemId (if given) must match the room's system (no
 * cross-system binding in v0); and re-submitting resets the binding to
 * pendingHostApproval AND clears that member's ready flag (ready may only stand
 * on an approved binding). In-memory via the registry.
 */
import { randomUUID } from 'node:crypto';
const VALID_SOURCES = ['localActorVault', 'manualScaffold', 'imported', 'unknown'];
function emptyLobby() {
    return { actorBindings: [], readyStates: [] };
}
export function submitActorBinding(registry, input) {
    const room = registry.get(input.roomId);
    if (!room)
        return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
    const member = room.members.find((m) => m.memberId === input.memberId);
    if (!member)
        return { decision: 'memberNotFound', message: `No member "${input.memberId}".` };
    // Only active members may submit. UI hides the entry for non-active members,
    // but HTTP could bypass it — enforce here.
    if (member.status !== 'active') {
        return { decision: 'memberNotActive', message: `Member status is "${member.status}".` };
    }
    const displayName = (input.actorRef?.displayName ?? '').trim();
    if (!displayName)
        return { decision: 'invalidActorRef', message: 'actorRef.displayName is required.' };
    // Validate source enum — reject unknown values rather than letting dirty data
    // into the roomSnapshot.
    const rawSource = input.actorRef.source;
    if (rawSource !== undefined && !VALID_SOURCES.includes(rawSource)) {
        return { decision: 'invalidActorRef', message: `Invalid actorRef.source "${rawSource}".` };
    }
    const source = rawSource ?? 'manualScaffold';
    // systemId: default to the room's system; if provided it MUST match (no
    // cross-system binding in v0 — compared against this room only, not hardcoded).
    const roomSystemId = room.identity.systemId;
    if (input.actorRef.systemId !== undefined && input.actorRef.systemId !== roomSystemId) {
        return {
            decision: 'systemMismatch',
            message: `actorRef.systemId "${input.actorRef.systemId}" does not match room system "${roomSystemId}".`,
        };
    }
    const systemId = roomSystemId;
    const now = new Date().toISOString();
    const updated = registry.update(input.roomId, (current) => {
        const lobby = current.lobby ?? emptyLobby();
        const existing = lobby.actorBindings.find((b) => b.memberId === input.memberId);
        // Re-submitting replaces the previous binding (same bindingId) and resets it
        // to pendingHostApproval, clearing any prior review.
        const bindingId = existing?.bindingId ?? `binding_${randomUUID()}`;
        const nextBinding = {
            bindingId,
            memberId: input.memberId,
            actorRef: { systemId, actorId: input.actorRef.actorId, displayName, source },
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
        const notReady = { memberId: input.memberId, status: 'notReady', updatedAt: now };
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
