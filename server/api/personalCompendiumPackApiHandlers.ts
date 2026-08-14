import { randomUUID } from 'node:crypto';

import {
  createPostgresPlatformFoundationRepository,
  appendUserPrivateCompendiumPackVersion,
  publishUserPrivateCompendiumPack,
  type AppendUserPrivateCompendiumPackVersionInput,
  type PublishUserPrivateCompendiumPackInput,
} from '../adapters/postgresPlatformFoundationRepository.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from '../auth/currentViewerContext.js';
import { resolveApiAuthSession, type ApiRequestLike } from '../auth/requestAuthSession.js';
import { errorResponse, okResponse, type ServerApiResponse } from './apiResponse.js';

type ApiResult = ServerApiResponse<unknown>;
type Body = Record<string, unknown>;
type CompendiumRepository = Pick<ReturnType<typeof createPostgresPlatformFoundationRepository>, 'listUserPrivateCompendiumPacksByOwner' | 'listCompendiumPackVersions' | 'listCompendiumEntries'>;

export type PersonalCompendiumPackApiRequest = {
  requestId?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  viewer?: CurrentViewerContext;
};

export type PersonalCompendiumPackApiHandlers = {
  listPacks(input: PersonalCompendiumPackApiRequest): Promise<ApiResult>;
  listPackVersions(packId: string, input: PersonalCompendiumPackApiRequest): Promise<ApiResult>;
  getPackVersion(packId: string, packVersionId: string, input: PersonalCompendiumPackApiRequest): Promise<ApiResult>;
  publishPack(input: PersonalCompendiumPackApiRequest): Promise<ApiResult>;
  publishVersion(packId: string, input: PersonalCompendiumPackApiRequest): Promise<ApiResult>;
};

