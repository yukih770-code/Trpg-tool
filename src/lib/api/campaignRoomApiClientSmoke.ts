import { createApiClient, isDevApiDemoFallbackEnabled } from './apiClient';
import { ApiClientError } from './apiTypes';
import { createCampaignRoomApiClient } from './campaignRoomApiClient';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

export async function runCampaignRoomApiClientSmoke(): Promise<SmokeCase[]> {
  const cases: SmokeCase[] = [];
  const check = async (name: string, fn: () => Promise<void> | void) => {
    try { await fn(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  };
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createCampaignRoomApiClient({
    baseUrl: 'https://api.example.test',
    env: { DEV: false },
    fetcher: async (input, init) => { calls.push({ url: String(input), init }); return jsonResponse({ ok: true, statusCode: 200, value: [] }); },
  });

  await check('campaign_list_path', async () => {
    await client.listCampaigns('server 1');
    assert(calls.at(-1)?.url === 'https://api.example.test/api/world-servers/server%201/campaigns', 'campaign list path was incorrect');
  });
  await check('campaign_list_query', async () => {
    await client.listCampaigns('server-1', { includeArchived: true, includeTrashed: true });
    assert(calls.at(-1)?.url.includes('includeArchived=true') && calls.at(-1)?.url.includes('includeTrashed=true'), 'campaign filters were lost');
  });
  await check('campaign_detail_path', async () => {
    await client.getCampaign('server-1', 'campaign-1');
    assert(calls.at(-1)?.url.endsWith('/campaigns/campaign-1'), 'campaign detail path was incorrect');
  });
  await check('campaign_create_method_body', async () => {
    await client.createCampaign('server-1', { title: 'One', systemId: 'dnd5e-2024' });
    assert(calls.at(-1)?.init?.method === 'POST', 'campaign create was not POST');
    assert(calls.at(-1)?.init?.body === JSON.stringify({ title: 'One', systemId: 'dnd5e-2024' }), 'campaign create body changed');
  });
  await check('campaign_archive_restore_paths', async () => {
    await client.archiveCampaign('server-1', 'campaign-1');
    assert(calls.at(-1)?.url.endsWith('/archive'), 'archive path was incorrect');
    await client.restoreCampaign('server-1', 'campaign-1');
    assert(calls.at(-1)?.url.endsWith('/restore'), 'restore path was incorrect');
  });
  await check('campaign_actor_read_paths', async () => {
    await client.listCampaignActors('server-1', 'campaign-1');
    await client.getCampaignActor('server-1', 'campaign-1', 'actor-1');
    assert(calls.at(-1)?.url.endsWith('/actors/actor-1'), 'actor detail path was incorrect');
  });
  await check('campaign_actor_write_paths', async () => {
    await client.createCampaignActor('server-1', 'campaign-1', { displayName: 'Actor' });
    assert(calls.at(-1)?.init?.method === 'POST', 'actor create was not POST');
    await client.archiveCampaignActor('server-1', 'campaign-1', 'actor-1');
    assert(calls.at(-1)?.url.endsWith('/archive'), 'actor archive path was incorrect');
  });
  await check('room_list_path', async () => {
    await client.listRooms('server-1', 'campaign-1');
    assert(calls.at(-1)?.url.endsWith('/campaigns/campaign-1/rooms'), 'room list path was incorrect');
  });
  await check('room_create_method_body', async () => {
    await client.createRoom('server-1', 'campaign-1', { metadata: { name: 'Table' } });
    assert(calls.at(-1)?.init?.method === 'POST' && calls.at(-1)?.init?.body === JSON.stringify({ metadata: { name: 'Table' } }), 'room create request changed');
  });
  await check('room_detail_path', async () => {
    await client.getRoom('server-1', 'campaign-1', 'room-1');
    assert(calls.at(-1)?.url.endsWith('/rooms/room-1'), 'room detail path was incorrect');
  });
  await check('room_metadata_subresources', async () => {
    await client.listRoomParticipants('server-1', 'campaign-1', 'room-1');
    assert(calls.at(-1)?.url.endsWith('/participants'), 'participants path was incorrect');
    await client.listLobbySlots('server-1', 'campaign-1', 'room-1');
    assert(calls.at(-1)?.url.endsWith('/lobby-slots'), 'lobby slots path was incorrect');
  });
  await check('runtime_session_paths', async () => {
    await client.getRuntimeSession('server-1', 'campaign-1', 'room-1', 'session-1');
    assert(calls.at(-1)?.url.includes('/runtime-session?runtimeSessionId=session-1'), 'runtime session query was incorrect');
    await client.createRuntimeSession('server-1', 'campaign-1', 'room-1', { title: 'Session' });
    assert(calls.at(-1)?.init?.method === 'POST', 'runtime session create was not POST');
    await client.updateRuntimeSession('server-1', 'campaign-1', 'room-1', { title: 'Updated' });
    assert(calls.at(-1)?.init?.method === 'PATCH', 'runtime session update was not PATCH');
  });
  await check('runtime_event_list_query', async () => {
    await client.listRuntimeEvents('server-1', 'campaign-1', 'room-1', { runtimeSessionId: 'session-1', afterSeq: 4, limit: 20 });
    const url = calls.at(-1)?.url ?? '';
    assert(url.includes('runtimeSessionId=session-1') && url.includes('afterSeq=4') && url.includes('limit=20'), 'runtime event query was incomplete');
  });
  await check('runtime_event_append_method_body', async () => {
    await client.appendRuntimeEvent('server-1', 'campaign-1', 'room-1', { runtimeSessionId: 'session-1', eventKind: 'frontend.note', visibility: 'public', payload: { text: 'hello' } });
    assert(calls.at(-1)?.init?.method === 'POST' && String(calls.at(-1)?.init?.body).includes('frontend.note'), 'runtime event append changed');
  });
  await check('safe_api_error_mapping', async () => {
    const failing = createApiClient({ baseUrl: 'https://api.example.test', env: { DEV: false }, fetcher: async () => jsonResponse({ ok: false, statusCode: 403, error: { kind: 'forbidden', message: 'safe' } }, 403) });
    try { await failing.request('/api/world-servers/server-1/campaigns'); throw new Error('request unexpectedly succeeded'); }
    catch (error) { assert(error instanceof ApiClientError && error.statusCode === 403, 'API error was not mapped safely'); }
  });
  await check('non_json_and_network_mapping', async () => {
    const nonJson = createApiClient({ fetcher: async () => new Response('<html/>', { status: 502 }) });
    try { await nonJson.request('/api/test'); } catch (error) { assert(error instanceof ApiClientError && error.kind === 'non_json', 'non-json response was not mapped'); }
    const offline = createApiClient({ fetcher: async () => { throw new Error('offline'); } });
    try { await offline.request('/api/test'); } catch (error) { assert(error instanceof ApiClientError && error.kind === 'network', 'network failure was not mapped'); }
  });
  await check('append_only_client_surface', () => {
    assert(!('updateRuntimeEvent' in client) && !('deleteRuntimeEvent' in client), 'event mutation methods were exposed');
  });
  await check('dev_demo_boundary', () => {
    assert(isDevApiDemoFallbackEnabled({ DEV: true, VITE_SERVER_WORKSPACE_DEMO: 'true' }), 'dev demo flag was not recognized');
    assert(!isDevApiDemoFallbackEnabled({ DEV: false, VITE_SERVER_WORKSPACE_DEMO: 'true' }), 'demo flag leaked outside dev mode');
  });

  return cases;
}

runCampaignRoomApiClientSmoke().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
