# Private Cloud Alpha Deploy Runbook

Status: deployment procedure and verification guide. It does not contain a real
deployment URL, access code, session secret, or database connection string.

## 1. Deployment Contract

Deploy three independently replaceable components:

1. a static frontend host;
2. one Node web service that supports HTTP and WebSocket upgrades at `/ws`;
3. managed PostgreSQL reachable only by the Node service.

Recommended first topology: a static host, a single always-on Node web-service
host with WebSocket support, and managed PostgreSQL. Choose providers by those
capabilities rather than binding product code to one vendor.

## 2. Before Deployment

1. Start from a clean, committed Git worktree.
2. Use `.env.cloud.backend.example` and `.env.cloud.frontend.example` only as
   shapes. Put real backend values in the host secret manager and frontend values
   in static-host build settings.
3. Do not place database or private-alpha secret values in frontend build
   settings, source control, browser storage, or support screenshots.
4. Confirm the chosen Node host supports long-lived WebSocket connections. This
   runbook does not make remote public multiplayer production-ready.

## 3. Backend Environment Matrix

Set these on the Node service:

| Key | Value / rule |
| --- | --- |
| `NODE_ENV` | `production` |
| `SERVER_DEPLOYMENT_ENVIRONMENT` | `cloudPrivateAlpha` |
| `SERVER_RUNTIME_MODE` | `cloud` |
| `PORT` | platform-provided port, or a local service port when required |
| `DATABASE_URL` | backend secret only |
| `DATABASE_SSL_MODE` | provider-appropriate, normally `require` |
| `ROOM_ALLOWED_ORIGINS` | exact frontend origin, never `*` |
| `APP_PUBLIC_HTTP_URL` | public HTTPS backend endpoint |
| `APP_PUBLIC_WS_URL` | matching public WSS backend endpoint |
| `PRIVATE_ALPHA_AUTH_ENABLED` | `true` |
| `PRIVATE_ALPHA_INVITE_CODE` | backend secret only |
| `PRIVATE_ALPHA_SESSION_SECRET` | backend secret only; long random value |
| `PRIVATE_ALPHA_SESSION_MAX_AGE_DAYS` | `30` |
| `POSTGRES_USER_DEV_API_ENABLED` | `false` |

`APP_RUNTIME_MODE` is not read by the current server. Use the two canonical
`SERVER_*` keys above; setting both would create an avoidable configuration drift.

## 4. Frontend Environment Matrix

Set these at frontend build time, then rebuild the static bundle after changing
them:

| Key | Value / rule |
| --- | --- |
| `VITE_API_BASE_URL` | public HTTPS backend endpoint |
| `VITE_ROOM_SERVER_HTTP_URL` | public HTTPS Room Server endpoint |
| `VITE_ROOM_SERVER_WS_URL` | public WSS Room Server endpoint; omit only when derivation from the HTTP endpoint is correct |
| `VITE_PRIVATE_ALPHA_AUTH_ENABLED` | `true` |
| `VITE_LOCAL_DEV_AUTH_ENABLED` | `false` |

The code does not read a generic public WebSocket variable; use
`VITE_ROOM_SERVER_WS_URL`. Do not add a Vite-prefixed database variable or either
private-alpha secret to frontend settings.

## 5. Database Bootstrap and Migration

Provision an empty managed PostgreSQL database, then run from a terminal with the
backend environment loaded. These commands do not print connection-string values.

```powershell
npm run cloud:db:status
npm run db:migrations:apply -- --dry-run
npm run cloud:db:apply
npm run db:verify:e2e -- --strict
```

`cloud:db:apply` writes pending migrations. Run it only after reviewing the dry
run and taking the provider's normal backup/snapshot. Never use a deployment
rollback as a reason to delete data or run an unreviewed down migration.

## 6. Backend Build and Start

Run the safe configuration gate before starting:

```powershell
npm run cloud:verify:backend
npm run server:build
npm run server:start
```

The process fails closed if cloud mode lacks a database, explicit CORS origin,
non-local public endpoints, private-alpha configuration, or if local dev auth is
enabled. Application startup never applies migrations automatically.

## 7. CORS, Cookies, and First Login

Set `ROOM_ALLOWED_ORIGINS` to the exact frontend origin. The API client sends
browser requests with credentials, and allowlisted origins receive
`Access-Control-Allow-Credentials`.

The current private-alpha session cookie is `HttpOnly`, `Secure` in cloud mode,
and `SameSite=Lax`. For the first deployment use frontend and API hosts under the
same schemeful site, for example `app.alpha.example.com` and
`api.alpha.example.com`, or proxy API traffic through the frontend origin. Do not
use unrelated static-host and API domains until cookie policy and CSRF behavior
are deliberately expanded.

Open the frontend, sign in with an operator-provided display name and access code,
then create a first server, campaign, and room. The invite code never enters the
frontend build configuration.

## 8. Deployed Smoke

In a secure operator terminal, set `E2E_API_BASE_URL` and
`E2E_PRIVATE_ALPHA_ACCESS_CODE` only for that process. Optionally set
`E2E_PRIVATE_ALPHA_DISPLAY_NAME`; do not save these values in source-controlled
files.

```powershell
npm run cloud:verify:backend
npm run cloud:verify:auth
npm run cloud:verify:deployed-e2e
```

The deployed E2E smoke checks health, anonymous `/api/auth/me`, invalid and valid
private-alpha login, session identity, World Server creation, campaign/room/
runtime-event/scene-state paths, and archive-based fixture cleanup. It uses
timestamped fixture names and never uploads monster content.

For WebSocket smoke, open the deployed frontend, create or join a Room Lobby, and
confirm the browser connects to `<configured WSS endpoint>/ws`. The frontend reads
`VITE_ROOM_SERVER_WS_URL`, or derives WSS from its configured Room Server HTTP
endpoint. No WebSocket protocol change is part of this deploy run.

## 9. Rollback and Incident Procedure

1. Roll back frontend and backend releases independently to the last known good
   build.
2. Keep the database unchanged by default. Do not reverse migrations without a
   reviewed, provider-tested down plan.
3. If an invite code leaks, rotate `PRIVATE_ALPHA_INVITE_CODE` and redeploy the
   backend environment.
4. If the session secret leaks, rotate `PRIVATE_ALPHA_SESSION_SECRET`; existing
   signed browser cookies become invalid and users sign in again.
5. To pause private alpha, disable public frontend access first. Do not set
   `PRIVATE_ALPHA_AUTH_ENABLED=false` on a publicly reachable service because
   that removes the intended session gate.

## 10. Known Limitations

- No public registration, OAuth, password recovery, rate limiting, or per-invite
  expiry exists.
- Remote public multiplayer hardening, reconnect policy, and multi-instance room
  authority are not complete. LAN runtime remains the next phase.
- No object storage, public monster upload, or real-time protocol rewrite is
  included.
