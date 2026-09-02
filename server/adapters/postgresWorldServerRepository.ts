import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres, readSafePostgresErrorCode } from '../db/postgresClient.js';

/**
 * Postgres World Server + Membership + Game System repository (P5.16-P5.18) — server-only.
 *
 * Mirrors the prior slices (safe result envelope, injectable executor, DB error
 * mapping that never leaks raw driver errors). Covers world_servers + campaign
 * bindings + game-system bindings + roles + memberships + invites + join requests.
 *
 * A World Server is a SCOPED COMMUNITY. The Global Public Surface is NOT modeled here
 * (no main/global/default server row). Server != Game System: a server may enable
 * MULTIPLE game systems via world_server_game_system_bindings; `default_game_system_id`
 * is a convenience HINT, never exclusivity. `owner_id` is the canonical owner.
 * Roles/permissions_payload, membership_status, server_visibility, join_policy,
 * invite_code, join requests, and game-system bindings are STORED METADATA / workflow
 * state — this slice enforces NO permissions, sends NO email, and implements NO
 * redemption/approval/compendium/ruleset logic. Campaign binding does NOT change
 * campaign/runtime authority. game_system_id / ruleset_template_id /
 * current_ruleset_version_id / enabled_pack_version_ids are forward-compatible opaque
 * refs (no FK).
 */

export type PostgresWorldServerRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresWorldServerRepositoryResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        kind: PostgresWorldServerRepositoryErrorKind;
        message: string;
        retryable?: boolean;
        /**
         * Optional machine-readable discriminator for cases where `kind` alone
         * is ambiguous. Additive: existing errors omit it and existing callers
         * ignore it.
         */
        reason?: string;
      };
    };

/**
 * `world_servers` has exactly ONE outbound foreign key — `owner_id -> users` —
 * so a foreign-key violation on its INSERT can only mean the owner user row is
 * missing. That is the everyday local-development failure: the dev identity seam
 * accepts `x-dev-user-id` without a database lookup, so a database with no such
 * user reads fine and fails on the first write.
 */
export const MISSING_OWNER_USER_REASON = 'missing_owner_user';

// ── Records ──────────────────────────────────────────────────────────────────

