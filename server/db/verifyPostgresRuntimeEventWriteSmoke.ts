import { closePostgresPool } from './postgresClient.js';
import { runPostgresRuntimeEventRepositoryRollbackWriteSmoke } from './postgresRuntimeEventRepositoryWriteSmoke.js';

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const result = await runPostgresRuntimeEventRepositoryRollbackWriteSmoke();
  const report = {
    checkedAt: new Date().toISOString(),
    strict,
    ...result,
    notes: [
      'This script runs a ROLLBACK-ONLY append smoke — it commits nothing.',
      'It creates a deterministic smoke owner user + campaign + actor + runtime session inside one transaction, appends events, then rolls back.',
      'It verifies per-session seq increments (1 -> 2 -> 3) and safe idempotency-key de-duplication.',
      'It does not print the database connection string or raw driver errors.',
      'It does not write live runtime events, touch the WebSocket protocol, or run migrations.',
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
