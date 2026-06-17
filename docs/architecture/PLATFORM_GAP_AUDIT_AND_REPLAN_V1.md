# Platform Gap Audit + Replan v1

<!-- AI-LANDMARK: PLATFORM_GAP_AUDIT_AND_REPLAN_V1 -->

Last updated: 2026-06-17
Task: `R0 Platform Architecture Snapshot + Gap Audit` (gap/replan half)
Pairs with: `CURRENT_PLATFORM_ARCHITECTURE_SNAPSHOT_V1.md`

Audit + planning only — no code changed. Compared against the target structure
(the 12-diagram blueprint).

## 1. Headline gaps

The recurring local-optimum problem (订阅区缺管理 · 角色库缺复制删除 · 同人区缺我的作品 ·
主页缺跳转 · 头像菜单缺设置 · 角色缺图片) is **one missing layer, not six bugs**:

1. **No User Profile Space** — object details are isolated in-shell panels. There
   is no `UserProfile`, no profile sections, no "open object in its owner's
   profile" routing. This is the single biggest gap; it unblocks the rest.
2. **No Object Management Action layer** — every library (Actor Vault, Hub,
   subscriptions) lacks a consistent set of manage actions (duplicate/delete/
   share/export/changeVisibility/enable/remove). Confirmed: `ActorVaultLibraryShell`
   has only view/create/enter.
3. **No Package Library model** — "我是否加入了这个包 / 来源 / 启用状态" needs a
   `PackageLibraryEntry` distinct from the manifest. Subscriptions are static mock
   with no detail/unsubscribe/enable/update.
4. **No actor portrait binding** — actors have no `portraitMediaAssetId`; they are
   not graph entities, so they can't appear in Profile/Hub via MediaAsset.
5. **No account/avatar menu** — only a More panel; no account/appearance(dark
   mode)/backup/feedback/logout, and no distinction between top-right account
   avatar and card author avatar.

## 2. Object Management Action Matrix

Status: ✅ implemented · 🟡 partial · 🟦 reserved/contract · ⬜ missing · ⏸ deferred · ✖ not advised.
"Where" = the surfaces an action should appear on.

| Object | create | edit | duplicate | delete | archive/restore | export | share/copyLink | publish/unpublish | favorite | join/remove | enable/disable | update/rollback | addToCampaign | changeVisibility | viewDetail | openInProfile |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Actor** | ✅ | ✅ | ⬜ | ⬜ | ⬜ | 🟡(envelope) | ⬜ | n/a | ⬜ | n/a | n/a | n/a | ⬜ | ⬜ | 🟡(sheet) | ⬜ |
| **Campaign** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 🟦 | ⬜ | ⬜ | ⬜ | n/a | n/a | n/a | n/a | ⬜ | ⬜ | ⬜ |
| **BlockDocument** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 🟦 | ⬜ | ⬜(asFanWork) | ⬜ | n/a | n/a | n/a | ⬜ | 🟦 | ✅(A9) | ⬜ |
| **FanWork** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 🟦 | 🟦 | ⬜ | 🟦 | n/a | n/a | n/a | n/a | 🟦 | ✅ | ⬜ |
| **WorkshopPackage** | ⬜(builder) | ⬜ | ⬜(clone) | ⬜ | ⬜ | 🟦 | 🟦 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 🟦 | ✅ | ⬜ |
| **PackageLibraryEntry** | n/a | n/a | n/a | n/a | ⬜ | n/a | n/a | n/a | n/a | ⬜ | ⬜ | ⬜ | ⬜ | n/a | ⬜ | n/a |
| **MediaAsset** | ⬜(upload⏸) | rename⬜ | n/a | ⬜ | ⬜ | ⏸ | ⬜ | n/a | n/a | n/a | n/a | replace⬜ | n/a | 🟦 | 🟡(A6) | useAs⬜ |
| **Collection** | 🟦(A10) | ⬜ | n/a | ⬜ | n/a | ⏸ | ⬜ | n/a | n/a | n/a | n/a | n/a | n/a | ⬜ | ✅(A10) | ⬜ |
| **SessionLog** | ⬜ | ⬜ | n/a | ⬜ | ⬜ | 🟦 | 🟦 | publicSummary⬜ | n/a | n/a | n/a | n/a | n/a | 🟦(A5) | ⬜ | ⬜ |
| **Map / Handout** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 🟦 | 🟦 | n/a | n/a | n/a | n/a | n/a | ⬜ | 🟦 | ⬜ | ⬜ |
| **UserProfile** | ⬜ | ⬜ | n/a | n/a | n/a | ⏸ | ⬜ | n/a | n/a | n/a | n/a | n/a | n/a | ⬜ | n/a | ✅(self) |

