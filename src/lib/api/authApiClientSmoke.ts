import { createAuthApiClient } from './authApiClient';
import { createApiClient } from './apiClient';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

async function run(): Promise<SmokeCase[]> {
  const cases: SmokeCase[] = [];
  const check = async (name: string, verify: () => Promise<void> | void) => {
    try { await verify(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  };

  await check('private_alpha_login_uses_cookie_credentials_without_dev_header', async () => {
    let captured: RequestInit | undefined;
    const client = createAuthApiClient({
      env: { DEV: false, VITE_API_BASE_URL: 'https://api.example.test', VITE_PRIVATE_ALPHA_AUTH_ENABLED: 'true' },
      fetcher: async (_url, init) => {
        captured = init;
        return new Response(JSON.stringify({ ok: true, statusCode: 200, value: { user: { userId: 'user_alpha', displayName: 'Alpha' } } }), { status: 200 });
      },
    });
    await client.loginPrivateAlpha({ displayName: 'Alpha', accessCode: 'not-persisted' });
    const headers = new Headers(captured?.headers);
    assert(captured?.credentials === 'include' && !headers.has('x-dev-user-id'), 'private alpha request leaked a dev identity header');
  });

  await check('local_dev_header_stays_local_only', async () => {
    let cloudHeaders = new Headers();
    const client = createApiClient({
      env: { DEV: true, VITE_LOCAL_DEV_AUTH_ENABLED: 'false', VITE_DEV_VIEWER_USER_ID: 'dev-user', VITE_API_BASE_URL: 'https://api.example.test' },
      fetcher: async (_url, init) => {
        cloudHeaders = new Headers(init?.headers);
        return new Response(JSON.stringify({ ok: true, statusCode: 200, value: {} }), { status: 200 });
      },
    });
    await client.request('/api/auth/me');
    assert(!cloudHeaders.has('x-dev-user-id'), 'disabled local dev auth still sent a user header');
  });
  return cases;
}

void run().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
