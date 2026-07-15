import { closePostgresPool } from './postgresClient.js';
import { runPostgresPlatformFoundationRepositoryRollbackWriteSmoke } from './postgresPlatformFoundationRepositoryWriteSmoke.js';

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const result = await runPostgresPlatformFoundationRepositoryRollbackWriteSmoke();
  const report = {
    checkedAt: new Date().toISOString(),
    strict,
    ...result,
    notes: [
      'This script runs a ROLLBACK-ONLY write smoke and commits nothing.',
      'It creates deterministic fixture user/campaign/actor/world rows and exercises representative records across the remaining DB families.',
      'It does not create tables, run migrations, enforce permissions, call AI, or print the connection string.',
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
