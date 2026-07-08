import type { QueryResultRow } from 'pg';

import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresCampaignRepository } from '../adapters/postgresCampaignRepository.js';
import { createPostgresWorldServerRepository } from '../adapters/postgresWorldServerRepository.js';
import {
  createPostgresVisibilityRepository,
  type PostgresVisibilityRepositoryExecutor,
} from '../adapters/postgresVisibilityRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import {
  checkPostgresVisibilitySchemaReadiness,
  type PostgresVisibilitySchemaReadinessResult,
} from './postgresVisibilitySchemaReadiness.js';

/**
 * Rollback-only Visibility write smoke (P5.19C). Inside a single transaction it
 * creates smoke owner/reviewer users + campaign + world server, then a rights policy
 * and user_private / server / campaign / global_public projection visibility records,
 * a publication review, exercises read/list/update/status/archive/restore across all,
 * and ALWAYS rolls back. Public flags stay false except on the explicit global-public
 * projection; nothing is enforced. No permanent rows, no commit, no raw DB error/
 * connection string. Uses `useInternalTransactions:false`.
 */

export type PostgresVisibilityWriteSmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'world_server_schema_missing'
  | 'schema_missing'
  | 'rolled_back'
  | 'repository_failed'
  | 'transaction_failed'
  | 'error';

export interface PostgresVisibilityWriteSmokeStep {
  name: string;
  ok: boolean;
  errorKind?: string;
}

export interface PostgresVisibilityWriteSmokeResult {
  status: PostgresVisibilityWriteSmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresVisibilitySchemaReadinessResult;
  transaction?: { attempted: boolean; rolledBack: boolean };
  steps: PostgresVisibilityWriteSmokeStep[];
  errorKind?: string;
}

const OWNER_USER_ID = 'user_visibility_write_smoke_owner';
const REVIEWER_USER_ID = 'user_visibility_write_smoke_reviewer';
const CAMPAIGN_ID = 'campaign_visibility_write_smoke';
const SERVER_ID = 'worldServer_visibility_write_smoke';
const SERVER_HANDLE = 'visibility-write-smoke';
const RIGHTS_ID = 'rightsPolicy_visibility_write_smoke';
const VIS_PRIVATE_ID = 'visibilityRecord_write_smoke_private';
const VIS_SERVER_ID = 'visibilityRecord_write_smoke_server';
const VIS_CAMPAIGN_ID = 'visibilityRecord_write_smoke_campaign';
const VIS_PUBLIC_ID = 'visibilityRecord_write_smoke_public';
const REVIEW_ID = 'publicationReview_write_smoke';
const CONTENT_KIND = 'smoke_compendium_entry';
const CONTENT_ID = 'content_visibility_write_smoke';

function makeClientExecutor(
  clientQuery: PostgresVisibilityRepositoryExecutor['query'],
): PostgresVisibilityRepositoryExecutor {
  return {
    query: <T extends QueryResultRow>(text: string, values?: readonly unknown[]) => clientQuery<T>(text, values),
  };
}

function failedStep(name: string, errorKind: string): PostgresVisibilityWriteSmokeStep {
  return { name, ok: false, errorKind };
}

async function createSmokeUser(executor: PostgresVisibilityRepositoryExecutor, userId: string, subject: string) {
  const userRepository = createPostgresUserRepository(executor, { useInternalTransactions: false });
  return userRepository.createUserWithIdentity({
    identity: { userId, providerKind: 'localAnonymous', providerUserId: subject, displayName: subject },
    profile: { handle: subject, displayName: subject, tags: [], visibility: 'private', pinned: [], sectionVisibility: {} },
  });
}

