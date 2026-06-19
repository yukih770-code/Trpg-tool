# Campaign Runtime Shell Contract v1

<!-- AI-LANDMARK: CAMPAIGN_RUNTIME_SHELL_CONTRACT_V1 -->

Last updated: 2026-06-19

Task: `A12.0 Campaign Runtime Shell Contract v1`

This contract defines the product and architecture boundary for the campaign
runtime desktop entered after campaign entry preparation. It is a contract only.
It does not implement UI, backend, multiplayer, maps, handouts, runtime logs,
store writes, schema migration, or rule engines.

## 1. Layer Identification

A12.0 belongs to the **Runtime / Gameplay** layer, but this round only defines
the contract for that layer.

It follows the A11 campaign entry flow:

```text
我的战役
→ 战役详情 / 入场准备
→ 选择进入身份
→ 进入战役
→ CampaignRuntimeShell
```

The runtime shell is not:

- System Library / Catalog.
- System Workspace Landing.
- Actor Vault / 角色库.
- Campaign Library / 我的战役.
- Campaign detail / entry-preparation page.
- WorkshopPackageManifest.
- PackageLibraryEntry.

It is the concrete play surface for one `CampaignInstance`.

## 2. Relationship To A11

A11 is responsible for pre-entry preparation:

```text
我的战役
→ 战役详情 / 入场准备
→ 使用已有角色 / 添加角色 / 作为主持人进入
```

A12 is responsible for post-entry runtime:

```text
进入战役
→ CampaignRuntimeShell
```

Boundaries:

- A11 does not enter runtime.
- A12 does not create actors.
- A12 does not create campaigns.
- A12 does not manage PackageLibrary entries.
- A12 receives only a confirmed entry role and optional confirmed actor.

## 3. CampaignInstance Boundary

`CampaignRuntimeShell` belongs to a concrete `CampaignInstance`.

Rules:

1. `CampaignRuntimeShell` is the actual play-space shell for one campaign room
   instance.
2. It is not a `WorkshopPackageManifest`; packages are content/material.
3. It is not a `PackageLibraryEntry`; package library entries describe how a
   user has joined/enabled/managed a package.
4. It is not the system landing page.
5. It is not an actor library.
6. It carries the active campaign runtime context.
7. Host and Player projections share the same shell, but see different enabled
   regions and actions.
8. A12 defines shell areas and projection boundaries only. It does not implement
   real multiplayer synchronization.

## 4. Entry Context Boundary

`CampaignEntryContext` is the pre-entry preparation context. It can include a
`suggestedActorId`, pending return context, and UI-level entry choices.

`CampaignRuntimeContext` is the post-entry runtime context. It exists only after
the user confirms entry into a campaign.

Conceptual future type:

```ts
type CampaignRuntimeContext = {
  campaignId: string;
  campaignTitle: string;
  campaignRoomCode?: string;
  systemId: string;
  selectedEntryRole: 'playerCharacter' | 'host';
  selectedActorId?: string;
  selectedActorName?: string;
  source: 'campaignEntry';
};
```

Rules:

1. `suggestedActorId` is never enough to enter runtime.
2. `selectedActorId` and `selectedEntryRole` are confirmed only when the user
   clicks `进入战役`.
3. Player-character entry requires an explicit actor selection before runtime
   can treat the actor as selected.
4. Host entry requires explicit `selectedEntryRole: 'host'`.
5. `CampaignEntryContext` and `CampaignRuntimeContext` must not be mixed.
6. `CampaignRuntimeContext` must not be written to persistent store in this
   contract round.

## 5. Runtime Shell Areas

Future `CampaignRuntimeShell` uses these base regions:

```text
CampaignRuntimeShell
├─ Runtime Header
├─ Participant / Actor Rail
├─ Main Stage
├─ Side Panel
├─ Runtime Log
└─ Action Dock
```

### Runtime Header

Purpose: identify the current campaign runtime and provide lightweight exit
context.

Contains:

- Campaign title.
- System name.
- Room code.
- Current entry role.
- Current actor, if any.
- Connection status placeholder.
- Return to campaign detail / exit runtime affordance.

Navigation rule:

- Return/exit must obey `NAVIGATION_AND_EXIT_CONTRACT_V1`.
- Full-page return should use at most one icon-only back arrow with label text
  in `aria-label` / tooltip.
