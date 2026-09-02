/**
 * World Server API handlers (P5.API-CORE) — server-only.
 *
 * These handlers compose the existing auth/session boundary, request-scope
 * resolver, permission guard, and Postgres repositories. They do not contain
 * permission policy or database SQL, and they do not change Room/Runtime
 * authority. The fake repository smoke can exercise this module without a DB.
 */

import { randomUUID } from 'node:crypto';

import {
  createPostgresWorldServerRepository,
  MISSING_OWNER_USER_REASON,
  type PostgresWorldServerRepository,
  type PostgresWorldServerRepositoryErrorKind,
  type PostgresWorldServerRepositoryResult,
  type WorldServerGameSystemBindingRecord,
  type WorldServerJoinRequestRecord,
  type WorldServerMembershipRecord,
  type WorldServerRecord,
  type WorldServerRoleRecord,
} from '../adapters/postgresWorldServerRepository.js';
import {
  createPostgresPlatformFoundationRepository,
  type CreateWorldServerRulesetVersionInput,
  type CreateWorldServerSettingsVersionInput,
  type PostgresPlatformFoundationRepositoryErrorKind,
  type PostgresPlatformFoundationRepositoryResult,
  type WorldServerRulesetVersionRecord,
  type WorldServerSettingsVersionRecord,
} from '../adapters/postgresPlatformFoundationRepository.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveApiAuthSession, type ApiRequestLike } from '../auth/requestAuthSession.js';
import { resolveApiPermissionGuard, type ApiGuardAction } from './apiPermissionGuard.js';
import { resolveApiRequestScope, type ApiRequestScopeResult } from './apiRequestContext.js';
import { errorResponse, okResponse, type ServerApiResponse } from './apiResponse.js';

type ApiResult = ServerApiResponse<unknown>;
type BodyRecord = Record<string, unknown>;

/** The repository subset used by this API. It keeps fake smokes small. */
export type WorldServerApiRepository = Pick<
  PostgresWorldServerRepository,
  | 'getWorldServerById'
  | 'listWorldServersByOwner'
  | 'listWorldServerMembershipsForUser'
  | 'getWorldServerMembershipByUser'
  | 'createWorldServer'
  | 'updateWorldServerProfile'
  | 'updateWorldServerSettings'
  | 'archiveWorldServer'
  | 'restoreWorldServer'
  | 'listWorldServerMemberships'
  | 'getWorldServerMembershipById'
  | 'updateWorldServerMembership'
  | 'updateWorldServerMembershipStatus'
  | 'listWorldServerRoles'
  | 'getWorldServerRoleById'
  | 'createWorldServerRole'
  | 'updateWorldServerRole'
  | 'listWorldServerInvites'
  | 'createWorldServerInvite'
  | 'getWorldServerInviteById'
  | 'updateWorldServerInviteStatus'
  | 'listWorldServerJoinRequests'
  | 'listWorldServerJoinRequestsForUser'
  | 'getWorldServerJoinRequestById'
  | 'createWorldServerJoinRequest'
  | 'updateWorldServerJoinRequestStatus'
  | 'listGameSystemBindingsByWorldServer'
  | 'getWorldServerGameSystemBinding'
  | 'bindGameSystemToWorldServer'
  | 'updateWorldServerGameSystemBinding'
  | 'archiveWorldServerGameSystemBinding'
  | 'restoreWorldServerGameSystemBinding'
>;

export interface WorldServerFoundationRepository {
  createWorldServerSettingsVersion(
    input: CreateWorldServerSettingsVersionInput,
  ): Promise<PostgresPlatformFoundationRepositoryResult<WorldServerSettingsVersionRecord | null>>;
  listWorldServerSettingsVersions(
    worldServerId: string,
    limit?: number,
  ): Promise<PostgresPlatformFoundationRepositoryResult<WorldServerSettingsVersionRecord[]>>;
  createWorldServerRulesetVersion(
    input: CreateWorldServerRulesetVersionInput,
  ): Promise<PostgresPlatformFoundationRepositoryResult<WorldServerRulesetVersionRecord | null>>;
  listWorldServerRulesetVersions(
    worldServerId: string,
    gameSystemId?: string,
    limit?: number,
  ): Promise<PostgresPlatformFoundationRepositoryResult<WorldServerRulesetVersionRecord[]>>;
}

export interface WorldServerApiRequest {
  requestId?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  /** Test/composition seam; HTTP callers resolve this from the auth boundary. */
  viewer?: CurrentViewerContext;
}

export interface CreateWorldServerApiHandlersOptions {
  worldServerRepository?: WorldServerApiRepository;
  foundationRepository?: WorldServerFoundationRepository | null;
  allowDevAuthHeaders?: boolean;
  nodeEnv?: string;
}

