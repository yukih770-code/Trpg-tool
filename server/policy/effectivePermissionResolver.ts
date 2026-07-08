/**
 * Effective Permission Resolver — pure backend policy contract (P5.20).
 *
 * AI-LANDMARK: EFFECTIVE_PERMISSION_RESOLVER_CONTRACT_V1
 *
 * P5.19 stores visibility / rights / review / AI-scope METADATA but enforces nothing.
 * This module is the first *interpreter* of that metadata: given an actor, the target
 * content's visibility/rights/review metadata, and (optionally) a world-server
 * membership/role context, it returns a deterministic allow/deny decision with a
 * reason. It is a CONTRACT for future API guards, the AI Context Scope Guard, workshop
 * publishing, and server moderation — NOT enforcement itself.
 *
 * Hard boundaries: NO database, NO Express/HTTP, NO React, NO browser API, NO model/AI
 * call, NO network, NO server database env vars. Pure types + deterministic functions.
 *
 * Governing principles: deny by default; private by default; AI disabled/private by
 * default; public entry != public data; the Global Public Surface is not a server;
 * frontend permission hints are NOT security — final enforcement must happen in future
 * server-side API guards that call this resolver.
 */

// ── Actions / scopes / roles ─────────────────────────────────────────────────

export type PermissionAction =
  | 'view'
  | 'edit'
  | 'delete'
  | 'manage'
  | 'publish'
  | 'submitForReview'
  | 'reviewPublication'
  | 'moderate'
  | 'inviteMember'
  | 'manageMembers'
  | 'manageRoles'
  | 'manageServerSettings'
  | 'manageGameSystems'
  | 'manageCompendium'
  | 'createCampaign'
  | 'bindCampaign'
  | 'joinRoom'
  | 'useInAiContext';

export type VisibilityScope =
  | 'global_public'
  | 'server'
  | 'campaign'
  | 'user_private'
  | 'unlisted';

export type AiScope =
  | 'public'
  | 'server_only'
  | 'campaign_only'
  | 'private_only'
  | 'disabled';

export type WorldServerRoleKind =
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'member'
  | 'guest'
  | 'custom';

export type MembershipStatus =
  | 'active'
  | 'pending'
  | 'suspended'
  | 'left'
  | 'removed';

export type PublicationTargetSurface =
  | 'workshop'
  | 'fan_plaza'
  | 'public_profile'
  | 'public_template_library'
  | 'announcement_feature'
  | 'other';

// ── Contexts ─────────────────────────────────────────────────────────────────

export interface PermissionActorContext {
  viewerUserId: string | null;
  isAuthenticated: boolean;
}

export interface PermissionRightsPolicyContext {
  policyKind?: string;
  publicSharingAllowed?: boolean;
  redistributionAllowed?: boolean;
  commercialUseAllowed?: boolean;
  derivativeAllowed?: boolean;
  aiContextAllowed?: boolean;
  aiTrainingAllowed?: boolean;
}

export interface PermissionContentContext {
  contentKind: string;
  contentId: string;
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
}

export interface PermissionMembershipContext {
  userId: string;
  membershipStatus: MembershipStatus;
  roleKind?: WorldServerRoleKind;
  roleKey?: string;
  permissionsPayload?: Record<string, unknown>;
}

export interface PermissionWorldServerContext {
  worldServerId?: string | null;
  ownerUserId?: string | null;
  membership?: PermissionMembershipContext | null;
}

export interface ResolveEffectivePermissionInput {
  action: PermissionAction;
  actor: PermissionActorContext;
  content?: PermissionContentContext;
  worldServer?: PermissionWorldServerContext;
  targetSurface?: PublicationTargetSurface;
}

// ── Decision ─────────────────────────────────────────────────────────────────

export type PermissionDecisionReason =
  | 'allowed_owner'
  | 'allowed_world_server_owner'
  | 'allowed_active_member'
  | 'allowed_admin'
  | 'allowed_moderator'
  | 'allowed_global_public'
  | 'allowed_public_review_approved'
  | 'allowed_ai_scope_public'
  | 'allowed_ai_scope_server'
  | 'allowed_ai_scope_campaign'
  | 'denied_unauthenticated'
  | 'denied_not_owner'
  | 'denied_not_member'
  | 'denied_inactive_membership'
  | 'denied_private_scope'
  | 'denied_server_scope'
  | 'denied_campaign_scope'
  | 'denied_ai_disabled'
  | 'denied_ai_scope_mismatch'
  | 'denied_public_flags_false'
  | 'denied_rights_policy'
  | 'denied_review_not_approved'
  | 'denied_moderation_status'
  | 'denied_lifecycle_status'
  | 'denied_unknown_action'
  | 'denied_by_default';

