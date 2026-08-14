import assert from 'node:assert/strict';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { ModelGateway, StructuredModelRequest } from '../ai/modelGateway.js';
import { createRoomSessionAssistantSuggestionRegistry } from '../ai/roomSessionAssistantRegistry.js';
import { createInMemoryRoomMapRegistry } from '../room-map-registry.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createInMemoryRuntimeLogRegistry } from '../runtime-log-registry.js';
import { appendRuntimeLogEvent } from '../services/appendRuntimeLogEvent.js';
import { approveMember } from '../services/approveMember.js';
import { createRoom } from '../services/createRoom.js';
import { joinRoom } from '../services/joinRoom.js';
import type { RoomSessionAssistantTask, RoomSessionAssistantSuggestionResult } from '../../src/lib/ai/sessionAssistantTypes.js';
import { createRoomSessionAssistantApiHandlers } from './roomSessionAssistantHandlers.js';

function viewer(userId: string | null): CurrentViewerContext {
  return {
    viewerUserId: userId,
    isAuthenticated: userId !== null,
    authTrustLevel: userId ? 'verified_session' : 'anonymous',
    isDevOnly: false,
    isServiceInternal: false,
    notes: [],
  };
}

const rooms = createInMemoryRoomRegistry();
const created = createRoom({ displayName: '雾港之夜', hostDisplayName: '主持人', hostUserId: 'user_host', systemId: 'dnd5e-2024' }).room;
rooms.create(created);
const host = created.members[0]!;
const joined = joinRoom(rooms, {
  inviteCodeOrRoomCode: created.identity.roomCode,
  requestedDisplayName: '玩家',
  requestedRole: 'player',
  userId: 'user_player',
});
assert(joined.memberId);
assert.equal(approveMember(rooms, { roomId: created.identity.roomId, memberId: joined.memberId, decidedByMemberId: host.memberId }).decision, 'approved');

const logs = createInMemoryRuntimeLogRegistry();
const maps = createInMemoryRoomMapRegistry();
const seed = appendRuntimeLogEvent(rooms, logs, {
  roomId: created.identity.roomId,
  authorMemberId: host.memberId,
  kind: 'host.note',
  visibility: 'hostOnly',
  text: '真正的幕后线索',
});
assert.equal(seed.decision, 'appended');

let requestSeen: StructuredModelRequest | undefined;
let suggestionNumber = 0;
let forceMismatchedTask = false;
const generatedTask = (request: StructuredModelRequest): RoomSessionAssistantTask =>
  request.prompt.includes('任务：preparation') ? 'preparation'
    : request.prompt.includes('任务：in_session') ? 'in_session'
      : 'recap';
const gateway: ModelGateway = {
  status: async () => ({
    configured: true, reachable: true, provider: 'ollama', route: 'local', model: 'local-model',
    capabilities: ['structured-output', 'cancellation', 'timeout'],
  }),
  generateDndCharacterSuggestion: async () => { throw new Error('not used'); },
  generateRoomSessionSuggestion: async (request) => {
    requestSeen = request;
    suggestionNumber += 1;
    const requestedTask = generatedTask(request);
    const task = forceMismatchedTask ? (requestedTask === 'recap' ? 'preparation' : 'recap') : requestedTask;
    return {
      suggestionId: `suggestion_${suggestionNumber}`,
      task,
      provider: 'ollama',
      route: 'local',
      model: 'local-model',
      createdAt: 1_000 + suggestionNumber,
      suggestion: {
        version: 1,
        task,
        title: '雾港回顾',
        summary: '主持人摘要',
        highlights: ['发现线索'],
        risks: ['规则细节待人工确认'],
        suggestedNextSteps: ['询问守卫'],
        hostDraft: '主持人私密草稿',
        publicDraft: '玩家可见回顾',
      },
    };
  },
};

let clock = 10_000;
let roomRuntimeReady = false;
const broadcasts: string[] = [];
const handlers = createRoomSessionAssistantApiHandlers({
  roomRegistry: rooms,
  runtimeLogRegistry: logs,
  roomMapRegistry: maps,
  gateway,
  suggestionRegistry: createRoomSessionAssistantSuggestionRegistry({ now: () => clock }),
  now: () => clock,
  ttlMs: 60_000,
  isRoomRuntimeReady: () => roomRuntimeReady,
  confirmRuntimeLogAppend: async () => true,
  broadcastRuntimeLogAppended: (_roomId, events) => broadcasts.push(...events.map((event) => event.eventId)),
});
const base = { roomId: created.identity.roomId, viewer: viewer('user_host'), memberId: host.memberId };

