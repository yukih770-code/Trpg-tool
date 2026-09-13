import type { MapToken } from '../map/mapRuntimeTypes.js';
import type { RoomSnapshot } from './roomTypes.js';

/** Player-controlled character token variants that can be linked to a room binding. */
const PLAYER_BINDING_TOKEN_SOURCES = new Set<MapToken['sourceType']>([
  'roomActorBinding',
  'vaultActor',
  'quickDraft',
  'dndLiteActor',
  'campaign_actor',
  // A player's server projection intentionally redacts the underlying source
  // while retaining only their own opaque room member and binding ids.
  'unknown',
]);

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
  if (!room || !memberId || token.kind !== 'playerCharacter' || !PLAYER_BINDING_TOKEN_SOURCES.has(token.sourceType)) return false;
  const binding = room.lobby?.actorBindings.find((candidate) =>
    candidate.memberId === memberId
    && candidate.status === 'approved'
    && candidate.clearance?.status === 'approved',
  );
  // Old / manual tokens remain replayable but host-controlled: a player must
  // have both exact room member and approved binding metadata to move a token.
  if (!binding || token.roomMemberId !== memberId || token.actorBindingId !== binding.bindingId) return false;
  if (token.sourceType === 'roomActorBinding') return token.sourceId === binding.bindingId;
  if (token.sourceType === 'unknown') return token.sourceId === undefined;
  const actorId = binding.actorRef.actorId?.trim();
  return !actorId || token.sourceId === actorId;
}
