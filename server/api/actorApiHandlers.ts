/**
 * Authenticated Actor Vault API boundary.
 *
 * Actor records are long-term user-owned character assets. This route layer
 * deliberately does not expose campaign actor instances, live HP/SAN state, or
 * room authority: those continue to belong to their respective runtime layers.
 */

import { randomUUID } from 'node:crypto';

import {
  createPostgresActorRepository,
  type PostgresActorRecord,
  type PostgresActorRepository,
  type PostgresActorRepositoryErrorKind,
} from '../adapters/postgresActorRepository.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveApiAuthSession, type ApiRequestLike } from '../auth/requestAuthSession.js';
import { errorResponse, okResponse, type ServerApiResponse } from './apiResponse.js';

type ApiResult = ServerApiResponse<unknown>;
type Body = Record<string, unknown>;

export type ActorApiRepository = Pick<
  PostgresActorRepository,
  'listActorsByOwner' | 'getActorById' | 'createActor' | 'updateActor' | 'archiveActor' | 'restoreActor'
>;

export interface ActorApiRequest {
  requestId?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  viewer?: CurrentViewerContext;
}

export interface ActorApiHandlers {
  listActors(input: ActorApiRequest): Promise<ApiResult>;
  getActor(input: ActorApiRequest): Promise<ApiResult>;
  createActor(input: ActorApiRequest): Promise<ApiResult>;
  updateActor(input: ActorApiRequest): Promise<ApiResult>;
  archiveActor(input: ActorApiRequest): Promise<ApiResult>;
  restoreActor(input: ActorApiRequest): Promise<ApiResult>;
}

export interface CreateActorApiHandlersOptions {
  actorRepository?: ActorApiRepository;
  allowDevAuthHeaders?: boolean;
  nodeEnv?: string;
}

