/**
 * DND RuntimeLog draft adapter (v0) — pure function, attack + damage drafts only.
 *
 * AI-LANDMARK: DND_RUNTIME_LOG_DRAFT_ADAPTER_V0
 *
 * This is a v0 PURE RuntimeLog draft adapter.
 *   - It does NOT append logs.
 *   - It does NOT mutate RuntimeState.
 *   - It does NOT access stores or repositories or localStorage.
 *   - It does NOT generate timestamps (caller may pass one; default 0).
 *   - It only converts a WeaponAttackResolver result (and optional applied
 *     RuntimeChanges) into DRAFT RuntimeLogEntry objects.
 * RuntimeLog persistence (real append + real timestamp) is a future task.
 */

import type { RuntimeLogEntry } from '../../runtime-log-types';
import type { DndWeaponAttackResolverResult } from './weaponAttackResolver';
import type { DndRuntimeChange } from './runtimeChangeTypes';

export interface DndRuntimeLogDraftAdapterInput {
  encounterId?: string;
  sessionId?: string;
  actorName?: string;
  targetName?: string;
  resolverResult: DndWeaponAttackResolverResult;
  appliedChanges?: DndRuntimeChange[];
  /**
   * Optional timestamp to stamp on the drafts. Defaults to 0 to keep this pure;
   * the persistence layer should set the real time when it appends.
   */
  timestamp?: number;
}

export interface DndRuntimeLogDraftAdapterResult {
  entries: RuntimeLogEntry[];
  notes: string[];
}

/**
 * Build draft RuntimeLog entries (attack roll + damage/miss) from a dagger melee
 * resolver result. Drafts only — never persisted here. HP is NOT recomputed in
 * the log; HP changes come from RuntimeChange / the applier.
 */
export function createDaggerAttackRuntimeLogDraftsV0(
  input: DndRuntimeLogDraftAdapterInput,
): DndRuntimeLogDraftAdapterResult {
  const { resolverResult, appliedChanges, timestamp = 0 } = input;
  const { actionId, actorId, targetId, hit, attackRoll, damageRoll } = resolverResult;

  const actorName = input.actorName ?? actorId;
  const targetName = input.targetName ?? targetId;
  const notes: string[] = [];

  const attackEntry: RuntimeLogEntry = {
    id: `runtime-log-draft.attack.${actorId}.${targetId}.${actionId}`,
    timestamp,
    system: 'dnd',
    kind: 'roll',
    title: '匕首攻击',
    summary: `${actorName} 使用匕首攻击 ${targetName}`,
    displayValue: attackRoll.total,
    calculation: attackRoll.breakdown?.join('  '),
    outcome: hit ? '命中' : '未命中',
    visibility: 'public',
    actorId,
    actorName,
    targetId,
    targetName,
    tags: ['weapon', 'attack', 'dagger'],
  };

  const damageTotal = hit ? damageRoll?.total ?? 0 : 0;
  const damageEntry: RuntimeLogEntry = {
    id: `runtime-log-draft.damage.${actorId}.${targetId}.${actionId}`,
    timestamp,
    system: 'dnd',
    kind: 'damage',
    title: '匕首伤害',
    summary: hit ? `${targetName} 受到 ${damageTotal} 点穿刺伤害` : '攻击未命中，未造成伤害',
    displayValue: damageTotal,
    calculation: hit ? damageRoll?.breakdown?.join('  ') : undefined,
    outcome: hit ? '命中' : '未命中',
    visibility: 'public',
    actorId,
    actorName,
    targetId,
    targetName,
    tags: ['weapon', 'damage', 'dagger'],
  };

  if (appliedChanges && appliedChanges.length > 0) {
    const hpDeltas = appliedChanges
      .filter((c) => c.type === 'hpChange')
      .map((c) => {
        const payload = c.payload as { delta?: number } | undefined;
        return typeof payload?.delta === 'number' ? payload.delta : 0;
      });
    if (hpDeltas.length > 0) {
      notes.push(`Applied hpChange deltas (recorded by applier, not by this log): ${hpDeltas.join(', ')}.`);
    }
  } else {
    notes.push('No applied RuntimeChanges provided; drafts reflect the resolver result only.');
  }

  notes.push('Drafts only — not persisted. Set a real timestamp at append time.');

  return { entries: [attackEntry, damageEntry], notes };
}
