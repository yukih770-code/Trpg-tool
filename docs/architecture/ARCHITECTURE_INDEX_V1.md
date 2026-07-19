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

## Cloud Private Alpha Foundation
- Files: `server/config/serverRuntimeConfig.ts`, `server/config/cloudPrivateAlphaConfigSmoke.ts`,
  `server/config/cloudPrivateAlphaE2EPlanSmoke.ts`, `verifyCloudPrivateAlphaBackend.ts`,
  `server/auth/privateAlphaAuth.ts`, `server/api/privateAlphaAuthApiRoutes.ts`,
  `server/api/verifyHttpE2EFlow.ts`, `server/room-server.ts`, `.env.cloud.backend.example`,
  `.env.cloud.frontend.example`, `src/components/platform/PrivateAlphaLoginPanel.tsx`.
- Docs: `docs/deployment/CLOUD_PRIVATE_ALPHA_DEPLOYMENT.md`,
  `docs/deployment/CLOUD_DEPLOY_RUNBOOK.md`, `docs/deployment/PRIVATE_ALPHA_AUTH_PLAN.md`.
- Don't violate: local dev identity headers are `localDev` only; cloud modes require
  explicit origins and backend database configuration, reject wildcard CORS and
  never expose database settings to frontend code. Private alpha uses a backend-only
  shared access code and signed, database-backed browser sessions; it is not public
  registration, OAuth, or a deployed cloud environment.
- Read when: preparing a private cloud environment, changing CORS/runtime env, or
  adding verified authentication.

## LAN Alpha Runtime
- Files: `server/config/lanRuntimeConfig.ts`, `server/config/serverRuntimeConfig.ts`,
  `server/config/printLanRuntimeInfo.ts`, `scripts/dev-local.ps1`,
  `src/lib/platform/lanRuntimeEndpointOverride.ts`,
  `src/components/platform/LanRuntimeHostPanel.tsx`.
- Docs: `docs/development/LAN_ALPHA_RUNTIME.md`, `LOCAL_DEV_ONE_COMMAND.md`.
- Don't violate: LAN Alpha is localDev-only host exposure with exact private-LAN
  CORS origins. It does not weaken private-alpha sessions, enable dev headers in
  cloud mode, change room authority/protocol, add guest identity, or promise
  remote public multiplayer.
- Read when: changing local endpoint resolution, LAN CORS, host diagnostics, or
  same-network join guidance.

## Platform / Server Profile / Campaign Room Surfaces
- Files: `src/components/platform/{PlatformOperationsWorkspace,ServerProfileBoard,ServerCampaignWorkspace}.tsx`,
  `src/App.tsx`, `src/pages/Home.tsx`.
- Product roles: the platform workspace is the current-server operations hub; the server profile is a
  calm information and announcement board; campaign and room workspaces own play and session management.
- Don't violate: the server profile does not create campaigns or rooms, host LAN, or expose runtime
  controls. It may show read-only systems, members, announcements, resource previews, and a future
  visual slot. Asset upload/object storage and LAN runtime behavior remain separate slices.
- Read when: changing server entry navigation, profile presentation, or campaign/room workspace placement.

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

## RuntimeEvent Persistence Bridge (P5.RUNTIME-BRIDGE — server-only seam)
- Files: `server/runtime/runtimeEventPersistenceBridge.ts`,
  `server/runtime/runtimeEventRepositoryPortAdapter.ts`,
  `server/runtime/runtimeSessionContext.ts`,
  `server/runtime/runtimeEventPersistenceBridgeSmoke.ts`,
  `server/runtime/verifyRuntimeEventPersistenceBridge.ts`;
  script `runtime:verify:persistence-bridge`.
