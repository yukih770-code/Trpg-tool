# LAN Alpha Runtime

LAN Alpha is a host-controlled local-network runtime mode for private testing.
It is not public internet multiplayer, NAT traversal, a replacement for private
alpha authentication, or a new Room WebSocket protocol.

## Host Flow

1. Put the host and players on the same trusted Wi-Fi or wired LAN.
2. Run `npm run lan:doctor`. It reports only safe endpoint candidates, port
   state, backend health, CORS origin source, and warnings.
3. Run `npm run dev:lan`. It starts the existing backend and Vite frontend with
   LAN Alpha enabled for those processes; it does not edit `.env`.
4. Open a server workspace as its owner or administrator. The **LAN hosting**
   panel displays a player join link, frontend/API/WebSocket endpoints, and any
   configuration warnings.
5. Send the copied player join link. Do not send a `localhost` URL.

When no explicit `LAN_ALLOWED_ORIGINS` is configured, the server generates exact
origins from detected private IPv4 addresses. Set `LAN_PUBLIC_HOST` when the
automatic candidate is not the address players should use. Optional values are:

```text
LAN_ALPHA_ENABLED=true
LAN_BIND_HOST=0.0.0.0
LAN_PUBLIC_HOST=192.168.x.x
LAN_FRONTEND_PORT=3000
LAN_BACKEND_PORT=8787
LAN_ALLOWED_ORIGINS=http://192.168.x.x:3000
```

`LAN_ALLOWED_ORIGINS` is an exact comma-separated allowlist. Do not use a wildcard
as a convenience workaround. `LAN_PUBLIC_HOST` accepts a private IPv4 address or
a `.local` hostname only.

## Player Flow

1. Open the host-provided LAN link in a browser on the same LAN.
2. Complete the existing sign-in flow when private alpha is enabled.
3. Use the existing server, campaign, and Room Lobby flow to join the room.

The LAN link uses a constrained `apiBase` query override so a Vite build that was
made with localhost defaults can call the host backend. It is accepted only from
a local/private browser origin and only targets local/private hosts. The Room
WebSocket endpoint is derived from the same host; this task does not alter Room
messages or live authority.

## Troubleshooting

- Ensure every device uses the host's private IP, never `localhost`.
- Permit Node through Windows Firewall on **private** networks.
- Disconnect or account for VPN adapters when the displayed LAN address is wrong.
- Check that the backend health endpoint is reachable on the host before testing
  another device.
- If no private IPv4 address is detected, select the correct adapter and set
  `LAN_PUBLIC_HOST` for the next run.

## Boundaries and Limitations

Cloud/private-alpha records remain the long-term data path. LAN Alpha only exposes
the host-controlled live session over the local network, using existing APIs where
they already persist scene/runtime records. It does not claim cloud synchronization
where no existing path exists.

There is no LAN guest identity model in this slice. In `localDev`, the existing
explicit development identity behavior remains development-only. In
`cloudPrivateAlpha`, every player still needs the existing private-alpha session;
being on the LAN does not permit dev headers or bypass server authorization.

Room Runtime collaboration is additionally bound to the authenticated user and
that user's room-member record. LAN reachability, a room code, and a copied
member id do not grant map or Runtime permissions. Temporary previews require
an active participant; fixed map ranges require the host's explicit, current
room-session grant and are cleared when the portable Room Server restarts.

Not included: public matchmaking, remote internet play, STUN/TURN/WebRTC, NAT
traversal, QR codes, mobile polish, database migrations, protocol rewrite, or
gameplay/rules expansion.
