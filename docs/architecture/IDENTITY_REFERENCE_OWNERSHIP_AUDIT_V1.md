# Identity / Reference / Ownership Boundary Audit V1

Status: **architecture audit only.** No runtime / protocol / server / repository /
DB / auth / storage / AI changes. Builds on `REPOSITORY_ARCHITECTURE_AUDIT_V1.md`
(P4.1) and `DOMAIN_MODEL_BOUNDARY_AUDIT_V1.md` (P4.2). Goal: define **one**
long-term identity model that survives local dev → LAN → cloud → Postgres →
Workshop → AI → replay, without vendor lock-in.

Grounding: findings below come from inspecting the current code (`src/lib/platform/**`,
`src/store/**`, `server/**`). No central identity module exists today; ids are
minted ad-hoc per store/service.

---

## 1. Current findings

### 1.1 How ids are minted today (observed)

- **Server room/member:** `roomId = \`room_${randomUUID()}\``,
  `memberId = \`member_${randomUUID()}\`` — crypto UUID with a type prefix
  (`server/services/createRoom.ts`). Good.
- **Room code:** `makeRoomCode()` = 6 chars from `A–Z0–9` via **`Math.random`**
  (explicitly "low-stakes / scaffold"). Human-readable, collision-prone, **not**
  crypto. Flag for cloud.
- **serverId:** literal `'room-server'` (constant, not a real id).
- **WebSocket message id / reconnect token:** `crypto.randomUUID()` fallback in
  `roomSocketClient`; `reconnectTokenId` typed but not enforced.
- **Campaign / Actor / Package:** **natural/local ids** carried on the record
  (`campaign.id`, vault `actorId`, `packageId`) minted inside their stores; actor
  keys are **composite** (`makeActorKey(systemId, actorId)`,
  `makeActorInventoryKey(systemId, actorId)`).
- **Clearance/admission/snapshot:** `admissionId`, `snapshotId`, `bindingId`,
  `ActorSnapshotHash` typed in `characterClearanceTypes.ts` (hash = content hash).
- **Ownership fields (scattered, mostly optional):** `hostUserId?` (campaign),
  `userId?` (room member / join / `cloudBackendAdapters`), `authorId` (community,
  **mock `author-sample`**), `ownerId` (`mediaNodeTypes`). No `Character.ownerId`.

### 1.2 Entity × identifier table

| Entity | Current identifier | Owner field | Human name | Can rename? | Global unique? | Local unique? | Needs persistence? | Ref by Runtime | Ref by Workshop | Ref by AI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Campaign | `campaignId` (natural, local) | `hostUserId?` | title | yes | ⚠ not guaranteed | yes | yes | yes | via package link | yes (chronicle) |
| Character (vault) | `actorId` (+ `systemId` composite) | **none** | name | yes | ⚠ no | yes (per system) | yes | yes (projection) | maybe | yes (story) |
| ActorSnapshot | `snapshotId` + `ActorSnapshotHash` | (derived from actor) | — | no | should be | yes | yes (as snapshot) | yes | no | read-only |
| Room | `roomId` (`room_<uuid>`) | host = member role; `userId?` | roomCode | no | ✅ yes | yes | ⚠ memory-only | yes | no | no |
| Room Member | `memberId` (`member_<uuid>`) | `userId?` | displayName | no | ✅ yes | yes | ⚠ memory-only | yes | no | no |
| Admission / Clearance | `admissionId` | `memberId`/`campaignId` | — | no | should be | yes | ⚠ memory-only | yes | no | advisory |
| ActorBinding | `bindingId` | `memberId` | actorRef.displayName | no | should be | yes | ⚠ memory-only | yes | no | no |
| RuntimeLog event | `eventId` (+ `seq`) | `authorMemberId?` | — | no | per-room yes | yes | ⚠ memory (server) / local | yes | no | yes (source) |
| RuntimeSession | (implicit; `sessionId?`) | campaign/room owner | — | no | should be | yes | future | yes | no | yes |
| Room code | `roomCode` (6-char) | — | itself | no | ❌ collision-prone | ⚠ | ⚠ | yes (join) | no | no |
| Package | `packageId` | `authorId` (mock) | title | yes | should be | yes | at import | via campaign | yes | maybe |
| Asset / media | `mediaId`/`assetId` | `ownerId` | filename | yes | should be | yes | yes | yes | yes | maybe |
| User | (`userId` seed only) | self | profile name | yes | must be | — | future | via authorship | yes | yes |
| AI artifact | (none yet) | generator/user | — | yes | should be | yes | future | as artifact | no | is-the-output |

Legend: ✅ good today · ⚠ works but risky for cloud · ❌ needs change.