- Do not render heavy text buttons such as `返回首页`, `返回上一层`, or a debug
  breadcrumb path.

### Participant / Actor Rail

Purpose: show who is part of the current campaign runtime.

Contains:

- Player characters.
- Host.
- NPC placeholder.
- Spectator placeholder.
- Online status placeholder.

A12 does not implement real online presence, sockets, room membership, or
participant persistence.

### Main Stage

Purpose: central play surface.

Can host:

- Current scene.
- Map placeholder.
- Script/document placeholder.
- Combat view placeholder.
- Investigation board placeholder.

A12 does not implement a real map, tactical board, combat scene, or document
runtime.

### Side Panel

Purpose: contextual supporting information and tools.

Can host:

- Actor summary.
- NPC summary.
- Handout.
- Map layers.
- Content package resources.
- Scene information.
- Host preparation area.

Host-only actions in this region must be disabled, locked, or hidden for Player
View.

### Runtime Log

Purpose: chronological runtime feed.

Can show placeholders for:

- Dice rolls.
- System events.
- Actor actions.
- Host prompts.
- Handout publish records.

A12 does not implement persistent runtime logs, append behavior, sync, or export.

### Action Dock

Purpose: local action launch area.

Can include placeholders for:

- Roll dice.
- Enter combat.
- Publish handout.
- Add scene.
- Open actor sheet.
- Open map.
- Host actions.

A12 does not implement real dice, combat, map, handout, inventory, or host
action behavior.

## 6. Host / Player Projection

`CampaignRuntimeShell` must support two projections:

```text
Host View
Player View
```

### Host View

Host View may expose enabled or future-enabled regions for:

- Host preparation.
- NPC management placeholder.
- Map management placeholder.
- Handout management placeholder.
- Content package enablement placeholder.
- Player actor management placeholder.
- Campaign settings placeholder.

Host View in A12 remains a shell. It does not implement real imports, settings,
permission enforcement, backend writes, or content-package activation.

### Player View

Player View may expose:

- The player's own actor.
- Public handouts.
- Public map / scene.
- Public log.
- Dice area.
- Campaign entry status.

Player View must not execute Host-only actions. Host-only regions may be hidden,
collapsed, locked, or shown as disabled placeholders, but they must not be
interactive.

## 7. Backend And Multiplayer Boundary

A12.0 does not implement:

- Real multiplayer.
- WebSocket.
- Room synchronization.
- Backend permission checks.
- Auth.
- Real room membership.
- Persistent runtime log.
- Real campaign runtime store.

It may reserve future surface areas for:

- Connection status placeholder.
- Participant list placeholder.
- Runtime log placeholder.
- Room code display.
- Host / Player projection.

These placeholders do not imply backend availability.

## 8. Relationship To Object Actions

`OBJECT_MANAGEMENT_ACTION_CONTRACT_V1` separates object management from campaign
entry. A12 continues that separation.

Examples:

- `addToCampaign` means adding an object as a campaign resource.
- `enterCampaign` means confirming the runtime entry context.
- Host runtime actions such as adding maps or publishing handouts are future
  runtime/resource actions and must not be implemented as ordinary card actions
  without checking object action, projection, and repository contracts.

## 9. Required Future Acceptance Checks

Before any A12 implementation beyond this contract, an implementation task must
answer:

1. Is the surface pre-entry or post-entry?
2. Is the current object a `CampaignInstance`, not a package?
3. Has the user explicitly confirmed `selectedEntryRole`?
4. For player entry, has the user explicitly confirmed `selectedActorId`?
5. Are Host-only actions disabled/hidden for Player View?
6. Does the surface avoid real writes unless the task explicitly scopes them?
7. Does the surface obey the Navigation & Exit Contract?
8. Does the task avoid map, handout, log, multiplayer, and backend implementation
   unless explicitly scoped?

## 10. Non-Goals

This contract does not implement:

- UI components.
- Store or schema changes.
- Character / investigator / edgerunner save-format changes.
- Campaign creation.
- Actor creation or import.
- Actor-to-campaign binding.
- `selectedActorId` persistence.
- `selectedEntryRole` persistence.
- Real campaign runtime entry.
- Multiplayer, backend, WebSocket, auth, or permissions.
- Maps, tokens, tactical board, handouts, scenes, or documents.
- Runtime log writes.
- DND / COC / CP RED gameplay or rule engines.

Any future task crossing these boundaries must be scoped as its own
implementation round.
