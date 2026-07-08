# P5.20 Effective Permission Resolver — Contract

Pure backend policy contract that *interprets* the P5.19 visibility / rights / review /
AI-scope metadata into deterministic allow/deny decisions. **A contract for future
enforcement, not enforcement itself.** No DB, no HTTP, no React, no AI, no network.
Files: `server/policy/effectivePermissionResolver.ts`,
`server/policy/effectivePermissionResolverSmoke.ts`,
`server/policy/verifyEffectivePermissionResolver.ts` (`npm run policy:verify:permission`).

## Why P5.20 follows P5.19

P5.19 stores `visibility_scope`, `ai_scope`, rights flags, `review_status`,
`moderation_status`, and membership/role metadata but **enforces nothing**. Before any
API guard, AI Context Scope Guard, workshop publish flow, or moderation tool can act,
there must be **one deterministic interpreter** of that metadata. P5.20 is that
interpreter — a single source of truth callers reuse so policy stays consistent.

## Metadata vs enforcement · deny by default

The resolver is a pure function: `resolveEffectivePermission(input) → PermissionDecision`.
It never reads the DB and never blocks a request; it only says *whether* an action
should be allowed given already-fetched metadata. **Deny by default, private by
default, AI disabled/private by default.** Frontend permission hints are not security —
final enforcement must be a future server-side API guard that calls this resolver.

## Permission model

- **Actor** (`PermissionActorContext`): `viewerUserId`, `isAuthenticated`.
- **Content** (`PermissionContentContext`): generic ref (`contentKind`/`contentId`),
  `ownerUserId`, optional `worldServerId`/`campaignId`, `visibilityScope`, `aiScope`,
  the four public flags, `reviewStatus`, `moderationStatus`, `lifecycleStatus`, and an
  optional `rightsPolicy`.
- **World server** (`PermissionWorldServerContext`): `ownerUserId` + the viewer's
  `membership` (status + `roleKind`). Server authority is computed as owner / active
  admin / active moderator / active member / inactive-membership.
- **Rights** (`PermissionRightsPolicyContext`): `publicSharingAllowed`,
  `aiContextAllowed`, etc. — interpreted only for publish and non-private AI use.

`resolveEffectivePermission` returns `{ allowed, reason, action, visibilityScope,
aiScope, notes }` with a fixed `PermissionDecisionReason` union.

## Resolver rules (deny by default)

- **view**: owner always (unless `deleted`). `user_private` → owner only. `server` /
  `campaign` → active member/owner (inactive membership → `denied_inactive_membership`).
  `unlisted` → owner/active member, never anonymous. `global_public` → requires active
  lifecycle + non-blocking moderation; unauthenticated viewers additionally require
  `review approved` + `moderation clean`.
- **edit/delete**: owner, or server owner/admin for server/campaign content.
- **publish/submitForReview**: owner or server admin; the target-surface public flag
  must be true; rights must allow public sharing; **publish** additionally requires
  `review approved` + clean moderation + active lifecycle. **submitForReview** does not
  require prior approval.
- **moderate/reviewPublication**: owner/admin/moderator.
- **manage*** (settings/members/roles/game-systems/compendium) + **inviteMember** +
  **bindCampaign**: world-server owner or active admin.
- **createCampaign**: authenticated user for a personal campaign; active
  member/owner/admin for a server campaign.
- **joinRoom**: active member/owner (public-room policy is future work).
- **useInAiContext**: `disabled` → always denied; `private_only` → owner only (bypasses
  rights); otherwise rights `aiContextAllowed` must not be false, then `public` →
  allowed, `server_only` → active member/owner, `campaign_only` → owner/active member
  with campaign context.
- **unknown action** → `denied_unknown_action`.

Custom role `permissions_payload` is **not interpreted** in this slice
(`customPermissionGrants` is a placeholder returning false); callers fall back to
owner/admin/moderator defaults.

## Convenience wrappers · smoke

Wrappers: `canViewContent`, `canEditContent`, `canPublishContent`,
`canUseContentInAiContext`, `canManageWorldServer`. `runEffectivePermissionResolverSmoke()`
covers the 20 required cases: anon view of approved/clean/active global-public;
user_private owner-only; server-scope active vs pending/suspended/removed membership;
owner/admin/moderator/member management boundaries; publish gated by review + rights;
AI-scope disabled/private/server/campaign; moderation removed/hidden and lifecycle
archived/deleted deny public view; unlisted not anonymous. Run:
`npm run policy:verify:permission` (add `--strict` to fail on any case).

## Explicitly not implemented

DB queries, API middleware / Express route guards, frontend UI / route protection,
enforcement in existing routes, AI context retrieval, AI Context Scope Guard, workshop/
fan-plaza publish workflow, public feed integration, moderation UI, campaign membership
DB, custom `permissions_payload` interpreter (placeholder only), audit logging, new SQL
migration, repository changes, runtime/WebSocket changes.

## Future path

API guards (call this resolver server-side) → AI Context Scope Guard (calls
`canUseContentInAiContext` before retrieval) → public feed query guards → workshop/
community publish workflow → campaign membership model → role permission-payload
interpreter → audit logging.
