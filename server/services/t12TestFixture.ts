import { randomUUID } from 'node:crypto';
import { createRoom } from './createRoom.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createInMemoryRuntimeLogRegistry } from '../runtime-log-registry.js';
import { createInMemoryRoomMapRegistry } from '../room-map-registry.js';
import { createCombatant } from '../../src/lib/combat/combatRuntimeTypes.js';
import type { RuntimeEventRecord, RuntimeSessionRecord, PostgresRuntimeEventRepository } from '../adapters/postgresRuntimeEventRepository.js';
import type { CampaignActorInstanceRecord } from '../adapters/postgresPlatformFoundationRepository.js';
import { persistLiveRoomRuntimeLogEvent } from './liveRoomRuntimeLogPersistence.js';
import type { RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes.js';

export function t12Fixture() {
  const room = createRoom({ hostDisplayName: 'Host', hostUserId: 'host-user', sessionId: 'session',
    campaignRef: { campaignId: 'campaign', worldServerId: 'world', systemId: 'dnd5e-2024', displayName: 'Campaign', source: 'unknown' } }).room;
  room.members[0].memberId = 'host';
  room.members.push({ memberId: 'player', userId: 'player-user', displayName: 'Player', role: 'player', status: 'active' },
    { memberId: 'other', userId: 'other-user', displayName: 'Other', role: 'player', status: 'active' },
    { memberId: 'spectator', userId: 'spectator-user', displayName: 'Spectator', role: 'spectator', status: 'active' });
  room.lobby = { actorBindings: [], readyStates: [] };
  room.lobby.actorBindings.push({ bindingId: 'binding', memberId: 'player', status: 'approved', submittedAt: new Date().toISOString(), campaignActorInstanceId: 'pc-actor',
    actorRef: { systemId: 'dnd5e-2024', displayName: 'PC', source: 'unknown' } });
  const rooms = createInMemoryRoomRegistry(); rooms.create(room);
  const log = createInMemoryRuntimeLogRegistry();
  const maps = createInMemoryRoomMapRegistry();
  const actor = createCombatant({ id: 'pc', sourceActorInstanceId: 'pc-actor', kind: 'character', hpCurrent: 20, hpMax: 20, armorClass: 15, initiativeModifier: 0, conditions: [] });
  const target = createCombatant({ id: 'npc', sourceActorInstanceId: 'npc-actor', kind: 'npc', hpCurrent: 30, hpMax: 30, armorClass: 15, temporaryHp: 4, initiativeModifier: 0, conditions: [] });
  const seed = log.append(room.identity.roomId, { eventId: 'seed', roomId: room.identity.roomId, createdAt: new Date().toISOString(), authorMemberId: 'host',
    kind: 'combat.started', visibility: 'public', campaignRef: room.campaignRef, payload: { combatants: [actor, target], roundNumber: 1, turnIndex: 0, activeCombatantId: 'pc' } });
  const actionPayload = { dndLiteActorSheetV1: { schemaVersion: 1, actions: [{ id: 'sword', name: 'Secret sword', kind: 'weapon_attack', attackBonus: 5, damageFormula: '1d8+3' }] } };
  const actors = new Map<string, CampaignActorInstanceRecord>(['pc', 'npc'].map((id) => [`${id}-actor`, {
    campaignActorInstanceId: `${id}-actor`, campaignId: 'campaign', ownerId: id === 'pc' ? 'player-user' : undefined,
    actorKind: id, displayName: id, instanceStatus: 'active', snapshotPayload: {}, overridePayload: actionPayload,
  }]));
  const repository = { getCampaignActorInstanceById: async (id: string) => ({ ok: true as const, value: actors.get(id) ?? null }) };
  const events: RuntimeEventRecord[] = [];
  const session: RuntimeSessionRecord = { runtimeSessionId: 'session', campaignId: 'campaign', roomId: room.identity.roomId, status: 'active', payload: {}, schemaVersion: 1 };
  const persistence: Pick<PostgresRuntimeEventRepository, 'getRuntimeSessionById' | 'createRuntimeSession' | 'listRuntimeEvents' | 'appendRuntimeEvent'> = {
    getRuntimeSessionById: async () => ({ ok: true, value: session }),
    createRuntimeSession: async () => ({ ok: true, value: session }),
    listRuntimeEvents: async (_id, options) => ({ ok: true, value: events.filter((e) => e.seq > (options?.afterSeq ?? 0)).slice(0, options?.limit ?? 100) }),
    appendRuntimeEvent: async (input) => {
      const duplicate = events.find((e) => e.idempotencyKey === input.idempotencyKey);
      if (duplicate) return { ok: true, value: duplicate };
      const event: RuntimeEventRecord = { ...input, seq: events.length + 1, visibility: input.visibility ?? 'campaign', payload: input.payload ?? {}, schemaVersion: 1, createdAt: new Date().toISOString() };
      events.push(JSON.parse(JSON.stringify(event)));
      return { ok: true, value: event };
    },
  };
  const confirm = async (event: RoomRuntimeLogEvent) => {
    const result = await persistLiveRoomRuntimeLogEvent(persistence, room, event);
    if (result.status !== 'persisted') return false;
    log.confirmPending(room.identity.roomId, event.eventId); return true;
  };
  const intent = { intentId: randomUUID(), actorCombatantId: 'pc', targetCombatantId: 'npc', actionId: 'sword', mode: 'normal' as const };
  return { room, rooms, log, maps, actor, target, seed, actionPayload, actors, repository, events, session, persistence, confirm, intent };
}
