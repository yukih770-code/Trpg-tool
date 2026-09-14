import { CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../dnd-types';
import type { CharacterData } from '../dnd-types';
import { getDndItemDefinition, resolveDndItemDefinition } from '../dnd2024/dndItemRegistry';
import { getDndActionDefinition } from '../dnd2024/gameplay/dndActionDefinitions';
import { getDndEffectDefinition } from '../dnd2024/gameplay/dndEffectDefinitions';
import {
  DND_STANDARD_MELEE_PROFILE_PROVENANCE,
  DND_STANDARD_MELEE_WEAPON_GAMEPLAY_BUNDLES,
} from '../dnd2024/gameplay/dndStandardMeleeWeaponProfiles';
import { deriveDndWeaponActionsFromCharacterSnapshot } from './dndCharacterWeaponActions';
import { dndCharacterToLiteActorSheet } from './dndCharacterToLiteActorSheet';
import { validateDndLiteActorSheet } from './dndLiteActorSheet';
import { resolveDndActorSheetAuthority } from './dndActorSheetAuthority';
import { buildDndCharacterSourceReview } from './dndCharacterSourceReview';
import { readDndAttackIntent } from '../../../server/services/declareDndAttack';
import { resolveDndAttackAction } from '../../../server/services/resolveDndAttackAction';

const cases: string[] = [];
function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}
function attr(score: number) { return { base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 }; }

function character(definitionId: string, weaponProficiencies: string[]): CharacterData {
  return {
    schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
    id: `profile-${definitionId}`, name: 'Gameplay Profile Hero', age: '', gender: '', race: '人类', subrace: '',
    jobClass: '战士', subclass: '', classLevels: [{ className: '战士', level: 1 }],
    background: '', description: '', level: 1, hpMax: 12, hpCurrent: 12, tempHp: 0,
    deathSaves: { successes: 0, failures: 0 }, hitDiceCurrent: 1, acMod: 10, speed: '30', size: '中型',
    attrs: { Str: attr(16), Dex: attr(10), Con: attr(12), Int: attr(10), Wis: attr(10), Cha: attr(10) },
    skillProficiencies: [], savingThrowProficiencies: [], weaponProficiencies,
    armorTraining: [], spellbook: { known: [], prepared: [], slots: {} }, customLanguages: '通用语',
    inventory: [], dndEquipmentSnapshotV1: {
      schemaVersion: 1,
      items: [{ definitionId, quantity: 1, equipSlot: 'mainHand' }],
    },
    personalContentReferences: [], feats: [], coin: 0, remainingPoints: 0, isCompleted: true,
    classResources: [],
  };
}

check('reviewed cohort contains exactly three selected source-backed profiles',
  DND_STANDARD_MELEE_WEAPON_GAMEPLAY_BUNDLES.length === 3);
check('profile provenance records all four approved local source hashes',
  Object.values(DND_STANDARD_MELEE_PROFILE_PROVENANCE.sources).every((source) => /^[A-F0-9]{64}$/.test(source.sha256)));

for (const bundle of DND_STANDARD_MELEE_WEAPON_GAMEPLAY_BUNDLES) {
  const definition = getDndItemDefinition(bundle.weaponDefinitionId);
  const action = getDndActionDefinition(bundle.action.id);
  const effect = getDndEffectDefinition(bundle.effect.id);
  const expectedDamage = bundle.itemGameplay.weaponProfile!.damage!;
  const proficiency = definition?.weapon?.weaponCategory === 'simple' ? ['简易武器'] : ['军用武器'];
  const sourceCharacter = character(bundle.weaponDefinitionId, proficiency);
  const derived = deriveDndWeaponActionsFromCharacterSnapshot(sourceCharacter);
  const derivedAction = derived.actions[0];

  check(`${bundle.weaponDefinitionId}: canonical item and exact-label resolution retain identity`,
    definition?.id === bundle.weaponDefinitionId
      && resolveDndItemDefinition(definition.nameCn)?.id === bundle.weaponDefinitionId);
  check(`${bundle.weaponDefinitionId}: canonical Action and Effect IDs are registered`,
    action?.id === bundle.action.id && effect?.id === bundle.effect.id);
  check(`${bundle.weaponDefinitionId}: Action/Effect/item references form one stable chain`,
    definition?.actionRefs?.includes(bundle.action.id) === true
      && action?.effectRefs.includes(bundle.effect.id) === true
      && effect?.sourceRef === bundle.weaponDefinitionId);
  check(`${bundle.weaponDefinitionId}: source dice/type remain identical across item and Effect`,
    effect?.type === 'damage'
      && JSON.stringify(definition?.weaponProfile?.damage) === JSON.stringify(effect.payload));
  check(`${bundle.weaponDefinitionId}: profile exposes only source-backed Strength melee mode`,
    JSON.stringify(definition?.weaponProfile?.abilityOptions) === JSON.stringify(['str'])
      && action?.tags?.includes('melee') === true
      && action?.tags?.includes('ranged') !== true
      && action?.tags?.includes('thrown') !== true);
  check(`${bundle.weaponDefinitionId}: proficient Character derivation produces one canonical action`,
    derived.actions.length === 1 && derivedAction?.id === bundle.action.id && derived.unsupportedDefinitionIds.length === 0);
  check(`${bundle.weaponDefinitionId}: proficient attack and damage use accepted STR and proficiency facts`,
    derivedAction?.attackBonus === 5
      && derivedAction.damageFormula === `${expectedDamage.dice[0]?.count}d${expectedDamage.dice[0]?.faces}+3`
      && derivedAction.damageType === expectedDamage.damageType);
  check(`${bundle.weaponDefinitionId}: non-proficient attack omits proficiency`,
    deriveDndWeaponActionsFromCharacterSnapshot(character(bundle.weaponDefinitionId, [])).actions[0]?.attackBonus === 3);
  const duplicate = character(bundle.weaponDefinitionId, proficiency);
  duplicate.dndEquipmentSnapshotV1!.items.push({ definitionId: bundle.weaponDefinitionId, quantity: 2, equipSlot: 'offHand' });
  const first = deriveDndWeaponActionsFromCharacterSnapshot(duplicate);
  const second = deriveDndWeaponActionsFromCharacterSnapshot(JSON.parse(JSON.stringify(duplicate)) as CharacterData);
  check(`${bundle.weaponDefinitionId}: duplicate instances collapse and serialization is deterministic`,
    first.actions.length === 1 && JSON.stringify(first) === JSON.stringify(second));
  const sheet = dndCharacterToLiteActorSheet(sourceCharacter).sheet;
  check(`${bundle.weaponDefinitionId}: T9 materializes a valid Lite Sheet action`,
    sheet.actions[0]?.id === bundle.action.id && validateDndLiteActorSheet(sheet).valid);
}

