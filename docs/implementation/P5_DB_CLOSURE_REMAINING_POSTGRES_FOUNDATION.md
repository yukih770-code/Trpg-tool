# P5.DB-CLOSURE Remaining Postgres Foundation

This document summarizes the database-only closure pass that completes the
remaining Postgres foundation needed before real API/frontend integration.

## Why This Exists

Earlier P5 slices established users, campaigns, actors, assets, runtime events,
generated artifacts / AI memory, world servers / membership / game-system
bindings, visibility / rights, migration tooling, policy contracts, and API guard
contracts. The remaining platform domains still needed durable Postgres shapes so
future API work can attach to stable repository seams instead of inventing tables
inside route handlers.

This closure stays inside the DB boundary: no frontend, no API routes, no auth
provider, no WebSocket/runtime behavior, no AI model calls, no import parser, no
object upload/download, and no auto migration on server startup.

## Migration

- `server/db/migrations/0009_remaining_platform_foundation.sql`

The migration is additive only. It does not renumber prior migrations, does not
drop data, and does not include production seed data or copyrighted rules content.

## New DB Families

### Auth / Session / Account Runtime Foundation

Tables:
- `auth_sessions`
- `service_identities`
- `account_security_audit_records`

Purpose: future current-viewer lookup, session revocation/listing, service identity
metadata, and account security audit metadata. This does not implement OAuth, JWT,
password auth, or DB-backed route enforcement.

### Server Settings / Ruleset Versions / Soft Updates

Tables:
- `world_server_settings_versions`
- `world_server_ruleset_versions`
- `campaign_ruleset_snapshots`
- `world_server_update_notices`

Purpose: persistent server settings snapshots, ruleset version metadata, campaign
ruleset pins, and soft update notices. This keeps server settings inside server
context and preserves old-version room entry as representable metadata.

### Compendium / Pack / Ruleset Content

Tables:
- `game_system_registry`
- `ruleset_templates`
- `ruleset_versions`
- `compendium_packs`
- `compendium_pack_versions`
- `compendium_entries`
- `world_server_pack_bindings`
- `campaign_pack_bindings`
- `private_import_batches`

Purpose: private/server/campaign/public pack metadata and bindings. Public pack
records do not make private imports public; visibility and rights metadata remain
the source of public exposure decisions.

### Campaign Actor Instance / Runtime Actor Metadata

Tables:
- `campaign_actor_instances`
- `campaign_actor_bindings`
- `runtime_actor_slots`

Purpose: durable campaign-scoped actor instance metadata, source snapshot hashes,
player-to-actor campaign bindings, and runtime actor slot anchors. Character Vault
actors remain source assets; runtime authority remains live runtime.

### Room / Lobby / Runtime Session Metadata

Tables:
- `room_records`
- `room_participants`
- `room_lobby_slots`
- `runtime_session_bindings`

Purpose: durable room/lobby metadata and runtime session anchors. The Room Server
remains live authority; this does not change WebSocket behavior.

### Chat / Notes / Maps / Handouts

Tables:
- `content_threads`
- `content_messages`
- `content_documents`
- `map_records`
- `scene_map_bindings`

Purpose: durable content sources for chat, notes, handouts, maps, and scene-map
bindings. Blobs are not stored in Postgres; asset metadata references are optional.

### Audit / Moderation / AI Operation Persistence

Tables:
- `server_audit_log`
- `permission_decision_audit_records`
- `ai_operation_audit_records`
- `moderation_actions`

Purpose: audit-ready records for admin actions, permission decisions, AI operation
metadata, and moderation decisions. Denied private bodies, denied summaries, and
model prompts must not be persisted here.

### Notifications

Tables:
- `user_notifications`

Purpose: invitation, join-request, mention, and server/campaign notification
metadata. This does not implement push notifications or email sending.

## Repository / Readiness / Smoke Coverage

Repository:
- `server/adapters/postgresPlatformFoundationRepository.ts`

Readiness:
- `server/db/postgresPlatformFoundationSchemaReadiness.ts`

Read-only smoke:
- `server/db/postgresPlatformFoundationRepositorySmoke.ts`
- `server/db/verifyPostgresPlatformFoundationSlice.ts`
- package script `db:verify:platform`

Rollback write smoke:
- `server/db/postgresPlatformFoundationRepositoryWriteSmoke.ts`
- `server/db/verifyPostgresPlatformFoundationWriteSmoke.ts`
- package script `db:verify:platform:write`

Aggregate verification:
- `server/db/postgresAllSchemaReadiness.ts` now includes `platformFoundation`.
- package script `db:verify:all` reports the new family.

## Safety Rules

- Server-only repository; no frontend import.
- No DB URL output and no frontend database env.
- No business authorization decisions in repository methods.
- No AI policy/model calls from repository methods.
- No live Room/Runtime authority changes.
- No auto migration on server startup or health checks.
- Write smoke is rollback-only.

## Next Phase

The database layer is now ready for future API work:
- World Server API
- Membership / invite / join request API
- Server Settings API
- Compendium / pack API
- Campaign / actor instance API
- Room / lobby / runtime session API
- Chat / handout / map API
- Audit / notification API
- Frontend real-data integration