function isRecord(value: unknown): value is Body {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function bodyOf(input: ActorApiRequest): Body {
  return isRecord(input.body) ? input.body : {};
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function positiveInteger(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function responseIs(value: unknown): value is ApiResult {
  return value !== null && typeof value === 'object' && 'ok' in value && 'statusCode' in value;
}

function viewerFor(input: ActorApiRequest, options: CreateActorApiHandlersOptions): CurrentViewerContext {
  if (input.viewer) return input.viewer;
  return createCurrentViewerContextFromAuthSession(resolveApiAuthSession(
    { headers: input.headers } as ApiRequestLike,
    { allowDevAuthHeaders: options.allowDevAuthHeaders === true, nodeEnv: options.nodeEnv ?? 'production' },
  ));
}

function requireViewer(input: ActorApiRequest, options: CreateActorApiHandlersOptions): CurrentViewerContext | ApiResult {
  const viewer = viewerFor(input, options);
  return viewer.isAuthenticated && viewer.viewerUserId
    ? viewer
    : errorResponse(401, { kind: 'bad_request', message: 'Authentication required.' }, { requestId: input.requestId });
}

function repositoryFailure(error: { kind: PostgresActorRepositoryErrorKind; retryable?: boolean }, requestId?: string): ApiResult {
  if (error.kind === 'not_found') return errorResponse(404, { kind: 'not_found', message: 'Actor not found.' }, { requestId });
  if (error.kind === 'conflict') return errorResponse(409, { kind: 'conflict', message: 'Actor request conflicts with an existing record.' }, { requestId });
  return errorResponse(503, { kind: 'unavailable', message: 'Actor vault service is unavailable.', retryable: error.retryable }, { requestId });
}

function actorIdOf(input: ActorApiRequest): string | undefined {
  return text(input.params?.actorId);
}

/** Owner check hides another user's vault asset rather than exposing its existence. */
async function ownedActor(
  input: ActorApiRequest,
  options: CreateActorApiHandlersOptions,
  repository: ActorApiRepository,
): Promise<{ viewer: CurrentViewerContext; actor: PostgresActorRecord } | ApiResult> {
  const viewer = requireViewer(input, options);
  if (responseIs(viewer)) return viewer;
  const actorId = actorIdOf(input);
  if (!actorId) return errorResponse(400, { kind: 'validation', message: 'actorId is required.' }, { requestId: input.requestId });
  const result = await repository.getActorById(actorId);
  if (result.ok === false) return repositoryFailure(result.error, input.requestId);
  if (!result.value || result.value.ownerId !== viewer.viewerUserId) {
    return errorResponse(404, { kind: 'not_found', message: 'Actor not found.' }, { requestId: input.requestId });
  }
  return { viewer, actor: result.value };
}

export function createActorApiHandlers(options: CreateActorApiHandlersOptions = {}): ActorApiHandlers {
  const repository = options.actorRepository ?? createPostgresActorRepository();

  return {
    async listActors(input) {
      const viewer = requireViewer(input, options);
      if (responseIs(viewer)) return viewer;
      const result = await repository.listActorsByOwner(viewer.viewerUserId!, {
        systemId: text(input.query?.systemId),
        includeArchived: input.query?.includeArchived === 'true',
        limit: positiveInteger(input.query?.limit),
      });
      return result.ok === false ? repositoryFailure(result.error, input.requestId) : okResponse(result.value, { requestId: input.requestId });
    },

    async getActor(input) {
      const target = await ownedActor(input, options, repository);
      return responseIs(target) ? target : okResponse(target.actor, { requestId: input.requestId });
    },

    async createActor(input) {
      const viewer = requireViewer(input, options);
      if (responseIs(viewer)) return viewer;
      const body = bodyOf(input);
      const systemId = text(body.systemId);
      const localActorId = text(body.localActorId);
      const displayName = text(body.displayName);
      if (!systemId) return errorResponse(400, { kind: 'validation', message: 'systemId is required.' }, { requestId: input.requestId });
      if (!localActorId) return errorResponse(400, { kind: 'validation', message: 'localActorId is required.' }, { requestId: input.requestId });
      if (!displayName) return errorResponse(400, { kind: 'validation', message: 'displayName is required.' }, { requestId: input.requestId });
      if (body.payload !== undefined && !isRecord(body.payload)) {
        return errorResponse(400, { kind: 'validation', message: 'payload must be an object.' }, { requestId: input.requestId });
      }
      const schemaVersion = positiveInteger(body.schemaVersion);
      const result = await repository.createActor({
        actorId: `actor_${randomUUID()}`,
        ownerId: viewer.viewerUserId!,
        systemId,
        localActorId,
        displayName,
        payload: isRecord(body.payload) ? body.payload : undefined,
        schemaVersion,
      });
      return result.ok === false
        ? repositoryFailure(result.error, input.requestId)
        : okResponse(result.value, { statusCode: 201, requestId: input.requestId });
    },

    async updateActor(input) {
      const target = await ownedActor(input, options, repository);
      if (responseIs(target)) return target;
      const body = bodyOf(input);
      const displayName = text(body.displayName);
      if (body.payload !== undefined && !isRecord(body.payload)) {
        return errorResponse(400, { kind: 'validation', message: 'payload must be an object.' }, { requestId: input.requestId });
      }
      if (displayName === undefined && body.payload === undefined) {
        return errorResponse(400, { kind: 'validation', message: 'displayName or payload is required.' }, { requestId: input.requestId });
      }
      const result = await repository.updateActor({
        actorId: target.actor.actorId,
        displayName,
        payload: isRecord(body.payload) ? body.payload : undefined,
      });
      if (result.ok === false) return repositoryFailure(result.error, input.requestId);
      return result.value
        ? okResponse(result.value, { requestId: input.requestId })
        : errorResponse(404, { kind: 'not_found', message: 'Actor not found.' }, { requestId: input.requestId });
    },

    async archiveActor(input) {
      const target = await ownedActor(input, options, repository);
      if (responseIs(target)) return target;
      const result = await repository.archiveActor(target.actor.actorId);
      if (result.ok === false) return repositoryFailure(result.error, input.requestId);
      return result.value
        ? okResponse(result.value, { requestId: input.requestId })
        : errorResponse(404, { kind: 'not_found', message: 'Actor not found.' }, { requestId: input.requestId });
    },

    async restoreActor(input) {
      const target = await ownedActor(input, options, repository);
      if (responseIs(target)) return target;
      const result = await repository.restoreActor(target.actor.actorId);
      if (result.ok === false) return repositoryFailure(result.error, input.requestId);
      return result.value
        ? okResponse(result.value, { requestId: input.requestId })
        : errorResponse(404, { kind: 'not_found', message: 'Actor not found.' }, { requestId: input.requestId });
    },
  };
}

export const defaultPostgresActorApiHandlers = createActorApiHandlers();
