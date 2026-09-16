/**
 * Campaign / Room / Runtime API handlers (P5.API-CAMPAIGN-ROOM).
 *
 * These handlers expose durable metadata and append-only history through the
 * existing auth, scope, permission, and safe-response boundaries. The live Room
 * Server and WebSocket transport remain authoritative for lobby/runtime state.
 */

import { randomUUID } from 'node:crypto';
import { materializeDndActorToken } from '../services/materializeDndActorToken.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';
import {
  acceptCampaignActorSourceUpdate,
  reviewCampaignActorSourceUpdate,
  type CampaignActorSourceVaultRepository,
} from '../services/campaignActorSourceReview.js';

import {
  createPostgresCampaignRepository,
  type PostgresCampaignRepository,
  type PostgresCampaignRepositoryResult,
  type PostgresCampaignRecord,
  type UpdateCampaignInput,
} from '../adapters/postgresCampaignRepository.js';
import {
  createPostgresCampaignRoomRepository,
  type PostgresCampaignRoomRepository,
  type PostgresCampaignRoomRepositoryResult,
} from '../adapters/postgresCampaignRoomRepository.js';
import { createPostgresSceneStateRepository, type PostgresSceneStateRepository, type SceneStateDocumentRecord } from '../adapters/postgresSceneStateRepository.js';
import {
  createPostgresPlatformFoundationRepository,
  type CampaignActorInstanceRecord,
  type PostgresPlatformFoundationRepositoryResult,
  type RoomRecord,
  type UpdateRoomRecordInput,
} from '../adapters/postgresPlatformFoundationRepository.js';
import {
  createPostgresRuntimeEventRepository,
  type PostgresRuntimeEventRepository,
  type PostgresRuntimeEventRepositoryResult,
  type RuntimeEventRecord,
  type RuntimeSessionRecord,
} from '../adapters/postgresRuntimeEventRepository.js';
import {
  createPostgresWorldServerRepository,
  type PostgresWorldServerRepository,
  type PostgresWorldServerRepositoryResult,
  type WorldServerCampaignBindingRecord,
  type WorldServerMembershipRecord,
  type WorldServerRecord,
} from '../adapters/postgresWorldServerRepository.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveApiAuthSession, type ApiRequestLike } from '../auth/requestAuthSession.js';
import { resolveApiPermissionGuard, type ApiGuardAction } from './apiPermissionGuard.js';
import { resolveApiRequestScope, type ApiRequestScopeResult } from './apiRequestContext.js';
import { errorResponse, okResponse, type ServerApiResponse } from './apiResponse.js';
import {
  persistRuntimeEventCandidate,
  type RuntimeBridgeVisibilityScope,
  type RuntimeEventPersistenceRepositoryPort,
} from '../runtime/runtimeEventPersistenceBridge.js';
import { createRuntimeEventRepositoryPort } from '../runtime/runtimeEventRepositoryPortAdapter.js';
import { resolveRuntimeSessionContext } from '../runtime/runtimeSessionContext.js';
import { LIVE_ROOM_SNAPSHOT_METADATA_KEY } from '../services/liveRoomLifecyclePersistence.js';
import { LIVE_ROOM_RUNTIME_LOG_EVENT_KIND_PREFIX } from '../services/liveRoomRuntimeLogPersistence.js';
import { LIVE_ROOM_MAP_EVENT_KIND_PREFIX } from '../services/liveRoomMapPersistence.js';

type ApiResult = ServerApiResponse<unknown>;
type BodyRecord = Record<string, unknown>;
type FoundationRepository = ReturnType<typeof createPostgresPlatformFoundationRepository>;
type WorldRepository = Pick<PostgresWorldServerRepository,
  | 'getWorldServerById'
  | 'getWorldServerMembershipByUser'
  | 'getWorldServerCampaignBindingByPair'
  | 'listCampaignBindingsByWorldServer'
  | 'bindCampaignToWorldServer'
>;
type CampaignRepository = Pick<PostgresCampaignRepository,
  | 'getCampaignById'
  | 'createCampaign'
  | 'updateCampaign'
  | 'archiveCampaign'
  | 'restoreCampaign'
>;
type FoundationApiRepository = Pick<FoundationRepository,
  | 'acceptCampaignActorSourceUpdate'
  | 'getCampaignActorInstanceById'
  | 'listCampaignActorInstances'
  | 'createCampaignActorInstance'
  | 'updateCampaignActorInstance'
  | 'archiveCampaignActorInstance'
  | 'createRoomRecord'
  | 'getRoomRecordByRoomId'
  | 'listRoomRecordsByCampaign'
  | 'updateRoomRecord'
>;
type RuntimeRepository = Pick<PostgresRuntimeEventRepository,
  | 'getRuntimeSessionById'
  | 'listRuntimeSessionsByCampaign'
  | 'createRuntimeSession'
  | 'updateRuntimeSession'
  | 'listRuntimeEvents'
  | 'appendRuntimeEvent'
>;
type SceneStateRepository = Pick<PostgresSceneStateRepository, 'listSceneStates' | 'getSceneState' | 'createSceneState' | 'updateSceneStateMetadata' | 'archiveSceneState' | 'duplicateSceneState'>;

export interface CampaignRoomApiRequest {
  requestId?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  viewer?: CurrentViewerContext;
}

/**
 * Reports the runtime session an ACTIVE live room currently owns for a room, or
 * undefined when no live room is running it. This is a read over the existing
 * in-memory room registry — the live authority itself — and introduces no new
 * state and no second source of truth.
 */
export type LiveRoomRuntimeSessionLookup = (roomId: string) => string | undefined;

/**
 * Explicit opt-out for compositions that genuinely have no room registry.
 * Required rather than optional so the authority guard can never disappear by
 * forgetting to pass it; opting out stays deliberate and greppable.
 */
export const NO_LIVE_ROOM_REGISTRY: LiveRoomRuntimeSessionLookup = () => undefined;

export interface CreateCampaignRoomApiHandlersOptions {
  /** Required: see NO_LIVE_ROOM_REGISTRY for the explicit opt-out. */
  liveRoomRuntimeSessionId: LiveRoomRuntimeSessionLookup;
  worldRepository?: WorldRepository;
  campaignRepository?: CampaignRepository;
  foundationRepository?: FoundationApiRepository;
  /**
   * Read-only Vault port for T11b source review. Optional: without it the
   * review and accept routes report the source as unavailable rather than
   * failing the whole handler set.
   */
  actorVaultRepository?: CampaignActorSourceVaultRepository;
  runtimeRepository?: RuntimeRepository;
  runtimeEventPersistenceRepository?: RuntimeEventPersistenceRepositoryPort;
  runtimeEventPersistenceBridgeEnabled?: boolean;
  campaignRoomRepository?: PostgresCampaignRoomRepository;
  sceneStateRepository?: SceneStateRepository;
  allowDevAuthHeaders?: boolean;
  nodeEnv?: string;
}

