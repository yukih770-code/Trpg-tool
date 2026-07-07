# Domain Model & Entity Boundary Audit V1

Status: **architecture audit only.** No Runtime / UI / Store / Protocol / Room
Server / API / Repository / Database / dependency changes were made. This document
classifies the platform's domain objects into DDD-style layers so the upcoming
Persistence & Identity work builds on stable aggregate boundaries. Builds on
`REPOSITORY_ARCHITECTURE_AUDIT_V1.md` (P4.1).

Grounding anchors (existing modules referenced, not invented):
- Combat: `dnd2024/gameplay/runtimeCombatStore.ts` (+ `runtimeCombatStoreTypes`,
  `weaponAttackResolver`, `conditionTypes`, `effectTypes`).
- Dice: `sharedDiceExpression.ts`. Items: `dndItemDefinitions.ts`,
  `itemGameplayTypes.ts`, `equipment-types.ts`.
- Clearance/hash: `characterClearanceTypes.ts` (`ActorSnapshotHash`).
- Room: `roomTypes.ts` (`RoomSnapshot`), server registries.
- Map/token & sync: `mapTokenSyncTypes.ts`, `runtimeSyncTypes.ts`,
  `runtimeLogSyncTypes.ts`, `clientIntentTypes.ts`.
- Content: `narrativeCardTypes.ts`, `triggerEventGraphTypes.ts`.
- Asset/media: `mediaNodeTypes.ts` (`ownerId`), `actorMediaBinding.ts`.
- Workshop/community: `packageLibrary.ts`, `communityTypes.ts` (`authorId`).
- Identity: `userProfile.ts` (`userId`). Chronicle / Growth / Subscription /
  Version have **no module yet** → confirmed future.

---

## 0. Layer definitions (the vocabulary used below)

| Layer | Meaning | Write? | Lifespan |
| --- | --- | --- | --- |
| **Aggregate** | A consistency boundary owning one or more entities; the unit a Repository loads/saves atomically. | via aggregate root | persisted |
| **Entity** | Identity + mutable state, lives inside an aggregate. | yes (through root) | persisted |
| **Value Object (VO)** | Immutable, identity-less, compared by value. | replaced, not mutated | inline |
| **Snapshot** | Immutable versioned copy of aggregate state at a time. | no | persisted/exported |
| **Projection** | Read-only derived view for a purpose. | no | derived |
| **Runtime Cache** | Per-client in-memory derived state for the live session. | no | disposable |
| **DTO** | Wire shape across HTTP/WS/import. | no (serialized) | transient |
| **UI Model** | View-only shape for a component; not domain. | no | ephemeral |

Golden rule reaffirmed from P4.1: **only an Aggregate root, through its
Repository, may write.** Everything else derives.

---

## 1. Current Domain Map (what exists today, by domain)

```
Campaign ──┐
           ├─ Room ── Lobby/Member/Ready/Admission ── RoomRuntime
           └─ (local) CampaignRuntime
Character (per-system sheet) ── Inventory/Wardrobe ── ActorVault index
Runtime ── Scene · RuntimeLog · Combat(initiative/conditions/effects) · Map/Token(sync types)
Workshop ── Package (packageLibrary) · Community(authorId, mock)
Asset ── media node (ownerId) · actorMediaBinding
User ── userProfile (userId) — seed only
AI ── none yet (Chronicle/Summary/Memory are future)
```

---

## 2. Aggregate Boundaries (recommended)

### Campaign Aggregate
- **Root:** `Campaign` (Entity).
- **Owns:** `CampaignSettings` (VO/Entity-of), campaign metadata, ownership.
- **NOT part of it:** `CampaignRuntime` (a live session — Runtime domain),
  `CampaignSnapshot` (Snapshot), `CampaignChronicle` (Generated Artifact / future),
  `CampaignMembership` (its own relationship entity, future). Entry-draft
  (`campaignEntryDraftStore`) is a **UI Model**, never in the aggregate.

