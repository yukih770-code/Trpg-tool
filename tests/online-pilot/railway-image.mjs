import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

// Isolated Linux packaging rehearsal, never hosted acceptance. Uses an existing
// local Postgres image and random disposable credentials passed through env names.
const suffix = randomBytes(5).toString('hex');
const network = `dnd-pilot-check-${suffix}`;
const databaseName = `${network}-db`;
const appName = `${network}-app`;
const volume = `${network}-assets`;
const image = process.env.PILOT_IMAGE || 'dnd-railway-pilot:verification';
const env = { ...process.env, POSTGRES_PASSWORD: randomBytes(32).toString('hex'), POSTGRES_DB: 'pilot_check', POSTGRES_USER: 'pilot_check' };
Object.assign(env, {
  DATABASE_URL: `postgres://pilot_check:${env.POSTGRES_PASSWORD}@postgres.railway.internal:5432/pilot_check`,
  DATABASE_SSL_MODE: 'disable', DATABASE_NETWORK: 'railway-private',
  RAILWAY_PROJECT_ID: 'fixture-project', RAILWAY_ENVIRONMENT_ID: 'fixture-environment',
  RAILWAY_VOLUME_MOUNT_PATH: '/data/assets', ASSET_STORAGE_DIR: '/data/assets',
  NODE_ENV: 'production', SERVER_DEPLOYMENT_ENVIRONMENT: 'cloudPrivateAlpha', SERVER_RUNTIME_MODE: 'cloud',
  APP_PUBLIC_HTTP_URL: 'https://pilot.example.test', APP_PUBLIC_WS_URL: 'wss://pilot.example.test', ROOM_ALLOWED_ORIGINS: 'https://pilot.example.test',
  PRIVATE_ALPHA_AUTH_ENABLED: 'true', PRIVATE_ALPHA_SESSION_SECRET: randomBytes(32).toString('hex'),
  PRIVATE_ALPHA_INVITE_CODE: randomBytes(32).toString('hex'), POSTGRES_USER_DEV_API_ENABLED: 'false', PORT: '8080',
});
function docker(args, allowedFailure = false) {
  const result = spawnSync('docker', args, { env, encoding: 'utf8', timeout: 120000, windowsHide: true });
  if (!allowedFailure && result.status !== 0) {
    const safeError = (result.stderr || '').replaceAll(env.POSTGRES_PASSWORD, '[redacted]').replaceAll(env.PRIVATE_ALPHA_SESSION_SECRET, '[redacted]').replaceAll(env.PRIVATE_ALPHA_INVITE_CODE, '[redacted]');
    throw new Error(`Docker verification command failed: ${args[0]}: ${safeError.slice(0, 1500)}`);
  }
  return result.stdout?.trim() || '';
}
const appEnv = Object.keys(env).filter(k => /^(DATABASE_|RAILWAY_|ASSET_|APP_PUBLIC_|ROOM_ALLOWED_|PRIVATE_ALPHA_|POSTGRES_USER_DEV_|SERVER_|NODE_ENV$|PORT$)/.test(k)).flatMap(k => ['--env', k]);
const passed = [];
try {
  docker(['network', 'create', network]);
  docker(['volume', 'create', volume]);
  docker(['run', '-d', '--name', databaseName, '--network', network, '--network-alias', 'postgres.railway.internal', '--env', 'POSTGRES_PASSWORD', '--env', 'POSTGRES_DB', '--env', 'POSTGRES_USER', 'postgres:16-alpine']);
  let ready = false;
  for (let i = 0; i < 40; i++) {
    const status = docker(['exec', databaseName, 'pg_isready', '-U', 'pilot_check', '-d', 'pilot_check'], true);
    if (status.includes('accepting connections')) { ready = true; break; }
    await delay(500);
  }
  assert.ok(ready, 'Disposable database did not start.');
  const migration = docker(['run', '--rm', '--network', network, ...appEnv, image, 'node', 'deploy/railway-predeploy.mjs']);
  assert.ok(!migration.includes(env.POSTGRES_PASSWORD));
  passed.push('fresh isolated PostgreSQL migration command succeeds without volume');
  docker(['run', '--rm', '--network', network, ...appEnv, image, 'node', 'deploy/railway-predeploy.mjs']);
  passed.push('existing migrations can be run again');
  docker(['run', '-d', '--name', appName, '--network', network, '-p', '127.0.0.1::8080', '--mount', `type=volume,source=${volume},target=/data/assets`, ...appEnv, image]);
  const binding = docker(['port', appName, '8080/tcp']);
  const base = `http://${binding}`;
  ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/health`)).status === 200) { ready = true; break; } } catch { /* startup */ }
    await delay(500);
  }
  assert.ok(ready, 'Container did not reach ready state.');
  passed.push('cloud container binds assigned port and reaches DB/schema readiness');
  const html = await (await fetch(base)).text();
  assert.ok(html.includes('pilot.example.test'));
  assert.ok(!html.includes(env.PRIVATE_ALPHA_SESSION_SECRET) && !html.includes(env.POSTGRES_PASSWORD));
  passed.push('production frontend served without rehearsal secrets');
  assert.equal((await fetch(`${base}/api/auth/private-alpha/login`, { method: 'POST', headers: { Origin: 'https://evil.example.test' } })).status, 403);
  passed.push('real cloud entry rejects foreign browser origin');
  const filesystem = docker(['exec', appName, 'node', '-e', "const fs=require('fs'); const blocked=['.env','.git','docs','tests','src','.pilot-private','server']; if(blocked.some(p=>fs.existsSync('/app/'+p))) process.exit(1); console.log(fs.readdirSync('/app/dist-server/server/db/migrations').filter(p=>p.endsWith('.sql')).length);"]);
  assert.equal(filesystem, '12');
  passed.push('image contains 12 SQL migrations and excludes local secrets/source/evidence');
  const uid = docker(['exec', appName, 'node', '-e', "const fs=require('fs'); console.log(fs.readFileSync('/proc/1/status','utf8').split(String.fromCharCode(10)).find(s=>s.startsWith('Uid:')))"]);
  assert.match(uid, /1000\s+1000/);
  passed.push('application drops root privileges before serving');
  console.log(JSON.stringify({ passed: passed.length, cases: passed, hosted: false, database: 'isolated local PostgreSQL 16 container; not the normal local database' }, null, 2));
} finally {
  // Only uniquely named disposable resources created by this script are removed.
  docker(['rm', '-f', appName, databaseName], true);
  docker(['volume', 'rm', volume], true);
  docker(['network', 'rm', network], true);
}
