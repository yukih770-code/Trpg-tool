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

## AI Memory / GeneratedArtifact (future)
- Docs: `DOMAIN_MODEL_BOUNDARY_AUDIT_V1` (AI section), `campaign-actor-instance-boundary`.
- Don't violate: AI is advisory only — never authoritative, never appends
  authoritative events, artifacts carry `sourceRefs` + human confirmation.
- Read when: adding any AI feature.

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
