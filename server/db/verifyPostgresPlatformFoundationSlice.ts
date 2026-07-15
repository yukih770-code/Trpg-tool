import { checkPostgresHealth, closePostgresPool } from './postgresClient.js';
import { checkPostgresPlatformFoundationSchemaReadiness } from './postgresPlatformFoundationSchemaReadiness.js';
import { runPostgresPlatformFoundationRepositoryReadOnlySmoke } from './postgresPlatformFoundationRepositorySmoke.js';

interface VerificationReport {
  checkedAt: string;
  strict: boolean;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: Awaited<ReturnType<typeof checkPostgresPlatformFoundationSchemaReadiness>>;
  smoke: Awaited<ReturnType<typeof runPostgresPlatformFoundationRepositoryReadOnlySmoke>>;
  notes: string[];
}

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const database = await checkPostgresHealth();
  const schema = await checkPostgresPlatformFoundationSchemaReadiness();
  const smoke = await runPostgresPlatformFoundationRepositoryReadOnlySmoke();
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
      'It verifies the remaining platform DB foundation added by migration 0009.',
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
