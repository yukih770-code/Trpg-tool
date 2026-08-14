import assert from 'node:assert/strict';
import { CLASS_DATA } from '../../data/classes';
import { migrateCharacter } from '../characterMigration';
import { CURRENT_DND_CHARACTER_SCHEMA_VERSION, type CharacterData } from '../dnd-types';
import {
  buildDndLevelAdvancementPlan,
  canUndoDndLevelAdvancement,
  makeDndLevelAdvancementReceipt,
} from './dndLevelAdvancement';

function makeCharacter(overrides: Partial<CharacterData>): CharacterData {
  return migrateCharacter({
    id: 'level-advancement-smoke',
    schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
    name: '升级链路测试角色',
    race: '人类',
    background: '士兵',
    jobClass: '战士',
    subclass: '冠军武士',
    level: 5,
    hpMax: 44,
    hpCurrent: 31,
    hitDiceCurrent: 3,
    isCompleted: true,
    classLevels: [{ className: '战士', level: 5, subclass: '冠军武士' }],
    spellbook: { known: [], prepared: [], slots: {} },
    ...overrides,
  });
}

function classDef(name: string) {
  const value = CLASS_DATA.find((item) => item.name === name);
  assert(value, `missing class definition: ${name}`);
  return value;
}

// Fighter receives an additional advancement choice at class level 6; this
// must come from the local progression table, not the former generic level list.
const fighter = makeCharacter({});
const fighterMissingChoice = buildDndLevelAdvancementPlan({
  character: fighter,
  classDef: classDef('战士'),
  choice: { targetClass: { className: '战士' } },
});
assert.equal(fighterMissingChoice.requiresAdvancementChoice, true);
assert.equal(fighterMissingChoice.ready, false);
assert(fighterMissingChoice.issues.some((issue) => issue.code === 'advancement-choice-required'));

const fighterReady = buildDndLevelAdvancementPlan({
  character: fighter,
  classDef: classDef('战士'),
  choice: { targetClass: { className: '战士' }, abilityScoreIncreases: ['Str', 'Con'] },
});
assert.equal(fighterReady.ready, true);
assert.equal(fighterReady.nextCharacter?.level, 6);
assert.equal(fighterReady.nextCharacter?.classLevels[0]?.level, 6);
assert.equal(fighterReady.nextCharacter?.attrs.Str.extrabonus, fighter.attrs.Str.extrabonus + 1);
assert.equal(fighterReady.nextCharacter?.hpCurrent, fighter.hpCurrent + fighterReady.hpIncrease);

// A subclass choice blocks confirmation at its source-backed unlock level.
const fighterTwo = makeCharacter({
  level: 2,
  subclass: '',
  classLevels: [{ className: '战士', level: 2 }],
});
const subclassMissing = buildDndLevelAdvancementPlan({
  character: fighterTwo,
  classDef: classDef('战士'),
  choice: { targetClass: { className: '战士' } },
});
assert(subclassMissing.issues.some((issue) => issue.code === 'subclass-required'));

// Single-class slots use the owner-source progression and preserve spent slots.
const wizard = makeCharacter({
  jobClass: '法师',
  subclass: '防护学派',
  level: 2,
  classLevels: [{ className: '法师', level: 2, subclass: '防护学派' }],
  spellbook: { known: [], prepared: [], slots: { 1: { max: 3, current: 1 } } },
});
const wizardPlan = buildDndLevelAdvancementPlan({
  character: wizard,
  classDef: classDef('法师'),
  choice: { targetClass: { className: '法师' } },
});
assert.equal(wizardPlan.ready, true);
assert.deepEqual(wizardPlan.nextCharacter?.spellbook.slots, {
  1: { max: 4, current: 2 },
  2: { max: 2, current: 2 },
});

// New multiclass allocation stays explicit and never invents combined slots.
const multiclassPlan = buildDndLevelAdvancementPlan({
  character: fighter,
  classDef: classDef('法师'),
  choice: { targetClass: { className: '法师' } },
});
assert.equal(multiclassPlan.ready, true);
assert.equal(multiclassPlan.nextCharacter?.classLevels.length, 2);
assert.deepEqual(multiclassPlan.nextCharacter?.spellbook.slots, fighter.spellbook.slots);
assert(multiclassPlan.issues.some((issue) => issue.code === 'multiclass-prerequisites-unverified'));
assert(multiclassPlan.issues.some((issue) => issue.code === 'combined-spellcasting-deferred'));

// Resource formula uses target class level, while proficiency still follows total level.
const sorcererMulticlass = makeCharacter({
  jobClass: '战士',
  level: 8,
  classLevels: [
    { className: '战士', level: 4, subclass: '冠军武士' },
    { className: '术士', level: 4 },
  ],
  classResources: [],
});
const sorcererPlan = buildDndLevelAdvancementPlan({
  character: sorcererMulticlass,
  classDef: classDef('术士'),
  choice: { targetClass: { className: '术士' } },
});
assert.equal(sorcererPlan.ready, true);
const sorceryPoints = sorcererPlan.nextCharacter?.classResources.find((resource) => resource.id === 'sorcerer_sorcery_points');
assert.equal(sorceryPoints?.max, 5);

// Undo is allowed only while the actor still exactly matches the committed snapshot.
const receipt = makeDndLevelAdvancementReceipt(fighter, fighterReady, 1234);
assert(receipt);
assert.equal(canUndoDndLevelAdvancement(receipt.after, receipt), true);
assert.equal(canUndoDndLevelAdvancement({ ...receipt.after, hpCurrent: receipt.after.hpCurrent - 1 }, receipt), false);
assert.equal(canUndoDndLevelAdvancement({ ...receipt.after, id: 'another-actor' }, receipt), false);

console.log('DND level advancement smoke passed.');
