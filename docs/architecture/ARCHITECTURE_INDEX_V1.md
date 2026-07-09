# Architecture Index v1

Navigation map for future Fable/Codex runs. **Read the relevant section before
editing.** Concise by design — deep rationale lives in the linked docs.

Foundational audits (read once for context): `REPOSITORY_ARCHITECTURE_AUDIT_V1`,
`DOMAIN_MODEL_BOUNDARY_AUDIT_V1`, `IDENTITY_REFERENCE_OWNERSHIP_AUDIT_V1`,
`RUNTIME_EVENT_REPLAY_BOUNDARY_AUDIT_V1`, `PERSISTENCE_TRANSACTION_BOUNDARY_AUDIT_V1`,
`API_CONTRACT_BOUNDARY_AUDIT_V1`, `APPLICATION_SERVICE_BOUNDARY_AUDIT_V1`,
`MODULE_DEPENDENCY_BOUNDARY_AUDIT_V1`, `ARCHITECTURE_CONSISTENCY_REVIEW_V1` (all in
`docs/architecture/`).

## Identity / Ownership
- Files: `src/lib/platform/localUserIdentity.ts`, `localViewerIdentity.ts`,
  `platformObjectIdentity.ts`, `ownershipMigrationContracts.ts`,
  `actorVaultOwnership.ts`, `campaignOwnership.ts`.
- Docs: `IDENTITY_REFERENCE_OWNERSHIP_AUDIT_V1`, `CLOUD_IDENTITY_FOUNDATION_IMPLEMENTATION_PLAN_V1`.
- Don't violate: Global UUID is the only cross-boundary key; one `ownerId` per
  aggregate; codes/names/slugs never FKs; `author-sample` is a seed-content alias
  only; ownership is additive (never rewrite records).
- Read when: touching users, owners, identity, or migration.

## Local Persistence
- Files: `src/lib/platform/localPersistenceAdapter.ts`, the zustand stores under
  `src/store/**`, `campaignLocalStore.ts`.
- Docs: `PERSISTENCE_TRANSACTION_BOUNDARY_AUDIT_V1`.
- Don't violate: localStorage/zustand is the local authority; migrate on read;
  never rewrite history; blobs never in stores.
- Read when: changing local storage, schemaVersion, or a store shape.

## Repository / Adapter Boundary
- Files: `src/lib/platform/localRepositoryAdapters.ts`,
  `actorVaultRepositoryBridge.ts`, `campaignLocalRepositoryAdapter.ts`,
  `storageAdapterBoundaryTypes.ts`; server: `server/adapters/**`.
- Docs: `REPOSITORY_ARCHITECTURE_AUDIT_V1`.
- Don't violate: repositories persist only — no rules/UI/AI/network; one aggregate
  per repository; adapters isolated behind the storage seam.
- Read when: adding/changing any repository or adapter.

## Cloud Repository Contracts
- Files: `src/lib/platform/cloudRepositoryContracts.ts`, `cloudBackendAdapters.ts`,
  `backendDeploymentTypes.ts`.
- Don't violate: these are CONTRACTS, not implementations; vendors (Supabase/Neon/
  R2/S3/Clerk) live behind adapters, never in the domain.
- Read when: planning cloud persistence/auth/storage.

## Postgres User First Slice (server-only)
- Files: `server/db/**` (client, schema readiness, smokes, `migrations/0001_user_identity.sql`),
  `server/adapters/postgresUserRepository.ts`, `server/config/{databaseRuntimeConfig,serverRuntimeConfig}.ts`.
- Docs: `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`, `POSTGRES_FIRST_SLICE_USER_REPOSITORY_V1`,
  `POSTGRES_USER_REPOSITORY_SMOKE_V1`, `POSTGRES_USER_REPOSITORY_WRITE_SMOKE_V1`,
  `POSTGRES_LOCAL_DEV_VERIFICATION_V1`, `POSTGRES_ADAPTER_READINESS_CHECKLIST_V1`.
- Don't violate: `DATABASE_URL` is server-only (never `src/`, never `VITE_`); no
  migration runner / auto-create; manual DDL; write smoke rolls back.
- Read when: touching the user DB.

## User API Boundary
- Files: `server/api/{apiResponse,userApiHandlers,userApiHandlersSmoke,verifyUserApiHandlers,userDevRoutes}.ts`,
  gated mount in `server/room-server.ts`.
