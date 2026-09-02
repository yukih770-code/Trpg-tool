/**
 * CharacterData -> DndLiteActorSheet derivation smoke (pure; no store, no DB).
 *
 * AI-LANDMARK: DND_CHARACTER_TO_LITE_ACTOR_SHEET_SMOKE_V1
 *
 * Asserts the T9 contract on hand-built character fixtures:
 *  - exact ability scores, proficiency bonus, AC, all six saves, all 18 skills;
 *  - the barbarian unarmoured-defence branch matches the character sheet's own
 *    formula, and disappears the moment the character wears armour;
 *  - the derivation is deterministic and produces a sheet the existing
 *    validator accepts;
 *  - currentHp is clamped to maxHp, actions stay empty, and every undeliverable
 *    value is reported as an omission rather than invented;
 *  - the snapshot guard refuses anything that is not a character this build
 *    understands.
 */

import { CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../dnd-types';
import type { AttributeName, CharacterData, ClassDef, SkillName } from '../dnd-types';
import { validateDndLiteActorSheet } from './dndLiteActorSheet';
import { DND_ABILITY_KEYS, DND_SKILL_KEYS } from './dndLiteActorTypes';
import type { DndSkillKey } from './dndLiteActorTypes';
import {
  DND_ATTRIBUTE_TO_ABILITY_KEY,
  DND_DERIVED_SHEET_TAG,
  DND_SKILL_KEY_TO_ABILITY,
  DND_SKILL_NAME_TO_SKILL_KEY,
  deriveDndLiteActorSheetFromSnapshot,
  dndCharacterToLiteActorSheet,
  readDndCharacterSnapshot,
} from './dndCharacterToLiteActorSheet';
import {
  getDndAbilityModifier,
  getDndCharacterArmorClass,
  getDndCharacterProficiencyBonus,
} from '../dnd2024/dndCharacterCombatMath';

const cases: string[] = [];

function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

/** Minimal class table so the smoke never depends on the bundled data module. */
const TEST_CLASSES: Pick<ClassDef, 'name' | 'savingThrows'>[] = [
  { name: '战士', savingThrows: ['Str', 'Con'] },
  { name: '法师', savingThrows: ['Int', 'Wis'] },
  { name: '野蛮人', savingThrows: ['Str', 'Con'] },
];

function attr(score: number) {
  return { base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 };
}

function makeCharacter(input: {
  name: string;
  jobClass: string;
  level: number;
  acMod: number;
  scores: Record<AttributeName, number>;
  hpMax: number;
  hpCurrent: number;
  tempHp?: number;
  speed?: string;
  skillProficiencies?: SkillName[];
  savingThrowProficiencies?: AttributeName[];
}): CharacterData {
  return {
    schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
    id: `smoke-${input.name}`,
    name: input.name,
    age: '30', gender: '', race: '人类', subrace: '',
    jobClass: input.jobClass, subclass: '',
    classLevels: [{ className: input.jobClass, level: input.level }],
    background: '士兵', description: '',
    level: input.level,
    hpMax: input.hpMax, hpCurrent: input.hpCurrent, tempHp: input.tempHp ?? 0,
    deathSaves: { successes: 0, failures: 0 },
    hitDiceCurrent: input.level,
    acMod: input.acMod,
    speed: input.speed ?? '30',
    size: '中型',
    attrs: {
      Str: attr(input.scores.Str), Dex: attr(input.scores.Dex), Con: attr(input.scores.Con),
      Int: attr(input.scores.Int), Wis: attr(input.scores.Wis), Cha: attr(input.scores.Cha),
    },
    skillProficiencies: input.skillProficiencies ?? [],
    savingThrowProficiencies: input.savingThrowProficiencies ?? [],
    weaponProficiencies: [], armorTraining: [],
    spellbook: { known: [], prepared: [], slots: {} },
    customLanguages: '通用语', inventory: [],
    personalContentReferences: [], feats: [], coin: 0,
    remainingPoints: 0, isCompleted: true,
    classResources: [],
  };
}

const derive = (character: CharacterData) =>
  dndCharacterToLiteActorSheet(character, { classDefinitions: TEST_CLASSES });

// ── Key maps: full coverage in both directions ──────────────────────────────
const skillNameKeys = Object.keys(DND_SKILL_NAME_TO_SKILL_KEY) as SkillName[];
const mappedSkillKeys = Object.values(DND_SKILL_NAME_TO_SKILL_KEY);
check('skill map has 18 entries', skillNameKeys.length === 18);
check('skill map covers every lite skill key', DND_SKILL_KEYS.every((key) => mappedSkillKeys.includes(key)));
check('skill map has no duplicate targets', new Set(mappedSkillKeys).size === 18);
check('skill ability table covers every lite skill key', DND_SKILL_KEYS.every((key) => Boolean(DND_SKILL_KEY_TO_ABILITY[key])));
const abilityTargets = Object.values(DND_ATTRIBUTE_TO_ABILITY_KEY);
check('attribute map has 6 entries', Object.keys(DND_ATTRIBUTE_TO_ABILITY_KEY).length === 6);
check('attribute map covers every lite ability key', DND_ABILITY_KEYS.every((key) => abilityTargets.includes(key)));

// ── Proficiency bonus agrees with the formula it replaced, levels 1-20 ──────
for (let level = 1; level <= 20; level += 1) {
  check(`proficiency bonus matches the legacy formula at level ${level}`,
    getDndCharacterProficiencyBonus(level) === Math.ceil(1 + level / 4));
}

// ── Fixture 1: level 1 fighter ─────────────────────────────────────────────
const fighter = makeCharacter({
  name: '铁盾', jobClass: '战士', level: 1, acMod: 10,
  scores: { Str: 16, Dex: 14, Con: 14, Int: 10, Wis: 12, Cha: 8 },
  hpMax: 12, hpCurrent: 12, speed: '30',
  skillProficiencies: ['运动', '察觉'],
});
const fighterResult = derive(fighter);
const fighterSheet = fighterResult.sheet;

check('fighter is a pc', fighterSheet.actorKind === 'pc' && fighterSheet.schemaVersion === 1);
check('fighter display name', fighterSheet.displayName === '铁盾');
check('fighter abilities', fighterSheet.abilities.strength === 16 && fighterSheet.abilities.dexterity === 14
  && fighterSheet.abilities.constitution === 14 && fighterSheet.abilities.intelligence === 10
  && fighterSheet.abilities.wisdom === 12 && fighterSheet.abilities.charisma === 8);
check('fighter proficiency bonus is 2', fighterSheet.proficiencyBonus === 2);
check('fighter AC is 10 + dex mod', fighterSheet.defenses.armorClass === 12);
check('fighter HP', fighterSheet.defenses.maxHp === 12 && fighterSheet.defenses.currentHp === 12);
check('fighter has no temporary HP field at zero', fighterSheet.defenses.temporaryHp === undefined);
check('fighter speed parsed from string', fighterSheet.defenses.speedFt === 30);
// Class saves: Str/Con proficient (+2), everything else the bare modifier.
check('fighter strength save', fighterSheet.savingThrows?.strength === 3 + 2);
check('fighter constitution save', fighterSheet.savingThrows?.constitution === 2 + 2);
check('fighter dexterity save is unproficient', fighterSheet.savingThrows?.dexterity === 2);
check('fighter charisma save is unproficient', fighterSheet.savingThrows?.charisma === -1);
check('fighter emits all six saves', Object.keys(fighterSheet.savingThrows ?? {}).length === 6);
check('fighter athletics is proficient', fighterSheet.skills?.athletics === 3 + 2);
check('fighter perception is proficient', fighterSheet.skills?.perception === 1 + 2);
check('fighter stealth is unproficient', fighterSheet.skills?.stealth === 2);
check('fighter emits all 18 skills', Object.keys(fighterSheet.skills ?? {}).length === 18);
check('fighter is tagged as derived', (fighterSheet.tags ?? []).includes(DND_DERIVED_SHEET_TAG));
check('fighter notes carry provenance', typeof fighterSheet.notes === 'string' && fighterSheet.notes.includes('战士 1'));

// ── Fixture 2: level 8 wizard (proficiency band boundary) ──────────────────
const wizard = makeCharacter({
  name: '晨星', jobClass: '法师', level: 8, acMod: 12,
  scores: { Str: 8, Dex: 14, Con: 12, Int: 18, Wis: 13, Cha: 10 },
  hpMax: 44, hpCurrent: 30, tempHp: 5, speed: '30 尺',
  skillProficiencies: ['奥秘', '调查'],
});
const wizardResult = derive(wizard);
const wizardSheet = wizardResult.sheet;

check('wizard proficiency bonus is 3 at level 8', wizardSheet.proficiencyBonus === 3);
check('wizard AC is armour + dex mod', wizardSheet.defenses.armorClass === 12 + 2);
check('wizard current HP below max is preserved', wizardSheet.defenses.currentHp === 30 && wizardSheet.defenses.maxHp === 44);
check('wizard temporary HP above zero is carried', wizardSheet.defenses.temporaryHp === 5);
check('wizard speed parsed from a suffixed string', wizardSheet.defenses.speedFt === 30);
check('wizard intelligence save', wizardSheet.savingThrows?.intelligence === 4 + 3);
check('wizard wisdom save', wizardSheet.savingThrows?.wisdom === 1 + 3);
check('wizard strength save is unproficient', wizardSheet.savingThrows?.strength === -1);
check('wizard arcana is proficient', wizardSheet.skills?.arcana === 4 + 3);
check('wizard investigation is proficient', wizardSheet.skills?.investigation === 4 + 3);
check('wizard history is unproficient but int-based', wizardSheet.skills?.history === 4);

// Stored proficiencies union with the class definition rather than replacing it.
const wizardWithStoredSave = derive({ ...wizard, savingThrowProficiencies: ['Dex'] });
check('stored save proficiency is added', wizardWithStoredSave.sheet.savingThrows?.dexterity === 2 + 3);
check('class save proficiency survives the union', wizardWithStoredSave.sheet.savingThrows?.intelligence === 4 + 3);

// ── Fixture 3: level 5 barbarian, unarmoured and armoured ──────────────────
const barbarianUnarmoured = makeCharacter({
  name: '铁角', jobClass: '野蛮人', level: 5, acMod: 10,
  scores: { Str: 18, Dex: 16, Con: 16, Int: 8, Wis: 12, Cha: 10 },
  hpMax: 55, hpCurrent: 55,
});
const barbarianUnarmouredSheet = derive(barbarianUnarmoured).sheet;
check('barbarian unarmoured AC is 10 + dex + con', barbarianUnarmouredSheet.defenses.armorClass === 10 + 3 + 3);
check('barbarian proficiency bonus is 3 at level 5', barbarianUnarmouredSheet.proficiencyBonus === 3);

const barbarianArmoured = { ...barbarianUnarmoured, acMod: 16 };
const barbarianArmouredSheet = derive(barbarianArmoured).sheet;
check('armoured barbarian loses unarmoured defence', barbarianArmouredSheet.defenses.armorClass === 16 + 3);

// A non-barbarian at acMod 10 must never gain the constitution bonus.
const fighterUnarmoured = derive({ ...fighter, acMod: 10, jobClass: '战士' }).sheet;
check('unarmoured defence is class-gated', fighterUnarmoured.defenses.armorClass === 12);

// The derivation must agree with the shared formula the character sheet uses.
check('AC matches the shared sheet formula', barbarianUnarmouredSheet.defenses.armorClass
  === getDndCharacterArmorClass({ acMod: barbarianUnarmoured.acMod, attrs: barbarianUnarmoured.attrs, jobClass: barbarianUnarmoured.jobClass }));
check('ability modifier matches the shared helper', fighterSheet.savingThrows?.dexterity
  === getDndAbilityModifier(fighterSheet.abilities.dexterity));

// ── currentHp clamp ────────────────────────────────────────────────────────
const overhealed = derive({ ...fighter, hpMax: 12, hpCurrent: 99 }).sheet;
check('current HP is clamped to max', overhealed.defenses.currentHp === 12);
check('clamped sheet still validates', validateDndLiteActorSheet(overhealed).valid);

// ── Actions and omissions ──────────────────────────────────────────────────
for (const [label, result] of [['fighter', fighterResult], ['wizard', wizardResult]] as const) {
  check(`${label} derives no actions`, result.sheet.actions.length === 0);
  check(`${label} reports actions as an omission`, result.omissions.includes('actions'));
  check(`${label} reports spell slots as an omission`, result.omissions.includes('spellSlots'));
  check(`${label} reports class resources as an omission`, result.omissions.includes('classResources'));
  check(`${label} flags armour class for review`, result.approximations.includes('armorClass'));
  check(`${label} flags saves and skills for review`,
    result.approximations.includes('savingThrows') && result.approximations.includes('skills'));
}
const noSpeed = derive({ ...fighter, speed: '' });
check('unparseable speed is reported as an omission', noSpeed.omissions.includes('speedFt'));
check('unparseable speed emits no speed field', noSpeed.sheet.defenses.speedFt === undefined);

// ── Validation compatibility ───────────────────────────────────────────────
for (const [label, sheet] of [
  ['fighter', fighterSheet], ['wizard', wizardSheet],
  ['barbarian unarmoured', barbarianUnarmouredSheet], ['barbarian armoured', barbarianArmouredSheet],
] as const) {
  const validation = validateDndLiteActorSheet(sheet);
  check(`${label} sheet passes validation`, validation.valid === true && validation.errors.length === 0);
}

// ── Determinism ────────────────────────────────────────────────────────────
check('derivation is deterministic', JSON.stringify(derive(wizard)) === JSON.stringify(derive(wizard)));
check('derivation does not mutate its input',
  JSON.stringify(wizard) === JSON.stringify(makeCharacter({
    name: '晨星', jobClass: '法师', level: 8, acMod: 12,
    scores: { Str: 8, Dex: 14, Con: 12, Int: 18, Wis: 13, Cha: 10 },
    hpMax: 44, hpCurrent: 30, tempHp: 5, speed: '30 尺',
    skillProficiencies: ['奥秘', '调查'],
  })));

// ── Snapshot guard ─────────────────────────────────────────────────────────
check('guard accepts a current-version character', readDndCharacterSnapshot(fighter as unknown) !== undefined);
check('guard rejects an empty object', readDndCharacterSnapshot({}) === undefined);
check('guard rejects null', readDndCharacterSnapshot(null) === undefined);
check('guard rejects an array', readDndCharacterSnapshot([fighter]) === undefined);
check('guard rejects a future schema version', readDndCharacterSnapshot({ ...fighter, schemaVersion: 99 }) === undefined);
check('guard rejects a missing schema version', readDndCharacterSnapshot({ ...fighter, schemaVersion: undefined }) === undefined);
check('guard rejects a character with no attrs', readDndCharacterSnapshot({ ...fighter, attrs: undefined }) === undefined);
check('guard rejects malformed attribute parts',
  readDndCharacterSnapshot({ ...fighter, attrs: { ...fighter.attrs, Dex: { base: 'x' } } }) === undefined);
check('guard rejects a non-DND sheet',
  readDndCharacterSnapshot({ schemaVersion: 1, investigatorName: 'CoC', san: 50 }) === undefined);

check('snapshot helper derives from a valid payload',
  deriveDndLiteActorSheetFromSnapshot(fighter as unknown, { classDefinitions: TEST_CLASSES })?.sheet.displayName === '铁盾');
check('snapshot helper returns undefined for a rejected payload',
  deriveDndLiteActorSheetFromSnapshot({ nope: true }) === undefined);
check('display name falls back when the character is unnamed',
  dndCharacterToLiteActorSheet({ ...fighter, name: '   ' }, { classDefinitions: TEST_CLASSES, displayNameFallback: '战役角色' }).sheet.displayName === '战役角色');

// Every skill key the derivation emits is a real lite sheet key.
const emittedSkillKeys = Object.keys(fighterSheet.skills ?? {}) as DndSkillKey[];
check('every emitted skill key is valid', emittedSkillKeys.every((key) => DND_SKILL_KEYS.includes(key)));

// eslint-disable-next-line no-console
console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