### Character Aggregate
- **Root:** `Character` (the vault character = Entity, authoritative sheet).
- **Owns (entities/VOs inside the boundary):** core sheet fields, `Inventory`
  (list of `ItemInstance` entities — future), `Wardrobe`/loadout, `Portrait`
  reference (Asset ref, not bytes), initial build fields.
- **Independent (NOT inside Character aggregate):**
  - `ActorSnapshot` = **Snapshot** (immutable, hashed — `ActorSnapshotHash`).
  - `RuntimeCharacter` / `RuntimeCharacterSummary` = **Projection / Runtime Cache**.
  - `CharacterBinding` (room actor binding) = **relationship entity in the Room
    aggregate**, not the character.
  - `Growth` / `CharacterChronicle` = **Generated Artifact / future Campaign-scoped
    authority** (the `CampaignActorInstance`), NOT the vault character (M48).
- **ItemDefinition vs ItemInstance:** `ItemDefinition` (template) = **VO/shared
  reference** (see `dndItemDefinitions`); `ItemInstance` (owned copy) = **Entity**
  inside inventory (future, per M53).

### Runtime Aggregate
- **Root:** `RuntimeSession` (a live session over a campaign/room).
- **Owns:** `Scene` (current scene focus — Entity/VO of session), `RuntimeLog`
  (append-only **event stream**, an entity list), `Combat`/`Initiative`/
  `Conditions`/`Effects` (`runtimeCombatStore` — Runtime entities), `MapState`/
  tokens.
- **Projection:** `RoomSnapshot`, `RuntimeCharacterSummary`, quick-view/layout
  types (`runtimeQuickViewTypes`, `runtimeLayoutTypes`) = **Projection/UI Model**.
- **Replay:** `RuntimeLog` is the **replay source of truth**; a session can be
  reconstructed from its ordered events + the entry snapshot. RuntimeLog is
  therefore *both* an entity stream (authority) and the replay/DTO substrate.

### Room Aggregate
- **Root:** `Room` (Entity; server-authoritative).
- **Owns:** `Lobby`, `Member` (Entity), `Ready` (VO/state), `Admission`/clearance
  (Entity — decision record), `RoleBinding`/`ActorBinding` (Entity linking member↔
  actorRef).
- **Snapshot/DTO:** `RoomSnapshot` (broadcast **DTO/Projection**).
- **RoomRuntime** = the Runtime aggregate *scoped to* a room — NOT a separate
  authority; it reads Room + writes RuntimeLog.

### Workshop / Package Aggregate
- **Root:** `Package` (Entity), specialized by content kind: `RulePackage`,
  `Adventure`, `Plugin`, content `Asset`.
- **Owns:** `Version` (Entity — immutable published versions), `Dependency` (VO/edge
  to other package@version), manifest.
- **Independent:** `Subscription` (a User↔Package relationship — belongs to User
  aggregate or a join), `authorId` (→ User). `Dependency` is a **VO edge**, not an
  entity.

### Asset Aggregate
- **Root:** `Asset` (Entity: metadata — id, ownerId, kind, mime, dimensions, URL).
- **Value/attachment split:** the **bytes** live in object storage; the metadata
  record is the entity. `actorMediaBinding` = a **relationship VO/entity** (Asset ↔
  Actor), i.e. an **Attachment**, not a new asset.

### User Aggregate (future)
- **Root:** `User` (Entity).
- **Owns:** `Profile` (Entity/VO), `Identity` (auth linkage — VO), `Permission`
  (VO — capability set, NOT an entity), `Favorite`/`Subscription` (relationship
  entities). `userProfile.ts` is the seed.

---

## 3. Entity Relationship (text)

```
User (owner) ──< Campaign ──< Room ──< Member >── User
                    │            │        └─ ActorBinding >── Character (ref/snapshot)
                    │            └──< Admission
                    ▼
              RuntimeSession (per campaign OR per room)
                    ├─ Scene
                    ├─ RuntimeLog (append-only events)  ──► Replay / Chronicle draft
                    ├─ Combat (initiative/conditions/effects)
                    └─ MapState (tokens)

User (author) ──< Package ──< Version ──< Dependency >── Package@Version
User ──< Subscription >── Package
User ──< Character (vault)  ──< ItemInstance
Character ── Portrait ──► Asset
Package/Handout/Map ──► Asset

(future) Campaign ──< CampaignActorInstance >── Character   // campaign-scoped growth authority
RuntimeLog ──► SessionSummary / CampaignChronicle / CharacterChronicle  // Generated Artifacts (AI)
```

