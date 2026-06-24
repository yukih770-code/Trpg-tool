/**
 * DND RuntimeLog draft mapper (v0) — pure mapper, no append.
 *
 * AI-LANDMARK: DND_RUNTIME_LOG_DRAFT_MAPPER_V0
 *
 * Bridges the two RuntimeLog models WITHOUT appending:
 *   - gameplay draft model: `RuntimeLogEntry` (runtime-log-types.ts)
 *   - persistence model: `AppendRuntimeLogEventInput` (runtimeLogLocalStore.ts)
 *
 * It only produces append INPUTS. It does NOT append, does NOT touch the store,
 * repository, or localStorage. Draft `id` and `timestamp:0` are NEVER used as
 * the real log id/createdAt — the persistence layer generates those on append;
 * the originals are preserved in `payload` for debugging only.
 */

import type { RuntimeLogEntry, RuntimeLogKind, RuntimeLogSystem } from '../../runtime-log-types';
import type {
  AppendRuntimeLogEventInput,
  RuntimeLogEventType,
} from '../../platform/runtimeLogLocalStore';

export interface DndRuntimeLogDraftMapInput {
  campaignId: string;
  sessionId?: string;
  drafts: RuntimeLogEntry[];
  actorId?: string;
  targetId?: string;
}

export interface DndRuntimeLogDraftMapResult {
  appendInputs: AppendRuntimeLogEventInput[];
  warnings: string[];
}

/** gameplay draft kind -> persistence event type (nearest available). */
const KIND_TO_TYPE: Record<RuntimeLogKind, RuntimeLogEventType> = {
  check: 'roll.performed',
  roll: 'roll.performed',
  action: 'actor.note',
  damage: 'actor.hpChanged',
  resource: 'actor.resourceChanged',
  system: 'system.note',
  narration: 'actor.note',
};

/** gameplay draft system -> persistence systemId. */
const SYSTEM_TO_SYSTEM_ID: Record<RuntimeLogSystem, 'dnd5e-2024' | 'coc7e' | 'cp-red'> = {
  dnd: 'dnd5e-2024',
  coc: 'coc7e',
  cpred: 'cp-red',
};

/**
 * Map gameplay RuntimeLogEntry drafts into persistence append inputs.
 * Throws if `campaignId` is missing; skips an individual draft (with a warning)
 * if its kind/system has no persistence mapping.
 */
export function mapRuntimeLogDraftsToAppendInputsV0(
  input: DndRuntimeLogDraftMapInput,
): DndRuntimeLogDraftMapResult {
  const campaignId = input.campaignId?.trim();
  if (!campaignId) {
    throw new Error('[runtimeLogDraftMapper] campaignId is required.');
  }

  const appendInputs: AppendRuntimeLogEventInput[] = [];
  const warnings: string[] = [];

  for (const draft of input.drafts) {
    const type = KIND_TO_TYPE[draft.kind];
    if (!type) {
      warnings.push(`Draft "${draft.id}" skipped: no persistence type for kind "${draft.kind}".`);
      continue;
    }
    const systemId = SYSTEM_TO_SYSTEM_ID[draft.system];
    if (!systemId) {
      warnings.push(`Draft "${draft.id}" skipped: no systemId mapping for system "${draft.system}".`);
      continue;
    }

    const message = draft.summary || draft.title || 'Runtime log event';

    appendInputs.push({
      campaignId,
      sessionId: input.sessionId,
      actorId: draft.actorId ?? input.actorId,
      systemId,
      type,
      message,
      // payload is `unknown` in the persistence model — debug context only.
      payload: {
        draftKind: draft.kind,
        draftTitle: draft.title,
        draftSummary: draft.summary,
        displayValue: draft.displayValue,
        outcome: draft.outcome,
        calculation: draft.calculation,
        visibility: draft.visibility,
        targetId: draft.targetId ?? input.targetId,
        tags: draft.tags,
        // Preserved for debugging ONLY — never used as the real id/createdAt.
        originalDraftId: draft.id,
        originalDraftTimestamp: draft.timestamp,
      },
    });
  }

  return { appendInputs, warnings };
}
