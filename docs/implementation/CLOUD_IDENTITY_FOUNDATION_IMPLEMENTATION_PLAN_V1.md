# Cloud Identity Foundation — Implementation Plan V1

Status: **planning handbook only.** No code / protocol / repository / runtime /
auth / DB / API changes. Phase 5 (implementation planning) on top of the completed
P4 architecture. **Evolves the existing system; invents nothing new.** Every
conclusion is grounded in the current repository.

Grounding anchors (existing, already-present seeds):
- `src/lib/platform/userProfile.ts` — `UserProfile` (`userId`, `handle`,
  `displayName`, avatar/banner MediaAssetId, `visibility`, `pinned`,
  `sectionVisibility`) + the UserProfileSpace / PersonalContentHub / SystemWorkspace
  projection model.
- `src/lib/platform/cloudBackendAdapters.ts` — `AuthIdentity`
  (`userId`, `providerKind: custom|external|unknown`, `providerUserId?`, `email?`),
  `PlatformPermissionRole` (`owner|host|coHost|player|spectator|guest`),
  `PlatformPermissionContext` (`userId`, `role`, `campaignId?`, `roomId?`,
  `actorId?`, `runtimeSessionId?`), `ObjectStorageRef`. Vendor-neutral (Supabase /
  Neon / R2 / S3 / Clerk / Redis / NATS = behind adapters).
- `src/lib/architecture/entityGraph.ts` — `EntityNode { type, visibility,
  ownerId?, ... }` + `EntityRelation` — a unified graph where **every node already
  has an optional `ownerId`**.
- `src/lib/platform/roomTypes.ts` — `RoomMemberIdentity.userId?`,
  `RoomMemberPermissionSummary` (flat capability flags), host as a member role.
- `campaignFlow.ts` `hostUserId?`, `communityTypes.authorId` (mock `author-sample`),
  `mediaNodeTypes.ownerId`, `characterClearanceTypes` (admission/binding).
- Storage/API seams: `storageAdapterBoundaryTypes`, P4.5/P4.6 docs.

Reference architecture (do NOT redefine): P4.1 Repository, P4.2 Domain, P4.3
Identity, P4.4 Event, P4.5 Persistence, P4.6 API, P4.7 App Service, P4.8 Dependency.

---

## Part 1 — Current Identity Audit

- **Identity sources today:** none authoritative. `userId` appears as an **optional**
  field in `AuthIdentity`, `RoomMemberIdentity.userId?`, `PlatformPermissionContext`,
  `campaignFlow.hostUserId?`, `UserProfile.userId`; `entityGraph.EntityNode.ownerId?`
  is optional; `communityTypes.authorId` is a **mock** (`author-sample`).
- **Current ownership:** implicit / device-local. Local stores (Campaign, Character,
  Actor Vault) are owned by "whoever holds this browser" — no user binding.
- **Temporary ownership:** room `memberId` (`member_<uuid>`) is a per-session
  identity that *represents* a user but is not yet linked to one.
- **Missing ownership:** **Character (vault) has no owner field at all** (P4.3
  finding); Campaign/Room owners are optional; RuntimeLog authorship references
  `memberId`, not `userId`.
- **Mock identity:** workshop `authorId = 'author-sample'`.
- **Login assumptions:** none — the app is **anonymous, local-first**; no auth, no
  token, no session concept beyond WS `reconnectTokenId` (typed, unused).
- **Anonymous assumptions:** everything works fully offline with no account; this is
  a **feature to preserve**, not a bug.
- **Server assumptions:** Room Server treats members by `memberId` + optional
  `userId`; it does **not** authenticate; `serverId` is a constant.
- **Local assumptions:** zustand + localStorage is the authority; identity is the
  device.

**Conclusion:** the identity *contracts* exist (`AuthIdentity`, `ownerId`,
`PlatformPermissionRole`) but are optional/unbound. Cloud Identity = **make these
required and bind them to a real User**, without breaking anonymous local play.

---

## Part 2 — Ownership Matrix

