import { createStartupRecoveryReadiness } from './startupRecoveryReadiness.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const timestamps = [
  new Date('2026-08-13T00:00:00.000Z'),
  new Date('2026-08-13T00:00:01.000Z'),
  new Date('2026-08-13T00:00:02.000Z'),
];
const required = createStartupRecoveryReadiness(true, () => timestamps.shift() ?? new Date('2026-08-13T00:00:03.000Z'));
assert(!required.isReady(), 'Database-backed startup must remain closed while recovery is pending.');
assert(required.snapshot().status === 'pending', 'Required recovery must expose a pending health state.');

required.markReady({ restoredRoomCount: 2, restoredRuntimeLogEventCount: 5, restoredRoomMapEventCount: 3 });
assert(required.isReady(), 'Successful recovery must open traffic.');
assert(required.snapshot().restoredRoomCount === 2, 'Ready evidence must be visible to health diagnostics.');
required.markFailed('unexpected_failure');
assert(required.snapshot().status === 'ready', 'A late callback must not overwrite a terminal ready decision.');

const failed = createStartupRecoveryReadiness(true, () => new Date('2026-08-13T00:00:04.000Z'));
failed.markFailed('runtime_log_unavailable');
assert(!failed.isReady(), 'Failed recovery must remain fail-closed.');
assert(failed.snapshot().failureKind === 'runtime_log_unavailable', 'Failure diagnostics must preserve a safe failure kind.');
failed.markReady();
assert(failed.snapshot().status === 'failed', 'A late callback must not overwrite a terminal failure decision.');

const memoryOnly = createStartupRecoveryReadiness(false, () => new Date('2026-08-13T00:00:05.000Z'));
assert(memoryOnly.isReady(), 'Memory-only local mode must be ready immediately.');
assert(memoryOnly.snapshot().required === false, 'Health diagnostics must distinguish memory-only startup.');

console.log('startupRecoveryReadinessSmoke: pending, terminal, failure, and memory-only states passed');
