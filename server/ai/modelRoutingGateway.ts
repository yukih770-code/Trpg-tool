import type { AiModelGatewayStatus } from '../../src/lib/ai/dndCharacterAssistantTypes.js';
import type {
  AiLocalModelDescriptor,
  AiModelCatalog,
  AiModelCapability,
  AiRoutingPreference,
} from '../../src/lib/ai/modelRoutingTypes.js';
import type { LocalModelGatewayConfig } from '../config/modelGatewayConfig.js';
import { createLocalOllamaProvider } from './localOllamaProvider.js';
import { createModelGateway, ModelGatewayError, type ModelGateway, type StructuredModelRequest } from './modelGateway.js';

type Fetcher = typeof fetch;
type InventoryModel = { id: string; sizeBytes?: number };
type InventorySnapshot = { reachable: boolean; models: InventoryModel[]; refreshedAt: number };

const CAPABILITIES: AiModelCapability[] = ['structured-output', 'cancellation', 'timeout'];

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function modelName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const name = value.trim();
  return name && name.length <= 160 && /^[\w.+:@/-]+$/u.test(name) ? name : undefined;
}

function isRecommendedModel(id: string): boolean {
  return /^qwen3\.6(?::|$)/iu.test(id);
}

function sortedModels(models: InventoryModel[]): InventoryModel[] {
  return [...models].sort((left, right) => Number(isRecommendedModel(right.id)) - Number(isRecommendedModel(left.id)) || left.id.localeCompare(right.id));
}

function timedSignal(timeoutMs: number, external?: AbortSignal): { signal: AbortSignal; cleanup(): void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  external?.addEventListener('abort', onAbort, { once: true });
  return { signal: controller.signal, cleanup: () => { clearTimeout(timer); external?.removeEventListener('abort', onAbort); } };
}

