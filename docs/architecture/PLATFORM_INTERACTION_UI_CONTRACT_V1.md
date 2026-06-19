# Platform Interaction UI Contract v1

<!-- AI-LANDMARK: PLATFORM_INTERACTION_UI_CONTRACT_V1 -->

Last updated: 2026-06-20

Task: `Upgrade Entry Context Contract to Platform Interaction UI Contract`

This is a platform-wide UI / interaction / button semantics / context handoff
contract. It replaces the narrower `ENTRY_CONTEXT_UI_CONTRACT_V1` scope.

This document does not implement UI behavior, store writes, schema migration,
rules runtime, campaign runtime persistence, multiplayer, backend, maps,
handouts, inventory, Workshop behavior, or plugin behavior.

## 1. Scope

This contract applies to platform interaction surfaces for:

- Actors / characters.
- Campaigns.
- NPCs.
- Maps.
- Handouts.
- Documents.
- Content packages.
- Media.
- Fan works.
- Workshop items.
- User profiles.
- Settings.
- Runtime desks.

It governs:

- Button wording.
- Primary / secondary actions.
- Page responsibility.
- Context handoff.
- Object selection.
- Object addition.
- Return behavior.
- ContextBar.
- Card operations.
- Module entry.
- Runtime entry.

## 2. Page Responsibility / 页面职责

One page serves one primary task.

Examples:

| Page | Responsibility |
|---|---|
| System Library / Catalog | Choose a rules system. |
| System Landing | Choose major modules such as `角色` / `战役`. |
| Actor module | Manage `我的角色` / `添加角色`. |
| Campaign module | Manage `我的战役` / `添加战役`. |
| Campaign detail | Prepare entry into one campaign instance. |
| CampaignRuntimeShell | Run one campaign desk projection. |
| Settings | Navigate settings categories and edit current category content. |
| Workshop | Discover content packages and assets. |
| Fan Plaza | Browse and read community creative works. |

Forbidden:

- Flattening catalog / workspace / module / library / detail / add flow into
  one page.
- Showing object-specific actions in a catalog page.
- Showing all possible paths just because they are convenient.
- Turning a detail page into a mini-create flow for another object type.

When another object is needed, use ContextBar and return context instead of
permanent parallel navigation.

## 3. Button Semantics / 按钮语义

Button labels must be stable across the platform.

| Label | Use only for |
|---|---|
| `进入` | Entering a system, module, campaign runtime, or runtime space. |
| `查看详情` | Viewing an object detail page. |
| `打开角色卡` | Opening an actor's usable sheet/card surface. |
| `选择此角色` | Returning an actor as the result of a selection context. |
| `选择或添加角色` | Opening the actor-selection/addition path from campaign entry prep. |
| `添加 X` | The umbrella entry for create / import / clone / select-from-package methods. |
| `创建 X` | A from-scratch method inside an Add Flow. |
| `导入 X` | An import method inside an Add Flow. |
| `返回` | Icon-only `←`; text belongs in `aria-label` / `title` only. |

Forbidden:

- Using vague `进入` on arbitrary object cards.
- Letting the same purpose drift between `进入`, `详情`, and `选择`.
- Elevating import into a module-level peer action.
- Using visible large text buttons such as `返回首页`, `返回上一层`, `上一级`,
  or `当前位置`.

## 4. Primary / Secondary Action Rules

Each object card may have at most one primary action.

Rules:

1. Secondary actions must be visually weaker than the primary action.
2. Destructive actions require clear confirmation.
3. Placeholder / comingSoon / disabled actions must not pretend to be complete.
4. A card's primary action must be determined by its purpose.

Examples:

| Surface | Primary action |
|---|---|
| Normal actor card | `查看详情` or `打开角色卡`. |
| Actor card in campaign selection context | `选择此角色`. |
| Campaign card | `查看战役详情`. |
| Campaign detail | `进入战役`. |
| Workshop item card | `查看详情` / `进入详情`. |
| Settings category row | Open that settings category. |

If a card needs more than one important action, split the task into detail view
or contextual flow instead of overloading the card.

## 5. Object Library Purpose / 对象库模式

Every platform object library should have an explicit purpose.

Actor Vault example:

```ts
type ActorVaultPurpose =
  | 'manage'
  | 'selectForCampaign'
  | 'addForCampaign';
```

General future pattern:

```ts
type ObjectLibraryPurpose =
  | 'manage'
  | 'selectForContext'
  | 'addForContext'
  | 'publishForContext';
```

Rules:

1. Do not rely on many optional context props to implicitly change UI behavior.
2. Purpose decides page title, ContextBar, card primary action, secondary
   actions, and return behavior.
3. `manage` libraries show normal object management.
4. `selectForContext` libraries return a selected object to the caller.
5. `addForContext` libraries show Add Flow methods while preserving return
   context.
6. `publishForContext` libraries are future runtime/resource workflows and must
   not imply real publication until scoped.

## 6. ContextBar

Use a compact ContextBar for context handoff.

Target shape:

```text
←   正在为「灰雾古堡 #A12F」选择入场角色   optional status
```

Rules:

1. Left side uses icon-only `←`.
2. Return text is only for `aria-label` / `title`.
3. Center shows the current context task.
4. Right side may show optional status, such as `推荐角色`, `UI 示例`, or
   `Coming Later`.
5. Do not use a large banner as the default context UI.
6. Do not show multiple return controls.
7. Do not show visible `返回首页`, `返回上一层`, `上一级`, or `当前位置`.

