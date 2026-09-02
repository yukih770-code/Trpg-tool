/**
 * Combat-relevant canonical field extraction for a DND 2024 character (T11a).
 *
 * AI-LANDMARK: DND_CHARACTER_COMBAT_RELEVANT_FIELDS_V1
 *
 * A campaign actor freezes the character source that a host approved. The
 * source in the player's Vault keeps changing — every level-up, every skill
 * pick. Until now nothing could tell whether the frozen copy still matched, so
 * a host had no way to know a review was due.
 *
 * This module answers exactly one question: *would the combat sheet a table
 * runs on be derived differently from the character now?* It extracts the
 * fields `dndCharacterToLiteActorSheet` actually reads, in a canonical form, so
 * two payloads that derive the same combat sheet produce the same string.
 *
 * Boundary rules enforced here:
 *  - Pure. No store, no clock, no randomness, no I/O, no crypto. The digest is
 *    computed by the server module that owns hashing; this file only decides
 *    WHAT is covered and produces a deterministic string for it.
 *  - It derives nothing and decides no authority. A difference is a review
 *    signal for a host, never an automatic update and never a rules outcome.
 *  - Deliberately NOT the whole character. See the exclusion notes below: the
 *    covered set is narrower than what T9 derives, on purpose.
 */

import type { AttributeName, CharacterData } from '../dnd-types.js';
import { readDndCharacterSnapshot, DND_ATTRIBUTE_TO_ABILITY_KEY } from './dndCharacterToLiteActorSheet.js';

/**
 * Field-set version. Bump when the covered set changes: a stored hash carrying
 * an older version must read as UNKNOWN, never as "unchanged", because the two
 * strings are not comparable.
 */
export const DND_CHARACTER_COMBAT_RELEVANT_FIELD_VERSION = 1;

/**
 * Tier name for this covered set.
 *
 * Deliberately NOT added to `ActorSnapshotFieldTier`. That union belongs to the
 * clearance/admission pipeline, whose hash covers `clearanceRelevant` and gates
 * room entry. This hash gates nothing: it is a weaker review signal, and giving
 * it a clearance tier name would invite a later reader to treat it as one.
 */
export const DND_CHARACTER_COMBAT_RELEVANT_TIER = 'combatRelevant';

/**
 * Attribute keys in a fixed order. Taken from the T9 mapping so the covered set
 * can never drift from the abilities the derivation reads.
 */
export const DND_COMBAT_RELEVANT_ATTRIBUTE_KEYS = Object.keys(DND_ATTRIBUTE_TO_ABILITY_KEY).sort() as AttributeName[];

/** The four additive parts of a stored ability score. */
export interface DndCombatRelevantAttributeParts {
  base: number;
  pointbuy: number;
  racebonus: number;
  extrabonus: number;
}

export interface DndCharacterCombatRelevantFields {
  fieldVersion: number;
  schemaVersion: number;
  name: string;
  level: number;
  jobClass: string;
  /**
   * Order preserved, NOT sorted. `dndCharacterToLiteActorSheet` joins these
   * into the sheet's class summary in stored order, so a reorder really does
   * change the derived sheet and must be reported as a change.
   */
  classLevels: Array<{ className: string; level: number }>;
  attrs: Record<string, DndCombatRelevantAttributeParts>;
  acMod: number;
  hpMax: number;
  /**
   * The raw stored string, trimmed — not a parsed number. Parsing here would
   * couple every stored hash to the speed parser, so a later parser fix would
   * silently invalidate every campaign's baseline. A cosmetic edit that parses
   * to the same number therefore flags a review it did not need; that is the
   * safe direction to be wrong in.
   */
  speed: string;
  /** Sorted and de-duplicated: the derivation reads these as sets. */
  savingThrowProficiencies: string[];
  /** Sorted and de-duplicated: the derivation reads these as sets. */
  skillProficiencies: string[];
}

/**
 * Fields deliberately NOT covered, and why:
 *
 *  - `hpCurrent`, `tempHp`, `deathSaves`, `hitDiceCurrent`: volatile. They move
 *    every round of play. Covering them would raise the review flag constantly
 *    and train a host to ignore it. T9 does derive current/temporary HP, so the
 *    covered set is knowingly narrower than the derivation.
 *  - `race`, `subrace`, `background`, `subclass`, `gender`, `age`, `size`,
 *    `description`, `appearanceDescription`: the derivation reads none of them
 *    for a combat number.
 *  - `inventory`, `coin`, `spellbook`, `feats`, `weaponProficiencies`,
 *    `armorTraining`, `activeMods`, `customModsData`, `customLanguages`,
 *    `personalContentReferences`: outside the eleven-field lite combat sheet.
 *    When a later milestone derives from them, extend the covered set and bump
 *    `DND_CHARACTER_COMBAT_RELEVANT_FIELD_VERSION`.
 *  - `id`: identity, not a combat value; it is carried by the campaign actor row.
 */