---

## 2. Identity taxonomy (classify every identifier)

| Class | Meaning | Current members |
| --- | --- | --- |
| **Global ID** | Globally unique, opaque, system-generated (UUID). | `roomId`, `memberId`, WS messageId; **should become** the canonical id for Campaign/Character/Package/Asset/User/Artifact. |
| **Campaign-local ID** | Unique only within a campaign. | `CampaignActorInstance` id (future), entry-draft selection. |
| **Room-local ID** | Unique only within a room. | `memberId` scope, `bindingId`, `admissionId`, RuntimeLog `seq`. |
| **Runtime-local ID** | Unique within a live session; disposable. | RuntimeLog `eventId` (per session), combat turn ids, token ids. |
| **Human-readable Code** | Short, shareable, low-stakes, NOT a key. | `roomCode`, `inviteCode`. |
| **Display Name** | Human label; renameable; never a key. | campaign title, character name, member displayName. |
| **Slug** | URL-safe derived-from-name; unique per owner/namespace. | none yet (future: package/user/marketplace URLs). |
| **Hash** | Content-addressed integrity value. | `ActorSnapshotHash`. |
| **Temporary Session ID** | Connection/session scoped; not persisted. | WS messageId, `reconnectTokenId`. |
| **Draft ID** | Pre-commit UI selection; never a domain key. | `campaignEntryDraftStore` selection. |
| **Snapshot ID** | Identity of an immutable snapshot. | `snapshotId`, export envelope ids. |
| **Artifact ID** | Identity of a generated (AI) output. | future. |
| **Reference ID** | A field that points at another aggregate by id. | `campaignId`, `packageId`, `actorId` refs, `ownerId`. |
| **Object Storage Key** | Path/key for binary bytes. | future (Asset bytes). |
| **Version ID** | Immutable published version of a package. | future. |
| **Subscription ID** | User↔Package relationship id. | future. |

Rule: **Global IDs are the only cross-boundary keys.** Codes/names/slugs are for
humans and URLs, never foreign keys.

---

## 3. Reference taxonomy (what an object may hold about another)

| Reference kind | When to use | Examples (target) |
| --- | --- | --- |
| **ID only** | Default for any cross-aggregate link. | Campaign→ownerId(User), Room→campaignId, Binding→actorId, Asset→ownerId. |
| **Snapshot** | When you need the state *as it was* (provenance/immutability). | Room entry→`ActorSnapshot`, campaign import→export envelope. |
| **Projection** | Read-only view for display in another context. | Runtime→`RuntimeCharacterSummary`, lobby→roster. |
| **DTO** | Crossing a wire boundary. | Room protocol, RuntimeLog deltas. |
| **Runtime cache** | Per-client live derived state. | adapter output in a shell. |
| **Value object** | Small immutable inline value. | DiceExpression, Coordinate, Permission. |
| **Never a direct object graph** | Never embed another aggregate's mutable object. | Campaign must NOT embed the live Character object; Room must NOT embed the vault Character. |

Reaffirmation of the "room binding vs local character" split: Room holds an
**actorRef (ID + snapshot)**, never the live Character aggregate — which is why the
current design (lightweight `actorRef` + client-local resolve) is correct.

---

## 4. Ownership matrix (long-term)

| Object | Owner | Notes |
| --- | --- | --- |
| Campaign | **User** (owner) | today `hostUserId?`; make required `ownerId`. |
| Character (vault) | **User** | today **no owner field** — must add `ownerId`. |
| ActorSnapshot | derived; belongs to the Character's owner | immutable; owned transitively. |
| Runtime (local session) | the **local User** (host) | authority = local until promoted. |
| Runtime (room session) | the **Room** (whose owner is the host User) | server authority. |
| Room | **Host User** | host is a member role today; add `hostId = userId`. |
| Room Member | the **User** it represents | `userId?` → required when Auth exists. |
| Assets | **Uploader User** | `ownerId` exists on media node. |
| Packages / Workshop uploads | **Author/Publisher User** | `authorId` mock → real User. |
| Runtime Logs | the **session's owner** (campaign/room owner); authors reference members | append-only; not user-editable. |
| AI artifacts | the **requesting User** (+ campaign scope) | tagged `generatedBy`, non-authoritative. |
| Campaign Chronicle | **User** (campaign owner), draft editable by owner | derived from RuntimeLog; not authoritative over Character. |

Principle: **every persisted aggregate root gets exactly one required `ownerId`
(a User Global ID)**; relationships (membership, subscription, binding) are their
own rows referencing both sides by id.

---

## 5. Lifecycle matrix

