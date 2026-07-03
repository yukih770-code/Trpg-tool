# Room Server Cloud Deployment (M26)

This project has **two independently deployed pieces**:

```
Frontend (static SPA)      →  Netlify
Room Server (Node service) →  Render / Railway / Fly.io / VPS
```

Netlify hosts only the built frontend. The Room Server keeps long-lived
WebSocket connections, in-memory room state, the RuntimeLog and shared-dice
broadcast, so it must run as a **standalone always-on Node Web Service** — it is
not a Netlify Function (those are ephemeral and time-limited).

```
Players / Host browser
        |
   Netlify frontend
        |  HTTP + WebSocket
  Cloud Room Server (Node)
        |
  in-memory rooms / RuntimeLog / shared dice / member admission
```

## Environment variables

### Room Server (backend service)

| Variable | Purpose | Example |
| --- | --- | --- |
| `PORT` | Port to listen on. The host usually injects this. Defaults to `8787`. | `10000` |
| `ROOM_SERVER_ALLOWED_ORIGINS` | Comma-separated CORS allowlist. Unset = localhost dev origins. Set to your Netlify site in production. `*` opts into wildcard. | `https://your-site.netlify.app` |

### Frontend (Netlify build env)

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_ROOM_SERVER_HTTP_URL` | Base HTTP URL of the Room Server. Defaults to `http://localhost:8787`. | `https://your-room-server.onrender.com` |
| `VITE_ROOM_SERVER_WS_URL` | Base WS URL. If omitted, derived from the HTTP URL (`http→ws`, `https→wss`). | `wss://your-room-server.onrender.com` |

Vite env vars are read at **build time**, so set them in Netlify before the
build. HTTP and WS are configured separately because production is https/wss.
When the Room Server serves HTTP and WebSocket on the same origin (the usual
Render/Railway/Fly case), you can set only `VITE_ROOM_SERVER_HTTP_URL` and let
the WS URL be derived.

## Local development

```
npm run dev          # frontend on http://localhost:3000
npm run server:dev   # Room Server on http://localhost:8787 (tsx, no build)
```

No env is needed locally: the frontend defaults to `http://localhost:8787` and
the server's CORS defaults to the localhost dev origins (`:3000` / `:5173`).

## Cloud deployment

### Backend (Room Server)

Build to plain Node JS and start it:

```
npm run server:build   # tsc -p server/tsconfig.build.json  -> dist-server/
npm run server:start   # node dist-server/server/room-server.js
```

On Render / Railway / Fly.io create a **Node Web Service** with:

- Build command: `npm install && npm run server:build`
- Start command: `npm run server:start`
- Env: `ROOM_SERVER_ALLOWED_ORIGINS=https://your-site.netlify.app`
  (the platform sets `PORT` itself)
- Health check path: `/health` (returns `{ "ok": true, "service": "room-server", "version": "m26", ... }`)

WebSocket is served at `/ws` on the same origin/port as HTTP.

### Frontend (Netlify)

- Build command: `npm run build`
- Publish directory: `dist`
- Env: `VITE_ROOM_SERVER_HTTP_URL=https://your-room-server.onrender.com`
  (and `VITE_ROOM_SERVER_WS_URL=wss://...` if the WS host differs)

Once deployed, anyone opening the Netlify page connects to the cloud Room
Server. "Host" then means the person who **creates the room** — no one needs to
run a server locally.

## Current limitations

- **Rooms live in memory.** Restarting / redeploying the Room Server drops all
  rooms, members, RuntimeLog and dice history. Acceptable for the current
  milestone testing (multi-join, admission, Runtime preview, RuntimeLog, shared
  dice, host/player/spectator scoping), not for durable campaigns.
- **Single instance only.** In-memory state is not shared across replicas, so
  run exactly one instance (no horizontal scaling / autoscaling).
- **No persistence, no accounts, no database.** Deliberately out of scope for
  M26. Durable rooms would need Postgres / SQLite / Redis (or file persistence)
  and is a future milestone.
- **WebSocket origin is not restricted.** CORS covers HTTP; the WS upgrade
  currently accepts any origin (browsers do not preflight WebSocket). Tightening
  this (origin verification on upgrade) is a future task.
