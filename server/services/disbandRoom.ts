import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';

export interface DisbandRoomInput {
  roomId: string;
  decidedByMemberId: string;
}

export interface DisbandRoomResult {
  decision: 'disbanded' | 'roomNotFound' | 'memberNotFound' | 'memberNotActive' | 'memberNotHost' | 'roomAlreadyClosed';
  room?: RoomSnapshot;
  message?: string;
}

/**
 * Closes entry to a live room without deleting its members, RuntimeLog events,
 * map events, or saved scenes. Reopening/restoring is intentionally not part of
 * this slice.
 */
export function disbandRoom(registry: RoomRegistry, input: DisbandRoomInput): DisbandRoomResult {
  const room = registry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
  if (room.identity.lifecycleStatus === 'closed' || room.identity.lifecycleStatus === 'archived') {
    return { decision: 'roomAlreadyClosed', room, message: 'Room is already closed.' };
  }

  const member = room.members.find((candidate) => candidate.memberId === input.decidedByMemberId);
  if (!member) return { decision: 'memberNotFound', message: 'Disbanding member was not found.' };
  if (member.status !== 'active') return { decision: 'memberNotActive', message: 'Only an active host can disband a room.' };
  if (member.role !== 'host') return { decision: 'memberNotHost', message: 'Only the room host can disband a room.' };

  const now = new Date().toISOString();
  const updated = registry.update(input.roomId, (current) => ({
    ...current,
    identity: { ...current.identity, lifecycleStatus: 'closed', updatedAt: now },
    joinApprovalMode: 'closed',
    invites: current.invites.map((invite) => ({ ...invite, status: 'disabled' })),
  }));
  return { decision: 'disbanded', room: updated };
}
