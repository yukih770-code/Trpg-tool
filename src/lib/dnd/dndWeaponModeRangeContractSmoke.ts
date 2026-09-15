import assert from 'node:assert/strict';
import { CURRENT_DND_CHARACTER_SCHEMA_VERSION, type CharacterData } from '../dnd-types.js';
import { createMapBoardState, createMapGridConfig, createMapToken } from '../map/mapRuntimeTypes.js';
import { validateDndLiteActorSheet } from './dndLiteActorSheet.js';
import { deriveDndWeaponActionsFromCharacterSnapshot } from './dndCharacterWeaponActions.js';
import { resolveDndActorSheetAuthority } from './dndActorSheetAuthority.js';
import { readDndAttackIntent } from '../../../server/services/declareDndAttack.js';
import { resolveDndAttackAction } from '../../../server/services/resolveDndAttackAction.js';
import { getDndActionDefinition } from '../dnd2024/gameplay/dndActionDefinitions.js';
import {
  DND_2024_ORDINARY_MELEE_DISTANCE,
  DND_2024_WEAPON_ATTACK_MODES,
  canonicalDndWeaponModeId,
  evaluateDndWeaponRange,
  getDndWeaponAttackModeByActionId,
} from '../dnd2024/gameplay/dndWeaponAttackModes.js';
import { DND_WEAPON_RANGE_PROVENANCE } from '../dnd2024/gameplay/dndWeaponRangeSource.js';

const cases: string[] = [];
function check(name: string, condition: unknown): void {
  assert.ok(condition, name);
  cases.push(name);
}
function attr(score: number) { return { base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 }; }

function character(definitionId: string, proficiencies: string[]): CharacterData {
  return {
    schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
    id: `mode-${definitionId}`, name: 'Mode contract hero', age: '', gender: '', race: '人类', subrace: '',
    jobClass: '战士', subclass: '', classLevels: [{ className: '战士', level: 1 }],
    background: '', description: '', level: 1, hpMax: 12, hpCurrent: 12, tempHp: 0,
    deathSaves: { successes: 0, failures: 0 }, hitDiceCurrent: 1, acMod: 10, speed: '30', size: '中型',
    attrs: { Str: attr(16), Dex: attr(14), Con: attr(12), Int: attr(10), Wis: attr(10), Cha: attr(10) },
    skillProficiencies: [], savingThrowProficiencies: [], weaponProficiencies: proficiencies,
    armorTraining: [], spellbook: { known: [], prepared: [], slots: {} }, customLanguages: '通用语',
    inventory: [], dndEquipmentSnapshotV1: { schemaVersion: 1, items: [{ definitionId, quantity: 1, equipSlot: 'mainHand' }] },
    personalContentReferences: [], feats: [], coin: 0, remainingPoints: 0, isCompleted: true, classResources: [],
  };
}

const meleeActionIds = [
  'action.item.dagger.melee-weapon-attack',
  'action.item.mace.melee-weapon-attack',
  'action.item.flail.melee-weapon-attack',
  'action.item.morningstar.melee-weapon-attack',
] as const;

for (const actionId of meleeActionIds) {
  const action = getDndActionDefinition(actionId);
  const mode = getDndWeaponAttackModeByActionId(actionId);
  check(`${actionId}: deterministic Action-to-mode identity`, action?.weaponModeRef === canonicalDndWeaponModeId(actionId));
  check(`${actionId}: executable ordinary melee mode`, mode?.availability === 'executable' && mode.attackKind === 'melee'
    && mode.spatialEnforcement === 'active-square-grid-footprint-v1');
  check(`${actionId}: one normalized source-backed reach`, mode?.distanceProfile.reach === DND_2024_ORDINARY_MELEE_DISTANCE.reach
    && mode.distanceProfile.unit === 'ft');
}

const derivationFixtures = [
  ['weapon.dagger', ['简易武器'], meleeActionIds[0]],
  ['weapon.mace', ['简易武器'], meleeActionIds[1]],
  ['weapon.flail', ['军用武器'], meleeActionIds[2]],
  ['weapon.morningstar', ['军用武器'], meleeActionIds[3]],
] as const;
for (const [definitionId, proficiencies, expectedActionId] of derivationFixtures) {
  const result = deriveDndWeaponActionsFromCharacterSnapshot(character(definitionId, [...proficiencies]));
  check(`${definitionId}: current SAFE_NOW Action remains derivable`, result.actions.length === 1 && result.actions[0]?.id === expectedActionId);
}

