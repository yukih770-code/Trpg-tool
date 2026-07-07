# Repository Architecture Audit V1

Status: **architecture audit only.** No Runtime / Room Server / Protocol / UI /
Store / business-logic / DB / dependency changes were made. This document maps the
current data layer, names the true authorities vs projections, and proposes the
Repository / Projection / Persistence boundaries for the upcoming Persistence &
Identity Platform (P4). Implementation of `CampaignRepository`,
`CharacterRepository`, etc. is deliberately deferred to follow-up tasks.

Grounding: this audit is based on the modules that already exist under
`src/lib/platform/**` and `server/**`, not a greenfield design. Several
repository-shaped seams already exist and should be formalized rather than
invented.

---

## 0. What already exists (so we don't reinvent it)

| Concern | Existing module(s) | Nature today |
| --- | --- | --- |
| Campaign store | `campaignLocalStore.ts` (zustand + localStorage) | **Authority** (local) |
| Campaign facade | `campaignLibraryRepository.ts` (explicitly "NOT a backend repository") | Local facade / boundary |
| Campaign entry draft | `campaignEntryDraftStore.ts` | Draft-only UI selection (NOT membership) |
| Campaign import/export | `campaignExportSnapshot.ts`, `campaignImportSafeAppend.ts`, `campaignImportPreview.ts` | Snapshot / DTO |
| Character sheets | `store/characterStore.ts`, `store/cocStore.ts`, `store/cpStore.ts` | **Authority** (local, per-system) |
| Character sub-state | `characterInventoryStore.ts`, `characterWardrobeStore.ts`, `loadoutService.ts` | Authority fragments |
| Actor vault | `actorVault.ts`, `actorVaultLifecycleStore.ts`, `actorVaultRepositoryBridge.ts`, `actorVaultExportSnapshot.ts` | Repository bridge + snapshot |
| Runtime actor read | `runtimeActorSnapshotSource.ts`, `runtimeActorSnapshotAdapter.ts`, `runtimeInventoryAdapter.ts` | **Projection / Runtime cache** (read-only) |
| Room state | `server/room-registry.ts`, `roomTypes.ts` (`RoomSnapshot`) | **Authority** (server, in-memory) |
| Room runtime log | `server/runtime-log-registry.ts`, `roomRuntimeLogTypes.ts` | Authority (server, in-memory) |
| Local runtime log | `runtimeLogLocalStore.ts`, `runtimeLogRepository.ts` | Authority (local) + facade |
| Workshop / packages | `packageLibrary.ts`, `communityTypes.ts`, `communityMockData.ts` | Authority (local) + mock |
| Assets / media | `mediaNodeTypes.ts` (`ownerId`), `actorMediaBinding.ts` | Types + binding |
| Storage boundary | `storageAdapterBoundaryTypes.ts` (domains + adapter kinds incl. `postgres`/`objectStorage`) | **Persistence-adapter contract (already anticipates DB)** |
| Cloud backend | `cloudBackendAdapters.ts`, `backendDeploymentTypes.ts` | Boundary contract |
| Identity seed | `userProfile.ts` (`userId`), scattered `hostUserId?` / `authorId` / `ownerId` / `userId?` | **Not yet a repository** |

Key takeaway: **the repository pattern is already half-present as local facades
over zustand+localStorage, and `storageAdapterBoundaryTypes` already defines the
persistence seam (memory → localJson → sqlite → postgres → objectStorage).** P4
should formalize and unify these, not start from zero.

---

## 1. Current Data Flow

