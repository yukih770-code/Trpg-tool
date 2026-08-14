import assert from 'node:assert/strict';
import { createCampaignArtifactAssistantApiClient } from './campaignArtifactAssistantApiClient';

const calls: Array<{ url: string; init?: RequestInit }> = [];
const suggestion = { suggestionId: 'draft/1', task: 'preparation_brief', provider: 'ollama', route: 'local', model: 'qwen3.6:8b', createdAt: 1, expiresAt: 60_001, sources: [], suggestion: { version: 1, task: 'preparation_brief', title: '备团', summary: '摘要', sections: [{ heading: '开场', body: '内容', sourceIds: ['campaign:1'] }], uncertainties: [], suggestedNextSteps: [] } };
const client = createCampaignArtifactAssistantApiClient({
  baseUrl: 'https://platform.example.test', env: { DEV: false },
  fetcher: async (url, init) => {
    calls.push({ url: String(url), init });
    const value = String(url).endsWith('/status') ? { configured: true, reachable: true, provider: 'ollama', route: 'local', model: 'qwen3.6:8b', capabilities: [] } : String(url).includes('/suggestions') ? suggestion : [];
    return new Response(JSON.stringify({ ok: true, statusCode: 200, value }), { status: 200, headers: { 'content-type': 'application/json' } });
  },
});

await client.status('server/1', 'campaign/1');
await client.list('server/1', 'campaign/1', true);
await client.generate('server/1', 'campaign/1', { task: 'preparation_brief', sourceFamilies: ['campaign_summary'] });
await client.confirm('server/1', 'campaign/1', 'draft/1');
await client.adopt('server/1', 'campaign/1', 'artifact/1');
await client.withdrawAdoption('server/1', 'campaign/1', 'artifact/1');
await client.archive('server/1', 'campaign/1', 'artifact/1');
await client.restore('server/1', 'campaign/1', 'artifact/1');

assert.equal(calls[0].url, 'https://platform.example.test/api/ai/world-servers/server%2F1/campaigns/campaign%2F1/artifacts/status');
assert.equal(new Headers(calls[0].init?.headers).get('x-trpg-ai-mode'), 'auto');
assert.ok(calls[1].url.endsWith('/artifacts?includeArchived=true'));
assert.equal(calls[2].init?.method, 'POST');
assert.equal(new Headers(calls[2].init?.headers).get('x-trpg-ai-mode'), 'auto');
assert.ok(calls[3].url.endsWith('/suggestions/draft%2F1/confirm'));
assert.ok(calls[4].url.endsWith('/artifact%2F1/adopt'));
assert.ok(calls[5].url.endsWith('/artifact%2F1/withdraw-adoption'));
assert.ok(calls[6].url.endsWith('/artifact%2F1/archive'));
assert.ok(calls[7].url.endsWith('/artifact%2F1/restore'));

console.log('campaign artifact assistant API client smoke passed');
