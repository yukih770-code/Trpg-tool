# Implementation Context Manifest v1

**Read this before you code.** A short operating contract for Fable/Codex runs on
this repo. Pair it with `docs/architecture/ARCHITECTURE_INDEX_V1.md` (the map).

## Mandatory start condition

1. `git status --short` — if the prerequisite task isn't committed OR the tree is
   dirty, **stop and report**; do not continue on a dirty tree unless explicitly
   instructed.
2. Read the relevant Architecture Index section(s) for your task domain (below).
3. Run baseline verification when the environment allows (never fake results).

## Standard verification

```
npx tsc --noEmit
npx tsc -p server/tsconfig.server.json --noEmit
npm run build
npm run server:build
npm run db:verify:user           # not_configured is OK without local Postgres — do not fake
npm run db:verify:user:write     # rollback-only smoke
npm run api:verify:user          # fake repo, no DB; expect failed:0
git diff --check
```

If `dist-server/` is generated:

```
Remove-Item -Recurse -Force .\dist-server   # PowerShell
Test-Path .\dist-server                       # expect: False
```

## Standard leak checks

```
Search for Vite-prefixed database env names in the repo  # expect: 0
rg "DATABASE_URL" src                                      # expect: 0 (server-only)
```

PowerShell fallback: `Select-String -Path .\src\**\* -Pattern "DATABASE_URL"`.

## Git rules

- **No `git add`, no `git commit`** unless explicitly instructed.
- Suggested `git add` must list **exact paths only** — never `git add .`/`-A`.

## Invariants (do not violate)

- **Frontend must not use database env** (`DATABASE_URL` and any Vite-prefixed
  database env never in `src/` or the client bundle).
- **Server owns database access** — the frontend never calls Postgres or
  `/api/dev/users`.
- **Local anonymous identity** is the current viewer until real Auth exists.
- **`author-sample` is a seed-content author alias only** — never the current
  account.
- **User API dev routes** stay dev-only, env-gated, prod-off, read-only; no public
  write route; `saveUserProfileHandler` never mounted.
- **AI has no authority** — advisory only; never appends authoritative events or
  writes core aggregates.
- **RuntimeLog is append-only** with authority-assigned `seq`; corrections are new
  events, never in-place edits.
- **Ownership is additive** (registries, never rewrite records); migrate on read.
- **No vendor lock-in** — vendors live behind adapters, never in the domain.

## Task-domain read sets

