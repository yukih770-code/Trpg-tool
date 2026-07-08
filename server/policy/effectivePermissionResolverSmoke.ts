/**
 * Effective Permission Resolver smoke (P5.20) — dependency-free, deterministic.
 *
 * AI-LANDMARK: EFFECTIVE_PERMISSION_RESOLVER_SMOKE_V1
 *
 * A pure self-check for `effectivePermissionResolver`. No DB, no API, no test
 * framework. Call `runEffectivePermissionResolverSmoke()` from a scratch script,
 * devtools, or the verify runner. Asserts the deny-by-default policy invariants.
 */

import {
  canViewContent,
  canEditContent,
  canPublishContent,
  canUseContentInAiContext,
  canManageWorldServer,
  resolveEffectivePermission,
  type PermissionActorContext,
  type PermissionContentContext,
  type PermissionWorldServerContext,
  type PermissionMembershipContext,
  type WorldServerRoleKind,
  type MembershipStatus,
} from './effectivePermissionResolver.js';

export interface PermissionSmokeCase {
  name: string;
  passed: boolean;
  details?: string;
}

export interface PermissionSmokeReport {
  total: number;
  passed: number;
  failed: number;
  cases: PermissionSmokeCase[];
}

const anon: PermissionActorContext = { viewerUserId: null, isAuthenticated: false };
const owner: PermissionActorContext = { viewerUserId: 'u_owner', isAuthenticated: true };
const other: PermissionActorContext = { viewerUserId: 'u_other', isAuthenticated: true };

function content(overrides: Partial<PermissionContentContext>): PermissionContentContext {
  return {
    contentKind: 'smoke_content',
    contentId: 'c1',
    visibilityScope: 'user_private',
    aiScope: 'private_only',
    lifecycleStatus: 'active',
    ...overrides,
  };
}

function server(ownerUserId: string | null, membership: PermissionMembershipContext | null): PermissionWorldServerContext {
  return { worldServerId: 's1', ownerUserId, membership };
}

function member(userId: string, status: MembershipStatus, roleKind: WorldServerRoleKind): PermissionMembershipContext {
  return { userId, membershipStatus: status, roleKind };
}