check('legacy free text cannot fabricate a newly supported action', (() => {
  const freeText = character('weapon.mace', ['简易武器']);
  freeText.inventory = ['硬头锤'];
  freeText.dndEquipmentSnapshotV1 = undefined;
  return deriveDndWeaponActionsFromCharacterSnapshot(freeText).actions.length === 0;
})());
check('existing dagger stable identity remains unchanged',
  getDndActionDefinition('action.item.dagger.melee-weapon-attack')?.sourceRef === 'weapon.dagger'
    && (() => {
      const effect = getDndEffectDefinition('effect.item.dagger.piercing-damage');
      if (!effect || effect.type !== 'damage') return false;
      return (effect.payload as { damageType?: unknown }).damageType === 'piercing';
    })());

const acceptedMace = character('weapon.mace', ['简易武器']);
const currentFlail = character('weapon.flail', ['军用武器']);
const review = buildDndCharacterSourceReview({ acceptedPayload: acceptedMace, currentPayload: currentFlail });
check('T11 reports a newly supported weapon action change',
  review.status === 'changed' && review.changedFields.some((field) => field.key === 'actions.weaponAttacks'));
check('unaccepted Character changes do not replace the accepted action',
  resolveDndActorSheetAuthority({ snapshotPayload: acceptedMace as unknown as Record<string, unknown>, overridePayload: {} })
    .sheet?.actions[0]?.id === 'action.item.mace.melee-weapon-attack');
check('accepting the changed Character advances the derived action',
  resolveDndActorSheetAuthority({ snapshotPayload: currentFlail as unknown as Record<string, unknown>, overridePayload: {} })
    .sheet?.actions[0]?.id === 'action.item.flail.melee-weapon-attack');

const maceAuthority = resolveDndActorSheetAuthority({
  snapshotPayload: acceptedMace as unknown as Record<string, unknown>, overridePayload: {},
});
check('an explicit empty campaign override still blocks derived actions',
  resolveDndActorSheetAuthority({
    snapshotPayload: acceptedMace as unknown as Record<string, unknown>,
    overridePayload: { dndLiteActorSheetV1: { ...maceAuthority.sheet!, actions: [] } },
  }).sheet?.actions.length === 0);

const hostileIntent = readDndAttackIntent({
  intentId: '11111111-1111-4111-8111-111111111111', actorCombatantId: 'actor', targetCombatantId: 'target',
  actionId: 'action.item.mace.melee-weapon-attack', mode: 'normal', attackBonus: 999, damageFormula: '99d99+999', damageType: 'forged',
});
check('intent parsing discards client-authored weapon statistics',
  JSON.stringify(hostileIntent) === JSON.stringify({
    intentId: '11111111-1111-4111-8111-111111111111', actorCombatantId: 'actor', targetCombatantId: 'target',
    actionId: 'action.item.mace.melee-weapon-attack', mode: 'normal',
  }));
const proposal = resolveDndAttackAction({
  target: { id: 'target', name: 'Target', displayName: 'Target', sourceType: 'manual_npc', kind: 'npc', status: 'active', initiativeModifier: 0, hpCurrent: 20, hpMax: 20, armorClass: 10, conditions: [], isDefeated: false },
  actionPayload: maceAuthority.actionPayload,
  intent: hostileIntent,
  resolutionId: 'profile-resolution',
  random: () => 0.5,
});
check('T12 resolves the newly supported mace from authoritative action payload',
  proposal.publicFacts.attackBonus === 5
    && proposal.publicFacts.damageFormula === '1d6+3'
    && proposal.publicFacts.damageType === 'bludgeoning'
    && proposal.publicFacts.outcome === 'hit'
    && proposal.mutations.length === 1);

const restarted = JSON.parse(JSON.stringify({ snapshotPayload: acceptedMace, overridePayload: {} })) as {
  snapshotPayload: Record<string, unknown>; overridePayload: Record<string, unknown>;
};
check('serialized restart derives the same mace Action identity and payload',
  JSON.stringify(resolveDndActorSheetAuthority(restarted).sheet?.actions) === JSON.stringify(maceAuthority.sheet?.actions));

console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
