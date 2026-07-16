import type { QueryResultRow } from 'pg';

import { createPostgresCampaignRepository } from '../adapters/postgresCampaignRepository.js';
import {
  createPostgresSceneStateRepository,
  type SceneStateRepositoryExecutor,
} from '../adapters/postgresSceneStateRepository.js';
import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresWorldServerRepository } from '../adapters/postgresWorldServerRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import {
  checkPostgresSceneStateSchemaReadiness,
  type PostgresSceneStateSchemaReadinessResult,
} from './postgresSceneStateSchemaReadiness.js';

export type PostgresSceneStateWriteSmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'runtime_schema_missing'
  | 'world_schema_missing'
  | 'schema_missing'
  | 'rolled_back'
  | 'repository_failed'
  | 'transaction_failed'
  | 'error';

export interface PostgresSceneStateWriteSmokeStep {
  name: string;
  ok: boolean;
  errorKind?: string;
}

export interface PostgresSceneStateWriteSmokeResult {
  status: PostgresSceneStateWriteSmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresSceneStateSchemaReadinessResult;
  transaction: { attempted: boolean; rolledBack: boolean };
  steps: PostgresSceneStateWriteSmokeStep[];
  errorKind?: string;
}

const USER_ID = 'user_scene_state_write_smoke';
const CAMPAIGN_ID = 'campaign_scene_state_write_smoke';
const WORLD_SERVER_ID = 'worldServer_scene_state_write_smoke';
const ROOM_ID = 'room_scene_state_write_smoke';
const SOURCE_ID = 'sceneState_write_smoke_source';
const COPY_ID = 'sceneState_write_smoke_copy';

function executorOf(clientQuery: SceneStateRepositoryExecutor['query']): SceneStateRepositoryExecutor {
  return {
    query: <T extends QueryResultRow>(text: string, values?: readonly unknown[]) => clientQuery<T>(text, values),
  };
}

function failed(name: string, errorKind: string): PostgresSceneStateWriteSmokeStep {
  return { name, ok: false, errorKind };
}

