import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { isPrivateAlphaAuthConfigured, readPrivateAlphaAuthConfigFromEnv } from '../auth/privateAlphaAuth.js';
import { readServerRuntimeConfigFromEnv, validateServerStartupConfig, type ServerRuntimeEnv } from './serverRuntimeConfig.js';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function cloudEnv(overrides: ServerRuntimeEnv = {}): ServerRuntimeEnv {
  return {
    SERVER_DEPLOYMENT_ENVIRONMENT: 'cloudPrivateAlpha',
    SERVER_RUNTIME_MODE: 'cloud',
    DATABASE_URL: 'postgres://user:password@db.example.test:5432/trpg',
    APP_PUBLIC_HTTP_URL: 'https://api.example.test',
    APP_PUBLIC_WS_URL: 'wss://api.example.test',
    ROOM_ALLOWED_ORIGINS: 'https://app.example.test',
    POSTGRES_USER_DEV_API_ENABLED: 'false',
    PRIVATE_ALPHA_AUTH_ENABLED: 'true',
    PRIVATE_ALPHA_INVITE_CODE: 'test-access-code',
    PRIVATE_ALPHA_SESSION_SECRET: 'test-session-secret',
    PRIVATE_ALPHA_SESSION_MAX_AGE_DAYS: '30',
    ...overrides,
  };
}

async function run(): Promise<SmokeCase[]> {
  const cases: SmokeCase[] = [];
  const check = (name: string, verify: () => void | Promise<void>) => async () => {
    try {
      await verify();
      cases.push({ name, passed: true });
    } catch (error) {
      cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) });
    }
  };

  await check('private_alpha_config_is_ready_for_30_day_session', () => {
    const env = cloudEnv();
    const config = readPrivateAlphaAuthConfigFromEnv(env, 'cloudPrivateAlpha');
    assert(isPrivateAlphaAuthConfigured(config), 'private alpha auth configuration was not recognized');
    assert(config.sessionMaxAgeSeconds === 30 * 24 * 60 * 60, 'session duration is not 30 days');
  })();

  await check('cloud_runtime_accepts_private_alpha_contract', () => {
    const config = readServerRuntimeConfigFromEnv(cloudEnv());
    assert(validateServerStartupConfig(config, true).errors.length === 0, 'cloud runtime contract was rejected');
  })();

  await check('frontend_example_has_no_backend_secrets', async () => {
    const content = await readFile(resolve(process.cwd(), '.env.cloud.frontend.example'), 'utf8');
    assert(!content.includes('DATABASE_URL'), 'frontend example references a database variable');
    assert(!content.includes('PRIVATE_ALPHA_INVITE_CODE'), 'frontend example references the invite code');
    assert(!content.includes('PRIVATE_ALPHA_SESSION_SECRET'), 'frontend example references the session secret');
  })();

  await check('unsafe_local_dev_header_mode_is_rejected_in_cloud', () => {
    const config = readServerRuntimeConfigFromEnv(cloudEnv({ POSTGRES_USER_DEV_API_ENABLED: 'true' }));
    assert(validateServerStartupConfig(config, true).errors.some((error) => error.includes('DEV_API')), 'cloud runtime accepted local dev headers');
  })();

  return cases;
}

void run().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
