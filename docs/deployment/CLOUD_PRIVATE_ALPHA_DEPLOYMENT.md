# Cloud Private Alpha Deployment

Status: preparation guide only. This document does not deploy the application.

## Architecture

Private alpha has a static frontend, the Node Room/API service (HTTP plus `/ws`), and PostgreSQL reachable only by the backend. The frontend knows public HTTP/WS endpoints only. Imported private monster data stays World Server-scoped and out of source control.

## Runtime Modes

- `localDev`: local origins and an explicit local development identity header are permitted.
- `cloudPrivateAlpha`: requires cloud mode, backend database configuration, explicit CORS origins, public HTTP/WS URLs, and disabled dev auth.
- `production`: follows the same cloud safety requirements and requires verified auth for user-specific writes.

Cloud startup rejects wildcard CORS, local public URLs, missing required backend configuration, and a request to enable local dev auth.

## Environment Files

Use the tracked shapes only: `.env.example` for local development, `.env.cloud.backend.example` for server-only cloud variables, and `.env.cloud.frontend.example` for frontend build variables.

Set `DATABASE_URL` only in the backend secret manager. Never set a Vite-prefixed database variable. Set `VITE_API_BASE_URL` when building the frontend. Configure `VITE_ROOM_SERVER_HTTP_URL` and `VITE_ROOM_SERVER_WS_URL` when the room transport endpoint needs explicit values.

## Build and Startup

1. Configure backend variables through the deployment secret manager.
2. Apply migrations deliberately: `npm run db:migrations:apply`.
3. Verify readiness: `npm run db:verify:e2e -- --strict`.
4. Build and start backend: `npm run server:build`, then `npm run server:start`.
5. Build frontend with public endpoint variables: `npm run build`.

Migrations never run automatically on application startup.

## CORS and Health

Set `ROOM_ALLOWED_ORIGINS` to exact frontend origins. Cloud modes reject `*`; localhost defaults apply only to `localDev`. Verify `GET /health` after startup. It reports safe mode, endpoint, CORS and database readiness metadata without credentials.

## Private Alpha Smoke Test

1. Load the deployed frontend and confirm it reaches the configured API URL.
2. Create a World Server, campaign and room; verify the lobby and `/ws` connection.
3. Exercise combat table, map board, saved scenes, DND dice and Lite actor data.
4. Confirm private monster templates remain visible only within their intended World Server.
5. Confirm an unlisted browser origin cannot read cross-origin responses.

## Rollback Checklist

- Roll back backend and frontend builds independently.
- Never delete user data as a deployment rollback shortcut.
- Re-run health, database readiness and API smoke checks after rollback.

## Known Limitations

- No production authentication provider exists yet; local development identity headers are not cloud login.
- Live multiplayer authority and reconnection hardening remain incomplete.
- No asset upload or object storage service exists.
- Private monster import is local machine-readable import only, not a public compendium or upload feature.
