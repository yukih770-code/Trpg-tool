import { createHash } from 'node:crypto';
import type { RoomMapEvent, RoomRuntimeLogEvent, RoomSnapshot } from '../protocol/room-protocol.js';
import { projectRuntimeLogEventsForViewer } from '../room/roomRuntimeVisibilityProjection.js';

export type RoomSessionAssistantContextEvent = {
  seq: number;
  createdAt: string;
  kind: string;
  visibility: 'public' | 'hostOnly';
  authorDisplayName?: string;
  text?: string;
  payload?: Record<string, unknown>;
};

export type RoomSessionAssistantContextPack = {
  room: {
    displayName: string;
    systemId: string;
  };
  viewer: { displayName: string; role: 'host' };
  latestSeq: number;
  eventCount: number;
  events: RoomSessionAssistantContextEvent[];
  fingerprint: string;
};

export type RoomSessionAssistantContextDecision =
  | { decision: 'ready'; context: RoomSessionAssistantContextPack }
  | { decision: 'host_required' | 'member_inactive' };

function short(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function primitive(value: unknown): string | number | boolean | null | undefined {
  if (value === null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return short(value, 300);
}

function projectedPayload(event: RoomRuntimeLogEvent): Record<string, unknown> | undefined {
  const source = event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
    ? event.payload as Record<string, unknown>
    : null;
  if (!source) return undefined;
  if (event.kind === 'dice.roll') {
    const result = Object.fromEntries(['label', 'expression', 'total'].flatMap((key) => {
      const value = primitive(source[key]);
      return value === undefined ? [] : [[key, value]];
    }));
    return Object.keys(result).length ? result : undefined;
  }
  if (event.kind.startsWith('combat.')) {
    const combatants = Array.isArray(source.combatants)
      ? source.combatants.slice(0, 20).flatMap((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
          const row = item as Record<string, unknown>;
          return [{
            displayName: short(row.displayName ?? row.name, 120) ?? '未命名对象',
            status: short(row.status, 80),
            isDefeated: row.isDefeated === true,
            conditions: Array.isArray(row.conditions)
              ? row.conditions.slice(0, 8).flatMap((condition) => short(condition, 80) ?? [])
              : [],
          }];
        })
      : [];
    return {
      roundNumber: primitive(source.roundNumber),
      turnIndex: primitive(source.turnIndex),
      combatantCount: primitive(source.combatantCount),
      combatants,
    };
  }
  const allowedKeys = ['label', 'reason', 'stateKey', 'before', 'after', 'value', 'sceneName'];
  const result = Object.fromEntries(allowedKeys.flatMap((key) => {
    const value = primitive(source[key]);
    return value === undefined ? [] : [[key, value]];
  }));
  return Object.keys(result).length ? result : undefined;
}

function boundedEvents(events: RoomSessionAssistantContextEvent[]): RoomSessionAssistantContextEvent[] {
  const selected: RoomSessionAssistantContextEvent[] = [];
  let bytes = 0;
  for (const event of [...events].reverse()) {
    const size = JSON.stringify(event).length;
    if (selected.length >= 80 || bytes + size > 30_000) break;
    selected.push(event);
    bytes += size;
  }
  return selected.reverse();
}

export function buildRoomSessionAssistantContext(input: {
  room: RoomSnapshot;
  memberId: string;
  runtimeEvents: readonly RoomRuntimeLogEvent[];
  mapEvents: readonly RoomMapEvent[];
  latestSeq: number;
}): RoomSessionAssistantContextDecision {
  const member = input.room.members.find((candidate) => candidate.memberId === input.memberId);
  if (!member || member.status !== 'active') return { decision: 'member_inactive' };
  if (member.role !== 'host') return { decision: 'host_required' };
  const projected = projectRuntimeLogEventsForViewer(input.room, input.memberId, input.runtimeEvents, input.mapEvents);
  const names = new Map(input.room.members.map((candidate) => [candidate.memberId, candidate.displayName]));
  const events = boundedEvents(projected.map((event) => ({
    seq: event.seq,
    createdAt: event.createdAt,
    kind: event.kind,
    visibility: event.visibility === 'hostOnly' ? 'hostOnly' : 'public',
    authorDisplayName: event.authorMemberId ? names.get(event.authorMemberId) : undefined,
    text: short(event.text, 1_200),
    payload: projectedPayload(event),
  })));
  const base = {
    room: {
      displayName: input.room.identity.displayName ?? '未命名房间',
      systemId: input.room.identity.systemId,
    },
    viewer: { displayName: member.displayName, role: 'host' as const },
    latestSeq: input.latestSeq,
    eventCount: events.length,
    events,
  };
  return {
    decision: 'ready',
    context: {
      ...base,
      fingerprint: createHash('sha256').update(JSON.stringify(base)).digest('hex'),
    },
  };
}
