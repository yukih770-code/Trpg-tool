# P5.21 AI Context Scope Guard — Contract

Pure backend guard that every future AI feature must call before content enters an AI
context window. It filters already-fetched candidate items by visibility/rights/AI
metadata + viewer/server/campaign context, reusing the P5.20 permission resolver, and
returns allowed items (with body), denied items (**redacted — never body/summary**),
and reasons. **A contract for future enforcement, not enforcement itself.** No DB, no
HTTP, no React, no model, no network. Files:
`server/policy/aiContextScopeGuard.ts`, `server/policy/aiContextScopeGuardSmoke.ts`,
`server/policy/verifyAiContextScopeGuard.ts` (`npm run policy:verify:ai-scope`).

## Why P5.21 follows P5.20

P5.20 decides "can this viewer use this content in AI context?" for one item. P5.21 is
the **batch gate** that a retrieval/AI-Gateway layer calls with a set of candidates: it
applies P5.20 per item and adds request-scope, purpose, public-fallback, and redaction
rules so that **AI never becomes a shortcut around visibility or rights**. If a viewer
cannot view/use content, the AI must not receive it.

## AI must not bypass visibility/rights

Every candidate is checked against the same visibility_scope / ai_scope / rights /
review / moderation / lifecycle metadata a human viewer is checked against — the AI has
no elevated access. Denied content is **redacted**: the `AiContextDeniedItem` carries
only ids/kind/title/scope/reason/notes, **never body or summary**, so denial diagnostics
can be logged without leaking the content.

## Candidate filtering model

`filterAiContextCandidates({ actor, requestScope, worldServer, candidates })` →
`AiContextScopeGuardResult` with `allowedItems` (body/summary/metadata included),
`deniedItems` (redacted), counts, `hasDeniedContent`, and diagnostics
(`redactedDeniedBodies: true`, `denyByDefault: true`). `canIncludeAiContextCandidate`
returns the per-item `AiContextCandidateDecision`; `redactDeniedAiContextCandidate`
builds the redacted denied item.

**Request scope** (`AiContextRequestScope`): `purpose`, `worldServerId`, `campaignId`,
`roomId`, `allowPublicFallback`, `includeDeniedDiagnostics`.

## Rule order (deny by default)

1. `ai_scope === 'disabled'` → always denied.
2. lifecycle `deleted` → denied; `archived` → denied unless `moderation_assistant` +
   moderator/admin/owner.
3. moderation `hidden`/`removed` → denied unless `moderation_assistant` +
   moderator/admin/owner.
4. `itemKind === 'unknown'` → denied unless it is a safe public item (`global_public` +
   `public`).
5. `private_only` → requires owner (explicit `denied_private_without_owner`).
6. unauthenticated viewer → only approved + clean + active `global_public` + `public` +
   rights not-forbidding-AI may pass.
7. server-scoped candidate must match `requestScope.worldServerId`
   (`denied_missing_required_server` / `denied_server_mismatch`); campaign-scoped must
   match `requestScope.campaignId` (`denied_missing_required_campaign` /
   `denied_campaign_mismatch`).
8. **P5.20 `canUseContentInAiContext`** is the core check; a denial maps to
   `denied_rights_policy` / `denied_scope_mismatch` / `denied_ai_scope_disabled` /
   `denied_by_permission_resolver`.
9. `workshop_assistant` → excludes non-public content the viewer is unrelated to.
10. an unrelated public item requires explicit `allowPublicFallback` for authenticated
    viewers (`denied_public_fallback_disabled`).

## ai_scope interpretation

`public` (any viewer, subject to rights + fallback), `server_only` (active member/owner
of the matching server), `campaign_only` (owner/active member with matching campaign),
`private_only` (owner only — bypasses the rights gate), `disabled` (always denied).

## Rights / review / moderation / lifecycle

Rights `aiContextAllowed === false` denies AI use for any non-private path (owner
private use bypasses it). `review_status` pending/rejected blocks the unauthenticated
public path. moderation `hidden`/`removed` and lifecycle `archived`/`deleted` are
excluded except for the moderation purpose with moderator authority.

## Relationship to P5.20

The guard imports P5.20's `canUseContentInAiContext` and its context types, builds a
`PermissionContentContext` from each candidate, and treats the resolver as the source of
truth for the ownership/scope/rights decision — then layers batch/redaction/scope-match/
public-fallback concerns the resolver does not model.

## Smoke cases

`runAiContextScopeGuardSmoke()` covers 22+ cases: owner private include; non-owner
private deny + redaction; disabled deny; server_only match/mismatch/inactive; campaign_only
match/mismatch; unauthenticated approved-public allow vs pending deny; public removed
moderation deny; public rights-forbidden deny; owner-private rights-forbidden still allow;
public fallback disabled/enabled; workshop_assistant unrelated deny; moderation_assistant
hidden allow (moderator) vs deny (member); archived deny; denied-items-have-no-body;
mixed-list counts; unknown-kind deny vs safe-public allow. Run:
`npm run policy:verify:ai-scope` (`--strict` fails on any case).

## Explicitly not implemented

DB queries, repository changes, SQL migration, API middleware, frontend, actual AI
retrieval, embeddings/vector search, model/prompt construction, token budgeting beyond
metadata placeholders, server/campaign assistant runtime, generated-artifact writes,
audit logging, runtime/WebSocket changes.

## Future path

AI Gateway preflight (calls `filterAiContextCandidates`) → retrieval adapters that feed
candidates → generated-artifact source tracking (record which allowed items fed a
generation) → audit logging of denials → token budgeting → richer redaction policy →
server/campaign assistants.
