import { projectRoomRuntimeActorProjections } from './projectRoomRuntimeActorProjections.js';

const sheet = {
  schemaVersion: 1,
  actorKind: 'pc',
  displayName: 'Maris',
  defenses: { armorClass: 16, currentHp: 11, maxHp: 17, temporaryHp: 3 },
  actions: [
    { id: 'sword', name: '长剑', kind: 'weapon_attack', attackBonus: 5, damageFormula: '1d8+3', damageType: 'slashing' },
    { id: 'burning-hands', name: '燃烧之手', kind: 'save_dc', damageFormula: '3d6', damageType: 'fire', saveAbility: 'dexterity', saveDc: 13 },
  ],
};

const room = {
  campaignRef: { campaignId: 'campaign-1' },
  members: [{ memberId: 'member-1', userId: 'user-1' }],
  lobby: {
    actorBindings: [{
      bindingId: 'binding-1', memberId: 'member-1', status: 'approved', clearance: { status: 'approved' },
      campaignActorInstanceId: 'instance-1',
      actorRef: { displayName: 'Old name', systemId: 'dnd5e-2024', hpCurrent: 1, hpMax: 1, armorClass: 10 },
    }],
  },
} as any;

const record = {
  campaignActorInstanceId: 'instance-1', campaignId: 'campaign-1', ownerId: 'user-1', actorKind: 'pc', displayName: 'Maris',
  instanceStatus: 'active', snapshotPayload: { private: 'never project this' },
  overridePayload: { dndLiteActorSheetV1: sheet },
};

async function main() {
  const result = await projectRoomRuntimeActorProjections({
  room,
  currentMemberId: 'member-1',
    repository: { async getCampaignActorInstanceById() { return { ok: true as const, value: record }; } },
  });
  const projection = result.actors[0];
  const checks = [
    result.persistence === 'available',
    projection.displayName === 'Maris',
    projection.hpCurrent === 11 && projection.hpMax === 17 && projection.temporaryHp === 3 && projection.armorClass === 16,
  projection.source === 'campaignOverride',
  result.selfDndActions?.[0]?.name === '长剑' && result.selfDndActions[0].kind === 'weapon_attack' && result.selfDndActions[0].attackBonus === 5 && result.selfDndActions[0].damageType === 'slashing',
  result.selfDndActions?.[1]?.kind === 'save_dc' && result.selfDndActions[1].saveAbility === 'dexterity' && result.selfDndActions[1].saveDc === 13,
    !('snapshotPayload' in projection) && !('ownerId' in projection) && !('actions' in projection),
  ];
  if (checks.some((check) => !check)) throw new Error('Room Runtime actor projection smoke failed.');
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
}

void main();
