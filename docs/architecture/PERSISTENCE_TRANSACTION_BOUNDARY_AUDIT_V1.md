# Persistence & Transaction Boundary Audit V1

Status: **architecture audit only.** No runtime / repository / store / server /
protocol / WebSocket / DB / dependency changes. Builds on P4.1 (Repository), P4.2
(Domain), P4.3 (Identity), P4.4 (Event/Replay). Goal: define the long-term
persistence architecture that supports local / LAN / cloud / Postgres / object
storage / replay / workshop / AI / offline-first — **without vendor lock-in**.

Grounding anchors:
- Adapter seam: `storageAdapterBoundaryTypes.ts` (already defines
  `StorageDomain`, `StorageAdapterKind` incl. `postgres`/`objectStorage`,
  `StorageOperationKind` incl. `snapshot`/`restore`, `StorageAdapterCapabilitySummary`
  with `supportsTransactions`/`supportsAppendOnlyLog`/`supportsSnapshots`/
  `supportsAssetBlobs`/`supportsBackupRestore`, `StorageSnapshotManifest`,
  `StorageAdapterErrorShape`). **Types only — no IO implemented.**
- Real persistence today: zustand `persist` → localStorage, per domain store, each
  with its own `SCHEMA_VERSION` + `migrate` (e.g. `campaignLocalStore` v2).
- Server: in-memory registries (`room-registry`, `runtime-log-registry`,
  `actor-admission-registry`) + `storage/memory-storage-adapter` capability.
- Repository facades: `campaignLibraryRepository`, `actorVaultRepositoryBridge`,
  `runtimeLogRepository`. Import/export: `campaignExportSnapshot`,
  `actorVaultExportSnapshot`, `*ImportSafeAppend`, `*ImportPreview`.

---

## 1. Current findings

1. **The persistence *contract* is already excellent; the *implementation* is
   localStorage.** `storageAdapterBoundaryTypes` anticipates memory/localJson/
   sqlite/postgres/cloudDatabase/objectStorage + transactions + append-only log +
   snapshots + asset blobs + backup/restore. Nothing is wired to it yet.
2. **Per-store `schemaVersion` + `migrate` already exist** (zustand persist). This
   is the right migration primitive — but it is **per store**, not centralized.
3. **No cross-domain transactions.** localStorage writes are per-key; a multi-step
   operation (e.g. "clone character + link to campaign") is not atomic today.
4. **Two persistence worlds:** local (persisted zustand) vs server (in-memory,
   ephemeral). Server state is **not persisted at all** (rooms/log/admission lost on
   restart) — matches P4.1/P4.4 findings.
5. **No object storage.** Maps/portraits today are **URL references** (static-map
   v0-lite) — i.e. metadata-only, bytes hosted externally. This is actually the
   correct seam for later object storage.
6. **Import/export envelopes + safe-append + preview already exist** for campaign
   and actor vault — the portability/backup primitive is present.

Overall: **the boundary is well-designed; only adapters, transactions, a central
migration registry, real server persistence, and object storage are missing.**

---

## 2. Current persistence pipeline

```
UI / Runtime
  ↓ (reads projections, writes intents)
Repository facade (campaignLibraryRepository / actorVaultRepositoryBridge / runtimeLogRepository)
  ↓
Domain store (zustand)          ── server side: in-memory registry (no persistence)
  ↓ persist() middleware
Storage: localStorage (JSON, per-store key, per-store schemaVersion + migrate)
```

Target pipeline (already contract-anticipated):

```
UI / Runtime
  ↓
Repository (per aggregate; uniform load/save/list/archive/delete/snapshot/restore)
  ↓
Storage Adapter (storageAdapterBoundaryTypes: memory | localJson | sqlite | postgres | objectStorage)
  ↓
Persistence (localStorage / SQLite / Postgres + Object Storage for blobs)
```

The current pipeline **is** the target pipeline missing only the adapter layer —
today the Repository facade talks to a store that talks to localStorage directly.

---

## 3. Persistence domain matrix