export function runEffectivePermissionResolverSmoke(): PermissionSmokeReport {
  const cases: PermissionSmokeCase[] = [];
  const check = (name: string, allowed: boolean, expected: boolean, reason?: string) => {
    cases.push({ name, passed: allowed === expected, details: `allowed=${allowed} expected=${expected}${reason ? ` reason=${reason}` : ''}` });
  };

  // 1. unauthenticated may view approved+clean+active global-public.
  {
    const d = canViewContent({ action: 'view', actor: anon, content: content({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean' }) });
    check('01_anon_view_approved_global_public', d.allowed, true, d.reason);
  }
  // 2. unauthenticated cannot view user_private.
  {
    const d = canViewContent({ action: 'view', actor: anon, content: content({ visibilityScope: 'user_private', ownerUserId: 'u_owner' }) });
    check('02_anon_cannot_view_user_private', d.allowed, false, d.reason);
  }
  // 3. owner can view + edit user_private.
  {
    const c = content({ visibilityScope: 'user_private', ownerUserId: 'u_owner' });
    const v = canViewContent({ action: 'view', actor: owner, content: c });
    const e = canEditContent({ action: 'edit', actor: owner, content: c });
    check('03_owner_view_user_private', v.allowed, true, v.reason);
    check('03_owner_edit_user_private', e.allowed, true, e.reason);
  }
  // 4. non-owner cannot view user_private.
  {
    const d = canViewContent({ action: 'view', actor: other, content: content({ visibilityScope: 'user_private', ownerUserId: 'u_owner' }) });
    check('04_non_owner_cannot_view_user_private', d.allowed, false, d.reason);
  }
  // 5. active server member may view server content.
  {
    const d = canViewContent({ action: 'view', actor: other, content: content({ visibilityScope: 'server', ownerUserId: 'u_owner', worldServerId: 's1' }), worldServer: server('u_owner', member('u_other', 'active', 'member')) });
    check('05_active_member_view_server', d.allowed, true, d.reason);
  }
  // 6. pending/suspended/removed member cannot view server content.
  {
    for (const status of ['pending', 'suspended', 'removed'] as MembershipStatus[]) {
      const d = canViewContent({ action: 'view', actor: other, content: content({ visibilityScope: 'server', ownerUserId: 'u_owner', worldServerId: 's1' }), worldServer: server('u_owner', member('u_other', status, 'member')) });
      check(`06_${status}_member_cannot_view_server`, d.allowed, false, d.reason);
    }
  }
  // 7. world-server owner may manage server settings.
  {
    const d = canManageWorldServer({ action: 'manageServerSettings', actor: owner, worldServer: server('u_owner', null) });
    check('07_server_owner_manage_settings', d.allowed, true, d.reason);
  }
  // 8. active admin may manage members + roles.
  {
    const ws = server('u_owner', member('u_other', 'active', 'admin'));
    const m = canManageWorldServer({ action: 'manageMembers', actor: other, worldServer: ws });
    const r = canManageWorldServer({ action: 'manageRoles', actor: other, worldServer: ws });
    check('08_admin_manage_members', m.allowed, true, m.reason);
    check('08_admin_manage_roles', r.allowed, true, r.reason);
  }
  // 9. normal member cannot manage roles.
  {
    const d = canManageWorldServer({ action: 'manageRoles', actor: other, worldServer: server('u_owner', member('u_other', 'active', 'member')) });
    check('09_member_cannot_manage_roles', d.allowed, false, d.reason);
  }
  // 10. moderator may moderate/review but not manage server settings.
  {
    const ws = server('u_owner', member('u_other', 'active', 'moderator'));
    const mod = resolveEffectivePermission({ action: 'moderate', actor: other, worldServer: ws });
    const rev = resolveEffectivePermission({ action: 'reviewPublication', actor: other, worldServer: ws });
    const set = canManageWorldServer({ action: 'manageServerSettings', actor: other, worldServer: ws });
    check('10_moderator_can_moderate', mod.allowed, true, mod.reason);
    check('10_moderator_can_review', rev.allowed, true, rev.reason);
    check('10_moderator_cannot_manage_settings', set.allowed, false, set.reason);
  }
  // 11. global-public + review pending cannot publish to workshop.
  {
    const d = canPublishContent({ action: 'publish', actor: owner, targetSurface: 'workshop', content: content({ ownerUserId: 'u_owner', visibilityScope: 'global_public', aiScope: 'public', workshopPublishAllowed: true, reviewStatus: 'pending', moderationStatus: 'clean', rightsPolicy: { publicSharingAllowed: true } }) });
    check('11_pending_review_cannot_publish', d.allowed, false, d.reason);
  }
  // 12. global-public approved + rights public sharing can publish.
  {
    const d = canPublishContent({ action: 'publish', actor: owner, targetSurface: 'workshop', content: content({ ownerUserId: 'u_owner', visibilityScope: 'global_public', aiScope: 'public', workshopPublishAllowed: true, reviewStatus: 'approved', moderationStatus: 'clean', rightsPolicy: { publicSharingAllowed: true } }) });
    check('12_approved_rights_can_publish', d.allowed, true, d.reason);
  }
  // 13. rights publicSharingAllowed=false cannot publish.
  {
    const d = canPublishContent({ action: 'publish', actor: owner, targetSurface: 'workshop', content: content({ ownerUserId: 'u_owner', visibilityScope: 'global_public', aiScope: 'public', workshopPublishAllowed: true, reviewStatus: 'approved', moderationStatus: 'clean', rightsPolicy: { publicSharingAllowed: false } }) });
    check('13_rights_block_publish', d.allowed, false, d.reason);
  }
  // 14. ai_scope disabled cannot be used in AI context.
  {
    const d = canUseContentInAiContext({ action: 'useInAiContext', actor: owner, content: content({ ownerUserId: 'u_owner', aiScope: 'disabled' }) });
    check('14_ai_disabled_denied', d.allowed, false, d.reason);
  }
  // 15. ai_scope private_only allows owner private AI use.
  {
    const d = canUseContentInAiContext({ action: 'useInAiContext', actor: owner, content: content({ ownerUserId: 'u_owner', aiScope: 'private_only' }) });
    check('15_ai_private_owner_allowed', d.allowed, true, d.reason);
  }
  // 16. ai_scope server_only allows active server member AI use.
  {
    const d = canUseContentInAiContext({ action: 'useInAiContext', actor: other, content: content({ visibilityScope: 'server', aiScope: 'server_only', worldServerId: 's1' }), worldServer: server('u_owner', member('u_other', 'active', 'member')) });
    check('16_ai_server_member_allowed', d.allowed, true, d.reason);
  }
  // 17. ai_scope campaign_only denies with no campaign/server context.
  {
    const d = canUseContentInAiContext({ action: 'useInAiContext', actor: other, content: content({ visibilityScope: 'campaign', aiScope: 'campaign_only' }) });
    check('17_ai_campaign_no_context_denied', d.allowed, false, d.reason);
  }
  // 18. moderation removed/hidden denies public view.
  {
    for (const mstat of ['removed', 'hidden'] as const) {
      const d = canViewContent({ action: 'view', actor: other, content: content({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: mstat }) });
      check(`18_moderation_${mstat}_denies_view`, d.allowed, false, d.reason);
    }
  }
  // 19. lifecycle archived/deleted denies public view.
  {
    for (const lstat of ['archived', 'deleted'] as const) {
      const d = canViewContent({ action: 'view', actor: other, content: content({ visibilityScope: 'global_public', aiScope: 'public', reviewStatus: 'approved', moderationStatus: 'clean', lifecycleStatus: lstat }) });
      check(`19_lifecycle_${lstat}_denies_view`, d.allowed, false, d.reason);
    }
  }
  // 20. unlisted content not available to unauthenticated public viewer.
  {
    const d = canViewContent({ action: 'view', actor: anon, content: content({ visibilityScope: 'unlisted', ownerUserId: 'u_owner' }) });
    check('20_anon_cannot_view_unlisted', d.allowed, false, d.reason);
  }

  const passed = cases.filter((c) => c.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