assert.equal((await handlers.status(base)).statusCode, 503);
roomRuntimeReady = true;
assert.equal((await handlers.status(base)).ok, true);
assert.equal((await handlers.status({ ...base, viewer: viewer(null) })).statusCode, 401);
assert.equal((await handlers.status({ ...base, viewer: viewer('user_other') })).statusCode, 403);
assert.equal((await handlers.status({ ...base, viewer: viewer('user_player'), memberId: joined.memberId })).statusCode, 403);

const staleDraft = await handlers.generate({
  ...base,
  body: { memberId: host.memberId, task: 'recap', focus: '保持简短', events: ['client-forged-event'] },
});
assert.equal(staleDraft.ok, true);
assert(requestSeen?.prompt.includes('真正的幕后线索'));
assert(!requestSeen?.prompt.includes('client-forged-event'));
assert(!requestSeen?.prompt.includes(host.memberId));
assert(!requestSeen?.prompt.includes(created.identity.roomId));
const staleValue = staleDraft.ok ? staleDraft.value as RoomSessionAssistantSuggestionResult : undefined;
assert(staleValue);
assert.equal(appendRuntimeLogEvent(rooms, logs, {
  roomId: created.identity.roomId,
  authorMemberId: host.memberId,
  kind: 'host.note',
  visibility: 'hostOnly',
  text: '上下文随后发生变化',
}).decision, 'appended');
assert.equal((await handlers.confirm({ ...base, suggestionId: staleValue.suggestionId, body: { visibility: 'hostOnly' } })).statusCode, 409);

const privateDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'in_session' } });
assert(privateDraft.ok);
const privateValue = privateDraft.value as RoomSessionAssistantSuggestionResult;
const privateConfirmation = await handlers.confirm({ ...base, suggestionId: privateValue.suggestionId, body: { visibility: 'hostOnly' } });
assert(privateConfirmation.ok);
if (!privateConfirmation.ok) throw new Error('private confirmation must succeed');
const privateEvent = (privateConfirmation.value as { event: { text?: string; payload?: unknown } }).event;
assert.equal(privateEvent.text, '主持人私密草稿');
assert.equal((privateEvent.payload as { summary?: string }).summary, '主持人摘要');
assert.equal(broadcasts.length, 1);
assert.equal((await handlers.confirm({ ...base, suggestionId: privateValue.suggestionId, body: { visibility: 'hostOnly' } })).statusCode, 404);

const publicDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'recap' } });
assert(publicDraft.ok);
const publicValue = publicDraft.value as RoomSessionAssistantSuggestionResult;
const publicConfirmation = await handlers.confirm({ ...base, suggestionId: publicValue.suggestionId, body: { visibility: 'public' } });
assert(publicConfirmation.ok);
if (!publicConfirmation.ok) throw new Error('public confirmation must succeed');
const publicEvent = (publicConfirmation.value as { event: { text?: string; visibility: string; payload?: unknown } }).event;
assert.equal(publicEvent.text, '玩家可见回顾');
assert.equal(publicEvent.visibility, 'public');
assert.equal((publicEvent.payload as { summary?: string }).summary, undefined);
assert.equal((publicEvent.payload as { title?: string }).title, undefined);
assert.equal((publicEvent.payload as { contextFingerprint?: string }).contextFingerprint, undefined);
assert.equal(broadcasts.length, 2);

const expiringDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'preparation' } });
assert(expiringDraft.ok);
clock += 60_001;
assert.equal((await handlers.confirm({
  ...base,
  suggestionId: (expiringDraft.value as RoomSessionAssistantSuggestionResult).suggestionId,
  body: { visibility: 'hostOnly' },
})).statusCode, 409);

assert.equal((await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'invalid' } })).statusCode, 400);
forceMismatchedTask = true;
assert.equal((await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'recap' } })).statusCode, 503);
forceMismatchedTask = false;
assert.equal((await handlers.confirm({ ...base, suggestionId: 'missing', body: { visibility: 'actorPrivate' } })).statusCode, 400);

console.log('Room Session AI API handler smoke passed: host authority, server projection, stale/expiry rejection, one-shot append, and public redaction.');
