import { closePostgresPool } from './postgresClient.js';
import { runPostgresAssetRepositoryRollbackWriteSmoke } from './postgresAssetRepositoryWriteSmoke.js';

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const result = await runPostgresAssetRepositoryRollbackWriteSmoke();
  const report = {
    checkedAt: new Date().toISOString(),
    strict,
    ...result,
    notes: [
      'This script runs a ROLLBACK-ONLY write smoke — it commits nothing.',
      'It creates a deterministic smoke owner user + campaign + storage ref + asset inside one transaction, then rolls back.',
      'It does not print the database connection string or raw driver errors.',
      'It does not upload files or call any object storage provider.',
      'It does not create tables or run migrations.',
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
