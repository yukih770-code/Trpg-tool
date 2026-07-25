import { randomUUID } from 'node:crypto';

import {
  createPostgresPlatformFoundationRepository,
  publishPrivateCompendiumPack,
  type CompendiumPackRecord,
  type PublishPrivateCompendiumPackInput,
} from '../adapters/postgresPlatformFoundationRepository.js';
import { createPostgresWorldServerRepository, type PostgresWorldServerRepository, type WorldServerMembershipRecord, type WorldServerRecord } from '../adapters/postgresWorldServerRepository.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveApiAuthSession, type ApiRequestLike } from '../auth/requestAuthSession.js';
import { resolveApiPermissionGuard } from './apiPermissionGuard.js';
import { resolveApiRequestScope } from './apiRequestContext.js';
import { errorResponse, okResponse, type ServerApiResponse } from './apiResponse.js';

type ApiResult = ServerApiResponse<unknown>;
type Body = Record<string, unknown>;
type CompendiumRepository = Pick<ReturnType<typeof createPostgresPlatformFoundationRepository>, 'listCompendiumPacksByWorldServer'>;
type WorldRepository = Pick<PostgresWorldServerRepository, 'getWorldServerById' | 'getWorldServerMembershipByUser'>;

export type PrivateCompendiumPackApiRequest = {
  requestId?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  viewer?: CurrentViewerContext;
};

export type PrivateCompendiumPackApiHandlers = {
  listPacks(input: PrivateCompendiumPackApiRequest): Promise<ApiResult>;
  publishPack(input: PrivateCompendiumPackApiRequest): Promise<ApiResult>;
};

export type CreatePrivateCompendiumPackApiHandlersOptions = {
  compendiumRepository?: CompendiumRepository;
  worldRepository?: WorldRepository;
  publish?: (input: PublishPrivateCompendiumPackInput) => ReturnType<typeof publishPrivateCompendiumPack>;
  allowDevAuthHeaders?: boolean;
  nodeEnv?: string;
};

const ENTRY_KINDS = new Set(['species', 'speciesOption', 'class', 'subclass', 'background', 'feat', 'spell', 'item', 'monster', 'rule', 'other']);
const text = (value: unknown, max = 240) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
const record = (value: unknown): Body => value && typeof value === 'object' && !Array.isArray(value) ? value as Body : {};
const id = (input: PrivateCompendiumPackApiRequest, key: string) => text(input.params?.[key], 160);
const responseIs = (value: unknown): value is ApiResult => typeof value === 'object' && value !== null && 'statusCode' in value && 'ok' in value;
const roleKind = (key: string): 'owner' | 'admin' | 'moderator' | 'member' | 'guest' | 'custom' => key === 'owner' ? 'owner' : key === 'admin' || key === 'administrator' ? 'admin' : key === 'moderator' ? 'moderator' : key === 'member' ? 'member' : key === 'guest' ? 'guest' : 'custom';

function jsonRecord(value: unknown, maxBytes = 48_000): Body | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  try {
    const serialized = JSON.stringify(value);
    return serialized.length <= maxBytes ? value as Body : undefined;
  } catch {
    return undefined;
  }
}

function repositoryFailure(error: { kind: string; retryable?: boolean }, requestId?: string): ApiResult {
  if (error.kind === 'conflict') return errorResponse(409, { kind: 'conflict', message: 'A content pack with this identifier already exists.' }, { requestId });
  return errorResponse(503, { kind: 'unavailable', message: 'Private content pack service is unavailable.', retryable: error.retryable }, { requestId });
}

function viewerFor(input: PrivateCompendiumPackApiRequest, options: CreatePrivateCompendiumPackApiHandlersOptions): CurrentViewerContext {
  return input.viewer ?? createCurrentViewerContextFromAuthSession(resolveApiAuthSession({ headers: input.headers } as ApiRequestLike, {
    allowDevAuthHeaders: options.allowDevAuthHeaders === true,
    nodeEnv: options.nodeEnv ?? 'production',
  }));
}

