/**
 * AI Context Scope Guard — pure backend safety/scope contract (P5.21).
 *
 * AI-LANDMARK: AI_CONTEXT_SCOPE_GUARD_CONTRACT_V1
 *
 * The gate that every future AI feature (retrieval, AI Gateway, recap generation, NPC
 * drafting, rule explanation, campaign/server assistants, search answers) MUST call
 * before any content enters an AI context window. Given already-fetched candidate
 * items + the viewer/server/campaign request context, it returns the allowed items
 * (with body), the denied items (REDACTED — never their body or summary), and the deny
 * reasons. It reuses the P5.20 permission resolver (`canUseContentInAiContext`) as the
 * core check and layers request-scope + purpose + public-fallback rules on top.
 *
 * Core product rule: AI must never become a shortcut around visibility or rights. If a
 * viewer cannot view/use content, the AI must not receive it.
 *
 * Hard boundaries: NO database, NO Express/HTTP, NO React, NO browser API, NO model/AI
 * call, NO network, NO filesystem. Pure types + deterministic functions. Deny by
 * default; AI disabled/private by default; denied bodies always redacted.
 */

import {
  canUseContentInAiContext,
  type VisibilityScope,
  type AiScope,
  type PermissionRightsPolicyContext,
  type PermissionWorldServerContext,
  type PermissionContentContext,
} from './effectivePermissionResolver.js';

export type { VisibilityScope, AiScope, PermissionRightsPolicyContext, PermissionWorldServerContext };

// ── Types ────────────────────────────────────────────────────────────────────

export type AiContextPurpose =
  | 'campaign_recap'
  | 'runtime_summary'
  | 'npc_generation'
  | 'rules_explanation'
  | 'character_assistance'
  | 'server_assistant'
  | 'workshop_assistant'
  | 'moderation_assistant'
  | 'search_answer'
  | 'other';

export type AiContextItemKind =
  | 'actor'
  | 'campaign'
  | 'runtime_event'
  | 'generated_artifact'
  | 'ai_memory'
  | 'asset_metadata'
  | 'compendium_entry'
  | 'world_server'
  | 'chat_message'
  | 'map'
  | 'note'
  | 'unknown';

export interface AiContextActor {
  viewerUserId: string | null;
  isAuthenticated: boolean;
}

export interface AiContextRequestScope {
  purpose: AiContextPurpose;
  worldServerId?: string | null;
  campaignId?: string | null;
  roomId?: string | null;
  allowPublicFallback?: boolean;
  includeDeniedDiagnostics?: boolean;
}

