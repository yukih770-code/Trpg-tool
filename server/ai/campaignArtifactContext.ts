import { createHash } from 'node:crypto';
import type { AiMemoryEntryRecord, GeneratedArtifactRecord } from '../adapters/postgresGeneratedArtifactRepository.js';
import type { PostgresCampaignRecord } from '../adapters/postgresCampaignRepository.js';
import type { CampaignActorInstanceRecord, RoomRecord } from '../adapters/postgresPlatformFoundationRepository.js';
import type { WorldServerMembershipRecord, WorldServerRecord } from '../adapters/postgresWorldServerRepository.js';
import { buildAiContextPack } from '../policy/aiContextPackBuilder.js';
import { buildAiContextRetrievalPreflight, normalizeAiContextCandidateMetadata } from '../policy/aiContextRetrievalPreflight.js';
import type { PermissionWorldServerContext } from '../policy/aiContextScopeGuard.js';
import type { CampaignArtifactSource, CampaignArtifactSourceFamily } from '../../src/lib/ai/campaignArtifactAssistantTypes.js';

export type CampaignArtifactContextResult =
  | { decision: 'ready'; sources: CampaignArtifactSource[]; fingerprint: string; audit: Record<string, unknown> }
  | { decision: 'denied' | 'empty'; reason: string };

function roleKind(roleKey: string): 'owner' | 'admin' | 'moderator' | 'member' | 'guest' | 'custom' {
  if (roleKey === 'owner') return 'owner';
  if (roleKey === 'admin' || roleKey === 'administrator') return 'admin';
  if (roleKey === 'moderator' || roleKey === 'mod') return 'moderator';
  if (roleKey === 'guest') return 'guest';
  if (roleKey === 'member') return 'member';
  return 'custom';
}

function worldContext(server: WorldServerRecord, membership: WorldServerMembershipRecord | null): PermissionWorldServerContext {
  return {
    worldServerId: server.worldServerId,
    ownerUserId: server.ownerId,
    membership: membership ? {
      userId: membership.userId,
      membershipStatus: membership.membershipStatus as 'active' | 'pending' | 'suspended' | 'left' | 'removed',
      roleKey: membership.roleKey,
      roleKind: roleKind(membership.roleKey),
      permissionsPayload: membership.payload,
    } : null,
  };
}

