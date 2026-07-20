import { createActorVaultApiClient } from './actorApiClient';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function response(value: unknown, status = 200): Response {
  return new Response(JSON.stringify({ ok: status < 400, statusCode: status, ...(status < 400 ? { value } : { error: value }) }), { status, headers: { 'content-type': 'application/json' } });
}

const calls: Array<{ url: string; init?: RequestInit }> = [];
const client = createActorVaultApiClient({
  baseUrl: 'https://api.example.test',
  env: { DEV: false },
  fetcher: async (url, init) => {
    calls.push({ url: String(url), init });
    return response({ actorId: 'actor_1', systemId: 'dnd5e-2024', displayName: 'Cloud Hero', payload: {} }, init?.method === 'POST' ? 201 : 200);
  },
});

await client.listActors({ systemId: 'coc7e', includeArchived: true, limit: 25 });
await client.createActor({ systemId: 'dnd5e-2024', localActorId: 'local_hero', displayName: 'Cloud Hero' });
await client.updateActor('actor 1', { displayName: 'Cloud Hero II' });
await client.archiveActor('actor 1');

const passed = calls[0]?.url === 'https://api.example.test/api/actors?systemId=coc7e&includeArchived=true&limit=25'
  && calls[1]?.init?.method === 'POST'
  && calls[1]?.init?.body === JSON.stringify({ systemId: 'dnd5e-2024', localActorId: 'local_hero', displayName: 'Cloud Hero' })
  && calls[2]?.url === 'https://api.example.test/api/actors/actor%201'
  && calls[3]?.url === 'https://api.example.test/api/actors/actor%201/archive';
assert(passed, 'Actor Vault API client did not preserve route or request semantics.');
console.log(JSON.stringify({ total: 4, passed: 4, failed: 0, cases: ['list query', 'create payload', 'update route', 'archive route'] }, null, 2));
