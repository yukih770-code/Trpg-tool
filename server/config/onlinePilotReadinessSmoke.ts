import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { WebSocket } from 'ws';
import { readServerRuntimeConfigFromEnv, validateServerStartupConfig } from './serverRuntimeConfig.js';
import { createPilotOriginGuard, createPilotLoginLimiter, isAllowedBrowserOrigin } from '../transport/pilotHttpBoundary.js';
import { createRoomSocketServer } from '../transport/roomSocketServer.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { registerPrivateAlphaAuthApiRoutes } from '../api/privateAlphaAuthApiRoutes.js';

const origin = 'https://pilot.example.test';
const safe = {
  NODE_ENV: 'production', SERVER_DEPLOYMENT_ENVIRONMENT: 'cloudPrivateAlpha', SERVER_RUNTIME_MODE: 'cloud',
  APP_PUBLIC_HTTP_URL: origin, APP_PUBLIC_WS_URL: 'wss://pilot.example.test', ROOM_ALLOWED_ORIGINS: origin,
  PRIVATE_ALPHA_AUTH_ENABLED: 'true', PRIVATE_ALPHA_SESSION_SECRET: 'test-only-not-a-real-session-secret',
};
const cases: string[] = [];
async function check(name: string, run: () => unknown | Promise<unknown>) {
  await run(); cases.push(name);
}
function errors(overrides: Record<string, string | undefined>) {
  return validateServerStartupConfig(readServerRuntimeConfigFromEnv({ ...safe, ...overrides }), true).errors;
}

async function socketStatus(url: string, requestOrigin?: string): Promise<number> {
  const socket = new WebSocket(url, { origin: requestOrigin });
  try {
    return await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket test timed out.')), 3000);
      socket.once('open', () => { clearTimeout(timer); resolve(101); });
      socket.once('unexpected-response', (_req, response) => { clearTimeout(timer); response.resume(); resolve(response.statusCode ?? 0); });
      socket.on('error', () => { /* rejected upgrades are asserted by status */ });
    });
  } finally { socket.terminate(); }
}