| Lifecycle | Campaign | Character | Room | Package | Asset | AI Artifact |
| --- | --- | --- | --- | --- | --- | --- |
| draft | entry-draft (UI) | in-editor | — | unpublished | pre-upload | prompt-context |
| created | ✅ store | ✅ store | ✅ (createRoom) | ✅ | ✅ | ✅ |
| published | — | — | opened | ✅ version | — | shared |
| imported | ✅ safe-append | ✅ vault import | — | ✅ | ✅ | — |
| forked | future | future | — | future (new id, `forkedFrom`) | copy | — |
| copied | — | vault clone (new `actorId`) | — | — | dedupe by hash | — |
| archived | ✅ lifecycle status | ✅ | closed | ✅ | ✅ | ✅ |
| deleted | ✅ trashed | ✅ | dropped (memory) | ✅ | ✅ | ✅ |
| recovered | ✅ from trash | ✅ | — | ✅ | ✅ | — |
| merged | import merge | — | — | — | — | — |
| snapshot | ✅ export | ✅ export + hash | entry snapshot | version = snapshot | content hash | output = snapshot of a moment |
| runtime instance | RuntimeSession | RuntimeActor (projection) | RoomRuntime | — | — | — |
| promotion | local→room (future) | — | local→cloud (future) | — | — | — |

Rules: **fork/copy always mints a NEW Global ID** and records `forkedFrom`/`copiedFrom`
provenance; **snapshot never mutates the source**; **promotion preserves ids** and
only adds a sync/authority layer (M69 contract).

---

## 6. Runtime identity relationships (no implementation)

```
User ──owns──> Character (vault; authoritative sheet)
Character ──snapshot──> ActorSnapshot (immutable + hash)      // provenance/clearance
Room Member ──represents──> User
Room Member ──binds──> actorRef (ID + ActorSnapshot)          // NOT the live Character
ActorBinding + Admission ──clear──> (Member may enter as its actor)
RuntimeActor = a Projection/Runtime-cache of (Character snapshot) inside a session   // never authority
CampaignActorInstance (future) = campaign-scoped AUTHORITY of growth/HP/inventory    // distinct from vault Character
Roles: Host / Player / Spectator are Member roles (VO), not separate identities.
```

- **Character** = authority (owned by User).
- **ActorSnapshot** = immutable snapshot of Character at bind time.
- **RuntimeActor** = projection/cache during a session; disposable.
- **CampaignActorInstance** = future *second* authority for in-campaign evolution;
  never overwrites the vault Character automatically (M48).
- **Member/Player/Host/Spectator** = the same User under a room role (VO), not new
  identities.

---

## 7. Workshop identity rules

- **Package** = Global ID, owned by `authorId` (User). **Publisher** may differ
  from Author (org publishing) — model as `authorId` + optional `publisherId`.
- **Version** = immutable; identity = `packageId@versionId` (or semver as a
  human-facing VO + an immutable `versionId`). Content is snapshot-per-version.
- **Dependency** = a VO edge `packageId@versionRange`; never an entity id.
- **Fork** = new `packageId` with `forkedFrom = sourcePackageId@versionId`.
- **Subscription** = relationship entity `{ subscriptionId, userId, packageId }`.
- **Asset (content)** referenced by Package = `assetId` (Asset aggregate), bytes in
  object storage.

---

## 8. AI identity rules

- Generated Chronicle / Story / Session Summary / Memory / Prompt Context / Rule
  Explanation each get an **Artifact ID** in a `GeneratedArtifact` aggregate with
  `sourceRefs[]` (the authoritative ids they were derived from), `generatedBy`,
  `generatedAt`, `model`, `reviewed?`.
- **None of these may ever become an authoritative ID** for Campaign / Character /
  Room / Package. They are outputs, not sources of truth, and cannot be used as a
  foreign key that a core aggregate depends on for correctness.
- Any AI-suggested mutation flows through the same rules+human confirmation path as
  a manual edit (deterministic hard-check → AI advisory → Owner/Host confirm).

---

## 9. UID principles — where to use what

| Use | Mechanism | Rationale |
| --- | --- | --- |
| Any persisted aggregate root id | **system-generated UUID** (crypto), type-prefixed (`campaign_`, `char_`, `room_`, `pkg_`, `asset_`, `user_`, `artifact_`) | opaque, collision-free, cloud/Postgres-safe, no lock-in (UUIDv4/v7 both fine). |
| Shareable join code | **human code** (short) — but **crypto RNG + collision check** | current `Math.random` roomCode is not safe at cloud scale. |
| URL / marketplace handle | **slug** derived from name, unique per namespace | human-friendly URLs; separate from the id. |
| Human label | **display name** | renameable; never a key. |
| Integrity / dedupe / clearance | **hash** (content) | `ActorSnapshotHash`; asset dedupe. |
| Per-system character key | **composite (systemId, actorId)** locally; but a single **Global `characterId`** long-term | composite is fine as a local index; cloud needs one global id. |
| Version | **immutable versionId** + semver VO | published versions are snapshots. |
| Temp/session | **temporary id** (uuid), not persisted | WS messageId, reconnect token. |
| Natural key | avoid as primary key | only as a unique constraint (e.g. slug per owner), never the FK. |

