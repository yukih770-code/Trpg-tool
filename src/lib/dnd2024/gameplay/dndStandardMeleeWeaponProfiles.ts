/**
 * Source-backed gameplay bundles for the property-free melee weapon cohort.
 *
 * This module normalizes approved local-source rows into the existing D&D item,
 * Action, and Effect contracts. It does not copy weapon damage values: dice and
 * localized damage types are read from the owner-source-matched catalog row.
 */
import { DND_BASIC_WEAPONS } from '../../../data/dnd2024/equipment.js';
import type { DndItemDefinition } from '../equipment-types.js';
import type { DndActionDefinition } from './actionTypes.js';
import type { DndEffectDefinition, DndDamageType } from './effectTypes.js';
import type { DndDiceFormula } from './rollTypes.js';
import { DND_2024_ORDINARY_MELEE_DISTANCE } from './dndWeaponRangeSource.js';

export const DND_STANDARD_MELEE_PROFILE_PROVENANCE = {
  sourceId: 'dnd-local-chm-primary',
  trustLevel: 'owner-source-matched',
  sources: {
    weapons: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/装备/武器.htm',
      sha256: 'DFFA4E8D79C3A97C18FBD3631045A9DDD318A916A960A19C53F8BF2191EC89F7',
    },
    attackAbilities: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/进行游戏/攻击检定.htm',
      sha256: 'A68E5D5A5772612FA80292B98CF1A33DB04ACA9F3C66E5E539CF6AED93674DDC',
    },
    damageModifier: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/进行游戏/伤害掷骰.htm',
      sha256: 'A180381967EBDDEF252D0AFD0A44D040307759694739363EE966C6A9A3BBBBB6',
    },
    damageTypes: {
      sourceRef: 'dnd-local-chm-primary:玩家手册2024/术语汇编/其他术语.htm',
      sha256: '7F5E4DB04CAFE2C911597C925BABF45972BEA3955117F2494C7EB1720E4101CC',
    },
  },
} as const;

const DAMAGE_TYPE_BY_SOURCE_LABEL: Readonly<Record<string, DndDamageType>> = {
  钝击: 'bludgeoning',
  穿刺: 'piercing',
};

/** IDs select the reviewed cohort; all executable numbers/types come from source rows. */
const STANDARD_MELEE_COHORT = [
  'weapon.mace',
  'weapon.flail',
  'weapon.morningstar',
] as const;

function parseSingleDice(sourceValue: string | undefined, definitionId: string): DndDiceFormula[] {
  const match = sourceValue?.match(/^(\d+)d(\d+)$/i);
  if (!match) throw new Error(`Approved standard-melee cohort has unsupported damage dice: ${definitionId}`);
  const count = Number(match[1]);
  const faces = Number(match[2]);
  if (!Number.isSafeInteger(count) || !Number.isSafeInteger(faces) || count < 1 || faces < 2) {
    throw new Error(`Approved standard-melee cohort has invalid damage dice: ${definitionId}`);
  }
  return [{ count, faces }];
}

export interface DndStandardMeleeWeaponGameplayBundle {
  weaponDefinitionId: string;
  itemGameplay: Pick<DndItemDefinition, 'actionRefs' | 'weaponProfile'>;
  action: DndActionDefinition;
  effect: DndEffectDefinition;
}

function buildBundle(weaponDefinitionId: typeof STANDARD_MELEE_COHORT[number]): DndStandardMeleeWeaponGameplayBundle {
  const source = DND_BASIC_WEAPONS.find((weapon) => weapon.id === weaponDefinitionId);
  if (!source || source.source !== DND_STANDARD_MELEE_PROFILE_PROVENANCE.sourceId
    || source.sourceRef !== DND_STANDARD_MELEE_PROFILE_PROVENANCE.sources.weapons.sourceRef
    || (source.weaponCategory !== 'simpleMelee' && source.weaponCategory !== 'martialMelee')
    || source.properties.length !== 0 || source.range !== undefined) {
    throw new Error(`Standard-melee cohort source contract failed: ${weaponDefinitionId}`);
  }
  const damageType = source.damageType ? DAMAGE_TYPE_BY_SOURCE_LABEL[source.damageType] : undefined;
  if (!damageType) throw new Error(`Standard-melee cohort has no approved damage-type mapping: ${weaponDefinitionId}`);
  const dice = parseSingleDice(source.damageDice, weaponDefinitionId);
  const slug = source.id.replace(/^weapon\./, '');
  const actionId = `action.item.${slug}.melee-weapon-attack`;
  const effectId = `effect.item.${slug}.${damageType}-damage`;
  const name = source.nameCn ?? source.name;

  return {
    weaponDefinitionId: source.id,
    itemGameplay: {
      actionRefs: [actionId],
      weaponProfile: {
        properties: [],
        damage: { dice, damageType },
        abilityOptions: ['str'],
        reach: DND_2024_ORDINARY_MELEE_DISTANCE.reach,
        generatedActionRefs: [actionId],
        sourceStatus: 'sourced',
        note: 'Property-free melee profile normalized from owner-approved weapon, attack-roll, damage-roll, and damage-type sources.',
      },
    },
    action: {
      id: actionId,
      name: `${name}近战攻击`,
      sourceType: 'item',
      sourceRef: source.id,
      kind: 'attack',
      actionCost: { type: 'action' },
      targeting: { targetType: 'creature', range: DND_2024_ORDINARY_MELEE_DISTANCE },
      rollProfile: {
        mode: 'attack',
        targetDefense: 'ac',
        ability: 'str',
        note: 'Ordinary melee weapon attack uses Strength per the approved attack-roll source.',
      },
      effectRefs: [effectId],
      weaponModeRef: `mode.item.${slug}.melee-weapon-attack`,
      tags: ['weapon', 'melee', slug],
      sourceStatus: 'sourced',
      note: 'Canonical property-free melee attack normalized from approved local sources.',
    },
    effect: {
      id: effectId,
      name: `${name}${source.damageType}伤害`,
      type: 'damage',
      payload: { dice, damageType },
      sourceRef: source.id,
      sourceStatus: 'sourced',
      note: 'Damage dice/type come from the approved weapon row; Character derivation adds the same Strength modifier used by the attack.',
    },
  };
}

export const DND_STANDARD_MELEE_WEAPON_GAMEPLAY_BUNDLES: readonly DndStandardMeleeWeaponGameplayBundle[] =
  STANDARD_MELEE_COHORT.map(buildBundle);

export const DND_STANDARD_MELEE_ITEM_GAMEPLAY_BY_ID = new Map(
  DND_STANDARD_MELEE_WEAPON_GAMEPLAY_BUNDLES.map((bundle) => [bundle.weaponDefinitionId, bundle.itemGameplay]),
);

export const DND_STANDARD_MELEE_ACTION_DEFINITIONS: Record<string, DndActionDefinition> = Object.fromEntries(
  DND_STANDARD_MELEE_WEAPON_GAMEPLAY_BUNDLES.map((bundle) => [bundle.action.id, bundle.action]),
);

export const DND_STANDARD_MELEE_EFFECT_DEFINITIONS: Record<string, DndEffectDefinition> = Object.fromEntries(
  DND_STANDARD_MELEE_WEAPON_GAMEPLAY_BUNDLES.map((bundle) => [bundle.effect.id, bundle.effect]),
);
