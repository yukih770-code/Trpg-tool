import type { DndItemDefinition } from '../equipment-types.js';
import type { DndAbilityKey } from './rollTypes.js';
import type { DndRangeProfile } from './actionTypes.js';
import { DND_2024_ACTION_DEFINITIONS } from './dndActionDefinitions.js';
import { DND_2024_EFFECT_DEFINITIONS } from './dndEffectDefinitions.js';
import { DND_2024_ORDINARY_MELEE_DISTANCE, DND_WEAPON_RANGE_PROVENANCE } from './dndWeaponRangeSource.js';

export type DndWeaponAttackKind = 'melee' | 'thrown' | 'ranged';
export type DndWeaponModeAvailability = 'executable' | 'deferred';
export type DndWeaponSpatialEnforcement = 'blocked-spatial-scale';
export type DndWeaponModeBlocker =
  | 'authoritative-spatial-scale'
  | 'long-range-consequence'
  | 'thrown-inventory-lifecycle'
  | 'ammunition-lifecycle';

export interface DndWeaponAttackMode {
  modeId: string;
  weaponDefinitionId: string;
  actionDefinitionId: string;
  effectDefinitionId: string;
  attackKind: DndWeaponAttackKind;
  abilityRule: { eligibleAbilities: readonly DndAbilityKey[] };
  proficiencyRule: { weaponCategory: 'simple' | 'martial' };
  distanceProfile: Readonly<DndRangeProfile>;
  availability: DndWeaponModeAvailability;
  spatialEnforcement: DndWeaponSpatialEnforcement;
  blockers: readonly DndWeaponModeBlocker[];
  sourceRefs: readonly string[];
}

export type DndWeaponRangeDecision =
  | { decision: 'gm-adjudicated'; reason: 'authoritative-spatial-context-unavailable' }
  | { decision: 'allowed'; distanceFeet: number; maximumFeet: number }
  | { decision: 'rejected'; reason: 'outside-melee-reach'; distanceFeet: number; maximumFeet: number }
  | { decision: 'deferred'; reason: DndWeaponModeBlocker };

/** Stable one-to-one identity mapping; existing Action IDs are never rewritten. */
export function canonicalDndWeaponModeId(actionDefinitionId: string): string {
  if (!actionDefinitionId.startsWith('action.item.')) throw new Error(`Unsupported weapon Action identity: ${actionDefinitionId}`);
  return `mode.${actionDefinitionId.slice('action.'.length)}`;
}

type ModeSpec = {
  weaponDefinitionId: string;
  actionDefinitionId: string;
  attackKind: DndWeaponAttackKind;
  abilityOptions: readonly DndAbilityKey[];
  weaponCategory: 'simple' | 'martial';
  availability: DndWeaponModeAvailability;
  blockers?: readonly DndWeaponModeBlocker[];
};

function buildMode(spec: ModeSpec): DndWeaponAttackMode {
  const action = DND_2024_ACTION_DEFINITIONS[spec.actionDefinitionId];
  if (!action || action.sourceRef !== spec.weaponDefinitionId || action.effectRefs.length !== 1) {
    throw new Error(`Incomplete canonical weapon mode: ${spec.actionDefinitionId}`);
  }
  const effectDefinitionId = action.effectRefs[0];
  const effect = DND_2024_EFFECT_DEFINITIONS[effectDefinitionId];
  if (!effect || effect.sourceRef !== spec.weaponDefinitionId || effect.type !== 'damage') {
    throw new Error(`Incomplete canonical weapon mode damage effect: ${spec.actionDefinitionId}`);
  }
  const distanceProfile = action.targeting.range;
  if (!distanceProfile || distanceProfile.unit !== 'ft') {
    throw new Error(`Missing approved weapon distance profile: ${spec.actionDefinitionId}`);
  }
  const modeId = canonicalDndWeaponModeId(action.id);
  if (action.weaponModeRef !== modeId) throw new Error(`Weapon Action/mode identity mismatch: ${action.id}`);
  return {
    modeId,
    weaponDefinitionId: spec.weaponDefinitionId,
    actionDefinitionId: action.id,
    effectDefinitionId,
    attackKind: spec.attackKind,
    abilityRule: { eligibleAbilities: spec.abilityOptions },
    proficiencyRule: { weaponCategory: spec.weaponCategory },
    distanceProfile,
    availability: spec.availability,
    spatialEnforcement: 'blocked-spatial-scale',
    blockers: spec.blockers ?? ['authoritative-spatial-scale'],
    sourceRefs: [
      DND_WEAPON_RANGE_PROVENANCE.sources.weapons.sourceRef,
      DND_WEAPON_RANGE_PROVENANCE.sources.attackAbilities.sourceRef,
      spec.attackKind === 'melee'
        ? DND_WEAPON_RANGE_PROVENANCE.sources.meleeAttacks.sourceRef
        : DND_WEAPON_RANGE_PROVENANCE.sources.rangedAttacks.sourceRef,
      ...(spec.attackKind === 'thrown' ? [DND_WEAPON_RANGE_PROVENANCE.sources.weaponProperties.sourceRef] : []),
    ],
  };
}