export interface WorldServerApiHandlers {
  listWorldServers(input: WorldServerApiRequest): Promise<ApiResult>;
  getWorldServer(input: WorldServerApiRequest): Promise<ApiResult>;
  createWorldServer(input: WorldServerApiRequest): Promise<ApiResult>;
  updateWorldServer(input: WorldServerApiRequest): Promise<ApiResult>;
  archiveWorldServer(input: WorldServerApiRequest): Promise<ApiResult>;
  restoreWorldServer(input: WorldServerApiRequest): Promise<ApiResult>;
  listMembers(input: WorldServerApiRequest): Promise<ApiResult>;
  listRoles(input: WorldServerApiRequest): Promise<ApiResult>;
  createRole(input: WorldServerApiRequest): Promise<ApiResult>;
  updateRole(input: WorldServerApiRequest): Promise<ApiResult>;
  updateMember(input: WorldServerApiRequest): Promise<ApiResult>;
  listInvites(input: WorldServerApiRequest): Promise<ApiResult>;
  createInvite(input: WorldServerApiRequest): Promise<ApiResult>;
  revokeInvite(input: WorldServerApiRequest): Promise<ApiResult>;
  createJoinRequest(input: WorldServerApiRequest): Promise<ApiResult>;
  listJoinRequests(input: WorldServerApiRequest): Promise<ApiResult>;
  reviewJoinRequest(input: WorldServerApiRequest): Promise<ApiResult>;
  getSettings(input: WorldServerApiRequest): Promise<ApiResult>;
  patchSettings(input: WorldServerApiRequest): Promise<ApiResult>;
  listSettingsVersions(input: WorldServerApiRequest): Promise<ApiResult>;
  createSettingsVersion(input: WorldServerApiRequest): Promise<ApiResult>;
  listRulesetVersions(input: WorldServerApiRequest): Promise<ApiResult>;
  createRulesetVersion(input: WorldServerApiRequest): Promise<ApiResult>;
  listGameSystems(input: WorldServerApiRequest): Promise<ApiResult>;
  createGameSystem(input: WorldServerApiRequest): Promise<ApiResult>;
  updateGameSystem(input: WorldServerApiRequest): Promise<ApiResult>;
  archiveGameSystem(input: WorldServerApiRequest): Promise<ApiResult>;
  restoreGameSystem(input: WorldServerApiRequest): Promise<ApiResult>;
}

function isRecord(value: unknown): value is BodyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function bodyOf(input: WorldServerApiRequest): BodyRecord {
  return isRecord(input.body) ? input.body : {};
}

function stringOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function requiredString<T>(field: string, requestId?: string): ServerApiResponse<T> {
  return errorResponse(400, { kind: 'bad_request', message: `${field} must be a non-empty string.` }, { requestId });
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function stringArrayOf(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === 'string');
}

function numberOf(value: unknown, fallback = 100): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 200) : fallback;
}

function responseIs(value: unknown): value is ApiResult {
  return isRecord(value) && typeof value.ok === 'boolean' && typeof value.statusCode === 'number';
}

function repoError<T>(error: { kind: PostgresWorldServerRepositoryErrorKind; retryable?: boolean; reason?: string }, requestId?: string): ServerApiResponse<T> {
  if (error.kind === 'not_found') return errorResponse(404, { kind: 'not_found', message: 'World server resource not found.' }, { requestId });
  if (error.kind === 'conflict') {
    // A missing owner user is a distinct, actionable failure that retrying can
    // never resolve, so it is discriminated rather than reported as a duplicate.
    if (error.reason === MISSING_OWNER_USER_REASON) {
      return errorResponse(409, {
        kind: 'conflict',
        reason: MISSING_OWNER_USER_REASON,
        message: 'The signed-in user does not exist in this database.',
      }, { requestId });
    }
    return errorResponse(409, { kind: 'conflict', message: 'World server request conflicts with existing data.' }, { requestId });
  }
  if (error.kind === 'not_configured' || error.kind === 'schema_missing' || error.kind === 'database_error') {
    return errorResponse(503, { kind: 'unavailable', message: 'World server service is unavailable.', retryable: error.retryable }, { requestId });
  }
  return errorResponse(500, { kind: 'internal', message: 'World server request failed.' }, { requestId });
}