| Aggregate | Current owner | Future owner | Current id | Future id | Authority | Migration complexity | Compatibility risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Campaign | device (local) / `hostUserId?` | **User** (required `ownerId`) | `campaignId` (natural) | Global UUID + `ownerId` FK | local store → cloud | Medium | Low (add field, default to local user) |
| Character (vault) | device (**no owner field**) | **User** | `(systemId, actorId)` composite | Global `characterId` + `ownerId` | local store | **High** (no owner today; per-system) | Medium |
| Room | Host member role / `userId?` | **Host User** (`hostId`) | `roomId` (`room_<uuid>`) ✅ | same + `hostId` FK | server (memory) | Low | Low |
| Room Member | `memberId` + `userId?` | the **User** it represents | `member_<uuid>` ✅ | + required `userId` | server | Low | Low |
| Runtime (session) | device / room | **owner of campaign/room** | `sessionId?` | `runtimeSessionId` + owner | local / server | Medium | Low |
| Package / Workshop | mock `authorId` | **Author/Publisher User** | `packageId` | + real `authorId` | local/mock | Medium | Low (replace mock) |
| Asset / Media | `ownerId` (media node) | **Uploader User** | `mediaId`/`assetId` | + `ownerId` (already present) | local / URL | Low | Low |
| User | none | **self** | `UserProfile.userId` | `userId` (canonical) | none → cloud | High (new authority) | N/A |

Legend: complexity = effort to add ownership; compatibility risk = chance of breaking
current anonymous/local flows.

---

## Part 3 — Cloud User Aggregate (planning only)

Evolve `UserProfile` + `AuthIdentity` into one **User aggregate** (per P4.2/P4.3):

- **User (root):** `userId` (Global UUID, canonical identity). Owns nothing inline;
  everything else references it by FK.
- **Identity (entity/VO):** `AuthIdentity` mapping — `providerKind`, `providerUserId`,
  `email?` — one User may have several identities (local device, external provider).
- **Profile (entity):** the existing `UserProfile` (handle, displayName, avatar/banner
  asset refs, bio, tags, visibility, `sectionVisibility`, `pinned`) — a **projection
  view** of owned content, already designed as "aggregate view, never object data".
- **Membership (relationship entity):** `{ userId, campaignId, role }` — Campaign ↔
  User; distinct from Room Member (session) and from the vault.
- **Permission (VO):** derived capability set from role + ownership (Part 5); not a
  stored entity by itself.
- **Ownership (FK):** `ownerId` on each aggregate (evolve `EntityNode.ownerId?` →
  required) points at `userId`.
- **Relationships:** `entityGraph.EntityRelation` already models user↔content edges
  (authored/owns/subscribes) — reuse it, don't build a parallel graph.

**Never implement here** — this is the shape the future `UserRepository` will load.

---

## Part 4 — Authentication Planning (no implementation)

Layered, evolve `AuthIdentity.providerKind` (`custom|external`):

| Tier | Meaning | Plan |
| --- | --- | --- |
| **Anonymous User** | today's local-first user | a **local device userId** minted on first run; owns local data; never blocks play. |
| **Guest User** | joined a room without an account | ephemeral `userId` scoped to the session; upgradeable. |
| **Registered User** | has credentials | `AuthIdentity(providerKind:'custom')`; local data claimed by this user on sign-in. |
| **Access Token** | short-lived API auth | planned; never in this milestone; opaque, behind the adapter. |
| **Refresh Token** | renews access | planned; rotation + revocation lists. |
| **Session** | logical login | maps a token set to a `userId`. |
| **Device Session** | per-device login | `deviceId` + session; enables multi-device. |
| **Remember Login** | persistent session | opt-in durable refresh token. |
| **Multi-device** | same User, many devices | User aggregate + device sessions; content owned by `userId`, not device. |
| **Future OAuth / SSO / Passkey** | external providers | `providerKind:'external'` + `providerUserId`; **behind the auth adapter** — no vendor in the domain. |

Golden rules: **anonymous/local play never requires auth**; auth only *claims*
ownership of already-local data; tokens/providers live **only behind adapters**
(vendor-neutral, per `cloudBackendAdapters` doc).

---

## Part 5 — Permission Model (planning only)

Evolve the existing `PlatformPermissionRole` (`owner|host|coHost|player|spectator|
guest`) + `PlatformPermissionContext` + `RoomMemberPermissionSummary`.

Permission = **f(ownership, membership, role, scope)** — a *derived value object*,
never a stored ACL blob. Scopes:

