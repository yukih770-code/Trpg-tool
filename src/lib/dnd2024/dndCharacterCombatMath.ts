/**
 * Shared DND 2024 character combat math.
 *
 * AI-LANDMARK: DND_CHARACTER_COMBAT_MATH_V1
 *
 * Single home for the four formulas that were previously written inline in more
 * than one place: ability score total, ability modifier, proficiency bonus and
 * armour class. Extracted so a derivation of a character can never disagree with
 * the character sheet it derives from.
 *
 * These are PURE functions of `CharacterData`. They read no store, perform no
 * I/O, and produce no RuntimeLog event. Nothing here decides authority — a value
 * returned by this module is a proposal until a host confirms it.
 */

import type { AttributeName, CharacterAttributes } from '../dnd-types.js';
import { getProficiencyBonus } from './progression-utils.js';

/** Class name that grants Unarmoured Defence in the bundled 2024 class data. */
export const DND_UNARMORED_DEFENSE_CLASS_NAME = '野蛮人';

/**
 * `CharacterData.acMod` defaults to 10 and is used by the sheet as the BASE
 * armour class, not as an adjustment on top of 10 — a value of exactly 10 is the
 * only signal available that the character is wearing no armour, because
 * `CharacterData` has no armour slot.
 */
export const DND_UNARMORED_BASE_ARMOR_CLASS = 10;

/**
 * Total ability score: the four additive parts a builder writes separately.
 * Mirrors `Sheet.tsx` exactly.
 */
export function getDndAbilityScore(attrs: CharacterAttributes, attr: AttributeName): number {
  const data = attrs[attr];
  return data.base + data.pointbuy + data.racebonus + data.extrabonus;
}

/** Standard 5e ability modifier. */
export function getDndAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Score and modifier together, matching the shape the sheet renders. */
export function getDndAbilityData(
  attrs: CharacterAttributes,
  attr: AttributeName,
): { score: number; mod: number } {
  const score = getDndAbilityScore(attrs, attr);
  return { score, mod: getDndAbilityModifier(score) };
}

/**
 * Proficiency bonus for a character level.
 *
 * Delegates to the banded table in `progression-utils`, which clamps a level
 * outside 1-20 to 2 rather than extrapolating. For every reachable level the
 * result is identical to the `Math.ceil(1 + level / 4)` form this replaces;
 * `dndCharacterToLiteActorSheetSmoke` pins the two against each other.
 */
export function getDndCharacterProficiencyBonus(level: number): number {
  return getProficiencyBonus(level);
}

/**
 * Armour class as the character sheet computes it.
 *
 * APPROXIMATE BY CONSTRUCTION: `CharacterData` carries no armour slot, no
 * shield and no magic bonus, so `acMod` is the whole armour story and the
 * unarmoured-defence branch can only be detected by `acMod === 10`. Callers that
 * surface this value to a host should mark it as needing review.
 */
export function getDndCharacterArmorClass(input: {
  acMod: number;
  attrs: CharacterAttributes;
  jobClass: string;
}): number {
  const dexMod = getDndAbilityModifier(getDndAbilityScore(input.attrs, 'Dex'));
  const conMod = getDndAbilityModifier(getDndAbilityScore(input.attrs, 'Con'));
  let acTotal = input.acMod + dexMod;
  if (
    input.jobClass === DND_UNARMORED_DEFENSE_CLASS_NAME
    && input.acMod === DND_UNARMORED_BASE_ARMOR_CLASS
  ) {
    acTotal += conMod;
  }
  return acTotal;
}
