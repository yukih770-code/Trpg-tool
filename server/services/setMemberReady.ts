/**
 * setMemberReady service (Room Lobby scaffold, M15).
 *
 * AI-LANDMARK: ROOM_SERVER_SET_MEMBER_READY_V0
 *
 * Toggles a member's pre-session ready flag. Only ACTIVE members may ready, and
 * (per spec) only after their actor binding is approved. NO real auth, NO
 * Runtime entry — this is just lobby pre-session state. In-memory via registry.
 */

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';
import type { RoomMemberReadyState } from '../../src/lib/platform/roomTypes.js';

export interface SetMemberReadyInput {
  roomId: string;
  memberId: string;
  ready: boolean;
}

export interface SetMemberReadyResult {
  decision: 'updated' | 'roomNotFound' | 'memberNotFound' | 'memberNotActive' | 'actorNotApproved';
  room?: RoomSnapshot;
  memberId?: string;
  message?: string;
}

export function setMemberReady(registry: RoomRegistry, input: SetMemberReadyInput): SetMemberReadyResult {
  const room = registry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };

  const member = room.members.find((m) => m.memberId === input.memberId);
  if (!member) return { decision: 'memberNotFound', message: `No member "${input.memberId}".` };
  if (member.status !== 'active') {
    return { decision: 'memberNotActive', message: `Member status is "${member.status}".` };
  }

  // Readying-up requires an approved actor binding; clearing ready is always ok.
  if (input.ready) {
    const binding = room.lobby?.actorBindings.find((b) => b.memberId === input.memberId);
    if (!binding || binding.status !== 'approved') {
      return { decision: 'actorNotApproved', message: 'An approved actor binding is required before ready.' };
    }
  }

  const now = new Date().toISOString();
  const nextStatus = input.ready ? 'ready' : 'notReady';
  const updated = registry.update(input.roomId, (current) => {
    const lobby = current.lobby ?? { actorBindings: [], readyStates: [] };
    const existing = lobby.readyStates.find((r) => r.memberId === input.memberId);
    const nextReady: RoomMemberReadyState = { memberId: input.memberId, status: nextStatus, updatedAt: now };
    const readyStates = existing
      ? lobby.readyStates.map((r) => (r.memberId === input.memberId ? nextReady : r))
      : [...lobby.readyStates, nextReady];
    return {
      ...current,
      lobby: { ...lobby, readyStates },
      identity: { ...current.identity, updatedAt: now },
    };
  });

  return { decision: 'updated', room: updated, memberId: input.memberId };
}
