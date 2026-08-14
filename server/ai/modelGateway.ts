import { randomUUID } from 'node:crypto';
import type { AiModelGatewayStatus, DndCharacterAssistantGatewayResult } from '../../src/lib/ai/dndCharacterAssistantTypes.js';
import { parseDndCharacterAssistantSuggestion } from '../../src/lib/ai/dndCharacterAssistantTypes.js';

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

export type ModelGatewayFailureKind = 'not_configured' | 'unavailable' | 'timeout' | 'cancelled' | 'invalid_output' | 'provider_error';
export class ModelGatewayError extends Error {
  constructor(readonly kind: ModelGatewayFailureKind, message: string, readonly retryable: boolean) {
    super(message);
  }
}

export interface ModelGateway {
  status(signal?: AbortSignal): Promise<AiModelGatewayStatus>;
  generateDndCharacterSuggestion(input: StructuredModelRequest, signal?: AbortSignal): Promise<DndCharacterAssistantGatewayResult>;
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
    async status(external) {
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

    async generateDndCharacterSuggestion(request, external) {
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
  };
}
