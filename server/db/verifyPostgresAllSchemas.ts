import { closePostgresPool } from './postgresClient.js';
import { checkAllPostgresSchemaReadiness } from './postgresAllSchemaReadiness.js';
import { getPostgresMigrationStatus } from './postgresMigrationRunner.js';

/**
 * All-schema verify CLI (P5.27). Read-only aggregate of every schema readiness helper
 * (user/campaign/actor/asset/runtime/generated/world/visibility) plus migration status.
 * Runs NO write smokes and prints no SQL or connection string. `--strict` exits nonzero
 * unless the aggregate status is `ready`; `not_configured` is not a strict failure.
 */
async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const readiness = await checkAllPostgresSchemaReadiness();
  const migrations = await getPostgresMigrationStatus();

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    status: readiness.status,
    readiness,
    migrations: {
      status: migrations.status,
      appliedCount: migrations.appliedCount,
      pendingCount: migrations.pendingCount,
      blockingIssues: migrations.blockingIssues,
    },
    notes: ['Read-only aggregate; no write smokes; no SQL or connection string printed.'],
  }, null, 2));

  const failed = readiness.status === 'error'
    || readiness.status === 'unreachable'
    || (strict && readiness.status !== 'ready' && readiness.status !== 'not_configured')
    || (strict && (migrations.status === 'blocked' || migrations.status === 'error'));
  if (strict && failed) process.exitCode = 1;
}

try {
  await main();
} finally {
  await closePostgresPool();
}
