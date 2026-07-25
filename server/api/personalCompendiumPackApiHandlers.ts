import { randomUUID } from 'node:crypto';

import {
  createPostgresPlatformFoundationRepository,
  publishUserPrivateCompendiumPack,
  type PublishUserPrivateCompendiumPackInput,
} from '../adapters/postgresPlatformFoundationRepository.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveApiAuthSession, type ApiRequestLike } from '../auth/requestAuthSession.js';
import { errorResponse, okResponse, type ServerApiResponse } from './apiResponse.js';

type ApiResult = ServerApiResponse<unknown>;
type Body = Record<string, unknown>;
type CompendiumRepository = Pick<ReturnType<typeof createPostgresPlatformFoundationRepository>, 'listUserPrivateCompendiumPacksByOwner'>;

export type PersonalCompendiumPackApiRequest = {
  requestId?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  viewer?: CurrentViewerContext;
};

export type PersonalCompendiumPackApiHandlers = {
  listPacks(input: PersonalCompendiumPackApiRequest): Promise<ApiResult>;
  publishPack(input: PersonalCompendiumPackApiRequest): Promise<ApiResult>;
};

export type CreatePersonalCompendiumPackApiHandlersOptions = {
  compendiumRepository?: CompendiumRepository;
  publish?: (input: PublishUserPrivateCompendiumPackInput) => ReturnType<typeof publishUserPrivateCompendiumPack>;
  allowDevAuthHeaders?: boolean;
  nodeEnv?: string;
};

const ENTRY_KINDS = new Set(['species', 'speciesOption', 'class', 'subclass', 'background', 'feat', 'spell', 'item', 'monster', 'rule', 'other']);
const text = (value: unknown, max = 240) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
const record = (value: unknown): Body => value && typeof value === 'object' && !Array.isArray(value) ? value as Body : {};

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
  return errorResponse(503, { kind: 'unavailable', message: 'Personal content pack service is unavailable.', retryable: error.retryable }, { requestId });
}

function viewerFor(input: PersonalCompendiumPackApiRequest, options: CreatePersonalCompendiumPackApiHandlersOptions): CurrentViewerContext {
  return input.viewer ?? createCurrentViewerContextFromAuthSession(resolveApiAuthSession({ headers: input.headers } as ApiRequestLike, {
    allowDevAuthHeaders: options.allowDevAuthHeaders === true,
    nodeEnv: options.nodeEnv ?? 'production',
  }));
}

function authenticatedViewer(input: PersonalCompendiumPackApiRequest, options: CreatePersonalCompendiumPackApiHandlersOptions): CurrentViewerContext | ApiResult {
  const viewer = viewerFor(input, options);
  return viewer.isAuthenticated && viewer.viewerUserId
    ? viewer
    : errorResponse(401, { kind: 'bad_request', message: 'Authentication required.' }, { requestId: input.requestId });
}

function isResponse(value: unknown): value is ApiResult {
  return typeof value === 'object' && value !== null && 'statusCode' in value && 'ok' in value;
}

export function createPersonalCompendiumPackApiHandlers(
  options: CreatePersonalCompendiumPackApiHandlersOptions = {},
): PersonalCompendiumPackApiHandlers {
  const compendium = options.compendiumRepository ?? createPostgresPlatformFoundationRepository();
  const publish = options.publish ?? publishUserPrivateCompendiumPack;

  return {
    async listPacks(input) {
      const viewer = authenticatedViewer(input, options);
      if (isResponse(viewer)) return viewer;
      const result = await compendium.listUserPrivateCompendiumPacksByOwner(viewer.viewerUserId!, 100);
      return result.ok === false ? repositoryFailure(result.error, input.requestId) : okResponse(result.value, { requestId: input.requestId });
    },
    async publishPack(input) {
      const viewer = authenticatedViewer(input, options);
      if (isResponse(viewer)) return viewer;
      const body = record(input.body);
      const displayName = text(body.displayName, 120);
      const versionLabel = text(body.versionLabel, 64) ?? '1.0.0';
      const rawEntries = Array.isArray(body.entries) ? body.entries : [];
      if (!displayName) return errorResponse(400, { kind: 'validation', message: 'displayName is required.' }, { requestId: input.requestId });
      if (rawEntries.length === 0 || rawEntries.length > 50) return errorResponse(400, { kind: 'validation', message: 'entries must contain between 1 and 50 items.' }, { requestId: input.requestId });

      const entries: PublishUserPrivateCompendiumPackInput['entries'] = [];
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
          sourceRef: { sourceKind: 'private', authorUserId: viewer.viewerUserId },
          contentRef: contentRef ?? {}, metadata: metadata ?? {}, schemaVersion: 1,
        });
      }
      const metadata = jsonRecord(body.metadata);
      const result = await publish({
        packId: randomUUID(), packVersionId: randomUUID(), ownerId: viewer.viewerUserId!,
        displayName, versionLabel, metadata: metadata ?? {},
        manifest: { entryCount: entries.length, schema: 'personal-private-compendium-pack-v1' },
        source: { sourceKind: 'private', authorUserId: viewer.viewerUserId },
        rights: { visibilityScope: 'user_private' }, entries,
      });
      return result.ok === false ? repositoryFailure(result.error, input.requestId) : okResponse(result.value, { statusCode: 201, requestId: input.requestId });
    },
  };
}
