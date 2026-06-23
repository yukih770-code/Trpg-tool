import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  equipOutfitPiece,
  replaceOutfitPiece,
  unequipOutfitPiece,
} from '../dnd2024/dndOutfitService';
import { getOutfitPieceDefinition } from '../dnd2024/dndOutfitDefinitions';
import type {
  OutfitLoadout,
  OutfitPieceInstance,
  OutfitResult,
  OutfitSlotKey,
  OutfitTemplate,
  Wardrobe,
} from '../dnd2024/dndOutfitTypes';

/**
 * Character Wardrobe persistence (platform-local store).
 *
 * AI-LANDMARK: CHARACTER_WARDROBE_STORE_V1
 *
 * Persists each actor's casual-clothing wardrobe + current outfit loadout, keyed
 * by `${systemId}:${actorId}` (same pattern as characterInventoryStore) but in a
 * SEPARATE persist key. This is fully independent of:
 *   - character.inventory / the backpack,
 *   - the combat equipment store / Loadout Equip Service,
 *   - the DND ItemDefinition registry.
 * Outfit pieces are never items and never enter the backpack. No money, no
 * RuntimeLog, no Runtime / Campaign / ActorVault interaction.
 */

export const CHARACTER_WARDROBE_STORE_KEY = 'platform-character-wardrobe-store';
export const CHARACTER_WARDROBE_STORE_SCHEMA_VERSION = 1;

const EMPTY_WARDROBE: Wardrobe = { pieces: [] };

interface CharacterWardrobeStoreState {
  schemaVersion: number;
  wardrobeByActor: Record<string, Wardrobe>;
  loadoutByActor: Record<string, OutfitLoadout>;

  getWardrobe: (actorKey: string) => Wardrobe;
  getOutfitLoadout: (actorKey: string) => OutfitLoadout | undefined;

  /** Seed the wardrobe + initial loadout from a background template (idempotent). */
  initializeOutfitFromTemplate: (actorKey: string, template: OutfitTemplate) => void;
  equipOutfitPiece: (actorKey: string, instanceId: string, slot: OutfitSlotKey) => OutfitResult;
  unequipOutfitPiece: (actorKey: string, slot: OutfitSlotKey) => OutfitResult;
  replaceOutfitPiece: (actorKey: string, instanceId: string, slot: OutfitSlotKey) => OutfitResult;
}

export const useCharacterWardrobeStore = create<CharacterWardrobeStoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: CHARACTER_WARDROBE_STORE_SCHEMA_VERSION,
      wardrobeByActor: {},
      loadoutByActor: {},

      getWardrobe: (actorKey) => get().wardrobeByActor[actorKey] ?? EMPTY_WARDROBE,
      getOutfitLoadout: (actorKey) => get().loadoutByActor[actorKey],

      initializeOutfitFromTemplate: (actorKey, template) => {
        const existing = get().wardrobeByActor[actorKey];
        if (existing && existing.pieces.length > 0) return; // already initialized — idempotent

        const pieces: OutfitPieceInstance[] = [];
        const slots: OutfitLoadout['slots'] = {};
        (Object.keys(template.slots) as OutfitSlotKey[]).forEach((slot) => {
          const ref = template.slots[slot];
          if (!ref) return;
          const instanceId = `wp_${ref.pieceDefinitionId}`;
          pieces.push({ instanceId, definitionId: ref.pieceDefinitionId, origin: 'background-outfit' });
          slots[slot] = instanceId;
        });

        set((state) => ({
          wardrobeByActor: { ...state.wardrobeByActor, [actorKey]: { pieces } },
          loadoutByActor: { ...state.loadoutByActor, [actorKey]: { templateId: template.id, slots } },
        }));
      },

      equipOutfitPiece: (actorKey, instanceId, slot) => {
        const wardrobe = get().wardrobeByActor[actorKey] ?? EMPTY_WARDROBE;
        const loadout = get().loadoutByActor[actorKey] ?? { slots: {} };
        const result = equipOutfitPiece({ wardrobe, loadout, instanceId, slot, resolvePiece: getOutfitPieceDefinition });
        if (result.ok) {
          set((state) => ({ loadoutByActor: { ...state.loadoutByActor, [actorKey]: result.loadout } }));
        }
        return result;
      },

      replaceOutfitPiece: (actorKey, instanceId, slot) => {
        const wardrobe = get().wardrobeByActor[actorKey] ?? EMPTY_WARDROBE;
        const loadout = get().loadoutByActor[actorKey] ?? { slots: {} };
        const result = replaceOutfitPiece({ wardrobe, loadout, instanceId, slot, resolvePiece: getOutfitPieceDefinition });
        if (result.ok) {
          set((state) => ({ loadoutByActor: { ...state.loadoutByActor, [actorKey]: result.loadout } }));
        }
        return result;
      },

      unequipOutfitPiece: (actorKey, slot) => {
        const loadout = get().loadoutByActor[actorKey] ?? { slots: {} };
        const result = unequipOutfitPiece({ loadout, slot });
        if (result.ok) {
          set((state) => ({ loadoutByActor: { ...state.loadoutByActor, [actorKey]: result.loadout } }));
        }
        return result;
      },
    }),
    {
      name: CHARACTER_WARDROBE_STORE_KEY,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        wardrobeByActor: state.wardrobeByActor,
        loadoutByActor: state.loadoutByActor,
      }),
    },
  ),
);
