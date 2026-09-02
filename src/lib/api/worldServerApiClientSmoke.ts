import { createApiClient, isDevApiDemoFallbackEnabled, resolveApiBaseUrl } from './apiClient';
import { ApiClientError } from './apiTypes';
import { createWorldServerApiClient } from './worldServerApiClient';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function runWorldServerApiClientSmoke(): Promise<SmokeCase[]> {
  const cases: SmokeCase[] = [];
  const check = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      cases.push({ name, passed: true });
    } catch (error) {
      cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) });
    }
  };

  await check('base_url_normalization', () => {
    assert(resolveApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.test///' }) === 'https://api.example.test', 'base URL was not normalized');
    assert(resolveApiBaseUrl({ DEV: true }) === 'http://localhost:8787', 'local development fallback changed');
    assert(resolveApiBaseUrl({ DEV: false }) === '', 'production unexpectedly fell back to localhost');
  });

  await check('success_envelope_and_list_path', async () => {
    const calls: string[] = [];
    const client = createWorldServerApiClient({
      baseUrl: 'https://api.example.test',
      env: { DEV: false },
      fetcher: async (input) => {
        calls.push(String(input));
        return jsonResponse({ ok: true, statusCode: 200, value: [] });
      },
    });
    const result = await client.listWorldServers();
    assert(Array.isArray(result), 'list result was not an array');
    assert(calls[0] === 'https://api.example.test/api/world-servers?limit=100', 'list path was incorrect');
  });

  await check('create_method_body_and_dev_header', async () => {
    let seenInit: RequestInit | undefined;
    const client = createWorldServerApiClient({
      baseUrl: 'http://localhost:8787',
      env: { DEV: true, VITE_DEV_VIEWER_USER_ID: 'dev-user' },
      fetcher: async (_input, init) => {
        seenInit = init;
        return jsonResponse({ ok: true, statusCode: 201, value: { worldServerId: 'ws-1' } });
      },
    });
    await client.createWorldServer({ displayName: 'Test Server', serverHandle: 'test-server-smoke' });
    const headers = new Headers(seenInit?.headers);
    assert(seenInit?.method === 'POST', 'create method was not POST');
    assert(seenInit?.body === JSON.stringify({ displayName: 'Test Server', serverHandle: 'test-server-smoke' }), 'create body changed');
    assert(headers.get('x-dev-user-id') === 'dev-user', 'dev header was not sent in dev mode');
  });

  await check('dev_header_not_emitted_in_production', async () => {
    let seenInit: RequestInit | undefined;
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      env: { DEV: false, VITE_DEV_VIEWER_USER_ID: 'should-not-send' },
      fetcher: async (_input, init) => {
        seenInit = init;
        return jsonResponse({ ok: true, statusCode: 200, value: { ok: true } });
      },
    });
    await client.request('/health');
    assert(!new Headers(seenInit?.headers).has('x-dev-user-id'), 'dev header leaked outside dev mode');
  });

  await check('safe_error_envelope_mapping', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      env: { DEV: false },
      fetcher: async () => jsonResponse({ ok: false, statusCode: 503, error: { kind: 'unavailable', message: 'safe unavailable', retryable: true } }, 503),
    });
    try {
      await client.request('/api/world-servers');
      throw new Error('request unexpectedly succeeded');
    } catch (error) {
      assert(error instanceof ApiClientError, 'error was not ApiClientError');
      assert(error.statusCode === 503 && error.retryable, 'safe error metadata was lost');
    }
  });

  await check('non_json_and_network_mapping', async () => {
    const nonJsonClient = createApiClient({ baseUrl: 'https://api.example.test', env: { DEV: false }, fetcher: async () => new Response('<html>error</html>', { status: 502 }) });
    try { await nonJsonClient.request('/api/world-servers'); } catch (error) { assert(error instanceof ApiClientError && error.kind === 'non_json', 'non-json response was not mapped'); }
    const networkClient = createApiClient({ baseUrl: 'https://api.example.test', env: { DEV: false }, fetcher: async () => { throw new Error('offline'); } });
    try { await networkClient.request('/api/world-servers'); } catch (error) { assert(error instanceof ApiClientError && error.kind === 'network', 'network failure was not mapped'); }
  });

  await check('multi_system_response_is_preserved', async () => {
    const client = createWorldServerApiClient({
      baseUrl: 'https://api.example.test',
      env: { DEV: false },
      fetcher: async () => jsonResponse({ ok: true, statusCode: 200, value: [
        { gameSystemId: 'dnd5e-2024', displayName: 'DND 5e 2024' },
        { gameSystemId: 'coc7e', displayName: 'COC 7e' },
      ] }),
    });
    const systems = await client.listGameSystems('ws-1');
    assert(systems.length === 2, 'multiple game systems were collapsed');
  });

  await check('revoke_invite_uses_server_scoped_route', async () => {
    let path = '';
    let method = '';
    const client = createWorldServerApiClient({
      baseUrl: 'https://api.example.test',
      env: { DEV: false },
      fetcher: async (input, init) => {
        path = String(input);
        method = init?.method ?? 'GET';
        return jsonResponse({ ok: true, statusCode: 200, value: { inviteId: 'invite-1', inviteStatus: 'revoked' } });
      },
    });
    const invite = await client.revokeInvite('ws-1', 'invite-1');
    assert(method === 'POST', 'revoke method was not POST');
    assert(path === 'https://api.example.test/api/world-servers/ws-1/invites/invite-1/revoke', 'revoke route was incorrect');
    assert(invite.inviteStatus === 'revoked', 'revoke response was not returned');
  });

  await check('error_reason_discriminator_is_carried', async () => {
    // The server discriminates a missing owner user from an ordinary duplicate
    // using the additive `reason` field. The client must carry it through, or
    // the UI falls back to "retry, this conflicts with existing data" for a
    // condition retrying can never fix.
    const client = createWorldServerApiClient({
      baseUrl: 'http://localhost:8787',
      env: { DEV: true, VITE_DEV_VIEWER_USER_ID: 'dev-user' },
      fetcher: async () => jsonResponse({
        ok: false,
        statusCode: 409,
        error: { kind: 'conflict', reason: 'missing_owner_user', message: 'The signed-in user does not exist in this database.' },
      }, 409),
    });
    let captured: unknown;
    try {
      await client.createWorldServer({ displayName: 'Test Server', serverHandle: 'missing-owner-smoke' });
    } catch (error) {
      captured = error;
    }
    assert(captured instanceof ApiClientError, 'expected an ApiClientError');
    const failure = captured as ApiClientError;
    assert(failure.statusCode === 409, 'status code was not carried');
    assert(failure.apiErrorKind === 'conflict', 'error kind was not carried');
    assert(failure.apiErrorReason === 'missing_owner_user', 'error reason discriminator was not carried');
  });

  await check('error_without_reason_stays_undiscriminated', async () => {
    const client = createWorldServerApiClient({
      baseUrl: 'http://localhost:8787',
      env: { DEV: true, VITE_DEV_VIEWER_USER_ID: 'dev-user' },
      fetcher: async () => jsonResponse({
        ok: false,
        statusCode: 409,
        error: { kind: 'conflict', message: 'World server request conflicts with existing data.' },
      }, 409),
    });
    let captured: unknown;
    try {
      await client.createWorldServer({ displayName: 'Dup', serverHandle: 'dup-smoke' });
    } catch (error) {
      captured = error;
    }
    assert(captured instanceof ApiClientError, 'expected an ApiClientError');
    assert((captured as ApiClientError).apiErrorReason === undefined, 'an absent reason must stay undefined');
  });

  return cases;
}

runWorldServerApiClientSmoke().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
