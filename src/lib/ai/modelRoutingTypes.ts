export const AI_ROUTE_MODE_HEADER = 'x-trpg-ai-mode';
export const AI_LOCAL_MODEL_HEADER = 'x-trpg-ai-model';

export type AiRouteMode = 'off' | 'auto' | 'local' | 'cloud';

export type AiRoutingPreference = {
  mode: AiRouteMode;
  localModel?: string;
};

export type AiModelCapability = 'structured-output' | 'cancellation' | 'timeout';

export type AiLocalModelDescriptor = {
  id: string;
  provider: 'ollama';
  route: 'local';
  installed: true;
  recommended: boolean;
  sizeBytes?: number;
  capabilities: AiModelCapability[];
};

export type AiModelCatalog = {
  local: {
    configured: boolean;
    reachable: boolean;
    defaultModel?: string;
    recommendedModel?: string;
    reason?: 'not-configured' | 'provider-unreachable' | 'no-models-installed';
  };
  cloud: {
    configured: false;
    reason: 'not-implemented';
  };
  models: AiLocalModelDescriptor[];
  refreshedAt: number;
};

function boundedModelId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const model = value.trim();
  return model && model.length <= 160 && /^[\w.+:@/-]+$/u.test(model) ? model : undefined;
}

export function parseAiRoutingPreference(value: unknown): AiRoutingPreference {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { mode: 'auto' };
  const source = value as Record<string, unknown>;
  const mode: AiRouteMode = source.mode === 'off' || source.mode === 'local' || source.mode === 'cloud'
    ? source.mode
    : 'auto';
  const localModel = boundedModelId(source.localModel);
  return { mode, ...(localModel ? { localModel } : {}) };
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAiRoutingPreferenceHeaders(
  headers: Record<string, string | string[] | undefined> | undefined,
): AiRoutingPreference {
  if (!headers) return { mode: 'auto' };
  const mode = firstHeader(headers[AI_ROUTE_MODE_HEADER]);
  const localModel = firstHeader(headers[AI_LOCAL_MODEL_HEADER]);
  return parseAiRoutingPreference({ mode, localModel });
}

export function aiRoutingPreferenceHeaders(preference: AiRoutingPreference): Record<string, string> {
  const parsed = parseAiRoutingPreference(preference);
  return {
    [AI_ROUTE_MODE_HEADER]: parsed.mode,
    ...(parsed.localModel ? { [AI_LOCAL_MODEL_HEADER]: parsed.localModel } : {}),
  };
}
