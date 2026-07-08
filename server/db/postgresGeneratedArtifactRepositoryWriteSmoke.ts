import type { QueryResultRow } from 'pg';

import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresCampaignRepository } from '../adapters/postgresCampaignRepository.js';
import { createPostgresActorRepository } from '../adapters/postgresActorRepository.js';
import { createPostgresRuntimeEventRepository } from '../adapters/postgresRuntimeEventRepository.js';
import {
  createPostgresGeneratedArtifactRepository,
  type PostgresGeneratedArtifactRepositoryExecutor,
} from '../adapters/postgresGeneratedArtifactRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import {
  checkPostgresGeneratedArtifactSchemaReadiness,
  type PostgresGeneratedArtifactSchemaReadinessResult,
} from './postgresGeneratedArtifactSchemaReadiness.js';

/**
 * Rollback-only GeneratedArtifact / AI Memory write smoke (P5.15C). Inside a single
 * transaction it creates smoke owner user + campaign + actor + runtime session +
 * one runtime event, then a generated artifact, an AI memory entry, and two context
 * sources (one per parent), exercises read/list/update/archive/restore across all,
 * and ALWAYS rolls back. No permanent rows, no commit path, no model call, no
 * embedding, no raw DB error/connection string. Uses `useInternalTransactions:false`
 * so every write runs on the outer transaction's client.
 */

export type PostgresGeneratedArtifactWriteSmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'runtime_event_schema_missing'
  | 'schema_missing'
  | 'rolled_back'
  | 'repository_failed'
  | 'transaction_failed'
  | 'error';

export interface PostgresGeneratedArtifactWriteSmokeStep {
  name: string;
  ok: boolean;
  errorKind?: string;
}

export interface PostgresGeneratedArtifactWriteSmokeResult {
  status: PostgresGeneratedArtifactWriteSmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresGeneratedArtifactSchemaReadinessResult;
  transaction?: { attempted: boolean; rolledBack: boolean };
  steps: PostgresGeneratedArtifactWriteSmokeStep[];
  errorKind?: string;
}

const SMOKE_OWNER_USER_ID = 'user_generated_write_smoke';
const SMOKE_OWNER_PROVIDER_KIND = 'localAnonymous';
const SMOKE_OWNER_PROVIDER_SUBJECT = 'generated-write-smoke';
const SMOKE_OWNER_HANDLE = 'generated-write-smoke';
const SMOKE_CAMPAIGN_ID = 'campaign_generated_write_smoke';
const SMOKE_ACTOR_ID = 'actor_generated_write_smoke';
const SMOKE_SESSION_ID = 'runtimeSession_generated_write_smoke';
const SMOKE_EVENT_ID = 'runtimeEvent_generated_write_smoke';
const SMOKE_ARTIFACT_ID = 'artifact_generated_write_smoke';
const SMOKE_MEMORY_ID = 'memoryEntry_generated_write_smoke';
const SMOKE_CONTEXT_SOURCE_ARTIFACT_ID = 'contextSource_generated_write_smoke_artifact';
const SMOKE_CONTEXT_SOURCE_MEMORY_ID = 'contextSource_generated_write_smoke_memory';

function makeClientExecutor(
  clientQuery: PostgresGeneratedArtifactRepositoryExecutor['query'],
): PostgresGeneratedArtifactRepositoryExecutor {
  return {
    query: <T extends QueryResultRow>(text: string, values?: readonly unknown[]) => clientQuery<T>(text, values),
  };
}

function failedStep(name: string, errorKind: string): PostgresGeneratedArtifactWriteSmokeStep {
  return { name, ok: false, errorKind };
}

