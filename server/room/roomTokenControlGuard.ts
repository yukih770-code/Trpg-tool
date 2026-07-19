import type { RoomMapRegistry } from '../room-map-registry.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';
import { isTokenLinkedToApprovedRoomMember } from '../../src/lib/platform/roomTokenOwnership.js';
import { resolveRoomParticipant, type RoomRuntimePermissionDecision } from './roomRuntimePermissionGuard.js';

export type RoomTokenMoveDecision = Omit<RoomRuntimePermissionDecision, 'code'> & {
  code: RoomRuntimePermissionDecision['code'] | 'invalidMove' | 'tokenNotFound' | 'tokenNotOwned';
};

type TokenMoveInput = {
  room: RoomSnapshot;
  mapRegistry: RoomMapRegistry;
  memberId: string;
  mapId: string;
  payload: unknown;
};

function moveTarget(payload: unknown): { tokenId: string; x: number; y: number } | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const input = payload as Record<string, unknown>;
  const tokenId = typeof input.tokenId === 'string' ? input.tokenId.trim() : '';
  const x = input.x;
  const y = input.y;
  if (!tokenId || typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) return undefined;
  return { tokenId, x, y };
}

/**
 * Resolves ownership solely from the room's approved binding and a persisted
 * token link. `ownerUserId` and `controlledByUserId` are deliberately ignored:
 * they are useful display metadata, never standalone authority.
 */
export function resolveRoomMemberTokenMove(input: TokenMoveInput): RoomTokenMoveDecision {
  const target = moveTarget(input.payload);
  if (!target || !input.mapId.trim()) return { allowed: false, code: 'invalidMove' };

  const member = input.room.members.find((candidate) => candidate.memberId === input.memberId);
  if (!member) return { allowed: false, code: 'member_not_found' };
  if (member.status !== 'active') return { allowed: false, code: 'member_inactive', memberId: member.memberId };
  if (member.role === 'host') return { allowed: true, code: 'allowed', memberId: member.memberId };
  if (member.role !== 'player') return { allowed: false, code: 'forbidden', memberId: member.memberId };

  const token = replayMapRuntimeEvents(input.mapRegistry.list(input.room.identity.roomId, { mapId: input.mapId }).events, input.mapId)
    .tokens.find((candidate) => candidate.id === target.tokenId);
  if (!token) return { allowed: false, code: 'tokenNotFound', memberId: member.memberId };

  const hasVerifiedBindingLink = isTokenLinkedToApprovedRoomMember(input.room, member.memberId, token);
  return hasVerifiedBindingLink
    ? { allowed: true, code: 'allowed', memberId: member.memberId }
    : { allowed: false, code: 'tokenNotOwned', memberId: member.memberId };
}

/** A trusted HTTP/WebSocket viewer must prove the claimed member before token ownership is considered. */
export function resolveVerifiedRoomTokenMove(input: TokenMoveInput & {
  viewer: CurrentViewerContext;
}): RoomTokenMoveDecision {
  const participant = resolveRoomParticipant(input);
  if (!participant.allowed) return participant;
  const decision = resolveRoomMemberTokenMove(input);
  return decision.allowed ? { ...decision, userId: participant.userId } : decision;
}