- Docs: `POSTGRES_USER_API_BOUNDARY_V1`, `POSTGRES_USER_DEV_API_VERIFICATION_V1`.
- Don't violate: safe envelope only (no raw DB error/secret); dev routes are
  env-gated (`POSTGRES_USER_DEV_API_ENABLED`), default off, prod-off, read-only;
  `saveUserProfileHandler` never mounted; no public write route.
- Read when: touching HTTP user endpoints or handlers.

## Frontend Account Surface
- Files: `src/lib/platform/currentViewerAccount.ts`, `currentViewerAccountSmoke.ts`,
  `src/App.tsx` (account menu), `components/platform/{PersonalContentHub,UserProfileSpace}.tsx`.
- Docs: `FRONTEND_ACCOUNT_SURFACE_IDENTITY_BINDING_V1`.
- Don't violate: ONE projection (`getCurrentViewerAccount`) drives all account
  surfaces; current viewer = local anonymous user; no frontend User-API/DB call;
  login/logout reserved.
- Read when: changing account/profile/settings UI.

## Runtime / Room Authority
- Files: `server/room-server.ts`, `server/services/**`, `server/protocol/**`,
  `src/components/platform/RoomRuntimeEntryBridge.tsx`, `runtimeLogLocalStore.ts`,
  `roomRuntimeLogTypes.ts`.
- Docs: `RUNTIME_EVENT_REPLAY_BOUNDARY_AUDIT_V1`, `runtime-mode-unification`.
- Don't violate: append-only event log with authority-assigned `seq`; one
  authority per session; projections never write; do not change Room protocol/WS
  casually.
- Read when: touching runtime, room, or the event log.

## Actor / Character Vault DB (P5.12A-C — first slice implemented, server-only)
- Files: `server/db/migrations/0003_actors.sql`,
  `server/adapters/postgresActorRepository.ts`,
  `server/db/postgresActorSchemaReadiness.ts`,
  `server/db/postgresActorRepositorySmoke.ts`,
  `server/db/postgresActorRepositoryWriteSmoke.ts`,
  `server/db/verifyPostgresActor*.ts`; scripts `db:verify:actor`,
  `db:verify:actor:write`; `/health` `database.actorSchema`.
- Docs: `POSTGRES_ACTOR_REPOSITORY_FIRST_SLICE_V1`,
  `P5_12_ACTOR_DB_FIRST_SLICE_READINESS_V1`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`.
- Migration source: `actorVaultOwnership.ts` (local actor ownership registry,
  keyed `${systemId}:${actorId}`).
- Don't violate: `actor_id` is the global cloud id; `local_actor_id` is the
  source-origin id (not globally unique) — origin key is
  `(owner_id, system_id, local_actor_id)`; full sheet lives in `actor_payload`
  JSONB (do not relationalize per-system yet); this is the Character Vault, NOT
  the Campaign Actor Instance and NOT live runtime HP/SAN authority; server-only
  (no frontend sync); manual DDL (no runner/auto-create); write smoke rolls back.
- Read when: touching the Actor / Character Vault DB.

## Asset / Media Metadata DB (P5.13A-D — first slice implemented, server-only)
- Files: `server/db/migrations/0004_asset_metadata.sql`,
  `server/adapters/postgresAssetRepository.ts`,
  `server/db/postgresAssetSchemaReadiness.ts`,
  `server/db/postgresAssetRepositorySmoke.ts`,
  `server/db/postgresAssetRepositoryWriteSmoke.ts`,
  `server/db/verifyPostgresAsset*.ts`; scripts `db:verify:asset`,
  `db:verify:asset:write`; `/health` `database.assetSchema`.
- Docs: `POSTGRES_ASSET_REPOSITORY_FIRST_SLICE_V1`,
  `P5_13_ASSET_DB_FIRST_SLICE_READINESS_V1`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`
  §3.8/§3.9/§10.
- Shape source: `src/lib/architecture/mediaAsset.ts` (local MediaAsset metadata +
  storage-ref model — this is the cloud counterpart).
- Don't violate: **metadata only — blobs NEVER in Postgres**; `object_storage_refs`
  is a vendor-neutral pointer (no upload/download/signed-URL/provider SDK/creds);
  `external_url` covers today's URL-referenced assets (storage_ref_id NULL);
  `owner_id` is the asset owner, `campaign_id` is an optional association (NOT a
  permission model); server-only (no frontend sync); manual DDL (no runner/
  auto-create); write smoke rolls back; not runtime map authority.
- Read when: touching the Asset / Media metadata DB.

