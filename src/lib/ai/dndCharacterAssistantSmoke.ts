import assert from 'node:assert/strict';
import { BACKGROUND_DATA } from '../../data/backgrounds';
import { CLASS_DATA } from '../../data/classes';
import { FEATS_DATA } from '../../data/feats';
import { migrateCharacter } from '../characterMigration';
import { CURRENT_DND_CHARACTER_SCHEMA_VERSION, type CharacterData } from '../dnd-types';
import {
  buildDndCharacterAssistantPlan,
  buildDndCharacterAssistantRequest,
  canUndoDndCharacterAssistantCommit,
} from './dndCharacterAssistant';

function draft(overrides: Partial<CharacterData> = {}): CharacterData {
  return migrateCharacter({
    schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
    id: 'ai-draft', name: '', level: 1, isCompleted: false, jobClass: '', background: '', feats: [],
    classLevels: [], spellbook: { known: [], prepared: [], slots: {} },
    ...overrides,
  });
}

const character = draft();
const smokeBackground = BACKGROUND_DATA.find((background) => background.originFeat && FEATS_DATA.some((feat) => feat.name === background.originFeat));
assert(smokeBackground?.originFeat);
const request = buildDndCharacterAssistantRequest({ intent: '创建调查型角色', character, classes: CLASS_DATA, backgrounds: BACKGROUND_DATA, feats: FEATS_DATA });
assert.equal(request.actor.actorId, character.id);
assert.equal('inventory' in request.actor, false);

const result = {
  suggestionId: 'suggestion-1', provider: 'ollama' as const, route: 'local' as const, model: 'local-model', createdAt: 10,
  suggestion: {
    version: 1 as const,
    summary: '构建一个敏锐的调查者', rationale: ['感知与智力优先'], warnings: [],
    patch: {
      name: '林鸦', className: '游荡者', backgroundName: smokeBackground.name, originFeatName: smokeBackground.originFeat,
      pointBuy: { Str: 8, Dex: 15, Con: 13, Int: 14, Wis: 12, Cha: 10 },
      description: '谨慎地记录每一条线索。', appearanceDescription: '深色斗篷与旧笔记本。',
    },
  },
};
const plan = buildDndCharacterAssistantPlan({ character, result, classes: CLASS_DATA, backgrounds: BACKGROUND_DATA, feats: FEATS_DATA });
assert.equal(plan.ready, true);
assert.equal(plan.nextCharacter?.jobClass, '游荡者');
assert.equal(plan.nextCharacter?.remainingPoints, 0);
assert.equal(plan.nextCharacter?.classLevels[0]?.level, 1);

const invalidPointBuy = buildDndCharacterAssistantPlan({
  character,
  result: { ...result, suggestion: { ...result.suggestion, patch: { pointBuy: { Str: 15, Dex: 15, Con: 15, Int: 15, Wis: 15, Cha: 15 } } } },
  classes: CLASS_DATA, backgrounds: BACKGROUND_DATA, feats: FEATS_DATA,
});
assert(invalidPointBuy.issues.some((issue) => issue.code === 'invalid-point-buy'));

const conflictingOriginFeat = FEATS_DATA.find((feat) => feat.category === 'Origin' && feat.name !== smokeBackground.originFeat);
assert(conflictingOriginFeat);
const backgroundBoundCharacter = draft({ background: smokeBackground.name, feats: [smokeBackground.originFeat] });
const backgroundConflictPlan = buildDndCharacterAssistantPlan({
  character: backgroundBoundCharacter,
  result: { ...result, suggestion: { ...result.suggestion, patch: { originFeatName: conflictingOriginFeat.name } } },
  classes: CLASS_DATA, backgrounds: BACKGROUND_DATA, feats: FEATS_DATA,
});
assert(backgroundConflictPlan.issues.some((issue) => issue.code === 'background-feat-conflict'));

const completed = draft({ isCompleted: true, jobClass: '战士', classLevels: [{ className: '战士', level: 1 }] });
const completedPlan = buildDndCharacterAssistantPlan({ character: completed, result, classes: CLASS_DATA, backgrounds: BACKGROUND_DATA, feats: FEATS_DATA });
assert(completedPlan.issues.some((issue) => issue.code === 'completed-actor-structural-change'));

const persisted = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    get length() { return persisted.size; },
    clear: () => persisted.clear(),
    getItem: (key: string) => persisted.get(key) ?? null,
    key: (index: number) => Array.from(persisted.keys())[index] ?? null,
    removeItem: (key: string) => { persisted.delete(key); },
    setItem: (key: string, value: string) => { persisted.set(key, value); },
  } satisfies Storage,
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: globalThis,
});
const { useCharacterStore } = await import('../../store/characterStore');
const originalStore = useCharacterStore.getState();
useCharacterStore.setState({
  character,
  characters: [character],
  activeCharacterId: character.id,
  dndCharacterAssistantAudit: [],
  lastDndCharacterAssistantCommit: null,
});
assert.equal(useCharacterStore.getState().commitDndCharacterAssistantPlan(plan), true);
const committed = useCharacterStore.getState();
assert.equal(committed.character.name, '林鸦');
assert.equal(committed.characters[0]?.name, '林鸦');
assert.equal(committed.dndCharacterAssistantAudit[0]?.action, 'applied');
assert.equal(canUndoDndCharacterAssistantCommit(committed.character, committed.lastDndCharacterAssistantCommit), true);
useCharacterStore.setState({ character: { ...committed.character, hpCurrent: committed.character.hpCurrent - 1 } });
assert.equal(useCharacterStore.getState().undoLastDndCharacterAssistantCommit(), false);
useCharacterStore.setState({ character: committed.character });
assert.equal(useCharacterStore.getState().undoLastDndCharacterAssistantCommit(), true);
assert.equal(useCharacterStore.getState().dndCharacterAssistantAudit.at(-1)?.action, 'reverted');
useCharacterStore.setState(originalStore);

console.log('DND character assistant plan and commit smoke passed.');
