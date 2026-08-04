import {
  getCantripsKnownAtLevel,
  getClassProgression,
  getFeaturesAtLevel,
  getResourceDieAtLevel,
  getSpellSlotsAtLevel,
} from './progression-utils';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const druid = getClassProgression('druid');
assert(druid?.levels.length === 20, 'Druid should expose all 20 source-table levels');
assert(
  getFeaturesAtLevel('druid', 18).includes('兽形施法'),
  'Druid level 18 should retain Beast Spells from the local source table',
);
assert(getCantripsKnownAtLevel('druid', 10) === 4, 'Druid level 10 should expose four cantrips');
assert(
  getSpellSlotsAtLevel('druid', 20)?.level9 === 2,
  'Druid level 20 should expose two level-nine spell slots from the source table',
);
assert(
  getResourceDieAtLevel('druid', 'druid_wild_shape', 18) === null,
  'Wild Shape remains a bounded usage resource, not an invented die mechanic',
);

const monk = getClassProgression('monk');
assert(monk?.levels.length === 20, 'Monk should expose all 20 source-table levels');
assert(
  getFeaturesAtLevel('monk', 5).includes('武艺骰提升（1d8）'),
  'Monk level 5 should retain the martial-arts die table change',
);
assert(
  getFeaturesAtLevel('monk', 18).includes('无甲移动（+30尺）'),
  'Monk level 18 should retain the movement table change',
);
assert(
  !monk?.levels.some(level => level.notes?.includes('待后续补全')),
  'Monk source-table levels must not retain placeholder notes',
);

console.log('DND owner-source class progression batch 2 smoke passed.');
