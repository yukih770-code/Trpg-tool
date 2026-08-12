import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';
import {
  canRoomRuntimeAction,
  type RoomRuntimeAction,
  type RoomRuntimeGrantSummary,
} from '../../src/lib/platform/roomRuntimePermissions.js';
import type { RoomMapEventKind } from '../protocol/room-protocol.js';

export type RoomRuntimePermissionDecision = {
  allowed: boolean;
  code: 'allowed' | 'room_closed' | 'unauthenticated' | 'member_not_found' | 'member_user_mismatch' | 'member_inactive' | 'forbidden';
  memberId?: string;
  userId?: string;
};

/**
 * Verifies that a claimed room member belongs to the authenticated viewer.
 * Only active members may receive room or WebSocket snapshots. Pending
 * applicants use the dedicated join-status endpoint, which reveals only their
 * own membership outcome.
 */
export function resolveRoomParticipant(input: {
  room: RoomSnapshot;
  viewer: CurrentViewerContext;
  memberId: string | undefined;
}): RoomRuntimePermissionDecision {
  const viewerUserId = input.viewer.viewerUserId;
  if (!input.viewer.isAuthenticated || !viewerUserId) {
    return { allowed: false, code: 'unauthenticated' };
  }
  const member = input.room.members.find((candidate) => candidate.memberId === input.memberId);
  if (!member) return { allowed: false, code: 'member_not_found' };
  if (!member.userId || member.userId !== viewerUserId) {
    return { allowed: false, code: 'member_user_mismatch', memberId: member.memberId, userId: viewerUserId };
  }
  if (member.status !== 'active') {
    return { allowed: false, code: 'member_inactive', memberId: member.memberId, userId: viewerUserId };
  }
  return { allowed: true, code: 'allowed', memberId: member.memberId, userId: viewerUserId };
}

export function mapRuntimeActionForMapEvent(eventKind: RoomMapEventKind): RoomRuntimeAction {
  if (eventKind === 'map.template_added') return 'map.template.fix';
  if (eventKind === 'map.template_updated') return 'map.template.edit';
  if (eventKind === 'map.template_removed' || eventKind === 'map.templates_cleared') return 'map.template.delete';
  if (eventKind === 'map.grid_updated') return 'map.grid.edit';
  if (eventKind === 'map.background_set' || eventKind === 'map.background_cleared') return 'map.background.edit';
  if (eventKind === 'map.token_added') return 'map.token.create.any';
  if (eventKind === 'map.token_updated') return 'map.token.update.any';
  if (eventKind === 'map.token_removed') return 'map.token.delete.any';
  return 'map.token.move.any';
}

function grantsForMember(room: RoomSnapshot, memberId: string): RoomRuntimeGrantSummary[] {
  const grant = room.mapPermissions?.find((item) => item.memberId === memberId);
  if (!grant) return [];

  const grants: RoomRuntimeGrantSummary[] = [];
  if (grant.canPinRanges) {
    grants.push({
        action: 'map.template.fix',
        scope: 'roomSession',
        grantedByDisplayName: grant.grantedByDisplayName,
        grantedAt: grant.grantedAt,
    });
  }
  if (grant.canManageTokens) {
    grants.push({
      action: 'map.token.move.own',
      scope: 'roomSession',
      grantedByDisplayName: grant.grantedByDisplayName,
      grantedAt: grant.grantedAt,
    });
  }
  return grants;
}

/**
 * Binds a claimed room-member id to a verified viewer before evaluating a
 * runtime action. A member id by itself is never authority.
 */
export function resolveRoomRuntimePermission(input: {
  room: RoomSnapshot;
  viewer: CurrentViewerContext;
  memberId: string | undefined;
  action: RoomRuntimeAction;
}): RoomRuntimePermissionDecision {
  const participant = resolveRoomParticipant(input);
  if (!participant.allowed) return participant;
  if (input.room.identity.lifecycleStatus === 'closed' || input.room.identity.lifecycleStatus === 'archived') {
    return { allowed: false, code: 'room_closed', memberId: participant.memberId, userId: participant.userId };
  }
  const viewerUserId = participant.userId;
  const member = input.room.members.find((candidate) => candidate.memberId === input.memberId);
  if (!member) return { allowed: false, code: 'member_not_found' };
  if (member.status !== 'active') {
    return { allowed: false, code: 'member_inactive', memberId: member.memberId, userId: viewerUserId };
  }
  const allowed = canRoomRuntimeAction({
    authenticated: true,
    roomMemberActive: true,
    roomRole: member.role,
    grants: grantsForMember(input.room, member.memberId),
  }, input.action);
  return { allowed, code: allowed ? 'allowed' : 'forbidden', memberId: member.memberId, userId: viewerUserId };
}