- Doc: `P5_RUNTIME_EVENT_PERSISTENCE_BRIDGE`.
- Don't violate: the bridge is dependency-injected and append-only; live Room
  Server/WebSocket state remains authoritative; no permission decisions, no
  frontend/runtime protocol changes, no update/delete path, no raw DB error
  output. The HTTP Runtime Event API uses the bridge; live `room-server.ts` /
  WebSocket events remain unwired until one stable event seam provides complete
  campaign + runtime-session context.
- Read when: connecting live room/runtime events to long-term persistence.

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

## DB Migration Runner / Bootstrap / All-Schema Verify (P5.25-P5.27 — server-only tooling)
- Files: `server/db/migrations/0000_migration_history.sql`,
  `server/db/postgresMigrationRegistry.ts`, `server/db/postgresMigrationRunner.ts`,
  `server/db/postgresAllSchemaReadiness.ts`, `server/db/verifyPostgresMigrationStatus.ts`,
  `server/db/applyPostgresMigrations.ts`, `server/db/bootstrapPostgresDatabase.ts`,
  `server/db/verifyPostgresAllSchemas.ts`; scripts `db:migrations:status`,
  `db:migrations:apply`, `db:bootstrap`, `db:verify:all`.
- Doc: `P5_25_DB_MIGRATION_RUNNER_BOOTSTRAP_CLI`.
- Don't violate: **safe by default** — dry-run unless `--apply`; no connection-string
  output; no SQL-body output; **fail closed** on checksum mismatch / missing applied
  file / out-of-order / duplicate id / invalid filename; no destructive rollback / down
  migrations; **no auto-apply on server startup or /health**; write smokes stay manual;
  `schema_migrations` history table ensured (idempotent) before recording; apply is
  in-order, one transaction per migration.
- Read when: running/inspecting migrations, bootstrapping a DB, or verifying all schemas.

## Remaining Platform DB Foundation (P5.DB-CLOSURE — server-only)
- Files: `server/db/migrations/0009_remaining_platform_foundation.sql`,
  `server/adapters/postgresPlatformFoundationRepository.ts`,
  `server/db/postgresPlatformFoundationSchemaReadiness.ts`,
  `server/db/postgresPlatformFoundationRepositorySmoke.ts`,
  `server/db/postgresPlatformFoundationRepositoryWriteSmoke.ts`,
  `server/db/verifyPostgresPlatformFoundation*.ts`; scripts
  `db:verify:platform`, `db:verify:platform:write`; aggregate
  `db:verify:all` includes `platformFoundation`.
- Doc: `P5_DB_CLOSURE_REMAINING_POSTGRES_FOUNDATION`.
- Families: auth sessions / service identities / account audit; server settings
  versions / ruleset versions / soft update notices; compendium packs / versions /
  entries / bindings; campaign actor instances / bindings / runtime actor slots;
  room records / participants / lobby slots / runtime-session bindings; chat,
  notes, handouts, maps, scene-map bindings; server audit / permission decision
  audit / AI operation audit / moderation; user notifications.
- Don't violate: **DB foundation only** — no frontend, no API routes, no real auth
  provider, no JWT/OAuth/password flow, no DB-backed route enforcement, no
  WebSocket/runtime behavior change, no AI model/retrieval adapter, no upload/
  download, no copyrighted content; repositories store metadata and do NOT decide
  permissions; Room Server remains live authority; Character Vault actor !=
  Campaign Actor Instance != RuntimeActor; denied private bodies/prompts are not
  persisted in audit rows; write smoke rolls back.
- Read when: adding APIs or repositories for sessions, server settings, compendium,
  campaign actor instances, rooms/lobbies, content docs/maps, audit/moderation, or
  notifications.

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

## Auth Session / API Guard Foundation (P5.28-P5.31 — server-only boundary, no route enforcement yet)
- Files: `server/auth/requestAuthSession.ts` (anonymous default, dev headers, service
  internal, bearer detected-not-trusted), `server/auth/currentViewerContext.ts`
  (`toPermissionActorContext`), `server/api/apiRequestContext.ts`
  (`resolveApiRequestScope`/`getStringParam`), `server/api/apiPermissionGuard.ts`
  (`resolveApiPermissionGuard` reuses P5.20), `server/api/guardedApiHandler.ts`,
  `server/api/apiGuardFoundationSmoke.ts`, `server/api/verifyApiGuardFoundation.ts`;
  script `api:verify:guard`.
