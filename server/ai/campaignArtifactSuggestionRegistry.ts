import type { CampaignArtifactSource, CampaignArtifactSourceFamily, CampaignArtifactSuggestionResult } from '../../src/lib/ai/campaignArtifactAssistantTypes.js';

export type StoredCampaignArtifactSuggestion = CampaignArtifactSuggestionResult & {
  viewerUserId: string;
  worldServerId: string;
  campaignId: string;
  sourceFamilies: CampaignArtifactSourceFamily[];
  contextFingerprint: string;
  contextAudit: Record<string, unknown>;
  sources: CampaignArtifactSource[];
};

export interface CampaignArtifactSuggestionRegistry {
  put(value: StoredCampaignArtifactSuggestion): void;
  get(input: { suggestionId: string; viewerUserId: string; worldServerId: string; campaignId: string }):
    | { decision: 'ready'; value: StoredCampaignArtifactSuggestion }
    | { decision: 'missing' | 'expired' | 'forbidden' };
  consume(suggestionId: string): void;
}

export function createCampaignArtifactSuggestionRegistry(input: { now?: () => number; maxEntries?: number } = {}): CampaignArtifactSuggestionRegistry {
  const now = input.now ?? Date.now;
  const maxEntries = Math.max(10, Math.min(input.maxEntries ?? 500, 5_000));
  const values = new Map<string, StoredCampaignArtifactSuggestion>();
  function prune(): void {
    for (const [id, value] of values) if (value.expiresAt <= now()) values.delete(id);
    while (values.size >= maxEntries) values.delete(values.keys().next().value as string);
  }
  return {
    put(value) { prune(); values.set(value.suggestionId, value); },
    get(input) {
      const value = values.get(input.suggestionId);
      if (!value) return { decision: 'missing' };
      if (value.expiresAt <= now()) { values.delete(input.suggestionId); return { decision: 'expired' }; }
      if (value.viewerUserId !== input.viewerUserId || value.worldServerId !== input.worldServerId || value.campaignId !== input.campaignId) return { decision: 'forbidden' };
      return { decision: 'ready', value };
    },
    consume(suggestionId) { values.delete(suggestionId); },
  };
}