export function createPrivateCompendiumPackApiHandlers(
  options: CreatePrivateCompendiumPackApiHandlersOptions = {},
): PrivateCompendiumPackApiHandlers {
  const compendium = options.compendiumRepository ?? createPostgresPlatformFoundationRepository();
  const worlds = options.worldRepository ?? createPostgresWorldServerRepository();
  const publish = options.publish ?? publishPrivateCompendiumPack;

  async function authorize(input: PrivateCompendiumPackApiRequest, action: 'view' | 'manageServerSettings'): Promise<{ viewer: CurrentViewerContext; server: WorldServerRecord; membership: WorldServerMembershipRecord | null } | ApiResult> {
    const viewer = viewerFor(input, options);
    if (!viewer.isAuthenticated || !viewer.viewerUserId) return errorResponse(401, { kind: 'bad_request', message: 'Authentication required.' }, { requestId: input.requestId });
    const scope = resolveApiRequestScope({ params: input.params, query: input.query, body: record(input.body), headers: input.headers });
    if (!scope.safe) return errorResponse(400, { kind: 'bad_request', message: 'Request scope is inconsistent.' }, { requestId: input.requestId });
    const worldServerId = id(input, 'worldServerId') ?? text(scope.scope.worldServerId, 160);
    if (!worldServerId) return errorResponse(400, { kind: 'validation', message: 'worldServerId is required.' }, { requestId: input.requestId });
    const serverResult = await worlds.getWorldServerById(worldServerId);
    if (serverResult.ok === false) return repositoryFailure(serverResult.error, input.requestId);
    if (!serverResult.value) return errorResponse(404, { kind: 'not_found', message: 'World server not found.' }, { requestId: input.requestId });
    const server = serverResult.value;
    let membership: WorldServerMembershipRecord | null = null;
    if (server.ownerId !== viewer.viewerUserId) {
      const membershipResult = await worlds.getWorldServerMembershipByUser(worldServerId, viewer.viewerUserId);
      if (membershipResult.ok === false) return repositoryFailure(membershipResult.error, input.requestId);
      membership = membershipResult.value;
    }
    const guard = resolveApiPermissionGuard({
      action,
      viewer,
      requestScope: scope,
      content: action === 'view' ? {
        contentKind: 'world_server', contentId: server.worldServerId, ownerUserId: server.ownerId,
        worldServerId, visibilityScope: 'server', aiScope: 'disabled', lifecycleStatus: server.lifecycleStatus,
      } : undefined,
      worldServer: {
        worldServerId, ownerUserId: server.ownerId,
        membership: membership ? {
          userId: membership.userId,
          membershipStatus: membership.membershipStatus as 'active' | 'pending' | 'suspended' | 'left' | 'removed',
          roleKey: membership.roleKey, roleKind: roleKind(membership.roleKey), permissionsPayload: membership.payload,
        } : null,
      },
      hideResourceExistence: action === 'view', resourceExistenceKnown: true,
    });
    if (!guard.allowed) return errorResponse(guard.httpStatus, { kind: guard.httpStatus === 404 ? 'not_found' : 'bad_request', message: guard.publicMessage ?? 'You do not have access to this resource.' }, { requestId: input.requestId });
    return { viewer, server, membership };
  }

  return {
    async listPacks(input) {
      const access = await authorize(input, 'view');
      if (responseIs(access)) return access;
      const result = await compendium.listCompendiumPacksByWorldServer(access.server.worldServerId, 100);
      return result.ok === false ? repositoryFailure(result.error, input.requestId) : okResponse(result.value, { requestId: input.requestId });
    },
    async publishPack(input) {
      const access = await authorize(input, 'manageServerSettings');
      if (responseIs(access)) return access;
      const body = record(input.body);
      const ownerId = access.viewer.viewerUserId;
      if (!ownerId) return errorResponse(401, { kind: 'bad_request', message: 'Authentication required.' }, { requestId: input.requestId });
      const displayName = text(body.displayName, 120);
      const versionLabel = text(body.versionLabel, 64) ?? '1.0.0';
      const rawEntries = Array.isArray(body.entries) ? body.entries : [];
      if (!displayName) return errorResponse(400, { kind: 'validation', message: 'displayName is required.' }, { requestId: input.requestId });
      if (rawEntries.length === 0 || rawEntries.length > 50) return errorResponse(400, { kind: 'validation', message: 'entries must contain between 1 and 50 items.' }, { requestId: input.requestId });
      const entries: PublishPrivateCompendiumPackInput['entries'] = [];
      for (const rawEntry of rawEntries) {
        const candidate = record(rawEntry);
        const entryKind = text(candidate.entryKind, 40);
        const entryName = text(candidate.displayName, 160);
        const contentRef = jsonRecord(candidate.contentRef ?? candidate.content);
        const metadata = jsonRecord(candidate.metadata);
        if (!entryKind || !ENTRY_KINDS.has(entryKind) || !entryName || (candidate.contentRef !== undefined || candidate.content !== undefined) && !contentRef) {
          return errorResponse(400, { kind: 'validation', message: 'Each entry requires a supported entryKind, displayName, and a bounded object content payload when supplied.' }, { requestId: input.requestId });
        }
        entries.push({
          compendiumEntryId: randomUUID(), entryKind, displayName: entryName,
          sourceRef: { sourceKind: 'private', authorUserId: ownerId },
          contentRef: contentRef ?? {}, metadata: metadata ?? {}, schemaVersion: 1,
        });
      }
      const metadata = jsonRecord(body.metadata);
      const result = await publish({
        packId: randomUUID(), packVersionId: randomUUID(), packBindingId: randomUUID(),
        ownerId, worldServerId: access.server.worldServerId,
        displayName, versionLabel, metadata: metadata ?? {},
        manifest: { entryCount: entries.length, schema: 'private-compendium-pack-v1' },
        source: { sourceKind: 'private', authorUserId: ownerId },
        rights: { visibilityScope: 'server' }, entries,
      });
      return result.ok === false ? repositoryFailure(result.error, input.requestId) : okResponse(result.value, { statusCode: 201, requestId: input.requestId });
    },
  };
}