export function createRoutedLocalModelGateway(input: {
  config: LocalModelGatewayConfig;
  fetcher?: Fetcher;
  now?: () => number;
  inventoryTtlMs?: number;
}): ModelGateway {
  const fetcher = input.fetcher ?? fetch;
  const now = input.now ?? Date.now;
  const inventoryTtlMs = Math.max(1_000, Math.min(input.inventoryTtlMs ?? 15_000, 60_000));
  let cached: InventorySnapshot | undefined;

  async function inventory(external?: AbortSignal, refresh = false): Promise<InventorySnapshot> {
    if (!input.config.configured || !input.config.baseUrl) return { reachable: false, models: [], refreshedAt: now() };
    if (!refresh && cached && now() - cached.refreshedAt < inventoryTtlMs) return cached;
    const scope = timedSignal(Math.min(input.config.timeoutMs, 5_000), external);
    try {
      const response = await fetcher(`${input.config.baseUrl}/api/tags`, { signal: scope.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`provider_http_${response.status}`);
      const source = record(await response.json());
      const raw = Array.isArray(source?.models) ? source.models.slice(0, 200) : [];
      const allowed = input.config.allowedModels ? new Set(input.config.allowedModels) : undefined;
      const byId = new Map<string, InventoryModel>();
      for (const item of raw) {
        const model = record(item);
        const id = modelName(model?.name) ?? modelName(model?.model);
        if (!id || allowed && !allowed.has(id)) continue;
        const sizeBytes = typeof model?.size === 'number' && Number.isSafeInteger(model.size) && model.size >= 0 ? model.size : undefined;
        byId.set(id, { id, ...(sizeBytes !== undefined ? { sizeBytes } : {}) });
      }
      cached = { reachable: true, models: sortedModels([...byId.values()]), refreshedAt: now() };
      return cached;
    } catch {
      cached = { reachable: false, models: [], refreshedAt: now() };
      return cached;
    } finally {
      scope.cleanup();
    }
  }

  function recommended(models: InventoryModel[]): string | undefined {
    return models.find((model) => isRecommendedModel(model.id))?.id;
  }

  function configuredDefault(models: InventoryModel[]): string | undefined {
    return input.config.model && models.some((model) => model.id === input.config.model) ? input.config.model : undefined;
  }

  function descriptors(models: InventoryModel[]): AiLocalModelDescriptor[] {
    const recommendedId = recommended(models);
    return models.map((model) => ({
      id: model.id,
      provider: 'ollama',
      route: 'local',
      installed: true,
      recommended: model.id === recommendedId,
      ...(model.sizeBytes !== undefined ? { sizeBytes: model.sizeBytes } : {}),
      capabilities: CAPABILITIES,
    }));
  }

  async function catalog(external?: AbortSignal, refresh = false): Promise<AiModelCatalog> {
    if (!input.config.configured) return {
      local: { configured: false, reachable: false, reason: 'not-configured' },
      cloud: { configured: false, reason: 'not-implemented' },
      models: [],
      refreshedAt: now(),
    };
    const snapshot = await inventory(external, refresh);
    const recommendedModel = recommended(snapshot.models);
    const defaultModel = configuredDefault(snapshot.models);
    return {
      local: {
        configured: true,
        reachable: snapshot.reachable,
        ...(defaultModel ? { defaultModel } : {}),
        ...(recommendedModel ? { recommendedModel } : {}),
        ...(!snapshot.reachable ? { reason: 'provider-unreachable' as const } : snapshot.models.length === 0 ? { reason: 'no-models-installed' as const } : {}),
      },
      cloud: { configured: false, reason: 'not-implemented' },
      models: descriptors(snapshot.models),
      refreshedAt: snapshot.refreshedAt,
    };
  }

  async function resolve(preference: AiRoutingPreference | undefined, external?: AbortSignal): Promise<string> {
    const selected = preference ?? { mode: 'auto' as const };
    if (selected.mode === 'off') throw new ModelGatewayError('not_configured', 'AI is disabled on this device.', false);
    if (selected.mode === 'cloud') throw new ModelGatewayError('route_unavailable', 'Cloud AI is not available.', false);
    const snapshot = await inventory(external);
    if (external?.aborted) throw new ModelGatewayError('cancelled', 'AI model routing was cancelled.', false);
    if (!snapshot.reachable) throw new ModelGatewayError('unavailable', 'Local model provider is unreachable.', true);
    if (snapshot.models.length === 0) throw new ModelGatewayError('model_unavailable', 'No allowed local model is installed.', false);
    if (selected.mode === 'local') {
      if (!selected.localModel || !snapshot.models.some((model) => model.id === selected.localModel)) {
        throw new ModelGatewayError('model_unavailable', 'The selected local model is not installed or allowed.', false);
      }
      return selected.localModel;
    }
    return recommended(snapshot.models) ?? configuredDefault(snapshot.models) ?? snapshot.models[0].id;
  }

  function executor(model: string): ModelGateway {
    return createModelGateway({
      provider: createLocalOllamaProvider({ baseUrl: input.config.baseUrl!, model, fetcher }),
      timeoutMs: input.config.timeoutMs,
    });
  }

  return {
    catalog,
    async status(external, preference = { mode: 'auto' }) {
      if (preference.mode === 'off') return { configured: false, reachable: false, provider: 'disabled', route: 'off', capabilities: CAPABILITIES, reason: 'user-disabled' };
      if (preference.mode === 'cloud') return { configured: false, reachable: false, provider: 'disabled', route: 'cloud', capabilities: CAPABILITIES, reason: 'route-unavailable' };
      try {
        const model = await resolve(preference, external);
        return { configured: true, reachable: true, provider: 'ollama', route: 'local', model, capabilities: CAPABILITIES } satisfies AiModelGatewayStatus;
      } catch (error) {
        const kind = error instanceof ModelGatewayError ? error.kind : 'unavailable';
        return {
          configured: input.config.configured,
          reachable: false,
          provider: input.config.configured ? 'ollama' : 'disabled',
          route: 'local',
          capabilities: CAPABILITIES,
          reason: kind === 'not_configured' ? 'not-configured' : kind === 'model_unavailable' ? 'model-unavailable' : 'provider-unreachable',
        };
      }
    },
    async generateDndCharacterSuggestion(request: StructuredModelRequest, external, preference) {
      const model = await resolve(preference, external);
      return executor(model).generateDndCharacterSuggestion(request, external, { mode: 'local', localModel: model });
    },
    async generateRoomSessionSuggestion(request: StructuredModelRequest, external, preference) {
      const model = await resolve(preference, external);
      return executor(model).generateRoomSessionSuggestion(request, external, { mode: 'local', localModel: model });
    },
    async generateCampaignArtifactSuggestion(request: StructuredModelRequest, external, preference) {
      const model = await resolve(preference, external);
      return executor(model).generateCampaignArtifactSuggestion(request, external, { mode: 'local', localModel: model });
    },
  };
}
