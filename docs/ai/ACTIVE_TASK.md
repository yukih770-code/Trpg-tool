# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Room Socket Reconnect + Stream Catch-up v1
- Name: ROOM_SOCKET_RECONNECT_STREAM_CATCHUP_V1
- Goal: Recover a room WebSocket after a transient disconnect, restore desired
  room subscriptions, and replay missed RuntimeLog / Room Map events from each
  stream's last acknowledged sequence without weakening member projection.
- Phase: P0 multiplayer reliability
- Status: Done

## Allowed Files

- `src/lib/platform/roomTransportTypes.ts`
- `src/lib/platform/roomSocketClient.ts`
- `src/lib/platform/roomSocketClientSmoke.ts`
- `src/components/platform/RoomRuntimeEntryBridge.tsx`
- `server/transport/roomSocketServer.ts`
- `server/transport/roomSocketReconnectSmoke.ts`
- `server/room-server.ts`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Room membership or Runtime permission semantics
- RuntimeLog / Room Map event payloads or persistence adapters
- Transient map-preview replay
- HTTP APIs, stores, schemas, migrations, rule data, system workspaces
- UI information architecture, router, dependencies

## Completion Criteria

- Unexpected socket close schedules bounded exponential-backoff reconnect.
- Explicit `close()` cancels reconnect and does not reopen the socket.
- Desired room subscriptions survive reconnect automatically.
- Reconnect subscription carries RuntimeLog and Room Map cursors.
- Server replays only events after those cursors and applies existing per-member
  projection before sending them.
- First subscription establishes a baseline without replaying full history.
- Client/server smoke checks, TypeScript checks, builds, and diff check pass.

## Verification

```powershell
npm run frontend:verify:room-socket-reconnect
npm run runtime:verify:room-socket-reconnect
npx tsc --noEmit
npm run server:build
npm run build
git diff --check
```

## Result

- The browser room client reconnects by bounded exponential backoff after an
  unexpected close, restores desired subscriptions automatically, and cancels
  all retry work after explicit `close()`.
- RuntimeLog and Room Map cursors advance from both subscription baselines and
  live deltas, then travel with the reconnect subscription.
- The server validates cursors, reads only each missing suffix, applies the
  existing per-member projection, and acknowledges each stream's true latest
  sequence even when records are withheld by projection.
- First subscription remains HTTP-history-owned; the Runtime desktop performs a
  post-subscription safety refresh to close the initial history/baseline race.
- Transient map previews remain live-only and are never replayed.
- Both new socket smokes, room permission, visibility projection, map bridge,
  frontend TypeScript, server build, production build, and diff check pass.
