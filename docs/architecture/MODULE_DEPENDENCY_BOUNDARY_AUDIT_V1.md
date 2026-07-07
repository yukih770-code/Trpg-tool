# Module Dependency Boundary Audit V1 (P4.8)

Status: **architecture audit only.** No runtime / protocol / server / store /
dependency changes. Builds on P4.1–P4.7. Grounds the *actual* folder/import graph
and defines dependency rules.

Grounding anchors (observed imports):
- `src/pages/*Workspace/*` → `src/components/platform/*` → `src/lib/platform/*` +
  `src/store/*` + `src/lib/dnd2024/*` + `src/i18n`.
- `server/room-server.ts` → `server/services/*` → `server/{room-registry,
  runtime-log-registry, actor-admission-registry, transport, storage}` →
  `server/protocol/room-protocol.ts` → `src/lib/platform/*` (shared types) +
  value-import `src/lib/platform/sharedDiceExpression.js`.

---

## 1. Current dependency directions (grounded)

```
src/pages/<system>Workspace/*Shell        (top: composition)
        ↓ imports
src/components/platform/*                  (UI + several NON-visual lib-role modules)
        ↓ imports
src/lib/platform/*   +   src/store/*   +   src/lib/dnd2024/*   +   src/i18n
        ↓
zustand persist → localStorage

server/room-server.ts                      (HTTP composition)
        ↓
server/services/*                          (application services)
        ↓
server/{room-registry, runtime-log-registry, actor-admission-registry,
        transport/roomSocketServer, storage/memory-storage-adapter}
        ↓
server/protocol/room-protocol.ts           (re-export of shared platform types)
        ↓
src/lib/platform/*   (shared contracts)   + value-import sharedDiceExpression.js
```

Direction is **predominantly top-down and acyclic** — good. Two boundary smells and
a shared-kernel coupling are noted below.

---

## 2. Findings

### 2.1 ✅ Healthy
- **Top-down import flow**: pages → components → lib/store; server handlers →
  services → registries → shared types.
- **Server ↔ frontend share contracts via one seam** (`server/protocol/
  room-protocol.ts` re-exports `src/lib/platform` types) — a deliberate shared
  kernel, not scattered coupling.
- **No obvious import cycles at the folder level** (facade↔store are type-heavy).

### 2.2 ⚠ Boundary smells
1. **Lib-role modules living under `components/platform/`.** The P4.x contracts /
   resolvers / adapters — `runtimeActorSnapshotSource`, `runtimeActorSnapshotAdapter`,
   `runtimeInventoryAdapter`, `runtimeModeContract`, `runtimeActorInstanceBoundary`,
   `runtimeInventoryBoundary` — are **non-visual** but sit in the components folder.
   This blurs the components↔lib boundary. They belong under `src/lib/platform`
   (or a new `src/lib/runtime`).
2. **Components read stores directly.** `runtimeActorSnapshotSource` (in components)
   calls `useCharacterStore.getState()` etc. Per P4.7, UI/components should reach
   data through an application service, not `store.getState()`.
3. **Server value-imports a frontend-lib runtime module.** `sharedDiceExpression.js`
   is imported *as a value* into `server/services/rollSharedDice` — it pulls a
   `src/lib/platform` runtime file into the server program (the standing NodeNext
   concern). Correct *logically* (shared pure rule), wrong *physically* (frontend
   lib as server dependency).

### 2.3 Cycle risks (watch, not confirmed broken)
- `campaignFlow ↔ campaignLibraryRepository ↔ campaignLocalStore` (mixed type +
  value imports) — keep type-only where possible.
- `roomServerConfig → roomServerEndpoint` — clean split, fine.

---

## 3. Target layer stack + allowed/forbidden imports

```
pages           (composition / routing)
  ↓
components       (view only)
  ↓
application      (use-case services; see P4.7)
  ↓
domain           (rules, contracts, value objects)
  ↓
repository        (per-aggregate persistence facade)
  ↓
adapter           (storage adapter; storageAdapterBoundaryTypes)
  ↓
storage           (localStorage / sqlite / postgres / object storage)
```

