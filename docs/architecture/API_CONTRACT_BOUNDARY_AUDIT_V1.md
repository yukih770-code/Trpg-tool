# API Contract Boundary Audit V1 (P4.6)

Status: **architecture audit only.** No runtime / protocol / server / WebSocket /
store / dependency changes. Builds on P4.1–P4.5. Grounds the *actual* HTTP + WS
API and defines the long-term contract layering.

Grounding anchors:
- HTTP (Room Server, `server/room-server.ts`) — 14 endpoints (below).
- HTTP client (`src/lib/platform/roomServerHttpClient.ts`) — typed wrappers +
  `RoomServerHttpError { status, message }`.
- WS transport (`roomTransportTypes.ts`) — envelope `room-ws-v0` + typed messages.
- DTO seeds: `roomTypes.ts` (requests/results), `roomRuntimeLogTypes.ts`
  (`AppendRoomRuntimeLogEventInput`, `RoomRuntimeLogListResult { latestSeq, events }`),
  export envelopes (`campaignExportSnapshot`, `actorVaultExportSnapshot`),
  `storageAdapterBoundaryTypes.StorageAdapterErrorShape`.

---

## 1. Current API surface (grounded)

### 1.1 HTTP (REST) — 14 endpoints
```
GET  /health
GET  /rooms
POST /rooms/create
POST /rooms/join
GET  /rooms/:roomId
POST /rooms/:roomId/members/:memberId/approve
POST /rooms/:roomId/members/:memberId/reject
POST /rooms/:roomId/actor-bindings/submit
POST /rooms/:roomId/actor-bindings/:bindingId/approve
POST /rooms/:roomId/actor-bindings/:bindingId/reject
POST /rooms/:roomId/members/:memberId/ready
GET  /rooms/:roomId/runtime-log            (?afterSeq= cursor)
POST /rooms/:roomId/runtime-log/events
POST /rooms/:roomId/runtime/dice-roll
```
Response style: **decision-based results** (`RoomJoinResult.decision`,
`decision: 'roomNotFound' | ...`) with ad-hoc `{ error, message }` on failure and
HTTP status set per decision. No global error envelope, no version prefix, no
pagination beyond the runtime-log `afterSeq` cursor.

### 1.2 WebSocket — envelope `room-ws-v0`
Envelope: `{ protocolVersion: 'room-ws-v0', messageId, sentAt }`.
- Client→Server: `subscribeRoom` · `unsubscribeRoom` · `ping`.
- Server→Client: `connected` · `subscribedRoom` · `unsubscribedRoom` · `pong` ·
  `roomSnapshot` · `runtimeLogAppended` · `error` (codes: `invalidMessage` ·
  `roomNotFound` · `notSubscribed` · `internalError`).
- The room snapshot rides inside `payload` **specifically so a projection/filtering
  layer can replace the payload without changing the envelope** (documented in
  `roomTransportTypes`). This is the single best-designed seam in the API.

### 1.3 Other payloads
- **Import/export:** campaign + actor-vault export **envelopes** with
  `schemaVersion` (portable, versioned).
- **Upload / Workshop / AI payloads:** **do not exist yet** (future).

---

## 2. Object classification — never mix these

| Object | Class | Notes |
| --- | --- | --- |
| `RoomSnapshot` (server state) | **Authority** (server-owned) | today also broadcast as-is → doubles as DTO/Projection. |
| `RoomSnapshot` (broadcast payload) | **DTO / Projection** | rides in the WS envelope `payload`; projection seam ready. |
| `CreateRoomInput` / `RoomJoinRequest` / `AppendRoomRuntimeLogEventInput` / dice-roll input | **Request DTO** | wire-in shapes. |
| `CreateRoomResult` / `RoomJoinResult` / approve/reject results / `RoomRuntimeLogListResult` | **Response DTO** | decision-based. |
| `RoomRuntimeLogEvent` | **Authority** (append-only) + **DTO** (delta) | seq/eventId server-assigned (P4.4). |
| export envelope | **Snapshot + DTO** | versioned, portable. |
| `RuntimeCharacterSummary` / inventory summary | **Projection / Runtime cache** | never on the room wire. |
| adapter output in React state | **Runtime cache** | disposable. |
| (future) AI output | **Artifact** | never a request/response authority. |

