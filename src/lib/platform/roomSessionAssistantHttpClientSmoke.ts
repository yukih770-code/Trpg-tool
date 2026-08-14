import assert from 'node:assert/strict';
import { selectRoomSessionAssistantDraft } from '../ai/sessionAssistantTypes';
import { createRoomSessionAssistantHttpClient } from './roomSessionAssistantHttpClient';

const calls: Array<{ url: string; init?: RequestInit }> = [];
const suggestion = {
  suggestionId: 'suggestion/one',
  task: 'recap' as const,
  provider: 'ollama' as const,
  route: 'local' as const,
  model: 'local-model',
  createdAt: 1,
  expiresAt: 61_000,
  contextThroughSeq: 4,
  suggestion: {
    version: 1 as const,
    task: 'recap' as const,
    title: '回顾', summary: '摘要', highlights: [], risks: [], suggestedNextSteps: [],
    hostDraft: '私密草稿', publicDraft: '公开草稿',
  },
};
const client = createRoomSessionAssistantHttpClient({
  baseUrl: 'https://runtime.example.test',
  env: { DEV: false },
  fetcher: async (url, init) => {
    calls.push({ url: String(url), init });
    const value = String(url).endsWith('/status?memberId=member+host')
      ? { configured: true, reachable: true, provider: 'ollama', route: 'local', model: 'local-model', capabilities: [] }
      : String(url).endsWith('/confirm')
        ? { suggestionId: suggestion.suggestionId, event: { eventId: 'event-1', roomId: 'room/one', seq: 5, createdAt: new Date().toISOString(), kind: 'host.note', visibility: 'public', text: '公开草稿' } }
        : suggestion;
    return new Response(JSON.stringify({ ok: true, statusCode: 200, value }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  },
});

assert.equal(selectRoomSessionAssistantDraft(suggestion.suggestion, 'hostOnly'), '私密草稿');
assert.equal(selectRoomSessionAssistantDraft(suggestion.suggestion, 'public'), '公开草稿');

await client.status('room/one', 'member host');
await client.generate('room/one', { memberId: 'member host', task: 'recap', focus: '只写事实' });
await client.confirm('room/one', 'suggestion/one', 'member host', 'public');

assert.equal(calls[0]?.url, 'https://runtime.example.test/api/ai/rooms/room%2Fone/session-assistant/status?memberId=member+host');
assert.equal(calls[0]?.init?.credentials, 'include');
assert.equal(calls[1]?.init?.method, 'POST');
assert.equal(calls[1]?.init?.body, JSON.stringify({ memberId: 'member host', task: 'recap', focus: '只写事实' }));
assert.equal(calls[2]?.url, 'https://runtime.example.test/api/ai/rooms/room%2Fone/session-assistant/suggestions/suggestion%2Fone/confirm');
assert.equal(calls[2]?.init?.body, JSON.stringify({ memberId: 'member host', visibility: 'public' }));

console.log('Room Session AI HTTP client smoke passed.');
