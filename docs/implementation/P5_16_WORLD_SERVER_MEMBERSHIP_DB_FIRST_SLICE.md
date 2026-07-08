# P5.16-P5.18 World Server + Membership + Multi Game System DB — First Slice

Server-only World Server + Membership + multi game-system persistence foundation,
mirroring the prior Postgres slices. **Repository foundation only — no permission
enforcement, no frontend, no API routes, no email, no chat/moderation, no
compendium/full-ruleset DB.** (Filename kept from the P5.16-P5.17 draft to avoid a
duplicate numbered migration; content now covers seven tables incl. game systems.)

## World Server concept · the Global Public Surface is NOT a server

A **World Server** is a scoped community/world space: owner + profile + settings +
campaigns + **multiple game systems** + roles + members + invites + join requests
(and future private packs / chat / compendium / AI context). The **Global Public
Surface** (homepage announcements, top broadcast, platform updates, public workshop,
public community/fan feeds, public tools/templates, activities, approved public
content) is the public *layer*, **not a normal server** — **not** modeled as a row.
This slice creates **no** main/global/default server record or seed. Public entry ≠
public data.

## Server ≠ Game System · a server enables MANY systems

A World Server is **not** the same thing as a Game System and is **not** bound to
exactly one. Via `world_server_game_system_bindings` a server may enable multiple
systems at once (DND-like fantasy, COC-like investigation, cyberpunk, generic d20,
generic percentile, narrative, blank custom, homebrew). `default_game_system_id` on
`world_servers` is a **convenience hint only — not an exclusivity constraint**;
exactly-one-default is **not** DB-enforced. A server with zero enabled systems is
allowed during setup. Worldview consistency is the owner's responsibility, not a
platform constraint.

## DDL — `server/db/migrations/0007_world_servers_membership.sql`

Seven tables. Manual DDL (no runner/auto-create). Apply **after** 0001 and 0002. No
Postgres enums (string conventions); no FK to not-yet-existing game-system/ruleset/
pack tables.

- **world_servers**: `world_server_id` PK, `owner_id` FK→users CASCADE,
  `server_handle` UNIQUE, display_name/description, `server_visibility`
  (private|unlisted|public_recruiting|public_listed), `join_policy`
  (invite_only|owner_approval|application|open), `lifecycle_status`
  (active|suspended|archived), **`default_game_system_id`** (opaque hint, no FK),
  three JSONB payloads, schema_version, timestamps, archived_at.
- **world_server_campaign_bindings**: `binding_id` PK, server FK, campaign FK,
  created_by, `binding_kind`, `visibility_scope`; `UNIQUE(world_server_id, campaign_id)`.
- **world_server_game_system_bindings**: `binding_id` PK, server FK, `game_system_id`
  (opaque), display_name, `system_kind` (template|custom|imported|homebrew),
  `binding_status` (enabled|disabled|deprecated|archived), `is_default`,
  `ruleset_template_id` / `current_ruleset_version_id` (opaque forward-compatible, no
  FK), `config_payload` JSONB, `enabled_pack_version_ids` JSONB array, created_by;
  `UNIQUE(world_server_id, game_system_id)`. **Multiple per server; one-default not
  DB-enforced.**
- **world_server_roles**: `role_id` PK, server FK, `role_key`, `role_kind`
  (owner|admin|moderator|member|guest|custom), `permissions_payload` (metadata),
  `is_system_role`, `sort_order`; `UNIQUE(world_server_id, role_key)`.
- **world_server_memberships**: `membership_id` PK, server FK, user FK, optional role
  FK + denormalized `role_key`, `membership_status`
  (active|pending|suspended|left|removed), invited/approved_by;
  `UNIQUE(world_server_id, user_id)`.
- **world_server_invites**: `invite_id` PK, server FK, `invite_code` UNIQUE,
  created_by, optional target user/email, `default_role_key`, `invite_status`
  (active|revoked|expired|accepted), max_uses/use_count, expires_at.
- **world_server_join_requests**: `join_request_id` PK, server FK, requester FK,
  reviewed_by, `request_status` (pending|approved|rejected|cancelled), messages,
  `requested_role_key`, requested_at/reviewed_at.

Each table carries the task-specified index set (incl. `default_game_system_id` on
world_servers and system/kind/status/default/version indexes on the game-system
table), all `IF NOT EXISTS`. No destructive SQL.

