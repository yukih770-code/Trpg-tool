/**
 * Combat-relevant source hash smoke (T11a, server side).
 *
 * AI-LANDMARK: DND_CHARACTER_COMBAT_RELEVANT_HASH_SMOKE_V1
 *
 * Asserts the three properties the review flag rests on:
 *  - the digest is deterministic, self-describing and domain-separated from the
 *    clearance hash;
 *  - "unknown" is produced for every case that is not a confirmed comparison,
 *    and is never collapsed into "unchanged";
 *  - a level-up is detected while a round of damage is not.
 */

import {
  DND_COMBAT_RELEVANT_HASH_PREFIX,
  DND_COMBAT_RELEVANT_HASH_SYSTEM_ID,
  compareDndCharacterCombatRelevantHash,
  formatDndCharacterCombatRelevantHash,
  isDndCharacterCombatRelevantHash,
  sourceChangedSinceApprovalFlag,
} from './dndCharacterCombatRelevantHash.js';
import { createSyntheticActorSnapshot, hashActorSnapshot } from './characterClearance.js';

const cases: string[] = [];

function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

function attr(score: number) {
  return { base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 };
}

function character(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 4,
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
    skillProficiencies: ['运动', '察觉'],
    savingThrowProficiencies: ['Str', 'Con'],
    weaponProficiencies: [], armorTraining: [],
    spellbook: { known: [], prepared: [], slots: {} },
    customLanguages: '通用语', inventory: [],
    personalContentReferences: [], feats: [], coin: 0,
    remainingPoints: 0, isCompleted: true, classResources: [],
    ...overrides,
  };
}

// ── Digest shape ───────────────────────────────────────────────────────────
const approved = character();
const baseline = formatDndCharacterCombatRelevantHash(approved);
check('a readable character produces a hash', typeof baseline === 'string' && baseline.length > 0);
check('the hash is self-describing', baseline!.startsWith(DND_COMBAT_RELEVANT_HASH_PREFIX));
check('the prefix names the system', DND_COMBAT_RELEVANT_HASH_PREFIX.startsWith(`${DND_COMBAT_RELEVANT_HASH_SYSTEM_ID}:`));
check('the prefix names the field version', DND_COMBAT_RELEVANT_HASH_PREFIX.includes('combatRelevantV1'));
check('the prefix names the algorithm', DND_COMBAT_RELEVANT_HASH_PREFIX.includes('sha256'));
check('the digest is 64 hex characters', /^[0-9a-f]{64}$/.test(baseline!.slice(DND_COMBAT_RELEVANT_HASH_PREFIX.length)));
check('the hash is deterministic', formatDndCharacterCombatRelevantHash(character()) === baseline);
check('the hash is recognised as ours', isDndCharacterCombatRelevantHash(baseline));

// ── Domain separation from the clearance hash ──────────────────────────────
const clearanceHash = hashActorSnapshot(createSyntheticActorSnapshot({
  systemId: 'dnd5e-2024', actorId: 'actor_1', displayName: 'Rin', source: 'localActorVault',
}));
check('the clearance hash covers a different tier', clearanceHash.coveredFieldTiers.includes('clearanceRelevant'));
check('the clearance hash is not mistaken for this one', !isDndCharacterCombatRelevantHash(clearanceHash.value));
check('the two digests differ', clearanceHash.value !== baseline!.slice(DND_COMBAT_RELEVANT_HASH_PREFIX.length));

// ── Unreadable payloads produce NO hash ────────────────────────────────────
for (const [label, payload] of [
  ['undefined', undefined],
  ['null', null],
  ['an empty object', {}],
  ['a non-character object', { hp: 12 }],
  ['a future schema version', character({ schemaVersion: 99 })],
  ['a lite actor sheet', { schemaVersion: 1, displayName: 'Rin', actorKind: 'pc' }],
] as Array<[string, unknown]>) {
  check(`${label} produces no hash`, formatDndCharacterCombatRelevantHash(payload) === undefined);
}

