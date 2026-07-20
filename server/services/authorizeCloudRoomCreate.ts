/**
 * Cloud campaign context authorization for room creation (P6.5).
 *
 * A Room can still be created without a durable campaign context for legacy
 * local flows. When a caller supplies `worldServerId` + `campaignId`, however,
 * the server verifies that the viewer manages that World Server and that the
 * campaign is actually bound to it before accepting the live-room request.
 */

type RepositoryResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

export interface CloudRoomCreateWorldRepository {
  getWorldServerById(worldServerId: string): Promise<RepositoryResult<{
    ownerId: string;
    archivedAt?: string;
  } | null>>;
  getWorldServerMembershipByUser(worldServerId: string, userId: string): Promise<RepositoryResult<{
    roleKey?: string;
    membershipStatus?: string;
  } | null>>;
  getWorldServerCampaignBindingByPair(worldServerId: string, campaignId: string): Promise<RepositoryResult<{
    archivedAt?: string;
  } | null>>;
}

export type CloudRoomCreateAuthorization =
  | { status: 'authorized' }
  | { status: 'denied' }
  | { status: 'unavailable' };

function isActiveManager(roleKey: string | undefined, membershipStatus: string | undefined): boolean {
  return membershipStatus === 'active' && (roleKey === 'owner' || roleKey === 'admin');
}

export async function authorizeCloudRoomCreate(
  repository: CloudRoomCreateWorldRepository,
  input: { worldServerId: string; campaignId: string; viewerUserId: string },
): Promise<CloudRoomCreateAuthorization> {
  try {
    const [worldResult, membershipResult, campaignBindingResult] = await Promise.all([
      repository.getWorldServerById(input.worldServerId),
      repository.getWorldServerMembershipByUser(input.worldServerId, input.viewerUserId),
      repository.getWorldServerCampaignBindingByPair(input.worldServerId, input.campaignId),
    ]);

    if (!worldResult.ok || !membershipResult.ok || !campaignBindingResult.ok) return { status: 'unavailable' };
    const world = worldResult.value;
    const binding = campaignBindingResult.value;
    if (!world || world.archivedAt || !binding || binding.archivedAt) return { status: 'denied' };

    const isOwner = world.ownerId === input.viewerUserId;
    if (!isOwner && !isActiveManager(membershipResult.value?.roleKey, membershipResult.value?.membershipStatus)) {
      return { status: 'denied' };
    }
    return { status: 'authorized' };
  } catch {
    return { status: 'unavailable' };
  }
}