const MODE_SPECS: readonly ModeSpec[] = [
  {
    weaponDefinitionId: 'weapon.dagger',
    actionDefinitionId: 'action.item.dagger.melee-weapon-attack',
    attackKind: 'melee', abilityOptions: ['str', 'dex'], weaponCategory: 'simple', availability: 'executable',
  },
  {
    weaponDefinitionId: 'weapon.dagger',
    actionDefinitionId: 'action.item.dagger.thrown-weapon-attack',
    attackKind: 'thrown', abilityOptions: ['str', 'dex'], weaponCategory: 'simple', availability: 'deferred',
    blockers: ['authoritative-spatial-scale', 'long-range-consequence', 'thrown-inventory-lifecycle'],
  },
  {
    weaponDefinitionId: 'weapon.mace',
    actionDefinitionId: 'action.item.mace.melee-weapon-attack',
    attackKind: 'melee', abilityOptions: ['str'], weaponCategory: 'simple', availability: 'executable',
  },
  {
    weaponDefinitionId: 'weapon.flail',
    actionDefinitionId: 'action.item.flail.melee-weapon-attack',
    attackKind: 'melee', abilityOptions: ['str'], weaponCategory: 'martial', availability: 'executable',
  },
  {
    weaponDefinitionId: 'weapon.morningstar',
    actionDefinitionId: 'action.item.morningstar.melee-weapon-attack',
    attackKind: 'melee', abilityOptions: ['str'], weaponCategory: 'martial', availability: 'executable',
  },
] as const;

export const DND_2024_WEAPON_ATTACK_MODES: readonly DndWeaponAttackMode[] = MODE_SPECS.map(buildMode);

const MODE_BY_ACTION_ID = new Map(DND_2024_WEAPON_ATTACK_MODES.map((mode) => [mode.actionDefinitionId, mode]));

export function getDndWeaponAttackModeByActionId(actionDefinitionId: string): DndWeaponAttackMode | undefined {
  return MODE_BY_ACTION_ID.get(actionDefinitionId);
}

export function getDndWeaponAttackModesForDefinition(definition: Pick<DndItemDefinition, 'id'>): readonly DndWeaponAttackMode[] {
  return DND_2024_WEAPON_ATTACK_MODES.filter((mode) => mode.weaponDefinitionId === definition.id);
}

/**
 * D&D-only range comparison for a future authoritative platform distance.
 * Current T12 deliberately does not call this: persisted map state cannot
 * produce authoritative feet. Missing distance therefore remains GM-adjudicated.
 */
export function evaluateDndWeaponRange(
  mode: DndWeaponAttackMode,
  authoritativeDistanceFeet?: number,
): DndWeaponRangeDecision {
  if (authoritativeDistanceFeet === undefined) {
    return { decision: 'gm-adjudicated', reason: 'authoritative-spatial-context-unavailable' };
  }
  if (!Number.isFinite(authoritativeDistanceFeet) || authoritativeDistanceFeet < 0) {
    throw new Error('invalid_authoritative_distance');
  }
  if (mode.availability === 'deferred') {
    return { decision: 'deferred', reason: mode.blockers[0] ?? 'authoritative-spatial-scale' };
  }
  if (mode.attackKind !== 'melee' || mode.distanceProfile.reach === undefined) {
    return { decision: 'deferred', reason: mode.blockers[0] ?? 'authoritative-spatial-scale' };
  }
  return authoritativeDistanceFeet <= mode.distanceProfile.reach
    ? { decision: 'allowed', distanceFeet: authoritativeDistanceFeet, maximumFeet: mode.distanceProfile.reach }
    : { decision: 'rejected', reason: 'outside-melee-reach', distanceFeet: authoritativeDistanceFeet, maximumFeet: mode.distanceProfile.reach };
}

export { DND_2024_ORDINARY_MELEE_DISTANCE };
