/**
 * joinRoom service (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_JOIN_ROOM_V0
 *
 * Resolves a join request against the registry and returns a RoomJoinResult.
 * No real auth, no reconnect-token verification, no actor binding.
 */
import { randomUUID } from 'node:crypto';
export function joinRoom(registry, request) {
    const key = request.inviteCodeOrRoomCode;
    const room = registry.getByCode(key) ?? registry.get(key);
    if (!room) {
        return { decision: 'invalidInvite', message: `No room found for "${key}".` };
    }
    const { lifecycleStatus } = room.identity;
    if (lifecycleStatus === 'closed' || lifecycleStatus === 'archived') {
        return { decision: 'roomClosed', roomId: room.identity.roomId };
    }
    if (room.joinApprovalMode === 'closed') {
        return { decision: 'roomClosed', roomId: room.identity.roomId };
    }
    const now = new Date().toISOString();
    // Joining never grants host; coerce a host request down to player.
    const role = request.requestedRole && request.requestedRole !== 'host' ? request.requestedRole : 'player';
    const autoApprove = room.joinApprovalMode === 'autoApproveWithInviteCode';
    const status = autoApprove ? 'active' : 'pendingApproval';
    const member = {
        memberId: `member_${randomUUID()}`,
        userId: request.userId,
        displayName: request.requestedDisplayName,
        role,
        status,
        joinedAt: now,
        lastSeenAt: now,
    };
    registry.update(room.identity.roomId, (current) => ({
        ...current,
        members: [...current.members, member],
        identity: { ...current.identity, updatedAt: now },
    }));
    if (autoApprove) {
        return {
            decision: 'accepted',
            roomId: room.identity.roomId,
            memberId: member.memberId,
            assignedRole: role,
        };
    }
    return {
        decision: 'pendingHostApproval',
        roomId: room.identity.roomId,
        memberId: member.memberId,
        assignedRole: role,
        requiresHostApproval: true,
    };
}