| Domain | Authority? | Snapshot? | Projection? | Cache? | Temporary? | Persistent today | Long-term home |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Campaign | ✅ | export | list summary | — | — | localStorage (v2) | DB (records) |
| Character (vault) | ✅ | export + hash | runtime summary | — | — | localStorage (per system) | DB |
| Inventory / Wardrobe | ✅ (part of Character) | — | runtime summary | — | — | localStorage | DB (inside Character aggregate) |
| Room | ✅ (server) | entry snapshot | RoomSnapshot | — | — | **memory only** | DB |
| CampaignMembership | ✅ (future) | — | roster | — | — | not modeled | DB (relationship) |
| CampaignActorInstance | ✅ (future) | — | runtime actor | — | — | not modeled | DB |
| RuntimeLog | ✅ append-only | checkpoint | recap/scene | — | — | local: persisted / server: **memory** | DB (event rows + index) |
| Runtime Snapshot / checkpoint | snapshot | ✅ | — | — | — | not modeled | DB (or blob) |
| Workshop Package | ✅ | version = snapshot | catalog | — | — | localStorage / mock | DB |
| Package Version / Dependency | ✅ / VO | ✅ | — | — | — | not modeled | DB |
| Subscription | ✅ (relationship) | — | — | — | — | not modeled | DB |
| Asset **metadata** | ✅ | version | — | — | — | media node types / URL ref | DB |
| Asset **blob** (portrait/map/audio/pdf) | ✅ (bytes) | content hash | — | — | — | **external URL** today | **Object storage** |
| GeneratedArtifact (AI) | ✅ (its own) | — | — | — | — | not modeled | DB (+ blob if large) |
| Chronicle | derived artifact | — | — | — | — | not modeled | DB |
| User Profile / Preferences / Settings | ✅ | — | — | — | — | localStorage / `userProfile` seed | DB (profile) / local (device prefs) |
| AI Memory / Prompt Context | derived | — | projection | ✅ | often | not modeled | DB (memory) / never (prompt) |
| Presence / connection / draft selection | — | — | — | ✅ | ✅ | not persisted | **never persisted** |

---

## 4. Transaction matrix

Which operations must be **atomic** (all-or-nothing) and their scope:

| Operation | Atomic? | Transaction scope |
| --- | --- | --- |
| Create Campaign | ✅ | Campaign aggregate |
| Delete / Archive Campaign | ✅ | Campaign (+ cascade markers to related rows) |
| Import Campaign | ✅ | Campaign + referenced actors (safe-append is the seed) |
| Clone Character | ✅ | new Character aggregate (new id + provenance) |
| Archive / Publish Package | ✅ | Package + new Version row |
| Join Room | ✅ | Room + new Member (+ presence, non-persistent) |
| Leave Room | ✅ | Room + Member status |
| Role / Actor Binding | ✅ | Room + Binding row |
| Approval / Admission | ✅ | Room + Admission row |
| Append RuntimeLog event | ✅ (single-row append + seq allocation) | one event; **seq allocation must be atomic** to preserve total order |
| Save Runtime / Checkpoint | ✅ | snapshot row + log-tail marker |
| Promotion (local→room) | ✅ (batch) | create Room + replay log as a batch; idempotent |
| Subscribe / Unsubscribe | ✅ | Subscription relationship row |

Rules:
- **Aggregate = the transaction boundary** (P4.2). Cross-aggregate operations
  (import, promotion) are **explicit batches** with idempotency, not implicit.
- **Event append must atomically allocate `seq`** (the one place ordering integrity
  lives — P4.4).
- Presence / draft / cache changes are **never** part of a transaction.

---

## 5. Repository responsibility

**Repository MAY:** load, save, list, archive, delete, snapshot, restore, version —
over exactly one aggregate, behind the storage-adapter seam.

**Repository MUST NOT contain:**
- Business rules (clearance, rules math, growth) → rules layer.
- Runtime authority / event ordering → Runtime/authority layer (P4.4).
- UI logic → components.
- AI logic → AI gateway (P4.8).
- Networking logic → transport/sync layer (P4.7).

The existing facades (`campaignLibraryRepository` etc.) currently mix a little
selection/sorting logic; long-term these are **query concerns** acceptable inside a
Repository, but **decisions/rules must stay out**.

---

## 6. Database boundary (relational / records)

Belongs in the DB (records, indexes, relationships) — **never large binaries**:

- Campaign, Character (+ inventory/wardrobe as owned rows), Membership,
  CampaignActorInstance, Room + Member + Binding + Admission, Package + Version +
  Dependency, Subscription, User + Permission (capability rows), Asset **metadata**,
  RuntimeLog **event rows + per-session index**, Runtime snapshot **manifest**,
  GeneratedArtifact metadata.
- All keyed by **Global UUID** (P4.3), one required `ownerId` FK per aggregate.
- `RuntimeLog` grows unbounded → its own table with `(sessionId, seq)` index +
  retention/checkpoint policy; **not** embedded in the Room/Campaign row.

