# System Entry + Character/Campaign Workspace Flow Contract v1

<!-- AI-LANDMARK: SYSTEM_ENTRY_CAMPAIGN_FLOW_CONTRACT_V1 -->

Last updated: 2026-06-18

Task: `A10.6 System Entry + Character/Campaign Workspace Flow Contract v1`

This is a platform contract for system entry, character/campaign workspace
branches, campaign instance entry, entry-role selection, and return-context
handoff. It defines types and product rules only.

No real campaign room creation, multiplayer sync, backend, auth, permission
system, NPC/map/handout import, Workshop Builder, ObjectAction Contract,
Package Library, Actor Portrait, FanWork Composer, monorepo migration, Docker,
PostgreSQL, game-rule engine, character store migration, React Router, URL
routing, or browser History API implementation is introduced by this round.

## 1. Product Conclusions

1. 所有系统的平台级称呼统一为“角色”。平台导航层不使用“调查员 / 夜城行动 / Edgerunner”等系统特定称呼。
2. 系统入口只有两个同级主分支：**角色** / **战役**。
3. 战役就是跑团房间实例；不再把“创建战役”和“创建跑团房间”分成两个平级入口。
4. 创意工坊 / 模组包 / 内容包提供的是素材，不是战役房间本身。
5. 同一个工坊素材包可以被不同用户创建成多个不同战役实例。
6. 玩家分享的战役日志属于某个具体战役实例，而不是属于工坊素材包本身。
7. 角色库和战役库是并列工作区，不是固定线性向导步骤。
8. 系统可以提供推荐流程，但不能强制锁死流程。
9. 从角色流程进入战役时，只传递 `suggestedActorId`，不是最终身份锁定。
10. 在战役详情 / 入场准备页中，用户仍可切换角色、创建新角色或选择主持人身份。
11. 点击“创建角色”时，不在战役详情页内嵌低配创建表单，而是跳转到正式角色创建器，并携带 return context。
12. 创建完成后返回原战役详情页，并把新角色作为 `suggestedActorId`。
13. 只有点击“进入战役”时，才确定最终 entry role。
14. 主持人身份解锁高级战役管理能力；玩家角色身份只能查看或使用可见内容。
15. Host 高级选项可以对玩家显示为 `disabled` / `collapsed`，但不能可执行。

## 2. Type Surface

The canonical type surface lives in:

```text
src/lib/platform/campaignFlow.ts
```

Core types:

```ts
SystemWorkspaceBranch = 'characters' | 'campaigns'
CampaignEntrySource
CampaignEntryRole = 'playerCharacter' | 'host'
CampaignEntryReturnTo
CampaignEntryContext
CampaignWorkspaceEntry
CampaignInstanceSummary
```

The type file is platform-only and does not import store, UI, rule data, or
runtime code.

## 3. System Entry Model

Every game system exposes two sibling workspace branches:

| Branch | Platform label | Responsibility |
|---|---|---|
| `characters` | 角色 | Actor / Player Asset management: create, select, inspect, and maintain roles such as DND character, COC investigator, CP RED edgerunner, unit, vehicle, or future player asset. |
| `campaigns` | 战役 | Campaign room / long-term play-space management: campaign instances, members, actor binding, source packages, session entry, and room state. |

System-specific names are allowed inside detail content, flavor text, and system
theme copy. They do not replace the platform-level branch labels.

## 4. CampaignInstance vs WorkshopPackage

The platform must never treat a WorkshopPackage as a campaign room.

```text
WorkshopPackage = 素材 / 模组 / 内容包
CampaignInstance = 某个 Host 创建出来的实际战役 / 房间
```

Relationship examples:

```text
CampaignInstance --createdFrom--> WorkshopPackage
CampaignInstance --uses--> WorkshopPackage
CampaignInstance --hasPlayerCharacter--> Actor
CampaignInstance --hasNpc--> Actor
CampaignInstance --uses--> BlockDocument
CampaignInstance --uses--> MediaAsset
CampaignInstance --hasLog--> SessionLog
```

Implications:

- A single WorkshopPackage can seed many CampaignInstances.
- A CampaignInstance can use multiple WorkshopPackages.
- Campaign logs belong to CampaignInstance, not to the package itself.
- Workshop publication, package cloning, and package subscription are content
  workflows; they do not create an active play room by themselves.

## 5. Character Library to Campaign Flow

Recommended flow from character context:

```text
系统库
→ 角色
→ 创建角色 / 选择角色
→ 角色详情
→ 查看关联战役
→ 选择战役
→ 战役详情 / 入场准备页
→ 默认建议使用该角色
→ 用户仍可切换角色 / 创建新角色 / 作为主持人
→ 进入战役
```

Contract:

