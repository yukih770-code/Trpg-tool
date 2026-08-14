import assert from 'node:assert/strict';
import type { ModelGateway } from '../ai/modelGateway.js';
import { createCampaignArtifactAssistantApiHandlers } from './campaignArtifactAssistantHandlers.js';
import type { AiMemoryEntryRecord, GeneratedArtifactRecord } from '../adapters/postgresGeneratedArtifactRepository.js';
import type { CampaignArtifactTask } from '../../src/lib/ai/campaignArtifactAssistantTypes.js';

const campaign = { campaignId: 'campaign-1', ownerId: 'user-1', title: '灰雾古堡', description: '调查失踪的商队。', systemId: 'dnd2024', status: 'active' as const, lifecycleStatus: 'active' as const, payload: {}, schemaVersion: 1, updatedAt: '2026-08-14T00:00:00.000Z' };
const server = { worldServerId: 'server-1', ownerId: 'user-1', serverHandle: 'grey-mist', displayName: '灰雾服务器', serverVisibility: 'private', joinPolicy: 'invite_only', lifecycleStatus: 'active', publicProfilePayload: {}, serverSettingsPayload: {}, softUpdatePolicyPayload: {}, schemaVersion: 1 };
let invalidCitation = false;
let nextTask: CampaignArtifactTask = 'preparation_brief';
let citationSourceId = 'campaign:campaign-1';
const gateway: ModelGateway = {
  catalog: async () => ({ local: { configured: true, reachable: true, defaultModel: 'qwen3.6:8b' }, cloud: { configured: false, reason: 'not-implemented' }, models: [], refreshedAt: Date.now() }),
  status: async () => ({ configured: true, reachable: true, provider: 'ollama', route: 'local', model: 'qwen3.6:8b', capabilities: ['structured-output'] }),
  generateDndCharacterSuggestion: async () => { throw new Error('not used'); },
  generateRoomSessionSuggestion: async () => { throw new Error('not used'); },
  generateCampaignArtifactSuggestion: async (_request, _signal, preference) => ({
    suggestionId: `suggestion-${Date.now()}`,
    task: nextTask, provider: 'ollama', route: 'local', model: preference?.mode === 'local' ? preference.localModel ?? 'qwen3.6:8b' : 'qwen3.6:8b', createdAt: Date.now(),
    suggestion: { version: 1, task: nextTask, title: nextTask === 'worldbuilding_outline' ? '世界观提案' : nextTask === 'adventure_seed' ? '冒险种子提案' : '下次备团简报', summary: '围绕商队失踪展开。', sections: [{ heading: '开场', body: '从灰雾中的求救信号开始。', sourceIds: [invalidCitation ? 'invented-source' : citationSourceId] }], uncertainties: ['失踪原因尚未提供。'], suggestedNextSteps: ['准备两名可替换 NPC。'] },
  }),
};

