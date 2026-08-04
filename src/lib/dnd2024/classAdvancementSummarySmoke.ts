import { getDndClassAdvancementSummary } from './classAdvancementSummary';
import type { ClassDef } from '../dnd-types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fighter: ClassDef = {
  id: 'fighter',
  name: '战士',
  desc: 'Smoke fixture',
  primaryAbility: 'Str',
  savingThrows: ['Str', 'Con'],
  hitDice: 'D10',
  weaponProficiencies: [],
  armorProficiencies: [],
  startingEquipment: '',
  features: [{ name: '测试特性', desc: 'Fixture feature', unlockLevel: 2 }],
  subclasses: [],
};

const sourceBacked = getDndClassAdvancementSummary({
  classDef: fighter,
  currentLevel: 1,
  hasSelectedSubclass: false,
});
assert(sourceBacked.averageHitPointIncrease === 6, 'D10 should use average 6 HP');
assert(sourceBacked.coverage === 'source-backed', 'Fighter should use the owner-source level table');
assert(sourceBacked.features.some((feature) => feature.name === '测试特性'), 'Class features should appear at their unlock level');

const barbarian: ClassDef = {
  ...fighter,
  id: 'barbarian',
  name: '野蛮人',
  hitDice: 'D12',
};
const partial = getDndClassAdvancementSummary({
  classDef: barbarian,
  currentLevel: 5,
  hasSelectedSubclass: false,
});
assert(partial.coverage === 'partial', 'Unverified placeholder classes should remain partial');

const personal: ClassDef = {
  ...fighter,
  id: 'personal.soulwright',
  name: '赋魂师',
  hitDice: 'D8',
};
const personalSummary = getDndClassAdvancementSummary({
  classDef: personal,
  currentLevel: 1,
  hasSelectedSubclass: false,
});
assert(personalSummary.averageHitPointIncrease === 5, 'D8 should use average 5 HP');
assert(personalSummary.coverage === 'personal', 'Unknown classes should remain personal display data');

const capped = getDndClassAdvancementSummary({
  classDef: fighter,
  currentLevel: 20,
  hasSelectedSubclass: false,
});
assert(capped.canLevelUp === false, 'Level 20 should not be levelled further');

console.log('DND class advancement summary smoke passed.');
