/**
 * CharacterData -> DndLiteActorSheet derivation (T9).
 *
 * AI-LANDMARK: DND_CHARACTER_TO_LITE_ACTOR_SHEET_V1
 *
 * A monster template has always been able to produce a combat sheet
 * (`dndMonsterToLiteActorSheet`). A player character could not, so a host had to
 * retype roughly twenty values that the campaign database already held. This
 * module closes that gap and nothing else.
 *
 * Boundary rules enforced here:
 *  - CharacterData is NOT copied into runtime. This produces the existing,
 *    lossy `DndLiteActorSheet` — the same eleven-field shape a monster already
 *    produces — which the host saves to the CampaignActorInstance
 *    `overridePayload` through the endpoint that already exists.
 *  - No RuntimeLog event, no new event kind, no projection field, no schema.
 *  - The result is a PROPOSAL. It reports what it approximated and what it could
 *    not supply, so a host is never told a guess is a fact. Callers must not
 *    apply it over a sheet a host has already saved.
 *  - Pure: no store access, no `Date`, no randomness, no I/O. Same input always
 *    produces the same output.
 */

import { CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../dnd-types.js';
import type { AttributeName, CharacterData, ClassDef, SkillName } from '../dnd-types.js';
import {
  getDndAbilityModifier,
  getDndAbilityScore,
  getDndCharacterArmorClass,
  getDndCharacterProficiencyBonus,
} from '../dnd2024/dndCharacterCombatMath.js';
import { CLASS_DATA } from '../../data/classes.js';
import { readDndNumericSpeed } from './dndMonsterTemplateTypes.js';
import { DND_ABILITY_KEYS, DND_SKILL_KEYS } from './dndLiteActorTypes.js';
import type { DndAbilityKey, DndLiteActorSheet, DndSkillKey } from './dndLiteActorTypes.js';
import { deriveDndWeaponActionsFromCharacterSnapshot } from './dndCharacterWeaponActions.js';

/** `CharacterData` attribute key -> lite sheet ability key. */
export const DND_ATTRIBUTE_TO_ABILITY_KEY: Record<AttributeName, DndAbilityKey> = {
  Str: 'strength',
  Dex: 'dexterity',
  Con: 'constitution',
  Int: 'intelligence',
  Wis: 'wisdom',
  Cha: 'charisma',
};

/**
 * `CharacterData` skill name -> lite sheet skill key.
 *
 * Deliberately NOT derived from `DndLiteActorSheetPanel`'s display labels: that
 * map uses different Chinese words for three skills (体操 / 洞悉 / 求生 against
 * the store's 特技 / 洞察 / 生存), so matching on display text would silently
 * drop them. Coverage in both directions is asserted by the smoke.
 */
export const DND_SKILL_NAME_TO_SKILL_KEY: Record<SkillName, DndSkillKey> = {
  运动: 'athletics',
  特技: 'acrobatics',
  巧手: 'sleightOfHand',
  隐匿: 'stealth',
  奥秘: 'arcana',
  历史: 'history',
  调查: 'investigation',
  自然: 'nature',
  宗教: 'religion',
  驯兽: 'animalHandling',
  洞察: 'insight',
  医药: 'medicine',
  察觉: 'perception',
  生存: 'survival',
  欺瞒: 'deception',
  威吓: 'intimidation',
  表演: 'performance',
  游说: 'persuasion',
};

/** Which ability governs each lite sheet skill. */
export const DND_SKILL_KEY_TO_ABILITY: Record<DndSkillKey, DndAbilityKey> = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
};

/** Tag written on every derived sheet so a reader can tell it was not hand-authored. */
export const DND_DERIVED_SHEET_TAG = 'derived-from-character';

export interface DndCharacterSheetDerivation {
  sheet: DndLiteActorSheet;
  /** Values that were produced but are approximate; a host should review them. */
  approximations: string[];
  /** Values the source character could not supply at all. */
  omissions: string[];
}

