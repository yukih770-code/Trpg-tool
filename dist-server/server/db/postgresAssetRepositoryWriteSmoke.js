import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresCampaignRepository } from '../adapters/postgresCampaignRepository.js';
import { createPostgresAssetRepository, } from '../adapters/postgresAssetRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import { checkPostgresAssetSchemaReadiness, } from './postgresAssetSchemaReadiness.js';
const SMOKE_OWNER_USER_ID = 'user_asset_write_smoke';
const SMOKE_OWNER_PROVIDER_KIND = 'localAnonymous';
const SMOKE_OWNER_PROVIDER_SUBJECT = 'asset-write-smoke';
const SMOKE_OWNER_HANDLE = 'asset-write-smoke';
const SMOKE_CAMPAIGN_ID = 'campaign_asset_write_smoke';
const SMOKE_STORAGE_REF_ID = 'storageRef_asset_write_smoke';
const SMOKE_ASSET_ID = 'asset_write_smoke';
function makeClientExecutor(clientQuery) {
    return {
        query: (text, values) => clientQuery(text, values),
    };
}
function failedStep(name, errorKind) {
    return { name, ok: false, errorKind };
}
async function runWritePath(executor) {
    const steps = [];
    // 1) Owner user (FK target).
    const userRepository = createPostgresUserRepository(executor, { useInternalTransactions: false });
    const createUser = await userRepository.createUserWithIdentity({
        identity: {
            userId: SMOKE_OWNER_USER_ID,
            providerKind: SMOKE_OWNER_PROVIDER_KIND,
            providerUserId: SMOKE_OWNER_PROVIDER_SUBJECT,
            displayName: 'Asset Write Smoke Owner',
        },
        profile: { handle: SMOKE_OWNER_HANDLE, displayName: 'Asset Write Smoke Owner', tags: [], visibility: 'private', pinned: [], sectionVisibility: {} },
    });
    if (createUser.ok === false)
        return [failedStep('createOwnerUser', createUser.error.kind)];
    steps.push({ name: 'createOwnerUser', ok: true });
    // 2) Campaign (optional association FK target).
    const campaignRepository = createPostgresCampaignRepository(executor, { useInternalTransactions: false });
    const createCampaign = await campaignRepository.createCampaign({
        campaignId: SMOKE_CAMPAIGN_ID,
        ownerId: SMOKE_OWNER_USER_ID,
        title: 'Asset Write Smoke Campaign',
        systemId: 'dnd5e-2024',
    });
    if (createCampaign.ok === false)
        return [...steps, failedStep('createCampaign', createCampaign.error.kind)];
    steps.push({ name: 'createCampaign', ok: true });
    const assetRepository = createPostgresAssetRepository(executor, { useInternalTransactions: false });
    // 3) Storage ref.
    const createdRef = await assetRepository.createStorageRef({
        storageRefId: SMOKE_STORAGE_REF_ID,
        ownerId: SMOKE_OWNER_USER_ID,
        providerKind: 's3Compatible',
        bucket: 'smoke-bucket',
        objectKey: 'smoke/object-key',
        url: 'https://example.invalid/smoke/object-key',
        contentHash: 'sha256:smoke',
        payload: { note: 'rollback-only' },
    });
    if (createdRef.ok === false)
        return [...steps, failedStep('createStorageRef', createdRef.error.kind)];
    steps.push({ name: 'createStorageRef', ok: true });
    const refById = await assetRepository.getStorageRefById(SMOKE_STORAGE_REF_ID);
    if (refById.ok === false)
        return [...steps, failedStep('getStorageRefById', refById.error.kind)];
    if (!refById.value || refById.value.storageRefId !== SMOKE_STORAGE_REF_ID) {
        return [...steps, failedStep('getStorageRefById', 'not_found')];
    }
    steps.push({ name: 'getStorageRefById', ok: true });
    const updatedRef = await assetRepository.updateStorageRef({
        storageRefId: SMOKE_STORAGE_REF_ID,
        contentHash: 'sha256:smoke-updated',
    });
    if (updatedRef.ok === false)
        return [...steps, failedStep('updateStorageRef', updatedRef.error.kind)];
    if (!updatedRef.value || updatedRef.value.contentHash !== 'sha256:smoke-updated') {
        return [...steps, failedStep('updateStorageRef', 'stale_read')];
    }
    steps.push({ name: 'updateStorageRef', ok: true });
    // 4) Asset metadata linked to storage ref + campaign.
    const createdAsset = await assetRepository.createAsset({
        assetId: SMOKE_ASSET_ID,
        ownerId: SMOKE_OWNER_USER_ID,
        campaignId: SMOKE_CAMPAIGN_ID,
        assetKind: 'map',
        title: 'Asset Write Smoke Map',
        description: 'Rollback-only write smoke asset.',
        mimeType: 'image/png',
        fileName: 'smoke-map.png',
        fileSizeBytes: 12345,
        storageRefId: SMOKE_STORAGE_REF_ID,
        externalUrl: 'https://example.invalid/smoke-map.png',
        payload: { note: 'rollback-only' },
    });
    if (createdAsset.ok === false)
        return [...steps, failedStep('createAsset', createdAsset.error.kind)];
    steps.push({ name: 'createAsset', ok: true });
    const assetById = await assetRepository.getAssetById(SMOKE_ASSET_ID);
    if (assetById.ok === false)
        return [...steps, failedStep('getAssetById', assetById.error.kind)];
    if (!assetById.value || assetById.value.assetId !== SMOKE_ASSET_ID) {
        return [...steps, failedStep('getAssetById', 'not_found')];
    }
    steps.push({ name: 'getAssetById', ok: true });
    const byOwner = await assetRepository.listAssetsByOwner(SMOKE_OWNER_USER_ID);
    if (byOwner.ok === false)
        return [...steps, failedStep('listAssetsByOwner', byOwner.error.kind)];
    if (!byOwner.value.some((a) => a.assetId === SMOKE_ASSET_ID)) {
        return [...steps, failedStep('listAssetsByOwner', 'not_found')];
    }
    steps.push({ name: 'listAssetsByOwner', ok: true });
    const byCampaign = await assetRepository.listAssetsByCampaign(SMOKE_CAMPAIGN_ID);
    if (byCampaign.ok === false)
        return [...steps, failedStep('listAssetsByCampaign', byCampaign.error.kind)];
    if (!byCampaign.value.some((a) => a.assetId === SMOKE_ASSET_ID)) {
        return [...steps, failedStep('listAssetsByCampaign', 'not_found')];
    }
    steps.push({ name: 'listAssetsByCampaign', ok: true });
    const updatedAsset = await assetRepository.updateAsset({
        assetId: SMOKE_ASSET_ID,
        title: 'Asset Write Smoke Map Updated',
        externalUrl: 'https://example.invalid/smoke-map-updated.png',
        payload: { note: 'rollback-only', updated: true },
    });
    if (updatedAsset.ok === false)
        return [...steps, failedStep('updateAsset', updatedAsset.error.kind)];
    if (!updatedAsset.value || updatedAsset.value.title !== 'Asset Write Smoke Map Updated') {
        return [...steps, failedStep('updateAsset', 'stale_read')];
    }
    steps.push({ name: 'updateAsset', ok: true });
    const archivedAsset = await assetRepository.archiveAsset(SMOKE_ASSET_ID);
    if (archivedAsset.ok === false)
        return [...steps, failedStep('archiveAsset', archivedAsset.error.kind)];
    if (!archivedAsset.value || !archivedAsset.value.archivedAt) {
        return [...steps, failedStep('archiveAsset', 'stale_read')];
    }
    steps.push({ name: 'archiveAsset', ok: true });
    const restoredAsset = await assetRepository.restoreAsset(SMOKE_ASSET_ID);
    if (restoredAsset.ok === false)
        return [...steps, failedStep('restoreAsset', restoredAsset.error.kind)];
    if (!restoredAsset.value || restoredAsset.value.archivedAt) {
        return [...steps, failedStep('restoreAsset', 'stale_read')];
    }
    steps.push({ name: 'restoreAsset', ok: true });
    const archivedRef = await assetRepository.archiveStorageRef(SMOKE_STORAGE_REF_ID);
    if (archivedRef.ok === false)
        return [...steps, failedStep('archiveStorageRef', archivedRef.error.kind)];
    if (!archivedRef.value || !archivedRef.value.archivedAt) {
        return [...steps, failedStep('archiveStorageRef', 'stale_read')];
    }
    steps.push({ name: 'archiveStorageRef', ok: true });
    const restoredRef = await assetRepository.restoreStorageRef(SMOKE_STORAGE_REF_ID);
    if (restoredRef.ok === false)
        return [...steps, failedStep('restoreStorageRef', restoredRef.error.kind)];
    if (!restoredRef.value || restoredRef.value.archivedAt) {
        return [...steps, failedStep('restoreStorageRef', 'stale_read')];
    }
    steps.push({ name: 'restoreStorageRef', ok: true });
    return steps;
}
export async function runPostgresAssetRepositoryRollbackWriteSmoke() {
    const database = await checkPostgresHealth();
    if (database.configured === false) {
        return { status: 'not_configured', database, schema: { status: 'not_configured' }, transaction: { attempted: false, rolledBack: false }, steps: [] };
    }
    if (database.status !== 'ok') {
        return {
            status: 'unreachable',
            database,
            schema: { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs },
            transaction: { attempted: false, rolledBack: false },
            steps: [],
            errorKind: database.errorKind,
        };
    }
    const schema = await checkPostgresAssetSchemaReadiness();
    if (schema.status !== 'ready') {
        const status = schema.status === 'schema_missing'
            ? 'schema_missing'
            : schema.status === 'user_schema_missing'
                ? 'user_schema_missing'
                : schema.status === 'campaign_schema_missing'
                    ? 'campaign_schema_missing'
                    : schema.status;
        return { status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
    }
    const steps = [];
    let rolledBack = false;
    try {
        const transactionSteps = await withPostgresClient(async (client) => {
            await client.query('BEGIN');
            try {
                return await runWritePath(makeClientExecutor((text, values) => client.query(text, values ? [...values] : undefined)));
            }
            finally {
                await client.query('ROLLBACK');
                rolledBack = true;
            }
        });
        steps.push(...transactionSteps);
        const failed = steps.find((step) => !step.ok);
        return {
            status: failed ? 'repository_failed' : 'rolled_back',
            database,
            schema,
            transaction: { attempted: true, rolledBack },
            steps,
            errorKind: failed?.errorKind,
        };
    }
    catch (_error) {
        return {
            status: 'transaction_failed',
            database,
            schema,
            transaction: { attempted: true, rolledBack },
            steps,
            errorKind: 'transaction_failed',
        };
    }
}
