/**
 * AI Context Scope Guard smoke (P5.21) — dependency-free, deterministic.
 *
 * AI-LANDMARK: AI_CONTEXT_SCOPE_GUARD_SMOKE_V1
 *
 * A pure self-check for `aiContextScopeGuard`. No DB, no API, no model, no test
 * framework. Call `runAiContextScopeGuardSmoke()` from a scratch script, devtools, or
 * the verify runner. Asserts the deny-by-default + redaction invariants.
 */

import {
  canIncludeAiContextCandidate,
  filterAiContextCandidates,
  type AiContextActor,
  type AiContextCandidate,
  type AiContextRequestScope,
} from './aiContextScopeGuard.js';
import {
  type PermissionWorldServerContext,
  type PermissionMembershipContext,
  type MembershipStatus,
  type WorldServerRoleKind,
} from './effectivePermissionResolver.js';

export interface AiScopeSmokeCase {
  name: string;
  passed: boolean;
  details?: string;
}

export interface AiScopeSmokeReport {
  total: number;
  passed: number;
  failed: number;
  cases: AiScopeSmokeCase[];
}

const anon: AiContextActor = { viewerUserId: null, isAuthenticated: false };
const owner: AiContextActor = { viewerUserId: 'u_owner', isAuthenticated: true };
const other: AiContextActor = { viewerUserId: 'u_other', isAuthenticated: true };

function candidate(overrides: Partial<AiContextCandidate>): AiContextCandidate {
  return {
    contextItemId: overrides.contextItemId ?? 'ctx1',
    itemKind: 'note',
    contentKind: 'smoke_content',
    contentId: 'c1',
    body: 'secret body text',
    summary: 'secret summary',
    visibilityScope: 'user_private',
    aiScope: 'private_only',
    lifecycleStatus: 'active',
    ...overrides,
  };
}

function member(userId: string, status: MembershipStatus, roleKind: WorldServerRoleKind): PermissionMembershipContext {
  return { userId, membershipStatus: status, roleKind };
}

function server(ownerUserId: string | null, membership: PermissionMembershipContext | null): PermissionWorldServerContext {
  return { worldServerId: 's1', ownerUserId, membership };
}

function scope(overrides: Partial<AiContextRequestScope>): AiContextRequestScope {
  return { purpose: 'other', ...overrides };
}

