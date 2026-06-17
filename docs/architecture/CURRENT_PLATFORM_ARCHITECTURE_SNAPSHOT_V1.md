# Current Platform Architecture Snapshot v1

<!-- AI-LANDMARK: CURRENT_PLATFORM_ARCHITECTURE_SNAPSHOT_V1 -->

Last updated: 2026-06-17
Task: `R0 Platform Architecture Snapshot + Gap Audit` (snapshot half)
Pairs with: `PLATFORM_GAP_AUDIT_AND_REPLAN_V1.md`

Audit only — no code changed. Grounded in the A1–A10 implementation.

## 1. Current architecture overview

The platform has a clean **layered data spine** (A1–A10) under a **single-page
adaptive shell** (`App.tsx`, no router). The three rule engines (DND/COC/CP RED)
are the only fully-functional vertical and remain isolated from the platform layer.

```
UI (App.tsx spaces)
  → PlatformDataService            (viewer-aware, projection-enforcing read funnel — A7)
    → platformRepositories         (composition root — A7)
      → Mock* repositories         (impl — binds seeds)
        → seeds (entityGraph / blockDocument / workshopPackage / media / community / linkable)
```

Authoritative models: **EntityGraph** (relations, A1), **BlockDocument** (A3),
**WorkshopPackageManifest** (A4), **MediaAsset metadata** (A6), **Projection**
(A5), **Export/Import Envelope v2** (A8). Persistence decision: graph-first domain
+ relational physical store (A2); local-server boundary planned (A8.5).

**Key tension:** character data lives in **Zustand stores** (per system,
localStorage), NOT yet in the EntityGraph. The platform layer (graph/docs/packages/
media) is mock-seeded. These two worlds are not yet unified.

## 2. Product space overview

| Space | Status | Evidence |
|---|---|---|
| Home / 首页 | ✅ implemented | `Home.tsx` launchpad (resume/recent/pinned/status); recent=store state, no real continue-campaign |
| System Workspace (DND/COC/CP) | ✅ implemented (real engines) | creators/sheets/runtime/dice/migration/persist; COC/CP rule data partial |
| Actor Vault / 角色库 | 🟡 partial | `ActorVaultLibraryShell` + per-system adapters; **view/create/enter only — no manage actions** |
| Personal Content Hub / 我的内容 | 🟡 shell (A10) | read-only, owner mock viewer; documents/fanWorks/drafts/collections/packages/imports |
| User Profile Space / 用户主页 | ⬜ missing | no `UserProfile` type/component/routing |
| Fan Plaza / 同人广场 | 🟡 UI shell | browse + dedicated detail; **no composer / my-works-in-plaza** |
| Workshop / 创意工坊 | 🟡 UI shell | browse + item detail + subscriptions(mock); **no post-join mgmt / MyWorkshop / builder** |
| Package Library / 已加入内容库 | 🟦 contract/mock | subscriptions = static samples; **no `PackageLibraryEntry`, no manage actions** |
| Campaign Workspace / 战役工作区 | ⬜ missing | campaign exists only as a linkable mock entity; UI is a placeholder |
| Account Menu / 头像菜单 | 🟡 partial | More panel: Settings + language + reserved + my-content/documents; **no avatar/account menu, appearance(dark mode)/backup/feedback/logout, no account** |
| Local Server / 本地服务器 | 🟦 doc only (A8.5) | decision + plan; not implemented |

Legend: ✅ implemented · 🟡 partial · 🟦 contract/mock · ⬜ missing.

## 3. Core objects & data truth sources

| Object | Truth source today | Notes |
|---|---|---|
| Entity (node) | EntityGraph (`entityGraphSeed`) | identity + metadata + payloadRef |
| Relation (edge) | **EntityGraph (single authority)** | A1; `FanWork.relationIds`/`relatedWorkshopItemIds` deprecated to seed-only |
| BlockDocument | `blockDocumentSeed` | A3; refs by id only |
| WorkshopPackageManifest | `workshopPackageSeed` | A4; included/deps project to graph edges |
| MediaAsset metadata | `mediaAsset` seed | A6; binaries not in graph/JSON |
| Projection | derived (A5) | enforced in Service/Permission repo |
| Character (Actor) | **Zustand stores (separate)** | NOT a graph entity yet — dual-world risk |
| Collections / Imports | `MockPersonalContentRepository` (A10) | pointers; no real write |

## 4. Current implemented capabilities

- **Repository/Service boundary is clean**: A7 verified — no component imports a
  seed/mock map; no hand-written relation filtering; projection enforced in the
  Service layer; original media never loaded in Summary/Detail.
- **First UI consumption of the stack**: A9 (BlockDocument reader) + A10 (Personal
  Content Hub) read everything through `platformDataService`, with a mock viewer
  (anonymous/owner) demonstrating Service-layer projection.
- **Export/Import contract**: A8 envelope v2 with per-object schemaVersion,
  dry-run, conflict detection, corrupt-object isolation, visibility-risk warnings.
- **Three real rule engines** untouched and functional.

## 5. Core-principle adherence (quick audit)

| Principle | Status | Note |
|---|---|---|
| Cards → real detail page | 🟡 | Workshop/FanPlaza have dedicated detail **views**, but they are in-shell state, not a profile detail state |
| Detail belongs to a Profile space | ⬜ | details are isolated in-shell; no UserProfileSpace |
| Hub = owner management | ✅ | A10 (read-only) |
| Profile = visitor showcase | ⬜ | missing |
| Workspace = play/tool | ✅ | real engines |
| 3 spaces reuse one object via projection/viewmode | 🟡 | projection exists; but actors aren't graph entities, so reuse is not yet real |
| UI ≠ import seed | ✅ | A7/A9/A10 |
| UI ≠ hand-write relation query | ✅ | A1+ |
| UI ≠ do projection | ✅ | Service enforces |
| UI ≠ load original media | ✅ | A6/A9 thumbnail-only |
| EntityGraph = relation authority | ✅ | A1 |
| Profile = aggregate, not truth | n/a | no profile yet |
| Workshop diagnostics not a main nav | ✅ | not exposed; deferred |

The boundary discipline (principles 7–13) is strong. The product-shape gaps
(principles 1–6) are where the work remains — see the replan document.
