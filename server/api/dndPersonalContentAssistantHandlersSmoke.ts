import assert from 'node:assert/strict';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { ModelGateway, StructuredModelRequest } from '../ai/modelGateway.js';
import { createDndPersonalContentAssistantApiHandlers } from './dndPersonalContentAssistantHandlers.js';

const viewer: CurrentViewerContext = {
  viewerUserId: 'author-1', isAuthenticated: true, authTrustLevel: 'verified_session',
  isDevOnly: false, isServiceInternal: false, notes: [],
};

const promptsSeen: StructuredModelRequest[] = [];
let selectedModel = '';
const gateway = {
  async generateDndPersonalContentSuggestion(request: StructuredModelRequest, _signal?: AbortSignal, preference?: { localModel?: string }) {
    promptsSeen.push(request);
    selectedModel = preference?.localModel ?? '';
    return {
      suggestionId: 'ai_content_1', provider: 'ollama' as const, route: 'local' as const, model: 'qwen-test', createdAt: 1,
      suggestion: {
        version: 1 as const,
        entryKind: 'species' as const,
        proposalSummary: '原创种族草稿',
        fieldValues: [{ field: 'entryName' as const, value: '潮痕旅者' }, { field: 'speed' as const, value: '30' }],
        rationale: ['只提供声明式资料。'],
        warnings: ['需要主持人审核。'],
      },
    };
  },
} as unknown as ModelGateway;

const handlers = createDndPersonalContentAssistantApiHandlers({ gateway });
const unauthenticated = await handlers.suggest({ viewer: { ...viewer, viewerUserId: null, isAuthenticated: false }, body: {} });
assert.equal(unauthenticated.statusCode, 401);
const invalid = await handlers.suggest({ viewer, body: { intent: '', locale: 'zh-CN', draft: { entryKind: 'species', values: {} } } });
assert.equal(invalid.statusCode, 400);
const invalidField = await handlers.suggest({ viewer, body: { intent: '原创种族', locale: 'zh-CN', draft: { entryKind: 'species', values: { monsterHp: '10' } } } });
assert.equal(invalidField.statusCode, 400);
const unexpectedScope = await handlers.suggest({ viewer, body: { intent: '原创种族', locale: 'zh-CN', draft: { entryKind: 'species', values: {}, roomId: 'room-1' } } });
assert.equal(unexpectedScope.statusCode, 400);

const success = await handlers.suggest({
  viewer,
  headers: { 'x-trpg-ai-mode': 'local', 'x-trpg-ai-model': 'qwen3.6:27b' },
  body: { intent: '设计一种受潮汐影响的原创种族', locale: 'zh-CN', draft: { entryKind: 'species', values: { size: '中型', speed: '30' } } },
});
assert.equal(success.ok, true);
assert.equal(selectedModel, 'qwen3.6:27b');
const promptSeen = promptsSeen[0];
assert.ok(promptSeen);
assert.match(promptSeen.system, /original/i);
assert.match(promptSeen.system, /Do not reproduce official published text/);
assert.doesNotMatch(promptSeen.prompt, /packName|versionLabel/);

const mismatchedGateway = {
  async generateDndPersonalContentSuggestion() {
    return {
      suggestionId: 'ai_content_2', provider: 'ollama' as const, route: 'local' as const, model: 'qwen-test', createdAt: 1,
      suggestion: { version: 1 as const, entryKind: 'monster' as const, proposalSummary: '错误类型', fieldValues: [], rationale: [], warnings: [] },
    };
  },
} as unknown as ModelGateway;
const mismatch = await createDndPersonalContentAssistantApiHandlers({ gateway: mismatchedGateway }).suggest({
  viewer,
  body: { intent: '原创种族', locale: 'zh-CN', draft: { entryKind: 'species', values: {} } },
});
assert.equal(mismatch.statusCode, 503);

console.log('DND personal content assistant API handler smoke passed.');
