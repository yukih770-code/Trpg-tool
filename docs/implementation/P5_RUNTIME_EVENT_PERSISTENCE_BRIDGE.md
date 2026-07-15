# P5.RUNTIME-BRIDGE — Live Room Authority / RuntimeEvent Persistence Bridge

## Purpose

This slice adds a server-side, dependency-injected bridge for copying a
normalized runtime event candidate into the existing Postgres `runtime_events`
append-only repository. The bridge is a persistence seam, not a new authority.

The live Room Server and its WebSocket transport remain authoritative for room
and live runtime state. The existing RuntimeEvent repository remains the
long-term history store.

## Bridge behavior

- `normalizeRuntimeEventPersistenceCandidate` trims identifiers, normalizes the
  event source, preserves context and occurrence time, and produces a JSON-safe
  payload without mutating the candidate.
- `createRuntimeEventIdempotencyKey` is deterministic and includes the server,
  campaign, room, session, source, event kind, actor, client event, and occurrence
  context.
- `persistRuntimeEventCandidate` appends once through an injected repository
  port. It does not update or delete runtime events and does not make permission
  decisions.
- Disabled, missing-context, not-configured, and repository-failure cases return
  safe statuses without leaking SQL, connection strings, or driver errors.
- The repository-assigned `seq` and `createdAt` remain authoritative. A
  candidate `occurredAt` is normalized for bridge context; it does not override
  the persistence repository timestamp.

## Room Server wiring decision

This slice intentionally does **not** wire the bridge into
`server/room-server.ts` or `server/transport/roomSocketServer.ts`.

The current live server has separate in-memory RoomSnapshot and RuntimeLog
paths, while the persistence repository requires a campaign and runtime-session
context. No single stable live event seam currently provides
`worldServerId + campaignId + roomId + runtimeSessionId` for every event. Wiring
at an incomplete seam could create false history or make a persistence failure
affect live authority. A future wiring task may inject this port at an explicit
runtime-session boundary once that context is guaranteed.

## Verification

`npm run runtime:verify:persistence-bridge -- --strict` uses a fake repository
and does not contact Postgres. It covers no-op behavior, normalization,
idempotency, JSON-safe payloads, append-only shape, safe repository errors, and
the live-authority boundary.