export function runAiContextScopeGuardSmoke(): AiScopeSmokeReport {
  const cases: AiScopeSmokeCase[] = [];
  const check = (name: string, actual: boolean, expected: boolean, details?: string) => {
    cases.push({ name, passed: actual === expected, details: `actual=${actual} expected=${expected}${details ? ` ${details}` : ''}` });
  };

  // 1. owner private_only included for private AI use.
  {
    const d = canIncludeAiContextCandidate({ actor: owner, requestScope: scope({ purpose: 'character_assistance' }), candidate: candidate({ ownerUserId: 'u_owner', aiScope: 'private_only', visibilityScope: 'user_private' }) });
    check('01_owner_private_included', d.allowed, true, d.reason);
  }
  // 2. non-owner private_only denied + body redacted.
  {
    const res = filterAiContextCandidates({ actor: other, requestScope: scope({}), candidates: [candidate({ ownerUserId: 'u_owner', aiScope: 'private_only', visibilityScope: 'user_private' })] });
    const denied = res.deniedItems[0];
    const redacted = !!denied && !('body' in denied) && !('summary' in denied);
    check('02_non_owner_private_denied', res.deniedCount === 1, true, denied?.reason);
    check('02_non_owner_private_redacted', redacted, true);
  }
  // 3. disabled ai_scope denied.
  {
    const d = canIncludeAiContextCandidate({ actor: owner, requestScope: scope({}), candidate: candidate({ ownerUserId: 'u_owner', aiScope: 'disabled' }) });
    check('03_disabled_denied', d.allowed, false, d.reason);
  }
  // 4. active server member includes matching server_only.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'server_assistant', worldServerId: 's1' }), worldServer: server('u_owner', member('u_other', 'active', 'member')), candidate: candidate({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1' }) });
    check('04_active_member_server_only', d.allowed, true, d.reason);
  }
  // 5. server_only mismatched server denied.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'server_assistant', worldServerId: 's2' }), worldServer: server('u_owner', member('u_other', 'active', 'member')), candidate: candidate({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1' }) });
    check('05_server_mismatch_denied', d.allowed, false, d.reason);
  }
  // 6. inactive member denied for server_only.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'server_assistant', worldServerId: 's1' }), worldServer: server('u_owner', member('u_other', 'pending', 'member')), candidate: candidate({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1' }) });
    check('06_inactive_member_denied', d.allowed, false, d.reason);
  }
  // 7. active member includes matching campaign_only.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'campaign_recap', worldServerId: 's1', campaignId: 'cmp1' }), worldServer: server('u_owner', member('u_other', 'active', 'member')), candidate: candidate({ visibilityScope: 'campaign', aiScope: 'campaign_only', worldServerId: 's1', campaignId: 'cmp1' }) });
    check('07_active_member_campaign_only', d.allowed, true, d.reason);
  }
  // 8. campaign_only mismatched campaign denied.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'campaign_recap', worldServerId: 's1', campaignId: 'cmp2' }), worldServer: server('u_owner', member('u_other', 'active', 'member')), candidate: candidate({ visibilityScope: 'campaign', aiScope: 'campaign_only', worldServerId: 's1', campaignId: 'cmp1' }) });
    check('08_campaign_mismatch_denied', d.allowed, false, d.reason);
  }
  // 9. unauthenticated approved clean active public allowed.
  {
    const d = canIncludeAiContextCandidate({ actor: anon, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }), candidate: candidate({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean', ownerUserId: 'u_owner' }) });
    check('09_anon_public_allowed', d.allowed, true, d.reason);
  }
  // 10. unauthenticated global_public pending review denied.
  {
    const d = canIncludeAiContextCandidate({ actor: anon, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }), candidate: candidate({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'pending', moderationStatus: 'clean' }) });
    check('10_anon_pending_denied', d.allowed, false, d.reason);
  }
  // 11. global_public removed moderation denied.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }), candidate: candidate({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'removed' }) });
    check('11_public_removed_denied', d.allowed, false, d.reason);
  }
  // 12. global_public rights aiContextAllowed=false denied.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }), candidate: candidate({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean', rightsPolicy: { aiContextAllowed: false } }) });
    check('12_public_rights_denied', d.allowed, false, d.reason);
  }
  // 13. owner private_only with rights aiContextAllowed=false still allowed for private owner use.
  {
    const d = canIncludeAiContextCandidate({ actor: owner, requestScope: scope({ purpose: 'character_assistance' }), candidate: candidate({ ownerUserId: 'u_owner', aiScope: 'private_only', visibilityScope: 'user_private', rightsPolicy: { aiContextAllowed: false } }) });
    check('13_owner_private_rights_ok', d.allowed, true, d.reason);
  }
  // 14. public fallback disabled denies unrelated global_public for search_answer.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: false }), candidate: candidate({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean', ownerUserId: 'u_owner' }) });
    check('14_fallback_disabled_denied', d.allowed, false, d.reason);
  }
  // 15. public fallback enabled allows approved public item.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }), candidate: candidate({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean', ownerUserId: 'u_owner' }) });
    check('15_fallback_enabled_allowed', d.allowed, true, d.reason);
  }
  // 16. workshop_assistant denies unrelated server_only content.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'workshop_assistant', worldServerId: 's1' }), worldServer: server('u_owner', null), candidate: candidate({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1' }) });
    check('16_workshop_unrelated_server_denied', d.allowed, false, d.reason);
  }
  // 17. moderation_assistant allows hidden content for moderator.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'moderation_assistant', worldServerId: 's1' }), worldServer: server('u_owner', member('u_other', 'active', 'moderator')), candidate: candidate({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1', moderationStatus: 'hidden' }) });
    check('17_moderation_hidden_moderator_allowed', d.allowed, true, d.reason);
  }
  // 18. moderation_assistant denies hidden content for normal member.
  {
    const d = canIncludeAiContextCandidate({ actor: other, requestScope: scope({ purpose: 'moderation_assistant', worldServerId: 's1' }), worldServer: server('u_owner', member('u_other', 'active', 'member')), candidate: candidate({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1', moderationStatus: 'hidden' }) });
    check('18_moderation_hidden_member_denied', d.allowed, false, d.reason);
  }
  // 19. archived content denied for normal runtime summary.
  {
    const d = canIncludeAiContextCandidate({ actor: owner, requestScope: scope({ purpose: 'runtime_summary' }), candidate: candidate({ ownerUserId: 'u_owner', aiScope: 'private_only', lifecycleStatus: 'archived' }) });
    check('19_archived_denied', d.allowed, false, d.reason);
  }
  // 20. denied items never include body/summary (batch).
  {
    const res = filterAiContextCandidates({
      actor: other,
      requestScope: scope({ purpose: 'search_answer', allowPublicFallback: false }),
      candidates: [candidate({ contextItemId: 'd1', ownerUserId: 'u_owner', aiScope: 'private_only', visibilityScope: 'user_private' })],
    });
    const noLeak = res.deniedItems.every((d) => !('body' in d) && !('summary' in d));
    check('20_denied_no_body_summary', noLeak && res.hasDeniedContent, true);
  }
  // 21. mixed candidate list returns correct counts.
  {
    const res = filterAiContextCandidates({
      actor: owner,
      requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }),
      candidates: [
        candidate({ contextItemId: 'a1', ownerUserId: 'u_owner', aiScope: 'private_only', visibilityScope: 'user_private' }), // allowed (owner)
        candidate({ contextItemId: 'a2', visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean', ownerUserId: 'u_owner' }), // allowed (owner public)
        candidate({ contextItemId: 'd1', ownerUserId: 'u_someone', aiScope: 'disabled' }), // denied
        candidate({ contextItemId: 'd2', ownerUserId: 'u_someone', aiScope: 'private_only', visibilityScope: 'user_private' }), // denied (not owner)
        candidate({ contextItemId: 'd3', visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's9' }), // denied (missing server)
      ],
    });
    check('21_counts_allowed', res.allowedCount === 2, true, `allowed=${res.allowedCount}`);
    check('21_counts_denied', res.deniedCount === 3, true, `denied=${res.deniedCount}`);
    check('21_counts_total', res.totalCandidates === 5, true);
  }
  // 22. unknown item kind denies by default unless resolver allows safe public item.
  {
    const deniedUnknown = canIncludeAiContextCandidate({ actor: owner, requestScope: scope({ purpose: 'other' }), candidate: candidate({ itemKind: 'unknown', ownerUserId: 'u_owner', visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1' }) });
    const allowedUnknownPublic = canIncludeAiContextCandidate({ actor: anon, requestScope: scope({ purpose: 'search_answer', allowPublicFallback: true }), candidate: candidate({ itemKind: 'unknown', visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean', ownerUserId: 'u_owner' }) });
    check('22_unknown_denied', deniedUnknown.allowed, false, deniedUnknown.reason);
    check('22_unknown_public_allowed', allowedUnknownPublic.allowed, true, allowedUnknownPublic.reason);
  }

  const passed = cases.filter((c) => c.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
