import { createPersonalCompendiumPackApiClient } from './personalCompendiumPackApiClient';

type Case = { name: string; passed: boolean; detail?: string };
function assert(condition: unknown, message: string): void { if (!condition) throw new Error(message); }
function response(value: unknown): Response { return new Response(JSON.stringify({ ok: true, statusCode: 200, value }), { headers: { 'content-type': 'application/json' } }); }

async function run(): Promise<Case[]> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createPersonalCompendiumPackApiClient({
    baseUrl: 'https://api.example.test', env: { DEV: false },
    fetcher: async (input, init) => { calls.push({ url: String(input), init }); return response([]); },
  });
  const cases: Case[] = [];
  async function check(name: string, verify: () => Promise<void> | void): Promise<void> {
    try { await verify(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  }
  await check('list_uses_current_user_private_route', async () => {
    await client.list();
    assert(calls.at(-1)?.url.endsWith('/api/me/private-compendium-packs'), 'list route changed');
  });
  await check('publish_posts_no_server_scope', async () => {
    const input = { displayName: 'My Species', entries: [{ entryKind: 'species' as const, displayName: 'Harbor Folk', content: { speed: 30 } }] };
    await client.publish(input);
    assert(calls.at(-1)?.init?.method === 'POST', 'publish must use POST');
    assert(calls.at(-1)?.init?.body === JSON.stringify(input), 'publish payload changed');
  });
  await check('publish_version_targets_a_personal_pack_only', async () => {
    const input = { versionLabel: '1.1.0', entries: [{ entryKind: 'species' as const, displayName: 'Updated Harbor Folk', content: { speed: 35 } }] };
    await client.publishVersion('pack_personal', input);
    assert(calls.at(-1)?.url.endsWith('/api/me/private-compendium-packs/pack_personal/versions'), 'version route changed');
    assert(calls.at(-1)?.init?.method === 'POST', 'version publish must use POST');
    assert(calls.at(-1)?.init?.body === JSON.stringify(input), 'version payload changed');
  });
  return cases;
}

run().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