export interface CampaignRoomApiHandlers {
  listCampaigns(input: CampaignRoomApiRequest): Promise<ApiResult>;
  getCampaign(input: CampaignRoomApiRequest): Promise<ApiResult>;
  createCampaign(input: CampaignRoomApiRequest): Promise<ApiResult>;
  updateCampaign(input: CampaignRoomApiRequest): Promise<ApiResult>;
  archiveCampaign(input: CampaignRoomApiRequest): Promise<ApiResult>;
  restoreCampaign(input: CampaignRoomApiRequest): Promise<ApiResult>;
  listCampaignActors(input: CampaignRoomApiRequest): Promise<ApiResult>;
  getCampaignActor(input: CampaignRoomApiRequest): Promise<ApiResult>;
  createCampaignActor(input: CampaignRoomApiRequest): Promise<ApiResult>;
  updateCampaignActor(input: CampaignRoomApiRequest): Promise<ApiResult>;
  archiveCampaignActor(input: CampaignRoomApiRequest): Promise<ApiResult>;
  /** T11b: compact, privacy-safe review of a changed character source. */
  reviewCampaignActorSource(input: CampaignRoomApiRequest): Promise<ApiResult>;
  /** T11b: explicit host acceptance of the current character source. */
  acceptCampaignActorSource(input: CampaignRoomApiRequest): Promise<ApiResult>;
  listRooms(input: CampaignRoomApiRequest): Promise<ApiResult>;
  getRoom(input: CampaignRoomApiRequest): Promise<ApiResult>;
  createRoom(input: CampaignRoomApiRequest): Promise<ApiResult>;
  updateRoom(input: CampaignRoomApiRequest): Promise<ApiResult>;
  listParticipants(input: CampaignRoomApiRequest): Promise<ApiResult>;
  listLobbySlots(input: CampaignRoomApiRequest): Promise<ApiResult>;
  getRuntimeSession(input: CampaignRoomApiRequest): Promise<ApiResult>;
  createRuntimeSession(input: CampaignRoomApiRequest): Promise<ApiResult>;
  updateRuntimeSession(input: CampaignRoomApiRequest): Promise<ApiResult>;
  listRuntimeEvents(input: CampaignRoomApiRequest): Promise<ApiResult>;
  appendRuntimeEvent(input: CampaignRoomApiRequest): Promise<ApiResult>;
  listSceneStates(input: CampaignRoomApiRequest): Promise<ApiResult>;
  getSceneState(input: CampaignRoomApiRequest): Promise<ApiResult>;
  createSceneState(input: CampaignRoomApiRequest): Promise<ApiResult>;
  updateSceneState(input: CampaignRoomApiRequest): Promise<ApiResult>;
  archiveSceneState(input: CampaignRoomApiRequest): Promise<ApiResult>;
  duplicateSceneState(input: CampaignRoomApiRequest): Promise<ApiResult>;
}

type RepoFailure = { kind: string; retryable?: boolean };

function isApiResult(value: unknown): value is ApiResult {
  return typeof value === 'object' && value !== null && 'ok' in value && 'statusCode' in value;
}

function requestIdOf(input: CampaignRoomApiRequest): string | undefined {
  return input.requestId;
}

function stringOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function numberOf(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function bodyOf(input: CampaignRoomApiRequest): BodyRecord {
  return input.body && typeof input.body === 'object' && !Array.isArray(input.body)
    ? input.body as BodyRecord
    : {};
}

function recordOf(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/** The restart snapshot is server-internal; the durable room API exposes only normal metadata. */
function publicRoomRecord(room: RoomRecord): RoomRecord {
  const { [LIVE_ROOM_SNAPSHOT_METADATA_KEY]: _internalSnapshot, ...metadata } = room.metadata;
  return { ...room, metadata };
}

function stringArrayOf(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '').map((item) => item.trim());
}

function runtimeVisibilityOf(value: unknown): RuntimeBridgeVisibilityScope | undefined {
  const visibility = stringOf(value);
  if (visibility === 'private' || visibility === 'public' || visibility === 'hostOnly') return visibility;
  if (visibility === 'campaign' || visibility === 'server' || visibility === 'user_private' || visibility === 'global_public' || visibility === 'unlisted') return visibility;
  return undefined;
}

function idParam(input: CampaignRoomApiRequest, name: string): string | undefined {
  return stringOf(input.params?.[name]);
}

function scopeOf(input: CampaignRoomApiRequest): ApiRequestScopeResult {
  return resolveApiRequestScope({
    params: input.params,
    query: input.query,
    body: recordOf(input.body),
    headers: input.headers,
  });
}

function scopeFailure(scope: ApiRequestScopeResult, requestId?: string): ApiResult | null {
  return scope.safe
    ? null
    : errorResponse(400, { kind: 'bad_request', message: 'Request scope is inconsistent.' }, { requestId });
}

function requiredString(name: string, requestId?: string): ApiResult {
  return errorResponse(400, { kind: 'validation', message: `${name} is required.` }, { requestId });
}

function safeSceneState(value: unknown): Record<string, unknown> | null {
  const state = recordOf(value);
  if (!state || state.schemaVersion !== 1 || state.appFeature !== 'scene-runtime-snapshot' || !stringOf(state.exportedAt)) return null;
  const blocked = new Set(['authorization', 'headers', 'cookie', 'password', 'token', 'secret', 'access_token', 'refresh_token']);
  const walk = (candidate: unknown): boolean => Array.isArray(candidate)
    ? candidate.every(walk)
    : !candidate || typeof candidate !== 'object'
      ? true
      : Object.entries(candidate as Record<string, unknown>).every(([key, nested]) => !blocked.has(key.toLowerCase()) && walk(nested));
  return walk(state) ? state : null;
}

function repositoryError(error: RepoFailure, requestId: string | undefined, domain: string): ApiResult {
  if (error.kind === 'not_found') return errorResponse(404, { kind: 'not_found', message: `${domain} resource not found.` }, { requestId });
  if (error.kind === 'conflict') return errorResponse(409, { kind: 'conflict', message: `${domain} request conflicts with existing data.` }, { requestId });
  if (error.kind === 'not_configured' || error.kind === 'schema_missing' || error.kind === 'database_error') {
    return errorResponse(503, { kind: 'unavailable', message: `${domain} service is unavailable.`, retryable: error.retryable }, { requestId });
  }
  return errorResponse(500, { kind: 'internal', message: `${domain} request failed.` }, { requestId });
}

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: RepoFailure }, requestId: string | undefined, domain: string): T | ApiResult {
  return result.ok === false ? repositoryError(result.error, requestId, domain) : result.value;
}

