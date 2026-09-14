/**
 * Multi-System Inventory / Backpack foundation (view-model only).
 *
 * AI-LANDMARK: CHARACTER_INVENTORY_FOUNDATION_V1
 *
 * Cross-system, minimal owned-item model shared by DND / COC / CP RED sheets.
 * This is a presentation/view-model layer only:
 * - A `CharacterInventoryItem` is an OWNED INSTANCE (instanceId), distinct from
 *   a rule catalog / source item (`sourceItemId`). Catalog row != owned item.
 * - Equipped/worn/installed/carried state is a `location` flag on the instance,
 *   NOT a runtime action. No attacks, purchases, installs, AC math, or money
 *   settlement happen here.
 * - It does NOT add store fields/schema and writes no RuntimeLog. Sheets build
 *   these view-models from their existing fields via adapters; a real unified
 *   inventory store/migration is future work.
 */

export type InventorySystemId = 'dnd5e-2024' | 'coc7e' | 'cp-red';

export type InventoryItemCategory =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'gear'
  | 'tool'
  | 'consumable'
  | 'container'
  | 'cyberware'
  | 'fashion'
  | 'currency'
  | 'misc';

export type InventoryItemLocation =
  | 'backpack'
  | 'equipped'
  | 'worn'
  | 'installed'
  | 'carried'
  | 'stored'
  | 'container'
  | 'base-storage';

export type InventoryWeightUnit = 'lb' | 'kg';

export type EquipmentLoadout = 'combat' | 'casual';

export type EquipmentSlot =
  | 'helmet'
  | 'cloak'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'utility'
  | 'mainHand'
  | 'offHand'
  | 'amulet'
  | 'ring1'
  | 'ring2'
  | 'instrument'
  | 'casualHeadwear'
  | 'casualOuterwear'
  | 'casualClothing'
  | 'casualPants'
  | 'casualShoes'
  | 'casualAccessory'
  | 'undergarment'
  | 'other';

/** Combat-gear slots, ordered head → feet → hands → accessories. */
export const COMBAT_SLOT_ORDER: EquipmentSlot[] = [
  'helmet', 'cloak', 'armor', 'gloves', 'boots', 'utility', 'mainHand', 'offHand',
];
export const ACCESSORY_SLOT_ORDER: EquipmentSlot[] = ['amulet', 'ring1', 'ring2', 'instrument'];
export const CASUAL_SLOT_ORDER: EquipmentSlot[] = [
  'casualHeadwear', 'casualOuterwear', 'casualClothing', 'casualPants', 'casualShoes', 'casualAccessory', 'undergarment',
];

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  helmet: '头盔 Helmet',
  cloak: '披风 Cloak',
  armor: '盔甲 Armor',
  gloves: '手套 Gloves',
  boots: '靴子 Boots',
  utility: '工具 / 光源 Utility',
  mainHand: '主手 Main Hand',
  offHand: '副手 Off Hand',
  amulet: '项链 Amulet',
  ring1: '戒指 Ring 1',
  ring2: '戒指 Ring 2',
  instrument: '乐器 Instrument',
  casualHeadwear: '常服头饰 Headwear',
  casualOuterwear: '外套 / 披肩 Outerwear',
  casualClothing: '上衣 / 衣服 Clothing',
  casualPants: '下装 Pants',
  casualShoes: '鞋子 Shoes',
  casualAccessory: '常服饰品 Accessory',
  undergarment: '贴身衣物 Undergarment',
  other: '其他 Other',
};

const CASUAL_SLOTS = new Set<EquipmentSlot>(CASUAL_SLOT_ORDER);

/** Which loadout a slot belongs to. */
export function loadoutForSlot(slot: EquipmentSlot): EquipmentLoadout {
  return CASUAL_SLOTS.has(slot) ? 'casual' : 'combat';
}

