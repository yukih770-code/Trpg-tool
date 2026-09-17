import { accessSync, constants } from 'node:fs';
import { isAbsolute } from 'node:path';
import { readServerRuntimeConfigFromEnv, validateServerStartupConfig } from './serverRuntimeConfig.js';
import { isAllowedPilotDatabaseTransport } from './pilotDatabaseTransport.js';

const runtime = readServerRuntimeConfigFromEnv(process.env);
const errors = validateServerStartupConfig(runtime, Boolean(process.env.DATABASE_URL)).errors;
if (runtime.environment === 'localDev') errors.push('Pilot requires a cloud deployment environment.');
const secret = process.env.PRIVATE_ALPHA_SESSION_SECRET?.trim() ?? '';
const bootstrap = process.env.PRIVATE_ALPHA_INVITE_CODE?.trim();
if (secret.length < 32 || secret.startsWith('REPLACE_')) errors.push('Generate a strong backend session secret (at least 32 random bytes).');
if (bootstrap && (bootstrap.length < 32 || bootstrap.startsWith('REPLACE_'))) errors.push('Bootstrap code must be absent or independently generated with at least 32 random bytes.');
const assetDirectory = process.env.ASSET_STORAGE_DIR?.trim();
if (!assetDirectory || !isAbsolute(assetDirectory)) errors.push('ASSET_STORAGE_DIR must explicitly name an absolute persistent directory.');
else {
  try { accessSync(assetDirectory, constants.R_OK | constants.W_OK); }
  catch { errors.push('ASSET_STORAGE_DIR must exist and be readable/writable by the application identity.'); }
}
try {
  const database = new URL(process.env.DATABASE_URL ?? '');
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) errors.push('DATABASE_URL must use PostgreSQL.');
  if (['sslmode', 'sslcert', 'sslkey', 'sslrootcert'].some((key) => database.searchParams.has(key))) {
    errors.push('Remove SSL query overrides from DATABASE_URL; configure verified TLS through DATABASE_SSL_MODE=require.');
  }
  if (!isAllowedPilotDatabaseTransport(database, process.env)) {
    errors.push('Use verified database TLS, loopback PostgreSQL, or explicit Railway private-network transport.');
  }
} catch { errors.push('DATABASE_URL must be a valid server-only PostgreSQL URL.'); }
if (runtime.publicHttpUrl && runtime.publicWsUrl) {
  if (runtime.publicWsUrl !== runtime.publicHttpUrl.replace(/^https:/, 'wss:')
    || runtime.allowedOrigins.length !== 1 || runtime.allowedOrigins[0] !== runtime.publicHttpUrl) {
    errors.push('This pilot uses one matching HTTP/WSS/browser origin.');
  }
}
console.log(JSON.stringify({ status: errors.length ? 'blocked' : 'configuration_checked', errors,
  remaining: 'Verify actual HTTPS, database readiness, volume persistence, backup restore and hosted browser acceptance.' }, null, 2));
if (errors.length) process.exitCode = 1;
