import { authorizeCloudRoomCreate, type CloudRoomCreateWorldRepository } from './authorizeCloudRoomCreate.js';

type Result<T> = { ok: true; value: T } | { ok: false; error: unknown };

function repository(overrides: Partial<CloudRoomCreateWorldRepository> = {}): CloudRoomCreateWorldRepository {
  return {
    getWorldServerById: async (): Promise<Result<{ ownerId: string } | null>> => ({ ok: true, value: { ownerId: 'owner-user' } }),
    getWorldServerMembershipByUser: async (): Promise<Result<{ roleKey: string; membershipStatus: string } | null>> => ({
      ok: true,
      value: { roleKey: 'player', membershipStatus: 'active' },
    }),
    getWorldServerCampaignBindingByPair: async (): Promise<Result<{ archivedAt?: string } | null>> => ({ ok: true, value: {} }),
    ...overrides,
  };
}

async function main(): Promise<void> {
  const owner = await authorizeCloudRoomCreate(repository(), {
    worldServerId: 'world-1', campaignId: 'campaign-1', viewerUserId: 'owner-user',
  });
  const admin = await authorizeCloudRoomCreate(repository({
    getWorldServerMembershipByUser: async () => ({ ok: true, value: { roleKey: 'admin', membershipStatus: 'active' } }),
  }), {
    worldServerId: 'world-1', campaignId: 'campaign-1', viewerUserId: 'admin-user',
  });
  const player = await authorizeCloudRoomCreate(repository(), {
    worldServerId: 'world-1', campaignId: 'campaign-1', viewerUserId: 'player-user',
  });
  const missingBinding = await authorizeCloudRoomCreate(repository({
    getWorldServerCampaignBindingByPair: async () => ({ ok: true, value: null }),
  }), {
    worldServerId: 'world-1', campaignId: 'campaign-2', viewerUserId: 'owner-user',
  });
  const unavailable = await authorizeCloudRoomCreate(repository({
    getWorldServerById: async () => ({ ok: false, error: new Error('unavailable') }),
  }), {
    worldServerId: 'world-1', campaignId: 'campaign-1', viewerUserId: 'owner-user',
  });

  const checks = [
    owner.status === 'authorized',
    admin.status === 'authorized',
    player.status === 'denied',
    missingBinding.status === 'denied',
    unavailable.status === 'unavailable',
  ];
  if (checks.some((check) => !check)) throw new Error('Cloud room create authorization smoke failed.');
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
}

void main();
