import { runAiContextScopeGuardSmoke } from './aiContextScopeGuardSmoke.js';

/**
 * Verify runner for the AI Context Scope Guard smoke (P5.21). Pure — no DB, no model,
 * no network. Prints a JSON report; `--strict` exits nonzero if any case fails.
 */
function main(): void {
  const strict = process.argv.includes('--strict');
  const report = runAiContextScopeGuardSmoke();

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    ...report,
    notes: [
      'Pure deterministic AI-scope guard smoke — no DB, no API, no AI model.',
      'AI must not bypass visibility/rights; deny by default; denied bodies are redacted.',
      'This guard is a contract for a future AI Gateway preflight; it does not retrieve or call models.',
      'Use --strict to exit nonzero unless all cases pass.',
    ],
  }, null, 2));

  if (report.failed > 0) {
    // eslint-disable-next-line no-console
    console.error(`AI context scope guard smoke: ${report.failed} case(s) failed.`);
    if (strict) process.exitCode = 1;
  }
}

main();
