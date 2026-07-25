import { runPersonalCompendiumPackApiHandlersSmoke } from './personalCompendiumPackApiHandlersSmoke.js';

const strict = process.argv.includes('--strict');
const result = await runPersonalCompendiumPackApiHandlersSmoke();
console.log(JSON.stringify({
  checkedAt: new Date().toISOString(), strict, ...result,
  notes: [
    'Pure fake-repository smoke — no Postgres, HTTP server, or frontend authoring UI.',
    'Personal packs remain owner-scoped and receive no World Server binding.',
    'Use --strict to exit nonzero unless every case passes.',
  ],
}, null, 2));
if (strict && result.failed > 0) process.exitCode = 1;
