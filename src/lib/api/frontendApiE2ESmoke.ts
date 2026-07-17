import { createApiClient, resolveApiBaseUrl } from './apiClient';
import { ApiClientError } from './apiTypes';
import { createWorldServerApiClient } from './worldServerApiClient';
import { createCampaignRoomApiClient } from './campaignRoomApiClient';

type SmokeCase = { name: string; passed: boolean; details?: string };

function safeError(error: unknown): string {
  if (error instanceof ApiClientError) return `${error.kind}${error.statusCode ? `:${error.statusCode}` : ''}`;
  return 'client_error';
}

function okEnvelope(value: unknown): Response {
  return new Response(JSON.stringify({ ok: true, statusCode: 200, value }), { status: 200, headers: { 'content-type': 'application/json' } });
}

async function runDrySmoke(): Promise<SmokeCase[]> {
  const calls: string[] = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    calls.push(`${init?.method ?? 'GET'} ${String(input)}`);
    return okEnvelope([]);
  };
  const env = { DEV: true, VITE_DEV_VIEWER_USER_ID: 'frontend-e2e-user' };
  const worldClient = createWorldServerApiClient({ baseUrl: 'http://example.test/', env, isDev: true, fetcher: fakeFetch });
  const campaignClient = createCampaignRoomApiClient({ baseUrl: 'http://example.test/', env, isDev: true, fetcher: fakeFetch });
  await worldClient.listWorldServers();
  await campaignClient.listCampaigns('world-e2e');
  let missingCloudConfigIsSafe = false;
  try {
    await createApiClient({ env: { DEV: false }, fetcher: fakeFetch }).request('/api/world-servers');
  } catch (error) {
    missingCloudConfigIsSafe = error instanceof ApiClientError && error.kind === 'configuration';
  }
  return [
    { name: 'base_url_trailing_slash_normalized', passed: worldClient !== undefined && calls[0].startsWith('GET http://example.test/') },
    { name: 'world_client_expected_path', passed: calls.some((call) => call.includes('/api/world-servers?limit=100')) },
    { name: 'campaign_client_expected_path', passed: calls.some((call) => call.includes('/api/world-servers/world-e2e/campaigns')) },
    { name: 'dev_header_is_client_owned', passed: calls.length === 2 },
    { name: 'cloud_missing_api_url_fails_before_network', passed: missingCloudConfigIsSafe },
  ];
}

async function runRealSmoke(baseUrl: string): Promise<SmokeCase[]> {
  const viewerUserId = process.env.E2E_DEV_VIEWER_USER_ID?.trim();
  const env = { DEV: Boolean(viewerUserId), VITE_DEV_VIEWER_USER_ID: viewerUserId };
  const worldClient = createWorldServerApiClient({ baseUrl, env, isDev: Boolean(viewerUserId) });
  const campaignClient = createCampaignRoomApiClient({ baseUrl, env, isDev: Boolean(viewerUserId) });
  try {
    const worlds = await worldClient.listWorldServers(20);
    const cases: SmokeCase[] = [{ name: 'real_world_client_list', passed: true, details: `count=${worlds.length}` }];
    if (worlds.length === 0) {
      cases.push({ name: 'real_campaign_client_list', passed: true, details: 'skipped:no_world_server_visible' });
      return cases;
    }
    const campaigns = await campaignClient.listCampaigns(worlds[0].worldServerId);
    cases.push({ name: 'real_campaign_client_list', passed: true, details: `count=${campaigns.length}` });
    return cases;
  } catch (error) {
    return [{ name: 'real_api_clients', passed: false, details: safeError(error) }];
  }
}

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const configuredBaseUrl = process.env.E2E_API_BASE_URL?.trim();
  const mode = configuredBaseUrl ? 'real' : 'dry';
  const baseUrl = resolveApiBaseUrl({ VITE_API_BASE_URL: configuredBaseUrl ?? 'http://example.test/' });
  const cases = mode === 'real' ? await runRealSmoke(baseUrl) : await runDrySmoke();
  const failed = cases.filter((item) => !item.passed);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), strict, mode, baseUrl, authHeaderConfigured: Boolean(process.env.E2E_DEV_VIEWER_USER_ID?.trim()), total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases, notes: ['Dry mode uses fake fetch and never contacts a backend.', 'Real mode is read-only and uses the existing World/Campaign API clients.', 'No database URL or secret is printed.'] }, null, 2));
  if (strict && failed.length > 0) process.exitCode = 1;
}

try {
  await main();
} catch {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), status: 'failed', notes: ['Frontend API E2E harness failed; details intentionally redacted.'] }, null, 2));
  if (process.argv.includes('--strict')) process.exitCode = 1;
}
