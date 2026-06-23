import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  CharacterCoinPurse,
  CharacterInventoryContainer,
  CharacterInventoryItem,
  EquipmentSlot,
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
  Pick<
    CharacterInventoryItem,
    'name' | 'quantity' | 'location' | 'notes' | 'category' | 'cost' | 'weight' | 'weightUnit' | 'containerId' | 'tags' | 'equipSlot'
  >
>;

export type CharacterInventoryContainerPatch = Partial<
  Pick<
    CharacterInventoryContainer,
    'name' | 'type' | 'location' | 'capacityWeight' | 'weight' | 'weightUnit' | 'ignoresContentWeightForCarrier' | 'notes'
  >
>;

interface CharacterInventoryStoreState {
  schemaVersion: number;
  /** Owned items keyed by `${systemId}:${actorId}`. */
  itemsByActor: Record<string, CharacterInventoryItem[]>;
  /** Owned containers keyed by `${systemId}:${actorId}`. */
  containersByActor: Record<string, CharacterInventoryContainer[]>;
  /** Per-actor coin purse keyed by `${systemId}:${actorId}`. */
  walletByActor: Record<string, CharacterCoinPurse>;
  getActorWallet: (actorKey: string) => CharacterCoinPurse;
  setActorWalletCoin: (actorKey: string, coin: string, amount: number) => void;
  getActorInventory: (actorKey: string) => CharacterInventoryItem[];
  setActorInventory: (actorKey: string, items: CharacterInventoryItem[]) => void;
  addInventoryItem: (actorKey: string, item: CharacterInventoryItem) => void;
  updateInventoryItem: (actorKey: string, instanceId: string, patch: CharacterInventoryItemPatch) => void;
  removeInventoryItem: (actorKey: string, instanceId: string) => void;
  setInventoryItemLocation: (actorKey: string, instanceId: string, location: InventoryItemLocation) => void;
  setInventoryItemContainer: (actorKey: string, instanceId: string, containerId: string | undefined) => void;
  /** Equip to a slot (clears containerId), or unequip when slot is undefined. */
  setInventoryItemSlot: (actorKey: string, instanceId: string, slot: EquipmentSlot | undefined) => void;
  getActorContainers: (actorKey: string) => CharacterInventoryContainer[];
  addInventoryContainer: (actorKey: string, container: CharacterInventoryContainer) => void;
  updateInventoryContainer: (actorKey: string, containerId: string, patch: CharacterInventoryContainerPatch) => void;
  removeInventoryContainer: (actorKey: string, containerId: string) => void;
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

function mapActorContainers(
  state: CharacterInventoryStoreState,
  actorKey: string,
  mapper: (containers: CharacterInventoryContainer[]) => CharacterInventoryContainer[],
): Record<string, CharacterInventoryContainer[]> {
  const current = state.containersByActor[actorKey] ?? [];
  return { ...state.containersByActor, [actorKey]: mapper(current) };
}

export const useCharacterInventoryStore = create<CharacterInventoryStoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: CHARACTER_INVENTORY_STORE_SCHEMA_VERSION,
      itemsByActor: {},
      containersByActor: {},
      walletByActor: {},

      getActorWallet: (actorKey) => get().walletByActor[actorKey] ?? {},

      setActorWalletCoin: (actorKey, coin, amount) =>
        set((state) => ({
          walletByActor: {
            ...state.walletByActor,
            [actorKey]: { ...(state.walletByActor[actorKey] ?? {}), [coin]: Math.max(0, Math.floor(amount) || 0) },
          },
        })),

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
            items.map((item) =>
              item.instanceId === instanceId
                ? { ...item, location, containerId: location === 'container' ? item.containerId : undefined }
                : item,
            ),
          ),
        })),

      setInventoryItemContainer: (actorKey, instanceId, containerId) =>
        set((state) => ({
          itemsByActor: mapActorItems(state, actorKey, (items) =>
            items.map((item) =>
              item.instanceId === instanceId
                ? {
                    ...item,
                    containerId,
                    location: containerId ? 'container' : item.location === 'container' ? 'backpack' : item.location,
                  }
                : item,
            ),
          ),
        })),

      setInventoryItemSlot: (actorKey, instanceId, slot) =>
        set((state) => ({
          itemsByActor: mapActorItems(state, actorKey, (items) =>
            items.map((item) =>
              item.instanceId === instanceId
                ? { ...item, equipSlot: slot, containerId: slot ? undefined : item.containerId }
                : item,
            ),
          ),
        })),

      getActorContainers: (actorKey) => get().containersByActor[actorKey] ?? [],

      addInventoryContainer: (actorKey, container) =>
        set((state) => ({
          containersByActor: mapActorContainers(state, actorKey, (containers) => [...containers, container]),
        })),

      updateInventoryContainer: (actorKey, containerId, patch) =>
        set((state) => ({
          containersByActor: mapActorContainers(state, actorKey, (containers) =>
            containers.map((container) =>
              container.containerId === containerId ? { ...container, ...patch } : container,
            ),
          ),
        })),

      removeInventoryContainer: (actorKey, containerId) =>
        set((state) => ({
          containersByActor: mapActorContainers(state, actorKey, (containers) =>
            containers.filter((container) => container.containerId !== containerId),
          ),
          // Detach items from the removed container (move back to backpack).
          itemsByActor: mapActorItems(state, actorKey, (items) =>
            items.map((item) =>
              item.containerId === containerId
                ? { ...item, containerId: undefined, location: 'backpack' as const }
                : item,
            ),
          ),
        })),

      clearActorInventoryForDev: (actorKey) =>
        set((state) => {
          const nextItems = { ...state.itemsByActor };
          const nextContainers = { ...state.containersByActor };
          delete nextItems[actorKey];
          delete nextContainers[actorKey];
          return { itemsByActor: nextItems, containersByActor: nextContainers };
        }),
    }),
    {
      name: CHARACTER_INVENTORY_STORE_KEY,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        itemsByActor: state.itemsByActor,
        containersByActor: state.containersByActor,
        walletByActor: state.walletByActor,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{
          schemaVersion: unknown;
          itemsByActor: unknown;
          containersByActor: unknown;
          walletByActor: unknown;
        }> | null;
        if (!p || typeof p !== 'object' || !p.itemsByActor || typeof p.itemsByActor !== 'object') {
          return current;
        }
        return {
          ...current,
          schemaVersion: CHARACTER_INVENTORY_STORE_SCHEMA_VERSION,
          itemsByActor: p.itemsByActor as Record<string, CharacterInventoryItem[]>,
          containersByActor:
            p.containersByActor && typeof p.containersByActor === 'object'
              ? (p.containersByActor as Record<string, CharacterInventoryContainer[]>)
              : {},
          walletByActor:
            p.walletByActor && typeof p.walletByActor === 'object'
              ? (p.walletByActor as Record<string, CharacterCoinPurse>)
              : {},
        };
      },
    },
  ),
);
