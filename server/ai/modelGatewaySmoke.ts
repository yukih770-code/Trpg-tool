import assert from 'node:assert/strict';
import { readLocalModelGatewayConfig } from '../config/modelGatewayConfig.js';
import { createLocalOllamaProvider } from './localOllamaProvider.js';
import { createModelGateway, ModelGatewayError, type StructuredModelProvider } from './modelGateway.js';

const validSuggestion = {
  version: 1,
  summary: '建议摘要',
  rationale: ['理由'],
  patch: { name: '测试角色' },
  warnings: [],
};
const validSessionSuggestion = {
  version: 1,
  task: 'recap',
  title: '本次回顾',
  summary: '摘要',
  highlights: ['亮点'],
  risks: ['风险'],
  suggestedNextSteps: ['下一步'],
  hostDraft: '主持人草稿',
  publicDraft: '公开草稿',
};
const validPersonalContentSuggestion = {
  version: 1,
  entryKind: 'item',
  proposalSummary: '原创物品草稿',
  fieldValues: [{ field: 'entryName', value: '潮声罗盘' }],
  rationale: ['声明式资料'],
  warnings: ['需要主持人审核'],
};
const request = { system: 'system', prompt: 'prompt', schema: { type: 'object' } };

assert.equal(readLocalModelGatewayConfig({}).configured, false);
assert.equal(readLocalModelGatewayConfig({ LOCAL_AI_PROVIDER: 'ollama' }).configured, true);
assert.equal(readLocalModelGatewayConfig({ LOCAL_AI_PROVIDER: 'ollama', LOCAL_AI_MODEL: 'local-model', LOCAL_AI_BASE_URL: 'file:///tmp/model' }).error, 'invalid-base-url');
assert.equal(readLocalModelGatewayConfig({ LOCAL_AI_MODEL: 'local-model' }).configured, true);
assert.deepEqual(readLocalModelGatewayConfig({ LOCAL_AI_PROVIDER: 'ollama', LOCAL_AI_ALLOWED_MODELS: ' qwen3.6:27b, llama3.2, qwen3.6:27b ' }).allowedModels, ['qwen3.6:27b', 'llama3.2']);

const provider: StructuredModelProvider = {
  id: 'ollama',
  model: 'local-model',
  status: async () => ({ reachable: true, modelAvailable: true }),
  generate: async () => validSuggestion,
};
const gateway = createModelGateway({ provider, timeoutMs: 1_000 });
assert.equal((await gateway.catalog()).models[0]?.id, 'local-model');
assert.deepEqual((await gateway.status()).reason, undefined);
assert.equal((await gateway.status(undefined, { mode: 'off' })).reason, 'user-disabled');
assert.equal((await gateway.status(undefined, { mode: 'cloud' })).reason, 'route-unavailable');
assert.equal((await gateway.generateDndCharacterSuggestion(request)).suggestion.patch.name, '测试角色');
const sessionGateway = createModelGateway({ provider: { ...provider, generate: async () => validSessionSuggestion }, timeoutMs: 1_000 });
assert.equal((await sessionGateway.generateRoomSessionSuggestion(request)).suggestion.publicDraft, '公开草稿');
const contentGateway = createModelGateway({ provider: { ...provider, generate: async () => validPersonalContentSuggestion }, timeoutMs: 1_000 });
assert.equal((await contentGateway.generateDndPersonalContentSuggestion!(request)).suggestion.fieldValues[0]?.field, 'entryName');

const invalidGateway = createModelGateway({ provider: { ...provider, generate: async () => ({ invalid: true }) }, timeoutMs: 1_000 });
await assert.rejects(() => invalidGateway.generateDndCharacterSuggestion(request), (error) => error instanceof ModelGatewayError && error.kind === 'invalid_output');
await assert.rejects(() => invalidGateway.generateDndPersonalContentSuggestion!(request), (error) => error instanceof ModelGatewayError && error.kind === 'invalid_output');
const oversizedGateway = createModelGateway({
  provider: { ...provider, generate: async () => ({ ...validSuggestion, rationale: Array(9).fill('过多理由') }) },
  timeoutMs: 1_000,
});
await assert.rejects(() => oversizedGateway.generateDndCharacterSuggestion(request), (error) => error instanceof ModelGatewayError && error.kind === 'invalid_output');
const invalidSessionGateway = createModelGateway({
  provider: { ...provider, generate: async () => ({ ...validSessionSuggestion, suggestedNextSteps: Array(7).fill('过多步骤') }) },
  timeoutMs: 1_000,
});
await assert.rejects(() => invalidSessionGateway.generateRoomSessionSuggestion(request), (error) => error instanceof ModelGatewayError && error.kind === 'invalid_output');

const timeoutGateway = createModelGateway({
  provider: {
    ...provider,
    generate: async (_request, signal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })),
  },
  timeoutMs: 10,
});
await assert.rejects(() => timeoutGateway.generateDndCharacterSuggestion(request), (error) => error instanceof ModelGatewayError && error.kind === 'timeout');

const cancelController = new AbortController();
const cancelGateway = createModelGateway({
  provider: {
    ...provider,
    generate: async (_request, signal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })),
  },
  timeoutMs: 1_000,
});
const cancelled = cancelGateway.generateDndCharacterSuggestion(request, cancelController.signal);
cancelController.abort();
await assert.rejects(() => cancelled, (error) => error instanceof ModelGatewayError && error.kind === 'cancelled');
const sessionCancelController = new AbortController();
const cancelledSession = cancelGateway.generateRoomSessionSuggestion(request, sessionCancelController.signal);
sessionCancelController.abort();
await assert.rejects(() => cancelledSession, (error) => error instanceof ModelGatewayError && error.kind === 'cancelled');

let ollamaBody: Record<string, unknown> | undefined;
const ollama = createLocalOllamaProvider({
  baseUrl: 'http://127.0.0.1:11434',
  model: 'local-model',
  fetcher: async (url, init) => {
    if (String(url).endsWith('/api/tags')) return new Response(JSON.stringify({ models: [{ name: 'local-model' }] }), { status: 200 });
    ollamaBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({ message: { content: JSON.stringify(validSuggestion) } }), { status: 200 });
  },
});
assert.equal((await ollama.status(new AbortController().signal)).modelAvailable, true);
assert.deepEqual(await ollama.generate(request, new AbortController().signal), validSuggestion);
assert.equal(ollamaBody?.stream, false);
assert.deepEqual(ollamaBody?.format, request.schema);

console.log('Local AI model gateway smoke passed.');
