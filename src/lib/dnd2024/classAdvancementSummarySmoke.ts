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

const partial = getDndClassAdvancementSummary({
  classDef: fighter,
  currentLevel: 1,
  hasSelectedSubclass: false,
});
assert(partial.averageHitPointIncrease === 6, 'D10 should use average 6 HP');
assert(partial.coverage === 'partial', 'Placeholder class should be marked partial');
assert(partial.features.some((feature) => feature.name === '测试特性'), 'Class features should appear at their unlock level');

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
