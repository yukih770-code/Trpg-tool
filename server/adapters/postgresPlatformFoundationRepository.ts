import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres, withPostgresClient } from '../db/postgresClient.js';

/**
 * Remaining platform Postgres foundation repository (P5.DB-CLOSURE) — server-only.
 *
 * This repository intentionally stores database metadata only. It does not enforce
 * business permissions, does not call AI/policy/API modules, and does not change live
 * Room/Runtime authority. It gives the next API phase stable typed seams for the
 * remaining database families added in migration 0009.
 */

export type PostgresPlatformFoundationRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresPlatformFoundationRepositoryResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        kind: PostgresPlatformFoundationRepositoryErrorKind;
        message: string;
        retryable?: boolean;
      };
    };

export interface PostgresPlatformFoundationRepositoryExecutor {
  query<T extends QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

export interface AuthSessionRecord {
  sessionId: string;
  userId: string;
  sessionKind: string;
  sessionStatus: string;
  trustLevel: string;
  deviceLabel?: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  lastSeenAt?: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface CreateAuthSessionInput {
  sessionId: string;
  userId: string;
  sessionKind?: string;
  sessionStatus?: string;
  trustLevel?: string;
  deviceLabel?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}

export interface WorldServerSettingsVersionRecord {
  settingsVersionId: string;
  worldServerId: string;
  createdByUserId?: string;
  versionNumber: number;
  settingsPayload: Record<string, unknown>;
  softUpdatePolicyPayload: Record<string, unknown>;
  changeSummary?: string;
  createdAt?: string;
  archivedAt?: string;
}

export interface CreateWorldServerSettingsVersionInput {
  settingsVersionId: string;
  worldServerId: string;
  createdByUserId?: string;
  versionNumber: number;
  settingsPayload?: Record<string, unknown>;
  softUpdatePolicyPayload?: Record<string, unknown>;
  changeSummary?: string;
}

export interface WorldServerRulesetVersionRecord {
  rulesetVersionId: string;
  worldServerId: string;
  gameSystemId: string;
  versionLabel: string;
  lifecycleStatus: string;
  rulesetPayload: Record<string, unknown>;
  compatibilityPayload: Record<string, unknown>;
  createdByUserId?: string;
  schemaVersion: number;
  createdAt?: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface CreateWorldServerRulesetVersionInput {
  rulesetVersionId: string;
  worldServerId: string;
  gameSystemId: string;
  versionLabel: string;
  lifecycleStatus?: string;
  rulesetPayload?: Record<string, unknown>;
  compatibilityPayload?: Record<string, unknown>;
  createdByUserId?: string;
  schemaVersion?: number;
  publishedAt?: string;
}

export interface CompendiumPackRecord {
  packId: string;
  ownerId?: string;
  worldServerId?: string;
  campaignId?: string;
  displayName: string;
  packKind: string;
  visibilityScope: string;
  lifecycleStatus: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateCompendiumPackInput {
  packId: string;
  ownerId?: string;
  worldServerId?: string;
  campaignId?: string;
  displayName: string;
  packKind?: string;
  visibilityScope?: string;
  lifecycleStatus?: string;
  metadata?: Record<string, unknown>;
}

export interface CompendiumPackVersionRecord {
  packVersionId: string;
  packId: string;
  versionLabel: string;
  manifest: Record<string, unknown>;
  source: Record<string, unknown>;
  rights: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface CompendiumEntryRecord {
  compendiumEntryId: string;
  packVersionId: string;
  entryKind: string;
  displayName: string;
  sourceRef: Record<string, unknown>;
  contentRef: Record<string, unknown>;
  metadata: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  archivedAt?: string;
}

export interface WorldServerPackBindingRecord {
  packBindingId: string;
  worldServerId: string;
  packVersionId: string;
  bindingStatus: string;
  createdByUserId?: string;
  schemaVersion: number;
  createdAt?: string;
  archivedAt?: string;
}

export interface PrivateCompendiumEntryPublishInput {
  compendiumEntryId: string;
  entryKind: string;
  displayName: string;
  sourceRef?: Record<string, unknown>;
  contentRef?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface PublishPrivateCompendiumPackInput {
  packId: string;
  packVersionId: string;
  packBindingId: string;
  ownerId: string;
  worldServerId: string;
  displayName: string;
  versionLabel: string;
  metadata?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  source?: Record<string, unknown>;
  rights?: Record<string, unknown>;
  entries: PrivateCompendiumEntryPublishInput[];
}

export interface PublishedPrivateCompendiumPack {
  pack: CompendiumPackRecord;
  version: CompendiumPackVersionRecord;
  entries: CompendiumEntryRecord[];
  binding: WorldServerPackBindingRecord;
}

/** A private pack owned by one user, without a World Server binding. */
export interface PublishUserPrivateCompendiumPackInput {
  packId: string;
  packVersionId: string;
  ownerId: string;
  displayName: string;
  versionLabel: string;
  metadata?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  source?: Record<string, unknown>;
  rights?: Record<string, unknown>;
  entries: PrivateCompendiumEntryPublishInput[];
}

export interface PublishedUserPrivateCompendiumPack {
  pack: CompendiumPackRecord;
  version: CompendiumPackVersionRecord;
  entries: CompendiumEntryRecord[];
}

export interface CampaignActorInstanceRecord {
  campaignActorInstanceId: string;
  campaignId: string;
  sourceActorId?: string;
  ownerId?: string;
  actorKind: string;
  displayName: string;
  instanceStatus: string;
  snapshotHash?: string;
  snapshotPayload: Record<string, unknown>;
  overridePayload: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateCampaignActorInstanceInput {
  campaignActorInstanceId: string;
  campaignId: string;
  sourceActorId?: string;
  ownerId?: string;
  actorKind?: string;
  displayName: string;
  instanceStatus?: string;
  snapshotHash?: string;
  snapshotPayload?: Record<string, unknown>;
  overridePayload?: Record<string, unknown>;
}

/** Mutable campaign/session state. The source snapshot remains immutable here. */
export interface UpdateCampaignActorInstanceInput {
  campaignActorInstanceId: string;
  displayName?: string;
  instanceStatus?: string;
  overridePayload?: Record<string, unknown>;
}

export interface RoomRecord {
  roomRecordId: string;
  roomId: string;
  worldServerId?: string;
  campaignId?: string;
  hostUserId?: string;
  roomCode?: string;
  roomStatus: string;
  multiplayerMode: string;
  accessPolicy: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
  archivedAt?: string;
}

export interface CreateRoomRecordInput {
  roomRecordId: string;
  roomId: string;
  worldServerId?: string;
  campaignId?: string;
  hostUserId?: string;
  roomCode?: string;
  roomStatus?: string;
  multiplayerMode?: string;
  accessPolicy?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateRoomRecordInput {
  roomRecordId: string;
  roomCode?: string;
  roomStatus?: string;
  multiplayerMode?: string;
  accessPolicy?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  closedAt?: string;
}

export interface ContentDocumentRecord {
  contentDocumentId: string;
  ownerId?: string;
  worldServerId?: string;
  campaignId?: string;
  assetId?: string;
  documentKind: string;
  title: string;
  bodyText?: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateContentDocumentInput {
  contentDocumentId: string;
  ownerId?: string;
  worldServerId?: string;
  campaignId?: string;
  assetId?: string;
  documentKind?: string;
  title: string;
  bodyText?: string;
  metadata?: Record<string, unknown>;
}

export interface ServerAuditLogRecord {
  auditLogId: string;
  worldServerId?: string;
  campaignId?: string;
  actorUserId?: string;
  actionKind: string;
  targetKind?: string;
  targetId?: string;
  decisionCode: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
}

export interface CreateServerAuditLogInput {
  auditLogId: string;
  worldServerId?: string;
  campaignId?: string;
  actorUserId?: string;
  actionKind: string;
  targetKind?: string;
  targetId?: string;
  decisionCode?: string;
  metadata?: Record<string, unknown>;
}

export interface UserNotificationRecord {
  notificationId: string;
  userId: string;
  worldServerId?: string;
  campaignId?: string;
  notificationKind: string;
  notificationStatus: string;
  title: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  readAt?: string;
  archivedAt?: string;
}

export interface CreateUserNotificationInput {
  notificationId: string;
  userId: string;
  worldServerId?: string;
  campaignId?: string;
  notificationKind: string;
  notificationStatus?: string;
  title: string;
  metadata?: Record<string, unknown>;
}

interface GenericRow extends QueryResultRow {
  [key: string]: unknown;
}

function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function limitOf(value: number | undefined, fallback = 100): number {
  return Number.isInteger(value) && (value as number) > 0 ? (value as number) : fallback;
}

function mapRepositoryError(error: unknown): PostgresPlatformFoundationRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
  }
  if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Platform foundation table is missing.' } };
  }
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === '23505') {
    return { ok: false, error: { kind: 'conflict', message: 'Platform foundation row already exists.' } };
  }
  if (code === '23503') {
    return { ok: false, error: { kind: 'conflict', message: 'Platform foundation row references a missing parent.' } };
  }
  if (code === '42P01') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Platform foundation table is missing.' } };
  }
  const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  return { ok: false, error: { kind: 'database_error', message: 'Platform foundation repository query failed.', retryable } };
}

function rowToAuthSession(row: GenericRow): AuthSessionRecord {
  return {
    sessionId: String(row.session_id),
    userId: String(row.user_id),
    sessionKind: String(row.session_kind),
    sessionStatus: String(row.session_status),
    trustLevel: String(row.trust_level),
    deviceLabel: row.device_label ? String(row.device_label) : undefined,
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at),
    lastSeenAt: toIso(row.last_seen_at),
    expiresAt: toIso(row.expires_at),
    revokedAt: toIso(row.revoked_at),
  };
}

function rowToSettingsVersion(row: GenericRow): WorldServerSettingsVersionRecord {
  return {
    settingsVersionId: String(row.settings_version_id),
    worldServerId: String(row.world_server_id),
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : undefined,
    versionNumber: Number(row.version_number),
    settingsPayload: toPayload(row.settings_payload),
    softUpdatePolicyPayload: toPayload(row.soft_update_policy_payload),
    changeSummary: row.change_summary ? String(row.change_summary) : undefined,
    createdAt: toIso(row.created_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToRulesetVersion(row: GenericRow): WorldServerRulesetVersionRecord {
  return {
    rulesetVersionId: String(row.ruleset_version_id),
    worldServerId: String(row.world_server_id),
    gameSystemId: String(row.game_system_id),
    versionLabel: String(row.version_label),
    lifecycleStatus: String(row.lifecycle_status),
    rulesetPayload: toPayload(row.ruleset_payload),
    compatibilityPayload: toPayload(row.compatibility_payload),
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : undefined,
    schemaVersion: Number(row.schema_version),
    createdAt: toIso(row.created_at),
    publishedAt: toIso(row.published_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToCompendiumPack(row: GenericRow): CompendiumPackRecord {
  return {
    packId: String(row.pack_id),
    ownerId: row.owner_id ? String(row.owner_id) : undefined,
    worldServerId: row.world_server_id ? String(row.world_server_id) : undefined,
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    displayName: String(row.display_name),
    packKind: String(row.pack_kind),
    visibilityScope: String(row.visibility_scope),
    lifecycleStatus: String(row.lifecycle_status),
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToCompendiumPackVersion(row: GenericRow): CompendiumPackVersionRecord {
  return {
    packVersionId: String(row.pack_version_id),
    packId: String(row.pack_id),
    versionLabel: String(row.version_label),
    manifest: toPayload(row.manifest_payload),
    source: toPayload(row.source_payload),
    rights: toPayload(row.rights_payload),
    schemaVersion: Number(row.schema_version),
    createdAt: toIso(row.created_at),
    publishedAt: toIso(row.published_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToCompendiumEntry(row: GenericRow): CompendiumEntryRecord {
  return {
    compendiumEntryId: String(row.compendium_entry_id),
    packVersionId: String(row.pack_version_id),
    entryKind: String(row.entry_kind),
    displayName: String(row.display_name),
    sourceRef: toPayload(row.source_ref_payload),
    contentRef: toPayload(row.content_ref_payload),
    metadata: toPayload(row.metadata_payload),
    schemaVersion: Number(row.schema_version),
    createdAt: toIso(row.created_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToWorldServerPackBinding(row: GenericRow): WorldServerPackBindingRecord {
  return {
    packBindingId: String(row.pack_binding_id),
    worldServerId: String(row.world_server_id),
    packVersionId: String(row.pack_version_id),
    bindingStatus: String(row.binding_status),
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : undefined,
    schemaVersion: Number(row.schema_version),
    createdAt: toIso(row.created_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToActorInstance(row: GenericRow): CampaignActorInstanceRecord {
  return {
    campaignActorInstanceId: String(row.campaign_actor_instance_id),
    campaignId: String(row.campaign_id),
    sourceActorId: row.source_actor_id ? String(row.source_actor_id) : undefined,
    ownerId: row.owner_id ? String(row.owner_id) : undefined,
    actorKind: String(row.actor_kind),
    displayName: String(row.display_name),
    instanceStatus: String(row.instance_status),
    snapshotHash: row.snapshot_hash ? String(row.snapshot_hash) : undefined,
    snapshotPayload: toPayload(row.snapshot_payload),
    overridePayload: toPayload(row.override_payload),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToRoom(row: GenericRow): RoomRecord {
  return {
    roomRecordId: String(row.room_record_id),
    roomId: String(row.room_id),
    worldServerId: row.world_server_id ? String(row.world_server_id) : undefined,
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    hostUserId: row.host_user_id ? String(row.host_user_id) : undefined,
    roomCode: row.room_code ? String(row.room_code) : undefined,
    roomStatus: String(row.room_status),
    multiplayerMode: String(row.multiplayer_mode),
    accessPolicy: toPayload(row.access_policy_payload),
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    closedAt: toIso(row.closed_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToContentDocument(row: GenericRow): ContentDocumentRecord {
  return {
    contentDocumentId: String(row.content_document_id),
    ownerId: row.owner_id ? String(row.owner_id) : undefined,
    worldServerId: row.world_server_id ? String(row.world_server_id) : undefined,
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    assetId: row.asset_id ? String(row.asset_id) : undefined,
    documentKind: String(row.document_kind),
    title: String(row.title),
    bodyText: row.body_text ? String(row.body_text) : undefined,
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToAuditLog(row: GenericRow): ServerAuditLogRecord {
  return {
    auditLogId: String(row.audit_log_id),
    worldServerId: row.world_server_id ? String(row.world_server_id) : undefined,
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : undefined,
    actionKind: String(row.action_kind),
    targetKind: row.target_kind ? String(row.target_kind) : undefined,
    targetId: row.target_id ? String(row.target_id) : undefined,
    decisionCode: String(row.decision_code),
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at),
  };
}

function rowToNotification(row: GenericRow): UserNotificationRecord {
  return {
    notificationId: String(row.notification_id),
    userId: String(row.user_id),
    worldServerId: row.world_server_id ? String(row.world_server_id) : undefined,
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    notificationKind: String(row.notification_kind),
    notificationStatus: String(row.notification_status),
    title: String(row.title),
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at),
    readAt: toIso(row.read_at),
    archivedAt: toIso(row.archived_at),
  };
}

const AUTH_SESSION_COLS = 'session_id,user_id,session_kind,session_status,trust_level,device_label,metadata_payload,created_at,last_seen_at,expires_at,revoked_at';
const SETTINGS_VERSION_COLS = 'settings_version_id,world_server_id,created_by_user_id,version_number,settings_payload,soft_update_policy_payload,change_summary,created_at,archived_at';
const RULESET_VERSION_COLS = 'ruleset_version_id,world_server_id,game_system_id,version_label,lifecycle_status,ruleset_payload,compatibility_payload,created_by_user_id,schema_version,created_at,published_at,archived_at';
const COMPENDIUM_PACK_COLS = 'pack_id,owner_id,world_server_id,campaign_id,display_name,pack_kind,visibility_scope,lifecycle_status,metadata_payload,created_at,updated_at,archived_at';
const COMPENDIUM_PACK_VERSION_COLS = 'pack_version_id,pack_id,version_label,manifest_payload,source_payload,rights_payload,schema_version,created_at,published_at,archived_at';
const COMPENDIUM_ENTRY_COLS = 'compendium_entry_id,pack_version_id,entry_kind,display_name,source_ref_payload,content_ref_payload,metadata_payload,schema_version,created_at,archived_at';
const WORLD_SERVER_PACK_BINDING_COLS = 'pack_binding_id,world_server_id,pack_version_id,binding_status,created_by_user_id,schema_version,created_at,archived_at';
const ACTOR_INSTANCE_COLS = 'campaign_actor_instance_id,campaign_id,source_actor_id,owner_id,actor_kind,display_name,instance_status,snapshot_hash,snapshot_payload,override_payload,created_at,updated_at,archived_at';
const ROOM_COLS = 'room_record_id,room_id,world_server_id,campaign_id,host_user_id,room_code,room_status,multiplayer_mode,access_policy_payload,metadata_payload,created_at,updated_at,closed_at,archived_at';
const CONTENT_DOCUMENT_COLS = 'content_document_id,owner_id,world_server_id,campaign_id,asset_id,document_kind,title,body_text,metadata_payload,created_at,updated_at,archived_at';
const AUDIT_LOG_COLS = 'audit_log_id,world_server_id,campaign_id,actor_user_id,action_kind,target_kind,target_id,decision_code,metadata_payload,created_at';
const NOTIFICATION_COLS = 'notification_id,user_id,world_server_id,campaign_id,notification_kind,notification_status,title,metadata_payload,created_at,read_at,archived_at';

export function createPostgresPlatformFoundationRepository(
  executor: PostgresPlatformFoundationRepositoryExecutor = { query: queryPostgres },
) {
  async function one<T>(
    text: string,
    values: readonly unknown[],
    map: (row: GenericRow) => T,
  ): Promise<PostgresPlatformFoundationRepositoryResult<T | null>> {
    try {
      const result = await executor.query<GenericRow>(text, values);
      return { ok: true, value: result.rows[0] ? map(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function many<T>(
    text: string,
    values: readonly unknown[],
    map: (row: GenericRow) => T,
  ): Promise<PostgresPlatformFoundationRepositoryResult<T[]>> {
    try {
      const result = await executor.query<GenericRow>(text, values);
      return { ok: true, value: result.rows.map(map) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function createAuthSession(input: CreateAuthSessionInput) {
    const now = new Date().toISOString();
    return one<AuthSessionRecord>(
      `INSERT INTO auth_sessions (session_id,user_id,session_kind,session_status,trust_level,device_label,metadata_payload,created_at,last_seen_at,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$8,$9) RETURNING ${AUTH_SESSION_COLS}`,
      [
        input.sessionId,
        input.userId,
        input.sessionKind ?? 'browser',
        input.sessionStatus ?? 'active',
        input.trustLevel ?? 'standard',
        input.deviceLabel ?? null,
        JSON.stringify(input.metadata ?? {}),
        now,
        input.expiresAt ?? null,
      ],
      rowToAuthSession,
    );
  }

  const getAuthSessionById = (sessionId: string) =>
    one<AuthSessionRecord>(`SELECT ${AUTH_SESSION_COLS} FROM auth_sessions WHERE session_id = $1 LIMIT 1`, [sessionId], rowToAuthSession);

  const listAuthSessionsByUser = (userId: string, limit?: number) =>
    many<AuthSessionRecord>(`SELECT ${AUTH_SESSION_COLS} FROM auth_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userId, limitOf(limit)], rowToAuthSession);

  const updateAuthSessionStatus = (sessionId: string, sessionStatus: string, revokedAt?: string) =>
    one<AuthSessionRecord>(
      `UPDATE auth_sessions SET session_status = $2, revoked_at = COALESCE($3, revoked_at), last_seen_at = $4 WHERE session_id = $1 RETURNING ${AUTH_SESSION_COLS}`,
      [sessionId, sessionStatus, revokedAt ?? null, new Date().toISOString()],
      rowToAuthSession,
    );

  const createWorldServerSettingsVersion = (input: CreateWorldServerSettingsVersionInput) =>
    one<WorldServerSettingsVersionRecord>(
      `INSERT INTO world_server_settings_versions (settings_version_id,world_server_id,created_by_user_id,version_number,settings_payload,soft_update_policy_payload,change_summary,created_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8) RETURNING ${SETTINGS_VERSION_COLS}`,
      [
        input.settingsVersionId,
        input.worldServerId,
        input.createdByUserId ?? null,
        input.versionNumber,
        JSON.stringify(input.settingsPayload ?? {}),
        JSON.stringify(input.softUpdatePolicyPayload ?? {}),
        input.changeSummary ?? null,
        new Date().toISOString(),
      ],
      rowToSettingsVersion,
    );

  const getWorldServerSettingsVersionById = (settingsVersionId: string) =>
    one<WorldServerSettingsVersionRecord>(`SELECT ${SETTINGS_VERSION_COLS} FROM world_server_settings_versions WHERE settings_version_id = $1 LIMIT 1`, [settingsVersionId], rowToSettingsVersion);

  const listWorldServerSettingsVersions = (worldServerId: string, limit?: number) =>
    many<WorldServerSettingsVersionRecord>(`SELECT ${SETTINGS_VERSION_COLS} FROM world_server_settings_versions WHERE world_server_id = $1 ORDER BY version_number DESC LIMIT $2`, [worldServerId, limitOf(limit)], rowToSettingsVersion);

  const createWorldServerRulesetVersion = (input: CreateWorldServerRulesetVersionInput) =>
    one<WorldServerRulesetVersionRecord>(
      `INSERT INTO world_server_ruleset_versions (ruleset_version_id,world_server_id,game_system_id,version_label,lifecycle_status,ruleset_payload,compatibility_payload,created_by_user_id,schema_version,created_at,published_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11) RETURNING ${RULESET_VERSION_COLS}`,
      [
        input.rulesetVersionId,
        input.worldServerId,
        input.gameSystemId,
        input.versionLabel,
        input.lifecycleStatus ?? 'draft',
        JSON.stringify(input.rulesetPayload ?? {}),
        JSON.stringify(input.compatibilityPayload ?? {}),
        input.createdByUserId ?? null,
        input.schemaVersion ?? 1,
        new Date().toISOString(),
        input.publishedAt ?? null,
      ],
      rowToRulesetVersion,
    );

  const listWorldServerRulesetVersions = (worldServerId: string, gameSystemId?: string, limit?: number) => {
    const values: unknown[] = [worldServerId];
    const condition = gameSystemId ? (values.push(gameSystemId), ` AND game_system_id = $${values.length}`) : '';
    values.push(limitOf(limit));
    return many<WorldServerRulesetVersionRecord>(
      `SELECT ${RULESET_VERSION_COLS} FROM world_server_ruleset_versions WHERE world_server_id = $1${condition} AND archived_at IS NULL ORDER BY created_at DESC LIMIT $${values.length}`,
      values,
      rowToRulesetVersion,
    );
  };

  const createCompendiumPack = (input: CreateCompendiumPackInput) => {
    const now = new Date().toISOString();
    return one<CompendiumPackRecord>(
      `INSERT INTO compendium_packs (pack_id,owner_id,world_server_id,campaign_id,display_name,pack_kind,visibility_scope,lifecycle_status,metadata_payload,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$10) RETURNING ${COMPENDIUM_PACK_COLS}`,
      [
        input.packId,
        input.ownerId ?? null,
        input.worldServerId ?? null,
        input.campaignId ?? null,
        input.displayName,
        input.packKind ?? 'private',
        input.visibilityScope ?? 'user_private',
        input.lifecycleStatus ?? 'draft',
        JSON.stringify(input.metadata ?? {}),
        now,
      ],
      rowToCompendiumPack,
    );
  };

  const getCompendiumPackById = (packId: string) =>
    one<CompendiumPackRecord>(`SELECT ${COMPENDIUM_PACK_COLS} FROM compendium_packs WHERE pack_id = $1 LIMIT 1`, [packId], rowToCompendiumPack);

  const getCompendiumPackVersionById = (packVersionId: string) =>
    one<CompendiumPackVersionRecord>(`SELECT ${COMPENDIUM_PACK_VERSION_COLS} FROM compendium_pack_versions WHERE pack_version_id = $1 LIMIT 1`, [packVersionId], rowToCompendiumPackVersion);

  const listCompendiumPacksByOwner = (ownerId: string, limit?: number) =>
    many<CompendiumPackRecord>(`SELECT ${COMPENDIUM_PACK_COLS} FROM compendium_packs WHERE owner_id = $1 AND archived_at IS NULL ORDER BY updated_at DESC LIMIT $2`, [ownerId, limitOf(limit)], rowToCompendiumPack);

  const listUserPrivateCompendiumPacksByOwner = (ownerId: string, limit?: number) =>
    many<CompendiumPackRecord>(`SELECT ${COMPENDIUM_PACK_COLS} FROM compendium_packs WHERE owner_id = $1 AND world_server_id IS NULL AND visibility_scope = 'user_private' AND archived_at IS NULL ORDER BY updated_at DESC LIMIT $2`, [ownerId, limitOf(limit)], rowToCompendiumPack);

  const listCompendiumPacksByWorldServer = (worldServerId: string, limit?: number) =>
    many<CompendiumPackRecord>(`SELECT ${COMPENDIUM_PACK_COLS} FROM compendium_packs WHERE world_server_id = $1 AND archived_at IS NULL ORDER BY updated_at DESC LIMIT $2`, [worldServerId, limitOf(limit)], rowToCompendiumPack);

  const listCompendiumPackVersions = (packId: string, limit?: number) =>
    many<CompendiumPackVersionRecord>(`SELECT ${COMPENDIUM_PACK_VERSION_COLS} FROM compendium_pack_versions WHERE pack_id = $1 AND archived_at IS NULL ORDER BY created_at DESC LIMIT $2`, [packId, limitOf(limit)], rowToCompendiumPackVersion);

  const listCompendiumEntries = (packVersionId: string, limit?: number) =>
    many<CompendiumEntryRecord>(`SELECT ${COMPENDIUM_ENTRY_COLS} FROM compendium_entries WHERE pack_version_id = $1 AND archived_at IS NULL ORDER BY created_at ASC LIMIT $2`, [packVersionId, limitOf(limit)], rowToCompendiumEntry);

  const archiveCompendiumPack = (packId: string, archivedAt?: string) =>
    one<CompendiumPackRecord>(`UPDATE compendium_packs SET archived_at = $2, updated_at = $2 WHERE pack_id = $1 RETURNING ${COMPENDIUM_PACK_COLS}`, [packId, archivedAt ?? new Date().toISOString()], rowToCompendiumPack);

  const restoreCompendiumPack = (packId: string) =>
    one<CompendiumPackRecord>(`UPDATE compendium_packs SET archived_at = NULL, updated_at = $2 WHERE pack_id = $1 RETURNING ${COMPENDIUM_PACK_COLS}`, [packId, new Date().toISOString()], rowToCompendiumPack);

  const createCampaignActorInstance = (input: CreateCampaignActorInstanceInput) => {
    const now = new Date().toISOString();
    return one<CampaignActorInstanceRecord>(
      `INSERT INTO campaign_actor_instances (campaign_actor_instance_id,campaign_id,source_actor_id,owner_id,actor_kind,display_name,instance_status,snapshot_hash,snapshot_payload,override_payload,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$11) RETURNING ${ACTOR_INSTANCE_COLS}`,
      [
        input.campaignActorInstanceId,
        input.campaignId,
        input.sourceActorId ?? null,
        input.ownerId ?? null,
        input.actorKind ?? 'pc',
        input.displayName,
        input.instanceStatus ?? 'active',
        input.snapshotHash ?? null,
        JSON.stringify(input.snapshotPayload ?? {}),
        JSON.stringify(input.overridePayload ?? {}),
        now,
      ],
      rowToActorInstance,
    );
  };

  const getCampaignActorInstanceById = (campaignActorInstanceId: string) =>
    one<CampaignActorInstanceRecord>(`SELECT ${ACTOR_INSTANCE_COLS} FROM campaign_actor_instances WHERE campaign_actor_instance_id = $1 LIMIT 1`, [campaignActorInstanceId], rowToActorInstance);

  const listCampaignActorInstances = (campaignId: string, limit?: number) =>
    many<CampaignActorInstanceRecord>(`SELECT ${ACTOR_INSTANCE_COLS} FROM campaign_actor_instances WHERE campaign_id = $1 AND archived_at IS NULL ORDER BY updated_at DESC LIMIT $2`, [campaignId, limitOf(limit)], rowToActorInstance);

  const updateCampaignActorInstance = (input: UpdateCampaignActorInstanceInput) => {
    const now = new Date().toISOString();
    return one<CampaignActorInstanceRecord>(
      `UPDATE campaign_actor_instances
       SET display_name = COALESCE($2, display_name),
           instance_status = COALESCE($3, instance_status),
           override_payload = COALESCE($4::jsonb, override_payload),
           updated_at = $5
       WHERE campaign_actor_instance_id = $1
       RETURNING ${ACTOR_INSTANCE_COLS}`,
      [
        input.campaignActorInstanceId,
        input.displayName ?? null,
        input.instanceStatus ?? null,
        input.overridePayload === undefined ? null : JSON.stringify(input.overridePayload),
        now,
      ],
      rowToActorInstance,
    );
  };

  const archiveCampaignActorInstance = (campaignActorInstanceId: string, archivedAt?: string) =>
    one<CampaignActorInstanceRecord>(`UPDATE campaign_actor_instances SET archived_at = $2, updated_at = $2 WHERE campaign_actor_instance_id = $1 RETURNING ${ACTOR_INSTANCE_COLS}`, [campaignActorInstanceId, archivedAt ?? new Date().toISOString()], rowToActorInstance);

  const restoreCampaignActorInstance = (campaignActorInstanceId: string) =>
    one<CampaignActorInstanceRecord>(`UPDATE campaign_actor_instances SET archived_at = NULL, updated_at = $2 WHERE campaign_actor_instance_id = $1 RETURNING ${ACTOR_INSTANCE_COLS}`, [campaignActorInstanceId, new Date().toISOString()], rowToActorInstance);

  const createRoomRecord = (input: CreateRoomRecordInput) => {
    const now = new Date().toISOString();
    return one<RoomRecord>(
      `INSERT INTO room_records (room_record_id,room_id,world_server_id,campaign_id,host_user_id,room_code,room_status,multiplayer_mode,access_policy_payload,metadata_payload,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$11) RETURNING ${ROOM_COLS}`,
      [
        input.roomRecordId,
        input.roomId,
        input.worldServerId ?? null,
        input.campaignId ?? null,
        input.hostUserId ?? null,
        input.roomCode ?? null,
        input.roomStatus ?? 'lobby',
        input.multiplayerMode ?? 'lan',
        JSON.stringify(input.accessPolicy ?? {}),
        JSON.stringify(input.metadata ?? {}),
        now,
      ],
      rowToRoom,
    );
  };

  const getRoomRecordById = (roomRecordId: string) =>
    one<RoomRecord>(`SELECT ${ROOM_COLS} FROM room_records WHERE room_record_id = $1 LIMIT 1`, [roomRecordId], rowToRoom);

  const getRoomRecordByRoomId = (roomId: string) =>
    one<RoomRecord>(`SELECT ${ROOM_COLS} FROM room_records WHERE room_id = $1 LIMIT 1`, [roomId], rowToRoom);

  const listRoomRecordsByCampaign = (campaignId: string, limit?: number) =>
    many<RoomRecord>(`SELECT ${ROOM_COLS} FROM room_records WHERE campaign_id = $1 AND archived_at IS NULL ORDER BY updated_at DESC LIMIT $2`, [campaignId, limitOf(limit)], rowToRoom);

  const listRecoverableRoomRecords = (limit?: number) =>
    many<RoomRecord>(
      `SELECT ${ROOM_COLS} FROM room_records
       WHERE archived_at IS NULL AND closed_at IS NULL AND room_status <> 'closed'
       ORDER BY updated_at DESC LIMIT $1`,
      [limitOf(limit)],
      rowToRoom,
    );

  const updateRoomRecordStatus = (roomRecordId: string, roomStatus: string, closedAt?: string) =>
    one<RoomRecord>(
      `UPDATE room_records SET room_status = $2, closed_at = COALESCE($3, closed_at), updated_at = $4 WHERE room_record_id = $1 RETURNING ${ROOM_COLS}`,
      [roomRecordId, roomStatus, closedAt ?? null, new Date().toISOString()],
      rowToRoom,
    );

  const updateRoomRecord = (input: UpdateRoomRecordInput) =>
    one<RoomRecord>(
      `UPDATE room_records SET
         room_code = COALESCE($2, room_code),
         room_status = COALESCE($3, room_status),
         multiplayer_mode = COALESCE($4, multiplayer_mode),
         access_policy_payload = COALESCE($5::jsonb, access_policy_payload),
         metadata_payload = COALESCE($6::jsonb, metadata_payload),
         closed_at = COALESCE($7, closed_at),
         updated_at = $8
       WHERE room_record_id = $1
       RETURNING ${ROOM_COLS}`,
      [
        input.roomRecordId,
        input.roomCode ?? null,
        input.roomStatus ?? null,
        input.multiplayerMode ?? null,
        input.accessPolicy ? JSON.stringify(input.accessPolicy) : null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.closedAt ?? null,
        new Date().toISOString(),
      ],
      rowToRoom,
    );

  const createContentDocument = (input: CreateContentDocumentInput) => {
    const now = new Date().toISOString();
    return one<ContentDocumentRecord>(
      `INSERT INTO content_documents (content_document_id,owner_id,world_server_id,campaign_id,asset_id,document_kind,title,body_text,metadata_payload,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$10) RETURNING ${CONTENT_DOCUMENT_COLS}`,
      [
        input.contentDocumentId,
        input.ownerId ?? null,
        input.worldServerId ?? null,
        input.campaignId ?? null,
        input.assetId ?? null,
        input.documentKind ?? 'note',
        input.title,
        input.bodyText ?? null,
        JSON.stringify(input.metadata ?? {}),
        now,
      ],
      rowToContentDocument,
    );
  };

  const getContentDocumentById = (contentDocumentId: string) =>
    one<ContentDocumentRecord>(`SELECT ${CONTENT_DOCUMENT_COLS} FROM content_documents WHERE content_document_id = $1 LIMIT 1`, [contentDocumentId], rowToContentDocument);

  const listContentDocumentsByCampaign = (campaignId: string, limit?: number) =>
    many<ContentDocumentRecord>(`SELECT ${CONTENT_DOCUMENT_COLS} FROM content_documents WHERE campaign_id = $1 AND archived_at IS NULL ORDER BY updated_at DESC LIMIT $2`, [campaignId, limitOf(limit)], rowToContentDocument);

  const archiveContentDocument = (contentDocumentId: string, archivedAt?: string) =>
    one<ContentDocumentRecord>(`UPDATE content_documents SET archived_at = $2, updated_at = $2 WHERE content_document_id = $1 RETURNING ${CONTENT_DOCUMENT_COLS}`, [contentDocumentId, archivedAt ?? new Date().toISOString()], rowToContentDocument);

  const restoreContentDocument = (contentDocumentId: string) =>
    one<ContentDocumentRecord>(`UPDATE content_documents SET archived_at = NULL, updated_at = $2 WHERE content_document_id = $1 RETURNING ${CONTENT_DOCUMENT_COLS}`, [contentDocumentId, new Date().toISOString()], rowToContentDocument);

  const createServerAuditLog = (input: CreateServerAuditLogInput) =>
    one<ServerAuditLogRecord>(
      `INSERT INTO server_audit_log (audit_log_id,world_server_id,campaign_id,actor_user_id,action_kind,target_kind,target_id,decision_code,metadata_payload,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) RETURNING ${AUDIT_LOG_COLS}`,
      [
        input.auditLogId,
        input.worldServerId ?? null,
        input.campaignId ?? null,
        input.actorUserId ?? null,
        input.actionKind,
        input.targetKind ?? null,
        input.targetId ?? null,
        input.decisionCode ?? 'recorded',
        JSON.stringify(input.metadata ?? {}),
        new Date().toISOString(),
      ],
      rowToAuditLog,
    );

  const getServerAuditLogById = (auditLogId: string) =>
    one<ServerAuditLogRecord>(`SELECT ${AUDIT_LOG_COLS} FROM server_audit_log WHERE audit_log_id = $1 LIMIT 1`, [auditLogId], rowToAuditLog);

  const listServerAuditLogsByWorldServer = (worldServerId: string, limit?: number) =>
    many<ServerAuditLogRecord>(`SELECT ${AUDIT_LOG_COLS} FROM server_audit_log WHERE world_server_id = $1 ORDER BY created_at DESC LIMIT $2`, [worldServerId, limitOf(limit)], rowToAuditLog);

  const createUserNotification = (input: CreateUserNotificationInput) =>
    one<UserNotificationRecord>(
      `INSERT INTO user_notifications (notification_id,user_id,world_server_id,campaign_id,notification_kind,notification_status,title,metadata_payload,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) RETURNING ${NOTIFICATION_COLS}`,
      [
        input.notificationId,
        input.userId,
        input.worldServerId ?? null,
        input.campaignId ?? null,
        input.notificationKind,
        input.notificationStatus ?? 'unread',
        input.title,
        JSON.stringify(input.metadata ?? {}),
        new Date().toISOString(),
      ],
      rowToNotification,
    );

  const getUserNotificationById = (notificationId: string) =>
    one<UserNotificationRecord>(`SELECT ${NOTIFICATION_COLS} FROM user_notifications WHERE notification_id = $1 LIMIT 1`, [notificationId], rowToNotification);

  const listUserNotificationsForUser = (userId: string, limit?: number) =>
    many<UserNotificationRecord>(`SELECT ${NOTIFICATION_COLS} FROM user_notifications WHERE user_id = $1 AND archived_at IS NULL ORDER BY created_at DESC LIMIT $2`, [userId, limitOf(limit)], rowToNotification);

  const updateUserNotificationStatus = (notificationId: string, notificationStatus: string, readAt?: string) =>
    one<UserNotificationRecord>(
      `UPDATE user_notifications SET notification_status = $2, read_at = COALESCE($3, read_at) WHERE notification_id = $1 RETURNING ${NOTIFICATION_COLS}`,
      [notificationId, notificationStatus, readAt ?? null],
      rowToNotification,
    );

  async function checkReadiness(): Promise<PostgresPlatformFoundationRepositoryResult<Record<string, boolean>>> {
    try {
      const result = await executor.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN (
           'auth_sessions','service_identities','account_security_audit_records',
           'world_server_settings_versions','world_server_ruleset_versions','campaign_ruleset_snapshots','world_server_update_notices',
           'game_system_registry','ruleset_templates','ruleset_versions','compendium_packs','compendium_pack_versions','compendium_entries','world_server_pack_bindings','campaign_pack_bindings','private_import_batches',
           'campaign_actor_instances','campaign_actor_bindings','runtime_actor_slots',
           'room_records','room_participants','room_lobby_slots','runtime_session_bindings',
           'content_threads','content_messages','content_documents','map_records','scene_map_bindings',
           'server_audit_log','permission_decision_audit_records','ai_operation_audit_records','moderation_actions',
           'user_notifications')`,
      );
      const names = new Set(result.rows.map((row) => row.table_name));
      return {
        ok: true,
        value: {
          auth: names.has('auth_sessions') && names.has('service_identities') && names.has('account_security_audit_records'),
          settings: names.has('world_server_settings_versions') && names.has('world_server_ruleset_versions') && names.has('campaign_ruleset_snapshots') && names.has('world_server_update_notices'),
          compendium: names.has('game_system_registry') && names.has('compendium_packs') && names.has('compendium_pack_versions') && names.has('compendium_entries'),
          actorInstances: names.has('campaign_actor_instances') && names.has('campaign_actor_bindings') && names.has('runtime_actor_slots'),
          rooms: names.has('room_records') && names.has('room_participants') && names.has('room_lobby_slots') && names.has('runtime_session_bindings'),
          content: names.has('content_threads') && names.has('content_messages') && names.has('content_documents') && names.has('map_records') && names.has('scene_map_bindings'),
          audit: names.has('server_audit_log') && names.has('permission_decision_audit_records') && names.has('ai_operation_audit_records') && names.has('moderation_actions'),
          notifications: names.has('user_notifications'),
        },
      };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  return {
    createAuthSession,
    getAuthSessionById,
    listAuthSessionsByUser,
    updateAuthSessionStatus,
    createWorldServerSettingsVersion,
    getWorldServerSettingsVersionById,
    listWorldServerSettingsVersions,
    createWorldServerRulesetVersion,
    listWorldServerRulesetVersions,
    createCompendiumPack,
    getCompendiumPackById,
    getCompendiumPackVersionById,
    listCompendiumPacksByOwner,
    listUserPrivateCompendiumPacksByOwner,
    listCompendiumPacksByWorldServer,
    listCompendiumPackVersions,
    listCompendiumEntries,
    archiveCompendiumPack,
    restoreCompendiumPack,
    createCampaignActorInstance,
    getCampaignActorInstanceById,
    listCampaignActorInstances,
    updateCampaignActorInstance,
    archiveCampaignActorInstance,
    restoreCampaignActorInstance,
    createRoomRecord,
    getRoomRecordById,
    getRoomRecordByRoomId,
    listRoomRecordsByCampaign,
    listRecoverableRoomRecords,
    updateRoomRecordStatus,
    updateRoomRecord,
    createContentDocument,
    getContentDocumentById,
    listContentDocumentsByCampaign,
    archiveContentDocument,
    restoreContentDocument,
    createServerAuditLog,
    getServerAuditLogById,
    listServerAuditLogsByWorldServer,
    createUserNotification,
    getUserNotificationById,
    listUserNotificationsForUser,
    updateUserNotificationStatus,
    checkReadiness,
  };
}

/**
 * Atomically publish a private server-scoped pack. Published versions and their
 * entries are append-only: a later edit must create another pack version rather
 * than update these rows in place.
 */
export async function publishPrivateCompendiumPack(
  input: PublishPrivateCompendiumPackInput,
): Promise<PostgresPlatformFoundationRepositoryResult<PublishedPrivateCompendiumPack>> {
  try {
    return await withPostgresClient(async (client) => {
      try {
        await client.query('BEGIN');
        const now = new Date().toISOString();
        const packResult = await client.query<GenericRow>(
          `INSERT INTO compendium_packs (pack_id,owner_id,world_server_id,campaign_id,display_name,pack_kind,visibility_scope,lifecycle_status,metadata_payload,created_at,updated_at)
           VALUES ($1,$2,$3,NULL,$4,'private','server','published',$5::jsonb,$6,$6)
           RETURNING ${COMPENDIUM_PACK_COLS}`,
          [input.packId, input.ownerId, input.worldServerId, input.displayName, JSON.stringify(input.metadata ?? {}), now],
        );
        const versionResult = await client.query<GenericRow>(
          `INSERT INTO compendium_pack_versions (pack_version_id,pack_id,version_label,manifest_payload,source_payload,rights_payload,schema_version,created_at,published_at)
           VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,1,$7,$7)
           RETURNING ${COMPENDIUM_PACK_VERSION_COLS}`,
          [input.packVersionId, input.packId, input.versionLabel, JSON.stringify(input.manifest ?? {}), JSON.stringify(input.source ?? { sourceKind: 'private' }), JSON.stringify(input.rights ?? { visibilityScope: 'server' }), now],
        );
        const entries: CompendiumEntryRecord[] = [];
        for (const entry of input.entries) {
          const entryResult = await client.query<GenericRow>(
            `INSERT INTO compendium_entries (compendium_entry_id,pack_version_id,entry_kind,display_name,source_ref_payload,content_ref_payload,metadata_payload,schema_version,created_at)
             VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9)
             RETURNING ${COMPENDIUM_ENTRY_COLS}`,
            [entry.compendiumEntryId, input.packVersionId, entry.entryKind, entry.displayName, JSON.stringify(entry.sourceRef ?? { sourceKind: 'private' }), JSON.stringify(entry.contentRef ?? {}), JSON.stringify(entry.metadata ?? {}), entry.schemaVersion ?? 1, now],
          );
          if (!entryResult.rows[0]) throw new Error('missing_compendium_entry');
          entries.push(rowToCompendiumEntry(entryResult.rows[0]));
        }
        const bindingResult = await client.query<GenericRow>(
          `INSERT INTO world_server_pack_bindings (pack_binding_id,world_server_id,pack_version_id,binding_status,created_by_user_id,schema_version,created_at)
           VALUES ($1,$2,$3,'enabled',$4,1,$5)
           RETURNING ${WORLD_SERVER_PACK_BINDING_COLS}`,
          [input.packBindingId, input.worldServerId, input.packVersionId, input.ownerId, now],
        );
        if (!packResult.rows[0] || !versionResult.rows[0] || !bindingResult.rows[0]) {
          throw new Error('missing_compendium_publish_result');
        }
        await client.query('COMMIT');
        return {
          ok: true,
          value: {
            pack: rowToCompendiumPack(packResult.rows[0]),
            version: rowToCompendiumPackVersion(versionResult.rows[0]),
            entries,
            binding: rowToWorldServerPackBinding(bindingResult.rows[0]),
          },
        };
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch { /* original error wins */ }
        return mapRepositoryError(error);
      }
    });
  } catch (error) {
    return mapRepositoryError(error);
  }
}

/**
 * Atomically create an owner-scoped private pack. Unlike the server-scoped
 * publisher above, this deliberately creates no World Server binding: a Room
 * may later review a submitted version reference, but a personal draft never
 * becomes server content merely because its author joined a server.
 */
export async function publishUserPrivateCompendiumPack(
  input: PublishUserPrivateCompendiumPackInput,
): Promise<PostgresPlatformFoundationRepositoryResult<PublishedUserPrivateCompendiumPack>> {
  try {
    return await withPostgresClient(async (client) => {
      try {
        await client.query('BEGIN');
        const now = new Date().toISOString();
        const packResult = await client.query<GenericRow>(
          `INSERT INTO compendium_packs (pack_id,owner_id,world_server_id,campaign_id,display_name,pack_kind,visibility_scope,lifecycle_status,metadata_payload,created_at,updated_at)
           VALUES ($1,$2,NULL,NULL,$3,'private','user_private','published',$4::jsonb,$5,$5)
           RETURNING ${COMPENDIUM_PACK_COLS}`,
          [input.packId, input.ownerId, input.displayName, JSON.stringify(input.metadata ?? {}), now],
        );
        const versionResult = await client.query<GenericRow>(
          `INSERT INTO compendium_pack_versions (pack_version_id,pack_id,version_label,manifest_payload,source_payload,rights_payload,schema_version,created_at,published_at)
           VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,1,$7,$7)
           RETURNING ${COMPENDIUM_PACK_VERSION_COLS}`,
          [input.packVersionId, input.packId, input.versionLabel, JSON.stringify(input.manifest ?? {}), JSON.stringify(input.source ?? { sourceKind: 'private' }), JSON.stringify(input.rights ?? { visibilityScope: 'user_private' }), now],
        );
        const entries: CompendiumEntryRecord[] = [];
        for (const entry of input.entries) {
          const entryResult = await client.query<GenericRow>(
            `INSERT INTO compendium_entries (compendium_entry_id,pack_version_id,entry_kind,display_name,source_ref_payload,content_ref_payload,metadata_payload,schema_version,created_at)
             VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9)
             RETURNING ${COMPENDIUM_ENTRY_COLS}`,
            [entry.compendiumEntryId, input.packVersionId, entry.entryKind, entry.displayName, JSON.stringify(entry.sourceRef ?? { sourceKind: 'private' }), JSON.stringify(entry.contentRef ?? {}), JSON.stringify(entry.metadata ?? {}), entry.schemaVersion ?? 1, now],
          );
          if (!entryResult.rows[0]) throw new Error('missing_compendium_entry');
          entries.push(rowToCompendiumEntry(entryResult.rows[0]));
        }
        if (!packResult.rows[0] || !versionResult.rows[0]) throw new Error('missing_personal_compendium_publish_result');
        await client.query('COMMIT');
        return {
          ok: true,
          value: {
            pack: rowToCompendiumPack(packResult.rows[0]),
            version: rowToCompendiumPackVersion(versionResult.rows[0]),
            entries,
          },
        };
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch { /* original error wins */ }
        return mapRepositoryError(error);
      }
    });
  } catch (error) {
    return mapRepositoryError(error);
  }
}

const defaultPostgresPlatformFoundationRepository = createPostgresPlatformFoundationRepository();

export async function checkPostgresPlatformFoundationRepositoryReadiness(): Promise<PostgresPlatformFoundationRepositoryResult<Record<string, boolean>>> {
  return defaultPostgresPlatformFoundationRepository.checkReadiness();
}

export async function getAuthSessionById(sessionId: string): Promise<PostgresPlatformFoundationRepositoryResult<AuthSessionRecord | null>> {
  return defaultPostgresPlatformFoundationRepository.getAuthSessionById(sessionId);
}

export async function getCompendiumPackById(packId: string): Promise<PostgresPlatformFoundationRepositoryResult<CompendiumPackRecord | null>> {
  return defaultPostgresPlatformFoundationRepository.getCompendiumPackById(packId);
}

export async function getCompendiumPackVersionById(packVersionId: string): Promise<PostgresPlatformFoundationRepositoryResult<CompendiumPackVersionRecord | null>> {
  return defaultPostgresPlatformFoundationRepository.getCompendiumPackVersionById(packVersionId);
}

export async function getCampaignActorInstanceById(campaignActorInstanceId: string): Promise<PostgresPlatformFoundationRepositoryResult<CampaignActorInstanceRecord | null>> {
  return defaultPostgresPlatformFoundationRepository.getCampaignActorInstanceById(campaignActorInstanceId);
}

export async function getRoomRecordByRoomId(roomId: string): Promise<PostgresPlatformFoundationRepositoryResult<RoomRecord | null>> {
  return defaultPostgresPlatformFoundationRepository.getRoomRecordByRoomId(roomId);
}

export async function getContentDocumentById(contentDocumentId: string): Promise<PostgresPlatformFoundationRepositoryResult<ContentDocumentRecord | null>> {
  return defaultPostgresPlatformFoundationRepository.getContentDocumentById(contentDocumentId);
}

export async function getServerAuditLogById(auditLogId: string): Promise<PostgresPlatformFoundationRepositoryResult<ServerAuditLogRecord | null>> {
  return defaultPostgresPlatformFoundationRepository.getServerAuditLogById(auditLogId);
}

export async function getUserNotificationById(notificationId: string): Promise<PostgresPlatformFoundationRepositoryResult<UserNotificationRecord | null>> {
  return defaultPostgresPlatformFoundationRepository.getUserNotificationById(notificationId);
}