const artifacts: GeneratedArtifactRecord[] = [];
const memories: AiMemoryEntryRecord[] = [];
const handlers = createCampaignArtifactAssistantApiHandlers({
  gateway,
  worldRepository: {
    getWorldServerById: async (id) => ({ ok: true, value: id === server.worldServerId ? server as never : null }),
    getWorldServerMembershipByUser: async () => ({ ok: true, value: null }),
    getWorldServerCampaignBindingByPair: async (worldServerId, campaignId) => ({ ok: true, value: worldServerId === 'server-1' && campaignId === 'campaign-1' ? { bindingId: 'binding-1', worldServerId, campaignId, bindingKind: 'hosted', visibilityScope: 'server', payload: {}, schemaVersion: 1 } : null }),
  },
  campaignRepository: { getCampaignById: async (id) => ({ ok: true, value: id === campaign.campaignId ? campaign : null }) },
  foundationRepository: {
    listCampaignActorInstances: async () => ({ ok: true, value: [{ campaignActorInstanceId: 'actor-instance-1', campaignId: 'campaign-1', actorKind: 'player_character', displayName: '艾琳', instanceStatus: 'approved', snapshotPayload: {}, overridePayload: {}, schemaVersion: 1, updatedAt: '2026-08-14T00:00:00.000Z' }] }),
    listRoomRecordsByCampaign: async () => ({ ok: true, value: [{ roomRecordId: 'room-record-1', roomId: 'room-1', worldServerId: 'server-1', campaignId: 'campaign-1', hostUserId: 'user-1', roomStatus: 'open', multiplayerMode: 'hosted', accessPolicy: {}, metadata: {}, schemaVersion: 1, updatedAt: '2026-08-14T00:00:00.000Z' }] }),
  },
  artifactRepository: {
    getGeneratedArtifactById: async (id) => ({ ok: true, value: artifacts.find((item) => item.artifactId === id) ?? null }),
    listGeneratedArtifactsByOwner: async (ownerId, options) => ({ ok: true, value: artifacts.filter((item) => item.ownerId === ownerId && (options?.includeArchived || !item.archivedAt)) }),
    archiveGeneratedArtifact: async (id) => { const item = artifacts.find((candidate) => candidate.artifactId === id); if (item) item.archivedAt = '2026-08-14T01:00:00.000Z'; return { ok: true, value: item ?? null }; },
    restoreGeneratedArtifact: async (id) => { const item = artifacts.find((candidate) => candidate.artifactId === id); if (item) delete item.archivedAt; return { ok: true, value: item ?? null }; },
    getAiMemoryEntryById: async (id) => ({ ok: true, value: memories.find((item) => item.memoryEntryId === id) ?? null }),
    listAiMemoryEntriesByOwner: async (ownerId, options) => ({ ok: true, value: memories.filter((item) => item.ownerId === ownerId && (options?.includeArchived || !item.archivedAt)) }),
    archiveAiMemoryEntry: async (id) => { const item = memories.find((candidate) => candidate.memoryEntryId === id); if (item) { item.archivedAt = '2026-08-14T03:00:00.000Z'; item.updatedAt = item.archivedAt; } return { ok: true, value: item ?? null }; },
    restoreAiMemoryEntry: async (id) => { const item = memories.find((candidate) => candidate.memoryEntryId === id); if (item) { delete item.archivedAt; item.updatedAt = '2026-08-14T04:00:00.000Z'; } return { ok: true, value: item ?? null }; },
  },
  persistence: {
    createArtifactWithSources: async ({ artifact, sources }) => {
      assert.equal(sources.length, 1, 'confirmation must persist provenance source records');
      const record: GeneratedArtifactRecord = { artifactId: artifact.artifactId, ownerId: artifact.ownerId, campaignId: artifact.campaignId, artifactKind: artifact.artifactKind, title: artifact.title, summary: artifact.summary, contentFormat: artifact.contentFormat ?? 'structured_json', visibilityScope: artifact.visibilityScope ?? 'user_private', payload: artifact.payload ?? {}, sourcePayload: artifact.sourcePayload ?? {}, modelPayload: artifact.modelPayload ?? {}, schemaVersion: artifact.schemaVersion ?? 1, createdAt: '2026-08-14T00:05:00.000Z', updatedAt: '2026-08-14T00:05:00.000Z' };
      artifacts.push(record);
      return { ok: true, artifact: record, sources: sources.map((source) => ({ contextSourceId: source.contextSourceId, ownerId: source.ownerId, campaignId: source.campaignId, artifactId: source.artifactId, sourceKind: source.sourceKind, sourceRefId: source.sourceRefId, sourcePayload: source.sourcePayload ?? {}, schemaVersion: 1 })) };
    },
    createMemoryWithSources: async ({ memory, sources }) => {
      assert.equal(sources.length, 1, 'memory adoption must persist one provenance source');
      const record: AiMemoryEntryRecord = { memoryEntryId: memory.memoryEntryId, ownerId: memory.ownerId, campaignId: memory.campaignId, sourceArtifactId: memory.sourceArtifactId, memoryKind: memory.memoryKind, memoryScope: memory.memoryScope ?? 'campaign', title: memory.title, contentText: memory.contentText, visibilityScope: memory.visibilityScope ?? 'user_private', payload: memory.payload ?? {}, sourcePayload: memory.sourcePayload ?? {}, confidence: memory.confidence, schemaVersion: memory.schemaVersion ?? 1, createdAt: '2026-08-14T00:10:00.000Z', updatedAt: '2026-08-14T00:10:00.000Z' };
      memories.push(record);
      return { ok: true, memory: record, sources: sources.map((source) => ({ contextSourceId: source.contextSourceId, ownerId: source.ownerId, campaignId: source.campaignId, memoryEntryId: source.memoryEntryId, sourceKind: source.sourceKind, sourceRefId: source.sourceRefId, sourcePayload: source.sourcePayload ?? {}, schemaVersion: 1 })) };
    },
  },
});