- Doc: `P5_28_AUTH_SESSION_API_GUARD_FOUNDATION`; delegates to the P5.20 resolver.
- Don't violate: **frontend login state is NOT security**; anonymous by default, deny by
  default, guard fails closed; dev auth headers only when explicitly enabled AND not
  production; bearer/cookie DETECTED but NOT trusted (no verifier); service-internal is
  NOT a user (anonymous actor context); request scope is NOT authorization (conflicts →
  400); P5.20 resolver is the source of truth; public messages are GENERIC — never leak
  the internal permission reason; hide private-resource existence (404) when asked; no
  DB, no route enforcement retrofit, no real auth provider, no frontend in this slice.
- Read when: building API middleware/guards, a real auth provider, or any server/campaign
  business API.

## World Server / Membership / Settings API (P5.API-CORE — first real backend surface)
- Files: `server/api/worldServerApiHandlers.ts`, `server/api/worldServerApiRoutes.ts`,
  `server/api/worldServerApiHandlersSmoke.ts`, `server/api/verifyWorldServerApiHandlers.ts`;
  route family `/api/world-servers`; script `api:verify:world`.
- Reuses `requestAuthSession`, `currentViewerContext`, `resolveApiRequestScope`,
  `resolveApiPermissionGuard`, `postgresWorldServerRepository`, and the platform
  foundation settings/ruleset repository seam.
- Covers world servers, members/roles, invites/join requests, settings and ruleset
  versions, and multiple game-system bindings. The default game system is only a
  convenience hint. Pack bindings are deferred because the current repository has
  no clear world-server binding port.
- Don't violate: **handlers enforce the API boundary; repositories do not decide
  permissions**; dev auth remains opt-in and non-production; private reads can hide
  existence; generic errors never expose SQL or internal reasons; no frontend,
  auth provider, WebSocket/runtime, AI, upload, or migration-on-startup behavior.
- Doc: `P5_API_CORE_WORLD_SERVER_SURFACE`.

## Campaign / Room / Runtime API Surface (P5.API-CAMPAIGN-ROOM — server-only metadata/history surface)
- Files: `server/api/campaignRoomApiHandlers.ts`, `server/api/campaignRoomApiRoutes.ts`,
  `server/adapters/postgresCampaignRoomRepository.ts`,
  `server/api/campaignRoomApiHandlersSmoke.ts`,
  `server/api/verifyCampaignRoomApiHandlers.ts`; route family
  `/api/world-servers/:worldServerId/campaigns`; script
  `api:verify:campaign-room`.
- Covers campaign CRUD/lifecycle, campaign actor-instance read/create/archive,
  durable room metadata, lobby participant/slot reads, runtime-session metadata,
  and append-only runtime-event list/append. Campaign scope uses the existing
  `world_server_campaign_bindings` boundary; no new migration is introduced.
- Don't violate: live Room Server/WebSocket state remains authoritative; room and
  runtime-session endpoints persist metadata only; runtime events are append-only
  history with idempotency/sequence reads and no update/delete route; repositories
  do not decide permissions; safe envelopes hide internal errors. Actor-instance
  PATCH is intentionally absent because the existing repository has no update port.
- Read when: adding campaign/room clients, runtime history integration, or future
  server-side campaign workspace APIs.
- Doc: `P5_API_CAMPAIGN_ROOM_RUNTIME_SURFACE`.

## Real Postgres / HTTP E2E Verification Harness (P5.E2E-DB-HTTP)
- Files: `server/db/verifyPostgresE2EReadiness.ts`,
  `server/api/verifyHttpE2EFlow.ts`, `src/lib/api/frontendApiE2ESmoke.ts`;
  doc `P5_E2E_DB_HTTP_VERIFICATION`.
