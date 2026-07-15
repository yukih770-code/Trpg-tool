import {
  getAuthSessionById,
  getCampaignActorInstanceById,
  getCompendiumPackById,
  getContentDocumentById,
  getRoomRecordByRoomId,
  getServerAuditLogById,
  getUserNotificationById,
} from '../adapters/postgresPlatformFoundationRepository.js';
import { checkPostgresHealth } from './postgresClient.js';
import {
  checkPostgresPlatformFoundationSchemaReadiness,
  type PostgresPlatformFoundationSchemaReadinessResult,
} from './postgresPlatformFoundationSchemaReadiness.js';

/**
 * Read-only smoke for the remaining platform DB foundation. Writes nothing and
 * only probes deterministic nonexistent ids plus schema readiness.
 */

export type PostgresPlatformFoundationRepositorySmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'base_schema_missing'
  | 'schema_missing'
  | 'ready'
  | 'error';

export interface PostgresPlatformFoundationRepositorySmokeResult {
  status: PostgresPlatformFoundationRepositorySmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresPlatformFoundationSchemaReadinessResult;
  probe?: {
    ranAuthSessionLookup: boolean;
    ranCompendiumLookup: boolean;
    ranActorInstanceLookup: boolean;
    ranRoomLookup: boolean;
    ranContentLookup: boolean;
    ranAuditLookup: boolean;
    ranNotificationLookup: boolean;
    foundUnexpectedRow: boolean;
  };
  errorKind?: string;
}

const PROBE_AUTH_SESSION_ID = 'authSession_readonly_smoke_probe_nonexistent';
const PROBE_PACK_ID = 'pack_readonly_smoke_probe_nonexistent';
const PROBE_ACTOR_INSTANCE_ID = 'campaignActorInstance_readonly_smoke_probe_nonexistent';
const PROBE_ROOM_ID = 'room_readonly_smoke_probe_nonexistent';
const PROBE_DOCUMENT_ID = 'contentDocument_readonly_smoke_probe_nonexistent';
const PROBE_AUDIT_ID = 'auditLog_readonly_smoke_probe_nonexistent';
const PROBE_NOTIFICATION_ID = 'notification_readonly_smoke_probe_nonexistent';

export async function runPostgresPlatformFoundationRepositoryReadOnlySmoke(): Promise<PostgresPlatformFoundationRepositorySmokeResult> {
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

  const schema = await checkPostgresPlatformFoundationSchemaReadiness();
  if (schema.status !== 'ready') {
    return { status: schema.status, database, schema, errorKind: schema.errorKind };
  }

  const auth = await getAuthSessionById(PROBE_AUTH_SESSION_ID);
  if (auth.ok === false) return { status: 'error', database, schema, errorKind: auth.error.kind };
  const pack = await getCompendiumPackById(PROBE_PACK_ID);
  if (pack.ok === false) return { status: 'error', database, schema, errorKind: pack.error.kind };
  const actor = await getCampaignActorInstanceById(PROBE_ACTOR_INSTANCE_ID);
  if (actor.ok === false) return { status: 'error', database, schema, errorKind: actor.error.kind };
  const room = await getRoomRecordByRoomId(PROBE_ROOM_ID);
  if (room.ok === false) return { status: 'error', database, schema, errorKind: room.error.kind };
  const document = await getContentDocumentById(PROBE_DOCUMENT_ID);
  if (document.ok === false) return { status: 'error', database, schema, errorKind: document.error.kind };
  const audit = await getServerAuditLogById(PROBE_AUDIT_ID);
  if (audit.ok === false) return { status: 'error', database, schema, errorKind: audit.error.kind };
  const notification = await getUserNotificationById(PROBE_NOTIFICATION_ID);
  if (notification.ok === false) return { status: 'error', database, schema, errorKind: notification.error.kind };

  return {
    status: 'ready',
    database,
    schema,
    probe: {
      ranAuthSessionLookup: true,
      ranCompendiumLookup: true,
      ranActorInstanceLookup: true,
      ranRoomLookup: true,
      ranContentLookup: true,
      ranAuditLookup: true,
      ranNotificationLookup: true,
      foundUnexpectedRow:
        auth.value !== null ||
        pack.value !== null ||
        actor.value !== null ||
        room.value !== null ||
        document.value !== null ||
        audit.value !== null ||
        notification.value !== null,
    },
  };
}
