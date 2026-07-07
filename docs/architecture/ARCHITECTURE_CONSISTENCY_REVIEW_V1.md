# Architecture Consistency Review V1 (P4.1–P4.8)

Status: **architecture review only.** No code / protocol / behavior changes. This
cross-checks the eight P4 audit documents for terminology, boundary, authority,
naming, folder, and dependency consistency, and lists contradictions **without
silently changing them**.

Documents reviewed (all under `docs/architecture/`):
1. `REPOSITORY_ARCHITECTURE_AUDIT_V1.md` (P4.1)
2. `DOMAIN_MODEL_BOUNDARY_AUDIT_V1.md` (P4.2)
3. `IDENTITY_REFERENCE_OWNERSHIP_AUDIT_V1.md` (P4.3)
4. `RUNTIME_EVENT_REPLAY_BOUNDARY_AUDIT_V1.md` (P4.4)
5. `PERSISTENCE_TRANSACTION_BOUNDARY_AUDIT_V1.md` (P4.5)
6. `API_CONTRACT_BOUNDARY_AUDIT_V1.md` (P4.6)
7. `APPLICATION_SERVICE_BOUNDARY_AUDIT_V1.md` (P4.7)
8. `MODULE_DEPENDENCY_BOUNDARY_AUDIT_V1.md` (P4.8)

---

## 1. Consistency checks

| Dimension | Consistent? | Notes |
| --- | --- | --- |
| **Terminology** | ✅ | Authority / Snapshot / Projection / DTO / Runtime Cache / Value Object used identically across P4.2–P4.6. |
| **Authority** | ✅ | "Exactly one authority per record/session; everyone else derives" holds in P4.1 (repo), P4.4 (event), P4.5 (persistence), P4.7 (service). |
| **Repository** | ✅ | "Repository persists, never holds rules/UI/AI/network" identical in P4.1, P4.5, P4.7, P4.8. |
| **Projection** | ✅ | Read-only, never writes back — P4.2/P4.4/P4.6 agree; API keeps projection at the edge. |
| **Snapshot** | ✅ | Immutable + `schemaVersion`; entry snapshot as replay baseline — P4.2/P4.4/P4.5 agree. |
| **Runtime** | ✅ | Runtime consumes projections, emits events, never writes persistence — P4.2/P4.4/P4.5/P4.7/P4.8 agree. |
| **Identity** | ✅ | Global UUID = only cross-boundary key; `ownerId` per aggregate; codes/names never FKs — P4.3 referenced consistently by P4.5/P4.6. |
| **AI** | ✅ | Never authoritative, never appends events, artifacts with `sourceRefs`, human-confirmed — identical in P4.2/P4.4/P4.5/P4.7/P4.8. |
| **Naming** | ⚠ | Minor: `RuntimeSession` (P4.2/P4.4) vs `sessionId?` (code) — session id exists but the aggregate is not yet named in code. Acceptable (future). |
| **Folder** | ⚠ | Non-visual lib-role modules under `components/platform/` (P4.8) contradict the "components = view only" rule used in P4.7/P4.8. Flagged, not fixed. |
| **Dependency** | ✅ (with the P4.8 smells noted) | Top-down flow consistent; the two smells are recorded, not contradictions in principle. |

---

## 2. Contradictions found (recorded, not changed)

1. **Two RuntimeLog schemas** (P4.4): local `LocalRuntimeLogEvent` (tombstone +
   `correctsEventId`, no `seq`/visibility) vs server `RoomRuntimeLogEvent`
   (`seq` + visibility, no correction). The audits agree they *should* converge;
   the code still has both. → **Refactor Later** (P4.4 §12).
2. **`RoomSnapshot` triple-duty** (P4.6): it is Authority + DTO + Projection at once,
   which contradicts the P4.2/P4.6 "never mix" rule. The WS envelope already
   anticipates the split. → **Refactor Later**.
3. **Lib-role modules in `components/`** (P4.8) contradict "components = view only"
   (P4.7/P4.8). → **Refactor Later** (relocate).
4. **Server value-imports a frontend-lib file** (`sharedDiceExpression.js`, P4.8)
   contradicts "server imports shared kernel only". Logically shared, physically
   mislocated. → **Refactor Later** (extract shared kernel dir).
