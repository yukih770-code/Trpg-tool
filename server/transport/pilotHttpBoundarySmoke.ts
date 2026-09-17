import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import express from 'express';
import { WebSocket } from 'ws';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { readServerRuntimeConfigFromEnv, validateServerStartupConfig } from '../config/serverRuntimeConfig.js';
import { createPilotOriginGuard, isAllowedBrowserOrigin } from './pilotHttpBoundary.js';
import { createRoomSocketServer } from './roomSocketServer.js';

const productionOrigin = 'https://dnd-web-production.up.railway.app';
const evilOrigin = 'https://evil.example.test';
const navigation = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' };

async function socketStatus(url: string, origin?: string): Promise<number> {
  const socket = new WebSocket(url, { origin });
  socket.on('error', () => { /* Status below owns the rejection assertion. */ });
  try {
    return await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket test timed out.')), 3000);
      socket.once('open', () => { clearTimeout(timer); resolve(101); });
      socket.once('unexpected-response', (_request, response) => {
        clearTimeout(timer); response.resume(); resolve(response.statusCode ?? 0);
      });
    });
  } finally { socket.terminate(); }
}

async function main() {
  const cases: { name: string; passed: boolean; detail?: string }[] = [];
  const check = async (name: string, run: () => unknown | Promise<unknown>) => {
    try { await run(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  };
  const env = {
    NODE_ENV: 'production', SERVER_DEPLOYMENT_ENVIRONMENT: 'cloudPrivateAlpha', SERVER_RUNTIME_MODE: 'cloud',
    APP_PUBLIC_HTTP_URL: productionOrigin, APP_PUBLIC_WS_URL: productionOrigin.replace('https:', 'wss:'),
    ROOM_ALLOWED_ORIGINS: productionOrigin, PRIVATE_ALPHA_AUTH_ENABLED: 'true',
    PRIVATE_ALPHA_SESSION_SECRET: 'fixture-only-origin-test-secret',
  };
  await check('exact production origin is parsed and accepted by cloud startup', () => {
    const config = readServerRuntimeConfigFromEnv(env);
    assert.deepEqual(config.allowedOrigins, [productionOrigin]);
    assert.deepEqual(validateServerStartupConfig(config, true).errors, []);
  });
  await check('allowlist trims whitespace, splits commas and removes duplicates', () => {
    const config = readServerRuntimeConfigFromEnv({ ...env, ROOM_ALLOWED_ORIGINS: `  ${productionOrigin}, https://second.example.test, ${productionOrigin},  ` });
    assert.deepEqual(config.allowedOrigins, [productionOrigin, 'https://second.example.test']);
    assert.deepEqual(validateServerStartupConfig(config, true).errors, []);
  });
  await check('noncanonical or unsafe origin configuration fails closed', () => {
    for (const origin of ['*', 'null', 'http://dnd-web-production.up.railway.app', `${productionOrigin}/`, `${productionOrigin}/path`, `"${productionOrigin}"`, 'dnd-web-production.up.railway.app', 'HTTPS://DND-WEB-PRODUCTION.UP.RAILWAY.APP']) {
      assert.ok(validateServerStartupConfig(readServerRuntimeConfigFromEnv({ ...env, ROOM_ALLOWED_ORIGINS: origin }), true).errors.length, origin);
    }
  });

  const directory = await mkdtemp(join(tmpdir(), 'dnd-origin-regression-'));
  const index = join(directory, 'index.html');
  await writeFile(index, '<!doctype html><title>Origin regression frontend</title>');
  await writeFile(join(directory, 'asset.js'), '/* ordinary static resource */');
  const app = express();
  app.use(createPilotOriginGuard([productionOrigin]));
  app.get('/health', (_request, response) => response.json({ ok: true }));
  app.get('/api/read', (_request, response) => response.json({ ok: true }));
  let writes = 0;
  app.all('/api/mutate', (request, response) => {
    if (request.headers.authorization !== 'Bearer fixture-auth') { response.sendStatus(401); return; }
    writes++; response.sendStatus(204);
  });
  // Same ordering and static/fallback behavior as the cloud Room Server.
  app.use(express.static(directory, { index: false }));
  app.get('*', (request, response) => {
    if (request.path === '/api' || request.path.startsWith('/api/') || request.path === '/rooms' || request.path.startsWith('/rooms/')) {
      response.sendStatus(404); return;
    }
    response.sendFile(index);
  });
  const server = createServer(app);
  let socketViewerLookups = 0;
  createRoomSocketServer({
    server, registry: createInMemoryRoomRegistry(),
    isOriginAllowed: (origin) => isAllowedBrowserOrigin(origin, [productionOrigin]),
    resolveViewer: async () => {
      socketViewerLookups++;
      return { viewerUserId: null, isAuthenticated: false, authTrustLevel: 'anonymous', isDevOnly: false, isServiceInternal: false, notes: [] };
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const request = (path: string, method = 'GET', headers: Record<string, string> = {}) => fetch(base + path, { method, headers });
  try {
    await check('GET / without Origin loads frontend', async () => {
      const response = await request('/');
      assert.equal(response.status, 200); assert.match(await response.text(), /Origin regression frontend/);
    });
    await check('cross-site top-level GET navigation without Origin loads frontend', async () => {
      const response = await request('/', 'GET', navigation);
      assert.equal(response.status, 200); assert.match(await response.text(), /Origin regression frontend/);
    });
    await check('cross-site HEAD navigation without Origin is allowed', async () => {
      const response = await request('/', 'HEAD', navigation);
      assert.equal(response.status, 200); assert.equal(await response.text(), '');
    });
    await check('ordinary same-site GET/HEAD static and frontend routes work', async () => {
      for (const path of ['/asset.js', '/campaign/front-end-route']) {
        for (const method of ['GET', 'HEAD']) assert.equal((await request(path, method, { 'Sec-Fetch-Site': 'same-origin' })).status, 200);
      }
    });
    await check('cross-site Origin-less GET/HEAD static reads are allowed', async () => {
      for (const method of ['GET', 'HEAD']) assert.equal((await request('/asset.js', method, { 'Sec-Fetch-Site': 'cross-site' })).status, 200);
    });
    await check('healthcheck GET/HEAD without Origin remains usable', async () => {
      for (const method of ['GET', 'HEAD']) {
        assert.equal((await request('/health', method)).status, 200);
        assert.equal((await request('/health', method, { 'Sec-Fetch-Site': 'cross-site' })).status, 200);
      }
    });
    await check('approved production Origin permits frontend and API reads', async () => {
      for (const path of ['/', '/api/read']) assert.equal((await request(path, 'GET', { Origin: productionOrigin })).status, 200);
    });
    await check('explicit evil/opaque Origin remains rejected even for GET/HEAD', async () => {
      for (const origin of [evilOrigin, 'null']) for (const method of ['GET', 'HEAD']) {
        assert.equal((await request('/api/read', method, { Origin: origin })).status, 403);
      }
      assert.equal((await request('/', 'GET', { ...navigation, Origin: evilOrigin })).status, 403);
    });
    await check('evil/opaque Origin cannot reach authenticated mutations', async () => {
      const before = writes;
      for (const origin of [evilOrigin, 'null']) for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        assert.equal((await request('/api/mutate', method, { Origin: origin, Authorization: 'Bearer fixture-auth' })).status, 403);
      }
      assert.equal(writes, before);
    });
    await check('cross-site Origin-less unsafe requests remain rejected', async () => {
      const before = writes;
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
        assert.equal((await request('/api/mutate', method, { ...navigation, Authorization: 'Bearer fixture-auth' })).status, 403);
      }
      assert.equal(writes, before);
    });
    await check('approved Origin permits mutations subject to authentication', async () => {
      const before = writes;
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        assert.equal((await request('/api/mutate', method, { Origin: productionOrigin })).status, 401);
        assert.equal((await request('/api/mutate', method, { Origin: productionOrigin, Authorization: 'Bearer fixture-auth' })).status, 204);
      }
      assert.equal(writes, before + 4);
    });
    await check('existing Origin-less authenticated tools remain supported', async () => {
      assert.equal((await request('/api/mutate', 'POST')).status, 401);
      assert.equal((await request('/api/mutate', 'POST', { Authorization: 'Bearer fixture-auth' })).status, 204);
    });
    await check('proxy headers cannot approve an untrusted Origin', async () => {
      assert.equal((await request('/api/mutate', 'POST', {
        Origin: evilOrigin, Authorization: 'Bearer fixture-auth',
        'X-Forwarded-Host': 'dnd-web-production.up.railway.app', 'X-Forwarded-Proto': 'https',
      })).status, 403);
    });
    const socketUrl = base.replace('http:', 'ws:') + '/ws';
    await check('evil/opaque WebSocket origins rejected before session lookup', async () => {
      for (const origin of [evilOrigin, 'null']) assert.equal(await socketStatus(socketUrl, origin), 403);
      assert.equal(socketViewerLookups, 0);
    });
    await check('approved production WebSocket Origin allowed', async () => {
      assert.equal(await socketStatus(socketUrl, productionOrigin), 101);
    });
    await check('existing Origin-less socket tools remain supported', async () => assert.equal(await socketStatus(socketUrl), 101));
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('dnd-origin-regression-'));
    await rm(directory, { recursive: true, force: true });
  }
  const failed = cases.filter((entry) => !entry.passed).length;
  console.log(JSON.stringify({ passed: cases.length - failed, failed, cases, scope: 'isolated actual HTTP/static/WS transport; fixture auth/health, no production mutation' }, null, 2));
  if (failed) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
