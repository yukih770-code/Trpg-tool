import {
  getClassProgression,
  getFeaturesAtLevel,
  getSpellSlotsAtLevel,
} from './progression-utils';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const paladin = getClassProgression('paladin');
assert(paladin?.levels.length === 20, 'Paladin should expose all 20 source-table levels');
assert(
  getFeaturesAtLevel('paladin', 6).includes('守护灵光'),
  'Paladin level 6 should retain Aura of Protection from the local source table',
);
assert(
  getSpellSlotsAtLevel('paladin', 1)?.level1 === 2,
  'Paladin level 1 should expose the sourced first-level spell slots',
);
assert(
  getSpellSlotsAtLevel('paladin', 20)?.level5 === 2,
  'Paladin level 20 should expose the sourced fifth-level spell slots',
);

const ranger = getClassProgression('ranger');
assert(ranger?.levels.length === 20, 'Ranger should expose all 20 source-table levels');
assert(
  getFeaturesAtLevel('ranger', 17).includes('致命猎杀'),
  'Ranger level 17 should retain Foe Slayer from the local source table',
);
assert(
  getSpellSlotsAtLevel('ranger', 1)?.level1 === 2,
  'Ranger level 1 should expose the sourced first-level spell slots',
);
assert(
  !paladin?.levels.some(level => level.notes?.includes('待后续补全')) &&
    !ranger?.levels.some(level => level.notes?.includes('待后续补全')),
  'Paladin and Ranger source-table levels must not retain placeholder notes',
);

console.log('DND owner-source class progression batch 3 smoke passed.');
