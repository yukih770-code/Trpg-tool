import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';
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
function toStatus(value) {
    return value === 'active' ? 'active' : 'draft';
}
function toLifecycle(value) {
    return value === 'archived' || value === 'trashed' ? value : 'active';
}
function rowToCampaign(row) {
    return {
        campaignId: row.campaign_id,
        ownerId: row.owner_id,
        title: row.title,
        description: row.description ?? undefined,
        systemId: row.system_id,
        status: toStatus(row.status),
        lifecycleStatus: toLifecycle(row.lifecycle_status),
        payload: toPayload(row.campaign_payload),
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function mapRepositoryError(error) {
    if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
        return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
    }
    if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
        return { ok: false, error: { kind: 'schema_missing', message: 'Campaign repository table is missing.' } };
    }
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === '23505') {
        return { ok: false, error: { kind: 'conflict', message: 'Campaign already exists.' } };
    }
    if (code === '23503') {
        return { ok: false, error: { kind: 'conflict', message: 'Campaign owner does not exist.' } };
    }
    if (code === '42P01') {
        return { ok: false, error: { kind: 'schema_missing', message: 'Campaign repository table is missing.' } };
    }
    const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
    return { ok: false, error: { kind: 'database_error', message: 'Campaign repository query failed.', retryable } };
}
const CAMPAIGN_SELECT = `
  SELECT
    campaign_id,
    owner_id,
    title,
    description,
    system_id,
    status,
    lifecycle_status,
    campaign_payload,
    schema_version,
    created_at,
    updated_at,
    archived_at
  FROM campaigns
`;
const defaultExecutor = {
    query: (text, values) => queryPostgres(text, values),
};
export function createPostgresCampaignRepository(executor = defaultExecutor, _options = {}) {
    async function getCampaignById(campaignId) {
        try {
            const result = await executor.query(`${CAMPAIGN_SELECT} WHERE campaign_id = $1 LIMIT 1`, [campaignId]);
            return { ok: true, value: result.rows[0] ? rowToCampaign(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listCampaignsByOwner(ownerId, options = {}) {
        const lifecycles = ['active'];
        if (options.includeArchived)
            lifecycles.push('archived');
        if (options.includeTrashed)
            lifecycles.push('trashed');
        const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 200;
        try {
            const result = await executor.query(`${CAMPAIGN_SELECT}
         WHERE owner_id = $1 AND lifecycle_status = ANY($2::text[])
         ORDER BY updated_at DESC
         LIMIT $3`, [ownerId, lifecycles, limit]);
            return { ok: true, value: result.rows.map(rowToCampaign) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function createCampaign(input) {
        const now = new Date().toISOString();
        const record = {
            campaignId: input.campaignId,
            ownerId: input.ownerId,
            title: input.title,
            description: input.description,
            systemId: input.systemId,
            status: input.status ?? 'draft',
            lifecycleStatus: input.lifecycleStatus ?? 'active',
            payload: input.payload ?? {},
            schemaVersion: input.schemaVersion ?? 1,
            createdAt: now,
            updatedAt: now,
        };
        try {
            await executor.query(`
          INSERT INTO campaigns (
            campaign_id, owner_id, title, description, system_id,
            status, lifecycle_status, campaign_payload, schema_version,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $10)
        `, [
                record.campaignId,
                record.ownerId,
                record.title,
                record.description ?? null,
                record.systemId,
                record.status,
                record.lifecycleStatus,
                JSON.stringify(record.payload),
                record.schemaVersion,
                now,
            ]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function updateCampaign(input) {
        const now = new Date().toISOString();
        try {
            const result = await executor.query(`
          UPDATE campaigns SET
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            status = COALESCE($4, status),
            campaign_payload = COALESCE($5::jsonb, campaign_payload),
            updated_at = $6
          WHERE campaign_id = $1
          RETURNING
            campaign_id, owner_id, title, description, system_id,
            status, lifecycle_status, campaign_payload, schema_version,
            created_at, updated_at, archived_at
        `, [
                input.campaignId,
                input.title ?? null,
                input.description ?? null,
                input.status ?? null,
                input.payload === undefined ? null : JSON.stringify(input.payload),
                now,
            ]);
            return { ok: true, value: result.rows[0] ? rowToCampaign(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function archiveCampaign(campaignId, archivedAt) {
        const at = archivedAt ?? new Date().toISOString();
        try {
            const result = await executor.query(`
          UPDATE campaigns SET
            lifecycle_status = 'archived',
            archived_at = $2,
            updated_at = $2
          WHERE campaign_id = $1
          RETURNING
            campaign_id, owner_id, title, description, system_id,
            status, lifecycle_status, campaign_payload, schema_version,
            created_at, updated_at, archived_at
        `, [campaignId, at]);
            return { ok: true, value: result.rows[0] ? rowToCampaign(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function restoreCampaign(campaignId) {
        const now = new Date().toISOString();
        try {
            const result = await executor.query(`
          UPDATE campaigns SET
            lifecycle_status = 'active',
            archived_at = NULL,
            updated_at = $2
          WHERE campaign_id = $1
          RETURNING
            campaign_id, owner_id, title, description, system_id,
            status, lifecycle_status, campaign_payload, schema_version,
            created_at, updated_at, archived_at
        `, [campaignId, now]);
            return { ok: true, value: result.rows[0] ? rowToCampaign(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function checkReadiness() {
        try {
            const result = await executor.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'campaigns'
        `);
            return { ok: true, value: { campaignsTable: result.rows.length > 0 } };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    return {
        getCampaignById,
        listCampaignsByOwner,
        createCampaign,
        updateCampaign,
        archiveCampaign,
        restoreCampaign,
        checkReadiness,
    };
}
const defaultPostgresCampaignRepository = createPostgresCampaignRepository();
export async function getCampaignById(campaignId) {
    return defaultPostgresCampaignRepository.getCampaignById(campaignId);
}
export async function listCampaignsByOwner(ownerId, options) {
    return defaultPostgresCampaignRepository.listCampaignsByOwner(ownerId, options);
}
export async function checkPostgresCampaignRepositoryReadiness() {
    return defaultPostgresCampaignRepository.checkReadiness();
}