- The DB harness is read-only by default: migration apply and rollback write
  smokes require explicit flags. The HTTP harness targets an already-running
  backend and exercises the existing World Server → Campaign → Room → Runtime
  Session → append-only Runtime Event chain. The frontend smoke reuses typed
  clients in dry mode or optional read-only real-backend mode.
- Don't violate: no secrets or SQL output; no Vite database env; no automatic
  server startup; no new routes, schema, auth provider, WebSocket protocol, or
  live Room Server authority changes. `not_configured` and
  `server_unavailable` remain honest outcomes.

## Frontend Server Workspace Real Data (P5.FRONTEND-REALDATA)
- Files: `src/lib/api/apiTypes.ts`, `src/lib/api/apiClient.ts`,
  `src/lib/api/worldServerApiClient.ts`, `src/lib/worldServer/useWorldServers.ts`,
  `src/lib/worldServer/useWorldServerDetail.ts`, and the existing `src/App.tsx`
  launcher/server workspace.
- Boundary: frontend uses `VITE_API_BASE_URL` with a localhost fallback and the
  existing safe API envelope; `VITE_DEV_VIEWER_USER_ID` is dev-only and is not
  authentication. Frontend state is a display/cache concern, never security.
- The current server select/home IA is preserved. API rows are not silently
  mixed with fixtures; the old demo rows require an explicit dev-only demo flag.
  Server detail, member/role summaries, settings summaries, and multiple game
  systems are read from the World Server API where available.
- Verification: `frontend:verify:world` covers URL normalization, response/error
  handling, dev-header gating, request shape, and multi-system preservation.
- Read when: connecting a frontend server workspace, settings surface, or future
  campaign/room client to the World Server API.

## Frontend Campaign / Room / Runtime Real Data (P5.FRONTEND-CAMPAIGN-REALDATA)
- Files: `src/lib/api/campaignRoomApiClient.ts`,
  `src/lib/campaignRoom/useCampaigns.ts`,
  `src/lib/campaignRoom/useCampaignDetail.ts`,
  `src/lib/campaignRoom/useRoomDetail.ts`,
  `src/lib/campaignRoom/useRuntimeEvents.ts`,
  `src/components/platform/ServerCampaignWorkspace.tsx`;
  smoke `src/lib/api/campaignRoomApiClientSmoke.ts` and script
  `frontend:verify:campaign-room`.
- Boundary: selected server home reads real campaign, room/lobby metadata,
  runtime-session metadata, and append-only runtime events through the existing
  API. Demo rows are never mixed with API rows. Frontend state is display/cache
  only; backend guards remain authoritative.
- Don't violate: room metadata is not live Room Lobby authority; runtime-session
  metadata is not live Runtime authority; no event edit/delete UI, WebSocket
  protocol change, full VTT board, full character sheet, AI recap, or database
  env in the frontend.
- Doc: `P5_FRONTEND_CAMPAIGN_ROOM_REAL_DATA`.

## Local Playable Lobby (P5.LOCAL-PLAYABLE-LOBBY)
- Files: `src/components/platform/LocalDevIdentitySwitcher.tsx`,
  `src/components/platform/ServerCampaignWorkspace.tsx`,
  `src/lib/api/apiClient.ts`, `src/lib/api/campaignRoomApiClient.ts`,
  `src/lib/localPlayableLobby/localPlayableLobbySmoke.ts`;
  script `frontend:verify:local-playable-lobby`.
- Boundary: frontend-only local table organizer over the existing API. The
  dev identity selector is not authentication or security; it only changes the
  development viewer header. Campaign/room metadata and append-only runtime
  events remain API-owned; live Room Server/WebSocket authority is unchanged.
