import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';
// ── Shared helpers ───────────────────────────────────────────────────────────
function toIso(value) {
    if (!value)
        return undefined;
    if (value instanceof Date)
        return value.toISOString();
    return value;
}
function toPayload(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function toStringArray(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}
function toNumber(value, fallback = 0) {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
}
function toOptionalNumber(value) {
    if (value === null || value === undefined)
        return undefined;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : undefined;
}
function limitOf(value, fallback = 200) {
    return Number.isInteger(value) && value > 0 ? value : fallback;
}
function mapRepositoryError(error) {
    if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
        return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
    }
    if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
        return { ok: false, error: { kind: 'schema_missing', message: 'World server repository table is missing.' } };
    }
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === '23505') {
        return { ok: false, error: { kind: 'conflict', message: 'World server row already exists (duplicate handle/code/pair).' } };
    }
    if (code === '23503') {
        return { ok: false, error: { kind: 'conflict', message: 'World server row references a missing owner/user/campaign/role.' } };
    }
    if (code === '42P01') {
        return { ok: false, error: { kind: 'schema_missing', message: 'World server repository table is missing.' } };
    }
    const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
    return { ok: false, error: { kind: 'database_error', message: 'World server repository query failed.', retryable } };
}
// ── Row mappers ──────────────────────────────────────────────────────────────
function rowToServer(row) {
    return {
        worldServerId: row.world_server_id,
        ownerId: row.owner_id,
        serverHandle: row.server_handle,
        displayName: row.display_name,
        description: row.description ?? undefined,
        serverVisibility: row.server_visibility,
        joinPolicy: row.join_policy,
        lifecycleStatus: row.lifecycle_status,
        defaultGameSystemId: row.default_game_system_id ?? undefined,
        publicProfilePayload: toPayload(row.public_profile_payload),
        serverSettingsPayload: toPayload(row.server_settings_payload),
        softUpdatePolicyPayload: toPayload(row.soft_update_policy_payload),
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function rowToBinding(row) {
    return {
        bindingId: row.binding_id,
        worldServerId: row.world_server_id,
        campaignId: row.campaign_id,
        createdByUserId: row.created_by_user_id ?? undefined,
        bindingKind: row.binding_kind,
        visibilityScope: row.visibility_scope,
        payload: toPayload(row.binding_payload),
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function rowToGameSystemBinding(row) {
    return {
        bindingId: row.binding_id,
        worldServerId: row.world_server_id,
        gameSystemId: row.game_system_id,
        displayName: row.display_name,
        systemKind: row.system_kind,
        bindingStatus: row.binding_status,
        isDefault: row.is_default === true,
        rulesetTemplateId: row.ruleset_template_id ?? undefined,
        currentRulesetVersionId: row.current_ruleset_version_id ?? undefined,
        config: toPayload(row.config_payload),
        enabledPackVersionIds: toStringArray(row.enabled_pack_version_ids),
        schemaVersion: row.schema_version,
        createdByUserId: row.created_by_user_id ?? undefined,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function rowToRole(row) {
    return {
        roleId: row.role_id,
        worldServerId: row.world_server_id,
        roleKey: row.role_key,
        displayName: row.display_name,
        roleKind: row.role_kind,
        permissionsPayload: toPayload(row.permissions_payload),
        isSystemRole: row.is_system_role === true,
        sortOrder: row.sort_order,
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function rowToMembership(row) {
    return {
        membershipId: row.membership_id,
        worldServerId: row.world_server_id,
        userId: row.user_id,
        roleId: row.role_id ?? undefined,
        roleKey: row.role_key,
        membershipStatus: row.membership_status,
        displayAlias: row.display_alias ?? undefined,
        invitedByUserId: row.invited_by_user_id ?? undefined,
        approvedByUserId: row.approved_by_user_id ?? undefined,
        payload: toPayload(row.membership_payload),
        schemaVersion: row.schema_version,
        joinedAt: toIso(row.joined_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function rowToInvite(row) {
    return {
        inviteId: row.invite_id,
        worldServerId: row.world_server_id,
        inviteCode: row.invite_code,
        createdByUserId: row.created_by_user_id,
        targetUserId: row.target_user_id ?? undefined,
        targetEmail: row.target_email ?? undefined,
        defaultRoleKey: row.default_role_key,
        inviteStatus: row.invite_status,
        maxUses: toOptionalNumber(row.max_uses),
        useCount: toNumber(row.use_count),
        expiresAt: toIso(row.expires_at),
        payload: toPayload(row.invite_payload),
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function rowToJoinRequest(row) {
    return {
        joinRequestId: row.join_request_id,
        worldServerId: row.world_server_id,
        requesterUserId: row.requester_user_id,
        reviewedByUserId: row.reviewed_by_user_id ?? undefined,
        requestStatus: row.request_status,
        requestMessage: row.request_message ?? undefined,
        responseMessage: row.response_message ?? undefined,
        requestedRoleKey: row.requested_role_key,
        payload: toPayload(row.request_payload),
        schemaVersion: row.schema_version,
        requestedAt: toIso(row.requested_at),
        reviewedAt: toIso(row.reviewed_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
// ── Column lists ─────────────────────────────────────────────────────────────
const SERVER_COLS = `
  world_server_id, owner_id, server_handle, display_name, description,
  server_visibility, join_policy, lifecycle_status, default_game_system_id,
  public_profile_payload, server_settings_payload, soft_update_policy_payload,
  schema_version, created_at, updated_at, archived_at
`;
const BINDING_COLS = `
  binding_id, world_server_id, campaign_id, created_by_user_id, binding_kind,
  visibility_scope, binding_payload, schema_version, created_at, updated_at, archived_at
`;
const GSB_COLS = `
  binding_id, world_server_id, game_system_id, display_name, system_kind, binding_status,
  is_default, ruleset_template_id, current_ruleset_version_id, config_payload,
  enabled_pack_version_ids, schema_version, created_by_user_id, created_at, updated_at, archived_at
`;
const ROLE_COLS = `
  role_id, world_server_id, role_key, display_name, role_kind, permissions_payload,
  is_system_role, sort_order, schema_version, created_at, updated_at, archived_at
`;
const MEMBERSHIP_COLS = `
  membership_id, world_server_id, user_id, role_id, role_key, membership_status,
  display_alias, invited_by_user_id, approved_by_user_id, membership_payload,
  schema_version, joined_at, created_at, updated_at, archived_at
`;
const INVITE_COLS = `
  invite_id, world_server_id, invite_code, created_by_user_id, target_user_id,
  target_email, default_role_key, invite_status, max_uses, use_count, expires_at,
  invite_payload, schema_version, created_at, updated_at, archived_at
`;
const JOIN_REQUEST_COLS = `
  join_request_id, world_server_id, requester_user_id, reviewed_by_user_id,
  request_status, request_message, response_message, requested_role_key,
  request_payload, schema_version, requested_at, reviewed_at, created_at, updated_at, archived_at
`;
const defaultExecutor = {
    query: (text, values) => queryPostgres(text, values),
};
export function createPostgresWorldServerRepository(executor = defaultExecutor, _options = {}) {
    async function one(sql, values, map) {
        try {
            const result = await executor.query(sql, values);
            return { ok: true, value: result.rows[0] ? map(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function many(sql, values, map) {
        try {
            const result = await executor.query(sql, values);
            return { ok: true, value: result.rows.map(map) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    // ── World servers ──────────────────────────────────────────────────────────
    const getWorldServerById = (worldServerId) => one(`SELECT ${SERVER_COLS} FROM world_servers WHERE world_server_id = $1 LIMIT 1`, [worldServerId], rowToServer);
    const getWorldServerByHandle = (serverHandle) => one(`SELECT ${SERVER_COLS} FROM world_servers WHERE server_handle = $1 LIMIT 1`, [serverHandle], rowToServer);
    async function listWorldServersByOwner(ownerId, options = {}) {
        const conditions = ['owner_id = $1'];
        const values = [ownerId];
        if (options.lifecycleStatus) {
            values.push(options.lifecycleStatus);
            conditions.push(`lifecycle_status = $${values.length}`);
        }
        if (options.serverVisibility) {
            values.push(options.serverVisibility);
            conditions.push(`server_visibility = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        values.push(limitOf(options.limit));
        return many(`SELECT ${SERVER_COLS} FROM world_servers WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToServer);
    }
    async function listDiscoverableWorldServers(options = {}) {
        const conditions = [];
        const values = [];
        if (options.serverVisibility) {
            values.push(options.serverVisibility);
            conditions.push(`server_visibility = $${values.length}`);
        }
        else {
            values.push(['public_recruiting', 'public_listed']);
            conditions.push(`server_visibility = ANY($${values.length}::text[])`);
        }
        if (options.joinPolicy) {
            values.push(options.joinPolicy);
            conditions.push(`join_policy = $${values.length}`);
        }
        conditions.push(`lifecycle_status = 'active'`);
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        values.push(limitOf(options.limit, 100));
        return many(`SELECT ${SERVER_COLS} FROM world_servers WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToServer);
    }
    async function createWorldServer(input) {
        const now = new Date().toISOString();
        const record = {
            worldServerId: input.worldServerId,
            ownerId: input.ownerId,
            serverHandle: input.serverHandle,
            displayName: input.displayName,
            description: input.description,
            serverVisibility: input.serverVisibility ?? 'private',
            joinPolicy: input.joinPolicy ?? 'invite_only',
            lifecycleStatus: input.lifecycleStatus ?? 'active',
            defaultGameSystemId: input.defaultGameSystemId,
            publicProfilePayload: input.publicProfilePayload ?? {},
            serverSettingsPayload: input.serverSettingsPayload ?? {},
            softUpdatePolicyPayload: input.softUpdatePolicyPayload ?? {},
            schemaVersion: input.schemaVersion ?? 1,
            createdAt: now,
            updatedAt: now,
        };
        try {
            await executor.query(`INSERT INTO world_servers (
           world_server_id, owner_id, server_handle, display_name, description,
           server_visibility, join_policy, lifecycle_status, default_game_system_id,
           public_profile_payload, server_settings_payload, soft_update_policy_payload,
           schema_version, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14,$14)`, [
                record.worldServerId, record.ownerId, record.serverHandle, record.displayName, record.description ?? null,
                record.serverVisibility, record.joinPolicy, record.lifecycleStatus, record.defaultGameSystemId ?? null,
                JSON.stringify(record.publicProfilePayload), JSON.stringify(record.serverSettingsPayload),
                JSON.stringify(record.softUpdatePolicyPayload), record.schemaVersion, now,
            ]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    const updateWorldServerProfile = (input) => one(`UPDATE world_servers SET
         display_name = COALESCE($2, display_name),
         description = COALESCE($3, description),
         server_visibility = COALESCE($4, server_visibility),
         join_policy = COALESCE($5, join_policy),
         lifecycle_status = COALESCE($6, lifecycle_status),
         public_profile_payload = COALESCE($7::jsonb, public_profile_payload),
         updated_at = $8
       WHERE world_server_id = $1 RETURNING ${SERVER_COLS}`, [input.worldServerId, input.displayName ?? null, input.description ?? null, input.serverVisibility ?? null, input.joinPolicy ?? null, input.lifecycleStatus ?? null, input.publicProfilePayload === undefined ? null : JSON.stringify(input.publicProfilePayload), new Date().toISOString()], rowToServer);
    const updateWorldServerSettings = (input) => one(`UPDATE world_servers SET
         default_game_system_id = COALESCE($2, default_game_system_id),
         server_settings_payload = COALESCE($3::jsonb, server_settings_payload),
         soft_update_policy_payload = COALESCE($4::jsonb, soft_update_policy_payload),
         updated_at = $5
       WHERE world_server_id = $1 RETURNING ${SERVER_COLS}`, [input.worldServerId, input.defaultGameSystemId ?? null, input.serverSettingsPayload === undefined ? null : JSON.stringify(input.serverSettingsPayload), input.softUpdatePolicyPayload === undefined ? null : JSON.stringify(input.softUpdatePolicyPayload), new Date().toISOString()], rowToServer);
    const archiveWorldServer = (worldServerId, archivedAt) => one(`UPDATE world_servers SET archived_at = $2, updated_at = $2 WHERE world_server_id = $1 RETURNING ${SERVER_COLS}`, [worldServerId, archivedAt ?? new Date().toISOString()], rowToServer);
    const restoreWorldServer = (worldServerId) => one(`UPDATE world_servers SET archived_at = NULL, updated_at = $2 WHERE world_server_id = $1 RETURNING ${SERVER_COLS}`, [worldServerId, new Date().toISOString()], rowToServer);
    // ── Campaign bindings ────────────────────────────────────────────────────────
    const getWorldServerCampaignBinding = (bindingId) => one(`SELECT ${BINDING_COLS} FROM world_server_campaign_bindings WHERE binding_id = $1 LIMIT 1`, [bindingId], rowToBinding);
    const getWorldServerCampaignBindingByPair = (worldServerId, campaignId) => one(`SELECT ${BINDING_COLS} FROM world_server_campaign_bindings WHERE world_server_id = $1 AND campaign_id = $2 LIMIT 1`, [worldServerId, campaignId], rowToBinding);
    function listBindingsWhere(column, value, options) {
        const conditions = [`${column} = $1`];
        const values = [value];
        if (options.visibilityScope) {
            values.push(options.visibilityScope);
            conditions.push(`visibility_scope = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        values.push(limitOf(options.limit));
        return many(`SELECT ${BINDING_COLS} FROM world_server_campaign_bindings WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToBinding);
    }
    const listCampaignBindingsByWorldServer = (worldServerId, options = {}) => listBindingsWhere('world_server_id', worldServerId, options);
    const listWorldServerBindingsForCampaign = (campaignId, options = {}) => listBindingsWhere('campaign_id', campaignId, options);
    async function bindCampaignToWorldServer(input) {
        const now = new Date().toISOString();
        const record = {
            bindingId: input.bindingId, worldServerId: input.worldServerId, campaignId: input.campaignId, createdByUserId: input.createdByUserId,
            bindingKind: input.bindingKind ?? 'owned', visibilityScope: input.visibilityScope ?? 'server', payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, createdAt: now, updatedAt: now,
        };
        try {
            await executor.query(`INSERT INTO world_server_campaign_bindings (binding_id, world_server_id, campaign_id, created_by_user_id, binding_kind, visibility_scope, binding_payload, schema_version, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$9)`, [record.bindingId, record.worldServerId, record.campaignId, record.createdByUserId ?? null, record.bindingKind, record.visibilityScope, JSON.stringify(record.payload), record.schemaVersion, now]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    const updateWorldServerCampaignBinding = (input) => one(`UPDATE world_server_campaign_bindings SET binding_kind = COALESCE($2, binding_kind), visibility_scope = COALESCE($3, visibility_scope), binding_payload = COALESCE($4::jsonb, binding_payload), updated_at = $5 WHERE binding_id = $1 RETURNING ${BINDING_COLS}`, [input.bindingId, input.bindingKind ?? null, input.visibilityScope ?? null, input.payload === undefined ? null : JSON.stringify(input.payload), new Date().toISOString()], rowToBinding);
    const archiveWorldServerCampaignBinding = (bindingId, archivedAt) => one(`UPDATE world_server_campaign_bindings SET archived_at = $2, updated_at = $2 WHERE binding_id = $1 RETURNING ${BINDING_COLS}`, [bindingId, archivedAt ?? new Date().toISOString()], rowToBinding);
    const restoreWorldServerCampaignBinding = (bindingId) => one(`UPDATE world_server_campaign_bindings SET archived_at = NULL, updated_at = $2 WHERE binding_id = $1 RETURNING ${BINDING_COLS}`, [bindingId, new Date().toISOString()], rowToBinding);
    // ── Game system bindings ──────────────────────────────────────────────────────
    const getWorldServerGameSystemBinding = (bindingId) => one(`SELECT ${GSB_COLS} FROM world_server_game_system_bindings WHERE binding_id = $1 LIMIT 1`, [bindingId], rowToGameSystemBinding);
    const getWorldServerGameSystemBindingBySystem = (worldServerId, gameSystemId) => one(`SELECT ${GSB_COLS} FROM world_server_game_system_bindings WHERE world_server_id = $1 AND game_system_id = $2 LIMIT 1`, [worldServerId, gameSystemId], rowToGameSystemBinding);
    async function listGameSystemBindingsByWorldServer(worldServerId, options = {}) {
        const conditions = ['world_server_id = $1'];
        const values = [worldServerId];
        if (options.systemKind) {
            values.push(options.systemKind);
            conditions.push(`system_kind = $${values.length}`);
        }
        if (options.bindingStatus) {
            values.push(options.bindingStatus);
            conditions.push(`binding_status = $${values.length}`);
        }
        if (options.isDefault !== undefined) {
            values.push(options.isDefault);
            conditions.push(`is_default = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        values.push(limitOf(options.limit));
        return many(`SELECT ${GSB_COLS} FROM world_server_game_system_bindings WHERE ${conditions.join(' AND ')} ORDER BY is_default DESC, updated_at DESC LIMIT $${values.length}`, values, rowToGameSystemBinding);
    }
    const listDefaultGameSystemBindingsByWorldServer = (worldServerId, options = {}) => listGameSystemBindingsByWorldServer(worldServerId, { ...options, isDefault: true });
    async function bindGameSystemToWorldServer(input) {
        const now = new Date().toISOString();
        const record = {
            bindingId: input.bindingId, worldServerId: input.worldServerId, gameSystemId: input.gameSystemId, displayName: input.displayName,
            systemKind: input.systemKind ?? 'template', bindingStatus: input.bindingStatus ?? 'enabled', isDefault: input.isDefault ?? false,
            rulesetTemplateId: input.rulesetTemplateId, currentRulesetVersionId: input.currentRulesetVersionId, config: input.config ?? {},
            enabledPackVersionIds: input.enabledPackVersionIds ?? [], schemaVersion: input.schemaVersion ?? 1, createdByUserId: input.createdByUserId, createdAt: now, updatedAt: now,
        };
        try {
            await executor.query(`INSERT INTO world_server_game_system_bindings (
           binding_id, world_server_id, game_system_id, display_name, system_kind, binding_status,
           is_default, ruleset_template_id, current_ruleset_version_id, config_payload,
           enabled_pack_version_ids, schema_version, created_by_user_id, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,$14)`, [record.bindingId, record.worldServerId, record.gameSystemId, record.displayName, record.systemKind, record.bindingStatus, record.isDefault, record.rulesetTemplateId ?? null, record.currentRulesetVersionId ?? null, JSON.stringify(record.config), JSON.stringify(record.enabledPackVersionIds), record.schemaVersion, record.createdByUserId ?? null, now]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    const updateWorldServerGameSystemBinding = (input) => one(`UPDATE world_server_game_system_bindings SET
         display_name = COALESCE($2, display_name),
         system_kind = COALESCE($3, system_kind),
         is_default = COALESCE($4, is_default),
         ruleset_template_id = COALESCE($5, ruleset_template_id),
         current_ruleset_version_id = COALESCE($6, current_ruleset_version_id),
         config_payload = COALESCE($7::jsonb, config_payload),
         enabled_pack_version_ids = COALESCE($8::jsonb, enabled_pack_version_ids),
         updated_at = $9
       WHERE binding_id = $1 RETURNING ${GSB_COLS}`, [input.bindingId, input.displayName ?? null, input.systemKind ?? null, input.isDefault ?? null, input.rulesetTemplateId ?? null, input.currentRulesetVersionId ?? null, input.config === undefined ? null : JSON.stringify(input.config), input.enabledPackVersionIds === undefined ? null : JSON.stringify(input.enabledPackVersionIds), new Date().toISOString()], rowToGameSystemBinding);
    const updateWorldServerGameSystemBindingStatus = (input) => one(`UPDATE world_server_game_system_bindings SET binding_status = $2, is_default = COALESCE($3, is_default), updated_at = $4 WHERE binding_id = $1 RETURNING ${GSB_COLS}`, [input.bindingId, input.bindingStatus, input.isDefault ?? null, new Date().toISOString()], rowToGameSystemBinding);
    const archiveWorldServerGameSystemBinding = (bindingId, archivedAt) => one(`UPDATE world_server_game_system_bindings SET archived_at = $2, updated_at = $2 WHERE binding_id = $1 RETURNING ${GSB_COLS}`, [bindingId, archivedAt ?? new Date().toISOString()], rowToGameSystemBinding);
    const restoreWorldServerGameSystemBinding = (bindingId) => one(`UPDATE world_server_game_system_bindings SET archived_at = NULL, updated_at = $2 WHERE binding_id = $1 RETURNING ${GSB_COLS}`, [bindingId, new Date().toISOString()], rowToGameSystemBinding);
    // ── Roles ──────────────────────────────────────────────────────────────────
    const getWorldServerRoleById = (roleId) => one(`SELECT ${ROLE_COLS} FROM world_server_roles WHERE role_id = $1 LIMIT 1`, [roleId], rowToRole);
    const getWorldServerRoleByKey = (worldServerId, roleKey) => one(`SELECT ${ROLE_COLS} FROM world_server_roles WHERE world_server_id = $1 AND role_key = $2 LIMIT 1`, [worldServerId, roleKey], rowToRole);
    async function listWorldServerRoles(worldServerId, options = {}) {
        const conditions = ['world_server_id = $1'];
        const values = [worldServerId];
        if (options.roleKind) {
            values.push(options.roleKind);
            conditions.push(`role_kind = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        values.push(limitOf(options.limit));
        return many(`SELECT ${ROLE_COLS} FROM world_server_roles WHERE ${conditions.join(' AND ')} ORDER BY sort_order ASC, created_at ASC LIMIT $${values.length}`, values, rowToRole);
    }
    async function createWorldServerRole(input) {
        const now = new Date().toISOString();
        const record = {
            roleId: input.roleId, worldServerId: input.worldServerId, roleKey: input.roleKey, displayName: input.displayName,
            roleKind: input.roleKind ?? 'custom', permissionsPayload: input.permissionsPayload ?? {}, isSystemRole: input.isSystemRole ?? false, sortOrder: input.sortOrder ?? 100, schemaVersion: input.schemaVersion ?? 1, createdAt: now, updatedAt: now,
        };
        try {
            await executor.query(`INSERT INTO world_server_roles (role_id, world_server_id, role_key, display_name, role_kind, permissions_payload, is_system_role, sort_order, schema_version, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$10)`, [record.roleId, record.worldServerId, record.roleKey, record.displayName, record.roleKind, JSON.stringify(record.permissionsPayload), record.isSystemRole, record.sortOrder, record.schemaVersion, now]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    const updateWorldServerRole = (input) => one(`UPDATE world_server_roles SET display_name = COALESCE($2, display_name), role_kind = COALESCE($3, role_kind), permissions_payload = COALESCE($4::jsonb, permissions_payload), sort_order = COALESCE($5, sort_order), updated_at = $6 WHERE role_id = $1 RETURNING ${ROLE_COLS}`, [input.roleId, input.displayName ?? null, input.roleKind ?? null, input.permissionsPayload === undefined ? null : JSON.stringify(input.permissionsPayload), input.sortOrder ?? null, new Date().toISOString()], rowToRole);
    const archiveWorldServerRole = (roleId, archivedAt) => one(`UPDATE world_server_roles SET archived_at = $2, updated_at = $2 WHERE role_id = $1 RETURNING ${ROLE_COLS}`, [roleId, archivedAt ?? new Date().toISOString()], rowToRole);
    const restoreWorldServerRole = (roleId) => one(`UPDATE world_server_roles SET archived_at = NULL, updated_at = $2 WHERE role_id = $1 RETURNING ${ROLE_COLS}`, [roleId, new Date().toISOString()], rowToRole);
    // ── Memberships ──────────────────────────────────────────────────────────────
    const getWorldServerMembershipById = (membershipId) => one(`SELECT ${MEMBERSHIP_COLS} FROM world_server_memberships WHERE membership_id = $1 LIMIT 1`, [membershipId], rowToMembership);
    const getWorldServerMembershipByUser = (worldServerId, userId) => one(`SELECT ${MEMBERSHIP_COLS} FROM world_server_memberships WHERE world_server_id = $1 AND user_id = $2 LIMIT 1`, [worldServerId, userId], rowToMembership);
    function listMembershipsWhere(column, value, options) {
        const conditions = [`${column} = $1`];
        const values = [value];
        if (options.membershipStatus) {
            values.push(options.membershipStatus);
            conditions.push(`membership_status = $${values.length}`);
        }
        if (options.roleKey) {
            values.push(options.roleKey);
            conditions.push(`role_key = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        values.push(limitOf(options.limit));
        return many(`SELECT ${MEMBERSHIP_COLS} FROM world_server_memberships WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToMembership);
    }
    const listWorldServerMemberships = (worldServerId, options = {}) => listMembershipsWhere('world_server_id', worldServerId, options);
    const listWorldServerMembershipsForUser = (userId, options = {}) => listMembershipsWhere('user_id', userId, options);
    async function createWorldServerMembership(input) {
        const now = new Date().toISOString();
        const record = {
            membershipId: input.membershipId, worldServerId: input.worldServerId, userId: input.userId, roleId: input.roleId, roleKey: input.roleKey ?? 'member',
            membershipStatus: input.membershipStatus ?? 'active', displayAlias: input.displayAlias, invitedByUserId: input.invitedByUserId, approvedByUserId: input.approvedByUserId,
            payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, joinedAt: input.joinedAt, createdAt: now, updatedAt: now,
        };
        try {
            await executor.query(`INSERT INTO world_server_memberships (membership_id, world_server_id, user_id, role_id, role_key, membership_status, display_alias, invited_by_user_id, approved_by_user_id, membership_payload, schema_version, joined_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$13)`, [record.membershipId, record.worldServerId, record.userId, record.roleId ?? null, record.roleKey, record.membershipStatus, record.displayAlias ?? null, record.invitedByUserId ?? null, record.approvedByUserId ?? null, JSON.stringify(record.payload), record.schemaVersion, record.joinedAt ?? null, now]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    const updateWorldServerMembership = (input) => one(`UPDATE world_server_memberships SET role_id = COALESCE($2, role_id), role_key = COALESCE($3, role_key), display_alias = COALESCE($4, display_alias), membership_payload = COALESCE($5::jsonb, membership_payload), updated_at = $6 WHERE membership_id = $1 RETURNING ${MEMBERSHIP_COLS}`, [input.membershipId, input.roleId ?? null, input.roleKey ?? null, input.displayAlias ?? null, input.payload === undefined ? null : JSON.stringify(input.payload), new Date().toISOString()], rowToMembership);
    const updateWorldServerMembershipStatus = (input) => one(`UPDATE world_server_memberships SET membership_status = $2, approved_by_user_id = COALESCE($3, approved_by_user_id), joined_at = COALESCE($4, joined_at), updated_at = $5 WHERE membership_id = $1 RETURNING ${MEMBERSHIP_COLS}`, [input.membershipId, input.membershipStatus, input.approvedByUserId ?? null, input.joinedAt ?? null, new Date().toISOString()], rowToMembership);
    const archiveWorldServerMembership = (membershipId, archivedAt) => one(`UPDATE world_server_memberships SET archived_at = $2, updated_at = $2 WHERE membership_id = $1 RETURNING ${MEMBERSHIP_COLS}`, [membershipId, archivedAt ?? new Date().toISOString()], rowToMembership);
    const restoreWorldServerMembership = (membershipId) => one(`UPDATE world_server_memberships SET archived_at = NULL, updated_at = $2 WHERE membership_id = $1 RETURNING ${MEMBERSHIP_COLS}`, [membershipId, new Date().toISOString()], rowToMembership);
    // ── Invites ──────────────────────────────────────────────────────────────────
    const getWorldServerInviteById = (inviteId) => one(`SELECT ${INVITE_COLS} FROM world_server_invites WHERE invite_id = $1 LIMIT 1`, [inviteId], rowToInvite);
    const getWorldServerInviteByCode = (inviteCode) => one(`SELECT ${INVITE_COLS} FROM world_server_invites WHERE invite_code = $1 LIMIT 1`, [inviteCode], rowToInvite);
    async function listWorldServerInvites(worldServerId, options = {}) {
        const conditions = ['world_server_id = $1'];
        const values = [worldServerId];
        if (options.inviteStatus) {
            values.push(options.inviteStatus);
            conditions.push(`invite_status = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        values.push(limitOf(options.limit));
        return many(`SELECT ${INVITE_COLS} FROM world_server_invites WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${values.length}`, values, rowToInvite);
    }
    async function createWorldServerInvite(input) {
        const now = new Date().toISOString();
        const record = {
            inviteId: input.inviteId, worldServerId: input.worldServerId, inviteCode: input.inviteCode, createdByUserId: input.createdByUserId, targetUserId: input.targetUserId, targetEmail: input.targetEmail,
            defaultRoleKey: input.defaultRoleKey ?? 'member', inviteStatus: input.inviteStatus ?? 'active', maxUses: input.maxUses, useCount: input.useCount ?? 0, expiresAt: input.expiresAt, payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, createdAt: now, updatedAt: now,
        };
        try {
            await executor.query(`INSERT INTO world_server_invites (invite_id, world_server_id, invite_code, created_by_user_id, target_user_id, target_email, default_role_key, invite_status, max_uses, use_count, expires_at, invite_payload, schema_version, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$14)`, [record.inviteId, record.worldServerId, record.inviteCode, record.createdByUserId, record.targetUserId ?? null, record.targetEmail ?? null, record.defaultRoleKey, record.inviteStatus, record.maxUses ?? null, record.useCount, record.expiresAt ?? null, JSON.stringify(record.payload), record.schemaVersion, now]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    const updateWorldServerInvite = (input) => one(`UPDATE world_server_invites SET target_user_id = COALESCE($2, target_user_id), target_email = COALESCE($3, target_email), default_role_key = COALESCE($4, default_role_key), max_uses = COALESCE($5, max_uses), use_count = COALESCE($6, use_count), expires_at = COALESCE($7, expires_at), invite_payload = COALESCE($8::jsonb, invite_payload), updated_at = $9 WHERE invite_id = $1 RETURNING ${INVITE_COLS}`, [input.inviteId, input.targetUserId ?? null, input.targetEmail ?? null, input.defaultRoleKey ?? null, input.maxUses ?? null, input.useCount ?? null, input.expiresAt ?? null, input.payload === undefined ? null : JSON.stringify(input.payload), new Date().toISOString()], rowToInvite);
    const updateWorldServerInviteStatus = (input) => one(`UPDATE world_server_invites SET invite_status = $2, updated_at = $3 WHERE invite_id = $1 RETURNING ${INVITE_COLS}`, [input.inviteId, input.inviteStatus, new Date().toISOString()], rowToInvite);
    const archiveWorldServerInvite = (inviteId, archivedAt) => one(`UPDATE world_server_invites SET archived_at = $2, updated_at = $2 WHERE invite_id = $1 RETURNING ${INVITE_COLS}`, [inviteId, archivedAt ?? new Date().toISOString()], rowToInvite);
    const restoreWorldServerInvite = (inviteId) => one(`UPDATE world_server_invites SET archived_at = NULL, updated_at = $2 WHERE invite_id = $1 RETURNING ${INVITE_COLS}`, [inviteId, new Date().toISOString()], rowToInvite);
    // ── Join requests ────────────────────────────────────────────────────────────
    const getWorldServerJoinRequestById = (joinRequestId) => one(`SELECT ${JOIN_REQUEST_COLS} FROM world_server_join_requests WHERE join_request_id = $1 LIMIT 1`, [joinRequestId], rowToJoinRequest);
    function listJoinRequestsWhere(column, value, options) {
        const conditions = [`${column} = $1`];
        const values = [value];
        if (options.requestStatus) {
            values.push(options.requestStatus);
            conditions.push(`request_status = $${values.length}`);
        }
        if (!options.includeArchived)
            conditions.push('archived_at IS NULL');
        values.push(limitOf(options.limit));
        return many(`SELECT ${JOIN_REQUEST_COLS} FROM world_server_join_requests WHERE ${conditions.join(' AND ')} ORDER BY requested_at DESC LIMIT $${values.length}`, values, rowToJoinRequest);
    }
    const listWorldServerJoinRequests = (worldServerId, options = {}) => listJoinRequestsWhere('world_server_id', worldServerId, options);
    const listWorldServerJoinRequestsForUser = (requesterUserId, options = {}) => listJoinRequestsWhere('requester_user_id', requesterUserId, options);
    async function createWorldServerJoinRequest(input) {
        const now = new Date().toISOString();
        const requestedAt = input.requestedAt ?? now;
        const record = {
            joinRequestId: input.joinRequestId, worldServerId: input.worldServerId, requesterUserId: input.requesterUserId, requestStatus: input.requestStatus ?? 'pending', requestMessage: input.requestMessage,
            requestedRoleKey: input.requestedRoleKey ?? 'member', payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, requestedAt, createdAt: now, updatedAt: now,
        };
        try {
            await executor.query(`INSERT INTO world_server_join_requests (join_request_id, world_server_id, requester_user_id, request_status, request_message, requested_role_key, request_payload, schema_version, requested_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$10)`, [record.joinRequestId, record.worldServerId, record.requesterUserId, record.requestStatus, record.requestMessage ?? null, record.requestedRoleKey, JSON.stringify(record.payload), record.schemaVersion, requestedAt, now]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    const updateWorldServerJoinRequestStatus = (input) => one(`UPDATE world_server_join_requests SET request_status = $2, reviewed_by_user_id = COALESCE($3, reviewed_by_user_id), response_message = COALESCE($4, response_message), reviewed_at = COALESCE($5, reviewed_at), updated_at = $6 WHERE join_request_id = $1 RETURNING ${JOIN_REQUEST_COLS}`, [input.joinRequestId, input.requestStatus, input.reviewedByUserId ?? null, input.responseMessage ?? null, input.reviewedAt ?? new Date().toISOString(), new Date().toISOString()], rowToJoinRequest);
    const archiveWorldServerJoinRequest = (joinRequestId, archivedAt) => one(`UPDATE world_server_join_requests SET archived_at = $2, updated_at = $2 WHERE join_request_id = $1 RETURNING ${JOIN_REQUEST_COLS}`, [joinRequestId, archivedAt ?? new Date().toISOString()], rowToJoinRequest);
    const restoreWorldServerJoinRequest = (joinRequestId) => one(`UPDATE world_server_join_requests SET archived_at = NULL, updated_at = $2 WHERE join_request_id = $1 RETURNING ${JOIN_REQUEST_COLS}`, [joinRequestId, new Date().toISOString()], rowToJoinRequest);
    async function checkReadiness() {
        try {
            const result = await executor.query(`SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN (
           'world_servers','world_server_campaign_bindings','world_server_game_system_bindings',
           'world_server_roles','world_server_memberships','world_server_invites','world_server_join_requests')`);
            const names = new Set(result.rows.map((row) => row.table_name));
            return {
                ok: true,
                value: {
                    worldServersTable: names.has('world_servers'),
                    campaignBindingsTable: names.has('world_server_campaign_bindings'),
                    gameSystemBindingsTable: names.has('world_server_game_system_bindings'),
                    rolesTable: names.has('world_server_roles'),
                    membershipsTable: names.has('world_server_memberships'),
                    invitesTable: names.has('world_server_invites'),
                    joinRequestsTable: names.has('world_server_join_requests'),
                },
            };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    return {
        getWorldServerById, getWorldServerByHandle, listWorldServersByOwner, listDiscoverableWorldServers,
        createWorldServer, updateWorldServerProfile, updateWorldServerSettings, archiveWorldServer, restoreWorldServer,
        getWorldServerCampaignBinding, getWorldServerCampaignBindingByPair, listCampaignBindingsByWorldServer,
        listWorldServerBindingsForCampaign, bindCampaignToWorldServer, updateWorldServerCampaignBinding,
        archiveWorldServerCampaignBinding, restoreWorldServerCampaignBinding,
        getWorldServerGameSystemBinding, getWorldServerGameSystemBindingBySystem, listGameSystemBindingsByWorldServer,
        listDefaultGameSystemBindingsByWorldServer, bindGameSystemToWorldServer, updateWorldServerGameSystemBinding,
        updateWorldServerGameSystemBindingStatus, archiveWorldServerGameSystemBinding, restoreWorldServerGameSystemBinding,
        getWorldServerRoleById, getWorldServerRoleByKey, listWorldServerRoles, createWorldServerRole,
        updateWorldServerRole, archiveWorldServerRole, restoreWorldServerRole,
        getWorldServerMembershipById, getWorldServerMembershipByUser, listWorldServerMemberships,
        listWorldServerMembershipsForUser, createWorldServerMembership, updateWorldServerMembership,
        updateWorldServerMembershipStatus, archiveWorldServerMembership, restoreWorldServerMembership,
        getWorldServerInviteById, getWorldServerInviteByCode, listWorldServerInvites, createWorldServerInvite,
        updateWorldServerInvite, updateWorldServerInviteStatus, archiveWorldServerInvite, restoreWorldServerInvite,
        getWorldServerJoinRequestById, listWorldServerJoinRequests, listWorldServerJoinRequestsForUser,
        createWorldServerJoinRequest, updateWorldServerJoinRequestStatus, archiveWorldServerJoinRequest,
        restoreWorldServerJoinRequest, checkReadiness,
    };
}
const defaultPostgresWorldServerRepository = createPostgresWorldServerRepository();
export async function getWorldServerById(worldServerId) {
    return defaultPostgresWorldServerRepository.getWorldServerById(worldServerId);
}
export async function getWorldServerByHandle(serverHandle) {
    return defaultPostgresWorldServerRepository.getWorldServerByHandle(serverHandle);
}
export async function listDiscoverableWorldServers(options) {
    return defaultPostgresWorldServerRepository.listDiscoverableWorldServers(options);
}
export async function getWorldServerInviteByCode(inviteCode) {
    return defaultPostgresWorldServerRepository.getWorldServerInviteByCode(inviteCode);
}
export async function getWorldServerGameSystemBinding(bindingId) {
    return defaultPostgresWorldServerRepository.getWorldServerGameSystemBinding(bindingId);
}
export async function checkPostgresWorldServerRepositoryReadiness() {
    return defaultPostgresWorldServerRepository.checkReadiness();
}
