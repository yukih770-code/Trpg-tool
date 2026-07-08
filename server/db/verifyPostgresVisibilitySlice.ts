import { checkPostgresHealth, closePostgresPool } from './postgresClient.js';
import { checkPostgresVisibilitySchemaReadiness } from './postgresVisibilitySchemaReadiness.js';
import { runPostgresVisibilityRepositoryReadOnlySmoke } from './postgresVisibilityRepositorySmoke.js';

interface VerificationReport {
  checkedAt: string;
  strict: boolean;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: Awaited<ReturnType<typeof checkPostgresVisibilitySchemaReadiness>>;
  smoke: Awaited<ReturnType<typeof runPostgresVisibilityRepositoryReadOnlySmoke>>;
  notes: string[];
}

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const database = await checkPostgresHealth();
  const schema = await checkPostgresVisibilitySchemaReadiness();
  const smoke = await runPostgresVisibilityRepositoryReadOnlySmoke();
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
      'Visibility schema depends on the User, Campaign, and World Server schemas.',
      'Stores scope/rights/review METADATA only — no permission/publish/AI enforcement. Public entry != public data.',
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