## RuntimeEvent DB (P5.14A-D — first slice implemented, server-only)
- Files: `server/db/migrations/0005_runtime_events.sql`,
  `server/adapters/postgresRuntimeEventRepository.ts`,
  `server/db/postgresRuntimeEventSchemaReadiness.ts`,
  `server/db/postgresRuntimeEventRepositorySmoke.ts`,
  `server/db/postgresRuntimeEventRepositoryWriteSmoke.ts`,
  `server/db/verifyPostgresRuntimeEvent*.ts`; scripts `db:verify:runtime`,
  `db:verify:runtime:write`; `/health` `database.runtimeEventSchema`.
- Docs: `P5_14_RUNTIME_EVENT_DB_FIRST_SLICE`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`.
- Don't violate: **long-term persistence, NOT live authority** — the Room Server
  keeps live runtime authority; not wired to the WebSocket protocol; `runtime_events`
  is **append-only** (no updated_at/archived_at, no UPDATE/DELETE); corrections/
  tombstones are future event rows (`caused_by_event_id`); `seq` is per-session
  monotonic allocated transactionally; reads use afterSeq cursor (never OFFSET);
  `idempotency_key` de-dupes appends; server-only (no frontend sync); manual DDL
  (no runner/auto-create); write smoke rolls back; no AI Memory / GeneratedArtifact
  / Session Recap in this slice.
- Read when: touching the RuntimeEvent DB.

## Server Ruleset Versioning & Soft Update UX (P5.S1 — contract only)
- Files: `src/lib/platform/serverRulesetVersioning.ts` (version/snapshot/compatibility
  types + `classifyRulesetChange`/`summarizeRulesetCompatibility`),
  `src/lib/platform/softUpdatePolicy.ts` (route-guard/soft-update types +
  `shouldAutoRefreshRoute`/`createSoftUpdateNotice`/`resolveRoomEntryMismatch`),
  `src/lib/platform/serverRulesetVersioningSmoke.ts` (`runServerRulesetVersioningSmoke`).
- Doc: `SERVER_RULESET_VERSIONING_SOFT_UPDATE_UX_V1`.
- Don't violate: **contract only** — no UI, no DB, no runtime, no permission, no API
  here; advanced rules are visual/schema-driven (never code); publishing creates a
  new server ruleset VERSION; campaigns/rooms pin SNAPSHOTS; running/preparing tables
  are never force-upgraded; updates are SOFT (top banner) — never hard-refresh a
  dirty editor or kick to home; auto-refresh only when safe + clean + refreshable;
  old data/pack versions are never deleted; public entry ≠ public data.
- Read when: building world-server ruleset versioning, advanced settings, snapshots,
  or the soft-update/route-guard UX.

## World Server + Membership + Game Systems DB (P5.16-P5.18 — first slice implemented, server-only)
- Files: `server/db/migrations/0007_world_servers_membership.sql`,
  `server/adapters/postgresWorldServerRepository.ts`,
  `server/db/postgresWorldServerSchemaReadiness.ts`,
  `server/db/postgresWorldServerRepositorySmoke.ts`,
  `server/db/postgresWorldServerRepositoryWriteSmoke.ts`,
  `server/db/verifyPostgresWorldServer*.ts`; scripts `db:verify:world`,
  `db:verify:world:write`; `/health` `database.worldServerSchema`.
- Doc: `P5_16_WORLD_SERVER_MEMBERSHIP_DB_FIRST_SLICE`; relates to
  `PUBLIC_SURFACE_SYSTEM_AUDIT_V1` and `SERVER_RULESET_VERSIONING_SOFT_UPDATE_UX_V1`.
- Tables (7): world_servers, world_server_campaign_bindings,
  world_server_game_system_bindings, world_server_roles, world_server_memberships,
  world_server_invites, world_server_join_requests.
- Don't violate: **the Global Public Surface is NOT a normal server** — no
  main/global/default server row; a World Server is a scoped community; public entry
  ≠ public data; **Server ≠ Game System** — a server enables MULTIPLE game systems via
  world_server_game_system_bindings, `default_game_system_id` is a convenience hint
  (NOT exclusivity; one-default NOT DB-enforced); `owner_id` is the canonical owner
  (not the membership system); roles/`permissions_payload`, `membership_status`,
  `server_visibility`, `join_policy`, `invite_code`, join requests, and game-system
  bindings are **metadata/workflow state — NO enforcement** in this slice; campaign
  binding does NOT change campaign/runtime authority; `default_game_system_id`/
  `ruleset_template_id`/`current_ruleset_version_id`/`enabled_pack_version_ids` are
  opaque forward-compatible refs (no FK); server-only (no frontend/API/email); manual
  DDL (no runner/auto-create); write smoke rolls back.
- Read when: touching world servers, game-system bindings, membership, roles, invites,
  or join requests.

## AI Context Retrieval Safety Pipeline (P5.22-P5.24 — contract only, pure backend policy)
- Files: `server/policy/aiContextSourceRegistry.ts` (16 source families + body/join/scope
  policies), `server/policy/aiContextRetrievalPreflight.ts`
  (`buildAiContextRetrievalPreflight`/`evaluateAiRetrievalSourceRequest`/
  `normalizeAiContextCandidateMetadata`), `server/policy/aiContextPackBuilder.ts`
  (`buildAiContextPack` reuses P5.21 guard + manifest + audit record),
  `server/policy/aiContextRetrievalPipelineSmoke.ts`,
  `server/policy/verifyAiContextRetrievalPipeline.ts`; script `policy:verify:ai-retrieval`.
- Doc: `P5_22_AI_CONTEXT_RETRIEVAL_SAFETY_PIPELINE_CONTRACT`; builds on P5.20/P5.21.
- Don't violate: **pure contract, not enforcement** — no DB, no model, no retrieval
  adapters, no embeddings, no API, no frontend, no runtime; deny source by default;
  unknown source denied; server sources need worldServerId, campaign sources need
  campaignId; visibility join required for risky sources, rights join for
  public/licensable sources; body_never/metadata_only forbid body fetch; **preflight is
  never sufficient — every candidate still passes the P5.21 guard after fetch**; context
  pack contains ONLY allowed items; **denied source plans / denied items / audit records
  carry NO body or summary**; public fallback must be explicit; final enforcement is a
  FUTURE AI Gateway that CALLS this pipeline.
- Read when: building AI retrieval, the AI Gateway, retrieval adapters, source tracking,
  or context-pack assembly.

## AI Context Scope Guard (P5.21 — contract only, pure backend policy)
- Files: `server/policy/aiContextScopeGuard.ts` (types + `filterAiContextCandidates`
  / `canIncludeAiContextCandidate` / `redactDeniedAiContextCandidate`, reuses P5.20
  `canUseContentInAiContext`), `server/policy/aiContextScopeGuardSmoke.ts`
  (`runAiContextScopeGuardSmoke`), `server/policy/verifyAiContextScopeGuard.ts`; script
  `policy:verify:ai-scope`.
- Doc: `P5_21_AI_CONTEXT_SCOPE_GUARD_CONTRACT`; builds on the P5.20 resolver.
- Don't violate: **pure contract, not enforcement** — no DB, no HTTP, no React, no AI
  model, no retrieval, no vector search, no network; **AI must not bypass visibility or
  rights**; deny by default; AI disabled/private by default; **denied items are
  redacted — NEVER carry body or summary**; unauthenticated AI context limited to
  approved/clean/active public; server/campaign content must match request scope;
  moderation-hidden/removed and archived excluded except moderation purpose + moderator;
  public fallback must be explicit; frontend hints are NOT security — final enforcement
  is a FUTURE AI Gateway preflight that CALLS this guard.
- Read when: building AI retrieval, the AI Gateway, recap/NPC/rules/assistant features,
  or any code that assembles an AI context window.

## Effective Permission Resolver (P5.20 — contract only, pure backend policy)
- Files: `server/policy/effectivePermissionResolver.ts` (types + deterministic
  resolver + `canViewContent`/`canEditContent`/`canPublishContent`/
  `canUseContentInAiContext`/`canManageWorldServer`),
  `server/policy/effectivePermissionResolverSmoke.ts`
  (`runEffectivePermissionResolverSmoke`),
  `server/policy/verifyEffectivePermissionResolver.ts`; script
  `policy:verify:permission`.
- Doc: `P5_20_EFFECTIVE_PERMISSION_RESOLVER_CONTRACT`; interprets P5.19 metadata.
- Don't violate: **pure contract, not enforcement** — no DB, no HTTP/Express, no
  React, no AI, no network; deny by default / private by default / AI disabled-or-
  private by default; public entry ≠ public data; Global Public Surface is not a
  server; visibility must be interpreted before access, rights before public publish,
  review/moderation before public-feed exposure, ai_scope before AI retrieval;
  frontend hints are NOT security — final enforcement is a FUTURE server-side API
  guard that CALLS this resolver; custom permissions_payload is NOT interpreted yet
  (placeholder returns false).
- Read when: building API guards, the AI Context Scope Guard, publish/moderation
  gating, or any access decision over P5.19 metadata.

## Visibility / Scope / Rights DB (P5.19 — first slice implemented, server-only)
- Files: `server/db/migrations/0008_visibility_scope_rights.sql`,
  `server/adapters/postgresVisibilityRepository.ts`,
  `server/db/postgresVisibilitySchemaReadiness.ts`,
  `server/db/postgresVisibilityRepositorySmoke.ts`,
  `server/db/postgresVisibilityRepositoryWriteSmoke.ts`,
  `server/db/verifyPostgresVisibility*.ts`; scripts `db:verify:visibility`,
  `db:verify:visibility:write`; `/health` `database.visibilitySchema`.
- Doc: `P5_19_VISIBILITY_SCOPE_RIGHTS_DB_FIRST_SLICE`; relates to
  `PUBLIC_SURFACE_SYSTEM_AUDIT_V1`.
- Tables (3): content_rights_policies, content_visibility_records,
  content_publication_reviews.
- Don't violate: **metadata only — enforces nothing** (no permission/publish/
  moderation/public-feed/AI-retrieval/AI-scope-guard); **public entry ≠ public data**;
  the Global Public Surface is NOT a server (global_public is a scope value); public
  flags DEFAULT FALSE, `ai_scope` DEFAULTS private_only, `visibility_scope` DEFAULTS
  user_private; server/campaign/private content is NOT public by default; a
  public_projection is a SEPARATE record from its private source (projection_kind) —
  publishing never mutates the source; generic content refs
  (content_kind/content_id/projection_kind) — NO FK fanout to content tables; rights
  and review metadata are stored, NOT license/publish enforcement; server-only (no
  frontend/API); manual DDL (no runner/auto-create); write smoke rolls back.
- Read when: touching content visibility, scope, rights/license, publish review, or AI
  scope metadata.

## GeneratedArtifact / AI Memory DB (P5.15A-D — first slice implemented, server-only)
- Files: `server/db/migrations/0006_generated_artifacts_ai_memory.sql`,
  `server/adapters/postgresGeneratedArtifactRepository.ts`,
  `server/db/postgresGeneratedArtifactSchemaReadiness.ts`,
  `server/db/postgresGeneratedArtifactRepositorySmoke.ts`,
  `server/db/postgresGeneratedArtifactRepositoryWriteSmoke.ts`,
  `server/db/verifyPostgresGeneratedArtifact*.ts`; scripts `db:verify:generated`,
  `db:verify:generated:write`; `/health` `database.generatedArtifactSchema`.
- Docs: `P5_15_GENERATED_ARTIFACT_AI_MEMORY_DB_FIRST_SLICE`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`.
- Tables: `generated_artifacts` (AI outputs, curated), `ai_memory_entries` (curated
  memory), `ai_context_sources` (append-only provenance links).
