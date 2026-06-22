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
  | 'stored';

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
  weight?: number;
  cost?: string;
  notes?: string;
  tags?: string[];
  /** System-specific extra display data (read-only). */
  systemData?: Record<string, unknown>;
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
};

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
  weight?: number;
  cost?: string;
  notes?: string;
  tags?: string[];
  systemData?: Record<string, unknown>;
}): CharacterInventoryItem {
  return {
    instanceId: makeInventoryInstanceId(input.category),
    systemId: input.systemId,
    sourceItemId: input.sourceItemId,
    name: input.name,
    category: input.category,
    location: input.location,
    quantity: input.quantity ?? 1,
    weight: input.weight,
    cost: input.cost,
    notes: input.notes,
    tags: input.tags,
    systemData: input.systemData,
  };
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
    'stored',
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
