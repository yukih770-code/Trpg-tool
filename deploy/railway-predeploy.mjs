import { spawnSync } from 'node:child_process';
import { readServerRuntimeConfigFromEnv, validateServerStartupConfig } from '../dist-server/server/config/serverRuntimeConfig.js';
import { isAllowedPilotDatabaseTransport } from '../dist-server/server/config/pilotDatabaseTransport.js';
import { loadPostgresMigrationDefinitions } from '../dist-server/server/db/postgresMigrationRegistry.js';

// Runs in Railway's pre-deploy container: DB network exists, asset volume does not.
try {
  const runtime = readServerRuntimeConfigFromEnv(process.env);
  if (runtime.environment === 'localDev' || validateServerStartupConfig(runtime, Boolean(process.env.DATABASE_URL)).errors.length) throw new Error();
  const database = new URL(process.env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || !isAllowedPilotDatabaseTransport(database, process.env)) throw new Error();
  if (['sslmode', 'sslcert', 'sslkey', 'sslrootcert'].some(key => database.searchParams.has(key))) throw new Error();
  if (!loadPostgresMigrationDefinitions().length) throw new Error();
} catch {
  console.error('Railway migration preflight rejected configuration or missing packaged migrations; no credential values are logged.');
  process.exit(1);
}
for (const args of [
  ['dist-server/server/db/applyPostgresMigrations.js', '--apply', '--strict'],
  ['dist-server/server/db/verifyPostgresMigrationStatus.js', '--strict'],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