async function runWritePath(
  executor: PostgresGeneratedArtifactRepositoryExecutor,
): Promise<PostgresGeneratedArtifactWriteSmokeStep[]> {
  const steps: PostgresGeneratedArtifactWriteSmokeStep[] = [];

  const userRepository = createPostgresUserRepository(executor, { useInternalTransactions: false });
  const createUser = await userRepository.createUserWithIdentity({
    identity: {
      userId: SMOKE_OWNER_USER_ID,
      providerKind: SMOKE_OWNER_PROVIDER_KIND,
      providerUserId: SMOKE_OWNER_PROVIDER_SUBJECT,
      displayName: 'Generated Write Smoke Owner',
    },
    profile: { handle: SMOKE_OWNER_HANDLE, displayName: 'Generated Write Smoke Owner', tags: [], visibility: 'private', pinned: [], sectionVisibility: {} },
  });
  if (createUser.ok === false) return [failedStep('createOwnerUser', createUser.error.kind)];
  steps.push({ name: 'createOwnerUser', ok: true });

  const campaignRepository = createPostgresCampaignRepository(executor, { useInternalTransactions: false });
  const createCampaign = await campaignRepository.createCampaign({
    campaignId: SMOKE_CAMPAIGN_ID,
    ownerId: SMOKE_OWNER_USER_ID,
    title: 'Generated Write Smoke Campaign',
    systemId: 'dnd5e-2024',
  });
  if (createCampaign.ok === false) return [...steps, failedStep('createCampaign', createCampaign.error.kind)];
  steps.push({ name: 'createCampaign', ok: true });

  const actorRepository = createPostgresActorRepository(executor, { useInternalTransactions: false });
  const createActor = await actorRepository.createActor({
    actorId: SMOKE_ACTOR_ID,
    ownerId: SMOKE_OWNER_USER_ID,
    systemId: 'dnd5e-2024',
    localActorId: 'local_generated_write_smoke',
    displayName: 'Generated Write Smoke Actor',
    payload: { sheet: { note: 'rollback-only' } },
  });
  if (createActor.ok === false) return [...steps, failedStep('createActor', createActor.error.kind)];
  steps.push({ name: 'createActor', ok: true });

  const runtimeRepository = createPostgresRuntimeEventRepository(executor, { useInternalTransactions: false });
  const createSession = await runtimeRepository.createRuntimeSession({
    runtimeSessionId: SMOKE_SESSION_ID,
    campaignId: SMOKE_CAMPAIGN_ID,
    hostUserId: SMOKE_OWNER_USER_ID,
    title: 'Generated Write Smoke Session',
  });
  if (createSession.ok === false) return [...steps, failedStep('createRuntimeSession', createSession.error.kind)];
  steps.push({ name: 'createRuntimeSession', ok: true });

  const appendEvent = await runtimeRepository.appendRuntimeEvent({
    runtimeEventId: SMOKE_EVENT_ID,
    runtimeSessionId: SMOKE_SESSION_ID,
    campaignId: SMOKE_CAMPAIGN_ID,
    eventKind: 'smoke.note',
    actorId: SMOKE_ACTOR_ID,
    createdByUserId: SMOKE_OWNER_USER_ID,
    payload: { note: 'rollback-only' },
  });
  if (appendEvent.ok === false) return [...steps, failedStep('appendRuntimeEvent', appendEvent.error.kind)];
  steps.push({ name: 'appendRuntimeEvent', ok: true });

  const repo = createPostgresGeneratedArtifactRepository(executor, { useInternalTransactions: false });

  // ── Generated artifact ─────────────────────────────────────────────────────
  const createdArtifact = await repo.createGeneratedArtifact({
    artifactId: SMOKE_ARTIFACT_ID,
    ownerId: SMOKE_OWNER_USER_ID,
    campaignId: SMOKE_CAMPAIGN_ID,
    runtimeSessionId: SMOKE_SESSION_ID,
    runtimeEventId: SMOKE_EVENT_ID,
    artifactKind: 'session_recap',
    title: 'Generated Write Smoke Recap',
    summary: 'A rollback-only smoke recap.',
    visibilityScope: 'host_only',
    payload: { text: 'recap body' },
    sourcePayload: { runtimeEventIds: [SMOKE_EVENT_ID] },
    modelPayload: { note: 'no model was called' },
  });
  if (createdArtifact.ok === false) return [...steps, failedStep('createGeneratedArtifact', createdArtifact.error.kind)];
  steps.push({ name: 'createGeneratedArtifact', ok: true });

  const artifactById = await repo.getGeneratedArtifactById(SMOKE_ARTIFACT_ID);
  if (artifactById.ok === false) return [...steps, failedStep('getGeneratedArtifactById', artifactById.error.kind)];
  if (!artifactById.value || artifactById.value.artifactId !== SMOKE_ARTIFACT_ID) {
    return [...steps, failedStep('getGeneratedArtifactById', 'not_found')];
  }
  steps.push({ name: 'getGeneratedArtifactById', ok: true });

  const artifactsByOwner = await repo.listGeneratedArtifactsByOwner(SMOKE_OWNER_USER_ID);
  if (artifactsByOwner.ok === false) return [...steps, failedStep('listGeneratedArtifactsByOwner', artifactsByOwner.error.kind)];
  if (!artifactsByOwner.value.some((a) => a.artifactId === SMOKE_ARTIFACT_ID)) {
    return [...steps, failedStep('listGeneratedArtifactsByOwner', 'not_found')];
  }
  steps.push({ name: 'listGeneratedArtifactsByOwner', ok: true });

  const artifactsByCampaign = await repo.listGeneratedArtifactsByCampaign(SMOKE_CAMPAIGN_ID);
  if (artifactsByCampaign.ok === false) return [...steps, failedStep('listGeneratedArtifactsByCampaign', artifactsByCampaign.error.kind)];
  if (!artifactsByCampaign.value.some((a) => a.artifactId === SMOKE_ARTIFACT_ID)) {
    return [...steps, failedStep('listGeneratedArtifactsByCampaign', 'not_found')];
  }
  steps.push({ name: 'listGeneratedArtifactsByCampaign', ok: true });

  const artifactsBySession = await repo.listGeneratedArtifactsByRuntimeSession(SMOKE_SESSION_ID);
  if (artifactsBySession.ok === false) return [...steps, failedStep('listGeneratedArtifactsByRuntimeSession', artifactsBySession.error.kind)];
  if (!artifactsBySession.value.some((a) => a.artifactId === SMOKE_ARTIFACT_ID)) {
    return [...steps, failedStep('listGeneratedArtifactsByRuntimeSession', 'not_found')];
  }
  steps.push({ name: 'listGeneratedArtifactsByRuntimeSession', ok: true });

  const updatedArtifact = await repo.updateGeneratedArtifact({
    artifactId: SMOKE_ARTIFACT_ID,
    title: 'Generated Write Smoke Recap Updated',
    visibilityScope: 'campaign_shared',
    payload: { text: 'recap body updated' },
    modelPayload: { note: 'still no model called', updated: true },
  });
  if (updatedArtifact.ok === false) return [...steps, failedStep('updateGeneratedArtifact', updatedArtifact.error.kind)];
  if (!updatedArtifact.value || updatedArtifact.value.title !== 'Generated Write Smoke Recap Updated' || updatedArtifact.value.visibilityScope !== 'campaign_shared') {
    return [...steps, failedStep('updateGeneratedArtifact', 'stale_read')];
  }
  steps.push({ name: 'updateGeneratedArtifact', ok: true });

  // ── AI memory entry ────────────────────────────────────────────────────────
  const createdMemory = await repo.createAiMemoryEntry({
    memoryEntryId: SMOKE_MEMORY_ID,
    ownerId: SMOKE_OWNER_USER_ID,
    campaignId: SMOKE_CAMPAIGN_ID,
    runtimeSessionId: SMOKE_SESSION_ID,
    sourceArtifactId: SMOKE_ARTIFACT_ID,
    memoryKind: 'campaign_fact',
    memoryScope: 'campaign',
    title: 'Generated Write Smoke Memory',
    contentText: 'The party met an NPC (rollback-only).',
    visibilityScope: 'campaign',
    payload: { tags: ['npc'] },
    sourcePayload: { artifactId: SMOKE_ARTIFACT_ID },
    confidence: 0.75,
  });
  if (createdMemory.ok === false) return [...steps, failedStep('createAiMemoryEntry', createdMemory.error.kind)];
  steps.push({ name: 'createAiMemoryEntry', ok: true });

  const memoryById = await repo.getAiMemoryEntryById(SMOKE_MEMORY_ID);
  if (memoryById.ok === false) return [...steps, failedStep('getAiMemoryEntryById', memoryById.error.kind)];
  if (!memoryById.value || memoryById.value.memoryEntryId !== SMOKE_MEMORY_ID) {
    return [...steps, failedStep('getAiMemoryEntryById', 'not_found')];
  }
  steps.push({ name: 'getAiMemoryEntryById', ok: true });

  const memoryByOwner = await repo.listAiMemoryEntriesByOwner(SMOKE_OWNER_USER_ID);
  if (memoryByOwner.ok === false) return [...steps, failedStep('listAiMemoryEntriesByOwner', memoryByOwner.error.kind)];
  if (!memoryByOwner.value.some((m) => m.memoryEntryId === SMOKE_MEMORY_ID)) {
    return [...steps, failedStep('listAiMemoryEntriesByOwner', 'not_found')];
  }
  steps.push({ name: 'listAiMemoryEntriesByOwner', ok: true });

  const memoryByCampaign = await repo.listAiMemoryEntriesByCampaign(SMOKE_CAMPAIGN_ID);
  if (memoryByCampaign.ok === false) return [...steps, failedStep('listAiMemoryEntriesByCampaign', memoryByCampaign.error.kind)];
  if (!memoryByCampaign.value.some((m) => m.memoryEntryId === SMOKE_MEMORY_ID)) {
    return [...steps, failedStep('listAiMemoryEntriesByCampaign', 'not_found')];
  }
  steps.push({ name: 'listAiMemoryEntriesByCampaign', ok: true });

  const memoryBySession = await repo.listAiMemoryEntriesByRuntimeSession(SMOKE_SESSION_ID);
  if (memoryBySession.ok === false) return [...steps, failedStep('listAiMemoryEntriesByRuntimeSession', memoryBySession.error.kind)];
  if (!memoryBySession.value.some((m) => m.memoryEntryId === SMOKE_MEMORY_ID)) {
    return [...steps, failedStep('listAiMemoryEntriesByRuntimeSession', 'not_found')];
  }
  steps.push({ name: 'listAiMemoryEntriesByRuntimeSession', ok: true });

  const updatedMemory = await repo.updateAiMemoryEntry({
    memoryEntryId: SMOKE_MEMORY_ID,
    contentText: 'The party met an NPC named Vale (rollback-only).',
    visibilityScope: 'host_only',
    confidence: 0.9,
    payload: { tags: ['npc', 'vale'] },
  });
  if (updatedMemory.ok === false) return [...steps, failedStep('updateAiMemoryEntry', updatedMemory.error.kind)];
  if (!updatedMemory.value || updatedMemory.value.confidence !== 0.9 || updatedMemory.value.visibilityScope !== 'host_only') {
    return [...steps, failedStep('updateAiMemoryEntry', 'stale_read')];
  }
  steps.push({ name: 'updateAiMemoryEntry', ok: true });

  // ── Context sources (append-only provenance) ─────────────────────────────────
  const artifactSource = await repo.createAiContextSource({
    contextSourceId: SMOKE_CONTEXT_SOURCE_ARTIFACT_ID,
    ownerId: SMOKE_OWNER_USER_ID,
    campaignId: SMOKE_CAMPAIGN_ID,
    artifactId: SMOKE_ARTIFACT_ID,
    sourceKind: 'runtime_event',
    sourceRefId: SMOKE_EVENT_ID,
    sourcePayload: { note: 'artifact provenance' },
  });
  if (artifactSource.ok === false) return [...steps, failedStep('createAiContextSourceArtifact', artifactSource.error.kind)];
  steps.push({ name: 'createAiContextSourceArtifact', ok: true });

  const memorySource = await repo.createAiContextSource({
    contextSourceId: SMOKE_CONTEXT_SOURCE_MEMORY_ID,
    ownerId: SMOKE_OWNER_USER_ID,
    campaignId: SMOKE_CAMPAIGN_ID,
    memoryEntryId: SMOKE_MEMORY_ID,
    sourceKind: 'generated_artifact',
    sourceRefId: SMOKE_ARTIFACT_ID,
    sourcePayload: { note: 'memory provenance' },
  });
  if (memorySource.ok === false) return [...steps, failedStep('createAiContextSourceMemory', memorySource.error.kind)];
  steps.push({ name: 'createAiContextSourceMemory', ok: true });

  const sourcesForArtifact = await repo.listAiContextSourcesForArtifact(SMOKE_ARTIFACT_ID);
  if (sourcesForArtifact.ok === false) return [...steps, failedStep('listAiContextSourcesForArtifact', sourcesForArtifact.error.kind)];
  if (!sourcesForArtifact.value.some((s) => s.contextSourceId === SMOKE_CONTEXT_SOURCE_ARTIFACT_ID)) {
    return [...steps, failedStep('listAiContextSourcesForArtifact', 'not_found')];
  }
  steps.push({ name: 'listAiContextSourcesForArtifact', ok: true });

  const sourcesForMemory = await repo.listAiContextSourcesForMemoryEntry(SMOKE_MEMORY_ID);
  if (sourcesForMemory.ok === false) return [...steps, failedStep('listAiContextSourcesForMemoryEntry', sourcesForMemory.error.kind)];
  if (!sourcesForMemory.value.some((s) => s.contextSourceId === SMOKE_CONTEXT_SOURCE_MEMORY_ID)) {
    return [...steps, failedStep('listAiContextSourcesForMemoryEntry', 'not_found')];
  }
  steps.push({ name: 'listAiContextSourcesForMemoryEntry', ok: true });

  // ── Archive / restore ────────────────────────────────────────────────────────
  const archivedArtifact = await repo.archiveGeneratedArtifact(SMOKE_ARTIFACT_ID);
  if (archivedArtifact.ok === false) return [...steps, failedStep('archiveGeneratedArtifact', archivedArtifact.error.kind)];
  if (!archivedArtifact.value || !archivedArtifact.value.archivedAt) {
    return [...steps, failedStep('archiveGeneratedArtifact', 'stale_read')];
  }
  steps.push({ name: 'archiveGeneratedArtifact', ok: true });

  const restoredArtifact = await repo.restoreGeneratedArtifact(SMOKE_ARTIFACT_ID);
  if (restoredArtifact.ok === false) return [...steps, failedStep('restoreGeneratedArtifact', restoredArtifact.error.kind)];
  if (!restoredArtifact.value || restoredArtifact.value.archivedAt) {
    return [...steps, failedStep('restoreGeneratedArtifact', 'stale_read')];
  }
  steps.push({ name: 'restoreGeneratedArtifact', ok: true });

  const archivedMemory = await repo.archiveAiMemoryEntry(SMOKE_MEMORY_ID);
  if (archivedMemory.ok === false) return [...steps, failedStep('archiveAiMemoryEntry', archivedMemory.error.kind)];
  if (!archivedMemory.value || !archivedMemory.value.archivedAt) {
    return [...steps, failedStep('archiveAiMemoryEntry', 'stale_read')];
  }
  steps.push({ name: 'archiveAiMemoryEntry', ok: true });

  const restoredMemory = await repo.restoreAiMemoryEntry(SMOKE_MEMORY_ID);
  if (restoredMemory.ok === false) return [...steps, failedStep('restoreAiMemoryEntry', restoredMemory.error.kind)];
  if (!restoredMemory.value || restoredMemory.value.archivedAt) {
    return [...steps, failedStep('restoreAiMemoryEntry', 'stale_read')];
  }
  steps.push({ name: 'restoreAiMemoryEntry', ok: true });

  return steps;
}

export async function runPostgresGeneratedArtifactRepositoryRollbackWriteSmoke(): Promise<PostgresGeneratedArtifactWriteSmokeResult> {
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

  const schema = await checkPostgresGeneratedArtifactSchemaReadiness();
  if (schema.status !== 'ready') {
    // All non-ready schema statuses are members of the write-smoke status union.
    return { status: schema.status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
  }

  const steps: PostgresGeneratedArtifactWriteSmokeStep[] = [];
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
