import { runApiGuardFoundationSmoke } from './apiGuardFoundationSmoke.js';

/**
 * Verify runner for the Auth Session / API Guard foundation smoke (P5.28-P5.31). Pure —
 * no DB, no server start, no model. Prints a JSON report; `--strict` exits nonzero on
 * failure.
 */
function main(): void {
  const strict = process.argv.includes('--strict');
  const report = runApiGuardFoundationSmoke();

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    ...report,
    notes: [
      'Pure deterministic auth/API-guard smoke — no DB, no route enforcement, no auth provider.',
      'Frontend login state is not security; dev auth is dev-only; the guard fails closed.',
      'Public error messages are generic; internal reasons are for logs only.',
      'Use --strict to exit nonzero unless all cases pass.',
    ],
  }, null, 2));

  if (report.failed > 0) {
    // eslint-disable-next-line no-console
    console.error(`API guard foundation smoke: ${report.failed} case(s) failed.`);
    if (strict) process.exitCode = 1;
  }
}

main();
