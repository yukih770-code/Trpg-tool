import {
  canAllocateDndClassLevel,
  getDndCharacterTotalLevel,
  incrementDndClassLevel,
  incrementPrimaryDndClassLevel,
  normalizeDndClassLevels,
} from './multiclass';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fallback = { className: '战士', classId: 'fighter', level: 3, subclass: '冠军' };
const migrated = normalizeDndClassLevels(undefined, fallback);
assert(migrated.length === 1 && migrated[0].level === 3, 'Legacy class should become one allocation');
assert(getDndCharacterTotalLevel(migrated) === 3, 'Single-class total should match legacy level');

const allocated = normalizeDndClassLevels([
  { className: '战士', classId: 'fighter', level: 3 },
  { className: '法师', classId: 'wizard', level: 2 },
], fallback);
assert(getDndCharacterTotalLevel(allocated) === 5, 'Class allocations should sum deterministically');
const advanced = incrementPrimaryDndClassLevel(allocated, fallback);
assert(advanced.find((entry) => entry.classId === 'fighter')?.level === 4, 'Primary level should increment');
assert(advanced.find((entry) => entry.classId === 'wizard')?.level === 2, 'Secondary level should remain untouched');

const wizardAdvance = incrementDndClassLevel(allocated, { className: '法师', classId: 'wizard' }, fallback);
assert(wizardAdvance.find((entry) => entry.classId === 'fighter')?.level === 3, 'Selected secondary allocation should not change primary');
assert(wizardAdvance.find((entry) => entry.classId === 'wizard')?.level === 3, 'Selected secondary allocation should increment');

const newClassAdvance = incrementDndClassLevel(allocated, { className: '牧师', classId: 'cleric' }, fallback);
assert(newClassAdvance.find((entry) => entry.classId === 'cleric')?.level === 1, 'A new class allocation should begin at level 1');
assert(canAllocateDndClassLevel([{ className: '战士', classId: 'fighter', level: 20 }], { className: '法师', classId: 'wizard' }).allowed === false, 'Total level 20 should block allocations');

console.log('DND multiclass foundation smoke passed.');
