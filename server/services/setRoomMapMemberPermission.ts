/** Host-managed room map collaboration grant (room-session scope). */

import type { RoomRegistry } from '../room-registry.js';
import type { RoomMapMemberPermissionSummary, RoomSnapshot } from '../protocol/room-protocol.js';

export interface SetRoomMapMemberPermissionInput {
  roomId: string;
  authorizedByMemberId: string;
  memberId: string;
  canPinRanges?: boolean;
  /** Still limited to the target's approved character token by the move guard. */
  canManageTokens?: boolean;
}

export interface SetRoomMapMemberPermissionResult {
  decision: 'updated' | 'roomNotFound' | 'authorNotFound' | 'authorNotAuthorized' | 'memberNotFound' | 'memberNotActive' | 'invalidTarget';
  room?: RoomSnapshot;
  message?: string;
}

export function setRoomMapMemberPermission(
  registry: RoomRegistry,
  input: SetRoomMapMemberPermissionInput,
): SetRoomMapMemberPermissionResult {
  const room = registry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
  const author = room.members.find((member) => member.memberId === input.authorizedByMemberId);
  if (!author) return { decision: 'authorNotFound', message: 'Authorizing member was not found.' };
  if (author.status !== 'active' || author.role !== 'host') return { decision: 'authorNotAuthorized', message: 'Only the active room host can change map collaboration grants.' };
  const target = room.members.find((member) => member.memberId === input.memberId);
  if (!target) return { decision: 'memberNotFound', message: 'Target member was not found.' };
  if (target.status !== 'active') return { decision: 'memberNotActive', message: 'Target member is not active.' };
  if (target.role !== 'player') return { decision: 'invalidTarget', message: 'Map collaboration grants are available to active players only.' };

  const next = registry.update(input.roomId, (current) => {
    const previous = current.mapPermissions ?? [];
    const existing = previous.find((permission) => permission.memberId === input.memberId);
    const retained = previous.filter((permission) => permission.memberId !== input.memberId);
    const canPinRanges = input.canPinRanges ?? existing?.canPinRanges ?? false;
    const canManageTokens = input.canManageTokens ?? existing?.canManageTokens ?? false;
    const permission: RoomMapMemberPermissionSummary = {
      memberId: input.memberId,
      canPinRanges,
      canManageTokens,
      canManagePresentation: existing?.canManagePresentation ?? false,
      grantScope: 'roomSession',
      grantedByDisplayName: author.displayName,
      grantedAt: new Date().toISOString(),
    };
    return { ...current, mapPermissions: canPinRanges || canManageTokens || permission.canManagePresentation ? [...retained, permission] : retained };
  });
  return next ? { decision: 'updated', room: next } : { decision: 'roomNotFound' };
}