Anti-lock-in: ids are **opaque strings**; do not assume Postgres `serial`/int, do
not embed provider-specific ids, keep UUID generation client-or-server agnostic.

---

## 10. Future cloud compatibility

- Every id is an opaque string prefixed by type → portable across localJson /
  sqlite / postgres / cloud DB (matches `storageAdapterBoundaryTypes`).
- Ownership is always a **User Global ID FK**, so Auth simply supplies real user
  ids to already-present `ownerId`/`authorId`/`hostId` slots.
- Codes/slugs are derived/human and never FKs → renaming or re-hosting never breaks
  references.
- Snapshots carry `schemaVersion` → cross-version import stays safe.

---

## 11. Migration recommendations

1. **Add a single canonical `id` (Global UUID) + required `ownerId` to every
   persisted aggregate** (Campaign, Character, Package, Asset, Room, Artifact).
   Character currently has no owner — highest priority.
2. **Introduce a tiny id/minting utility contract** (type-prefixed UUID) so ids stop
   being minted ad-hoc per store. (Contract only in P4.3; implementation later.)
3. **Upgrade `roomCode` generation to crypto RNG + collision check** before cloud.
4. **Replace mock `author-sample`** with real `authorId` once `UserRepository`
   exists.
5. **Keep composite `(systemId, actorId)` as a local index**, but plan a global
   `characterId` for cloud/cross-system references.
6. **Model membership / binding / subscription as first-class relationship rows**
   (both-sides id FKs), not embedded fields.

---

## 12. Verdicts — keep / refactor / not recommended

### ✅ 建议保留
- **Type-prefixed crypto UUID for room/member** (`room_`/`member_`) — extend this
  pattern to all aggregates.
- **`ActorSnapshotHash` (content hash)** for clearance/provenance.
- **actorRef (ID + snapshot) instead of embedding the live Character** — correct
  reference discipline.
- **Room code / invite code as human codes, not keys.**
- **Composite `(systemId, actorId)` as a local index.**
- **Snapshot/import-export envelopes with versioning.**

### ⚠ 建议重构（P4，非现在）
- **No `ownerId` on Character** (and only optional owners elsewhere) → add required
  ownership uniformly.
- **Ad-hoc id minting per store** → one minting contract (type-prefixed UUID).
- **`roomCode` via `Math.random`** → crypto + collision check for cloud.
- **Scattered `hostUserId?`/`userId?`/`authorId`/`ownerId`** → converge on User
  Global ID FKs.
- **Membership/binding/subscription as embedded/optional** → first-class rows.

### ❌ 不建议长期保留
- **Human codes/names/slugs as foreign keys.**
- **`Math.random` ids/codes** anywhere authority depends on uniqueness.
- **AI artifact ids as authoritative keys** for core aggregates.
- **Draft/entry selection promoted to a domain id.**
- **Provider-specific / integer surrogate keys leaking into the domain** (lock-in).
- **Embedding another aggregate's mutable object graph** by value.

---

## 13. Roadmap after P4.3

- **P4.4 Event / RuntimeLog / Replay Boundary** — `eventId`/`seq` ordering,
  append-only guarantees, replay from `entry snapshot + ordered events`.
- **P4.5 Persistence & Transaction Boundary** — aggregate-atomic writes, adapter
  transactions over the id/ownership model defined here.
- **P4.6 API Contract Boundary** — DTOs keyed by Global IDs; codes/slugs in URLs
  only.
- **P4.7 Realtime / Sync Boundary** — member/session temp ids vs persisted ids.
- **P4.8 AI Gateway Boundary** — `GeneratedArtifact` ids + `sourceRefs`, never
  authoritative.

Invariant to carry through all of P4: **Global UUID = the only cross-boundary key;
one required `ownerId` per aggregate; codes/names/slugs never become foreign keys;
AI ids are never authoritative.**

---

## 14. 自动验证

**未执行自动验证。** 本任务为纯身份/引用/归属架构审计，仅新增本文档
(`docs/architecture/IDENTITY_REFERENCE_OWNERSHIP_AUDIT_V1.md`)，未改动任何代码，故无需
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
