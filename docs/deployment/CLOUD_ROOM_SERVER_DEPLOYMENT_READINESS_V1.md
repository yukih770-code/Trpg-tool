# Cloud Room Server Deployment Readiness

Status: Deployment readiness note, not a deployment implementation.

<!-- AI-LANDMARK: CLOUD_ROOM_SERVER_DEPLOYMENT_READINESS_V1 -->

## 1. Goal

The current goal is to make the Room Server clear enough to deploy as a cloud
service so the Netlify frontend can connect to it.

This note does not add database persistence, Auth provider integration, object
storage, Redis/NATS, deployment scripts, Dockerfiles, or protocol changes.

## 2. Current Server Entry

Current Room Server entry:

```text
server/room-server.ts
```

The entry remains unchanged as the runnable Room Server. It currently owns HTTP
room APIs, WebSocket `/ws`, in-memory room state, in-memory RuntimeLog, shared
dice, actor binding, ready state, and room/runtime projections.

## 3. Build / Start Commands

Use package scripts as the source of truth:

```text
npm run server:build
npm run server:start
```

Current script meanings from `package.json`:

```text
npm run server:build  -> tsc -p server/tsconfig.build.json
npm run server:start  -> node dist-server/server/room-server.js
```

Local development:

```text
npm run dev
npm run server:dev
```

`server:dev` runs the Room Server directly with `tsx`.

## 4. Runtime Env

Backend Room Server env keys:

```env
ROOM_SERVER_ENV=localDev
ROOM_SERVER_RUNTIME_MODE=local
ROOM_SERVER_PORT=8787
ROOM_PUBLIC_HTTP_URL=http://localhost:8787
ROOM_PUBLIC_WS_URL=ws://localhost:8787
ROOM_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
```

Compatibility keys may still be accepted while older scripts migrate:

```env
PORT=8787
SERVER_DEPLOYMENT_ENVIRONMENT=localDev
SERVER_RUNTIME_MODE=local
ROOM_SERVER_PUBLIC_HTTP_URL=http://localhost:8787
ROOM_SERVER_PUBLIC_WS_URL=ws://localhost:8787
ROOM_SERVER_ALLOWED_ORIGINS=http://localhost:5173
```

Do not store secrets in these examples. Public URLs and allowed origins are not
secret values.

## 5. Local Dev Example

```env
ROOM_SERVER_ENV=localDev
ROOM_SERVER_RUNTIME_MODE=local
ROOM_SERVER_PORT=8787
ROOM_PUBLIC_HTTP_URL=http://localhost:8787
ROOM_PUBLIC_WS_URL=ws://localhost:8787
ROOM_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
```

The frontend defaults to `http://localhost:8787` when no Vite Room Server env is
set.

## 6. Cloud Production Example

Backend Room Server:

```env
ROOM_SERVER_ENV=production
ROOM_SERVER_RUNTIME_MODE=cloud
ROOM_SERVER_PORT=8787
ROOM_PUBLIC_HTTP_URL=https://your-room-server.example.com
ROOM_PUBLIC_WS_URL=wss://your-room-server.example.com
ROOM_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
```

Frontend Netlify build env:

```env
VITE_ROOM_SERVER_HTTP_URL=https://your-room-server.example.com
VITE_ROOM_SERVER_WS_URL=wss://your-room-server.example.com
```

The frontend env keys above are the current real keys used by
`src/lib/platform/roomServerConfig.ts`.

Netlify reads Vite env vars at build time. If the WebSocket endpoint shares the
same host as the HTTP endpoint, `VITE_ROOM_SERVER_WS_URL` can be omitted and the
frontend derives `wss://` from the HTTPS URL.

## 7. Health Check

Health endpoint:

```text
GET /health
```

Expected production/cloud metadata:

```json
{
  "ok": true,
  "service": "room-server",
  "environment": "production",
  "runtimeMode": "cloud",
  "publicHttpUrl": "https://your-room-server.example.com",
  "publicWsUrl": "wss://your-room-server.example.com"
}
```

The health response must not expose secrets or raw environment dumps.

## 8. CORS

`ROOM_ALLOWED_ORIGINS` must include the Netlify frontend origin:

```env
ROOM_ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
```

Localhost origins are acceptable for local development only. Production should
use explicit frontend origins instead of `*`.

If a browser request comes from an origin not in the allowlist, the browser
should block cross-origin reads. If the Netlify origin is allowed, Room Server
status and room operations should work.

## 9. WebSocket

The Room Server WebSocket endpoint is:

```text
/ws
```

In production the frontend should connect through a `wss://` endpoint, not
localhost:

```env
VITE_ROOM_SERVER_WS_URL=wss://your-room-server.example.com
```

The current protocol is unchanged. Deployment work must not introduce a new WS
envelope or bypass Room Server authority.

## 10. Deployment Smoke Test

1. Open `/health`.
   Expected: `environment=production`, `runtimeMode=cloud`, `publicHttpUrl`
   exists, and `publicWsUrl` exists.
2. From the Netlify frontend, test Room Server status.
   Expected: server reachable.
3. Create a room from campaign list, campaign detail, or runtime settings.
   Expected: Room Lobby opens.
4. Join a room from the Join Lobby page.
   Expected: room appears in discovery or joins by room code.
5. Check WebSocket lifecycle.
   Expected: connect, member update, ready update, and role binding update.
6. Check CORS failure behavior.
   Expected: non-allowlisted browser origins are blocked; allowlisted Netlify
   origin passes.
7. Verify Runtime Alpha.
   Expected: Runtime entry, RuntimeLog, public info, manual state log, and dice
   continue to work.

## 11. Platform Choice Notes

### Render

Render is simple and suitable for a first cloud Room Server web service. It is
friendly for a Node service with HTTP health checks and WebSocket support.

### Fly.io

Fly.io is better aligned with long-term realtime services, regional placement,
and always-on room infrastructure, but it asks for more deployment and
operations understanding.

### Cloud Run

Cloud Run is a more formal container platform. WebSocket can work, but the
deployment must account for timeout behavior, reconnects, multi-instance
behavior, and session affinity expectations.

Current conclusion:

- Keep the Room Server container / web-service friendly.
- First satisfy env variables, health check, CORS, and WebSocket endpoint.
- Platform choice must not enter business logic.
- Do not vendor-lock the server architecture through application code.

## 12. Non-goals

This readiness package does not implement:

- real deployment,
- database persistence,
- Postgres or migrations,
- Auth provider,
- S3/R2/object storage,
- Redis/NATS/PubSub,
- protocol changes,
- WebSocket envelope changes,
- RuntimeLog persistence,
- CampaignActorInstance persistence,
- frontend Runtime or Room Lobby behavior changes,
- Dockerfile or platform config files.
