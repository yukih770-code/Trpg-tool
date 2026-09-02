/**
 * Combat-relevant canonical field extraction smoke (T11a; pure).
 *
 * AI-LANDMARK: DND_CHARACTER_COMBAT_RELEVANT_FIELDS_SMOKE_V1
 *
 * The property under test is the one the review flag depends on: two payloads
 * produce the same canonical string exactly when they would derive the same
 * combat sheet, for the fields this tier covers.
 *
 * Each excluded field is asserted to leave the string alone, and each included
 * field is asserted to change it. Both directions matter — an over-broad tier
 * cries wolf every round, and an under-broad one silently misses a level-up.
 */

import { readFileSync } from 'node:fs';

import { CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../dnd-types';
import type { AttributeName, CharacterData, SkillName } from '../dnd-types';
import { dndCharacterToLiteActorSheet } from './dndCharacterToLiteActorSheet';
import {
  DND_CHARACTER_COMBAT_RELEVANT_EXCLUDED_FIELDS,
  DND_CHARACTER_COMBAT_RELEVANT_FIELD_VERSION,
  DND_COMBAT_RELEVANT_ATTRIBUTE_KEYS,
  canonicalDndCharacterCombatRelevantJson,
  canonicalDndCharacterCombatRelevantJsonFromPayload,
  extractDndCharacterCombatRelevantFields,
  readDndCharacterCombatRelevantFields,
  stableCanonicalJson,
} from './dndCharacterCombatRelevantFields';

const cases: string[] = [];

function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

function attr(score: number) {
  return { base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 };
}

function makeCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
    id: 'smoke-actor',
    name: 'Rin',
    age: '24', gender: '', race: '人类', subrace: '',
    jobClass: '战士', subclass: '',
    classLevels: [{ className: '战士', level: 3 }],
    background: '士兵', description: '',
    level: 3,
    hpMax: 28, hpCurrent: 28, tempHp: 0,
    deathSaves: { successes: 0, failures: 0 },
    hitDiceCurrent: 3,
    acMod: 16,
    speed: '30',
    size: '中型',
    attrs: {
      Str: attr(16), Dex: attr(14), Con: attr(15),
      Int: attr(10), Wis: attr(12), Cha: attr(8),
    },
    skillProficiencies: ['运动', '察觉'] as SkillName[],
    savingThrowProficiencies: ['Str', 'Con'] as AttributeName[],
    weaponProficiencies: [], armorTraining: [],
    spellbook: { known: [], prepared: [], slots: {} },
    customLanguages: '通用语', inventory: [],
    personalContentReferences: [], feats: [], coin: 0,
    remainingPoints: 0, isCompleted: true,
    classResources: [],
    ...overrides,
  } as CharacterData;
}

const base = makeCharacter();
const canonical = (character: CharacterData) =>
  canonicalDndCharacterCombatRelevantJson(extractDndCharacterCombatRelevantFields(character));
const baseline = canonical(base);

// ── Determinism ────────────────────────────────────────────────────────────
check('same character produces the same string', canonical(makeCharacter()) === baseline);
check('a second extraction of the same object is identical', canonical(base) === baseline);
check('the covered set is version tagged', extractDndCharacterCombatRelevantFields(base).fieldVersion === DND_CHARACTER_COMBAT_RELEVANT_FIELD_VERSION);
check('all six attributes are covered', DND_COMBAT_RELEVANT_ATTRIBUTE_KEYS.length === 6);

// ── Key order never leaks into the string ──────────────────────────────────
const reordered = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
const shuffled: Record<string, unknown> = {};
for (const key of Object.keys(reordered).sort().reverse()) shuffled[key] = reordered[key];
check('object key order does not change the string', canonicalDndCharacterCombatRelevantJsonFromPayload(shuffled) === baseline);
check('stableCanonicalJson sorts nested keys', stableCanonicalJson({ b: 1, a: { d: 2, c: 3 } }) === '{"a":{"c":3,"d":2},"b":1}');
check('stableCanonicalJson preserves array order', stableCanonicalJson([3, 1, 2]) === '[3,1,2]');
check('stableCanonicalJson normalises -0', stableCanonicalJson(-0) === '0');
check('stableCanonicalJson refuses NaN rather than emitting it', stableCanonicalJson(Number.NaN) === 'null');