```
                 ┌───────────────────────────── LOCAL (browser) ─────────────────────────────┐
UI (Workspace / Library / Runtime shells)
   │  reads/writes
   ▼
zustand stores (persist → localStorage)
   campaignLocalStore · characterStore/cocStore/cpStore · actorVaultLifecycleStore
   runtimeLogLocalStore · campaignEntryDraftStore · packageLibrary
   │
   ├── facades: campaignLibraryRepository, actorVaultRepositoryBridge, runtimeLogRepository
   │
   ├── projections (read-only): runtimeActorSnapshotSource → snapshotAdapter / inventoryAdapter
   │
   ▼
Runtime (CampaignRuntimeShell)  ── consumes projections + writes local RuntimeLog

                 └───────────────────────────────────────────────────────────────────────────┘

                 ┌───────────────────────────── SERVER (Room Server) ────────────────────────┐
HTTP + WebSocket (roomServerHttpClient / roomSocketClient)
   ▼
Room Server (Express + ws)
   in-memory registries: room-registry · runtime-log-registry · actor-admission-registry
   RoomSnapshot / RoomRuntimeLogEvent (authority for multiplayer)
                 └───────────────────────────────────────────────────────────────────────────┘

Bridge: RoomRuntimeEntryBridge consumes RoomSnapshot (server) + local character stores (projection).
```

Observations:

- There are **two authorities** for overlapping concepts: local zustand stores
  (single-player) and the server registries (multiplayer). They are not unified;
  the room only carries a lightweight `actorRef`, and the full character lives in
  the player's local store (hence "已连接角色卡 / 仅房间绑定").
- Runtime reads character data through **read-only projections**
  (`runtimeActorSnapshotSource` + adapters), which is the correct direction and
  should be preserved.
- Campaign / Character / RuntimeLog already have **facade + snapshot** seams; Room
  does not (its "repository" is the in-memory registry inside the server).

---

## 2. Current Authority — what is真authority vs runtime/projection

| Object | True Authority today | Projection / Cache | Notes |
| --- | --- | --- | --- |
| Campaign | `campaignLocalStore` (local) | `CampaignInstanceSummary`, entry draft summaries | No server-side campaign authority yet. |
| Character sheet | `characterStore`/`cocStore`/`cpStore` (local, per-system) | `RuntimeCharacterSummary`, `RuntimeInventorySummary` (adapters) | Authority is per-system + fragmented (inventory/wardrobe sub-stores). |
| Actor vault entry | `actorVaultLifecycleStore` (local) | `actorVaultRepositoryBridge` reads | Vault ≈ the "library" index over character stores. |
| Room | `room-registry` (server, in-memory) | `RoomSnapshot` broadcast to clients | Authority is ephemeral (memory); lost on restart. |
| Room RuntimeLog | `runtime-log-registry` (server) | `runtimeLogAppended` deltas | Append-only; ephemeral. |
| Local RuntimeLog | `runtimeLogLocalStore` (local) | `runtimeLogRepository` reads | Separate store from server log — not bridged. |
| Actor admission / clearance | `actor-admission-registry` (server, memory) | `binding.clearance` summary | Memory-only; not persisted. |
| Workshop package | `packageLibrary` (local) + `communityMockData` (mock) | community DTOs | Author identity is mock. |
| Asset / media | `mediaNodeTypes` (`ownerId`) + `actorMediaBinding` | — | Mostly types; no real asset store/CDN. |
| User identity | none (scattered `userId?` / `hostUserId?` / `authorId` / `ownerId`) | `userProfile` seed | No authority; fields are optional placeholders. |

Verdict: **local zustand stores and the server registries are the current
authorities; everything the Runtime consumes is a projection.** This split is
healthy — the problem is that there is no single named repository per domain and
no persistence behind the authorities.

---

## 3. Repository Boundary (recommended future division)

Recommended repositories, each a **single named seam** with a uniform interface
(`create / load / list / update / archive / delete / snapshot`) and **no business
rules inside**:

- **`CampaignRepository`** — owns campaign records + lifecycle (active/archived/
  trashed) + snapshot/import/export. Consolidates `campaignLocalStore` +
  `campaignLibraryRepository` + `campaignExportSnapshot` behind one interface.
- **`CharacterRepository`** — owns the authoritative character sheets across
  systems. Wraps `characterStore`/`cocStore`/`cpStore` + inventory/wardrobe
  sub-stores + `actorVault*` as the index. Exposes read projections to Runtime.
