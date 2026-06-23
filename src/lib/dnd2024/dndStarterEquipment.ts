/**
 * DND starter-equipment resolver (v2 — definition-aware).
 *
 * AI-LANDMARK: DND_STARTER_EQUIPMENT_RESOLVER_V1
 *
 * Turns a resolved starter-equipment name into a real platform inventory item
 * INSTANCE. Identity comes from the Item Registry: when a name resolves to a
 * `DndItemDefinition`, the instance carries that `definitionId` (+ sourceStatus,
 * + any sourced stats). It does NOT invent rule values: a pending-source
 * definition (e.g. Rapier) yields an instance with a definitionId but no
 * fabricated damage/weight, and an unresolved name yields a real instance with
 * a "待核对" note. No RuntimeLog, no AC/attack/damage computation, no purchase.
 */

import {
  makeInventoryItem,
  type CharacterInventoryItem,
  type InventoryItemCategory,
} from '../platform/characterInventory';
import { getDndItemDefinition, resolveDndItemDefinition } from './dndItemRegistry';
import { inventoryCategoryForDefinition } from './dndItemDefinitions';
import type { DndItemDefinition } from './equipment-types';

function guessCategory(name: string): InventoryItemCategory {
  if (/套件|pack|背包|包$/i.test(name)) return 'container';
  if (/乐器|instrument/i.test(name)) return 'tool';
  if (/甲|armor|盾|shield/i.test(name)) return 'armor';
  if (/剑|刀|弓|弩|斧|锤|matchlock|weapon/i.test(name)) return 'weapon';
  return 'gear';
}

function systemDataFromDefinition(def: DndItemDefinition): Record<string, unknown> | undefined {
  const data: Record<string, unknown> = {};
  if (def.weapon?.damage) {
    data.damage = def.weapon.damage;
    if (def.weapon.damageType) data.damageType = def.weapon.damageType;
  }
  if (def.weapon?.range) data.range = def.weapon.range;
  if (typeof def.armor?.baseAc === 'number') data.ac = String(def.armor.baseAc);
  if (typeof def.shield?.acBonus === 'number') data.ac = `+${def.shield.acBonus}`;
  if (def.description) data.description = def.description;
  return Object.keys(data).length > 0 ? data : undefined;
}

/** Is this starter name resolvable to a registered definition? */
export function dndStarterItemResolvable(name: string): boolean {
  return Boolean(resolveDndItemDefinition(name));
}

/**
 * Resolve a starter-equipment name + quantity into a real inventory item
 * instance. When `definitionId` is supplied (e.g. from a StarterEquipmentPlan),
 * it is used directly; otherwise the name is resolved via the registry.
 */
export function resolveDndStarterItem(
  name: string,
  quantity: number,
  sourceText?: string,
  definitionId?: string,
): CharacterInventoryItem {
  const trimmed = name.trim();
  const def = definitionId ? getDndItemDefinition(definitionId) : resolveDndItemDefinition(trimmed);

  if (def) {
    const sourced = def.sourceStatus === 'sourced';
    return makeInventoryItem({
      systemId: 'dnd5e-2024',
      name: def.nameCn,
      category: inventoryCategoryForDefinition(def.category) as InventoryItemCategory,
      location: 'backpack',
      quantity,
      definitionId: def.id,
      sourceStatus: def.sourceStatus,
      sourceItemId: def.id,
      weight: sourced ? def.weight : undefined,
      weightUnit: sourced && typeof def.weight === 'number' ? 'lb' : undefined,
      cost: sourced ? def.value : undefined,
      tags: def.tags,
      systemData: systemDataFromDefinition(def),
      notes: def.sourceStatus === 'pending-source' ? (def.notes ?? '数值 / 来源待核对。') : undefined,
      origin: {
        type: 'starter-equipment',
        sourceText,
        resolvedFrom: def.id,
        pending: def.sourceStatus === 'pending-source',
      },
    });
  }

  // Not resolvable to any definition: still a real instance, but no fabricated stats.
  return makeInventoryItem({
    systemId: 'dnd5e-2024',
    name: trimmed,
    category: guessCategory(trimmed),
    location: 'backpack',
    quantity,
    notes: '数值 / 来源待核对（基础装备数据缺失，待 Builder / owner source 补充）。',
    origin: { type: 'starter-equipment', sourceText, resolvedFrom: trimmed, pending: true },
  });
}
