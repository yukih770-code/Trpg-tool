import { closePostgresPool, checkPostgresHealth } from './postgresClient.js';
import { checkPostgresSceneStateSchemaReadiness } from './postgresSceneStateSchemaReadiness.js';
import { runPostgresSceneStateRepositoryReadOnlySmoke } from './postgresSceneStateRepositorySmoke.js';

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const database = await checkPostgresHealth();
  const schema = await checkPostgresSceneStateSchemaReadiness();
  const smoke = await runPostgresSceneStateRepositoryReadOnlySmoke();
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), strict, database, schema, smoke, notes: ['Read-only scene state repository check. It creates no rows and does not print the database connection string.'] }, null, 2));
  if (strict && smoke.status !== 'ready') process.exitCode = 1;
}

try { await main(); } finally { await closePostgresPool(); }