export interface PermissionDecision {
  allowed: boolean;
  reason: PermissionDecisionReason;
  action: PermissionAction;
  visibilityScope?: VisibilityScope;
  aiScope?: AiScope;
  notes: string[];
}

// ── Internal helpers ─────────────────────────────────────────────────────────

interface ServerAuthority {
  isServerOwner: boolean;
  isActiveMember: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  hasInactiveMembership: boolean;
}

const BLOCKING_LIFECYCLE = new Set(['archived', 'deleted']);
const BLOCKING_MODERATION = new Set(['flagged', 'hidden', 'removed']);
const MANAGE_ACTIONS = new Set<PermissionAction>([
  'manage', 'manageMembers', 'manageRoles', 'manageServerSettings', 'manageGameSystems', 'manageCompendium',
]);

function decide(
  allowed: boolean,
  reason: PermissionDecisionReason,
  action: PermissionAction,
  content: PermissionContentContext | undefined,
  notes: string[],
): PermissionDecision {
  return {
    allowed,
    reason,
    action,
    visibilityScope: content?.visibilityScope,
    aiScope: content?.aiScope,
    notes,
  };
}

function computeServerAuthority(
  actor: PermissionActorContext,
  worldServer: PermissionWorldServerContext | undefined,
): ServerAuthority {
  const viewer = actor.viewerUserId;
  const isServerOwner = !!worldServer?.ownerUserId && viewer != null && worldServer.ownerUserId === viewer;
  const membership = worldServer?.membership ?? null;
  const membershipIsViewer = !!membership && viewer != null && membership.userId === viewer;
  const activeMember = membershipIsViewer && membership!.membershipStatus === 'active';
  const roleKind = membership?.roleKind;
  const isAdmin = isServerOwner || (activeMember && roleKind === 'admin');
  const isModerator = isAdmin || (activeMember && roleKind === 'moderator');
  return {
    isServerOwner,
    isActiveMember: isServerOwner || activeMember,
    isAdmin,
    isModerator,
    hasInactiveMembership: membershipIsViewer && membership!.membershipStatus !== 'active',
  };
}

function isOwner(actor: PermissionActorContext, content: PermissionContentContext | undefined): boolean {
  return !!content && content.ownerUserId != null && actor.viewerUserId != null && content.ownerUserId === actor.viewerUserId;
}

function publicFlagForSurface(content: PermissionContentContext, surface: PublicationTargetSurface | undefined): boolean {
  switch (surface) {
    case 'fan_plaza':
      return content.communityFeedAllowed === true;
    case 'public_profile':
      return content.publicProfileAllowed === true;
    case 'workshop':
    case 'public_template_library':
      return content.workshopPublishAllowed === true;
    default:
      return content.publicSearchAllowed === true;
  }
}

// ── View ─────────────────────────────────────────────────────────────────────