- **`RoomRepository`** — persistence seam for rooms (today the server
  `room-registry`). Split into authority vs projection (see §Room below).
- **`UserRepository`** — owns identity + ownership. New; formalizes the scattered
  `ownerId` / `hostUserId` / `authorId` / `userId` fields.
- **`WorkshopRepository`** — owns rule packages / adventures / extensions /
  plugins / assets-of-content. Consolidates `packageLibrary` + community types.
- **`AssetRepository`** — owns binary/media references (portrait/avatar/map/scene/
  music/pdf/handout/token). Formalizes `mediaNodeTypes` + `actorMediaBinding`;
  content bytes live in object storage, metadata in the repository.

Each repository is **transport-agnostic** and sits behind the existing
`storageAdapterBoundaryTypes` seam (memory / localJson / sqlite / postgres /
objectStorage), so local single-player and cloud multiplayer share one interface.

### What belongs to Repository vs Runtime (Campaign example)

- **Repository:** create / load / list / update / archive / delete / snapshot of
  the campaign record; ownership; import/export envelopes.
- **Runtime:** the live session over a campaign (scene focus, RuntimeLog, dice,
  presence). Runtime **reads** a campaign snapshot and **never** persists campaign
  records directly. RuntimeLog is its own append-only stream, not campaign fields.

---

## 4. Projection Boundary — Authority / Projection / Snapshot / DTO / Runtime Cache

Precise responsibilities (all six should be distinct layers):

| Layer | Responsibility | Rule |
| --- | --- | --- |
| **Authority** | The single source of truth for a record. Only place writes are legal. | Exactly one per record; owned by a Repository (local store or server). |
| **Snapshot** | An immutable, versioned copy of authority state at a point in time (e.g. `campaignExportSnapshot`, entry-time `RoomSnapshot`). | Read-only; carries `schemaVersion`; used for import/export and entry provenance. |
| **Projection** | A read-only, purpose-built view derived from authority/snapshot (e.g. `RuntimeCharacterSummary`, `RoomSnapshot` broadcast). | Never writes back; may drop/rename fields; safe to compute per render. |
| **DTO** | The wire shape crossing a boundary (HTTP/WS/import file). | Serializable; decoupled from internal authority shape; versioned. |
| **Runtime Cache** | In-memory, per-client derived state for the live session (React state, adapter output). | Disposable; rebuildable from authority+snapshot; never authoritative. |

Current mapping (mostly correct already):

- `runtimeActorSnapshotSource` + adapters = **Projection → Runtime Cache** ✅
- `RoomSnapshot` = **Snapshot/Projection** (broadcast DTO) ✅
- `campaignExportSnapshot` / import previews = **Snapshot + DTO** ✅
- `storageAdapterBoundaryTypes` = the **Authority ↔ Persistence** contract ✅

The gap: these layers exist but are **not consistently named or enforced per
domain**; a repository interface makes the Authority layer explicit.

---

## 5. Persistence Roadmap

```
UI / Runtime
   │  (reads projections, never fetches or writes DB directly)
   ▼
Repository (per domain: Campaign/Character/Room/User/Workshop/Asset)
   │  uniform interface: create/load/list/update/archive/delete/snapshot
   ▼
API (HTTP/WS DTOs — only for shared/multiplayer domains)
   │
   ▼
Persistence Adapter  (storageAdapterBoundaryTypes: memory | localJson | sqlite | postgres | objectStorage)
   │
   ▼
Postgres (records) + Object Storage (asset bytes)
```

Staging:

1. **P4.2 Repository interfaces** — define the 6 repository interfaces + wire the
   *existing local stores* as the first adapter (`localJson`/memory). No DB yet.
2. **P4.3 Identity** — introduce `UserRepository` + real `ownerId`/`hostId`/
   `authorId`; backfill the optional fields.
