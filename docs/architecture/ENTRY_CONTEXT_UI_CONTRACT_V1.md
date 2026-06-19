# Entry Context UI Contract v1

<!-- AI-LANDMARK: ENTRY_CONTEXT_UI_CONTRACT_V1 -->

Last updated: 2026-06-20

Task: `A12.2.5 Product UX / IA / Maintainability Audit`

This contract defines the product UI rules for entry-context surfaces around
Actor Vault, Campaign Entry, and Campaign Runtime. It is a contract only. It
does not implement UI behavior, store writes, schema migration, rules runtime,
campaign runtime persistence, multiplayer, backend, map, handout, inventory, or
Workshop behavior.

## 1. Layer Identification

This contract applies to these IA layers:

- Object Library: `ActorVaultLibraryShell`, `CampaignLibraryShell`.
- Object Detail: campaign detail / entry preparation.
- Create / Add Flow: adding actors from a campaign context.
- Runtime / Gameplay: `CampaignRuntimeShell` projection only.

It must not flatten:

```text
System Library
└─ System Landing
   ├─ Character Module
   │  └─ My Characters / Add Character
   └─ Campaign Module
      └─ My Campaigns / Add Campaign
         └─ Campaign Detail / Entry Preparation
            └─ Context handoff to Actor Vault or Runtime
```

## 2. ActorVaultPurpose

Actor Vault must have an explicit purpose. Hidden behavior based only on optional
context props is discouraged because it makes button semantics drift.

Recommended future type:

```ts
type ActorVaultPurpose =
  | { kind: 'manage' }
  | { kind: 'selectForCampaign'; context: CampaignActorSelectReturnContext }
  | { kind: 'addForCampaign'; context: CampaignActorAddReturnContext };
```

### `manage`

Purpose: manage existing actor assets.

Surface:

```text
我的角色
添加角色
```

Actor card primary action:

- `打开角色卡` when the card opens the actor's usable sheet.
- `查看详情` when the card opens a non-runtime detail page.

Do not use vague `进入` on actor cards unless it enters a clearly named module or
runtime surface.

### `selectForCampaign`

Purpose: choose an existing actor as a campaign entry suggestion.

Surface:

```text
ContextBar: 正在为「Campaign #Room」选择入场角色
我的角色
```

Actor card actions:

- Primary: `选择此角色`.
- Secondary: `打开角色卡` / `查看详情`, visually weaker.

Selecting an actor returns a `suggestedActor`; it must not persist
`selectedActorId`.

### `addForCampaign`

Purpose: add an actor while preserving a campaign return context.

Surface:

```text
ContextBar: 正在为「Campaign #Room」添加角色
添加角色
├─ 标准创建
├─ 快速创建
├─ 本地导入角色
└─ 从创意工坊导入
```

Import remains inside the Add Flow. It must not become an Actor module top-level
entry.

## 3. CampaignEntryPanel

Campaign detail / entry preparation should use one unified Entry Panel instead
of separate duplicated blocks such as `选择进入身份` plus `玩家准备`.

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

Rules:

1. `使用已有角色` and `添加角色` should be grouped under the Player Character
   entry path.
2. The campaign detail page must not embed a low-quality actor picker or actor
   creation form.
3. `选择或添加角色` can be the collapsed player path CTA when no actor is
   suggested yet.
4. Once a suggested actor exists, show `当前预选角色`, `更换角色`, and
   `进入战役`.
5. Host entry should be its own entry path, not mixed into player preparation.
6. Host preparation tools remain disabled / placeholder until scoped runtime
   work implements them.

## 4. Button Semantics

Button labels must be stable by task.

| Label | Use only for |
|---|---|
| `进入` | Entering a system, module, or campaign runtime. |
| `查看详情` | Inspecting an object detail page. |
| `打开角色卡` | Opening the actor's usable sheet/card surface. |
| `选择此角色` | Returning an actor choice in a selection context. |
| `选择或添加角色` | Opening the campaign-entry actor choice path. |
| `添加角色` | Entering the actor Add Flow. |
| `进入战役` | Confirming local runtime UI entry into `CampaignRuntimeShell`. |
| `返回` | Icon-only `←`; text belongs in `aria-label` / `title` only. |

Forbidden drift:

- Actor cards must not alternate between `进入`, `选择此角色`, and `详情`
  without an explicit purpose.
- Campaign entry must not show two same-level actor CTAs in two separate panels.
- Import actions must not be elevated to module-level peer actions.

## 5. ContextBar

Context handoff should use a compact ContextBar, not a large banner.

Target shape:

```text
←   正在为「灰雾古堡 #A12F」选择入场角色        optional status
```

Rules:

