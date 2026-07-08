import { getRuntimeSessionById, getRuntimeEventById, listRuntimeEvents, } from '../adapters/postgresRuntimeEventRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import { checkPostgresRuntimeEventSchemaReadiness, } from './postgresRuntimeEventSchemaReadiness.js';
// Deterministic, harmless ids that must never exist.
const READONLY_PROBE_SESSION_ID = 'runtimeSession_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_EVENT_ID = 'runtimeEvent_readonly_smoke_probe_nonexistent';
export async function runPostgresRuntimeEventRepositoryReadOnlySmoke() {
    const database = await checkPostgresHealth();
    if (database.configured === false) {
        return { status: 'not_configured', database, schema: { status: 'not_configured' } };
    }
    if (database.status !== 'ok') {
        return {
            status: 'unreachable',
            database,
            schema: { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs },
            errorKind: database.errorKind,
        };
    }
    const schema = await checkPostgresRuntimeEventSchemaReadiness();
    if (schema.status !== 'ready') {
        return { status: schema.status, database, schema, errorKind: schema.errorKind };
    }
    const sessionProbe = await getRuntimeSessionById(READONLY_PROBE_SESSION_ID);
    if (sessionProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: sessionProbe.error.kind };
    }
    const eventProbe = await getRuntimeEventById(READONLY_PROBE_EVENT_ID);
    if (eventProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: eventProbe.error.kind };
    }
    // Listing events for a nonexistent session is a safe empty read (not an error).
    const listProbe = await listRuntimeEvents(READONLY_PROBE_SESSION_ID, { afterSeq: 0 });
    if (listProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: listProbe.error.kind };
    }
    return {
        status: 'ready',
        database,
        schema,
        probe: {
            ranNonexistentSessionLookup: true,
            ranNonexistentEventLookup: true,
            ranEmptyEventList: true,
            foundUnexpectedRow: sessionProbe.value !== null || eventProbe.value !== null || listProbe.value.length > 0,
        },
    };
}
export { READONLY_PROBE_SESSION_ID, READONLY_PROBE_EVENT_ID };
