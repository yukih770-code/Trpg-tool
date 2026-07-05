# Cloud Backend Architecture Boundary v1

Status: Architecture Decision Record / boundary note.

<!-- AI-LANDMARK: CLOUD_BACKEND_ARCHITECTURE_BOUNDARY_V1 -->

This document defines the long-term cloud backend boundary. It is not a
deployment task, not a migration plan to execute immediately, and not a request
to replace current local development flows.

## 1. Decision

The formal long-term online architecture is:

- Frontend deployed as static assets / CDN.
- API Server for account, campaign, actor, asset, Workshop, and management
  APIs.
- Room Server for realtime lobby and runtime authority.
- Postgres as the primary relational persistence layer.
- S3-compatible object storage for avatars, maps, handouts, packages, and other
  large assets.
- Auth provider for identity only.
- Pub/Sub, Redis, NATS, job queues, and AI workers as later scaling boundaries,
  not current requirements.

The local Room Server remains valuable for development, LAN experiments, and
offline testing. It is not the final formal production backend.

本地 Room Server 是开发 / 测试 / 局域网验证形态，不是长期正式后端形态。
正式路线是云端 API Server + Room Server + Postgres + 对象存储。

## 2. Context

The current product is still local-first and portable. That remains important:
users must keep export/import ownership and local workflows must keep working.

At the same time, future remote play, accounts, hosted rooms, Workshop,
community publishing, AI review jobs, and cross-device access need a clearer
cloud boundary. The platform should not be written as either "local only" or
"official SaaS only". It should preserve adapter seams so local, self-hosted,
and official cloud deployments can share concepts without collapsing object
ownership.

## 3. Architecture Layers

### Frontend

The frontend should remain deployable as static assets, for example through
Netlify or another CDN. It must call backend endpoints through environment
configuration, not hardcoded local URLs.

### API Server

The API Server owns non-realtime platform APIs:

- account-facing profile APIs,
- campaign and actor repository APIs,
- import/export orchestration,
- Workshop and community metadata,
- asset metadata,
- permission checks,
- AI job submission and review surfaces.

It should not become the realtime runtime authority for room state unless a
later contract explicitly changes that boundary.

### Room Server

The Room Server owns realtime room and runtime authority:

- room lobby state,
- member approval and ready state,
- actor binding and clearance state,
- authoritative dice and runtime event append,
- room-level snapshot projection.

Clients submit intents. The server validates and appends authoritative events.
Clients do not directly write committed runtime state.

### Postgres

Postgres is the preferred long-term primary database for committed platform
records:

- users and identities mapped from auth provider identities,
- campaigns,
- actors,
- campaign memberships,
- room/session records,
- runtime log streams,
- asset metadata,
- Workshop package metadata.

Migrations and schema design are deferred. This document only reserves the
boundary.

### Object Storage

Large binary assets should live in S3-compatible object storage, not inside
Postgres rows:

- avatars,
- maps,
- handouts,
- media assets,
- Workshop package blobs,
- exported snapshot packages when hosted.

The database stores metadata, ownership, permission, checksums, and object keys.

### Auth Provider

An auth provider answers "who is this user?" It does not decide all platform
permissions by itself. Platform permission, room authority, campaign roles, and
visibility rules remain backend-owned application logic.

### Async / AI Workers

AI workers and background jobs are advisory and asynchronous. They must not
write committed objects directly. They produce drafts, reviews, or suggestions
that pass through confirmation and backend permission checks.

## 4. Vendor Strategy

The architecture depends on capabilities, not vendors.

Examples such as Supabase, Neon, R2, S3, Clerk, Auth0, Redis, or NATS are
possible implementations of a capability. They are not the platform contract.

Vendor-specific code should sit behind adapter boundaries:

- database adapter,
- object storage adapter,
- auth identity adapter,
- pub/sub adapter,
- AI worker adapter.

## 5. Runtime Authority and Realtime Boundary

The Room Server is the authoritative realtime layer for rooms and runtime.

Supabase Realtime, client broadcast channels, or browser-to-browser messages
must not become the core authority layer for room/runtime truth. They may later
support presence, fanout, or observability only if they preserve the authoritative
server event flow.

Authoritative flow:

1. Client submits an intent.
2. Room Server validates the intent.
3. Room Server writes or appends the authoritative event.
4. Room Server broadcasts a room/runtime projection.
5. Clients render the projection.

## 6. Persistence Boundary

Persistence is layered:

- Actor Library records are repository-owned.
- Campaign Library records are repository-owned.
- CampaignMembership is not the same as selectedActorId or entry draft.
- CampaignActorInstance is not the same as ActorVaultActor.
- RuntimeActor is not persisted back into Campaign Library records.
- RuntimeLog is a runtime/session event stream, not a Campaign Library field.

Cloud persistence must preserve these boundaries.

## 7. Permission Boundary

`roomCode` and `publicCode` are discovery or reference codes. They are not a
permission system.

Future permission checks should combine:

- authenticated identity,
- campaign ownership / membership,
- room membership,
- role and projection,
- backend-side authorization rules.

The frontend may hide unavailable actions, but the backend must enforce
authority.

## 8. Local Development Boundary

Local development may continue to run:

- local Vite frontend,
- local Room Server,
- memory storage,
- local JSON / local store experiments.

These modes are development and test profiles. They should not be mistaken for
the formal hosted backend.

## 9. Migration Direction

Recommended future phases:

1. Preserve current local Room Server and frontend contracts.
2. Add environment-driven endpoint configuration.
3. Add API Server skeleton behind explicit route boundaries.
4. Add Postgres repository adapters for non-runtime records.
5. Add object storage metadata and upload adapter boundary.
6. Add auth identity adapter.
7. Move room/runtime persistence behind server-side adapters.
8. Add scaling infrastructure only after the authority model is stable.

Each phase requires its own scoped task and verification. This document does not
approve any immediate migration.

## 10. Non-goals

This document does not implement:

- Supabase, Neon, R2, S3, Redis, NATS, or any other vendor integration.
- Auth provider integration.
- Database schema or migration.
- Server protocol changes.
- WebSocket protocol changes.
- Runtime promotion / replay.
- CampaignActorInstance persistence.
- RuntimeLog persistence migration.
- AI Gateway.
- Deployment scripts.

## 11. AI and Automation Boundary

AI may assist with drafts, summaries, classification, and review. It must not
be able to bypass:

- object boundaries,
- permission checks,
- host confirmation,
- import preview / dry-run,
- backend authority.

AI output is advisory until a human or trusted backend workflow commits it.

## 12. Relationship To Technology Radar

This ADR narrows the Technology Radar's multi-deployment idea:

- Local-first remains a product ownership principle.
- Local Room Server remains a development and LAN test tool.
- Formal hosted online play should move toward cloud API Server + Room Server +
  Postgres + object storage.

This is an architecture boundary, not an implementation milestone.
