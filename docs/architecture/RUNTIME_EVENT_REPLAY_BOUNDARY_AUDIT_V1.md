# Runtime Event / RuntimeLog / Replay Boundary Audit V1

Status: **architecture audit only.** No runtime / protocol / server / WebSocket /
repository / DB / dependency changes. Builds on P4.1 (Repository), P4.2 (Domain),
P4.3 (Identity). This defines the long-term **authoritative event model** —
because nearly everything (combat, dice, checks, inventory, buffs, map/token, AI
summary, chronicle, replay, undo, spectator, cloud sync, reconnect recovery) will
flow through RuntimeLog.

Grounding anchors:
- Server log: `roomRuntimeLogTypes.ts` (`RoomRuntimeLogEvent`), `server/runtime-log-registry.ts`, append path in `server/room-server.ts` / `services/appendRuntimeLogEvent.ts`.
- Local log: `runtimeLogLocalStore.ts` (`LocalRuntimeLogEvent`), `runtimeLogRepository.ts`.
- Combat: `dnd2024/gameplay/runtimeCombatStore.ts` (separate zustand store, **not** log-sourced today).
- Dice: `sharedDiceExpression.ts` (+ server crypto roll). Sync cursor: `latestSeq`/`afterSeq`.

---

## 1. Current findings — TWO divergent event logs

There are **two RuntimeLog schemas today**, and they do not match.

| Aspect | Server `RoomRuntimeLogEvent` (multiplayer) | Local `LocalRuntimeLogEvent` (single-player) |
| --- | --- | --- |
| Id | `eventId` (server-assigned) | `id` (store-assigned) |
| **Ordering** | **`seq`: monotonic per room, server-assigned, starts at 1** | **none** (relies on `createdAt` + insertion order) |
| Timestamp | `createdAt` (server) | `createdAt` (client) |
| Author | `authorMemberId?`, `actorBindingId?` | `actorId?`, `sessionId?` |
| Scope key | `roomId` (+ `campaignRef` copy) | `campaignId` (+ `systemId`) |
| Kinds | `system.note · chat.message · dice.roll · host.note · state.manualChange` | `session.started · roll.performed · actor.note · actor.hpChanged · actor.resourceChanged · actor.sanChanged · actor.humanityChanged · system.note` |
| **Visibility** | **`public · hostOnly · actorPrivate`** | none |
| **Lifecycle / correction** | none | **`lifecycleStatus: active/tombstoned` + `correctsEventId`/`correctionReason`** |
| Payload | `unknown` (unfrozen) | `unknown` (unfrozen, "not stable") |
| Authority | server (seq/eventId/createdAt assigned server-side) | local store |
| In snapshot? | **No** — explicitly outside `RoomSnapshot` (grows unbounded) | store is the authority |

**Key takeaways**
1. The **event is already treated as append-only + server-authoritative** on the
   multiplayer side (seq assigned by server, list uses true `latestSeq` cursor for
   catch-up). This is the right foundation.
2. The two logs have **different kind vocabularies, different id/ordering, and
   different lifecycle features** — local has correction/tombstone; server has
   seq/visibility. Neither is a superset. This divergence is the central problem.
3. **Combat / map / token / inventory / buff are NOT event-sourced yet.**
   `runtimeCombatStore` mutates its own zustand state directly; only chat / dice /
   notes / manual state changes become log events. Dice rolls ARE logged.
4. `payload: unknown` on both — no frozen event payload schema yet (deliberate).

---

## 2. Current event flow

Observed (already close to the intent):

```
User action (UI)
  ↓
Runtime intent (dock: roll / publish / record state / scene focus)
  ↓
Authority validation
   • multiplayer: Room Server validates member/active, assigns seq/eventId/createdAt
   • single-player: local store is authority (no validation gate)
  ↓
Runtime Event appended (append-only)
   • multiplayer: runtime-log-registry (memory)  → broadcast delta (runtimeLogAppended)
   • single-player: runtimeLogLocalStore (persisted)
  ↓
Projection (public-only filter; adapters; recap; scene-focus derive)
  ↓
UI (log drawer, scene board, session recap)
```

What already follows the target model: **Intent → Authority → Event → Log →
Projection → UI**, plus a `latestSeq`/`afterSeq` cursor for late-join/reconnect
catch-up. What does NOT yet: combat/map/inventory bypass the log; the two logs
aren't unified; there is no formal snapshot+replay reconstruction.

