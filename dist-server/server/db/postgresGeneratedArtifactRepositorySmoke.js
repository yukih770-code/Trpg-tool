import { getGeneratedArtifactById, getAiMemoryEntryById, getAiContextSourceById, } from '../adapters/postgresGeneratedArtifactRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import { checkPostgresGeneratedArtifactSchemaReadiness, } from './postgresGeneratedArtifactSchemaReadiness.js';
// Deterministic, harmless ids that must never exist.
const READONLY_PROBE_ARTIFACT_ID = 'artifact_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_MEMORY_ID = 'memoryEntry_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_CONTEXT_SOURCE_ID = 'contextSource_readonly_smoke_probe_nonexistent';
export async function runPostgresGeneratedArtifactRepositoryReadOnlySmoke() {
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
    const schema = await checkPostgresGeneratedArtifactSchemaReadiness();
    if (schema.status !== 'ready') {
        return { status: schema.status, database, schema, errorKind: schema.errorKind };
    }
    const artifactProbe = await getGeneratedArtifactById(READONLY_PROBE_ARTIFACT_ID);
    if (artifactProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: artifactProbe.error.kind };
    }
    const memoryProbe = await getAiMemoryEntryById(READONLY_PROBE_MEMORY_ID);
    if (memoryProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: memoryProbe.error.kind };
    }
    const contextProbe = await getAiContextSourceById(READONLY_PROBE_CONTEXT_SOURCE_ID);
    if (contextProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: contextProbe.error.kind };
    }
    return {
        status: 'ready',
        database,
        schema,
        probe: {
            ranNonexistentArtifactLookup: true,
            ranNonexistentMemoryLookup: true,
            ranNonexistentContextSourceLookup: true,
            foundUnexpectedRow: artifactProbe.value !== null || memoryProbe.value !== null || contextProbe.value !== null,
        },
    };
}
export { READONLY_PROBE_ARTIFACT_ID, READONLY_PROBE_MEMORY_ID, READONLY_PROBE_CONTEXT_SOURCE_ID };
