import { runRuntimeEventPersistenceBridgeSmoke } from './runtimeEventPersistenceBridgeSmoke.js';

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const smoke = await runRuntimeEventPersistenceBridgeSmoke();
  const report = {
    checkedAt: new Date().toISOString(),
    strict,
    smoke,
    notes: [
      'This verification uses a fake repository and does not contact Postgres.',
      'The bridge is not wired to the live Room Server/WebSocket authority.',
      'The repository port exposes append-only persistence only.',
    ],
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
  if (strict && smoke.status !== 'passed') process.exitCode = 1;
}

await main();

