import { CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../dnd-types';
import type { AttributeName, CharacterData } from '../dnd-types';
import { validateDndLiteActorSheet } from './dndLiteActorSheet';
import { deriveDndWeaponActionsFromCharacterSnapshot } from './dndCharacterWeaponActions';
import { dndCharacterToLiteActorSheet } from './dndCharacterToLiteActorSheet';
import { resolveDndActorSheetAuthority } from './dndActorSheetAuthority';
import { buildDndCharacterSourceReview } from './dndCharacterSourceReview';
import { formatDndCharacterCombatRelevantHash } from '../../../server/services/dndCharacterCombatRelevantHash';
import { resolveDndAttackAction } from '../../../server/services/resolveDndAttackAction';
import { buildStarterEquipmentPlan } from '../dnd2024/dndStarterEquipmentPlan';

const cases: string[] = [];
function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}
function attr(score: number) { return { base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 }; }

function character(overrides: Partial<CharacterData> = {}): CharacterData {
  const attrs: CharacterData['attrs'] = {
    Str: attr(12), Dex: attr(16), Con: attr(10), Int: attr(10), Wis: attr(10), Cha: attr(10),
  };
  return {
    schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
    id: 'weapon-smoke', name: '刃影', age: '', gender: '', race: '人类', subrace: '',
    jobClass: '战士', subclass: '', classLevels: [{ className: '战士', level: 1 }],
    background: '', description: '', level: 1, hpMax: 10, hpCurrent: 10, tempHp: 0,
    deathSaves: { successes: 0, failures: 0 }, hitDiceCurrent: 1, acMod: 10, speed: '30', size: '中型',
    attrs, skillProficiencies: [], savingThrowProficiencies: [], weaponProficiencies: ['简易武器'],
    armorTraining: [], spellbook: { known: [], prepared: [], slots: {} }, customLanguages: '通用语',
    inventory: [], dndEquipmentSnapshotV1: {
      schemaVersion: 1,
      items: [{ definitionId: 'weapon.dagger', quantity: 1, equipSlot: 'mainHand' }],
    },
    personalContentReferences: [], feats: [], coin: 0, remainingPoints: 0, isCompleted: true,
    classResources: [], ...overrides,
  };
}

const supported = character();
const rogueStarter = buildStarterEquipmentPlan('细剑 或 短剑, 短弓及20支箭 或 短剑, 盗贼套件, 盗贼工具, 皮甲, 两把匕首');
const starterDaggers = rogueStarter.fixed.find((item) => item.definitionId === 'weapon.dagger');
check('owner-source Chinese counter resolves two canonical daggers', starterDaggers?.label === '匕首' && starterDaggers.quantity === 2);
const derived = deriveDndWeaponActionsFromCharacterSnapshot(supported);
const dagger = derived.actions[0];
check('recognized sourced equipped dagger produces one action', derived.actions.length === 1);
check('action reuses the approved stable action id', dagger.id === 'action.item.dagger.melee-weapon-attack');
check('eligible ability selection uses the higher explicit profile option', dagger.attackBonus === 5);
check('damage uses approved effect dice type and chosen ability modifier', dagger.damageFormula === '1d4+3' && dagger.damageType === 'piercing');
check('T9 sheet contains the derived action and remains valid', (() => {
  const sheet = dndCharacterToLiteActorSheet(supported).sheet;
  return sheet.actions[0]?.id === dagger.id && validateDndLiteActorSheet(sheet).valid;
})());

const nonProficient = deriveDndWeaponActionsFromCharacterSnapshot(character({ weaponProficiencies: [] })).actions[0];
check('non-proficient weapon omits proficiency bonus', nonProficient.attackBonus === 3);

const strong = character({
  attrs: { ...supported.attrs, Str: attr(18), Dex: attr(12) },
});
const strongAction = deriveDndWeaponActionsFromCharacterSnapshot(strong).actions[0];
check('ability selection follows approved options deterministically', strongAction.attackBonus === 6 && strongAction.damageFormula === '1d4+4');

const duplicate = character({
  dndEquipmentSnapshotV1: {
    schemaVersion: 1,
    items: [
      { definitionId: 'weapon.dagger', quantity: 1, equipSlot: 'offHand' },
      { definitionId: 'weapon.dagger', quantity: 2, equipSlot: 'mainHand' },
    ],
  },
});
const duplicateFirst = deriveDndWeaponActionsFromCharacterSnapshot(duplicate);
const duplicateSecond = deriveDndWeaponActionsFromCharacterSnapshot(JSON.parse(JSON.stringify(duplicate)) as CharacterData);
check('duplicate owned instances collapse to one type-level action', duplicateFirst.actions.length === 1);
check('identical snapshots derive byte-equivalent stable actions', JSON.stringify(duplicateFirst) === JSON.stringify(duplicateSecond));