/** Heuristic: does a legacy equipment summary line contain "choose one of" phrasing? */
export function legacyTextHasChoice(text: string): boolean {
  return /(\bor\b|或|任意|任选|二选|选择其一)/i.test(text);
}

export type InventoryContainerType =
  | 'backpack'
  | 'pouch'
  | 'bag-of-holding'
  | 'chest'
  | 'base-storage'
  | 'custom';

export type InventoryContainerLocation = 'carried' | 'stored' | 'base-storage';

export interface CharacterInventoryItem {
  /** Unique id for this owned instance. */
  instanceId: string;
  systemId: InventorySystemId;
  /** Optional reference to the catalog / rule source item this was created from. */
  sourceItemId?: string;
  name: string;
  category: InventoryItemCategory;
  location: InventoryItemLocation;
  quantity: number;
  /** Per-unit weight (multiply by quantity for total). */
  weight?: number;
  weightUnit?: InventoryWeightUnit;
  /** When set, the item lives inside this container (overrides loose location grouping). */
  containerId?: string;
  /** When set, the item is equipped to a body/outfit slot (platform state only; no rule effect). */
  equipSlot?: EquipmentSlot;
  /** Identity by reference to a system ItemDefinition (preferred over name). */
  definitionId?: string;
  /** Sourcing state of the item's data, mirrored from its definition when known. */
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
  /** Provenance for generated items (e.g. resolved from a starter-equipment summary). */
  origin?: {
    type:
      | 'starter-equipment'
      | 'background'
      | 'class'
      | 'manual-import'
      | 'campaign-reward'
      | 'shop-purchase'
      | 'workshop-package'
      | 'custom'
      | 'migration'
      | 'manual'
      | 'import';
    sourceText?: string;
    resolvedFrom?: string;
    /** True when the item is a real instance whose stats are not yet sourced. */
    pending?: boolean;
  };
  cost?: string;
  notes?: string;
  tags?: string[];
  /** System-specific extra display data (read-only). */
  systemData?: Record<string, unknown>;
}

export interface CharacterInventoryContainer {
  containerId: string;
  systemId: InventorySystemId;
  name: string;
  type: InventoryContainerType;
  location: InventoryContainerLocation;
  /** Optional max content weight the container can hold. */
  capacityWeight?: number;
  /** Own (empty) weight of the container. */
  weight?: number;
  weightUnit?: InventoryWeightUnit;
  /**
   * Bag-of-holding style: its CONTENT weight does not count toward the carrier's
   * encumbrance (the container's own weight still does). Display-only flag; no
   * runtime magic effect is implemented.
   */
  ignoresContentWeightForCarrier?: boolean;
  notes?: string;
}

export interface CharacterInventoryGroup {
  id: string;
  label: string;
  /** Locations this group represents. */
  locations: InventoryItemLocation[];
  items: CharacterInventoryItem[];
}

export const INVENTORY_LOCATION_LABELS: Record<InventoryItemLocation, string> = {
  backpack: '背包 Backpack',
  equipped: '已装备 Equipped',
  worn: '已穿戴 Worn',
  installed: '已安装 Installed',
  carried: '携带 Carried',
  stored: '存放 Stored',
  container: '容器内 In container',
  'base-storage': '据点仓库 Base Storage',
};

export const INVENTORY_CONTAINER_TYPE_LABELS: Record<InventoryContainerType, string> = {
  backpack: '背包 Backpack',
  pouch: '袋囊 Pouch',
  'bag-of-holding': '次元袋 Bag of Holding',
  chest: '箱柜 Chest',
  'base-storage': '据点仓库 Base Storage',
  custom: '自定义 Custom',
};

export const INVENTORY_CONTAINER_TYPE_ORDER: InventoryContainerType[] = [
  'backpack',
  'pouch',
  'bag-of-holding',
  'chest',
  'base-storage',
  'custom',
];

export const INVENTORY_CONTAINER_LOCATION_LABELS: Record<InventoryContainerLocation, string> = {
  carried: '携带 Carried',
  stored: '存放 Stored',
  'base-storage': '据点仓库 Base Storage',
};

