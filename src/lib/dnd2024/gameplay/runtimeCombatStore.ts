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
import { mapRuntimeLogDraftsToAppendInputsV0 } from './runtimeLogDraftMapper';
import { useRuntimeLogLocalStore } from '../../platform/runtimeLogLocalStore';
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

  // pendingLogDrafts are RuntimeLogEntry drafts. They are mapped to
  // AppendRuntimeLogEventInput before persistence. LocalRuntimeLogEvent id /
  // createdAt are generated by the persistence layer (not from the draft).
  flushPendingLogDrafts: ({ campaignId, sessionId, actorId, targetId }) => {
    const drafts = get().pendingLogDrafts;
    if (drafts.length === 0) {
      return { appendedCount: 0, skippedCount: 0, warnings: [] };
    }

    if (!campaignId || !campaignId.trim()) {
      const warning = makeWarning(
        'runtime-combat.warning.log-draft-map',
        'campaignId is required to flush log drafts; nothing appended.',
        'log',
      );
      set((state) => ({ warnings: [...state.warnings, warning] }));
      return { appendedCount: 0, skippedCount: drafts.length, warnings: [warning] };
    }

    const warnings: DndRuntimeCombatWarning[] = [];
    const mapResult = mapRuntimeLogDraftsToAppendInputsV0({
      campaignId,
      sessionId,
      actorId,
      targetId,
      drafts,
    });
    if (mapResult.warnings.length > 0) {
      warnings.push(
        makeWarning('runtime-combat.warning.log-draft-map', mapResult.warnings.join(' | '), 'log'),
      );
    }
    const mappings = mapResult.mappings;
    // Unmappable drafts (skipped by the mapper) are dropped, not retried — they
    // would only re-warn forever. `skippedCount` reports this count.
    const mapperSkipped = drafts.length - mappings.length;

    const append = useRuntimeLogLocalStore.getState().appendRuntimeLogEvent;
    let appendedCount = 0;
    let appendError: unknown = null;
    let firstFailureIndex = -1;
    for (let i = 0; i < mappings.length; i += 1) {
      try {
        append(mappings[i].appendInput);
        appendedCount += 1;
      } catch (err) {
        appendError = err;
        firstFailureIndex = i;
        break;
      }
    }

    if (appendError) {
      // Duplicate guard: keep ONLY the drafts that were not successfully appended
      // (the failed one + those after it). Already-appended drafts are removed so
      // a retry never re-appends them. Unmappable drafts are dropped (warned).
      const remainingDrafts = mappings.slice(firstFailureIndex).map((m) => m.draft);
      warnings.push(
        makeWarning(
          'runtime-combat.warning.log-append-partial',
          `Log append failed: appended ${appendedCount}, ${remainingDrafts.length} draft(s) kept for retry, ${mapperSkipped} unmappable draft(s) dropped. ${appendError instanceof Error ? appendError.message : String(appendError)}`,
          'log',
        ),
      );
      // Do NOT roll back the encounter — the RuntimeLog is a recoverable record.
      set((state) => ({ pendingLogDrafts: remainingDrafts, warnings: [...state.warnings, ...warnings] }));
      return { appendedCount, skippedCount: mapperSkipped, warnings };
    }

    // Full success: every mappable draft appended; drop unmappable drafts too.
    set((state) => ({ pendingLogDrafts: [], warnings: [...state.warnings, ...warnings] }));
    return { appendedCount, skippedCount: mapperSkipped, warnings };
  },

  clearPendingLogDrafts: () => set({ pendingLogDrafts: [] }),

  clearWarnings: () => set({ warnings: [] }),
}));