async function runWritePath(executor: SceneStateRepositoryExecutor): Promise<PostgresSceneStateWriteSmokeStep[]> {
  const steps: PostgresSceneStateWriteSmokeStep[] = [];
  const ok = (name: string) => steps.push({ name, ok: true });

  const users = createPostgresUserRepository(executor, { useInternalTransactions: false });
  const user = await users.createUserWithIdentity({
    identity: {
      userId: USER_ID,
      providerKind: 'localAnonymous',
      providerUserId: 'scene-state-write-smoke',
      displayName: 'Scene State Smoke Owner',
    },
    profile: {
      handle: 'scene-state-write-smoke',
      displayName: 'Scene State Smoke Owner',
      tags: [],
      visibility: 'private',
      pinned: [],
      sectionVisibility: {},
    },
  });
  if (user.ok === false) return [failed('createUserWithIdentity', user.error.kind)];
  ok('createUserWithIdentity');

  const campaigns = createPostgresCampaignRepository(executor, { useInternalTransactions: false });
  const campaign = await campaigns.createCampaign({
    campaignId: CAMPAIGN_ID,
    ownerId: USER_ID,
    title: 'Scene State Smoke Campaign',
    systemId: 'dnd5e-2024',
  });
  if (campaign.ok === false) return [...steps, failed('createCampaign', campaign.error.kind)];
  ok('createCampaign');

  const servers = createPostgresWorldServerRepository(executor, { useInternalTransactions: false });
  const server = await servers.createWorldServer({
    worldServerId: WORLD_SERVER_ID,
    ownerId: USER_ID,
    serverHandle: 'scene-state-write-smoke',
    displayName: 'Scene State Smoke Server',
  });
  if (server.ok === false) return [...steps, failed('createWorldServer', server.error.kind)];
  ok('createWorldServer');

  const repo = createPostgresSceneStateRepository(executor);
  const source = await repo.createSceneState({
    sceneStateId: SOURCE_ID,
    worldServerId: WORLD_SERVER_ID,
    campaignId: CAMPAIGN_ID,
    roomId: ROOM_ID,
    title: 'Opening Scene',
    description: 'rollback-only',
    stateJson: {
      schemaVersion: 1,
      appFeature: 'scene-runtime-snapshot',
      exportedAt: '2026-01-01T00:00:00.000Z',
      campaignId: CAMPAIGN_ID,
      roomId: ROOM_ID,
      combat: { combatants: [] },
      map: { tokens: [] },
    },
    createdByUserId: USER_ID,
  });
  if (source.ok === false) return [...steps, failed('createSceneState', source.error.kind)];
  ok('createSceneState');

  const listed = await repo.listSceneStates(WORLD_SERVER_ID, CAMPAIGN_ID, ROOM_ID);
  if (listed.ok === false || listed.value.length !== 1 || listed.value[0]?.sceneStateId !== SOURCE_ID) {
    return [...steps, failed('listSceneStates', listed.ok === false ? listed.error.kind : 'stale_read')];
  }
  ok('listSceneStates');

  const renamed = await repo.updateSceneStateMetadata({ sceneStateId: SOURCE_ID, title: 'Opening Scene Revised' });
  if (renamed.ok === false || !renamed.value || renamed.value.title !== 'Opening Scene Revised') {
    return [...steps, failed('updateSceneStateMetadata', renamed.ok === false ? renamed.error.kind : 'stale_read')];
  }
  ok('updateSceneStateMetadata');

  const copy = await repo.duplicateSceneState({ sceneStateId: COPY_ID, sourceSceneStateId: SOURCE_ID, createdByUserId: USER_ID });
  if (copy.ok === false || copy.value.sourceSceneStateId !== SOURCE_ID) {
    return [...steps, failed('duplicateSceneState', copy.ok === false ? copy.error.kind : 'stale_read')];
  }
  ok('duplicateSceneState');

  const archived = await repo.archiveSceneState(SOURCE_ID);
  if (archived.ok === false || !archived.value?.archivedAt) {
    return [...steps, failed('archiveSceneState', archived.ok === false ? archived.error.kind : 'stale_read')];
  }
  ok('archiveSceneState');

  const active = await repo.listSceneStates(WORLD_SERVER_ID, CAMPAIGN_ID, ROOM_ID);
  if (active.ok === false || active.value.length !== 1 || active.value[0]?.sceneStateId !== COPY_ID) {
    return [...steps, failed('listActiveSceneStates', active.ok === false ? active.error.kind : 'archive_filter_failed')];
  }
  ok('listActiveSceneStates');

  return steps;
}

export async function runPostgresSceneStateRepositoryRollbackWriteSmoke(): Promise<PostgresSceneStateWriteSmokeResult> {
  const database = await checkPostgresHealth();
  if (database.configured === false) {
    return { status: 'not_configured', database, schema: { status: 'not_configured' }, transaction: { attempted: false, rolledBack: false }, steps: [] };
  }
  if (database.status !== 'ok') {
    return { status: 'unreachable', database, schema: { status: 'unreachable', errorKind: database.errorKind }, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: database.errorKind };
  }

  const schema = await checkPostgresSceneStateSchemaReadiness();
  if (schema.status !== 'ready') {
    return { status: schema.status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
  }

  let rolledBack = false;
  const steps: PostgresSceneStateWriteSmokeStep[] = [];
  try {
    const transactionSteps = await withPostgresClient(async (client) => {
      await client.query('BEGIN');
      try {
        return await runWritePath(executorOf((text, values) => client.query(text, values ? [...values] : undefined)));
      } finally {
        await client.query('ROLLBACK');
        rolledBack = true;
      }
    });
    steps.push(...transactionSteps);
    const failedStep = steps.find((step) => !step.ok);
    return { status: failedStep ? 'repository_failed' : 'rolled_back', database, schema, transaction: { attempted: true, rolledBack }, steps, errorKind: failedStep?.errorKind };
  } catch {
    return { status: 'transaction_failed', database, schema, transaction: { attempted: true, rolledBack }, steps, errorKind: 'transaction_failed' };
  }
}
