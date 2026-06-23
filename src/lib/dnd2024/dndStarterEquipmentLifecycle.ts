/**
 * DND Starter Equipment Lifecycle (v1) — derived state, no schema change.
 *
 * AI-LANDMARK: DND_STARTER_EQUIPMENT_LIFECYCLE_V1
 *
 * Decides whether the Equipment page should offer "生成初始装备" (generate),
 * "拆解旧版装备摘要" (break down a legacy summary), or nothing — based purely on
 * derived signals, WITHOUT touching CharacterData:
 *   - already-materialized starter items (origin.type === 'starter-equipment'),
 *   - quarantined legacy summary fake items,
 *   - whether a StarterEquipmentPlan has any content.
 *
 * Pure function: no store / React / localStorage / network. Never deletes data.
 */

import type { CharacterInventoryItem } from '../platform/characterInventory';
import type { StarterEquipmentPlan } from './dndStarterEquipmentPlan';

export type StarterEquipmentState =
  | 'not-needed'
  | 'pending-selection'
  | 'materialized'
  | 'legacy-quarantined'
  | 'partial';

export interface StarterEquipmentLifecycle {
  state: StarterEquipmentState;
  /** Show the normal "生成初始装备" entry. */
  shouldShowGenerate: boolean;
  /** Show the "拆解旧版装备摘要" entry (legacy summary path). */
  shouldShowLegacyBreakdown: boolean;
  hasMaterializedStarterItems: boolean;
  hasLegacyQuarantinedSummary: boolean;
}

/** Does a plan actually carry anything to generate? */
export function planHasContent(plan?: StarterEquipmentPlan | null): boolean {
  if (!plan) return false;
  return (plan.choices?.length ?? 0) > 0 || (plan.fixed?.length ?? 0) > 0;
}

/**
 * Derive the starter-equipment lifecycle state.
 *
 * Precedence: materialized > legacy-quarantined > pending-selection > not-needed.
 * (Once real starter items exist, neither prompt is shown even if a legacy
 * summary still lingers in quarantine — the character already has gear.)
 */
export function deriveStarterEquipmentLifecycle(input: {
  ownedItems?: CharacterInventoryItem[] | null;
  quarantinedItems?: CharacterInventoryItem[] | null;
  starterPlan?: StarterEquipmentPlan | null;
  /**
   * Optional signal that a legacy starter-summary STRING (e.g. still in
   * character.inventory, not in the item store) is present. Treated the same as
   * a quarantined summary item for lifecycle purposes.
   */
  hasLegacySummaryText?: boolean;
}): StarterEquipmentLifecycle {
  const ownedItems = input.ownedItems ?? [];
  const quarantinedItems = input.quarantinedItems ?? [];
  const hasContent = planHasContent(input.starterPlan);

  const hasMaterializedStarterItems = ownedItems.some((i) => i.origin?.type === 'starter-equipment');
  const hasLegacyQuarantinedSummary = quarantinedItems.length > 0 || Boolean(input.hasLegacySummaryText);

  let state: StarterEquipmentState;
  if (hasMaterializedStarterItems) {
    state = 'materialized';
  } else if (hasLegacyQuarantinedSummary) {
    state = 'legacy-quarantined';
  } else if (hasContent) {
    state = 'pending-selection';
  } else {
    state = 'not-needed';
  }

  return {
    state,
    shouldShowGenerate: state === 'pending-selection',
    shouldShowLegacyBreakdown: state === 'legacy-quarantined',
    hasMaterializedStarterItems,
    hasLegacyQuarantinedSummary,
  };
}