3. **P4.4 Server persistence** — implement a `postgres` adapter behind
   `RoomRepository` + `CampaignRepository` so rooms/campaigns survive restart.
4. **P4.5 Asset storage** — `objectStorage` adapter behind `AssetRepository`.
5. **P4.6 Sync/authority handoff** — local→server promotion (the M69 toggle) built
   on repositories, not ad-hoc replay.

---

## 6. Per-domain answers

### Campaign
Unify behind **`CampaignRepository`**. Repository owns create/load/update/archive/
delete/snapshot + ownership. Runtime owns the live session and only reads a
campaign snapshot. `campaignEntryDraftStore` stays **draft-only** (not membership,
not an actor instance) — keep as a UI concern, not part of the campaign record.

### Character
**`CharacterRepository`** is **Authority** for sheets (wrapping the three system
stores + inventory/wardrobe fragments + vault index). Runtime gets a **Projection**
(`RuntimeCharacterSummary`) and holds it as **Runtime Cache**. The future
`CampaignActorInstance` is a *separate* authority (campaign-scoped growth), NOT the
vault character — reaffirming the M48 boundary. So: vault = Authority; runtime
summary = Projection/Cache; campaign instance = a second Authority (future).

### Room
Split conceptually:
- **`RoomAuthority`** — the mutable room state (today the server `room-registry`).
- **`RoomProjection`** — `RoomSnapshot` broadcast to clients (already exists).
- **`RoomRepository`** — the persistence seam behind the authority (today: memory;
  future: postgres so rooms survive restart).
The current in-memory registry is fine short-term; the split matters once rooms
must persist and once multiple server instances appear.

### Runtime
Recommended unified read direction:
```
Repository → Snapshot → Projection → Runtime
```
Runtime should depend on **projections**, not directly on stores or raw snapshots.
Today `CampaignRuntimeShell` still reads local stores via the resolver (acceptable,
because the resolver *is* the projection seam) and writes the local RuntimeLog
directly (acceptable for local authority). Long-term, Runtime writes go through a
`RuntimeAuthorityAdapter` (local store vs server) — already recommended in the M65A
mode-unification draft.

### Workshop
Unify **Rule Package / Adventure / Extension / Plugin / (content) Asset** behind a
single **`WorkshopRepository`** with the same repository interface. They differ in
*content type*, not in lifecycle (create/version/publish/archive). `packageLibrary`
+ `communityTypes` are the seed; `authorId` must become real via `UserRepository`.

### Asset
Unify **Portrait / Avatar / Map / Scene / Music / PDF / Handout / Token** behind
**`AssetRepository`**. Split **metadata** (repository record: id, ownerId, kind,
mime, dimensions) from **bytes** (object storage / URL). `mediaNodeTypes.ownerId`
+ `actorMediaBinding` are the seed. Static-map v0-lite (URL only) is the minimal
current form and maps cleanly onto "metadata references a URL".

### User Identity
Introduce **`UserRepository`** now (types/contract) even before Auth. The fields to
future-replace with a real user id:
- `Campaign.ownerId` (currently `hostUserId?` on `CampaignInstanceSummary`)
- `Character.ownerId` (currently none — sheets have no owner)
- `Workshop.authorId` (currently mock `author-sample` in `communityMockData`)
- `Room.hostId` (currently host is a *member role*, `RoomMemberIdentity.userId?`)
- `Asset.ownerId` (`mediaNodeTypes.ownerId` exists)
These are the exact seams Auth will bind to.

---

## 7. Verdicts — keep / refactor / drop

### ✅ 建议保留
- **Local zustand + localStorage as the first persistence adapter.** It already
  behaves like `localJson` authority; reuse it behind the repository interface.
- **`storageAdapterBoundaryTypes` as the persistence seam.** It already anticipates
  postgres/objectStorage — this is the right abstraction; build repositories on it.
- **Read-only projection direction (`runtimeActorSnapshotSource` + adapters).**
  Runtime consuming projections, never writing stores, is correct.
