import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
const REQUIRED_USER_SCHEMA_COLUMNS = {
    users: ['user_id', 'display_name', 'status', 'schema_version', 'created_at', 'updated_at'],
    user_identities: [
        'identity_id',
        'user_id',
        'provider_kind',
        'provider_subject',
        'display_name',
        'email',
        'claimed_at',
        'schema_version',
        'created_at',
        'updated_at',
    ],
    user_profiles: [
        'user_id',
        'handle',
        'display_name',
        'bio',
        'avatar_media_asset_id',
        'banner_media_asset_id',
        'tags',
        'visibility',
        'pinned',
        'section_visibility',
        'schema_version',
        'created_at',
        'updated_at',
    ],
};
const USER_SCHEMA_TABLES = Object.keys(REQUIRED_USER_SCHEMA_COLUMNS);
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
export async function checkPostgresUserSchemaReadiness() {
    const config = readDatabaseRuntimeConfigFromEnv(process.env);
    if (!config.configured) {
        return { status: 'not_configured' };
    }
    const startedAt = Date.now();
    try {
        const result = await queryPostgres(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name, ordinal_position
      `, [USER_SCHEMA_TABLES], config);
        const columnsByTable = new Map();
        for (const row of result.rows) {
            const columns = columnsByTable.get(row.table_name) ?? new Set();
            columns.add(row.column_name);
            columnsByTable.set(row.table_name, columns);
        }
        const missingTables = USER_SCHEMA_TABLES.filter((table) => !columnsByTable.has(table));
        const missingColumns = USER_SCHEMA_TABLES.flatMap((table) => {
            const existingColumns = columnsByTable.get(table);
            if (!existingColumns)
                return [];
            const columns = REQUIRED_USER_SCHEMA_COLUMNS[table].filter((column) => !existingColumns.has(column));
            return columns.length > 0 ? [{ table, columns }] : [];
        });
        const latencyMs = Date.now() - startedAt;
        if (missingTables.length > 0 || missingColumns.length > 0) {
            return {
                status: 'schema_missing',
                missingTables: missingTables.length > 0 ? missingTables : undefined,
                missingColumns: missingColumns.length > 0 ? missingColumns : undefined,
                latencyMs,
            };
        }
        return { status: 'ready', latencyMs };
    }
    catch (error) {
        return {
            ...classifySchemaError(error),
            latencyMs: Date.now() - startedAt,
        };
    }
}
export function getRequiredPostgresUserSchemaColumns() {
    return { ...REQUIRED_USER_SCHEMA_COLUMNS };
}
