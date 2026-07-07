import type { QueryResultRow } from 'pg';

import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import {
  createPostgresCampaignRepository,
  type PostgresCampaignRepositoryExecutor,
} from '../adapters/postgresCampaignRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import {
  checkPostgresCampaignSchemaReadiness,
  type PostgresCampaignSchemaReadinessResult,
} from './postgresCampaignSchemaReadiness.js';

/**
 * Rollback-only Campaign write smoke (P5.11C). Inside a single transaction it
 * creates a deterministic smoke OWNER user (reusing PostgresUserRepository with
 * the same client executor), then create/read/list/update/archive/restore a smoke
 * campaign, and ALWAYS rolls back. No permanent rows, no commit path, no raw DB
 * error or connection string in the output.
 */

export type PostgresCampaignWriteSmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'schema_missing'
  | 'rolled_back'
  | 'repository_failed'
  | 'transaction_failed'
  | 'error';

export interface PostgresCampaignWriteSmokeStep {
  name: string;
  ok: boolean;
  errorKind?: string;
}

export interface PostgresCampaignWriteSmokeResult {
  status: PostgresCampaignWriteSmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresCampaignSchemaReadinessResult;
  transaction?: { attempted: boolean; rolledBack: boolean };
  steps: PostgresCampaignWriteSmokeStep[];
  errorKind?: string;
}

const SMOKE_OWNER_USER_ID = 'user_campaign_write_smoke';
const SMOKE_OWNER_PROVIDER_KIND = 'localAnonymous';
const SMOKE_OWNER_PROVIDER_SUBJECT = 'campaign-write-smoke';
const SMOKE_OWNER_HANDLE = 'campaign-write-smoke';
const SMOKE_CAMPAIGN_ID = 'campaign_write_smoke';

function makeClientExecutor(
  clientQuery: PostgresCampaignRepositoryExecutor['query'],
): PostgresCampaignRepositoryExecutor {
  return {
    query: <T extends QueryResultRow>(text: string, values?: readonly unknown[]) => clientQuery<T>(text, values),
  };
}

function failedStep(name: string, errorKind: string): PostgresCampaignWriteSmokeStep {
  return { name, ok: false, errorKind };
}

async function runWritePath(
  executor: PostgresCampaignRepositoryExecutor,
): Promise<PostgresCampaignWriteSmokeStep[]> {
  const steps: PostgresCampaignWriteSmokeStep[] = [];

  // 1) Create the smoke owner user (FK target) with the same transactional executor.
  const userRepository = createPostgresUserRepository(executor, { useInternalTransactions: false });
  const createUser = await userRepository.createUserWithIdentity({
    identity: {
      userId: SMOKE_OWNER_USER_ID,
      providerKind: SMOKE_OWNER_PROVIDER_KIND,
      providerUserId: SMOKE_OWNER_PROVIDER_SUBJECT,
      displayName: 'Campaign Write Smoke Owner',
    },
    profile: { handle: SMOKE_OWNER_HANDLE, displayName: 'Campaign Write Smoke Owner', tags: [], visibility: 'private', pinned: [], sectionVisibility: {} },
  });
  if (createUser.ok === false) return [failedStep('createOwnerUser', createUser.error.kind)];
  steps.push({ name: 'createOwnerUser', ok: true });

  const campaignRepository = createPostgresCampaignRepository(executor, { useInternalTransactions: false });

  const created = await campaignRepository.createCampaign({
    campaignId: SMOKE_CAMPAIGN_ID,
    ownerId: SMOKE_OWNER_USER_ID,
    title: 'Campaign Write Smoke',
    description: 'Rollback-only write smoke campaign.',
    systemId: 'dnd5e-2024',
    status: 'draft',
    payload: { note: 'rollback-only' },
  });
  if (created.ok === false) return [...steps, failedStep('createCampaign', created.error.kind)];
  steps.push({ name: 'createCampaign', ok: true });

  const byId = await campaignRepository.getCampaignById(SMOKE_CAMPAIGN_ID);
  if (byId.ok === false) return [...steps, failedStep('getCampaignById', byId.error.kind)];
  if (!byId.value || byId.value.campaignId !== SMOKE_CAMPAIGN_ID) {
    return [...steps, failedStep('getCampaignById', 'not_found')];
  }
  steps.push({ name: 'getCampaignById', ok: true });

  const listed = await campaignRepository.listCampaignsByOwner(SMOKE_OWNER_USER_ID);
  if (listed.ok === false) return [...steps, failedStep('listCampaignsByOwner', listed.error.kind)];
  if (!listed.value.some((c) => c.campaignId === SMOKE_CAMPAIGN_ID)) {
    return [...steps, failedStep('listCampaignsByOwner', 'not_found')];
  }
  steps.push({ name: 'listCampaignsByOwner', ok: true });

  const updated = await campaignRepository.updateCampaign({
    campaignId: SMOKE_CAMPAIGN_ID,
    title: 'Campaign Write Smoke Updated',
    payload: { note: 'rollback-only', updated: true },
  });
  if (updated.ok === false) return [...steps, failedStep('updateCampaign', updated.error.kind)];
  if (!updated.value || updated.value.title !== 'Campaign Write Smoke Updated') {
    return [...steps, failedStep('updateCampaign', 'stale_read')];
  }
  steps.push({ name: 'updateCampaign', ok: true });

  const archived = await campaignRepository.archiveCampaign(SMOKE_CAMPAIGN_ID);
  if (archived.ok === false) return [...steps, failedStep('archiveCampaign', archived.error.kind)];
  if (!archived.value || archived.value.lifecycleStatus !== 'archived') {
    return [...steps, failedStep('archiveCampaign', 'stale_read')];
  }
  steps.push({ name: 'archiveCampaign', ok: true });

  const restored = await campaignRepository.restoreCampaign(SMOKE_CAMPAIGN_ID);
  if (restored.ok === false) return [...steps, failedStep('restoreCampaign', restored.error.kind)];
  if (!restored.value || restored.value.lifecycleStatus !== 'active') {
    return [...steps, failedStep('restoreCampaign', 'stale_read')];
  }
  steps.push({ name: 'restoreCampaign', ok: true });

  return steps;
}

export async function runPostgresCampaignRepositoryRollbackWriteSmoke(): Promise<PostgresCampaignWriteSmokeResult> {
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

  const schema = await checkPostgresCampaignSchemaReadiness();
  if (schema.status !== 'ready') {
    const status: PostgresCampaignWriteSmokeStatus =
      schema.status === 'schema_missing'
        ? 'schema_missing'
        : schema.status === 'user_schema_missing'
          ? 'user_schema_missing'
          : schema.status;
    return { status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
  }

  const steps: PostgresCampaignWriteSmokeStep[] = [];
  let rolledBack = false;
  try {
    const transactionSteps = await withPostgresClient(async (client) => {
      await client.query('BEGIN');
      try {
        return await runWritePath(
          makeClientExecutor((text, values) => client.query(text, values ? [...values] : undefined)),
        );
      } finally {
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
  } catch (_error) {
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