- Don't violate: no database URL in frontend, no silent mock/API mixing, no
  WebSocket rewrite, no live membership/ready authority, no RuntimeActor,
  full VTT, full character editor, AI, deployment, or auth provider.
- Doc: `P5_LOCAL_PLAYABLE_LOBBY`.

## Combat Runtime Table (P5.COMBAT-RUNTIME-TABLE)
- Files: `src/lib/combat/combatRuntimeTypes.ts`,
  `src/lib/combat/useCombatRuntimeTable.ts`,
  `src/components/platform/CombatRuntimeTable.tsx`,
  `src/lib/combat/combatRuntimeTableSmoke.ts`.
- Boundary: local initiative/turn state in the API-backed server workspace;
  key actions append `combat.*` runtime events through the existing append-only
  API. It is not live Room Server/WebSocket authority, a rules engine, a
  character/inventory write path, a map/token layer, or CampaignActorInstance
  persistence.
- Doc: `P5_COMBAT_RUNTIME_TABLE`.

## DND Comfort Combat (P5.DND-COMFORT-COMBAT)
- Files: `src/lib/combat/combatComfort.ts`, `combatRuntimeTypes.ts`,
  `useCombatRuntimeTable.ts`, `combatRuntimeReplay.ts`,
  `src/components/platform/{CombatRuntimeTable,DndDiceCheckPanel}.tsx`, and
  `src/lib/combat/dndCombatComfortSmoke.ts` (`frontend:verify:dnd-comfort-combat`).
- Boundary: host-confirmed HP, temporary HP, condition, and manual override
  records are append-only `combat.*` events with deterministic local replay.
  Dice and monster actions can prefill a result, but never apply it
  automatically. No character-sheet/inventory writeback, rules enforcement,
  backend contract change, or live Room/WebSocket authority is introduced.
- Doc: `P5_DND_COMFORT_COMBAT`.

## Basic Map Board (P5.BASIC-MAP-BOARD)
- Files: `src/lib/map/mapRuntimeTypes.ts`, `src/lib/map/useMapRuntimeBoard.ts`,
  `src/lib/map/mapRuntimeReplay.ts`, `src/components/platform/BasicMapBoard.tsx`;
  scripts `frontend:verify:map-runtime` and `frontend:verify:map-replay`.
- Boundary: frontend-local background, viewport, and token projection using
  append-only `map.*` Runtime Events; deterministic replay on runtime session
  open; no WebSocket sync, DB map persistence, asset upload, fog, LOS, walls,
  permissions, or full VTT.
- Doc: `P5_BASIC_MAP_BOARD`.

## Room Runtime Permission Binding (P5.ROOM-RUNTIME-PERMISSION-BINDING)
- Files: `src/lib/platform/roomRuntimePermissions.ts`,
  `server/room/roomRuntimePermissionGuard.ts`, `server/transport/roomSocketServer.ts`,
  `server/room-server.ts`, `src/components/platform/{RoomRuntimeEntryBridge,BasicMapBoard}.tsx`;
  scripts `runtime:verify:room-permissions` and `frontend:verify:room-permissions`.
- Boundary: server-side binding of authenticated user -> active room member ->
  narrow Runtime action. LAN, room codes, and client-provided member ids are not
  authority. Fixed map ranges are an explicit, in-memory `roomSession` grant;
  host/admin persistence and a full VTT ACL are deferred.
- Doc: `P5_ROOM_RUNTIME_PERMISSION_BINDING`.

## DND Grid / Range / Templates (P5.DND-GRID-RANGE-TEMPLATES)
- Files: `src/lib/map/{mapRuntimeTypes,useMapRuntimeBoard,mapRuntimeReplay}.ts`,
  `src/components/platform/BasicMapBoard.tsx`, and
  `src/lib/map/dndGridRangeSmoke.ts` (`frontend:verify:dnd-grid-range`).
