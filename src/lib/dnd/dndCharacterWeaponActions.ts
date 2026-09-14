/**
 * Accepted DND Character snapshot -> Lite Sheet weapon actions (v1).
 *
 * Only explicit, source-backed gameplay profiles are executable. The broad
 * equipment catalog remains display data; legacy inventory names and copied
 * client statistics are never parsed or trusted.
 */
import type { AttributeName, CharacterData } from '../dnd-types.js';
import { getDndAbilityModifier, getDndAbilityScore, getDndCharacterProficiencyBonus } from '../dnd2024/dndCharacterCombatMath.js';
import { getDndItemDefinition } from '../dnd2024/dndItemRegistry.js';
import { getDndActionDefinition } from '../dnd2024/gameplay/dndActionDefinitions.js';
import { getDndEffectDefinition } from '../dnd2024/gameplay/dndEffectDefinitions.js';
import { getDndWeaponAttackModeByActionId } from '../dnd2024/gameplay/dndWeaponAttackModes.js';
import type { DndAbilityKey as GameplayAbilityKey, DndDiceFormula } from '../dnd2024/gameplay/rollTypes.js';
import type { DndItemDefinition } from '../dnd2024/equipment-types.js';
import type { DndLiteActorAction } from './dndLiteActorTypes.js';
import { readDndCharacterEquipmentSnapshot } from './dndCharacterEquipmentSnapshot.js';

const GAMEPLAY_TO_CHARACTER_ATTRIBUTE: Record<GameplayAbilityKey, AttributeName> = {
  str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha',
};

export interface DndCharacterWeaponActionDerivation {
  actions: DndLiteActorAction[];
  /** Equipped definition ids that could not prove a complete T12 action. */
  unsupportedDefinitionIds: string[];
}

export interface DndCharacterWeaponActionOptions {
  resolveItemDefinition?: (definitionId: string) => DndItemDefinition | undefined;
}

function selectedAbility(character: CharacterData, options: readonly GameplayAbilityKey[]): AttributeName | undefined {
  let selected: { attribute: AttributeName; modifier: number } | undefined;
  for (const option of options) {
    const attribute = GAMEPLAY_TO_CHARACTER_ATTRIBUTE[option];
    if (!attribute) continue;
    const modifier = getDndAbilityModifier(getDndAbilityScore(character.attrs, attribute));
    // Ties intentionally keep source order. This is a deterministic shortcut
    // policy over the profile's explicitly eligible abilities.
    if (!selected || modifier > selected.modifier) selected = { attribute, modifier };
  }
  return selected?.attribute;
}

function normalizedProficiencies(character: CharacterData): Set<string> {
  return new Set((Array.isArray(character.weaponProficiencies) ? character.weaponProficiencies : [])
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean));
}

function isProficient(character: CharacterData, definition: DndItemDefinition): boolean {
  const proficiencies = normalizedProficiencies(character);
  const identities = [definition.id, definition.nameCn, definition.nameEn, ...(definition.aliases ?? [])]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase());
  if (identities.some((value) => proficiencies.has(value))) return true;
  const category = definition.weapon?.weaponCategory;
  // These labels are the exact resolved proficiency vocabulary stored by the
  // repository's approved class data; no class rules are rerun here.
  return category === 'simple'
    ? proficiencies.has('简易武器')
    : category === 'martial'
      ? proficiencies.has('军用武器')
      : false;
}

function diceFormula(dice: readonly DndDiceFormula[], modifier: number): string | undefined {
  if (dice.length === 0 || dice.some((term) => !Number.isSafeInteger(term.count)
    || !Number.isSafeInteger(term.faces) || term.count < 1 || term.faces < 2)) return undefined;
  const terms = dice.map((term) => `${term.count}d${term.faces}`);
  if (modifier > 0) terms.push(`+${modifier}`);
  if (modifier < 0) terms.push(String(modifier));
  return terms.join('');
}

function deriveForDefinition(character: CharacterData, definition: DndItemDefinition): DndLiteActorAction | undefined {
  const profile = definition.weaponProfile;
  if (definition.system !== 'dnd5e-2024' || definition.category !== 'weapon'
    || definition.sourceStatus !== 'sourced' || profile?.sourceStatus !== 'sourced') return undefined;
  const ability = selectedAbility(character, profile.abilityOptions ?? []);
  if (!ability) return undefined;

  // The mode registry is authoritative for mode identity and availability.
  // Current T12 has no authoritative spatial scale, so deferred thrown/ranged
  // modes are never flattened into a misleading executable Lite Action.
  const action = (profile.generatedActionRefs ?? definition.actionRefs ?? [])
    .map((id) => getDndActionDefinition(id))
    .find((candidate) => candidate?.sourceStatus === 'sourced'
      && candidate.sourceRef === definition.id
      && candidate.kind === 'attack'
      && (() => {
        const mode = getDndWeaponAttackModeByActionId(candidate.id);
        return mode?.attackKind === 'melee' && mode.availability === 'executable';
      })());
  if (!action) return undefined;
  const effect = action.effectRefs.map((id) => getDndEffectDefinition(id))
    .find((candidate) => candidate?.sourceStatus === 'sourced'
      && candidate.sourceRef === definition.id
      && candidate.type === 'damage');
  if (!effect) return undefined;
  const payload = effect.payload as { dice?: DndDiceFormula[]; flat?: number; damageType?: unknown };
  if (!Array.isArray(payload.dice) || payload.flat !== undefined || typeof payload.damageType !== 'string') return undefined;

  const abilityModifier = getDndAbilityModifier(getDndAbilityScore(character.attrs, ability));
  const damageFormula = diceFormula(payload.dice, abilityModifier);
  if (!damageFormula) return undefined;
  const attackBonus = abilityModifier + (isProficient(character, definition)
    ? getDndCharacterProficiencyBonus(character.level)
    : 0);

  return {
    id: action.id,
    name: action.name,
    kind: 'weapon_attack',
    attackBonus,
    damageFormula,
    damageType: payload.damageType,
  };
}

/** Pure, deterministic derivation from one accepted CharacterData snapshot. */
export function deriveDndWeaponActionsFromCharacterSnapshot(
  character: CharacterData,
  options: DndCharacterWeaponActionOptions = {},
): DndCharacterWeaponActionDerivation {
  const equipment = readDndCharacterEquipmentSnapshot(character);
  if (!equipment) return { actions: [], unsupportedDefinitionIds: [] };
  const resolveDefinition = options.resolveItemDefinition ?? getDndItemDefinition;
  const equippedDefinitionIds = [...new Set(equipment.items
    .filter((item) => item.equipSlot === 'mainHand' || item.equipSlot === 'offHand')
    .map((item) => item.definitionId))].sort();
  const actions: DndLiteActorAction[] = [];
  const unsupportedDefinitionIds: string[] = [];
  for (const definitionId of equippedDefinitionIds) {
    const definition = resolveDefinition(definitionId);
    const action = definition ? deriveForDefinition(character, definition) : undefined;
    if (action) actions.push(action);
    else unsupportedDefinitionIds.push(definitionId);
  }
  return { actions: actions.sort((a, b) => a.id.localeCompare(b.id)), unsupportedDefinitionIds };
}