export type CreatePersonalCompendiumPackApiHandlersOptions = {
  compendiumRepository?: CompendiumRepository;
  publish?: (input: PublishUserPrivateCompendiumPackInput) => ReturnType<typeof publishUserPrivateCompendiumPack>;
  appendVersion?: (input: AppendUserPrivateCompendiumPackVersionInput) => ReturnType<typeof appendUserPrivateCompendiumPackVersion>;
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
  const appendVersion = options.appendVersion ?? appendUserPrivateCompendiumPackVersion;

  const draftFrom = (body: Body, viewerUserId: string): { ok: true; displayName?: string; versionLabel: string; entries: PublishUserPrivateCompendiumPackInput['entries']; metadata: Body } | { ok: false; response: ApiResult } => {
    const displayName = text(body.displayName, 120);
    const versionLabel = text(body.versionLabel, 64) ?? '1.0.0';
    const rawEntries = Array.isArray(body.entries) ? body.entries : [];
    if (rawEntries.length === 0 || rawEntries.length > 50) return { ok: false, response: errorResponse(400, { kind: 'validation', message: 'entries must contain between 1 and 50 items.' }) };
    const entries: PublishUserPrivateCompendiumPackInput['entries'] = [];
    for (const rawEntry of rawEntries) {
      const candidate = record(rawEntry);
      const entryKind = text(candidate.entryKind, 40);
      const entryName = text(candidate.displayName, 160);
      const contentRef = jsonRecord(candidate.contentRef ?? candidate.content);
      const metadata = jsonRecord(candidate.metadata);
      if (!entryKind || !ENTRY_KINDS.has(entryKind) || !entryName || (candidate.contentRef !== undefined || candidate.content !== undefined) && !contentRef) {
        return { ok: false, response: errorResponse(400, { kind: 'validation', message: 'Each entry requires a supported entryKind, displayName, and a bounded object content payload when supplied.' }) };
      }
      entries.push({ compendiumEntryId: randomUUID(), entryKind, displayName: entryName, sourceRef: { sourceKind: 'private', authorUserId: viewerUserId }, contentRef: contentRef ?? {}, metadata: metadata ?? {}, schemaVersion: 1 });
    }
    return { ok: true, displayName, versionLabel, entries, metadata: jsonRecord(body.metadata) ?? {} };
  };

  return {
    async listPacks(input) {
      const viewer = authenticatedViewer(input, options);
      if (isResponse(viewer)) return viewer;
      const result = await compendium.listUserPrivateCompendiumPacksByOwner(viewer.viewerUserId!, 100);
      if (result.ok === false) return repositoryFailure(result.error, input.requestId);
      const summaries = await Promise.all(result.value.map(async (pack) => {
        const versions = await compendium.listCompendiumPackVersions(pack.packId, 1);
        if (versions.ok === false) return null;
        const latestVersion = versions.value[0];
        return latestVersion
          ? { ...pack, latestVersion: { packVersionId: latestVersion.packVersionId, versionLabel: latestVersion.versionLabel } }
          : { ...pack };
      }));
      if (summaries.some((summary) => summary === null)) {
        return errorResponse(503, { kind: 'unavailable', message: 'Personal content pack service is unavailable.' }, { requestId: input.requestId });
      }
      return okResponse(summaries, { requestId: input.requestId });
    },
    async listPackVersions(packId, input) {
      const viewer = authenticatedViewer(input, options);
      if (isResponse(viewer)) return viewer;
      if (!text(packId, 160)) return errorResponse(400, { kind: 'validation', message: 'packId is required.' }, { requestId: input.requestId });
      const packs = await compendium.listUserPrivateCompendiumPacksByOwner(viewer.viewerUserId!, 100);
      if (packs.ok === false) return repositoryFailure(packs.error, input.requestId);
      if (!packs.value.some((candidate) => candidate.packId === packId)) {
        return errorResponse(404, { kind: 'not_found', message: 'Personal content pack was not found.' }, { requestId: input.requestId });
      }
      const versions = await compendium.listCompendiumPackVersions(packId, 100);
      if (versions.ok === false) return repositoryFailure(versions.error, input.requestId);
      return okResponse(versions.value.map((version) => ({
        packVersionId: version.packVersionId,
        packId: version.packId,
        versionLabel: version.versionLabel,
        schemaVersion: version.schemaVersion,
        ...(version.createdAt ? { createdAt: version.createdAt } : {}),
        ...(version.publishedAt ? { publishedAt: version.publishedAt } : {}),
      })), { requestId: input.requestId });
    },
    async getPackVersion(packId, packVersionId, input) {
      const viewer = authenticatedViewer(input, options);
      if (isResponse(viewer)) return viewer;
      if (!text(packId, 160) || !text(packVersionId, 160)) {
        return errorResponse(400, { kind: 'validation', message: 'packId and packVersionId are required.' }, { requestId: input.requestId });
      }
      // Resolve ownership before reading entries. A private pack/version is never
      // discoverable through this endpoint to another authenticated user.
      const packs = await compendium.listUserPrivateCompendiumPacksByOwner(viewer.viewerUserId!, 100);
      if (packs.ok === false) return repositoryFailure(packs.error, input.requestId);
      const pack = packs.value.find((candidate) => candidate.packId === packId);
      if (!pack) return errorResponse(404, { kind: 'not_found', message: 'Personal content pack version was not found.' }, { requestId: input.requestId });

      const versions = await compendium.listCompendiumPackVersions(packId, 100);
      if (versions.ok === false) return repositoryFailure(versions.error, input.requestId);
      const version = versions.value.find((candidate) => candidate.packVersionId === packVersionId);
      if (!version) return errorResponse(404, { kind: 'not_found', message: 'Personal content pack version was not found.' }, { requestId: input.requestId });

      const entries = await compendium.listCompendiumEntries(packVersionId, 60);
      if (entries.ok === false) return repositoryFailure(entries.error, input.requestId);
      return okResponse({
        pack: {
          packId: pack.packId,
          displayName: pack.displayName,
          packKind: pack.packKind,
          visibilityScope: pack.visibilityScope,
          lifecycleStatus: pack.lifecycleStatus,
          metadata: pack.metadata,
        },
        version: {
          packVersionId: version.packVersionId,
          packId: version.packId,
          versionLabel: version.versionLabel,
          manifest: version.manifest,
          schemaVersion: version.schemaVersion,
        },
        entries: entries.value.map((entry) => ({
          compendiumEntryId: entry.compendiumEntryId,
          entryKind: entry.entryKind,
          displayName: entry.displayName,
          content: entry.contentRef,
          metadata: entry.metadata,
          schemaVersion: entry.schemaVersion,
        })),
      }, { requestId: input.requestId });
    },
    async publishPack(input) {
      const viewer = authenticatedViewer(input, options);
      if (isResponse(viewer)) return viewer;
      const body = record(input.body);
      const draft = draftFrom(body, viewer.viewerUserId!);
      if (draft.ok === false) return { ...draft.response, requestId: input.requestId };
      if (!draft.displayName) return errorResponse(400, { kind: 'validation', message: 'displayName is required.' }, { requestId: input.requestId });
      const result = await publish({
        packId: randomUUID(), packVersionId: randomUUID(), ownerId: viewer.viewerUserId!,
        displayName: draft.displayName, versionLabel: draft.versionLabel, metadata: draft.metadata,
        manifest: { entryCount: draft.entries.length, schema: 'personal-private-compendium-pack-v1' },
        source: { sourceKind: 'private', authorUserId: viewer.viewerUserId },
        rights: { visibilityScope: 'user_private' }, entries: draft.entries,
      });
      return result.ok === false ? repositoryFailure(result.error, input.requestId) : okResponse(result.value, { statusCode: 201, requestId: input.requestId });
    },
    async publishVersion(packId, input) {
      const viewer = authenticatedViewer(input, options);
      if (isResponse(viewer)) return viewer;
      if (!text(packId, 160)) return errorResponse(400, { kind: 'validation', message: 'packId is required.' }, { requestId: input.requestId });
      const draft = draftFrom(record(input.body), viewer.viewerUserId!);
      if (draft.ok === false) return { ...draft.response, requestId: input.requestId };
      const result = await appendVersion({
        packId, packVersionId: randomUUID(), ownerId: viewer.viewerUserId!, versionLabel: draft.versionLabel,
        manifest: { entryCount: draft.entries.length, schema: 'personal-private-compendium-pack-v1' },
        source: { sourceKind: 'private', authorUserId: viewer.viewerUserId }, rights: { visibilityScope: 'user_private' }, entries: draft.entries,
      });
      return result.ok === false ? repositoryFailure(result.error, input.requestId) : okResponse(result.value, { statusCode: 201, requestId: input.requestId });
    },
  };
}