function foundationError<T>(error: { kind: PostgresPlatformFoundationRepositoryErrorKind; retryable?: boolean }, requestId?: string): ServerApiResponse<T> {
  if (error.kind === 'not_found') return errorResponse(404, { kind: 'not_found', message: 'Server settings resource not found.' }, { requestId });
  if (error.kind === 'conflict') return errorResponse(409, { kind: 'conflict', message: 'Server settings request conflicts with existing data.' }, { requestId });
  if (error.kind === 'not_configured' || error.kind === 'schema_missing' || error.kind === 'database_error') {
    return errorResponse(503, { kind: 'unavailable', message: 'Server settings service is unavailable.', retryable: error.retryable }, { requestId });
  }
  return errorResponse(500, { kind: 'internal', message: 'Server settings request failed.' }, { requestId });
}

function unwrapRepo<T>(result: PostgresWorldServerRepositoryResult<T>, requestId?: string): T | ApiResult {
  if (result.ok === false) return repoError(result.error, requestId);
  return result.value;
}

function unwrapFoundation<T>(result: PostgresPlatformFoundationRepositoryResult<T>, requestId?: string): T | ApiResult {
  if (result.ok === false) return foundationError(result.error, requestId);
  return result.value;
}

function toRoleKind(roleKey: string): 'owner' | 'admin' | 'moderator' | 'member' | 'guest' | 'custom' {
  if (roleKey === 'owner') return 'owner';
  if (roleKey === 'admin' || roleKey === 'administrator') return 'admin';
  if (roleKey === 'moderator' || roleKey === 'mod') return 'moderator';
  if (roleKey === 'guest') return 'guest';
  if (roleKey === 'member') return 'member';
  return 'custom';
}

function scopeOf(input: WorldServerApiRequest): ApiRequestScopeResult {
  const body = isRecord(input.body) ? input.body : undefined;
  return resolveApiRequestScope({ params: input.params, query: input.query, body, headers: input.headers });
}

function scopeFailure(scope: ApiRequestScopeResult, requestId?: string): ApiResult | null {
  if (scope.safe) return null;
  return errorResponse(400, { kind: 'bad_request', message: 'Request scope is inconsistent.' }, { requestId });
}

function idParam(input: WorldServerApiRequest, name: string): string | undefined {
  return stringOf(input.params?.[name]);
}

function viewerFor(input: WorldServerApiRequest, options: CreateWorldServerApiHandlersOptions): CurrentViewerContext {
  if (input.viewer) return input.viewer;
  const request: ApiRequestLike = { headers: input.headers };
  return createCurrentViewerContextFromAuthSession(resolveApiAuthSession(request, {
    allowDevAuthHeaders: options.allowDevAuthHeaders === true,
    nodeEnv: options.nodeEnv ?? 'production',
  }));
}

function requireAuthenticated(viewer: CurrentViewerContext, requestId?: string): ApiResult | null {
  return viewer.isAuthenticated && viewer.viewerUserId
    ? null
    : errorResponse(401, { kind: 'bad_request', message: 'Authentication required.' }, { requestId });
}

type AuthorizedServer = {
  viewer: CurrentViewerContext;
  server: WorldServerRecord;
  membership: WorldServerMembershipRecord | null;
  scope: ApiRequestScopeResult;
};