export const INVENTORY_CONTAINER_LOCATION_ORDER: InventoryContainerLocation[] = [
  'carried',
  'stored',
  'base-storage',
];

export const INVENTORY_CATEGORY_LABELS: Record<InventoryItemCategory, string> = {
  weapon: '武器 Weapon',
  armor: '护甲 Armor',
  shield: '盾牌 Shield',
  gear: '装备 Gear',
  tool: '工具 Tool',
  consumable: '消耗品 Consumable',
  container: '容器 Container',
  cyberware: '义体 Cyberware',
  fashion: '服饰 Fashion',
  currency: '货币 Currency',
  misc: '其他 Misc',
};

let inventoryInstanceCounter = 0;

/** Stable-enough instance id for view-model items (not persisted). */
export function makeInventoryInstanceId(prefix = 'inv'): string {
  inventoryInstanceCounter += 1;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${inventoryInstanceCounter}`;
}

export function makeInventoryItem(input: {
  systemId: InventorySystemId;
  name: string;
  category: InventoryItemCategory;
  location: InventoryItemLocation;
  quantity?: number;
  sourceItemId?: string;
  definitionId?: string;
  sourceStatus?: CharacterInventoryItem['sourceStatus'];
  weight?: number;
  weightUnit?: InventoryWeightUnit;
  containerId?: string;
  cost?: string;
  notes?: string;
  tags?: string[];
  systemData?: Record<string, unknown>;
  origin?: CharacterInventoryItem['origin'];
}): CharacterInventoryItem {
  return {
    instanceId: makeInventoryInstanceId(input.category),
    systemId: input.systemId,
    sourceItemId: input.sourceItemId,
    definitionId: input.definitionId,
    sourceStatus: input.sourceStatus,
    name: input.name,
    category: input.category,
    location: input.location,
    quantity: input.quantity ?? 1,
    weight: input.weight,
    weightUnit: input.weightUnit,
    containerId: input.containerId,
    cost: input.cost,
    notes: input.notes,
    tags: input.tags,
    systemData: input.systemData,
    origin: input.origin,
  };
}

// ── Legacy starter-summary detection / quarantine ───────────────────────────
// A class "starter equipment" summary (e.g. "细剑 或 长剑 …，皮甲，匕首") is a
// RULE PLAN, not an item. If such a string ever ended up as an InventoryItem
// (legacy data), these detectors flag it so the view-model can quarantine it
// WITHOUT deleting user data. Real pending-source items (single named item with
// a definitionId / resolvedFrom / pending status) are never flagged.

/** Heuristic: does a string look like a multi-item starter-equipment summary? */
export function isLegacyStarterSummaryText(text: string | undefined): boolean {
  const s = (text ?? '').trim();
  if (!s) return false;
  // Choice phrasing ("A 或 B", "任选", "or") is a strong signal.
  if (/[^\s，,、;；]+\s*或\s*[^\s，,、;；]+/.test(s)) return true;
  if (legacyTextHasChoice(s)) return true;
  // Sentence-like with several comma/separator-delimited terms.
  const parts = s.split(/[，,、;；]/).map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 3) return true;
  if (parts.length >= 2 && s.length >= 14) return true;
  return false;
}

/**
 * Is this owned item actually a legacy fake "summary" item (to be quarantined)?
 * Protects real items: anything with a definitionId, a pending-source status,
 * or an origin.resolvedFrom is treated as a genuine instance, never quarantined.
 */
export function isLegacyStarterSummaryItem(item: CharacterInventoryItem): boolean {
  if (item.definitionId) return false;
  if (item.sourceStatus === 'pending-source') return false;
  if (item.origin?.resolvedFrom) return false;
  return isLegacyStarterSummaryText(item.name);
}

// ── Starter-equipment summary parsing ───────────────────────────────────────
// Pure text parsing only. It does NOT invent rule values; it splits a summary
// string into choice groups ("A 或 B") and fixed items ("匕首 ×3"). Resolution
// to real catalog stats happens in the system layer (e.g. dndStarterEquipment).

export interface StarterChoiceOption {
  name: string;
  quantity: number;
  /** Vague option such as "任意简易武器" — cannot be auto-resolved. */
  vague: boolean;
}
export interface StarterChoiceGroup {
  id: string;
  options: StarterChoiceOption[];
}
export interface StarterFixedItem {
  name: string;
  quantity: number;
}
export interface ParsedStarterEquipment {
  groups: StarterChoiceGroup[];
  fixed: StarterFixedItem[];
  raw: string;
  /** True when the summary contained choice phrasing (needs a selection). */
  hasChoices: boolean;
}

const STARTER_QUANTITY_WORDS: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function readStarterItemQuantity(segment: string): { name: string; quantity: number } {
  const suffix = segment.match(/[×xX*]\s*(\d+)\s*$/);
  if (suffix && suffix.index !== undefined) {
    return {
      name: segment.slice(0, suffix.index).trim(),
      quantity: Math.max(1, parseInt(suffix[1], 10) || 1),
    };
  }

  // Owner-source summaries also use natural Chinese counters, for example
  // `两把匕首` and `4根标枪`. Strip only an explicit leading count + counter;
  // embedded counts such as `短弓及20支箭` remain one unresolved bundle.
  const prefix = segment.match(/^(?:(\d+)|([一二两三四五六七八九十]))\s*(?:把|根|支|个|件|套|枚|柄|张|本|瓶|卷|束)\s*(.+)$/);
  if (!prefix) return { name: segment, quantity: 1 };
  const quantity = prefix[1]
    ? Math.max(1, parseInt(prefix[1], 10) || 1)
    : STARTER_QUANTITY_WORDS[prefix[2]] ?? 1;
  return { name: prefix[3].trim(), quantity };
}

export function parseStarterEquipment(text: string): ParsedStarterEquipment {
  const raw = (text ?? '').trim();
  const normalized = raw.replace(/[、；;]/g, '，').replace(/\s*,\s*/g, '，');
  const segments = normalized.split('，').map((s) => s.trim()).filter(Boolean);
  const groups: StarterChoiceGroup[] = [];
  const fixed: StarterFixedItem[] = [];
  let gi = 0;
  for (const seg of segments) {
    if (/或|任选|二选|选择其一|\bor\b/i.test(seg)) {
      const options = seg
        .split(/或者|或|\bor\b/i)
        .map((o) => o.trim())
        .filter(Boolean)
        .map((option) => {
          const { name, quantity } = readStarterItemQuantity(option);
          return { name, quantity, vague: /任意|任选|any/i.test(name) };
        });
      if (options.length > 1) groups.push({ id: `g${gi++}`, options });
      else if (options[0]) fixed.push({ name: options[0].name, quantity: options[0].quantity });
    } else {
      const { name, quantity } = readStarterItemQuantity(seg);
      if (name) fixed.push({ name, quantity });
    }
  }
  return { groups, fixed, raw, hasChoices: groups.length > 0 };
}

/** Split items into the canonical "owned but not equipped" vs "equipped-ish" groups. */
export function splitInventoryGroups(items: CharacterInventoryItem[]): {
  backpack: CharacterInventoryItem[];
  equipped: CharacterInventoryItem[];
} {
  const backpackLocations: InventoryItemLocation[] = ['backpack', 'stored'];
  const backpack = items.filter((item) => backpackLocations.includes(item.location));
  const equipped = items.filter((item) => !backpackLocations.includes(item.location));
  return { backpack, equipped };
}

/** Group items by location, preserving a stable display order. */
export function groupInventoryByLocation(items: CharacterInventoryItem[]): CharacterInventoryGroup[] {
  const order: InventoryItemLocation[] = [
    'equipped',
    'worn',
    'installed',
    'carried',
    'backpack',
    'container',
    'stored',
    'base-storage',
  ];
  return order
    .map((location) => ({
      id: location,
      label: INVENTORY_LOCATION_LABELS[location],
      locations: [location] as InventoryItemLocation[],
      items: items.filter((item) => item.location === location),
    }))
    .filter((group) => group.items.length > 0);
}

/** Ordered locations for selection controls. */
export const INVENTORY_LOCATION_ORDER: InventoryItemLocation[] = [
  'backpack',
  'carried',
  'equipped',
  'worn',
  'installed',
  'stored',
  'base-storage',
];

/** Ordered categories for selection controls. */
export const INVENTORY_CATEGORY_ORDER: InventoryItemCategory[] = [
  'weapon',
  'armor',
  'shield',
  'gear',
  'tool',
  'consumable',
  'container',
  'cyberware',
  'fashion',
  'currency',
  'misc',
];

/**
 * Stable persistence key for a character's owned platform inventory.
 * Combines system + actor so different systems / characters stay separate.
 */
export function makeActorInventoryKey(systemId: InventorySystemId, actorId: string): string {
  return `${systemId}:${actorId}`;
}

/** DND coin denominations (display + local wallet). No auto-conversion or settlement. */
export type DndCoinCode = 'pp' | 'gp' | 'ep' | 'sp' | 'cp';
export const DND_CURRENCY_ORDER: DndCoinCode[] = ['pp', 'gp', 'ep', 'sp', 'cp'];
export const DND_CURRENCY_LABELS: Record<DndCoinCode, string> = {
  pp: '铂金 PP',
  gp: '金币 GP',
  ep: '银金 EP',
  sp: '银币 SP',
  cp: '铜币 CP',
};
/** A simple coin purse keyed by denomination. */
export type CharacterCoinPurse = Partial<Record<string, number>>;

export function makeInventoryContainer(input: {
  systemId: InventorySystemId;
  name: string;
  type: InventoryContainerType;
  location: InventoryContainerLocation;
  capacityWeight?: number;
  weight?: number;
  weightUnit?: InventoryWeightUnit;
  ignoresContentWeightForCarrier?: boolean;
  notes?: string;
}): CharacterInventoryContainer {
  return {
    containerId: makeInventoryInstanceId('container'),
    systemId: input.systemId,
    name: input.name,
    type: input.type,
    location: input.location,
    capacityWeight: input.capacityWeight,
    weight: input.weight,
    weightUnit: input.weightUnit,
    ignoresContentWeightForCarrier:
      input.ignoresContentWeightForCarrier ?? input.type === 'bag-of-holding',
    notes: input.notes,
  };
}

/** Per-instance total weight (per-unit weight × quantity). */
export function itemTotalWeight(item: CharacterInventoryItem): number {
  return (item.weight ?? 0) * Math.max(1, item.quantity ?? 1);
}

export interface InventoryWeightSummary {
  /** Sum of all item total weights (every location). */
  itemTotalWeight: number;
  /** Weight physically carried (loose carried/backpack/equipped/worn + carried containers, naive). */
  carriedWeight: number;
  equippedWeight: number;
  wornWeight: number;
  /** installed (e.g. cyberware) — tracked separately; not counted toward carried by default. */
  installedWeight: number;
  /** stored + base-storage (not carried). */
  storedWeight: number;
  /** Content weight per container id. */
  containerContentWeight: Record<string, number>;
  /** Carried weight after bag-of-holding reductions (encumbrance-relevant). */
  effectiveCarriedWeight: number;
  unit: InventoryWeightUnit;
}

const CARRIED_ITEM_LOCATIONS: InventoryItemLocation[] = ['backpack', 'carried', 'equipped', 'worn'];
const STORED_ITEM_LOCATIONS: InventoryItemLocation[] = ['stored', 'base-storage'];

/**
 * GENERIC, cross-system weight summary. Pure data aggregation only — it does NOT
 * apply any system's encumbrance rule, capacity, or status. COC / CP RED use
 * only this; DND additionally calls calculateDndEncumbrance for interpretation.
 */
export function calculateInventoryWeight(
  items: CharacterInventoryItem[],
  containers: CharacterInventoryContainer[] = [],
): InventoryWeightSummary {
  const containerById = new Map(containers.map((c) => [c.containerId, c]));
  const containerContentWeight: Record<string, number> = {};

  let itemTotal = 0;
  let carried = 0;
  let equipped = 0;
  let worn = 0;
  let installed = 0;
  let stored = 0;

  for (const item of items) {
    const total = itemTotalWeight(item);
    itemTotal += total;

    if (item.containerId && containerById.has(item.containerId)) {
      containerContentWeight[item.containerId] = (containerContentWeight[item.containerId] ?? 0) + total;
      continue; // container contribution handled below
    }

    if (item.location === 'equipped') equipped += total;
    if (item.location === 'worn') worn += total;
    if (item.location === 'installed') {
      installed += total;
      continue;
    }
    if (CARRIED_ITEM_LOCATIONS.includes(item.location)) carried += total;
    else if (STORED_ITEM_LOCATIONS.includes(item.location)) stored += total;
    else carried += total; // 'container' with no resolved container -> treat as carried
  }

  // Container own-weight + content contributions.
  let effectiveCarried = carried;
  for (const container of containers) {
    const own = container.weight ?? 0;
    const content = containerContentWeight[container.containerId] ?? 0;
    if (container.location === 'carried') {
      carried += own + content;
      effectiveCarried += own + (container.ignoresContentWeightForCarrier ? 0 : content);
    } else {
      stored += own + content;
    }
  }

  return {
    itemTotalWeight: round1(itemTotal),
    carriedWeight: round1(carried),
    equippedWeight: round1(equipped),
    wornWeight: round1(worn),
    installedWeight: round1(installed),
    storedWeight: round1(stored),
    containerContentWeight,
    effectiveCarriedWeight: round1(effectiveCarried),
    unit: 'lb',
  };
}

export type InventoryEncumbranceStatus =
  | 'normal'
  | 'near-limit'
  | 'overloaded'
  | 'unknown';

export interface DndEncumbranceResult {
  weight: InventoryWeightSummary;
  /** Carrying capacity ONLY when a sourced rule is supplied; otherwise undefined. */
  capacityWeight?: number;
  status: InventoryEncumbranceStatus;
  /** Human note about the rule source state. */
  capacityRuleSource: string;
}

/**
 * DND-ONLY encumbrance interpretation. This is intentionally separate so COC /
 * CP RED never inherit a DND carrying-capacity rule.
 *
 * No DND carrying-capacity formula source is wired in this project, so by
 * default capacityWeight is undefined and status is 'unknown' (rule pending).
 * A caller may pass an explicitly-sourced capacityWeight to enable status.
 */
export function calculateDndEncumbrance(
  weight: InventoryWeightSummary,
  options: { capacityWeight?: number; nearLimitRatio?: number } = {},
): DndEncumbranceResult {
  const capacityWeight = options.capacityWeight;
  const nearRatio = options.nearLimitRatio ?? 0.85;
  let status: InventoryEncumbranceStatus;
  if (capacityWeight === undefined || capacityWeight <= 0) {
    status = 'unknown';
  } else if (weight.effectiveCarriedWeight > capacityWeight) {
    status = 'overloaded';
  } else if (weight.effectiveCarriedWeight >= capacityWeight * nearRatio) {
    status = 'near-limit';
  } else {
    status = 'normal';
  }
  return {
    weight,
    capacityWeight,
    status,
    capacityRuleSource:
      capacityWeight === undefined
        ? 'DND carrying capacity rule source pending'
        : 'caller-supplied capacity',
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