const viewer = { viewerUserId: 'user-1', isAuthenticated: true, authTrustLevel: 'verified_session' as const, isDevOnly: false, isServiceInternal: false, notes: [] };
const params = { worldServerId: 'server-1', campaignId: 'campaign-1' };
const generate = await handlers.generate({ viewer, params, headers: { 'x-ai-route': 'local', 'x-ai-local-model': 'qwen3.6:8b' }, body: { task: 'preparation_brief', sourceFamilies: ['campaign_summary'] } });
assert.equal(generate.statusCode, 200);
const suggestionId = (generate as unknown as { value: { suggestionId: string } }).value.suggestionId;
const confirm = await handlers.confirm({ viewer, params: { ...params, suggestionId } });
assert.equal(confirm.statusCode, 200);
assert.equal(artifacts.length, 1);
assert.equal(artifacts[0].visibilityScope, 'user_private');

const list = await handlers.list({ viewer, params, query: {} });
assert.equal(list.statusCode, 200);
assert.equal((list as unknown as { value: unknown[] }).value.length, 1);
const artifactId = artifacts[0].artifactId;
assert.equal((await handlers.archive({ viewer, params: { ...params, artifactId } })).statusCode, 200);
assert.ok(artifacts[0].archivedAt);
assert.equal((await handlers.restore({ viewer, params: { ...params, artifactId } })).statusCode, 200);
assert.equal(artifacts[0].archivedAt, undefined);

for (const creativeTask of ['worldbuilding_outline', 'adventure_seed'] as const) {
  nextTask = creativeTask;
  const creativeDraft = await handlers.generate({ viewer, params, body: { task: creativeTask, sourceFamilies: ['campaign_summary'] } });
  assert.equal(creativeDraft.statusCode, 200);
  const creativeSuggestionId = (creativeDraft as unknown as { value: { suggestionId: string } }).value.suggestionId;
  const creativeConfirm = await handlers.confirm({ viewer, params: { ...params, suggestionId: creativeSuggestionId } });
  assert.equal(creativeConfirm.statusCode, 200);
  const creativeArtifact = artifacts.at(-1);
  assert.ok(creativeArtifact);
  assert.equal(creativeArtifact.artifactKind, `campaign_ai_${creativeTask}`);
  assert.equal(creativeArtifact.visibilityScope, 'user_private');
}
assert.equal(artifacts.length, 3);
const creativeList = await handlers.list({ viewer, params, query: {} });
assert.equal(creativeList.statusCode, 200);
assert.deepEqual(
  (creativeList as unknown as { value: Array<{ task: CampaignArtifactTask }> }).value.map((item) => item.task),
  ['preparation_brief', 'worldbuilding_outline', 'adventure_seed'],
  'saved creative artifacts must pass the shared parser and remain readable',
);

const worldbuildingArtifact = artifacts.find((item) => item.artifactKind === 'campaign_ai_worldbuilding_outline');
assert.ok(worldbuildingArtifact);
assert.equal((await handlers.adopt({ viewer, params: { ...params, artifactId } })).statusCode, 404, 'factual artifacts cannot be adopted as creative campaign memory');
const adopted = await handlers.adopt({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } });
assert.equal(adopted.statusCode, 201);
assert.equal(memories.length, 1);
assert.equal(memories[0].visibilityScope, 'user_private');
assert.equal(memories[0].memoryScope, 'campaign');
assert.equal(memories[0].sourceArtifactId, worldbuildingArtifact.artifactId);
assert.equal((adopted as unknown as { value: { adoption: { status: string } } }).value.adoption.status, 'active');
assert.equal((await handlers.adopt({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } })).statusCode, 200, 'duplicate adoption must be idempotent');
assert.equal(memories.length, 1);
assert.equal((await handlers.archive({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } })).statusCode, 409, 'an active adopted memory must protect its source artifact');

