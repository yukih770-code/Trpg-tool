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
import type { GeneratedArtifactPersistencePort } from '../services/generatedArtifactPersistence.js';
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
const created = createRoom({
  displayName: '雾港之夜',
  hostDisplayName: '主持人',
  hostUserId: 'user_host',
  systemId: 'dnd5e-2024',
  sessionId: 'runtime_session_1',
  campaignRef: { source: 'localCampaignLibrary', worldServerId: 'world_1', campaignId: 'campaign_1', displayName: '雾港战役', systemId: 'dnd5e-2024' },
}).room;
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
assert(seed.event);
assert.equal(logs.confirmPending(created.identity.roomId, seed.event.eventId), 'confirmed');

let requestSeen: StructuredModelRequest | undefined;
let routingModelSeen = '';
let suggestionNumber = 0;
let forceMismatchedTask = false;
const generatedTask = (request: StructuredModelRequest): RoomSessionAssistantTask =>
  request.prompt.includes('任务：preparation') ? 'preparation'
    : request.prompt.includes('任务：in_session') ? 'in_session'
      : request.prompt.includes('任务：character_biography') ? 'character_biography'
        : request.prompt.includes('任务：quest_log') ? 'quest_log'
          : 'recap';
const gateway: ModelGateway = {
  generateCampaignArtifactSuggestion: async () => { throw new Error('not used'); },
  catalog: async () => ({
    local: { configured: true, reachable: true, defaultModel: 'local-model' },
    cloud: { configured: false, reason: 'not-implemented' },
    models: [{ id: 'local-model', provider: 'ollama', route: 'local', installed: true, recommended: false, capabilities: ['structured-output', 'cancellation', 'timeout'] }],
    refreshedAt: 1,
  }),
  status: async () => ({
    configured: true, reachable: true, provider: 'ollama', route: 'local', model: 'local-model',
    capabilities: ['structured-output', 'cancellation', 'timeout'],
  }),
  generateDndCharacterSuggestion: async () => { throw new Error('not used'); },
  generateRoomSessionSuggestion: async (request, _signal, preference) => {
    requestSeen = request;
    routingModelSeen = preference?.localModel ?? '';
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
let campaignManagerAllowed = true;
let persistedArtifactInput: Parameters<GeneratedArtifactPersistencePort['createArtifactWithSources']>[0] | undefined;
const broadcasts: string[] = [];
const handlers = createRoomSessionAssistantApiHandlers({
  roomRegistry: rooms,
  runtimeLogRegistry: logs,
  roomMapRegistry: maps,
  gateway,
  suggestionRegistry: createRoomSessionAssistantSuggestionRegistry({ now: () => clock }),
  now: () => clock,
  ttlMs: 60_000,
  campaignArtifactWorldRepository: {
    getWorldServerById: async () => ({ ok: true, value: { ownerId: campaignManagerAllowed ? 'user_host' : 'another_owner' } }),
    getWorldServerMembershipByUser: async () => ({ ok: true, value: campaignManagerAllowed ? { roleKey: 'admin', membershipStatus: 'active' } : { roleKey: 'player', membershipStatus: 'active' } }),
    getWorldServerCampaignBindingByPair: async () => ({ ok: true, value: {} }),
  },
  campaignArtifactPersistence: {
    createArtifactWithSources: async (input) => {
      persistedArtifactInput = input;
      return {
        ok: true,
        artifact: {
          artifactId: input.artifact.artifactId,
          ownerId: input.artifact.ownerId,
          campaignId: input.artifact.campaignId,
          runtimeSessionId: input.artifact.runtimeSessionId,
          artifactKind: input.artifact.artifactKind,
          title: input.artifact.title,
          summary: input.artifact.summary,
          contentFormat: input.artifact.contentFormat ?? 'structured_json',
          visibilityScope: input.artifact.visibilityScope ?? 'user_private',
          payload: input.artifact.payload ?? {},
          sourcePayload: input.artifact.sourcePayload ?? {},
          modelPayload: input.artifact.modelPayload ?? {},
          schemaVersion: input.artifact.schemaVersion ?? 1,
          createdAt: new Date(clock).toISOString(),
          updatedAt: new Date(clock).toISOString(),
        },
        sources: input.sources.map((source) => ({
          contextSourceId: source.contextSourceId,
          ownerId: source.ownerId,
          campaignId: source.campaignId,
          artifactId: source.artifactId,
          sourceKind: source.sourceKind,
          sourceRefId: source.sourceRefId,
          sourcePayload: source.sourcePayload ?? {},
          schemaVersion: source.schemaVersion ?? 1,
        })),
      };
    },
    createMemoryWithSources: async () => ({ ok: false, kind: 'database_error', retryable: false }),
  },
  isRoomRuntimeReady: () => roomRuntimeReady,
  confirmRuntimeLogAppend: async (event) => logs.confirmPending(event.roomId, event.eventId) === 'confirmed',
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
  headers: { 'x-trpg-ai-mode': 'local', 'x-trpg-ai-model': 'qwen3.6:27b' },
  body: { memberId: host.memberId, task: 'recap', focus: '保持简短', events: ['client-forged-event'] },
});
assert.equal(staleDraft.ok, true);
assert.equal(routingModelSeen, 'qwen3.6:27b');
assert(requestSeen?.prompt.includes('真正的幕后线索'));
assert(!requestSeen?.prompt.includes('client-forged-event'));
assert(!requestSeen?.prompt.includes(host.memberId));
assert(!requestSeen?.prompt.includes(created.identity.roomId));
const staleValue = staleDraft.ok ? staleDraft.value as RoomSessionAssistantSuggestionResult : undefined;
assert(staleValue);
const contextChange = appendRuntimeLogEvent(rooms, logs, {
  roomId: created.identity.roomId,
  authorMemberId: host.memberId,
  kind: 'host.note',
  visibility: 'hostOnly',
  text: '上下文随后发生变化',
});
assert.equal(contextChange.decision, 'appended');
assert(contextChange.event);
assert.equal(logs.confirmPending(created.identity.roomId, contextChange.event.eventId), 'confirmed');
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

assert.equal((await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'character_biography' } })).statusCode, 400);
const biographyDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'character_biography', focus: '人物：洛恩；只整理本场可见经历' } });
assert(biographyDraft.ok);
assert(requestSeen?.prompt.includes('人物：洛恩'));
assert(requestSeen?.system.includes('never claim to update a character sheet'));
const biographyValue = biographyDraft.value as RoomSessionAssistantSuggestionResult;
assert.equal(biographyValue.task, 'character_biography');
assert((await handlers.confirm({ ...base, suggestionId: biographyValue.suggestionId, body: { visibility: 'hostOnly' } })).ok);

const questDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'quest_log' } });
assert(questDraft.ok);
assert(requestSeen?.system.includes('authoritative quest state was changed'));
const questValue = questDraft.value as RoomSessionAssistantSuggestionResult;
assert.equal(questValue.task, 'quest_log');
assert((await handlers.confirm({ ...base, suggestionId: questValue.suggestionId, body: { visibility: 'hostOnly' } })).ok);
assert.equal(broadcasts.length, 4);

const savedBiographyDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'character_biography', focus: '人物：洛恩' } });
assert(savedBiographyDraft.ok);
const savedBiographyValue = savedBiographyDraft.value as RoomSessionAssistantSuggestionResult;
assert.equal(savedBiographyValue.artifactDestination?.runtimeSessionId, 'runtime_session_1');
const savedBiography = await handlers.saveArtifact({ ...base, suggestionId: savedBiographyValue.suggestionId, body: { memberId: host.memberId } });
assert(savedBiography.ok);
assert.equal(savedBiography.statusCode, 201);
assert.equal(persistedArtifactInput?.artifact.campaignId, 'campaign_1');
assert.equal(persistedArtifactInput?.artifact.runtimeSessionId, 'runtime_session_1');
assert.equal(persistedArtifactInput?.artifact.artifactKind, 'room_session_ai_character_biography');
assert.equal(persistedArtifactInput?.artifact.visibilityScope, 'user_private');
assert.equal(persistedArtifactInput?.sources.length, 1);
assert.equal(persistedArtifactInput?.sources[0]?.sourceKind, 'runtime_session_projection');
assert(!JSON.stringify(persistedArtifactInput?.artifact.sourcePayload).includes('真正的幕后线索'));
assert.equal((await handlers.saveArtifact({ ...base, suggestionId: savedBiographyValue.suggestionId, body: { memberId: host.memberId } })).statusCode, 404);

const ineligibleDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'recap' } });
assert(ineligibleDraft.ok);
assert.equal((await handlers.saveArtifact({ ...base, suggestionId: (ineligibleDraft.value as RoomSessionAssistantSuggestionResult).suggestionId, body: { memberId: host.memberId } })).statusCode, 409);

campaignManagerAllowed = false;
const unauthorizedSaveDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'quest_log' } });
assert(unauthorizedSaveDraft.ok);
assert.equal((await handlers.saveArtifact({ ...base, suggestionId: (unauthorizedSaveDraft.value as RoomSessionAssistantSuggestionResult).suggestionId, body: { memberId: host.memberId } })).statusCode, 403);
campaignManagerAllowed = true;

const staleSaveDraft = await handlers.generate({ ...base, body: { memberId: host.memberId, task: 'quest_log' } });
assert(staleSaveDraft.ok);
const saveContextChange = appendRuntimeLogEvent(rooms, logs, { roomId: created.identity.roomId, authorMemberId: host.memberId, kind: 'host.note', visibility: 'hostOnly', text: '保存前日志变化' });
assert.equal(saveContextChange.decision, 'appended');
assert(saveContextChange.event);
assert.equal(logs.confirmPending(created.identity.roomId, saveContextChange.event.eventId), 'confirmed');
assert.equal((await handlers.saveArtifact({ ...base, suggestionId: (staleSaveDraft.value as RoomSessionAssistantSuggestionResult).suggestionId, body: { memberId: host.memberId } })).statusCode, 409);

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

console.log('Room Session AI API handler smoke passed: host/manager authority, bounded projection, stale/expiry rejection, one-shot RuntimeLog append, private campaign artifact persistence, and public redaction.');