| Layer | May import | Must NOT import |
| --- | --- | --- |
| pages | components, application | domain internals, store, adapter, storage |
| components (view) | application, domain **types**, i18n | store directly, repository, adapter, transport DTO internals |
| application (service) | domain, repository | components, pages, transport, UI state |
| domain (rules/contracts) | other domain, pure utils | repository, adapter, store, server, React |
| repository | domain, adapter (interface) | components, application-rules, network, UI |
| adapter | storage SDKs (behind interface) | domain rules, UI |
| server (handlers) | server services | frontend components, stores, React |
| server services | domain (shared pure), registries | frontend UI, React, transport specifics |
| shared kernel (contracts) | nothing app-specific | React, DOM, store, server, vendor SDKs |

**Never reverse** (adapter → repository → domain → application → components → pages).

---

## 4. Per-area dependency rules

- **Runtime:** depends on domain + application + projections; **emits events**, never
  writes persistence or imports adapters. (P4.4/P4.5.)
- **Room:** server services depend on registries + shared contracts; the frontend
  room bridge depends on the HTTP/WS client + projections, never on server internals.
- **Workshop:** package repo/service depends on domain + adapter; UI depends on the
  workshop service, not `packageLibrary` internals.
- **AI:** the future AI Gateway is an **application service**; it may import domain +
  repository (read) but **must not** be imported by domain/repository, and must not
  bypass services to write authority (P4.4/P4.7).
- **Storage:** adapters implement `storageAdapterBoundaryTypes`; **only repositories**
  import adapters; nothing else imports storage SDKs.
- **Server:** may import the **shared kernel** (pure contracts/rules) only; must not
  import React/DOM/frontend components/stores.
- **Frontend:** may import shared kernel + application services; must not import
  server internals or storage SDKs.
- **Plugins (future):** depend only on a published **plugin API** (a stable subset of
  domain contracts), never on internal modules.
- **System packages (dnd2024/coc/cp rules):** domain-layer; importable by
  application/runtime; must not import UI/store/adapter.

**No vendor lock-in / no framework assumptions:** domain, repository, adapter
interfaces, and shared contracts must not import React, a specific DB SDK, or a
specific cloud SDK. Those live only in the outermost layers (components / concrete
adapters).

---

## 5. Verdicts

### ✅ 保留
- Top-down acyclic flow (pages → components → lib/store; handlers → services →
  registries → shared types).
- Single shared-kernel seam (`server/protocol` re-export) for server↔frontend
  contracts.
- Storage behind `storageAdapterBoundaryTypes` (adapters isolated).

### ⚠ 重构（P4+）
- **Move non-visual lib-role modules out of `components/platform/`** into
  `src/lib/platform` (or `src/lib/runtime`): the resolver, adapters, mode/boundary
  contracts.
- **Insert a frontend application-service layer** so components stop calling
  `store.getState()` directly (P4.7).
- **Extract cross-target pure logic (dice, contracts) into a shared package/dir**
  imported by both `src/` and `server/` — replacing the server value-import of a
  frontend-lib file (resolves the NodeNext coupling).
- **Enforce type-only imports** across facade↔store to keep cycles impossible.

### ❌ 不建议长期保留
- **Components importing stores / repositories directly.**
- **Server importing frontend UI/store or a frontend-lib runtime file as a value.**
- **Domain / repository / adapter importing React, a DB SDK, or a cloud SDK** (lock-in).
- **Reverse-direction imports** (lower layer importing an upper layer).
- **Non-visual contracts living under `components/`.**

---

## 6. Roadmap after P4.8
Feeds the Consistency Review. The one structural refactor with the highest leverage:
**relocate the P4.x lib-role modules + extract a shared kernel dir**, which
simultaneously fixes the components↔lib smell and the server value-import coupling.

**No behavior changed. No protocol changed. No implementation.** 未执行自动验证
(纯文档；沙箱不可用) — 请本地 `tsc/build/git diff --check` 确认仅新增本 .md。
