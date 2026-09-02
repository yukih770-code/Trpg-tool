import { projectRoomRuntimeActorProjections } from './projectRoomRuntimeActorProjections.js';

const sheet = {
  schemaVersion: 1,
  actorKind: 'pc',
  displayName: 'Maris',
  defenses: { armorClass: 16, currentHp: 11, maxHp: 17, temporaryHp: 3 },
  abilities: { strength: 16, dexterity: 15, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 },
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
  instanceStatus: 'active',
  snapshotPayload: {
    private: 'never project this',
    spellbook: {
      prepared: ['魔法飞弹'],
      known: [
        { id: 'spell.fire-bolt', name_cn: '火焰箭', name_en: 'Fire Bolt', level: 0, cast_time: '动作', range: '120尺', desc: 'Do not project this.' },
        { id: 'spell.magic-missile', name_cn: '魔法飞弹', name_en: 'Magic Missile', level: 1, cast_time: '动作', range: '120尺', desc: 'Do not project this either.' },
      ],
    },
  },
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
    // T10: the initiative modifier is the dexterity modifier of the approved
    // sheet, so the combat table can seed a real roll instead of a flat +0.
    projection.initiativeModifier === 2,
  projection.source === 'campaignOverride',
  result.selfDndActions?.[0]?.name === '长剑' && result.selfDndActions[0].kind === 'weapon_attack' && result.selfDndActions[0].attackBonus === 5 && result.selfDndActions[0].damageType === 'slashing',
  result.selfDndActions?.[1]?.kind === 'save_dc' && result.selfDndActions[1].saveAbility === 'dexterity' && result.selfDndActions[1].saveDc === 13,
  result.selfDndActions?.some((action) => action.name === '火焰箭' && action.kind === 'spell_cast' && action.spellLevel === 0 && action.range === '120尺' && action.availability === 'known'),
  result.selfDndActions?.some((action) => action.name === '魔法飞弹' && action.kind === 'spell_cast' && action.availability === 'prepared'),
    !('snapshotPayload' in projection) && !('ownerId' in projection) && !('actions' in projection),
    // The compact projection must not start carrying raw ability scores.
    !('abilities' in projection) && !('dexterity' in projection),
  ];
  // A sheet with no abilities projects no initiative modifier rather than a
  // fabricated zero; the combat table then falls back to its own default.
  const withoutAbilities = await projectRoomRuntimeActorProjections({
    room,
    currentMemberId: 'member-1',
    repository: {
      async getCampaignActorInstanceById() {
        const { abilities: _abilities, ...defensesOnly } = sheet as Record<string, unknown>;
        return { ok: true as const, value: { ...record, overridePayload: { dndLiteActorSheetV1: defensesOnly } } };
      },
    },
  });
  checks.push(withoutAbilities.actors[0].initiativeModifier === undefined);
  checks.push(withoutAbilities.actors[0].armorClass === 16);
  if (checks.some((check) => !check)) throw new Error('Room Runtime actor projection smoke failed.');
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
}

void main();
