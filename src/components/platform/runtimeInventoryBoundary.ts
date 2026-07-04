/**
 * Runtime inventory / equipment boundary contract (M53/M54/M56, types + copy).
 *
 * AI-LANDMARK: RUNTIME_INVENTORY_BOUNDARY_V0
 *
 * A MINIMAL boundary contract for items — NOT an item database, store, or engine.
 * It names the concepts (ItemDefinition vs ItemInstance vs container vs slot vs
 * change event) and the ownership tiers so the UI never pretends to persist or
 * settle inventory. Nothing here reads/writes state; panels render the copy and
 * future code can lean on the shapes. No storage, no migration, no rules math.
 */

// ── Concept boundary (M53) ───────────────────────────────────────────────────

export type InventoryConceptId =
  | 'itemDefinition'
  | 'itemInstance'
  | 'inventoryContainer'
  | 'equipmentSlot'
  | 'inventoryChangeEvent'
  | 'campaignActorInventory';

export interface InventoryConcept {
  id: InventoryConceptId;
  label: string;
  description: string;
  status: 'available' | 'future';
}

/** The item-model concepts, explained in one place. */
export const RUNTIME_INVENTORY_CONCEPTS: InventoryConcept[] = [
  {
    id: 'itemDefinition',
    label: 'ItemDefinition（物品模板）',
    description: '描述物品“是什么”，例如长剑、治疗药水、Kevlar 护甲。可复用，不属于任何人。',
    status: 'available',
  },
  {
    id: 'itemInstance',
    label: 'ItemInstance（物品实例）',
    description: '某个角色实际拥有的那一件，携带数量、来源、状态、损耗、附魔、备注。',
    status: 'future',
  },
  {
    id: 'inventoryContainer',
    label: 'InventoryContainer（容器）',
    description: '背包、钱袋、装备栏、战利品箱、战役奖励池等物品集合。',
    status: 'future',
  },
  {
    id: 'equipmentSlot',
    label: 'EquipmentSlot（装备槽位）',
    description: '角色身上的槽位，例如主手、副手、护甲、饰品、常服。',
    status: 'future',
  },
  {
    id: 'inventoryChangeEvent',
    label: 'InventoryChangeEvent（物品变化事件）',
    description: '获得、失去、消耗、装备、卸下、损坏、修复、转移等事件；当前以日志形式记录。',
    status: 'available',
  },
  {
    id: 'campaignActorInventory',
    label: 'CampaignActorInventory（战役内背包）',
    description: '未来战役内的权威背包，保存获得、消耗、损坏、交易、掉落等变化。',
    status: 'future',
  },
];

// ── Ownership boundary (M54) ─────────────────────────────────────────────────

export interface InventoryOwnershipTier {
  id: 'vaultInventory' | 'roomEquipmentView' | 'campaignInventoryInstance';
  label: string;
  description: string;
  status: 'available' | 'future';
}

export const RUNTIME_INVENTORY_OWNERSHIP_TIERS: InventoryOwnershipTier[] = [
  {
    id: 'vaultInventory',
    label: '角色库背包',
    description: '角色原件中的物品记录，可自由编辑，但不是战役权威。',
    status: 'available',
  },
  {
    id: 'roomEquipmentView',
    label: '当前房间装备视图',
    description: 'Runtime 中展示的只读装备 / 背包摘要，仅供本场查看。',
    status: 'available',
  },
  {
    id: 'campaignInventoryInstance',
    label: '战役内背包实例',
    description: '未来 CampaignActorInstance 中的权威物品状态，保存获得 / 消耗 / 装备 / 结算变化。',
    status: 'future',
  },
];

export const RUNTIME_INVENTORY_CAVEAT =
  '本场的物品 / 装备变化记录会进入日志与回顾，不会自动修改角色库原件；战役内背包实例将在后续版本用于保存这些变化。';

// ── Change-event contract (M56) ──────────────────────────────────────────────
//
// Reuses the existing state.manualChange RuntimeLog event; these are the payload
// fields a future inventory-aware recorder will set (all optional, all display).

export type InventoryChangeKind = 'condition' | 'inventory' | 'equipment' | 'resource' | 'note';

export type InventoryActionLabel =
  | '获得'
  | '消耗'
  | '装备'
  | '卸下'
  | '损坏'
  | '修复'
  | '转移'
  | '其他';

/** Localized labels for the manual-change kind chooser (M56). */
export const INVENTORY_CHANGE_KIND_OPTIONS: { id: InventoryChangeKind; label: string }[] = [
  { id: 'condition', label: '状态变化' },
  { id: 'inventory', label: '物品变化' },
  { id: 'equipment', label: '装备变化' },
  { id: 'resource', label: '资源变化' },
  { id: 'note', label: '其他记录' },
];

export const INVENTORY_ACTION_LABELS: InventoryActionLabel[] = [
  '获得', '消耗', '装备', '卸下', '损坏', '修复', '转移', '其他',
];

/**
 * The forward-looking manual-change payload shape (documented, not enforced).
 * Written onto the existing state.manualChange event's payload; extra fields are
 * ignored by older readers, so this stays backward compatible.
 */
export interface RuntimeManualChangePayloadV1 {
  noteKind: 'manualState';
  changeKind?: InventoryChangeKind;
  targetName?: string;
  itemLabel?: string;
  actionLabel?: InventoryActionLabel | string;
  body?: string;
}