---

## 3. Authority model — who may append

| Actor | May append authoritative events? | Notes |
| --- | --- | --- |
| **Room Server** | ✅ yes (multiplayer authority) | assigns `seq`/`eventId`/`createdAt`; only it may order events. |
| **Single-player Runtime (local store)** | ✅ yes (local authority) | it IS the authority when offline; on promotion, authority moves to server. |
| **Host (client)** | ⚠ proposes intents; server validates | host is privileged but not the writer of `seq`. |
| **Player (client)** | ⚠ proposes intents (dice, chat, own actor) | validated by authority. |
| **Projection** | ❌ never | read-only. |
| **Client (generic)** | ❌ never writes seq/authoritative order | sends intents only. |
| **AI** | ❌ never appends authoritative events | may produce advisory artifacts only (see §7). |

Rule: **exactly one authority orders events per session** (server in multiplayer,
local store in single-player). Everyone else sends *intents*; the authority turns a
valid intent into an ordered event.

---

## 4. Event classification

| Category | Examples | Authoritative Runtime event? |
| --- | --- | --- |
| **Player Action** | dice roll, chat, submit binding, own-actor state | ✅ yes |
| **Host Action** | publish public info, set scene, record state, approve | ✅ yes |
| **Combat** | start/next turn, initiative, attack, damage, heal, condition/effect | ✅ yes (future — must move onto the log) |
| **Dice** | roll performed (crypto/local) | ✅ yes (already logged) |
| **Inventory / Equipment** | gain/consume/equip/unequip/transfer | ✅ yes (future; M56 change-event contract is the seed) |
| **Scene / Map / Token / Fog** | scene focus, map set, token move | ✅ scene yes (as host.note today); map/token future |
| **Character** | admission, binding, growth applied | ✅ binding/admission yes; growth = future campaign-instance event |
| **AI Suggestion** | summary/story/suggestion | ❌ NOT authoritative — stored as artifact with `sourceRefs` |
| **System Event** | session.started, notes | ✅ yes |
| **Network Event** | connect/disconnect/reconnect, presence | ⚠ transport/presence — NOT a persisted runtime event (ephemeral) |
| **Lifecycle Event** | correction (`correctsEventId`), tombstone | ✅ yes — as *new append-only events*, never in-place edits |
| **Persistence Event** | saved/exported | ⚠ infra concern — not a gameplay event |
| **Analytics Event** | metrics | ❌ separate stream, never in RuntimeLog |

Decision: **gameplay-affecting facts become authoritative events; transport /
persistence / analytics do NOT pollute RuntimeLog.**

---

## 5. Replay model

Replay = **deterministic reconstruction of session state from an ordered event
stream over a baseline snapshot.**

```
Runtime state(t) = fold(reducer, EntrySnapshot, events[1..seq(t)])
```

Boundaries (what each layer reconstructs):

| Rebuild target | Source | Notes |
| --- | --- | --- |
| **Runtime Snapshot (baseline)** | entry-time snapshot (RoomSnapshot at entry / campaign snapshot) | the fold's initial state. |
| **RuntimeLog** | append-only ordered events (by `seq`) | the fold's inputs; the ONLY authority for what happened. |
| **Projection rebuild** | fold → projections (roster, scene, recap) | recomputed, never stored as truth. |
| **Combat rebuild** | fold of combat events | requires combat to be event-sourced (future). |
| **Map/Token rebuild** | fold of map/token events | future. |
| **Character (runtime) rebuild** | entry ActorSnapshot + state events | vault Character untouched; runtime actor is a projection. |
| **Room rebuild** | Room baseline + membership/binding/admission events | needs room events persisted (today memory-only). |

Replay boundary rule: **replay reconstructs a session; it never mutates source
aggregates** (vault Character, Campaign record). "Time-travel / GM rewind" = replay
to an earlier `seq` into a *projection*, not a destructive edit — implemented later
via correction events, never by deleting history.

---

## 6. Snapshot strategy

