import {
  getCantripsKnownAtLevel,
  getClassProgression,
  getFeaturesAtLevel,
  getSpellSlotsAtLevel,
} from './progression-utils';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const rogue = getClassProgression('rogue');
assert(rogue?.levels.length === 20, 'Rogue should expose all 20 source-table levels');
assert(
  getFeaturesAtLevel('rogue', 19).includes('偷袭提升（10d6）'),
  'Rogue level 19 should retain the source-table Sneak Attack progression',
);
assert(
  getFeaturesAtLevel('rogue', 20).includes('幸运一击'),
  'Rogue level 20 should retain Stroke of Luck from the local source table',
);

const sorcerer = getClassProgression('sorcerer');
assert(sorcerer?.levels.length === 20, 'Sorcerer should expose all 20 source-table levels');
assert(
  getFeaturesAtLevel('sorcerer', 7).includes('术法化身'),
  'Sorcerer level 7 should retain Sorcerous Restoration from the local source table',
);
assert(getCantripsKnownAtLevel('sorcerer', 10) === 6, 'Sorcerer level 10 should expose six cantrips');
assert(
  getSpellSlotsAtLevel('sorcerer', 20)?.level9 === 2,
  'Sorcerer level 20 should expose two level-nine spell slots from the source table',
);
assert(
  !rogue?.levels.some(level => level.notes?.includes('待后续补全')) &&
    !sorcerer?.levels.some(level => level.notes?.includes('待后续补全')),
  'Rogue and Sorcerer source-table levels must not retain placeholder notes',
);

console.log('DND owner-source class progression batch 4 smoke passed.');
