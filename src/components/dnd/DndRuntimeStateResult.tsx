import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';
import type { Combatant } from '../../lib/combat/combatRuntimeTypes';
import { dndConditionLabel } from '../../lib/dnd/dndConditions';
import { replayDndRuntimeResources } from '../../lib/dnd/dndRuntimeResources';

/** Render only the viewer's projected fields; shared log text stays conservative. */
export function DndRuntimeStateResult({ event }: { event: RoomRuntimeLogEvent }) {
  const payload = event.payload as Record<string, unknown> | undefined;
  if (event.kind === 'combat.conditions_updated') {
    const target = (payload?.combatants as Combatant[] | undefined)?.find(c => c.id === payload?.targetCombatantId);
    return <p className="mt-1 text-xs">{target?.displayName ? `${target.displayName} · ` : ''}状态已更新{target?.conditionStates ? ` · ${target.conditionStates.map(s => s.systemId === 'dnd5e-2024' ? dndConditionLabel(s) : s.conditionId).join('、') || '无状态'}` : ''}</p>;
  }
  if (event.kind === 'runtime.resource_changed') {
    const facts = payload?.resolution as Record<string, unknown> | undefined;
    const pools = typeof payload?.actorInstanceId === 'string' ? Object.values(replayDndRuntimeResources([event], payload.actorInstanceId)) : [];
    return <div className="mt-1 text-xs"><p>{typeof facts?.spellName === 'string' ? `施展 ${facts.spellName} · 效果由主持人裁定` : '资源已更新'}</p>{pools.map(r => <p key={r.id}>{r.label} · {r.current} / {r.max}</p>)}</div>;
  }
  return null;
}