**Vendor independence:** model as plain relational tables + opaque string ids; no
Postgres-only features assumed at the domain level (JSONB payload column is fine and
portable). Supabase/RLS/etc. are *deployment choices behind the adapter*, not domain
assumptions.

---

## 7. Object storage boundary (blobs)

Belongs in object storage — **bytes only**, referenced by DB metadata:

- Portrait, Avatar, Artwork/CG, Map image, Scene image, Handout, Token image,
  Audio, Video, PDF / rule book, generic attachment.

Split per blob:
- **Metadata** (DB row): `assetId`, `ownerId`, `kind`, `mime`, `dimensions`,
  `sizeBytes`, `hash`, `version`, `storageKey`.
- **Blob** (object storage): the bytes at `storageKey`.
- **Reference** (from Character/Package/Scene): `assetId` only (never the bytes).
- **Hash**: content hash for dedupe + integrity (already the pattern for actor
  snapshots).
- **Ownership / Version**: `ownerId` + immutable per-version `storageKey`.

Today's static-map-URL is exactly "metadata references an external key" — the
object-storage adapter later just replaces the external URL with a managed
`storageKey`, no domain change.

---

## 8. Runtime persistence & write timing

| Concern | Model | Write timing |
| --- | --- | --- |
| RuntimeLog | append-only event rows | **on each authoritative event** (synchronous, seq-atomic) |
| Runtime Snapshot (entry) | baseline for replay | at session entry |
| Checkpoint (incremental) | fold result to bound replay | every N events / on pause / on session end |
| Recovery | snapshot + events since cursor | on reconnect/restart (uses `afterSeq`) |
| Save Game / Campaign Save | snapshot + log tail | on explicit save / auto-save interval |
| Promotion | batch replay local→server | on "开启多人" confirm (future) |
| Replay | pure fold over events | on demand, read-only |

Rule: **events persist immediately (they are truth); projections/snapshots persist
lazily (they are rebuildable).** Losing a checkpoint is recoverable (re-fold);
losing an event is not (so append is the durable operation).

---

## 9. Offline-first strategy

- **Offline writable:** Campaign, Character, local RuntimeLog, preferences — the
  local adapter is authoritative when offline (already true today).
- **Cloud synchronized:** Room, multiplayer RuntimeLog, memberships — server
  authoritative when online.
- **Same aggregates, two adapters** (P4.1): offline uses `localJson`, online routes
  writes through the server; the app never has two data models.
- **Conflict handling:** events are append-only + idempotent (P4.4), so sync is
  **merge-by-append with idempotency keys**, not last-write-wins on mutable fields.
  Records (Campaign/Character) use **owner-scoped optimistic concurrency**
  (`updatedAt`/version check) + explicit merge on import.
- **Future merge strategy:** for divergent offline edits, prefer **event replay
  reconciliation** where possible; fall back to a user-facing merge (import preview
  is the seed).
- **Import/export compatibility:** the envelope + `schemaVersion` already gives a
  portable, vendor-neutral sync/backup format.

---

## 10. Migration strategy