| Scope | Roles / capabilities |
| --- | --- |
| **Platform** | administrator, moderator (support/abuse) — a small platform-role set, separate from content roles. |
| **Campaign** | owner (full), coHost (manage), player (participate), spectator (read). Membership entity carries the role. |
| **Room** | host (authority), coHost, player, spectator, guest — evolve `RoomMemberPermissionSummary` flags into a role→capability projection. |
| **Runtime** | derived from Room/Campaign role (who may append which events, per P4.4 authority). |
| **Character** | owner (edit), viewer (runtime read summary) — vault owner vs runtime projection (P4.2). |
| **Package / Workshop** | author, editor (co-maintainer), publisher (org), subscriber (read). |
| **Asset / Media** | owner (manage), viewer (referenced). |
| **Administration / Moderation** | platform admins act on abuse; never silently own user content. |

Determination rules:
- **Ownership** always wins for its own aggregate (owner can do anything the rules
  allow).
- **Membership** grants scoped roles (campaign/room).
- **Host/Player/Spectator** are room roles (VO), same User under different scope
  (reaffirms P4.3).
- **Author/Editor/Publisher** are workshop roles.
- **Administrator** is a platform role, audited, minimal, never an implicit owner.

**Never implement RBAC/policies here** — capabilities are *computed* from role +
ownership at the service boundary (P4.7), not stored per object.

---

## Part 6 — Identity Migration

- **Offline / Local-first (preserve):** first run mints a **local anonymous
  `userId`**; all existing local Campaign/Character/Vault/Package data is stamped
  with it retroactively (default owner = local user). No behavior change offline.
- **Cloud-first:** on first sign-in, the local user is **linked/claimed** by the
  registered `userId`; local data ownership is rewritten from local-anon → real user.
- **Conflict (same content on two devices/users):** resolve by **owner-scoped
  optimistic concurrency + import preview** (P4.5); never last-write-wins. Duplicate
  ownership → prompt merge, keep provenance (`forkedFrom`/`copiedFrom`, P4.3).
- **Duplicate ownership:** two anon users claiming the same imported object → keep
  both as distinct owned copies (new ids), record source.
- **Imported data:** import envelopes already carry provenance; on cloud, importer
  becomes `ownerId`; original author retained as metadata.
- **Workshop packages:** replace mock `authorId` with the claiming user; published
  versions stay immutable.
- **Character ownership:** add `ownerId` = local-anon → real user on claim (highest
  effort, no owner today).
- **Campaign ownership:** `hostUserId?` → required `ownerId` on claim.
- **Future multi-device:** once User owns content, all devices of the same user see
  it via cloud sync (P4.7); device is no longer the identity.

Migration invariant: **adding ownership is additive** (default to the local anon
user), so no existing local flow breaks; claiming is a one-time re-stamp.

---

## Part 7 — Implementation Roadmap

### Phase 1 — Local anonymous identity (foundation)
- **Goals:** mint a stable local `userId`; add `ownerId` (defaulting to it) to every
  aggregate; replace mock `authorId`.
- **Dependencies:** P4.3 identity contract; `entityGraph.ownerId`, `AuthIdentity`.
- **Migration:** back-stamp local data with the anon userId (additive).
- **Risks:** touching every store's schema (`schemaVersion` bump).
- **Rollback:** ownership is additive/optional-compatible; ignore the field to revert.

### Phase 2 — User aggregate + Profile (no auth yet)
- **Goals:** formalize `UserRepository` (User + Identity + Profile) over the local
  adapter; wire `UserProfile` to owned content via `entityGraph`.
- **Dependencies:** Phase 1; P4.1/P4.5 repository+adapter.
- **Migration:** derive a Profile from the anon user.
- **Risks:** none behavioral (read model).
- **Rollback:** drop the repository; profiles are derived.

### Phase 3 — Authentication + claim flow (cloud)
- **Goals:** implement auth **behind the adapter** (custom first); sign-in claims
  local data; device sessions; multi-device via cloud.
- **Dependencies:** Phase 2; cloud persistence adapter (P4.5); API versioning (P4.6).
- **Migration:** local-anon → registered `userId` re-stamp; conflict via import
  preview.
- **Risks:** security (tokens), data-claim correctness, offline↔online conflict.
- **Rollback:** keep anonymous mode fully functional; auth is additive; disable the
  provider adapter to revert to local-only.

### Phase 4 — Permissions + membership + external providers
- **Goals:** role→capability computation at the service boundary; Campaign/Room
  membership entities; OAuth/SSO/Passkey via `providerKind:'external'`.
- **Dependencies:** Phase 3; P4.7 app-service layer.
- **Migration:** map existing room roles + `hostUserId` to memberships.
- **Risks:** permission regressions; provider lock-in if not kept behind the adapter.
- **Rollback:** capabilities are derived; fall back to owner-only + room-role flags.

