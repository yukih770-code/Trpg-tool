/**
 * Auth Session / API Guard foundation smoke (P5.28-P5.31) — dependency-free.
 *
 * AI-LANDMARK: API_GUARD_FOUNDATION_SMOKE_V1
 *
 * Pure self-check across auth session → viewer context → request scope → API guard →
 * guarded handler. No DB, no API server, no model, no test framework. Call
 * `runApiGuardFoundationSmoke()`.
 */

import {
  resolveApiAuthSession,
  isDevAuthAllowed,
} from '../auth/requestAuthSession.js';
import {
  createCurrentViewerContextFromAuthSession,
  toPermissionActorContext,
  type CurrentViewerContext,
} from '../auth/currentViewerContext.js';
import { resolveApiRequestScope } from './apiRequestContext.js';
import {
  resolveApiPermissionGuard,
  type ApiGuardAction,
} from './apiPermissionGuard.js';
import { runGuardedApiHandler } from './guardedApiHandler.js';
import type {
  PermissionContentContext,
  PermissionWorldServerContext,
  PermissionMembershipContext,
  MembershipStatus,
  WorldServerRoleKind,
} from '../policy/effectivePermissionResolver.js';

export interface ApiGuardSmokeCase {
  name: string;
  passed: boolean;
  details?: string;
}

export interface ApiGuardSmokeReport {
  total: number;
  passed: number;
  failed: number;
  cases: ApiGuardSmokeCase[];
}

function viewerOf(id: string): CurrentViewerContext {
  return { viewerUserId: id, isAuthenticated: true, authTrustLevel: 'verified_session', isDevOnly: false, isServiceInternal: false, notes: [] };
}
const anonViewer: CurrentViewerContext = { viewerUserId: null, isAuthenticated: false, authTrustLevel: 'anonymous', isDevOnly: false, isServiceInternal: false, notes: [] };

function member(userId: string, status: MembershipStatus, roleKind: WorldServerRoleKind): PermissionMembershipContext {
  return { userId, membershipStatus: status, roleKind };
}
function server(ownerUserId: string | null, membership: PermissionMembershipContext | null): PermissionWorldServerContext {
  return { worldServerId: 's1', ownerUserId, membership };
}
function content(overrides: Partial<PermissionContentContext>): PermissionContentContext {
  return { contentKind: 'smoke', contentId: 'c1', visibilityScope: 'user_private', aiScope: 'private_only', lifecycleStatus: 'active', ...overrides };
}

