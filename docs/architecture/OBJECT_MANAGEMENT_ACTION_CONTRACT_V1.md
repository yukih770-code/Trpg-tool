# Object Management Action Contract v1

<!-- AI-LANDMARK: OBJECT_MANAGEMENT_ACTION_CONTRACT_V1 -->

Last updated: 2026-06-18

Task: `A10.7 Object Management Action Contract v1`

This contract defines platform-wide object management action availability for
actors, campaigns, documents, fan works, workshop packages, joined packages,
media assets, collections, session logs, maps, handouts, and user profiles.

This round is contract/helper only. It does not implement real delete,
duplicate, share, publish, unsubscribe, remove, enable, disable, update,
rollback, addToCampaign, changeVisibility, backend, auth, store writes, UI
wiring, rule runtime, campaign creation, multiplayer, or Workshop Builder.

Canonical type/helper file:

```text
src/lib/platform/objectActions.ts
```

## 1. Object Action vs Campaign Entry Action

A10.6 established that character and campaign workspaces are parallel branches,
campaigns are room instances, and entering a campaign requires explicit identity
confirmation.

Therefore A10.7 separates:

- **Object Management Action** — actions on an object or object relationship.
- **Campaign Entry Action** — actions in a campaign detail / entry-prep flow.

Object Management examples:

```text
viewDetail, openInProfile, create, edit, duplicate, archive, restore, delete,
import, export, share, copyLink, publish, unpublish, favorite, unfavorite, join,
unsubscribe, remove, enable, disable, update, rollback, addToCampaign,
removeFromCampaign, changeVisibility
```

Campaign Entry examples:

```text
selectActorForCampaign, createActorForCampaign, selectEntryRole,
enterAsPlayerCharacter, enterAsHost, enterCampaign
```

`enterAsHost`, `enterAsPlayerCharacter`, and `enterCampaign` are not ordinary
`ObjectAction` values. They belong to the campaign entry flow and align with
`CampaignEntryContext` in `campaignFlow.ts`.

`addToCampaign` / `removeFromCampaign` are object-management actions for adding
or removing an object as a campaign resource. They do not confirm campaign entry
identity.

## 2. Action State Model

`ObjectActionState`:

```text
enabled
disabled
hidden
comingSoon
requiresOwner
requiresBackend
dangerous
```

`ObjectActionAvailability`:

```ts
{
  action: ObjectAction;
  state: ObjectActionState;
  label: string;
  reason?: string;
  requiresConfirmation?: boolean;
  destructive?: boolean;
}
```

Definitions:

- `dangerous` = needs explicit confirmation or may affect visibility/runtime.
- `destructive` = may delete, remove, unsubscribe, rollback, or cause data loss.

Dangerous actions:

```text
delete, remove, unsubscribe, disable, unpublish, rollback, changeVisibility
```

Future behavior:

- `delete` should prefer soft delete / archive.
- `restore` should recover soft-deleted or archived objects.
- `remove` must check whether a joined package is used by a campaign.
- `unsubscribe` remote package and `remove` local/imported package are distinct.
- `disable` may affect current campaign runtime.
- `rollback` may affect package versions and dependencies.
- `changeVisibility` may affect profile, Workshop, Fan Plaza, and share access.

## 3. ViewerContext / Projection Alignment

Action availability aligns to `VISIBILITY_AND_PROJECTION_CONTRACT_V1`.

The helper accepts:

```ts
ObjectActionContext {
  surface: ObjectActionSurface;
  viewerContext?: ViewerContext;
  projection?: EntityProjection | 'denied';
  isOwner?: boolean;
  isCampaignContext?: boolean;
  isPackageLibraryContext?: boolean;
}
```

Viewer roles come from `ViewerContext`:

```text
anonymous, owner, gm, player, campaignMember, admin
```

Rules:

1. Denied projection returns no actions.
2. UI does not decide permissions by itself.
3. Repository / Service projection remains the authoritative read boundary.
4. Action availability is a UI/service helper over projected context; it is not
   auth, backend, or write enforcement.

## 4. Surfaces

`ObjectActionSurface`:

```text
listCard
detailPage
personalHub
userProfile
systemWorkspace
workshopBrowse
packageLibrary
fanPlaza
campaignWorkspace
accountMenu
advancedMenu
```

`campaignWorkspace` is the A10.6-aligned context for campaign resource actions
such as `addToCampaign` / `removeFromCampaign`. It is not campaign entry.

## 5. Target Coverage