5. **Character authority is fragmented** (P4.1/P4.2): three system stores + inventory
   + wardrobe sub-stores vs the "one Character aggregate" target. → **Refactor Later**.
6. **Server state is ephemeral** (P4.1/P4.4/P4.5): memory-only rooms/log/admission vs
   "persist via adapter". Acceptable now; wrong long-term. → **Refactor Later**.
7. **No `ownerId` on Character** (P4.3) vs "one required owner per aggregate". →
   **Refactor Later** (highest identity priority).

None of these are principle contradictions between documents — the audits are
internally consistent; they are **known gaps between the agreed target and the
current code**, each already assigned a refactor slot.

---

## 3. Keep (✅ stable long-term principles)

- One **authority** per record/session; everything else derives.
- **Global UUID** = only cross-boundary key; codes/names/slugs never FKs.
- **Append-only event log** with authority-assigned `seq` = the backbone; snapshots
  are checkpoints; projections/combat/inventory/AI/chronicle derive from it.
- **Repository per aggregate over a pluggable storage adapter**; repositories never
  hold rules/UI/AI/network.
- **`storageAdapterBoundaryTypes`** as the persistence seam; **WS envelope with
  swappable `payload`** as the transport seam.
- **Application services = use-cases**; server `services/*` is the model to mirror.
- **AI is advisory-only**, never authoritative, always human-confirmed.
- **Top-down, acyclic** dependency flow; shared kernel = pure contracts only.
- **Blob = object storage + metadata reference**; DB = records/relationships only.

## 4. Refactor Later (⚠ agreed, not now)

- Converge the two RuntimeLogs into one `RuntimeEvent` contract (seq + visibility +
  correction/tombstone + versioning + idempotency/correlation).
- Split `RoomSnapshot` authority vs broadcast DTO/projection.
- Consolidate Character into one aggregate (+ required `ownerId`); add owners
  everywhere.
- Relocate lib-role modules out of `components/`; extract a shared kernel dir
  (fixes the server value-import too).
- Introduce a frontend application-service layer (stop UI `store.getState()` /
  multi-repo orchestration).
- Wire storage adapters + cross-aggregate transactions + central migration registry;
  persist server state.
- Add HTTP API versioning + uniform error envelope + correlation/request/idempotency
  /trace ids.

## 5. Do Not Keep (❌ long-term)

- Mixing Authority/DTO/Projection/Snapshot in one shape.
- In-place edit/delete of events; client-assigned order; last-write-wins sync.
- UI consuming persistence shapes / orchestrating repositories; components reading
  stores directly.
- Repository holding rules; Runtime writing persistence; AI writing authority or
  bypassing services.
- Large binaries in DB/localStorage/event payloads.
- Vendor/framework assumptions in domain/repository/adapter (React, DB SDK, cloud
  SDK) — lock-in.
- Two permanently separate SP/MP schemas; memory-only authority as the permanent
  model.

## 6. Future Direction

The eight audits define a coherent target: **UI → Application Service → Repository →
Adapter → Storage**, with **one append-only event backbone**, **UUID identity +
per-aggregate ownership**, **projection/DTO at the edges only**, **AI as an
advisory service**, and **no vendor lock-in**. Implementation order (Codex):

1. Identity: add `ownerId` + a UUID minting contract.
2. Event: unify the `RuntimeEvent` contract (SP+MP).
3. Repository + storage adapter: wire the seam; persist server state.
4. Application service layer (frontend) + transaction batches.
5. API versioning + error/correlation envelope.
6. Realtime sync (P4.7 next) + AI Gateway (P4.8 next) on top.
7. Structural: relocate lib-role modules + shared kernel dir.

Each step preserves the invariants above; none requires throwing away current code
— the current design is directionally correct, with known, slotted gaps.

---

## 7. Verification

**未执行自动验证。** 本轮（P4.6–P4.8 + 一致性复盘）仅新增四个架构 Markdown 文档，未
改动任何代码/协议/运行时/构建，故无需类型检查/构建。当前隔离沙箱不可用，无法运行
`npx tsc --noEmit` / `tsc -p server/tsconfig.server.json --noEmit` / `npm run build`
/ `npm run server:build` / `git diff --check`。请在本地/Codex 执行以确认工作区仅新增
`docs/architecture/*.md`。**未进行人工验证，未声称完成浏览器测试。**
