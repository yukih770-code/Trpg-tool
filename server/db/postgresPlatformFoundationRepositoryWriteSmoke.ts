import type { QueryResultRow } from 'pg';

import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresCampaignRepository } from '../adapters/postgresCampaignRepository.js';
import { createPostgresActorRepository } from '../adapters/postgresActorRepository.js';
import { createPostgresWorldServerRepository } from '../adapters/postgresWorldServerRepository.js';
import {
  createPostgresPlatformFoundationRepository,
  type PostgresPlatformFoundationRepositoryExecutor,
} from '../adapters/postgresPlatformFoundationRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import {
  checkPostgresPlatformFoundationSchemaReadiness,
  type PostgresPlatformFoundationSchemaReadinessResult,
} from './postgresPlatformFoundationSchemaReadiness.js';

/**
 * Rollback-only write smoke for the remaining platform DB foundation. It commits
 * nothing and leaves no rows behind.
 */

export type PostgresPlatformFoundationWriteSmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'base_schema_missing'
  | 'schema_missing'
  | 'rolled_back'
  | 'repository_failed'
  | 'transaction_failed'
  | 'error';

export interface PostgresPlatformFoundationWriteSmokeStep {
  name: string;
  ok: boolean;
  errorKind?: string;
}

export interface PostgresPlatformFoundationWriteSmokeResult {
  status: PostgresPlatformFoundationWriteSmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresPlatformFoundationSchemaReadinessResult;
  transaction?: { attempted: boolean; rolledBack: boolean };
  steps: PostgresPlatformFoundationWriteSmokeStep[];
  errorKind?: string;
}

const USER_ID = 'user_platform_foundation_write_smoke';
const CAMPAIGN_ID = 'campaign_platform_foundation_write_smoke';
const ACTOR_ID = 'actor_platform_foundation_write_smoke';
const WORLD_SERVER_ID = 'worldServer_platform_foundation_write_smoke';
const WORLD_SERVER_HANDLE = 'platform-foundation-write-smoke';

function makeClientExecutor(
  clientQuery: PostgresPlatformFoundationRepositoryExecutor['query'],
): PostgresPlatformFoundationRepositoryExecutor {
  return {
    query: <T extends QueryResultRow>(text: string, values?: readonly unknown[]) => clientQuery<T>(text, values),
  };
}

function failedStep(name: string, errorKind: string): PostgresPlatformFoundationWriteSmokeStep {
  return { name, ok: false, errorKind };
}

async function createFixtures(executor: PostgresPlatformFoundationRepositoryExecutor): Promise<PostgresPlatformFoundationWriteSmokeStep[]> {
  const steps: PostgresPlatformFoundationWriteSmokeStep[] = [];
  const ok = (name: string) => steps.push({ name, ok: true });

  const userRepo = createPostgresUserRepository(executor, { useInternalTransactions: false });
  const user = await userRepo.createUserWithIdentity({
    identity: {
      userId: USER_ID,
      providerKind: 'localAnonymous',
      providerUserId: 'platform-foundation-smoke',
      displayName: 'Platform Foundation Smoke',
    },
    profile: {
      handle: 'platform-foundation-smoke',
      displayName: 'Platform Foundation Smoke',
      tags: [],
      visibility: 'private',
      pinned: [],
      sectionVisibility: {},
    },
  });
  if (user.ok === false) return [...steps, failedStep('createUserWithIdentity', user.error.kind)];
  ok('createUserWithIdentity');

  const campaignRepo = createPostgresCampaignRepository(executor, { useInternalTransactions: false });
  const campaign = await campaignRepo.createCampaign({
    campaignId: CAMPAIGN_ID,
    ownerId: USER_ID,
    title: 'Platform Foundation Smoke Campaign',
    systemId: 'dnd5e-2024',
  });
  if (campaign.ok === false) return [...steps, failedStep('createCampaign', campaign.error.kind)];
  ok('createCampaign');

  const actorRepo = createPostgresActorRepository(executor, { useInternalTransactions: false });
  const actor = await actorRepo.createActor({
    actorId: ACTOR_ID,
    ownerId: USER_ID,
    systemId: 'dnd5e-2024',
    localActorId: 'platform-foundation-local-actor',
    displayName: 'Platform Foundation Smoke Actor',
  });
  if (actor.ok === false) return [...steps, failedStep('createActor', actor.error.kind)];
  ok('createActor');

  const worldRepo = createPostgresWorldServerRepository(executor, { useInternalTransactions: false });
  const world = await worldRepo.createWorldServer({
    worldServerId: WORLD_SERVER_ID,
    ownerId: USER_ID,
    serverHandle: WORLD_SERVER_HANDLE,
    displayName: 'Platform Foundation Smoke Server',
  });
  if (world.ok === false) return [...steps, failedStep('createWorldServer', world.error.kind)];
  ok('createWorldServer');

  return steps;
}