## Semantics (all metadata, not enforcement)

`server_visibility` = discovery metadata; `join_policy` = admission metadata; roles +
`permissions_payload` = future permission metadata; `membership_status` = data, not
access control; `invite_code` = opaque code, **not authorization**; join requests =
stored workflow state, not an approval API; game-system bindings = enablement
metadata, **no compendium/ruleset semantics enforced**. `owner_id` on `world_servers`
is the **canonical owner** for this slice (an owner membership row MAY exist). Campaign
binding does **not** change campaign/runtime authority. `default_game_system_id`,
`ruleset_template_id`, `current_ruleset_version_id`, and `enabled_pack_version_ids`
are forward-compatible opaque refs (P5.S1 ruleset-versioning contract).

## Repository — `server/adapters/postgresWorldServerRepository.ts`

Safe result union, injectable executor, generic `one`/`many` helpers, DB error
mapping (no raw driver errors). ~64 methods across the seven entities: world servers,
campaign bindings, **game system bindings** (get by id/system, list, list default,
bind, update, update status, archive/restore — `updateWorldServerSettings` updates
`default_game_system_id` + payloads, never a single server ruleset version), roles,
memberships, invites, join requests, plus `checkReadiness`. List options filter by
the documented columns and default to excluding archived; `listDiscoverableWorldServers`
defaults to public_recruiting/public_listed + active + non-archived. Error kinds:
not_configured, schema_missing (42P01), conflict (23505 duplicate handle/code/pair,
23503 missing FK), database_error (ECONN*), unknown.

## Schema Readiness — `server/db/postgresWorldServerSchemaReadiness.ts`

Statuses: not_configured | unreachable | user_schema_missing | campaign_schema_missing
| schema_missing | ready | error. Reuses Campaign readiness (chains User), then
verifies all seven world tables + required columns. Never creates tables or prints the
connection string.

## Read-only smoke

health → readiness → nonexistent server-id / handle / invite-code / game-system-binding
probes + a bounded `listDiscoverableWorldServers`. Writes nothing. Runner:
`verifyPostgresWorldServerSlice.ts` → `npm run db:verify:world`.

## Rollback write smoke

One transaction: create owner/member/requester users + campaign → world server →
get by id/handle → list by owner → update profile (→ public_recruiting) → **bind three
game systems (fantasy default, investigation, custom), verify ≥3 bindings, get by
id/system, list defaults, update binding + status** → update settings
(`default_game_system_id`) → list discoverable → roles → memberships → invite → join
request → campaign binding → archive/restore each of campaign binding, **game-system
binding**, invite, join request, membership, role, and server → **always ROLLBACK**.
Runner: `verifyPostgresWorldServerWriteSmoke.ts` → `npm run db:verify:world:write`.

## Verification commands

```
npm run db:verify:world          # read-only; not_configured OK without local Postgres
npm run db:verify:world:write    # rollback-only; not_configured OK
```

`not_configured` = DB env unset (expected). `schema_missing` / `user_schema_missing`
/ `campaign_schema_missing` = apply 0001, 0002, then 0007 first.

## Health · relationships

`/health` gains `database.worldServerSchema` (readiness status only; reuses the
campaign readiness chain — cacheable/removable if heavy). Relates to the Public
Surface Audit (public layer ≠ server) and the P5.S1 Server Ruleset Versioning / Soft
Update contract (the opaque ruleset/system refs point at that future work).

## Explicitly not implemented

Permission/role enforcement, effective-permission resolver, frontend UI, WorldServer
API routes, invite redemption / email delivery, join-approval API/workflow beyond
state changes, visibility enforcement, public workshop/community publish boundary,
compendium pack DB, full ruleset version DB, game-system exclusivity constraint,
server chat, moderation/review, AI context scope guard, global/main/default server
row, migration runner, auto-create, destructive SQL, runtime/WebSocket changes.

## Future path

Visibility / Scope DB → Server Ruleset Version DB (turns the opaque
`current_ruleset_version_id` into a real FK) → Compendium Pack Binding (validates
`enabled_pack_version_ids`) → Public Workshop / Community Publish Boundary → AI
Context Scope Guard → effective permission resolver + WorldServer API (enforces who
can invite/approve/manage/enable systems).