export const DND_CHARACTER_COMBAT_RELEVANT_EXCLUDED_FIELDS: readonly string[] = [
  'hpCurrent',
  'tempHp',
  'deathSaves',
  'hitDiceCurrent',
  'race',
  'subrace',
  'subclass',
  'background',
  'gender',
  'age',
  'size',
  'description',
  'appearanceDescription',
  'inventory',
  'coin',
  'spellbook',
  'feats',
  'weaponProficiencies',
  'armorTraining',
  'activeMods',
  'customModsData',
  'customLanguages',
  'personalContentReferences',
  'id',
];

/** Normalises `-0` to `0` and refuses a non-finite number. */
function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value + 0 : 0;
}

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sortedUniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    const text = trimmedString(entry);
    if (text) seen.add(text);
  }
  return [...seen].sort();
}

function attributeParts(value: unknown): DndCombatRelevantAttributeParts {
  const parts = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    base: finiteNumber(parts.base),
    pointbuy: finiteNumber(parts.pointbuy),
    racebonus: finiteNumber(parts.racebonus),
    extrabonus: finiteNumber(parts.extrabonus),
  };
}

function classLevels(character: CharacterData): Array<{ className: string; level: number }> {
  const entries = Array.isArray(character.classLevels) ? character.classLevels : [];
  return entries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({ className: trimmedString(entry.className), level: finiteNumber(entry.level) }))
    .filter((entry) => entry.className !== '');
}

/**
 * Extracts the covered set from a validated character.
 *
 * The caller supplies a `CharacterData` that `readDndCharacterSnapshot` has
 * already accepted, so this function performs shape normalisation only.
 */
export function extractDndCharacterCombatRelevantFields(
  character: CharacterData,
): DndCharacterCombatRelevantFields {
  const attrs: Record<string, DndCombatRelevantAttributeParts> = {};
  for (const attribute of DND_COMBAT_RELEVANT_ATTRIBUTE_KEYS) {
    attrs[attribute] = attributeParts(character.attrs?.[attribute]);
  }
  return {
    fieldVersion: DND_CHARACTER_COMBAT_RELEVANT_FIELD_VERSION,
    schemaVersion: finiteNumber(character.schemaVersion),
    name: trimmedString(character.name),
    level: finiteNumber(character.level),
    jobClass: trimmedString(character.jobClass),
    classLevels: classLevels(character),
    attrs,
    acMod: finiteNumber(character.acMod),
    hpMax: finiteNumber(character.hpMax),
    speed: trimmedString(character.speed),
    savingThrowProficiencies: sortedUniqueStrings(character.savingThrowProficiencies),
    skillProficiencies: sortedUniqueStrings(character.skillProficiencies),
  };
}

/**
 * Reads an untyped snapshot payload and extracts the covered set.
 *
 * Returns `undefined` for anything `readDndCharacterSnapshot` refuses — an
 * unknown or newer schema version included. A character this build cannot read
 * must produce NO hash, so comparison reports "unknown" rather than inventing a
 * difference or an equality.
 */
export function readDndCharacterCombatRelevantFields(
  payload: unknown,
): DndCharacterCombatRelevantFields | undefined {
  const character = readDndCharacterSnapshot(payload);
  return character ? extractDndCharacterCombatRelevantFields(character) : undefined;
}

/**
 * Deterministic serialisation with recursively sorted object keys.
 *
 * Key order is sorted rather than relying on construction order, so the string
 * survives any future reordering of the interface. Arrays keep their order,
 * which is what makes `classLevels` order-sensitive and the two proficiency
 * lists order-insensitive (they are sorted during extraction).
 */
export function stableCanonicalJson(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map(stableCanonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const entries = value as Record<string, unknown>;
    return `{${Object.keys(entries).sort().map((key) => `${JSON.stringify(key)}:${stableCanonicalJson(entries[key])}`).join(',')}}`;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value + 0) : 'null';
  return JSON.stringify(value);
}

/** Canonical string for a validated covered set. */
export function canonicalDndCharacterCombatRelevantJson(
  fields: DndCharacterCombatRelevantFields,
): string {
  return stableCanonicalJson(fields);
}

/** Canonical string straight from an untyped payload, or `undefined` if unreadable. */
export function canonicalDndCharacterCombatRelevantJsonFromPayload(
  payload: unknown,
): string | undefined {
  const fields = readDndCharacterCombatRelevantFields(payload);
  return fields ? canonicalDndCharacterCombatRelevantJson(fields) : undefined;
}
