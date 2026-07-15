/** P5.API-CORE handler verifier. No Postgres connection is required. */

import { runWorldServerApiHandlersSmoke } from './worldServerApiHandlersSmoke.js';

const strict = process.argv.includes('--strict');
const result = await runWorldServerApiHandlersSmoke();
const output = {
  checkedAt: new Date().toISOString(),
  strict,
  ...result,
  notes: [
    'Pure fake-repository smoke — no Postgres, no frontend, no auth provider, no WebSocket.',
    'The HTTP route module uses the same handlers and safe response envelope.',
    'Use --strict to exit nonzero unless all cases pass.',
  ],
};
console.log(JSON.stringify(output, null, 2));
if (strict && result.failed > 0) process.exitCode = 1;
