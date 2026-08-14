import assert from 'node:assert/strict';
import { createAiModelGatewayApiClient } from './aiModelGatewayApiClient';

const calls: Array<{ url: string; init?: RequestInit }> = [];
const client = createAiModelGatewayApiClient({
  baseUrl: 'https://api.example.test',
  env: { DEV: false },
  fetcher: async (url, init) => {
    calls.push({ url: String(url), init });
    const value = String(url).includes('/catalog')
      ? { local: { configured: true, reachable: true, recommendedModel: 'model' }, cloud: { configured: false, reason: 'not-implemented' }, models: [{ id: 'model', provider: 'ollama', route: 'local', installed: true, recommended: true, capabilities: [] }], refreshedAt: 1 }
      : String(url).endsWith('/status')
      ? { configured: true, reachable: true, provider: 'ollama', route: 'local', model: 'model', capabilities: [] }
      : { suggestionId: 's1', provider: 'ollama', route: 'local', model: 'model', createdAt: 1, suggestion: { version: 1, summary: 'ok', rationale: [], patch: { name: 'A' }, warnings: [] } };
    return new Response(JSON.stringify({ ok: true, statusCode: 200, value }), { status: 200, headers: { 'content-type': 'application/json' } });
  },
});
await client.catalog(true);
await client.status();
const request = {
  intent: 'help',
  actor: { actorId: 'a', isCompleted: false, name: '', level: 1, speciesName: '', backgroundName: '', className: '', originFeatNames: [], pointBuy: { Str: 8, Dex: 8, Con: 8, Int: 8, Wis: 8, Cha: 8 }, description: '', appearanceDescription: '' },
  options: { classes: ['战士'], backgrounds: ['士兵'], originFeats: ['警觉'] },
};
await client.suggestDndCharacter(request);
assert.equal(calls[0]?.url, 'https://api.example.test/api/ai/model-gateway/catalog?refresh=1');
assert.equal(calls[1]?.url, 'https://api.example.test/api/ai/model-gateway/status');
assert.equal(new Headers(calls[1]?.init?.headers).get('x-trpg-ai-mode'), 'auto');
assert.equal(calls[2]?.init?.method, 'POST');
assert.equal(new Headers(calls[2]?.init?.headers).get('x-trpg-ai-mode'), 'auto');
assert.equal(calls[2]?.init?.body, JSON.stringify(request));
console.log('AI model gateway API client smoke passed.');
