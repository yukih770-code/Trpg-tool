import assert from 'node:assert/strict';
import { readLocalModelGatewayConfig } from '../config/modelGatewayConfig.js';
import { ModelGatewayError } from './modelGateway.js';
import { createRoutedLocalModelGateway } from './modelRoutingGateway.js';

const validSuggestion = { version: 1, summary: '建议', rationale: [], patch: { name: '阿尔法' }, warnings: [] };
const request = { system: 'system', prompt: 'prompt', schema: { type: 'object' } };
const chatModels: string[] = [];
let tagRequests = 0;
const fetcher: typeof fetch = async (url, init) => {
  if (String(url).endsWith('/api/tags')) {
    tagRequests += 1;
    return new Response(JSON.stringify({
      models: [
        { name: 'llama3.2:latest', size: 2_000_000_000 },
        { name: 'qwen3.6:27b', size: 17_000_000_000 },
        { name: '../invalid model' },
      ],
    }), { status: 200 });
  }
  const body = JSON.parse(String(init?.body)) as { model: string };
  chatModels.push(body.model);
  return new Response(JSON.stringify({ message: { content: JSON.stringify(validSuggestion) } }), { status: 200 });
};

let clock = 1_000;
const gateway = createRoutedLocalModelGateway({
  config: readLocalModelGatewayConfig({ LOCAL_AI_PROVIDER: 'ollama', LOCAL_AI_BASE_URL: 'http://127.0.0.1:11434', LOCAL_AI_MODEL: 'llama3.2:latest' }),
  fetcher,
  now: () => clock,
});

const catalog = await gateway.catalog();
assert.equal(catalog.local.reachable, true);
assert.equal(catalog.local.defaultModel, 'llama3.2:latest');
assert.equal(catalog.local.recommendedModel, 'qwen3.6:27b');
assert.deepEqual(catalog.models.map((model) => model.id), ['qwen3.6:27b', 'llama3.2:latest']);
assert.equal(JSON.stringify(catalog).includes('127.0.0.1'), false);
assert.equal((await gateway.status()).model, 'qwen3.6:27b');
await gateway.generateDndCharacterSuggestion(request);
await gateway.generateDndCharacterSuggestion(request, undefined, { mode: 'local', localModel: 'llama3.2:latest' });
assert.deepEqual(chatModels, ['qwen3.6:27b', 'llama3.2:latest']);
assert.equal(tagRequests, 1, 'inventory should be cached between nearby requests');

await assert.rejects(
  () => gateway.generateDndCharacterSuggestion(request, undefined, { mode: 'local', localModel: 'not-installed' }),
  (error) => error instanceof ModelGatewayError && error.kind === 'model_unavailable' && error.retryable === false,
);
await assert.rejects(
  () => gateway.generateDndCharacterSuggestion(request, undefined, { mode: 'off' }),
  (error) => error instanceof ModelGatewayError && error.kind === 'not_configured',
);
await assert.rejects(
  () => gateway.generateDndCharacterSuggestion(request, undefined, { mode: 'cloud' }),
  (error) => error instanceof ModelGatewayError && error.kind === 'route_unavailable',
);
const cancelled = new AbortController();
cancelled.abort();
await assert.rejects(
  () => gateway.generateDndCharacterSuggestion(request, cancelled.signal),
  (error) => error instanceof ModelGatewayError && error.kind === 'cancelled',
);
assert.equal(chatModels.length, 2, 'rejected routes must not reach model generation');

clock += 20_000;
await gateway.catalog(undefined, true);
assert.equal(tagRequests, 2, 'explicit refresh must bypass inventory cache');

const allowlisted = createRoutedLocalModelGateway({
  config: readLocalModelGatewayConfig({
    LOCAL_AI_PROVIDER: 'ollama',
    LOCAL_AI_BASE_URL: 'http://127.0.0.1:11434',
    LOCAL_AI_ALLOWED_MODELS: 'llama3.2:latest',
  }),
  fetcher,
});
assert.deepEqual((await allowlisted.catalog()).models.map((model) => model.id), ['llama3.2:latest']);

const unreachable = createRoutedLocalModelGateway({
  config: readLocalModelGatewayConfig({ LOCAL_AI_PROVIDER: 'ollama' }),
  fetcher: async () => { throw new Error('offline'); },
});
assert.equal((await unreachable.catalog()).local.reason, 'provider-unreachable');

console.log('AI model routing gateway smoke passed.');