ContextBar applies to:

- Selecting an actor for a campaign.
- Adding an actor for a campaign.
- Selecting a map for a scene.
- Adding a handout to a scene.
- Selecting a document for a content package.
- Returning from an object detail to a source context.
- Future runtime resource selection.

ContextBar is local context, not global navigation.

## 7. Add Flow Rule / 添加流程规则

`添加 X` is the umbrella entry.

Creation, import, cloning, Workshop addition, and package selection are methods
inside the Add Flow.

Examples:

```text
添加角色
├─ 标准创建
├─ 快速创建
├─ 本地导入角色
└─ 从创意工坊导入
```

```text
添加战役
├─ 标准创建
├─ 快速创建
└─ 导入战役
```

Forbidden:

- Showing `添加`, `创建`, `导入`, and `从工坊导入` as module-level peer
  actions.
- Placing import directly on System Landing or System Library cards.
- Treating import as a primary module rather than an Add Flow method.

## 8. Campaign Entry Panel

Campaign detail / entry preparation uses one unified Entry Panel.

Target shape:

```text
入场方式
├─ 玩家角色
│  └─ 入场角色
│     ├─ 未选择：选择或添加角色
│     └─ 已选择：当前预选角色 / 更换角色 / 进入战役
└─ 主持人
   └─ 主持人入场 / 进入战役
```

Forbidden duplication:

```text
选择进入身份
玩家准备
使用已有角色
添加角色
选择已有角色
添加角色
```

Rules:

1. Actor choice and actor addition are grouped under the Player Character path.
2. Host entry is a separate entry path.
3. Campaign detail must not embed a low-quality actor creation form.
4. `进入战役` is the primary action only after the required local UI entry
   choice is present.
5. Host preparation tools remain disabled / placeholder until a scoped runtime
   task implements them.

## 9. Suggested / Selected Boundary

The platform must distinguish suggestion, local runtime selection, and persisted
state.

Definitions:

```text
suggestedActor = UI recommendation / preselection.
selectedActorId = local runtime context value when the user confirms entry.
persisted selectedActorId = future real runtime / store phase only.
```

Rules:

1. Do not persist `suggestedActor` as `selectedActorId`.
2. Do not write actor / campaign store before `进入战役`.
3. In shell rounds, `CampaignRuntimeContext` is local UI state only.
4. Persisted campaign membership requires a dedicated data contract and task.

## 10. Runtime UI Projection

Host View and Player View are UI projections. They are not a real permission
system.

Rules:

1. Host-only operations in Player View must be locked, hidden, or disabled.
2. UI must not imply real permission enforcement.
3. UI must not imply real multiplayer synchronization.
4. UI must not imply real runtime log persistence.
5. UI must not imply real map / handout / NPC management.
6. Placeholder copy must explicitly state that real behavior comes later.

Host View may expose placeholder regions for:

- NPC management.
- Map / scene management.
- Handout publishing.
- Content package resources.
- Player actor management.
- Campaign settings.
- Hidden information / GM Notes.

Player View may expose:

- Own actor.
- Public scene.
- Public handout.
- Public map / scene.
- Public log.
- Dice area placeholder.

## 11. Navigation / Chrome

This contract reinforces `NAVIGATION_AND_EXIT_CONTRACT_V1`.

Rules:

1. Large pages have at most one icon-only back arrow.
2. Breadcrumb is lightweight context only, not a debug path.
3. Global navigation handles cross-area movement.
4. Local return handles only the current context.
5. Visible text `返回首页`, `返回上一层`, `上一级`, and `当前位置` must not be
   used as main UI chrome.
6. Settings is an app-level surface with a category rail and content pane.
7. Account actions belong under the avatar/account menu, not page return chrome.

## 12. Maintenance Rules

Long-term maintainability rules:

1. Before adding a new UI mode, check whether it is a variant of an existing
   purpose.
2. Prefer extending a purpose enum over adding scattered boolean props.
3. DND / COC / CP RED should share platform shell and bridge helpers where
   practical.
4. i18n keys should be grouped by domain, such as `actorVault`,
   `campaignEntry`, `campaignRuntime`, `contextBar`, `settings`.
5. UI state, runtime state, and persistent state names must stay distinct.
6. Every new button must declare whether it is primary, secondary, contextual,
   destructive, or disabled.
7. Placeholder and scaffold UI must be transparent about what is not implemented.

Avoid:

- Copying bridge logic across systems indefinitely.
- Adding one-off optional props for every context variation.
- Mixing catalog, workspace, module, library, detail, add flow, and runtime
  concerns in one component.

## 13. Acceptance Checklist

Any future implementation touching platform interaction surfaces must report:

1. Which page responsibility and IA layer were touched.
2. Which purpose was used for object libraries.
3. Whether each object card has at most one primary action.
4. Whether Add Flow methods stayed inside `添加 X`.
5. Whether ContextBar was used for context handoff.
6. Whether Campaign Entry uses a unified Entry Panel.
7. Whether `suggestedActor`, `selectedActorId`, and persisted state remain
   separate.
8. Whether Runtime Projection stayed UI-only.
9. Whether Navigation / Chrome stayed compliant.
10. Whether any store, schema, rules runtime, backend, map, handout, multiplayer,
    Workshop, or plugin behavior was implemented.
11. `npx tsc --noEmit`, `npm run build`, and `git status --short` results.