export interface DndCharacterToLiteActorSheetOptions {
  /** Used when the character carries no usable name. */
  displayNameFallback?: string;
  /**
   * Class definitions used to resolve saving-throw proficiency. Defaults to the
   * bundled 2024 class data; injectable so the derivation stays testable and so
   * a private content pack can supply its own classes.
   */
  classDefinitions?: readonly Pick<ClassDef, 'name' | 'savingThrows'>[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasAttributeParts(value: unknown): boolean {
  return isRecord(value)
    && isFiniteNumber(value.base)
    && isFiniteNumber(value.pointbuy)
    && isFiniteNumber(value.racebonus)
    && isFiniteNumber(value.extrabonus);
}

/**
 * Shape and schema guard for the untyped CampaignActorInstance snapshot payload.
 *
 * Returns the payload as `CharacterData` only when it is recognisably a DND 2024
 * character this build understands. An unknown or newer schema version is
 * refused rather than partially read — a half-understood character produces
 * numbers a table would wrongly trust.
 */
export function readDndCharacterSnapshot(payload: unknown): CharacterData | undefined {
  if (!isRecord(payload)) return undefined;

  const schemaVersion = payload.schemaVersion;
  if (!isFiniteNumber(schemaVersion)) return undefined;
  if (schemaVersion < 1 || schemaVersion > CURRENT_DND_CHARACTER_SCHEMA_VERSION) return undefined;

  if (typeof payload.name !== 'string') return undefined;
  if (!isFiniteNumber(payload.level)) return undefined;
  if (!isFiniteNumber(payload.acMod)) return undefined;
  if (typeof payload.jobClass !== 'string') return undefined;

  const attrs = payload.attrs;
  if (!isRecord(attrs)) return undefined;
  for (const attribute of Object.keys(DND_ATTRIBUTE_TO_ABILITY_KEY) as AttributeName[]) {
    if (!hasAttributeParts(attrs[attribute])) return undefined;
  }

  return payload as unknown as CharacterData;
}

/** Save proficiency is the union of the stored list and the class definition. */
function proficientSaves(
  character: CharacterData,
  classDefinitions: readonly Pick<ClassDef, 'name' | 'savingThrows'>[],
): Set<AttributeName> {
  const stored = Array.isArray(character.savingThrowProficiencies) ? character.savingThrowProficiencies : [];
  const proficient = new Set<AttributeName>(stored);
  const classDefinition = classDefinitions.find((item) => item.name === character.jobClass);
  for (const save of classDefinition?.savingThrows ?? []) {
    if (save in DND_ATTRIBUTE_TO_ABILITY_KEY) proficient.add(save as AttributeName);
  }
  return proficient;
}

function proficientSkills(character: CharacterData): Set<DndSkillKey> {
  const stored = Array.isArray(character.skillProficiencies) ? character.skillProficiencies : [];
  const proficient = new Set<DndSkillKey>();
  for (const skillName of stored) {
    const key = DND_SKILL_NAME_TO_SKILL_KEY[skillName];
    if (key) proficient.add(key);
  }
  return proficient;
}

function classSummary(character: CharacterData): string | undefined {
  const levels = Array.isArray(character.classLevels) ? character.classLevels : [];
  const multiclass = levels
    .filter((entry) => entry && typeof entry.className === 'string' && entry.className.trim() !== '')
    .map((entry) => `${entry.className.trim()} ${entry.level}`);
  if (multiclass.length > 0) return multiclass.join(' / ');
  const jobClass = character.jobClass?.trim();
  return jobClass ? `${jobClass} ${character.level}` : undefined;
}

/**
 * Derives the combat sheet a table runs on from an approved character.
 *
 * Never returns a bare sheet: the reported approximations and omissions are part
 * of the contract, because several derived values are honest estimates and one
 * field (`actions`) is deliberately left empty.
 */
export function dndCharacterToLiteActorSheet(
  character: CharacterData,
  options: DndCharacterToLiteActorSheetOptions = {},
): DndCharacterSheetDerivation {
  const classDefinitions = options.classDefinitions ?? CLASS_DATA;
  const approximations: string[] = [];
  const omissions: string[] = [];

  // ── Abilities ─────────────────────────────────────────────────────────────
  const abilities = {} as DndLiteActorSheet['abilities'];
  for (const attribute of Object.keys(DND_ATTRIBUTE_TO_ABILITY_KEY) as AttributeName[]) {
    abilities[DND_ATTRIBUTE_TO_ABILITY_KEY[attribute]] = getDndAbilityScore(character.attrs, attribute);
  }

  const proficiencyBonus = getDndCharacterProficiencyBonus(character.level);

  // ── Defenses ──────────────────────────────────────────────────────────────
  const maxHp = isFiniteNumber(character.hpMax) ? Math.trunc(character.hpMax) : undefined;
  const rawCurrentHp = isFiniteNumber(character.hpCurrent) ? Math.trunc(character.hpCurrent) : undefined;
  // The lite sheet validator rejects currentHp > maxHp, so clamp rather than
  // emit a sheet a host cannot save.
  const currentHp = rawCurrentHp === undefined
    ? undefined
    : maxHp === undefined ? rawCurrentHp : Math.min(rawCurrentHp, maxHp);
  const temporaryHp = isFiniteNumber(character.tempHp) && character.tempHp > 0
    ? Math.trunc(character.tempHp)
    : undefined;

  const armorClass = getDndCharacterArmorClass({
    acMod: character.acMod,
    attrs: character.attrs,
    jobClass: character.jobClass,
  });
  approximations.push('armorClass');

  const speedFt = readDndNumericSpeed({ walk: character.speed });
  if (speedFt === undefined) omissions.push('speedFt');

  // ── Saves ─────────────────────────────────────────────────────────────────
  const saveProficiencies = proficientSaves(character, classDefinitions);
  const savingThrows: Partial<Record<DndAbilityKey, number>> = {};
  for (const attribute of Object.keys(DND_ATTRIBUTE_TO_ABILITY_KEY) as AttributeName[]) {
    const abilityKey = DND_ATTRIBUTE_TO_ABILITY_KEY[attribute];
    const modifier = getDndAbilityModifier(abilities[abilityKey]);
    savingThrows[abilityKey] = modifier + (saveProficiencies.has(attribute) ? proficiencyBonus : 0);
  }
  approximations.push('savingThrows');

  // ── Skills ────────────────────────────────────────────────────────────────
  const skillProficiencies = proficientSkills(character);
  const skills: Partial<Record<DndSkillKey, number>> = {};
  for (const skillKey of DND_SKILL_KEYS) {
    const modifier = getDndAbilityModifier(abilities[DND_SKILL_KEY_TO_ABILITY[skillKey]]);
    skills[skillKey] = modifier + (skillProficiencies.has(skillKey) ? proficiencyBonus : 0);
  }
  approximations.push('skills');

  // ── Approved weapon actions and deliberate omissions ─────────────────────
  const weaponActions = deriveDndWeaponActionsFromCharacterSnapshot(character);
  if (weaponActions.actions.length === 0) omissions.push('actions');
  if (weaponActions.unsupportedDefinitionIds.length > 0) omissions.push('unsupportedWeaponActions');
  omissions.push('spellSlots', 'classResources', 'inventory', 'conditions');

  const summary = classSummary(character);
  const notes = [
    character.race?.trim(),
    character.subrace?.trim(),
    summary,
    character.background?.trim(),
  ].filter((item): item is string => Boolean(item)).join(' · ') || undefined;

  const tags = [DND_DERIVED_SHEET_TAG];
  if (summary) tags.push(summary);

  const sheet: DndLiteActorSheet = {
    schemaVersion: 1,
    actorKind: 'pc',
    displayName: character.name?.trim() || options.displayNameFallback?.trim() || 'Unnamed actor',
    abilities,
    proficiencyBonus,
    defenses: {
      ...(armorClass !== undefined ? { armorClass } : {}),
      ...(maxHp !== undefined ? { maxHp } : {}),
      ...(currentHp !== undefined ? { currentHp } : {}),
      ...(temporaryHp !== undefined ? { temporaryHp } : {}),
      ...(speedFt !== undefined ? { speedFt } : {}),
    },
    savingThrows,
    skills,
    actions: weaponActions.actions,
    ...(notes ? { notes } : {}),
    tags,
  };

  return { sheet, approximations, omissions };
}

/**
 * Convenience for the untyped campaign payload: guard then derive.
 * Returns undefined when the payload is not a character this build understands.
 */
export function deriveDndLiteActorSheetFromSnapshot(
  payload: unknown,
  options: DndCharacterToLiteActorSheetOptions = {},
): DndCharacterSheetDerivation | undefined {
  const character = readDndCharacterSnapshot(payload);
  return character ? dndCharacterToLiteActorSheet(character, options) : undefined;
}

/** Ability keys covered by the attribute map, exported for coverage assertions. */
export const DND_DERIVATION_ABILITY_KEYS: readonly DndAbilityKey[] = DND_ABILITY_KEYS;