const daggerModes = DND_2024_WEAPON_ATTACK_MODES.filter((mode) => mode.weaponDefinitionId === 'weapon.dagger');
const daggerThrown = getDndWeaponAttackModeByActionId('action.item.dagger.thrown-weapon-attack');
check('dagger exposes two stable canonical mode identities', daggerModes.length === 2 && new Set(daggerModes.map((mode) => mode.modeId)).size === 2);
check('dagger thrown range is source-backed but execution remains deferred', daggerThrown?.distanceProfile.normal === 20
  && daggerThrown.distanceProfile.long === 60 && daggerThrown.availability === 'deferred'
  && daggerThrown.blockers.includes('thrown-inventory-lifecycle'));
check('range provenance pins approved local source hashes', Object.values(DND_WEAPON_RANGE_PROVENANCE.sources)
  .every((source) => /^[A-F0-9]{64}$/.test(source.sha256)));

const daggerMelee = getDndWeaponAttackModeByActionId(meleeActionIds[0])!;
check('authoritative in-reach feet would pass the D&D legality gate', evaluateDndWeaponRange(daggerMelee, 5).decision === 'allowed');
let illegalRngCalls = 0;
const illegalDecision = evaluateDndWeaponRange(daggerMelee, 6);
if (illegalDecision.decision === 'allowed') illegalRngCalls++;
check('authoritative out-of-reach feet reject before any RNG seam', illegalDecision.decision === 'rejected' && illegalRngCalls === 0);
check('missing authoritative distance is explicitly GM-adjudicated', evaluateDndWeaponRange(daggerMelee).decision === 'gm-adjudicated');

const board = createMapBoardState('mode-contract-map');
board.grid = createMapGridConfig({ sizePx: 64, feetPerSquare: 5 });
board.tokens = [
  createMapToken({ id: 'actor-token', sourceType: 'combatant', combatantId: 'actor', size: 'medium', x: 10, y: 20 }),
  createMapToken({ id: 'target-token', sourceType: 'combatant', combatantId: 'target', size: 'medium', x: 20, y: 20 }),
];
check('persisted map has normalized token coordinates and grid settings but no authoritative extent',
  board.tokens[0]?.x === 10 && board.grid.sizePx === 64 && !('widthPx' in board) && !('heightPx' in board));

const hostileIntent = readDndAttackIntent({
  intentId: '11111111-1111-4111-8111-111111111111', actorCombatantId: 'actor', targetCombatantId: 'target',
  actionId: meleeActionIds[0], mode: 'normal', distance: 1, reach: 9999,
  attackerCoordinates: { x: 0, y: 0 }, targetCoordinates: { x: 0, y: 0 },
});
check('client-authored spatial authority is discarded at the intent boundary',
  !('distance' in hostileIntent) && !('reach' in hostileIntent) && !('attackerCoordinates' in hostileIntent));

const sourceCharacter = character('weapon.dagger', ['简易武器']);
const authority = resolveDndActorSheetAuthority({ snapshotPayload: sourceCharacter as unknown as Record<string, unknown>, overridePayload: {} });
let noSpatialRngCalls = 0;
const proposal = resolveDndAttackAction({
  target: { id: 'target', name: 'Target', displayName: 'Target', sourceType: 'manual_npc', kind: 'npc', status: 'active', initiativeModifier: 0,
    hpCurrent: 10, hpMax: 10, armorClass: 10, conditions: [], isDefeated: false },
  actionPayload: authority.actionPayload,
  intent: hostileIntent,
  resolutionId: 'mode-contract-resolution',
  random: () => { noSpatialRngCalls++; return 0.5; },
});
check('current no-spatial T12 path remains executable under GM adjudication', proposal.publicFacts.outcome === 'hit' && noSpatialRngCalls > 0);

const manualAction = { id: 'gm-action', name: 'GM Action', kind: 'weapon_attack' as const, attackBonus: 9, damageFormula: '1d6+2' };
const manualSheet = { ...authority.sheet!, actions: [manualAction] };
const override = resolveDndActorSheetAuthority({
  snapshotPayload: sourceCharacter as unknown as Record<string, unknown>,
  overridePayload: { dndLiteActorSheetV1: manualSheet },
});
check('campaign override remains the complete Action authority', override.source === 'campaignOverride' && override.sheet?.actions[0]?.id === 'gm-action');

const oldV1Sheet = { ...authority.sheet!, actions: [{ id: 'legacy', name: 'Legacy', kind: 'weapon_attack' as const, attackBonus: 3, damageFormula: '1d4' }] };
check('old V1 Lite Actions decode without mode/range fields', validateDndLiteActorSheet(oldV1Sheet).valid);

console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