- Don't violate: **stores outputs/memory only** — no model call, no embeddings /
  vector search, no AI context retrieval, no scope-guard enforcement in this slice;
  `visibility_scope`/`memory_scope` are metadata only (defaults user_private /
  campaign; AI memory never public by default); AI is advisory (never authoritative
  events); RuntimeEvent stays append-only + Room Server stays live authority;
  context sources are append-only; server-only (no frontend); manual DDL (no runner/
  auto-create); write smoke rolls back.
- Read when: adding any AI persistence / memory / recap feature.
- Prior context: `DOMAIN_MODEL_BOUNDARY_AUDIT_V1` (AI section), `campaign-actor-instance-boundary`.

## Campaign DB (P5.11A-C — first slice implemented, server-only)
- Files: `server/db/migrations/0002_campaigns.sql`,
  `server/adapters/postgresCampaignRepository.ts`,
  `server/db/postgresCampaignSchemaReadiness.ts`,
  `server/db/postgresCampaignRepositorySmoke.ts`,
  `server/db/postgresCampaignRepositoryWriteSmoke.ts`,
  `server/db/verifyPostgresCampaign*.ts`; scripts `db:verify:campaign`,
  `db:verify:campaign:write`; `/health` `database.campaignSchema`.
- Docs: `POSTGRES_CAMPAIGN_REPOSITORY_FIRST_SLICE_V1`,
  `P5_11_CAMPAIGN_DB_FIRST_SLICE_READINESS_V1`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1` (§3.4).
- Migration source: `campaignOwnership.ts` (local campaign ownership registry).
- Don't violate: `campaigns.owner_id` ≠ `hostUserId` (hostUserId lives in a future
  `runtime_sessions` table); `campaignRef` in the Room Server is a read-only echo,
  never DB authority; server-only (no frontend sync); no membership/actor/runtime
  persistence; manual DDL (no runner/auto-create); write smoke rolls back.
- Read when: touching the Campaign DB.
