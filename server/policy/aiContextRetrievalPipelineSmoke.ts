/**
 * AI Context Retrieval Safety Pipeline smoke (P5.22-P5.24) — dependency-free.
 *
 * AI-LANDMARK: AI_CONTEXT_RETRIEVAL_PIPELINE_SMOKE_V1
 *
 * Pure self-check across registry → preflight → normalization → P5.21 guard → context
 * pack → manifest → audit. No DB, no API, no model, no test framework. Call
 * `runAiContextRetrievalPipelineSmoke()`.
 */

import {
  AI_CONTEXT_SOURCE_REGISTRY,
  getAiContextSourceRegistryEntry,
  listAiContextSourceRegistryEntries,
} from './aiContextSourceRegistry.js';
import {
  evaluateAiRetrievalSourceRequest,
  buildAiContextRetrievalPreflight,
  normalizeAiContextCandidateMetadata,
  type AiRetrievalPreflightSourceRequest,
} from './aiContextRetrievalPreflight.js';
import { buildAiContextPack } from './aiContextPackBuilder.js';
import type {
  AiContextActor,
  AiContextRequestScope,
  AiContextCandidate,
} from './aiContextScopeGuard.js';
import type {
  PermissionWorldServerContext,
  PermissionMembershipContext,
  MembershipStatus,
  WorldServerRoleKind,
} from './effectivePermissionResolver.js';

export interface PipelineSmokeCase {
  name: string;
  passed: boolean;
  details?: string;
}

export interface PipelineSmokeReport {
  total: number;
  passed: number;
  failed: number;
  cases: PipelineSmokeCase[];
}

const anon: AiContextActor = { viewerUserId: null, isAuthenticated: false };
const owner: AiContextActor = { viewerUserId: 'u_owner', isAuthenticated: true };
const other: AiContextActor = { viewerUserId: 'u_other', isAuthenticated: true };

function scope(overrides: Partial<AiContextRequestScope>): AiContextRequestScope {
  return { purpose: 'other', ...overrides };
}

function member(userId: string, status: MembershipStatus, roleKind: WorldServerRoleKind): PermissionMembershipContext {
  return { userId, membershipStatus: status, roleKind };
}

function server(ownerUserId: string | null, membership: PermissionMembershipContext | null): PermissionWorldServerContext {
  return { worldServerId: 's1', ownerUserId, membership };
}

function cand(overrides: Partial<AiContextCandidate>): AiContextCandidate {
  return {
    contextItemId: 'ctx1',
    itemKind: 'note',
    contentKind: 'smoke_content',
    contentId: 'c1',
    body: 'secret body',
    summary: 'secret summary',
    visibilityScope: 'user_private',
    aiScope: 'private_only',
    lifecycleStatus: 'active',
    ...overrides,
  };
}

function src(sourceKind: string, overrides: Partial<AiRetrievalPreflightSourceRequest> = {}): AiRetrievalPreflightSourceRequest {
  return { sourceKind, ...overrides };
}

function isAllowedPlan(plan: object): boolean {
  return Object.prototype.hasOwnProperty.call(plan, 'allowedLimit');
}