| Layer | Mechanism |
| --- | --- |
| `schemaVersion` | per persisted record/envelope (already present per store). |
| Repository migration | on load, upcast record `vN → vN+1` (pure functions). |
| Storage migration | adapter-level (localJson → sqlite → postgres) preserves logical schema; ids are opaque so data is portable. |
| Snapshot migration | snapshots carry `schemaVersion`; upcast on restore. |
| Runtime (event) migration | per-kind `eventVersion`; upcast events at replay time (P4.4). |
| Package migration | package manifest `schemaVersion`; versions immutable, migrate on read. |
| Asset migration | metadata `schemaVersion`; blobs immutable + hashed (re-key, don't rewrite). |

Recommendation: **centralize migration into a per-domain migration registry**
(replacing the current per-store ad-hoc `migrate`), so all adapters share one
upcast path. Never rewrite history in place; migrate on read.

---

## 11. Failure recovery

| Failure | Recovery |
| --- | --- |
| Partial write / interrupted save | aggregate writes are transactional (all-or-nothing); on restart the last committed state stands; uncommitted work is discarded. |
| Interrupted event append | seq allocation is atomic → either the event exists with its seq or it doesn't; client retries with the same idempotency key (no dup). |
| Network loss / reconnect | reconnect + `afterSeq` catch-up (already exists); intents are idempotent so re-send is safe. |
| Corrupted snapshot | discard checkpoint, **re-fold from an earlier snapshot + events** (snapshots are rebuildable; events are the truth). |
| Corrupted event (rare) | events immutable; a bad payload is handled by a **correction event** (`correctsEventId`), never in-place fix. |
| Replay recovery | deterministic fold reconstructs state; if a reducer version changed, upcast events. |
| Rollback | **never destructive** — "rollback" = replay to an earlier `seq` into a projection + append correction events. |
| Retry | idempotency keys on intents; adapter marks `retryable` errors (`StorageAdapterErrorShape.retryable`). |

Principle: **events are the durable truth; everything else is rebuildable**, so
recovery is "re-fold", not "hope the mutable blob survived".

---

## 12. AI persistence boundary

- **AI may persist:** `GeneratedArtifact` rows (summary/story/chronicle/memory) with
  `sourceRefs[]`, `generatedBy`, `generatedAt`, `model`, `reviewed?`; optional large
  outputs as blobs referenced by the artifact.
- **AI may NEVER persist:** changes to Campaign / Character / Room / Package /
  RuntimeLog as authoritative data. It does not append authoritative events (P4.4)
  and is never a FK a core aggregate depends on (P4.3).
- **Review flow:** AI output is stored as `reviewed: false`; a human (owner/host)
  reviews; only a confirmed change becomes a normal authoritative write **authored
  by the human**, with `derivedFrom: artifactId` as metadata.
- **Prompt context / working memory** = derived/cache; persist only if it's a
  durable "memory" artifact, otherwise never.

---

## 13. Verdicts — keep / refactor / not recommended

### ✅ 建议保留
- **`storageAdapterBoundaryTypes` as the persistence seam** — it already models
  domains, adapter kinds, transactions, append-only, snapshots, asset blobs,
  backup/restore, errors. Build repositories on it.
- **Per-record `schemaVersion` + migrate-on-read.**
- **Import/export envelopes + safe-append + preview** as the portable backup/sync
  format.
- **Static asset = metadata + external reference** — the exact object-storage seam.
- **localStorage/zustand as the first (`localJson`) adapter** — reuse, don't replace.
- **RuntimeLog outside the Room/Campaign record** (unbounded stream in its own table).

### ⚠ 建议重构（P4+，非现在）
- **No adapter layer wired** → implement `StorageAdapter` behind repositories
  (memory/localJson first, then postgres/objectStorage).
- **No cross-aggregate transactions** → introduce explicit atomic batches for
  import/clone/promotion/join.
- **Per-store ad-hoc migrate** → central per-domain migration registry.
- **Server state ephemeral** → persist Room/Log/Admission via the adapter.
- **Facades mix query + a little logic** → keep queries, move any decisions out.
- **Asset URL-only** → managed `storageKey` + hash + version via `AssetRepository`.

### ❌ 不建议长期保留
- **Runtime/UI writing storage directly** (must go through Repository → Adapter).
- **Large binaries in the DB / in localStorage / in event payloads.**
- **Vendor-specific assumptions in the domain** (Postgres/Supabase-only features as
  domain truth) — keep them behind the adapter.
- **Last-write-wins on mutable fields for sync** (use append/idempotency + optimistic
  concurrency).
- **In-place rewrite of events/history** (corrections only).
- **AI writing authoritative data** or persisting suggestions as truth.
- **Persisting presence/draft/cache** as domain state.

---

## 14. Roadmap after P4.5

- **P4.6 API Contract Boundary** — repository/adapter operations as DTOs keyed by
  Global IDs; idempotency keys; error shapes (`StorageAdapterErrorShape` seed).
- **P4.7 Realtime Synchronization Boundary** — offline↔online adapter handoff,
  append-merge sync, conflict/optimistic-concurrency, reconnect/promotion.
- **P4.8 AI Gateway Boundary** — `GeneratedArtifact` persistence + review flow;
  AI never writes authoritative rows.

Invariant to carry forward: **one Repository per aggregate over a pluggable Storage
Adapter; events persist immediately and are the truth; snapshots/projections are
rebuildable; blobs live in object storage referenced by metadata; migrations happen
on read; no vendor assumptions leak into the domain.**

---

## 15. 自动验证

**未执行自动验证。** 本任务为纯持久化/事务边界架构审计，仅新增本文档
(`docs/architecture/PERSISTENCE_TRANSACTION_BOUNDARY_AUDIT_V1.md`)，未改动任何代码，故
无需类型检查/构建。当前隔离沙箱不可用，无法运行：

```
npx tsc --noEmit
npx tsc -p server/tsconfig.server.json --noEmit
npm run build
npm run server:build
git diff --check
```

请在本地/Codex 环境执行以上命令确认工作区仅新增本 .md 文件。**未进行人工验证，未
声称完成任何浏览器测试。**