// ── Comparison: unknown is never collapsed into unchanged ──────────────────
const unknownCases: Array<[string, { storedHash: string | undefined | null; currentPayload: unknown }]> = [
  ['no stored baseline', { storedHash: undefined, currentPayload: approved }],
  ['a null stored baseline', { storedHash: null, currentPayload: approved }],
  ['a blank stored baseline', { storedHash: '   ', currentPayload: approved }],
  ['a foreign stored baseline', { storedHash: clearanceHash.value, currentPayload: approved }],
  ['a stored baseline from a newer field version', { storedHash: 'dnd5e-2024:combatRelevantV2:sha256:deadbeef', currentPayload: approved }],
  ['a stored baseline from another system', { storedHash: 'coc7e:combatRelevantV1:sha256:deadbeef', currentPayload: approved }],
  ['an unreadable current payload', { storedHash: baseline, currentPayload: { hp: 12 } }],
  ['a missing current payload', { storedHash: baseline, currentPayload: undefined }],
];
for (const [label, input] of unknownCases) {
  check(`${label} compares as unknown`, compareDndCharacterCombatRelevantHash(input) === 'unknown');
  check(`${label} projects no flag`, sourceChangedSinceApprovalFlag(compareDndCharacterCombatRelevantHash(input)) === undefined);
}

// ── Comparison: changed vs unchanged ───────────────────────────────────────
const unchanged: Array<[string, Record<string, unknown>]> = [
  ['an identical character', character()],
  ['a character that took damage', character({ hpCurrent: 4 })],
  ['a character with temporary hit points', character({ tempHp: 9 })],
  ['a character with failed death saves', character({ deathSaves: { successes: 1, failures: 2 } })],
  ['a character that spent hit dice', character({ hitDiceCurrent: 0 })],
  ['a character that rewrote its backstory', character({ description: 'new backstory' })],
  ['a character that bought rope', character({ inventory: ['绳索'], coin: 12 })],
  ['a character whose skills were reordered', character({ skillProficiencies: ['察觉', '运动'] })],
];
for (const [label, payload] of unchanged) {
  check(`${label} compares as unchanged`, compareDndCharacterCombatRelevantHash({ storedHash: baseline, currentPayload: payload }) === 'unchanged');
  check(`${label} projects false`, sourceChangedSinceApprovalFlag(compareDndCharacterCombatRelevantHash({ storedHash: baseline, currentPayload: payload })) === false);
}

const changed: Array<[string, Record<string, unknown>]> = [
  ['a level-up', character({ level: 4, classLevels: [{ className: '战士', level: 4 }] })],
  ['a raised maximum hit point total', character({ hpMax: 35 })],
  ['new armour', character({ acMod: 18 })],
  ['a raised ability score', character({ attrs: { ...(character().attrs as Record<string, unknown>), Str: attr(18) } })],
  ['a new skill proficiency', character({ skillProficiencies: ['运动', '察觉', '隐匿'] })],
  ['a new saving throw proficiency', character({ savingThrowProficiencies: ['Str', 'Con', 'Dex'] })],
  ['a multiclass dip', character({ classLevels: [{ className: '战士', level: 2 }, { className: '游荡者', level: 1 }] })],
  ['a changed speed', character({ speed: '40' })],
  ['a renamed character', character({ name: 'Rina' })],
  ['a changed class', character({ jobClass: '法师' })],
];
for (const [label, payload] of changed) {
  check(`${label} compares as changed`, compareDndCharacterCombatRelevantHash({ storedHash: baseline, currentPayload: payload }) === 'changed');
  check(`${label} projects true`, sourceChangedSinceApprovalFlag(compareDndCharacterCombatRelevantHash({ storedHash: baseline, currentPayload: payload })) === true);
}

console.log(JSON.stringify({ status: 'passed', suite: 'dndCharacterCombatRelevantHash', assertions: cases.length }, null, 2));
