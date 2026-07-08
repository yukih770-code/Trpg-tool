import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresCampaignSchemaReadiness } from './postgresCampaignSchemaReadiness.js';
const REQUIRED_COLUMNS = {
    world_servers: [
        'world_server_id', 'owner_id', 'server_handle', 'display_name', 'description',
        'server_visibility', 'join_policy', 'lifecycle_status', 'default_game_system_id',
        'public_profile_payload', 'server_settings_payload',
        'soft_update_policy_payload', 'schema_version', 'created_at', 'updated_at', 'archived_at',
    ],
    world_server_campaign_bindings: [
        'binding_id', 'world_server_id', 'campaign_id', 'created_by_user_id', 'binding_kind',
        'visibility_scope', 'binding_payload', 'schema_version', 'created_at', 'updated_at', 'archived_at',
    ],
    world_server_game_system_bindings: [
        'binding_id', 'world_server_id', 'game_system_id', 'display_name', 'system_kind',
        'binding_status', 'is_default', 'ruleset_template_id', 'current_ruleset_version_id',
        'config_payload', 'enabled_pack_version_ids', 'schema_version', 'created_by_user_id',
        'created_at', 'updated_at', 'archived_at',
    ],
    world_server_roles: [
        'role_id', 'world_server_id', 'role_key', 'display_name', 'role_kind', 'permissions_payload',
        'is_system_role', 'sort_order', 'schema_version', 'created_at', 'updated_at', 'archived_at',
    ],
    world_server_memberships: [
        'membership_id', 'world_server_id', 'user_id', 'role_id', 'role_key', 'membership_status',
        'display_alias', 'invited_by_user_id', 'approved_by_user_id', 'membership_payload',
        'schema_version', 'joined_at', 'created_at', 'updated_at', 'archived_at',
    ],
    world_server_invites: [
        'invite_id', 'world_server_id', 'invite_code', 'created_by_user_id', 'target_user_id',
        'target_email', 'default_role_key', 'invite_status', 'max_uses', 'use_count', 'expires_at',
        'invite_payload', 'schema_version', 'created_at', 'updated_at', 'archived_at',
    ],
    world_server_join_requests: [
        'join_request_id', 'world_server_id', 'requester_user_id', 'reviewed_by_user_id',
        'request_status', 'request_message', 'response_message', 'requested_role_key',
        'request_payload', 'schema_version', 'requested_at', 'reviewed_at', 'created_at', 'updated_at', 'archived_at',
    ],
};
const WORLD_TABLES = Object.keys(REQUIRED_COLUMNS);
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
export async function checkPostgresWorldServerSchemaReadiness() {
    const config = readDatabaseRuntimeConfigFromEnv(process.env);
    if (!config.configured) {
        return { status: 'not_configured' };
    }
    // World server depends on the User + Campaign schemas. Campaign readiness chains User.
    const campaignSchema = await checkPostgresCampaignSchemaReadiness();
    if (campaignSchema.status === 'not_configured')
        return { status: 'not_configured' };
    if (campaignSchema.status === 'unreachable') {
        return { status: 'unreachable', errorKind: campaignSchema.errorKind, latencyMs: campaignSchema.latencyMs };
    }
    if (campaignSchema.status === 'error') {
        return { status: 'error', errorKind: campaignSchema.errorKind, latencyMs: campaignSchema.latencyMs };
    }
    if (campaignSchema.status === 'user_schema_missing') {
        return { status: 'user_schema_missing', missingTables: campaignSchema.missingTables, missingColumns: campaignSchema.missingColumns, latencyMs: campaignSchema.latencyMs };
    }
    if (campaignSchema.status === 'schema_missing') {
        return { status: 'campaign_schema_missing', missingTables: campaignSchema.missingTables ?? ['campaigns'], missingColumns: campaignSchema.missingColumns, latencyMs: campaignSchema.latencyMs };
    }
    const startedAt = Date.now();
    try {
        const result = await queryPostgres(`SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name IN (
         'world_servers','world_server_campaign_bindings','world_server_roles',
         'world_server_memberships','world_server_invites','world_server_join_requests')
       ORDER BY table_name, ordinal_position`, [], config);
        const latencyMs = Date.now() - startedAt;
        const columnsByTable = new Map();
        for (const row of result.rows) {
            if (!columnsByTable.has(row.table_name))
                columnsByTable.set(row.table_name, new Set());
            columnsByTable.get(row.table_name).add(row.column_name);
        }
        const missingTables = WORLD_TABLES.filter((table) => !columnsByTable.has(table));
        if (missingTables.length > 0) {
            return { status: 'schema_missing', missingTables, latencyMs };
        }
        const missingColumns = [];
        for (const table of WORLD_TABLES) {
            const existing = columnsByTable.get(table) ?? new Set();
            const missing = REQUIRED_COLUMNS[table].filter((column) => !existing.has(column));
            if (missing.length > 0)
                missingColumns.push({ table, columns: missing });
        }
        if (missingColumns.length > 0) {
            return { status: 'schema_missing', missingColumns, latencyMs };
        }
        return { status: 'ready', latencyMs };
    }
    catch (error) {
        return { ...classifySchemaError(error), latencyMs: Date.now() - startedAt };
    }
}
export function getRequiredPostgresWorldServerSchemaColumns() {
    const out = {};
    for (const table of WORLD_TABLES)
        out[table] = [...REQUIRED_COLUMNS[table]];
    return out;
}
