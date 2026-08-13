# Package Library / Joined Package Management Contract v1

<!-- AI-LANDMARK: PACKAGE_LIBRARY_CONTRACT_V1 -->

Last updated: 2026-08-14

Task: `A10.8 Package Library / Joined Package Management Contract v1`

This contract defines how a user owns, joins, imports, creates, clones, enables,
disables, updates, removes, or rolls back content packages in their personal
package library. It is contract/types/helper only.

No real subscription, unsubscribe, update, delete, network check, dependency
resolution, Workshop Builder, backend, Campaign UI, multiplayer room, rule
engine, store migration, monorepo, Docker, or PostgreSQL work is introduced.

Current implementation note: the Workshop joined-content surface reads the
repository and shows a truthful empty state. No `PackageLibraryEntry` write or
lifecycle action is implemented, and no sample subscription is presented as a
user-owned entry.

Canonical type/helper file:

```text
src/lib/platform/packageLibrary.ts
```

## 1. Core Boundary

The platform must keep these objects distinct:

```text
WorkshopPackageManifest = 包是什么
PackageLibraryEntry = 用户如何拥有 / 加入 / 启用 / 禁用 / 更新 / 移除这个包
CampaignInstance = 某个 Host 创建出来的实际战役 / 房间
```

Do not treat a WorkshopPackage as a campaign room.

Do not treat a PackageLibraryEntry as the manifest itself.

## 2. PackageLibraryEntry

`PackageLibraryEntry` describes one user's local relationship to one package.

Core fields:

```ts
{
  id: string;
  packageId: WorkshopPackageId;
  ownerUserId: string;
  sourceType: PackageLibrarySourceType;
  status: PackageLibraryStatus;
  installedVersion?: string;
  availableVersion?: string;
  updateState: PackageUpdateState;
  addedAt: string;
  updatedAt?: string;
  lastCheckedAt?: string;
  campaignIds?: string[];
  notes?: string;
}
```

It references the manifest by `packageId`; it does not copy manifest metadata or
payload bodies.

## 3. Source Type

`PackageLibrarySourceType`:

```text
subscribed
imported
created
cloned
bundled
localDraft
```

Meaning:

- `subscribed`: joined from a remote/public Workshop source.
- `imported`: loaded from a local file or private exchange.
- `created`: authored by this user.
- `cloned`: cloned from another package according to clone policy.
- `bundled`: shipped with the app or system package.
- `localDraft`: draft package not yet published/exported.

## 4. Status and Update State

`PackageLibraryStatus`:

```text
active
disabled
removed
archived
needsAttention
```

`PackageUpdateState`:

```text
upToDate
updateAvailable
localOnly
unknown
conflict
missingDependency
```

`status` describes whether the user's library entry is usable locally.

`updateState` describes whether version/dependency attention is needed.

## 5. Package Library Views

Future UI may organize the joined package library as:

```text
已加入内容库
├─ 全部
├─ 已启用
├─ 已禁用
├─ 有更新
├─ 需要处理
├─ 本地导入
├─ 我的创建
└─ 已归档
```

This round does not implement the UI. It only reserves filter names and helper
logic in `packageLibrary.ts`.

## 6. Relationship to ObjectAction

A10.7 defines the common ObjectAction contract.

Package Library uses these actions:

| Action | Applies to | Meaning |
|---|---|---|
| `join` | WorkshopPackage | Create or reference a PackageLibraryEntry from a WorkshopPackage. |
| `enable` | PackageLibraryEntry | Enable a joined package locally / for future campaign use. |
| `disable` | PackageLibraryEntry | Disable a joined package without deleting it. |
| `remove` | PackageLibraryEntry | Remove a local/imported entry from the library. |
| `unsubscribe` | PackageLibraryEntry | Cancel a remote subscription relationship. |
| `update` | PackageLibraryEntry | Update an installed package version. |
| `rollback` | PackageLibraryEntry | Revert an installed package version. |
| `addToCampaign` | PackageLibraryEntry | Enable this joined package for a campaign instance. |
| `removeFromCampaign` | PackageLibraryEntry | Disable this joined package for a campaign instance. |

`enable`, `disable`, `remove`, `unsubscribe`, `update`, and `rollback` do not
mutate `WorkshopPackageManifest` directly.

## 7. Relationship to CampaignInstance

A10.6 defines CampaignInstance as the actual play room / campaign instance.

PackageLibraryEntry may be used by multiple campaigns:

```text
PackageLibraryEntry --enabledIn--> CampaignInstance
CampaignInstance --uses--> PackageLibraryEntry
PackageLibraryEntry --references--> WorkshopPackageManifest
```

The same WorkshopPackage can be:

- joined by multiple users,
- enabled by one user in multiple campaigns,
- used by different campaigns that produce different logs.

Campaign logs belong to CampaignInstance, not WorkshopPackageManifest.

## 8. Dangerous Package Actions

Dangerous Package Library actions:

```text
remove
unsubscribe
disable
rollback
update
```

Future execution must check:

1. Whether the package is used by the current campaign.
2. Whether dependency packages exist.
3. Whether actors / NPCs / maps / handouts are affected.
4. Whether existing session-log replay is affected.
5. Whether a backup or restore point is needed.

This round defines `PACKAGE_LIBRARY_RISK_CHECKS` only. No action executes.

## 9. Non-Goals

This round does not implement:

- Real subscription.
- Real unsubscribe.
- Real update or rollback.
- Real deletion.
- Real network checks.
- Real dependency resolution.
- Real Workshop Builder.
- Backend or auth.
- Campaign UI.
- Multiplayer rooms.
- DND / COC / CP RED rule engines.
- Store migration.
- Monorepo migration.
- Docker / PostgreSQL.

## 10. Future Implementation Notes

Before Package Library becomes a real UI/service:

1. Derive visible actions through `actionsForObjectType('packageLibraryEntry', ...)`.
2. Keep `WorkshopPackageManifest` immutable unless editing the package itself.
3. Store package enablement per user and campaign, not in the manifest.
4. Use EntityGraph for relations:
   - PackageLibraryEntry references WorkshopPackageManifest.
   - CampaignInstance uses PackageLibraryEntry.
5. Run risk checks before dangerous actions.
6. Preserve Navigation & Exit Contract: no in-page "Back Home"; details use
   `← 返回来源`; overlays use `×`.