Canonical spine (matches the task's chain):
```
User → Campaign → Room → RuntimeSession → RuntimeLog → Chronicle
```

---

## 4. Value Objects (should NOT be Entities)

Immutable, compared by value, no identity — keep these as VOs:

- **DiceExpression / DiceRoll result** (`sharedDiceExpression`) — value, not entity.
- **Coordinate / Position / Grid cell** (map) — value.
- **Duration / Range / AreaTemplate** — value.
- **Modifier / Bonus / Advantage flag** — value.
- **Permission / Capability set** — value (derived from role/ownership).
- **ItemDefinition** (template) — shared value/reference.
- **Dependency edge** (package@version) — value.
- **Ready flag, Clearance status, MatchConfidence** — value/enum.
- **RoomCode / InviteCode** — value identifiers (NOT a permission system).
- **ActorSnapshotHash** — value (content hash).

Anti-pattern to avoid: giving these their own tables/ids. They live **inline**
inside their owning entity/aggregate.

---

## 5. Snapshot / Projection / DTO / Generated-Artifact assignment

### Should own a Snapshot (immutable, versioned, `schemaVersion`)
- Campaign (export/import — `campaignExportSnapshot`).
- Character / Actor (`actorVaultExportSnapshot`, `ActorSnapshot` + hash).
- Room entry-time state (`RoomSnapshot` at entry = provenance).
- RuntimeSession baseline (for replay start point).

### Should own a Projection (read-only view)
- `RuntimeCharacterSummary` / `RuntimeInventorySummary` (from Character).
- `RoomSnapshot` broadcast (from Room).
- Roster / lobby views, quick-view/layout (from Room + Runtime).
- Campaign list summaries (`CampaignInstanceSummary`).

### Should own a Wire DTO
- Room protocol messages (`roomTypes` requests/results, `roomTransportTypes`).
- RuntimeLog append/list + deltas (`roomRuntimeLogTypes`, sync types).
- Import/export envelopes (campaign, actor vault).
- Future: Repository/API request/response shapes per domain (P4.1 roadmap).

### Generated Artifacts (AI) — **never Authority**
- `SessionSummary`, `StoryDraft`, `CharacterStory`, `CampaignChronicle`,
  `Memory`, `PromptContext`.
- These are **derived outputs** produced from authoritative RuntimeLog/records.
  They may be *stored* (as their own artifact entities with provenance +
  `generatedBy: 'ai'`), but they are **not** the source of truth and **must not**
  write back into Campaign/Character/Room aggregates automatically.

---

## 6. AI domain — authority question (explicit)

**Does AI hold any authoritative write permission? No.**

- AI reads authoritative data (RuntimeLog, character snapshot, campaign records) and
  produces **Generated Artifacts** (summary/story/memory/prompt-context).
- Artifacts are stored as **separate, clearly-tagged records** (own aggregate:
  `GeneratedArtifact` with `sourceRefs`, `generatedAt`, `model`, `reviewed?`).
- Any change AI *suggests* to a Character/Campaign/Room must pass through the same
  human/rules path as manual edits: **deterministic rules = hard validation; AI =
  diff summary / anomaly hints; Host/Owner = final confirmation** (reaffirms M48 /
  clearance stance). AI is advisory, never the writer.

---

## 7. Domain Evolution Roadmap (how each domain evolves around Persistence/Replay/Marketplace/Cloud/AI)

- **Persistence:** each Aggregate root ↔ one Repository (P4.1) ↔ storage adapter.
  Aggregates define the atomic save/load unit; VOs serialize inline; Snapshots are
  export rows.
- **Replay:** RuntimeSession is reconstructable from `entry Snapshot + ordered
  RuntimeLog`. This makes local→cloud promotion and post-hoc chronicle generation
  possible without a second schema. RuntimeLog must therefore stay append-only and
  event-shaped.
- **Marketplace:** Workshop `Package`/`Version`/`Dependency` + User `Subscription`
  form the marketplace aggregate cluster; `authorId` becomes real via User.
- **Cloud:** Room/Campaign aggregates gain a server-side authority + postgres
  adapter; the client keeps consuming Projections. Single-player uses the same
  aggregates with a local adapter.
- **AI:** `GeneratedArtifact` aggregate consumes RuntimeLog/Chronicle; write-back to
  core aggregates only via confirmed, rules-checked flows.

---

## 8. Verdicts — keep / refactor / drop

### ✅ 建议保留
- **RuntimeLog as append-only event stream** = correct replay/authority substrate.
- **ActorSnapshot + hash** (`characterClearanceTypes`) as the immutable Snapshot/VO
  for clearance/provenance.
- **ItemDefinition (VO) vs ItemInstance (Entity)** distinction (M53) — canonical.
- **Projection-only Runtime consumption** (adapters) — right direction.
- **RoomSnapshot as DTO/Projection** (not authority) — right.
- **Dice/Coordinate/Modifier/Permission as Value Objects** — right; keep inline.
- **Media metadata vs bytes split** (Asset entity + object storage) — right target.

### ⚠ 建议重构（P4，非现在）
- **Character authority is fragmented** (`characterStore`+`cocStore`+`cpStore`+
  inventory/wardrobe sub-stores). Consolidate under one **Character Aggregate** so
  Inventory/Wardrobe/Portrait are entities/refs *inside* it, not parallel stores.
- **Combat/Initiative store** (`runtimeCombatStore`) should be modeled as part of
  the **Runtime Aggregate**, not a free-floating store, so replay covers it.
- **Room concepts not aggregated** — Lobby/Member/Ready/Admission/Binding should be
  explicit entities under a **Room Aggregate root**, not loose registry maps.
- **CampaignMembership / CampaignActorInstance** need to become **first-class
  relationship/authority entities** (currently absent / only draft). Keep them
  OUT of the Character aggregate.
- **Attachment vs Asset** — `actorMediaBinding` should be modeled as an
  **Attachment (relationship)**, distinct from `Asset` (owned entity).

### ❌ 不建议长期保留
- **Treating draft/entry selection as domain state.** `campaignEntryDraftStore` is a
  **UI Model**; it must never become membership/instance.
- **AI output as authority / auto write-back.** Generated Artifacts never own truth.
- **Value objects as entities** (giving DiceExpression/Coordinate/Permission their
  own identity/tables).
- **Per-system parallel character authorities** as the permanent model — one
  Character aggregate with system-tagged data is the target.
- **Memory-only Room/Admission authority** as permanent (echoes P4.1) — fine now,
  wrong long-term.

---

## 9. 自动验证

**未执行自动验证。** 本任务为纯领域模型架构审计，仅新增本文档
(`docs/architecture/DOMAIN_MODEL_BOUNDARY_AUDIT_V1.md`)，未改动任何代码，故无需类型
检查/构建。当前隔离沙箱不可用，无法运行：

```
npx tsc --noEmit
npx tsc -p server/tsconfig.server.json --noEmit
npm run build
npm run server:build
git diff --check
```

请在本地/Codex 环境执行以上命令确认工作区仅新增本 .md 文件。**未进行人工验证，未
声称完成任何浏览器测试。**

---

## 10. 下一步衔接

P4.1 定义了 Repository 边界；本 P4.2 定义了每个 Repository 所加载的 **Aggregate 边界**
与内部 Entity/VO。建议 P4.3 起：先固化 Aggregate 根与其 Repository 接口（Character 先
合并、Room 先聚合），再定义 Snapshot/DTO schema（带 `schemaVersion`），最后接 AI 的
`GeneratedArtifact` 聚合——全程保持"仅 Aggregate 根经 Repository 写、其余皆派生"的不
变量。
