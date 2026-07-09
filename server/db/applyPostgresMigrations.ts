import { closePostgresPool } from './postgresClient.js';
import { applyPendingPostgresMigrations } from './postgresMigrationRunner.js';

/**
 * Migration apply CLI (P5.26). DRY-RUN BY DEFAULT — writes only with `--apply`.
 * Flags: --apply, --dry-run, --target=NNNN, --max=N, --strict. No SQL / connection
 * string output; no write smokes; applies pending migrations in order only.
 */
function flagValue(prefix: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const apply = process.argv.includes('--apply');
  const dryRun = !apply || process.argv.includes('--dry-run');
  const targetMigrationId = flagValue('--target=');
  const maxRaw = flagValue('--max=');
  const maxMigrations = maxRaw !== undefined && /^\d+$/.test(maxRaw) ? Number(maxRaw) : undefined;

  const result = await applyPendingPostgresMigrations({ dryRun, targetMigrationId, maxMigrations });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    ...result,
    notes: [...result.notes, 'Dry-run is the default; pass --apply to execute. No SQL or connection string is printed.'],
  }, null, 2));

  if (strict && (result.status === 'blocked' || result.status === 'error')) process.exitCode = 1;
}

try {
  await main();
} finally {
  await closePostgresPool();
}
