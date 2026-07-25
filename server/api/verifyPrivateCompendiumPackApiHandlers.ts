/** Private compendium pack API handler verifier. No Postgres connection is required. */

import { runPrivateCompendiumPackApiHandlersSmoke } from './privateCompendiumPackApiHandlersSmoke.js';

const strict = process.argv.includes('--strict');
const result = await runPrivateCompendiumPackApiHandlersSmoke();
console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  strict,
  ...result,
  notes: [
    'Pure fake-repository smoke — no Postgres, HTTP server, or frontend authoring UI.',
    'The HTTP routes reuse these handlers and the shared safe response envelope.',
    'Use --strict to exit nonzero unless every case passes.',
  ],
}, null, 2));
if (strict && result.failed > 0) process.exitCode = 1;
