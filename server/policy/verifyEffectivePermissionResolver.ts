import { runEffectivePermissionResolverSmoke } from './effectivePermissionResolverSmoke.js';

/**
 * Verify runner for the Effective Permission Resolver smoke (P5.20). Pure — no DB,
 * no network. Prints a JSON report; `--strict` exits nonzero if any case fails.
 */
function main(): void {
  const strict = process.argv.includes('--strict');
  const report = runEffectivePermissionResolverSmoke();

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    ...report,
    notes: [
      'Pure deterministic policy smoke — no DB, no API, no AI.',
      'Deny by default; private by default; AI disabled/private by default.',
      'This resolver is a contract for future API guards; it does not enforce anything itself.',
      'Use --strict to exit nonzero unless all cases pass.',
    ],
  }, null, 2));

  if (report.failed > 0) {
    // eslint-disable-next-line no-console
    console.error(`Permission resolver smoke: ${report.failed} case(s) failed.`);
    if (strict) process.exitCode = 1;
  }
}

main();
