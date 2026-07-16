import { closePostgresPool } from './postgresClient.js';
import { runPostgresSceneStateRepositoryRollbackWriteSmoke } from './postgresSceneStateRepositoryWriteSmoke.js';

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const result = await runPostgresSceneStateRepositoryRollbackWriteSmoke();
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), strict, ...result, notes: ['Rollback-only scene state write smoke. It creates no permanent data and does not print the database connection string.'] }, null, 2));
  if (strict && result.status !== 'rolled_back') process.exitCode = 1;
}

try { await main(); } finally { await closePostgresPool(); }