async function main() {
  await check('cloud accepts personal-invite auth without bootstrap code', () => assert.deepEqual(errors({}), []));
  await check('local defaults remain available', () => assert.deepEqual(validateServerStartupConfig(readServerRuntimeConfigFromEnv({}), false).errors, []));
  await check('production cannot silently select localDev', () => assert.ok(errors({ SERVER_DEPLOYMENT_ENVIRONMENT: undefined }).length));
  await check('misspelled deployment environment fails closed', () => assert.ok(errors({ SERVER_DEPLOYMENT_ENVIRONMENT: 'cloudPrivatAlpha' }).length));
  await check('conflicting environment aliases fail closed', () => assert.ok(errors({ ROOM_SERVER_ENV: 'localDev' }).length));
  await check('invalid runtime mode fails closed', () => assert.ok(errors({ SERVER_RUNTIME_MODE: 'clod' }).length));
  await check('insecure malformed credentialed and loopback URLs fail closed', () => {
    for (const value of ['http://pilot.example.test', 'garbage', 'https://secret@pilot.example.test', 'https://[::1]', 'https://localhost', 'https://127.1', 'https://pilot.example.test/path', 'https://pilot.example.test?secret=value']) {
      const result = errors({ APP_PUBLIC_HTTP_URL: value });
      assert.ok(result.length); assert.ok(!result.join('').includes(value));
    }
    assert.ok(errors({ APP_PUBLIC_WS_URL: 'ws://pilot.example.test' }).length);
  });
  await check('CORS must use exact secure origins', () => {
    for (const value of ['*', 'null', 'http://pilot.example.test', `${origin}/`, `${origin}/path`]) assert.ok(errors({ ROOM_ALLOWED_ORIGINS: value }).length);
  });
  await check('cloud rejects dev identity headers configuration', () => assert.ok(errors({ POSTGRES_USER_DEV_API_ENABLED: 'true' }).length));
  await check('deployment preflight checks secrets storage TLS and one origin without leaking credentials', () => {
    const marker = 'fixture-secret-do-not-print-this-password';
    const env = { ...process.env, ...safe, DATABASE_URL: `postgres://fixture:${marker}@127.0.0.1:5432/fixture`, DATABASE_SSL_MODE: 'disable', ASSET_STORAGE_DIR: tmpdir(), PRIVATE_ALPHA_INVITE_CODE: '' };
    for (const [override, expected] of [
      [{}, 0],
      [{ ASSET_STORAGE_DIR: 'relative-assets' }, 1],
      [{ DATABASE_SSL_MODE: 'prefer' }, 1],
      [{ PRIVATE_ALPHA_SESSION_SECRET: 'REPLACE_WITH_LONG_RANDOM_SESSION_SECRET' }, 1],
      [{ APP_PUBLIC_WS_URL: 'wss://different.example.test' }, 1],
    ] as [Record<string, string>, number][]) {
      const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server/config/verifyOnlinePilotDeployment.ts'], { env: { ...env, ...override }, encoding: 'utf8', windowsHide: true, timeout: 10_000 });
      assert.equal(result.status, expected);
      assert.ok(!`${result.stdout}${result.stderr}`.includes(marker));
    }
  });

  const app = express();
  let clock = 0;
  let writes = 0;
  app.use(createPilotOriginGuard([origin]));
  app.use('/api/auth/private-alpha/login', createPilotLoginLimiter(() => clock));
  app.use(express.json());
  registerPrivateAlphaAuthApiRoutes(app, {
    async me() { return { ok: true, statusCode: 200, value: { authenticated: false, authMode: 'unauthenticated' } }; },
    async login() { writes++; return { ok: true, statusCode: 200, value: { user: { userId: 'fixture-user', displayName: 'Fixture User' }, sessionToken: 'fixture-session', maxAgeSeconds: 60 } }; },
    async logout() { writes++; return { ok: true, statusCode: 200, value: { loggedOut: true } }; },
  }, { secureCookies: true });
  const server = createServer(app);
  createRoomSocketServer({ server, registry: createInMemoryRoomRegistry(), isOriginAllowed: (value) => isAllowedBrowserOrigin(value, [origin]) });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const login = (headers: Record<string, string> = {}) => fetch(`${base}/api/auth/private-alpha/login`, { method: 'POST', headers });
  try {
    await check('foreign and opaque origins cannot reach auth mutations', async () => {
      for (const value of ['https://evil.example.test', 'null']) assert.equal((await login({ Origin: value })).status, 403);
      assert.equal((await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { Origin: 'https://evil.example.test', Cookie: 'fixture-session' } })).status, 403);
      assert.equal(writes, 0);
    });
    await check('origin-less browser cross-site request is rejected', async () => assert.equal((await login({ 'Sec-Fetch-Site': 'cross-site' })).status, 403));
    await check('same-origin login sets secure host-only HTTP-only Lax cookie without JSON token', async () => {
      const response = await login({ Origin: origin });
      assert.equal(response.status, 200);
      const cookie = response.headers.get('set-cookie') ?? '';
      for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(flag));
      assert.ok(!cookie.includes('Domain='));
      assert.ok(!(await response.text()).includes('fixture-session'));
    });
    await check('origin-less tools remain supported', async () => assert.equal((await login()).status, 200));
    await check('login throttle cannot be bypassed with forwarded IP and resets after window', async () => {
      for (let i = 2; i < 60; i++) assert.equal((await login({ Origin: origin })).status, 200);
      const before = writes;
      const response = await login({ Origin: origin, 'X-Forwarded-For': '192.0.2.99' });
      assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '60'); assert.equal(writes, before);
      clock = 60_000;
      assert.equal((await login({ Origin: origin })).status, 200);
    });
    await check('secure logout clears cookie', async () => {
      const response = await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { Origin: origin } });
      assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0.*HttpOnly.*SameSite=Lax.*Secure/);
    });
    await check('foreign WebSocket origin is rejected before upgrade', async () => assert.equal(await socketStatus(base.replace('http:', 'ws:') + '/ws', 'https://evil.example.test'), 403));
    await check('same-origin WebSocket upgrade remains available', async () => assert.equal(await socketStatus(base.replace('http:', 'ws:') + '/ws', origin), 101));
    await check('origin-less socket tools remain available', async () => assert.equal(await socketStatus(base.replace('http:', 'ws:') + '/ws'), 101));
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  console.log(JSON.stringify({ passed: cases.length, cases, scope: 'isolated HTTP/WS + config + cookie serialization; not hosted TLS or real PostgreSQL' }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
