import { randomUUID } from 'node:crypto';
import type { AiModelGatewayStatus, DndCharacterAssistantGatewayResult } from '../../src/lib/ai/dndCharacterAssistantTypes.js';
import { parseDndCharacterAssistantSuggestion } from '../../src/lib/ai/dndCharacterAssistantTypes.js';
import type { AiModelCatalog, AiRoutingPreference } from '../../src/lib/ai/modelRoutingTypes.js';
import type { RoomSessionAssistantSuggestionResult } from '../../src/lib/ai/sessionAssistantTypes.js';
import { parseRoomSessionAssistantSuggestion } from '../../src/lib/ai/sessionAssistantTypes.js';
import type { CampaignArtifactSuggestionResult } from '../../src/lib/ai/campaignArtifactAssistantTypes.js';
import { parseCampaignArtifactSuggestion } from '../../src/lib/ai/campaignArtifactAssistantTypes.js';
import type { DndPersonalContentAssistantGatewayResult } from '../../src/lib/ai/dndPersonalContentAssistantTypes.js';
import { parseDndPersonalContentAssistantSuggestion } from '../../src/lib/ai/dndPersonalContentAssistantTypes.js';

export type StructuredModelRequest = {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
};

export type ModelProviderStatus = { reachable: boolean; modelAvailable: boolean };

export interface StructuredModelProvider {
  readonly id: 'ollama';
  readonly model: string;
  status(signal: AbortSignal): Promise<ModelProviderStatus>;
  generate(request: StructuredModelRequest, signal: AbortSignal): Promise<unknown>;
}

export type ModelGatewayFailureKind = 'not_configured' | 'route_unavailable' | 'model_unavailable' | 'unavailable' | 'timeout' | 'cancelled' | 'invalid_output' | 'provider_error';
export class ModelGatewayError extends Error {
  constructor(readonly kind: ModelGatewayFailureKind, message: string, readonly retryable: boolean) {
    super(message);
  }
}

export interface ModelGateway {
  catalog(signal?: AbortSignal, refresh?: boolean): Promise<AiModelCatalog>;
  status(signal?: AbortSignal, preference?: AiRoutingPreference): Promise<AiModelGatewayStatus>;
  generateDndCharacterSuggestion(input: StructuredModelRequest, signal?: AbortSignal, preference?: AiRoutingPreference): Promise<DndCharacterAssistantGatewayResult>;
  generateDndPersonalContentSuggestion?(input: StructuredModelRequest, signal?: AbortSignal, preference?: AiRoutingPreference): Promise<DndPersonalContentAssistantGatewayResult>;
  generateRoomSessionSuggestion(input: StructuredModelRequest, signal?: AbortSignal, preference?: AiRoutingPreference): Promise<Omit<RoomSessionAssistantSuggestionResult, 'expiresAt' | 'contextThroughSeq'>>;
  generateCampaignArtifactSuggestion(input: StructuredModelRequest, signal?: AbortSignal, preference?: AiRoutingPreference): Promise<Omit<CampaignArtifactSuggestionResult, 'expiresAt' | 'sources'>>;
}

function timedSignal(timeoutMs: number, external?: AbortSignal): { signal: AbortSignal; cleanup(): void; timedOut(): boolean } {
  const controller = new AbortController();
  let timeoutHit = false;
  const timer = setTimeout(() => { timeoutHit = true; controller.abort(); }, timeoutMs);
  const onAbort = () => controller.abort();
  external?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    timedOut: () => timeoutHit,
    cleanup: () => { clearTimeout(timer); external?.removeEventListener('abort', onAbort); },
  };
}