function resolveView(input: ResolveEffectivePermissionInput): PermissionDecision {
  const { actor, content, worldServer, action } = input;
  if (!content) return decide(false, 'denied_by_default', action, content, ['No content context provided.']);

  const auth = computeServerAuthority(actor, worldServer);
  if (isOwner(actor, content)) {
    if (content.lifecycleStatus === 'deleted') return decide(false, 'denied_lifecycle_status', action, content, ['Content is deleted.']);
    return decide(true, 'allowed_owner', action, content, ['Owner may view own content.']);
  }

  switch (content.visibilityScope) {
    case 'user_private':
      return decide(false, 'denied_private_scope', action, content, ['user_private content is visible to the owner only.']);
    case 'server':
      if (auth.isActiveMember) return decide(true, auth.isAdmin ? 'allowed_admin' : 'allowed_active_member', action, content, ['Active server member/owner may view server content.']);
      if (auth.hasInactiveMembership) return decide(false, 'denied_inactive_membership', action, content, ['Membership is not active.']);
      return decide(false, 'denied_server_scope', action, content, ['Server content requires an active membership.']);
    case 'campaign':
      if (auth.isActiveMember) return decide(true, auth.isAdmin ? 'allowed_admin' : 'allowed_active_member', action, content, ['Active member/owner may view campaign content (exact campaign membership is future work).']);
      if (auth.hasInactiveMembership) return decide(false, 'denied_inactive_membership', action, content, ['Membership is not active.']);
      return decide(false, 'denied_campaign_scope', action, content, ['Campaign content requires owner or active membership.']);
    case 'unlisted':
      if (auth.isActiveMember) return decide(true, auth.isAdmin ? 'allowed_admin' : 'allowed_active_member', action, content, ['Unlisted content accessible to owner/active member by reference.']);
      if (!actor.isAuthenticated) return decide(false, 'denied_unauthenticated', action, content, ['Unlisted content is not public; sign-in and access required.']);
      return decide(false, 'denied_private_scope', action, content, ['Unlisted content requires owner or membership context.']);
    case 'global_public': {
      if (content.lifecycleStatus && BLOCKING_LIFECYCLE.has(content.lifecycleStatus)) return decide(false, 'denied_lifecycle_status', action, content, ['Global-public content is not active.']);
      if (content.moderationStatus && BLOCKING_MODERATION.has(content.moderationStatus)) return decide(false, 'denied_moderation_status', action, content, ['Content moderation blocks public view.']);
      if (!actor.isAuthenticated) {
        if (content.reviewStatus === 'approved' && content.moderationStatus === 'clean') {
          return decide(true, 'allowed_global_public', action, content, ['Unauthenticated viewer may view approved, clean, active global-public content.']);
        }
        return decide(false, 'denied_review_not_approved', action, content, ['Unauthenticated viewers see only approved, clean global-public content.']);
      }
      return decide(true, 'allowed_global_public', action, content, ['Authenticated viewer may view active, non-blocked global-public content.']);
    }
    default:
      return decide(false, 'denied_by_default', action, content, ['Unknown visibility scope.']);
  }
}

// ── Edit / delete ────────────────────────────────────────────────────────────

function resolveEditOrDelete(input: ResolveEffectivePermissionInput): PermissionDecision {
  const { actor, content, worldServer, action } = input;
  if (!content) return decide(false, 'denied_by_default', action, content, ['No content context provided.']);
  if (isOwner(actor, content)) {
    if (content.lifecycleStatus === 'deleted') return decide(false, 'denied_lifecycle_status', action, content, ['Content is deleted.']);
    return decide(true, 'allowed_owner', action, content, ['Owner may edit/delete own content.']);
  }
  const auth = computeServerAuthority(actor, worldServer);
  if ((content.visibilityScope === 'server' || content.visibilityScope === 'campaign') && auth.isAdmin) {
    return decide(true, auth.isServerOwner ? 'allowed_world_server_owner' : 'allowed_admin', action, content, ['Server owner/admin may edit server/campaign content.']);
  }
  return decide(false, 'denied_not_owner', action, content, ['Only the owner (or server owner/admin for server content) may edit/delete.']);
}

// ── Server management group ────────────────────────────────────────────────────

function resolveServerManagement(input: ResolveEffectivePermissionInput): PermissionDecision {
  const { actor, worldServer, content, action } = input;
  if (!actor.isAuthenticated || actor.viewerUserId == null) return decide(false, 'denied_unauthenticated', action, content, ['Authentication required.']);
  const auth = computeServerAuthority(actor, worldServer);
  if (auth.isServerOwner) return decide(true, 'allowed_world_server_owner', action, content, ['World-server owner may manage the server.']);
  if (auth.isAdmin) return decide(true, 'allowed_admin', action, content, ['Active admin may manage the server.']);
  if (auth.hasInactiveMembership) return decide(false, 'denied_inactive_membership', action, content, ['Membership is not active.']);
  return decide(false, 'denied_not_member', action, content, ['Server management requires owner or active admin.']);
}

// ── Moderation / review ────────────────────────────────────────────────────────

function resolveModeration(input: ResolveEffectivePermissionInput): PermissionDecision {
  const { actor, worldServer, content, action } = input;
  if (!actor.isAuthenticated || actor.viewerUserId == null) return decide(false, 'denied_unauthenticated', action, content, ['Authentication required.']);
  const auth = computeServerAuthority(actor, worldServer);
  if (auth.isServerOwner) return decide(true, 'allowed_world_server_owner', action, content, ['Owner may moderate/review.']);
  if (auth.isAdmin) return decide(true, 'allowed_admin', action, content, ['Admin may moderate/review.']);
  if (auth.isModerator) return decide(true, 'allowed_moderator', action, content, ['Moderator may moderate/review.']);
  if (auth.hasInactiveMembership) return decide(false, 'denied_inactive_membership', action, content, ['Membership is not active.']);
  return decide(false, 'denied_not_member', action, content, ['Moderation/review requires owner/admin/moderator.']);
}

