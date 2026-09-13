import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { authorizedRoom, type DndAttackDependencies } from './declareDndAttack.js';
import { RuntimeResolutionError } from './applyRuntimeResolution.js';
import { resolveRoomRuntimePermission } from '../room/roomRuntimePermissionGuard.js';

/** Resource operations can happen during exploration, before any combatant exists. */
export async function controlledDndRuntimeActor(deps: DndAttackDependencies, input: {
  roomId: string; memberId: string; viewer: CurrentViewerContext; actorInstanceId: string;
}) {
  if (!input.actorInstanceId || input.actorInstanceId.length > 200) throw new RuntimeResolutionError('invalid_actor');
  authorizedRoom(deps, input.roomId, input.memberId, input.viewer);
  const result = await deps.repository.getCampaignActorInstanceById(input.actorInstanceId);
  if (!result.ok) throw new RuntimeResolutionError('actor_unavailable', 503);
  const room = authorizedRoom(deps, input.roomId, input.memberId, input.viewer);
  const actor = result.value;
  if (!actor || actor.archivedAt || actor.campaignActorInstanceId !== input.actorInstanceId || actor.campaignId !== room.campaignRef!.campaignId) throw new RuntimeResolutionError('invalid_actor_source', 403);
  const host = resolveRoomRuntimePermission({ room, viewer: input.viewer, memberId: input.memberId, action: 'combat.edit' }).allowed;
  const member = room.members.find(m => m.memberId === input.memberId)!;
  const binding = room.lobby?.actorBindings.find(b => b.memberId === input.memberId && b.campaignActorInstanceId === actor.campaignActorInstanceId
    && b.status === 'approved' && (!b.clearance || b.clearance.status === 'approved') && b.actorRef.systemId === 'dnd5e-2024');
  if (!host && (!binding || !member.userId || actor.ownerId !== member.userId)) throw new RuntimeResolutionError('actor_not_controlled', 403);
  return { actor, host, bindingId: host ? undefined : binding!.bindingId };
}