export function createModelGateway(input: { provider?: StructuredModelProvider; timeoutMs: number }): ModelGateway {
  const provider = input.provider;
  const capabilities: AiModelGatewayStatus['capabilities'] = ['structured-output', 'cancellation', 'timeout'];

  return {
    async catalog(external) {
      const status = await this.status(external);
      const readyModel = status.provider === 'ollama' && status.reachable && !status.reason ? status.model : undefined;
      return {
        local: {
          configured: status.configured,
          reachable: status.reachable,
          ...(status.model ? { defaultModel: status.model } : {}),
          ...(readyModel?.toLowerCase().startsWith('qwen3.6') ? { recommendedModel: readyModel } : {}),
          ...(!status.configured ? { reason: 'not-configured' as const } : !status.reachable ? { reason: 'provider-unreachable' as const } : !readyModel ? { reason: 'no-models-installed' as const } : {}),
        },
        cloud: { configured: false, reason: 'not-implemented' },
        models: readyModel ? [{
          id: readyModel,
          provider: 'ollama',
          route: 'local',
          installed: true,
          recommended: readyModel.toLowerCase().startsWith('qwen3.6'),
          capabilities,
        }] : [],
        refreshedAt: Date.now(),
      };
    },

    async status(external, preference = { mode: 'auto' }) {
      if (preference.mode === 'off') return { configured: false, reachable: false, provider: 'disabled', route: 'off', capabilities, reason: 'user-disabled' };
      if (preference.mode === 'cloud') return { configured: false, reachable: false, provider: 'disabled', route: 'cloud', capabilities, reason: 'route-unavailable' };
      if (!provider) return { configured: false, reachable: false, provider: 'disabled', route: 'local', capabilities, reason: 'not-configured' };
      const scope = timedSignal(Math.min(input.timeoutMs, 5_000), external);
      try {
        const result = await provider.status(scope.signal);
        return {
          configured: true,
          reachable: result.reachable,
          provider: provider.id,
          route: 'local',
          model: provider.model,
          capabilities,
          ...(!result.reachable ? { reason: 'provider-unreachable' as const } : !result.modelAvailable ? { reason: 'model-unavailable' as const } : {}),
        };
      } catch {
        return { configured: true, reachable: false, provider: provider.id, route: 'local', model: provider.model, capabilities, reason: 'provider-unreachable' };
      } finally {
        scope.cleanup();
      }
    },

    async generateDndCharacterSuggestion(request, external, preference = { mode: 'auto' }) {
      if (preference.mode === 'off') throw new ModelGatewayError('not_configured', 'AI is disabled on this device.', false);
      if (preference.mode === 'cloud') throw new ModelGatewayError('route_unavailable', 'Cloud AI is not available.', false);
      if (!provider) throw new ModelGatewayError('not_configured', 'Local model provider is not configured.', false);
      const scope = timedSignal(input.timeoutMs, external);
      try {
        const value = await provider.generate(request, scope.signal);
        const suggestion = parseDndCharacterAssistantSuggestion(value);
        if (!suggestion) throw new ModelGatewayError('invalid_output', 'Model output did not match the character-assistant schema.', true);
        return {
          suggestionId: `ai_suggestion_${randomUUID()}`,
          provider: provider.id,
          route: 'local',
          model: provider.model,
          createdAt: Date.now(),
          suggestion,
        };
      } catch (error) {
        if (error instanceof ModelGatewayError) throw error;
        if (scope.timedOut()) throw new ModelGatewayError('timeout', 'Local model request timed out.', true);
        if (external?.aborted) throw new ModelGatewayError('cancelled', 'Local model request was cancelled.', false);
        throw new ModelGatewayError('provider_error', 'Local model provider request failed.', true);
      } finally {
        scope.cleanup();
      }
    },

    async generateDndPersonalContentSuggestion(request, external, preference = { mode: 'auto' }) {
      if (preference.mode === 'off') throw new ModelGatewayError('not_configured', 'AI is disabled on this device.', false);
      if (preference.mode === 'cloud') throw new ModelGatewayError('route_unavailable', 'Cloud AI is not available.', false);
      if (!provider) throw new ModelGatewayError('not_configured', 'Local model provider is not configured.', false);
      const scope = timedSignal(input.timeoutMs, external);
      try {
        const value = await provider.generate(request, scope.signal);
        const suggestion = parseDndPersonalContentAssistantSuggestion(value);
        if (!suggestion) throw new ModelGatewayError('invalid_output', 'Model output did not match the personal-content schema.', true);
        return {
          suggestionId: `ai_content_${randomUUID()}`,
          provider: provider.id,
          route: 'local',
          model: provider.model,
          createdAt: Date.now(),
          suggestion,
        };
      } catch (error) {
        if (error instanceof ModelGatewayError) throw error;
        if (scope.timedOut()) throw new ModelGatewayError('timeout', 'Local model request timed out.', true);
        if (external?.aborted) throw new ModelGatewayError('cancelled', 'Local model request was cancelled.', false);
        throw new ModelGatewayError('provider_error', 'Local model provider request failed.', true);
      } finally {
        scope.cleanup();
      }
    },

    async generateRoomSessionSuggestion(request, external, preference = { mode: 'auto' }) {
      if (preference.mode === 'off') throw new ModelGatewayError('not_configured', 'AI is disabled on this device.', false);
      if (preference.mode === 'cloud') throw new ModelGatewayError('route_unavailable', 'Cloud AI is not available.', false);
      if (!provider) throw new ModelGatewayError('not_configured', 'Local model provider is not configured.', false);
      const scope = timedSignal(input.timeoutMs, external);
      try {
        const value = await provider.generate(request, scope.signal);
        const suggestion = parseRoomSessionAssistantSuggestion(value);
        if (!suggestion) throw new ModelGatewayError('invalid_output', 'Model output did not match the room-session schema.', true);
        return {
          suggestionId: `ai_session_${randomUUID()}`,
          task: suggestion.task,
          provider: provider.id,
          route: 'local',
          model: provider.model,
          createdAt: Date.now(),
          suggestion,
        };
      } catch (error) {
        if (error instanceof ModelGatewayError) throw error;
        if (scope.timedOut()) throw new ModelGatewayError('timeout', 'Local model request timed out.', true);
        if (external?.aborted) throw new ModelGatewayError('cancelled', 'Local model request was cancelled.', false);
        throw new ModelGatewayError('provider_error', 'Local model provider request failed.', true);
      } finally {
        scope.cleanup();
      }
    },

    async generateCampaignArtifactSuggestion(request, external, preference = { mode: 'auto' }) {
      if (preference.mode === 'off') throw new ModelGatewayError('not_configured', 'AI is disabled on this device.', false);
      if (preference.mode === 'cloud') throw new ModelGatewayError('route_unavailable', 'Cloud AI is not available.', false);
      if (!provider) throw new ModelGatewayError('not_configured', 'Local model provider is not configured.', false);
      const scope = timedSignal(input.timeoutMs, external);
      try {
        const value = await provider.generate(request, scope.signal);
        const suggestion = parseCampaignArtifactSuggestion(value);
        if (!suggestion) throw new ModelGatewayError('invalid_output', 'Model output did not match the campaign-artifact schema.', true);
        return {
          suggestionId: `ai_campaign_${randomUUID()}`,
          task: suggestion.task,
          provider: provider.id,
          route: 'local',
          model: provider.model,
          createdAt: Date.now(),
          suggestion,
        };
      } catch (error) {
        if (error instanceof ModelGatewayError) throw error;
        if (scope.timedOut()) throw new ModelGatewayError('timeout', 'Local model request timed out.', true);
        if (external?.aborted) throw new ModelGatewayError('cancelled', 'Local model request was cancelled.', false);
        throw new ModelGatewayError('provider_error', 'Local model provider request failed.', true);
      } finally {
        scope.cleanup();
      }
    },
  };
}
