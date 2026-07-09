import { closePostgresPool } from './postgresClient.js';
import { getPostgresMigrationStatus } from './postgresMigrationRunner.js';

/**
 * Migration status CLI (P5.26). Read-only. Prints a safe summary (no SQL, no
 * connection string). `--strict` exits nonzero only on a true error/mismatch (blocked
 * or error); `not_configured` is not an error.
 */
async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const result = await getPostgresMigrationStatus();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    ...result,
    notes: [...result.notes, 'Read-only: this command applies nothing and prints no SQL or connection string.'],
  }, null, 2));
  if (strict && (result.status === 'blocked' || result.status === 'error')) process.exitCode = 1;
}

try {
  await main();
} finally {
  await closePostgresPool();
}
