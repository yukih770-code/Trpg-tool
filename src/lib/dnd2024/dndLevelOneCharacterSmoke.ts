import assert from 'node:assert/strict';
import type { CharacterData } from '../dnd-types';
import { migrateCharacter } from '../characterMigration';
import {
  evaluateDndLevelOneReadiness,
  finalizeDndLevelOneCharacter,
  isDndCharacterFinalized,
  isPristineDndCharacterDraft,
} from './dndLevelOneCharacter';

function makeDraft(): CharacterData {
  return migrateCharacter({
    id: 'level-one-smoke',
    name: '',
    level: 1,
  });
}

const pristine = makeDraft();
assert.equal(isPristineDndCharacterDraft(pristine), true);

const missing = evaluateDndLevelOneReadiness(pristine);
assert.equal(missing.ready, false);
assert.deepEqual(
  missing.blockers.map((issue) => issue.code),
  [
    'missing-name',
    'missing-species',
    'missing-background',
    'missing-class',
    'missing-origin-feat',
    'invalid-point-buy',
  ],
);

const readyDraft: CharacterData = {
  ...pristine,
  name: '链路测试角色',
  race: '人类',
  background: '士兵',
  jobClass: '战士',
  feats: ['警觉'],
  remainingPoints: 0,
  attrs: {
    ...pristine.attrs,
    Str: { ...pristine.attrs.Str, pointbuy: 7 },
    Dex: { ...pristine.attrs.Dex, pointbuy: 5 },
    Con: { ...pristine.attrs.Con, pointbuy: 5 },
    Int: { ...pristine.attrs.Int, pointbuy: 3 },
    Wis: { ...pristine.attrs.Wis, pointbuy: 3 },
    Cha: { ...pristine.attrs.Cha, pointbuy: 2 },
  },
};

const ready = evaluateDndLevelOneReadiness(readyDraft, {
  starterEquipmentNeedsMaterialization: true,
});
assert.equal(ready.ready, true);
assert.deepEqual(ready.warnings.map((issue) => issue.code), ['starter-equipment-not-materialized']);
assert.equal(isPristineDndCharacterDraft(readyDraft), false);

const finalized = finalizeDndLevelOneCharacter(readyDraft, {
  spellSlots: {},
  starterEquipmentNeedsMaterialization: true,
});
assert.equal(finalized.ok, true);
if (!finalized.ok) throw new Error('expected a finalized character');
assert.equal(finalized.character.isCompleted, true);
assert.equal(finalized.character.classLevels.length, 1);
assert.equal(finalized.character.classLevels[0]?.className, '战士');
assert.equal(finalized.character.classLevels[0]?.level, 1);
assert.equal(isDndCharacterFinalized(finalized.character), true);

const invalidLevel = finalizeDndLevelOneCharacter({ ...readyDraft, level: 2 }, { spellSlots: {} });
assert.equal(invalidLevel.ok, false);

console.log('DND level-one character smoke passed.');