- **Snapshot/import/export envelopes** (`campaignExportSnapshot`, actor vault
  export). Versioned snapshots are exactly the DTO/Snapshot layer.
- **Draft-only entry selection** (`campaignEntryDraftStore`) kept separate from
  membership/instance. Preserves the M48 boundary.
- **Room Server memory registry for now.** Fine until persistence is needed.

### ⚠ 建议重构（不是现在，但 P4 要做）
- **Facades → named Repositories.** `campaignLibraryRepository` /
  `actorVaultRepositoryBridge` / `runtimeLogRepository` are facades with mixed
  responsibilities; promote to uniform `*Repository` interfaces with explicit
  authority ownership.
- **Fragmented character authority.** `characterStore`/`cocStore`/`cpStore` +
  `characterInventoryStore` + `characterWardrobeStore` should sit behind one
  `CharacterRepository` so the Runtime projection has one source, not five.
- **Two RuntimeLogs (local vs server) unbridged.** They should share a log
  contract + repository so local→multiplayer promotion can replay without a second
  schema.
- **Room authority/projection/repository not separated.** Split before multi-
  instance or persistence.
- **Scattered ownership fields.** Consolidate under `UserRepository` identity.

### ❌ 不建议长期保留
- **Runtime or UI reading/writing stores directly for persisted domains.** Must go
  through Repository → Projection. (Local RuntimeLog direct-write is tolerable only
  while local is the authority.)
- **Mock author identity (`author-sample`)** as anything but a placeholder.
- **Memory-only room/admission authority** as the permanent model once cloud
  multiplayer is real — it loses state on restart and can't scale to >1 instance.
- **Business rules inside repositories or projections** (e.g. clearance/rules math
  in a repository). Rules stay in a rules layer; repositories only persist.

---

## 8. 不建议做的事情 (guardrails for P4 implementation)

- Runtime **不直接写数据库**；只经 Repository。
- UI **不直接 fetch**；只读 Projection / 经 Repository。
- Room Runtime **不直接管理持久化**；持久化在 RoomRepository/adapter。
- Repository **不包含业务规则**（安检/规则结算/成长计算属于 rules 层）。
- Projection **不回写** Authority。
- Snapshot/DTO **必须带 schemaVersion**，禁止把内部 authority 形状直接当 wire 格式。
- **不要**为单人和多人分别做两套数据层——两者共用 Repository 接口，只换 adapter。
- **不要**把 `CampaignActorInstance` 与 vault character 合并成同一 authority。
- **不要**在本审计阶段动 Runtime / Room Server / Protocol / UI / Store / DB。

---

## 9. 自动验证

**未执行自动验证。** 本任务为纯架构审计，仅新增本文档（`docs/architecture/REPOSITORY_ARCHITECTURE_AUDIT_V1.md`），未改动任何代码，故无需类型检查/构建。当前工作环境的隔离沙箱不可用，无法运行：

```
npx tsc --noEmit
npx tsc -p server/tsconfig.server.json --noEmit
npm run build
npm run server:build
git diff --check
```

请在本地/Codex 环境执行以上命令确认工作区干净（预期仅新增本 .md 文件）。**未进行人工验证，未声称完成任何浏览器测试。**

---

## 10. 下一步（交给 Codex 的实施顺序建议）

1. `P4.2` 定义 6 个 Repository 接口 + 把现有本地 store 作为首个 adapter（无 DB）。
2. `P4.3` `UserRepository` + identity 字段落地（`ownerId`/`hostId`/`authorId`）。
3. `P4.4` `RoomRepository` + `CampaignRepository` 的 postgres adapter（重启不丢）。
4. `P4.5` `AssetRepository` 的 objectStorage adapter。
5. `P4.6` 基于 Repository 的 local→server 提升（承接 M69 toggle 契约）。

每步都应保持："UI/Runtime 只读 Projection、只经 Repository 写"这一不变量。