- Boundary: configurable grid, center snap, straight-line ruler, and generic
  area geometry are host-assisted frontend projection tools. Grid/templates use
  append-only `map.*` records and scene snapshot state; the ruler is temporary.
  The compact toolbar permits viewer-local measurement but reserves map mutation
  controls for the existing manager UI path. CSS-only background presets and
  custom URLs remain map projection metadata. They never detect targets, enforce range/pathing, apply damage, encode spell
  content, or alter backend/WebSocket/LAN authority.
- Doc: `P5_DND_GRID_RANGE_TEMPLATES`.

## Scene Runtime Snapshot (P5.SCENE-RUNTIME-SNAPSHOT)
- Files: `src/lib/scene/sceneRuntimeSnapshotTypes.ts`,
  `src/lib/scene/sceneRuntimeSnapshot.ts`,
  `src/lib/scene/sceneRuntimeSnapshotSmoke.ts`,
  `src/components/platform/SceneRuntimeSnapshotPanel.tsx`; the existing local
  combat/map hooks expose a controlled state replacement seam.
- Boundary: versioned local JSON export/import for the current combat/map
  projection. Context mismatches warn before an explicit host apply. It is not
  database persistence, a full backup, asset archive, live synchronization,
  WebSocket authority, or permission enforcement. Optional `scene.snapshot_*`
  Runtime Events are append-only audit notes and do not gate local actions.
- Doc: `P5_SCENE_RUNTIME_SNAPSHOT`.

## Persisted Scene Library (P5.PERSISTED-SCENE-LIBRARY)
- Files: `server/db/migrations/0010_scene_state_documents.sql`,
  `server/adapters/postgresSceneStateRepository.ts`, scene-state readiness and
  rollback-only write smoke files, the Campaign/Room API scene-state routes,
  `src/lib/api/campaignRoomApiClient.ts`, `useSceneStates`, and
  `SavedSceneLibraryPanel`.
- Boundary: a saved scene is a server-persisted, versioned combat/map snapshot
  scoped to a World Server, Campaign, and Room. It is explicitly loaded into
  the local page after validation; it is not live synchronization, runtime
  authority, campaign backup, asset storage, or a full VTT.
- Doc: `P5_PERSISTED_SCENE_LIBRARY`.

## DND Dice / Checks Runtime Layer (P5.DND-DICE-CHECKS)
- Files: `src/lib/dnd/dndDiceTypes.ts`, `src/lib/dnd/dndDiceRoller.ts`,
  `src/components/platform/DndDiceCheckPanel.tsx`, and
  `src/lib/dnd/dndDiceRollerSmoke.ts` (`frontend:verify:dnd-dice`).
- Boundary: safe frontend-local DND formula parsing, d20 checks, attack and
  damage-lite result models, and append-only `dnd.*` Runtime Event drafts for
  DND campaign pages. It is not a full rules engine, character writeback,
  backend/API contract change, or live runtime authority.
- Doc: `P5_DND_DICE_CHECKS`.

## DND Lite Actor Sheet (P5.DND-LITE-ACTOR-SHEET)
- Files: `src/lib/dnd/dndLiteActorTypes.ts`, `dndLiteActorSheet.ts`,
  `src/components/platform/DndLiteActorSheetPanel.tsx`, and
  `dndLiteActorSheetSmoke.ts` (`frontend:verify:dnd-lite-actor`).
- Boundary: host-operated, frontend-local DND actor data keyed by an existing
  Campaign Actor Instance id. It supplies safe dice and combat-table prefill,
  but does not write the actor vault, database, scene snapshot, or server and
  does not add a full builder or rules automation.
- Doc: `P5_DND_LITE_ACTOR_SHEET`.

## Private DND Monster Templates (P5.DND-PRIVATE-MONSTER-IMPORT)
- Files: `server/db/migrations/0011_dnd_private_monster_templates.sql`,
  `server/adapters/postgresDndPrivateMonsterRepository.ts`,
  `server/tools/importPrivateDndMonsters.ts`, and
  `src/components/platform/DndMonsterTemplateLibraryPanel.tsx`.
