import { getWorldServerById, getWorldServerByHandle, listDiscoverableWorldServers, getWorldServerInviteByCode, } from '../adapters/postgresWorldServerRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import { checkPostgresWorldServerSchemaReadiness, } from './postgresWorldServerSchemaReadiness.js';
// Deterministic, harmless ids/handles/codes that must never exist.
const READONLY_PROBE_SERVER_ID = 'worldServer_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_HANDLE = 'readonly-smoke-probe-nonexistent-handle';
const READONLY_PROBE_INVITE_CODE = 'readonly_smoke_probe_nonexistent_invite_code';
export async function runPostgresWorldServerRepositoryReadOnlySmoke() {
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
    const schema = await checkPostgresWorldServerSchemaReadiness();
    if (schema.status !== 'ready') {
        return { status: schema.status, database, schema, errorKind: schema.errorKind };
    }
    const serverProbe = await getWorldServerById(READONLY_PROBE_SERVER_ID);
    if (serverProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: serverProbe.error.kind };
    }
    const handleProbe = await getWorldServerByHandle(READONLY_PROBE_HANDLE);
    if (handleProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: handleProbe.error.kind };
    }
    const inviteProbe = await getWorldServerInviteByCode(READONLY_PROBE_INVITE_CODE);
    if (inviteProbe.ok === false) {
        return { status: 'error', database, schema, errorKind: inviteProbe.error.kind };
    }
    const discoverable = await listDiscoverableWorldServers({ limit: 5 });
    if (discoverable.ok === false) {
        return { status: 'error', database, schema, errorKind: discoverable.error.kind };
    }
    return {
        status: 'ready',
        database,
        schema,
        probe: {
            ranNonexistentServerLookup: true,
            ranNonexistentHandleLookup: true,
            ranNonexistentInviteLookup: true,
            ranDiscoverableList: true,
            foundUnexpectedRow: serverProbe.value !== null || handleProbe.value !== null || inviteProbe.value !== null,
        },
    };
}
export { READONLY_PROBE_SERVER_ID, READONLY_PROBE_HANDLE, READONLY_PROBE_INVITE_CODE };