**Recommendation:** define an `ObjectAction` union + `ObjectActionContract` (per
EntityType → supported actions + surface placement) as **A10.6**, so no page
hand-rolls its own action set. Surfaces: list card (low-frequency in a "更多"
menu), detail page (primary actions), Hub (full management), Profile (owner-only
edit affordances hidden from visitors), workspace (play actions only),
Package Library (join/enable/remove/update), advanced settings (changeVisibility/
archive/rollback).

## 3. Data truth-source audit (duplication risk)

| Risk | Status | Verdict |
|---|---|---|
| `FanWork.relationIds` / `relatedWorkshopItemIds` vs EntityGraph | mitigated (A1 deprecated to seed-only) | OK; delete fields at A13 move |
| Workshop `includedEntities`/`dependencies` vs EntityGraph | OK (A4 projects to edges; not a 2nd authority) | OK |
| **Actor in Zustand store vs future Actor Entity** | **open** | dual world; must define Actor→Entity projection (ActorPublicProfile) without mutating system character schema |
| `PackageLibraryEntry` vs Manifest | not built yet | keep separate: manifest = "what it is", entry = "how I own it" |
| MediaAsset inlined into Actor/Document | OK (A6; refs by id) | keep; add `portraitMediaAssetId` as a ref, never base64 |
| Profile copies object data | n/a (no profile) | **design Profile as aggregate views over repos, never a copy** |
| Subscriptions copy Workshop detail | mock-only | Package Library must reference manifest, not copy it |

**Principle to lock:** Profile and Package Library are **views/ownership records**,
never truth sources. EntityGraph + payload stores remain authoritative.

## 4. User Profile Space planning (A10.5)

None of the supporting pieces exist (`UserProfile`, `UserProfileSection`,
`RoutableEntityTarget`, `sectionForEntityType`, `resolveEntityProfileTarget`,
`openEntityInProfile` — confirmed absent). Plan:

- `UserProfile = { userId, handle, displayName, avatarMediaAssetId?, bio?, tags[],
  pinnedEntityIds[], sectionConfig, privacy }` — stores **only** profile metadata,
  section config, pin order, display prefs, privacy. Not object data.
- `UserProfileSection = overview | characters | campaigns | documents | fanWorks |
  workshopPackages | media | collections | favorites`.
- `RoutableEntityTarget = { ownerId, section, entityId }`.
- `sectionForEntityType(type) → UserProfileSection` (actor→characters,
  fanWork→fanWorks, workshopPackage→workshopPackages, blockDocument→documents,
  campaign→campaigns, map/mediaAsset→media, world→campaigns…).
- `resolveEntityProfileTarget(entity)` → resolves `ownerId/authorId` + section.
- `openEntityInProfile(target)` → opens UserProfileSpace at that section + selected
  detail, gated by Projection.

This makes object detail belong to its owner's profile (visitor showcase mode),
forming the click → profile → section → detail closure the blueprint requires.

## 5. Detail / Profile / jump rules

- A card is **preview only**; its main click resolves `resolveEntityProfileTarget`
  → opens UserProfileSpace at the right section + `selectedEntityId` detail.
- Author avatar / nickname on any card → `openEntityInProfile({ownerId, overview})`.
- Related-object cards (currently an inline `LinkableEntityCard` preview) → should
  jump to the related object's owner profile section, not expand in place.
- Three view modes over the same Actor entity: `managementMode` (Vault/Hub),
  `showcaseMode` (Profile, public projection), `playMode` (workspace). Same data,
  different entry + projection + viewmode — never a copy.

## 6. Workshop / Package Library closure (A10.7)

Separate four surfaces (currently conflated/missing):

- **Workshop Browse** = discover packages (have it).
- **Package Library / 已加入** = manage joined/subscribed/imported/created entries →
  needs `PackageLibraryEntry { id, packageId, ownerUserId, sourceType
  (subscribed|imported|created|cloned), status (active|disabled|removed|archived),
  installedVersion, availableVersion?, addedAt, updatedAt, lastCheckedAt?,
  campaignIds[] }`. Actions: viewDetail / unsubscribe-remove / enable-disable /
  addToCampaign / viewSource / update. (Missing entirely today.)
