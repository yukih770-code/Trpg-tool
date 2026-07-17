import {
  readServerRuntimeConfigFromEnv,
  validateServerStartupConfig,
  type ServerRuntimeEnv,
} from './serverRuntimeConfig.js';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function cloudEnv(overrides: ServerRuntimeEnv = {}): ServerRuntimeEnv {
  return {
    SERVER_DEPLOYMENT_ENVIRONMENT: 'cloudPrivateAlpha',
    SERVER_RUNTIME_MODE: 'cloud',
    APP_PUBLIC_HTTP_URL: 'https://api.example.test',
    APP_PUBLIC_WS_URL: 'wss://api.example.test',
    ROOM_ALLOWED_ORIGINS: 'https://app.example.test',
    POSTGRES_USER_DEV_API_ENABLED: 'false',
    PRIVATE_ALPHA_AUTH_ENABLED: 'true',
    PRIVATE_ALPHA_INVITE_CODE: 'test-access-code',
    PRIVATE_ALPHA_SESSION_SECRET: 'test-session-secret',
    ...overrides,
  };
}

async function run(): Promise<SmokeCase[]> {
  const cases: SmokeCase[] = [];
  const check = (name: string, verify: () => void) => {
    try { verify(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  };

  check('local_dev_keeps_local_defaults', () => {
    const config = readServerRuntimeConfigFromEnv({ POSTGRES_USER_DEV_API_ENABLED: 'true' });
    const result = validateServerStartupConfig(config, false);
    assert(config.environment === 'localDev' && config.devUserApiEnabled === true && result.errors.length === 0, 'localDev behavior changed');
  });
  check('cloud_private_alpha_accepts_safe_config', () => {
    const result = validateServerStartupConfig(readServerRuntimeConfigFromEnv(cloudEnv()), true);
    assert(result.errors.length === 0, 'safe cloud config was rejected');
  });
  check('cloud_private_alpha_rejects_missing_database', () => {
    const result = validateServerStartupConfig(readServerRuntimeConfigFromEnv(cloudEnv()), false);
    assert(result.errors.some((error) => error.includes('DATABASE_URL')), 'missing database was accepted');
  });
  check('cloud_private_alpha_rejects_wildcard_and_dev_auth', () => {
    const result = validateServerStartupConfig(readServerRuntimeConfigFromEnv(cloudEnv({ ROOM_ALLOWED_ORIGINS: '*', POSTGRES_USER_DEV_API_ENABLED: 'true' })), true);
    assert(result.errors.some((error) => error.includes('wildcard')) && result.errors.some((error) => error.includes('DEV_API')), 'unsafe CORS or dev auth was accepted');
  });
  check('cloud_private_alpha_rejects_missing_private_auth', () => {
    const result = validateServerStartupConfig(readServerRuntimeConfigFromEnv(cloudEnv({ PRIVATE_ALPHA_SESSION_SECRET: '' })), true);
    assert(result.errors.some((error) => error.includes('private alpha invite')), 'missing private alpha auth was accepted');
  });
  check('production_rejects_local_public_urls', () => {
    const config = readServerRuntimeConfigFromEnv(cloudEnv({ SERVER_DEPLOYMENT_ENVIRONMENT: 'production', APP_PUBLIC_HTTP_URL: 'http://localhost:8787', APP_PUBLIC_WS_URL: 'ws://localhost:8787' }));
    const result = validateServerStartupConfig(config, true);
    assert(config.devUserApiEnabled === false && result.errors.filter((error) => error.includes('APP_PUBLIC')).length === 2, 'production local URLs were accepted');
  });
  return cases;
}

run().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
