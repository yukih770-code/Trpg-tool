import assert from 'node:assert/strict';
import {
  applyDndPersonalContentAssistantPlan,
  buildDndPersonalContentAssistantPlan,
  buildDndPersonalContentAssistantRequest,
  dndPersonalContentAuthoringFingerprint,
  type DndPersonalContentAuthoringSnapshot,
} from './dndPersonalContentAssistant';
import { parseDndPersonalContentAssistantSuggestion } from './dndPersonalContentAssistantTypes';

const snapshot: DndPersonalContentAuthoringSnapshot = {
  entryKind: 'spell',
  values: {
    entryName: '',
    summary: '',
    spellLevel: '1',
    spellSchool: '自定义',
    spellCastTime: '1 动作',
    spellRange: '60 尺',
    spellDuration: '立即',
    spellComponents: 'V, S',
  },
};

const suggestion = parseDndPersonalContentAssistantSuggestion({
  version: 1,
  entryKind: 'spell',
  proposalSummary: '一项原创的防护型法术资料草稿。',
  fieldValues: [
    { field: 'entryName', value: '雾镜守护' },
    { field: 'summary', value: '短暂折射来袭威胁的防护法术。' },
    { field: 'spellTarget', value: '一个你能看见的生物' },
    { field: 'spellEffect', value: '提供一项需要主持人审核的临时防护说明。' },
    { field: 'ruleTriggers', value: '触发限制 | 每轮只能受益一次' },
  ],
  rationale: ['保持为声明式资料，不执行效果。'],
  warnings: ['数值强度需要主持人复核。'],
});
assert.ok(suggestion);

const plan = buildDndPersonalContentAssistantPlan({
  snapshot,
  result: {
    suggestionId: 'ai_content_1',
    provider: 'ollama',
    route: 'local',
    model: 'qwen-test',
    createdAt: 1,
    suggestion,
  },
});
assert.equal(plan.ready, true);
assert.equal(plan.nextValues.entryName, '雾镜守护');
assert.equal(plan.changedFields.includes('spellEffect'), true);
assert.equal(applyDndPersonalContentAssistantPlan(snapshot, plan)?.summary, '短暂折射来袭威胁的防护法术。');
assert.equal(applyDndPersonalContentAssistantPlan({ ...snapshot, values: { ...snapshot.values, spellRange: '自身' } }, plan), null);

const wrongKind = buildDndPersonalContentAssistantPlan({
  snapshot,
  result: {
    suggestionId: 'ai_content_2', provider: 'ollama', route: 'local', model: 'qwen-test', createdAt: 1,
    suggestion: { ...suggestion, entryKind: 'item' },
  },
});
assert.equal(wrongKind.ready, false);
assert.equal(wrongKind.issues.some((issue) => issue.code === 'entry-kind-mismatch'), true);

const unsupported = buildDndPersonalContentAssistantPlan({
  snapshot,
  result: {
    suggestionId: 'ai_content_3', provider: 'ollama', route: 'local', model: 'qwen-test', createdAt: 1,
    suggestion: { ...suggestion, fieldValues: [{ field: 'monsterHp', value: '999' }] },
  },
});
assert.equal(unsupported.ready, false);
assert.equal(unsupported.issues.some((issue) => issue.code === 'unsupported-monsterHp'), true);

const invalidLines = buildDndPersonalContentAssistantPlan({
  snapshot,
  result: {
    suggestionId: 'ai_content_4', provider: 'ollama', route: 'local', model: 'qwen-test', createdAt: 1,
    suggestion: { ...suggestion, fieldValues: [{ field: 'entryName', value: '坏格式' }, { field: 'ruleActions', value: '缺少分隔格式' }] },
  },
});
assert.equal(invalidLines.ready, false);
assert.equal(invalidLines.issues.some((issue) => issue.code === 'invalid-ruleActions'), true);

assert.equal(parseDndPersonalContentAssistantSuggestion({ ...suggestion, fieldValues: [{ field: 'entryName', value: 'A' }, { field: 'entryName', value: 'B' }] }), null);
assert.equal(buildDndPersonalContentAssistantRequest({ intent: '  起草一个原创法术  ', locale: 'zh-CN', snapshot }).intent, '起草一个原创法术');
assert.equal(dndPersonalContentAuthoringFingerprint(snapshot), dndPersonalContentAuthoringFingerprint(snapshot));

console.log('DND personal content assistant plan smoke passed.');
