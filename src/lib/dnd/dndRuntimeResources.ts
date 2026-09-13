import type { DndResourceRef, DndResourceState } from '../dnd2024/gameplay/resourceTypes.js';

export interface DndRuntimeResource extends DndResourceState {
  id: string;
  label: string;
  max: number;
  resource: DndResourceRef;
}
export type DndRuntimeSpell = { id: string; name: string; level: number };
export type DndResourceIntent = {
  intentId: string; actorInstanceId: string; operation: 'spend' | 'set' | 'cast';
  resourceId?: string; amount?: number; spellId?: string;
};

/** Outcomes only. Character derivation, spell rules and RNG never run here. */
export function replayDndRuntimeResources(events: readonly { kind: string; payload?: unknown }[], actorInstanceId: string): Record<string, DndRuntimeResource> {
  const resources: Record<string, DndRuntimeResource> = Object.create(null);
  for (const event of events) {
    if (event.kind !== 'runtime.resource_changed' || !event.payload || typeof event.payload !== 'object') continue;
    const payload = event.payload as Record<string, unknown>;
    if (payload.actorInstanceId !== actorInstanceId) continue;
    const values = Array.isArray(payload.resources) ? payload.resources : Array.isArray(payload.mutations) ? payload.mutations.flatMap(value => {
      if (!value || typeof value !== 'object') return [];
      const m = value as Record<string, unknown>, meta = m.metadata as Record<string, unknown> | undefined;
      return m.type === 'systemResource' && m.actorInstanceId === actorInstanceId && meta ? [{ id: m.resourceId, current: m.after, max: m.max, label: meta.label, resource: meta.resource }] : [];
    }) : [];
    for (const value of values) {
      if (!value || typeof value !== 'object') continue;
      const r = value as DndRuntimeResource;
      if (typeof r.id !== 'string' || !r.id || r.id === '__proto__' || r.id === 'constructor' || r.id === 'prototype' || !Number.isSafeInteger(r.current) || !Number.isSafeInteger(r.max) || r.current < 0 || r.current > r.max) continue;
      if (!r.resource || !['spellSlot', 'classResource', 'custom'].includes(r.resource.kind)) continue;
      resources[r.id] = { id: r.id, label: typeof r.label === 'string' ? r.label : r.id, current: r.current, max: r.max,
        resource: { kind: r.resource.kind, resourceId: r.resource.resourceId, level: r.resource.level }, refresh: 'manual' };
    }
  }
  return resources;
}
