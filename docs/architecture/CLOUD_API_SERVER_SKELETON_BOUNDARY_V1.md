# Cloud API Server Skeleton Boundary v1

Status: Architecture boundary / skeleton map.

<!-- AI-LANDMARK: CLOUD_API_SERVER_SKELETON_BOUNDARY_V1 -->

This document describes the long-term server-side module boundary for the cloud
backend. It does not implement deployment, database access, authentication,
object storage, pub/sub, protocol changes, or runtime persistence.

## 1. Server Boundary Map

Long-term server layering:

```text
server/
  api/
    public HTTP API boundary
  room/
    WebSocket / room authority boundary
  config/
    deployment profile / endpoint / env boundary
  adapters/
    auth/
    persistence/
    storage/
    pubsub/
  services/
    business use cases
  protocol/
    transport DTO / room protocol
```

Current code does not need to move into this layout immediately. The existing
`server/room-server.ts` entry remains the local development Room Server entry.

## 2. API Server Responsibility

The API Server is the long-term boundary for non-realtime platform APIs:

- users and account-facing profile data,
- campaign repository APIs,
- actor repository APIs,
- Workshop and community metadata,
- asset metadata and upload coordination,
- permission checks,
- import/export orchestration,
- AI job submission and review surfaces.

The API Server should not become the realtime runtime authority unless a later
contract explicitly changes that boundary.

## 3. Room Server Responsibility

The Room Server remains the runtime authority for room and table state:

- room creation and join flow,
- member approval and rejection,
- ready state,
- actor binding and clearance approval,
- authoritative runtime event append,
- authoritative dice roll event append,
- WebSocket room/runtime projection broadcasts.

Clients submit intents. Room Server validates, writes or appends authoritative
events, then broadcasts projections.

## 4. Config Boundary

Server runtime configuration should be explicit and environment-driven:

- deployment environment,
- local vs cloud runtime mode,
- HTTP port,
- public HTTP URL,
- public WebSocket URL,
- allowed CORS origins.

Local defaults may use localhost for development. Production must not silently
fall back to localhost as the formal public endpoint.

## 5. Adapter Boundaries

### Auth Adapter

Auth identifies the user. It does not directly decide all business permissions.
Server services must still apply campaign, room, runtime, and projection rules.

### Persistence Adapter

Persistence adapter work should target PostgreSQL as the long-term primary
database. This document does not define schema or migrations.

### Storage Adapter

Storage adapter work should target S3-compatible object storage for large
assets. Database records should store metadata, ownership, permission, checksums,
and object keys rather than embedding binary assets.

### PubSub Adapter

PubSub is a later scaling boundary for multi-instance room sync and fanout.
Redis, NATS, or another transport are implementation choices, not contracts.

## 6. Services Boundary

`server/services/` remains the home for business use cases. Services should own
authorization decisions and call adapters later. They should not let frontend
state, room codes, or public codes stand in for permissions.

## 7. Protocol Boundary

`server/protocol/` owns transport DTOs and protocol re-exports. This skeleton
does not change HTTP routes, WebSocket envelope, or Room Runtime protocol.

## 8. Current-Scope Non-Migration

This boundary package intentionally does not:

- move `server/room-server.ts`,
- split the current Express app,
- change endpoints,
- change WebSocket protocol,
- connect Postgres,
- connect S3/R2,
- connect Auth,
- add Redis or NATS,
- persist RuntimeLog,
- create CampaignActorInstance,
- change frontend Runtime or Room Lobby logic.

## 9. Future Migration Direction

Recommended later slices:

1. Wire server runtime config into `room-server.ts` without changing routes.
2. Add API Server skeleton app as a separate entry.
3. Add Postgres repository adapter behind persistence ports.
4. Add auth identity adapter and permission service boundary.
5. Add object storage upload adapter.
6. Add PubSub adapter only after single-instance room authority is stable.

Each slice needs its own task and verification.
