# Campaign Actor Instance Boundary (M51)

This document names the layers an actor passes through in the platform, so the
Runtime UI is honest about what is persisted and what is not. It is a **boundary
contract only** — there is no database, no `CampaignActorInstance` storage, no
migration, and no write-back today. The machine-readable version lives in
`src/components/platform/runtimeActorInstanceBoundary.ts`.

## The four layers

| Layer | Status | What it is |
| --- | --- | --- |
| **角色库角色 / Vault Character** | available | The player's long-lived original character, saved and edited in the character library. The authoritative source the player owns. |
| **房间角色绑定 / Room Actor Binding** | available | The binding + admission record created when a player brings an actor into a room this session (actorRef + clearance + ready). |
| **Runtime 角色快照 / Runtime Actor Snapshot** | available | The read-only summary the Runtime renders (via `runtimeActorSnapshotAdapter`). Derived, never edited in place. |
| **战役内角色实例 / Campaign Actor Instance** | **future** | The authoritative in-campaign instance that will carry HP, resources, equipment changes, growth, campaign history and settlement. **Not implemented.** |

## Guardrails (current behavior)

- The RuntimeLog / Manual State Log is an **event record**. It appears in the
  timeline and in Session Recap.
- It does **not** automatically modify the vault character, and it does not
  modify the Runtime Character Sheet's numbers.
- A future write to a Campaign Actor Instance must go through **rule validation
  and host / player confirmation** — never an automatic sync.
- Session Recap may generate a **Character Chronicle** draft in the future, but a
  chronicle / growth reflow must not silently overwrite the original character.

## Explicitly out of scope (this milestone)

Character editing, automatic HP / SAN / Humanity changes, actor store writes,
equipment trading, inventory/item-instance systems, full `CampaignActorInstance`
migration, databases, accounts, and automatic sync.

## Where this shows up in the UI

- `RuntimeActorBoundaryNote` renders the four tiers + the state-log caveat from
  the contract module.
- `RuntimeCharacterSheetPanel` (player "我的角色") and `RuntimeActorRosterPanel`
  (host) embed the boundary note so both roles see the same guarantees.
