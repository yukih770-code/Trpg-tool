import type { AiModelCatalog } from './modelRoutingTypes';

export type AiSettingsAvailability = 'loading' | 'error' | 'not-configured' | 'unreachable' | 'empty' | 'ready';

export function resolveAiSettingsAvailability(input: {
  loading: boolean;
  error: string;
  catalog: AiModelCatalog | null;
}): AiSettingsAvailability {
  if (input.loading) return 'loading';
  if (input.error) return 'error';
  if (!input.catalog?.local.configured) return 'not-configured';
  if (!input.catalog.local.reachable) return 'unreachable';
  if (input.catalog.models.length === 0) return 'empty';
  return 'ready';
}
