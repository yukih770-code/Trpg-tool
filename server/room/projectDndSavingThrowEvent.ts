import type { RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes.js';
import { DND_ABILITY_KEYS } from '../../src/lib/dnd/dndLiteActorTypes.js';

/** GM requests are public challenges, like existing public room checks. */
export function projectDndSavingThrowEvent(event: RoomRuntimeLogEvent): Record<string, unknown> {
  const p = event.payload as Record<string, unknown> | undefined;
  const f = p?.resolution as Record<string, unknown> | undefined;
  const resolution: Record<string, unknown> = {};
  if (typeof p?.actorInstanceId === 'string') resolution.actorInstanceId = p.actorInstanceId;
  if ((DND_ABILITY_KEYS as readonly unknown[]).includes(f?.ability)) resolution.ability = f!.ability;
  if (['normal', 'advantage', 'disadvantage'].includes(f?.mode as string)) resolution.mode = f!.mode;
  for (const key of ['dc', 'keptRoll', 'modifier', 'total'] as const) if (Number.isSafeInteger(f?.[key])) resolution[key] = f![key];
  if (Array.isArray(f?.rawRolls)) resolution.rawRolls = f.rawRolls.filter(n => Number.isInteger(n) && n >= 1 && n <= 20).slice(0, 2);
  if (f?.outcome === 'success' || f?.outcome === 'failure') resolution.outcome = f.outcome;
  if (typeof f?.challengeEventId === 'string') resolution.challengeEventId = f.challengeEventId;
  return { resolution };
}