export interface WorldServerRecord {
  worldServerId: string;
  ownerId: string;
  serverHandle: string;
  displayName: string;
  description?: string;
  serverVisibility: string;
  joinPolicy: string;
  lifecycleStatus: string;
  /** Convenience default hint only — NOT an exclusivity constraint. */
  defaultGameSystemId?: string;
  publicProfilePayload: Record<string, unknown>;
  serverSettingsPayload: Record<string, unknown>;
  softUpdatePolicyPayload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface WorldServerCampaignBindingRecord {
  bindingId: string;
  worldServerId: string;
  campaignId: string;
  createdByUserId?: string;
  bindingKind: string;
  visibilityScope: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface WorldServerGameSystemBindingRecord {
  bindingId: string;
  worldServerId: string;
  gameSystemId: string;
  displayName: string;
  systemKind: string;
  bindingStatus: string;
  isDefault: boolean;
  rulesetTemplateId?: string;
  currentRulesetVersionId?: string;
  config: Record<string, unknown>;
  enabledPackVersionIds: string[];
  schemaVersion: number;
  createdByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface WorldServerRoleRecord {
  roleId: string;
  worldServerId: string;
  roleKey: string;
  displayName: string;
  roleKind: string;
  permissionsPayload: Record<string, unknown>;
  isSystemRole: boolean;
  sortOrder: number;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface WorldServerMembershipRecord {
  membershipId: string;
  worldServerId: string;
  userId: string;
  roleId?: string;
  roleKey: string;
  membershipStatus: string;
  displayAlias?: string;
  invitedByUserId?: string;
  approvedByUserId?: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface WorldServerInviteRecord {
  inviteId: string;
  worldServerId: string;
  inviteCode: string;
  createdByUserId: string;
  targetUserId?: string;
  targetEmail?: string;
  defaultRoleKey: string;
  inviteStatus: string;
  maxUses?: number;
  useCount: number;
  expiresAt?: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

/**
 * The small, safe result of accepting a private server invite. It deliberately
 * excludes the invitation code so callers never need to retain or serialize it.
 */
export interface WorldServerInviteRedemptionRecord {
  inviteId: string;
  worldServerId: string;
  membershipId: string;
  membershipStatus: string;
  roleKey: string;
}

export interface WorldServerJoinRequestRecord {
  joinRequestId: string;
  worldServerId: string;
  requesterUserId: string;
  reviewedByUserId?: string;
  requestStatus: string;
  requestMessage?: string;
  responseMessage?: string;
  requestedRoleKey: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  requestedAt?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateWorldServerInput {
  worldServerId: string;
  ownerId: string;
  serverHandle: string;
  displayName: string;
  description?: string;
  serverVisibility?: string;
  joinPolicy?: string;
  lifecycleStatus?: string;
  defaultGameSystemId?: string;
  publicProfilePayload?: Record<string, unknown>;
  serverSettingsPayload?: Record<string, unknown>;
  softUpdatePolicyPayload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface UpdateWorldServerProfileInput {
  worldServerId: string;
  displayName?: string;
  description?: string;
  serverVisibility?: string;
  joinPolicy?: string;
  lifecycleStatus?: string;
  publicProfilePayload?: Record<string, unknown>;
}

export interface UpdateWorldServerSettingsInput {
  worldServerId: string;
  defaultGameSystemId?: string;
  serverSettingsPayload?: Record<string, unknown>;
  softUpdatePolicyPayload?: Record<string, unknown>;
}

export interface ListWorldServersByOwnerOptions {
  includeArchived?: boolean;
  lifecycleStatus?: string;
  serverVisibility?: string;
  limit?: number;
}

export interface ListDiscoverableWorldServersOptions {
  serverVisibility?: string;
  joinPolicy?: string;
  includeArchived?: boolean;
  limit?: number;
}

export interface BindCampaignToWorldServerInput {
  bindingId: string;
  worldServerId: string;
  campaignId: string;
  createdByUserId?: string;
  bindingKind?: string;
  visibilityScope?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface UpdateWorldServerCampaignBindingInput {
  bindingId: string;
  bindingKind?: string;
  visibilityScope?: string;
  payload?: Record<string, unknown>;
}

export interface ListCampaignBindingsOptions {
  includeArchived?: boolean;
  visibilityScope?: string;
  limit?: number;
}

export interface BindGameSystemToWorldServerInput {
  bindingId: string;
  worldServerId: string;
  gameSystemId: string;
  displayName: string;
  systemKind?: string;
  bindingStatus?: string;
  isDefault?: boolean;
  rulesetTemplateId?: string;
  currentRulesetVersionId?: string;
  config?: Record<string, unknown>;
  enabledPackVersionIds?: string[];
  schemaVersion?: number;
  createdByUserId?: string;
}

export interface UpdateWorldServerGameSystemBindingInput {
  bindingId: string;
  displayName?: string;
  systemKind?: string;
  isDefault?: boolean;
  rulesetTemplateId?: string;
  currentRulesetVersionId?: string;
  config?: Record<string, unknown>;
  enabledPackVersionIds?: string[];
}

export interface UpdateWorldServerGameSystemBindingStatusInput {
  bindingId: string;
  bindingStatus: string;
  isDefault?: boolean;
}

export interface ListGameSystemBindingsOptions {
  includeArchived?: boolean;
  systemKind?: string;
  bindingStatus?: string;
  isDefault?: boolean;
  limit?: number;
}

export interface CreateWorldServerRoleInput {
  roleId: string;
  worldServerId: string;
  roleKey: string;
  displayName: string;
  roleKind?: string;
  permissionsPayload?: Record<string, unknown>;
  isSystemRole?: boolean;
  sortOrder?: number;
  schemaVersion?: number;
}

export interface UpdateWorldServerRoleInput {
  roleId: string;
  displayName?: string;
  roleKind?: string;
  permissionsPayload?: Record<string, unknown>;
  sortOrder?: number;
}

export interface ListWorldServerRolesOptions {
  includeArchived?: boolean;
  roleKind?: string;
  limit?: number;
}

export interface CreateWorldServerMembershipInput {
  membershipId: string;
  worldServerId: string;
  userId: string;
  roleId?: string;
  roleKey?: string;
  membershipStatus?: string;
  displayAlias?: string;
  invitedByUserId?: string;
  approvedByUserId?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
  joinedAt?: string;
}

export interface UpdateWorldServerMembershipInput {
  membershipId: string;
  roleId?: string;
  roleKey?: string;
  displayAlias?: string;
  payload?: Record<string, unknown>;
}

export interface UpdateWorldServerMembershipStatusInput {
  membershipId: string;
  membershipStatus: string;
  approvedByUserId?: string;
  joinedAt?: string;
}

export interface ListWorldServerMembershipsOptions {
  includeArchived?: boolean;
  membershipStatus?: string;
  roleKey?: string;
  limit?: number;
}

export interface CreateWorldServerInviteInput {
  inviteId: string;
  worldServerId: string;
  inviteCode: string;
  createdByUserId: string;
  targetUserId?: string;
  targetEmail?: string;
  defaultRoleKey?: string;
  inviteStatus?: string;
  maxUses?: number;
  useCount?: number;
  expiresAt?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface RedeemWorldServerInviteInput {
  inviteCode: string;
  userId: string;
  membershipId: string;
  displayAlias?: string;
}

export interface UpdateWorldServerInviteInput {
  inviteId: string;
  targetUserId?: string;
  targetEmail?: string;
  defaultRoleKey?: string;
  maxUses?: number;
  useCount?: number;
  expiresAt?: string;
  payload?: Record<string, unknown>;
}

export interface UpdateWorldServerInviteStatusInput {
  inviteId: string;
  inviteStatus: string;
}

export interface ListWorldServerInvitesOptions {
  includeArchived?: boolean;
  inviteStatus?: string;
  limit?: number;
}

export interface CreateWorldServerJoinRequestInput {
  joinRequestId: string;
  worldServerId: string;
  requesterUserId: string;
  requestStatus?: string;
  requestMessage?: string;
  requestedRoleKey?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
  requestedAt?: string;
}

export interface UpdateWorldServerJoinRequestStatusInput {
  joinRequestId: string;
  requestStatus: string;
  reviewedByUserId?: string;
  responseMessage?: string;
  reviewedAt?: string;
}

export interface ListWorldServerJoinRequestsOptions {
  includeArchived?: boolean;
  requestStatus?: string;
  limit?: number;
}

export interface PostgresWorldServerRepositoryExecutor {
  query<T extends QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

export interface PostgresWorldServerRepositoryOptions {
  /** Defaults true; smoke tests pass an already-transactional client with false. */
  useInternalTransactions?: boolean;
}

// ── Rows ─────────────────────────────────────────────────────────────────────

interface WorldServerRow extends QueryResultRow {
  world_server_id: string;
  owner_id: string;
  server_handle: string;
  display_name: string;
  description: string | null;
  server_visibility: string;
  join_policy: string;
  lifecycle_status: string;
  default_game_system_id: string | null;
  public_profile_payload: unknown;
  server_settings_payload: unknown;
  soft_update_policy_payload: unknown;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface BindingRow extends QueryResultRow {
  binding_id: string;
  world_server_id: string;
  campaign_id: string;
  created_by_user_id: string | null;
  binding_kind: string;
  visibility_scope: string;
  binding_payload: unknown;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface GameSystemBindingRow extends QueryResultRow {
  binding_id: string;
  world_server_id: string;
  game_system_id: string;
  display_name: string;
  system_kind: string;
  binding_status: string;
  is_default: boolean;
  ruleset_template_id: string | null;
  current_ruleset_version_id: string | null;
  config_payload: unknown;
  enabled_pack_version_ids: unknown;
  schema_version: number;
  created_by_user_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface RoleRow extends QueryResultRow {
  role_id: string;
  world_server_id: string;
  role_key: string;
  display_name: string;
  role_kind: string;
  permissions_payload: unknown;
  is_system_role: boolean;
  sort_order: number;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface MembershipRow extends QueryResultRow {
  membership_id: string;
  world_server_id: string;
  user_id: string;
  role_id: string | null;
  role_key: string;
  membership_status: string;
  display_alias: string | null;
  invited_by_user_id: string | null;
  approved_by_user_id: string | null;
  membership_payload: unknown;
  schema_version: number;
  joined_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface InviteRow extends QueryResultRow {
  invite_id: string;
  world_server_id: string;
  invite_code: string;
  created_by_user_id: string;
  target_user_id: string | null;
  target_email: string | null;
  default_role_key: string;
  invite_status: string;
  max_uses: number | string | null;
  use_count: number | string;
  expires_at: Date | string | null;
  invite_payload: unknown;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface JoinRequestRow extends QueryResultRow {
  join_request_id: string;
  world_server_id: string;
  requester_user_id: string;
  reviewed_by_user_id: string | null;
  request_status: string;
  request_message: string | null;
  response_message: string | null;
  requested_role_key: string;
  request_payload: unknown;
  schema_version: number;
  requested_at: Date | string;
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

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toNumber(value: number | string, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toOptionalNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function limitOf(value: number | undefined, fallback = 200): number {
  return Number.isInteger(value) && (value as number) > 0 ? (value as number) : fallback;
}

function mapRepositoryError(error: unknown): PostgresWorldServerRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
  }
  if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
    return { ok: false, error: { kind: 'schema_missing', message: 'World server repository table is missing.' } };
  }
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === '23505') {
    return { ok: false, error: { kind: 'conflict', message: 'World server row already exists (duplicate handle/code/pair).' } };
  }
  if (code === '23503') {
    return { ok: false, error: { kind: 'conflict', message: 'World server row references a missing owner/user/campaign/role.' } };
  }
  if (code === '42P01') {
    return { ok: false, error: { kind: 'schema_missing', message: 'World server repository table is missing.' } };
  }
  const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  return { ok: false, error: { kind: 'database_error', message: 'World server repository query failed.', retryable } };
}

/**
 * `createWorldServer` inserts into exactly one table, and that table has exactly
 * one foreign key (`owner_id -> users`). A 23503 here is therefore PROVABLY a
 * missing owner user, which is why the precise reason is attached at this call
 * site and not in the shared mapper — every other table has a wider FK set where
 * the same code would be ambiguous.
 */
function mapCreateWorldServerError(error: unknown): PostgresWorldServerRepositoryResult<never> {
  const mapped = mapRepositoryError(error);
  if (mapped.ok === false && readSafePostgresErrorCode(error) === '23503') {
    return {
      ok: false,
      error: {
        ...mapped.error,
        reason: MISSING_OWNER_USER_REASON,
        message: 'World server owner user does not exist.',
      },
    };
  }
  return mapped;
}

// ── Row mappers ──────────────────────────────────────────────────────────────

function rowToServer(row: WorldServerRow): WorldServerRecord {
  return {
    worldServerId: row.world_server_id,
    ownerId: row.owner_id,
    serverHandle: row.server_handle,
    displayName: row.display_name,
    description: row.description ?? undefined,
    serverVisibility: row.server_visibility,
    joinPolicy: row.join_policy,
    lifecycleStatus: row.lifecycle_status,
    defaultGameSystemId: row.default_game_system_id ?? undefined,
    publicProfilePayload: toPayload(row.public_profile_payload),
    serverSettingsPayload: toPayload(row.server_settings_payload),
    softUpdatePolicyPayload: toPayload(row.soft_update_policy_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToBinding(row: BindingRow): WorldServerCampaignBindingRecord {
  return {
    bindingId: row.binding_id,
    worldServerId: row.world_server_id,
    campaignId: row.campaign_id,
    createdByUserId: row.created_by_user_id ?? undefined,
    bindingKind: row.binding_kind,
    visibilityScope: row.visibility_scope,
    payload: toPayload(row.binding_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToGameSystemBinding(row: GameSystemBindingRow): WorldServerGameSystemBindingRecord {
  return {
    bindingId: row.binding_id,
    worldServerId: row.world_server_id,
    gameSystemId: row.game_system_id,
    displayName: row.display_name,
    systemKind: row.system_kind,
    bindingStatus: row.binding_status,
    isDefault: row.is_default === true,
    rulesetTemplateId: row.ruleset_template_id ?? undefined,
    currentRulesetVersionId: row.current_ruleset_version_id ?? undefined,
    config: toPayload(row.config_payload),
    enabledPackVersionIds: toStringArray(row.enabled_pack_version_ids),
    schemaVersion: row.schema_version,
    createdByUserId: row.created_by_user_id ?? undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToRole(row: RoleRow): WorldServerRoleRecord {
  return {
    roleId: row.role_id,
    worldServerId: row.world_server_id,
    roleKey: row.role_key,
    displayName: row.display_name,
    roleKind: row.role_kind,
    permissionsPayload: toPayload(row.permissions_payload),
    isSystemRole: row.is_system_role === true,
    sortOrder: row.sort_order,
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToMembership(row: MembershipRow): WorldServerMembershipRecord {
  return {
    membershipId: row.membership_id,
    worldServerId: row.world_server_id,
    userId: row.user_id,
    roleId: row.role_id ?? undefined,
    roleKey: row.role_key,
    membershipStatus: row.membership_status,
    displayAlias: row.display_alias ?? undefined,
    invitedByUserId: row.invited_by_user_id ?? undefined,
    approvedByUserId: row.approved_by_user_id ?? undefined,
    payload: toPayload(row.membership_payload),
    schemaVersion: row.schema_version,
    joinedAt: toIso(row.joined_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToInvite(row: InviteRow): WorldServerInviteRecord {
  return {
    inviteId: row.invite_id,
    worldServerId: row.world_server_id,
    inviteCode: row.invite_code,
    createdByUserId: row.created_by_user_id,
    targetUserId: row.target_user_id ?? undefined,
    targetEmail: row.target_email ?? undefined,
    defaultRoleKey: row.default_role_key,
    inviteStatus: row.invite_status,
    maxUses: toOptionalNumber(row.max_uses),
    useCount: toNumber(row.use_count),
    expiresAt: toIso(row.expires_at),
    payload: toPayload(row.invite_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToJoinRequest(row: JoinRequestRow): WorldServerJoinRequestRecord {
  return {
    joinRequestId: row.join_request_id,
    worldServerId: row.world_server_id,
    requesterUserId: row.requester_user_id,
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    requestStatus: row.request_status,
    requestMessage: row.request_message ?? undefined,
    responseMessage: row.response_message ?? undefined,
    requestedRoleKey: row.requested_role_key,
    payload: toPayload(row.request_payload),
    schemaVersion: row.schema_version,
    requestedAt: toIso(row.requested_at),
    reviewedAt: toIso(row.reviewed_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

// ── Column lists ─────────────────────────────────────────────────────────────

const SERVER_COLS = `
  world_server_id, owner_id, server_handle, display_name, description,
  server_visibility, join_policy, lifecycle_status, default_game_system_id,
  public_profile_payload, server_settings_payload, soft_update_policy_payload,
  schema_version, created_at, updated_at, archived_at
`;
const BINDING_COLS = `
  binding_id, world_server_id, campaign_id, created_by_user_id, binding_kind,
  visibility_scope, binding_payload, schema_version, created_at, updated_at, archived_at
`;
const GSB_COLS = `
  binding_id, world_server_id, game_system_id, display_name, system_kind, binding_status,
  is_default, ruleset_template_id, current_ruleset_version_id, config_payload,
  enabled_pack_version_ids, schema_version, created_by_user_id, created_at, updated_at, archived_at
`;
const ROLE_COLS = `
  role_id, world_server_id, role_key, display_name, role_kind, permissions_payload,
  is_system_role, sort_order, schema_version, created_at, updated_at, archived_at
`;
const MEMBERSHIP_COLS = `
  membership_id, world_server_id, user_id, role_id, role_key, membership_status,
  display_alias, invited_by_user_id, approved_by_user_id, membership_payload,
  schema_version, joined_at, created_at, updated_at, archived_at
`;
const INVITE_COLS = `
  invite_id, world_server_id, invite_code, created_by_user_id, target_user_id,
  target_email, default_role_key, invite_status, max_uses, use_count, expires_at,
  invite_payload, schema_version, created_at, updated_at, archived_at
`;
const JOIN_REQUEST_COLS = `
  join_request_id, world_server_id, requester_user_id, reviewed_by_user_id,
  request_status, request_message, response_message, requested_role_key,
  request_payload, schema_version, requested_at, reviewed_at, created_at, updated_at, archived_at
`;

const defaultExecutor: PostgresWorldServerRepositoryExecutor = {
  query: (text, values) => queryPostgres(text, values),
};

export interface PostgresWorldServerRepository {
  // World servers
  getWorldServerById(worldServerId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord | null>>;
  getWorldServerByHandle(serverHandle: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord | null>>;
  listWorldServersByOwner(ownerId: string, options?: ListWorldServersByOwnerOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord[]>>;
  listDiscoverableWorldServers(options?: ListDiscoverableWorldServersOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord[]>>;
  createWorldServer(input: CreateWorldServerInput): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord>>;
  updateWorldServerProfile(input: UpdateWorldServerProfileInput): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord | null>>;
  updateWorldServerSettings(input: UpdateWorldServerSettingsInput): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord | null>>;
  archiveWorldServer(worldServerId: string, archivedAt?: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord | null>>;
  restoreWorldServer(worldServerId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord | null>>;
  // Campaign bindings
  getWorldServerCampaignBinding(bindingId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord | null>>;
  getWorldServerCampaignBindingByPair(worldServerId: string, campaignId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord | null>>;
  listCampaignBindingsByWorldServer(worldServerId: string, options?: ListCampaignBindingsOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord[]>>;
  listWorldServerBindingsForCampaign(campaignId: string, options?: ListCampaignBindingsOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord[]>>;
  bindCampaignToWorldServer(input: BindCampaignToWorldServerInput): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord>>;
  updateWorldServerCampaignBinding(input: UpdateWorldServerCampaignBindingInput): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord | null>>;
  archiveWorldServerCampaignBinding(bindingId: string, archivedAt?: string): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord | null>>;
  restoreWorldServerCampaignBinding(bindingId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord | null>>;
  // Game system bindings (multiple systems per server)
  getWorldServerGameSystemBinding(bindingId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord | null>>;
  getWorldServerGameSystemBindingBySystem(worldServerId: string, gameSystemId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord | null>>;
  listGameSystemBindingsByWorldServer(worldServerId: string, options?: ListGameSystemBindingsOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord[]>>;
  listDefaultGameSystemBindingsByWorldServer(worldServerId: string, options?: ListGameSystemBindingsOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord[]>>;
  bindGameSystemToWorldServer(input: BindGameSystemToWorldServerInput): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord>>;
  updateWorldServerGameSystemBinding(input: UpdateWorldServerGameSystemBindingInput): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord | null>>;
  updateWorldServerGameSystemBindingStatus(input: UpdateWorldServerGameSystemBindingStatusInput): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord | null>>;
  archiveWorldServerGameSystemBinding(bindingId: string, archivedAt?: string): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord | null>>;
  restoreWorldServerGameSystemBinding(bindingId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord | null>>;
  // Roles
  getWorldServerRoleById(roleId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRoleRecord | null>>;
  getWorldServerRoleByKey(worldServerId: string, roleKey: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRoleRecord | null>>;
  listWorldServerRoles(worldServerId: string, options?: ListWorldServerRolesOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerRoleRecord[]>>;
  createWorldServerRole(input: CreateWorldServerRoleInput): Promise<PostgresWorldServerRepositoryResult<WorldServerRoleRecord>>;
  updateWorldServerRole(input: UpdateWorldServerRoleInput): Promise<PostgresWorldServerRepositoryResult<WorldServerRoleRecord | null>>;
  archiveWorldServerRole(roleId: string, archivedAt?: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRoleRecord | null>>;
  restoreWorldServerRole(roleId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRoleRecord | null>>;
  // Memberships
  getWorldServerMembershipById(membershipId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord | null>>;
  getWorldServerMembershipByUser(worldServerId: string, userId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord | null>>;
  listWorldServerMemberships(worldServerId: string, options?: ListWorldServerMembershipsOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord[]>>;
  listWorldServerMembershipsForUser(userId: string, options?: ListWorldServerMembershipsOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord[]>>;
  createWorldServerMembership(input: CreateWorldServerMembershipInput): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord>>;
  updateWorldServerMembership(input: UpdateWorldServerMembershipInput): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord | null>>;
  updateWorldServerMembershipStatus(input: UpdateWorldServerMembershipStatusInput): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord | null>>;
  archiveWorldServerMembership(membershipId: string, archivedAt?: string): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord | null>>;
  restoreWorldServerMembership(membershipId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord | null>>;
  // Invites
  getWorldServerInviteById(inviteId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord | null>>;
  getWorldServerInviteByCode(inviteCode: string): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord | null>>;
  listWorldServerInvites(worldServerId: string, options?: ListWorldServerInvitesOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord[]>>;
  createWorldServerInvite(input: CreateWorldServerInviteInput): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord>>;
  /** Atomically claims a one-person invite and creates or restores its membership. */
  redeemWorldServerInvite(input: RedeemWorldServerInviteInput): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRedemptionRecord | null>>;
  updateWorldServerInvite(input: UpdateWorldServerInviteInput): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord | null>>;
  updateWorldServerInviteStatus(input: UpdateWorldServerInviteStatusInput): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord | null>>;
  archiveWorldServerInvite(inviteId: string, archivedAt?: string): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord | null>>;
  restoreWorldServerInvite(inviteId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord | null>>;
  // Join requests
  getWorldServerJoinRequestById(joinRequestId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerJoinRequestRecord | null>>;
  listWorldServerJoinRequests(worldServerId: string, options?: ListWorldServerJoinRequestsOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerJoinRequestRecord[]>>;
  listWorldServerJoinRequestsForUser(requesterUserId: string, options?: ListWorldServerJoinRequestsOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerJoinRequestRecord[]>>;
  createWorldServerJoinRequest(input: CreateWorldServerJoinRequestInput): Promise<PostgresWorldServerRepositoryResult<WorldServerJoinRequestRecord>>;
  updateWorldServerJoinRequestStatus(input: UpdateWorldServerJoinRequestStatusInput): Promise<PostgresWorldServerRepositoryResult<WorldServerJoinRequestRecord | null>>;
  archiveWorldServerJoinRequest(joinRequestId: string, archivedAt?: string): Promise<PostgresWorldServerRepositoryResult<WorldServerJoinRequestRecord | null>>;
  restoreWorldServerJoinRequest(joinRequestId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerJoinRequestRecord | null>>;
  checkReadiness(): Promise<PostgresWorldServerRepositoryResult<Record<string, boolean>>>;
}

export function createPostgresWorldServerRepository(
  executor: PostgresWorldServerRepositoryExecutor = defaultExecutor,
  _options: PostgresWorldServerRepositoryOptions = {},
): PostgresWorldServerRepository {
  async function one<Row extends QueryResultRow, Rec>(sql: string, values: readonly unknown[], map: (row: Row) => Rec): Promise<PostgresWorldServerRepositoryResult<Rec | null>> {
    try {
      const result = await executor.query<Row>(sql, values);
      return { ok: true, value: result.rows[0] ? map(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function many<Row extends QueryResultRow, Rec>(sql: string, values: readonly unknown[], map: (row: Row) => Rec): Promise<PostgresWorldServerRepositoryResult<Rec[]>> {
    try {
      const result = await executor.query<Row>(sql, values);
      return { ok: true, value: result.rows.map(map) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  // ── World servers ──────────────────────────────────────────────────────────

  const getWorldServerById = (worldServerId: string) =>
    one<WorldServerRow, WorldServerRecord>(`SELECT ${SERVER_COLS} FROM world_servers WHERE world_server_id = $1 LIMIT 1`, [worldServerId], rowToServer);
  const getWorldServerByHandle = (serverHandle: string) =>
    one<WorldServerRow, WorldServerRecord>(`SELECT ${SERVER_COLS} FROM world_servers WHERE server_handle = $1 LIMIT 1`, [serverHandle], rowToServer);

  async function listWorldServersByOwner(ownerId: string, options: ListWorldServersByOwnerOptions = {}) {
    const conditions = ['owner_id = $1'];
    const values: unknown[] = [ownerId];
    if (options.lifecycleStatus) { values.push(options.lifecycleStatus); conditions.push(`lifecycle_status = $${values.length}`); }
    if (options.serverVisibility) { values.push(options.serverVisibility); conditions.push(`server_visibility = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<WorldServerRow, WorldServerRecord>(`SELECT ${SERVER_COLS} FROM world_servers WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToServer);
  }

  async function listDiscoverableWorldServers(options: ListDiscoverableWorldServersOptions = {}) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (options.serverVisibility) {
      values.push(options.serverVisibility);
      conditions.push(`server_visibility = $${values.length}`);
    } else {
      values.push(['public_recruiting', 'public_listed']);
      conditions.push(`server_visibility = ANY($${values.length}::text[])`);
    }
    if (options.joinPolicy) { values.push(options.joinPolicy); conditions.push(`join_policy = $${values.length}`); }
    conditions.push(`lifecycle_status = 'active'`);
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit, 100));
    return many<WorldServerRow, WorldServerRecord>(`SELECT ${SERVER_COLS} FROM world_servers WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToServer);
  }

  async function createWorldServer(input: CreateWorldServerInput): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord>> {
    const now = new Date().toISOString();
    const record: WorldServerRecord = {
      worldServerId: input.worldServerId,
      ownerId: input.ownerId,
      serverHandle: input.serverHandle,
      displayName: input.displayName,
      description: input.description,
      serverVisibility: input.serverVisibility ?? 'private',
      joinPolicy: input.joinPolicy ?? 'invite_only',
      lifecycleStatus: input.lifecycleStatus ?? 'active',
      defaultGameSystemId: input.defaultGameSystemId,
      publicProfilePayload: input.publicProfilePayload ?? {},
      serverSettingsPayload: input.serverSettingsPayload ?? {},
      softUpdatePolicyPayload: input.softUpdatePolicyPayload ?? {},
      schemaVersion: input.schemaVersion ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO world_servers (
           world_server_id, owner_id, server_handle, display_name, description,
           server_visibility, join_policy, lifecycle_status, default_game_system_id,
           public_profile_payload, server_settings_payload, soft_update_policy_payload,
           schema_version, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14,$14)`,
        [
          record.worldServerId, record.ownerId, record.serverHandle, record.displayName, record.description ?? null,
          record.serverVisibility, record.joinPolicy, record.lifecycleStatus, record.defaultGameSystemId ?? null,
          JSON.stringify(record.publicProfilePayload), JSON.stringify(record.serverSettingsPayload),
          JSON.stringify(record.softUpdatePolicyPayload), record.schemaVersion, now,
        ],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapCreateWorldServerError(error);
    }
  }

  const updateWorldServerProfile = (input: UpdateWorldServerProfileInput) =>
    one<WorldServerRow, WorldServerRecord>(
      `UPDATE world_servers SET
         display_name = COALESCE($2, display_name),
         description = COALESCE($3, description),
         server_visibility = COALESCE($4, server_visibility),
         join_policy = COALESCE($5, join_policy),
         lifecycle_status = COALESCE($6, lifecycle_status),
         public_profile_payload = COALESCE($7::jsonb, public_profile_payload),
         updated_at = $8
       WHERE world_server_id = $1 RETURNING ${SERVER_COLS}`,
      [input.worldServerId, input.displayName ?? null, input.description ?? null, input.serverVisibility ?? null, input.joinPolicy ?? null, input.lifecycleStatus ?? null, input.publicProfilePayload === undefined ? null : JSON.stringify(input.publicProfilePayload), new Date().toISOString()],
      rowToServer,
    );

  const updateWorldServerSettings = (input: UpdateWorldServerSettingsInput) =>
    one<WorldServerRow, WorldServerRecord>(
      `UPDATE world_servers SET
         default_game_system_id = COALESCE($2, default_game_system_id),
         server_settings_payload = COALESCE($3::jsonb, server_settings_payload),
         soft_update_policy_payload = COALESCE($4::jsonb, soft_update_policy_payload),
         updated_at = $5
       WHERE world_server_id = $1 RETURNING ${SERVER_COLS}`,
      [input.worldServerId, input.defaultGameSystemId ?? null, input.serverSettingsPayload === undefined ? null : JSON.stringify(input.serverSettingsPayload), input.softUpdatePolicyPayload === undefined ? null : JSON.stringify(input.softUpdatePolicyPayload), new Date().toISOString()],
      rowToServer,
    );

  const archiveWorldServer = (worldServerId: string, archivedAt?: string) =>
    one<WorldServerRow, WorldServerRecord>(`UPDATE world_servers SET archived_at = $2, updated_at = $2 WHERE world_server_id = $1 RETURNING ${SERVER_COLS}`, [worldServerId, archivedAt ?? new Date().toISOString()], rowToServer);
  const restoreWorldServer = (worldServerId: string) =>
    one<WorldServerRow, WorldServerRecord>(`UPDATE world_servers SET archived_at = NULL, updated_at = $2 WHERE world_server_id = $1 RETURNING ${SERVER_COLS}`, [worldServerId, new Date().toISOString()], rowToServer);

  // ── Campaign bindings ────────────────────────────────────────────────────────

  const getWorldServerCampaignBinding = (bindingId: string) =>
    one<BindingRow, WorldServerCampaignBindingRecord>(`SELECT ${BINDING_COLS} FROM world_server_campaign_bindings WHERE binding_id = $1 LIMIT 1`, [bindingId], rowToBinding);
  const getWorldServerCampaignBindingByPair = (worldServerId: string, campaignId: string) =>
    one<BindingRow, WorldServerCampaignBindingRecord>(`SELECT ${BINDING_COLS} FROM world_server_campaign_bindings WHERE world_server_id = $1 AND campaign_id = $2 LIMIT 1`, [worldServerId, campaignId], rowToBinding);

  function listBindingsWhere(column: 'world_server_id' | 'campaign_id', value: string, options: ListCampaignBindingsOptions) {
    const conditions = [`${column} = $1`];
    const values: unknown[] = [value];
    if (options.visibilityScope) { values.push(options.visibilityScope); conditions.push(`visibility_scope = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<BindingRow, WorldServerCampaignBindingRecord>(`SELECT ${BINDING_COLS} FROM world_server_campaign_bindings WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToBinding);
  }

  const listCampaignBindingsByWorldServer = (worldServerId: string, options: ListCampaignBindingsOptions = {}) => listBindingsWhere('world_server_id', worldServerId, options);
  const listWorldServerBindingsForCampaign = (campaignId: string, options: ListCampaignBindingsOptions = {}) => listBindingsWhere('campaign_id', campaignId, options);

  async function bindCampaignToWorldServer(input: BindCampaignToWorldServerInput): Promise<PostgresWorldServerRepositoryResult<WorldServerCampaignBindingRecord>> {
    const now = new Date().toISOString();
    const record: WorldServerCampaignBindingRecord = {
      bindingId: input.bindingId, worldServerId: input.worldServerId, campaignId: input.campaignId, createdByUserId: input.createdByUserId,
      bindingKind: input.bindingKind ?? 'owned', visibilityScope: input.visibilityScope ?? 'server', payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO world_server_campaign_bindings (binding_id, world_server_id, campaign_id, created_by_user_id, binding_kind, visibility_scope, binding_payload, schema_version, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$9)`,
        [record.bindingId, record.worldServerId, record.campaignId, record.createdByUserId ?? null, record.bindingKind, record.visibilityScope, JSON.stringify(record.payload), record.schemaVersion, now],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateWorldServerCampaignBinding = (input: UpdateWorldServerCampaignBindingInput) =>
    one<BindingRow, WorldServerCampaignBindingRecord>(
      `UPDATE world_server_campaign_bindings SET binding_kind = COALESCE($2, binding_kind), visibility_scope = COALESCE($3, visibility_scope), binding_payload = COALESCE($4::jsonb, binding_payload), updated_at = $5 WHERE binding_id = $1 RETURNING ${BINDING_COLS}`,
      [input.bindingId, input.bindingKind ?? null, input.visibilityScope ?? null, input.payload === undefined ? null : JSON.stringify(input.payload), new Date().toISOString()],
      rowToBinding,
    );

  const archiveWorldServerCampaignBinding = (bindingId: string, archivedAt?: string) =>
    one<BindingRow, WorldServerCampaignBindingRecord>(`UPDATE world_server_campaign_bindings SET archived_at = $2, updated_at = $2 WHERE binding_id = $1 RETURNING ${BINDING_COLS}`, [bindingId, archivedAt ?? new Date().toISOString()], rowToBinding);
  const restoreWorldServerCampaignBinding = (bindingId: string) =>
    one<BindingRow, WorldServerCampaignBindingRecord>(`UPDATE world_server_campaign_bindings SET archived_at = NULL, updated_at = $2 WHERE binding_id = $1 RETURNING ${BINDING_COLS}`, [bindingId, new Date().toISOString()], rowToBinding);

  // ── Game system bindings ──────────────────────────────────────────────────────

  const getWorldServerGameSystemBinding = (bindingId: string) =>
    one<GameSystemBindingRow, WorldServerGameSystemBindingRecord>(`SELECT ${GSB_COLS} FROM world_server_game_system_bindings WHERE binding_id = $1 LIMIT 1`, [bindingId], rowToGameSystemBinding);
  const getWorldServerGameSystemBindingBySystem = (worldServerId: string, gameSystemId: string) =>
    one<GameSystemBindingRow, WorldServerGameSystemBindingRecord>(`SELECT ${GSB_COLS} FROM world_server_game_system_bindings WHERE world_server_id = $1 AND game_system_id = $2 LIMIT 1`, [worldServerId, gameSystemId], rowToGameSystemBinding);

  async function listGameSystemBindingsByWorldServer(worldServerId: string, options: ListGameSystemBindingsOptions = {}) {
    const conditions = ['world_server_id = $1'];
    const values: unknown[] = [worldServerId];
    if (options.systemKind) { values.push(options.systemKind); conditions.push(`system_kind = $${values.length}`); }
    if (options.bindingStatus) { values.push(options.bindingStatus); conditions.push(`binding_status = $${values.length}`); }
    if (options.isDefault !== undefined) { values.push(options.isDefault); conditions.push(`is_default = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<GameSystemBindingRow, WorldServerGameSystemBindingRecord>(`SELECT ${GSB_COLS} FROM world_server_game_system_bindings WHERE ${conditions.join(' AND ')} ORDER BY is_default DESC, updated_at DESC LIMIT $${values.length}`, values, rowToGameSystemBinding);
  }

  const listDefaultGameSystemBindingsByWorldServer = (worldServerId: string, options: ListGameSystemBindingsOptions = {}) =>
    listGameSystemBindingsByWorldServer(worldServerId, { ...options, isDefault: true });

  async function bindGameSystemToWorldServer(input: BindGameSystemToWorldServerInput): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord>> {
    const now = new Date().toISOString();
    const record: WorldServerGameSystemBindingRecord = {
      bindingId: input.bindingId, worldServerId: input.worldServerId, gameSystemId: input.gameSystemId, displayName: input.displayName,
      systemKind: input.systemKind ?? 'template', bindingStatus: input.bindingStatus ?? 'enabled', isDefault: input.isDefault ?? false,
      rulesetTemplateId: input.rulesetTemplateId, currentRulesetVersionId: input.currentRulesetVersionId, config: input.config ?? {},
      enabledPackVersionIds: input.enabledPackVersionIds ?? [], schemaVersion: input.schemaVersion ?? 1, createdByUserId: input.createdByUserId, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO world_server_game_system_bindings (
           binding_id, world_server_id, game_system_id, display_name, system_kind, binding_status,
           is_default, ruleset_template_id, current_ruleset_version_id, config_payload,
           enabled_pack_version_ids, schema_version, created_by_user_id, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,$14)`,
        [record.bindingId, record.worldServerId, record.gameSystemId, record.displayName, record.systemKind, record.bindingStatus, record.isDefault, record.rulesetTemplateId ?? null, record.currentRulesetVersionId ?? null, JSON.stringify(record.config), JSON.stringify(record.enabledPackVersionIds), record.schemaVersion, record.createdByUserId ?? null, now],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateWorldServerGameSystemBinding = (input: UpdateWorldServerGameSystemBindingInput) =>
    one<GameSystemBindingRow, WorldServerGameSystemBindingRecord>(
      `UPDATE world_server_game_system_bindings SET
         display_name = COALESCE($2, display_name),
         system_kind = COALESCE($3, system_kind),
         is_default = COALESCE($4, is_default),
         ruleset_template_id = COALESCE($5, ruleset_template_id),
         current_ruleset_version_id = COALESCE($6, current_ruleset_version_id),
         config_payload = COALESCE($7::jsonb, config_payload),
         enabled_pack_version_ids = COALESCE($8::jsonb, enabled_pack_version_ids),
         updated_at = $9
       WHERE binding_id = $1 RETURNING ${GSB_COLS}`,
      [input.bindingId, input.displayName ?? null, input.systemKind ?? null, input.isDefault ?? null, input.rulesetTemplateId ?? null, input.currentRulesetVersionId ?? null, input.config === undefined ? null : JSON.stringify(input.config), input.enabledPackVersionIds === undefined ? null : JSON.stringify(input.enabledPackVersionIds), new Date().toISOString()],
      rowToGameSystemBinding,
    );

  const updateWorldServerGameSystemBindingStatus = (input: UpdateWorldServerGameSystemBindingStatusInput) =>
    one<GameSystemBindingRow, WorldServerGameSystemBindingRecord>(
      `UPDATE world_server_game_system_bindings SET binding_status = $2, is_default = COALESCE($3, is_default), updated_at = $4 WHERE binding_id = $1 RETURNING ${GSB_COLS}`,
      [input.bindingId, input.bindingStatus, input.isDefault ?? null, new Date().toISOString()],
      rowToGameSystemBinding,
    );

  const archiveWorldServerGameSystemBinding = (bindingId: string, archivedAt?: string) =>
    one<GameSystemBindingRow, WorldServerGameSystemBindingRecord>(`UPDATE world_server_game_system_bindings SET archived_at = $2, updated_at = $2 WHERE binding_id = $1 RETURNING ${GSB_COLS}`, [bindingId, archivedAt ?? new Date().toISOString()], rowToGameSystemBinding);
  const restoreWorldServerGameSystemBinding = (bindingId: string) =>
    one<GameSystemBindingRow, WorldServerGameSystemBindingRecord>(`UPDATE world_server_game_system_bindings SET archived_at = NULL, updated_at = $2 WHERE binding_id = $1 RETURNING ${GSB_COLS}`, [bindingId, new Date().toISOString()], rowToGameSystemBinding);

  // ── Roles ──────────────────────────────────────────────────────────────────

  const getWorldServerRoleById = (roleId: string) =>
    one<RoleRow, WorldServerRoleRecord>(`SELECT ${ROLE_COLS} FROM world_server_roles WHERE role_id = $1 LIMIT 1`, [roleId], rowToRole);
  const getWorldServerRoleByKey = (worldServerId: string, roleKey: string) =>
    one<RoleRow, WorldServerRoleRecord>(`SELECT ${ROLE_COLS} FROM world_server_roles WHERE world_server_id = $1 AND role_key = $2 LIMIT 1`, [worldServerId, roleKey], rowToRole);

  async function listWorldServerRoles(worldServerId: string, options: ListWorldServerRolesOptions = {}) {
    const conditions = ['world_server_id = $1'];
    const values: unknown[] = [worldServerId];
    if (options.roleKind) { values.push(options.roleKind); conditions.push(`role_kind = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<RoleRow, WorldServerRoleRecord>(`SELECT ${ROLE_COLS} FROM world_server_roles WHERE ${conditions.join(' AND ')} ORDER BY sort_order ASC, created_at ASC LIMIT $${values.length}`, values, rowToRole);
  }

  async function createWorldServerRole(input: CreateWorldServerRoleInput): Promise<PostgresWorldServerRepositoryResult<WorldServerRoleRecord>> {
    const now = new Date().toISOString();
    const record: WorldServerRoleRecord = {
      roleId: input.roleId, worldServerId: input.worldServerId, roleKey: input.roleKey, displayName: input.displayName,
      roleKind: input.roleKind ?? 'custom', permissionsPayload: input.permissionsPayload ?? {}, isSystemRole: input.isSystemRole ?? false, sortOrder: input.sortOrder ?? 100, schemaVersion: input.schemaVersion ?? 1, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO world_server_roles (role_id, world_server_id, role_key, display_name, role_kind, permissions_payload, is_system_role, sort_order, schema_version, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$10)`,
        [record.roleId, record.worldServerId, record.roleKey, record.displayName, record.roleKind, JSON.stringify(record.permissionsPayload), record.isSystemRole, record.sortOrder, record.schemaVersion, now],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateWorldServerRole = (input: UpdateWorldServerRoleInput) =>
    one<RoleRow, WorldServerRoleRecord>(
      `UPDATE world_server_roles SET display_name = COALESCE($2, display_name), role_kind = COALESCE($3, role_kind), permissions_payload = COALESCE($4::jsonb, permissions_payload), sort_order = COALESCE($5, sort_order), updated_at = $6 WHERE role_id = $1 RETURNING ${ROLE_COLS}`,
      [input.roleId, input.displayName ?? null, input.roleKind ?? null, input.permissionsPayload === undefined ? null : JSON.stringify(input.permissionsPayload), input.sortOrder ?? null, new Date().toISOString()],
      rowToRole,
    );

  const archiveWorldServerRole = (roleId: string, archivedAt?: string) =>
    one<RoleRow, WorldServerRoleRecord>(`UPDATE world_server_roles SET archived_at = $2, updated_at = $2 WHERE role_id = $1 RETURNING ${ROLE_COLS}`, [roleId, archivedAt ?? new Date().toISOString()], rowToRole);
  const restoreWorldServerRole = (roleId: string) =>
    one<RoleRow, WorldServerRoleRecord>(`UPDATE world_server_roles SET archived_at = NULL, updated_at = $2 WHERE role_id = $1 RETURNING ${ROLE_COLS}`, [roleId, new Date().toISOString()], rowToRole);

  // ── Memberships ──────────────────────────────────────────────────────────────

  const getWorldServerMembershipById = (membershipId: string) =>
    one<MembershipRow, WorldServerMembershipRecord>(`SELECT ${MEMBERSHIP_COLS} FROM world_server_memberships WHERE membership_id = $1 LIMIT 1`, [membershipId], rowToMembership);
  const getWorldServerMembershipByUser = (worldServerId: string, userId: string) =>
    one<MembershipRow, WorldServerMembershipRecord>(`SELECT ${MEMBERSHIP_COLS} FROM world_server_memberships WHERE world_server_id = $1 AND user_id = $2 LIMIT 1`, [worldServerId, userId], rowToMembership);

  function listMembershipsWhere(column: 'world_server_id' | 'user_id', value: string, options: ListWorldServerMembershipsOptions) {
    const conditions = [`${column} = $1`];
    const values: unknown[] = [value];
    if (options.membershipStatus) { values.push(options.membershipStatus); conditions.push(`membership_status = $${values.length}`); }
    if (options.roleKey) { values.push(options.roleKey); conditions.push(`role_key = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<MembershipRow, WorldServerMembershipRecord>(`SELECT ${MEMBERSHIP_COLS} FROM world_server_memberships WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values, rowToMembership);
  }

  const listWorldServerMemberships = (worldServerId: string, options: ListWorldServerMembershipsOptions = {}) => listMembershipsWhere('world_server_id', worldServerId, options);
  const listWorldServerMembershipsForUser = (userId: string, options: ListWorldServerMembershipsOptions = {}) => listMembershipsWhere('user_id', userId, options);

  async function createWorldServerMembership(input: CreateWorldServerMembershipInput): Promise<PostgresWorldServerRepositoryResult<WorldServerMembershipRecord>> {
    const now = new Date().toISOString();
    const record: WorldServerMembershipRecord = {
      membershipId: input.membershipId, worldServerId: input.worldServerId, userId: input.userId, roleId: input.roleId, roleKey: input.roleKey ?? 'member',
      membershipStatus: input.membershipStatus ?? 'active', displayAlias: input.displayAlias, invitedByUserId: input.invitedByUserId, approvedByUserId: input.approvedByUserId,
      payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, joinedAt: input.joinedAt, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO world_server_memberships (membership_id, world_server_id, user_id, role_id, role_key, membership_status, display_alias, invited_by_user_id, approved_by_user_id, membership_payload, schema_version, joined_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$13)`,
        [record.membershipId, record.worldServerId, record.userId, record.roleId ?? null, record.roleKey, record.membershipStatus, record.displayAlias ?? null, record.invitedByUserId ?? null, record.approvedByUserId ?? null, JSON.stringify(record.payload), record.schemaVersion, record.joinedAt ?? null, now],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateWorldServerMembership = (input: UpdateWorldServerMembershipInput) =>
    one<MembershipRow, WorldServerMembershipRecord>(
      `UPDATE world_server_memberships SET role_id = COALESCE($2, role_id), role_key = COALESCE($3, role_key), display_alias = COALESCE($4, display_alias), membership_payload = COALESCE($5::jsonb, membership_payload), updated_at = $6 WHERE membership_id = $1 RETURNING ${MEMBERSHIP_COLS}`,
      [input.membershipId, input.roleId ?? null, input.roleKey ?? null, input.displayAlias ?? null, input.payload === undefined ? null : JSON.stringify(input.payload), new Date().toISOString()],
      rowToMembership,
    );

  const updateWorldServerMembershipStatus = (input: UpdateWorldServerMembershipStatusInput) =>
    one<MembershipRow, WorldServerMembershipRecord>(
      `UPDATE world_server_memberships SET membership_status = $2, approved_by_user_id = COALESCE($3, approved_by_user_id), joined_at = COALESCE($4, joined_at), updated_at = $5 WHERE membership_id = $1 RETURNING ${MEMBERSHIP_COLS}`,
      [input.membershipId, input.membershipStatus, input.approvedByUserId ?? null, input.joinedAt ?? null, new Date().toISOString()],
      rowToMembership,
    );

  const archiveWorldServerMembership = (membershipId: string, archivedAt?: string) =>
    one<MembershipRow, WorldServerMembershipRecord>(`UPDATE world_server_memberships SET archived_at = $2, updated_at = $2 WHERE membership_id = $1 RETURNING ${MEMBERSHIP_COLS}`, [membershipId, archivedAt ?? new Date().toISOString()], rowToMembership);
  const restoreWorldServerMembership = (membershipId: string) =>
    one<MembershipRow, WorldServerMembershipRecord>(`UPDATE world_server_memberships SET archived_at = NULL, updated_at = $2 WHERE membership_id = $1 RETURNING ${MEMBERSHIP_COLS}`, [membershipId, new Date().toISOString()], rowToMembership);

  // ── Invites ──────────────────────────────────────────────────────────────────

  const getWorldServerInviteById = (inviteId: string) =>
    one<InviteRow, WorldServerInviteRecord>(`SELECT ${INVITE_COLS} FROM world_server_invites WHERE invite_id = $1 LIMIT 1`, [inviteId], rowToInvite);
  const getWorldServerInviteByCode = (inviteCode: string) =>
    one<InviteRow, WorldServerInviteRecord>(`SELECT ${INVITE_COLS} FROM world_server_invites WHERE invite_code = $1 LIMIT 1`, [inviteCode], rowToInvite);

  async function listWorldServerInvites(worldServerId: string, options: ListWorldServerInvitesOptions = {}) {
    const conditions = ['world_server_id = $1'];
    const values: unknown[] = [worldServerId];
    if (options.inviteStatus) { values.push(options.inviteStatus); conditions.push(`invite_status = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<InviteRow, WorldServerInviteRecord>(`SELECT ${INVITE_COLS} FROM world_server_invites WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${values.length}`, values, rowToInvite);
  }

  async function createWorldServerInvite(input: CreateWorldServerInviteInput): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord>> {
    const now = new Date().toISOString();
    const record: WorldServerInviteRecord = {
      inviteId: input.inviteId, worldServerId: input.worldServerId, inviteCode: input.inviteCode, createdByUserId: input.createdByUserId, targetUserId: input.targetUserId, targetEmail: input.targetEmail,
      defaultRoleKey: input.defaultRoleKey ?? 'member', inviteStatus: input.inviteStatus ?? 'active', maxUses: input.maxUses, useCount: input.useCount ?? 0, expiresAt: input.expiresAt, payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO world_server_invites (invite_id, world_server_id, invite_code, created_by_user_id, target_user_id, target_email, default_role_key, invite_status, max_uses, use_count, expires_at, invite_payload, schema_version, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$14)`,
        [record.inviteId, record.worldServerId, record.inviteCode, record.createdByUserId, record.targetUserId ?? null, record.targetEmail ?? null, record.defaultRoleKey, record.inviteStatus, record.maxUses ?? null, record.useCount, record.expiresAt ?? null, JSON.stringify(record.payload), record.schemaVersion, now],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function redeemWorldServerInvite(input: RedeemWorldServerInviteInput): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRedemptionRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<{
        invite_id: string;
        world_server_id: string;
        default_role_key: string;
        membership_id: string;
        membership_status: string;
      }>(
        `WITH eligible AS (
           SELECT invite_id, world_server_id, default_role_key, target_user_id
             FROM world_server_invites
            WHERE invite_code = $1
              AND archived_at IS NULL
              AND (expires_at IS NULL OR expires_at > $5::timestamptz)
              AND (
                (target_user_id = $2 AND invite_status = 'used')
                OR (
                  target_user_id IS NULL
                  AND invite_status = 'active'
                  AND (max_uses IS NULL OR use_count < max_uses)
                )
              )
            FOR UPDATE
         ), claimed AS (
           UPDATE world_server_invites AS invite
              SET target_user_id = COALESCE(invite.target_user_id, $2),
                  use_count = CASE WHEN invite.target_user_id IS NULL THEN invite.use_count + 1 ELSE invite.use_count END,
                  invite_status = 'used',
                  updated_at = $5
             FROM eligible
            WHERE invite.invite_id = eligible.invite_id
          RETURNING invite.invite_id, invite.world_server_id, invite.default_role_key
         ), membership AS (
           INSERT INTO world_server_memberships (
             membership_id, world_server_id, user_id, role_key, membership_status,
             display_alias, invited_by_user_id, membership_payload, schema_version,
             joined_at, created_at, updated_at
           )
           SELECT $3, claimed.world_server_id, $2, claimed.default_role_key, 'active',
             $4, NULL, '{}'::jsonb, 1, $5, $5, $5
             FROM claimed
           ON CONFLICT (world_server_id, user_id) DO UPDATE
             SET membership_status = 'active',
                 role_key = EXCLUDED.role_key,
                 display_alias = COALESCE(EXCLUDED.display_alias, world_server_memberships.display_alias),
                 joined_at = COALESCE(world_server_memberships.joined_at, EXCLUDED.joined_at),
                 updated_at = EXCLUDED.updated_at
          RETURNING membership_id, world_server_id, membership_status, role_key
         )
         SELECT claimed.invite_id, claimed.world_server_id, claimed.default_role_key,
           membership.membership_id, membership.membership_status
           FROM claimed
           INNER JOIN membership ON membership.world_server_id = claimed.world_server_id`,
        [input.inviteCode, input.userId, input.membershipId, input.displayAlias ?? null, now],
      );
      const row = result.rows[0];
      return row
        ? {
            ok: true,
            value: {
              inviteId: row.invite_id,
              worldServerId: row.world_server_id,
              membershipId: row.membership_id,
              membershipStatus: row.membership_status,
              roleKey: row.default_role_key,
            },
          }
        : { ok: true, value: null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateWorldServerInvite = (input: UpdateWorldServerInviteInput) =>
    one<InviteRow, WorldServerInviteRecord>(
      `UPDATE world_server_invites SET target_user_id = COALESCE($2, target_user_id), target_email = COALESCE($3, target_email), default_role_key = COALESCE($4, default_role_key), max_uses = COALESCE($5, max_uses), use_count = COALESCE($6, use_count), expires_at = COALESCE($7, expires_at), invite_payload = COALESCE($8::jsonb, invite_payload), updated_at = $9 WHERE invite_id = $1 RETURNING ${INVITE_COLS}`,
      [input.inviteId, input.targetUserId ?? null, input.targetEmail ?? null, input.defaultRoleKey ?? null, input.maxUses ?? null, input.useCount ?? null, input.expiresAt ?? null, input.payload === undefined ? null : JSON.stringify(input.payload), new Date().toISOString()],
      rowToInvite,
    );

  const updateWorldServerInviteStatus = (input: UpdateWorldServerInviteStatusInput) =>
    one<InviteRow, WorldServerInviteRecord>(`UPDATE world_server_invites SET invite_status = $2, updated_at = $3 WHERE invite_id = $1 RETURNING ${INVITE_COLS}`, [input.inviteId, input.inviteStatus, new Date().toISOString()], rowToInvite);

  const archiveWorldServerInvite = (inviteId: string, archivedAt?: string) =>
    one<InviteRow, WorldServerInviteRecord>(`UPDATE world_server_invites SET archived_at = $2, updated_at = $2 WHERE invite_id = $1 RETURNING ${INVITE_COLS}`, [inviteId, archivedAt ?? new Date().toISOString()], rowToInvite);
  const restoreWorldServerInvite = (inviteId: string) =>
    one<InviteRow, WorldServerInviteRecord>(`UPDATE world_server_invites SET archived_at = NULL, updated_at = $2 WHERE invite_id = $1 RETURNING ${INVITE_COLS}`, [inviteId, new Date().toISOString()], rowToInvite);

  // ── Join requests ────────────────────────────────────────────────────────────

  const getWorldServerJoinRequestById = (joinRequestId: string) =>
    one<JoinRequestRow, WorldServerJoinRequestRecord>(`SELECT ${JOIN_REQUEST_COLS} FROM world_server_join_requests WHERE join_request_id = $1 LIMIT 1`, [joinRequestId], rowToJoinRequest);

  function listJoinRequestsWhere(column: 'world_server_id' | 'requester_user_id', value: string, options: ListWorldServerJoinRequestsOptions) {
    const conditions = [`${column} = $1`];
    const values: unknown[] = [value];
    if (options.requestStatus) { values.push(options.requestStatus); conditions.push(`request_status = $${values.length}`); }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    values.push(limitOf(options.limit));
    return many<JoinRequestRow, WorldServerJoinRequestRecord>(`SELECT ${JOIN_REQUEST_COLS} FROM world_server_join_requests WHERE ${conditions.join(' AND ')} ORDER BY requested_at DESC LIMIT $${values.length}`, values, rowToJoinRequest);
  }

  const listWorldServerJoinRequests = (worldServerId: string, options: ListWorldServerJoinRequestsOptions = {}) => listJoinRequestsWhere('world_server_id', worldServerId, options);
  const listWorldServerJoinRequestsForUser = (requesterUserId: string, options: ListWorldServerJoinRequestsOptions = {}) => listJoinRequestsWhere('requester_user_id', requesterUserId, options);

  async function createWorldServerJoinRequest(input: CreateWorldServerJoinRequestInput): Promise<PostgresWorldServerRepositoryResult<WorldServerJoinRequestRecord>> {
    const now = new Date().toISOString();
    const requestedAt = input.requestedAt ?? now;
    const record: WorldServerJoinRequestRecord = {
      joinRequestId: input.joinRequestId, worldServerId: input.worldServerId, requesterUserId: input.requesterUserId, requestStatus: input.requestStatus ?? 'pending', requestMessage: input.requestMessage,
      requestedRoleKey: input.requestedRoleKey ?? 'member', payload: input.payload ?? {}, schemaVersion: input.schemaVersion ?? 1, requestedAt, createdAt: now, updatedAt: now,
    };
    try {
      await executor.query(
        `INSERT INTO world_server_join_requests (join_request_id, world_server_id, requester_user_id, request_status, request_message, requested_role_key, request_payload, schema_version, requested_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$10)`,
        [record.joinRequestId, record.worldServerId, record.requesterUserId, record.requestStatus, record.requestMessage ?? null, record.requestedRoleKey, JSON.stringify(record.payload), record.schemaVersion, requestedAt, now],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  const updateWorldServerJoinRequestStatus = (input: UpdateWorldServerJoinRequestStatusInput) =>
    one<JoinRequestRow, WorldServerJoinRequestRecord>(
      `UPDATE world_server_join_requests SET request_status = $2, reviewed_by_user_id = COALESCE($3, reviewed_by_user_id), response_message = COALESCE($4, response_message), reviewed_at = COALESCE($5, reviewed_at), updated_at = $6 WHERE join_request_id = $1 RETURNING ${JOIN_REQUEST_COLS}`,
      [input.joinRequestId, input.requestStatus, input.reviewedByUserId ?? null, input.responseMessage ?? null, input.reviewedAt ?? new Date().toISOString(), new Date().toISOString()],
      rowToJoinRequest,
    );

  const archiveWorldServerJoinRequest = (joinRequestId: string, archivedAt?: string) =>
    one<JoinRequestRow, WorldServerJoinRequestRecord>(`UPDATE world_server_join_requests SET archived_at = $2, updated_at = $2 WHERE join_request_id = $1 RETURNING ${JOIN_REQUEST_COLS}`, [joinRequestId, archivedAt ?? new Date().toISOString()], rowToJoinRequest);
  const restoreWorldServerJoinRequest = (joinRequestId: string) =>
    one<JoinRequestRow, WorldServerJoinRequestRecord>(`UPDATE world_server_join_requests SET archived_at = NULL, updated_at = $2 WHERE join_request_id = $1 RETURNING ${JOIN_REQUEST_COLS}`, [joinRequestId, new Date().toISOString()], rowToJoinRequest);

  async function checkReadiness(): Promise<PostgresWorldServerRepositoryResult<Record<string, boolean>>> {
    try {
      const result = await executor.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN (
           'world_servers','world_server_campaign_bindings','world_server_game_system_bindings',
           'world_server_roles','world_server_memberships','world_server_invites','world_server_join_requests')`,
      );
      const names = new Set(result.rows.map((row) => row.table_name));
      return {
        ok: true,
        value: {
          worldServersTable: names.has('world_servers'),
          campaignBindingsTable: names.has('world_server_campaign_bindings'),
          gameSystemBindingsTable: names.has('world_server_game_system_bindings'),
          rolesTable: names.has('world_server_roles'),
          membershipsTable: names.has('world_server_memberships'),
          invitesTable: names.has('world_server_invites'),
          joinRequestsTable: names.has('world_server_join_requests'),
        },
      };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  return {
    getWorldServerById, getWorldServerByHandle, listWorldServersByOwner, listDiscoverableWorldServers,
    createWorldServer, updateWorldServerProfile, updateWorldServerSettings, archiveWorldServer, restoreWorldServer,
    getWorldServerCampaignBinding, getWorldServerCampaignBindingByPair, listCampaignBindingsByWorldServer,
    listWorldServerBindingsForCampaign, bindCampaignToWorldServer, updateWorldServerCampaignBinding,
    archiveWorldServerCampaignBinding, restoreWorldServerCampaignBinding,
    getWorldServerGameSystemBinding, getWorldServerGameSystemBindingBySystem, listGameSystemBindingsByWorldServer,
    listDefaultGameSystemBindingsByWorldServer, bindGameSystemToWorldServer, updateWorldServerGameSystemBinding,
    updateWorldServerGameSystemBindingStatus, archiveWorldServerGameSystemBinding, restoreWorldServerGameSystemBinding,
    getWorldServerRoleById, getWorldServerRoleByKey, listWorldServerRoles, createWorldServerRole,
    updateWorldServerRole, archiveWorldServerRole, restoreWorldServerRole,
    getWorldServerMembershipById, getWorldServerMembershipByUser, listWorldServerMemberships,
    listWorldServerMembershipsForUser, createWorldServerMembership, updateWorldServerMembership,
    updateWorldServerMembershipStatus, archiveWorldServerMembership, restoreWorldServerMembership,
    getWorldServerInviteById, getWorldServerInviteByCode, listWorldServerInvites, createWorldServerInvite,
    redeemWorldServerInvite, updateWorldServerInvite, updateWorldServerInviteStatus, archiveWorldServerInvite, restoreWorldServerInvite,
    getWorldServerJoinRequestById, listWorldServerJoinRequests, listWorldServerJoinRequestsForUser,
    createWorldServerJoinRequest, updateWorldServerJoinRequestStatus, archiveWorldServerJoinRequest,
    restoreWorldServerJoinRequest, checkReadiness,
  };
}

const defaultPostgresWorldServerRepository = createPostgresWorldServerRepository();

export async function getWorldServerById(worldServerId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord | null>> {
  return defaultPostgresWorldServerRepository.getWorldServerById(worldServerId);
}
export async function getWorldServerByHandle(serverHandle: string): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord | null>> {
  return defaultPostgresWorldServerRepository.getWorldServerByHandle(serverHandle);
}
export async function listDiscoverableWorldServers(options?: ListDiscoverableWorldServersOptions): Promise<PostgresWorldServerRepositoryResult<WorldServerRecord[]>> {
  return defaultPostgresWorldServerRepository.listDiscoverableWorldServers(options);
}
export async function getWorldServerInviteByCode(inviteCode: string): Promise<PostgresWorldServerRepositoryResult<WorldServerInviteRecord | null>> {
  return defaultPostgresWorldServerRepository.getWorldServerInviteByCode(inviteCode);
}
export async function getWorldServerGameSystemBinding(bindingId: string): Promise<PostgresWorldServerRepositoryResult<WorldServerGameSystemBindingRecord | null>> {
  return defaultPostgresWorldServerRepository.getWorldServerGameSystemBinding(bindingId);
}
export async function checkPostgresWorldServerRepositoryReadiness(): Promise<PostgresWorldServerRepositoryResult<Record<string, boolean>>> {
  return defaultPostgresWorldServerRepository.checkReadiness();
}
