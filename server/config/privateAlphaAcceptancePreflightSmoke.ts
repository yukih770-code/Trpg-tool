import { evaluatePrivateAlphaAcceptancePreflight } from './privateAlphaAcceptancePreflight.js';

const ready = evaluatePrivateAlphaAcceptancePreflight({
  configuredUrl: 'https://alpha.example.test',
  frontendReachable: true,
  healthReachable: true,
  health: {
    ok: true,
    environment: 'cloudPrivateAlpha',
    runtimeMode: 'cloud',
    authMode: 'privateAlpha',
    devUserApiEnabled: false,
    publicWsUrl: 'wss://alpha.example.test',
    database: { status: 'ok', allSchemasReady: true, worldServerSchema: { status: 'ready' } },
  },
  authReachable: true,
  auth: { ok: true, statusCode: 200, value: { authenticated: false, authMode: 'unauthenticated' } },
});

if (ready.status !== 'ready' || ready.checks.some((check) => !check.passed)) {
  throw new Error('valid remote private alpha contract was rejected');
}

const partialSchema = evaluatePrivateAlphaAcceptancePreflight({
  configuredUrl: 'https://alpha.example.test',
  frontendReachable: true,
  healthReachable: true,
  health: {
    ok: true,
    environment: 'cloudPrivateAlpha',
    runtimeMode: 'cloud',
    authMode: 'privateAlpha',
    devUserApiEnabled: false,
    publicWsUrl: 'wss://alpha.example.test',
    database: { status: 'ok', allSchemasReady: false, worldServerSchema: { status: 'ready' } },
  },
  authReachable: true,
  auth: { ok: true, statusCode: 200, value: { authenticated: false, authMode: 'unauthenticated' } },
});
if (partialSchema.status !== 'blocked' || partialSchema.checks.find((check) => check.id === 'database_ready')?.passed !== false) {
  throw new Error('partial database schema unexpectedly passed the cloud acceptance gate');
}

const local = evaluatePrivateAlphaAcceptancePreflight({
  configuredUrl: 'http://localhost:8787',
  frontendReachable: true,
  healthReachable: true,
  health: {
    ok: true,
    environment: 'localDev',
    runtimeMode: 'local',
    authMode: 'localDev',
    devUserApiEnabled: true,
    publicWsUrl: 'ws://localhost:8787',
    database: { status: 'ok', allSchemasReady: true, worldServerSchema: { status: 'ready' } },
  },
  authReachable: true,
  auth: { authenticated: true, authMode: 'localDev' },
});

if (local.status !== 'blocked') throw new Error('local development runtime passed the cloud acceptance gate');
const rejectedIds = local.checks.filter((check) => !check.passed).map((check) => check.id);
for (const required of ['remote_https_url', 'cloud_runtime_mode', 'private_alpha_auth_mode', 'login_gate_reachable', 'secure_websocket_url']) {
  if (!rejectedIds.includes(required)) throw new Error(`local runtime did not fail ${required}`);
}

const missing = evaluatePrivateAlphaAcceptancePreflight({});
if (missing.status !== 'blocked' || missing.checks.some((check) => check.passed)) {
  throw new Error('missing deployment unexpectedly passed a preflight check');
}

console.log(JSON.stringify({
  total: 4,
  passed: 4,
  failed: 0,
  cases: ['ready remote contract passes', 'partial database schema is blocked', 'local runtime is rejected', 'missing deployment is blocked'],
}, null, 2));
