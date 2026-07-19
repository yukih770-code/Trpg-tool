import type { MapToken } from '../map/mapRuntimeTypes.js';
import type { RoomSnapshot } from './roomTypes.js';

/**
 * Finds a token's approved room-binding link. This is a shared data check, not
 * authority: the Room Server must also bind the claimed member to its trusted
 * authenticated viewer before allowing a live map mutation.
 */
export function isTokenLinkedToApprovedRoomMember(
  room: RoomSnapshot | undefined,
  memberId: string | undefined,
  token: Pick<MapToken, 'kind' | 'sourceType' | 'sourceId' | 'roomMemberId' | 'actorBindingId'>,
): boolean {
  if (!room || !memberId || token.kind !== 'playerCharacter' || token.sourceType !== 'roomActorBinding') return false;
  const binding = room.lobby?.actorBindings.find((candidate) =>
    candidate.memberId === memberId
    && candidate.status === 'approved'
    && candidate.clearance?.status === 'approved',
  );
  const bindingId = token.actorBindingId ?? token.sourceId;
  return Boolean(
    binding
    && bindingId === binding.bindingId
    && (token.roomMemberId === undefined || token.roomMemberId === memberId),
  );
}
