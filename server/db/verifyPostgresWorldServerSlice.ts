import { checkPostgresHealth, closePostgresPool } from './postgresClient.js';
import { checkPostgresWorldServerSchemaReadiness } from './postgresWorldServerSchemaReadiness.js';
import { runPostgresWorldServerRepositoryReadOnlySmoke } from './postgresWorldServerRepositorySmoke.js';

interface VerificationReport {
  checkedAt: string;
  strict: boolean;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: Awaited<ReturnType<typeof checkPostgresWorldServerSchemaReadiness>>;
  smoke: Awaited<ReturnType<typeof runPostgresWorldServerRepositoryReadOnlySmoke>>;
  notes: string[];
}

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const database = await checkPostgresHealth();
  const schema = await checkPostgresWorldServerSchemaReadiness();
  const smoke = await runPostgresWorldServerRepositoryReadOnlySmoke();
  const report: VerificationReport = {
    checkedAt: new Date().toISOString(),
    strict,
    database,
    schema,
    smoke,
    notes: [
      'This script is read-only.',
      'It does not print the database connection string.',
      'It does not create tables, run migrations, or write smoke rows.',
      'World server schema depends on the User and Campaign schemas.',
      'The Global Public Surface is NOT a server row; roles/memberships/invites are metadata, not enforcement.',
      'Use --strict to exit nonzero unless the read-only smoke status is ready.',
    ],
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));

  if (strict && smoke.status !== 'ready') {
    process.exitCode = 1;
  }
}

try {
  await main();
} finally {
  await closePostgresPool();
}
