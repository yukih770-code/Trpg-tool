import { projectRoomRuntimeActorProjections } from './projectRoomRuntimeActorProjections.js';
import { formatDndCharacterCombatRelevantHash } from './dndCharacterCombatRelevantHash.js';

const sheet = {
  schemaVersion: 1,
  actorKind: 'pc',
  displayName: 'Maris',
  creatureSize: 'small',
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
    projection.dndCreatureSize === 'small',
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

  // ── T11a: sourceChangedSinceApproval ─────────────────────────────────────
  // A weaker review flag than clearance. It must be honest about what it does
  // not know, must reach only the host and the binding's own member, and must
  // never disturb a combat value.
  const attr = (score: number) => ({ base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 });
  const vaultCharacter = (overrides: Record<string, unknown> = {}) => ({
    schemaVersion: 4, id: 'char-1', name: 'Maris', age: '24', gender: '', race: '人类', subrace: '',
    jobClass: '战士', subclass: '', classLevels: [{ className: '战士', level: 3 }],
    background: '士兵', description: '', level: 3,
    hpMax: 17, hpCurrent: 11, tempHp: 3, deathSaves: { successes: 0, failures: 0 }, hitDiceCurrent: 3,
    acMod: 16, speed: '30', size: '中型',
    attrs: { Str: attr(16), Dex: attr(15), Con: attr(14), Int: attr(10), Wis: attr(12), Cha: attr(8) },
    skillProficiencies: ['运动'], savingThrowProficiencies: ['Str', 'Con'],
    weaponProficiencies: [], armorTraining: [], spellbook: { known: [], prepared: [], slots: {} },
    customLanguages: '通用语', inventory: [], personalContentReferences: [], feats: [], coin: 0,
    remainingPoints: 0, isCompleted: true, classResources: [],
    ...overrides,
  });
  const approvedBaseline = formatDndCharacterCombatRelevantHash(vaultCharacter());

  const derivedCharacter = vaultCharacter({
    weaponProficiencies: ['简易武器'],
    dndEquipmentSnapshotV1: {
      schemaVersion: 1,
      items: [{ definitionId: 'weapon.dagger', quantity: 1, equipSlot: 'mainHand' }],
    },
  });
  const derivedProjection = await projectRoomRuntimeActorProjections({
    room,
    currentMemberId: 'member-1',
    repository: {
      async getCampaignActorInstanceById() {
        return { ok: true as const, value: { ...record, snapshotPayload: derivedCharacter, overridePayload: {} } };
      },
    },
  });
  checks.push(derivedProjection.actors[0].source === 'acceptedCharacter');
  checks.push(derivedProjection.selfDndActions?.some((action) => action.id === 'action.item.dagger.melee-weapon-attack' && action.kind === 'weapon_attack') === true);

  const reviewRoom = (viewerRole: string, viewerMemberId: string) => ({
    campaignRef: { campaignId: 'campaign-1' },
    members: [
      { memberId: 'member-1', userId: 'user-1', role: 'player' },
      { memberId: 'member-2', userId: 'user-2', role: 'player' },
      { memberId: 'host-1', userId: 'host-user', role: 'host' },
      { memberId: viewerMemberId, userId: `${viewerMemberId}-user`, role: viewerRole },
    ],
    lobby: { actorBindings: [{
      bindingId: 'binding-1', memberId: 'member-1', status: 'approved', clearance: { status: 'approved' },
      campaignActorInstanceId: 'instance-1',
      actorRef: { displayName: 'Old name', systemId: 'dnd5e-2024', hpCurrent: 1, hpMax: 1, armorClass: 10 },
    }] },
  }) as any;

  const reviewRecord = (snapshotHash?: string) => ({
    ...record, sourceActorId: 'actor-1', ...(snapshotHash ? { snapshotHash } : {}),
  });

  const project = (input: {
    viewer: string; role?: string; snapshotHash?: string; vault?: unknown;
    vaultFails?: boolean; archived?: boolean; omitSourceRepository?: boolean; systemId?: string;
  }) => {
    const roomForCase = reviewRoom(input.role ?? 'player', input.viewer);
    if (input.systemId) roomForCase.lobby.actorBindings[0].actorRef.systemId = input.systemId;
    return projectRoomRuntimeActorProjections({
      room: roomForCase,
      currentMemberId: input.viewer,
      repository: { async getCampaignActorInstanceById() { return { ok: true as const, value: reviewRecord(input.snapshotHash) }; } },
      ...(input.omitSourceRepository ? {} : {
        sourceRepository: {
          async getActorById() {
            if (input.vaultFails) return { ok: false as const, error: new Error('vault unavailable') };
            return { ok: true as const, value: { payload: (input.vault ?? vaultCharacter()) as Record<string, unknown>, ...(input.archived ? { archivedAt: '2026-01-01T00:00:00.000Z' } : {}) } };
          },
        },
      }),
    });
  };

  const hostUnchanged = await project({ viewer: 'host-1', role: 'host', snapshotHash: approvedBaseline });
  checks.push(hostUnchanged.actors[0].sourceChangedSinceApproval === false);
  // A confirmed comparison must not disturb a single combat value.
  checks.push(hostUnchanged.actors[0].armorClass === 16 && hostUnchanged.actors[0].hpCurrent === 11 && hostUnchanged.actors[0].initiativeModifier === 2);
  checks.push(hostUnchanged.persistence === 'available');

  const hostLevelUp = await project({
    viewer: 'host-1', role: 'host', snapshotHash: approvedBaseline,
    vault: vaultCharacter({ level: 4, classLevels: [{ className: '战士', level: 4 }] }),
  });
  checks.push(hostLevelUp.actors[0].sourceChangedSinceApproval === true);
  // The flag reports; it changes nothing the table runs on.
  checks.push(hostLevelUp.actors[0].armorClass === 16 && hostLevelUp.actors[0].hpCurrent === 11 && hostLevelUp.actors[0].initiativeModifier === 2);
  checks.push(hostLevelUp.actors[0].source === 'campaignOverride');

  // Damage is volatile and deliberately outside the covered set.
  const hostDamaged = await project({
    viewer: 'host-1', role: 'host', snapshotHash: approvedBaseline,
    vault: vaultCharacter({ hpCurrent: 2, tempHp: 0 }),
  });
  checks.push(hostDamaged.actors[0].sourceChangedSinceApproval === false);

  // Every "unknown" case omits the field rather than claiming "unchanged".
  const unknownCases = await Promise.all([
    project({ viewer: 'host-1', role: 'host' }),                                              // no stored baseline
    project({ viewer: 'host-1', role: 'host', snapshotHash: 'someone-elses-hash' }),           // unrecognised baseline
    project({ viewer: 'host-1', role: 'host', snapshotHash: approvedBaseline, omitSourceRepository: true }),
    project({ viewer: 'host-1', role: 'host', snapshotHash: approvedBaseline, vaultFails: true }),
    project({ viewer: 'host-1', role: 'host', snapshotHash: approvedBaseline, archived: true }),
    project({ viewer: 'host-1', role: 'host', snapshotHash: approvedBaseline, vault: { hp: 12 } }),
    project({ viewer: 'host-1', role: 'host', snapshotHash: approvedBaseline, systemId: 'coc7e' }),
  ]);
  for (const [index, unknown] of unknownCases.entries()) {
    checks.push(!('sourceChangedSinceApproval' in unknown.actors[0]));
    // An unknown answer must never degrade the read the table depends on. The
    // last case is a COC binding, which has always projected the compact
    // room-binding fallback rather than a DND lite sheet.
    const expectedArmorClass = index === unknownCases.length - 1 ? 10 : 16;
    checks.push(unknown.persistence === 'available' && unknown.actors[0].armorClass === expectedArmorClass);
  }

  // Visibility: own binding yes, another player's binding no.
  const ownBinding = await project({ viewer: 'member-1', role: 'player', snapshotHash: approvedBaseline, vault: vaultCharacter({ acMod: 18 }) });
  checks.push(ownBinding.actors[0].sourceChangedSinceApproval === true);
  const otherPlayer = await project({ viewer: 'member-2', role: 'player', snapshotHash: approvedBaseline, vault: vaultCharacter({ acMod: 18 }) });
  checks.push(!('sourceChangedSinceApproval' in otherPlayer.actors[0]));
  const anonymous = await projectRoomRuntimeActorProjections({
    room: reviewRoom('player', 'member-9'),
    repository: { async getCampaignActorInstanceById() { return { ok: true as const, value: reviewRecord(approvedBaseline) }; } },
    sourceRepository: { async getActorById() { return { ok: true as const, value: { payload: vaultCharacter({ acMod: 18 }) as Record<string, unknown> } }; } },
  });
  checks.push(!('sourceChangedSinceApproval' in anonymous.actors[0]));

  // The hash itself is never projected, to anyone.
  for (const result of [hostUnchanged, hostLevelUp, ownBinding, otherPlayer]) {
    const serialised = JSON.stringify(result);
    checks.push(!serialised.includes(approvedBaseline!));
    checks.push(!serialised.includes('snapshotHash') && !serialised.includes('sourceActorId'));
  }

  if (checks.some((check) => !check)) throw new Error(`Room Runtime actor projection smoke failed at index ${checks.findIndex((check) => !check)}.`);
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
}

void main();
