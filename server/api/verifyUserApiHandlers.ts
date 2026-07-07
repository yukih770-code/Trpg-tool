/**
 * User API handler smoke runner (P5.10F) — `npm run api:verify:user`.
 *
 * Runs the fake-repository handler contract smoke and prints a compact, safe
 * JSON report. Requires NO DATABASE_URL and never connects to a real database
 * (the smoke injects a fake repository). Exits nonzero if any case fails.
 */

import { runUserApiHandlersSmoke } from './userApiHandlersSmoke.js';

const report = await runUserApiHandlersSmoke();

// eslint-disable-next-line no-console
console.log(
  JSON.stringify(
    {
      ...report,
      notes: [
        'Handler contract smoke — uses a fake repository, not a real database.',
        'Does not read DATABASE_URL and opens no database connection.',
        'Exits nonzero when any handler case fails.',
      ],
    },
    null,
    2,
  ),
);

if (report.failed > 0) {
  process.exitCode = 1;
}
