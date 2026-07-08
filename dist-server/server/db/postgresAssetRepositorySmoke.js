import { getAssetById, getStorageRefById } from '../adapters/postgresAssetRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import { checkPostgresAssetSchemaReadiness, } from './postgresAssetSchemaReadiness.js';
// Deterministic, harmless ids that must never exist.
const READONLY_PROBE_ASSET_ID = 'asset_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_STORAGE_REF_ID = 'storageRef_readonly_smoke_probe_nonexistent';
export async function runPostgresAssetRepositoryReadOnlySmoke() {
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
    const schema = await checkPostgresAssetSchemaReadiness();
    if (schema.status !== 'ready') {
        return { status: schema.status, database, schema, errorKind: schema.errorKind };
    }
    // Harmless read-only probes: deterministic ids that must never exist.
    const assetProbe = await getAssetById(READONLY_PROBE_ASSET_ID);
    if (assetProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: assetProbe.error.kind };
    }
    const storageProbe = await getStorageRefById(READONLY_PROBE_STORAGE_REF_ID);
    if (storageProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: storageProbe.error.kind };
    }
    return {
        status: 'ready',
        database,
        schema,
        probe: {
            ranNonexistentAssetLookup: true,
            ranNonexistentStorageRefLookup: true,
            foundUnexpectedRow: assetProbe.value !== null || storageProbe.value !== null,
        },
    };
}
export { READONLY_PROBE_ASSET_ID, READONLY_PROBE_STORAGE_REF_ID };
