import { createCampaignRoomApiClient } from './campaignRoomApiClient';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function response(value: unknown): Response {
  return new Response(JSON.stringify({ ok: true, statusCode: 200, value }), { headers: { 'content-type': 'application/json' } });
}

function assert(value: unknown, message: string): void {
  if (!value) throw new Error(message);
}

async function main(): Promise<void> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createCampaignRoomApiClient({
    baseUrl: 'https://api.example.test',
    env: { DEV: false },
    fetcher: async (input, init) => {
      calls.push({ url: String(input), init });
      return response([]);
    },
  });
  const cases: SmokeCase[] = [];
  const check = async (name: string, run: () => Promise<void>) => {
    try { await run(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  };

  await check('list_scene_states_path', async () => {
    await client.listSceneStates('server 1', 'campaign 1', 'room 1');
    assert(calls.at(-1)?.url.endsWith('/campaigns/campaign%201/rooms/room%201/scene-states'), 'scene state list path was incorrect');
  });
  await check('create_scene_state_request', async () => {
    await client.createSceneState('server-1', 'campaign-1', 'room-1', { title: 'Opening', runtimeSessionId: 'session-1', stateJson: { schemaVersion: 1, appFeature: 'scene-runtime-snapshot', exportedAt: '2026-01-01T00:00:00.000Z' } });
    assert(calls.at(-1)?.init?.method === 'POST' && String(calls.at(-1)?.init?.body).includes('scene-runtime-snapshot'), 'scene state create request changed');
  });
  await check('scene_state_detail_and_mutations', async () => {
    await client.getSceneState('server-1', 'campaign-1', 'room-1', 'scene-1');
    assert(calls.at(-1)?.url.endsWith('/scene-states/scene-1'), 'scene state detail path was incorrect');
    await client.updateSceneState('server-1', 'campaign-1', 'room-1', 'scene-1', { title: 'Updated' });
    assert(calls.at(-1)?.init?.method === 'PATCH', 'scene state update was not PATCH');
    await client.duplicateSceneState('server-1', 'campaign-1', 'room-1', 'scene-1');
    assert(calls.at(-1)?.url.endsWith('/duplicate'), 'scene state duplicate path was incorrect');
    await client.archiveSceneState('server-1', 'campaign-1', 'room-1', 'scene-1');
    assert(calls.at(-1)?.url.endsWith('/archive'), 'scene state archive path was incorrect');
  });

  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases, notes: ['Client request-shape smoke only. It does not contact a database or perform live sync.'] }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

void main();