function oneLine(value: string | undefined, max: number): string {
  const compact = (value ?? '').replace(/\s+/gu, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}

function priorSuggestionSummary(record: GeneratedArtifactRecord): string {
  const suggestion = record.payload.suggestion;
  if (suggestion && typeof suggestion === 'object' && !Array.isArray(suggestion)) {
    const summary = (suggestion as Record<string, unknown>).summary;
    if (typeof summary === 'string') return oneLine(summary, 700);
  }
  return oneLine(record.summary, 700);
}

export function campaignArtifactSourceFingerprint(sources: CampaignArtifactSource[]): string {
  return createHash('sha256').update(JSON.stringify(sources.map(({ sourceId, sourceKind, sourceRefId, title, excerpt, updatedAt }) => ({ sourceId, sourceKind, sourceRefId, title, excerpt, updatedAt: updatedAt ?? null })))).digest('hex');
}

export function buildCampaignArtifactContext(input: {
  viewerUserId: string;
  server: WorldServerRecord;
  membership: WorldServerMembershipRecord | null;
  campaign: PostgresCampaignRecord;
  actors: CampaignActorInstanceRecord[];
  rooms: RoomRecord[];
  priorArtifacts: GeneratedArtifactRecord[];
  adoptedMemories: AiMemoryEntryRecord[];
  adoptedSessionReferences: AiMemoryEntryRecord[];
  sourceFamilies: CampaignArtifactSourceFamily[];
}): CampaignArtifactContextResult {
  const selected = new Set(input.sourceFamilies);
  if (selected.size === 0) return { decision: 'empty', reason: 'At least one source family is required.' };
  const actor = { viewerUserId: input.viewerUserId, isAuthenticated: true };
  const requestScope = { purpose: 'campaign_recap' as const, worldServerId: input.server.worldServerId, campaignId: input.campaign.campaignId, allowPublicFallback: false };
  const requestedKinds = new Set<string>();
  if (selected.has('campaign_summary') || selected.has('actor_summaries') || selected.has('room_summaries')) requestedKinds.add('campaign');
  if (selected.has('prior_artifacts')) requestedKinds.add('generated_artifact');
  if (selected.has('adopted_memories') || selected.has('adopted_session_references')) requestedKinds.add('ai_memory');
  const preflight = buildAiContextRetrievalPreflight({ actor, requestScope, sources: [...requestedKinds].map((sourceKind) => ({ sourceKind, requestedBodyAccess: true, requestedLimit: 50 })) });
  if (preflight.deniedCount > 0) return { decision: 'denied', reason: 'One or more selected source families failed AI retrieval preflight.' };

  const candidates = [];
  if (selected.has('campaign_summary')) candidates.push(normalizeAiContextCandidateMetadata({
    sourceKind: 'campaign', contextItemId: `campaign:${input.campaign.campaignId}`, contentKind: 'campaign', contentId: input.campaign.campaignId,
    title: input.campaign.title, body: `战役：${oneLine(input.campaign.title, 160)}\n简介：${oneLine(input.campaign.description, 900) || '未填写'}\n系统：${oneLine(input.campaign.systemId, 120)}\n状态：${oneLine(input.campaign.status, 80)}`,
    ownerUserId: input.campaign.ownerId, worldServerId: input.server.worldServerId, campaignId: input.campaign.campaignId,
    visibilityScope: 'campaign', aiScope: 'campaign_only', lifecycleStatus: input.campaign.lifecycleStatus,
    metadata: { sourceKind: 'campaign_summary', sourceRefId: input.campaign.campaignId, updatedAt: input.campaign.updatedAt },
  }));
  if (selected.has('actor_summaries')) input.actors.slice(0, 20).forEach((actorRecord) => candidates.push(normalizeAiContextCandidateMetadata({
    sourceKind: 'campaign', contextItemId: `campaign_actor:${actorRecord.campaignActorInstanceId}`, contentKind: 'campaign_actor_instance', contentId: actorRecord.campaignActorInstanceId,
    title: actorRecord.displayName, body: `角色：${oneLine(actorRecord.displayName, 160)}\n类型：${oneLine(actorRecord.actorKind, 80)}\n状态：${oneLine(actorRecord.instanceStatus, 80)}`,
    ownerUserId: actorRecord.ownerId ?? input.campaign.ownerId, worldServerId: input.server.worldServerId, campaignId: input.campaign.campaignId,
    visibilityScope: 'campaign', aiScope: 'campaign_only', lifecycleStatus: actorRecord.archivedAt ? 'archived' : 'active',
    metadata: { sourceKind: 'campaign_actor_summary', sourceRefId: actorRecord.campaignActorInstanceId, updatedAt: actorRecord.updatedAt },
  })));
  if (selected.has('room_summaries')) input.rooms.filter((room) => !room.closedAt && room.roomStatus !== 'closed' && room.roomStatus !== 'archived').slice(0, 20).forEach((room, index) => candidates.push(normalizeAiContextCandidateMetadata({
    sourceKind: 'campaign', contextItemId: `campaign_room:${room.roomRecordId}`, contentKind: 'room', contentId: room.roomRecordId,
    title: `房间 ${index + 1}`, body: `房间 ${index + 1}\n状态：${oneLine(room.roomStatus, 80)}\n多人模式：${oneLine(room.multiplayerMode, 80)}`,
    ownerUserId: room.hostUserId ?? input.campaign.ownerId, worldServerId: input.server.worldServerId, campaignId: input.campaign.campaignId,
    visibilityScope: 'campaign', aiScope: 'campaign_only', lifecycleStatus: room.closedAt ? 'archived' : 'active',
    metadata: { sourceKind: 'campaign_room_summary', sourceRefId: room.roomRecordId, updatedAt: room.updatedAt },
  })));
  if (selected.has('prior_artifacts')) input.priorArtifacts.slice(0, 10).forEach((artifact) => candidates.push(normalizeAiContextCandidateMetadata({
    sourceKind: 'generated_artifact', contextItemId: `generated_artifact:${artifact.artifactId}`, contentKind: 'generated_artifact', contentId: artifact.artifactId,
    title: artifact.title, body: `既有成果：${oneLine(artifact.title, 160)}\n摘要：${priorSuggestionSummary(artifact) || '未填写'}`,
    ownerUserId: artifact.ownerId, worldServerId: input.server.worldServerId, campaignId: input.campaign.campaignId,
    visibilityScope: 'user_private', aiScope: 'private_only', lifecycleStatus: artifact.archivedAt ? 'archived' : 'active',
    metadata: { sourceKind: 'prior_artifact', sourceRefId: artifact.artifactId, updatedAt: artifact.updatedAt },
  })));
  if (selected.has('adopted_memories')) input.adoptedMemories.slice(0, 10).forEach((memory) => candidates.push(normalizeAiContextCandidateMetadata({
    sourceKind: 'ai_memory', contextItemId: `ai_memory:${memory.memoryEntryId}`, contentKind: 'ai_memory', contentId: memory.memoryEntryId,
    title: memory.title ?? '已采用的战役方向', body: `主持人已采用的 AI 战役方向（仅供后续私有 AI 协助，不代表已公开或发布）：\n${memory.contentText.slice(0, 6_000)}`,
    ownerUserId: memory.ownerId, worldServerId: input.server.worldServerId, campaignId: input.campaign.campaignId,
    visibilityScope: 'user_private', aiScope: 'private_only', lifecycleStatus: memory.archivedAt ? 'archived' : 'active', reviewStatus: 'adopted',
    metadata: { sourceKind: 'adopted_memory', sourceRefId: memory.memoryEntryId, updatedAt: memory.updatedAt },
  })));
  if (selected.has('adopted_session_references')) input.adoptedSessionReferences.slice(0, 10).forEach((memory) => candidates.push(normalizeAiContextCandidateMetadata({
    sourceKind: 'ai_memory', contextItemId: `ai_memory:${memory.memoryEntryId}`, contentKind: 'ai_memory', contentId: memory.memoryEntryId,
    title: memory.title ?? '已采用的会后参考', body: `主持人显式采用的会后叙事参考（仅供本次私有 AI 协助；不是角色卡、任务状态、公开信息或战役既定事实，必须保留其中的不确定项）：\n${memory.contentText.slice(0, 6_000)}`,
    ownerUserId: memory.ownerId, worldServerId: input.server.worldServerId, campaignId: input.campaign.campaignId,
    visibilityScope: 'user_private', aiScope: 'private_only', lifecycleStatus: memory.archivedAt ? 'archived' : 'active', reviewStatus: 'adopted',
    metadata: { sourceKind: 'adopted_session_reference', sourceRefId: memory.memoryEntryId, updatedAt: memory.updatedAt },
  })));

  const pack = buildAiContextPack({ actor, requestScope, worldServer: worldContext(input.server, input.membership), candidates, maxItems: 50 });
  if (pack.status === 'empty') return { decision: 'empty', reason: 'No selected campaign sources are available.' };
  if (pack.status !== 'ready') return { decision: 'denied', reason: 'One or more selected campaign sources were denied or truncated.' };
  const sources: CampaignArtifactSource[] = pack.items.map((item) => ({
    sourceId: item.contextItemId,
    sourceKind: item.metadata?.sourceKind as CampaignArtifactSource['sourceKind'],
    sourceRefId: String(item.metadata?.sourceRefId ?? item.contentId),
    title: item.title ?? '未命名来源',
    excerpt: item.body ?? item.summary ?? '',
    ...(typeof item.metadata?.updatedAt === 'string' ? { updatedAt: item.metadata.updatedAt } : {}),
  }));
  return { decision: 'ready', sources, fingerprint: campaignArtifactSourceFingerprint(sources), audit: pack.auditRecord as unknown as Record<string, unknown> };
}
