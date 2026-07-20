/**
 * Durable Room Binding -> Campaign Actor bridge (P6.4).
 *
 * The live room remains authoritative for lobby approval. This service runs
 * after that approval and, only for a room that carries an explicit durable
 * World Server + campaign reference, creates or reuses the corresponding
 * campaign_actor_instances row. It never copies a Vault payload into a room
 * snapshot and it never turns the returned id into a permission decision.
 */

import { randomUUID } from 'node:crypto';

import type { RoomRegistry } from '../room-registry.js';

type RepositoryResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

interface ActorRepository {
  getActorById(actorId: string): Promise<RepositoryResult<{
    actorId: string;
    ownerId: string;
    systemId: string;
    displayName: string;
    payload: Record<string, unknown>;
    archivedAt?: string;
  } | null>>;
}

interface FoundationRepository {
  listCampaignActorInstances(campaignId: string, limit?: number): Promise<RepositoryResult<Array<{
    campaignActorInstanceId: string;
    sourceActorId?: string;
    ownerId?: string;
  }>>>;
  createCampaignActorInstance(input: {
    campaignActorInstanceId: string;
    campaignId: string;
    sourceActorId?: string;
    ownerId?: string;
    actorKind?: string;
    displayName: string;
    snapshotPayload?: Record<string, unknown>;
    overridePayload?: Record<string, unknown>;
  }): Promise<RepositoryResult<unknown>>;
}

interface WorldRepository {
  getWorldServerById(worldServerId: string): Promise<RepositoryResult<{ ownerId: string; archivedAt?: string } | null>>;
  getWorldServerMembershipByUser(worldServerId: string, userId: string): Promise<RepositoryResult<{ roleKey?: string; membershipStatus?: string } | null>>;
  getWorldServerCampaignBindingByPair(worldServerId: string, campaignId: string): Promise<RepositoryResult<{ archivedAt?: string } | null>>;
}

export type RoomBindingCampaignActorLinkDecision =
  | 'linked'
  | 'reused'
  | 'skippedNoPersistentContext'
  | 'skippedNoSourceActor'
  | 'skippedNoMemberUser'
  | 'skippedActorUnavailable'
  | 'skippedActorMismatch'
  | 'skippedCampaignUnavailable'
  | 'skippedHostNotAuthorized'
  | 'unavailable';

export interface LinkApprovedRoomBindingToCampaignActorInput {
  roomId: string;
  bindingId: string;
  reviewerUserId?: string;
}

export interface LinkApprovedRoomBindingToCampaignActorResult {
  decision: RoomBindingCampaignActorLinkDecision;
  campaignActorInstanceId?: string;
}

function activeManager(roleKey: string | undefined, membershipStatus: string | undefined): boolean {
  return membershipStatus === 'active' && (roleKey === 'owner' || roleKey === 'admin');
}

/**
 * Best-effort durable follow-up to an already-authorized live-room approval.
 * Failure is non-destructive: the live approval remains valid and callers can
 * surface a retryable persistence warning without inventing a campaign actor.
 */
export async function linkApprovedRoomBindingToCampaignActor(
  registry: RoomRegistry,
  actorRepository: ActorRepository,
  foundationRepository: FoundationRepository,
  worldRepository: WorldRepository,
  input: LinkApprovedRoomBindingToCampaignActorInput,
): Promise<LinkApprovedRoomBindingToCampaignActorResult> {
  const room = registry.get(input.roomId);
  const binding = room?.lobby?.actorBindings.find((item) => item.bindingId === input.bindingId);
  if (!room || !binding || binding.status !== 'approved' || binding.clearance?.status !== 'approved') {
    return { decision: 'skippedNoPersistentContext' };
  }
  if (binding.campaignActorInstanceId) return { decision: 'reused', campaignActorInstanceId: binding.campaignActorInstanceId };

  const worldServerId = room.campaignRef?.worldServerId?.trim();
  const campaignId = room.campaignRef?.campaignId?.trim();
  if (!worldServerId || !campaignId) return { decision: 'skippedNoPersistentContext' };

  const sourceActorId = binding.actorRef.actorId?.trim();
  if (!sourceActorId) return { decision: 'skippedNoSourceActor' };
  const member = room.members.find((item) => item.memberId === binding.memberId);
  if (!member?.userId) return { decision: 'skippedNoMemberUser' };

  try {
    const [worldResult, campaignBindingResult, hostMembershipResult, actorResult] = await Promise.all([
      worldRepository.getWorldServerById(worldServerId),
      worldRepository.getWorldServerCampaignBindingByPair(worldServerId, campaignId),
      input.reviewerUserId ? worldRepository.getWorldServerMembershipByUser(worldServerId, input.reviewerUserId) : Promise.resolve({ ok: true as const, value: null }),
      actorRepository.getActorById(sourceActorId),
    ]);
    if (!worldResult.ok || !campaignBindingResult.ok || !hostMembershipResult.ok || !actorResult.ok) return { decision: 'unavailable' };
    if (!worldResult.value || worldResult.value.archivedAt || !campaignBindingResult.value || campaignBindingResult.value.archivedAt) {
      return { decision: 'skippedCampaignUnavailable' };
    }
    const reviewerIsOwner = input.reviewerUserId === worldResult.value.ownerId;
    if (!reviewerIsOwner && !activeManager(hostMembershipResult.value?.roleKey, hostMembershipResult.value?.membershipStatus)) {
      return { decision: 'skippedHostNotAuthorized' };
    }
    const actor = actorResult.value;
    if (!actor || actor.archivedAt) return { decision: 'skippedActorUnavailable' };
    if (actor.ownerId !== member.userId || actor.systemId !== room.identity.systemId) return { decision: 'skippedActorMismatch' };

    const existingResult = await foundationRepository.listCampaignActorInstances(campaignId, 200);
    if (!existingResult.ok) return { decision: 'unavailable' };
    const existing = existingResult.value.find((item) => item.sourceActorId === actor.actorId && item.ownerId === actor.ownerId);
    const campaignActorInstanceId = existing?.campaignActorInstanceId ?? `campaign_actor_${randomUUID()}`;
    if (!existing) {
      const created = await foundationRepository.createCampaignActorInstance({
        campaignActorInstanceId,
        campaignId,
        sourceActorId: actor.actorId,
        ownerId: actor.ownerId,
        actorKind: 'pc',
        displayName: actor.displayName,
        snapshotPayload: actor.payload,
        overridePayload: {},
      });
      if (!created.ok) return { decision: 'unavailable' };
    }

    registry.update(input.roomId, (current) => ({
      ...current,
      lobby: current.lobby
        ? {
            ...current.lobby,
            actorBindings: current.lobby.actorBindings.map((item) => item.bindingId === input.bindingId
              ? { ...item, campaignActorInstanceId }
              : item),
          }
        : current.lobby,
      identity: { ...current.identity, updatedAt: new Date().toISOString() },
    }));
    return { decision: existing ? 'reused' : 'linked', campaignActorInstanceId };
  } catch {
    return { decision: 'unavailable' };
  }
}