async function runWritePath(
  executor: PostgresVisibilityRepositoryExecutor,
): Promise<PostgresVisibilityWriteSmokeStep[]> {
  const steps: PostgresVisibilityWriteSmokeStep[] = [];
  const ok = (name: string) => steps.push({ name, ok: true });

  for (const [id, subject] of [[OWNER_USER_ID, 'vis-owner'], [REVIEWER_USER_ID, 'vis-reviewer']] as const) {
    const res = await createSmokeUser(executor, id, subject);
    if (res.ok === false) return [...steps, failedStep(`createUser:${subject}`, res.error.kind)];
    ok(`createUser:${subject}`);
  }

  const campaignRepository = createPostgresCampaignRepository(executor, { useInternalTransactions: false });
  const campaign = await campaignRepository.createCampaign({ campaignId: CAMPAIGN_ID, ownerId: OWNER_USER_ID, title: 'Visibility Write Smoke Campaign', systemId: 'dnd5e-2024' });
  if (campaign.ok === false) return [...steps, failedStep('createCampaign', campaign.error.kind)];
  ok('createCampaign');

  const worldRepository = createPostgresWorldServerRepository(executor, { useInternalTransactions: false });
  const server = await worldRepository.createWorldServer({ worldServerId: SERVER_ID, ownerId: OWNER_USER_ID, serverHandle: SERVER_HANDLE, displayName: 'Visibility Write Smoke Server' });
  if (server.ok === false) return [...steps, failedStep('createWorldServer', server.error.kind)];
  ok('createWorldServer');

  const repo = createPostgresVisibilityRepository(executor, { useInternalTransactions: false });

  // ── Rights policy ─────────────────────────────────────────────────────────────
  const rights = await repo.createContentRightsPolicy({ rightsPolicyId: RIGHTS_ID, ownerId: OWNER_USER_ID, policyKind: 'original_homebrew', licenseLabel: 'Original (author-owned)', publicSharingAllowed: true, derivativeAllowed: true, aiContextAllowed: true });
  if (rights.ok === false) return [...steps, failedStep('createContentRightsPolicy', rights.error.kind)];
  ok('createContentRightsPolicy');

  const rightsById = await repo.getContentRightsPolicyById(RIGHTS_ID);
  if (rightsById.ok === false || !rightsById.value) return [...steps, failedStep('getContentRightsPolicyById', rightsById.ok === false ? rightsById.error.kind : 'not_found')];
  ok('getContentRightsPolicyById');

  const rightsByOwner = await repo.listContentRightsPoliciesByOwner(OWNER_USER_ID, { publicSharingAllowed: true });
  if (rightsByOwner.ok === false || !rightsByOwner.value.some((p) => p.rightsPolicyId === RIGHTS_ID)) return [...steps, failedStep('listContentRightsPoliciesByOwner', rightsByOwner.ok === false ? rightsByOwner.error.kind : 'not_found')];
  ok('listContentRightsPoliciesByOwner');

  const rightsUpd = await repo.updateContentRightsPolicy({ rightsPolicyId: RIGHTS_ID, attributionText: 'By the owner', commercialUseAllowed: false, rightsPayload: { note: 'x' } });
  if (rightsUpd.ok === false || !rightsUpd.value || rightsUpd.value.attributionText !== 'By the owner') return [...steps, failedStep('updateContentRightsPolicy', rightsUpd.ok === false ? rightsUpd.error.kind : 'stale_read')];
  ok('updateContentRightsPolicy');

  // ── user_private source visibility record (all public flags false) ─────────────
  const priv = await repo.createContentVisibilityRecord({ visibilityRecordId: VIS_PRIVATE_ID, ownerId: OWNER_USER_ID, contentKind: CONTENT_KIND, contentId: CONTENT_ID, projectionKind: 'source', visibilityScope: 'user_private', aiScope: 'private_only' });
  if (priv.ok === false) return [...steps, failedStep('createPrivateVisibilityRecord', priv.error.kind)];
  if (priv.value.publicSearchAllowed || priv.value.workshopPublishAllowed || priv.value.communityFeedAllowed || priv.value.aiScope !== 'private_only') return [...steps, failedStep('createPrivateVisibilityRecord', 'defaults_not_private')];
  ok('createPrivateVisibilityRecord');

  const privById = await repo.getContentVisibilityRecordById(VIS_PRIVATE_ID);
  if (privById.ok === false || !privById.value) return [...steps, failedStep('getContentVisibilityRecordById', privById.ok === false ? privById.error.kind : 'not_found')];
  ok('getContentVisibilityRecordById');

  const privByRef = await repo.getContentVisibilityRecordByContentRef(CONTENT_KIND, CONTENT_ID, 'source');
  if (privByRef.ok === false || !privByRef.value || privByRef.value.visibilityRecordId !== VIS_PRIVATE_ID) return [...steps, failedStep('getContentVisibilityRecordByContentRef', privByRef.ok === false ? privByRef.error.kind : 'not_found')];
  ok('getContentVisibilityRecordByContentRef');

  const byOwner = await repo.listContentVisibilityRecordsByOwner(OWNER_USER_ID);
  if (byOwner.ok === false || !byOwner.value.some((r) => r.visibilityRecordId === VIS_PRIVATE_ID)) return [...steps, failedStep('listContentVisibilityRecordsByOwner', byOwner.ok === false ? byOwner.error.kind : 'not_found')];
  ok('listContentVisibilityRecordsByOwner');

  // ── server-scoped visibility record ────────────────────────────────────────────
  const srv = await repo.createContentVisibilityRecord({ visibilityRecordId: VIS_SERVER_ID, ownerId: OWNER_USER_ID, worldServerId: SERVER_ID, contentKind: CONTENT_KIND, contentId: CONTENT_ID + '_srv', projectionKind: 'source', visibilityScope: 'server', aiScope: 'server_only' });
  if (srv.ok === false) return [...steps, failedStep('createServerVisibilityRecord', srv.error.kind)];
  ok('createServerVisibilityRecord');

  const byServer = await repo.listContentVisibilityRecordsByWorldServer(SERVER_ID);
  if (byServer.ok === false || !byServer.value.some((r) => r.visibilityRecordId === VIS_SERVER_ID)) return [...steps, failedStep('listContentVisibilityRecordsByWorldServer', byServer.ok === false ? byServer.error.kind : 'not_found')];
  ok('listContentVisibilityRecordsByWorldServer');

  // ── campaign-scoped visibility record ────────────────────────────────────────────
  const camp = await repo.createContentVisibilityRecord({ visibilityRecordId: VIS_CAMPAIGN_ID, ownerId: OWNER_USER_ID, campaignId: CAMPAIGN_ID, contentKind: CONTENT_KIND, contentId: CONTENT_ID + '_camp', projectionKind: 'source', visibilityScope: 'campaign', aiScope: 'campaign_only' });
  if (camp.ok === false) return [...steps, failedStep('createCampaignVisibilityRecord', camp.error.kind)];
  ok('createCampaignVisibilityRecord');

  const byCampaign = await repo.listContentVisibilityRecordsByCampaign(CAMPAIGN_ID);
  if (byCampaign.ok === false || !byCampaign.value.some((r) => r.visibilityRecordId === VIS_CAMPAIGN_ID)) return [...steps, failedStep('listContentVisibilityRecordsByCampaign', byCampaign.ok === false ? byCampaign.error.kind : 'not_found')];
  ok('listContentVisibilityRecordsByCampaign');

  // ── global_public PROJECTION (separate record from the private source) ───────────
  const pub = await repo.createContentVisibilityRecord({
    visibilityRecordId: VIS_PUBLIC_ID, ownerId: OWNER_USER_ID, rightsPolicyId: RIGHTS_ID,
    contentKind: CONTENT_KIND, contentId: CONTENT_ID, projectionKind: 'public_projection',
    visibilityScope: 'global_public', publicSearchAllowed: true, workshopPublishAllowed: true,
    aiScope: 'public', reviewStatus: 'pending',
  });
  if (pub.ok === false) return [...steps, failedStep('createPublicProjectionRecord', pub.error.kind)];
  ok('createPublicProjectionRecord');

  const globalList = await repo.listGlobalPublicVisibilityRecords({ limit: 50 });
  if (globalList.ok === false || !globalList.value.some((r) => r.visibilityRecordId === VIS_PUBLIC_ID)) return [...steps, failedStep('listGlobalPublicVisibilityRecords', globalList.ok === false ? globalList.error.kind : 'not_found')];
  ok('listGlobalPublicVisibilityRecords');

  const reviewStatusUpd = await repo.updateContentVisibilityReviewStatus({ visibilityRecordId: VIS_PUBLIC_ID, reviewStatus: 'approved', moderationStatus: 'clean' });
  if (reviewStatusUpd.ok === false || !reviewStatusUpd.value || reviewStatusUpd.value.reviewStatus !== 'approved' || reviewStatusUpd.value.moderationStatus !== 'clean') return [...steps, failedStep('updateContentVisibilityReviewStatus', reviewStatusUpd.ok === false ? reviewStatusUpd.error.kind : 'stale_read')];
  ok('updateContentVisibilityReviewStatus');

  const visUpd = await repo.updateContentVisibilityRecord({ visibilityRecordId: VIS_PUBLIC_ID, communityFeedAllowed: true, payload: { featured: true } });
  if (visUpd.ok === false || !visUpd.value || visUpd.value.communityFeedAllowed !== true) return [...steps, failedStep('updateContentVisibilityRecord', visUpd.ok === false ? visUpd.error.kind : 'stale_read')];
  ok('updateContentVisibilityRecord');

  // ── Publication review ───────────────────────────────────────────────────────────
  const review = await repo.createContentPublicationReview({ publicationReviewId: REVIEW_ID, visibilityRecordId: VIS_PUBLIC_ID, ownerId: OWNER_USER_ID, submittedByUserId: OWNER_USER_ID, targetSurface: 'workshop', submitMessage: 'please review' });
  if (review.ok === false) return [...steps, failedStep('createContentPublicationReview', review.error.kind)];
  ok('createContentPublicationReview');

  const reviewById = await repo.getContentPublicationReviewById(REVIEW_ID);
  if (reviewById.ok === false || !reviewById.value) return [...steps, failedStep('getContentPublicationReviewById', reviewById.ok === false ? reviewById.error.kind : 'not_found')];
  ok('getContentPublicationReviewById');

  const reviewsByRecord = await repo.listContentPublicationReviewsByVisibilityRecord(VIS_PUBLIC_ID);
  if (reviewsByRecord.ok === false || !reviewsByRecord.value.some((r) => r.publicationReviewId === REVIEW_ID)) return [...steps, failedStep('listContentPublicationReviewsByVisibilityRecord', reviewsByRecord.ok === false ? reviewsByRecord.error.kind : 'not_found')];
  ok('listContentPublicationReviewsByVisibilityRecord');

  const reviewsByOwner = await repo.listContentPublicationReviewsByOwner(OWNER_USER_ID);
  if (reviewsByOwner.ok === false || !reviewsByOwner.value.some((r) => r.publicationReviewId === REVIEW_ID)) return [...steps, failedStep('listContentPublicationReviewsByOwner', reviewsByOwner.ok === false ? reviewsByOwner.error.kind : 'not_found')];
  ok('listContentPublicationReviewsByOwner');

  const reviewsBySurface = await repo.listContentPublicationReviewsByTargetSurface('workshop');
  if (reviewsBySurface.ok === false || !reviewsBySurface.value.some((r) => r.publicationReviewId === REVIEW_ID)) return [...steps, failedStep('listContentPublicationReviewsByTargetSurface', reviewsBySurface.ok === false ? reviewsBySurface.error.kind : 'not_found')];
  ok('listContentPublicationReviewsByTargetSurface');

  const reviewApproved = await repo.updateContentPublicationReviewStatus({ publicationReviewId: REVIEW_ID, reviewStatus: 'approved', reviewedByUserId: REVIEWER_USER_ID, reviewMessage: 'looks good' });
  if (reviewApproved.ok === false || !reviewApproved.value || reviewApproved.value.reviewStatus !== 'approved') return [...steps, failedStep('updatePublicationReviewApproved', reviewApproved.ok === false ? reviewApproved.error.kind : 'stale_read')];
  ok('updatePublicationReviewApproved');

  const reviewRevoked = await repo.updateContentPublicationReviewStatus({ publicationReviewId: REVIEW_ID, reviewStatus: 'revoked', reviewMessage: 'revoked for edit' });
  if (reviewRevoked.ok === false || !reviewRevoked.value || reviewRevoked.value.reviewStatus !== 'revoked') return [...steps, failedStep('updatePublicationReviewRevoked', reviewRevoked.ok === false ? reviewRevoked.error.kind : 'stale_read')];
  ok('updatePublicationReviewRevoked');

  // ── Archive / restore across entities ──────────────────────────────────────────
  const archiveChecks: [string, () => Promise<{ ok: boolean }>][] = [
    ['archiveReview', async () => { const r = await repo.archiveContentPublicationReview(REVIEW_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreReview', async () => { const r = await repo.restoreContentPublicationReview(REVIEW_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archivePublicRecord', async () => { const r = await repo.archiveContentVisibilityRecord(VIS_PUBLIC_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restorePublicRecord', async () => { const r = await repo.restoreContentVisibilityRecord(VIS_PUBLIC_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archivePrivateRecord', async () => { const r = await repo.archiveContentVisibilityRecord(VIS_PRIVATE_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restorePrivateRecord', async () => { const r = await repo.restoreContentVisibilityRecord(VIS_PRIVATE_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archiveRights', async () => { const r = await repo.archiveContentRightsPolicy(RIGHTS_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreRights', async () => { const r = await repo.restoreContentRightsPolicy(RIGHTS_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
  ];
  for (const [name, run] of archiveChecks) {
    const res = await run();
    if (!res.ok) return [...steps, failedStep(name, 'archive_restore_failed')];
    ok(name);
  }

  return steps;
}

export async function runPostgresVisibilityRepositoryRollbackWriteSmoke(): Promise<PostgresVisibilityWriteSmokeResult> {
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

  const schema = await checkPostgresVisibilitySchemaReadiness();
  if (schema.status !== 'ready') {
    // All non-ready schema statuses are members of the write-smoke status union.
    return { status: schema.status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
  }

  const steps: PostgresVisibilityWriteSmokeStep[] = [];
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