Graph-backed targets use current `EntityType`:

```text
actor, campaign, sessionLog, map, workshopPackage, fanWork, blockDocument,
mediaAsset, world, npc, handout
```

Contract-only / future platform targets:

```text
campaignInstance
packageLibraryEntry
collection
userProfile
```

Notes:

- `campaign` and `campaignInstance` both represent the future room-instance
  concept; `campaignInstance` is contract-only until the graph/model names are
  normalized.
- `packageLibraryEntry`, `collection`, and `userProfile` are contract-only
  action targets and do not imply a new store/schema in this round.

## 6. Action Matrix Rules

The helper:

```ts
actionsForObjectType(objectType, context): ObjectActionAvailability[]
```

must satisfy:

- Owner/admin management surfaces can see `edit`, `duplicate`, `export`,
  `archive`, `changeVisibility`, and related management actions.
- Public/anonymous visitors can see read actions such as `viewDetail`,
  `openInProfile`, and safe social actions such as `favorite` / `copyLink`
  where appropriate.
- `packageLibrary` surface can expose `enable`, `disable`, `remove`, `update`,
  and `rollback` for `PackageLibraryEntry`.
- `workshopBrowse` surface can expose `join`, `favorite`, `copyLink`, and
  `openInProfile` for `WorkshopPackage`.
- `campaignWorkspace` surface can expose `addToCampaign` /
  `removeFromCampaign` as resource-management actions.
- `projection === 'denied'` returns an empty list.

## 7. WorkshopPackage vs PackageLibraryEntry

`WorkshopPackageManifest = 包是什么`.

It declares metadata, included entity/document refs, dependencies, entry points,
clone policy, read-only policy, and source trust.

`PackageLibraryEntry = 我如何加入 / 启用 / 禁用 / 更新 / 移除这个包`.

Rules:

- `join` belongs to a WorkshopPackage browse/detail action that creates or
  references a future PackageLibraryEntry.
- `enable`, `disable`, `remove`, `unsubscribe`, `update`, and `rollback` belong
  to PackageLibraryEntry.
- WorkshopPackage is not a campaign room.
- CampaignInstance is the actual play room / campaign instance.

## 8. Campaign Flow Alignment

With `SYSTEM_ENTRY_AND_CAMPAIGN_FLOW_CONTRACT_V1`:

1. 战役 = 房间实例。
2. 角色 / 战役 are parallel workspaces.
3. Campaign detail page is the entry-prep page.
4. `suggestedActorId` is only a recommendation.
5. `selectedActorId` / `selectedEntryRole` are confirmed only when entering.

`ObjectAction.addToCampaign` means “add this object as a campaign resource”.

`CampaignEntryAction.enterCampaign` means “confirm final campaign entry”. They
must not be conflated.

## 9. UserProfileSpace Relationship

`openInProfile` follows the A10.5 Routable Entity mental model:

```text
object card
→ openInProfile
→ UserProfileSpace(profileUserId, section, selectedEntityId)
```

A10.7 does not introduce isolated detail-page routing.

## 10. Navigation & Exit Contract Relationship

A10.7 defines actions only; it does not define page return/close semantics.

All detail/menu surfaces must still obey `NAVIGATION_AND_EXIT_CONTRACT_V1`:

1. 页面内不出现“返回首页”。
2. 整页页面用 `← 返回来源`。
3. 浮层 / 菜单 / 抽屉用 `×` 或点外部关闭。
4. 卡片用于预览，点击进入正式详情 / 用户主页 detail state。
5. 账号菜单由头像触发。

`viewDetail`, `openInProfile`, and `copyLink` must not break this navigation
contract.

## 11. Non-Goals

This round does not implement:

- Real delete / duplicate / share / publish.
- Real unsubscribe / remove / enable / disable / update / rollback.
- Real addToCampaign / removeFromCampaign.
- Real changeVisibility.
- Package Library implementation.
- Workshop Package Builder.
- FanWork Composer.
- Actor Portrait.
- Campaign UI or campaign creation.
- Multiplayer sync.
- Backend / auth.
- Store or migration changes.
- Gameplay runtime or rule engine changes.

## 12. Future Implementation Notes

Before a real write action is implemented:

1. Re-check Projection / ViewerContext.
2. Re-check object ownership and campaign context.
3. Re-check Navigation & Exit affordance.
4. Use Repository / Service boundary, not component-local mutation.
5. Add confirmation for every `dangerous` action.
6. Keep Campaign Entry actions separate from Object Management actions.
