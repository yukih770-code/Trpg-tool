import { getActorById } from '../adapters/postgresActorRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import { checkPostgresActorSchemaReadiness, } from './postgresActorSchemaReadiness.js';
// Deterministic, harmless id that must never exist.
const READONLY_PROBE_ACTOR_ID = 'actor_readonly_smoke_probe_nonexistent';
export async function runPostgresActorRepositoryReadOnlySmoke() {
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
    const schema = await checkPostgresActorSchemaReadiness();
    if (schema.status !== 'ready') {
        return {
            status: schema.status,
            database,
            schema,
            errorKind: schema.errorKind,
        };
    }
    // Harmless read-only probe: a deterministic id that must never exist.
    const probe = await getActorById(READONLY_PROBE_ACTOR_ID);
    if (probe.ok === false) {
        return { status: 'error', database, schema, errorKind: probe.error.kind };
    }
    return {
        status: 'ready',
        database,
        schema,
        probe: { ranNonexistentLookup: true, foundUnexpectedRow: probe.value !== null },
    };
}
export { READONLY_PROBE_ACTOR_ID };
