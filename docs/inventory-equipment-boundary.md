# Inventory & Equipment Boundary (M53–M56)

Backpacks and equipment are **not** just a list on a character sheet. They are a
question of item instances, ownership, equipment slots, campaign-authoritative
state, and a reflow boundary. This document (and
`src/components/platform/runtimeInventoryBoundary.ts`) names those concepts so the
Runtime UI stays honest: it **reads** inventory summaries and **records** change
events, but it does not store item instances, edit inventory, or settle rules.

## Item model concepts (M53)

| Concept | Status | Meaning |
| --- | --- | --- |
| **ItemDefinition** | available | The template — what an item *is* (Longsword, Healing Potion, Kevlar Armor). Reusable, owned by no one. |
| **ItemInstance** | future | The specific item a character owns — quantity, source, condition, wear, enchantment, notes. |
| **InventoryContainer** | future | A collection of items: backpack, coin pouch, equipment bar, loot chest, campaign reward pool. |
| **EquipmentSlot** | future | A worn slot: main hand, off hand, armor, trinket, outfit. |
| **InventoryChangeEvent** | available (as log) | Gain / lose / consume / equip / unequip / damage / repair / transfer. Recorded today as a RuntimeLog event, not a mutation. |
| **CampaignActorInventory** | future | The authoritative in-campaign backpack that will persist gains, consumption, damage, trades, drops. |

## Ownership boundary (M54)

| Tier | Status | Who may change it |
| --- | --- | --- |
| **角色库背包 / Vault Inventory** | available | The player's original character record. Freely editable, but **not** campaign-authoritative. |
| **当前房间装备视图 / Room Equipment View** | available | The read-only equipment/inventory summary the Runtime renders this session. |
| **战役内背包实例 / Campaign Inventory Instance** | future | The authoritative in-campaign item state (CampaignActorInstance). **Not implemented.** |

### The reflow path (future)

```
战役中获得 / 消耗 / 装备变化
  → RuntimeLog / Inventory Change Event
  → CampaignActorInstance (future authoritative)
  → Session Recap / Character Chronicle draft
  → Host / player confirmation
  → optional reflow back to the vault character
```

## Guardrails (current behavior)

- A Runtime inventory change is an **event record** (RuntimeLog + Session Recap).
- It does **not** auto-modify the vault character, and it does **not** change the
  character sheet's equipment/inventory numbers.
- No auto add/remove of items, no auto-consume, no auto-equip write-back, no
  weight/encumbrance or AC/HP math.
- Writing to a future Campaign Actor Inventory must go through rule validation and
  host / player confirmation — never an automatic sync.

## Change-event contract (M56)

The existing `state.manualChange` RuntimeLog event carries these **optional,
display-only** payload fields (older readers ignore unknown fields):

```
kind: state.manualChange
payload.noteKind: 'manualState'
payload.changeKind: 'condition' | 'inventory' | 'equipment' | 'resource' | 'note'
payload.targetName: 目标角色 / 对象
payload.itemLabel:  物品名
payload.actionLabel: 获得 / 消耗 / 装备 / 卸下 / 损坏 / 修复 / 转移 / 其他
payload.body:       说明
```

## Runtime inventory read view (M55)

`runtimeInventoryAdapter` safely reads an (optional) actor snapshot into a
read-only summary: equipped items, inventory, consumables, currency — system
aware for DND 5e / CoC 7e / CP RED. When no snapshot data exists it returns empty
sections and the character sheet shows: *当前角色快照还没有提供可展示的装备 / 背包
数据。战役内物品变化会先进入日志和回顾，不会自动改写角色库原件。*

## Explicitly out of scope (this milestone)

Full inventory editor, auto add/remove/consume, auto equip/unequip write-back,
trading / shops / auctions, full ItemInstance storage, CampaignActorInstance
migration, rules automation, weight/AC/HP calculation, map tokens/fog, AI,
databases, accounts.
