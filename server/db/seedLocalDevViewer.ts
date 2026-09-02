import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { closePostgresPool } from './postgresClient.js';
import {
  LOCAL_DEV_VIEWER_ENV_KEY,
  readLocalDevViewerUserId,
  seedLocalDevViewer,
} from './localDevViewerSeed.js';

/**
 * Local dev viewer fixture CLI (`npm run db:seed:dev-viewer`).
 *
 * Idempotent: creates the configured `VITE_DEV_VIEWER_USER_ID` user only when it
 * is absent, and never rewrites an existing one. Runs after migrations and
 * schema readiness, before the local runtime is considered usable.
 *
 * Flags:
 *   `--strict`      non-zero exit unless the viewer exists afterwards.
 *   `--check-only`  report presence without ever writing (read-only probe).
 * Prints a JSON report only — no SQL, no connection string, no stack trace.
 */
async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const checkOnly = process.argv.includes('--check-only');
  const userId = readLocalDevViewerUserId(process.env);
  const repository = createPostgresUserRepository();
  const result = await seedLocalDevViewer(
    checkOnly
      // A read-only probe still answers "does the viewer exist?", but a create
      // can never happen: the write port refuses instead of inserting.
      ? {
          getUserById: repository.getUserById,
          createUserWithIdentity: async () => ({
            ok: false as const,
            error: { kind: 'not_found' as const, message: 'Read-only check; no user was created.' },
          }),
        }
      : repository,
    userId,
  );
  const ready = result.decision === 'seeded' || result.decision === 'alreadyPresent';

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    checkOnly,
    ready,
    ...result,
    notes: [
      ...result.notes,
      ...(checkOnly ? ['Read-only check: no user was created.'] : []),
      'Re-running is harmless: an existing local dev viewer is read and left untouched.',
      'This report prints no SQL, connection string, credential or stack trace.',
      ...(result.decision === 'missingConfiguration'
        ? [`Set ${LOCAL_DEV_VIEWER_ENV_KEY} in .env before starting the local runtime.`]
        : []),
    ],
  }, null, 2));

  if (strict && !ready) process.exitCode = 1;
}

try {
  await main();
} finally {
  await closePostgresPool();
}
