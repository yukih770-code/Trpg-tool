/**
 * approveMember service (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_APPROVE_MEMBER_V0
 *
 * Approves a pending member: pendingApproval -> active. No real host-permission
 * check yet (`unauthorizedPlaceholder` reserved for the future). No persistence.
 */

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';

export interface ApproveMemberInput {
  roomId: string;
  memberId: string;
  decidedByMemberId?: string;
}

export interface ApproveMemberResult {
  decision: 'approved' | 'roomNotFound' | 'memberNotFound' | 'memberNotPending' | 'unauthorizedPlaceholder';
  room?: RoomSnapshot;
  memberId?: string;
  message?: string;
}

export function approveMember(registry: RoomRegistry, input: ApproveMemberInput): ApproveMemberResult {
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
  const updated = registry.update(input.roomId, (current) => ({
    ...current,
    members: current.members.map((m) =>
      m.memberId === input.memberId ? { ...m, status: 'active', lastSeenAt: now } : m,
    ),
    identity: { ...current.identity, updatedAt: now },
  }));

  return { decision: 'approved', room: updated, memberId: input.memberId };
}