// ── EXCLUDED fields must not move the string ───────────────────────────────
const excludedMutations: Array<[string, Partial<CharacterData>]> = [
  ['hpCurrent', { hpCurrent: 1 }],
  ['tempHp', { tempHp: 15 }],
  ['deathSaves', { deathSaves: { successes: 2, failures: 1 } }],
  ['hitDiceCurrent', { hitDiceCurrent: 0 }],
  ['race', { race: '精灵' }],
  ['subrace', { subrace: '高等精灵' }],
  ['subclass', { subclass: '战锤大师' }],
  ['background', { background: '贵族' }],
  ['gender', { gender: '女' }],
  ['age', { age: '400' }],
  ['size', { size: '小型' }],
  ['description', { description: 'a long backstory' }],
  ['appearanceDescription', { appearanceDescription: 'tall' }],
  ['inventory', { inventory: ['长剑', '绳索'] }],
  ['coin', { coin: 500 }],
  ['feats', { feats: ['警觉'] }],
  ['weaponProficiencies', { weaponProficiencies: ['长剑'] }],
  ['armorTraining', { armorTraining: ['重甲'] }],
  ['customLanguages', { customLanguages: '矮人语' }],
  ['id', { id: 'a-different-id' }],
];
for (const [field, override] of excludedMutations) {
  check(`${field} is excluded from the hashed set`, canonical(makeCharacter(override)) === baseline);
}
check('every documented exclusion is listed', DND_CHARACTER_COMBAT_RELEVANT_EXCLUDED_FIELDS.length >= excludedMutations.length);
for (const [field] of excludedMutations) {
  check(`${field} appears in the documented exclusion list`, DND_CHARACTER_COMBAT_RELEVANT_EXCLUDED_FIELDS.includes(field));
}
// spellbook is documented as excluded but is not a combat sheet input today.
check('spellbook is excluded from the hashed set', canonical(makeCharacter({
  spellbook: { known: [{ name_en: 'Fireball' } as never], prepared: ['Fireball'], slots: { 3: { max: 2, current: 2 } } },
})) === baseline);

// ── INCLUDED fields must move the string ───────────────────────────────────
const includedMutations: Array<[string, Partial<CharacterData>]> = [
  ['name', { name: 'Rina' }],
  ['level', { level: 4 }],
  ['jobClass', { jobClass: '法师' }],
  ['acMod', { acMod: 17 }],
  ['hpMax', { hpMax: 29 }],
  ['speed', { speed: '40' }],
  ['schemaVersion', { schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION - 1 }],
  ['classLevels', { classLevels: [{ className: '战士', level: 2 }, { className: '游荡者', level: 1 }] }],
  ['skillProficiencies', { skillProficiencies: ['运动', '察觉', '隐匿'] as SkillName[] }],
  ['savingThrowProficiencies', { savingThrowProficiencies: ['Str', 'Con', 'Dex'] as AttributeName[] }],
];
for (const [field, override] of includedMutations) {
  check(`${field} is covered by the hashed set`, canonical(makeCharacter(override)) !== baseline);
}
for (const attribute of DND_COMBAT_RELEVANT_ATTRIBUTE_KEYS) {
  for (const part of ['base', 'pointbuy', 'racebonus', 'extrabonus'] as const) {
    const attrs = JSON.parse(JSON.stringify(base.attrs)) as CharacterData['attrs'];
    attrs[attribute][part] += 1;
    check(`attrs.${attribute}.${part} is covered`, canonical(makeCharacter({ attrs })) !== baseline);
  }
}