// ── Publish / submitForReview ───────────────────────────────────────────────────

function resolvePublish(input: ResolveEffectivePermissionInput): PermissionDecision {
  const { actor, content, worldServer, action, targetSurface } = input;
  if (!content) return decide(false, 'denied_by_default', action, content, ['No content context provided.']);
  const auth = computeServerAuthority(actor, worldServer);
  const ownerOrAdmin = isOwner(actor, content) || auth.isAdmin;
  if (!ownerOrAdmin) return decide(false, 'denied_not_owner', action, content, ['Only the owner or a server admin may submit/publish.']);

  const isSubmit = action === 'submitForReview';
  if (!publicFlagForSurface(content, targetSurface)) {
    return decide(false, 'denied_public_flags_false', action, content, ['Public flag for the target surface is false.']);
  }
  if (!(content.rightsPolicy && content.rightsPolicy.publicSharingAllowed === true)) {
    return decide(false, 'denied_rights_policy', action, content, ['Rights policy does not allow public sharing.']);
  }
  if (isSubmit) {
    // Submitting for review does not require prior approval.
    return decide(true, 'allowed_owner', action, content, ['Owner/admin may submit for review (public sharing permitted).']);
  }
  if (content.reviewStatus !== 'approved') {
    return decide(false, 'denied_review_not_approved', action, content, ['Publishing requires an approved review.']);
  }
  if (content.moderationStatus && content.moderationStatus !== 'clean' && content.moderationStatus !== 'not_reviewed') {
    return decide(false, 'denied_moderation_status', action, content, ['Moderation status blocks publishing.']);
  }
  if (content.lifecycleStatus && BLOCKING_LIFECYCLE.has(content.lifecycleStatus)) {
    return decide(false, 'denied_lifecycle_status', action, content, ['Content is not active.']);
  }
  return decide(true, 'allowed_public_review_approved', action, content, ['Approved + public-sharing rights + clean moderation permits publishing.']);
}

// ── AI context use ──────────────────────────────────────────────────────────────

function resolveAiContext(input: ResolveEffectivePermissionInput): PermissionDecision {
  const { actor, content, worldServer, action } = input;
  if (!content) return decide(false, 'denied_by_default', action, content, ['No content context provided.']);
  if (content.aiScope === 'disabled') return decide(false, 'denied_ai_disabled', action, content, ['ai_scope is disabled.']);

  const owner = isOwner(actor, content);
  const auth = computeServerAuthority(actor, worldServer);

  if (content.aiScope === 'private_only') {
    if (owner) return decide(true, 'allowed_owner', action, content, ['Owner may use private content in their own AI context.']);
    return decide(false, 'denied_ai_scope_mismatch', action, content, ['private_only AI content is owner-only.']);
  }

  // Rights gate for any non-private AI use.
  if (content.rightsPolicy && content.rightsPolicy.aiContextAllowed === false) {
    return decide(false, 'denied_rights_policy', action, content, ['Rights policy forbids AI context use.']);
  }

  switch (content.aiScope) {
    case 'public':
      return decide(true, 'allowed_ai_scope_public', action, content, ['Public AI scope permits AI context use.']);
    case 'server_only':
      if (auth.isActiveMember) return decide(true, 'allowed_ai_scope_server', action, content, ['Active server member/owner may use server-scoped AI content.']);
      return decide(false, 'denied_ai_scope_mismatch', action, content, ['server_only AI content requires active server membership.']);
    case 'campaign_only':
      if (content.campaignId != null && (owner || auth.isActiveMember)) return decide(true, 'allowed_ai_scope_campaign', action, content, ['Campaign AI scope permits use with campaign context.']);
      return decide(false, 'denied_ai_scope_mismatch', action, content, ['campaign_only AI content requires campaign context (owner/active member).']);
    default:
      return decide(false, 'denied_ai_scope_mismatch', action, content, ['AI scope not compatible with actor context.']);
  }
}

// ── Membership / campaign / room actions ───────────────────────────────────────

function resolveInviteMember(input: ResolveEffectivePermissionInput): PermissionDecision {
  // Owner/admin only for now; role permission payload interpretation is future work.
  return resolveServerManagement(input);
}