export function runAiContextRetrievalPipelineSmoke(): PipelineSmokeReport {
  const cases: PipelineSmokeCase[] = [];
  const check = (name: string, actual: boolean, expected: boolean, details?: string) => {
    cases.push({ name, passed: actual === expected, details: `actual=${actual} expected=${expected}${details ? ` ${details}` : ''}` });
  };

  // ── Registry ──────────────────────────────────────────────────────────────
  check('01_registry_has_16_kinds', listAiContextSourceRegistryEntries().length === 16, true, `len=${listAiContextSourceRegistryEntries().length}`);
  check('01_registry_has_actor_vault', !!AI_CONTEXT_SOURCE_REGISTRY.actor_vault, true);
  check('02_unknown_entry_deny_safe', getAiContextSourceRegistryEntry('nope').defaultBodyFetchPolicy === 'body_never' && getAiContextSourceRegistryEntry('nope').requiresRightsPolicy === true, true);
  check('03_actor_vault_visibility_owner_body', AI_CONTEXT_SOURCE_REGISTRY.actor_vault.requiresVisibilityRecord === true && AI_CONTEXT_SOURCE_REGISTRY.actor_vault.defaultBodyFetchPolicy === 'body_requires_owner', true);
  check('04_compendium_visibility_rights', AI_CONTEXT_SOURCE_REGISTRY.compendium_entry.requiresVisibilityRecord === true && AI_CONTEXT_SOURCE_REGISTRY.compendium_entry.requiresRightsPolicy === true, true);
  check('05_visibility_rights_body_never', AI_CONTEXT_SOURCE_REGISTRY.visibility_record.defaultBodyFetchPolicy === 'body_never' && AI_CONTEXT_SOURCE_REGISTRY.rights_policy.defaultBodyFetchPolicy === 'body_never', true);

  // ── Preflight ─────────────────────────────────────────────────────────────
  check('06_unknown_source_denied', !isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: owner, requestScope: scope({}), source: src('nope') })), true);
  check('07_anon_private_actor_vault_denied', !isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: anon, requestScope: scope({}), source: src('actor_vault') })), true);
  check('08_anon_public_fallback_allowed', isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: anon, requestScope: scope({ allowPublicFallback: true }), source: src('generated_artifact', { requestedPublicFallback: true }) })), true);
  check('09_public_fallback_disabled_denied', !isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({ allowPublicFallback: false }), source: src('generated_artifact', { requestedPublicFallback: true }) })), true);
  check('10_runtime_event_no_campaign_denied', !isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('runtime_event') })), true);
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({ campaignId: 'cmp1' }), source: src('runtime_event') });
    const okFilter = isAllowedPlan(plan) && (plan as { mandatoryFilters: Record<string, unknown> }).mandatoryFilters.campaignId === 'cmp1';
    check('11_runtime_event_campaign_filter', okFilter, true);
  }
  check('12_world_server_no_scope_denied', !isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('world_server') })), true);
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({ worldServerId: 's1' }), source: src('world_server') });
    const okFilter = isAllowedPlan(plan) && (plan as { mandatoryFilters: Record<string, unknown> }).mandatoryFilters.worldServerId === 's1';
    check('13_world_server_scope_filter', okFilter, true);
  }
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('ai_memory') });
    check('14_ai_memory_visibility_join', isAllowedPlan(plan) && (plan as { mustJoinVisibilityRecord: boolean }).mustJoinVisibilityRecord === true, true);
  }
  check('15_body_denied_metadata_only', !isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('ai_context_source', { requestedBodyAccess: true }) })), true);
  check('16_body_denied_body_never', !isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('visibility_record', { requestedBodyAccess: true }) })), true);
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('generated_artifact') });
    check('17_generated_visibility_join', isAllowedPlan(plan) && (plan as { mustJoinVisibilityRecord: boolean }).mustJoinVisibilityRecord === true, true);
  }
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('compendium_entry') });
    check('18_compendium_visibility_rights_join', isAllowedPlan(plan) && (plan as { mustJoinVisibilityRecord: boolean; mustJoinRightsPolicy: boolean }).mustJoinVisibilityRecord === true && (plan as { mustJoinRightsPolicy: boolean }).mustJoinRightsPolicy === true, true);
  }
  check('19_chat_requires_server_scope', !isAllowedPlan(evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('chat_message') })), true);
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('actor_vault', { requestedLimit: 500 }) });
    check('20_limit_clamped_50', isAllowedPlan(plan) && (plan as { allowedLimit: number }).allowedLimit === 50, true);
  }
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('actor_vault') });
    check('21_limit_default_20', isAllowedPlan(plan) && (plan as { allowedLimit: number }).allowedLimit === 20, true);
  }
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: other, requestScope: scope({}), source: src('actor_vault', { requestedLimit: 0 }) });
    check('22_limit_min_1', isAllowedPlan(plan) && (plan as { allowedLimit: number }).allowedLimit === 1, true);
  }
  {
    const plan = evaluateAiRetrievalSourceRequest({ actor: owner, requestScope: scope({}), source: src('nope') });
    check('23_denied_plan_no_body', !('body' in plan) && !('summary' in plan), true);
  }
  {
    const pre = buildAiContextRetrievalPreflight({ actor: other, requestScope: scope({}), sources: [src('actor_vault'), src('nope'), src('world_server')] });
    check('24_mixed_counts', pre.allowedCount === 1 && pre.deniedCount === 2 && pre.totalSources === 3, true, `a=${pre.allowedCount} d=${pre.deniedCount}`);
  }

  // ── Normalization ─────────────────────────────────────────────────────────
  {
    const c = normalizeAiContextCandidateMetadata({ sourceKind: 'actor_vault', contextItemId: 'n1', contentKind: 'actor', contentId: 'a1' });
    check('25_normalize_default_visibility', c.visibilityScope === 'user_private', true);
    check('27_normalize_default_itemkind', c.itemKind === 'actor', true);
    check('28_normalize_no_allow_field', !('allowed' in c), true);
  }
  {
    const c = normalizeAiContextCandidateMetadata({ sourceKind: 'weird_unknown', contextItemId: 'n2', contentKind: 'x', contentId: 'y' });
    check('26_normalize_unknown_ai_disabled', c.aiScope === 'disabled', true);
  }

  // ── Guard / pack / audit ──────────────────────────────────────────────────
  {
    const pack = buildAiContextPack({ actor: owner, requestScope: scope({ purpose: 'character_assistance' }), candidates: [cand({ ownerUserId: 'u_owner', aiScope: 'private_only', visibilityScope: 'user_private' })] });
    check('29_pack_owner_private_included', pack.items.length === 1 && pack.status === 'ready', true, pack.status);
  }
  {
    const pack = buildAiContextPack({ actor: other, requestScope: scope({}), candidates: [cand({ ownerUserId: 'u_owner', aiScope: 'private_only', visibilityScope: 'user_private' })] });
    const denied = pack.deniedItems[0];
    check('30_pack_non_owner_private_denied', pack.items.length === 0 && pack.deniedCount === 1, true);
    check('30_pack_denied_redacted', !!denied && !('body' in denied) && !('summary' in denied), true);
  }
  {
    const pack = buildAiContextPack({ actor: other, requestScope: scope({ purpose: 'server_assistant', worldServerId: 's1' }), worldServer: server('u_owner', member('u_other', 'active', 'member')), candidates: [cand({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1' })] });
    check('31_pack_server_match_included', pack.items.length === 1, true, pack.status);
  }
  {
    const pack = buildAiContextPack({ actor: other, requestScope: scope({ purpose: 'server_assistant', worldServerId: 's2' }), worldServer: server('u_owner', member('u_other', 'active', 'member')), candidates: [cand({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1' })] });
    check('32_pack_server_mismatch_denied', pack.items.length === 0 && pack.deniedCount === 1, true);
  }
  {
    const pub = cand({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean', ownerUserId: 'u_owner' });
    const packYes = buildAiContextPack({ actor: other, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }), candidates: [pub] });
    const packNo = buildAiContextPack({ actor: other, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: false }), candidates: [pub] });
    check('33_pack_public_fallback_enabled_included', packYes.items.length === 1, true, packYes.status);
    check('34_pack_public_fallback_disabled_denied', packNo.items.length === 0 && packNo.deniedCount === 1, true);
  }
  {
    const pack = buildAiContextPack({ actor: other, requestScope: scope({}), candidates: [cand({ ownerUserId: 'u_owner', aiScope: 'private_only' })] });
    const noLeak = pack.deniedItems.every((d) => !('body' in d) && !('summary' in d));
    check('35_denied_no_body_summary', noLeak && pack.deniedCount > 0, true);
  }
  {
    const pack = buildAiContextPack({
      actor: owner,
      requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }),
      candidates: [
        cand({ contextItemId: 'a1', ownerUserId: 'u_owner', aiScope: 'private_only' }),
        cand({ contextItemId: 'd1', ownerUserId: 'u_someone', aiScope: 'private_only' }),
      ],
    });
    const hasAllowed = pack.sourceManifest.some((m) => m.included === true);
    const hasDenied = pack.sourceManifest.some((m) => m.included === false && m.redacted === true);
    check('36_manifest_allowed_and_denied', hasAllowed && hasDenied, true);
    const auditNoBody = pack.auditRecord.deniedBodiesRedacted === true && pack.auditRecord.sourceManifest.every((m) => !('body' in m) && !('summary' in m));
    check('37_audit_counts_no_body', pack.auditRecord.allowedCount === 1 && pack.auditRecord.deniedCount === 1 && auditNoBody, true);
  }
  {
    const three = [
      cand({ contextItemId: 't1', contentId: 'c_t1', ownerUserId: 'u_owner', aiScope: 'private_only' }),
      cand({ contextItemId: 't2', contentId: 'c_t2', ownerUserId: 'u_owner', aiScope: 'private_only' }),
      cand({ contextItemId: 't3', contentId: 'c_t3', ownerUserId: 'u_owner', aiScope: 'private_only' }),
    ];
    const pack = buildAiContextPack({ actor: owner, requestScope: scope({}), candidates: three, maxItems: 2 });
    check('38_truncation_partial', pack.status === 'partial' && pack.items.length === 2, true, pack.status);
  }
  {
    const pack = buildAiContextPack({ actor: owner, requestScope: scope({}), candidates: [] });
    check('39_empty_status', pack.status === 'empty', true, pack.status);
  }
  {
    const pack = buildAiContextPack({ actor: other, requestScope: scope({}), candidates: [cand({ ownerUserId: 'u_owner', aiScope: 'private_only' }), cand({ contextItemId: 'x2', contentId: 'c2', aiScope: 'disabled' })] });
    check('40_all_denied_status', pack.status === 'all_denied' && pack.allowedCount === 0, true, pack.status);
  }

  const passed = cases.filter((c) => c.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
