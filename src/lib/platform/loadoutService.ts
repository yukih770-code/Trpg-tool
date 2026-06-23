/**
 * Loadout Equip Service (v1) — combat equipment slot occupancy + replace flow.
 *
 * AI-LANDMARK: LOADOUT_EQUIP_SERVICE_V1
 *
 * Pure functions that decide equip / unequip legality and produce a NEW items
 * array. They are the single source of truth for slot occupancy: the UI must
 * never write `equipSlot` directly. Definition-driven — slot eligibility and
 * occupancy come from `DndItemDefinition.equipProfile` (fallback `equipSlots`),
 * never from the item name or category.
 *
 * No store / React / localStorage / network access; no quantity changes, no
 * deletes, no money, no RuntimeLog. The caller injects `resolveDef` so this
 * module stays system-agnostic.
 */

import { isLegacyStarterSummaryItem, type CharacterInventoryItem, type EquipmentSlot } from './characterInventory';
import type { DndItemDefinition } from '../dnd2024/equipment-types';

export type EquipFailureReason =
  | 'item-not-found'
  | 'missing-definition'
  | 'invalid-slot'
  | 'slot-occupied'
  | 'two-hand-conflict'
  | 'legacy-summary-item';

export type EquipResult =
  | { ok: true; items: CharacterInventoryItem[]; unequippedInstanceIds?: string[] }
  | { ok: false; reason: EquipFailureReason };

export type EquipMode = 'replace' | 'reject-if-occupied';

type ResolveDef = (definitionId?: string) => DndItemDefinition | undefined;

/** Slots an item is eligible for: equipProfile.allowedSlots, else equipSlots. */
function allowedSlotsOf(def: DndItemDefinition | undefined): EquipmentSlot[] | undefined {
  return def?.equipProfile?.allowedSlots ?? def?.equipSlots;
}

/** Slots an item consumes when placed in `targetSlot` (two-handed etc.). */
function occupiedSlotsOf(def: DndItemDefinition | undefined, targetSlot: EquipmentSlot): EquipmentSlot[] {
  const occ = def?.equipProfile?.occupiedSlots;
  if (occ && occ.length > 0) return Array.from(new Set<EquipmentSlot>([targetSlot, ...occ]));
  return [targetSlot];
}

/** True when an already-equipped item consumes more than one slot (two-handed). */
function isMultiSlot(def: DndItemDefinition | undefined): boolean {
  return (def?.equipProfile?.occupiedSlots?.length ?? 0) > 1;
}

/**
 * Equip `instanceId` into `targetSlot`.
 *
 * v1 default mode is `replace`: any item conflicting with the consumed slots is
 * automatically unequipped (returned to the backpack), guaranteeing that no two
 * equipped items ever share a slot. `reject-if-occupied` instead fails.
 */
export function equipItem(input: {
  items: CharacterInventoryItem[];
  resolveDef: ResolveDef;
  instanceId: string;
  targetSlot: EquipmentSlot;
  mode?: EquipMode;
}): EquipResult {
  const { items, resolveDef, instanceId, targetSlot, mode = 'replace' } = input;

  const item = items.find((i) => i.instanceId === instanceId);
  if (!item) return { ok: false, reason: 'item-not-found' };

  // Quarantined legacy "summary" fake items can never be equipped.
  if (isLegacyStarterSummaryItem(item)) return { ok: false, reason: 'legacy-summary-item' };

  const def = resolveDef(item.definitionId);
  const allowed = allowedSlotsOf(def);
  if (!allowed || allowed.length === 0) return { ok: false, reason: 'missing-definition' };
  if (!allowed.includes(targetSlot)) return { ok: false, reason: 'invalid-slot' };

  const consumed = new Set<EquipmentSlot>(occupiedSlotsOf(def, targetSlot));

  // Find equipped items (other than this one) whose own occupied slots intersect
  // the slots we are about to consume.
  const conflicts: CharacterInventoryItem[] = [];
  let conflictIsTwoHand = false;
  for (const other of items) {
    if (other.instanceId === instanceId || !other.equipSlot) continue;
    const otherDef = resolveDef(other.definitionId);
    const otherConsumed = new Set<EquipmentSlot>(occupiedSlotsOf(otherDef, other.equipSlot));
    let intersects = false;
    for (const s of consumed) {
      if (otherConsumed.has(s)) { intersects = true; break; }
    }
    if (intersects) {
      conflicts.push(other);
      if (isMultiSlot(otherDef)) conflictIsTwoHand = true;
    }
  }

  if (conflicts.length > 0 && mode === 'reject-if-occupied') {
    const twoHand = conflictIsTwoHand || consumed.size > 1;
    return { ok: false, reason: twoHand ? 'two-hand-conflict' : 'slot-occupied' };
  }

  const conflictIds = new Set(conflicts.map((c) => c.instanceId));
  const nextItems = items.map((i) => {
    if (i.instanceId === instanceId) {
      // Move into the target slot (also covers slot-to-slot moves). Clearing
      // containerId matches the store convention for an equipped item.
      return { ...i, equipSlot: targetSlot, containerId: undefined };
    }
    if (conflictIds.has(i.instanceId)) {
      // Auto-unequip the conflicting item back to the backpack.
      return { ...i, equipSlot: undefined };
    }
    return i;
  });

  return {
    ok: true,
    items: nextItems,
    unequippedInstanceIds: conflicts.length > 0 ? conflicts.map((c) => c.instanceId) : undefined,
  };
}

/** Unequip `instanceId` (clears its slot, returns it to the backpack). */
export function unequipItem(input: {
  items: CharacterInventoryItem[];
  instanceId: string;
}): EquipResult {
  const { items, instanceId } = input;
  const item = items.find((i) => i.instanceId === instanceId);
  if (!item) return { ok: false, reason: 'item-not-found' };
  const nextItems = items.map((i) => (i.instanceId === instanceId ? { ...i, equipSlot: undefined } : i));
  return { ok: true, items: nextItems };
}
