import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  CharacterInventoryItem,
  InventoryItemLocation,
} from './characterInventory';

/**
 * Character Inventory persistence (platform-local store).
 *
 * AI-LANDMARK: CHARACTER_INVENTORY_PERSISTENCE_V1
 *
 * Persists per-actor owned inventory item INSTANCES, keyed by
 * `${systemId}:${actorId}` (see makeActorInventoryKey). This is a dedicated
 * platform-local store (like campaignLocalStore / runtimeLogLocalStore), so it:
 * - does NOT modify DND / COC / CP RED character schemas or migrations,
 * - is backward compatible (an actor with no entry resolves to an empty list),
 * - does NOT touch ActorVault character export/import, Runtime, Campaign, or
 *   gameplay. These are character-profile maintenance items, not runtime actions.
 *
 * No attacks, purchases, equips with stat effects, AC math, money settlement,
 * cyberware Humanity loss, or RuntimeLog writes happen here.
 */

export const CHARACTER_INVENTORY_STORE_KEY = 'platform-character-inventory-store';
export const CHARACTER_INVENTORY_STORE_SCHEMA_VERSION = 1;

export type CharacterInventoryItemPatch = Partial<
  Pick<CharacterInventoryItem, 'name' | 'quantity' | 'location' | 'notes' | 'category' | 'cost'>
>;

interface CharacterInventoryStoreState {
  schemaVersion: number;
  /** Owned items keyed by `${systemId}:${actorId}`. */
  itemsByActor: Record<string, CharacterInventoryItem[]>;
  getActorInventory: (actorKey: string) => CharacterInventoryItem[];
  setActorInventory: (actorKey: string, items: CharacterInventoryItem[]) => void;
  addInventoryItem: (actorKey: string, item: CharacterInventoryItem) => void;
  updateInventoryItem: (actorKey: string, instanceId: string, patch: CharacterInventoryItemPatch) => void;
  removeInventoryItem: (actorKey: string, instanceId: string) => void;
  setInventoryItemLocation: (actorKey: string, instanceId: string, location: InventoryItemLocation) => void;
  clearActorInventoryForDev: (actorKey: string) => void;
}

function mapActorItems(
  state: CharacterInventoryStoreState,
  actorKey: string,
  mapper: (items: CharacterInventoryItem[]) => CharacterInventoryItem[],
): Record<string, CharacterInventoryItem[]> {
  const current = state.itemsByActor[actorKey] ?? [];
  return { ...state.itemsByActor, [actorKey]: mapper(current) };
}

export const useCharacterInventoryStore = create<CharacterInventoryStoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: CHARACTER_INVENTORY_STORE_SCHEMA_VERSION,
      itemsByActor: {},

      getActorInventory: (actorKey) => get().itemsByActor[actorKey] ?? [],

      setActorInventory: (actorKey, items) =>
        set((state) => ({ itemsByActor: { ...state.itemsByActor, [actorKey]: items } })),

      addInventoryItem: (actorKey, item) =>
        set((state) => ({ itemsByActor: mapActorItems(state, actorKey, (items) => [...items, item]) })),

      updateInventoryItem: (actorKey, instanceId, patch) =>
        set((state) => ({
          itemsByActor: mapActorItems(state, actorKey, (items) =>
            items.map((item) =>
              item.instanceId === instanceId
                ? {
                    ...item,
                    ...patch,
                    quantity:
                      patch.quantity !== undefined ? Math.max(1, Math.floor(patch.quantity)) : item.quantity,
                  }
                : item,
            ),
          ),
        })),

      removeInventoryItem: (actorKey, instanceId) =>
        set((state) => ({
          itemsByActor: mapActorItems(state, actorKey, (items) =>
            items.filter((item) => item.instanceId !== instanceId),
          ),
        })),

      setInventoryItemLocation: (actorKey, instanceId, location) =>
        set((state) => ({
          itemsByActor: mapActorItems(state, actorKey, (items) =>
            items.map((item) => (item.instanceId === instanceId ? { ...item, location } : item)),
          ),
        })),

      clearActorInventoryForDev: (actorKey) =>
        set((state) => {
          const next = { ...state.itemsByActor };
          delete next[actorKey];
          return { itemsByActor: next };
        }),
    }),
    {
      name: CHARACTER_INVENTORY_STORE_KEY,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        itemsByActor: state.itemsByActor,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{ schemaVersion: unknown; itemsByActor: unknown }> | null;
        if (!p || typeof p !== 'object' || !p.itemsByActor || typeof p.itemsByActor !== 'object') {
          return current;
        }
        return {
          ...current,
          schemaVersion: CHARACTER_INVENTORY_STORE_SCHEMA_VERSION,
          itemsByActor: p.itemsByActor as Record<string, CharacterInventoryItem[]>,
        };
      },
    },
  ),
);
