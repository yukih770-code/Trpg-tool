import {
  getContentRightsPolicyById,
  getContentVisibilityRecordById,
  getContentVisibilityRecordByContentRef,
  getContentPublicationReviewById,
  listGlobalPublicVisibilityRecords,
} from '../adapters/postgresVisibilityRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import {
  checkPostgresVisibilitySchemaReadiness,
  type PostgresVisibilitySchemaReadinessResult,
} from './postgresVisibilitySchemaReadiness.js';

/**
 * Read-only Visibility repository smoke (P5.19B). Mirrors the other read smokes:
 * health → schema readiness → harmless nonexistent-id/content-ref probes + a bounded
 * global-public list. Writes NOTHING, creates no tables, runs no migration, never
 * prints the connection string.
 */

export type PostgresVisibilityRepositorySmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'world_server_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresVisibilityRepositorySmokeResult {
  status: PostgresVisibilityRepositorySmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresVisibilitySchemaReadinessResult;
  probe?: {
    ranNonexistentRightsPolicyLookup: boolean;
    ranNonexistentVisibilityLookup: boolean;
    ranNonexistentContentRefLookup: boolean;
    ranNonexistentReviewLookup: boolean;
    ranGlobalPublicList: boolean;
    foundUnexpectedRow: boolean;
  };
  errorKind?: string;
}

// Deterministic, harmless ids/refs that must never exist.
const READONLY_PROBE_RIGHTS_ID = 'rightsPolicy_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_VISIBILITY_ID = 'visibilityRecord_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_CONTENT_KIND = 'smoke_probe_content';
const READONLY_PROBE_CONTENT_ID = 'content_readonly_smoke_probe_nonexistent';
const READONLY_PROBE_REVIEW_ID = 'publicationReview_readonly_smoke_probe_nonexistent';

export async function runPostgresVisibilityRepositoryReadOnlySmoke(): Promise<PostgresVisibilityRepositorySmokeResult> {
  const database = await checkPostgresHealth();
  if (database.configured === false) {
    return { status: 'not_configured', database, schema: { status: 'not_configured' } };
  }
  if (database.status !== 'ok') {
    return {
      status: 'unreachable',
      database,
      schema: { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs },
      errorKind: database.errorKind,
    };
  }

  const schema = await checkPostgresVisibilitySchemaReadiness();
  if (schema.status !== 'ready') {
    return { status: schema.status, database, schema, errorKind: schema.errorKind };
  }

  const rightsProbe = await getContentRightsPolicyById(READONLY_PROBE_RIGHTS_ID);
  if (rightsProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: rightsProbe.error.kind };
  }
  const visibilityProbe = await getContentVisibilityRecordById(READONLY_PROBE_VISIBILITY_ID);
  if (visibilityProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: visibilityProbe.error.kind };
  }
  const contentRefProbe = await getContentVisibilityRecordByContentRef(READONLY_PROBE_CONTENT_KIND, READONLY_PROBE_CONTENT_ID, 'source');
  if (contentRefProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: contentRefProbe.error.kind };
  }
  const reviewProbe = await getContentPublicationReviewById(READONLY_PROBE_REVIEW_ID);
  if (reviewProbe.ok === false) {
    return { status: 'error', database, schema, errorKind: reviewProbe.error.kind };
  }
  const globalPublic = await listGlobalPublicVisibilityRecords({ limit: 5 });
  if (globalPublic.ok === false) {
    return { status: 'error', database, schema, errorKind: globalPublic.error.kind };
  }

  return {
    status: 'ready',
    database,
    schema,
    probe: {
      ranNonexistentRightsPolicyLookup: true,
      ranNonexistentVisibilityLookup: true,
      ranNonexistentContentRefLookup: true,
      ranNonexistentReviewLookup: true,
      ranGlobalPublicList: true,
      foundUnexpectedRow: rightsProbe.value !== null || visibilityProbe.value !== null || contentRefProbe.value !== null || reviewProbe.value !== null,
    },
  };
}

export { READONLY_PROBE_RIGHTS_ID, READONLY_PROBE_VISIBILITY_ID, READONLY_PROBE_CONTENT_KIND, READONLY_PROBE_CONTENT_ID, READONLY_PROBE_REVIEW_ID };
