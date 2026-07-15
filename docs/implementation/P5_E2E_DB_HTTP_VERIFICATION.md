# P5.E2E-DB-HTTP Real Postgres / HTTP Chain Verification

This document describes a verification harness, not a product feature. It
connects the existing Postgres tooling, backend API surface, runtime event
persistence bridge, and typed frontend API clients without changing UI,
protocol, live Room Server authority, or database schema.

## Environment

Backend-only local placeholders:

```text
DATABASE_URL=postgres://user:password@localhost:5432/trpg_dev
PORT=8787
ROOM_ALLOWED_ORIGINS=http://localhost:5173
POSTGRES_USER_DEV_API_ENABLED=true
```

Frontend/API verification inputs:

```text
VITE_API_BASE_URL=http://localhost:8787
VITE_DEV_VIEWER_USER_ID=dev-user-001
API_BASE_URL=http://localhost:8787
E2E_DEV_VIEWER_USER_ID=dev-user-001
E2E_API_BASE_URL=http://localhost:8787
```

`DATABASE_URL` is backend-only and must never be placed in a Vite-prefixed
variable. Development auth headers are local-only and must be disabled in
production. The frontend only receives an HTTP API origin.

## DB readiness

```powershell
npm run db:verify:e2e
npm run db:verify:e2e -- --strict
npm run db:verify:e2e -- --include-write-smokes --strict
npm run db:verify:e2e -- --apply-migrations --strict
```

Default mode is read-only: it reports migration status, performs a dry-run
plan, and checks all schema families. `--apply-migrations` is the explicit
write opt-in. `--include-write-smokes` is a separate explicit opt-in and runs
the existing rollback-only write smokes for user, campaign, actor, asset,
runtime, generated, world, visibility, and platform foundation.

When no database is configured, the harness reports `not_configured`; it does
not fake readiness or print a connection string. It never prints SQL bodies.

## Backend HTTP chain

Start an already-configured backend separately, for example:

```powershell
npm run server:dev
npm run api:verify:e2e -- --strict
```

The HTTP harness targets `API_BASE_URL` and does not start a server. With an
explicit local `E2E_DEV_VIEWER_USER_ID` and the local development auth gate
enabled, it creates unique temporary World Server, Campaign, Room, Runtime
Session, and append-only Runtime Event records through the existing endpoints.
It verifies list/detail/readback and archives the created World Server and
Campaign where the existing APIs provide those operations. It does not create
users directly in the database, so the viewer user must already exist.

If the backend is unavailable, the result is `server_unavailable`. Auth,
database readiness, and API failures are reported with safe status/kind
summaries only.

## Frontend API client smoke

```powershell
npm run frontend:verify:e2e-api
$env:E2E_API_BASE_URL='http://localhost:8787'
$env:E2E_DEV_VIEWER_USER_ID='dev-user-001'
npm run frontend:verify:e2e-api -- --strict
```

Without `E2E_API_BASE_URL`, this is a dry client-contract check using fake
fetch. With it, the smoke uses the existing World Server and Campaign/Room
clients in read-only mode. It does not require a browser and does not read a
database URL.

## Verification boundary

This harness does not add a real auth provider, production deployment, cloud
Postgres configuration, live WebSocket/runtime bridge, or manual browser QA.
It does not change migrations, API routes, Room Server authority, or frontend
UI. Generated `dist-server/` output must be removed before committing.