**Current risk:** `RoomSnapshot` is simultaneously the server authority AND the wire
DTO/projection. The envelope anticipates separating them; they are not separated
yet. Keep the envelope; introduce a distinct broadcast DTO later.

---

## 3. Long-term API layering

```
UI (components/pages)
  ↓  calls use-cases, receives Projections/Response DTOs
Application Service (use-case; see P4.7)
  ↓  request/response DTOs
Repository (per aggregate; see P4.1/P4.5)
  ↓  storage operation intents
Persistence Adapter → storage
```

Hard rules (all currently *mostly* respected, to be enforced):
- **UI never consumes the persistence/authority model directly** — only Response
  DTOs / Projections.
- **Repository never exposes a DB/row shape** on its interface — it returns domain
  objects; DTO mapping happens at the API edge.
- **Runtime never exposes a transport DTO** as its internal model — the transport
  DTO is produced at the boundary from Runtime state.
- **Authority ≠ DTO ≠ Projection ≠ Snapshot** — the `RoomSnapshot` triple-duty is
  the one place to split later.

---

## 4. Versioning & compatibility

- **API version:** WS already carries `protocolVersion: 'room-ws-v0'`. HTTP has
  **none** → recommend a version marker (header `X-Api-Version` or `/v1` prefix)
  before cloud, kept behind the client wrapper so callers don't hardcode it.
- **DTO version:** each request/response + envelope payload carries an implicit
  version; make it explicit (`schemaVersion`/`eventVersion` per P4.4/P4.5).
- **Backward compatibility:** additive fields only; unknown fields ignored by old
  readers; old payloads upcast by new readers (read-time migration).
- **Migration:** pure upcast functions at the boundary; never break the envelope
  (`RoomSocketEnvelopeBase` is intentionally stable).

---

## 5. Cross-cutting envelope fields (recommend, do not implement)

| Field | Purpose | Today |
| --- | --- | --- |
| **Error envelope** | uniform `{ code, message, retryable, correlationId }` | ad-hoc `{error,message}`; `StorageAdapterErrorShape` is a ready model to adopt. |
| **Request ID** | one per HTTP request | none. |
| **Correlation ID** | link an intent to resulting events/broadcasts | none (P4.4 recommends). |
| **Idempotency key** | dedupe retried intents (create/join/append) | none (P4.4/P4.5 recommend). |
| **Trace ID** | cross-boundary debugging | none. |
| **Message ID** | per WS message | ✅ `messageId` exists. |
| **Cursor pagination** | list large collections | ✅ `afterSeq` for runtime-log; extend pattern to `/rooms` list. |
| **Filtering** | server-side projection (visibility) | ✅ public-only filter on log; formalize as projection. |
| **Streaming** | deltas | ✅ `runtimeLogAppended` WS delta; keep. |

---

## 6. Verdicts

### ✅ 保留
- **Stable WS envelope with swappable `payload`** (projection seam) — best-in-class.
- **Decision-based results** (`decision` enums) — explicit, testable.
- **`afterSeq` cursor + `latestSeq`** — correct pagination/catch-up primitive.
- **Typed HTTP client wrapper + `RoomServerHttpError`** — callers never hardcode URLs
  or parse raw responses.
- **Versioned export envelopes.**

### ⚠ 重构（P4+）
- **Split `RoomSnapshot` authority vs broadcast DTO/projection** (envelope ready).
- **Add HTTP API versioning** + a **uniform error envelope** (adopt
  `StorageAdapterErrorShape`).
- **Add correlation/request/idempotency/trace ids** (P4.4/P4.5 dependence).
- **Formalize projection/visibility filtering** as a named boundary step.
- **Extend cursor pagination** to `/rooms` and future lists.

### ❌ 不建议长期保留
- **UI consuming authority/persistence shapes directly.**
- **Repository exposing DB row shapes on its API.**
- **Runtime internal state doubling as the transport DTO.**
- **Ad-hoc per-endpoint error shapes** once cloud clients depend on them.
- **Unversioned HTTP** at cloud scale.

---

## 7. Roadmap after P4.6
Feeds P4.7 (Application Service owns use-case DTOs) and P4.8 (dependency rules keep
transport DTOs at the edge, never in domain/runtime).

**No behavior changed. No protocol changed. No implementation.** 未执行自动验证
(纯文档；沙箱不可用) — 请本地 `tsc/build/git diff --check` 确认仅新增本 .md。
