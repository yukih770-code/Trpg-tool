/**
 * AI Context Retrieval Preflight — pure backend contract (P5.23).
 *
 * AI-LANDMARK: AI_CONTEXT_RETRIEVAL_PREFLIGHT_V1
 *
 * Step 2 of the P5.22-P5.24 retrieval-safety pipeline. BEFORE any content is fetched,
 * it decides which requested source families may be queried, with which mandatory
 * filters and required visibility/rights joins, what body-fetch policy applies, and
 * whether public fallback is allowed. It also normalizes fetched rows into the P5.21
 * `AiContextCandidate` shape. Preflight is NEVER sufficient by itself — every candidate
 * MUST still pass the P5.21 AI Context Scope Guard after fetch.
 *
 * Pure: NO DB, NO HTTP, NO React, NO AI/model, NO network, NO filesystem. Deny by
 * default; unknown source denied; body never trusted by preflight alone.
 */

import {
  getAiContextSourceRegistryEntry,
  isKnownAiRetrievalSourceKind,
  type AiRetrievalSourceKind,
  type AiContextBodyFetchPolicy,
} from './aiContextSourceRegistry.js';
import type {
  AiContextActor,
  AiContextRequestScope,
  AiContextCandidate,
  AiContextPurpose,
  VisibilityScope,
  AiScope,
  PermissionRightsPolicyContext,
} from './aiContextScopeGuard.js';

export type AiRetrievalPreflightDenyReason =
  | 'denied_unknown_source'
  | 'denied_missing_world_server_scope'
  | 'denied_missing_campaign_scope'
  | 'denied_public_fallback_disabled'
  | 'denied_source_disallows_public_fallback'
  | 'denied_body_fetch_not_allowed'
  | 'denied_unauthenticated'
  | 'denied_by_default';

export interface AiRetrievalPreflightSourceRequest {
  sourceKind: AiRetrievalSourceKind | string;
  requestedBodyAccess?: boolean;
  requestedPublicFallback?: boolean;
  requestedLimit?: number;
}

export interface AiRetrievalPreflightInput {
  actor: AiContextActor;
  requestScope: AiContextRequestScope;
  sources: AiRetrievalPreflightSourceRequest[];
}

export interface AiRetrievalAllowedSourcePlan {
  sourceKind: AiRetrievalSourceKind;
  allowedLimit: number;
  bodyFetchPolicy: AiContextBodyFetchPolicy;
  mustJoinVisibilityRecord: boolean;
  mustJoinRightsPolicy: boolean;
  mandatoryFilters: Record<string, string | boolean | null>;
  mandatoryMetadataFields: string[];
  notes: string[];
}

export interface AiRetrievalDeniedSourcePlan {
  sourceKind: string;
  reason: AiRetrievalPreflightDenyReason;
  notes: string[];
  // Intentionally NO body, NO summary, NO content payload.
}

export interface AiRetrievalPreflightResult {
  allowedSources: AiRetrievalAllowedSourcePlan[];
  deniedSources: AiRetrievalDeniedSourcePlan[];
  totalSources: number;
  allowedCount: number;
  deniedCount: number;
  diagnostics: {
    denyByDefault: true;
    bodyFetchRequiresPostFetchGuard: true;
    deniedSourcesContainNoContent: true;
    purpose: AiContextPurpose;
    worldServerId?: string | null;
    campaignId?: string | null;
  };
}