- Boundary: user-supplied, World Server-scoped private content only. Imports are
  dry-run by default; no content seeds, public/default library, raw input files,
  web scraping, OCR, or live Runtime authority are introduced.
- Doc: `P5_DND_PRIVATE_MONSTER_IMPORT`.

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

## Actor Map Presence Foundation (P5.ACTOR-PRESENCE-FOUNDATION)
- Files: `src/lib/map/actorPresence.ts`, `src/lib/map/actorPresenceSmoke.ts`,
  `src/lib/map/{mapRuntimeTypes,mapRuntimeReplay}.ts`,
  `src/components/platform/BasicMapBoard.tsx`,
  `src/components/platform/ServerCampaignWorkspace.tsx`.
- Token source metadata is additive and replay/snapshot-compatible. Campaign
  Actors, DND Lite actor sheets, private monster templates, and combatants can
  produce lightweight placement prototypes; map tokens stay scene instances.
- Don't violate: combat remains HP/condition authority; ownership hints are not
  permission grants. Approved players may move only server-verified linked
  room-character tokens; no asset upload, fog/LOS, pathfinding,
  automatic damage, or rules automation.

## Character Entry Canonicalization Bridge (P5.CHARACTER-ENTRY-CANONICALIZATION-BRIDGE)
- Read `docs/implementation/P5_CHARACTER_ENTRY_CANONICALIZATION_BRIDGE.md`
  before adding a character-entry-to-map path. `EntryCharacterRef` is a pure
  display normalization seam: local campaign selection remains local; only an
  approved and clearance-approved Room Lobby binding becomes a Room Runtime map
  candidate. It does not decide readiness, entry eligibility, map permissions,
  persistent token ownership, or character persistence.

## Character Clearance Alpha (P5.CHARACTER-CLEARANCE-ALPHA)
- Files: `src/components/platform/{JoinCampaignPanel,RoomLobbyShell}.tsx`,
  `src/lib/platform/{roomTypes,roomRuntimeEntryGuard,entryCharacterRef,characterClearanceSmoke}.ts`,
  `server/services/{submitActorBinding,approveActorBinding,rejectActorBinding,setMemberReady}.ts`.
- A room join is not player admission: a player chooses a local read-only Actor
  Vault record or session-only quick draft, submits it, receives host approval
  plus session admission, then marks ready. Hosts may enter without a character;
  spectators are read-only and do not submit or ready.
- Don't violate: all binding/admission/ready state is in-memory Room Server
  session state; no character-store write, CampaignActorInstance, persistent
  membership, persistent token ownership, rule engine, or permission shortcut.

## Token Rendering Clarity Patch (P5.TOKEN-RENDERING-CLARITY-PATCH)
- Files: `src/lib/map/tokenVisualIdentity.ts`, `tokenVisualIdentitySmoke.ts`,
  `src/components/platform/BasicMapBoard.tsx`, and existing map replay / scene
  snapshot compatibility seams.
- One MapToken has one circular visual body. Existing image URL takes priority;
  initials are the safe fallback. Name, HP, status, and combat link are external
  indicators, not duplicate avatars or new token state.
- Don't violate: no asset upload, avatar packs, image generation, event-schema
  change, Character Clearance change, or persistence.

## Token Ownership Control Binding (P5.TOKEN-OWNERSHIP-CONTROL-BINDING)
- Files: `src/lib/platform/roomTokenOwnership.ts`,
  `server/room/roomTokenControlGuard.ts`, `server/services/appendRoomMapEvent.ts`,
  `src/components/platform/{RoomRuntimeEntryBridge,BasicMapBoard}.tsx`; scripts
  `frontend:verify:token-ownership` and `runtime:verify:token-ownership`.
