# P5.22-P5.24 AI Context Retrieval Safety Pipeline — Contract

One coherent pure-backend contract merging **P5.22 source registry**, **P5.23 retrieval
preflight + candidate normalization**, and **P5.24 context pack builder + redaction +
audit**. It is the safety spine a future AI Gateway/retrieval layer must follow so that
**AI retrieval never bypasses visibility, rights, membership, or AI scope.** Pure: no
DB, no model, no embeddings, no retrieval adapters, no API, no frontend, no runtime.
Files: `server/policy/aiContextSourceRegistry.ts`,
`server/policy/aiContextRetrievalPreflight.ts`, `server/policy/aiContextPackBuilder.ts`,
`server/policy/aiContextRetrievalPipelineSmoke.ts`,
`server/policy/verifyAiContextRetrievalPipeline.ts` (`npm run policy:verify:ai-retrieval`).

## Why after P5.21

P5.20 decides one permission; P5.21 filters a batch of already-fetched candidates. This
slice adds the steps **around** those: which source families may be queried and with
what filters (preflight), how fetched rows become P5.21 candidates (normalization), and
how allowed items are packaged for a model with a redacted denied set + audit record
(pack builder). The full future flow: request → **preflight** → adapter fetch → **normalize**
→ **P5.21 guard** → **pack** → only allowed content to the model; denied stays redacted;
audit records what happened. This slice implements steps 2, 4, 6, 7, 8 as pure contracts.

## AI retrieval must not bypass visibility/rights

The AI has no elevated access. Preflight denies unknown sources and enforces required
scope/joins before a fetch; normalization applies safe defaults (private/disabled) for
missing metadata; the P5.21 guard remains **mandatory** after fetch; and the pack builder
emits only allowed items. Denied source plans, denied context items, and the audit record
**never carry body or summary**.

## Source registry (P5.22)

`AI_CONTEXT_SOURCE_REGISTRY` declares 16 source families
(`actor_vault`, `campaign`, `runtime_event`, `generated_artifact`, `ai_memory`,
`ai_context_source`, `asset_metadata`, `world_server`, `world_server_game_system`,
`visibility_record`, `rights_policy`, `compendium_entry`, `chat_message`, `map`, `note`,
`unknown`). Each entry declares required visibility/rights joins, required
server/campaign scope, public-fallback eligibility, a body-fetch policy
(`metadata_only`/`summary_only`/`body_allowed_after_guard`/`body_requires_owner`/
`body_requires_server_scope`/`body_requires_campaign_scope`/`body_never`), default
visibility/AI scope, which data classes it may contain, and mandatory metadata fields.
`unknown` is deny-safe: `body_never`, requires everything. Helpers:
`getAiContextSourceRegistryEntry`, `listAiContextSourceRegistryEntries`,
`isKnownAiRetrievalSourceKind`.

## Retrieval preflight (P5.23)

`buildAiContextRetrievalPreflight` / `evaluateAiRetrievalSourceRequest` return per-source
allowed plans (allowedLimit clamped 1–50, default 20; `bodyFetchPolicy`;
`mustJoinVisibilityRecord`/`mustJoinRightsPolicy`; `mandatoryFilters` incl.
`lifecycleStatus:'active'`, `worldServerId`/`campaignId` when applicable,
`visibilityScope:'global_public'` for fallback) or denied plans (no content). Rules:
deny unknown; unauthenticated needs a public-fallback source + explicit
`allowPublicFallback` + `requestedPublicFallback`; server sources need `worldServerId`;
campaign sources need `campaignId`; public fallback requires both request + source
opt-in; requested body is refused for `body_never`/`metadata_only`. **Preflight can only
forbid body — it never authorizes body inclusion; the P5.21 guard still decides.**

## Candidate normalization

`normalizeAiContextCandidateMetadata` maps a fetched row to a P5.21 `AiContextCandidate`,
defaulting missing `visibilityScope` from the registry, `aiScope` to `disabled` for
unknown sources / `public` only for public-capable global-public / else `private_only`,
`lifecycleStatus:'active'`, `reviewStatus:'not_submitted'`, `moderationStatus:'not_reviewed'`,
and `itemKind` from the registry. It makes **no** allow/deny decision.

## Context pack (P5.24)

`buildAiContextPack` runs `filterAiContextCandidates` (P5.21) then packages **only**
`allowedItems` into `AiContextPackItem[]` (ordinal-ordered, body retained), keeps
`deniedItems` in redacted form, and builds a `sourceManifest` (allowed + denied +
truncated entries, no content) and an `AiContextAuditRecord` (counts, purpose, viewer/
server/campaign/room, `deniedBodiesRedacted:true`, manifest, notes — **no denied body**).
`maxItems` is clamped 1–50 (default 20); truncation is deterministic. Status: `empty`
(no candidates), `all_denied` (none allowed), `ready` (all allowed, nothing denied or
truncated), `partial` (some denied or truncated). No token budgeting, ranking, prompt
construction, or model call.

## Relationship to P5.20 / P5.21

Normalized candidates flow into P5.21 `filterAiContextCandidates`, which calls P5.20
`canUseContentInAiContext`. **Both remain required** — this slice never replaces them; it
gates which sources may be queried before, and packages/audits after.

## Smoke cases

`runAiContextRetrievalPipelineSmoke()` covers 40+ assertions across registry (kinds,
deny-safe unknown, actor_vault/compendium/visibility policies), preflight (unknown deny,
unauth public fallback, scope requirements, join requirements, body policy, limit
clamps, denied-no-body, mixed counts), normalization (safe defaults, unknown→disabled,
default itemKind, no-allow-field), and pack/audit (owner private include, non-owner
redact, server match/mismatch, public fallback on/off, denied-no-body, manifest
allowed+denied, audit counts no-body, truncation partial, empty, all_denied). Run:
`npm run policy:verify:ai-retrieval` (`--strict`).

## Explicitly not implemented

DB queries, repository changes, SQL migration, API middleware, frontend, actual
retrieval adapters, embeddings/vector search, model/prompt construction, real token
budgeting, ranking, server/campaign assistant runtime, generated-artifact writes, audit
persistence, runtime/WebSocket changes.

## Future path

AI Gateway preflight (calls `buildAiContextRetrievalPreflight` then `buildAiContextPack`)
→ retrieval adapters (fetch per plan, feed `normalizeAiContextCandidateMetadata`) →
generated-artifact source tracking (persist the manifest) → audit-log persistence →
token budgeting → context ranking → redaction-policy refinement → server/campaign
assistants.