async function runWritePath(executor: PostgresPlatformFoundationRepositoryExecutor): Promise<PostgresPlatformFoundationWriteSmokeStep[]> {
  const steps = await createFixtures(executor);
  if (steps.some((step) => !step.ok)) return steps;
  const ok = (name: string) => steps.push({ name, ok: true });
  const repo = createPostgresPlatformFoundationRepository(executor);

  const session = await repo.createAuthSession({ sessionId: 'authSession_platform_foundation_write_smoke', userId: USER_ID, metadata: { smoke: true } });
  if (session.ok === false || !session.value) return [...steps, failedStep('createAuthSession', session.ok === false ? session.error.kind : 'not_found')];
  ok('createAuthSession');
  const sessionStatus = await repo.updateAuthSessionStatus(session.value.sessionId, 'revoked', new Date().toISOString());
  if (sessionStatus.ok === false || !sessionStatus.value || sessionStatus.value.sessionStatus !== 'revoked') return [...steps, failedStep('updateAuthSessionStatus', sessionStatus.ok === false ? sessionStatus.error.kind : 'stale_read')];
  ok('updateAuthSessionStatus');

  const settings = await repo.createWorldServerSettingsVersion({
    settingsVersionId: 'settingsVersion_platform_foundation_write_smoke',
    worldServerId: WORLD_SERVER_ID,
    createdByUserId: USER_ID,
    versionNumber: 1,
    settingsPayload: { voice: 'table' },
    softUpdatePolicyPayload: { oldVersionRoomEntry: 'warn' },
  });
  if (settings.ok === false || !settings.value) return [...steps, failedStep('createWorldServerSettingsVersion', settings.ok === false ? settings.error.kind : 'not_found')];
  ok('createWorldServerSettingsVersion');

  const pack = await repo.createCompendiumPack({ packId: 'pack_platform_foundation_write_smoke', ownerId: USER_ID, worldServerId: WORLD_SERVER_ID, displayName: 'Smoke Pack' });
  if (pack.ok === false || !pack.value) return [...steps, failedStep('createCompendiumPack', pack.ok === false ? pack.error.kind : 'not_found')];
  ok('createCompendiumPack');
  const archivedPack = await repo.archiveCompendiumPack(pack.value.packId);
  if (archivedPack.ok === false || !archivedPack.value?.archivedAt) return [...steps, failedStep('archiveCompendiumPack', archivedPack.ok === false ? archivedPack.error.kind : 'archive_failed')];
  ok('archiveCompendiumPack');
  const restoredPack = await repo.restoreCompendiumPack(pack.value.packId);
  if (restoredPack.ok === false || restoredPack.value?.archivedAt) return [...steps, failedStep('restoreCompendiumPack', restoredPack.ok === false ? restoredPack.error.kind : 'restore_failed')];
  ok('restoreCompendiumPack');

  const instance = await repo.createCampaignActorInstance({
    campaignActorInstanceId: 'campaignActorInstance_platform_foundation_write_smoke',
    campaignId: CAMPAIGN_ID,
    sourceActorId: ACTOR_ID,
    ownerId: USER_ID,
    displayName: 'Smoke Actor Instance',
    snapshotHash: 'hash:smoke',
  });
  if (instance.ok === false || !instance.value) return [...steps, failedStep('createCampaignActorInstance', instance.ok === false ? instance.error.kind : 'not_found')];
  ok('createCampaignActorInstance');

  const room = await repo.createRoomRecord({
    roomRecordId: 'roomRecord_platform_foundation_write_smoke',
    roomId: 'room_platform_foundation_write_smoke',
    worldServerId: WORLD_SERVER_ID,
    campaignId: CAMPAIGN_ID,
    hostUserId: USER_ID,
    roomCode: 'SMOKE',
  });
  if (room.ok === false || !room.value) return [...steps, failedStep('createRoomRecord', room.ok === false ? room.error.kind : 'not_found')];
  ok('createRoomRecord');
  const closedRoom = await repo.updateRoomRecordStatus(room.value.roomRecordId, 'closed', new Date().toISOString());
  if (closedRoom.ok === false || !closedRoom.value || closedRoom.value.roomStatus !== 'closed') return [...steps, failedStep('updateRoomRecordStatus', closedRoom.ok === false ? closedRoom.error.kind : 'stale_read')];
  ok('updateRoomRecordStatus');

  const document = await repo.createContentDocument({
    contentDocumentId: 'contentDocument_platform_foundation_write_smoke',
    ownerId: USER_ID,
    worldServerId: WORLD_SERVER_ID,
    campaignId: CAMPAIGN_ID,
    documentKind: 'handout',
    title: 'Smoke Handout',
    bodyText: 'rollback-only smoke document',
  });
  if (document.ok === false || !document.value) return [...steps, failedStep('createContentDocument', document.ok === false ? document.error.kind : 'not_found')];
  ok('createContentDocument');

  const audit = await repo.createServerAuditLog({
    auditLogId: 'auditLog_platform_foundation_write_smoke',
    worldServerId: WORLD_SERVER_ID,
    campaignId: CAMPAIGN_ID,
    actorUserId: USER_ID,
    actionKind: 'smoke.audit',
    targetKind: 'world_server',
    targetId: WORLD_SERVER_ID,
    metadata: { reasonCode: 'smoke_only' },
  });
  if (audit.ok === false || !audit.value) return [...steps, failedStep('createServerAuditLog', audit.ok === false ? audit.error.kind : 'not_found')];
  ok('createServerAuditLog');

  const notification = await repo.createUserNotification({
    notificationId: 'notification_platform_foundation_write_smoke',
    userId: USER_ID,
    worldServerId: WORLD_SERVER_ID,
    notificationKind: 'join_request',
    title: 'Smoke notification',
  });
  if (notification.ok === false || !notification.value) return [...steps, failedStep('createUserNotification', notification.ok === false ? notification.error.kind : 'not_found')];
  ok('createUserNotification');
  const readNotification = await repo.updateUserNotificationStatus(notification.value.notificationId, 'read', new Date().toISOString());
  if (readNotification.ok === false || !readNotification.value || readNotification.value.notificationStatus !== 'read') return [...steps, failedStep('updateUserNotificationStatus', readNotification.ok === false ? readNotification.error.kind : 'stale_read')];
  ok('updateUserNotificationStatus');

  return steps;
}

export async function runPostgresPlatformFoundationRepositoryRollbackWriteSmoke(): Promise<PostgresPlatformFoundationWriteSmokeResult> {
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

  const schema = await checkPostgresPlatformFoundationSchemaReadiness();
  if (schema.status !== 'ready') {
    return { status: schema.status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
  }

  const steps: PostgresPlatformFoundationWriteSmokeStep[] = [];
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
