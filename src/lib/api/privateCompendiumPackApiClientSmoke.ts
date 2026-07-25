import { createPrivateCompendiumPackApiClient } from './privateCompendiumPackApiClient';

type Case = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function response(value: unknown): Response {
  return new Response(JSON.stringify({ ok: true, statusCode: 200, value }), { headers: { 'content-type': 'application/json' } });
}

async function run(): Promise<Case[]> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createPrivateCompendiumPackApiClient({
    baseUrl: 'https://api.example.test', env: { DEV: false },
    fetcher: async (input, init) => {
      calls.push({ url: String(input), init });
      return response([]);
    },
  });
  const cases: Case[] = [];
  async function check(name: string, verify: () => Promise<void> | void): Promise<void> {
    try { await verify(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  }
  await check('list_uses_server_scoped_route', async () => {
    await client.list('server id');
    assert(calls.at(-1)?.url.endsWith('/api/world-servers/server%20id/compendium-packs'), 'list route changed');
  });
  await check('publish_posts_typed_private_content', async () => {
    const input = { displayName: 'Harbor Options', versionLabel: '1.0.0', entries: [{ entryKind: 'species' as const, displayName: 'Harbor Folk', content: { speed: 30 } }] };
    await client.publish('server-1', input);
    assert(calls.at(-1)?.init?.method === 'POST', 'publish must use POST');
    assert(calls.at(-1)?.init?.body === JSON.stringify(input), 'publish payload changed');
  });
  return cases;
}

run().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
