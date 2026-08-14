import assert from 'node:assert/strict';
import { createRoom } from '../services/createRoom.js';
import type { RoomRuntimeLogEvent, RoomSnapshot } from '../protocol/room-protocol.js';
import { buildRoomSessionAssistantContext } from './roomSessionAssistantContext.js';
import { createRoomSessionAssistantSuggestionRegistry, type StoredRoomSessionAssistantSuggestion } from './roomSessionAssistantRegistry.js';

const created = createRoom({ displayName: '雾港', hostDisplayName: '主持人', hostUserId: 'user_host', systemId: 'dnd5e-2024' }).room;
const host = created.members[0]!;
const player = {
  memberId: 'member_player', userId: 'user_player', displayName: '玩家', role: 'player' as const,
  status: 'active' as const, joinedAt: created.identity.createdAt, lastSeenAt: created.identity.createdAt,
};
const room: RoomSnapshot = { ...created, members: [...created.members, player] };
const nowIso = new Date().toISOString();
const runtimeEvents: RoomRuntimeLogEvent[] = Array.from({ length: 90 }, (_, index) => ({
  eventId: `event_${index + 1}`,
  roomId: room.identity.roomId,
  seq: index + 1,
  createdAt: nowIso,
  authorMemberId: index % 2 === 0 ? host.memberId : player.memberId,
  actorBindingId: index === 89 ? 'binding_secret' : undefined,
  kind: index === 88 ? 'host.note' : 'chat.message',
  visibility: index === 88 ? 'hostOnly' : 'public',
  text: index === 89 ? `结尾${'长'.repeat(2_000)}` : `事件 ${index + 1}`,
  payload: { reason: '可见原因', forbiddenId: 'opaque-secret' },
}));

const playerContext = buildRoomSessionAssistantContext({ room, memberId: player.memberId, runtimeEvents, mapEvents: [], latestSeq: 90 });
assert.equal(playerContext.decision, 'host_required');
const hostContext = buildRoomSessionAssistantContext({ room, memberId: host.memberId, runtimeEvents, mapEvents: [], latestSeq: 90 });
assert.equal(hostContext.decision, 'ready');
if (hostContext.decision !== 'ready') throw new Error('host context must be ready');
assert.equal(hostContext.context.eventCount, 80);
assert.equal(hostContext.context.events.at(-1)?.text?.length, 1_200);
assert(hostContext.context.events.some((event) => event.visibility === 'hostOnly'));
const serializedContext = JSON.stringify(hostContext.context);
assert(!serializedContext.includes(host.memberId));
assert(!serializedContext.includes(player.memberId));
assert(!serializedContext.includes('binding_secret'));
assert(!serializedContext.includes('opaque-secret'));
assert.equal(hostContext.context.fingerprint.length, 64);

let clock = 1_000;
const registry = createRoomSessionAssistantSuggestionRegistry({ now: () => clock, maxEntries: 2 });
const stored = (id: string, expiresAt = 2_000): StoredRoomSessionAssistantSuggestion => ({
  suggestionId: id,
  task: 'recap',
  provider: 'ollama',
  route: 'local',
  model: 'local-model',
  createdAt: clock,
  expiresAt,
  contextThroughSeq: 90,
  contextFingerprint: 'fingerprint',
  roomId: room.identity.roomId,
  memberId: host.memberId,
  viewerUserId: 'user_host',
  suggestion: {
    version: 1, task: 'recap', title: '回顾', summary: '摘要', highlights: ['亮点'], risks: ['风险'],
    suggestedNextSteps: ['下一步'], hostDraft: '主持人草稿', publicDraft: '公开草稿',
  },
});
registry.put(stored('one'));
assert.equal(registry.get({ suggestionId: 'one', roomId: 'other', memberId: host.memberId, viewerUserId: 'user_host' }).decision, 'forbidden');
assert.equal(registry.get({ suggestionId: 'one', roomId: room.identity.roomId, memberId: host.memberId, viewerUserId: 'other' }).decision, 'forbidden');
assert.equal(registry.get({ suggestionId: 'one', roomId: room.identity.roomId, memberId: host.memberId, viewerUserId: 'user_host' }).decision, 'ready');
assert.equal(registry.consume('one'), true);
assert.equal(registry.get({ suggestionId: 'one', roomId: room.identity.roomId, memberId: host.memberId, viewerUserId: 'user_host' }).decision, 'not_found');
registry.put(stored('expired', 1_100));
clock = 1_101;
assert.equal(registry.get({ suggestionId: 'expired', roomId: room.identity.roomId, memberId: host.memberId, viewerUserId: 'user_host' }).decision, 'expired');
registry.put(stored('two', 3_000));
registry.put(stored('three', 3_000));
registry.put(stored('four', 3_000));
assert.equal(registry.size(), 2);
assert.equal(registry.get({ suggestionId: 'two', roomId: room.identity.roomId, memberId: host.memberId, viewerUserId: 'user_host' }).decision, 'not_found');

console.log('Room Session AI context and transient registry smoke passed.');