1. Left side: icon-only `←` when return is available.
2. Center: concise context sentence.
3. Right side: optional status, such as `推荐角色` or `UI 示例`.
4. Do not render a large banner for simple return context.
5. Do not render multiple return controls.
6. Do not show visible `返回首页`, `返回上一层`, `上一级`, or `当前位置`.

ContextBar is a local context affordance. It is not global navigation.

## 6. Campaign Entry Actor Selection

The campaign entry actor-selection flow is:

```text
Campaign Detail
→ 选择或添加角色
→ Actor Vault with purpose = selectForCampaign
→ 选择此角色
→ Campaign Detail with suggestedActor
→ 进入战役
→ CampaignRuntimeShell local UI context
```

Rules:

1. `suggestedActor` is a UI recommendation only.
2. `selectedActorId` is not persisted during selection.
3. `selectedActorId` and `selectedEntryRole` become meaningful only when the
   user clicks `进入战役`.
4. A12 shell rounds may create local UI runtime context, but must not write
   actor or campaign store.

## 7. Host / Player Runtime UI Projection

`CampaignRuntimeShell` must distinguish Host View and Player View, but A12 shell
work remains projection only.

Host View may show:

- NPC management placeholder.
- Map / scene management placeholder.
- Handout publish placeholder.
- Content package resources placeholder.
- Player actor management placeholder.
- Campaign settings placeholder.
- Hidden information / GM Notes placeholder.

Player View may show:

- Own actor.
- Public scene.
- Public handout.
- Public map / scene.
- Public log.
- Dice area placeholder.

Rules:

1. Player View must not execute Host-only actions.
2. Host-only areas in Player View must be hidden, collapsed, locked, or disabled.
3. Projection UI must not imply real permissions, real synchronization, real log
   persistence, or real publication.
4. Runtime Log shell entries may be static UI examples only until a dedicated log
   data contract exists.

## 8. No Layer Flattening

Forbidden:

- System Library showing actor / campaign operations.
- System Landing expanding directly into `我的角色`, `添加角色`, `我的战役`,
  `添加战役`.
- Actor module permanently showing campaign switching.
- Campaign module permanently showing actor switching.
- Campaign detail embedding actor creation.
- Runtime shell exposing library-management operations as enabled actions.

Use return context instead of permanent parallel navigation.

## 9. No Button Semantics Drift

Before adding or changing a button, identify:

1. Object type: system, actor, campaign, package, runtime surface.
2. Current layer: catalog, module, library, detail, add flow, runtime.
3. Purpose: manage, select, add, inspect, enter runtime.
4. Whether the action writes real data.

If the same visual card appears under different purposes, its primary action
must change by explicit purpose, not by ad hoc optional props.

## 10. No Suggested-To-Selected Shortcut

Forbidden:

- Persisting `suggestedActor` as `selectedActorId` before `进入战役`.
- Treating a campaign return context as a campaign membership write.
- Treating local `CampaignRuntimeContext` as persisted runtime state.

Allowed in shell rounds:

- Show `suggestedActor` on campaign detail.
- Convert `suggestedActor` into local runtime context only after `进入战役`.
- Keep all such state in UI component state until a future persistence contract.

## 11. Import Belongs Inside Add Flow

`导入角色` and `导入战役` are Add Flow methods.

They must not appear as:

- System Library card actions.
- System Landing module actions.
- Actor module top-level peer entries.
- Campaign module top-level peer entries.

Correct placement:

```text
添加角色
├─ 标准创建
├─ 快速创建
├─ 本地导入角色
└─ 从创意工坊导入

添加战役
├─ 标准创建
├─ 快速创建
└─ 导入战役
```

## 12. Maintainability Guidance

Future cleanup should prefer:

1. `ActorVaultPurpose` over multiple optional context props.
2. A shared platform `EntryContextBar` over per-workspace banners.
3. Shared campaign-entry bridge helpers for DND / COC / CP RED workspace shells.
4. Clear naming: `suggestedActor` for UI suggestion, `selectedActorId` for
   confirmed runtime entry only.
5. Domain-grouped i18n keys: `actorVault`, `campaignEntry`, `campaignRuntime`,
   `contextBar`.

Avoid:

- Copying bridge logic into every system indefinitely.
- Adding new boolean props for every context variation.
- Mixing UI context, runtime context, and persistent store state names.

## 13. Acceptance Checklist

Any future implementation changing these surfaces must report:

1. Which IA layer was touched.
2. Which existing pattern was reused.
3. The ActorVault purpose, if Actor Vault is touched.
4. Whether Campaign Entry uses a unified Entry Panel.
5. Whether ContextBar is used for return context.
6. Whether any new permanent parallel entry point was added.
7. Whether any real store, runtime log, backend, map, handout, or permission
   behavior was implemented.
8. `npx tsc --noEmit`, `npm run build`, and `git status --short` results.
