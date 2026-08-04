import {
  getCantripsKnownAtLevel,
  getClassProgression,
  getFeaturesAtLevel,
  getPactMagicAtLevel,
  getSpellSlotsAtLevel,
} from './progression-utils';
import { resolveResourceMax } from './progression-utils';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const barbarian = getClassProgression('barbarian');
assert(
  getFeaturesAtLevel('barbarian', 20).includes('原初斗士'),
  'Barbarian level 20 should retain Primal Champion from the local source table',
);
assert(!barbarian?.levels.some(level => level.notes?.includes('待后续补全')), 'Barbarian should not retain placeholder notes');

const bard = getClassProgression('bard');
assert(
  getFeaturesAtLevel('bard', 18).includes('先发激励'),
  'Bard level 18 should retain Superior Inspiration from the local source table',
);
assert(getCantripsKnownAtLevel('bard', 20) === 4, 'Bard level 20 should expose four cantrips');
assert(getSpellSlotsAtLevel('bard', 20)?.level9 === 2, 'Bard level 20 should expose two ninth-level slots');

const warlock = getClassProgression('warlock');
const invocations = warlock?.levels[0]?.resources.find(resource => resource.id === 'warlock_eldritch_invocations');
assert(resolveResourceMax(invocations!, 20) === 10, 'Warlock invocation count should use the source-table value');
assert(
  getPactMagicAtLevel('warlock', 17)?.slots === 4,
  'Warlock level 17 should retain four pact slots from the local source table',
);
assert(
  getFeaturesAtLevel('warlock', 20).includes('魔能掌控'),
  'Warlock level 20 should retain Eldritch Master from the local source table',
);

const wizard = getClassProgression('wizard');
assert(
  getFeaturesAtLevel('wizard', 20).includes('招牌法术'),
  'Wizard level 20 should retain Signature Spells from the local source table',
);
assert(wizard?.spellcasting?.preparedSpellCount[19] === 25, 'Wizard level 20 should retain the source-table prepared-spell count');
assert(
  ![barbarian, bard, warlock, wizard].some(progression =>
    progression?.levels.some(level => level.notes?.includes('待后续补全')),
  ),
  'Earlier standard-class progression tables must not retain high-level placeholder notes',
);

console.log('DND owner-source class progression batch 5 smoke passed.');
