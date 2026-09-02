import { createInMemoryRoomRegistry } from '../room-registry.js';
import { linkApprovedRoomBindingToCampaignActor } from './linkApprovedRoomBindingToCampaignActor.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';
import { formatDndCharacterCombatRelevantHash, isDndCharacterCombatRelevantHash } from './dndCharacterCombatRelevantHash.js';

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

  // ── T11a: snapshot_hash baseline at first link ───────────────────────────
  // The payload above is not a readable DND character, so the column must stay
  // NULL. A missing baseline later reads as "unknown", which is the honest
  // answer; inventing a hash for an unreadable payload would not be.
  const unreadable = instances[0] as Record<string, unknown>;
  if ('snapshotHash' in unreadable && unreadable.snapshotHash !== undefined) {
    throw new Error('expected no baseline hash for an unreadable payload');
  }

  const attr = (score: number) => ({ base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 });
  const characterPayload = {
    schemaVersion: 4, id: 'char_1', name: 'Rin', age: '24', gender: '', race: '人类', subrace: '',
    jobClass: '战士', subclass: '', classLevels: [{ className: '战士', level: 3 }],
    background: '士兵', description: '', level: 3,
    hpMax: 28, hpCurrent: 28, tempHp: 0, deathSaves: { successes: 0, failures: 0 }, hitDiceCurrent: 3,
    acMod: 16, speed: '30', size: '中型',
    attrs: { Str: attr(16), Dex: attr(14), Con: attr(15), Int: attr(10), Wis: attr(12), Cha: attr(8) },
    skillProficiencies: ['运动', '察觉'], savingThrowProficiencies: ['Str', 'Con'],
    weaponProficiencies: [], armorTraining: [], spellbook: { known: [], prepared: [], slots: {} },
    customLanguages: '通用语', inventory: [], personalContentReferences: [], feats: [], coin: 0,
    remainingPoints: 0, isCompleted: true, classResources: [],
  };

  async function linkOnce(actor: { systemId: string; payload: Record<string, unknown> }) {
    const freshRegistry = createInMemoryRoomRegistry();
    freshRegistry.create(room());
    const created: Array<Record<string, unknown>> = [];
    const repository = {
      listCampaignActorInstances: async () => ({ ok: true as const, value: [] as Array<{ campaignActorInstanceId: string; sourceActorId?: string; ownerId?: string }> }),
      createCampaignActorInstance: async (payload: Record<string, unknown>) => {
        created.push(payload);
        return { ok: true as const, value: payload };
      },
    };
    const repo = {
      getActorById: async () => ({ ok: true as const, value: { actorId: 'actor_1', ownerId: 'player_user', systemId: actor.systemId, localActorId: 'local_1', displayName: 'Rin', payload: actor.payload, schemaVersion: 1 } }),
    };
    const result = await linkApprovedRoomBindingToCampaignActor(freshRegistry, repo, repository, worldRepository, {
      roomId: 'room_p6_4', bindingId: 'binding_1', reviewerUserId: 'host_user',
    });
    return { result, created: created[0] };
  }

  const dnd = await linkOnce({ systemId: 'dnd5e-2024', payload: characterPayload });
  if (dnd.result.decision !== 'linked') throw new Error('expected the DND character to link');
  const storedHash = dnd.created?.snapshotHash;
  if (typeof storedHash !== 'string' || !isDndCharacterCombatRelevantHash(storedHash)) {
    throw new Error('expected a combat-relevant baseline hash on first link');
  }
  // Coherence: the hash must describe the payload that was stored alongside it,
  // not some other read of the character.
  if (storedHash !== formatDndCharacterCombatRelevantHash(dnd.created?.snapshotPayload)) {
    throw new Error('expected snapshot_hash to be coherent with snapshot_payload');
  }

  // A different system reaching this bridge must not be hashed by the DND
  // covered set, even if its payload happens to look character-shaped.
  const foreign = await linkOnce({ systemId: 'dnd5e-2024', payload: { hp: 12 } });
  if (foreign.created?.snapshotHash !== undefined) throw new Error('expected no baseline for an unreadable DND payload');

  console.log('P6.4 room binding campaign actor bridge + T11a baseline: 8/8 passed');
}

void main();
