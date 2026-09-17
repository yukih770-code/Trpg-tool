import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { isAllowedPilotDatabaseTransport } from '../../server/config/pilotDatabaseTransport.js';

const privateEnv = { DATABASE_SSL_MODE: 'disable', DATABASE_NETWORK: 'railway-private', RAILWAY_PROJECT_ID: 'fixture-project', RAILWAY_ENVIRONMENT_ID: 'fixture-env' };
const cases = [
  ['private network with explicit operator opt-in', 'postgres.railway.internal', privateEnv, true],
  ['public DB cannot disable TLS', 'db.example.test', privateEnv, false],
  ['suffix spoof cannot disable TLS', 'postgres.railway.internal.example.test', privateEnv, false],
  ['private name without Railway context cannot disable TLS', 'postgres.railway.internal', { ...privateEnv, RAILWAY_PROJECT_ID: '' }, false],
  ['private name without explicit opt-in cannot disable TLS', 'postgres.railway.internal', { ...privateEnv, DATABASE_NETWORK: '' }, false],
  ['unverified TLS remains disallowed', 'postgres.railway.internal', { ...privateEnv, DATABASE_SSL_MODE: 'prefer' }, false],
  ['verified public TLS remains supported', 'db.example.test', { DATABASE_SSL_MODE: 'require' }, true],
  ['loopback local rehearsal remains supported', '127.0.0.1', { DATABASE_SSL_MODE: 'disable' }, true],
] as const;
for (const [name, host, env, expected] of cases) assert.equal(isAllowedPilotDatabaseTransport(new URL(`postgres://fixture:fixture@${host}/fixture`), env), expected, name);

// These processes must fail before database access or backend listening.
const marker = 'fixture-private-value-must-not-appear';
const safe = { ...process.env, PRIVATE_ALPHA_SESSION_SECRET: marker, DATABASE_URL: '', RAILWAY_VOLUME_MOUNT_PATH: '', ASSET_STORAGE_DIR: '' };
for (const [script, override] of [
  ['deploy/railway-predeploy.mjs', {}],
  ['deploy/railway-start.mjs', {}],
  ['deploy/railway-start.mjs', { RAILWAY_VOLUME_MOUNT_PATH: tmpdir(), ASSET_STORAGE_DIR: process.cwd() }],
] as const) {
  const result = spawnSync(process.execPath, [script], { env: { ...safe, ...override }, encoding: 'utf8', timeout: 10000, windowsHide: true });
  assert.equal(result.status, 1);
  assert.ok(!`${result.stdout}${result.stderr}`.includes(marker));
}
console.log(JSON.stringify({ passed: cases.length + 3, scope: 'Railway private DB transport and fail-closed migration/volume startup; no hosted claim' }));
