/**
 * DND 2024 Starter Equipment Plan (v1).
 *
 * AI-LANDMARK: DND_STARTER_EQUIPMENT_PLAN
 *
 * A class "starting equipment" summary string is a PLAN, never an item. This
 * module upgrades the raw parse (`parseStarterEquipment`) into a structured
 * `StarterEquipmentPlan` whose every choice option / fixed entry is enriched
 * with a resolved `definitionId` when possible (via the item registry) and
 * flagged `pendingSource` / `vague` otherwise. Real ItemInstances are only
 * materialized later, on explicit user "Generate".
 */

import { parseStarterEquipment } from '../platform/characterInventory';
import { resolveDndItemDefinition } from './dndItemRegistry';
import { primaryEquipSlot } from './dndItemDefinitions';
import type { DndItemDefinition } from './equipment-types';
import type { EquipmentSlot } from '../platform/characterInventory';

export interface StarterChoiceOption {
  label: string;
  quantity: number;
  definitionId?: string;
  /** Vague option such as "任意简易武器" — needs Builder selection, cannot auto-resolve. */
  vague?: boolean;
  /** A concrete item whose stats are not yet sourced. */
  pendingSource?: boolean;
  /** UI hint: option cannot be chosen here (vague). */
  disabled?: boolean;
}

export interface StarterFixedItem {
  label: string;
  quantity: number;
  definitionId?: string;
  pendingSource?: boolean;
}

export interface StarterChoiceGroup {
  id: string;
  label: string;
  options: StarterChoiceOption[];
}

export interface StarterEquipmentPlan {
  sourceText: string;
  sourceRef?: string;
  choices: StarterChoiceGroup[];
  fixed: StarterFixedItem[];
  status: 'unresolved' | 'partially-resolved' | 'resolved';
}

/** Build a structured, definitionId-enriched plan from a raw summary string. */
export function buildStarterEquipmentPlan(sourceText: string, sourceRef?: string): StarterEquipmentPlan {
  const parsed = parseStarterEquipment(sourceText ?? '');
  let resolvedCount = 0;
  let unresolvedCount = 0;

  const choices: StarterChoiceGroup[] = parsed.groups.map((g) => ({
    id: g.id,
    label: '选择 Choose',
    options: g.options.map((o) => {
      const def = o.vague ? undefined : resolveDndItemDefinition(o.name);
      const pendingSource = !o.vague && (def ? def.sourceStatus === 'pending-source' : true);
      if (o.vague || pendingSource || !def) unresolvedCount += 1;
      else resolvedCount += 1;
      return {
        label: o.name,
        quantity: 1,
        definitionId: def?.id,
        vague: o.vague || undefined,
        pendingSource: pendingSource || undefined,
        disabled: o.vague || undefined,
      };
    }),
  }));

  const fixed: StarterFixedItem[] = parsed.fixed.map((f) => {
    const def = resolveDndItemDefinition(f.name);
    const pendingSource = def ? def.sourceStatus === 'pending-source' : true;
    if (pendingSource || !def) unresolvedCount += 1;
    else resolvedCount += 1;
    return {
      label: f.name,
      quantity: f.quantity,
      definitionId: def?.id,
      pendingSource: pendingSource || undefined,
    };
  });

  let status: StarterEquipmentPlan['status'];
  if (resolvedCount === 0 && unresolvedCount === 0) status = 'unresolved';
  else if (unresolvedCount === 0) status = 'resolved';
  else status = 'partially-resolved';

  return { sourceText: (sourceText ?? '').trim(), sourceRef, choices, fixed, status };
}

/**
 * Auto-equip slot for a generated starter item, driven by the definition's
 * `equipSlots` (never the item name). Fixed (non-choice) weapons such as spare
 * daggers are intentionally left in the backpack.
 */
export function autoSlotForDefinition(
  def: DndItemDefinition | undefined,
  isChoice: boolean,
): EquipmentSlot | undefined {
  if (!def) return undefined;
  const slot = primaryEquipSlot(def);
  if (!slot) return undefined;
  if (def.category === 'weapon' && !isChoice) return undefined;
  return slot;
}
