import type { CharacterData } from '../dnd-types.js';
import type { CharacterInventoryItem } from '../platform/characterInventory.js';

export const DND_CHARACTER_EQUIPMENT_SNAPSHOT_KEY = 'dndEquipmentSnapshotV1';

export type DndCharacterEquipmentSnapshot = NonNullable<CharacterData['dndEquipmentSnapshotV1']>;
export type DndCharacterEquipmentSnapshotItem = DndCharacterEquipmentSnapshot['items'][number];

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function compareItems(a: DndCharacterEquipmentSnapshotItem, b: DndCharacterEquipmentSnapshotItem): number {
  return a.definitionId.localeCompare(b.definitionId)
    || (a.equipSlot ?? '').localeCompare(b.equipSlot ?? '')
    || a.quantity - b.quantity;
}

/**
 * Produces the narrow, deterministic equipment block stored with a DND actor
 * snapshot. Names, notes, costs and client-copied weapon statistics are
 * deliberately excluded: server derivation resolves every rule field again
 * from the bundled definition id.
 */
export function buildDndCharacterEquipmentSnapshot(
  items: readonly CharacterInventoryItem[],
): DndCharacterEquipmentSnapshot {
  return {
    schemaVersion: 1,
    items: items.flatMap((item) => {
      const definitionId = item.systemId === 'dnd5e-2024' && typeof item.definitionId === 'string'
        ? item.definitionId.trim()
        : '';
      if (!definitionId || definitionId.length > 200) return [];
      const quantity = Number.isSafeInteger(item.quantity) && item.quantity > 0
        ? Math.min(item.quantity, 100000)
        : 1;
      const equipSlot = typeof item.equipSlot === 'string' && item.equipSlot.trim().length <= 50
        ? item.equipSlot.trim()
        : undefined;
      return [{ definitionId, quantity, ...(equipSlot ? { equipSlot } : {}) }];
    }).sort(compareItems),
  };
}

/** Strict reader for untrusted Vault/campaign JSON. Invalid rows are ignored. */
export function readDndCharacterEquipmentSnapshot(payload: unknown): DndCharacterEquipmentSnapshot | undefined {
  const root = record(payload);
  const candidate = record(root?.[DND_CHARACTER_EQUIPMENT_SNAPSHOT_KEY]);
  if (!candidate || candidate.schemaVersion !== 1 || !Array.isArray(candidate.items)) return undefined;

  const items = candidate.items.slice(0, 500).flatMap((value) => {
    const item = record(value);
    const definitionId = typeof item?.definitionId === 'string' ? item.definitionId.trim() : '';
    const quantity = item?.quantity;
    if (!definitionId || definitionId.length > 200 || !Number.isSafeInteger(quantity)
      || (quantity as number) < 1 || (quantity as number) > 100000) return [];
    const equipSlot = typeof item?.equipSlot === 'string' && item.equipSlot.trim().length <= 50
      ? item.equipSlot.trim()
      : undefined;
    return [{ definitionId, quantity: quantity as number, ...(equipSlot ? { equipSlot } : {}) }];
  }).sort(compareItems);

  return { schemaVersion: 1, items };
}

