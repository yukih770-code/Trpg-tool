import {
  getCantripsKnownAtLevel,
  getClassProgression,
  getFeaturesAtLevel,
  getSpellSlotsAtLevel,
} from './progression-utils';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fighter = getClassProgression('fighter');
assert(fighter?.levels.length === 20, 'Fighter should expose all 20 source-table levels');
assert(
  getFeaturesAtLevel('fighter', 5).includes('额外攻击'),
  'Fighter level 5 should retain Extra Attack from the local source table',
);
assert(
  getFeaturesAtLevel('fighter', 20).includes('额外攻击（三）'),
  'Fighter level 20 should retain the final source-table feature',
);
assert(
  !fighter?.levels.some(level => level.notes?.includes('待后续补全')),
  'Fighter source-table levels must not retain placeholder notes',
);

const cleric = getClassProgression('cleric');
assert(cleric?.levels.length === 20, 'Cleric should expose all 20 source-table levels');
assert(
  getFeaturesAtLevel('cleric', 5).includes('灼净亡灵'),
  'Cleric level 5 should retain Sear Undead from the local source table',
);
assert(getCantripsKnownAtLevel('cleric', 10) === 5, 'Cleric level 10 should expose five cantrips');
assert(
  getSpellSlotsAtLevel('cleric', 17)?.level9 === 1,
  'Cleric level 17 should expose the level-nine spell slot from the source table',
);
assert(
  !cleric?.levels.some(level => level.notes?.includes('待后续补全')),
  'Cleric source-table levels must not retain placeholder notes',
);

console.log('DND owner-source class progression batch 1 smoke passed.');