- Active hosts control all tokens. An active approved player can move only a
  binding-linked player-character token that maps to their approved clearance
  binding. `roomActorBinding`, vault, quick-draft, DND Lite, and campaign-actor
  variants require exact persisted member/binding metadata; spectators, pending
  members, monsters, NPCs, manual tokens, old metadata-free tokens, and other
  players' tokens are denied.
- Token metadata is a linkage clue, not authority: the server verifies viewer,
  room member, clearance binding, and persisted map token before it appends a
  move event. No persistence migration, full RBAC, fog/LOS, pathfinding, or
  automatic combat effect is added.

## Character Clearance Details and Token Control Fix
- Files: `src/lib/platform/characterClearanceDetails.ts`,
  `CharacterClearanceDetailsSmoke.ts`, `CharacterClearanceDetailsPanel.tsx`,
  Room Lobby binding transport, and existing token ownership guards.
- The optional review payload is a bounded, compatibility-safe host-review
  projection, not a full character sheet or rules engine. Player movement still
  requires authenticated viewer -> active member -> approved clearance binding
  -> exact persisted Token link.

## Room Player Flow Polish (P5.ROOM-PLAYER-FLOW-POLISH)
- Files: `src/lib/platform/roomPlayerFlow.ts`, `RoomLobbyShell.tsx`,
  `RoomRuntimeEntryBridge.tsx`, and `BasicMapBoard.tsx`.
- The UI derives one player-visible Room state at a time: join approval,
  character choice, host review, rejected character, Ready, table entry, host,
  or spectator. It is presentation over existing server contracts.
- Don't violate: no new auth/RBAC, clearance persistence, token ACL, character
  builder, automatic placement, or combat automation.

## Character Entry CTA Route Fix (P5.CHARACTER-ENTRY-CTA-ROUTE-FIX)
- Files: `src/lib/platform/characterEntryCta.ts`, `RoomLobbyShell.tsx`, and
  the DND workspace route.
- The Lobby displays direct Vault, quick-draft, full-creator, spectator, and
  host-skip actions without changing Room approval, clearance, Ready, Runtime,
  or token authority.

## Room Lobby IA Redesign (P5.ROOM-LOBBY-IA-REDESIGN)
- Files: `src/lib/platform/roomLobbyPresentationState.ts`,
  `roomLobbyPresentationStateSmoke.ts`, and `RoomLobbyShell.tsx`.
- One pure presentation adapter derives My Next Step from the existing room
  snapshot and Runtime-entry eligibility. The default Lobby presents a compact
  roster and host-only combined review queue; diagnostics and logs are
  collapsed.
- Don't violate: this adds no room permission, clearance, Ready, Runtime-entry,
  token-ownership, WebSocket, or persistence behavior.

## Room Disband Lifecycle Cleanup (P5.ROOM-DISBAND-LIFECYCLE-CLEANUP)
- Files: `server/services/disbandRoom.ts`, room Runtime permission guards,
  `roomLifecycle.ts`, Lobby/Runtime close states, and lifecycle smoke scripts.
- Disband maps to the existing non-destructive `closed` lifecycle status. Closed
  and archived rooms are absent from default room discovery; existing members
  receive a normal room snapshot and see a return path.
- Don't violate: no Room/event/scene deletion, migration, restore UI, or
  permission shortcut. A closed Room rejects joins, Ready, character submission,
  Runtime entry, RuntimeLog/dice writes, and map mutations.

## Combat Mode HUD Foundation (P5.COMBAT-MODE-HUD-FOUNDATION)
- Files: `src/lib/combat/combatModeHud.ts`, `CombatModeHud.tsx`,
  `CombatRuntimeTable.tsx`, `BasicMapBoard.tsx`, and Server Workspace wiring.
- Existing combat events remain the source of replay; `combat.started` now
  persists resolved missing initiatives and `combat.initiative_rolled` records
  a manual roll.
- The HUD is an operator aid, not combat automation: no spell execution,
  automatic damage, actor write-back, Room protocol change, or token-permission
  change is permitted.