---

## Part 8 — Risk Analysis (planning)

- **Security:** tokens/secrets only behind adapters; never in the domain/frontend
  bundle; opaque ids (P4.3) avoid enumeration.
- **Ownership:** adding required `ownerId` risks orphaning legacy records → mitigate
  with the additive back-stamp default.
- **Data migration:** per-store `schemaVersion` + read-time upcast (P4.5); import
  preview for conflicts; never rewrite history.
- **Offline:** anonymous local play must always work with zero network → auth is
  strictly a claim/sync layer.
- **Conflict:** append-merge + optimistic concurrency, not last-write-wins (P4.5).
- **Cloud:** server state must persist (currently memory-only) before identity is
  cloud-authoritative.
- **Future scaling:** memberships/permissions as rows (not embedded) scale; capability
  computation is stateless.
- **Vendor lock-in:** Supabase/Clerk/S3/etc. are adapter choices only
  (`cloudBackendAdapters` already states this); domain stays vendor-neutral.
- **Privacy / GDPR-style:** `UserProfile.visibility`/`sectionVisibility` already model
  per-section privacy; plan for export (envelopes exist) + delete (tombstone +
  ownership transfer/anonymize); minimize stored PII (`email?` optional).

---

## Part 9 — Implementation Readiness Review

- **Already ready (✅ reuse):** `AuthIdentity`, `PlatformPermissionRole/Context`,
  `entityGraph.EntityNode.ownerId`, `UserProfile` + section visibility,
  `RoomMemberPermissionSummary`, `ObjectStorageRef`, `storageAdapterBoundaryTypes`,
  import/export envelopes, `room_/member_` UUIDs. The contracts are largely done.
- **Requires refactoring (⚠):** add required `ownerId` everywhere (esp. Character);
  replace mock `authorId`; make `userId` required on members/campaigns; central id
  minting; persist server state; frontend app-service layer to run claim/link.
- **Should remain (keep):** anonymous local-first mode; device works with no account;
  vendor-neutral adapters; profile-as-projection.
- **Should disappear (❌):** mock `author-sample`; device-as-identity assumption once
  cloud is on; optional/implicit ownership as the permanent model.
- **Should NEVER be implemented:** auth/tokens/providers/DB SDKs inside the domain;
  storing computed permissions as per-object ACL blobs; blocking offline play behind
  login; AI or any service bypassing ownership/permission to write authority.

---

## Final Report

1. **Executive Summary:** Cloud Identity is a **completion, not a redesign** — the
   contracts (`AuthIdentity`, `ownerId`, `PlatformPermissionRole`, `UserProfile`,
   `entityGraph`) already exist as optional/mock seeds. The plan makes them required
   and binds them to a real User across four additive phases, preserving anonymous
   local-first play throughout.
2. **Grounding Findings:** identity fields are present but optional/unbound;
   Character has no owner; workshop author is mock; `entityGraph` already carries
   `ownerId` on every node; cloud/permission/auth/object-storage seams exist and are
   vendor-neutral by design.
3. **Files Created:** `docs/implementation/CLOUD_IDENTITY_FOUNDATION_IMPLEMENTATION_PLAN_V1.md`.
4. **Key Decisions:** local anonymous userId first → User aggregate + profile → auth
   behind adapters with a claim flow → permissions/membership/external providers;
   ownership additive; permissions derived not stored; vendor stays behind adapters;
   offline never requires auth.
5. **Migration Roadmap:** Phase 1 local-anon ownership back-stamp → Phase 2 User
   aggregate/profile → Phase 3 auth + claim/device sessions → Phase 4
   permissions/membership/OAuth-SSO-Passkey; each with rollback = "ownership/auth is
   additive; anonymous mode always intact".
6. **Long-term Recommendations:** finish `ownerId` (Character first) + id minting +
   server persistence before cloud auth is authoritative; keep the User aggregate as
   the single identity authority; keep all providers behind adapters; model privacy/
   export/delete from day one.
7. **Verification:** **未执行自动验证** — planning doc only; sandbox unavailable.
   Run locally: `npx tsc --noEmit` / `tsc -p server/tsconfig.server.json --noEmit` /
   `npm run build` / `npm run server:build` / `git diff --check` to confirm the tree
   only adds this .md. **No manual verification, no browser test claimed.**

**No code changed. No runtime changed. No protocol changed. No build impact. No git
add. No commit.**