- The character context passes `suggestedActorId`.
- `suggestedActorId` is a convenience hint only.
- The campaign detail / entry-prep page must still allow actor switching and
  host role selection.
- Final identity is not locked until the user confirms entry.

## 6. Campaign Library Entry Flow

Recommended flow from campaign context:

```text
系统库
→ 战役
→ 战役库
→ 战役详情 / 入场准备页
→ 选择已有角色 / 创建新角色 / 作为主持人
→ 进入战役
```

Contract:

- Campaign entry can start without a selected actor.
- The entry-prep surface is responsible for role selection.
- Host mode and player-character mode must remain explicit choices.
- Systems may recommend the most recent or most compatible actor, but must not
  silently lock it.

## 7. Create Character from Campaign Detail

When a campaign detail page needs a new actor, it must jump to the formal actor
workspace instead of embedding a low-quality local form:

```text
战役详情 / 入场准备页
→ 点击创建角色
→ 跳转到正式角色创建器
→ 创建完成
→ returnTo 回到原战役详情
→ 新角色成为 suggestedActorId
→ 用户确认身份后进入战役
```

Return context rules:

- `returnTo.view` identifies the formal return surface.
- `returnTo.systemId` keeps the user inside the same game system.
- `returnTo.campaignId` returns to the campaign detail / entry-prep page.
- The newly created actor becomes `suggestedActorId`, not `selectedActorId`.
- User confirmation still sets `selectedActorId` and `selectedEntryRole`.

## 8. suggestedActorId vs selectedActorId

| Field | Meaning | Who sets it | When final? |
|---|---|---|---|
| `suggestedActorId` | A recommended actor from the previous flow or newly created actor. | Previous context / return flow. | Never final by itself. |
| `selectedActorId` | The actor the user explicitly chooses on entry-prep. | User action on campaign detail / entry-prep. | Final only with confirmed entry. |
| `selectedEntryRole` | Player-character or host entry mode. | User action on campaign detail / entry-prep. | Final only with confirmed entry. |

The distinction prevents role/actor lock-in when a user enters from a character
page but later decides to host, switch actor, or create a different actor.

## 9. Host and Player-Character Roles

`playerCharacter`:

- Can view campaign public information.
- Can select / switch their own actor.
- Can enter player view.
- Can view their visible maps, handouts, and logs.
- Host advanced features are `disabled` / `collapsed`, not executable.

`host`:

- Can import characters / NPCs.
- Can import maps.
- Can import handouts / documents.
- Can enable content packages.
- Can manage player characters.
- Can manage dice visibility.
- Can manage logs.
- Can enter host view.

This contract defines capability boundaries only. It does not implement a real
permission system, auth model, multiplayer model, or backend.

## 10. Global Object Context Handoff Rules

1. 每类对象都有自己的正式工作区：角色库、战役库、文档库、媒体库、内容包库、作品库。
2. 当前页面需要另一个对象时，不内嵌低配创建器，而是跳转到该对象的正式工作区。
3. 跳转时携带 return context。
4. 创建 / 选择完成后回到原上下文。
5. 系统可以提供 suggested value，但最终选择必须由用户确认。
6. 对象之间通过 EntityGraph 记录关系，而不是靠页面临时状态。
7. 这是一种推荐流程，不是强制向导。

## 11. Relation to Navigation & Exit Contract

This contract must obey `NAVIGATION_AND_EXIT_CONTRACT_V1`:

- 页面内部不出现“返回首页”。
- 整页页面用 `← 返回来源`。
- 浮层 / 菜单 / 抽屉用 `×` 或点外部关闭。
- 首页只存在于全局导航。
- 账号菜单由头像触发。
- 角色库 / 战役库是正式工作区，不是临时弹窗。

Return context is not a second routing system. It is a payload for restoring the
source workflow after the user completes a formal object workspace action.

## 12. Boundaries

This contract does not implement:

- Real campaign room creation.
- Real multiplayer sync.
- Backend or auth.
- Real permission enforcement.
- NPC / map / handout import.
- Workshop Builder.
- ObjectAction Contract.
- Package Library.
- Actor Portrait.
- FanWork Composer.
- Monorepo migration.
- Docker / PostgreSQL.
- DND / COC / CP RED rule engines.
- Character store migration.

Any future task that crosses one of these boundaries must be its own scoped
implementation round.

## 13. Verification Notes

This round should compile because `campaignFlow.ts` exports standalone platform
types and pure helpers only. No runtime code imports it yet.

Manual audit expectations:

- System entry copy should converge toward platform-level `角色 / 战役`.
- Existing system-specific display labels may remain inside system detail
  content.
- Any future campaign-entry UI must preserve `suggestedActorId` as a suggestion
  and require explicit role/actor confirmation before entry.