export function runApiGuardFoundationSmoke(): ApiGuardSmokeReport {
  const cases: ApiGuardSmokeCase[] = [];
  const check = (name: string, actual: boolean, expected: boolean, details?: string) => {
    cases.push({ name, passed: actual === expected, details: `actual=${actual} expected=${expected}${details ? ` ${details}` : ''}` });
  };

  // ── Auth session ──────────────────────────────────────────────────────────
  check('01_no_headers_anonymous', resolveApiAuthSession({}).trustLevel === 'anonymous', true);
  check('02_dev_header_ignored_default', resolveApiAuthSession({ headers: { 'x-dev-user-id': 'u1' } }).isAuthenticated === false, true);
  {
    const s = resolveApiAuthSession({ headers: { 'x-dev-user-id': 'u1' } }, { allowDevAuthHeaders: true, nodeEnv: 'development' });
    check('03_dev_header_accepted', s.isAuthenticated === true && s.viewerUserId === 'u1' && s.trustLevel === 'dev_header', true);
  }
  check('04_dev_header_ignored_in_prod', resolveApiAuthSession({ headers: { 'x-dev-user-id': 'u1' } }, { allowDevAuthHeaders: true, nodeEnv: 'production' }).isAuthenticated === false, true);
  {
    const s = resolveApiAuthSession({ headers: { authorization: 'Bearer abc.def' } });
    check('05_bearer_detected_not_trusted', s.isAuthenticated === false && s.viewerUserId === null, true);
  }
  {
    const s = resolveApiAuthSession({}, { serviceTokenAccepted: true });
    check('06_service_internal_not_user', s.trustLevel === 'service_internal' && s.viewerUserId === null, true);
  }
  check('dev_allowed_helper', isDevAuthAllowed({ allowDevAuthHeaders: true, nodeEnv: 'development' }) === true && isDevAuthAllowed({ allowDevAuthHeaders: true, nodeEnv: 'production' }) === false, true);

  // ── Viewer context ────────────────────────────────────────────────────────
  {
    const viewer = createCurrentViewerContextFromAuthSession(resolveApiAuthSession({}));
    const actor = toPermissionActorContext(viewer);
    check('07_anon_actor_unauthenticated', actor.viewerUserId === null && actor.isAuthenticated === false, true);
  }
  {
    const viewer = createCurrentViewerContextFromAuthSession(resolveApiAuthSession({ headers: { 'x-dev-user-id': 'u1' } }, { allowDevAuthHeaders: true, nodeEnv: 'development' }));
    const actor = toPermissionActorContext(viewer);
    check('08_dev_actor_authenticated_devonly', actor.isAuthenticated === true && actor.viewerUserId === 'u1' && viewer.isDevOnly === true, true);
  }
  {
    const viewer = createCurrentViewerContextFromAuthSession(resolveApiAuthSession({}, { serviceTokenAccepted: true }));
    const actor = toPermissionActorContext(viewer);
    check('08b_service_actor_anonymous', actor.viewerUserId === null && actor.isAuthenticated === false && viewer.isServiceInternal === true, true);
  }

  // ── Request scope ─────────────────────────────────────────────────────────
  check('09_params_worldServerId', resolveApiRequestScope({ params: { worldServerId: 's1' } }).scope.worldServerId === 's1', true);
  check('10_body_campaignId', resolveApiRequestScope({ body: { campaign_id: 'cmp1' } }).scope.campaignId === 'cmp1', true);
  check('11_query_roomId', resolveApiRequestScope({ query: { roomId: 'r1' } }).scope.roomId === 'r1', true);
  {
    const r = resolveApiRequestScope({ params: { worldServerId: 's_params' }, body: { worldServerId: 's_body' } });
    check('12_params_precedence', r.scope.worldServerId === 's_params', true);
    check('13_conflict_detected', r.conflicts.includes('world_server_mismatch'), true);
    check('14_conflict_unsafe', r.safe === false, true);
  }
  {
    const r = resolveApiRequestScope({ params: { contentKind: 'actor', contentId: 'a1' } });
    check('15_content_extracted', r.scope.contentKind === 'actor' && r.scope.contentId === 'a1', true);
  }
  {
    const r = resolveApiRequestScope({});
    check('16_missing_scope_safe_null', r.safe === true && r.scope.worldServerId === null, true);
  }

  // ── API guard ─────────────────────────────────────────────────────────────
  const action = (a: ApiGuardAction) => a;
  check('17_unauth_manage_settings_401', resolveApiPermissionGuard({ action: action('manageServerSettings'), viewer: anonViewer, worldServer: server('u_owner', null) }).httpStatus === 401, true);
  check('18_owner_manage_settings_allowed', resolveApiPermissionGuard({ action: action('manageServerSettings'), viewer: viewerOf('u_owner'), worldServer: server('u_owner', null) }).allowed === true, true);
  check('19_admin_manage_roles_allowed', resolveApiPermissionGuard({ action: action('manageRoles'), viewer: viewerOf('u_admin'), worldServer: server('u_owner', member('u_admin', 'active', 'admin')) }).allowed === true, true);
  {
    const d = resolveApiPermissionGuard({ action: action('manageRoles'), viewer: viewerOf('u_member'), worldServer: server('u_owner', member('u_member', 'active', 'member')) });
    check('20_member_manage_roles_forbidden', d.allowed === false && d.httpStatus === 403, true);
  }
  check('21_moderator_moderate_allowed', resolveApiPermissionGuard({ action: action('moderate'), viewer: viewerOf('u_mod'), worldServer: server('u_owner', member('u_mod', 'active', 'moderator')) }).allowed === true, true);
  check('22_moderator_manage_settings_forbidden', resolveApiPermissionGuard({ action: action('manageServerSettings'), viewer: viewerOf('u_mod'), worldServer: server('u_owner', member('u_mod', 'active', 'moderator')) }).allowed === false, true);
  check('23_owner_view_private_allowed', resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_owner'), content: content({ ownerUserId: 'u_owner', visibilityScope: 'user_private' }) }).allowed === true, true);
  check('24_non_owner_private_404_hide', resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_other'), content: content({ ownerUserId: 'u_owner', visibilityScope: 'user_private' }), hideResourceExistence: true }).httpStatus === 404, true);
  check('25_non_owner_private_403_no_hide', resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_other'), content: content({ ownerUserId: 'u_owner', visibilityScope: 'user_private' }), hideResourceExistence: false }).httpStatus === 403, true);
  check('26_active_member_view_server_allowed', resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_member'), content: content({ visibilityScope: 'server', worldServerId: 's1' }), worldServer: server('u_owner', member('u_member', 'active', 'member')) }).allowed === true, true);
  check('27_inactive_member_view_server_safe', resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_member'), content: content({ visibilityScope: 'server', worldServerId: 's1' }), worldServer: server('u_owner', member('u_member', 'pending', 'member')), hideResourceExistence: true }).allowed === false, true);
  {
    const scopeResult = resolveApiRequestScope({ params: { worldServerId: 'a' }, body: { worldServerId: 'b' } });
    const d = resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_owner'), requestScope: scopeResult, content: content({ ownerUserId: 'u_owner' }) });
    check('28_scope_conflict_400', d.httpStatus === 400 && d.errorCode === 'bad_request', true);
  }
  {
    const d = resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_owner') });
    check('29_missing_content_guard_not_configured', d.allowed === false && d.errorCode === 'guard_not_configured', true);
  }
  check('30_publish_rights_false_denied', resolveApiPermissionGuard({ action: action('publish'), viewer: viewerOf('u_owner'), targetSurface: 'workshop', content: content({ ownerUserId: 'u_owner', visibilityScope: 'global_public', aiScope: 'public', workshopPublishAllowed: true, reviewStatus: 'approved', moderationStatus: 'clean', rightsPolicy: { publicSharingAllowed: false } }) }).allowed === false, true);
  check('31_ai_context_delegates_allowed', resolveApiPermissionGuard({ action: action('useInAiContext'), viewer: viewerOf('u_owner'), content: content({ ownerUserId: 'u_owner', aiScope: 'private_only' }) }).allowed === true, true);
  {
    const d = resolveApiPermissionGuard({ action: action('manageRoles'), viewer: viewerOf('u_member'), worldServer: server('u_owner', member('u_member', 'active', 'member')) });
    const generic = d.publicMessage === 'You do not have access to this resource.';
    const noLeak = !!d.publicMessage && !d.publicMessage.includes(d.internalReason);
    check('32_public_message_no_internal_reason', generic && noLeak && d.internalReason.includes('denied'), true);
  }

  // ── Guarded handler ───────────────────────────────────────────────────────
  {
    const state: { ran: boolean } = { ran: false };
    const allowed = resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_owner'), content: content({ ownerUserId: 'u_owner' }) });
    void runGuardedApiHandler({ request: {}, guard: allowed, handle: () => { state.ran = true; return 'ok'; } });
    check('33_handler_runs_when_allowed', state.ran === true, true);
  }
  {
    const state: { ran: boolean } = { ran: false };
    const denied = resolveApiPermissionGuard({ action: action('view'), viewer: viewerOf('u_other'), content: content({ ownerUserId: 'u_owner', visibilityScope: 'user_private' }), hideResourceExistence: true });
    void runGuardedApiHandler({ request: {}, guard: denied, handle: () => { state.ran = true; return 'ok'; } });
    check('34_handler_skipped_when_denied', state.ran === false, true);
  }

  const passed = cases.filter((c) => c.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