export function createWorldServerApiHandlers(
  options: CreateWorldServerApiHandlersOptions = {},
): WorldServerApiHandlers {
  const repository = options.worldServerRepository ?? createPostgresWorldServerRepository();
  const foundation = options.foundationRepository === undefined
    ? createPostgresPlatformFoundationRepository()
    : options.foundationRepository;

  async function authorizeServer(input: WorldServerApiRequest, action: ApiGuardAction, hide = action === 'view'): Promise<AuthorizedServer | ApiResult> {
    const requestId = input.requestId;
    const viewer = viewerFor(input, options);
    const authError = requireAuthenticated(viewer, requestId);
    if (authError) return authError;
    const scope = scopeOf(input);
    const conflict = scopeFailure(scope, requestId);
    if (conflict) return conflict;
    const worldServerId = idParam(input, 'worldServerId') ?? scope.scope.worldServerId;
    if (!worldServerId) return requiredString('worldServerId', requestId);

    const serverResult = unwrapRepo(await repository.getWorldServerById(worldServerId), requestId);
    if (responseIs(serverResult)) return serverResult;
    if (!serverResult) return errorResponse(404, { kind: 'not_found', message: 'World server not found.' }, { requestId });

    let membership: WorldServerMembershipRecord | null = null;
    if (viewer.viewerUserId !== serverResult.ownerId) {
      const membershipResult = unwrapRepo(await repository.getWorldServerMembershipByUser(worldServerId, viewer.viewerUserId!), requestId);
      if (responseIs(membershipResult)) return membershipResult;
      membership = membershipResult;
    }

    const guard = resolveApiPermissionGuard({
      action,
      viewer,
      requestScope: scope,
      content: {
        contentKind: 'world_server',
        contentId: serverResult.worldServerId,
        ownerUserId: serverResult.ownerId,
        worldServerId: serverResult.worldServerId,
        visibilityScope: 'server',
        aiScope: 'disabled',
        lifecycleStatus: serverResult.lifecycleStatus,
      },
      worldServer: {
        worldServerId: serverResult.worldServerId,
        ownerUserId: serverResult.ownerId,
        membership: membership
          ? {
              userId: membership.userId,
              membershipStatus: membership.membershipStatus as 'active' | 'pending' | 'suspended' | 'left' | 'removed',
              roleKey: membership.roleKey,
              roleKind: toRoleKind(membership.roleKey),
              permissionsPayload: membership.payload,
            }
          : null,
      },
      hideResourceExistence: hide,
      resourceExistenceKnown: true,
    });
    if (!guard.allowed) {
      return errorResponse(guard.httpStatus, {
        kind: guard.httpStatus === 404 ? 'not_found' : 'bad_request',
        message: guard.publicMessage ?? 'You do not have access to this resource.',
      }, { requestId });
    }
    return { viewer, server: serverResult, membership, scope };
  }

  async function authorizeTarget<T>(
    input: WorldServerApiRequest,
    target: Promise<PostgresWorldServerRepositoryResult<T | null>>,
    action: ApiGuardAction,
  ): Promise<{ access: AuthorizedServer; target: T } | ApiResult> {
    const access = await authorizeServer(input, action);
    if (responseIs(access)) return access;
    const targetResult = unwrapRepo(await target, input.requestId);
    if (responseIs(targetResult)) return targetResult;
    if (!targetResult) return errorResponse(404, { kind: 'not_found', message: 'World server resource not found.' }, { requestId: input.requestId });
    return { access, target: targetResult };
  }

  async function requireFoundation(requestId?: string): Promise<WorldServerFoundationRepository | ApiResult> {
    if (!foundation) return errorResponse(503, { kind: 'unavailable', message: 'Server settings service is unavailable.', retryable: false }, { requestId });
    return foundation;
  }

  async function createServer(input: WorldServerApiRequest): Promise<ApiResult> {
    const requestId = input.requestId;
    const viewer = viewerFor(input, options);
    const authError = requireAuthenticated(viewer, requestId);
    if (authError) return authError;
    const scope = scopeOf(input);
    const conflict = scopeFailure(scope, requestId);
    if (conflict) return conflict;
    const body = bodyOf(input);
    const displayName = stringOf(body.displayName) ?? stringOf(body.name);
    const serverHandle = stringOf(body.serverHandle) ?? stringOf(body.handle);
    if (!displayName) return requiredString('displayName', requestId);
    if (!serverHandle) return requiredString('serverHandle', requestId);
    const guard = resolveApiPermissionGuard({
      action: 'manageServerSettings',
      viewer,
      requestScope: scope,
      worldServer: { ownerUserId: viewer.viewerUserId },
    });
    if (!guard.allowed) return errorResponse(guard.httpStatus, { kind: 'bad_request', message: guard.publicMessage ?? 'You do not have access to this resource.' }, { requestId });
    const result = unwrapRepo(await repository.createWorldServer({
      worldServerId: randomUUID(),
      ownerId: viewer.viewerUserId!,
      serverHandle,
      displayName,
      description: stringOf(body.description),
      serverVisibility: stringOf(body.serverVisibility),
      joinPolicy: stringOf(body.joinPolicy),
      defaultGameSystemId: stringOf(body.defaultGameSystemId),
      publicProfilePayload: optionalRecord(body.publicProfilePayload),
      serverSettingsPayload: optionalRecord(body.serverSettingsPayload),
      softUpdatePolicyPayload: optionalRecord(body.softUpdatePolicyPayload),
    }), requestId);
    return responseIs(result) ? result : okResponse(result, { statusCode: 201, requestId });
  }

  async function updateMember(input: WorldServerApiRequest): Promise<ApiResult> {
    const body = bodyOf(input);
    const target = await authorizeTarget(input, repository.getWorldServerMembershipById(idParam(input, 'membershipId') ?? ''), 'manageMembers');
    if (responseIs(target)) return target;
    if (target.target.worldServerId !== target.access.server.worldServerId) return errorResponse(404, { kind: 'not_found', message: 'World server resource not found.' }, { requestId: input.requestId });
    if (typeof body.membershipStatus === 'string') {
      const result = unwrapRepo(await repository.updateWorldServerMembershipStatus({
        membershipId: target.target.membershipId,
        membershipStatus: body.membershipStatus,
        approvedByUserId: target.access.viewer.viewerUserId!,
      }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    }
    const result = unwrapRepo(await repository.updateWorldServerMembership({
      membershipId: target.target.membershipId,
      roleId: stringOf(body.roleId),
      roleKey: stringOf(body.roleKey),
      displayAlias: stringOf(body.displayAlias),
      payload: optionalRecord(body.payload),
    }), input.requestId);
    return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
  }

  async function updateRole(input: WorldServerApiRequest): Promise<ApiResult> {
    const body = bodyOf(input);
    const target = await authorizeTarget(input, repository.getWorldServerRoleById(idParam(input, 'roleId') ?? ''), 'manageRoles');
    if (responseIs(target)) return target;
    if (target.target.worldServerId !== target.access.server.worldServerId) return errorResponse(404, { kind: 'not_found', message: 'World server resource not found.' }, { requestId: input.requestId });
    const result = unwrapRepo(await repository.updateWorldServerRole({
      roleId: target.target.roleId,
      displayName: stringOf(body.displayName),
      roleKind: stringOf(body.roleKind),
      permissionsPayload: optionalRecord(body.permissionsPayload),
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
    }), input.requestId);
    return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
  }

  async function updateGameSystem(input: WorldServerApiRequest): Promise<ApiResult> {
    const body = bodyOf(input);
    const target = await authorizeTarget(input, repository.getWorldServerGameSystemBinding(idParam(input, 'bindingId') ?? ''), 'manageGameSystems');
    if (responseIs(target)) return target;
    if (target.target.worldServerId !== target.access.server.worldServerId) return errorResponse(404, { kind: 'not_found', message: 'World server resource not found.' }, { requestId: input.requestId });
    const result = unwrapRepo(await repository.updateWorldServerGameSystemBinding({
      bindingId: target.target.bindingId,
      displayName: stringOf(body.displayName),
      systemKind: stringOf(body.systemKind),
      isDefault: typeof body.isDefault === 'boolean' ? body.isDefault : undefined,
      rulesetTemplateId: stringOf(body.rulesetTemplateId),
      currentRulesetVersionId: stringOf(body.currentRulesetVersionId),
      config: optionalRecord(body.config),
      enabledPackVersionIds: stringArrayOf(body.enabledPackVersionIds),
    }), input.requestId);
    return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
  }

  async function getAuthorizedServer(input: WorldServerApiRequest, action: ApiGuardAction = 'view') {
    return authorizeServer(input, action);
  }

  return {
    async listWorldServers(input) {
      const viewer = viewerFor(input, options);
      const authError = requireAuthenticated(viewer, input.requestId);
      if (authError) return authError;
      const scope = scopeOf(input);
      const conflict = scopeFailure(scope, input.requestId);
      if (conflict) return conflict;
      const owners = unwrapRepo(await repository.listWorldServersByOwner(viewer.viewerUserId!, { limit: numberOf(input.query?.limit) }), input.requestId);
      if (responseIs(owners)) return owners;
      const memberships = unwrapRepo(await repository.listWorldServerMembershipsForUser(viewer.viewerUserId!, { membershipStatus: 'active', limit: numberOf(input.query?.limit) }), input.requestId);
      if (responseIs(memberships)) return memberships;
      const byId = new Map<string, WorldServerRecord>();
      for (const server of owners) byId.set(server.worldServerId, server);
      for (const membership of memberships) {
        if (byId.has(membership.worldServerId)) continue;
        const server = unwrapRepo(await repository.getWorldServerById(membership.worldServerId), input.requestId);
        if (responseIs(server)) return server;
        if (server) byId.set(server.worldServerId, server);
      }
      return okResponse([...byId.values()], { requestId: input.requestId });
    },

    async getWorldServer(input) {
      const access = await getAuthorizedServer(input);
      if (responseIs(access)) return access;
      return okResponse(access.server, { requestId: input.requestId });
    },

    createWorldServer: createServer,

    async updateWorldServer(input) {
      const access = await getAuthorizedServer(input, 'manageServerSettings');
      if (responseIs(access)) return access;
      const body = bodyOf(input);
      const result = unwrapRepo(await repository.updateWorldServerProfile({
        worldServerId: access.server.worldServerId,
        displayName: stringOf(body.displayName),
        description: stringOf(body.description),
        serverVisibility: stringOf(body.serverVisibility),
        joinPolicy: stringOf(body.joinPolicy),
        publicProfilePayload: optionalRecord(body.publicProfilePayload),
      }), input.requestId);
      if (responseIs(result)) return result;
      if (!result) return errorResponse(404, { kind: 'not_found', message: 'World server not found.' }, { requestId: input.requestId });
      return okResponse(result, { requestId: input.requestId });
    },

    async archiveWorldServer(input) {
      const access = await getAuthorizedServer(input, 'manageServerSettings');
      if (responseIs(access)) return access;
      const result = unwrapRepo(await repository.archiveWorldServer(access.server.worldServerId), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async restoreWorldServer(input) {
      const access = await getAuthorizedServer(input, 'manageServerSettings');
      if (responseIs(access)) return access;
      const result = unwrapRepo(await repository.restoreWorldServer(access.server.worldServerId), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async listMembers(input) {
      const access = await getAuthorizedServer(input);
      if (responseIs(access)) return access;
      const result = unwrapRepo(await repository.listWorldServerMemberships(access.server.worldServerId, { limit: numberOf(input.query?.limit) }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async listRoles(input) {
      const access = await getAuthorizedServer(input);
      if (responseIs(access)) return access;
      const result = unwrapRepo(await repository.listWorldServerRoles(access.server.worldServerId, { limit: numberOf(input.query?.limit) }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async createRole(input) {
      const access = await getAuthorizedServer(input, 'manageRoles');
      if (responseIs(access)) return access;
      const body = bodyOf(input);
      const roleKey = stringOf(body.roleKey);
      const displayName = stringOf(body.displayName);
      if (!roleKey) return requiredString('roleKey', input.requestId);
      if (!displayName) return requiredString('displayName', input.requestId);
      const result = unwrapRepo(await repository.createWorldServerRole({
        roleId: randomUUID(),
        worldServerId: access.server.worldServerId,
        roleKey,
        displayName,
        roleKind: stringOf(body.roleKind),
        permissionsPayload: optionalRecord(body.permissionsPayload),
        isSystemRole: false,
        sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
      }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { statusCode: 201, requestId: input.requestId });
    },

    updateRole,

    updateMember,

    async listInvites(input) {
      const access = await getAuthorizedServer(input, 'inviteMember');
      if (responseIs(access)) return access;
      const result = unwrapRepo(await repository.listWorldServerInvites(access.server.worldServerId, { limit: numberOf(input.query?.limit) }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async createInvite(input) {
      const access = await getAuthorizedServer(input, 'inviteMember');
      if (responseIs(access)) return access;
      const body = bodyOf(input);
      const result = unwrapRepo(await repository.createWorldServerInvite({
        inviteId: randomUUID(),
        worldServerId: access.server.worldServerId,
        inviteCode: stringOf(body.inviteCode) ?? randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase(),
        createdByUserId: access.viewer.viewerUserId!,
        targetUserId: stringOf(body.targetUserId),
        targetEmail: stringOf(body.targetEmail),
        defaultRoleKey: stringOf(body.defaultRoleKey),
        // Private-alpha invitations are intentionally person-scoped by default.
        // The code becomes bound to its first successful recipient at redemption.
        maxUses: typeof body.maxUses === 'number' ? body.maxUses : 1,
        expiresAt: stringOf(body.expiresAt),
        payload: optionalRecord(body.payload),
      }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { statusCode: 201, requestId: input.requestId });
    },

    async revokeInvite(input) {
      const inviteId = idParam(input, 'inviteId');
      if (!inviteId) return requiredString('inviteId', input.requestId);
      const target = await authorizeTarget(input, repository.getWorldServerInviteById(inviteId), 'inviteMember');
      if (responseIs(target)) return target;
      if (target.target.worldServerId !== target.access.server.worldServerId) {
        return errorResponse(404, { kind: 'not_found', message: 'World server resource not found.' }, { requestId: input.requestId });
      }
      const result = unwrapRepo(await repository.updateWorldServerInviteStatus({
        inviteId: target.target.inviteId,
        inviteStatus: 'revoked',
      }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async createJoinRequest(input) {
      const viewer = viewerFor(input, options);
      const authError = requireAuthenticated(viewer, input.requestId);
      if (authError) return authError;
      const scope = scopeOf(input);
      const conflict = scopeFailure(scope, input.requestId);
      if (conflict) return conflict;
      const worldServerId = idParam(input, 'worldServerId') ?? scope.scope.worldServerId;
      if (!worldServerId) return requiredString('worldServerId', input.requestId);
      const server = unwrapRepo(await repository.getWorldServerById(worldServerId), input.requestId);
      if (responseIs(server)) return server;
      if (!server) return errorResponse(404, { kind: 'not_found', message: 'World server not found.' }, { requestId: input.requestId });
      const body = bodyOf(input);
      const result = unwrapRepo(await repository.createWorldServerJoinRequest({
        joinRequestId: randomUUID(),
        worldServerId,
        requesterUserId: viewer.viewerUserId!,
        requestMessage: stringOf(body.requestMessage),
        requestedRoleKey: stringOf(body.requestedRoleKey),
        payload: optionalRecord(body.payload),
      }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { statusCode: 201, requestId: input.requestId });
    },

    async listJoinRequests(input) {
      const access = await getAuthorizedServer(input, 'manageMembers');
      if (responseIs(access)) return access;
      const result = unwrapRepo(await repository.listWorldServerJoinRequests(access.server.worldServerId, { limit: numberOf(input.query?.limit) }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async reviewJoinRequest(input) {
      const requestId = input.requestId;
      const joinRequestId = idParam(input, 'joinRequestId');
      if (!joinRequestId) return requiredString('joinRequestId', requestId);
      const joinRequest = unwrapRepo(await repository.getWorldServerJoinRequestById(joinRequestId), requestId);
      if (responseIs(joinRequest)) return joinRequest;
      if (!joinRequest) return errorResponse(404, { kind: 'not_found', message: 'Join request not found.' }, { requestId });
      const access = await getAuthorizedServer({ ...input, params: { ...(input.params ?? {}), worldServerId: joinRequest.worldServerId } }, 'manageMembers');
      if (responseIs(access)) return access;
      const body = bodyOf(input);
      const status = stringOf(body.requestStatus) ?? stringOf(body.status);
      if (!status) return requiredString('requestStatus', requestId);
      const result = unwrapRepo(await repository.updateWorldServerJoinRequestStatus({
        joinRequestId,
        requestStatus: status,
        reviewedByUserId: access.viewer.viewerUserId!,
        responseMessage: stringOf(body.responseMessage),
      }), requestId);
      return responseIs(result) ? result : okResponse(result, { requestId });
    },

    async getSettings(input) {
      const access = await getAuthorizedServer(input);
      if (responseIs(access)) return access;
      return okResponse({
        worldServerId: access.server.worldServerId,
        defaultGameSystemId: access.server.defaultGameSystemId,
        settings: access.server.serverSettingsPayload,
        softUpdatePolicy: access.server.softUpdatePolicyPayload,
      }, { requestId: input.requestId });
    },

    async patchSettings(input) {
      const access = await getAuthorizedServer(input, 'manageServerSettings');
      if (responseIs(access)) return access;
      const body = bodyOf(input);
      const settings = optionalRecord(body.settings) ?? optionalRecord(body.serverSettingsPayload);
      const softUpdatePolicy = optionalRecord(body.softUpdatePolicy) ?? optionalRecord(body.softUpdatePolicyPayload);
      const result = unwrapRepo(await repository.updateWorldServerSettings({
        worldServerId: access.server.worldServerId,
        defaultGameSystemId: stringOf(body.defaultGameSystemId),
        serverSettingsPayload: settings,
        softUpdatePolicyPayload: softUpdatePolicy,
      }), input.requestId);
      if (responseIs(result)) return result;
      if (!result) return errorResponse(404, { kind: 'not_found', message: 'World server not found.' }, { requestId: input.requestId });
      return okResponse({
        worldServer: result,
        versioned: false,
        note: 'Use the settings version endpoint to publish an explicit version without changing live runtime state.',
      }, { requestId: input.requestId });
    },

    async listSettingsVersions(input) {
      const access = await getAuthorizedServer(input);
      if (responseIs(access)) return access;
      const service = await requireFoundation(input.requestId);
      if (responseIs(service)) return service;
      const result = unwrapFoundation(await service.listWorldServerSettingsVersions(access.server.worldServerId, numberOf(input.query?.limit)), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async createSettingsVersion(input) {
      const access = await getAuthorizedServer(input, 'manageServerSettings');
      if (responseIs(access)) return access;
      const service = await requireFoundation(input.requestId);
      if (responseIs(service)) return service;
      const body = bodyOf(input);
      const settingsPayload = optionalRecord(body.settingsPayload) ?? optionalRecord(body.settings) ?? {};
      const softUpdatePayload = optionalRecord(body.softUpdatePolicyPayload) ?? optionalRecord(body.softUpdatePolicy) ?? {};
      const existing = unwrapFoundation(await service.listWorldServerSettingsVersions(access.server.worldServerId, 200), input.requestId);
      if (responseIs(existing)) return existing;
      const versionNumber = typeof body.versionNumber === 'number' && body.versionNumber > 0
        ? body.versionNumber
        : existing.reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1;
      const result = unwrapFoundation(await service.createWorldServerSettingsVersion({
        settingsVersionId: randomUUID(),
        worldServerId: access.server.worldServerId,
        createdByUserId: access.viewer.viewerUserId!,
        versionNumber,
        settingsPayload,
        softUpdatePolicyPayload: softUpdatePayload,
        changeSummary: stringOf(body.changeSummary),
      }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { statusCode: 201, requestId: input.requestId });
    },

    async listRulesetVersions(input) {
      const access = await getAuthorizedServer(input);
      if (responseIs(access)) return access;
      const service = await requireFoundation(input.requestId);
      if (responseIs(service)) return service;
      const result = unwrapFoundation(await service.listWorldServerRulesetVersions(access.server.worldServerId, stringOf(input.query?.gameSystemId), numberOf(input.query?.limit)), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async createRulesetVersion(input) {
      const access = await getAuthorizedServer(input, 'manageServerSettings');
      if (responseIs(access)) return access;
      const service = await requireFoundation(input.requestId);
      if (responseIs(service)) return service;
      const body = bodyOf(input);
      const gameSystemId = stringOf(body.gameSystemId);
      const versionLabel = stringOf(body.versionLabel);
      if (!gameSystemId) return requiredString('gameSystemId', input.requestId);
      if (!versionLabel) return requiredString('versionLabel', input.requestId);
      const result = unwrapFoundation(await service.createWorldServerRulesetVersion({
        rulesetVersionId: randomUUID(),
        worldServerId: access.server.worldServerId,
        gameSystemId,
        versionLabel,
        lifecycleStatus: stringOf(body.lifecycleStatus),
        rulesetPayload: optionalRecord(body.rulesetPayload),
        compatibilityPayload: optionalRecord(body.compatibilityPayload),
        createdByUserId: access.viewer.viewerUserId!,
        publishedAt: stringOf(body.publishedAt),
      }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { statusCode: 201, requestId: input.requestId });
    },

    async listGameSystems(input) {
      const access = await getAuthorizedServer(input);
      if (responseIs(access)) return access;
      const result = unwrapRepo(await repository.listGameSystemBindingsByWorldServer(access.server.worldServerId, { limit: numberOf(input.query?.limit) }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async createGameSystem(input) {
      const access = await getAuthorizedServer(input, 'manageGameSystems');
      if (responseIs(access)) return access;
      const body = bodyOf(input);
      const gameSystemId = stringOf(body.gameSystemId);
      const displayName = stringOf(body.displayName);
      if (!gameSystemId) return requiredString('gameSystemId', input.requestId);
      if (!displayName) return requiredString('displayName', input.requestId);
      const result = unwrapRepo(await repository.bindGameSystemToWorldServer({
        bindingId: randomUUID(),
        worldServerId: access.server.worldServerId,
        gameSystemId,
        displayName,
        systemKind: stringOf(body.systemKind),
        bindingStatus: stringOf(body.bindingStatus),
        isDefault: typeof body.isDefault === 'boolean' ? body.isDefault : undefined,
        rulesetTemplateId: stringOf(body.rulesetTemplateId),
        currentRulesetVersionId: stringOf(body.currentRulesetVersionId),
        config: optionalRecord(body.config),
        enabledPackVersionIds: stringArrayOf(body.enabledPackVersionIds),
        createdByUserId: access.viewer.viewerUserId!,
      }), input.requestId);
      return responseIs(result) ? result : okResponse(result, { statusCode: 201, requestId: input.requestId });
    },

    updateGameSystem,

    async archiveGameSystem(input) {
      const target = await authorizeTarget(input, repository.getWorldServerGameSystemBinding(idParam(input, 'bindingId') ?? ''), 'manageGameSystems');
      if (responseIs(target)) return target;
      if (target.target.worldServerId !== target.access.server.worldServerId) return errorResponse(404, { kind: 'not_found', message: 'World server resource not found.' }, { requestId: input.requestId });
      const result = unwrapRepo(await repository.archiveWorldServerGameSystemBinding(target.target.bindingId), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },

    async restoreGameSystem(input) {
      const target = await authorizeTarget(input, repository.getWorldServerGameSystemBinding(idParam(input, 'bindingId') ?? ''), 'manageGameSystems');
      if (responseIs(target)) return target;
      if (target.target.worldServerId !== target.access.server.worldServerId) return errorResponse(404, { kind: 'not_found', message: 'World server resource not found.' }, { requestId: input.requestId });
      const result = unwrapRepo(await repository.restoreWorldServerGameSystemBinding(target.target.bindingId), input.requestId);
      return responseIs(result) ? result : okResponse(result, { requestId: input.requestId });
    },
  };
}

export const defaultPostgresWorldServerApiHandlers = createWorldServerApiHandlers();

export type {
  WorldServerGameSystemBindingRecord,
  WorldServerJoinRequestRecord,
  WorldServerMembershipRecord,
  WorldServerRoleRecord,
};
