/**
 * DND Runtime Combat Store (local v0).
 *
 * AI-LANDMARK: DND_RUNTIME_COMBAT_STORE_LOCAL_V0
 *
 * Minimal in-memory Zustand store implementing `DndRuntimeCombatStoreContract`.
 * It HOLDS the current RuntimeEncounterState, commits RuntimeChanges (via the
 * pure applier), runs a dagger attack (via the pure flow), and BUFFERS gameplay
 * RuntimeLogEntry drafts.
 *
 * Boundaries:
 *   - No persistence / localStorage (Runtime State persistence is undecided).
 *   - No RuntimeLog append, no runtimeLogRepository, no draft->append mapper.
 *   - No UI / no Action Dock / no CampaignRuntimeShell wiring.
 *   - No legacy Gameplay / actionRegistry / characterStore writes.
 *   - Writes NO Character Library or Campaign authoritative state.
 *   - Rules math stays in the pure services; this store only holds + commits.
 *
 * pendingLogDrafts are RuntimeLogEntry DRAFTS (not LocalRuntimeLogEvent
 * persistence events); P5.4 will add the draft->append mapper.
 */

import { create } from 'zustand';

import { applyRuntimeChangesV0 } from './runtimeChangeApplier';
import { runDaggerMeleeAttackFlowV0 } from './daggerAttackFlow';
import type {
  DndRuntimeCombatStoreContract,
  DndRuntimeCombatWarning,
} from './runtimeCombatStoreTypes';

function makeWarning(
  id: string,
  message: string,
  source: DndRuntimeCombatWarning['source'] = 'store',
): DndRuntimeCombatWarning {
  return { id, level: 'warning', message, source };
}

export const useRuntimeCombatStore = create<DndRuntimeCombatStoreContract>((set, get) => ({
  encounter: undefined,
  pendingLogDrafts: [],
  selection: {},
  warnings: [],

  startEncounter: (input) =>
    set({ encounter: input.encounter, pendingLogDrafts: [], selection: {}, warnings: [] }),

  setEncounter: (encounter) => set({ encounter }),

  resetEncounter: () =>
    set({ encounter: undefined, pendingLogDrafts: [], selection: {}, warnings: [] }),

  selectActor: (actorId) =>
    set((state) => ({ selection: { ...state.selection, selectedActorId: actorId } })),

  selectTarget: (targetId) =>
    set((state) => ({ selection: { ...state.selection, selectedTargetId: targetId } })),

  commitRuntimeChanges: ({ changes }) => {
    const encounter = get().encounter;
    if (!encounter) {
      const warning = makeWarning(
        'runtime-combat.warning.no-encounter',
        'No active encounter; changes were not applied.',
        'store',
      );
      set((state) => ({ warnings: [...state.warnings, warning] }));
      // Honest no-op applyResult: an empty encounter skips every change.
      const applyResult = applyRuntimeChangesV0({ encounterId: 'runtime-combat.none', actors: {} }, changes);
      return { applyResult, pendingLogDrafts: get().pendingLogDrafts, warnings: [warning] };
    }

    const applyResult = applyRuntimeChangesV0(encounter, changes);
    set({ encounter: applyResult.encounter });
    return { applyResult, pendingLogDrafts: get().pendingLogDrafts, warnings: [] };
  },

  runDaggerAttack: (input) => {
    const encounter = get().encounter;
    if (!encounter) {
      const warning = makeWarning(
        'runtime-combat.warning.no-encounter',
        'No active encounter; dagger attack was not run.',
        'store',
      );
      set((state) => ({ warnings: [...state.warnings, warning] }));
      // The contract requires a non-optional flowResult, which cannot be produced
      // without an encounter, so this precondition throws (warning is recorded).
      throw new Error('[runtimeCombatStore] runDaggerAttack: no active encounter.');
    }

    try {
      const flowResult = runDaggerMeleeAttackFlowV0({
        encounter,
        actorId: input.actorId,
        targetId: input.targetId,
        d20: input.d20,
        damageRollTotal: input.damageRollTotal,
        abilityModifier: input.abilityModifier,
        proficiencyBonus: input.proficiencyBonus,
        otherAttackBonus: input.otherAttackBonus,
        otherDamageBonus: input.otherDamageBonus,
        actorName: input.actorName,
        targetName: input.targetName,
        timestamp: input.timestamp,
      });

      const pendingLogDrafts = [...get().pendingLogDrafts, ...flowResult.logDrafts.entries];
      set({ encounter: flowResult.applyResult.encounter, pendingLogDrafts });
      return { flowResult, pendingLogDrafts, warnings: [] };
    } catch (err) {
      const warning = makeWarning(
        'runtime-combat.warning.dagger-attack-error',
        `Dagger attack failed: ${err instanceof Error ? err.message : String(err)}`,
        'resolver',
      );
      set((state) => ({ warnings: [...state.warnings, warning] }));
      // Re-throw so the caller is aware; state (encounter/drafts) is untouched.
      throw err;
    }
  },

  clearPendingLogDrafts: () => set({ pendingLogDrafts: [] }),

  clearWarnings: () => set({ warnings: [] }),
}));
