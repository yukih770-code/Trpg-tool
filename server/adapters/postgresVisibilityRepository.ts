import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';

/**
 * Postgres Visibility / Scope / Rights repository (P5.19) — server-only.
 *
 * Mirrors the prior slices (safe result envelope, injectable executor, DB error
 * mapping that never leaks raw driver errors). Stores SCOPE + RIGHTS + REVIEW
 * METADATA ONLY — enforces nothing: no permission checks, no publish workflow, no
 * moderation, no public feed, no AI retrieval, no AI scope guard.
 *
 * Content is referenced generically (contentKind/contentId/projectionKind) — NO FK
 * fanout to content tables. A global_public projection is a SEPARATE record from its
 * private source, so publishing never mutates the source. Public flags default false;
 * `aiScope` defaults 'private_only'; `visibilityScope` defaults 'user_private'.
 */

export type PostgresVisibilityRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresVisibilityRepositoryResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        kind: PostgresVisibilityRepositoryErrorKind;
        message: string;
        retryable?: boolean;
      };
    };

// ── Records ──────────────────────────────────────────────────────────────────

export interface ContentRightsPolicyRecord {
  rightsPolicyId: string;
  ownerId: string;
  policyKind: string;
  licenseId?: string;
  licenseLabel?: string;
  attributionText?: string;
  sourceUrl?: string;
  sourcePayload: Record<string, unknown>;
  redistributionAllowed: boolean;
  commercialUseAllowed: boolean;
  publicSharingAllowed: boolean;
  derivativeAllowed: boolean;
  aiContextAllowed: boolean;
  aiTrainingAllowed: boolean;
  rightsPayload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface ContentVisibilityRecord {
  visibilityRecordId: string;
  ownerId: string;
  worldServerId?: string;
  campaignId?: string;
  rightsPolicyId?: string;
  contentKind: string;
  contentId: string;
  projectionKind: string;
  visibilityScope: string;
  publicSearchAllowed: boolean;
  publicProfileAllowed: boolean;
  workshopPublishAllowed: boolean;
  communityFeedAllowed: boolean;
  aiScope: string;
  reviewStatus: string;
  moderationStatus: string;
  lifecycleStatus: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface ContentPublicationReviewRecord {
  publicationReviewId: string;
  visibilityRecordId: string;
  ownerId: string;
  submittedByUserId?: string;
  reviewedByUserId?: string;
  targetSurface: string;
  reviewStatus: string;
  submitMessage?: string;
  reviewMessage?: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateContentRightsPolicyInput {
  rightsPolicyId: string;
  ownerId: string;
  policyKind: string;
  licenseId?: string;
  licenseLabel?: string;
  attributionText?: string;
  sourceUrl?: string;
  sourcePayload?: Record<string, unknown>;
  redistributionAllowed?: boolean;
  commercialUseAllowed?: boolean;
  publicSharingAllowed?: boolean;
  derivativeAllowed?: boolean;
  aiContextAllowed?: boolean;
  aiTrainingAllowed?: boolean;
  rightsPayload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface UpdateContentRightsPolicyInput {
  rightsPolicyId: string;
  policyKind?: string;
  licenseId?: string;
  licenseLabel?: string;
  attributionText?: string;
  sourceUrl?: string;
  sourcePayload?: Record<string, unknown>;
  redistributionAllowed?: boolean;
  commercialUseAllowed?: boolean;
  publicSharingAllowed?: boolean;
  derivativeAllowed?: boolean;
  aiContextAllowed?: boolean;
  aiTrainingAllowed?: boolean;
  rightsPayload?: Record<string, unknown>;
}

export interface ListContentRightsPoliciesOptions {
  policyKind?: string;
  publicSharingAllowed?: boolean;
  aiContextAllowed?: boolean;
  includeArchived?: boolean;
  limit?: number;
}

export interface CreateContentVisibilityRecordInput {
  visibilityRecordId: string;
  ownerId: string;
  worldServerId?: string;
  campaignId?: string;
  rightsPolicyId?: string;
  contentKind: string;
  contentId: string;
  projectionKind?: string;
  visibilityScope?: string;
  publicSearchAllowed?: boolean;
  publicProfileAllowed?: boolean;
  workshopPublishAllowed?: boolean;
  communityFeedAllowed?: boolean;
  aiScope?: string;
  reviewStatus?: string;
  moderationStatus?: string;
  lifecycleStatus?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface UpdateContentVisibilityRecordInput {
  visibilityRecordId: string;
  worldServerId?: string;
  campaignId?: string;
  rightsPolicyId?: string;
  visibilityScope?: string;
  publicSearchAllowed?: boolean;
  publicProfileAllowed?: boolean;
  workshopPublishAllowed?: boolean;
  communityFeedAllowed?: boolean;
  aiScope?: string;
  moderationStatus?: string;
  lifecycleStatus?: string;
  payload?: Record<string, unknown>;
}

export interface UpdateContentVisibilityReviewStatusInput {
  visibilityRecordId: string;
  reviewStatus: string;
  moderationStatus?: string;
}

export interface ListContentVisibilityRecordsOptions {
  contentKind?: string;
  projectionKind?: string;
  visibilityScope?: string;
  aiScope?: string;
  reviewStatus?: string;
  moderationStatus?: string;
  publicSearchAllowed?: boolean;
  workshopPublishAllowed?: boolean;
  communityFeedAllowed?: boolean;
  includeArchived?: boolean;
  limit?: number;
}

export interface ListGlobalPublicVisibilityRecordsOptions {
  contentKind?: string;
  reviewStatus?: string;
  publicSearchAllowed?: boolean;
  includeArchived?: boolean;
  limit?: number;
}

export interface CreateContentPublicationReviewInput {
  publicationReviewId: string;
  visibilityRecordId: string;
  ownerId: string;
  submittedByUserId?: string;
  targetSurface: string;
  reviewStatus?: string;
  submitMessage?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
  submittedAt?: string;
}

export interface UpdateContentPublicationReviewStatusInput {
  publicationReviewId: string;
  reviewStatus: string;
  reviewedByUserId?: string;
  reviewMessage?: string;
  reviewedAt?: string;
}

export interface ListContentPublicationReviewsOptions {
  targetSurface?: string;
  reviewStatus?: string;
  includeArchived?: boolean;
  limit?: number;
}

export interface PostgresVisibilityRepositoryExecutor {
  query<T extends QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

export interface PostgresVisibilityRepositoryOptions {
  /** Defaults true; smoke tests pass an already-transactional client with false. */
  useInternalTransactions?: boolean;
}

// ── Rows ─────────────────────────────────────────────────────────────────────

interface RightsPolicyRow extends QueryResultRow {
  rights_policy_id: string;
  owner_id: string;
  policy_kind: string;
  license_id: string | null;
  license_label: string | null;
  attribution_text: string | null;
  source_url: string | null;
  source_payload: unknown;
  redistribution_allowed: boolean;
  commercial_use_allowed: boolean;
  public_sharing_allowed: boolean;
  derivative_allowed: boolean;
  ai_context_allowed: boolean;
  ai_training_allowed: boolean;
  rights_payload: unknown;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface VisibilityRow extends QueryResultRow {
  visibility_record_id: string;
  owner_id: string;
  world_server_id: string | null;
  campaign_id: string | null;
  rights_policy_id: string | null;
  content_kind: string;
  content_id: string;
  projection_kind: string;
  visibility_scope: string;
  public_search_allowed: boolean;
  public_profile_allowed: boolean;
  workshop_publish_allowed: boolean;
  community_feed_allowed: boolean;
  ai_scope: string;
  review_status: string;
  moderation_status: string;
  lifecycle_status: string;
  visibility_payload: unknown;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface ReviewRow extends QueryResultRow {
  publication_review_id: string;
  visibility_record_id: string;
  owner_id: string;
  submitted_by_user_id: string | null;
  reviewed_by_user_id: string | null;
  target_surface: string;
  review_status: string;
  submit_message: string | null;
  review_message: string | null;
  review_payload: unknown;
  schema_version: number;
  submitted_at: Date | string;
  reviewed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function limitOf(value: number | undefined, fallback = 200): number {
  return Number.isInteger(value) && (value as number) > 0 ? (value as number) : fallback;
}

/** COALESCE-friendly nullable boolean parameter (undefined → NULL keeps existing). */
function boolOrNull(value: boolean | undefined): boolean | null {
  return value === undefined ? null : value;
}

function mapRepositoryError(error: unknown): PostgresVisibilityRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
  }
  if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Visibility repository table is missing.' } };
  }
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === '23505') {
    return { ok: false, error: { kind: 'conflict', message: 'Visibility row already exists (duplicate content/projection).' } };
  }
  if (code === '23503') {
    return { ok: false, error: { kind: 'conflict', message: 'Visibility row references a missing owner/server/campaign/rights/record.' } };
  }
  if (code === '42P01') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Visibility repository table is missing.' } };
  }
  const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  return { ok: false, error: { kind: 'database_error', message: 'Visibility repository query failed.', retryable } };
}

// ── Row mappers ──────────────────────────────────────────────────────────────

function rowToRightsPolicy(row: RightsPolicyRow): ContentRightsPolicyRecord {
  return {
    rightsPolicyId: row.rights_policy_id,
    ownerId: row.owner_id,
    policyKind: row.policy_kind,
    licenseId: row.license_id ?? undefined,
    licenseLabel: row.license_label ?? undefined,
    attributionText: row.attribution_text ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    sourcePayload: toPayload(row.source_payload),
    redistributionAllowed: row.redistribution_allowed === true,
    commercialUseAllowed: row.commercial_use_allowed === true,
    publicSharingAllowed: row.public_sharing_allowed === true,
    derivativeAllowed: row.derivative_allowed === true,
    aiContextAllowed: row.ai_context_allowed === true,
    aiTrainingAllowed: row.ai_training_allowed === true,
    rightsPayload: toPayload(row.rights_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToVisibility(row: VisibilityRow): ContentVisibilityRecord {
  return {
    visibilityRecordId: row.visibility_record_id,
    ownerId: row.owner_id,
    worldServerId: row.world_server_id ?? undefined,
    campaignId: row.campaign_id ?? undefined,
    rightsPolicyId: row.rights_policy_id ?? undefined,
    contentKind: row.content_kind,
    contentId: row.content_id,
    projectionKind: row.projection_kind,
    visibilityScope: row.visibility_scope,
    publicSearchAllowed: row.public_search_allowed === true,
    publicProfileAllowed: row.public_profile_allowed === true,
    workshopPublishAllowed: row.workshop_publish_allowed === true,
    communityFeedAllowed: row.community_feed_allowed === true,
    aiScope: row.ai_scope,
    reviewStatus: row.review_status,
    moderationStatus: row.moderation_status,
    lifecycleStatus: row.lifecycle_status,
    payload: toPayload(row.visibility_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToReview(row: ReviewRow): ContentPublicationReviewRecord {
  return {
    publicationReviewId: row.publication_review_id,
    visibilityRecordId: row.visibility_record_id,
    ownerId: row.owner_id,
    submittedByUserId: row.submitted_by_user_id ?? undefined,
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    targetSurface: row.target_surface,
    reviewStatus: row.review_status,
    submitMessage: row.submit_message ?? undefined,
    reviewMessage: row.review_message ?? undefined,
    payload: toPayload(row.review_payload),
    schemaVersion: row.schema_version,
    submittedAt: toIso(row.submitted_at),
    reviewedAt: toIso(row.reviewed_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

// ── Column lists ─────────────────────────────────────────────────────────────

const RIGHTS_COLS = `
  rights_policy_id, owner_id, policy_kind, license_id, license_label, attribution_text,
  source_url, source_payload, redistribution_allowed, commercial_use_allowed,
  public_sharing_allowed, derivative_allowed, ai_context_allowed, ai_training_allowed,
  rights_payload, schema_version, created_at, updated_at, archived_at
`;
const VIS_COLS = `
  visibility_record_id, owner_id, world_server_id, campaign_id, rights_policy_id,
  content_kind, content_id, projection_kind, visibility_scope, public_search_allowed,
  public_profile_allowed, workshop_publish_allowed, community_feed_allowed, ai_scope,
  review_status, moderation_status, lifecycle_status, visibility_payload, schema_version,
  created_at, updated_at, archived_at
`;
const REVIEW_COLS = `
  publication_review_id, visibility_record_id, owner_id, submitted_by_user_id,
  reviewed_by_user_id, target_surface, review_status, submit_message, review_message,
  review_payload, schema_version, submitted_at, reviewed_at, created_at, updated_at, archived_at
`;

const defaultExecutor: PostgresVisibilityRepositoryExecutor = {
  query: (text, values) => queryPostgres(text, values),
};

export interface PostgresVisibilityRepository {
  // Rights policies
  getContentRightsPolicyById(rightsPolicyId: string): Promise<PostgresVisibilityRepositoryResult<ContentRightsPolicyRecord | null>>;
  listContentRightsPoliciesByOwner(ownerId: string, options?: ListContentRightsPoliciesOptions): Promise<PostgresVisibilityRepositoryResult<ContentRightsPolicyRecord[]>>;
  createContentRightsPolicy(input: CreateContentRightsPolicyInput): Promise<PostgresVisibilityRepositoryResult<ContentRightsPolicyRecord>>;
  updateContentRightsPolicy(input: UpdateContentRightsPolicyInput): Promise<PostgresVisibilityRepositoryResult<ContentRightsPolicyRecord | null>>;
  archiveContentRightsPolicy(rightsPolicyId: string, archivedAt?: string): Promise<PostgresVisibilityRepositoryResult<ContentRightsPolicyRecord | null>>;
  restoreContentRightsPolicy(rightsPolicyId: string): Promise<PostgresVisibilityRepositoryResult<ContentRightsPolicyRecord | null>>;
  // Visibility records
  getContentVisibilityRecordById(visibilityRecordId: string): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord | null>>;
  getContentVisibilityRecordByContentRef(contentKind: string, contentId: string, projectionKind?: string): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord | null>>;
  listContentVisibilityRecordsByOwner(ownerId: string, options?: ListContentVisibilityRecordsOptions): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord[]>>;
  listContentVisibilityRecordsByWorldServer(worldServerId: string, options?: ListContentVisibilityRecordsOptions): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord[]>>;
  listContentVisibilityRecordsByCampaign(campaignId: string, options?: ListContentVisibilityRecordsOptions): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord[]>>;
  listGlobalPublicVisibilityRecords(options?: ListGlobalPublicVisibilityRecordsOptions): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord[]>>;
  createContentVisibilityRecord(input: CreateContentVisibilityRecordInput): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord>>;
  updateContentVisibilityRecord(input: UpdateContentVisibilityRecordInput): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord | null>>;
  updateContentVisibilityReviewStatus(input: UpdateContentVisibilityReviewStatusInput): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord | null>>;
  archiveContentVisibilityRecord(visibilityRecordId: string, archivedAt?: string): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord | null>>;
  restoreContentVisibilityRecord(visibilityRecordId: string): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord | null>>;
  // Publication reviews
  getContentPublicationReviewById(publicationReviewId: string): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord | null>>;
  listContentPublicationReviewsByVisibilityRecord(visibilityRecordId: string, options?: ListContentPublicationReviewsOptions): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord[]>>;
  listContentPublicationReviewsByOwner(ownerId: string, options?: ListContentPublicationReviewsOptions): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord[]>>;
  listContentPublicationReviewsByTargetSurface(targetSurface: string, options?: ListContentPublicationReviewsOptions): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord[]>>;
  createContentPublicationReview(input: CreateContentPublicationReviewInput): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord>>;
  updateContentPublicationReviewStatus(input: UpdateContentPublicationReviewStatusInput): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord | null>>;
  archiveContentPublicationReview(publicationReviewId: string, archivedAt?: string): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord | null>>;
  restoreContentPublicationReview(publicationReviewId: string): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord | null>>;
  checkReadiness(): Promise<PostgresVisibilityRepositoryResult<{ rightsPoliciesTable: boolean; visibilityRecordsTable: boolean; publicationReviewsTable: boolean }>>;
}

export function createPostgresVisibilityRepository(
  executor: PostgresVisibilityRepositoryExecutor = defaultExecutor,
  _options: PostgresVisibilityRepositoryOptions = {},
): PostgresVisibilityRepository {
  async function one<Row extends QueryResultRow, Rec>(sql: string, values: readonly unknown[], map: (row: Row) => Rec): Promise<PostgresVisibilityRepositoryResult<Rec | null>> {
    try {
      const result = await executor.query<Row>(sql, values);
      return { ok: true, value: result.rows[0] ? map(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function many<Row extends QueryResultRow, Rec>(sql: string, values: readonly unknown[], map: (row: Row) => Rec): Promise<PostgresVisibilityRepositoryResult<Rec[]>> {
    try {
      const result = await executor.query<Row>(sql, values);
      return { ok: true, value: result.rows.map(map) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  // ── Rights policies ──────────────────────────────────────────────────────────

  const getContentRightsPolicyById = (rightsPolicyId: string) =>
    one<RightsPolicyRow, ContentRightsPolicyRecord>(`SELECT ${RIGHTS_COLS} FROM content_rights_policies WHERE rights_policy_id = $1 LIMIT 1`, [rightsPolicyId], rowToRightsPolicy);

  async function listContentRightsPoliciesByOwner(ownerId: string, options: ListContentRightsPoliciesOptions = {}) {
    const conditions = ['owner_id = $1'];
    const values: unknown[] = [ownerId];
    if (options.policyKind) { values.push(options.policyKind); conditions.push(`policy_kind = $${values.length}`); }
    if (options.publicSharingAllowed !== undefined) { values.push(options.publicSharingAllowed); conditions.push(`public_sharing_allowed = $${values.length}`); }
    if (options.aiContextAllowed !== undefined) { values.push(options.aiContextAllowed); conditions.push(`ai_context_allowed = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<RightsPolicyRow, ContentRightsPolicyRecord>(`SELECT ${RIGHTS_COLS} FROM content_rights_policies WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToRightsPolicy);
  }

  async function createContentRightsPolicy(input: CreateContentRightsPolicyInput): Promise<PostgresVisibilityRepositoryResult<ContentRightsPolicyRecord>> {
    const now = new Date().toISOString();
    const record: ContentRightsPolicyRecord = {
      rightsPolicyId: input.rightsPolicyId, ownerId: input.ownerId, policyKind: input.policyKind,
      licenseId: input.licenseId, licenseLabel: input.licenseLabel, attributionText: input.attributionText, sourceUrl: input.sourceUrl,
      sourcePayload: input.sourcePayload ?? {},
      redistributionAllowed: input.redistributionAllowed ?? false, commercialUseAllowed: input.commercialUseAllowed ?? false,
      publicSharingAllowed: input.publicSharingAllowed ?? false, derivativeAllowed: input.derivativeAllowed ?? false,
      aiContextAllowed: input.aiContextAllowed ?? false, aiTrainingAllowed: input.aiTrainingAllowed ?? false,
      rightsPayload: input.rightsPayload ?? {}, schemaVersion: input.schemaVersion ?? 1, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO content_rights_policies (
           rights_policy_id, owner_id, policy_kind, license_id, license_label, attribution_text,
           source_url, source_payload, redistribution_allowed, commercial_use_allowed,
           public_sharing_allowed, derivative_allowed, ai_context_allowed, ai_training_allowed,
           rights_payload, schema_version, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$17)`,
        [
          record.rightsPolicyId, record.ownerId, record.policyKind, record.licenseId ?? null, record.licenseLabel ?? null, record.attributionText ?? null,
          record.sourceUrl ?? null, JSON.stringify(record.sourcePayload), record.redistributionAllowed, record.commercialUseAllowed,
          record.publicSharingAllowed, record.derivativeAllowed, record.aiContextAllowed, record.aiTrainingAllowed,
          JSON.stringify(record.rightsPayload), record.schemaVersion, now,
        ],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateContentRightsPolicy = (input: UpdateContentRightsPolicyInput) =>
    one<RightsPolicyRow, ContentRightsPolicyRecord>(
      `UPDATE content_rights_policies SET
         policy_kind = COALESCE($2, policy_kind),
         license_id = COALESCE($3, license_id),
         license_label = COALESCE($4, license_label),
         attribution_text = COALESCE($5, attribution_text),
         source_url = COALESCE($6, source_url),
         source_payload = COALESCE($7::jsonb, source_payload),
         redistribution_allowed = COALESCE($8, redistribution_allowed),
         commercial_use_allowed = COALESCE($9, commercial_use_allowed),
         public_sharing_allowed = COALESCE($10, public_sharing_allowed),
         derivative_allowed = COALESCE($11, derivative_allowed),
         ai_context_allowed = COALESCE($12, ai_context_allowed),
         ai_training_allowed = COALESCE($13, ai_training_allowed),
         rights_payload = COALESCE($14::jsonb, rights_payload),
         updated_at = $15
       WHERE rights_policy_id = $1 RETURNING ${RIGHTS_COLS}`,
      [
        input.rightsPolicyId, input.policyKind ?? null, input.licenseId ?? null, input.licenseLabel ?? null, input.attributionText ?? null,
        input.sourceUrl ?? null, input.sourcePayload === undefined ? null : JSON.stringify(input.sourcePayload),
        boolOrNull(input.redistributionAllowed), boolOrNull(input.commercialUseAllowed), boolOrNull(input.publicSharingAllowed),
        boolOrNull(input.derivativeAllowed), boolOrNull(input.aiContextAllowed), boolOrNull(input.aiTrainingAllowed),
        input.rightsPayload === undefined ? null : JSON.stringify(input.rightsPayload), new Date().toISOString(),
      ],
      rowToRightsPolicy,
    );

  const archiveContentRightsPolicy = (rightsPolicyId: string, archivedAt?: string) =>
    one<RightsPolicyRow, ContentRightsPolicyRecord>(`UPDATE content_rights_policies SET archived_at = $2, updated_at = $2 WHERE rights_policy_id = $1 RETURNING ${RIGHTS_COLS}`, [rightsPolicyId, archivedAt ?? new Date().toISOString()], rowToRightsPolicy);
  const restoreContentRightsPolicy = (rightsPolicyId: string) =>
    one<RightsPolicyRow, ContentRightsPolicyRecord>(`UPDATE content_rights_policies SET archived_at = NULL, updated_at = $2 WHERE rights_policy_id = $1 RETURNING ${RIGHTS_COLS}`, [rightsPolicyId, new Date().toISOString()], rowToRightsPolicy);

  // ── Visibility records ─────────────────────────────────────────────────────────

  const getContentVisibilityRecordById = (visibilityRecordId: string) =>
    one<VisibilityRow, ContentVisibilityRecord>(`SELECT ${VIS_COLS} FROM content_visibility_records WHERE visibility_record_id = $1 LIMIT 1`, [visibilityRecordId], rowToVisibility);

  const getContentVisibilityRecordByContentRef = (contentKind: string, contentId: string, projectionKind: string = 'source') =>
    one<VisibilityRow, ContentVisibilityRecord>(`SELECT ${VIS_COLS} FROM content_visibility_records WHERE content_kind = $1 AND content_id = $2 AND projection_kind = $3 LIMIT 1`, [contentKind, contentId, projectionKind], rowToVisibility);

  function applyVisibilityFilters(conditions: string[], values: unknown[], options: ListContentVisibilityRecordsOptions): void {
    if (options.contentKind) { values.push(options.contentKind); conditions.push(`content_kind = $${values.length}`); }
    if (options.projectionKind) { values.push(options.projectionKind); conditions.push(`projection_kind = $${values.length}`); }
    if (options.visibilityScope) { values.push(options.visibilityScope); conditions.push(`visibility_scope = $${values.length}`); }
    if (options.aiScope) { values.push(options.aiScope); conditions.push(`ai_scope = $${values.length}`); }
    if (options.reviewStatus) { values.push(options.reviewStatus); conditions.push(`review_status = $${values.length}`); }
    if (options.moderationStatus) { values.push(options.moderationStatus); conditions.push(`moderation_status = $${values.length}`); }
    if (options.publicSearchAllowed !== undefined) { values.push(options.publicSearchAllowed); conditions.push(`public_search_allowed = $${values.length}`); }
    if (options.workshopPublishAllowed !== undefined) { values.push(options.workshopPublishAllowed); conditions.push(`workshop_publish_allowed = $${values.length}`); }
    if (options.communityFeedAllowed !== undefined) { values.push(options.communityFeedAllowed); conditions.push(`community_feed_allowed = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
  }

  function listVisibilityWhere(column: 'owner_id' | 'world_server_id' | 'campaign_id', value: string, options: ListContentVisibilityRecordsOptions) {
    const conditions = [`${column} = $1`];
    const values: unknown[] = [value];
    applyVisibilityFilters(conditions, values, options);
    values.push(limitOf(options.limit));
    return many<VisibilityRow, ContentVisibilityRecord>(`SELECT ${VIS_COLS} FROM content_visibility_records WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToVisibility);
  }

  const listContentVisibilityRecordsByOwner = (ownerId: string, options: ListContentVisibilityRecordsOptions = {}) => listVisibilityWhere('owner_id', ownerId, options);
  const listContentVisibilityRecordsByWorldServer = (worldServerId: string, options: ListContentVisibilityRecordsOptions = {}) => listVisibilityWhere('world_server_id', worldServerId, options);
  const listContentVisibilityRecordsByCampaign = (campaignId: string, options: ListContentVisibilityRecordsOptions = {}) => listVisibilityWhere('campaign_id', campaignId, options);

  async function listGlobalPublicVisibilityRecords(options: ListGlobalPublicVisibilityRecordsOptions = {}) {
    // Assumed constraints: global_public scope + active lifecycle. NOT a public feed API.
    const conditions = [`visibility_scope = 'global_public'`, `lifecycle_status = 'active'`];
    const values: unknown[] = [];
    if (options.contentKind) { values.push(options.contentKind); conditions.push(`content_kind = $${values.length}`); }
    if (options.reviewStatus) { values.push(options.reviewStatus); conditions.push(`review_status = $${values.length}`); }
    if (options.publicSearchAllowed !== undefined) { values.push(options.publicSearchAllowed); conditions.push(`public_search_allowed = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit, 100));
    return many<VisibilityRow, ContentVisibilityRecord>(`SELECT ${VIS_COLS} FROM content_visibility_records WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToVisibility);
  }

  async function createContentVisibilityRecord(input: CreateContentVisibilityRecordInput): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord>> {
    const now = new Date().toISOString();
    const record: ContentVisibilityRecord = {
      visibilityRecordId: input.visibilityRecordId, ownerId: input.ownerId, worldServerId: input.worldServerId, campaignId: input.campaignId,
      rightsPolicyId: input.rightsPolicyId, contentKind: input.contentKind, contentId: input.contentId, projectionKind: input.projectionKind ?? 'source',
      visibilityScope: input.visibilityScope ?? 'user_private',
      publicSearchAllowed: input.publicSearchAllowed ?? false, publicProfileAllowed: input.publicProfileAllowed ?? false,
      workshopPublishAllowed: input.workshopPublishAllowed ?? false, communityFeedAllowed: input.communityFeedAllowed ?? false,
      aiScope: input.aiScope ?? 'private_only', reviewStatus: input.reviewStatus ?? 'not_submitted',
      moderationStatus: input.moderationStatus ?? 'not_reviewed', lifecycleStatus: input.lifecycleStatus ?? 'active',
      payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO content_visibility_records (
           visibility_record_id, owner_id, world_server_id, campaign_id, rights_policy_id,
           content_kind, content_id, projection_kind, visibility_scope, public_search_allowed,
           public_profile_allowed, workshop_publish_allowed, community_feed_allowed, ai_scope,
           review_status, moderation_status, lifecycle_status, visibility_payload, schema_version,
           created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,$19,$20,$20)`,
        [
          record.visibilityRecordId, record.ownerId, record.worldServerId ?? null, record.campaignId ?? null, record.rightsPolicyId ?? null,
          record.contentKind, record.contentId, record.projectionKind, record.visibilityScope, record.publicSearchAllowed,
          record.publicProfileAllowed, record.workshopPublishAllowed, record.communityFeedAllowed, record.aiScope,
          record.reviewStatus, record.moderationStatus, record.lifecycleStatus, JSON.stringify(record.payload), record.schemaVersion, now,
        ],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateContentVisibilityRecord = (input: UpdateContentVisibilityRecordInput) =>
    one<VisibilityRow, ContentVisibilityRecord>(
      `UPDATE content_visibility_records SET
         world_server_id = COALESCE($2, world_server_id),
         campaign_id = COALESCE($3, campaign_id),
         rights_policy_id = COALESCE($4, rights_policy_id),
         visibility_scope = COALESCE($5, visibility_scope),
         public_search_allowed = COALESCE($6, public_search_allowed),
         public_profile_allowed = COALESCE($7, public_profile_allowed),
         workshop_publish_allowed = COALESCE($8, workshop_publish_allowed),
         community_feed_allowed = COALESCE($9, community_feed_allowed),
         ai_scope = COALESCE($10, ai_scope),
         moderation_status = COALESCE($11, moderation_status),
         lifecycle_status = COALESCE($12, lifecycle_status),
         visibility_payload = COALESCE($13::jsonb, visibility_payload),
         updated_at = $14
       WHERE visibility_record_id = $1 RETURNING ${VIS_COLS}`,
      [
        input.visibilityRecordId, input.worldServerId ?? null, input.campaignId ?? null, input.rightsPolicyId ?? null,
        input.visibilityScope ?? null, boolOrNull(input.publicSearchAllowed), boolOrNull(input.publicProfileAllowed),
        boolOrNull(input.workshopPublishAllowed), boolOrNull(input.communityFeedAllowed), input.aiScope ?? null,
        input.moderationStatus ?? null, input.lifecycleStatus ?? null,
        input.payload === undefined ? null : JSON.stringify(input.payload), new Date().toISOString(),
      ],
      rowToVisibility,
    );

  const updateContentVisibilityReviewStatus = (input: UpdateContentVisibilityReviewStatusInput) =>
    one<VisibilityRow, ContentVisibilityRecord>(
      `UPDATE content_visibility_records SET review_status = $2, moderation_status = COALESCE($3, moderation_status), updated_at = $4 WHERE visibility_record_id = $1 RETURNING ${VIS_COLS}`,
      [input.visibilityRecordId, input.reviewStatus, input.moderationStatus ?? null, new Date().toISOString()],
      rowToVisibility,
    );

  const archiveContentVisibilityRecord = (visibilityRecordId: string, archivedAt?: string) =>
    one<VisibilityRow, ContentVisibilityRecord>(`UPDATE content_visibility_records SET archived_at = $2, updated_at = $2 WHERE visibility_record_id = $1 RETURNING ${VIS_COLS}`, [visibilityRecordId, archivedAt ?? new Date().toISOString()], rowToVisibility);
  const restoreContentVisibilityRecord = (visibilityRecordId: string) =>
    one<VisibilityRow, ContentVisibilityRecord>(`UPDATE content_visibility_records SET archived_at = NULL, updated_at = $2 WHERE visibility_record_id = $1 RETURNING ${VIS_COLS}`, [visibilityRecordId, new Date().toISOString()], rowToVisibility);

  // ── Publication reviews ─────────────────────────────────────────────────────────

  const getContentPublicationReviewById = (publicationReviewId: string) =>
    one<ReviewRow, ContentPublicationReviewRecord>(`SELECT ${REVIEW_COLS} FROM content_publication_reviews WHERE publication_review_id = $1 LIMIT 1`, [publicationReviewId], rowToReview);

  function listReviewsWhere(column: 'visibility_record_id' | 'owner_id' | 'target_surface', value: string, options: ListContentPublicationReviewsOptions) {
    const conditions = [`${column} = $1`];
    const values: unknown[] = [value];
    if (column !== 'target_surface' && options.targetSurface) { values.push(options.targetSurface); conditions.push(`target_surface = $${values.length}`); }
    if (options.reviewStatus) { values.push(options.reviewStatus); conditions.push(`review_status = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<ReviewRow, ContentPublicationReviewRecord>(`SELECT ${REVIEW_COLS} FROM content_publication_reviews WHERE ${conditions.join(' AND ')} ORDER BY submitted_at DESC LIMIT $${values.length}`, values, rowToReview);
  }

  const listContentPublicationReviewsByVisibilityRecord = (visibilityRecordId: string, options: ListContentPublicationReviewsOptions = {}) => listReviewsWhere('visibility_record_id', visibilityRecordId, options);
  const listContentPublicationReviewsByOwner = (ownerId: string, options: ListContentPublicationReviewsOptions = {}) => listReviewsWhere('owner_id', ownerId, options);
  const listContentPublicationReviewsByTargetSurface = (targetSurface: string, options: ListContentPublicationReviewsOptions = {}) => listReviewsWhere('target_surface', targetSurface, options);

  async function createContentPublicationReview(input: CreateContentPublicationReviewInput): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord>> {
    const now = new Date().toISOString();
    const submittedAt = input.submittedAt ?? now;
    const record: ContentPublicationReviewRecord = {
      publicationReviewId: input.publicationReviewId, visibilityRecordId: input.visibilityRecordId, ownerId: input.ownerId,
      submittedByUserId: input.submittedByUserId, targetSurface: input.targetSurface, reviewStatus: input.reviewStatus ?? 'pending',
      submitMessage: input.submitMessage, payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, submittedAt, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO content_publication_reviews (
           publication_review_id, visibility_record_id, owner_id, submitted_by_user_id, target_surface,
           review_status, submit_message, review_payload, schema_version, submitted_at, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$11)`,
        [record.publicationReviewId, record.visibilityRecordId, record.ownerId, record.submittedByUserId ?? null, record.targetSurface, record.reviewStatus, record.submitMessage ?? null, JSON.stringify(record.payload), record.schemaVersion, submittedAt, now],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateContentPublicationReviewStatus = (input: UpdateContentPublicationReviewStatusInput) =>
    one<ReviewRow, ContentPublicationReviewRecord>(
      `UPDATE content_publication_reviews SET review_status = $2, reviewed_by_user_id = COALESCE($3, reviewed_by_user_id), review_message = COALESCE($4, review_message), reviewed_at = COALESCE($5, reviewed_at), updated_at = $6 WHERE publication_review_id = $1 RETURNING ${REVIEW_COLS}`,
      [input.publicationReviewId, input.reviewStatus, input.reviewedByUserId ?? null, input.reviewMessage ?? null, input.reviewedAt ?? new Date().toISOString(), new Date().toISOString()],
      rowToReview,
    );

  const archiveContentPublicationReview = (publicationReviewId: string, archivedAt?: string) =>
    one<ReviewRow, ContentPublicationReviewRecord>(`UPDATE content_publication_reviews SET archived_at = $2, updated_at = $2 WHERE publication_review_id = $1 RETURNING ${REVIEW_COLS}`, [publicationReviewId, archivedAt ?? new Date().toISOString()], rowToReview);
  const restoreContentPublicationReview = (publicationReviewId: string) =>
    one<ReviewRow, ContentPublicationReviewRecord>(`UPDATE content_publication_reviews SET archived_at = NULL, updated_at = $2 WHERE publication_review_id = $1 RETURNING ${REVIEW_COLS}`, [publicationReviewId, new Date().toISOString()], rowToReview);

  async function checkReadiness(): Promise<PostgresVisibilityRepositoryResult<{ rightsPoliciesTable: boolean; visibilityRecordsTable: boolean; publicationReviewsTable: boolean }>> {
    try {
      const result = await executor.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN (
           'content_rights_policies','content_visibility_records','content_publication_reviews')`,
      );
      const names = new Set(result.rows.map((row) => row.table_name));
      return {
        ok: true,
        value: {
          rightsPoliciesTable: names.has('content_rights_policies'),
          visibilityRecordsTable: names.has('content_visibility_records'),
          publicationReviewsTable: names.has('content_publication_reviews'),
        },
      };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  return {
    getContentRightsPolicyById, listContentRightsPoliciesByOwner, createContentRightsPolicy,
    updateContentRightsPolicy, archiveContentRightsPolicy, restoreContentRightsPolicy,
    getContentVisibilityRecordById, getContentVisibilityRecordByContentRef, listContentVisibilityRecordsByOwner,
    listContentVisibilityRecordsByWorldServer, listContentVisibilityRecordsByCampaign, listGlobalPublicVisibilityRecords,
    createContentVisibilityRecord, updateContentVisibilityRecord, updateContentVisibilityReviewStatus,
    archiveContentVisibilityRecord, restoreContentVisibilityRecord,
    getContentPublicationReviewById, listContentPublicationReviewsByVisibilityRecord, listContentPublicationReviewsByOwner,
    listContentPublicationReviewsByTargetSurface, createContentPublicationReview, updateContentPublicationReviewStatus,
    archiveContentPublicationReview, restoreContentPublicationReview, checkReadiness,
  };
}

const defaultPostgresVisibilityRepository = createPostgresVisibilityRepository();

export async function getContentRightsPolicyById(rightsPolicyId: string): Promise<PostgresVisibilityRepositoryResult<ContentRightsPolicyRecord | null>> {
  return defaultPostgresVisibilityRepository.getContentRightsPolicyById(rightsPolicyId);
}
export async function getContentVisibilityRecordById(visibilityRecordId: string): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord | null>> {
  return defaultPostgresVisibilityRepository.getContentVisibilityRecordById(visibilityRecordId);
}
export async function getContentVisibilityRecordByContentRef(contentKind: string, contentId: string, projectionKind?: string): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord | null>> {
  return defaultPostgresVisibilityRepository.getContentVisibilityRecordByContentRef(contentKind, contentId, projectionKind);
}
export async function getContentPublicationReviewById(publicationReviewId: string): Promise<PostgresVisibilityRepositoryResult<ContentPublicationReviewRecord | null>> {
  return defaultPostgresVisibilityRepository.getContentPublicationReviewById(publicationReviewId);
}
export async function listGlobalPublicVisibilityRecords(options?: ListGlobalPublicVisibilityRecordsOptions): Promise<PostgresVisibilityRepositoryResult<ContentVisibilityRecord[]>> {
  return defaultPostgresVisibilityRepository.listGlobalPublicVisibilityRecords(options);
}
export async function checkPostgresVisibilityRepositoryReadiness(): Promise<PostgresVisibilityRepositoryResult<{ rightsPoliciesTable: boolean; visibilityRecordsTable: boolean; publicationReviewsTable: boolean }>> {
  return defaultPostgresVisibilityRepository.checkReadiness();
}