export interface NormalizeAiContextCandidateMetadataInput {
  sourceKind: AiRetrievalSourceKind | string;
  contextItemId: string;
  contentKind: string;
  contentId: string;
  title?: string;
  body?: string;
  summary?: string;
  ownerUserId?: string | null;
  worldServerId?: string | null;
  campaignId?: string | null;
  visibilityScope?: VisibilityScope;
  aiScope?: AiScope;
  publicSearchAllowed?: boolean;
  publicProfileAllowed?: boolean;
  workshopPublishAllowed?: boolean;
  communityFeedAllowed?: boolean;
  reviewStatus?: string;
  moderationStatus?: string;
  lifecycleStatus?: string;
  rightsPolicy?: PermissionRightsPolicyContext | null;
  metadata?: Record<string, unknown>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampLimit(value: number | undefined): number {
  if (value === undefined || !Number.isInteger(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, value));
}

function deniedPlan(sourceKind: string, reason: AiRetrievalPreflightDenyReason, notes: string[]): AiRetrievalDeniedSourcePlan {
  return { sourceKind, reason, notes };
}

export function evaluateAiRetrievalSourceRequest(input: {
  actor: AiContextActor;
  requestScope: AiContextRequestScope;
  source: AiRetrievalPreflightSourceRequest;
}): AiRetrievalAllowedSourcePlan | AiRetrievalDeniedSourcePlan {
  const { actor, requestScope, source } = input;
  const rawKind = source.sourceKind;

  // Unknown source is denied by default.
  if (!isKnownAiRetrievalSourceKind(rawKind) || rawKind === 'unknown') {
    return deniedPlan(String(rawKind), 'denied_unknown_source', ['Unknown/unclassified source denied by default.']);
  }
  const sourceKind = rawKind;
  const registry = getAiContextSourceRegistryEntry(sourceKind);
  const requestedPublicFallback = source.requestedPublicFallback === true;

  // Unauthenticated: only public-fallback-capable sources, and only via explicit fallback.
  if (!actor.isAuthenticated) {
    if (!registry.allowsPublicFallback) return deniedPlan(sourceKind, 'denied_source_disallows_public_fallback', ['Unauthenticated retrieval requires a public-fallback source.']);
    if (requestScope.allowPublicFallback !== true) return deniedPlan(sourceKind, 'denied_public_fallback_disabled', ['Unauthenticated retrieval requires allowPublicFallback.']);
    if (!requestedPublicFallback) return deniedPlan(sourceKind, 'denied_unauthenticated', ['Unauthenticated retrieval must request public fallback.']);
  }

  // Scope requirements.
  if (registry.requiresWorldServerScope && !requestScope.worldServerId) {
    return deniedPlan(sourceKind, 'denied_missing_world_server_scope', ['Source requires a world-server request scope.']);
  }
  if (registry.requiresCampaignScope && !requestScope.campaignId) {
    return deniedPlan(sourceKind, 'denied_missing_campaign_scope', ['Source requires a campaign request scope.']);
  }

  // Public fallback consistency.
  if (requestedPublicFallback) {
    if (requestScope.allowPublicFallback !== true) return deniedPlan(sourceKind, 'denied_public_fallback_disabled', ['Public fallback requires requestScope.allowPublicFallback.']);
    if (!registry.allowsPublicFallback) return deniedPlan(sourceKind, 'denied_source_disallows_public_fallback', ['Source does not permit public fallback.']);
  }

  // Body-fetch policy: preflight can only forbid; it never authorizes body inclusion by itself.
  if (source.requestedBodyAccess === true && (registry.defaultBodyFetchPolicy === 'body_never' || registry.defaultBodyFetchPolicy === 'metadata_only')) {
    return deniedPlan(sourceKind, 'denied_body_fetch_not_allowed', [`Body fetch not allowed for policy ${registry.defaultBodyFetchPolicy}.`]);
  }

  const mandatoryFilters: Record<string, string | boolean | null> = { lifecycleStatus: 'active' };
  if (requestScope.worldServerId && registry.canContainServerData) mandatoryFilters.worldServerId = requestScope.worldServerId;
  if (requestScope.campaignId && registry.canContainCampaignData) mandatoryFilters.campaignId = requestScope.campaignId;
  if (requestedPublicFallback) mandatoryFilters.visibilityScope = 'global_public';

  return {
    sourceKind,
    allowedLimit: clampLimit(source.requestedLimit),
    bodyFetchPolicy: registry.defaultBodyFetchPolicy,
    mustJoinVisibilityRecord: registry.requiresVisibilityRecord,
    mustJoinRightsPolicy: registry.requiresRightsPolicy,
    mandatoryFilters,
    mandatoryMetadataFields: [...registry.mandatoryMetadataFields],
    notes: [...registry.notes, 'Body inclusion still requires the P5.21 AI Context Scope Guard after fetch.'],
  };
}

function isAllowedPlan(plan: AiRetrievalAllowedSourcePlan | AiRetrievalDeniedSourcePlan): plan is AiRetrievalAllowedSourcePlan {
  return Object.prototype.hasOwnProperty.call(plan, 'allowedLimit');
}

export function buildAiContextRetrievalPreflight(input: AiRetrievalPreflightInput): AiRetrievalPreflightResult {
  const allowedSources: AiRetrievalAllowedSourcePlan[] = [];
  const deniedSources: AiRetrievalDeniedSourcePlan[] = [];

  for (const source of input.sources) {
    const plan = evaluateAiRetrievalSourceRequest({ actor: input.actor, requestScope: input.requestScope, source });
    if (isAllowedPlan(plan)) allowedSources.push(plan);
    else deniedSources.push(plan);
  }

  return {
    allowedSources,
    deniedSources,
    totalSources: input.sources.length,
    allowedCount: allowedSources.length,
    deniedCount: deniedSources.length,
    diagnostics: {
      denyByDefault: true,
      bodyFetchRequiresPostFetchGuard: true,
      deniedSourcesContainNoContent: true,
      purpose: input.requestScope.purpose,
      worldServerId: input.requestScope.worldServerId ?? null,
      campaignId: input.requestScope.campaignId ?? null,
    },
  };
}

/**
 * Normalize a fetched row into the P5.21 candidate shape, applying registry defaults for
 * missing visibility/AI metadata. Does NOT decide allow/deny — the P5.21 guard still must
 * run on the result.
 */
export function normalizeAiContextCandidateMetadata(input: NormalizeAiContextCandidateMetadataInput): AiContextCandidate {
  const known = isKnownAiRetrievalSourceKind(input.sourceKind) && input.sourceKind !== 'unknown';
  const registry = getAiContextSourceRegistryEntry(input.sourceKind);
  const visibilityScope: VisibilityScope = input.visibilityScope ?? registry.defaultVisibilityScope;

  let aiScope: AiScope;
  if (input.aiScope !== undefined) {
    aiScope = input.aiScope;
  } else if (!known) {
    aiScope = 'disabled';
  } else if (visibilityScope === 'global_public' && registry.canContainPublicData) {
    aiScope = 'public';
  } else {
    aiScope = 'private_only';
  }

  return {
    contextItemId: input.contextItemId,
    itemKind: registry.defaultItemKind,
    contentKind: input.contentKind,
    contentId: input.contentId,
    title: input.title,
    body: input.body,
    summary: input.summary,
    ownerUserId: input.ownerUserId,
    worldServerId: input.worldServerId,
    campaignId: input.campaignId,
    visibilityScope,
    aiScope,
    publicSearchAllowed: input.publicSearchAllowed,
    publicProfileAllowed: input.publicProfileAllowed,
    workshopPublishAllowed: input.workshopPublishAllowed,
    communityFeedAllowed: input.communityFeedAllowed,
    reviewStatus: input.reviewStatus ?? 'not_submitted',
    moderationStatus: input.moderationStatus ?? 'not_reviewed',
    lifecycleStatus: input.lifecycleStatus ?? 'active',
    rightsPolicy: input.rightsPolicy ?? null,
    metadata: input.metadata,
  };
}
