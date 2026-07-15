# P5.API-CAMPAIGN-ROOM Campaign / Room / Runtime API Surface

## Purpose

This slice adds a server-only API surface for durable campaign, room, and
runtime metadata/history. It follows the existing World Server API boundary:
request authentication, scope resolution, permission guards, generic safe
responses, and repository-owned persistence.

It does not replace the live Room Server. Room Server and its WebSocket
transport remain authoritative for live lobby membership, readiness, approval,
and runtime presence.

## Route Families

All routes are scoped below:

`/api/world-servers/:worldServerId`

### Campaigns

- `GET /campaigns`
- `GET /campaigns/:campaignId`
- `POST /campaigns`
- `PATCH /campaigns/:campaignId`
- `POST /campaigns/:campaignId/archive`
- `POST /campaigns/:campaignId/restore`

Campaign scope is checked through the existing
`world_server_campaign_bindings` relationship. Creating a campaign creates the
campaign record and binds it to the selected World Server.

### Campaign Actor Instances

- `GET /campaigns/:campaignId/actors`
- `GET /campaigns/:campaignId/actors/:actorInstanceId`
- `POST /campaigns/:campaignId/actors`
- `POST /campaigns/:campaignId/actors/:actorInstanceId/archive`

This surface exposes the repository capabilities that already exist. There is
intentionally no actor-instance `PATCH` route because the current repository
does not expose an update port. The API does not create Campaign Membership,
RuntimeActor, or a live actor binding.

### Room and Lobby Metadata

- `GET /campaigns/:campaignId/rooms`
- `GET /campaigns/:campaignId/rooms/:roomId`
- `POST /campaigns/:campaignId/rooms`
- `PATCH /campaigns/:campaignId/rooms/:roomId`
- `GET /campaigns/:campaignId/rooms/:roomId/participants`
- `GET /campaigns/:campaignId/rooms/:roomId/lobby-slots`

These routes persist and read durable room records and stored lobby metadata.
They do not create or mutate the live Room Server room, participants, or
WebSocket state.

### Runtime Session Metadata

- `GET /campaigns/:campaignId/rooms/:roomId/runtime-session`
- `POST /campaigns/:campaignId/rooms/:roomId/runtime-session`
- `PATCH /campaigns/:campaignId/rooms/:roomId/runtime-session`

Runtime-session writes are metadata writes for durable coordination and history.
They do not start, stop, or authorize a live runtime session.

### Runtime Events

- `GET /campaigns/:campaignId/rooms/:roomId/runtime-events`
- `POST /campaigns/:campaignId/rooms/:roomId/runtime-events`

Events are append-only. Reads support `afterSeq` and a bounded `limit`; writes
use repository idempotency and sequence behavior. There are no event update or
delete routes. Event visibility is filtered at the handler boundary for the
requesting viewer.

## Auth, Scope, and Errors

Handlers compose the existing auth-session, current-viewer, request-scope, and
effective-permission guard boundaries. Repositories do not decide permissions.
Private resource existence can be hidden, and responses use the existing safe
envelope without SQL, database URLs, or internal permission reasons.

Room and runtime writes derive the acting user from the authenticated viewer;
client-provided creator/host identity is not trusted for authorization.

## Verification

`npm run api:verify:campaign-room -- --strict` runs 50 deterministic fake-
repository cases covering auth, scope, campaign lifecycle, actor instances,
room metadata, host/admin rules, runtime sessions, event pagination, event
idempotency, private-event filtering, route registration, and error
sanitization. It does not require Postgres and does not call the live Room
Server.

## Explicitly Deferred

- Frontend campaign/room API clients and UI integration.
- Live Room Server or WebSocket changes.
- RuntimeLog live bridge or Runtime authority changes.
- Full actor sheet, CampaignActorInstance migration, or membership persistence.
- Real auth provider, deployment, object storage, compendium import, or AI
  recap.
- Cross-repository transaction orchestration for campaign creation plus server
  binding; the current slice keeps this as a future transaction seam.
