# Application Service Boundary Audit V1 (P4.7)

Status: **architecture audit only.** No runtime / protocol / server / store /
dependency changes. Builds on P4.1–P4.6. Grounds the *actual* service layer and
defines use-case (application service) responsibilities.

Grounding anchors:
- **Server `services/` (13 modules)** = the real application-service layer:
  `createRoom`, `joinRoom`, `approveMember`, `rejectMember`, `submitActorBinding`,
  `approveActorBinding`, `rejectActorBinding`, `setMemberReady`,
  `appendRuntimeLogEvent`, `listRuntimeLogEvents`, `rollSharedDice`,
  `characterClearance`, `getRoom`.
- HTTP handlers in `room-server.ts` are **thin adapters** over these services.
- Frontend: no explicit application-service layer; shells/components orchestrate
  repositories directly (`JoinCampaignPanel`, `RoomRuntimeEntryBridge`,
  `CampaignRuntimeShell`), with `hostedRoomLaunch.ts` + `campaignFlow.ts` as flow
  seeds.

---

## 1. Current findings

1. **The server already has a clean application-service layer.** Each `services/*`
   module is a use-case taking `(registry, input)` and returning a **decision
   result**; the HTTP handler only parses the request, calls the service, maps the
   decision to a status. This is exactly the target shape — grounded and good.
2. **The frontend has no equivalent layer.** Components/shells orchestrate multiple
   repositories/clients + local state directly. E.g. `JoinCampaignPanel` calls
   `createRoomOnServer` + `listRoomServerRooms` + builds lobby state; the shells
   wire resolver + adapters + stores. This is a **UI-orchestrates-use-cases leak**.
3. **Some rules live near services correctly** (validation in `createRoom`,
   `roomRuntimeEntryGuard`, `characterClearance`), but a few **rule-ish decisions
   leak into UI** (entry eligibility, ready/admission gating computed in shells).
4. **No AI service layer** yet (future — must sit as a service, never bypass).

---

## 2. Layer ownership — what belongs where

| Concern | Belongs to | Grounded example |
| --- | --- | --- |
| Use-case orchestration (a whole action) | **Application Service** | `createRoom`, `joinRoom`, `setMemberReady`. |
| Domain rules / invariants | **Domain** (rules layer) | dice grammar (`sharedDiceExpression`), clearance rules (`characterClearance`), entry guard. |
| Persistence (load/save/list) | **Repository** | registries, `campaignLibraryRepository`, `actorVaultRepositoryBridge`. |
| Ordered event authority | **Runtime / event authority** | `appendRuntimeLogEvent` (seq), `rollSharedDice`. |
| Transport / broadcast | **Room Server / API** | `room-server.ts` handlers + WS broadcast. |
| Request/response DTO mapping | **API edge** | HTTP handlers (thin). |
| View state / interaction | **UI** | components/shells. |
| AI generation | **AI Gateway** (future) | none yet. |

**Business-rule leaks to fix later:** entry-eligibility, ready/admission gating, and
"solo vs host" decisions are partly computed in shells; these are domain/service
decisions that UI should *call*, not *re-derive*.

---

## 3. Application Service responsibilities

An Application Service = **one use-case**; it orchestrates domain + repository, is
transactional (P4.5), returns a Response DTO / decision, and holds **no** UI,
transport, persistence-detail, or AI logic.

Use-case catalog (server ones already exist ✅; frontend ones are the gap ⚠):

| Use case | Exists today | Should live in |
| --- | --- | --- |
| Create Campaign | frontend store + facade | Campaign App Service (new) |
| Join Room | ✅ `joinRoom` | Room App Service |
| Approve / Reject Member | ✅ `approveMember`/`rejectMember` | Room App Service |
| Bind Character (submit binding) | ✅ `submitActorBinding` | Room App Service |
| Approve / Reject Binding | ✅ `approve/rejectActorBinding` | Room App Service |
| Ready | ✅ `setMemberReady` | Room App Service |
| Append Runtime Event / Dice | ✅ `appendRuntimeLogEvent`/`rollSharedDice` | Runtime App Service |
| Start Runtime (enter) | shell logic ⚠ | Runtime App Service (new) |
| Save / Clone Character | store direct ⚠ | Character App Service (new) |
| Publish / Import Package | facade/mock ⚠ | Workshop App Service (new) |
| Upload Asset | none | Asset App Service (future) |
| AI Review / Generate | none | AI Gateway Service (future) |

---

## 4. Canonical use-case flow (target)

```
UI (intent)
  ↓
Application Service   ── validates via Domain rules; opens a transaction
  ↓
Repository            ── load/save aggregate (P4.1/P4.5)
  ↓
Persistence Adapter → storage
  ↓
Projection           ── returns a Response DTO / projection to UI
```

Never (each is a real risk to watch):
- **Repository containing business rules** — keep rules in Domain/Service.
- **Runtime modifying persistence directly** — Runtime emits events; a service/repo
  persists.
- **UI orchestrating multiple repositories** — the current frontend leak; move the
  orchestration into a frontend Application Service that mirrors the server ones.
- **Application Service manipulating UI** — services return data, never touch view.
- **AI bypassing the service layer** — AI proposes; a service + human confirm apply.

---

## 5. Verdicts

### ✅ 保留
- **Server `services/*` as the application-service layer** — thin HTTP handlers over
  pure use-case services returning decisions. This is the model to mirror.
- **Domain rules already factored out** (dice grammar, clearance, entry guard).
- **Decision-result pattern** (testable, transport-agnostic).

### ⚠ 重构（P4+）
- **Introduce a frontend Application Service layer** so shells/components stop
  orchestrating repositories + clients + local state directly.
- **Pull entry-eligibility / ready / admission / solo-vs-host decisions out of UI**
  into services (they are domain/service decisions).
- **Wrap multi-step frontend actions** (create room, promotion, import) as single
  transactional use-cases (P4.5 batches).

### ❌ 不建议长期保留
- **UI as the orchestrator** of multi-repository use-cases.
- **Rules recomputed in components.**
- **Runtime writing persistence** or **repositories holding rules**.
- **Any future AI path that skips the service + confirmation layer.**

---

## 6. Roadmap after P4.7
Feeds P4.8 (dependency rules: UI → App Service → Domain/Repository, never UI →
store/adapter) and P4.8 AI Gateway (AI as a service, never a bypass).

**No behavior changed. No protocol changed. No implementation.** 未执行自动验证
(纯文档；沙箱不可用) — 请本地 `tsc/build/git diff --check` 确认仅新增本 .md。
