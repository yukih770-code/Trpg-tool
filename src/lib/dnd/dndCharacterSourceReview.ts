/**
 * Host review of a changed character source (T11b, D&D Game System layer).
 *
 * AI-LANDMARK: DND_CHARACTER_SOURCE_REVIEW_V1
 *
 * T11a can tell a host that a player's character has moved since the campaign
 * accepted it. It cannot say WHAT moved. This module answers that, and only
 * that, in the vocabulary a table actually cares about.
 *
 * Boundary rules enforced here:
 *  - PRIVACY IS THE POINT. The output carries derived, combat-relevant values
 *    only. Raw `CharacterData` never appears: no `attrs`, no inventory, no
 *    spellbook, no coin, no background prose. A host reviewing a player's
 *    update sees mechanics, not the player's character sheet.
 *  - Both sides are reduced through the SAME T9 derivation
 *    (`dndCharacterToLiteActorSheet`), so a reported difference is exactly a
 *    difference the combat sheet would show — never a difference in some
 *    field the table never uses.
 *  - Only fields the current `DndLiteActorSheet` actually supports are
 *    compared. A character field with nowhere to land in the lite sheet is not
 *    invented into the diff.
 *  - Honest about ignorance: a side that cannot be read is `unknown`, never
 *    silently treated as unchanged or as empty.
 *  - Pure. No store, no clock, no randomness, no I/O. This decides nothing —
 *    the host accepts, and the server writes.
 */

import type { CharacterData } from '../dnd-types.js';
import { dndCreatureSizeLabel } from '../dnd2024/gameplay/dndCreatureSize.js';
import type { DndAbilityKey, DndLiteActorSheet, DndSkillKey } from './dndLiteActorTypes.js';
import { DND_ABILITY_KEYS, DND_SKILL_KEYS } from './dndLiteActorTypes.js';
import type { DndCharacterToLiteActorSheetOptions } from './dndCharacterToLiteActorSheet.js';
import { deriveDndLiteActorSheetFromSnapshot, readDndCharacterSnapshot } from './dndCharacterToLiteActorSheet.js';

/** Whether a side of the comparison could be read at all. */
export type DndSourceReviewStatus = 'unchanged' | 'changed' | 'unknown';

/** One reviewable mechanical value. `before`/`after` are display-ready. */
export interface DndSourceReviewField {
  /** Stable machine key, e.g. `defenses.armorClass` or `abilities.strength`. */
  key: string;
  /** Short English label; the UI supplies its own localisation. */
  label: string;
  group: 'identity' | 'defenses' | 'abilities' | 'proficiencies' | 'actions';
  before?: string;
  after?: string;
  changed: boolean;
}

export interface DndCharacterSourceReview {
  status: DndSourceReviewStatus;
  /** Only fields that differ, ordered for reading. Empty when unchanged. */
  changedFields: DndSourceReviewField[];
  /** Count of comparable fields examined — lets the UI say "3 of 27 changed". */
  comparedFieldCount: number;
  /** Set when a side could not be read; explains which, in plain terms. */
  unreadable?: 'accepted' | 'current' | 'both';
  /** Derived display name of the CURRENT source, for the review header. */
  currentDisplayName?: string;
  /** Values the current derivation had to approximate; carried through from T9. */
  approximations: string[];
  /** Values the current source could not supply at all; carried through from T9. */
  omissions: string[];
}

const ABILITY_LABELS: Record<DndAbilityKey, string> = {
  strength: 'Strength', dexterity: 'Dexterity', constitution: 'Constitution',
  intelligence: 'Intelligence', wisdom: 'Wisdom', charisma: 'Charisma',
};

const SKILL_LABELS: Record<DndSkillKey, string> = {
  acrobatics: 'Acrobatics', animalHandling: 'Animal Handling', arcana: 'Arcana',
  athletics: 'Athletics', deception: 'Deception', history: 'History', insight: 'Insight',
  intimidation: 'Intimidation', investigation: 'Investigation', medicine: 'Medicine',
  nature: 'Nature', perception: 'Perception', performance: 'Performance',
  persuasion: 'Persuasion', religion: 'Religion', sleightOfHand: 'Sleight of Hand',
  stealth: 'Stealth', survival: 'Survival',
};

function signed(value: number | undefined): string | undefined {
  return value === undefined ? undefined : value >= 0 ? `+${value}` : `${value}`;
}

function plain(value: number | string | undefined): string | undefined {
  return value === undefined ? undefined : String(value);
}

function field(
  key: string,
  label: string,
  group: DndSourceReviewField['group'],
  before: string | undefined,
  after: string | undefined,
): DndSourceReviewField {
  return { key, label, group, before, after, changed: before !== after };
}

function weaponActionSummary(sheet: DndLiteActorSheet): string | undefined {
  const actions = sheet.actions
    .filter((action) => action.kind === 'weapon_attack')
    .map((action) => [
      action.name,
      action.attackBonus === undefined ? '' : signed(action.attackBonus),
      action.damageFormula ?? '',
      action.damageType ?? '',
    ].filter(Boolean).join(' · '))
    .sort();
  return actions.length > 0 ? actions.join('; ') : undefined;
}

/**
 * Compares two derived lite sheets field by field.
 *
 * Deliberately field-by-field rather than a deep object diff: a generic diff
 * would leak whatever future keys the sheet grows, and would report churn in
 * values a host cannot act on. Adding a reviewable field is a deliberate edit
 * here.
 */
