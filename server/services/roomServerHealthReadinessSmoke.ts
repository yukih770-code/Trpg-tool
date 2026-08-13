import { evaluateRoomServerHealthReadiness } from './roomServerHealthReadiness.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const allReady = Array.from({ length: 11 }, () => 'ready');

const cloudReady = evaluateRoomServerHealthReadiness({
  databaseConfigured: true,
  databaseStatus: 'ok',
  requiredSchemaStatuses: allReady,
  startupRecoveryStatus: 'ready',
});
assert(cloudReady.status === 'ready', 'A fully migrated and recovered database runtime must be ready.');
assert(cloudReady.databaseSchemasReady && cloudReady.readySchemaCount === 11, 'Readiness must count every required schema family.');

const pending = evaluateRoomServerHealthReadiness({
  databaseConfigured: true,
  databaseStatus: 'ok',
  requiredSchemaStatuses: allReady,
  startupRecoveryStatus: 'pending',
});
assert(pending.status === 'not_ready' && pending.blockers.includes('startup_recovery_pending'), 'Pending recovery must keep health closed.');

const partialSchema = evaluateRoomServerHealthReadiness({
  databaseConfigured: true,
  databaseStatus: 'ok',
  requiredSchemaStatuses: [...allReady.slice(0, 10), 'schema_missing'],
  startupRecoveryStatus: 'ready',
});
assert(partialSchema.status === 'not_ready' && partialSchema.blockers.includes('database_schema_not_ready'), 'One missing schema must make the service unready.');
assert(partialSchema.readySchemaCount === 10, 'Partial schema diagnostics must expose only aggregate counts.');

const unavailable = evaluateRoomServerHealthReadiness({
  databaseConfigured: true,
  databaseStatus: 'error',
  requiredSchemaStatuses: Array.from({ length: 11 }, () => 'unreachable'),
  startupRecoveryStatus: 'failed',
});
assert(unavailable.blockers.includes('database_unavailable'), 'An unreachable configured database must block health.');
assert(unavailable.blockers.includes('startup_recovery_failed'), 'Failed startup recovery must remain visible as a separate blocker.');

const memoryOnly = evaluateRoomServerHealthReadiness({
  databaseConfigured: false,
  databaseStatus: 'not_configured',
  requiredSchemaStatuses: [],
  startupRecoveryStatus: 'ready',
});
assert(memoryOnly.status === 'ready' && memoryOnly.requiredSchemaCount === 0, 'Memory-only local mode must not require PostgreSQL schemas.');

console.log('roomServerHealthReadinessSmoke: database, schema, recovery, and memory-only readiness passed');
