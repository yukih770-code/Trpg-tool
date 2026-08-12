# Private Alpha Cloud Runbook

This runbook deploys one public Node service and one managed PostgreSQL database.
The Node service serves the built frontend, HTTP API, and Room Server WebSocket
endpoint at `/ws`. It contains no real URL, access code, session secret, or
database connection string.

## Deployment shape

Use one long-running Node Web Service with WebSocket support and managed
PostgreSQL. The same public origin can host the frontend and API; configure the
Room Server HTTP and WebSocket URLs to that public origin. This avoids a
cross-origin cookie setup during the first private alpha.

Generic provider notes:

- **Render:** use a Web Service, bind the service to `PORT`, and configure
  `/health` as the HTTP health-check path.
- **Railway:** use one persistent service, its injected `PORT`, and configure
  `/health` before sending traffic to a deployment.
- **VPS/container host:** put TLS termination in front of the one Node process,
  forward WebSocket upgrades, and keep PostgreSQL private to the service.

These are provider capabilities, not product dependencies. Do not put provider
names or service URLs into application source.

## Build and start

Run in this order in CI or the provider build/start configuration:

```powershell
npm ci
npm run build
npm run server:build
npm run server:start
```

Cloud mode fails closed when `dist/index.html` is absent. This prevents a
backend-only deploy from serving a broken application shell. `server:start`
runs `dist-server/server/room-server.js`; it serves `dist/`, all API routes,
and `/ws` from the same Node process.

## Required environment

Set these server values in the provider secret/environment manager:

| Key | Rule |
| --- | --- |
| `NODE_ENV` | `production` |
| `SERVER_DEPLOYMENT_ENVIRONMENT` | `cloudPrivateAlpha` |
| `SERVER_RUNTIME_MODE` | `cloud` |
| `PORT` | Provider-injected HTTP port; do not force a local port |
| `DATABASE_URL` | Managed PostgreSQL URL; server-only secret |
| `DATABASE_SSL_MODE` | Usually `require` for managed PostgreSQL |
| `APP_PUBLIC_HTTP_URL` | Public HTTPS application origin |
| `APP_PUBLIC_WS_URL` | Same origin using `wss://` and no path suffix |
| `ROOM_ALLOWED_ORIGINS` | Exact public application origin, never `*` |
| `PRIVATE_ALPHA_AUTH_ENABLED` | `true` |
| `PRIVATE_ALPHA_INVITE_CODE` | Server-only secret |
| `PRIVATE_ALPHA_SESSION_SECRET` | Server-only long random secret |
| `PRIVATE_ALPHA_SESSION_MAX_AGE_DAYS` | `30` or another reviewed duration |
| `POSTGRES_USER_DEV_API_ENABLED` | `false` |

Build the frontend with non-secret public endpoint values only:

| Key | Rule |
| --- | --- |
| `VITE_API_BASE_URL` | Public HTTPS application origin |
| `VITE_ROOM_SERVER_HTTP_URL` | Public HTTPS application origin |
| `VITE_ROOM_SERVER_WS_URL` | Public WSS application origin; omitted only when HTTPS-to-WSS derivation is intended |
| `VITE_PRIVATE_ALPHA_AUTH_ENABLED` | `true` |
| `VITE_LOCAL_DEV_AUTH_ENABLED` | `false` |

Never expose database, invite-code, or session-secret values in frontend build
variables. On HTTPS, the frontend resolver derives `wss://` from an HTTPS Room
Server URL when no explicit WebSocket URL is provided.

## Database and migrations

1. Provision managed PostgreSQL and take the provider's normal backup/snapshot.
2. Set the server-only database URL and SSL mode.
3. In a secure operator process with the backend environment loaded, review then
   apply migrations:

```powershell
npm run cloud:db:status
npm run db:migrations:apply -- --dry-run
npm run cloud:db:apply
npm run db:verify:e2e -- --strict
```

4. Deploy the Node service.
5. Configure the provider health check as `GET /health`.
6. Run the API smoke after the service is live.

Migration runs are explicit; service startup does not mutate the schema. Local
development fixtures and private monster-import source material are not part of
this cloud bootstrap.

## Pre-deploy checks

These checks do not need cloud credentials:

```powershell
npm run cloud:verify:production-build
npm run cloud:verify:env
npm run cloud:verify:private-alpha
npm run frontend:verify:runtime-visibility-projection
npm run runtime:verify:runtime-visibility-projection
```

After setting a public URL in the operator process, run:

```powershell
npm run cloud:verify:health
npm run cloud:verify:backend
npm run cloud:verify:auth
npm run cloud:verify:deployed-e2e
```

`cloud:verify:health` is intentionally skipped when neither
`CLOUD_VERIFY_HEALTH_URL` nor `APP_PUBLIC_HTTP_URL` is present. It prints only
status and HTTP code, never configuration values.

## Friend smoke checklist

1. Open the HTTPS application URL and use the bootstrap code only to establish
   the first host account when needed.
2. The host creates a server, then creates one personal code per friend in
   **Settings → Invitations and join requests**.
3. Each friend signs in with their own code; first use binds that code to their
   account and adds them to the server.
4. Host creates a campaign and room; the friend joins the room.
5. Friend chooses or creates a character and submits it.
6. Host approves the character; friend marks ready and enters Runtime.
7. Confirm the browser WebSocket connects at the configured `/ws` endpoint.
8. Host places an approved player token and a monster token.
9. Confirm the player can move only their own permitted token.
10. Confirm the player cannot move monster or other-player tokens; a spectator
    cannot move any token.
11. Start combat, check initiative, edit HP/AC/status, and verify projected
    enemy information and safe token inspection.
12. Hide a token and confirm it does not appear to the player.
13. Disband the room and confirm it leaves active room lists.

## CORS, cookies, and rollback

Use exact origins in `ROOM_ALLOWED_ORIGINS`. Browser requests include
credentials, and private-alpha cookies are `HttpOnly`, `Secure` in cloud mode,
and `SameSite=Lax`. Use a single public origin for first alpha when possible.

For rollback, redeploy the last known-good frontend and Node build. Leave the
database unchanged unless a reviewed, provider-tested migration plan says
otherwise. Revoke a leaked personal server invite in server settings. Rotate the
bootstrap code after a bootstrap-code leak. Rotate the session secret after a
session-secret leak; all existing browser sessions will need to sign in again.

## Known limits for friends

- This is a private alpha, not a public registration or account-recovery system.
- Campaign-linked cloud room lobbies, validated actor admission summaries,
  RuntimeLog events, and Room Map events recover from PostgreSQL after a process
  restart. The in-memory registries remain live authority after recovery;
  ad-hoc local/LAN rooms without durable campaign context remain memory-only.
- Successful lobby mutation responses wait for the latest serialized room
  snapshot persistence attempt before WebSocket broadcast and HTTP completion;
  the restart smoke intentionally adds no post-response delay.
- Multi-instance room authority, reconnect guarantees, rate limiting, object
  storage, and public-content moderation are not promised in this deployment.
- Do not treat host-only information as shareable: visibility projection and
  runtime permission checks remain required in every client flow.