function resolveCreateCampaign(input: ResolveEffectivePermissionInput): PermissionDecision {
  const { actor, worldServer, content, action } = input;
  if (!actor.isAuthenticated || actor.viewerUserId == null) return decide(false, 'denied_unauthenticated', action, content, ['Authentication required.']);
  // Personal campaign (no world-server context) is allowed for any authenticated user.
  if (!worldServer || (worldServer.ownerUserId == null && (worldServer.membership == null))) {
    return decide(true, 'allowed_owner', action, content, ['Authenticated user may create a personal campaign.']);
  }
  const auth = computeServerAuthority(actor, worldServer);
  if (auth.isActiveMember) return decide(true, auth.isServerOwner ? 'allowed_world_server_owner' : auth.isAdmin ? 'allowed_admin' : 'allowed_active_member', action, content, ['Active member/owner/admin may create a campaign in the server.']);
  if (auth.hasInactiveMembership) return decide(false, 'denied_inactive_membership', action, content, ['Membership is not active.']);
  return decide(false, 'denied_not_member', action, content, ['Creating a server campaign requires active membership.']);
}

function resolveBindCampaign(input: ResolveEffectivePermissionInput): PermissionDecision {
  // Binding a campaign to a server is an owner/admin operation.
  return resolveServerManagement(input);
}

function resolveJoinRoom(input: ResolveEffectivePermissionInput): PermissionDecision {
  const { actor, worldServer, content, action } = input;
  if (!actor.isAuthenticated || actor.viewerUserId == null) return decide(false, 'denied_unauthenticated', action, content, ['Authentication required.']);
  const auth = computeServerAuthority(actor, worldServer);
  if (auth.isActiveMember) return decide(true, auth.isServerOwner ? 'allowed_world_server_owner' : 'allowed_active_member', action, content, ['Active member/owner may join the room.']);
  if (auth.hasInactiveMembership) return decide(false, 'denied_inactive_membership', action, content, ['Membership is not active.']);
  return decide(false, 'denied_not_member', action, content, ['Joining requires active membership (public-room policy is future work).']);
}

// ── Dispatcher + convenience wrappers ──────────────────────────────────────────

export function resolveEffectivePermission(input: ResolveEffectivePermissionInput): PermissionDecision {
  switch (input.action) {
    case 'view':
      return resolveView(input);
    case 'edit':
    case 'delete':
      return resolveEditOrDelete(input);
    case 'publish':
    case 'submitForReview':
      return resolvePublish(input);
    case 'reviewPublication':
    case 'moderate':
      return resolveModeration(input);
    case 'inviteMember':
      return resolveInviteMember(input);
    case 'manage':
    case 'manageMembers':
    case 'manageRoles':
    case 'manageServerSettings':
    case 'manageGameSystems':
    case 'manageCompendium':
      return resolveServerManagement(input);
    case 'createCampaign':
      return resolveCreateCampaign(input);
    case 'bindCampaign':
      return resolveBindCampaign(input);
    case 'joinRoom':
      return resolveJoinRoom(input);
    case 'useInAiContext':
      return resolveAiContext(input);
    default:
      return decide(false, 'denied_unknown_action', input.action, input.content, ['Unknown action denied by default.']);
  }
}

export function canViewContent(input: ResolveEffectivePermissionInput): PermissionDecision {
  return resolveView({ ...input, action: 'view' });
}

export function canEditContent(input: ResolveEffectivePermissionInput): PermissionDecision {
  return resolveEditOrDelete({ ...input, action: 'edit' });
}

export function canPublishContent(input: ResolveEffectivePermissionInput): PermissionDecision {
  return resolvePublish({ ...input, action: 'publish' });
}

export function canUseContentInAiContext(input: ResolveEffectivePermissionInput): PermissionDecision {
  return resolveAiContext({ ...input, action: 'useInAiContext' });
}

export function canManageWorldServer(input: ResolveEffectivePermissionInput): PermissionDecision {
  const action: PermissionAction = MANAGE_ACTIONS.has(input.action) ? input.action : 'manageServerSettings';
  return resolveServerManagement({ ...input, action });
}

/**
 * Placeholder for future custom role-permission interpretation. In this slice custom
 * `permissions_payload` is NOT interpreted — it always returns false, so callers fall
 * back to owner/admin/moderator defaults. Future work: a role permission interpreter.
 */
export function customPermissionGrants(
  _membership: PermissionMembershipContext | null | undefined,
  _action: PermissionAction,
): boolean {
  return false;
}
