# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Cloud Live Room RuntimeLog Recovery v1
- Name: CLOUD_LIVE_ROOM_RUNTIME_LOG_RECOVERY_V1
- Goal: Give each campaign-linked cloud live room a dedicated durable Runtime
  Session, mirror its append-only Room RuntimeLog into PostgreSQL with stable
  idempotency, and rebuild the memory RuntimeLog after lobby recovery.
- Phase: P0 multiplayer durability
- Status: Done

## Allowed Files

- `server/runtime-log-registry.ts`
- `server/services/liveRoomRuntimeLogPersistence.ts`
- `server/services/liveRoomRuntimeLogPersistenceSmoke.ts`
- `server/room-server.ts`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Room Map persistence or map visibility semantics
- WebSocket protocol, reconnect cursors, Room membership, Runtime permissions
- RuntimeLog event payload/visibility semantics visible to clients
- PostgreSQL schema or migrations
- Campaign API authorization, frontend stores/UI, rules data, system workspaces
- Cross-process pub/sub or multi-instance authority

## Completion Criteria

- Campaign-linked cloud live-room creation prepares a dedicated durable Runtime
  Session before the lobby is accepted.
- Every Room RuntimeLog append is mirrored in room order with a stable
  idempotency key while the memory registry remains live authority.
- Request paths that append a RuntimeLog event flush the queued durable write
  before responding/broadcasting.
- Startup restores valid persisted Room RuntimeLog envelopes only after the
  corresponding live lobby is recovered.
- Restore never overwrites a non-empty live memory stream.
- Local/LAN rooms without durable campaign context remain safely memory-only.
- Focused smoke, existing RuntimeLog/permission/visibility checks, TypeScript,
  server/frontend builds, and diff check pass.

## Verification

```powershell
npm run runtime:verify:live-room-log-recovery
npm run runtime:verify:persistence-bridge
npm run runtime:verify:room-permissions
npm run frontend:verify:runtime-visibility-projection
npx tsc --noEmit
npm run server:build
npm run build
git diff --check
```

## Result

- Campaign-linked cloud rooms receive a dedicated server-issued Runtime Session
  before their recoverable lobby is accepted.
- Room RuntimeLog appends remain authoritative in memory and are mirrored in
  room order with stable room/event idempotency; HTTP append paths wait for the
  queued mirror before responding or broadcasting.
- Startup rebuilds only versioned, validated Room RuntimeLog envelopes after
  lobby recovery, paginates long streams, preserves original room sequence, and
  refuses to overwrite a non-empty live stream.
- Local/LAN rooms remain memory-only. Room Map durability, durable retry/outbox,
  cross-process pub/sub, and multi-instance room authority remain deferred.
