import { runAiContextRetrievalPipelineSmoke } from './aiContextRetrievalPipelineSmoke.js';

/**
 * Verify runner for the AI Context Retrieval Safety Pipeline smoke (P5.22-P5.24). Pure —
 * no DB, no model, no network. Prints a JSON report; `--strict` exits nonzero on failure.
 */
function main(): void {
  const strict = process.argv.includes('--strict');
  const report = runAiContextRetrievalPipelineSmoke();

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    ...report,
    notes: [
      'Pure deterministic retrieval-safety pipeline smoke — no DB, no API, no AI model.',
      'registry -> preflight -> normalization -> P5.21 guard -> context pack -> manifest -> audit.',
      'Deny source by default; unknown source denied; denied plans/items/audit carry no body/summary.',
      'Preflight is never sufficient alone; candidates still pass the P5.21 guard after fetch.',
      'Use --strict to exit nonzero unless all cases pass.',
    ],
  }, null, 2));

  if (report.failed > 0) {
    // eslint-disable-next-line no-console
    console.error(`AI context retrieval pipeline smoke: ${report.failed} case(s) failed.`);
    if (strict) process.exitCode = 1;
  }
}

main();
