import { createInMemoryRoomRegistry } from '../room-registry.js';
import { linkApprovedRoomBindingToCampaignActor } from './linkApprovedRoomBindingToCampaignActor.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';

function room(): RoomSnapshot {
  return {
    identity: { roomId: 'room_p6_4', roomCode: 'P64AAA', serverId: 'room-server', systemId: 'dnd5e-2024', lifecycleStatus: 'open' },
    joinApprovalMode: 'hostApprovalRequired',
    members: [
      { memberId: 'host', userId: 'host_user', displayName: 'GM', role: 'host', status: 'active' },
      { memberId: 'player', userId: 'player_user', displayName: 'Player', role: 'player', status: 'active' },
    ],
    actorBindings: [],
    invites: [],
    campaignRef: { source: 'localCampaignLibrary', worldServerId: 'world_1', campaignId: 'campaign_1', displayName: 'Campaign', systemId: 'dnd5e-2024' },
    lobby: {
      readyStates: [],
      actorBindings: [{
        bindingId: 'binding_1', memberId: 'player', status: 'approved', submittedAt: '2026-01-01T00:00:00.000Z',
        actorRef: { actorId: 'actor_1', displayName: 'Rin', source: 'localActorVault', systemId: 'dnd5e-2024' },
        clearance: { admissionId: 'admission_1', status: 'approved', updatedAt: '2026-01-01T00:00:00.000Z' },
      }],
    },
  };
}

async function main() {
  const registry = createInMemoryRoomRegistry();
  registry.create(room());
  let createCount = 0;
  const instances: Array<{ campaignActorInstanceId: string; sourceActorId?: string; ownerId?: string }> = [];
  const actorRepository = {
    getActorById: async () => ({ ok: true as const, value: { actorId: 'actor_1', ownerId: 'player_user', systemId: 'dnd5e-2024', localActorId: 'local_1', displayName: 'Rin', payload: { hp: 12 }, schemaVersion: 1 } }),
  };
  const foundationRepository = {
    listCampaignActorInstances: async () => ({ ok: true as const, value: instances }),
    createCampaignActorInstance: async (input: { campaignActorInstanceId: string; sourceActorId?: string; ownerId?: string }) => {
      createCount += 1;
      instances.push(input);
      return { ok: true as const, value: input };
    },
  };
  const worldRepository = {
    getWorldServerById: async () => ({ ok: true as const, value: { worldServerId: 'world_1', ownerId: 'host_user' } }),
    getWorldServerCampaignBindingByPair: async () => ({ ok: true as const, value: { bindingId: 'ws_campaign_1', archivedAt: undefined } }),
    getWorldServerMembershipByUser: async () => ({ ok: true as const, value: null }),
  };
  const first = await linkApprovedRoomBindingToCampaignActor(registry, actorRepository, foundationRepository, worldRepository, {
    roomId: 'room_p6_4', bindingId: 'binding_1', reviewerUserId: 'host_user',
  });
  if (first.decision !== 'linked' || !first.campaignActorInstanceId || createCount !== 1) throw new Error('expected a durable campaign actor link');
  const second = await linkApprovedRoomBindingToCampaignActor(registry, actorRepository, foundationRepository, worldRepository, {
    roomId: 'room_p6_4', bindingId: 'binding_1', reviewerUserId: 'host_user',
  });
  if (second.decision !== 'reused' || second.campaignActorInstanceId !== first.campaignActorInstanceId || createCount !== 1) throw new Error('expected idempotent reuse');
  const linked = registry.get('room_p6_4')?.lobby?.actorBindings[0]?.campaignActorInstanceId;
  if (linked !== first.campaignActorInstanceId) throw new Error('expected a safe room projection reference');
  console.log('P6.4 room binding campaign actor bridge: 3/3 passed');
}

void main();