export function compareDndLiteActorSheets(
  accepted: DndLiteActorSheet,
  current: DndLiteActorSheet,
): DndSourceReviewField[] {
  const fields: DndSourceReviewField[] = [];
  fields.push(field('creatureSize', 'Creature size', 'identity',
    accepted.creatureSize ? dndCreatureSizeLabel(accepted.creatureSize, 'en') : undefined,
    current.creatureSize ? dndCreatureSizeLabel(current.creatureSize, 'en') : undefined));

  fields.push(field('displayName', 'Name', 'identity', accepted.displayName, current.displayName));
  fields.push(field('proficiencyBonus', 'Proficiency Bonus', 'identity',
    signed(accepted.proficiencyBonus), signed(current.proficiencyBonus)));

  fields.push(field('defenses.armorClass', 'Armor Class', 'defenses',
    plain(accepted.defenses?.armorClass), plain(current.defenses?.armorClass)));
  fields.push(field('defenses.maxHp', 'Max HP', 'defenses',
    plain(accepted.defenses?.maxHp), plain(current.defenses?.maxHp)));
  fields.push(field('defenses.speedFt', 'Speed', 'defenses',
    accepted.defenses?.speedFt === undefined ? undefined : `${accepted.defenses.speedFt} ft`,
    current.defenses?.speedFt === undefined ? undefined : `${current.defenses.speedFt} ft`));

  // currentHp / temporaryHp are deliberately NOT reviewed: they are volatile
  // play state, excluded from the T11a covered set, and a host reviewing a
  // level-up should not be shown "HP 12 -> 28" as if it were a source change.

  // Ability entries on DndLiteActorSheet are SCORES (1-30), not modifiers, so
  // they are rendered plainly. The derived saving throws and skills below are
  // bonuses and keep the signed form.
  for (const ability of DND_ABILITY_KEYS) {
    const a = accepted.abilities?.[ability];
    const c = current.abilities?.[ability];
    fields.push(field(`abilities.${ability}`, ABILITY_LABELS[ability], 'abilities', plain(a), plain(c)));
  }

  for (const ability of DND_ABILITY_KEYS) {
    const a = accepted.savingThrows?.[ability];
    const c = current.savingThrows?.[ability];
    if (a === undefined && c === undefined) continue;
    fields.push(field(`savingThrows.${ability}`, `${ABILITY_LABELS[ability]} Save`, 'proficiencies', signed(a), signed(c)));
  }

  for (const skill of DND_SKILL_KEYS) {
    const a = accepted.skills?.[skill];
    const c = current.skills?.[skill];
    if (a === undefined && c === undefined) continue;
    fields.push(field(`skills.${skill}`, SKILL_LABELS[skill], 'proficiencies', signed(a), signed(c)));
  }

  fields.push(field('actions.weaponAttacks', 'Weapon Actions', 'actions',
    weaponActionSummary(accepted), weaponActionSummary(current)));

  return fields;
}

/**
 * Builds the host-facing review from two untrusted snapshot payloads.
 *
 * `acceptedPayload` is the campaign's frozen source; `currentPayload` is what
 * the player's Vault holds now. Either may be missing or unreadable, and the
 * result says so rather than guessing.
 */
export function buildDndCharacterSourceReview(input: {
  acceptedPayload: unknown;
  currentPayload: unknown;
  /** Injectable class table, forwarded to the T9 derivation unchanged. */
  classDefinitions?: DndCharacterToLiteActorSheetOptions['classDefinitions'];
}): DndCharacterSourceReview {
  const acceptedCharacter = readDndCharacterSnapshot(input.acceptedPayload);
  const currentCharacter = readDndCharacterSnapshot(input.currentPayload);

  if (!acceptedCharacter || !currentCharacter) {
    const unreadable = !acceptedCharacter && !currentCharacter
      ? 'both'
      : !acceptedCharacter ? 'accepted' : 'current';
    const currentDerivation = currentCharacter
      ? deriveDndLiteActorSheetFromSnapshot(input.currentPayload, { classDefinitions: input.classDefinitions })
      : undefined;
    return {
      status: 'unknown',
      changedFields: [],
      comparedFieldCount: 0,
      unreadable,
      ...(currentDerivation?.sheet.displayName ? { currentDisplayName: currentDerivation.sheet.displayName } : {}),
      approximations: currentDerivation?.approximations ?? [],
      omissions: currentDerivation?.omissions ?? [],
    };
  }

  const acceptedDerivation = deriveDndLiteActorSheetFromSnapshot(input.acceptedPayload, { classDefinitions: input.classDefinitions });
  const currentDerivation = deriveDndLiteActorSheetFromSnapshot(input.currentPayload, { classDefinitions: input.classDefinitions });
  if (!acceptedDerivation || !currentDerivation) {
    return {
      status: 'unknown',
      changedFields: [],
      comparedFieldCount: 0,
      unreadable: !acceptedDerivation ? 'accepted' : 'current',
      approximations: currentDerivation?.approximations ?? [],
      omissions: currentDerivation?.omissions ?? [],
    };
  }

  const fields = compareDndLiteActorSheets(acceptedDerivation.sheet, currentDerivation.sheet);
  const changedFields = fields.filter((entry) => entry.changed);
  return {
    status: changedFields.length > 0 ? 'changed' : 'unchanged',
    changedFields,
    comparedFieldCount: fields.length,
    currentDisplayName: currentDerivation.sheet.displayName,
    approximations: currentDerivation.approximations,
    omissions: currentDerivation.omissions,
  };
}

/** Convenience for callers that already hold typed characters. */
export function reviewDndCharacterSourceChange(
  accepted: CharacterData,
  current: CharacterData,
): DndCharacterSourceReview {
  return buildDndCharacterSourceReview({ acceptedPayload: accepted, currentPayload: current });
}