- **My Workshop** = manage my owned packages (owned/drafts/imported/favorites).
- **Profile Workshop Section** = a user's public packages (visitor view).

Diagnostics (DependencyResolver / VersionTracker / MediaIntegrityChecker /
VisibilityRiskChecker / ImportDryRun) run **behind** a `PackageHealthReport`;
cards show only `✅可用 / ⚠️需要处理 / 🔒含私有内容 / ⬆️有未发布修改`. Not a main nav entry.

## 7. Hub / Profile / Workspace relationship

One object, three entries:

| Entry | Mode | Projection | Purpose |
|---|---|---|---|
| Personal Content Hub | managementMode | owner | edit/delete/duplicate/manage |
| User Profile Space | showcaseMode | public/unlisted | visitor browse of public items |
| System Workspace | playMode | campaign/player/gm | use at the table |

Hub already exists (A10). Profile is the missing peer. They must read the same
entities via repos/projection — not duplicate.

## 8. Account / avatar menu planning

- **Top-right account avatar → Account Menu**: 我的主页 (self profile) · 我的内容 (Hub)
  · 账号设置 · 外观设置 (夜间模式/主题/字体密度) · 数据与备份 (A8 envelope export/import)
  · 帮助与反馈 · 问题投诉 · 退出登录.
- **Card author avatar/name → UserProfileSpace(authorId)** (visitor).
- Today: a More panel with Settings + language + reserved + my-content/documents.
  Plan: evolve it into the account menu (mock user until B0 auth); dark mode /
  theme are real client prefs (localStorage), backup uses the A8 envelope.

## 9. Actor portrait / MediaAsset planning (A10.8)

- Add portrait binding as **id references** at the platform Actor-entity layer
  (e.g. `ActorPublicProfile` / an actor→entity adapter), NOT by mutating the
  system character schema — this keeps the rule engines / migrations untouched.
  Fields: `portraitMediaAssetId`, `avatarMediaAssetId?`, `bannerMediaAssetId?`.
- Image goes through MediaAsset (A6): thumbnail/preview/original variants; no
  base64 in character JSON; reused across Vault (management), Profile (showcase),
  play room; Projection controls visitor visibility; Summary/Detail never load
  original.

## 10. Local backend / LAN route

Unchanged from A8.5: GM laptop = private server (apps/web + apps/server +
PostgreSQL `data/postgres` + `data/media` + `data/backups`, LAN access). No cloud/
CDN/OSS/accounts/payment short-term. B0 (A14) = local API + Postgres + media +
backup + LAN + flip composition root to `ApiRepository` (A7 seam) + Service async.

## 11. Unified roadmap (adopted, with rationale)

```
R0   (this)  Architecture snapshot + gap audit
A10.5 User Profile Space + Routable Entity Contract     ← unblocks detail/jump closure
A10.6 Object Management Action Contract                  ← fixes all "library lacks actions"
A10.7 Package Library / 已加入内容库 management closure   ← PackageLibraryEntry + actions
A10.8 Actor Portrait MediaAsset binding                  ← actors gain images, join MediaAsset
A11   FanWork Publish Composer                           ← now has Hub + Profile + actions to land in
A12   Workshop Package Builder + Auto Diagnostics        ← PackageHealthReport behind simple status
A13   Monorepo / Frontend-Backend Boundary migration     ← just before server (A8.5 plan)
A14   B0 Local Backend + PostgreSQL + LAN                 ← ApiRepository swap; Service async
A15   Local Room + Dice + Object Reference                ← multiplayer over the stable stack
```

Rationale: profile first (it defines where every detail/jump lands), then the
cross-cutting action contract (fixes every library at once), then package-library
ownership, then actor images — so the composer/builder (A11/A12) land into an
existing management + profile + action system instead of inventing one each.

## 12. Recommended next step

Execute **A10.5 (User Profile Space + Routable Entity Contract)** next. It is the
keystone gap: it converts isolated in-shell detail panels into owner-scoped,
projection-aware profile sections, and gives every card/author-avatar a real
destination. It is also frontend + contract only (no backend), consistent with the
private-first / architecture-first stance, and it unblocks A10.6–A12.
