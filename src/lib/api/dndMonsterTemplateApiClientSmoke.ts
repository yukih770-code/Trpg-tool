import { createDndMonsterTemplateApiClient } from './dndMonsterTemplateApiClient';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function response(value: unknown): Response {
  return new Response(JSON.stringify({ ok: true, statusCode: 200, value }), { headers: { 'content-type': 'application/json' } });
}

async function run(): Promise<SmokeCase[]> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createDndMonsterTemplateApiClient({
    baseUrl: 'https://api.example.test', env: { DEV: false },
    fetcher: async (input, init) => { calls.push({ url: String(input), init }); return response([]); },
  });
  const cases: SmokeCase[] = [];
  const check = async (name: string, verify: () => Promise<void> | void) => {
    try { await verify(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  };

  await check('list_scoped_and_encoded', async () => {
    await client.list('server id', { creatureType: 'undead', challengeRating: '1/4' });
    const url = calls.at(-1)?.url ?? '';
    assert(url.includes('/world-servers/server%20id/dnd/monsters'), 'list scope path changed');
    assert(url.includes('creatureType=undead') && url.includes('challengeRating=1%2F4'), 'list query changed');
  });
  await check('create_private_template_body', async () => {
    await client.create('server-1', { name: 'Training Goblin', armorClass: 15 });
    assert(calls.at(-1)?.init?.method === 'POST', 'create must use POST');
    assert(calls.at(-1)?.init?.body === JSON.stringify({ name: 'Training Goblin', armorClass: 15 }), 'create body changed');
  });
  await check('get_update_archive_paths', async () => {
    await client.get('server-1', 'monster-1');
    assert(calls.at(-1)?.url.endsWith('/monsters/monster-1'), 'detail path changed');
    await client.update('server-1', 'monster-1', { name: 'Updated Training Goblin' });
    assert(calls.at(-1)?.init?.method === 'PATCH', 'update must use PATCH');
    await client.archive('server-1', 'monster-1');
    assert(calls.at(-1)?.url.endsWith('/monsters/monster-1/archive') && calls.at(-1)?.init?.method === 'POST', 'archive path changed');
  });
  return cases;
}

run().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
