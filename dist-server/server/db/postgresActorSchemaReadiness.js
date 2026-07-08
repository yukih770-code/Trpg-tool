import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresUserSchemaReadiness } from './postgresSchemaReadiness.js';
const REQUIRED_ACTOR_COLUMNS = [
    'actor_id',
    'owner_id',
    'system_id',
    'local_actor_id',
    'display_name',
    'actor_payload',
    'schema_version',
    'created_at',
    'updated_at',
    'archived_at',
];
function classifySchemaError(error) {
    if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
        return { status: 'not_configured' };
    }
    const errorKind = error instanceof PostgresDatabaseError ? error.message : 'database_error';
    if (errorKind === 'connection_refused' ||
        errorKind === 'connection_timeout' ||
        errorKind === 'host_not_found' ||
        errorKind === 'authentication_failed' ||
        errorKind === 'database_not_found') {
        return { status: 'unreachable', errorKind };
    }
    return { status: 'error', errorKind };
}
export async function checkPostgresActorSchemaReadiness() {
    const config = readDatabaseRuntimeConfigFromEnv(process.env);
    if (!config.configured) {
        return { status: 'not_configured' };
    }
    // Actor depends on the User schema (owner_id FK → users).
    const userSchema = await checkPostgresUserSchemaReadiness();
    if (userSchema.status === 'not_configured')
        return { status: 'not_configured' };
    if (userSchema.status === 'unreachable') {
        return { status: 'unreachable', errorKind: userSchema.errorKind, latencyMs: userSchema.latencyMs };
    }
    if (userSchema.status === 'error') {
        return { status: 'error', errorKind: userSchema.errorKind, latencyMs: userSchema.latencyMs };
    }
    if (userSchema.status === 'schema_missing') {
        return {
            status: 'user_schema_missing',
            missingTables: userSchema.missingTables,
            missingColumns: userSchema.missingColumns,
            latencyMs: userSchema.latencyMs,
        };
    }
    const startedAt = Date.now();
    try {
        const result = await queryPostgres(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'actors'
        ORDER BY ordinal_position
      `, [], config);
        const existingColumns = new Set(result.rows.map((row) => row.column_name));
        const latencyMs = Date.now() - startedAt;
        if (existingColumns.size === 0) {
            return { status: 'schema_missing', missingTables: ['actors'], latencyMs };
        }
        const missing = REQUIRED_ACTOR_COLUMNS.filter((column) => !existingColumns.has(column));
        if (missing.length > 0) {
            return { status: 'schema_missing', missingColumns: [{ table: 'actors', columns: missing }], latencyMs };
        }
        return { status: 'ready', latencyMs };
    }
    catch (error) {
        return { ...classifySchemaError(error), latencyMs: Date.now() - startedAt };
    }
}
export function getRequiredPostgresActorSchemaColumns() {
    return { actors: [...REQUIRED_ACTOR_COLUMNS] };
}