export interface AiContextCandidate {
  contextItemId: string;
  itemKind: AiContextItemKind;
  contentKind: string;
  contentId: string;
  title?: string;
  body?: string;
  summary?: string;
  ownerUserId?: string | null;
  worldServerId?: string | null;
  campaignId?: string | null;
  visibilityScope: VisibilityScope;
  aiScope: AiScope;
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

export interface AiContextAllowedItem {
  contextItemId: string;
  itemKind: AiContextItemKind;
  contentKind: string;
  contentId: string;
  title?: string;
  body?: string;
  summary?: string;
  visibilityScope: VisibilityScope;
  aiScope: AiScope;
  permissionReason: string;
  metadata?: Record<string, unknown>;
}

export type AiContextDenyReason =
  | 'denied_by_permission_resolver'
  | 'denied_scope_mismatch'
  | 'denied_missing_required_server'
  | 'denied_missing_required_campaign'
  | 'denied_ai_scope_disabled'
  | 'denied_private_without_owner'
  | 'denied_server_mismatch'
  | 'denied_campaign_mismatch'
  | 'denied_public_fallback_disabled'
  | 'denied_unknown_item'
  | 'denied_lifecycle'
  | 'denied_moderation'
  | 'denied_rights_policy'
  | 'denied_by_default';

export interface AiContextDeniedItem {
  contextItemId: string;
  itemKind: AiContextItemKind;
  contentKind: string;
  contentId: string;
  title?: string;
  visibilityScope: VisibilityScope;
  aiScope: AiScope;
  reason: AiContextDenyReason;
  permissionReason?: string;
  notes: string[];
  // Intentionally NO body and NO summary — denied content must never leak.
}

export interface AiContextCandidateDecision {
  allowed: boolean;
  reason: AiContextDenyReason | 'allowed';
  permissionReason?: string;
  notes: string[];
}

export interface AiContextScopeGuardResult {
  allowedItems: AiContextAllowedItem[];
  deniedItems: AiContextDeniedItem[];
  totalCandidates: number;
  allowedCount: number;
  deniedCount: number;
  hasDeniedContent: boolean;
  diagnostics: {
    purpose: AiContextPurpose;
    worldServerId?: string | null;
    campaignId?: string | null;
    redactedDeniedBodies: true;
    denyByDefault: true;
  };
}

export interface FilterAiContextInput {
  actor: AiContextActor;
  requestScope: AiContextRequestScope;
  worldServer?: PermissionWorldServerContext | null;
  candidates: AiContextCandidate[];
}

// ── Internal helpers ─────────────────────────────────────────────────────────

const BLOCKING_MODERATION = new Set(['hidden', 'removed']);

interface ServerRelation {
  isServerOwner: boolean;
  isActiveMember: boolean;
  isModeratorPlus: boolean;
}

function serverRelation(actor: AiContextActor, worldServer: PermissionWorldServerContext | null | undefined): ServerRelation {
  const viewer = actor.viewerUserId;
  const isServerOwner = !!worldServer?.ownerUserId && viewer != null && worldServer.ownerUserId === viewer;
  const membership = worldServer?.membership ?? null;
  const activeMember = !!membership && viewer != null && membership.userId === viewer && membership.membershipStatus === 'active';
  const role = membership?.roleKind;
  const isModeratorPlus = isServerOwner || (activeMember && (role === 'admin' || role === 'moderator'));
  return { isServerOwner, isActiveMember: isServerOwner || activeMember, isModeratorPlus };
}

function isOwnerOf(actor: AiContextActor, candidate: AiContextCandidate): boolean {
  return candidate.ownerUserId != null && actor.viewerUserId != null && candidate.ownerUserId === actor.viewerUserId;
}

function toPermissionContent(candidate: AiContextCandidate): PermissionContentContext {
  return {
    contentKind: candidate.contentKind,
    contentId: candidate.contentId,
    ownerUserId: candidate.ownerUserId,
    worldServerId: candidate.worldServerId,
    campaignId: candidate.campaignId,
    visibilityScope: candidate.visibilityScope,
    aiScope: candidate.aiScope,
    publicSearchAllowed: candidate.publicSearchAllowed,
    publicProfileAllowed: candidate.publicProfileAllowed,
    workshopPublishAllowed: candidate.workshopPublishAllowed,
    communityFeedAllowed: candidate.communityFeedAllowed,
    reviewStatus: candidate.reviewStatus,
    moderationStatus: candidate.moderationStatus,
    lifecycleStatus: candidate.lifecycleStatus,
    rightsPolicy: candidate.rightsPolicy ?? null,
  };
}

function mapResolverReason(reason: string): AiContextDenyReason {
  switch (reason) {
    case 'denied_ai_disabled':
      return 'denied_ai_scope_disabled';
    case 'denied_rights_policy':
      return 'denied_rights_policy';
    case 'denied_ai_scope_mismatch':
      return 'denied_scope_mismatch';
    default:
      return 'denied_by_permission_resolver';
  }
}

function deny(reason: AiContextDenyReason, notes: string[], permissionReason?: string): AiContextCandidateDecision {
  return { allowed: false, reason, notes, permissionReason };
}

// ── Core decision ────────────────────────────────────────────────────────────

export function canIncludeAiContextCandidate(input: {
  actor: AiContextActor;
  requestScope: AiContextRequestScope;
  worldServer?: PermissionWorldServerContext | null;
  candidate: AiContextCandidate;
}): AiContextCandidateDecision {
  const { actor, requestScope, worldServer, candidate } = input;
  const notes: string[] = [];
  const rel = serverRelation(actor, worldServer);
  const owner = isOwnerOf(actor, candidate);
  const purpose = requestScope.purpose;

  // 1) AI disabled always denies.
  if (candidate.aiScope === 'disabled') return deny('denied_ai_scope_disabled', ['ai_scope is disabled.']);

  // 2) Lifecycle. deleted always denies; archived denies unless moderation purpose + moderator.
  if (candidate.lifecycleStatus === 'deleted') return deny('denied_lifecycle', ['Content is deleted.']);
  if (candidate.lifecycleStatus === 'archived' && !(purpose === 'moderation_assistant' && rel.isModeratorPlus)) {
    return deny('denied_lifecycle', ['Archived content is excluded from AI context.']);
  }

  // 3) Moderation. hidden/removed denies unless moderation purpose + moderator/admin/owner.
  if (candidate.moderationStatus && BLOCKING_MODERATION.has(candidate.moderationStatus) && !(purpose === 'moderation_assistant' && rel.isModeratorPlus)) {
    return deny('denied_moderation', ['Moderation status excludes content from AI context.']);
  }

  // 4) Unknown item kind: only safe public items may pass.
  if (candidate.itemKind === 'unknown') {
    const safePublic = candidate.visibilityScope === 'global_public' && candidate.aiScope === 'public';
    if (!safePublic) return deny('denied_unknown_item', ['Unknown item kind is denied unless it is a safe public item.']);
  }

  // 5) Private content requires owner (explicit; the resolver also enforces this).
  if (candidate.aiScope === 'private_only' && !owner) {
    return deny('denied_private_without_owner', ['private_only AI content requires the owner.']);
  }

  // 6) Unauthenticated viewers: only approved + clean + active global-public + ai public.
  if (!actor.isAuthenticated) {
    const okPublic =
      candidate.visibilityScope === 'global_public' &&
      candidate.aiScope === 'public' &&
      candidate.reviewStatus === 'approved' &&
      candidate.moderationStatus === 'clean' &&
      (candidate.lifecycleStatus === undefined || candidate.lifecycleStatus === 'active') &&
      !(candidate.rightsPolicy && candidate.rightsPolicy.aiContextAllowed === false);
    if (!okPublic) return deny('denied_by_default', ['Unauthenticated AI context is limited to approved, clean, active public content.']);
  }

  // 7) Request-scope match for scoped content.
  const serverScoped = candidate.visibilityScope === 'server' || candidate.aiScope === 'server_only';
  const campaignScoped = candidate.visibilityScope === 'campaign' || candidate.aiScope === 'campaign_only';
  if (serverScoped && candidate.worldServerId != null) {
    if (requestScope.worldServerId == null) return deny('denied_missing_required_server', ['Server-scoped candidate needs a server request scope.']);
    if (requestScope.worldServerId !== candidate.worldServerId) return deny('denied_server_mismatch', ['Candidate server does not match the request scope.']);
  }
  if (campaignScoped && candidate.campaignId != null) {
    if (requestScope.campaignId == null) return deny('denied_missing_required_campaign', ['Campaign-scoped candidate needs a campaign request scope.']);
    if (requestScope.campaignId !== candidate.campaignId) return deny('denied_campaign_mismatch', ['Candidate campaign does not match the request scope.']);
  }

  // 8) Core permission check (P5.20).
  const decision = canUseContentInAiContext({
    action: 'useInAiContext',
    actor: { viewerUserId: actor.viewerUserId, isAuthenticated: actor.isAuthenticated },
    content: toPermissionContent(candidate),
    worldServer: worldServer ?? undefined,
  });
  if (!decision.allowed) {
    return deny(mapResolverReason(decision.reason), [`Permission resolver denied: ${decision.reason}.`], decision.reason);
  }

  // Relationship of the viewer to this candidate (owner / matching active server or campaign).
  const serverMatch = candidate.worldServerId != null && requestScope.worldServerId === candidate.worldServerId && rel.isActiveMember;
  const campaignMatch = candidate.campaignId != null && requestScope.campaignId === candidate.campaignId && (rel.isActiveMember || owner);
  const related = owner || serverMatch || campaignMatch;
  const isPublicItem = candidate.visibilityScope === 'global_public' || candidate.aiScope === 'public';

  // 9) Purpose tightening: workshop_assistant excludes non-public unrelated content.
  if (purpose === 'workshop_assistant' && !isPublicItem && !related) {
    return deny('denied_scope_mismatch', ['workshop_assistant excludes server/campaign/private content the viewer is unrelated to.']);
  }

  // 10) Public fallback: an unrelated public item requires explicit allowPublicFallback for
  // authenticated viewers (unauthenticated already gated to approved public in step 6).
  if (isPublicItem && !related && actor.isAuthenticated && requestScope.allowPublicFallback !== true) {
    return deny('denied_public_fallback_disabled', ['Unrelated public content requires allowPublicFallback.']);
  }

  return { allowed: true, reason: 'allowed', permissionReason: decision.reason, notes };
}

// ── Redaction + batch filter ─────────────────────────────────────────────────

export function redactDeniedAiContextCandidate(
  candidate: AiContextCandidate,
  reason: AiContextDenyReason,
  notes: string[] = [],
  permissionReason?: string,
): AiContextDeniedItem {
  // NEVER copy body or summary onto a denied item.
  return {
    contextItemId: candidate.contextItemId,
    itemKind: candidate.itemKind,
    contentKind: candidate.contentKind,
    contentId: candidate.contentId,
    title: candidate.title,
    visibilityScope: candidate.visibilityScope,
    aiScope: candidate.aiScope,
    reason,
    permissionReason,
    notes,
  };
}

function toAllowedItem(candidate: AiContextCandidate, permissionReason: string): AiContextAllowedItem {
  return {
    contextItemId: candidate.contextItemId,
    itemKind: candidate.itemKind,
    contentKind: candidate.contentKind,
    contentId: candidate.contentId,
    title: candidate.title,
    body: candidate.body,
    summary: candidate.summary,
    visibilityScope: candidate.visibilityScope,
    aiScope: candidate.aiScope,
    permissionReason,
    metadata: candidate.metadata,
  };
}

export function filterAiContextCandidates(input: FilterAiContextInput): AiContextScopeGuardResult {
  const allowedItems: AiContextAllowedItem[] = [];
  const deniedItems: AiContextDeniedItem[] = [];

  for (const candidate of input.candidates) {
    const decision = canIncludeAiContextCandidate({
      actor: input.actor,
      requestScope: input.requestScope,
      worldServer: input.worldServer ?? null,
      candidate,
    });
    if (decision.allowed) {
      allowedItems.push(toAllowedItem(candidate, decision.permissionReason ?? 'allowed'));
    } else {
      deniedItems.push(redactDeniedAiContextCandidate(candidate, decision.reason as AiContextDenyReason, decision.notes, decision.permissionReason));
    }
  }

  return {
    allowedItems,
    deniedItems,
    totalCandidates: input.candidates.length,
    allowedCount: allowedItems.length,
    deniedCount: deniedItems.length,
    hasDeniedContent: deniedItems.length > 0,
    diagnostics: {
      purpose: input.requestScope.purpose,
      worldServerId: input.requestScope.worldServerId ?? null,
      campaignId: input.requestScope.campaignId ?? null,
      redactedDeniedBodies: true,
      denyByDefault: true,
    },
  };
}