| You are changing… | Read first |
| --- | --- |
| Frontend account/profile UI | Index → Frontend Account Surface + Identity/Ownership; `FRONTEND_ACCOUNT_SURFACE_IDENTITY_BINDING_V1` |
| User DB | Index → Postgres User First Slice; `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`, `POSTGRES_FIRST_SLICE_USER_REPOSITORY_V1`, readiness checklist; `server/db/**` + `server/adapters/postgresUserRepository.ts` |
| User API | Index → User API Boundary; `POSTGRES_USER_API_BOUNDARY_V1`, `POSTGRES_USER_DEV_API_VERIFICATION_V1`; `server/api/**` |
| Campaign DB (P5.11) | Index → Campaign DB; `POSTGRES_CAMPAIGN_REPOSITORY_FIRST_SLICE_V1`, `P5_11_CAMPAIGN_DB_FIRST_SLICE_READINESS_V1`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1` §3.4; `server/adapters/postgresCampaignRepository.ts`, `server/db/postgresCampaignSchemaReadiness.ts`, `server/db/migrations/0002_campaigns.sql`; `campaignOwnership.ts` (migration source) |
| Actor / Character Vault DB (P5.12) | Index → Actor / Character Vault DB; `POSTGRES_ACTOR_REPOSITORY_FIRST_SLICE_V1`, `P5_12_ACTOR_DB_FIRST_SLICE_READINESS_V1`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`; `server/adapters/postgresActorRepository.ts`, `server/db/postgresActorSchemaReadiness.ts`, `server/db/migrations/0003_actors.sql`; `actorVaultOwnership.ts` + `actorVaultRepositoryBridge.ts` (migration source / read shape) |
| Asset / Media Metadata DB (P5.13) | Index → Asset / Media Metadata DB; `POSTGRES_ASSET_REPOSITORY_FIRST_SLICE_V1`, `P5_13_ASSET_DB_FIRST_SLICE_READINESS_V1`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1` §3.8/§3.9; `server/adapters/postgresAssetRepository.ts`, `server/db/postgresAssetSchemaReadiness.ts`, `server/db/migrations/0004_asset_metadata.sql`; `src/lib/architecture/mediaAsset.ts` (metadata/storage-ref shape). Metadata only — blobs never in Postgres |
| RuntimeEvent DB (P5.14) | Index → RuntimeEvent DB; `P5_14_RUNTIME_EVENT_DB_FIRST_SLICE`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`; `server/adapters/postgresRuntimeEventRepository.ts`, `server/db/postgresRuntimeEventSchemaReadiness.ts`, `server/db/migrations/0005_runtime_events.sql`. Append-only events; long-term persistence, NOT live authority; Room Server stays live authority; no WebSocket change |
| RuntimeEvent Persistence Bridge (P5.RUNTIME-BRIDGE) | Index → RuntimeEvent Persistence Bridge; `P5_RUNTIME_EVENT_PERSISTENCE_BRIDGE`; `server/runtime/runtimeEventPersistenceBridge.ts`, `server/runtime/runtimeEventRepositoryPortAdapter.ts`, `server/runtime/runtimeSessionContext.ts`, `server/runtime/runtimeEventPersistenceBridgeSmoke.ts`, `server/runtime/verifyRuntimeEventPersistenceBridge.ts`, `server/api/campaignRoomApiHandlers.ts`, `server/api/campaignRoomApiHandlersSmoke.ts`; HTTP Runtime Event append API uses the dependency-injected append-only bridge with deterministic idempotency and safe failure mapping; live Room Server/WebSocket remains authoritative and unwired |
| Real Postgres / HTTP E2E Verification Harness (P5.E2E-DB-HTTP) | Index → Real Postgres / HTTP E2E Verification Harness; `P5_E2E_DB_HTTP_VERIFICATION`; `server/db/verifyPostgresE2EReadiness.ts`, `server/api/verifyHttpE2EFlow.ts`, `src/lib/api/frontendApiE2ESmoke.ts`; safe DB readiness orchestrator, explicit migration/write flags, existing HTTP chain smoke, and typed frontend client dry/real read smoke; no schema/API/UI/auth/WebSocket/deployment changes |
| Cloud Private Alpha Foundation (P5.CLOUD-ALPHA-FOUNDATION) | Index → Cloud Private Alpha Foundation; `docs/deployment/CLOUD_PRIVATE_ALPHA_DEPLOYMENT.md`, `docs/deployment/PRIVATE_ALPHA_AUTH_PLAN.md`; `server/config/serverRuntimeConfig.ts`, `cloudPrivateAlphaConfigSmoke.ts`, `cloudPrivateAlphaE2EPlanSmoke.ts`, `server/auth/privateAlphaAuth.ts`, `server/api/privateAlphaAuthApiRoutes.ts`, `src/components/platform/PrivateAlphaLoginPanel.tsx`, `.env.cloud.*.example`; explicit `localDev` / `cloudPrivateAlpha` / `production` contract, cloud startup fails closed without backend DB/public URLs/explicit CORS or when dev auth is requested, backend-only invite/session auth and a minimal login-to-first-server onboarding path; no cloud deployment, public registration, OAuth, DB migration, or protocol change |
| GeneratedArtifact / AI Memory DB (P5.15) | Index → GeneratedArtifact / AI Memory DB; `P5_15_GENERATED_ARTIFACT_AI_MEMORY_DB_FIRST_SLICE`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`; `server/adapters/postgresGeneratedArtifactRepository.ts`, `server/db/postgresGeneratedArtifactSchemaReadiness.ts`, `server/db/migrations/0006_generated_artifacts_ai_memory.sql`. Stores AI outputs + curated memory; no model call / embeddings / retrieval; visibility_scope is metadata only; AI advisory, not authoritative |
| Server ruleset versioning / soft update UX (P5.S1, contract only) | Index → Server Ruleset Versioning & Soft Update UX; `SERVER_RULESET_VERSIONING_SOFT_UPDATE_UX_V1`; `src/lib/platform/serverRulesetVersioning.ts`, `src/lib/platform/softUpdatePolicy.ts`, `src/lib/platform/serverRulesetVersioningSmoke.ts`. Types + pure helpers only — no UI/DB/runtime/permission; snapshots + soft update; never hard-refresh a dirty editor |
| World Server + Membership + Game Systems DB (P5.16-P5.18) | Index → World Server + Membership + Game Systems DB; `P5_16_WORLD_SERVER_MEMBERSHIP_DB_FIRST_SLICE`, `PUBLIC_SURFACE_SYSTEM_AUDIT_V1`; `server/adapters/postgresWorldServerRepository.ts`, `server/db/postgresWorldServerSchemaReadiness.ts`, `server/db/migrations/0007_world_servers_membership.sql`. Seven tables (server/campaign-bindings/game-system-bindings/roles/memberships/invites/join_requests); Global Public Surface is NOT a server row; Server ≠ Game System (a server enables MULTIPLE systems, default is a non-exclusive hint); roles/membership/invite/system-bindings are metadata, NOT permission enforcement |
| Visibility / Scope / Rights DB (P5.19) | Index → Visibility / Scope / Rights DB; `P5_19_VISIBILITY_SCOPE_RIGHTS_DB_FIRST_SLICE`, `PUBLIC_SURFACE_SYSTEM_AUDIT_V1`; `server/adapters/postgresVisibilityRepository.ts`, `server/db/postgresVisibilitySchemaReadiness.ts`, `server/db/migrations/0008_visibility_scope_rights.sql`. Three tables (rights_policies/visibility_records/publication_reviews); metadata only — NO enforcement; public entry ≠ public data; public flags default false, ai_scope default private_only; public_projection ≠ private source; generic content refs, no content FK fanout |
| Effective Permission Resolver (P5.20, contract only) | Index → Effective Permission Resolver; `P5_20_EFFECTIVE_PERMISSION_RESOLVER_CONTRACT`; `server/policy/effectivePermissionResolver.ts`, `server/policy/effectivePermissionResolverSmoke.ts`, `server/policy/verifyEffectivePermissionResolver.ts` (`policy:verify:permission`). Pure deterministic policy interpreting P5.19 metadata — deny by default; no DB/API/frontend/AI; NOT enforcement (future API guards call it); custom permissions_payload not interpreted yet |
| AI Context Scope Guard (P5.21, contract only) | Index → AI Context Scope Guard; `P5_21_AI_CONTEXT_SCOPE_GUARD_CONTRACT`; `server/policy/aiContextScopeGuard.ts`, `server/policy/aiContextScopeGuardSmoke.ts`, `server/policy/verifyAiContextScopeGuard.ts` (`policy:verify:ai-scope`). Pure batch guard reusing P5.20 — AI must not bypass visibility/rights; deny by default; denied items redacted (no body/summary); no DB/API/frontend/model/retrieval; future AI Gateway preflight calls it |
| AI Context Retrieval Safety Pipeline (P5.22-P5.24, contract only) | Index → AI Context Retrieval Safety Pipeline; `P5_22_AI_CONTEXT_RETRIEVAL_SAFETY_PIPELINE_CONTRACT`; `server/policy/aiContextSourceRegistry.ts`, `server/policy/aiContextRetrievalPreflight.ts`, `server/policy/aiContextPackBuilder.ts`, `server/policy/aiContextRetrievalPipelineSmoke.ts`, `server/policy/verifyAiContextRetrievalPipeline.ts` (`policy:verify:ai-retrieval`). registry→preflight→normalize→P5.21 guard→pack→manifest→audit; deny source by default; unknown denied; preflight not sufficient (guard still required); denied plans/items/audit carry no body/summary; no DB/API/frontend/model/retrieval |
| Auth Session / API Guard Foundation (P5.28-P5.31) | Index → Auth Session / API Guard Foundation; `P5_28_AUTH_SESSION_API_GUARD_FOUNDATION`; `server/auth/requestAuthSession.ts`, `server/auth/currentViewerContext.ts`, `server/api/apiRequestContext.ts`, `server/api/apiPermissionGuard.ts`, `server/api/guardedApiHandler.ts`, `server/api/apiGuardFoundationSmoke.ts`, `server/api/verifyApiGuardFoundation.ts` (`api:verify:guard`). Frontend state is NOT security; anonymous+deny by default; dev auth dev-only; service-internal is not a user; scope is not authorization; guard delegates to P5.20; generic public errors (no reason leak); no DB / route enforcement / auth provider / frontend |
| World Server / Membership / Settings API (P5.API-CORE) | Index → World Server / Membership / Settings API; `P5_API_CORE_WORLD_SERVER_SURFACE`; `server/api/worldServerApiHandlers.ts`, `server/api/worldServerApiRoutes.ts`, `server/api/worldServerApiHandlersSmoke.ts`, `server/api/verifyWorldServerApiHandlers.ts` (`api:verify:world`); composes the P5.28-P5.31 auth/scope/guard boundaries with existing World Server + platform foundation repositories; 46 fake-repository cases; no frontend/auth-provider/WebSocket/runtime/AI/upload; pack bindings deferred until a clear repository port exists |
| Campaign / Room / Runtime API Surface (P5.API-CAMPAIGN-ROOM) | Index → Campaign / Room / Runtime API Surface; `P5_API_CAMPAIGN_ROOM_RUNTIME_SURFACE`; `server/api/campaignRoomApiHandlers.ts`, `server/api/campaignRoomApiRoutes.ts`, `server/adapters/postgresCampaignRoomRepository.ts`, `server/api/campaignRoomApiHandlersSmoke.ts`, `server/api/verifyCampaignRoomApiHandlers.ts` (`api:verify:campaign-room`); campaign CRUD/lifecycle, actor-instance list/create/archive, durable room/lobby metadata, runtime-session metadata, append-only runtime events; existing auth/scope/guard and `world_server_campaign_bindings`; live Room Server/WebSocket remains authoritative; 50 fake-repository cases; no frontend/live runtime/AI/migration; actor PATCH intentionally absent |
| Frontend Server Workspace Real Data (P5.FRONTEND-REALDATA) | Index → Frontend Server Workspace Real Data; `P5_FRONTEND_SERVER_WORKSPACE_REAL_DATA`; `src/lib/api/apiTypes.ts`, `src/lib/api/apiClient.ts`, `src/lib/api/worldServerApiClient.ts`, `src/lib/worldServer/useWorldServers.ts`, `src/lib/worldServer/useWorldServerDetail.ts`, `src/App.tsx`; typed World Server API client, loading/error/empty states, dev-only viewer seam, explicit demo fallback, server detail/settings/multi-system read integration; no frontend security, auth provider, DB env, WebSocket/runtime, campaign/room integration |
| Frontend Campaign / Room / Runtime Real Data (P5.FRONTEND-CAMPAIGN-REALDATA) | Index → Frontend Campaign / Room / Runtime Real Data; `P5_FRONTEND_CAMPAIGN_ROOM_REAL_DATA`; `src/lib/api/campaignRoomApiClient.ts`, `src/lib/campaignRoom/useCampaigns.ts`, `src/lib/campaignRoom/useCampaignDetail.ts`, `src/lib/campaignRoom/useRoomDetail.ts`, `src/lib/campaignRoom/useRuntimeEvents.ts`, `src/components/platform/ServerCampaignWorkspace.tsx`, `src/lib/api/campaignRoomApiClientSmoke.ts` (`frontend:verify:campaign-room`); selected API-backed server home uses real campaign/room/runtime metadata; demo rows remain separate; append-only event read/append only; no frontend security, DB env, live WebSocket/runtime rewrite, full VTT/character sheet, AI, deployment |
| Local Playable Lobby (P5.LOCAL-PLAYABLE-LOBBY) | Index → Local Playable Lobby; `P5_LOCAL_PLAYABLE_LOBBY`; `src/components/platform/LocalDevIdentitySwitcher.tsx`, `src/lib/api/apiClient.ts`, `src/lib/api/campaignRoomApiClient.ts`, `src/components/platform/ServerCampaignWorkspace.tsx`, `src/lib/localPlayableLobby/localPlayableLobbySmoke.ts` (`frontend:verify:local-playable-lobby`); local-only dev identity switcher, API-backed campaign/room/lobby summaries, campaign character-record surface, runtime-session metadata, append-only persisted event panel; no real auth, no frontend security, no DATABASE_URL, no WebSocket rewrite, no live ready/membership authority, no RuntimeActor/full VTT |
| Combat Runtime Table (P5.COMBAT-RUNTIME-TABLE) | Index → Combat Runtime Table; `P5_COMBAT_RUNTIME_TABLE`; `src/lib/combat/combatRuntimeTypes.ts`, `src/lib/combat/useCombatRuntimeTable.ts`, `src/components/platform/CombatRuntimeTable.tsx`, `src/lib/combat/combatRuntimeTableSmoke.ts` (`frontend:verify:combat-runtime`); local initiative/turn table with append-only `combat.*` runtime events; no live Room Server/WebSocket authority, rules automation, character/inventory writeback, map/token layer, or CampaignActorInstance migration |
| Basic Map Board (P5.BASIC-MAP-BOARD) | Index → Basic Map Board; `P5_BASIC_MAP_BOARD`; `src/lib/map/mapRuntimeTypes.ts`, `src/lib/map/useMapRuntimeBoard.ts`, `src/lib/map/mapRuntimeReplay.ts`, `src/components/platform/BasicMapBoard.tsx`, `src/lib/map/mapRuntimeReplaySmoke.ts` (`frontend:verify:map-runtime`, `frontend:verify:map-replay`); local background/viewport/token projection with append-only `map.*` event replay; no live WebSocket sync, DB map persistence, asset upload, grid/fog/LOS/walls, permissions, or full VTT |
| Scene Runtime Snapshot (P5.SCENE-RUNTIME-SNAPSHOT) | Index → Scene Runtime Snapshot; `P5_SCENE_RUNTIME_SNAPSHOT`; `src/lib/scene/sceneRuntimeSnapshotTypes.ts`, `src/lib/scene/sceneRuntimeSnapshot.ts`, `src/lib/scene/sceneRuntimeSnapshotSmoke.ts`, `src/components/platform/SceneRuntimeSnapshotPanel.tsx` (`frontend:verify:scene-snapshot`); host-controlled local JSON snapshot of the current combat/map projection with version validation, sanitization, and context mismatch warnings. No database persistence, full backup, asset archive, WebSocket sync, permission enforcement, or RuntimeActor writeback. |
| Persisted Scene Library (P5.PERSISTED-SCENE-LIBRARY) | Index → Persisted Scene Library; `P5_PERSISTED_SCENE_LIBRARY`; `server/db/migrations/0010_scene_state_documents.sql`, `server/adapters/postgresSceneStateRepository.ts`, `server/api/campaignRoomApiHandlers.ts`, `server/api/campaignRoomApiRoutes.ts`, `src/lib/campaignRoom/useSceneStates.ts`, `src/components/platform/SavedSceneLibraryPanel.tsx`. Saved combat/map snapshots are room-scoped server documents with explicit local apply and optional append-only audit events. No live sync, runtime authority, asset storage, full campaign backup, or VTT permissions. |
| DND Dice / Checks Runtime Layer (P5.DND-DICE-CHECKS) | Index → DND Dice / Checks Runtime Layer; `P5_DND_DICE_CHECKS`; `src/lib/dnd/dndDiceTypes.ts`, `src/lib/dnd/dndDiceRoller.ts`, `src/components/platform/DndDiceCheckPanel.tsx`, `src/lib/dnd/dndDiceRollerSmoke.ts` (`frontend:verify:dnd-dice`). Safe frontend-local DND dice parsing, d20 checks, attack/damage-lite resolution, and append-only DND runtime-event drafts for DND campaign pages. No full rules engine, character writeback, backend/API contract, or live authority change. |
| DND Lite Actor Sheet (P5.DND-LITE-ACTOR-SHEET) | Index → DND Lite Actor Sheet; `P5_DND_LITE_ACTOR_SHEET`; `src/lib/dnd/dndLiteActorTypes.ts`, `src/lib/dnd/dndLiteActorSheet.ts`, `src/components/platform/DndLiteActorSheetPanel.tsx`, `src/lib/dnd/dndLiteActorSheetSmoke.ts` (`frontend:verify:dnd-lite-actor`). Host-operated, page-local DND actor data keyed by existing Campaign Actor Instance ids for dice and combat prefill. No actor-vault/database/server write, full builder, rules automation, or authority change. |
| Private DND Monster Templates (P5.DND-PRIVATE-MONSTER-IMPORT) | Index → Private DND Monster Templates; `P5_DND_PRIVATE_MONSTER_IMPORT`; `0011_dnd_private_monster_templates.sql`, `postgresDndPrivateMonsterRepository.ts`, `importPrivateDndMonsters.ts`, `DndMonsterTemplateLibraryPanel.tsx`. World Server-scoped private imports only; dry-run/apply importer, private API, compact library, combat/dice/actor prefill. No imported data in repo, no public seed pack, OCR, scraping, upload, live sync, or rules automation. |
| DB Migration Runner / Bootstrap / Verify CLI (P5.25-P5.27) | Index → DB Migration Runner / Bootstrap / All-Schema Verify; `P5_25_DB_MIGRATION_RUNNER_BOOTSTRAP_CLI`; `server/db/postgresMigrationRegistry.ts`, `server/db/postgresMigrationRunner.ts`, `server/db/postgresAllSchemaReadiness.ts`, `server/db/migrations/0000_migration_history.sql`; CLIs `db:migrations:status`/`db:migrations:apply`/`db:bootstrap`/`db:verify:all`. Dry-run by default; explicit --apply to write; fail closed on mismatch/out-of-order/duplicate; no DB URL / SQL output; no auto-apply on startup or /health; no destructive rollback; write smokes manual |
| Remaining Platform DB Foundation (P5.DB-CLOSURE) | Index → Remaining Platform DB Foundation; `P5_DB_CLOSURE_REMAINING_POSTGRES_FOUNDATION`; `server/db/migrations/0009_remaining_platform_foundation.sql`, `server/adapters/postgresPlatformFoundationRepository.ts`, `server/db/postgresPlatformFoundationSchemaReadiness.ts`, `server/db/postgresPlatformFoundationRepositorySmoke.ts`, `server/db/postgresPlatformFoundationRepositoryWriteSmoke.ts`. DB-only closure for auth sessions, server settings/ruleset versions, compendium packs, campaign actor instances, room/lobby metadata, content docs/maps, audit/moderation/AI operation metadata, notifications. No frontend/API/auth provider/runtime/AI/upload; repository stores metadata only and never decides permissions; write smoke rolls back |
| Runtime / session / log | Index → Runtime/Room Authority; `RUNTIME_EVENT_REPLAY_BOUNDARY_AUDIT_V1`; `server/services/**`, `runtimeLogLocalStore.ts` |
| AI features | Index → AI Memory; `DOMAIN_MODEL_BOUNDARY_AUDIT_V1` (AI section) |

## Verification script index

| Script | Purpose | Needs DB? |
| --- | --- | --- |
| `npm run db:verify:user` | read-only user DB slice check | optional (not_configured OK) |
| `npm run db:verify:user:write` | rollback-only user write smoke | optional |
| `npm run db:verify:campaign` | read-only campaign DB slice check | optional (not_configured OK) |
| `npm run db:verify:campaign:write` | rollback-only campaign write smoke | optional |
| `npm run db:verify:actor` | read-only actor DB slice check | optional (not_configured OK) |
| `npm run db:verify:actor:write` | rollback-only actor write smoke | optional |
| `npm run db:verify:asset` | read-only asset DB slice check | optional (not_configured OK) |
| `npm run db:verify:asset:write` | rollback-only asset write smoke | optional |
| `npm run db:verify:runtime` | read-only runtime event DB slice check | optional (not_configured OK) |
| `npm run db:verify:runtime:write` | rollback-only runtime append smoke | optional |
| `npm run runtime:verify:persistence-bridge` | fake-repository runtime persistence bridge smoke | no |
| `npm run db:verify:generated` | read-only generated artifact DB slice check | optional (not_configured OK) |
| `npm run db:verify:generated:write` | rollback-only generated artifact write smoke | optional |
| `npm run db:verify:world` | read-only world server DB slice check | optional (not_configured OK) |
| `npm run db:verify:world:write` | rollback-only world server write smoke | optional |
| `npm run db:verify:visibility` | read-only visibility DB slice check | optional (not_configured OK) |
| `npm run db:verify:visibility:write` | rollback-only visibility write smoke | optional |
| `npm run db:verify:platform` | read-only remaining platform DB foundation check | optional (not_configured OK) |
| `npm run db:verify:platform:write` | rollback-only remaining platform foundation write smoke | optional |
| `npm run db:verify:scene-state` | read-only persisted scene library DB check | optional (not_configured OK) |
| `npm run db:verify:scene-state:write` | rollback-only persisted scene library write smoke | optional |
| `npm run policy:verify:permission` | pure permission resolver smoke (no DB) | no |
| `npm run policy:verify:ai-scope` | pure AI context scope guard smoke (no DB) | no |
| `npm run policy:verify:ai-retrieval` | pure AI retrieval pipeline smoke (no DB) | no |
| `npm run api:verify:guard` | pure auth/API guard foundation smoke (no DB) | no |
| `npm run db:migrations:status` | read-only migration status | optional (not_configured OK) |
| `npm run db:migrations:apply -- --dry-run` | plan pending migrations (no writes) | optional |
| `npm run db:migrations:apply -- --apply` | apply pending migrations in order | yes (writes) |
| `npm run db:bootstrap -- --dry-run` | dry-run apply + all-schema readiness | optional |
| `npm run db:verify:all` | aggregate read-only schema readiness + status | optional (not_configured OK) |
| `npm run api:verify:user` | handler contract smoke (fake repo) | no |
| `npm run api:verify:world` | World Server API handler smoke (fake repos, 46 cases) | no |
| `npm run api:verify:campaign-room` | Campaign / Room / Runtime API handler smoke (fake repos, 50 cases) | no |
| `npm run frontend:verify:scene-state` | persisted scene library client request-shape smoke | no |