function viewerFor(input: CampaignRoomApiRequest, options: CreateCampaignRoomApiHandlersOptions): CurrentViewerContext {
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

function toRoleKind(roleKey: string): 'owner' | 'admin' | 'moderator' | 'member' | 'guest' | 'custom' {
  if (roleKey === 'owner') return 'owner';
  if (roleKey === 'admin' || roleKey === 'administrator') return 'admin';
  if (roleKey === 'moderator' || roleKey === 'mod') return 'moderator';
  if (roleKey === 'guest') return 'guest';
  if (roleKey === 'member') return 'member';
  return 'custom';
}

function worldServerContext(server: WorldServerRecord, membership: WorldServerMembershipRecord | null) {
  return {
    worldServerId: server.worldServerId,
    ownerUserId: server.ownerId,
    membership: membership
      ? {
          userId: membership.userId,
          membershipStatus: membership.membershipStatus as 'active' | 'pending' | 'suspended' | 'left' | 'removed',
          roleKey: membership.roleKey,
          roleKind: toRoleKind(membership.roleKey),
          permissionsPayload: membership.payload,
        }
      : null,
  };
}

interface AuthorizedWorld {
  viewer: CurrentViewerContext;
  server: WorldServerRecord;
  membership: WorldServerMembershipRecord | null;
  scope: ApiRequestScopeResult;
}

interface AuthorizedCampaign extends AuthorizedWorld {
  campaign: PostgresCampaignRecord;
  binding: WorldServerCampaignBindingRecord;
}

export function createCampaignRoomApiHandlers(options: CreateCampaignRoomApiHandlersOptions): CampaignRoomApiHandlers {
  const worldRepository = options.worldRepository ?? createPostgresWorldServerRepository();
  const campaignRepository = options.campaignRepository ?? createPostgresCampaignRepository();
  const foundationRepository = options.foundationRepository ?? createPostgresPlatformFoundationRepository();
  const actorVaultRepository = options.actorVaultRepository;
  const runtimeRepository = options.runtimeRepository ?? createPostgresRuntimeEventRepository();
  const runtimeEventPersistenceRepository =
    options.runtimeEventPersistenceRepository ?? createRuntimeEventRepositoryPort(runtimeRepository);
  const campaignRoomRepository = options.campaignRoomRepository ?? createPostgresCampaignRoomRepository();
  const sceneStateRepository = options.sceneStateRepository ?? createPostgresSceneStateRepository();
  const liveRoomRuntimeSessionId = options.liveRoomRuntimeSessionId;

  /**
   * T7 invariant: while an active live room owns a runtime session, that session
   * is mutated only through the live-room authority path (member/permission
   * guard -> in-memory registry -> durable confirmation -> WebSocket broadcast).
   * Campaign-side direct mutation is rejected rather than synchronised.
   * Reads stay open so a live session's history can still be reviewed.
   */
  function liveRoomConflict(roomId: string, runtimeSessionId: string | undefined, requestId: string | undefined): ApiResult | null {
    const liveSessionId = liveRoomRuntimeSessionId(roomId);
    if (!liveSessionId) return null;
    if (runtimeSessionId !== undefined && liveSessionId !== runtimeSessionId) return null;
    return errorResponse(409, {
      kind: 'conflict',
      reason: 'session_owned_by_live_room',
      message: 'This runtime session is being run live. Make changes through the live room.',
    }, { requestId });
  }

  /**
   * The durable event-kind namespaces below are produced ONLY by the live-room
   * persistence modules and are trusted by startup recovery. Accepting them here
   * would let a caller manufacture recovered live-room state, so they are
   * refused for every session — live or preparation.
   */
  function reservedEventKind(eventKind: string, requestId: string | undefined): ApiResult | null {
    const reserved = eventKind.startsWith(LIVE_ROOM_RUNTIME_LOG_EVENT_KIND_PREFIX)
      || eventKind.startsWith(LIVE_ROOM_MAP_EVENT_KIND_PREFIX);
    return reserved
      ? errorResponse(400, {
          kind: 'bad_request',
          reason: 'reserved_runtime_event_kind',
          message: 'This event kind is reserved for live-room recovery and cannot be written directly.',
        }, { requestId })
      : null;
  }

  async function authorizeWorld(input: CampaignRoomApiRequest, action: ApiGuardAction, hide = action === 'view'): Promise<AuthorizedWorld | ApiResult> {
    const requestId = requestIdOf(input);
    const viewer = viewerFor(input, options);
    const authError = requireAuthenticated(viewer, requestId);
    if (authError) return authError;
    const scope = scopeOf(input);
    const conflict = scopeFailure(scope, requestId);
    if (conflict) return conflict;
    const worldServerId = idParam(input, 'worldServerId') ?? scope.scope.worldServerId;
    if (!worldServerId) return requiredString('worldServerId', requestId);
    const server = unwrap(await worldRepository.getWorldServerById(worldServerId), requestId, 'World server');
    if (isApiResult(server)) return server;
    if (!server) return errorResponse(404, { kind: 'not_found', message: 'World server not found.' }, { requestId });
    let membership: WorldServerMembershipRecord | null = null;
    if (viewer.viewerUserId !== server.ownerId) {
      const result = unwrap(await worldRepository.getWorldServerMembershipByUser(worldServerId, viewer.viewerUserId!), requestId, 'World server');
      if (isApiResult(result)) return result;
      membership = result;
    }
    const guard = resolveApiPermissionGuard({
      action,
      viewer,
      requestScope: scope,
      content: action === 'view' ? {
        contentKind: 'world_server',
        contentId: server.worldServerId,
        ownerUserId: server.ownerId,
        worldServerId: server.worldServerId,
        visibilityScope: 'server',
        aiScope: 'disabled',
        lifecycleStatus: server.lifecycleStatus,
      } : undefined,
      worldServer: worldServerContext(server, membership),
      hideResourceExistence: hide,
      resourceExistenceKnown: true,
    });
    if (!guard.allowed) {
      return errorResponse(guard.httpStatus, {
        kind: guard.httpStatus === 404 ? 'not_found' : guard.httpStatus === 401 ? 'bad_request' : 'bad_request',
        message: guard.publicMessage ?? 'You do not have access to this resource.',
      }, { requestId });
    }
    return { viewer, server, membership, scope };
  }

  async function authorizeCampaign(input: CampaignRoomApiRequest, action: ApiGuardAction = 'view'): Promise<AuthorizedCampaign | ApiResult> {
    const world = await authorizeWorld(input, 'view');
    if (isApiResult(world)) return world;
    const campaignId = idParam(input, 'campaignId') ?? world.scope.scope.campaignId;
    if (!campaignId) return requiredString('campaignId', requestIdOf(input));
    const binding = unwrap(await worldRepository.getWorldServerCampaignBindingByPair(world.server.worldServerId, campaignId), requestIdOf(input), 'Campaign');
    if (isApiResult(binding)) return binding;
    if (!binding || binding.archivedAt) return errorResponse(404, { kind: 'not_found', message: 'Campaign not found.' }, { requestId: requestIdOf(input) });
    const campaign = unwrap(await campaignRepository.getCampaignById(campaignId), requestIdOf(input), 'Campaign');
    if (isApiResult(campaign)) return campaign;
    if (!campaign) return errorResponse(404, { kind: 'not_found', message: 'Campaign not found.' }, { requestId: requestIdOf(input) });
    if (action === 'view') return { ...world, campaign, binding };
    const guard = resolveApiPermissionGuard({
      action,
      viewer: world.viewer,
      requestScope: world.scope,
      content: {
        contentKind: 'campaign',
        contentId: campaign.campaignId,
        ownerUserId: campaign.ownerId,
        worldServerId: world.server.worldServerId,
        campaignId: campaign.campaignId,
        visibilityScope: 'server',
        aiScope: 'disabled',
        lifecycleStatus: campaign.lifecycleStatus,
      },
      worldServer: worldServerContext(world.server, world.membership),
      hideResourceExistence: true,
      resourceExistenceKnown: true,
    });
    if (!guard.allowed) return errorResponse(guard.httpStatus, { kind: guard.httpStatus === 404 ? 'not_found' : 'bad_request', message: guard.publicMessage ?? 'You do not have access to this resource.' }, { requestId: requestIdOf(input) });
    return { ...world, campaign, binding };
  }

  async function authorizeRoom(input: CampaignRoomApiRequest): Promise<{ access: AuthorizedCampaign; room: RoomRecord } | ApiResult> {
    const access = await authorizeCampaign(input, 'view');
    if (isApiResult(access)) return access;
    const roomId = idParam(input, 'roomId') ?? stringOf(input.query?.roomId);
    if (!roomId) return requiredString('roomId', requestIdOf(input));
    const room = unwrap(await foundationRepository.getRoomRecordByRoomId(roomId), requestIdOf(input), 'Room');
    if (isApiResult(room)) return room;
    if (!room || room.worldServerId !== access.server.worldServerId || room.campaignId !== access.campaign.campaignId) {
      return errorResponse(404, { kind: 'not_found', message: 'Room not found.' }, { requestId: requestIdOf(input) });
    }
    return { access, room };
  }

  async function authorizeRoomManagement(input: CampaignRoomApiRequest): Promise<{ access: AuthorizedCampaign; room: RoomRecord } | ApiResult> {
    const roomAccess = await authorizeRoom(input);
    if (isApiResult(roomAccess)) return roomAccess;
    if (roomAccess.access.viewer.viewerUserId === roomAccess.room.hostUserId) return roomAccess;
    const management = await authorizeWorld(input, 'manageServerSettings', false);
    if (isApiResult(management)) return management;
    return roomAccess;
  }

  async function sessionForRoom(input: CampaignRoomApiRequest, access: AuthorizedCampaign, requestedId?: string): Promise<RuntimeSessionRecord | ApiResult | null> {
    if (requestedId) {
      const session = unwrap(await runtimeRepository.getRuntimeSessionById(requestedId), requestIdOf(input), 'Runtime session');
      if (isApiResult(session)) return session;
      return session && session.campaignId === access.campaign.campaignId && session.roomId === idParam(input, 'roomId') ? session : null;
    }
    const sessions = unwrap(await runtimeRepository.listRuntimeSessionsByCampaign(access.campaign.campaignId, { limit: 100 }), requestIdOf(input), 'Runtime session');
    if (isApiResult(sessions)) return sessions;
    return sessions.find((session) => session.roomId === idParam(input, 'roomId')) ?? null;
  }

  function eventVisible(event: RuntimeEventRecord, access: AuthorizedCampaign): boolean {
    if (event.visibility !== 'private') return true;
    if (event.createdByUserId === access.viewer.viewerUserId) return true;
    return access.viewer.viewerUserId === access.server.ownerId || access.membership?.roleKey === 'admin';
  }

  const handlers: CampaignRoomApiHandlers = {
    async listCampaigns(input) {
      const access = await authorizeWorld(input, 'view');
      if (isApiResult(access)) return access;
      const bindings = unwrap(await worldRepository.listCampaignBindingsByWorldServer(access.server.worldServerId, { includeArchived: Boolean(input.query?.includeArchived), limit: numberOf(input.query?.limit) }), requestIdOf(input), 'Campaign');
      if (isApiResult(bindings)) return bindings;
      const result: Array<{ campaign: PostgresCampaignRecord; binding: WorldServerCampaignBindingRecord }> = [];
      for (const binding of bindings) {
        if (binding.archivedAt) continue;
        const campaign = unwrap(await campaignRepository.getCampaignById(binding.campaignId), requestIdOf(input), 'Campaign');
        if (isApiResult(campaign)) return campaign;
        if (!campaign) continue;
        if (campaign.lifecycleStatus === 'trashed' && input.query?.includeTrashed !== true && input.query?.includeTrashed !== 'true') continue;
        if (campaign.lifecycleStatus === 'archived' && input.query?.includeArchived !== true && input.query?.includeArchived !== 'true') continue;
        result.push({ campaign, binding });
      }
      return okResponse(result, { requestId: requestIdOf(input) });
    },

    async getCampaign(input) {
      const access = await authorizeCampaign(input, 'view');
      return isApiResult(access) ? access : okResponse({ campaign: access.campaign, binding: access.binding }, { requestId: requestIdOf(input) });
    },

    async createCampaign(input) {
      const access = await authorizeWorld(input, 'createCampaign', false);
      if (isApiResult(access)) return access;
      const body = bodyOf(input);
      const title = stringOf(body.title);
      const systemId = stringOf(body.systemId);
      if (!title) return requiredString('title', requestIdOf(input));
      if (!systemId) return requiredString('systemId', requestIdOf(input));
      const campaign = unwrap(await campaignRepository.createCampaign({
        campaignId: randomUUID(),
        ownerId: access.viewer.viewerUserId!,
        title,
        description: stringOf(body.description),
        systemId,
        status: body.status === 'active' ? 'active' : 'draft',
        payload: recordOf(body.payload),
      }), requestIdOf(input), 'Campaign');
      if (isApiResult(campaign)) return campaign;
      const binding = unwrap(await worldRepository.bindCampaignToWorldServer({
        bindingId: randomUUID(),
        worldServerId: access.server.worldServerId,
        campaignId: campaign.campaignId,
        createdByUserId: access.viewer.viewerUserId!,
        bindingKind: stringOf(body.bindingKind) ?? 'owned',
        visibilityScope: stringOf(body.visibilityScope) ?? 'server',
        payload: recordOf(body.bindingPayload),
      }), requestIdOf(input), 'Campaign');
      return isApiResult(binding) ? binding : okResponse({ campaign, binding }, { statusCode: 201, requestId: requestIdOf(input) });
    },

    async updateCampaign(input) {
      const access = await authorizeCampaign(input, 'edit');
      if (isApiResult(access)) return access;
      const body = bodyOf(input);
      const update: UpdateCampaignInput = {
        campaignId: access.campaign.campaignId,
        title: stringOf(body.title),
        description: typeof body.description === 'string' ? body.description : undefined,
        status: body.status === 'active' ? 'active' : body.status === 'draft' ? 'draft' : undefined,
        payload: recordOf(body.payload),
      };
      if (!update.title && update.description === undefined && !update.status && !update.payload) return errorResponse(400, { kind: 'validation', message: 'Campaign update is empty.' }, { requestId: requestIdOf(input) });
      const campaign = unwrap(await campaignRepository.updateCampaign(update), requestIdOf(input), 'Campaign');
      return isApiResult(campaign) ? campaign : campaign ? okResponse({ campaign, binding: access.binding }, { requestId: requestIdOf(input) }) : errorResponse(404, { kind: 'not_found', message: 'Campaign not found.' }, { requestId: requestIdOf(input) });
    },

    async archiveCampaign(input) {
      const access = await authorizeCampaign(input, 'edit');
      if (isApiResult(access)) return access;
      const campaign = unwrap(await campaignRepository.archiveCampaign(access.campaign.campaignId), requestIdOf(input), 'Campaign');
      return isApiResult(campaign) ? campaign : okResponse({ campaign, binding: access.binding }, { requestId: requestIdOf(input) });
    },

    async restoreCampaign(input) {
      const access = await authorizeCampaign(input, 'edit');
      if (isApiResult(access)) return access;
      const campaign = unwrap(await campaignRepository.restoreCampaign(access.campaign.campaignId), requestIdOf(input), 'Campaign');
      return isApiResult(campaign) ? campaign : okResponse({ campaign, binding: access.binding }, { requestId: requestIdOf(input) });
    },

    async listCampaignActors(input) {
      const access = await authorizeCampaign(input, 'view');
      if (isApiResult(access)) return access;
      const actors = unwrap(await foundationRepository.listCampaignActorInstances(access.campaign.campaignId, numberOf(input.query?.limit)), requestIdOf(input), 'Campaign actor');
      return isApiResult(actors) ? actors : okResponse(actors, { requestId: requestIdOf(input) });
    },

    async getCampaignActor(input) {
      const access = await authorizeCampaign(input, 'view');
      if (isApiResult(access)) return access;
      const actorId = idParam(input, 'actorInstanceId');
      if (!actorId) return requiredString('actorInstanceId', requestIdOf(input));
      const actor = unwrap(await foundationRepository.getCampaignActorInstanceById(actorId), requestIdOf(input), 'Campaign actor');
      if (isApiResult(actor)) return actor;
      if (!actor || actor.campaignId !== access.campaign.campaignId) return errorResponse(404, { kind: 'not_found', message: 'Campaign actor not found.' }, { requestId: requestIdOf(input) });
      return okResponse(actor, { requestId: requestIdOf(input) });
    },

    async createCampaignActor(input) {
      const access = await authorizeCampaign(input, 'edit');
      if (isApiResult(access)) return access;
      const body = bodyOf(input);
      const displayName = stringOf(body.displayName);
      if (!displayName) return requiredString('displayName', requestIdOf(input));
      const actor = unwrap(await foundationRepository.createCampaignActorInstance({
        campaignActorInstanceId: randomUUID(),
        campaignId: access.campaign.campaignId,
        sourceActorId: stringOf(body.sourceActorId),
        ownerId: access.viewer.viewerUserId!,
        actorKind: stringOf(body.actorKind) ?? 'pc',
        displayName,
        instanceStatus: stringOf(body.instanceStatus) ?? 'active',
        snapshotHash: stringOf(body.snapshotHash),
        snapshotPayload: recordOf(body.snapshotPayload),
        overridePayload: recordOf(body.overridePayload),
      }), requestIdOf(input), 'Campaign actor');
      return isApiResult(actor) ? actor : okResponse(actor, { statusCode: 201, requestId: requestIdOf(input) });
    },

    async updateCampaignActor(input) {
      const access = await authorizeCampaign(input, 'edit');
      if (isApiResult(access)) return access;
      const actorId = idParam(input, 'actorInstanceId');
      if (!actorId) return requiredString('actorInstanceId', requestIdOf(input));
      const actor = unwrap(await foundationRepository.getCampaignActorInstanceById(actorId), requestIdOf(input), 'Campaign actor');
      if (isApiResult(actor)) return actor;
      if (!actor || actor.campaignId !== access.campaign.campaignId) {
        return errorResponse(404, { kind: 'not_found', message: 'Campaign actor not found.' }, { requestId: requestIdOf(input) });
      }
      const body = bodyOf(input);
      const overridePayload = recordOf(body.overridePayload);
      if (body.overridePayload !== undefined && !overridePayload) {
        return errorResponse(400, { kind: 'validation', message: 'overridePayload must be an object.' }, { requestId: requestIdOf(input) });
      }
      const displayName = stringOf(body.displayName);
      const instanceStatus = stringOf(body.instanceStatus);
      if (displayName === undefined && instanceStatus === undefined && overridePayload === undefined) {
        return errorResponse(400, { kind: 'validation', message: 'Campaign actor update is empty.' }, { requestId: requestIdOf(input) });
      }
      const updated = unwrap(await foundationRepository.updateCampaignActorInstance({
        campaignActorInstanceId: actorId,
        displayName,
        instanceStatus,
        overridePayload,
      }), requestIdOf(input), 'Campaign actor');
      return isApiResult(updated)
        ? updated
        : updated
          ? okResponse(updated, { requestId: requestIdOf(input) })
          : errorResponse(404, { kind: 'not_found', message: 'Campaign actor not found.' }, { requestId: requestIdOf(input) });
    },

    async archiveCampaignActor(input) {
      const access = await authorizeCampaign(input, 'edit');
      if (isApiResult(access)) return access;
      const actorId = idParam(input, 'actorInstanceId');
      if (!actorId) return requiredString('actorInstanceId', requestIdOf(input));
      const actor = unwrap(await foundationRepository.getCampaignActorInstanceById(actorId), requestIdOf(input), 'Campaign actor');
      if (isApiResult(actor)) return actor;
      if (!actor || actor.campaignId !== access.campaign.campaignId) return errorResponse(404, { kind: 'not_found', message: 'Campaign actor not found.' }, { requestId: requestIdOf(input) });
      const archived = unwrap(await foundationRepository.archiveCampaignActorInstance(actorId), requestIdOf(input), 'Campaign actor');
      return isApiResult(archived) ? archived : okResponse(archived, { requestId: requestIdOf(input) });
    },

    /**
     * T11b review. Requires campaign EDIT rights: this is a host action, and a
     * player must not be able to inspect another player's derived character
     * values through it.
     *
     * The response carries derived, combat-relevant values and a field diff
     * only — never the Vault payload the server read to produce them.
     */
    async reviewCampaignActorSource(input) {
      const access = await authorizeCampaign(input, 'edit');
      if (isApiResult(access)) return access;
      const actorId = idParam(input, 'actorInstanceId');
      if (!actorId) return requiredString('actorInstanceId', requestIdOf(input));
      const actor = unwrap(await foundationRepository.getCampaignActorInstanceById(actorId), requestIdOf(input), 'Campaign actor');
      if (isApiResult(actor)) return actor;
      if (!actor || actor.campaignId !== access.campaign.campaignId) {
        return errorResponse(404, { kind: 'not_found', message: 'Campaign actor not found.' }, { requestId: requestIdOf(input) });
      }
      if (!actorVaultRepository) {
        return errorResponse(503, { kind: 'unavailable', message: 'Character source review is not available on this server.', retryable: true }, { requestId: requestIdOf(input) });
      }
      const result = await reviewCampaignActorSourceUpdate({ actor, vaultRepository: actorVaultRepository });
      if (result.decision === 'notLinkedToSource' || result.decision === 'unsupportedSystem') {
        return errorResponse(400, { kind: 'validation', message: result.message ?? 'Source review is unavailable for this actor.', reason: result.decision }, { requestId: requestIdOf(input) });
      }
      if (result.decision === 'sourceUnavailable') {
        return errorResponse(404, { kind: 'not_found', message: result.message ?? 'The linked character is no longer available.', reason: result.decision }, { requestId: requestIdOf(input) });
      }
      if (result.decision !== 'reviewed') {
        return errorResponse(503, { kind: 'unavailable', message: result.message ?? 'The character source could not be read.', retryable: true, reason: result.decision }, { requestId: requestIdOf(input) });
      }
      return okResponse({
        campaignActorInstanceId: result.campaignActorInstanceId,
        status: result.status,
        sourceChangedSinceApproval: result.sourceChangedSinceApproval,
        review: result.review,
        acceptedSourceHash: result.acceptedSourceHash,
        currentSourceHash: result.currentSourceHash,
      }, { requestId: requestIdOf(input) });
    },

    /**
     * T11b acceptance. The body carries ONE field, `expectedSourceHash`, and it
     * is used only as an equality guard against the server's own re-derivation.
     * A client-supplied payload, hash-as-data or derived sheet is never stored.
     */
    async acceptCampaignActorSource(input) {
      const access = await authorizeCampaign(input, 'edit');
      if (isApiResult(access)) return access;
      const actorId = idParam(input, 'actorInstanceId');
      if (!actorId) return requiredString('actorInstanceId', requestIdOf(input));
      const actor = unwrap(await foundationRepository.getCampaignActorInstanceById(actorId), requestIdOf(input), 'Campaign actor');
      if (isApiResult(actor)) return actor;
      if (!actor || actor.campaignId !== access.campaign.campaignId) {
        return errorResponse(404, { kind: 'not_found', message: 'Campaign actor not found.' }, { requestId: requestIdOf(input) });
      }
      if (!actorVaultRepository) {
        return errorResponse(503, { kind: 'unavailable', message: 'Character source acceptance is not available on this server.', retryable: true }, { requestId: requestIdOf(input) });
      }
      const body = bodyOf(input);
      const expectedSourceHash = stringOf(body.expectedSourceHash);
      if (!expectedSourceHash) return requiredString('expectedSourceHash', requestIdOf(input));

      const result = await acceptCampaignActorSourceUpdate({
        actor,
        vaultRepository: actorVaultRepository,
        acceptanceRepository: foundationRepository,
        expectedSourceHash,
        acceptedByUserId: access.viewer?.viewerUserId ?? undefined,
      });
      if (result.decision === 'notLinkedToSource' || result.decision === 'unsupportedSystem' || result.decision === 'sourceUnreadable') {
        return errorResponse(400, { kind: 'validation', message: result.message ?? 'Source acceptance is unavailable for this actor.', reason: result.decision }, { requestId: requestIdOf(input) });
      }
      if (result.decision === 'sourceUnavailable') {
        return errorResponse(404, { kind: 'not_found', message: result.message ?? 'The linked character is no longer available.', reason: result.decision }, { requestId: requestIdOf(input) });
      }
      if (result.decision === 'reviewVersionMismatch') {
        return errorResponse(409, { kind: 'conflict', message: result.message ?? 'The character changed again since it was reviewed.', reason: result.decision }, { requestId: requestIdOf(input) });
      }
      if (result.decision !== 'accepted' || !result.actor) {
        return errorResponse(503, { kind: 'unavailable', message: result.message ?? 'The accepted source could not be stored.', retryable: true, reason: result.decision }, { requestId: requestIdOf(input) });
      }
      return okResponse({
        campaignActorInstanceId: result.campaignActorInstanceId,
        acceptedSourceHash: result.acceptedSourceHash,
        previousSourceHash: result.previousSourceHash,
        updatedAt: result.actor.updatedAt,
      }, { requestId: requestIdOf(input) });
    },

    async listRooms(input) {
      const access = await authorizeCampaign(input, 'view');
      if (isApiResult(access)) return access;
      const rooms = unwrap(await foundationRepository.listRoomRecordsByCampaign(access.campaign.campaignId, numberOf(input.query?.limit)), requestIdOf(input), 'Room');
      if (isApiResult(rooms)) return rooms;
      return okResponse(rooms.filter((room) => room.worldServerId === access.server.worldServerId).map(publicRoomRecord), { requestId: requestIdOf(input) });
    },

    async getRoom(input) {
      const room = await authorizeRoom(input);
      return isApiResult(room) ? room : okResponse(publicRoomRecord(room.room), { requestId: requestIdOf(input) });
    },

    async createRoom(input) {
      const campaign = await authorizeCampaign(input, 'view');
      if (isApiResult(campaign)) return campaign;
      const joinAccess = await authorizeWorld(input, 'joinRoom', false);
      if (isApiResult(joinAccess)) return joinAccess;
      const body = bodyOf(input);
      const roomId = stringOf(body.roomId) ?? randomUUID();
      const room = unwrap(await foundationRepository.createRoomRecord({
        roomRecordId: randomUUID(),
        roomId,
        worldServerId: campaign.server.worldServerId,
        campaignId: campaign.campaign.campaignId,
        hostUserId: joinAccess.viewer.viewerUserId!,
        roomCode: stringOf(body.roomCode),
        roomStatus: stringOf(body.roomStatus) ?? 'lobby',
        multiplayerMode: stringOf(body.multiplayerMode) ?? 'lan',
        accessPolicy: recordOf(body.accessPolicy),
        metadata: recordOf(body.metadata),
      }), requestIdOf(input), 'Room');
      return isApiResult(room) ? room : okResponse(room ? publicRoomRecord(room) : room, { statusCode: 201, requestId: requestIdOf(input) });
    },

    async updateRoom(input) {
      const room = await authorizeRoomManagement(input);
      if (isApiResult(room)) return room;
      const body = bodyOf(input);
      const update: UpdateRoomRecordInput = {
        roomRecordId: room.room.roomRecordId,
        roomCode: stringOf(body.roomCode),
        roomStatus: stringOf(body.roomStatus),
        multiplayerMode: stringOf(body.multiplayerMode),
        accessPolicy: recordOf(body.accessPolicy),
        metadata: recordOf(body.metadata),
        closedAt: stringOf(body.closedAt),
      };
      if (!update.roomCode && !update.roomStatus && !update.multiplayerMode && !update.accessPolicy && !update.metadata && !update.closedAt) return errorResponse(400, { kind: 'validation', message: 'Room update is empty.' }, { requestId: requestIdOf(input) });
      const updated = unwrap(await foundationRepository.updateRoomRecord(update), requestIdOf(input), 'Room');
      return isApiResult(updated) ? updated : okResponse(updated ? publicRoomRecord(updated) : updated, { requestId: requestIdOf(input) });
    },

    async listParticipants(input) {
      const room = await authorizeRoom(input);
      if (isApiResult(room)) return room;
      const participants = unwrap(await campaignRoomRepository.listRoomParticipants(room.room.roomRecordId, numberOf(input.query?.limit)), requestIdOf(input), 'Room participant');
      return isApiResult(participants) ? participants : okResponse(participants, { requestId: requestIdOf(input) });
    },

    async listLobbySlots(input) {
      const room = await authorizeRoom(input);
      if (isApiResult(room)) return room;
      const slots = unwrap(await campaignRoomRepository.listRoomLobbySlots(room.room.roomRecordId, numberOf(input.query?.limit)), requestIdOf(input), 'Lobby slot');
      return isApiResult(slots) ? slots : okResponse(slots, { requestId: requestIdOf(input) });
    },

    async getRuntimeSession(input) {
      const room = await authorizeRoom(input);
      if (isApiResult(room)) return room;
      const session = await sessionForRoom(input, room.access, stringOf(input.query?.runtimeSessionId));
      if (isApiResult(session)) return session;
      if (!session) return errorResponse(404, { kind: 'not_found', message: 'Runtime session not found.' }, { requestId: requestIdOf(input) });
      const binding = unwrap(await campaignRoomRepository.getRuntimeSessionBindingBySessionId(session.runtimeSessionId), requestIdOf(input), 'Runtime session');
      return isApiResult(binding) ? binding : okResponse({ session, binding }, { requestId: requestIdOf(input) });
    },

    async createRuntimeSession(input) {
      const room = await authorizeRoomManagement(input);
      if (isApiResult(room)) return room;
      // runtime_sessions.room_id is not unique, so a second session could be
      // created for a room that a live room is already running. That session
      // would then win the `updated_at DESC` lookup and silently become the
      // campaign workspace's target. Refuse while the room is live.
      const liveCreateConflict = liveRoomConflict(room.room.roomId, undefined, requestIdOf(input));
      if (liveCreateConflict) return liveCreateConflict;
      const body = bodyOf(input);
      const session = unwrap(await runtimeRepository.createRuntimeSession({
        runtimeSessionId: stringOf(body.runtimeSessionId) ?? randomUUID(),
        campaignId: room.access.campaign.campaignId,
        hostUserId: room.access.viewer.viewerUserId!,
        roomId: room.room.roomId,
        title: stringOf(body.title),
        status: stringOf(body.status) ?? 'active',
        payload: recordOf(body.payload),
      }), requestIdOf(input), 'Runtime session');
      if (isApiResult(session)) return session;
      const binding = unwrap(await campaignRoomRepository.createRuntimeSessionBinding({
        runtimeSessionBindingId: randomUUID(),
        runtimeSessionId: session.runtimeSessionId,
        roomRecordId: room.room.roomRecordId,
        campaignId: room.access.campaign.campaignId,
        metadata: recordOf(body.bindingMetadata),
      }), requestIdOf(input), 'Runtime session');
      return isApiResult(binding) ? binding : okResponse({ session, binding }, { statusCode: 201, requestId: requestIdOf(input) });
    },

    async updateRuntimeSession(input) {
      const room = await authorizeRoomManagement(input);
      if (isApiResult(room)) return room;
      const session = await sessionForRoom(input, room.access, stringOf(input.query?.runtimeSessionId) ?? stringOf(bodyOf(input).runtimeSessionId));
      if (isApiResult(session)) return session;
      if (!session) return errorResponse(404, { kind: 'not_found', message: 'Runtime session not found.' }, { requestId: requestIdOf(input) });
      const liveUpdateConflict = liveRoomConflict(room.room.roomId, session.runtimeSessionId, requestIdOf(input));
      if (liveUpdateConflict) return liveUpdateConflict;
      const body = bodyOf(input);
      const updated = unwrap(await runtimeRepository.updateRuntimeSession({
        runtimeSessionId: session.runtimeSessionId,
        title: stringOf(body.title),
        status: stringOf(body.status),
        payload: recordOf(body.payload),
        endedAt: stringOf(body.endedAt),
      }), requestIdOf(input), 'Runtime session');
      if (isApiResult(updated)) return updated;
      const binding = unwrap(await campaignRoomRepository.getRuntimeSessionBindingBySessionId(session.runtimeSessionId), requestIdOf(input), 'Runtime session');
      return isApiResult(binding) ? binding : okResponse({ session: updated, binding }, { requestId: requestIdOf(input) });
    },

    async listRuntimeEvents(input) {
      const room = await authorizeRoom(input);
      if (isApiResult(room)) return room;
      const session = await sessionForRoom(input, room.access, stringOf(input.query?.runtimeSessionId));
      if (isApiResult(session)) return session;
      if (!session) return errorResponse(404, { kind: 'not_found', message: 'Runtime session not found.' }, { requestId: requestIdOf(input) });
      const afterSeq = numberOf(input.query?.afterSeq);
      const requestedLimit = numberOf(input.query?.limit);
      const events = unwrap(await runtimeRepository.listRuntimeEvents(session.runtimeSessionId, {
        afterSeq: afterSeq !== undefined && afterSeq >= 0 ? afterSeq : undefined,
        limit: requestedLimit !== undefined ? Math.min(Math.max(Math.floor(requestedLimit), 1), 500) : 100,
      }), requestIdOf(input), 'Runtime event');
      if (isApiResult(events)) return events;
      return okResponse(events.filter((event) => eventVisible(event, room.access)), { requestId: requestIdOf(input) });
    },

    async listSceneStates(input) {
      const room = await authorizeRoom(input);
      if (isApiResult(room)) return room;
      const states = unwrap(await sceneStateRepository.listSceneStates(room.access.server.worldServerId, room.access.campaign.campaignId, room.room.roomId, input.query?.includeArchived === true || input.query?.includeArchived === 'true'), requestIdOf(input), 'Scene state');
      return isApiResult(states) ? states : okResponse(states, { requestId: requestIdOf(input) });
    },

    async getSceneState(input) {
      const room = await authorizeRoom(input);
      if (isApiResult(room)) return room;
      const sceneStateId = idParam(input, 'sceneStateId');
      if (!sceneStateId) return requiredString('sceneStateId', requestIdOf(input));
      const state = unwrap(await sceneStateRepository.getSceneState(sceneStateId), requestIdOf(input), 'Scene state');
      if (isApiResult(state)) return state;
      if (!state || state.archivedAt || state.worldServerId !== room.access.server.worldServerId || state.campaignId !== room.access.campaign.campaignId || state.roomId !== room.room.roomId) return errorResponse(404, { kind: 'not_found', message: 'Scene state not found.' }, { requestId: requestIdOf(input) });
      return okResponse(state, { requestId: requestIdOf(input) });
    },

    async createSceneState(input) {
      const room = await authorizeRoomManagement(input);
      if (isApiResult(room)) return room;
      const body = bodyOf(input);
      const title = stringOf(body.title);
      const stateJson = safeSceneState(body.stateJson);
      if (!title) return requiredString('title', requestIdOf(input));
      if (!stateJson) return errorResponse(400, { kind: 'validation', message: 'Scene state snapshot is invalid.' }, { requestId: requestIdOf(input) });
      if ((stringOf(stateJson.roomId) && stateJson.roomId !== room.room.roomId) || (stringOf(stateJson.campaignId) && stateJson.campaignId !== room.access.campaign.campaignId)) return errorResponse(400, { kind: 'bad_request', message: 'Scene state context does not match this room.' }, { requestId: requestIdOf(input) });
      const sessionId = stringOf(body.runtimeSessionId) ?? stringOf(stateJson.runtimeSessionId);
      if (sessionId) { const session = await sessionForRoom(input, room.access, sessionId); if (isApiResult(session)) return session; if (!session) return errorResponse(400, { kind: 'bad_request', message: 'Runtime session does not match this room.' }, { requestId: requestIdOf(input) }); }
      const state = unwrap(await sceneStateRepository.createSceneState({ sceneStateId: randomUUID(), worldServerId: room.access.server.worldServerId, campaignId: room.access.campaign.campaignId, roomId: room.room.roomId, runtimeSessionId: sessionId ?? undefined, title, description: stringOf(body.description) ?? undefined, schemaVersion: 1, stateJson, createdByUserId: room.access.viewer.viewerUserId ?? undefined }), requestIdOf(input), 'Scene state');
      return isApiResult(state) ? state : okResponse(state, { statusCode: 201, requestId: requestIdOf(input) });
    },

    async updateSceneState(input) {
      const room = await authorizeRoomManagement(input);
      if (isApiResult(room)) return room;
      const sceneStateId = idParam(input, 'sceneStateId');
      if (!sceneStateId) return requiredString('sceneStateId', requestIdOf(input));
      const existing = unwrap(await sceneStateRepository.getSceneState(sceneStateId), requestIdOf(input), 'Scene state');
      if (isApiResult(existing)) return existing;
      if (!existing || existing.archivedAt || existing.worldServerId !== room.access.server.worldServerId || existing.campaignId !== room.access.campaign.campaignId || existing.roomId !== room.room.roomId) return errorResponse(404, { kind: 'not_found', message: 'Scene state not found.' }, { requestId: requestIdOf(input) });
      const body = bodyOf(input);
      const description = Object.prototype.hasOwnProperty.call(body, 'description') ? stringOf(body.description) : undefined;
      const updated = unwrap(await sceneStateRepository.updateSceneStateMetadata({ sceneStateId, title: stringOf(body.title), description }), requestIdOf(input), 'Scene state');
      return isApiResult(updated) ? updated : updated ? okResponse(updated, { requestId: requestIdOf(input) }) : errorResponse(404, { kind: 'not_found', message: 'Scene state not found.' }, { requestId: requestIdOf(input) });
    },

    async archiveSceneState(input) {
      const room = await authorizeRoomManagement(input);
      if (isApiResult(room)) return room;
      const sceneStateId = idParam(input, 'sceneStateId');
      if (!sceneStateId) return requiredString('sceneStateId', requestIdOf(input));
      const existing = unwrap(await sceneStateRepository.getSceneState(sceneStateId), requestIdOf(input), 'Scene state');
      if (isApiResult(existing)) return existing;
      if (!existing || existing.worldServerId !== room.access.server.worldServerId || existing.campaignId !== room.access.campaign.campaignId || existing.roomId !== room.room.roomId) return errorResponse(404, { kind: 'not_found', message: 'Scene state not found.' }, { requestId: requestIdOf(input) });
      const archived = unwrap(await sceneStateRepository.archiveSceneState(sceneStateId), requestIdOf(input), 'Scene state');
      return isApiResult(archived) ? archived : archived ? okResponse(archived, { requestId: requestIdOf(input) }) : errorResponse(404, { kind: 'not_found', message: 'Scene state not found.' }, { requestId: requestIdOf(input) });
    },

    async duplicateSceneState(input) {
      const room = await authorizeRoomManagement(input);
      if (isApiResult(room)) return room;
      const sceneStateId = idParam(input, 'sceneStateId');
      if (!sceneStateId) return requiredString('sceneStateId', requestIdOf(input));
      const existing = unwrap(await sceneStateRepository.getSceneState(sceneStateId), requestIdOf(input), 'Scene state');
      if (isApiResult(existing)) return existing;
      if (!existing || existing.archivedAt || existing.worldServerId !== room.access.server.worldServerId || existing.campaignId !== room.access.campaign.campaignId || existing.roomId !== room.room.roomId) return errorResponse(404, { kind: 'not_found', message: 'Scene state not found.' }, { requestId: requestIdOf(input) });
      const copy = unwrap(await sceneStateRepository.duplicateSceneState({ sceneStateId: randomUUID(), sourceSceneStateId: sceneStateId, title: stringOf(bodyOf(input).title) ?? undefined, createdByUserId: room.access.viewer.viewerUserId ?? undefined }), requestIdOf(input), 'Scene state');
      return isApiResult(copy) ? copy : okResponse(copy, { statusCode: 201, requestId: requestIdOf(input) });
    },

    async appendRuntimeEvent(input) {
      const room = await authorizeRoom(input);
      if (isApiResult(room)) return room;
      const joinAccess = await authorizeWorld(input, 'joinRoom', false);
      if (isApiResult(joinAccess)) return joinAccess;
      const body = bodyOf(input);
      const sessionId = stringOf(body.runtimeSessionId) ?? stringOf(input.query?.runtimeSessionId);
      const eventKind = stringOf(body.eventKind);
      if (!sessionId) return requiredString('runtimeSessionId', requestIdOf(input));
      if (!eventKind) return requiredString('eventKind', requestIdOf(input));
      // Namespace check first: it is independent of liveness and must hold for
      // preparation sessions too.
      const reserved = reservedEventKind(eventKind, requestIdOf(input));
      if (reserved) return reserved;
      const session = await sessionForRoom(input, room.access, sessionId);
      if (isApiResult(session)) return session;
      if (!session) return errorResponse(404, { kind: 'not_found', message: 'Runtime session not found.' }, { requestId: requestIdOf(input) });
      const liveAppendConflict = liveRoomConflict(room.room.roomId, session.runtimeSessionId, requestIdOf(input));
      if (liveAppendConflict) return liveAppendConflict;
      let eventPayload = recordOf(body.payload) ?? {};
      if (eventKind.startsWith('map.')) {
        const manager = await authorizeRoomManagement(input);
        if (isApiResult(manager)) return manager;
      }
      if (eventKind === 'map.token_added' && room.access.campaign.systemId === 'dnd5e-2024') {
        const history: RuntimeEventRecord[] = [];
        let afterSeq = 0;
        for (;;) {
          const page = unwrap(await runtimeRepository.listRuntimeEvents(session.runtimeSessionId, { afterSeq, limit: 500 }), requestIdOf(input), 'Runtime event');
          if (isApiResult(page)) return page;
          history.push(...page);
          if (page.length < 500) break;
          const next = page[page.length - 1].seq;
          if (next <= afterSeq) return errorResponse(503, { kind: 'unavailable', message: 'Map history is unavailable.' });
          afterSeq = next;
        }
        try {
          eventPayload = await materializeDndActorToken({
            systemId: room.access.campaign.systemId, campaignId: room.access.campaign.campaignId,
            payload: eventPayload, repository: foundationRepository,
            board: replayMapRuntimeEvents(history.filter(event => event.eventKind.startsWith('map.')), session.runtimeSessionId),
          });
        } catch { return errorResponse(503, { kind: 'unavailable', message: 'Actor size is unavailable.' }); }
      }
      const contextResult = resolveRuntimeSessionContext({
        worldServerId: room.access.server.worldServerId,
        campaignId: room.access.campaign.campaignId,
        roomId: room.room.roomId,
        runtimeSessionId: session.runtimeSessionId,
      });
      if (contextResult.ok === false) {
        return errorResponse(400, { kind: 'bad_request', message: 'Runtime event context is incomplete.' }, { requestId: requestIdOf(input) });
      }
      const bridgeResult = await persistRuntimeEventCandidate({
        worldServerId: contextResult.context.worldServerId,
        campaignId: contextResult.context.campaignId,
        roomId: contextResult.context.roomId,
        runtimeSessionId: contextResult.context.runtimeSessionId,
        source: 'runtime_api',
        eventKind,
        eventPayload,
        actorId: stringOf(body.actorId),
        causedByEventId: stringOf(body.causedByEventId),
        actorUserId: joinAccess.viewer.viewerUserId,
        idempotencyKey: stringOf(body.idempotencyKey),
        clientEventId: stringOf(body.runtimeEventId),
        occurredAt: stringOf(body.occurredAt),
        visibilityScope: runtimeVisibilityOf(body.visibility) ?? 'private',
      }, {
        enabled: options.runtimeEventPersistenceBridgeEnabled,
        repository: runtimeEventPersistenceRepository,
      });
      if (bridgeResult.status !== 'persisted') {
        if (bridgeResult.status === 'missing_context') {
          return errorResponse(400, { kind: 'bad_request', message: 'Runtime event context is incomplete.' }, { requestId: requestIdOf(input) });
        }
        return errorResponse(503, { kind: 'unavailable', message: 'Runtime event persistence is unavailable.' }, { requestId: requestIdOf(input) });
      }
      const persistedRecord = bridgeResult.persistedEvent?.record;
      return okResponse(
        persistedRecord && typeof persistedRecord === 'object'
          ? persistedRecord
          : { runtimeEventId: bridgeResult.persistedEvent?.runtimeEventId, seq: bridgeResult.persistedEvent?.seq },
        { statusCode: 201, requestId: requestIdOf(input) },
      );
    },
  };

  return handlers;
}

// Not mounted by any server composition; kept as a convenience export. It has no
// room registry, so it declares the opt-out explicitly rather than silently
// losing the live-room authority guard.
export const defaultPostgresCampaignRoomApiHandlers = createCampaignRoomApiHandlers({
  liveRoomRuntimeSessionId: NO_LIVE_ROOM_REGISTRY,
});

export type {
  CampaignActorInstanceRecord,
  PostgresCampaignRepositoryResult,
  PostgresCampaignRoomRepositoryResult,
  PostgresPlatformFoundationRepositoryResult,
  PostgresRuntimeEventRepositoryResult,
  SceneStateDocumentRecord,
};
