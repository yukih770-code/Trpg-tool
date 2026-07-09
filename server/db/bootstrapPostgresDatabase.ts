import { closePostgresPool } from './postgresClient.js';
import { applyPendingPostgresMigrations } from './postgresMigrationRunner.js';
import { checkAllPostgresSchemaReadiness } from './postgresAllSchemaReadiness.js';

/**
 * DB bootstrap CLI (P5.27). Safe convenience: dry-run by default; applies pending
 * migrations only with `--apply`, then runs all read-only schema readiness checks.
 * Runs NO write smokes (they remain manual). Prints no SQL or connection string.
 * Flags: --apply, --dry-run, --strict.
 */
async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const apply = process.argv.includes('--apply');
  const dryRun = !apply || process.argv.includes('--dry-run');

  const migration = await applyPendingPostgresMigrations({ dryRun });
  const readiness = await checkAllPostgresSchemaReadiness();

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    apply,
    dryRun,
    migration: {
      status: migration.status,
      plannedMigrations: migration.plannedMigrations,
      appliedMigrations: migration.appliedMigrations,
      blockingIssues: migration.blockingIssues,
      notes: migration.notes,
    },
    readiness,
    notes: [
      'Bootstrap is dry-run by default; pass --apply to run pending migrations.',
      'No write smokes are run by bootstrap; run db:verify:*:write manually when desired.',
      'No SQL or connection string is printed.',
    ],
  }, null, 2));

  const migrationFailed = migration.status === 'blocked' || migration.status === 'error';
  const readinessFailed = readiness.status === 'error' || readiness.status === 'unreachable' || (apply && readiness.status !== 'ready' && readiness.status !== 'not_configured');
  if (strict && (migrationFailed || readinessFailed)) process.exitCode = 1;
}

try {
  await main();
} finally {
  await closePostgresPool();
}