| Snapshot type | Purpose | Current seed |
| --- | --- | --- |
| **Full Snapshot** | complete aggregate state at a point (import/export). | `campaignExportSnapshot`, `actorVaultExportSnapshot`. |
| **Entry Snapshot** | replay baseline for a session. | `RoomSnapshot` at entry (already carried in entry context). |
| **Incremental Snapshot / Checkpoint** | periodic fold result to bound replay cost. | none — future (fold every N events / on session end). |
| **Save Game / Campaign Save** | user-facing durable save. | campaign store today; future = snapshot + log tail. |
| **Runtime Recovery** | reconnect/restart catch-up. | `latestSeq`/`afterSeq` cursor already exists. |
| **Import / Export** | portability. | envelope + `schemaVersion`. |

Strategy: **baseline Entry Snapshot + append-only log**, with **periodic
checkpoints** (incremental snapshots of the fold) so replay/late-join doesn't
require folding from event 1 forever. Snapshots are derived and disposable except
export/save which are versioned records.

---

## 7. Runtime cache model — authoritative vs derived vs never-persisted

| State | Class |
| --- | --- |
| RuntimeLog events (ordered) | **Authoritative** |
| Entry snapshot / checkpoints | **Authoritative (snapshot)** |
| Room membership/binding/admission (server) | **Authoritative** (today memory-only) |
| `RuntimeCharacterSummary` / inventory summary | **Projection** |
| Scene board / roster / recap views | **Projection** |
| Adapter output held in React state | **Runtime cache** |
| Combat store current turn/initiative (today) | **Cache today → should be Authoritative-via-events later** |
| Connection state / presence / WS message ids | **Temporary (never persisted)** |
| Match confidence / mode descriptor | **Derived** |
| Draft/entry selection | **Never persisted as domain state (UI)** |

---

## 8. AI interaction boundary

AI may:
- **Read** RuntimeLog + snapshots (as inputs).
- **Generate** Chronicle / Summary / Suggestion / Narrative as **artifacts** with
  `sourceRefs[]` (the authoritative event/record ids used).

AI must NOT:
- **Append authoritative Runtime events** directly.
- Be a foreign key / source of truth for any core aggregate.
- Auto-apply suggestions; any state change flows through the same
  authority+validation path as a human intent (deterministic hard-check → AI
  advisory → Host/Owner confirm).

Optional/allowed: AI-produced *intents* may be **queued for host review** and, only
if the host confirms, become normal authoritative events authored by the host — the
event's author is the confirming human, `derivedFrom: artifactId` is metadata.

---

## 9. Networking relationship (no protocol change)

Current, correct pieces to preserve:
- Room Server owns the ordered log; clients receive **broadcast deltas**
  (`runtimeLogAppended`) + can **catch up** via `afterSeq` using true `latestSeq`.
- **Late join / reconnect** = fetch snapshot (RoomSnapshot) + events since a cursor.
- **Projection filtering** (public-only in v0) happens at the boundary; hostOnly /
  actorPrivate are stored but withheld — `latestSeq` still advances so cursors don't
  desync.
- **Future Spectator / replay** = the same read path with a read-only projection and
  no intent rights.

These already anticipate cloud/replay; **do not change the protocol** — the event
model just needs to converge so the same events serialize identically local vs
cloud.

---

## 10. Event versioning

Recommend (contract-level, later):
- **`schemaVersion`** on any snapshot/export envelope (already the pattern).
- **`eventVersion`** per event *kind* (payload shape may evolve independently).
- **Migration** = pure functions `vN → vN+1` applied on read (replay-time upcasting),
  never rewriting stored history.
- **Compatibility:** unknown future kinds/fields are ignored by old readers
  (forward-compatible), and old events are upcast by new readers (backward
  compatible). This keeps **replay compatible across versions**.

---

## 11. Long-term event rules (the invariants)

- **Append-only.** No in-place edit or delete. Corrections/tombstones are *new
  events* (`correctsEventId` already exists locally — adopt platform-wide).
- **Immutable** once appended (fields never change).
- **Total order per session** via `seq` (server-assigned in MP; local monotonic
  counter in SP). `createdAt` is informational, not the sort key.
- **Timestamps** are authority-assigned; client clocks are advisory only.
- **Causality:** optional `causedByEventId` / `correlationId` to link an intent to
  its resulting events; `traceId` for cross-boundary debugging.
- **Id generation:** `eventId` = type-prefixed UUID (P4.3), authority-assigned.
- **Deduplication:** client intents carry an idempotency key so retries/reconnect
  don't double-append; the authority dedupes by (session, idempotencyKey).
- **Source identity:** every event records its author (`authorMemberId`/local actor)
  and, if AI-derived, `derivedFrom: artifactId` (author still a human).