nextTask = 'campaign_recap';
citationSourceId = `ai_memory:${memories[0].memoryEntryId}`;
const memoryGroundedDraft = await handlers.generate({ viewer, params, body: { task: 'campaign_recap', sourceFamilies: ['adopted_memories'] } });
assert.equal(memoryGroundedDraft.statusCode, 200);
assert.equal((memoryGroundedDraft as unknown as { value: { sources: Array<{ sourceKind: string }> } }).value.sources[0]?.sourceKind, 'adopted_memory');
const memoryGroundedSuggestionId = (memoryGroundedDraft as unknown as { value: { suggestionId: string } }).value.suggestionId;
assert.equal((await handlers.confirm({ viewer, params: { ...params, suggestionId: memoryGroundedSuggestionId } })).statusCode, 200);
const memoryGroundedArtifact = artifacts.at(-1);
assert.ok(memoryGroundedArtifact);
const memoryGroundedProjection = await handlers.list({ viewer, params, query: {} });
const projectedMemoryGroundedArtifact = (memoryGroundedProjection as unknown as { value: Array<{ artifactId: string; sources: Array<{ sourceKind: string }> }> }).value.find((item) => item.artifactId === memoryGroundedArtifact.artifactId);
assert.equal(projectedMemoryGroundedArtifact?.sources[0]?.sourceKind, 'adopted_memory', 'adopted-memory citations must survive durable projection');
assert.equal((await handlers.generate({ viewer, params, body: { task: 'campaign_recap', sourceFamilies: ['campaign_summary', 'actor_summaries', 'room_summaries', 'prior_artifacts', 'adopted_memories'] } })).statusCode, 200, 'all five bounded source families must remain selectable together');

const withdrawn = await handlers.withdrawAdoption({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } });
assert.equal(withdrawn.statusCode, 200);
assert.ok(memories[0].archivedAt);
assert.equal((withdrawn as unknown as { value: { adoption: { status: string } } }).value.adoption.status, 'archived');
assert.equal((await handlers.archive({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } })).statusCode, 200);
assert.equal((await handlers.adopt({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } })).statusCode, 404, 'archived artifacts cannot be adopted');
assert.equal((await handlers.restore({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } })).statusCode, 200);
assert.equal((await handlers.adopt({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } })).statusCode, 200, 're-adoption must restore the existing memory');
assert.equal(memories.length, 1);
assert.equal(memories[0].archivedAt, undefined);
assert.equal((await handlers.withdrawAdoption({ viewer, params: { ...params, artifactId: worldbuildingArtifact.artifactId } })).statusCode, 200);
assert.equal((await handlers.generate({ viewer, params, body: { task: 'campaign_recap', sourceFamilies: ['adopted_memories'] } })).statusCode, 400, 'withdrawn memories must not enter later AI context');

citationSourceId = 'campaign:campaign-1';

nextTask = 'adventure_seed';
const taskMismatch = await handlers.generate({ viewer, params, body: { task: 'worldbuilding_outline', sourceFamilies: ['campaign_summary'] } });
assert.equal(taskMismatch.statusCode, 503, 'a model response for a different creative task must fail closed');

nextTask = 'preparation_brief';
const staleDraft = await handlers.generate({ viewer, params, body: { task: 'preparation_brief', sourceFamilies: ['campaign_summary'] } });
campaign.updatedAt = '2026-08-14T02:00:00.000Z';
assert.equal((await handlers.confirm({ viewer, params: { ...params, suggestionId: (staleDraft as unknown as { value: { suggestionId: string } }).value.suggestionId } })).statusCode, 409);

invalidCitation = true;
const invalid = await handlers.generate({ viewer, params, body: { task: 'preparation_brief', sourceFamilies: ['campaign_summary'] } });
assert.equal(invalid.statusCode, 503);

const outsider = { ...viewer, viewerUserId: 'user-2' };
assert.notEqual((await handlers.status({ viewer: outsider, params })).statusCode, 200);
assert.equal((await handlers.adopt({ viewer: outsider, params: { ...params, artifactId: worldbuildingArtifact.artifactId } })).statusCode, 404);

console.log('campaign artifact assistant handler smoke passed');
