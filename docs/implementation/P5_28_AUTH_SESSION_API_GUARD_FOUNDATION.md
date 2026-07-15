# P5.28-P5.31 Auth Session / API Guard / Server Context Foundation

One coherent backend API-boundary contract merging **P5.28 auth session boundary**,
**P5.29 current-viewer context**, **P5.30 request-scope/server-context resolver**, and
**P5.31 API guard foundation** (which calls the P5.20 permission resolver). It prepares
server-side enforcement without retrofitting routes, connecting a frontend, adding a real
auth provider, or touching the DB. Files: `server/auth/requestAuthSession.ts`,
`server/auth/currentViewerContext.ts`, `server/api/apiRequestContext.ts`,
`server/api/apiPermissionGuard.ts`, `server/api/guardedApiHandler.ts`,
`server/api/apiGuardFoundationSmoke.ts`, `server/api/verifyApiGuardFoundation.ts`
(`npm run api:verify:guard`).

## Why after P5.25-P5.27

The DB, policy resolvers, AI-safety pipeline, and migration tooling exist, but there is
no request boundary that says *who* a caller is and *whether* an action is allowed. This
slice adds that chain: request → auth session → viewer context → request scope → guard
(P5.20) → safe HTTP allow/deny — reusable by every future business API.

## Frontend login state is not security

The auth boundary trusts only an explicit service-internal flag or opt-in dev headers;
it never trusts frontend-supplied identity. Anonymous by default; deny by default; the
guard fails closed. Final enforcement is still future API middleware that calls this
guard.

## Auth session boundary (P5.28)

`resolveApiAuthSession(request, options)` → `ApiAuthSession` (`viewerUserId`,
`isAuthenticated`, `trustLevel`, `source`, `notes`). Order: **service-internal** (opt-in
flag) → returns a service caller that is NOT a user (no viewer id, no user permissions);
**dev headers** (`x-dev-user-id` / `x-dev-viewer-user-id`) honored ONLY when
`allowDevAuthHeaders` and `nodeEnv !== 'production'` (`isDevAuthAllowed`); **bearer
token / session cookie** detected but NOT trusted (no verifier) → anonymous with a note;
else **anonymous**. Token values are never placed in notes.

## Current viewer context (P5.29)

`createCurrentViewerContextFromAuthSession` maps the session to a `CurrentViewerContext`
(adds `isDevOnly`, `isServiceInternal`). `toPermissionActorContext` converts to the P5.20
actor shape — service-internal becomes anonymous (`viewerUserId:null,
isAuthenticated:false`) so services never auto-gain user permissions; dev viewers are
authenticated but flagged dev-only.

## Request scope (P5.30)

`resolveApiRequestScope(input)` extracts `worldServerId` / `campaignId` / `roomId` /
`resourceId` / `contentKind` / `contentId` from params/body/query/headers with
**precedence params > body > query > headers** (aliases: `world_server_id`/`serverId`/
`server_id`, `campaign_id`, `room_id`, `content_kind`/`content_id`). It flags a
`*_mismatch` conflict when the same logical field has different values across sources and
sets `safe:false`. `getStringParam(sources, keys)` is the precedence helper. **Scope is
not authorization** and validates no existence.

## API guard (P5.31)

`resolveApiPermissionGuard(input)` → `ApiGuardDecision` (`allowed`, `httpStatus`
200/400/401/403/404, `errorCode`, `publicMessage`, `internalReason`, `notes`). Order:
(1) unsafe request scope → **400 bad_request**; (2) a content action with no content
metadata → **404 guard_not_configured** (fail closed, hide existence); (3) delegate to
P5.20 `resolveEffectivePermission`. `mapPermissionDecisionToApiGuardDecision`:
`denied_unauthenticated` → **401**; otherwise **404** when `hideResourceExistence`, else
**403**. `publicMessage` is always generic ("Authentication required." / "You do not
have access to this resource." / "Resource not found or access denied." / "Invalid
request scope."); the permission reason lives only in `internalReason` (logs). The P5.20
resolver remains the source of truth. `runGuardedApiHandler` (dependency-free) runs a
handler only when allowed, else returns a safe error envelope.

## Smoke cases

`runApiGuardFoundationSmoke()` covers 34+ assertions: auth session (anonymous default,
dev header ignored/accepted/prod-ignored, bearer detected-not-trusted, service-not-user),
viewer context (anon/dev/service mapping), request scope (extraction, alias, precedence,
conflict → unsafe, missing → safe null), guard (unauth 401, owner/admin/moderator/member
boundaries, owner-view allowed, non-owner private 404-hide vs 403, active vs inactive
member, scope-conflict 400, missing-content guard_not_configured, publish rights denial,
AI delegation, generic public message no-leak), and the guarded handler (runs when
allowed, skipped when denied). Run: `npm run api:verify:guard` (`--strict`).

## Not implemented

Real auth provider, JWT verification, OAuth/password login, DB-backed session/account
lookup, business API routes (World Server / Membership / Server Settings CRUD), route
enforcement/middleware retrofit, frontend integration, rate limiting, CSRF/CORS changes,
audit persistence, migration/repository changes.

## Future path

Real auth provider + verifier → DB session/account lookup → World Server / Membership /
Server Settings APIs that call `resolveApiPermissionGuard` in middleware → audit logging
of denials → rate limiting → CSRF/CORS hardening.
