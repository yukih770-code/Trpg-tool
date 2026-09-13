import type { RoomSnapshot } from '../protocol/room-protocol.js';
import type { RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes.js';
import { replayDndRuntimeResources } from '../../src/lib/dnd/dndRuntimeResources.js';

/** Resources follow the existing host/own-actor action-data scope. */
export function projectDndResourceEvent(room: RoomSnapshot, memberId: string | undefined, event: RoomRuntimeLogEvent): Record<string, unknown> {
  const payload = event.payload as Record<string, unknown> | undefined;
  const actorId = typeof payload?.actorInstanceId === 'string' ? payload.actorInstanceId : undefined;
  const member = room.members.find(m => m.memberId === memberId && m.status === 'active');
  if (!member || !actorId) return {};
  const own = room.lobby?.actorBindings.some(b => b.memberId === memberId && b.campaignActorInstanceId === actorId
    && b.status === 'approved' && (!b.clearance || b.clearance.status === 'approved'));
  if (member.role !== 'host' && !(member.role === 'player' && own)) return {};
  const facts = payload?.resolution as Record<string, unknown> | undefined;
  const resolution: Record<string, unknown> = {};
  if (facts?.operation === 'spend' || facts?.operation === 'set' || facts?.operation === 'cast') resolution.operation = facts.operation;
  for (const key of ['spellId', 'spellName'] as const) if (typeof facts?.[key] === 'string') resolution[key] = facts[key];
  if (Number.isSafeInteger(facts?.spellLevel)) resolution.spellLevel = facts!.spellLevel;
  return { actorInstanceId: actorId, resources: Object.values(replayDndRuntimeResources([event], actorId)), resolution };
}