const backpackOnly = character({ dndEquipmentSnapshotV1: { schemaVersion: 1, items: [{ definitionId: 'weapon.dagger', quantity: 1 }] } });
check('owned but unequipped weapon produces no shortcut', deriveDndWeaponActionsFromCharacterSnapshot(backpackOnly).actions.length === 0);
const unknown = character({ dndEquipmentSnapshotV1: { schemaVersion: 1, items: [{ definitionId: 'custom.maybe-sword', quantity: 1, equipSlot: 'mainHand' }] } });
const unknownResult = deriveDndWeaponActionsFromCharacterSnapshot(unknown);
check('unknown typed equipment fabricates no action', unknownResult.actions.length === 0 && unknownResult.unsupportedDefinitionIds[0] === 'custom.maybe-sword');
check('legacy free-text inventory fabricates no action', deriveDndWeaponActionsFromCharacterSnapshot(character({ inventory: ['Long Sword +1 maybe'], dndEquipmentSnapshotV1: undefined })).actions.length === 0);

const acceptedAuthority = resolveDndActorSheetAuthority({ snapshotPayload: supported as unknown as Record<string, unknown>, overridePayload: {} });
check('no campaign override uses accepted Character derivation', acceptedAuthority.source === 'acceptedCharacter' && acceptedAuthority.sheet?.actions[0]?.id === dagger.id);
const emptyOverride = resolveDndActorSheetAuthority({
  snapshotPayload: supported as unknown as Record<string, unknown>,
  overridePayload: { dndLiteActorSheetV1: { ...acceptedAuthority.sheet!, actions: [] } },
});
check('intentional empty manual override blocks source actions', emptyOverride.source === 'campaignOverride' && emptyOverride.sheet?.actions.length === 0);
const manualSheet = { ...acceptedAuthority.sheet!, actions: [{ id: 'gm-action', name: 'GM action', kind: 'weapon_attack' as const, attackBonus: 9, damageFormula: '1d6+2' }] };
const manual = resolveDndActorSheetAuthority({
  snapshotPayload: supported as unknown as Record<string, unknown>,
  overridePayload: { dndLiteActorSheetV1: manualSheet },
});
check('manual campaign action remains the complete authority', manual.sheet?.actions[0]?.id === 'gm-action' && manual.sheet.actions.length === 1);

const changed = character({ attrs: { ...supported.attrs, Dex: attr(18) } });
const review = buildDndCharacterSourceReview({ acceptedPayload: supported, currentPayload: changed });
check('T11 review exposes the derived weapon action change', review.status === 'changed' && review.changedFields.some((field) => field.key === 'actions.weaponAttacks'));
check('T11 hash changes for action-relevant character state', formatDndCharacterCombatRelevantHash(supported) !== formatDndCharacterCombatRelevantHash(changed));
check('unaccepted source cannot change accepted action', resolveDndActorSheetAuthority({ snapshotPayload: supported as unknown as Record<string, unknown>, overridePayload: {} }).sheet?.actions[0]?.attackBonus === 5);
check('advancing the accepted snapshot advances a non-overridden action', resolveDndActorSheetAuthority({ snapshotPayload: changed as unknown as Record<string, unknown>, overridePayload: {} }).sheet?.actions[0]?.attackBonus === 6);

const proposal = resolveDndAttackAction({
  target: { id: 'target', name: 'Target', displayName: 'Target', sourceType: 'manual_npc', kind: 'npc', status: 'active', initiativeModifier: 0, hpCurrent: 10, hpMax: 10, armorClass: 10, conditions: [], isDefeated: false },
  actionPayload: acceptedAuthority.actionPayload,
  intent: { intentId: 'intent', actorCombatantId: 'actor', targetCombatantId: 'target', actionId: dagger.id, mode: 'normal' },
  resolutionId: 'resolution',
  random: () => 0.5,
});
check('actual T12 resolver accepts and resolves the derived action', proposal.publicFacts.attackBonus === 5 && proposal.publicFacts.outcome === 'hit' && proposal.mutations.length === 1);

const restarted = JSON.parse(JSON.stringify({ snapshotPayload: supported, overridePayload: {} })) as {
  snapshotPayload: Record<string, unknown>; overridePayload: Record<string, unknown>;
};
check('serialized restart derives the same action', JSON.stringify(resolveDndActorSheetAuthority(restarted).sheet?.actions) === JSON.stringify(acceptedAuthority.sheet?.actions));

console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
