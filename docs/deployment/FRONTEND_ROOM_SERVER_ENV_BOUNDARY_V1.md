# Frontend Room Server Env Boundary v1

Status: Frontend deployment environment boundary.

<!-- AI-LANDMARK: FRONTEND_ROOM_SERVER_ENV_BOUNDARY_V1 -->

## 1. Goal

The frontend should resolve Room Server endpoints through one shared boundary.
Components must not hardcode `http://localhost:8787`, derive deployment vendor
URLs, or read Vite env vars directly.

## 2. Resolver

Shared resolver:

```text
src/lib/platform/roomServerEndpoint.ts
```

Exports:

```text
resolveRoomServerHttpUrl()
resolveRoomServerWsUrl()
deriveRoomServerWsUrl()
isLocalRoomServerEndpoint()
```

The older `src/lib/platform/roomServerConfig.ts` remains a compatibility layer
for existing constant exports.

## 3. Local Development

If no env vars are set, the frontend defaults to:

```env
VITE_ROOM_SERVER_HTTP_URL=http://localhost:8787
VITE_ROOM_SERVER_WS_URL=ws://localhost:8787
```

`VITE_ROOM_SERVER_WS_URL` can be omitted. The frontend derives `ws://` from the
HTTP URL.

## 4. Netlify / Hosted Frontend

Set these in the Netlify build environment:

```env
VITE_ROOM_SERVER_HTTP_URL=https://your-room-server.example.com
VITE_ROOM_SERVER_WS_URL=wss://your-room-server.example.com
```

If the Room Server serves HTTP and WebSocket from the same host, the WS env can
be omitted and derived from the HTTP URL:

```env
VITE_ROOM_SERVER_HTTP_URL=https://your-room-server.example.com
```

Vite env vars are read at build time. Changing these values requires rebuilding
the frontend.

## 5. Frontend Boundary

The frontend only knows:

- Room Server HTTP endpoint.
- Room Server WebSocket endpoint.

The frontend must not know whether the Room Server is hosted on Render, Fly.io,
Cloud Run, a VPS, or a future official platform. Vendor choice belongs to
deployment configuration and documentation, not UI code.

## 6. Non-goals

This boundary does not implement:

- deployment,
- database,
- Auth,
- object storage,
- protocol changes,
- Room Runtime behavior,
- multi-server discovery,
- official server directory,
- third-party server registry.

## 7. Checklist

- New frontend Room Server callers import from `roomServerEndpoint.ts`.
- Components do not read `import.meta.env` directly.
- Components do not hardcode localhost except through the resolver fallback.
- Netlify sets `VITE_ROOM_SERVER_HTTP_URL`.
- Netlify sets `VITE_ROOM_SERVER_WS_URL` only when it differs from the derived
  URL.
