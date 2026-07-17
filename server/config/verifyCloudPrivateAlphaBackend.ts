import { readPrivateAlphaAuthConfigFromEnv, isPrivateAlphaAuthConfigured } from '../auth/privateAlphaAuth.js';
import { readDatabaseRuntimeConfigFromEnv } from './databaseRuntimeConfig.js';
import { readServerRuntimeConfigFromEnv, validateServerStartupConfig } from './serverRuntimeConfig.js';

const runtime = readServerRuntimeConfigFromEnv(process.env);
const database = readDatabaseRuntimeConfigFromEnv(process.env);
const privateAlpha = readPrivateAlphaAuthConfigFromEnv(process.env, runtime.environment);
const validation = validateServerStartupConfig(runtime, database.configured);
const expectedCloudMode = runtime.environment === 'cloudPrivateAlpha' && runtime.runtimeMode === 'cloud';
const passed = expectedCloudMode && validation.errors.length === 0 && isPrivateAlphaAuthConfigured(privateAlpha);

console.log(JSON.stringify({
  status: passed ? 'ready' : 'blocked',
  environment: runtime.environment,
  runtimeMode: runtime.runtimeMode,
  databaseConfigured: database.configured,
  explicitOriginsConfigured: runtime.allowedOrigins.length > 0 && !runtime.allowedOrigins.includes('*'),
  publicHttpConfigured: Boolean(runtime.publicHttpUrl),
  publicWsConfigured: Boolean(runtime.publicWsUrl),
  privateAlphaConfigured: isPrivateAlphaAuthConfigured(privateAlpha),
  devUserApiEnabled: runtime.devUserApiEnabled === true,
  errors: validation.errors,
  warnings: validation.warnings,
}, null, 2));

if (!passed) process.exitCode = 1;