- **Correlation:** intent → event(s) linkage enables undo-via-correction and audit.

---

## 12. Migration strategy (converge the two logs — later, not now)

1. **Define one `RuntimeEvent` contract** = superset of both: `seq` + `visibility`
   (from server) **and** `correctsEventId`/tombstone lifecycle (from local) +
   `eventVersion` + optional `causedByEventId`/`correlationId`/`idempotencyKey`.
2. **Unify the kind vocabulary** into namespaced kinds (`dice.*`, `chat.*`,
   `state.*`, `scene.*`, `combat.*`, `inventory.*`, `system.*`) with per-kind
   payload types replacing `unknown`.
3. **Keep two adapters, one contract:** local authority (SP) and server authority
   (MP) both emit the SAME event shape; only the ordering authority differs.
4. **Event-source combat/map/inventory** onto the log incrementally (start by also
   emitting log events alongside existing store mutations; later make the store a
   projection of the log).
5. **Add checkpoints** to bound replay cost.
6. **Promotion (M69)** replays the local log into a new room as server events,
   preserving ids/provenance — enabled only after the contract converges.

No behavior change in this milestone — this is the target, not an edit.

---

## 13. Verdicts — keep / refactor / not recommended

### ✅ 建议保留
- **Append-only, authority-assigned `seq`/`eventId`/`createdAt`** (server side) —
  the correct event-sourcing spine.
- **`latestSeq`/`afterSeq` catch-up cursor** — already the right late-join/reconnect
  primitive.
- **Visibility on events** (`public/hostOnly/actorPrivate`) with boundary filtering.
- **Correction + tombstone as append-only** (`correctsEventId`) — the right undo
  model; adopt platform-wide.
- **RuntimeLog kept OUT of RoomSnapshot** (unbounded stream) — correct.
- **`payload: unknown` as a deliberate seam** — fine until per-kind payloads land.

### ⚠ 建议重构（P4+，非现在）
- **Two divergent event schemas** → converge to one `RuntimeEvent` contract.
- **Local log has no `seq`/total order** → add a monotonic local counter.
- **Server log has no correction/tombstone** → adopt the local lifecycle features.
- **Combat/map/inventory not event-sourced** → route through the log (dual-write
  first, then store-as-projection).
- **`payload: unknown`** → per-kind discriminated payload + `eventVersion`.
- **No checkpoints** → add incremental snapshots to bound replay.

### ❌ 不建议长期保留
- **In-place edit/delete of events** (must be correction/tombstone events).
- **Client-assigned authoritative order / timestamps as sort key.**
- **AI appending authoritative events** or acting as a source of truth.
- **Network/presence/analytics events inside RuntimeLog.**
- **Two permanently separate log schemas** for SP vs MP.
- **Combat/inventory state that can't be reconstructed from the log** (breaks
  replay/undo/AI/chronicle).

---

## 14. Roadmap after P4.4

- **P4.5 Persistence & Transaction Boundary** — persist the unified event stream +
  checkpoints atomically per session; adapter transactions.
- **P4.6 API Contract Boundary** — event append/list/delta DTOs keyed by Global IDs
  + `afterSeq`; idempotency keys on intents.
- **P4.7 Realtime / Sync Boundary** — intent→event authority handoff, dedup,
  reconnect/late-join/spectator over the unified stream.
- **P4.8 AI Gateway Boundary** — AI reads log/snapshot, emits artifacts with
  `sourceRefs`, never appends authoritative events.

Invariant to carry forward: **one append-only, authority-ordered event stream is
the backbone; snapshots are checkpoints; projections/combat/inventory/AI/chronicle
are all derived from it; nothing except the single per-session authority writes
order.**

---

## 15. 自动验证

**未执行自动验证。** 本任务为纯事件/回放边界架构审计，仅新增本文档
(`docs/architecture/RUNTIME_EVENT_REPLAY_BOUNDARY_AUDIT_V1.md`)，未改动任何代码，故无需
类型检查/构建。当前隔离沙箱不可用，无法运行：

```
npx tsc --noEmit
npx tsc -p server/tsconfig.server.json --noEmit
npm run build
npm run server:build
git diff --check
```

请在本地/Codex 环境执行以上命令确认工作区仅新增本 .md 文件。**未进行人工验证，未
声称完成任何浏览器测试。**
