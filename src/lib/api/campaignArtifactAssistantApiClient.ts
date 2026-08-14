import { createApiClient, type ApiClientOptions } from './apiClient';
import type { AiModelGatewayStatus } from '../ai/dndCharacterAssistantTypes';
import { currentAiRoutingHeaders } from '../ai/modelRoutingPreference';
import type { CampaignArtifactSourceFamily, CampaignArtifactSuggestionResult, CampaignArtifactTask, SavedCampaignArtifact } from '../ai/campaignArtifactAssistantTypes';

export interface CampaignArtifactAssistantApiClient {
  status(worldServerId: string, campaignId: string, signal?: AbortSignal): Promise<AiModelGatewayStatus>;
  list(worldServerId: string, campaignId: string, includeArchived?: boolean, signal?: AbortSignal): Promise<SavedCampaignArtifact[]>;
  generate(worldServerId: string, campaignId: string, input: { task: CampaignArtifactTask; focus?: string; sourceFamilies: CampaignArtifactSourceFamily[] }, signal?: AbortSignal): Promise<CampaignArtifactSuggestionResult>;
  confirm(worldServerId: string, campaignId: string, suggestionId: string): Promise<SavedCampaignArtifact>;
  archive(worldServerId: string, campaignId: string, artifactId: string): Promise<SavedCampaignArtifact>;
  restore(worldServerId: string, campaignId: string, artifactId: string): Promise<SavedCampaignArtifact>;
}

function segment(value: string): string { return encodeURIComponent(value); }

export function createCampaignArtifactAssistantApiClient(options: ApiClientOptions = {}): CampaignArtifactAssistantApiClient {
  const client = createApiClient(options);
  const root = (worldServerId: string, campaignId: string) => `/api/ai/world-servers/${segment(worldServerId)}/campaigns/${segment(campaignId)}/artifacts`;
  return {
    status: (worldServerId, campaignId, signal) => client.request(`${root(worldServerId, campaignId)}/status`, { signal, headers: currentAiRoutingHeaders() }),
    list: (worldServerId, campaignId, includeArchived = false, signal) => client.request(`${root(worldServerId, campaignId)}?includeArchived=${includeArchived}`, { signal }),
    generate: (worldServerId, campaignId, input, signal) => client.request(`${root(worldServerId, campaignId)}/suggestions`, { method: 'POST', signal, headers: currentAiRoutingHeaders(), body: JSON.stringify(input) }),
    confirm: (worldServerId, campaignId, suggestionId) => client.request(`${root(worldServerId, campaignId)}/suggestions/${segment(suggestionId)}/confirm`, { method: 'POST' }),
    archive: (worldServerId, campaignId, artifactId) => client.request(`${root(worldServerId, campaignId)}/${segment(artifactId)}/archive`, { method: 'POST' }),
    restore: (worldServerId, campaignId, artifactId) => client.request(`${root(worldServerId, campaignId)}/${segment(artifactId)}/restore`, { method: 'POST' }),
  };
}

export const campaignArtifactAssistantApiClient = createCampaignArtifactAssistantApiClient();
