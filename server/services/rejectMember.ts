/**
 * rejectMember service (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_REJECT_MEMBER_V0
 *
 * Rejects a pending member: pendingApproval -> kicked. The member is kept (not
 * deleted) to preserve an audit trail. No real host-permission check, no
 * ban/blacklist, no persistence.
 */

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';

export interface RejectMemberInput {
  roomId: string;
  memberId: string;
  decidedByMemberId?: string;
  reason?: string;
}

export interface RejectMemberResult {
  decision: 'rejected' | 'roomNotFound' | 'memberNotFound' | 'memberNotPending' | 'unauthorizedPlaceholder';
  room?: RoomSnapshot;
  memberId?: string;
  message?: string;
}

export function rejectMember(registry: RoomRegistry, input: RejectMemberInput): RejectMemberResult {
  const room = registry.get(input.roomId);
  if (!room) {
    return { decision: 'roomNotFound', memberId: input.memberId, message: `No room "${input.roomId}".` };
  }

  const member = room.members.find((m) => m.memberId === input.memberId);
  if (!member) {
    return { decision: 'memberNotFound', memberId: input.memberId, message: `No member "${input.memberId}".` };
  }
  if (member.status !== 'pendingApproval') {
    return { decision: 'memberNotPending', memberId: input.memberId, message: `Member status is "${member.status}".` };
  }

  const now = new Date().toISOString();
  // Keep the member (status -> kicked) for an audit trail rather than deleting.
  const updated = registry.update(input.roomId, (current) => ({
    ...current,
    members: current.members.map((m) =>
      m.memberId === input.memberId ? { ...m, status: 'kicked', lastSeenAt: now } : m,
    ),
    identity: { ...current.identity, updatedAt: now },
  }));

  return {
    decision: 'rejected',
    room: updated,
    memberId: input.memberId,
    message: input.reason ? `Rejected: ${input.reason}` : undefined,
  };
}
