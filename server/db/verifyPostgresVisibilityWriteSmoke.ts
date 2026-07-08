import { closePostgresPool } from './postgresClient.js';
import { runPostgresVisibilityRepositoryRollbackWriteSmoke } from './postgresVisibilityRepositoryWriteSmoke.js';

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const result = await runPostgresVisibilityRepositoryRollbackWriteSmoke();
  const report = {
    checkedAt: new Date().toISOString(),
    strict,
    ...result,
    notes: [
      'This script runs a ROLLBACK-ONLY write smoke — it commits nothing.',
      'It creates deterministic smoke users + campaign + world server + rights policy + private/server/campaign/global-public visibility records + publication review inside one transaction, then rolls back.',
      'Public flags stay false except on the explicit global-public projection; nothing is enforced.',
      'It does not print the connection string or raw driver errors, and does not create tables or run migrations.',
      'Use --strict to exit nonzero unless the status is rolled_back.',
    ],
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));

  if (strict && result.status !== 'rolled_back') {
    process.exitCode = 1;
  }
}

try {
  await main();
} finally {
  await closePostgresPool();
}
