# P5.19 Visibility / Scope / Rights Policy DB — First Slice

Server-only Visibility / Scope / Rights persistence foundation, mirroring the prior
Postgres slices. **Metadata only — enforces nothing:** no permission checks, no
publish workflow, no moderation, no public feed, no AI retrieval, no AI scope guard.
Future slices add enforcement, resolvers, publish/moderation workflows, and the AI
context scope guard.

## Purpose · public entry ≠ public data

This is the metadata foundation for global-public / server / campaign / user-private /
unlisted content, workshop/community publish gates, public search/profile eligibility,
AI scope, and rights/license/review metadata. **Public entry does not mean public
data:** a tool can be publicly visible while objects made with it stay
private/server/campaign by default. Server/campaign/private content is **not** public
automatically; public sharing flags **default false**; `ai_scope` **defaults
private_only**; `visibility_scope` **defaults user_private**. The **Global Public
Surface is not a server** — `global_public` is a scope value here, and a public
projection is a **separate record** (projection_kind) from its private source, so
publishing never mutates the source.

## DDL — `server/db/migrations/0008_visibility_scope_rights.sql`

Three tables. Manual DDL (no runner/auto-create). Apply **after** 0001, 0002, 0007.
Generic content refs — **no FK fanout to content tables**. No Postgres enums.

- **content_rights_policies**: `rights_policy_id` PK, `owner_id` FK→users, `policy_kind`
  (srd_open|cc_by|original_homebrew|user_private_import|server_private_import|
  community_free|unknown), license/attribution/source fields, boolean rights flags
  (redistribution/commercial/public_sharing/derivative/**ai_context**/**ai_training**,
  all default false), JSONB payloads, timestamps, archived_at.
- **content_visibility_records**: `visibility_record_id` PK, `owner_id` FK→users,
  optional `world_server_id`→world_servers (SET NULL), `campaign_id`→campaigns (SET
  NULL), `rights_policy_id`→content_rights_policies (SET NULL); generic `content_kind`
  + `content_id` + `projection_kind` (default 'source'); `visibility_scope` (default
  user_private); `public_search_allowed` / `public_profile_allowed` /
  `workshop_publish_allowed` / `community_feed_allowed` (all default false); `ai_scope`
  (default private_only); `review_status` (not_submitted…), `moderation_status`
  (not_reviewed…), `lifecycle_status` (active…); JSONB; `UNIQUE(content_kind,
  content_id, projection_kind)`.
- **content_publication_reviews**: `publication_review_id` PK, `visibility_record_id`
  FK→content_visibility_records CASCADE, `owner_id` FK→users, submitted/reviewed_by,
  `target_surface` (workshop|fan_plaza|public_profile|public_template_library|
  announcement_feature|other), `review_status` (pending…), messages, JSONB,
  submitted_at/reviewed_at.

Full task-specified index set per table, all `IF NOT EXISTS`. No destructive SQL.

## visibility_scope · ai_scope semantics

`visibility_scope`: **global_public** (public layer, still not auto-approved for
feeds), **server** (server members), **campaign** (campaign scope), **user_private**
(owner only), **unlisted** (direct-reference only, not public discovery). `ai_scope`:
**public**, **server_only**, **campaign_only**, **private_only** (default),
**disabled** — stored early so a future AI retrieval layer never reads across
boundaries. These are **stored metadata**, not enforcement.

## Rights · review/moderation · projection

Rights metadata (license, attribution, source, redistribution/commercial/derivative/
public-sharing/ai-context/ai-training booleans) is stored, **not license
enforcement**. Review/moderation (`review_status`, `moderation_status`,
`content_publication_reviews`) is **stored review workflow metadata**, not public
publishing — a review row is a request/record, not a live publication, and future
APIs decide who may submit/review/approve/revoke. `projection_kind` lets a
**public_projection** record carry public flags while the **source** record stays
private — publishing is a separate projection, never a mutation of the source.

## Repository — `server/adapters/postgresVisibilityRepository.ts`

Safe result union, injectable executor, generic `one`/`many` helpers, DB error
mapping. Rights policies: get/list-by-owner/create/update/archive/restore. Visibility
records: get by id / by content-ref, list by owner/world-server/campaign,
`listGlobalPublicVisibilityRecords` (assumes global_public + active + non-archived; **not
a public feed API**), create, update, update review status, archive/restore.
Publication reviews: get by id, list by visibility-record/owner/target-surface,
create, update status, archive/restore. `checkReadiness`. Error kinds: not_configured,
schema_missing (42P01), conflict (23505 duplicate content/projection, 23503 missing
FK), database_error (ECONN*), unknown.

## Schema Readiness — `server/db/postgresVisibilitySchemaReadiness.ts`

Statuses: not_configured | unreachable | user_schema_missing | campaign_schema_missing
| world_server_schema_missing | schema_missing | ready | error. Reuses World Server
readiness (chains User + Campaign + World Server), then verifies the three visibility
tables + required columns. Never creates tables or prints the connection string.

## Read-only smoke

health → readiness → nonexistent rights-policy / visibility-record / content-ref /
publication-review probes + bounded `listGlobalPublicVisibilityRecords`. Writes
nothing. Runner: `verifyPostgresVisibilitySlice.ts` → `npm run db:verify:visibility`.

## Rollback write smoke

One transaction: create owner/reviewer users + campaign + world server → rights policy
(get/list/update) → user_private source record (asserts public flags false, ai_scope
private_only; get by id/content-ref, list by owner) → server-scoped record (list by
server) → campaign-scoped record (list by campaign) → **global_public public_projection
record** (separate from the private source; list global-public; approve review status;
enable community feed) → publication review (get, list by record/owner/surface, approve
→ revoke) → archive/restore review, public record, private record, rights policy →
**always ROLLBACK**. Runner: `verifyPostgresVisibilityWriteSmoke.ts` →
`npm run db:verify:visibility:write`.

## Verification commands

```
npm run db:verify:visibility          # read-only; not_configured OK without local Postgres
npm run db:verify:visibility:write    # rollback-only; not_configured OK
```

`not_configured` = DB env unset (expected). `schema_missing` /
`*_schema_missing` = apply 0001, 0002, 0007, then 0008 first.

## Health · explicitly not implemented

`/health` gains `database.visibilitySchema` (readiness status only; reuses the world
readiness chain — cacheable/removable). Not implemented: permission enforcement,
effective-permission resolver, API guards, frontend integration, workshop/fan/community
publish workflow, public feed queries, moderation/review UI, AI context retrieval, AI
Context Scope Guard, embeddings/vector search, compendium DB, ruleset version DB,
content-table FK fanout, migration runner, auto-create, destructive SQL,
runtime/WebSocket changes.

## Future path

Effective permission resolver → Public Workshop / Community Publish Boundary → AI
Context Scope Guard (reads `ai_scope` before retrieval) → Compendium Pack visibility
binding → API guards → moderation/review UI.