// ── Order sensitivity is chosen, not accidental ────────────────────────────
const multiclassA = makeCharacter({ classLevels: [{ className: '战士', level: 2 }, { className: '游荡者', level: 1 }] });
const multiclassB = makeCharacter({ classLevels: [{ className: '游荡者', level: 1 }, { className: '战士', level: 2 }] });
check('classLevels order is significant', canonical(multiclassA) !== canonical(multiclassB));
check('classLevels order really does change the derived sheet',
  JSON.stringify(dndCharacterToLiteActorSheet(multiclassA).sheet.tags) !== JSON.stringify(dndCharacterToLiteActorSheet(multiclassB).sheet.tags));

const skillsA = makeCharacter({ skillProficiencies: ['运动', '察觉'] as SkillName[] });
const skillsB = makeCharacter({ skillProficiencies: ['察觉', '运动'] as SkillName[] });
check('skill proficiency order is not significant', canonical(skillsA) === canonical(skillsB));
check('duplicate skill proficiencies do not change the string',
  canonical(makeCharacter({ skillProficiencies: ['运动', '察觉', '运动'] as SkillName[] })) === baseline);
const savesA = makeCharacter({ savingThrowProficiencies: ['Str', 'Con'] as AttributeName[] });
const savesB = makeCharacter({ savingThrowProficiencies: ['Con', 'Str'] as AttributeName[] });
check('saving throw proficiency order is not significant', canonical(savesA) === canonical(savesB));
check('whitespace around a proficiency is normalised',
  canonical(makeCharacter({ skillProficiencies: [' 运动 ', '察觉'] as unknown as SkillName[] })) === baseline);
check('a trimmed name matches an untrimmed one', canonical(makeCharacter({ name: '  Rin  ' })) === baseline);

// ── Unreadable payloads produce NO string, never a fabricated one ──────────
const unreadable: Array<[string, unknown]> = [
  ['undefined', undefined],
  ['null', null],
  ['a string', 'Rin'],
  ['an array', [base]],
  ['an empty object', {}],
  ['a missing schemaVersion', { ...base, schemaVersion: undefined }],
  ['a future schemaVersion', { ...base, schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION + 1 }],
  ['a zero schemaVersion', { ...base, schemaVersion: 0 }],
  ['a missing name', { ...base, name: undefined }],
  ['a non-numeric level', { ...base, level: '3' }],
  ['a missing acMod', { ...base, acMod: undefined }],
  ['a non-string jobClass', { ...base, jobClass: 7 }],
  ['missing attrs', { ...base, attrs: undefined }],
  ['an attribute missing a part', { ...base, attrs: { ...base.attrs, Dex: { base: 14, pointbuy: 0, racebonus: 0 } } }],
  ['a lite actor sheet instead of a character', { schemaVersion: 1, displayName: 'Rin', actorKind: 'pc', defenses: {} }],
];
for (const [label, payload] of unreadable) {
  check(`${label} yields no canonical string`, canonicalDndCharacterCombatRelevantJsonFromPayload(payload) === undefined);
  check(`${label} yields no covered set`, readDndCharacterCombatRelevantFields(payload) === undefined);
}

// ── Numeric normalisation ──────────────────────────────────────────────────
check('negative zero acMod matches zero', canonical(makeCharacter({ acMod: -0 })) === canonical(makeCharacter({ acMod: 0 })));

// ── Boundary: the module stays pure ────────────────────────────────────────
const source = readFileSync(new URL('./dndCharacterCombatRelevantFields.ts', import.meta.url), 'utf8');
for (const forbidden of ['node:crypto', 'createHash', 'characterStore', 'Date.now', 'Math.random', 'fetch(']) {
  check(`the field module does not reference ${forbidden}`, !source.includes(forbidden));
}

console.log(JSON.stringify({ status: 'passed', suite: 'dndCharacterCombatRelevantFields', assertions: cases.length }, null, 2));
